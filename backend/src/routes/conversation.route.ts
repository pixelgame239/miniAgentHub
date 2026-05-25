import express, { Router } from 'express';
import { createNewConversation, fetchAllConversations, fetchConversationDetail } from '../controller/conversation.controller';
import { checkPermission } from '../utils/checkPermission';

export const conversationRouter:Router = express.Router();

conversationRouter.get("/:groupId", checkPermission("CONV_R"),fetchAllConversations);
conversationRouter.get("/detail/:convId", checkPermission("CONV_R"),fetchConversationDetail);
conversationRouter.post("/create/:groupId", checkPermission("CONV_C"), createNewConversation);