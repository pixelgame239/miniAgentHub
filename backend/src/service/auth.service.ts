import { prisma } from "../../lib/prisma";
import type { LoginRequest, RegisterRequest } from "../dto/auth.dto";
import { EmailService } from "../email/emailService";
import { MyError } from "../utils/MyError";
import { createRandomPassword } from "../utils/passwordGenerator";
import { comparePassword, hashPassword } from "../utils/passwordHashing";
import { generateAccessToken } from "../utils/tokenGenerator";

export class AuthService{
    public async authRegister(userData: any){
        const existingUser = await prisma.user.findUnique({where:{email:userData.email}});
        if(existingUser){
            throw new MyError("Email existed", 403);
        }
        const roleInfo = await prisma.role.findUnique({
            where: { 
                roleId: userData.userRole 
            }
        });

        if (!roleInfo) {
            throw new MyError("Role not found", 404);
        }
        const randomPassword = createRandomPassword();
        const hashedPassword = await hashPassword(randomPassword)
        const newUser = await prisma.user.create({
            data:{
                email: userData.email,
                fullname: userData.fullname,
                userPassword: hashedPassword,
                userRole: userData.userRole,
                permission: roleInfo.permission,
                groups:{
                    connect: userData.groups.map((id:number)=>({id}))
                }
            }, select: {
                id: true,
                fullname:true,
                email: true,
                userRole:true,
                groups: {
                    select:{
                        id: true,
                        groupName: true
                    }
                },
                active:true
            }
        });
        const emailLink = await EmailService.sendFakeWelcomeEmail(newUser.email, newUser.fullname, randomPassword);
        return {
            message: "Registered successfully, check the link below for the password",
            emailLink: emailLink
        }
    }
    public async authLogin(userData: any){
        const existingUser = await prisma.user.findUnique({where: {email:userData.email}, include:{
            role:{
                select:{
                    permission:true
                }                
            }
        }});
        if(!existingUser){
            throw new MyError("Email or password is incorrect", 404);
        }
        const passwordCorrect = await comparePassword(userData.userPassword, existingUser.userPassword);
        if(passwordCorrect){
            const userPermissions = existingUser.role?.permission;
            return{
                message: "Logged in!",
                token: generateAccessToken(existingUser.id, existingUser.email, existingUser.userRole, existingUser.fullname, existingUser.active, userPermissions),
                userData: {
                    id: existingUser.id,
                    fullname: existingUser.fullname,
                    email: existingUser.email,
                    userRole: existingUser.userRole,
                    active: existingUser.active
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

        }
        if(formData.newPassword.length<6){
            throw new MyError("New password cannot be less than 6 characters", 403);
        }
        const hashedPassword = await hashPassword(formData.newPassword);
        const updatedUser = await prisma.user.update({where:{id:formData.id}, data:{userPassword:hashedPassword, active:true}});
        return { message: "Password is successfully updated"};
    }
}