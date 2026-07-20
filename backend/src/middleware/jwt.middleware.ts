import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { MyError } from "../utils/MyError";
import { UNAUTHORIZED_ERROR } from "../utils/generalKey";
import { AuthService } from "../service/auth.service";
import { generateAccessToken } from "../utils/tokenGenerator";

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
const authService = new AuthService();
export const jwtVerify = async (req: Request, res: Response, next: NextFunction) => {
    let token = req.cookies.accessToken;

    if (!token) {
        return await handleRefreshToken(req, res, next);
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, async (err: any, decoded: any) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                return await handleRefreshToken(req, res, next);
            }
            return res.status(401).json({ errorCode: "TOKEN_INVALID", message: "Token không hợp lệ" });
        }

        req.user = decoded;
        next();
    });
};  
const handleRefreshToken = async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ errorCode: "TOKEN_NOT_FOUND", message: "Không tìm thấy Token" });
    }

    try {
        const userId = await jwtVerifyRefreshToken(refreshToken);
        
        if (isNaN(Number(userId))) {
            return res.status(401).json({ errorCode: "TOKEN_INVALID", message: "Token không hợp lệ" });
        }

        const userData = await authService.getUserMetadata(userId);

        res.cookie('accessToken', generateAccessToken(userData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 15 * 60 * 1000, 
        });

        req.user = userData;
        next(); 
    } catch (error) {
        return res.status(401).json({ errorCode: "REFRESH_TOKEN_EXPIRED", message: "Phiên đăng nhập hết hạn" });
    }
};
export const jwtVerifyRefreshToken = (refreshToken: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string, (err: any, decoded: any) => {
            if (err) return reject(err);
            resolve(decoded.id);
        });
    });
};