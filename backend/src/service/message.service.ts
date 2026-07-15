import type { Response } from "express";
import { prisma } from "../../lib/prisma";
import { AIService } from "./ai.service";
import path from "path";
import crypto from "crypto";
import fs from "fs";
import { extractFileContent } from "../utils/fileExtractor";
import { MyError } from "../utils/MyError";
import { decrypt } from "../utils/APIHash";
import { FLOWISE_RECOGNITION, OPENROUTER_RECOGNITION } from "../utils/generalKey";

const aiService = new AIService();

export class MessageService {
  private readonly SKIP_EVENTS = new Set([
    "start", "end", "metadata",
    "agentReasoning", "sourceDocuments", "usedTools",
    "fileAnnotations", "artifact",
  ]);
  private activeControllers = new Map<number, AbortController>();
  private extractText(parsed: any): string {
    // 1. Xử lý định dạng chuẩn của AI Provider (Groq / OpenRouter / OpenAI)
    console.log(parsed);
    if (parsed.choices && Array.isArray(parsed.choices) && parsed.choices.length > 0) {
      const delta = parsed.choices[0].delta;
      if (delta && typeof delta.content === "string") {
        return delta.content; 
      }
      if(delta && typeof delta.reasoning === "string" && !delta.channel) {
        return delta.reasoning || "";
      }
      return "";
    }

    // 2. Xử lý định dạng của Flowise dựa trên thuộc tính "event"
    // CHỈ chấp nhận event là "token" để lấy dữ liệu chữ
    if (parsed.event === "token") {
      return typeof parsed.data === "string" ? parsed.data : "";
    }

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
    const existingConversation = await prisma.conversation.findUnique({
      where: { id: convId, userId: userId },
    });

    if (!existingConversation) {
      throw new MyError("Unauthorized", 401);
    }
    if (this.activeControllers.has(convId)) {
      this.activeControllers.get(convId)?.abort();
      this.activeControllers.delete(convId);
    }
    // Tạo mới và lưu vào Map toàn cục của Service
    const axiosController = new AbortController();
    this.activeControllers.set(convId, axiosController);
    let dbFileUrl: string | null = null;
    let dbFileName: string | null = null;
    let dbFileType: string | null = null;
    let currentFileContent: string | null = null; // Variable to hold the extracted file content
    const primaryFile = files && files.length > 0 ? files[0] : null;    
    let APIKey: string|null = null;
    let APIUrl;
    if(model.startsWith(FLOWISE_RECOGNITION)){
      const APIInformation = await prisma.user.findUnique({
          where: { id: userId },
          select: { FlowiseAPIKey: true, FlowiseURL: true }
        });
        if(!APIInformation?.FlowiseURL){
          throw new MyError("Flowise API URL not found",400);
        }
      APIKey = decrypt(APIInformation?.FlowiseAPIKey || "");
      APIUrl = decrypt(APIInformation?.FlowiseURL || "");
    } else if(model.includes(OPENROUTER_RECOGNITION)){
      const APIInformation = await prisma.user.findUnique({
        where: { id: userId },
        select: { OpenRouterAPIKey: true }
      });
      APIKey = decrypt(APIInformation?.OpenRouterAPIKey || "");
      if(!APIKey) {
        throw new MyError("OpenRouter API key not found", 400);
      }
    } else{
      const APIInformation = await prisma.user.findUnique({
        where: { id: userId },
        select: { GroqAPIKey: true }
      });
      APIKey = decrypt(APIInformation?.GroqAPIKey || "");
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
        const dirPath = path.join(process.cwd(), "files", userId.toString(), convId.toString());
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
    const newMessage = await prisma.message.create({
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
    let stream;
    if(model.startsWith(FLOWISE_RECOGNITION)){
      const finalContent = currentFileContent ? `${content}\n\n[Attached File Data]:\n<file_content>\n${currentFileContent}\n</file_content>` : content;
      if(!APIUrl || APIUrl.trim() === "") {
        throw new MyError("Flowise API URL is required", 400);
      }
      stream = await aiService.promptToFlowise(finalContent, APIKey, APIUrl, convId, axiosController.signal);
    }
    else {
      const previousContext = await prisma.message.findMany({
        where: { conversationId: convId, id: { not: newMessage.id } },
        orderBy: { createdAt: "desc" },
        select: { content: true, type: true, fileContent: true },
        take: 10
      });
      //Add the previous context to the current content, formatting it as needed <fileContent> xml to indicate the content of the file, and also indicate whether the message is from the user or the AI
// 1. Format the chat history (Each message keeps its own file if it has one)
      const contextText = previousContext.reverse()
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

    const placeholderAiMessage = await prisma.message.create({
      data: {
        content: "", 
        conversationId: convId,
        type: "response",
        AIModel: model,
        isCompleted: false // Mặc định chưa hoàn thành
      },
    });
    const responseId = placeholderAiMessage.id;
    // let fullResponse = "";
    let cleanAccumulatedContent = "";
    let streamBuffer = "";
    // let buffer = "";
    let isStreamFinished = false;
    let isAnalysisChannel = false;
    let wasAbortedByUser = false;
    const handleFinalizeAndSendId = async (completed: boolean) => {
      const finalCompletedStatus = wasAbortedByUser ? false : completed;
      if (isStreamFinished) return;
      isStreamFinished = true;
      this.activeControllers.delete(convId);
      const savedText = cleanAccumulatedContent.trim();
      if(!savedText) {
        if (!res.writableEnded) {
          res.end();
        }
        return;
      }
      try {
        // Chỉ gọi một câu lệnh INSERT duy nhất cho tin nhắn RESPONSE
        const savedAiMessage = await prisma.message.update({
          where: {
            id: placeholderAiMessage.id
          },
          data: {
            content: savedText , 
            conversationId: convId,
            type: "response",
            AIModel: model,
            isCompleted: finalCompletedStatus
          },
        });

      } catch (err) {
        console.error("[DB ERROR] Saved to Database failed:", err);
      }

      if (!res.writableEnded) {
        res.end();
      }
    };
    const cleanup = async () => {
      if (isStreamFinished) {
        wasAbortedByUser = true;
        console.log(`[ABORT IGNORED] Client sent abort signal for ${model} which has already finished.`);
        return; 
      }
      wasAbortedByUser = true;
      console.log(`[ABORT DETECTED] ===== Abortion successful =====`);
      console.log(`[ABORT DETECTED] Time: ${new Date().toISOString()} | Model: ${model}`);
      
      // Gỡ bỏ ngay lập tức listener để tránh rò rỉ bộ nhớ
      res.removeListener("close", cleanup);   
      // Hủy stream dữ liệu nhận từ AI Provider
      if (stream) {
        stream.removeAllListeners("data");
        stream.removeAllListeners("end");
        stream.removeAllListeners("error");
        if (typeof stream.destroy === "function") {
          stream.destroy();
        }
      }
      const currentController = this.activeControllers.get(convId);
      if(currentController) {
        currentController.abort();
        this.activeControllers.delete(convId);
      }
      // Hủy request Axios 
      console.log(`[ABORT ACTION] Sending abort request to Axios Provider...`);
      axiosController.abort();
      await handleFinalizeAndSendId(false);
    };
    
    // Đăng ký sự kiện ngắt kết nối từ phía Client
    res.on("close", cleanup);

    return new Promise<void>((resolve) => {
      stream.on("data", (chunk: Buffer) => {
        if (isStreamFinished || axiosController.signal.aborted || res.writableEnded) {
          return;
        }
        streamBuffer+=chunk.toString("utf-8");
        const lines = streamBuffer.split("\n");
        streamBuffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;

          const jsonStr = trimmed.replace(/^data:\s*/, "");
          if (!jsonStr || jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);

            // Kiểm tra phân tách kênh suy nghĩ (analysis)
            const delta = parsed.choices?.[0]?.delta;
            if (delta) {
              if (delta.channel === "analysis" || delta.reasoning !== undefined) {
                isAnalysisChannel = true;
              } else if (delta.content !== undefined || (delta.channel && delta.channel !== "analysis")) {
                isAnalysisChannel = false;
              }
            }

            if (!isAnalysisChannel) {
              const textToken = this.extractText(parsed);
              if (textToken) {
                const cleanToken = textToken.replace(/\r/g, "").replace(/\u0000/g, "");
                cleanAccumulatedContent += cleanToken;
                if (!res.writableEnded) {
                  res.write(`data: ${JSON.stringify({
                    choices: [{ delta: { content: cleanToken } }],
                    responseId: responseId
                  })}\n\n`);
                }
              }
            }
          } catch (err) {
            // chunk cắt dòng nửa vời bị lỗi JSON parse tại vòng lặp này sẽ được gom lại và xử lý chính xác ở chunk tiếp theo
          }
        }
      });

      stream.on("end", async () => {
        console.log(`[STREAM END] Stream end triggered for model ${model}`);
          res.removeListener("close", cleanup); 
          this.activeControllers.delete(convId);
          await handleFinalizeAndSendId(true);
        resolve();
      });

      stream.on("error", async (err: any) => {
        console.log(`[STREAM ERROR] Error occured in ${model}: ${err.message}`);
        res.removeListener("close", cleanup);
        if (err.name !== 'CanceledError' && err.message !== 'canceled' && err.code !== 'ERR_CANCELED') {
          console.error("[REAL ERROR]", err);
          if (!res.writableEnded) {
            res.write(`data: [ERROR] ${err.message}\n\n`);
            res.end();
          }
        }
        if(!isStreamFinished) {
          await handleFinalizeAndSendId(false);
        }
        resolve();
      });
    });
  }
}