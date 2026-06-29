import type { NextFunction, Request, Response } from "express";
import { ConversationService } from "../service/conversation.service";
import { MyError } from "../utils/MyError";

const conversationService = new ConversationService();

export const fetchAllConversations = async(req: Request, res:Response, next: NextFunction)=>{
    try{
        if(req.user){
            const response = await conversationService.getConversations(req.user?.id);
            res.status(200).json(response);
            return;
        }
        throw new MyError("Unauthorized", 401);
    } catch(error){
        console.log(error);
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
        throw new MyError("Unauthorized", 401);
    } catch(error){
        next(error);
    }
}
export const createNewConversation = async(req: Request, res: Response, next: NextFunction)=>{
    try{
        if(req.user){
            const response = await conversationService.createNewConversation(req.user.id, req.body.title);
            res.status(201).json(response);
            return;
        }
        throw new MyError("Unauthorized", 401);
    } catch(error){
        next(error);
    }
}
export const deleteConversation = async(req: Request, res: Response, next: NextFunction)=>{
    try{
        if(req.user){
            const convId = parseInt(req.params.convId as string, 10);
            const response = await conversationService.deleteConversation(convId, req.user.id);
            res.status(201).json(response);
            return;
        }
        throw new MyError("Unauthorized", 401);
    } catch(error){
        next(error);
    }
}
export const deleteAllConversations = async(req: Request, res: Response, next: NextFunction)=>{
    try{
        if(req.user){
            const response = await conversationService.deleteAllConversations(req.user.id);
            res.status(201).json(response);
            return;
        }
        throw new MyError("Unauthorized", 401);
    } catch(error){
        next(error);
    }
}
export const updateConversationTitle = async(req: Request, res: Response, next: NextFunction)=>{
    try{
        if(req.user){
            const convId = parseInt(req.params.convId as string, 10);
            const response = await conversationService.updateConversationTitle(convId, req.body.title);
            res.status(201).json(response);
            return;
        }
        throw new MyError("Unauthorized", 401);
    } catch(error){
        next(error);
    }
}