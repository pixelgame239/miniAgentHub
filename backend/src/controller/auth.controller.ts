import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../service/auth.service';
import type { LoginRequest, RegisterRequest } from '../dto/auth.dto';
import { generateAccessToken } from '../utils/tokenGenerator';
import { checkAdmin } from '../utils/checkPermission';
import { INTERNAL_SERVER_ERROR, UNAUTHORIZED_ERROR } from '../utils/generalKey';

const authService = new AuthService();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userData: RegisterRequest = {
      email: req.body.email,
      fullname: req.body.fullname,
      groups: req.body.groups ? req.body.groups : null,
    };
    if(userData.groups.some((group:any)=> group.groupName === "ADMIN")){
        const isAdmin = checkAdmin(req);
        if(!isAdmin){
            res.status(403).json({message: "Forbidden: Only admins can create users with ADMIN group"});
            return;
        }
    }
    const result = await authService.authRegister(userData, req.body.lang);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userData: LoginRequest = {
      email: req.body.email,
      userPassword: req.body.userPassword,
    };  
    const result = await authService.authLogin(userData);
    if (result) {
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Chỉ gửi cookie qua HTTPS trong môi trường production
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Ngăn chặn CSRF
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      });
      res.cookie('accessToken', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Chỉ gửi cookie qua HTTPS trong môi trường production
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Ngăn chặn CSRF
        maxAge: 15 * 60 * 1000, 
      });
      res.status(200).json(result.userData);
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    next(error);
  }
};
export const getMe = async(req:Request, res: Response, next:NextFunction) =>{
  if(req.user){
    res.status(200).json(req.user);
  } else{
    res.status(401).json({ message: UNAUTHORIZED_ERROR });
  }
}
export const changePassword = async(req:Request, res: Response, next:NextFunction)=>{
  try{
      if(req.user){
      const response = await authService.authChangePassword({id: req.user.id, currentPassword: req.body.currentPassword? req.body.currentPassword : null, newPassword: req.body.newPassword});
      if(response){
        if(req.user){
          if(!req.user.active){
            const tokenPayload = {
              id: req.user.id,
              email: req.user.email,
              address: req.user.address,
              phoneNumber: req.user.phoneNumber,
              permissions: req.user.permissions,
              fullname: req.user.fullname,
              active: true,
              groups: req.user.groups.map((group:any)=>({id: group.id, groupName: group.groupName}))
            }
            res.clearCookie("accessToken");
            const newToken = generateAccessToken(tokenPayload);
            res.cookie('accessToken', newToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production', // Chỉ gửi cookie qua HTTPS trong môi trường production
              sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Ngăn chặn CSRF
              maxAge: 15 * 60 * 1000, 
            });
            res.status(200).json(newToken);
          }
          else{
            res.status(200).json({message: "Password changed successfully"});
          }
        }
      } else{
        res.status(500).json({message: INTERNAL_SERVER_ERROR});
      }
    }
  }catch(error){
    next(error);
  }
}
export const refreshAccessToken = async(req:Request, res: Response, next:NextFunction)=>{
  try{
    const refreshToken = req.cookies.refreshToken;
    const accessToken = req.cookies.accessToken;
    if(!refreshToken || !accessToken){
      res.status(400).json({message: "Refresh token and access token are required"});
      return;
    }
    const result = await authService.authRefreshToken(refreshToken, accessToken);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Chỉ gửi cookie qua HTTPS trong môi trường production
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Ngăn chặn CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });
    res.cookie('accessToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Chỉ gửi cookie qua HTTPS trong môi trường production
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Ngăn chặn CSRF
      maxAge: 15 * 60 * 1000, 
    });
    res.status(200).json("Refreshed");
    return;
  }catch(error){
    next(error);
  }
}
export const logout = async(req:Request, res: Response, next:NextFunction)=>{
  try{
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken){
      res.status(400).json({message: "Refresh token is required"});
      return;
    }
    await authService.authLogout(refreshToken);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({message: "Logged out successfully"});
    return;
  }catch(error){
    next(error);
  }
}
export const sendResetPasswordMagicLink = async(req:Request, res: Response, next:NextFunction)=>{
  try{
    const {email, lang} = req.body;
    if(!email){
      res.status(400).json({message: "Email is required"});
      return;
    }
    await authService.sendResetPasswordMagicLink(email, lang);
    res.status(200).json({message: "Reset password magic link sent successfully"});
    return;
  }catch(error){
    next(error);
  }
}
export const verifyResetPasswordToken = async(req:Request, res: Response, next:NextFunction)=>{
  try{
    const {email, token} = req.body;
    if(!email || !token){
      res.status(400).json({message: "Email and token are required"});
      return;
    }
    const result = await authService.verifyResetPasswordToken(email, token);
    if(!result){
      res.status(400).json({message: "Invalid or expired token"});
      return;
    }
    res.status(200).json({message: "Token is valid"});
    return;
  }catch(error){
    next(error);
  }
}
export const resetPassword = async(req:Request, res: Response, next:NextFunction)=>{
  try{
    const {email, token, newPassword} = req.body;
    if(!email || !token || !newPassword){
      res.status(400).json({message: "Email, token and new password are required"});
      return;
    }
    await authService.resetPassword(email, token, newPassword);
    res.status(200).json({message: "Password reset successfully"});
    return;
  }catch(error){
    next(error);
  }
}