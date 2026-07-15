import type { Group } from "../loader/groupLoader";
import type { User } from "../loader/userLoader";
import { client } from "./apiClient";   

type UpdateRequestType = {
    fullname: string,
    groups: Group[]
}
const getUserRequest = client.createRequest<{response:User[]}>()(
    {
        method:"GET",
        endpoint: "/users/",
        options: {
            credentials: "include"
        }
    }
)
const updateUserRequest = client.createRequest<{payload: UpdateRequestType, params: {userId: string|number}}>()({
    endpoint: "/users/updateUser/:userId",
    method:"PUT",
    options: {
        credentials: "include"
    }
});
const deleteUserRequest = client.createRequest<{params: {userId: string|number}}>()({
    endpoint: "/users/deleteUser/:userId",
    method:"DELETE",
    options: {
        credentials: "include"
    }
});
const deleteAccountRequest = client.createRequest()({
    endpoint:"/users/deleteAccount",
    method:"DELETE",
    options: {
        credentials: "include"
    }
});
const getGroupUsersRequest =client.createRequest<{params:{groupId:number}}>()({
    method:"GET",
    endpoint: "/users/:groupId",
    options: {
        credentials: "include"
    }
});
const findUsersRequest = client.createRequest<{queryParams:{input: string}}>()({
    method:"GET",
    endpoint:"/users/find",
    options: {
        credentials: "include"
    }
})
const updateAddressRequest = client.createRequest<{payload: {address: string}, params: {userId: string|number}}>()({
    endpoint: "/users/updateAddress/:userId",
    method:"PUT",
    options: {
        credentials: "include"
    }
});
const updatePhoneNumberRequest = client.createRequest<{payload: {phoneNumber: string}, params: {userId: string|number}}>()({
    endpoint: "/users/updatePhoneNumber/:userId",
    method:"PUT",
    options: {
        credentials: "include"
    }
});
const updateUserAIConfigRequest = client.createRequest<{payload: {FlowiseAPIKey?: string, FlowiseURL?: string, GroqAPIKey?: string, OpenRouterAPIKey?: string}, params: {userId: string|number}}>()({
    endpoint: "/users/updateAIConfig/:userId",
    method:"PUT",
    options: {
        credentials: "include"
    }
});
const resendVerificationEmailRequest = client.createRequest<{payload: {userId: number, email: string, fullname: string, lang: string}}>()({
    endpoint: "/users/resendVerificationEmail",
    method:"POST",
    options: {
        credentials: "include"
    }
});
export const getUsers = async()=>{
    return await getUserRequest.send();
} 
export const findUsers = async(input:string)=>{
    return await findUsersRequest.send({queryParams:{input}});
}
export const getGroupUsers = async(groupId:number)=>{
    return await getGroupUsersRequest.send({params:{groupId}})
}
export const updateUser = async(formData:UpdateRequestType, userId:any)=>{
    return await updateUserRequest.send({payload: formData, params: {userId}});
}
export const deleteUser = async(userId:any)=>{
    return await deleteUserRequest.send({params: {userId}});
}
export const deleteAccount= async()=>{
    return await deleteAccountRequest.send();
}
export const updateAddress = async(address:string, userId:any)=>{
    return await updateAddressRequest.send({payload: {address: address}, params: {userId}});
}
export const updatePhoneNumber = async(phoneNumber:string, userId:any)=>{
    return await updatePhoneNumberRequest.send({payload: {phoneNumber: phoneNumber}, params: {userId}});
}
export const updateUserAIConfig = async(aiConfig: {FlowiseAPIKey?: string, FlowiseURL?: string, GroqAPIKey?: string, OpenRouterAPIKey?: string}, userId:any)=>{
    return await updateUserAIConfigRequest.send({payload: aiConfig, params: {userId}});
}
export const resendVerificationEmail = async(userId:number, email:string, fullname:string, lang:string)=>{
    return await resendVerificationEmailRequest.send({payload: {userId, email, fullname, lang}});
}