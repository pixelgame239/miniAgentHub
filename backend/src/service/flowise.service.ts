import type { IAIProviderStrategy, AIProviderContext } from "./interface/message.interface";
import { AIService } from "./ai.service";
import { prisma } from "../../lib/prisma";
import { decrypt } from "../utils/APIHash";
import { MyError } from "../utils/MyError";
import type { AxiosRequestConfig } from "axios";
import axios from "axios";
const aiService = new AIService();
const promptToFlowise = async (content: string, APIKey: string|null, APIUrl: string, convId: any, signal?: AbortSignal) => {
      const sessionId = convId.toString();
      if(APIUrl.trim()===""){
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
          ...aiService.getAxiosProxyConfig()
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
export class FlowiseStrategy implements IAIProviderStrategy {
  async executePrompt(ctx: AIProviderContext) {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { flowiseApiKey: true, flowiseUrl: true }
    });

    const apiKey = decrypt(user?.flowiseApiKey || "");
    const apiUrl = decrypt(user?.flowiseUrl || "");

    if (!apiUrl || apiUrl.trim() === "") {
        await prisma.message.create({
          data: {
            content: "",
            conversationId: ctx.convId,
            type: "error",
            aiModel: ctx.model,
            isCompleted: true
          }
        });
      throw new MyError("Flowise API URL is required", 400);
    }

    const finalContent = ctx.currentFileContent 
      ? `${ctx.content}\n\n[Attached File Data]:\n<file_content>\n${ctx.currentFileContent}\n</file_content>` 
      : ctx.content;

    return await promptToFlowise(finalContent, apiKey, apiUrl, ctx.convId, ctx.signal);
  }
}