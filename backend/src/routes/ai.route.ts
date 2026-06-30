import { Router } from "express";
import { getGroqModels, getOpenRouterModels } from "../controller/ai.controller";
import { checkPermission } from "../utils/checkPermission";

export const AIRouter = Router();
AIRouter.use(checkPermission("CHAT"));
AIRouter.get("/groqModels", getGroqModels);
AIRouter.get("/openRouterModels", getOpenRouterModels);
