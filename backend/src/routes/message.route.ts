import express, { Router } from "express";
import { promptToAI } from "../controller/message.controller";
import { checkPermission } from "../utils/checkPermission";

export const messageRouter:Router = express.Router();

messageRouter.post("/sendPrompt", checkPermission("CHAT"), promptToAI);
