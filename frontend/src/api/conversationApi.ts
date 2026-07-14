import type { Conversation } from "../context/ChatContext";
import { client } from "./apiClient";

const getConversationsRequest = client.createRequest<{response:Conversation[], queryParams: {page: number}}>()(
    {
        method:"GET",
        endpoint: "/conversations/",
        options: {
            credentials: "include"
        }
    }
)
const getCOnversationDetailRequest = client.createRequest<{response:Conversation, params: {convId: number}, queryParams: {page: number}}>()(
    {
        method: "GET",
        endpoint: "/conversations/detail/:convId",
        options: {
            credentials: "include"
        }
    }
)
const createConversationRequest = client.createRequest<{payload:{title:string}}>()(
    {
        method:"POST",
        endpoint: "/conversations/create",
        options: {
            credentials: "include"
        }
    }
)
const deleteConversationRequest = client.createRequest<{params: {convId: number}}>()(
    {
        method:"DELETE",
        endpoint: "/conversations/delete/:convId",
        options: {
            credentials: "include"
        }
    }
);
const deleteAllConversationsRequest = client.createRequest<{}>()(
    {
        method:"DELETE",
        endpoint: "/conversations/deleteAll",
        options: {
            credentials: "include"
        }
    }
)
const updateConversationTitleRequest = client.createRequest<{params: {convId: number}, payload:{title: string}}>()(
    {
        method:"PUT",
        endpoint: "/conversations/updateTitle/:convId",
        options: {
            credentials: "include"
        }
    }
)
export const getConversations = async(currentPage: number)=>{
    return await getConversationsRequest.send({queryParams: {page: currentPage}});
}
export const getConversationDetail= async(convId: number, page: number)=>{
    return await getCOnversationDetailRequest.send({params:{convId}, queryParams: {page}});
}
export const createConversation = async(title:string)=>{
    return await createConversationRequest.send({payload:{title}});
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