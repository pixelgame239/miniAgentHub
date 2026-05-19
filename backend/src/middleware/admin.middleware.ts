import type { NextFunction, Request, Response } from "express";
import { MyError } from "../utils/MyError";

export const checkAdmin = (req:Request, response: Response, next: NextFunction) =>{
    const user = req.user;
    if(user?.userRole !== "ADMIN"){
        throw new MyError("Forbidden", 403);
    }
    next();
}
