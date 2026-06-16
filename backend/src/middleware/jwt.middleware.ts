import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { MyError } from "../utils/MyError";

declare global{
    namespace Express{
        interface Request{
            user?:{
                id: number,
                email: string,
                address: string|null,
                phoneNumber: string|null,
                userAccess: boolean,
                groupAccess: boolean,
                fullname: string,
                active: boolean,
                groups: {id: number, groupName:string}[]
            }
        }
    }
}
export const jwtVerify = (req:Request, res:Response, next:NextFunction) =>{
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];
    if(!token){ 
        throw new MyError("Unauthorized",401);
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, (err:any, decoded:any) => {
        if(err){
            next(err)
        }
        req.user = decoded;
        next();
        }
    )
}   