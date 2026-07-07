import { prisma } from "../../lib/prisma";
import type { LoginRequest, RegisterRequest } from "../dto/auth.dto";
import { EmailService } from "../email/emailService";
import { MyError } from "../utils/MyError";
import { createRandomPassword } from "../utils/passwordGenerator";
import { comparePassword, hashPassword } from "../utils/passwordHashing";
import { generateAccessToken } from "../utils/tokenGenerator";

export class AuthService{
    public async authRegister(userData: any, lang: string = "en"){
        const existingUser = await prisma.user.findUnique({where:{email:userData.email}});
        if(existingUser){
            throw new MyError("Email existed", 403);
        }
        const randomPassword = createRandomPassword();
        const hashedPassword = await hashPassword(randomPassword)
        try {
                await EmailService.sendSMTPEmail(userData.email, userData.fullname, randomPassword, lang);
                console.log(`Email sent to ${userData.email}`);
            } catch (error) {
                console.error(`Failed to send email to ${userData.email}:`, error);
                // Ngăn không cho đăng ký tiếp nếu lỗi gửi mail (Tuỳ bạn quyết định)
                throw new MyError("Không thể gửi email kích hoạt, vui lòng thử lại.", 500);
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
            // let userAccess = false;
            // let groupAccess = false;
            // if(userPermissions.some((permission: string) => permission.startsWith("USER"))){
            //     userAccess = true;
            // }
            // if(userPermissions.some((permission: string) => permission.startsWith("GROUP"))){
            //     groupAccess = true;
            // }
            // console.log("User permissions:", userPermissions);
            return{
                message: "Logged in!",
                token: generateAccessToken(existingUser.id, existingUser.email, existingUser.address, existingUser.phoneNumber, userPermissions, existingUser.fullname, existingUser.active, existingUser.groups.map((group: any) => ({ id: group.id, groupName: group.groupName }))),
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
}