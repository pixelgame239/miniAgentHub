import type { SelectedUser } from "../component/GroupMembersModal";
import { client } from "./apiClient";

const getAllGroupsRequest = client.createRequest<{response: []}>()({
    endpoint: "/groups/",
    method: "GET",
    options: {
        credentials: "include"
    }
});
const deleteGroupRequest = client.createRequest<{params:{groupId:number}}>()(
    {
        endpoint:"/groups/delete/:groupId",
        method:"DELETE",
        options: {
            credentials: "include"
        }
    }
)
const createGroupRequest = client.createRequest<{payload:{groupName: string, permissions: string[], userIds: number[]}}>()({
    endpoint:"/groups/create",
    method: "POST",
    options: {
        credentials: "include"
    }
})
const addUserRequest = client.createRequest<{params: {groupId:number}, payload: {selectedUsers: SelectedUser[]}}>()(
    {
        endpoint:"/groups/addUser/:groupId",
        method:"PATCH",
        options: {
            credentials: "include"
        }
    }
)
const removeUserRequest = client.createRequest<{params: {groupId:number, userId: number}}>()(
    {
        endpoint:"/groups/removeUser/:groupId/:userId",
        method:"PATCH",
        options: {
            credentials: "include"
        }
    }
)
const updateGroupDataRequest = client.createRequest<{payload: {groupName: string, permissions:string[], userIds: number[]}, params: {groupId: number}}>()(
    {
        endpoint:"/groups/updateGroup/:groupId",
        method:"PUT",
        options: {
            credentials: "include"
        }
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
export const addUser = async(groupId: number, selectedUsers: SelectedUser[]) => {
    return await addUserRequest.send({params:{groupId}, payload:{selectedUsers}});
}
export const removeUser = async(groupId: number, userId: number) => {
    return await removeUserRequest.send({params:{groupId, userId}});
}
export const updateGroupData = async(groupId: number, permissions: string[], userIds: number[], groupName: string) => {
    return await updateGroupDataRequest.send({payload:{groupName: groupName, permissions: permissions, userIds: userIds}, params:{groupId}});
}