import type { NextFunction, Request, Response } from "express";
import { ConversationService } from "../service/conversation.service";
import { MyError } from "../utils/MyError";

const conversationService = new ConversationService();

export const fetchAllConversations = async(req: Request, res:Response, next: NextFunction)=>{
    try{
        if(req.user){
            const response = await conversationService.getConversations(req.user?.id);
            res.status(200).json(response);
        }
        throw new MyError("Unauthorized", 401);
    } catch(error){
        next(error);
    }
}
