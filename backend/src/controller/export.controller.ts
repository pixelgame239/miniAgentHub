import type { NextFunction, Request, Response } from "express";
import { ExportService } from "../service/export.service";
import { MyError } from "../utils/MyError";
import { NOT_FOUND_ERROR, UNAUTHORIZED_ERROR } from "../utils/generalKey";

const exportService = new ExportService();
export const exportAllMessages = async (req: Request, res: Response, next: NextFunction) => {
    try{
        if(req.user){
            const convId = parseInt(req.params.convId as string, 10);
            const userId = req.user.id;
            const response = await exportService.exportAllMessages(userId,convId);
            if(response){
                res.status(200).json(response);
            } else{
                res.status(404).json({message: NOT_FOUND_ERROR});
            }
            return;
        }
        throw new MyError(UNAUTHORIZED_ERROR, 401);
    }catch(error){
        next(error);
    }
}
export const exportMessage = async (req: Request, res: Response, next: NextFunction) => {
    try{
        if(req.user){
            const messageId = parseInt(req.params.messageId as string, 10);
            const userId = req.user.id;
            const response = await exportService.exportMessage(userId, messageId);
            if(response){
                res.status(200).json(response);
            } else{
                res.status(404).json({message: NOT_FOUND_ERROR});
            }
            return;
        }
        throw new MyError(UNAUTHORIZED_ERROR, 401);
    }catch(error){
        next(error);
    }
}