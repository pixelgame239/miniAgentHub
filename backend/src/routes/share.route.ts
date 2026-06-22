import express, { Router } from 'express';
import { jwtVerify } from '../middleware/jwt.middleware';
import { checkPermission, narrowCheckPermission } from '../utils/checkPermission';
import { getSharedConversation, shareConversation, shareMessage } from '../controller/share.controller';

export const shareRouter: Router = express.Router();

shareRouter.get("/conversation/:shareId", getSharedConversation);
shareRouter.post('/:conversationId', jwtVerify, checkPermission("CHAT"), shareConversation);
shareRouter.post('/message/:messageId', jwtVerify, checkPermission("CHAT"), shareMessage);