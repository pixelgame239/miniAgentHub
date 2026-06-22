import { client } from "./apiClient";

const exportAllMessagesRequest = client.createRequest<{params: {convId: number}}>()(
    {
        method:"POST",
        endpoint: "/export/conversation/:convId",
        auth: true
    }
);
const exportMessageRequest = client.createRequest<{params: {messageId: number}}>()(
    {
        method:"POST",
        endpoint: "/export/message/:messageId",
        auth: true
    }
);
export const exportAllMessages = async(convId: number)=>{
    return await exportAllMessagesRequest.send({ params: { convId } });
}
export const exportMessage = async(messageId: number)=>{
    return await exportMessageRequest.send({ params: { messageId } });
}