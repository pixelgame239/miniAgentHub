import { MyError } from "../utils/MyError";
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

const groqAPI = process.env.GROQ_API || "https://api.groq.com/openai/v1/models";
const groqAPIKey = process.env.GROQ_API_KEY;
const proxyUri = process.env.HTTP_PROXY || "";
const proxyAgent = new HttpsProxyAgent(proxyUri);
const flowiseAPI = process.env.FLOWISE_API||"";
export class AIService{
    public async getGroqModels(){
        try{
            const response = await axios.get(groqAPI, {
                headers:{
                    "Authorization": `Bearer ${groqAPIKey}`,
                },httpsAgent:proxyAgent,
                proxy:false
            })
            const data = await response.data;
            const models = data.data
            .filter((model: any) => !model.id.includes('whisper') && !model.id.includes('audio'))
            .map((model: any) => {
                return { id: model.id };
            });
            return models;
        }catch(error){
            throw new MyError("Unexpected Error",500);
        }
    }
    public async promptStream(content: string, model: string){
        try{
            const response = await axios.post(flowiseAPI, {
                question: content,
                overrideConfig:{
                    modelName:model,
                    streaming: true
                }                
            },{
                responseType:"stream",
                headers:{
                    "Content-Type":"application/json"
                }
            });
            return response.data;
        } catch(error){
            console.error(error);
            throw new MyError("Unexpected Error",500);
        }
    }
}