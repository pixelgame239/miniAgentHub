import type { NextFunction, Request, Response } from "express";
import { UserService } from "../service/user.service";
import { MyError } from "../utils/MyError";
import { checkPermission } from "../utils/checkPermission";
import { error } from "node:console";

const userService = new UserService();

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
            throw new MyError("Forbidden", 403);
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
            if(isNaN(userId)) throw new MyError("Forbidden", 403);
            const response =await userService.updateUser(userId, req.body);
            res.status(201).json(response);
            return;
        }
        throw new MyError("Unauthorized", 401);
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
        throw new MyError("Forbidden", 403);
    }catch(error){
        next(error)
    }
}

export const deleteUser = async(req:Request, res: Response, next:NextFunction)=>{
    try{
        if(req.user){
            const userId = parseInt(req.params.userId as string,10);
            if(isNaN(userId)) throw new MyError("Forbidden", 403);
            const response =await userService.deleteUser(userId);
            res.status(201).json(response);
            return;
        }
        throw new MyError("Unauthorized", 401);
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
        throw new MyError("Unauthorized", 401);
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
        throw new MyError("Unauthorized", 401);
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
        throw new MyError("Unauthorized", 401);
    }catch(error){
        next(error);
    }
}
export const updateAIConfig = async(req:Request, res:Response, next:NextFunction)=>{
    try{
        if(req.user){
            const userId = req.user.id;
            const {FlowiseAPIKey, FlowiseURL, DeepSeekAPIKey} = req.body;
            const response = await userService.updateAIConfig(userId, {FlowiseAPIKey, FlowiseURL, DeepSeekAPIKey});
            res.status(201).json(response);
            return;
        }
        throw new MyError("Unauthorized", 401);
    }catch(error){
        next(error);
    }
}