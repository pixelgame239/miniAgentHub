import { MyError } from "../utils/MyError";
import axios, { type AxiosRequestConfig } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import FormData from 'form-data';

const groqAPI = process.env.GROQ_API || "https://api.groq.com/openai/v1/chat/completions";
const groqAPIKey = process.env.GROQ_API_KEY;
const proxyUri = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || "";
const proxyAgent = proxyUri ? new HttpsProxyAgent(proxyUri) : undefined;
const flowiseAPI = process.env.FLOWISE_API||"";
const flowiseUpsertApi= process.env.FLOWISE_UPSERT_API||"";
const flowiseAuthorizationAPI = process.env.FLOWISE_AUTHORIZATION_API || "";
const deepseekAPI = process.env.DEEPSEEK_API || "https://api.deepseek.com/chat/completions";
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
    public async getGroqModels(APIKey:string){
        try{
            const response = await axios.get(groqAPI, {
                headers:{
                    "Authorization": `Bearer ${APIKey}`,
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
            console.error(error);
            throw new MyError("Unexpected Error fetch model",500);
        }
    }

// public async upsertFile(convId: string, file: { data: string; fileName: string; mimeType: string }) {
//     // 1. Chuyển base64 ngược thành Buffer để gửi dạng Multipart Form Data
//     const base64Data = file.data.split(";base64,").pop();
//     if (!base64Data) throw new Error("Dữ liệu file base64 không hợp lệ");
//     const fileBuffer = Buffer.from(base64Data, "base64");
    
//     // 2. Khởi tạo FormData và append file
//     const form = new FormData();
//     form.append('files', fileBuffer, {
//         filename: file.fileName,
//         contentType: file.mimeType,
//     });
//     form.append("chatId", convId);

//     // 3. Cấu hình overrideConfig chứa sessionId (convId) để Flowise map đúng vào đoạn chat
//     const overrideConfig = {
//         sessionId: convId
//     };
//     form.append('overrideConfig', JSON.stringify(overrideConfig));

//     try {
//         // 4. Gọi API Upsert của Flowise bằng Axios
//         await axios.post(flowiseUpsertApi, form, {
//             headers: {
//                 ...form.getHeaders(),
//                 "Authorization": `Bearer ${flowiseAuthorizationAPI}` // Đảm bảo token có dạng "Bearer ..." nếu dùng Flowise Cloud
//             },
//             ...this.getAxiosProxyConfig()
//         });
//     } catch (error: any) {
//         // Log chi tiết lỗi trả về từ server Flowise nếu có để dễ debug
//         if (error.response) {
//             console.error("Flowise Upsert Error Response:", error.response.data);
//         } else {
//             console.error("Flowise Upsert Connection Error:", error.message);
//         }
        
//         throw new MyError("Unexpected Error during file upsert", 500);
//     }
// }
    public async promptToFlowise(content: string, model: string, APIKey: string, APIUrl: string, convId: any, files?: { data: string; fileName: string; mimeType: string }[]) {
        const sessionId = convId.toString();
        const uploads = files?.map(f => ({
            data: f.data,        
            name: f.fileName,
            type: "file:full",
            mime: f.mimeType
        }));
        let finalAPIURL = flowiseAPI;
        if(APIUrl && APIUrl.trim()!==""){
            finalAPIURL = APIUrl;
        }
        let response;
        response = await axios.post(
            finalAPIURL,
            {
                question: content,
                streaming: true,
                overrideConfig: {
                    modelName: model,
                    sessionId: sessionId,
                },
                ...(uploads && uploads.length > 0 ? { uploads } : {}),
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    ...(APIKey ? { "Authorization": `Bearer ${APIKey}` } : {})
                },
                ...this.getAxiosProxyConfig()
            }
        );
        return response.data;
    }
    public async promptToAIProvider(content: string, model: string, APIKey: string) {
        let finalAPIURL;
        if(!APIKey.trim()){
            throw new MyError("API Key is required", 400);
        }
        if(model.startsWith("deepseek")){
            finalAPIURL = deepseekAPI;
        }else{
            finalAPIURL = groqAPI;
        }
        let response;
        response = await axios.post(
            finalAPIURL,
            {
                messages: [{ role: "system", content: "You are a helpful AI assistant. Please converse with the User. If a message contains <file_content>, use that specific document context to answer the question accurately." }, { role: "user", content }],
                streaming: true,
                model: model,
                response_format: "json_object",
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${APIKey}`
                },
                ...this.getAxiosProxyConfig()
            }
        );
        return response.data;
    }
    public async promptStream(content: string, model: string, convId: any, APIKey: string, files?: { data: string; fileName: string; mimeType: string }[]) {
        const sessionId = convId.toString();
        const uploads = files?.map(f => ({
            data: f.data,        
            name: f.fileName,
            type: "file:full",
            mime: f.mimeType
        }));
        let response;
        if(model.startsWith("flowise")){
            response = await axios.post(
                flowiseAPI,
                {
                    question: content,
                    streaming: true,
                    overrideConfig: {
                        modelName: model,
                        sessionId: sessionId,
                        groqApiKey: APIKey,
                    },
                    ...(uploads && uploads.length > 0 ? { uploads } : {}),
                },
                {
                    responseType: "stream",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "text/event-stream",
                        "Authorization": `Bearer ${flowiseAuthorizationAPI}`
                    },
                    ...this.getAxiosProxyConfig()
                }
            );
        }
        response = await axios.post(
            flowiseAPI,
            {
                question: content,
                streaming: true,
                overrideConfig: {
                    modelName: model,
                    sessionId: sessionId,
                    groqApiKey: APIKey,
                },
                ...(uploads && uploads.length > 0 ? { uploads } : {}),
            },
            {
                responseType: "stream",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "text/event-stream",
                },
                ...this.getAxiosProxyConfig()
            }
        );

        return response.data;
    }
}