import express, { Router } from "express";
import { fetchAllGroups, fetchUserGroups } from "../controller/group.controller";
import { checkAdmin } from "../middleware/admin.middleware";

export const groupRouter:Router = express.Router();

groupRouter.get("/", checkAdmin, fetchAllGroups);
groupRouter.get("/mygroups", fetchUserGroups);