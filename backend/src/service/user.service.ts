import { prisma } from "../../lib/prisma";
import { redisClient } from "../../server";
import { EmailService } from "../email/emailService";
import { encrypt } from "../utils/APIHash";
import { NOT_FOUND_ERROR } from "../utils/generalKey";
import { MyError } from "../utils/MyError";
import { createRandomMagicLink, createRandomPassword } from "../utils/passwordGenerator";
import { hashPassword } from "../utils/passwordHashing";
import fs from "fs";

export class UserService{
    public async getAllUsers(page: number =0, isAdmin: boolean){
        const response = await prisma.user.findMany({
            ...(!isAdmin && {
                where: {
                    groups: {
                        none: {
                            groupName: 'ADMIN'
                        }
                    }
                }
            }),
            take: 10,
            skip: page * 10,
            select:{
            id:true,
            fullname:true,
            email:true,
            groups: {
                select:{
                    id: true,
                    groupName: true
                }
            },
            active:true
        }});
        return response;
    }
    public async countUser(isAdmin:boolean){
        const response = await prisma.user.count({
            ...(!isAdmin && {
                where: {
                    groups: {
                        none: {
                            groupName: 'ADMIN'
                        }
                    }
                }
            })
        });
        const totalPages = Math.ceil(response / 10);
        return totalPages;
    }
    public async checkIfUserIsAdmin(userId: number): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                groups: true,
            },
        });
    
        if (!user) {
            throw new MyError(NOT_FOUND_ERROR, 404);
        }
    
        return user.groups.some(group => group.groupName === "ADMIN");
    }
    public async updateUser(userId: number, formData: any){
        const response = await prisma.user.update({where:{
            id: userId
        }, data:{
            fullname: formData.fullname,
            groups:{
                set: formData.groups.map((group: { id: number }) => ({ id: group.id }))
            }
        }, include:{
            groups:true
        }});
        return response;
    }
    public async deleteUser(userId:number){
        const response = await prisma.user.delete({where:{id: userId}});
        await fs.promises.rm(`./files/${userId}`, { recursive: true, force: true });
        return response;
    }
    public async getGroupUsers(groupId:number, isAdmin: boolean){
        const response = await prisma.user.findMany({where:{
            groups:{
                some:{
                    id:groupId
                },
                ...(!isAdmin && {
                    none: {
                        groupName: 'ADMIN'
                    }
                })
            }
        }, select:{
            id:true,
            fullname:true,
            email:true,
            groups: {
                select:{
                    id: true,
                    groupName: true
                }
            },
        }});
        return response;
    }
    public async queryUser(input: string, isAdmin:boolean) {
        const response = await prisma.user.findMany({
            where: {
                OR: [
                    { 
                        email: { 
                            contains: input, 
                            mode: 'insensitive' 
                        } 
                    },
                    { 
                        fullname: { 
                            contains: input, 
                            mode: 'insensitive' 
                        } 
                    }
                ],
                ...(!isAdmin && {
                groups: {
                    none: {
                        groupName: 'ADMIN'
                    }
                }
            })
            },
            take: 10,
            select:{
                id:true,
                fullname: true,
                email:true,
                groups: {
                    select:{
                        id: true,
                        groupName: true
                    }
                },
            }
        });
        return response;
    }
    public async updateAddress(userId: number, address: string){
        const response = await prisma.user.update({
            where: { id: userId },
            data: { address }
        });
        return response;
    }
    public async updatePhoneNumber(userId: number, phoneNumber: string){
        const response = await prisma.user.update({
            where: { id: userId },
            data: { phoneNumber }
        });
        return response;
    }
    public async updateAIConfig(userId: number, config: { flowiseApiKey?: string; flowiseUrl?: string; groqApiKey?: string; openRouterApiKey?: string; }){
        if(config.flowiseApiKey && config.flowiseApiKey.trim() !== ""){
            const encryptedFlowiseAPIKey = encrypt(config.flowiseApiKey);
            config.flowiseApiKey = encryptedFlowiseAPIKey;
        }
        if(config.groqApiKey && config.groqApiKey.trim() !== ""){
            const encryptedGroqAPIKey = encrypt(config.groqApiKey);
            config.groqApiKey = encryptedGroqAPIKey;
        }
        if(config.openRouterApiKey && config.openRouterApiKey.trim() !== ""){
            const encryptedOpenRouterAPIKey = encrypt(config.openRouterApiKey);
            config.openRouterApiKey = encryptedOpenRouterAPIKey;
        }
        if(config.flowiseUrl && config.flowiseUrl.trim() !== ""){
            const encryptedFlowiseUrl = encrypt(config.flowiseUrl);
            config.flowiseUrl = encryptedFlowiseUrl;
        }
        const response = await prisma.user.update({
            where: { id: userId },
            data: config
        });
        return response;
    }
    public async resendVerificationEmail(userId: number, email: string, fullName: string, lang: string = "en"){
        const temporaryPassword = createRandomPassword(); 
        const newHashedPassword = await hashPassword(temporaryPassword);
        await prisma.user.update({
            where: { id: userId },
            data: { userPassword: newHashedPassword }
        });
        await EmailService.sendSMTPEmail(email, fullName, temporaryPassword, lang);
        
        return { message: "Verification email sent" };
    }
}