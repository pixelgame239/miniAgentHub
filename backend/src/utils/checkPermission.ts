// middleware/checkPermission.js

import type { NextFunction, Request, Response } from "express";
import { MyError } from "./MyError";

export const checkPermission = (requiredPermission:string) => {
  return (req:Request, res:Response, next:NextFunction) => {
    try {
      const user = req.user; 

      if (!user || !user.permissions) {
        throw new MyError("Forbidden",403)
      }

      const hasPermission = user.permissions.includes(requiredPermission);

      if (!hasPermission) {
        throw new MyError("Forbidden",403)
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
