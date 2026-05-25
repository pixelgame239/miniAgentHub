import { client } from "./apiClient";
export type ChatRequest={
    conversationId?: number;
    content?: string;
    model?: string;
}
export const sendPromptRequest = client.createRequest<{payload:ChatRequest}>()({
    method:"POST",
    endpoint:"/messages/sendPrompt",
    auth:true,
    options: {streaming: true}
});
export const sendPrompt = async(data:ChatRequest)=>{
    await sendPromptRequest.send({payload:data});
}