import express, { Router } from 'express';
import { fetchAllConversations, fetchConversationDetail } from '../controller/conversation.controller';

export const conversationRouter:Router = express.Router();

conversationRouter.get("/:groupId", fetchAllConversations);
conversationRouter.get("/detail/:convId", fetchConversationDetail);