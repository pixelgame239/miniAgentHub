import { client } from "./apiClient";

const getGroqModelsRequest = client.createRequest<{ payload: { APIKey: string } }>()(
    {
        method:"POST",
        endpoint: "/ai/groqModels",
        auth: true
    }
)
export const getGroqModels = async(APIKey: string)=>{
    return await getGroqModelsRequest.send({ payload: { APIKey: APIKey } });
}