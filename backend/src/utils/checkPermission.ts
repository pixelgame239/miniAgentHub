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
      const hasPermission = requiredPermission === "USER" ? user.userAcess : requiredPermission === "GROUP" ? user.groupAccess : false;

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
  return (req:Request, res:Response, next:NextFunction) => {
    try {
      const user = req.user; 

      if (!user || !user.groups) {
        throw new MyError("Forbidden",403)
      }

      const hasPermission = user.groups.some(async (group: any) => {
        const groupPermissions = await getPermissionsForGroup(group.id); 
        return groupPermissions.includes(requiredPermission);
      });

      if (!hasPermission) {
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