import type { IAIProviderStrategy, AIProviderContext } from "./interface/message.interface";
import { AIService } from "./ai.service";
import { prisma } from "../../lib/prisma";
import { decrypt } from "../utils/APIHash";
import { MyError } from "../utils/MyError";

export class FlowiseStrategy implements IAIProviderStrategy {
  constructor(private aiService: AIService) {}

  async executePrompt(ctx: AIProviderContext) {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { FlowiseAPIKey: true, FlowiseUrl: true }
    });

    const apiKey = decrypt(user?.FlowiseAPIKey || "");
    const apiUrl = decrypt(user?.FlowiseUrl || "");

    if (!apiUrl || apiUrl.trim() === "") {
        await prisma.message.create({
          data: {
            content: "",
            conversationId: ctx.convId,
            type: "error",
            AIModel: ctx.model,
            isCompleted: true
          }
        });
      throw new MyError("Flowise API URL is required", 400);
    }

    const finalContent = ctx.currentFileContent 
      ? `${ctx.content}\n\n[Attached File Data]:\n<file_content>\n${ctx.currentFileContent}\n</file_content>` 
      : ctx.content;

    return await this.aiService.promptToFlowise(finalContent, apiKey, apiUrl, ctx.convId, ctx.signal);
  }
}