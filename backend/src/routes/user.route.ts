import express, { Router } from 'express';
import { checkAdmin } from '../middleware/admin.middleware';
import { deleteAccount, deleteUser, fetchAllUsers, findUsers, getGroupUsers, updateAddress, updatePhoneNumber, updateUser } from '../controller/user.controller';
import { checkPermission, narrowCheckPermission } from '../utils/checkPermission';

export const userRouter: Router = express.Router();
// userRouter.use(checkAdmin);
userRouter.put("/updateAddress/:userId", updateAddress);
userRouter.put("/updatePhoneNumber/:userId", updatePhoneNumber);
userRouter.delete("/deleteAccount", deleteAccount)
userRouter.use(narrowCheckPermission("USER"));
userRouter.get("/", checkPermission("USER_R"), fetchAllUsers);
userRouter.get("/find", checkPermission("USER_R"), findUsers)
userRouter.get("/:groupId", checkPermission("USER_R"), getGroupUsers);
userRouter.put("/updateUser/:userId" , checkPermission("USER_U"), updateUser)
userRouter.delete("/deleteUser/:userId", checkPermission("USER_D"), deleteUser);
