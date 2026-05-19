    import type { NextFunction, Request, Response } from "express";

    export const errorHandler = (err:any, req: Request, res:Response, next:NextFunction) =>{
        console.error("Error:", err.message||err)
        const errStatus = err.status || 500;
        const errMessage = err.message || "Internal server error";
        res.status(errStatus).json({
            success: false,
            errStatus,
            message: errMessage,
            stack: err.stack || undefined
        });
    }