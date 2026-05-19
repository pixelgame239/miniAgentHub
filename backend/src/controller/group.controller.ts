import type { NextFunction, Request, Response } from "express";
import { GroupService } from "../service/group.service";
import { MyError } from "../utils/MyError";

const groupService = new GroupService();

export const fetchAllGroups = async(req: Request, res: Response, next: NextFunction) => {
    try{
        const groups = await groupService.getGroups();
        res.status(200).json(groups);
    } catch(error){
        next(error);
    }
}
export const fetchUserGroups = async(req:Request, res:Response, next: NextFunction)=>{
    try{
        if(req.user){
            const groups = await groupService.getUserGroups(req.user.id);
            res.status(200).json(groups);
        }
        throw new MyError("Unauthorized", 401);
    }catch(error){
        next(error);
    }
}