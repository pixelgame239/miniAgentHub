import { client } from "./apiClient";
export type ChatRequest={
    conversationId: number;
    content: string;
    model?: string;
}
const sendPromptRequest = client.createRequest<{payload:ChatRequest}>()({
    method:"POST",
    endpoint:"/messages/sendPrompt",
    auth:true
});
export const sendPrompt = async(data:ChatRequest)=>{
    return await sendPromptRequest.send({payload:data});
}