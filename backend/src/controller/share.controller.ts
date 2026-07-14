import type { NextFunction, Request, Response } from "express";
import { MyError } from "../utils/MyError";
import { ShareService } from "../service/share.service";

const shareService = new ShareService();

export const shareConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if(!req.params.conversationId){
      throw new MyError("Forbidden", 403);
    }
    const conversationId = parseInt(req.params.conversationId as string, 10);
    if (isNaN(conversationId)) {
      throw new MyError("Invalid conversation ID", 400);
    }
    const userId = req.user?.id;
    if (!userId) {
      throw new MyError("Unauthorized", 401);
    }
    const result = await shareService.shareConversation(userId, conversationId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
export const shareMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if(!req.params.messageId){
      throw new MyError("Forbidden", 403);
    }
    const messageId = parseInt(req.params.messageId as string, 10);
    if (isNaN(messageId)) {
      throw new MyError("Invalid message ID", 400);
    }
    const userId = req.user?.id;
    if (!userId) {
      throw new MyError("Unauthorized", 401);
    }
    const result = await shareService.shareMessage(userId, messageId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
export const getSharedConversation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if(!req.params.shareId){
      throw new MyError("Forbidden", 403);
    }
    const sharedId = req.params.shareId as string;
    const result = await shareService.getSharedConversation(sharedId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in getSharedConversation controller:", error);
    next(error);
  }
}