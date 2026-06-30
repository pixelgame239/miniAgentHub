import type { NextFunction, Request, Response } from "express";
import { AIService } from "../service/ai.service";

const aiService = new AIService();
export const getGroqModels = async(req:Request, res: Response, next:NextFunction) =>{
    try{
        const { APIKey } = req.body;
        if(!APIKey){
            res.status(400).json({message: "Missing API Key"});
            return;
        }
        const userAPIKey = APIKey.trim();
        if(userAPIKey.length === 0){
            res.status(400).json({message: "Empty API Key"});
            return;
        }
        const response = await aiService.getGroqModels(userAPIKey);
        res.status(200).json(response);
        return;
    }catch(error){
        next(error);
    }
}
export const getOpenRouterModels = async(req:Request, res: Response, next:NextFunction) =>{
    try{
        const { APIKey } = req.body;
        if(!APIKey){
            res.status(400).json({message: "Missing API Key"});
            return;
        }
        const userAPIKey = APIKey.trim();
        if(userAPIKey.length === 0){
            res.status(400).json({message: "Empty API Key"});
            return;
        }
        const response = await aiService.getOpenRouterModels(userAPIKey);
        res.status(200).json(response);
        return;
    }catch(error){
        next(error);
    }
}