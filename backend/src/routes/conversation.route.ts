import express, { Router } from 'express';
import { fetchAllConversations } from '../controller/conversation.controller';

export const conversationRouter:Router = express.Router();

conversationRouter.get("/", fetchAllConversations);