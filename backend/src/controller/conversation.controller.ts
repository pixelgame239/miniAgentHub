import type { NextFunction, Request, Response } from "express";
import { ConversationService } from "../service/conversation.service";
import { MyError } from "../utils/MyError";

const conversationService = new ConversationService();

export const fetchAllConversations = async(req: Request, res:Response, next: NextFunction)=>{
    try{
        if(req.user){
            console.log("In here")
            const groupId = parseInt(req.params.groupId as string, 10);
            const response = await conversationService.getConversations(req.user?.id, groupId);
            res.status(200).json(response);
            return;
        }
        throw new MyError("Unauthorized", 401);
    } catch(error){
        next(error);
    }
}
export const fetchConversationDetail = async(req: Request, res: Response, next: NextFunction) =>{
    try{
        if(req.user){
            const convId = parseInt(req.params.convId as string, 10);
            const response = await conversationService.getConversationDetail(req.user.id, convId); 
            res.status(200).json(response);
            return;
        }
        console.log(req);
        throw new MyError("Unauthorized", 401);
    } catch(error){
        next(error);
    }
}