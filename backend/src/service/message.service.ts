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
    let isStreamFinished = false;

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
        console.log(`[🟢 DB SAVED] Model: ${model} | Completed: ${completed} | Length: ${fullResponse.length} chars`);
      } catch (err) {
        console.error("[🔴 DB ERROR] Ghi nhận phản hồi thất bại:", err);
      }
    };

    const cleanup = async () => {
      if (isStreamFinished) {
        console.log(`[⚠️ ABORT IGNORED] Client gửi tín hiệu đóng kết nối nhưng luồng của ${model} ĐÃ KẾT THÚC trước đó.`);
        return; 
      }
      
      isStreamFinished = true; 
      console.log(`[🚨 ABORT DETECTED] ===== USER BẤM ABORT THÀNH CÔNG =====`);
      console.log(`[🚨 ABORT DETECTED] Thời gian: ${new Date().toISOString()} | Model đang chạy: ${model}`);
      
      // Gỡ bỏ ngay lập tức listener để tránh rò rỉ bộ nhớ
      res.removeListener("close", cleanup); 
      const currentController = this.activeControllers.get(convId);
      if(currentController) {
        currentController.abort();
        this.activeControllers.delete(convId);
      }
      // Hủy request Axios 
      console.log(`[🚨 ABORT ACTION] Đang gửi lệnh hủy request tới Axios Provider...`);
      axiosController.abort(); 
      
      // Hủy stream dữ liệu nhận từ AI Provider
      if (stream) {
        if (typeof stream.destroy === "function") {
          stream.destroy();
        } else if (stream.push) {
          stream.push(null); // Cách đóng stream nếu là Readable đóng gói thủ công
        }
      }
      await saveAIResponse(false); 
      if (!res.writableEnded) { 
        res.end();
      }
    };
    
    // Đăng ký sự kiện ngắt kết nối từ phía Client
    res.on("close", cleanup);

    return new Promise<void>((resolve) => {
    let chunkCount = 0;
      stream.on("data", (chunk: Buffer) => {
        chunkCount++;
        console.log("Raw chunk:", chunk.toString("utf8"));
        if (isStreamFinished || axiosController.signal.aborted) {
          if (!isStreamFinished) cleanup();
          return;
        }
        
        buffer += chunk.toString("utf8");
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        if (chunkCount % 10 === 0 || chunkCount === 1) {
          console.log(`[📶 STREAMING DATA] Model: ${model} | Chunk #${chunkCount}`);
        }
        
        let isAnalysisChannel = false;

        for (const line of lines) {
          // Bẻ gãy vòng lặp đồng bộ NGAY LẬP TỨC nếu client bấm hủy hoặc res đóng
          if (isStreamFinished || axiosController.signal.aborted || res.writableEnded) {
            console.log(`[🛑 LOOP BREAKER] Vòng lặp từ chunk #${chunkCount} bị chặn đứng ngay lập tức do đã Abort!`);
            break; 
          }

          if (!line.match(/^\s*data:/)) continue;

          const jsonStr = line.replace(/^\s*data:\s*/, "").trim();
          if (!jsonStr) continue;

          // XỬ LÝ TÍN HIỆU [DONE] THÔ TRƯỚC VÌ NÓ KHÔNG PHẢI JSON
          if (jsonStr === "[DONE]") {
            if (isAnalysisChannel) {
              console.log(`[⚠️ FALSE DONE BLOCKED] Phát hiện tín hiệu [DONE] giả từ ${model} khi đang ở channel: analysis.`);
              continue; 
            }
            console.log(`[🏁 PROVIDER DONE] Nhận được tín hiệu [DONE] chính thức từ ${model}`);
            continue;
          }

          // CHỈ DÙNG 1 KHỐI TRY-CATCH DUY NHẤT CHO JSON DƯỚI ĐÂY
          try {
            const parsed = JSON.parse(jsonStr);
            // 1. Kiểm tra lỗi Flowise integration
            if (parsed.event === "error" || parsed.status === "error") {
              console.error(`[🚨 FLOWISE ERROR DETECTED]: ${jsonStr}`);
              res.write(`data: ${JSON.stringify({ error: true, status: 400, message: parsed.data || "Flowise Integration Error" })}\n\n`);
              res.end();
              return; 
            }

            // 2. Bỏ qua các sự kiện end/bổ trợ của Flowise
            if (parsed.event === "end" || parsed.event === "agentFlowEvent") continue;

            // 3. Thẩm định kênh truyền (analysis vs content)
            const delta = parsed.choices?.[0]?.delta;
            if (delta) {
              if (delta.channel === "analysis") {
                isAnalysisChannel = true;
              } else if (delta.content !== undefined || (delta.channel && delta.channel !== "analysis")) {
                isAnalysisChannel = false;
              }
            }

            // 4. Bóc tách chữ và viết xuống stream
            const text = this.extractText(parsed);
            if (!text) continue;

            const normalized = text.replace(/\r/g, "").replace(/\u0000/g, "");
            
            // Re-check abort ngay trước khi ghi
            if (isStreamFinished || axiosController.signal.aborted || res.writableEnded) break;

            fullResponse += normalized;

            if (normalized !== "") {
              res.write(`data: ${normalized}\n\n`);
            }
          } catch (err) {
            // Trường hợp dòng không parse được (text thô hoặc format lạ) nhưng không phải lỗi hệ thống
          }
        }
      });

      stream.on("end", async () => {
        console.log(`[🔚 STREAM END] Sự kiện stream.on("end") kích hoạt cho model ${model}`);
        if (!isStreamFinished) {
          isStreamFinished = true; 
          res.removeListener("close", cleanup); 
          this.activeControllers.delete(convId);
          await saveAIResponse(true); 

          if (!res.writableEnded) {
            res.write("data: [DONE]\n\n");
            res.end();
          }
        }
        resolve();
      });

      stream.on("error", (err: any) => {
        console.log(`[💥 STREAM ERROR] Xuất hiện lỗi luồng từ model ${model}: ${err.message}`);
        if (!isStreamFinished) {
          isStreamFinished = true;
          cleanup();
        }
        
        this.activeControllers.delete(convId);

        if (err.name !== 'CanceledError' && err.message !== 'canceled' && err.code !== 'ERR_CANCELED') {
          console.error("[🔴 REAL ERROR]", err);
          if (!res.writableEnded) {
            res.write(`data: [ERROR] ${err.message}\n\n`);
            res.end();
          }
        } else {
          console.log("[✨ CLEANUP SUCCESS] Hủy kết nối mạng Axios thành công, tài nguyên đã được giải phóng.");
        }
        resolve();
      });
    });
  }
}