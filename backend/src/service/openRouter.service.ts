import type { IAIProviderStrategy, AIProviderContext } from "./interface/message.interface";
import { AIService } from "./ai.service";
import { prisma } from "../../lib/prisma";
import { decrypt } from "../utils/APIHash";
import { MyError } from "../utils/MyError";
import { buildPromptWithContext } from "../utils/promptBuilder";

export class OpenRouterStrategy implements IAIProviderStrategy {
  constructor(private aiService: AIService) {}

  async executePrompt(ctx: AIProviderContext) {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { OpenRouterAPIKey: true }
    });

    const apiKey = decrypt(user?.OpenRouterAPIKey || "");
    if (!apiKey) {
        await prisma.message.create({
          data: {
            content: "",
            conversationId: ctx.convId,
            type: "error",
            AIModel: ctx.model,
            isCompleted: true
          }
        });
        throw new MyError("OpenRouter API key not found", 400);
    }

    const finalPrompt = await buildPromptWithContext(ctx.convId, ctx.content, ctx.currentFileContent);
    return await this.aiService.promptToAIProvider(finalPrompt, ctx.model, apiKey, ctx.signal);
  }
}