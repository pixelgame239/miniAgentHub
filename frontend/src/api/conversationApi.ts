import { client } from "./apiClient";

type ConversationResponse = {
    id: number,
    title: string
}
const getConversationsRequest = client.createRequest<{response:ConversationResponse}>()(
    {
        method:"GET",
        endpoint: "/conversations/",
        auth:true
    }
)
export const getConversations = async()=>{
    return await getConversationsRequest.send();
}