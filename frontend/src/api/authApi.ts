import type { Group } from "../loader/groupLoader"
import type { User } from "../loader/userLoader"
import { client } from "./apiClient"

type LoginRequest ={
    email: string,
    userPassword:string,
}
type LoginResponse ={
    token: string,
    userData: UserData 
}
type RegisterRequest = {
    email: string,
    fullname: string,
    groups: Group[],
    lang: string
}
type RegisterResponse = {
    userData: User
    emailLink: string
}
type UserData = {
    id: number,
    fullname: string,
    email: string,
    userAccess: boolean,
    groupAccess: boolean,
    active: boolean,
    groups: {id: number, groupName: string}[],
    address?: string;
    phoneNumber?: string;
    APIKey?: string;
}
type ChangePasswordData ={
    currentPassword?: string,
    newPassword: string
}
const loginRequest = client.createRequest<{response: UserData, payload: LoginRequest}>()(
    {
        method:"POST",
        endpoint: "/auth/login",
        options: {
            credentials: "include"
        }
    }
)
const registerRequest = client.createRequest<{response: RegisterResponse, payload: RegisterRequest}>()(
    {
        method: "POST",
        endpoint: "/auth/register",
        options: {
            credentials: "include"
        }
    }
)
const meRequest= client.createRequest<{response:UserData}>()(
    {
        method:"GET",
        endpoint: "/auth/me",
        options: {
            credentials: "include"
        },
        disableRequestInterceptors: true,
        disableResponseInterceptors: true
    }
)
const changePasswordRequest = client.createRequest<{payload: ChangePasswordData}>()(
    {
        method: "PATCH",
        endpoint: "/auth/changePassword",
        options: {
            credentials: "include"
        }
    }
)
const logoutRequest = client.createRequest<{}>()(
    {
        method: "POST",
        endpoint: "/auth/logout",
        options: {
            credentials: "include"
        }
    }
)
const sendResetPasswordMagicLinkRequest = client.createRequest<{payload: {email: string, lang: string}}>()(
    {
        method: "POST",
        endpoint: "/auth/sendResetMagicLink",
    }
)
const verifyResetPasswordTokenRequest = client.createRequest<{payload: {email: string, token: string}}>()(
    {
        method: "POST",
        endpoint: "/auth/verifyResetMagicLink",
    }
)
const resetPasswordRequest = client.createRequest<{payload: {email: string, token: string, newPassword: string}}>()(
    {
        method: "PUT",
        endpoint: "/auth/resetPassword",
    }
)
export const login = async(formData: LoginRequest)=>{
    return await loginRequest.send({payload: formData });
}
export const register = async(formData: RegisterRequest)=>{
    return await registerRequest.send({payload: formData});
}
export const getMe = async()=>{
    return await meRequest.send();
}
export const changePassword = async(formData: ChangePasswordData)=>{
    return await changePasswordRequest.send({payload: formData});
}
export const logout = async()=>{
    return await logoutRequest.send();
}
export const sendResetPasswordMagicLink = async(email: string, lang: string)=>{
    return await sendResetPasswordMagicLinkRequest.send({payload: {email, lang}});
}
export const verifyResetPasswordToken = async(email: string, token: string)=>{
    return await verifyResetPasswordTokenRequest.send({payload: {email, token}});
}
export const resetPassword = async(email: string, token: string, newPassword: string)=>{
    return await resetPasswordRequest.send({payload: {email, token, newPassword}});
}