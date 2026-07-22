import express, { Router } from 'express';
import { countUsers, deleteAccount, deleteUser, fetchAllUsers, findUsers, getGroupUsers, resendVerificationEmail, updateAIConfig, updateAddress, updatePhoneNumber, updateUser } from '../controller/user.controller';
import { checkPermission } from '../utils/checkPermission';

export const userRouter: Router = express.Router();
// userRouter.use(checkAdmin);
userRouter.put("/updateAddress/:userId", updateAddress);
userRouter.put("/updatePhoneNumber/:userId", updatePhoneNumber);
userRouter.put("/updateAIConfig/:userId", updateAIConfig);
userRouter.delete("/deleteAccount", deleteAccount)
// userRouter.use(narrowCheckPermission("USER"));
userRouter.get("/", checkPermission("USER_R"), fetchAllUsers);
userRouter.get("/count", checkPermission("USER_R"), countUsers);
userRouter.get("/find", checkPermission("USER_R"), checkPermission("GROUP_ADD_USER"), findUsers)
userRouter.get("/:groupId", checkPermission("USER_R"), getGroupUsers);
userRouter.put("/updateUser/:userId" , checkPermission("USER_U"), updateUser)
userRouter.delete("/deleteUser/:userId", checkPermission("USER_D"), deleteUser);
userRouter.post("/resendVerificationEmail", checkPermission("USER_R"), resendVerificationEmail);
