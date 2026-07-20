import type { NextFunction, Request, Response } from "express";
import { GroupService } from "../service/group.service";
import { MyError } from "../utils/MyError";
import { checkAdmin } from "../utils/checkPermission";
import { UNAUTHORIZED_ERROR } from "../utils/generalKey";

const groupService = new GroupService();

export const fetchAllGroups = async(req: Request, res: Response, next: NextFunction) => {
    try{
        const isAdmin = checkAdmin(req);
        const groups = await groupService.getGroups(isAdmin);
        res.status(200).json(groups);
    } catch(error){
        next(error);
    }
}
export const createNewGroup = async(req:Request, res:Response, next: NextFunction)=>{
    try{
        if(req.user){
            const response = await groupService.createGroup(req.body.groupName, req.body.permissions);
            await groupService.initUserGroups(response.id, req.body.userIds, checkAdmin(req));
            res.status(201).json(response);
            return;
        }
        throw new MyError(UNAUTHORIZED_ERROR, 401);
    }catch(error){
        next(error);
    }
}
export const deleteGroup = async(req:Request, res:Response, next: NextFunction)=>{
    try{
        if(req.user){
            const groupId = parseInt(req.params.groupId as string, 10);
            const response = await groupService.deleteGroup(groupId, checkAdmin(req));
            res.status(201).json(response);
            return;
        }
        throw new MyError(UNAUTHORIZED_ERROR, 401);
    }catch(error){
        next(error);
    }
}
export const addUserToGroup = async(req:Request, res:Response, next: NextFunction)=>{
    try{
        if(req.user){
            const groupId = parseInt(req.params.groupId as string, 10);
            const response = await groupService.addUserToGroup(groupId, req.body.selectedUsers, checkAdmin(req));
            res.status(201).json(response);
            return;
        }
        throw new MyError(UNAUTHORIZED_ERROR, 401);
    }catch(error){
        next(error);
    }
}
export const removeUserFromGroup = async(req:Request, res:Response, next: NextFunction)=>{
    try{
        if(req.user){
            const groupId = parseInt(req.params.groupId as string, 10);
            const userId = parseInt(req.params.userId as string, 10);
            const response = await groupService.removeUserFromGroup(groupId, userId, checkAdmin(req));
            res.status(201).json(response);
            return;
        }
        throw new MyError(UNAUTHORIZED_ERROR, 401);
    }catch(error){
        next(error);
    }
}
export const updateGroupData = async(req:Request, res:Response, next: NextFunction)=>{
    try{
        if(req.user){
            const groupId = parseInt(req.params.groupId as string, 10);
            const response = await groupService.updateGroup(groupId, req.body.groupName, req.body.permissions, req.body.userIds, checkAdmin(req));
            res.status(201).json(response);
            return;
        }
        throw new MyError(UNAUTHORIZED_ERROR, 401);
    }catch(error){
        next(error);
    }
}
export const viewGroupDetail = async(req:Request, res:Response, next: NextFunction)=>{
    try{
        if(req.user){
            const groupId = parseInt(req.params.groupId as string, 10);
            const response = await groupService.getGroupDetail(groupId, checkAdmin(req));
            res.status(201).json(response);
            return;
        }
        throw new MyError(UNAUTHORIZED_ERROR, 401);
    }catch(error){
        next(error);
    }
}