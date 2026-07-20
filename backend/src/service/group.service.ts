import { prisma } from "../../lib/prisma"
import { FORBIDDEN_ERROR } from "../utils/generalKey";
import { MyError } from "../utils/MyError";
import { UserService } from "./user.service";

const userService = new UserService();
export class GroupService{
    public async checkIfModifyAdminGroup(groupId:number){
        const group = await prisma.group.findUnique({where:{id: groupId}, select:{groupName:true}});
        return group?.groupName === "ADMIN";
    }
    public async getGroups(isAdmin:boolean){
        const groupData = await prisma.group.findMany({select:{
            id: true,
            groupName:true,
            permissions:true,
            _count:{
                select:{
                    users:true
                }
            }
        }});
        let response;
        if(isAdmin){
            response = groupData.map(group=>({
                id:group.id,
                groupName:group.groupName,
                totalUsers: group._count.users,
                permissions: group.permissions
            }));
        }else{
            const filteredGroupData = groupData.filter(group => group.groupName !== "ADMIN");
            response = filteredGroupData.map(group=>({
                id:group.id,
                groupName:group.groupName,
                totalUsers: group._count.users,
                permissions: group.permissions
            }));
        }
        return response;
    }
    public async createGroup(groupName:string, permissions:string[]){
        const response = await prisma.group.create({data:{groupName: groupName, permissions: permissions}, select:{
            id: true,
            groupName:true,
            permissions:true,
            _count:{
                select:{
                    users:true
                }
            }
        }});
        return {
            id:response.id,
            groupName:response.groupName,
            totalUsers: response._count.users,
            permissions: response.permissions
        };
    }

    public async addUserToGroup(groupId:number, selectedUser:{id:number, groups:{id:number, groupName:string}[]}[], isAdmin:boolean){
        const isAdminGroup = await this.checkIfModifyAdminGroup(groupId);
        if(isAdminGroup){
            if(!isAdmin){
                throw new MyError(FORBIDDEN_ERROR,403);
            }
        }
        const isTargetAdmin = selectedUser.some(user => user.groups.some(group => group.groupName === "ADMIN"));
        if(isTargetAdmin && !isAdmin){
            throw new MyError(FORBIDDEN_ERROR,403);
        }
        const response = await prisma.group.update({
            where: {
                id: groupId
            },
            data: {
                users: {
                    connect: selectedUser.map(user => ({ id: user.id }))
                }
            }
        });
        return response;
    }
    public async initUserGroups(groupId:number, userIds:number[], isAdmin:boolean){
        const isContainedAdmin = await prisma.user.findFirst({where:{id:{in:userIds}, groups:{some:{groupName:"ADMIN"}}}});
        if(isContainedAdmin && !isAdmin){
            throw new MyError(FORBIDDEN_ERROR,403);
        }
        const response = await prisma.group.update({
            where: {
                id: groupId
            },
            data: {
                users: {
                    connect: userIds.map((id) => ({ id: id }))
                }
            }
        });
        return response;
    }
    public async deleteGroup(groupId:number, isAdmin:boolean){
        const isAdminGroup = await this.checkIfModifyAdminGroup(groupId);
        if(isAdminGroup){
            if(!isAdmin){
                throw new MyError(FORBIDDEN_ERROR,403);
            }
        }
        const response = await prisma.group.delete({where:{id: groupId}});
        return response;
    }
    public async removeUserFromGroup(groupId:number, userId:number, isAdmin:boolean){
        const isAdminGroup = await this.checkIfModifyAdminGroup(groupId);
        if(isAdminGroup){
            if(!isAdmin){
                throw new MyError(FORBIDDEN_ERROR,403);
            }
        }
        const isTargetAdmin = await userService.checkIfUserIsAdmin(userId);
        if(isTargetAdmin && !isAdmin){
            throw new MyError(FORBIDDEN_ERROR,403);
        }
        const response = await prisma.group.update({
            where: {
                id: groupId
            },
            data: {
                users: {
                    disconnect: {
                        id: userId
                    }
                }
            }
        });
        return response;
    }
    public async updateGroup(groupId:number, groupName:string, permissions:string[], userIds: number[], isAdmin:boolean){
        const isAdminGroup = await this.checkIfModifyAdminGroup(groupId);
        if(isAdminGroup){
            if(!isAdmin){
                throw new MyError(FORBIDDEN_ERROR,403);
            }
        }
        const response = await prisma.group.update({where:{id: groupId}, data:{groupName: groupName, permissions: permissions, users:{
            set: userIds.map((id) => ({ id: id }))
        } }, select:{
            id: true,
            groupName:true,
            permissions:true,
            _count:{
                select:{
                    users:true
                }
            }
        }});
        return {
            id:response.id,
            groupName:response.groupName,
            totalUsers: response._count.users,
            permissions: response.permissions
        };
    }
    public async getGroupDetail(groupId:number, isAdmin:boolean){
        const isAdminGroup = await this.checkIfModifyAdminGroup(groupId);
        if(isAdminGroup){
            if(!isAdmin){
                throw new MyError(FORBIDDEN_ERROR,403);
            }
        }
        const response = await prisma.group.findFirst({where:{id: groupId}, 
            include:{
                users:{
                    select:{
                        id: true,
                        fullname: true,
                        email: true
                    }
                }}});
        return response;
    }
};