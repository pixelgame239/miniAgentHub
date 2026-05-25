import express, { Router } from "express";
import { fetchAllGroups, fetchUserGroups } from "../controller/group.controller";
import { checkAdmin } from "../middleware/admin.middleware";
import { checkPermission } from "../utils/checkPermission";

export const groupRouter:Router = express.Router();

groupRouter.get("/", checkPermission("GROUP_R"), fetchAllGroups);
groupRouter.get("/mygroups", fetchUserGroups);