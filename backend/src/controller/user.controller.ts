import type { NextFunction, Request, Response } from "express";
import { UserService } from "../service/user.service";
import { MyError } from "../utils/MyError";

const userService = new UserService();

export const fetchAllUsers = async(req: Request, res: Response, next: NextFunction) =>{
    try{
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch(error){
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
        }
        throw new MyError("Unauthorized", 401);
    }catch(error){
        next(error);
    }
}