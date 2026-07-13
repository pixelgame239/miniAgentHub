import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { MyError } from "../utils/MyError";
import { UNAUTHORIZED_ERROR } from "../utils/generalKey";

declare global{
    namespace Express{
        interface Request{
            user?:{
                id: number,
                email: string,
                address: string|null,
                phoneNumber: string|null,
                permissions: string[],
                fullname: string,
                active: boolean,
                groups: {id: number, groupName:string}[]
            }
        }
    }
}
export const jwtVerify = (req:Request, res:Response, next:NextFunction) =>{
    const token = req.cookies.accessToken;
    if(!token){ 
        throw new MyError(UNAUTHORIZED_ERROR, 401);
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, (err:any, decoded:any) => {
        if(err){
            if(err.name === "TokenExpiredError"){
                res.status(401).json({ errorCode: "TOKEN_EXPIRED", message: "Token expired" });
                return;
            }
            next(err)
        }
        req.user = decoded;
        next();
        }
    )
}   