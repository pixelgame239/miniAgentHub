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