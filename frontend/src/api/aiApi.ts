import { client } from "./apiClient";

const getGroqModelsRequest = client.createRequest<{ payload: { APIKey: string } }>()(
    {
        method:"GET",
        endpoint: "/ai/groqModels",
        options: {
            credentials: "include"
        }
    }
)
const getOpenRouterModelsRequest = client.createRequest<{ payload: { APIKey: string } }>()(
    {
        method:"GET",
        endpoint: "/ai/openRouterModels",
        options: {
            credentials: "include"
        }
    }
)
export const getOpenRouterModels = async(APIKey: string)=>{
    return await getOpenRouterModelsRequest.send({ payload: { APIKey: APIKey } });
}
export const getGroqModels = async(APIKey: string)=>{
    return await getGroqModelsRequest.send({ payload: { APIKey: APIKey } });
}