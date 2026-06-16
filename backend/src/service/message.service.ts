import type { Response } from "express";
import { prisma } from "../../lib/prisma";
import { AIService } from "./ai.service";
import path from "path";
import crypto from "crypto";
import fs from "fs";

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
    files?: { data: string; fileName: string; mimeType: string }[]
  ): Promise<void> {
    
    let dbFileUrl: string | null = null;
    let dbFileName: string | null = null;
    let dbFileType: string | null = null;

    const primaryFile = files && files.length > 0 ? files[0] : null;    
    
    // 1. Xử lý file vật lý TRƯỚC khi gọi API và lưu DB
    if (primaryFile) {
      const base64Data = primaryFile.data.split(";base64,").pop();
      if (base64Data) {
        const fileBuffer = Buffer.from(base64Data, "base64");

        let fileExt = path.extname(primaryFile.fileName);
        const fileBaseName = path.basename(primaryFile.fileName, fileExt);
        let mimeType = primaryFile.mimeType;

        // Bọc lót lỗi file rỗng đuôi/rỗng mimeType từ Ubuntu
        if (!fileExt && (!mimeType || mimeType === "application/octet-stream")) {
          fileExt = ".txt";
          mimeType = "text/plain";
        }

        const randomSuffix = crypto.randomBytes(3).toString("hex"); // 6 ký tự ngẫu nhiên
        const uniqueFileName = `${fileBaseName}-${randomSuffix}${fileExt}`;

        const dirPath = path.join(process.cwd(), "files", convId.toString());
        const filePath = path.join(dirPath, uniqueFileName);

        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }

        fs.writeFileSync(filePath, fileBuffer);

        // Cập nhật thông tin chuẩn bị ghi vào tin nhắn của USER
        dbFileUrl = `/static-files/${convId}/${uniqueFileName}`;
        dbFileName = primaryFile.fileName;
        dbFileType = mimeType;
      }
    }

    await prisma.message.create({
      data: { 
        content, 
        conversationId: convId, 
        type: "prompt",
        fileUrl: dbFileUrl,   // Đã chuyển đúng vị trí về đây
        fileName: dbFileName,
        fileType: dbFileType
      },
    });
//     if (files && files.length > 0) {
//     for (const file of files) {
//         await aiService.upsertFile(convId.toString(), file);
//     }
// }
    const stream = await aiService.promptStream(content, model, convId, files);

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