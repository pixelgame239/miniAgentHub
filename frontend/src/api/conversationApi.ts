import type { Conversation } from "../context/ChatContext";
import { client } from "./apiClient";

const getConversationsRequest = client.createRequest<{response:Conversation[]}>()(
    {
        method:"GET",
        endpoint: "/conversations/",
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
const createConversationRequest = client.createRequest<{payload:{title:string, model: string}}>()(
    {
        method:"POST",
        endpoint: "/conversations/create",
        auth:true
    }
)
const deleteConversationRequest = client.createRequest<{params: {convId: number}}>()(
    {
        method:"DELETE",
        endpoint: "/conversations/delete/:convId",
        auth:true
    }
);
const deleteAllConversationsRequest = client.createRequest<{}>()(
    {
        method:"DELETE",
        endpoint: "/conversations/deleteAll",
        auth:true
    }
)
const updateConversationTitleRequest = client.createRequest<{params: {convId: number}, payload:{title: string}}>()(
    {
        method:"PUT",
        endpoint: "/conversations/updateTitle/:convId",
        auth:true
    }
)
export const getConversations = async()=>{
    return await getConversationsRequest.send();
}
export const getConversationDetail= async(convId: number)=>{
    return await getCOnversationDetailRequest.send({params:{convId}});
}
export const createConversation = async(title:string, model:string)=>{
    return await createConversationRequest.send({payload:{title,model}});
}
export const deleteConversation = async(convId:any)=>{
    return await deleteConversationRequest.send({params: {convId}});
}
export const deleteAllConversations = async()=>{
    return await deleteAllConversationsRequest.send();
}
export const updateConversationTitle = async(convId: number, title: string)=>{
    return await updateConversationTitleRequest.send({params:{convId}, payload:{title}});
}