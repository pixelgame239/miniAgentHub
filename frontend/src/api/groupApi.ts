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
export const getAllGroups = async() =>{
    return await getAllGroupsRequest.send();
}
export const getUserGroups = async() =>{
    return await getUserGroupsRequest.send();
}