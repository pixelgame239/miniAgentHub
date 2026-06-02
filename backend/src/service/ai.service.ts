import { MyError } from "../utils/MyError";
import axios, { type AxiosRequestConfig } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

const groqAPI = process.env.GROQ_API || "https://api.groq.com/openai/v1/models";
const groqAPIKey = process.env.GROQ_API_KEY;
const proxyUri = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || "";
const proxyAgent = proxyUri ? new HttpsProxyAgent(proxyUri) : undefined;
const flowiseAPI = process.env.FLOWISE_API||"";
// const flowiseAPI = process.env.FLOWISE_BACKUP_API || "";
export class AIService{
    private getAxiosProxyConfig(): AxiosRequestConfig {
        if (!proxyAgent) {
            return {};
        }
        return {
            httpsAgent: proxyAgent,
            proxy: false
        };
    }
    public async getGroqModels(){
        try{
            const response = await axios.get(groqAPI, {
                headers:{
                    "Authorization": `Bearer ${groqAPIKey}`,
                },
                ...this.getAxiosProxyConfig()
            })
            const data = await response.data;
            const models = data.data
            .filter((model: any) => !model.id.includes('whisper') && !model.id.includes('audio'))
            .map((model: any) => {
                return { id: model.id };
            });
            return models;
        }catch(error){
            console.error();
            throw new MyError("Unexpected Error fetch model",500);
        }
    }
    public async promptStream(content: string, model: string, convId: any) {
        const sessionId = convId.toString();
        const response = await axios.post(
            flowiseAPI,
            {
                question: content,
                streaming: true,
                overrideConfig: {
                    modelName: model,
                    sessionId: sessionId
                }
            },
            {
                responseType: "stream",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "text/event-stream"
                },
                ...this.getAxiosProxyConfig()
            }
        );

        return response.data;
    }
}