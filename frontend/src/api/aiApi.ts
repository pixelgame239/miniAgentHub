import { client } from "./apiClient";

const getGroqModelsRequest = client.createRequest<{}>()(
    {
        method:"GET",
        endpoint: "/ai/groqModels",
        auth: true
    }
)
export const getGroqModels = async()=>{
    return await getGroqModelsRequest.send();
}