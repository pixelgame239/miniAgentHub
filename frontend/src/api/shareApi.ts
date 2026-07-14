import type { Conversation } from "../context/ChatContext";
import { client } from "./apiClient";

const getSharedConversationRequest = client.createRequest<{response:Conversation, params: {shareId: string}}>()(
    {
        method: "GET",
        endpoint: "/share/conversation/:shareId",
    }
)
const shareConversationRequest = client.createRequest<{params: {conversationId: number}}>()(
    {
        method: "POST",
        endpoint: "/share/:conversationId",
        options: {
            credentials: "include"
        }
    }
)
const shareMessageRequest = client.createRequest<{params: {messageId: number}}>()(
    {
        method: "POST",
        endpoint: "/share/message/:messageId",
        options: {
            credentials: "include"
        }
    }
)
export const shareConversation = async(conversationId: number)=>{
    return await shareConversationRequest.send({params:{conversationId}});
}
export const shareMessage = async(messageId: number)=>{
    return await shareMessageRequest.send({params:{messageId}});
}
export const getSharedConversation = async(shareId: string)=>{
    return await getSharedConversationRequest.send({params:{shareId}});
}