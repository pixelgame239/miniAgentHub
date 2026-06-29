import type { NextFunction, Request, Response } from "express";
import { MessageService } from "../service/message.service";
import { MyError } from "../utils/MyError";

const messageService = new MessageService();

export const promptToAI = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { conversationId, content, model, files } = req.body;
  const userId = req.user?.id; // Assuming you have user authentication middleware that sets req.user
  if(!userId){
    throw new MyError("Unauthorized", 401);
  }
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
    await messageService.sendPrompt(conversationId, content, model, res, userId, files);
  } catch (error) {
    console.error("promptToAI error:", error);
        
    if (!res.writableEnded) {
      const statusCode = (error as MyError).status || 500;
      const errorMessage = (error as MyError).message || "Internal server error";

      // 🛠️ BẮN CHUỖI JSON ĐÃ ĐƯỢC ĐỊNH DẠNG ĐÚNG CHUẨN SSE (Bắt đầu bằng data:)
      res.write(`data: ${JSON.stringify({ error: true, status: statusCode, message: errorMessage })}\n\n`);
      res.end();
    }
  }
};