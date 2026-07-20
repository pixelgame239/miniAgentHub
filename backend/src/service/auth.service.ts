import { prisma } from "../../lib/prisma";
import { redisClient } from "../../server";
import type { LoginRequest, RegisterRequest } from "../dto/auth.dto";
import { EmailService } from "../email/emailService";
import { checkAdmin } from "../utils/checkPermission";
import { NOT_FOUND_ERROR } from "../utils/generalKey";
import { MyError } from "../utils/MyError";
import { createRandomMagicLink, createRandomPassword } from "../utils/passwordGenerator";
import { comparePassword, hashPassword } from "../utils/passwordHashing";
import { generateAccessToken, generateRefreshToken } from "../utils/tokenGenerator";
import { GroupService } from "./group.service";
import jwt, { type SignOptions } from 'jsonwebtoken';

const groupService = new GroupService();
export class AuthService{
    public async authRegister(userData: any, lang: string = "en"){
        const existingUser = await prisma.user.findUnique({where:{email:userData.email}});
        if(existingUser){
            throw new MyError("Email existed", 409);
        }
        //Map through all group IDs and check if any of them is the admin group

        const randomPassword = createRandomPassword();
        const hashedPassword = await hashPassword(randomPassword);
        const newUser = await prisma.user.create({
            data:{
                email: userData.email,
                fullname: userData.fullname,
                userPassword: hashedPassword,
                groups:{
                    connect: userData.groups.map((group: { id: number }) => ({ id: group.id }))
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
        try{
            await EmailService.sendSMTPEmail(userData.email, userData.fullname, randomPassword, lang);
            console.log(`Email sent to ${userData.email}`);
        } catch (error) {
            console.error(`Failed to send email to ${userData.email}:`, error);
            // Ngăn không cho đăng ký tiếp nếu lỗi gửi mail (Tuỳ bạn quyết định)
            throw new MyError("Cannot send email", 500);
        }
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
            await redisClient.set(`refreshToken:${refreshToken}`, String(existingUser.id), {'EX': 7 * 24 * 60 * 60});
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
        }else{
            throw new MyError("Email or password is incorrect", 404);
        }
    }
    public async authChangePassword(formData:any){
        const currentUser = await prisma.user.findUnique({where: {id:formData.id}});
        if(!currentUser){
            throw new MyError(NOT_FOUND_ERROR, 404);
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
    public async authLogout(refreshToken: string){
        if(!refreshToken){
            throw new MyError("Refresh token is required", 400);
        }
        const userId = await redisClient.get(`refreshToken:${refreshToken}`);
        if(!userId){
            throw new MyError("Invalid refresh token", 401);
        }
        await redisClient.del(`refreshToken:${refreshToken}`);
        return { message: "Logged out successfully"};
    }
        public async sendResetPasswordMagicLink(email: string, lang: string = "en") {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return { message: "If the email exists, a reset password email has been sent" };
        }
        if(await redisClient.get(`resetPassword:${email}`)){
            throw new MyError(lang==="vi"? "Một email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư đến hoặc đợi 5 phút trước khi yêu cầu lại." : "A reset password email has already been sent. Please check your inbox or wait for 5 minutes before requesting again.", 429);
        }
        const randomMagicLinkToken = createRandomMagicLink();
        await redisClient.set(`resetPassword:${email}`, randomMagicLinkToken, {'EX': 300});
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        const resetPasswordLink = `${frontendUrl}/resetPassword?token=${randomMagicLinkToken}&email=${encodeURIComponent(email)}`;
        await EmailService.sendResetPasswordEmail(email, resetPasswordLink, lang);
        return { message: "Reset password email sent" };
    }
    public async verifyResetPasswordToken(email: string, token: string) {
        const storedToken = await redisClient.get(`resetPassword:${email}`);
        if (storedToken === token) {
            return true;
        } else {
            console.error(`[Token Verification] Invalid or expired token for email: ${email}`);
            return false;
        }
    }
    public async resetPassword(email: string, token: string, newPassword: string) {
        const isTokenValid = await this.verifyResetPasswordToken(email, token);
        if (!isTokenValid) {
            throw new MyError("Invalid or expired token", 400);
        }
        if (newPassword.length < 6) {
            throw new MyError("New password cannot be less than 6 characters", 400);
        }
        const hashedPassword = await hashPassword(newPassword);
        await prisma.user.update({
            where: { email },
            data: { userPassword: hashedPassword }
        });
        await redisClient.del(`resetPassword:${email}`);
        return { message: "Password has been reset successfully" };
    }
    public async getUserMetadata(userId: number) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                fullname: true,
                address: true,
                phoneNumber: true,
                active: true,
                groups: {
                    select: {
                        id: true,
                        groupName: true,
                        permissions: true
                    }
                }
            }
        });
        if (!user) {
            throw new MyError(NOT_FOUND_ERROR, 404);
        }
        return { 
            id: user.id,
            email: user.email,
            address: user.address,
            phoneNumber: user.phoneNumber,
            permissions: user.groups.flatMap((group: any) => group.permissions || []),
            fullname: user.fullname,
            active: user.active,
            groups: user.groups.map((group: any) => ({ id: group.id, groupName: group.groupName }))
         };
    }
}