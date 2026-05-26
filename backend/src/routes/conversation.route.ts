import express, { Router } from 'express';
import { createNewConversation, deleteAllConversations, deleteConversation, fetchAllConversations, fetchConversationDetail, updateConversationTitle } from '../controller/conversation.controller';
import { checkPermission } from '../utils/checkPermission';

export const conversationRouter:Router = express.Router();

conversationRouter.get("/:groupId", checkPermission("CONV_R"),fetchAllConversations);
conversationRouter.get("/detail/:convId", checkPermission("CONV_R"),fetchConversationDetail);
conversationRouter.post("/create/:groupId", checkPermission("CONV_C"), createNewConversation);
conversationRouter.delete("/delete/:convId", checkPermission("CONV_D"), deleteConversation);
conversationRouter.delete("/deleteAll", checkPermission("CONV_D"), deleteAllConversations);
conversationRouter.put("/updateTitle/:convId", checkPermission("CONV_U"), updateConversationTitle);