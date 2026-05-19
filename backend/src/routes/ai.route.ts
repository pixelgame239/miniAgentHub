import { Router } from "express";
import { getAIModels } from "../controller/ai.controller";

export const AIRouter = Router();

AIRouter.use("/groqModels", getAIModels);
