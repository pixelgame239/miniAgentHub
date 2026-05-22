import type { NextFunction, Request, Response } from "express";
import { MessageService } from "../service/message.service";

const messageService = new MessageService();

export const promptToAI = async(req: Request, res: Response, next: NextFunction)=>{
    try {
    const { conversationId, content, model } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const finalStream = await messageService.sendPrompt(conversationId, content, model);

    finalStream.pipe(res);

    req.on('close', () => {
      finalStream.destroy();
    });

  } catch (error) {
    console.error(error);
    next(error);
  }
}