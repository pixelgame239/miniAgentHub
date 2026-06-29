import express, { Router } from "express";
import { addUserToGroup, createNewGroup, deleteGroup, fetchAllGroups, removeUserFromGroup, updateGroupData, viewGroupDetail } from "../controller/group.controller";
import { checkPermission, narrowCheckPermission } from "../utils/checkPermission";

export const groupRouter:Router = express.Router();
groupRouter.use(narrowCheckPermission("GROUP"));
groupRouter.get("/", checkPermission("GROUP_R"), fetchAllGroups);
// groupRouter.get("/mygroups", fetchUserGroups);
groupRouter.post("/create", checkPermission("GROUP_C"), createNewGroup);
groupRouter.delete("/delete/:groupId", checkPermission("GROUP_D"), deleteGroup)
groupRouter.patch("/addUser/:groupId", checkPermission("GROUP_ADD_USER"), addUserToGroup);
groupRouter.patch("/removeUser/:groupId/:userId", checkPermission("GROUP_DELETE_USER"), removeUserFromGroup);
groupRouter.put("/updateGroup/:groupId", checkPermission("GROUP_U"), updateGroupData);
groupRouter.get("/groupDetail/:groupId", checkPermission("GROUP_R"), viewGroupDetail);