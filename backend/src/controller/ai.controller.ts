import type { NextFunction, Request, Response } from "express";
import { AIService } from "../service/ai.service";

const aiService = new AIService();
export const getAIModels = async(req:Request, res: Response, next:NextFunction) =>{
    try{
        const response = await aiService.getGroqModels();
        res.status(200).json(response);
        return;
    }catch(error){
        next(error);
    }
}