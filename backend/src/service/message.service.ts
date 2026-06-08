// message.service.ts
import type { Response } from "express";
import { prisma } from "../../lib/prisma";
import { AIService } from "./ai.service";

const aiService = new AIService();

export class MessageService {
  private extractText(parsed: any): string {
    if (typeof parsed.text === "string") return parsed.text;
    if (typeof parsed.data === "string") return parsed.data;
    return "";
  }

  public async sendPrompt(
    convId: number,
    content: string,
    model: string,
    res: Response
  ): Promise<void> {
    await prisma.message.create({
      data: { content, conversationId: convId, type: "prompt" },
    });

    // promptStream returns response.data directly — don't access .data again
    const stream = await aiService.promptStream(content, model, convId);

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

          // Flowise end signal — forward [DONE] and stop processing
          if (jsonStr === "[DONE]") {
            if (!res.writableEnded) {
              res.write("data: [DONE]\n\n");
            }
            continue;
          }

          try {
            const parsed = JSON.parse(jsonStr);
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
        // Save full AI response to DB
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