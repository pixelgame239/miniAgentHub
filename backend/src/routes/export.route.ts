import express, { Router } from 'express';
import { checkPermission } from '../utils/checkPermission';
import { exportAllMessages, exportMessage } from '../controller/export.controller';

const exportRouter: Router = express.Router();
exportRouter.post("/conversation/:convId", checkPermission("CHAT"), exportAllMessages);
exportRouter.post("/message/:messageId", checkPermission("CHAT"), exportMessage);
export default exportRouter;
