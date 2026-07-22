import type { IAIProviderStrategy, AIProviderContext } from "./interface/message.interface";
import { AIService, promptToAIProvider } from "./ai.service";
import { prisma } from "../../lib/prisma";
import { decrypt } from "../utils/APIHash";
import { MyError } from "../utils/MyError";
import { buildPromptWithContext } from "../utils/promptBuilder";
import { GROQ_MAX_TOKEN } from "../utils/generalKey";

export class GroqStrategy implements IAIProviderStrategy {

  async executePrompt(ctx: AIProviderContext) {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { groqApiKey: true }
    });

    const apiKey = decrypt(user?.groqApiKey || "");
    if (!apiKey) {
        await prisma.message.create({
          data: {
            content: "",
            conversationId: ctx.convId,
            type: "error",
            aiModel: ctx.model,
            isCompleted: true
          }
        });
        throw new MyError("Groq API key not found", 400);
    }

    const finalPrompt = await buildPromptWithContext(ctx.convId, ctx.content, ctx.currentPromptId, ctx.currentFileContent, GROQ_MAX_TOKEN );
    return await promptToAIProvider(finalPrompt, ctx.model, apiKey, ctx.signal);
  }
}