import { Router } from "express";
import { getGroqModels } from "../controller/ai.controller";
import { checkPermission } from "../utils/checkPermission";

export const AIRouter = Router();
AIRouter.use(checkPermission("CHAT"));
AIRouter.post("/groqModels", getGroqModels);
