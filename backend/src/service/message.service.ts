import { prisma } from "../../lib/prisma";
import { MyError } from "../utils/MyError";
import { AIService } from "./ai.service";

const aiService = new AIService();
export class MessageService{
    public async sendPrompt(convId:number, content: string, model: string){
        try{
            await prisma.message.create({data:{
                content: content,
                conversationId: convId
            }});
            const responseStream = await aiService.promptStream(content, model);
            let fullResponse = "";
            responseStream.on("data", (chunk: Buffer)=>{
                const text = chunk.toString();
                fullResponse+=text;
            });
            responseStream.on("end", async()=>{
                await prisma.message.create({
                    data:{
                        content: fullResponse,
                        conversationId: convId,
                        type: "response"
                    }
                })
            });
            return responseStream;
        }catch(error){
            throw new MyError("Unexpected Error", 500)
        }
    }
}