import type { Response } from "express";
import { prisma } from "../../lib/prisma";
import { AIService } from "./ai.service";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { extractFileContent } from "../utils/fileExtractor";

const aiService = new AIService();


export class MessageService {
  private readonly SKIP_EVENTS = new Set([
    "start", "end", "metadata",
    "agentReasoning", "sourceDocuments", "usedTools",
    "fileAnnotations", "artifact",
  ]);
  private extractText(parsed: any): string {
    const eventType = parsed.event ?? parsed.type ?? "";
    if (eventType && this.SKIP_EVENTS.has(eventType)) return "";
    if (parsed.event === "token" || parsed.type === "token") {
      return typeof parsed.data === "string" ? parsed.data : "";
    }
    if (typeof parsed.token === "string") return parsed.token;
    if (typeof parsed.text === "string") return parsed.text;
    if (typeof parsed.data === "string") return parsed.data;
    return "";
  }

  public async sendPrompt(
    convId: number,
    content: string,
    model: string,
    res: Response,
    userId: number,
    files?: { data: string; fileName: string; mimeType: string }[]
  ): Promise<void> {
    
    let dbFileUrl: string | null = null;
    let dbFileName: string | null = null;
    let dbFileType: string | null = null;
    let currentFileContent: string | null = null; // Variable to hold the extracted file content
    const primaryFile = files && files.length > 0 ? files[0] : null;    
    // 1. Xử lý file vật lý TRƯỚC khi gọi API và lưu DB
    if (primaryFile) {
      const base64Data = primaryFile.data.split(";base64,").pop();

      if (base64Data) {
        // 2. CHUYỂN ĐỔI CHUỖI BASE64 THÀNH BUFFER (Bắt buộc)
        const fileBuffer = Buffer.from(base64Data, "base64");

        // 3. Lấy đuôi file (ví dụ: .pdf, .docx, .png)
        const fileExt = path.extname(primaryFile.fileName); 

        try {
          // 4. Ném Buffer và đuôi file vào hàm vạn năng của chúng ta
          const extractedText = await extractFileContent(fileBuffer, fileExt);
          
          console.log("Extracted Text:", extractedText);
          currentFileContent = extractedText; // Lưu nội dung bóc tách vào biến fileContent
          // Giờ bạn có thể lưu extractedText này vào cột `fileContent` (String) của Prisma!
        } catch (error) {
          console.error("File Extraction Error:", error);
        }
      

        const randomSuffix = crypto.randomBytes(3).toString("hex"); // 6 ký tự ngẫu nhiên
        const uniqueFileName = `${primaryFile.fileName}-${randomSuffix}${fileExt}`;

        const dirPath = path.join(process.cwd(), "files", convId.toString());
        const filePath = path.join(dirPath, uniqueFileName);

        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        fs.writeFileSync(filePath, fileBuffer);

        // Cập nhật thông tin chuẩn bị ghi vào tin nhắn của USER
        dbFileUrl = `/static-files/${convId}/${uniqueFileName}`;
        dbFileName = primaryFile.fileName;
        dbFileType = primaryFile.mimeType;
      }
    }

    await prisma.message.create({
      data: { 
        content, 
        conversationId: convId, 
        type: "prompt",
        fileUrl: dbFileUrl,   // Đã chuyển đúng vị trí về đây
        fileName: dbFileName,
        fileType: dbFileType,
        fileContent: currentFileContent // Lưu nội dung bóc tách vào cột fileContent
      },
    });
//     if (files && files.length > 0) {
//     for (const file of files) {
//         await aiService.upsertFile(convId.toString(), file);
//     }
// }
    let stream;
    if(model.startsWith("flowise")){
       const APIInformation = await prisma.user.findUnique({
        where: { id: userId },
        select: { FlowiseAPIKey: true, FlowiseAPIUrl: true }
      });
      const APIKey = APIInformation?.FlowiseAPIKey || "";
      const APIUrl = APIInformation?.FlowiseAPIUrl || "";
      const finalContent = currentFileContent ? `${content}\n\n[Attached File Data]:\n<file_content>\n${currentFileContent}\n</file_content>` : content;
      stream = await aiService.promptToFlowise(finalContent, model, APIKey, APIUrl, convId, files);
    }
    else {
      let APIKey;
      if(model.startsWith("deepseek")){
          const APIInformation = await prisma.user.findUnique({
          where: { id: userId },
          select: { DeepSeekAPIKey: true }
        });
        APIKey = APIInformation?.DeepSeekAPIKey || "";
      } else{
        const APIInformation = await prisma.user.findUnique({
          where: { id: userId },
          select: { GroqAPIKey: true }
        });
        APIKey = APIInformation?.GroqAPIKey || "";
      }
      if(!APIKey) {
        throw new Error("API key not found");
      }
      const previousContext = await prisma.message.findMany({
        where: { conversationId: convId },
        orderBy: { createdAt: "asc" },
        select: { content: true, type: true, fileContent: true },
        take: 10 
      });
      //Add the previous context to the current content, formatting it as needed <fileContent> xml to indicate the content of the file, and also indicate whether the message is from the user or the AI
// 1. Format the chat history (Each message keeps its own file if it has one)
      const contextText = previousContext
        .map(msg => {
          const sender = msg.type === "prompt" ? "User" : "AI";
          
          // If this specific message has a file, wrap it in XML tags right below the content
          if (msg.fileContent) {
            return `${sender}: ${msg.content}\n[Attached File Data]:\n<file_content>\n${msg.fileContent}\n</file_content>`;
          }
          
          return `${sender}: ${msg.content}`;
        })
        .join("\n");

      // 2. Format the current message (Check if the user just uploaded a new file in the current request)
      // Note: Assumed 'currentFileContent' is the variables holding the file content of the CURRENT message if any.
      let currentMessageText = `User: ${content}`;
      if (typeof currentFileContent !== 'undefined' && currentFileContent) {
        currentMessageText += `\n[Attached File Data]:\n<file_content>\n${currentFileContent}\n</file_content>`;
      }

      // 3. Assemble the final unified prompt
      const finalPrompt = `
      [CHAT HISTORY]
      ${contextText}

      [CURRENT QUESTION]
      ${currentMessageText}
      AI:`;

      // 4. Send to your AI Provider
      stream = await aiService.promptToAIProvider(finalPrompt, model, APIKey);
    }

    let fullResponse = "";
    let buffer = "";

    const cleanup = () => stream.destroy();
    res.on("close", cleanup);

    return new Promise<void>((resolve) => {
      stream.on("data", (chunk: Buffer) => {
        buffer += chunk.toString("utf8");
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;

          const jsonStr = line.replace("data:", "").trim();
          if (!jsonStr) continue;

          if (jsonStr === "[DONE]") {
            // if (!res.writableEnded) {
            //   res.write("data: [DONE]\n\n");
            // }
            continue;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            console.log("[FLOWISE RAW]", JSON.stringify(parsed));
            const text = this.extractText(parsed);
            if (!text) continue;

            const normalized = text.replace(/\r/g, "").replace(/\u0000/g, "");
            fullResponse += normalized;

            if (!res.writableEnded) {
              res.write(`data: ${normalized}\n\n`);
            }
          } catch (err) {
            console.error("JSON parse error:", err);
          }
        }
      });

      stream.on("end", async () => {
        if (fullResponse) {
          try {
            await prisma.message.create({
              data: {
                content: fullResponse,
                conversationId: convId,
                type: "response",
              },
            });
          } catch (err) {
            console.error("DB write error:", err);
          }
        }

        if (!res.writableEnded) {
          res.write("data: [DONE]\n\n");
          res.end();
        }
        res.off("close", cleanup);
        resolve();
      });

      stream.on("error", (err: Error) => {
        console.error("Stream error:", err);
        if (!res.writableEnded) {
          res.write(`data: [ERROR] ${err.message}\n\n`);
          res.end();
        }
        res.off("close", cleanup);
        resolve();
      });
    });
  }
}