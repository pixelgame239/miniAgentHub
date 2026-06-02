import { Router } from "express";
import { getAIModels } from "../controller/ai.controller";
import { checkPermission } from "../utils/checkPermission";

export const AIRouter = Router();
AIRouter.use(checkPermission("CHAT"));
AIRouter.use("/groqModels", getAIModels);
