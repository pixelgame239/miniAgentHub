import { client } from "./apiClient";

const getAllGroupsRequest = client.createRequest<{response: []}>()({
    endpoint: "/groups/",
    method: "GET",
    auth:true
});
// const getUserGroupsRequest = client.createRequest<{response: Group[]}>()(
//     {
//         endpoint:"/groups/mygroups",
//         method:"GET",
//         auth:true
//     }
// );
const deleteGroupRequest = client.createRequest<{params:{groupId:number}}>()(
    {
        endpoint:"/groups/delete/:groupId",
        method:"DELETE",
        auth:true
    }
)
const createGroupRequest = client.createRequest<{payload:{groupName: string, permissions: string[], userIds: number[]}}>()({
    endpoint:"/groups/create",
    method: "POST",
    auth:true
})
const addUserRequest = client.createRequest<{params: {groupId:number}, payload: {userIds: number[]}}>()(
    {
        endpoint:"/groups/addUser/:groupId",
        method:"PATCH",
        auth:true
    }
)
const removeUserRequest = client.createRequest<{params: {groupId:number, userId: number}}>()(
    {
        endpoint:"/groups/removeUser/:groupId/:userId",
        method:"PATCH",
        auth:true
    }
)
const updateGroupDataRequest = client.createRequest<{payload: {groupName: string, permissions:string[], userIds: number[]}, params: {groupId: number}}>()(
    {
        endpoint:"/groups/updateGroup/:groupId",
        method:"PUT",
        auth:true
    }
)
export const getAllGroups = async() =>{
    return await getAllGroupsRequest.send();
}
// export const getUserGroups = async() =>{
//     return await getUserGroupsRequest.send();
// }
export const deleteGroup = async(groupId: number) => {
    return await deleteGroupRequest.send({params:{groupId}});
}
export const createGroup = async(formData:{groupName: string, permissions: string[], userIds: number[]})=>{
    return await createGroupRequest.send({payload:formData});
}
export const addUser = async(groupId: number, userIds: number[]) => {
    return await addUserRequest.send({params:{groupId}, payload:{userIds}});
}
export const removeUser = async(groupId: number, userId: number) => {
    return await removeUserRequest.send({params:{groupId, userId}});
}
export const updateGroupData = async(groupId: number, permissions: string[], userIds: number[], groupName: string) => {
    return await updateGroupDataRequest.send({payload:{groupName: groupName, permissions: permissions, userIds: userIds}, params:{groupId}});
}