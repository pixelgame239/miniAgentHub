// middleware/checkPermission.js

import type { NextFunction, Request, Response } from "express";
import { MyError } from "./MyError";
import { prisma } from "../../lib/prisma";

export const narrowCheckPermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user || !user.groups) {
        throw new MyError("Forbidden", 403);
      }
      const hasPermission = requiredPermission === "USER" ? user.userAccess : requiredPermission === "GROUP" ? user.groupAccess : false;

      if (!hasPermission) {
        throw new MyError("Forbidden", 403);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
export const checkPermission = (requiredPermission:string) => {
  return async(req:Request, res:Response, next:NextFunction) => {
    try {
      const user = req.user; 

      if (!user || !user.groups) {
        throw new MyError("Forbidden",403)
      }
      const groupIds = user.groups.map((group)=>group.id);
      const hasPermission = await prisma.group.findFirst({
        where: {
          id: { in: groupIds },
          permissions: {
            has: requiredPermission 
          }
        }
      });

      if (!hasPermission) {
        console.log(`User does not have required permission: ${requiredPermission}`);
        throw new MyError("Forbidden",403)
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
const getPermissionsForGroup = async (groupId: number): Promise<string[]> => {
  const permissions = await prisma.group.findUnique({
    where: { id: groupId },
    select: { permissions: true },
  });
  return permissions ? permissions.permissions : [];
};