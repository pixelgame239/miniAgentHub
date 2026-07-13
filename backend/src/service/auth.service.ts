import { prisma } from "../../lib/prisma";
import { redisClient } from "../../server";
import type { LoginRequest, RegisterRequest } from "../dto/auth.dto";
import { EmailService } from "../email/emailService";
import { MyError } from "../utils/MyError";
import { createRandomPassword } from "../utils/passwordGenerator";
import { comparePassword, hashPassword } from "../utils/passwordHashing";
import { generateAccessToken, generateRefreshToken } from "../utils/tokenGenerator";
import { GroupService } from "./group.service";
import jwt, { type SignOptions } from 'jsonwebtoken';

const groupService = new GroupService();
export class AuthService{
    public async authRegister(userData: any, lang: string = "en"){
        const existingUser = await prisma.user.findUnique({where:{email:userData.email}});
        if(existingUser){
            throw new MyError("Email existed", 403);
        }
        //Map through all group IDs and check if any of them is the admin group

        const randomPassword = createRandomPassword();
        const hashedPassword = await hashPassword(randomPassword);
        try {
                await EmailService.sendSMTPEmail(userData.email, userData.fullname, randomPassword, lang);
                console.log(`Email sent to ${userData.email}`);
            } catch (error) {
                console.error(`Failed to send email to ${userData.email}:`, error);
                // Ngăn không cho đăng ký tiếp nếu lỗi gửi mail (Tuỳ bạn quyết định)
                throw new MyError("Cannot send email", 500);
            }
        const newUser = await prisma.user.create({
            data:{
                email: userData.email,
                fullname: userData.fullname,
                userPassword: hashedPassword,
                groups:{
                    connect: userData.groups.map((id:number)=>({id}))
                }
            }, select: {
                id: true,
                fullname:true,
                email: true,
                groups: {
                    select:{
                        id: true,
                        groupName: true
                    }
                },
                active:true
            }
        });
        return {
            message: "Registered successfully, check the link below for the password",
            userData: newUser,
            emailLink: "SENT"
        }
    }
    public async authLogin(userData: any){
        const existingUser = await prisma.user.findUnique({where: {email:userData.email}, include:{
            groups:{
                select:{
                    id: true,
                    groupName: true,
                    permissions:true
                }                
            }
        }});
        if(!existingUser){
            throw new MyError("Email or password is incorrect", 404);
        }
        const passwordCorrect = await comparePassword(userData.userPassword, existingUser.userPassword);
        if(passwordCorrect){
            const userPermissions = existingUser.groups.flatMap((group: any) => group.permissions);
            const tokenPayload = {
                id: existingUser.id,
                email: existingUser.email,
                address: existingUser.address,
                phoneNumber: existingUser.phoneNumber,
                permissions: userPermissions,
                fullname: existingUser.fullname,
                active: existingUser.active,
                groups: existingUser.groups.map((group: any) => ({ id: group.id, groupName: group.groupName }))
            };
            const refreshToken = generateRefreshToken(existingUser.id);
            await redisClient.set(`refreshToken:${refreshToken}`, existingUser.id, {'EX': 7 * 24 * 60 * 60});
            return{
                message: "Logged in!",
                token: generateAccessToken(tokenPayload),
                refreshToken: refreshToken,
                userData: {
                    id: existingUser.id,
                    fullname: existingUser.fullname,
                    email: existingUser.email,
                    address: existingUser.address,
                    phoneNumber: existingUser.phoneNumber,
                    permissions: userPermissions,
                    active: existingUser.active,
                    groups: existingUser.groups.map((group: any) => ({id: group.id, groupName: group.groupName})),
                }
            }
        }
    }
    public async authChangePassword(formData:any){
        const currentUser = await prisma.user.findUnique({where: {id:formData.id}});
        if(!currentUser){
            throw new MyError("Not found", 404);
        }
        if(formData.currentPassword){
            const comparedPassword = await comparePassword(formData.currentPassword, currentUser.userPassword);
            if(!comparedPassword){
                throw new MyError("Current password is incorrect", 400);
            }
        }else if (!formData.currentPassword||formData.currentPassword.trim() === ""){
            if(currentUser.active){
                throw new MyError("Current password is required", 400);
            }
        }
        if(formData.newPassword.length<6){
            throw new MyError("New password cannot be less than 6 characters", 403);
        }
        const hashedPassword = await hashPassword(formData.newPassword);
        const updatedUser = await prisma.user.update({where:{id:formData.id}, data:{userPassword:hashedPassword, active:true}});
        return { message: "Password is successfully updated"};
    }
    public async authRefreshToken(refreshToken: string, accessToken: string){
        if(!refreshToken){
            throw new MyError("Refresh token is required", 400);
        }
        const userId = await redisClient.get(`refreshToken:${refreshToken}`);
        if(!userId){
            throw new MyError("Invalid refresh token", 401);
        }
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string, (err:any, decoded:any) => {
            if(err){
                throw new MyError("Invalid refresh token", 401);
            }
        });
        const decodedAccessToken = jwt.decode(accessToken) as any;
        if(!decodedAccessToken || !decodedAccessToken.id || decodedAccessToken.id.toString() !== userId){
            throw new MyError("Invalid access token", 401);
        }
        await redisClient.del(`refreshToken:${refreshToken}`);
        const newRefreshToken = generateRefreshToken(parseInt(userId));
        await redisClient.set(`refreshToken:${newRefreshToken}`, userId, {'EX': 7 * 24 * 60 * 60});
        const newAccessTokenPayload = {
            id: parseInt(userId),
            email: decodedAccessToken.email,
            address: decodedAccessToken.address,
            phoneNumber: decodedAccessToken.phoneNumber,
            permissions: decodedAccessToken.permissions,
            fullname: decodedAccessToken.fullname,
            active: decodedAccessToken.active,
            groups: decodedAccessToken.groups
        };
        const newAccessToken = generateAccessToken(newAccessTokenPayload);
        return {
            message: "Token refreshed!",
            token: newAccessToken,
            refreshToken: newRefreshToken
        }
    }
}