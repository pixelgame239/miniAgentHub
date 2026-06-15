import type { User } from "../loader/userLoader";
import { client } from "./apiClient";   

type UpdateRequestType = {
    fullname: string,
    groups: number[]
}
const getUserRequest = client.createRequest<{response:User[]}>()(
    {
        method:"GET",
        endpoint: "/users/",
        auth: true
    }
)
const updateUserRequest = client.createRequest<{payload: UpdateRequestType, params: {userId: string|number}}>()({
    endpoint: "/users/updateUser/:userId",
    method:"PUT",
    auth:true
});
const deleteUserRequest = client.createRequest<{params: {userId: string|number}}>()({
    endpoint: "/users/deleteUser/:userId",
    method:"DELETE",
    auth:true
})
const deleteAccountRequest = client.createRequest()({
    endpoint:"/users/deleteAccount",
    method:"DELETE",
    auth:true
})
const getGroupUsersRequest =client.createRequest<{params:{groupId:number}}>()({
    method:"GET",
    endpoint: "/users/:groupId",
    auth: true
});
const findUsersRequest = client.createRequest<{queryParams:{input: string}}>()({
    method:"GET",
    endpoint:"/users/find",
    auth:true
})
const updateAddressRequest = client.createRequest<{payload: {address: string}, params: {userId: string|number}}>()({
    endpoint: "/users/updateAddress/:userId",
    method:"PUT",
    auth:true
});
const updatePhoneNumberRequest = client.createRequest<{payload: {phoneNumber: string}, params: {userId: string|number}}>()({
    endpoint: "/users/updatePhoneNumber/:userId",
    method:"PUT",
    auth:true
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