import type { Conversation } from "../context/ChatContext";
import { client } from "./apiClient";

const getConversationsRequest = client.createRequest<{response:Conversation[], params: {groupId:number}}>()(
    {
        method:"GET",
        endpoint: "/conversations/:groupId",
        auth:true
    }
)
const getCOnversationDetailRequest = client.createRequest<{response:Conversation, params: {convId: number}}>()(
    {
        method: "GET",
        endpoint: "/conversations/detail/:convId",
        auth: true
    }
)
const createConversationRequest = client.createRequest<{payload:{title:string}}>()(
    {
        method:"POST",
        endpoint: "/conversations/create",
        auth:true
    }
)
export const getConversations = async(groupId:number)=>{
    return await getConversationsRequest.send({params: {groupId}});
}
export const getConversationDetail= async(convId: number)=>{
    return await getCOnversationDetailRequest.send({params:{convId}});
}
export const createConversation = async(title:string)=>{
    return await createConversationRequest.send({payload:{title}});
}