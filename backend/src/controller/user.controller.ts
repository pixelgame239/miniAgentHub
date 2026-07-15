import type { NextFunction, Request, Response } from "express";
import { UserService } from "../service/user.service";
import { MyError } from "../utils/MyError";
import { AIService } from "../service/ai.service";
import { checkAdmin } from "../utils/checkPermission";
import { FORBIDDEN_ERROR, UNAUTHORIZED_ERROR } from "../utils/generalKey";

const userService = new UserService();
const aiService = new AIService();
export const fetchAllUsers = async(req: Request, res: Response, next: NextFunction) =>{
    try{
        const users = await userService.getAllUsers();
        res.status(200).json(users);
        return;
    } catch(error){
        next(error);
    }
}
export const getGroupUsers = async(req: Request, res: Response, next: NextFunction)=>{
    try{
        if(!req.params.groupId){
            throw new MyError(FORBIDDEN_ERROR, 403);
        }
        const groupId = parseInt(req.params.groupId as string,10);
        const users = await userService.getGroupUsers(groupId);
        res.status(200).json(users);
        return;
    }catch(error){
        next(error);
    }
}
export const updateUser = async(req:Request, res: Response, next:NextFunction)=>{
    try{
        if(req.user){
            const userId = parseInt(req.params.userId as string,10);
            if(isNaN(userId)) throw new MyError(FORBIDDEN_ERROR, 403);
            if(req.body.groups.some((group:any)=> group.groupName === "ADMIN")){
                const isAdmin = checkAdmin(req);
                if(!isAdmin){
                    throw new MyError(FORBIDDEN_ERROR, 403);
                }
            }
            const isTargetAdmin = await userService.checkIfUserIsAdmin(userId);
            if(isTargetAdmin && !checkAdmin(req)){
                throw new MyError(FORBIDDEN_ERROR, 403);
            }
            const response =await userService.updateUser(userId, req.body);
            res.status(201).json(response);
            return;
        }
        throw new MyError(UNAUTHORIZED_ERROR, 401);
    }catch(error){
        next(error);
    }
}
export const findUsers = async(req: Request, res: Response, next: NextFunction)=>{
    try{
        if(req.user){
            const input = req.query.input as string;
            const response = await userService.queryUser(input);
            res.status(200).json(response);
            return;
        }
        throw new MyError(FORBIDDEN_ERROR, 403);
    }catch(error){
        next(error)
    }
}

export const deleteUser = async(req:Request, res: Response, next:NextFunction)=>{
    try{
        if(req.user){
            const userId = parseInt(req.params.userId as string,10);
            if(isNaN(userId)) throw new MyError(FORBIDDEN_ERROR, 403);
            const isTargetAdmin = await userService.checkIfUserIsAdmin(userId);
            if(isTargetAdmin && !checkAdmin(req)){
                throw new MyError(FORBIDDEN_ERROR, 403);
            }
            const response =await userService.deleteUser(userId);
            res.status(201).json(response);
            return;
        }
        throw new MyError(UNAUTHORIZED_ERROR, 401);
    }catch(error){
        next(error);
    }
}
export const deleteAccount = async(req:Request, res:Response, next:NextFunction)=>{
    try{
        if(req.user){
            const response= await userService.deleteUser(req.user.id);
            res.status(201).json(response);
            return;
        }
        throw new MyError(UNAUTHORIZED_ERROR, 401);
    }catch(error){
        next(error);
    }
}
export const updateAddress = async(req:Request, res:Response, next:NextFunction)=>{
    try{
        if(req.user){
            const userId = req.user.id;
            const {address} = req.body;
            const response = await userService.updateAddress(userId, address);
            res.status(201).json(response);
            return;
        }
        throw new MyError(UNAUTHORIZED_ERROR, 401);
    }catch(error){
        next(error);
    }
}
export const updatePhoneNumber = async(req:Request, res:Response, next:NextFunction)=>{
    try{
        if(req.user){
            const userId = req.user.id;
            const {phoneNumber} = req.body;
            const response = await userService.updatePhoneNumber(userId, phoneNumber);
            res.status(201).json(response);
            return;
        }
        throw new MyError(UNAUTHORIZED_ERROR, 401);
    }catch(error){
        next(error);
    }
}
export const updateAIConfig = async(req:Request, res:Response, next:NextFunction)=>{
    try{
        if(req.user){
            const userId = req.user.id;
            const {FlowiseAPIKey, FlowiseURL, GroqAPIKey, OpenRouterAPIKey} = req.body;
            if(GroqAPIKey){
                try{
                    await aiService.getGroqModels(GroqAPIKey);
                }
                catch(error){
                    throw new MyError("Invalid Groq API Key", 400);
                }
            }
            else if(OpenRouterAPIKey){
                try{
                    await aiService.getOpenRouterModels(OpenRouterAPIKey);
                }
                catch(error){
                    throw new MyError("Invalid OpenRouter API Key", 400);
                }
            }
            const response = await userService.updateAIConfig(userId, {FlowiseAPIKey, FlowiseURL, GroqAPIKey, OpenRouterAPIKey});
            res.status(201).json(response);
            return;
        }
        throw new MyError(UNAUTHORIZED_ERROR, 401);
    }catch(error){
        next(error);
    }
}
export const resendVerificationEmail = async(req:Request, res:Response, next:NextFunction)=>{
    try{
        if(req.user){
            const isAdmin = checkAdmin(req);
            if(!isAdmin){
                throw new MyError(FORBIDDEN_ERROR, 403);
            }
            const userId = req.body.userId;
            const lang = req.body.lang as string || "en";
            const email = req.body.email as string;
            const fullName = req.body.fullName as string;
            const response = await userService.resendVerificationEmail(userId, email, fullName, lang);
            res.status(201).json(response);
            return;
        }
        throw new MyError(UNAUTHORIZED_ERROR, 401);
    }catch(error){
        next(error);
    }
}