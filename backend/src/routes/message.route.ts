import express, { Router } from "express";
import { fetchAllGroups, fetchUserGroups } from "../controller/group.controller";
import { checkAdmin } from "../middleware/admin.middleware";
import { promptToAI } from "../controller/message.controller";

export const messageRouter:Router = express.Router();

messageRouter.post("/sendPrompt", promptToAI);
