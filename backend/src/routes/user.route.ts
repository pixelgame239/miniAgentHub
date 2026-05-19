import express, { Router } from 'express';
import { checkAdmin } from '../middleware/admin.middleware';
import { fetchAllUsers, updateUser } from '../controller/user.controller';

export const userRouter: Router = express.Router();
userRouter.use(checkAdmin);
userRouter.get("/", fetchAllUsers);
userRouter.put("/updateUser/:userId", updateUser)