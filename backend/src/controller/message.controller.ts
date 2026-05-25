import type { NextFunction, Request, Response } from "express";
import { MessageService } from "../service/message.service";

const messageService = new MessageService();

export const promptToAI = async (
  req: Request,
  res: Response, next: NextFunction
) => {
  try {

    const { conversationId, content, model } = req.body;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    await messageService.sendPrompt(
      conversationId,
      content,
      model,
      res
    );

  } catch (error) {
    next(error);
  }
};