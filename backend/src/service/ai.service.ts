import { MyError } from "../utils/MyError";
import axios, { type AxiosRequestConfig } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import FormData from 'form-data';
import { OPENROUTER_RECOGNITION } from "../utils/generalKey";

const groqAPI = process.env.GROQ_API || "https://api.groq.com/openai/v1/chat/completions";
const proxyUri = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || "";
const proxyAgent = proxyUri ? new HttpsProxyAgent(proxyUri) : undefined;
const openrouterAPI = process.env.OPENROUTER_API || "https://openrouter.ai/api/v1/chat/completions";
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
    public async getGroqModels(APIKey:string){
        try{
            const response = await axios.get("https://api.groq.com/openai/v1/models", {
                headers:{
                    "Authorization": `Bearer ${APIKey}`,
                },
                ...this.getAxiosProxyConfig()
            })
            return true;
        }catch(error){
            console.error(error);
            throw new MyError("Unexpected Error fetch model",500);
        }
    }
    public async getOpenRouterModels(APIKey:string){
        try{
            const response = await axios.get("https://openrouter.ai/api/v1/key", {
                headers:{
                    "Authorization": `Bearer ${APIKey}`,
                },
                ...this.getAxiosProxyConfig()
            })
            return true;
        }catch(error){
            console.error(error);
            throw new MyError("Unexpected Error fetch model",500);
        }
    }
    public async promptToFlowise(content: string, APIKey: string|null, APIUrl: string, convId: any, signal?: AbortSignal) {
        const sessionId = convId.toString();
        if(APIUrl && APIUrl.trim()!==""){
            throw new MyError("Flowise URL is not configured", 404);
        }
        let response;
        const axiosConfig: AxiosRequestConfig = {
            responseType: "stream",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                ...(APIKey && APIKey.trim() !== "" ? { "Authorization": `Bearer ${APIKey}` } : {})
            },
            ...this.getAxiosProxyConfig()
        };
        if(signal) {
            axiosConfig.signal = signal;
            signal.addEventListener("abort", () => {
                console.log("[AXIOS INTERNAL] Abort signal received.");
            });
        }
        try{
            response = await axios.post(
                APIUrl,
                {
                    question: content,
                    streaming: true,
                    overrideConfig: {
                        sessionId: sessionId,
                        messages: [{ role: "system", content: "You are a helpful AI assistant. Please converse with the User. If a message contains <file_content>, use that specific document context to answer the question accurately." }],
                    },
                },
                axiosConfig
            );
            return response.data;
        }catch(error:any){
            console.error("promptToFlowise error:", error);
            if (axios.isCancel(error)) {
                throw new MyError("Request aborted by user", 499);
            }
            if (error.response && error.response.data) {
                try {
                    // Đọc buffer stream lỗi và parse thành JSON công khai
                    const errorBuffer = error.response.data.read();
                    if (errorBuffer) {
                        const errorObj = JSON.parse(errorBuffer.toString());
                        console.error("Detail error from Flowise:", errorObj);
                        throw new MyError(errorObj.error?.message || "Flowise Error", error.response.status);
                    }
                } catch (parseErr) {
                    throw new MyError("Unexpected Error during Flowise prompt",500);
                }
            }
            throw new MyError(error.message || "Unexpected Error during Flowise prompt", error.response?.status || 500);
        }
    }
    public async promptToAIProvider(content: string, model: string, APIKey: string|null, signal?: AbortSignal) {
        let finalAPIURL;
        if(!APIKey||APIKey.trim()===""){
            throw new MyError("API Key is required", 400);
        }
        if(model.includes(OPENROUTER_RECOGNITION)){
            finalAPIURL = openrouterAPI;
        }else{
            finalAPIURL = groqAPI;
        }
        let response;
        const axiosConfig: AxiosRequestConfig = {
            responseType: "stream",
            headers: {
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
                "Authorization": `Bearer ${APIKey}`
            },
            ...this.getAxiosProxyConfig()
        };

        if (signal) {
            axiosConfig.signal = signal;
            // Đảm bảo nếu tín hiệu hủy kích hoạt, hủy luồng nhận dữ liệu của axios nếu nó bị kẹt
            signal.addEventListener("abort", () => {
                console.log("[AXIOS INTERNAL] Abort signal received.");
            });
        }
        try{
        response = await axios.post(
            finalAPIURL,
            {
                messages: [{ role: "system", content: "You are a helpful AI assistant. Please converse with the User. If a message contains <file_content>, use that specific document context to answer the question accurately.  " }, { role: "user", content }],
                stream: true,
                model: model,
            },
            axiosConfig
        );
        return response.data;
        // return response.data.choices[0].message.content;
        }catch(error:any){
            if (axios.isCancel(error)) {
                throw new MyError("Request aborted by user", 499);
            }
            if (error.response && error.response.data) {
                console.error("promptToAIProvider error response:", error);
                try {
                    // Đọc buffer stream lỗi và parse thành JSON công khai
                    const errorBuffer = error.response.data.read();
                    if (errorBuffer) {
                        const errorObj = JSON.parse(errorBuffer.toString());
                        console.error("Detail error from Provider:", errorObj);
                        throw new MyError(errorObj.error?.message || "AI Provider Error", error.response.status);
                    }
                } catch (parseErr) {
                    throw new MyError("Unexpected Error during AI provider prompt",500);
                }
            }
            throw new MyError(error.message || "Unexpected Error during AI provider prompt", error.response?.status || 500);
        }
    }
}