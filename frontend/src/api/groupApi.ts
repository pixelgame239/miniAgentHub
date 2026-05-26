import { client } from "./apiClient";
type Group={
    id: number,
    groupName: string
}
const getAllGroupsRequest = client.createRequest<{response: []}>()({
    endpoint: "/groups/",
    method: "GET",
    auth:true
});
const getUserGroupsRequest = client.createRequest<{response: Group[]}>()(
    {
        endpoint:"/groups/mygroups",
        method:"GET",
        auth:true
    }
);
const deleteGroupRequest = client.createRequest<{params:{groupId:number}}>()(
    {
        endpoint:"/groups/delete/:groupId",
        method:"DELETE",
        auth:true
    }
)
const addUserRequest = client.createRequest<{params: {groupId:number, userId: number}}>()(
    {
        endpoint:"/groups/addUser/:groupId/:userId",
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
const updateGroupNameRequest = client.createRequest<{payload: {groupName: string}, params: {groupId: number}}>()(
    {
        endpoint:"/groups/updateGroup/:groupId",
        method:"PUT",
        auth:true
    }
)
export const getAllGroups = async() =>{
    return await getAllGroupsRequest.send();
}
export const getUserGroups = async() =>{
    return await getUserGroupsRequest.send();
}
export const deleteGroup = async(groupId: number) => {
    return await deleteGroupRequest.send({params:{groupId}});
}
export const addUser = async(groupId: number, userId: number) => {
    return await addUserRequest.send({params:{groupId, userId}});
}
export const removeUser = async(groupId: number, userId: number) => {
    return await removeUserRequest.send({params:{groupId, userId}});
}
export const updateGroupName = async(groupId: number, groupName: string) => {
    return await updateGroupNameRequest.send({payload:{groupName}, params:{groupId}});
}