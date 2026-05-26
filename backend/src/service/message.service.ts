import type { Response } from "express";
import { prisma } from "../../lib/prisma";
import { MyError } from "../utils/MyError";
import { AIService } from "./ai.service";

const aiService = new AIService();
export class MessageService {
  public async sendPrompt(
    convId: number,
    content: string,
    model: string,
    res: Response
  ) {

    await prisma.message.create({
      data: {
        content,
        conversationId: convId,
        type: "prompt"
      }
    });
    const responseStream = await aiService.promptStream(content, model, convId);
    let fullResponse = "";
    let buffer = "";
    responseStream.on("data", (chunk: Buffer) => {
    buffer += chunk.toString("utf8");
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
        if (!line.startsWith("data:")) continue;
        const jsonStr = line.replace("data:", "").trim();
        if (!jsonStr || jsonStr === "[DONE]") continue;
        try {
        const parsed = JSON.parse(jsonStr);
        let text = "";
        if (typeof parsed.text === "string") {
            text = parsed.text;
        }
        if (typeof parsed.data === "string") {
            text = parsed.data;
        }
        if (!text) continue;
        fullResponse += text;
        res.write(text);
        } catch (err) {
        console.error("Parse error:", err);
        throw new MyError("Internal server error", 500);
        }
    }
    });
    responseStream.on("end", async () => {
      await prisma.message.create({
        data: {
          content: fullResponse.replace("[DONE]", ""),
          conversationId: convId,
          type: "response"
        }
      });
      res.end();
    });
    responseStream.on("error", (err: Error) => {
      console.error("Stream error:", err);
      if (!res.writableEnded) {
        throw new MyError("Unexpected error", 500);
      }
    });
  }
}