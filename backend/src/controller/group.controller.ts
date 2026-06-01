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
// export const fetchUserGroups = async(req:Request, res:Response, next: NextFunction)=>{
//     try{
//         if(req.user){
//             const groups = await groupService.getUserGroups(req.user.id);
//             res.status(200).json(groups);
//         }
//         throw new MyError("Unauthorized", 401);
//     }catch(error){
//         next(error);
//     }
// }
export const createNewGroup = async(req:Request, res:Response, next: NextFunction)=>{
    try{
        if(req.user){
            const response = await groupService.createGroup(req.body.groupName, req.body.permissions);
            await groupService.addUserToGroup(response.id, req.body.userIds);
            res.status(201).json({ message: "Group created successfully"});
            return;
        }
        throw new MyError("Unauthorized", 401);
    }catch(error){
        next(error);
    }
}
export const deleteGroup = async(req:Request, res:Response, next: NextFunction)=>{
    try{
        if(req.user){
            const groupId = parseInt(req.params.groupId as string, 10);
            const response = await groupService.deleteGroup(groupId);
            res.status(201).json(response);
            return;
        }
        throw new MyError("Unauthorized", 401);
    }catch(error){
        next(error);
    }
}
export const addUserToGroup = async(req:Request, res:Response, next: NextFunction)=>{
    try{
        if(req.user){
            const groupId = parseInt(req.params.groupId as string, 10);
            const response = await groupService.addUserToGroup(groupId, req.body.userIds);
            res.status(201).json(response);
            return;
        }
        throw new MyError("Unauthorized", 401);
    }catch(error){
        next(error);
    }
}
export const removeUserFromGroup = async(req:Request, res:Response, next: NextFunction)=>{
    try{
        if(req.user){
            const groupId = parseInt(req.params.groupId as string, 10);
            const userId = parseInt(req.params.userId as string, 10);
            const response = await groupService.removeUserFromGroup(groupId, userId);
            res.status(201).json(response);
            return;
        }
        throw new MyError("Unauthorized", 401);
    }catch(error){
        next(error);
    }
}
export const updateGroupData = async(req:Request, res:Response, next: NextFunction)=>{
    try{
        if(req.user){
            const groupId = parseInt(req.params.groupId as string, 10);
            const response = await groupService.updateGroup(groupId, req.body.groupName, req.body.permissions);
            res.status(201).json(response);
            return;
        }
        throw new MyError("Unauthorized", 401);
    }catch(error){
        next(error);
    }
}
export const viewGroupDetail = async(req:Request, res:Response, next: NextFunction)=>{
    try{
        if(req.user){
            const groupId = parseInt(req.params.groupId as string, 10);
            const response = await groupService.getGroupDetail(groupId);
            res.status(201).json(response);
            return;
        }
        throw new MyError("Unauthorized", 401);
    }catch(error){
        next(error);
    }
}