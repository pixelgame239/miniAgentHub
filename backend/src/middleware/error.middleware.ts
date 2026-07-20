    import type { NextFunction, Request, Response } from "express";
import { INTERNAL_SERVER_ERROR } from "../utils/generalKey";

    export const errorHandler = (err:any, req: Request, res:Response, next:NextFunction) =>{
        console.error("Error:", err.message||err)
        console.error("Stack:", err.stack||"No stack trace available")
        const errStatus = err.status || 500;
        const errMessage = err.message || INTERNAL_SERVER_ERROR;
        if (res.headersSent) {
            return next(err);
        }
        res.status(errStatus).json({
            success: false,
            errStatus,
            message: errMessage,
            // stack: err.stack || undefined
        });
    }