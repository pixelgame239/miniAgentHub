import type { NextFunction, Request, Response } from "express";
import { MessageService } from "../service/message.service";
import { MyError } from "../utils/MyError";

const messageService = new MessageService();

export const promptToAI = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { conversationId, content, model, APIKey, files } = req.body;

  // Basic validation before flushing headers — after flushHeaders()
  // you can no longer send error status codes to the client
  if (!conversationId || !content || !model) {
    throw new MyError("conversationId, content and model are required", 400);
  }

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    console.log(req.body.files);
    await messageService.sendPrompt(conversationId, content, model, APIKey, res, files);
  } catch (error) {
    // Headers already sent — can't use next(error) for a JSON error response.
    // Write an SSE error event instead so the client knows something went wrong.
    console.error("promptToAI error:", error);
    if (!res.writableEnded) {
      res.write("data: [ERROR] Internal server error\n\n");
      res.end();
    }
  }
};