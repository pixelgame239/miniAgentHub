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
    groups: number[],
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
const loginRequest = client.createRequest<{response: LoginResponse, payload: LoginRequest}>()(
    {
        method:"POST",
        endpoint: "/auth/login"
    }
)
const registerRequest = client.createRequest<{response: RegisterResponse, payload: RegisterRequest}>()(
    {
        method: "POST",
        endpoint: "/auth/register",
        auth: true
    }
)
const meRequest= client.createRequest<{response:UserData}>()(
    {
        method:"GET",
        endpoint: "/auth/me",
        auth:true
    }
)
const changePasswordRequest = client.createRequest<{payload: ChangePasswordData}>()(
    {
        method: "PATCH",
        endpoint: "/auth/changePassword",
        auth:true
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