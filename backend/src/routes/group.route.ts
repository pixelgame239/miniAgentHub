import express, { Router } from "express";
import { addUserToGroup, createNewGroup, deleteGroup, fetchAllGroups, fetchUserGroups, removeUserFromGroup, updateGroupName, viewGroupDetail } from "../controller/group.controller";
import { checkAdmin } from "../middleware/admin.middleware";
import { checkPermission } from "../utils/checkPermission";

export const groupRouter:Router = express.Router();

groupRouter.get("/", checkPermission("GROUP_R"), fetchAllGroups);
groupRouter.get("/mygroups", fetchUserGroups);
groupRouter.post("/create", checkPermission("GROUP_C"), createNewGroup);
groupRouter.delete("/delete/:groupId", checkPermission("GROUP_D"), deleteGroup)
groupRouter.patch("/addUser/:groupId/:userId", checkPermission("GROUP_U"), addUserToGroup);
groupRouter.patch("/removeUser/:groupId/:userId", checkPermission("GROUP_U"), removeUserFromGroup);
groupRouter.put("/updateGroup/:groupId", checkPermission("GROUP_U"), updateGroupName);
groupRouter.get("/groupDetail/:groupId", checkPermission("GROUP_R"), viewGroupDetail);