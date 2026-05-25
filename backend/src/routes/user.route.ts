import express, { Router } from 'express';
import { checkAdmin } from '../middleware/admin.middleware';
import { fetchAllUsers, updateUser } from '../controller/user.controller';
import { checkPermission } from '../utils/checkPermission';

export const userRouter: Router = express.Router();
// userRouter.use(checkAdmin);
userRouter.get("/", checkPermission("USER_R"), fetchAllUsers);
userRouter.put("/updateUser/:userId" , checkPermission("USER_U"), updateUser)