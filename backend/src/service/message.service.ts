import type { Response } from "express";
import { prisma } from "../../lib/prisma";
import { AIService } from "./ai.service";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { extractFileContent } from "../utils/fileExtractor";
import { MyError } from "../utils/MyError";

const aiService = new AIService();


export class MessageService {
  private readonly SKIP_EVENTS = new Set([
    "start", "end", "metadata",
    "agentReasoning", "sourceDocuments", "usedTools",
    "fileAnnotations", "artifact",
  ]);
  private extractText(parsed: any): string {
    // 1. Xử lý định dạng chuẩn của AI Provider (Groq / OpenRouter / OpenAI)
    if (parsed.choices && Array.isArray(parsed.choices) && parsed.choices.length > 0) {
      const delta = parsed.choices[0].delta;
      if (delta && typeof delta.content === "string") {
        return delta.content; 
      }
      return "";
    }

    // 2. Xử lý định dạng của Flowise dựa trên thuộc tính "event"
    // CHỈ chấp nhận event là "token" để lấy dữ liệu chữ
    if (parsed.event === "token") {
      return typeof parsed.data === "string" ? parsed.data : "";
    }

    // Bỏ qua tất cả các event khác (nextAgentFlow, agentFlowExecutedData, metadata, end...)
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
    const axiosController= new AbortController();
    let dbFileUrl: string | null = null;
    let dbFileName: string | null = null;
    let dbFileType: string | null = null;
    let currentFileContent: string | null = null; // Variable to hold the extracted file content
    const primaryFile = files && files.length > 0 ? files[0] : null;    
    let APIKey: string|null = null;
    let APIUrl: string|null = null;
    if(model.startsWith("flowise")){
      let APIInformation;
      if(model.includes("custom")){
        APIInformation = await prisma.user.findUnique({
          where: { id: userId },
          select: { FlowiseAPIKey: true, FlowiseURL: true }
        });
        if(!APIInformation?.FlowiseAPIKey || !APIInformation?.FlowiseURL){
          throw new MyError("Flowise API key or URL not found",400);
        }
      }
      APIKey = APIInformation?.FlowiseAPIKey || "";
      APIUrl = APIInformation?.FlowiseURL || "";
    } else if(model.includes("free")){
      const APIInformation = await prisma.user.findUnique({
        where: { id: userId },
        select: { OpenRouterAPIKey: true }
      });
      APIKey = APIInformation?.OpenRouterAPIKey || "";
      if(!APIKey) {
        throw new MyError("OpenRouter API key not found", 400);
      }
    } else{
      const APIInformation = await prisma.user.findUnique({
        where: { id: userId },
        select: { GroqAPIKey: true }
      });
      APIKey = APIInformation?.GroqAPIKey || "";
      if(!APIKey) {
        throw new MyError("Groq API key not found", 400);
      }
    }
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
          
          // console.log("Extracted Text:", extractedText);
          currentFileContent = extractedText; // Lưu nội dung bóc tách vào biến fileContent
          // Giờ bạn có thể lưu extractedText này vào cột `fileContent` (String) của Prisma!
        } catch (error) {
          console.error("File Extraction Error:", error);
          throw new MyError(`Failed to extract content from file`, 500);
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
        AIModel: model,
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
      const finalContent = currentFileContent ? `${content}\n\n[Attached File Data]:\n<file_content>\n${currentFileContent}\n</file_content>` : content;
      stream = await aiService.promptToFlowise(finalContent, APIKey, APIUrl, convId, axiosController.signal);
    }
    else {
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
      stream = await aiService.promptToAIProvider(finalPrompt, model, APIKey, axiosController.signal);
    }

    let fullResponse = "";
    let buffer = "";
    let isStreamFinished = false; // Thay thế isAborted bằng cờ kiểm soát luồng kết thúc tự nhiên

    const saveAIResponse = async (completed: boolean) => {
      if (!fullResponse.trim()) return;
      try {
        await prisma.message.create({
          data: {
            content: fullResponse,
            conversationId: convId,
            type: "response",
            AIModel: model,
            isCompleted: completed 
          },
        });
        console.log(`[DB] Saved AI Response. Completed: ${completed} | Length: ${fullResponse.length}`);
      } catch (err) {
        console.error("DB write error:", err);
      }
    };

const cleanup = async () => {
      // 🛠️ Kiểm tra nếu luồng chưa kết thúc thì xử lý ngắt kết nối khẩn cấp
      if (!isStreamFinished) {
        isStreamFinished = true; 
        
        // Gỡ bỏ ngay lập tức để tránh rò rỉ listener hoặc gọi nhầm luồng
        res.off("close", cleanup); 
        
        axiosController.abort(); // Ngắt kết nối Axios ngay lập tức
        if (stream && typeof stream.destroy === "function") {
          stream.destroy();
        }
        
        console.log("[STREAM] Client disconnected via Abort. Freezing and saving partial text...");
        await saveAIResponse(false); // Lưu dở dang với trạng thái false
      }
    };
    
    // Đăng ký sự kiện ngắt kết nối từ phía Client
    res.on("close", cleanup);

    return new Promise<void>((resolve) => {
      stream.on("data", (chunk: Buffer) => {
        if (isStreamFinished) return; 
        
        buffer += chunk.toString("utf8");
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.match(/^\s*data:/)) continue;

          const jsonStr = line.replace(/^\s*data:\s*/, "");
          if (!jsonStr) continue;
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.event === "end" || parsed.event === "agentFlowEvent") continue;

            const text = this.extractText(parsed);
            if (!text) continue;

            const normalized = text.replace(/\r/g, "").replace(/\u0000/g, "");
            
            if (isStreamFinished) return; 

            fullResponse += normalized;

            if (!res.writableEnded && normalized !== "") {
              res.write(`data: ${normalized}\n\n`);
            }
          } catch (err) {
            console.error("JSON parse error on line:", jsonStr, err);
          }
        }
      });

      stream.on("end", async () => {
        // 🛠️ Nếu chưa bị Abort trước đó, xử lý kết thúc thành công tự nhiên
        if (!isStreamFinished) {
          isStreamFinished = true; 
          res.off("close", cleanup); // 🛠️ CHẮC CHẮN gỡ bỏ cleanup khi hoàn thành thành công

          await saveAIResponse(true); 

          if (!res.writableEnded) {
            res.write("data: [DONE]\n\n");
            res.end();
          }
        }
        resolve();
      });

      stream.on("error", (err: Error) => {
        // 🛠️ LUÔN LUÔN gỡ bỏ cleanup khi stream gặp lỗi (bao gồm cả lỗi hủy mạng ERR_CANCELED)
        if (!isStreamFinished) {
          isStreamFinished = true;
        }
        
        res.off("close", cleanup); // 🛠️ ĐƯA RA NGOÀI ĐIỀU KIỆN: Bắt buộc phải gỡ listener ra khỏi res

        // Nếu lỗi xảy ra KHÔNG phải do chúng ta chủ động abort, log lỗi ra
        if (err.name !== 'CanceledError' && err.message !== 'canceled') {
          console.error("Stream real error:", err);
          if (!res.writableEnded) {
            res.write(`data: [ERROR] ${err.message}\n\n`);
            res.end();
          }
        } else {
          console.log("[STREAM] Axios request successfully canceled & cleaned up.");
        }
        resolve();
      });
    });
  }
}