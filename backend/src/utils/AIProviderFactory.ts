import type { IAIProviderStrategy } from "../service/interface/message.interface";
import { FlowiseStrategy } from "../service/flowise.service";
import { OpenRouterStrategy } from "../service/openRouter.service";
import { GroqStrategy } from "../service/groq.service";
import { FLOWISE_RECOGNITION, OPENROUTER_RECOGNITION } from "../utils/generalKey";

export class AIProviderFactory {
  private strategies: Map<string, IAIProviderStrategy> = new Map();

  constructor() {
    // Đăng ký các provider ở đây
    this.strategies.set("flowise", new FlowiseStrategy());
    this.strategies.set("openrouter", new OpenRouterStrategy());
    this.strategies.set("groq", new GroqStrategy());
  }

  getStrategy(model: string): IAIProviderStrategy {
    if (model.startsWith(FLOWISE_RECOGNITION)) {
      return this.strategies.get("flowise")!;
    }
    if (model.includes(OPENROUTER_RECOGNITION)) {
      return this.strategies.get("openrouter")!;
    }
    // Mặc định là Groq (hoặc provider mặc định khác)
    return this.strategies.get("groq")!;
  }
}