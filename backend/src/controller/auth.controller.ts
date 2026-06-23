import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../service/auth.service';
import type { LoginRequest, RegisterRequest } from '../dto/auth.dto';
import { generateAccessToken } from '../utils/tokenGenerator';

const authService = new AuthService();

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userData: RegisterRequest = {
      email: req.body.email,
      fullname: req.body.fullname,
      groups: req.body.groups ? req.body.groups : null,
    };
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
      res.status(200).json(result);
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
    res.status(401).json({ message: "Unauthorized"});
  }
}
export const changePassword = async(req:Request, res: Response, next:NextFunction)=>{
  try{
      if(req.user){
      const response = await authService.authChangePassword({id: req.user.id, currentPassword: req.body.currentPassword? req.body.currentPassword : null, newPassword: req.body.newPassword});
      if(response){
        const newToken = generateAccessToken(req.user.id, req.user.email, req.user.address, req.user.phoneNumber, req.user.userAccess, req.user.groupAccess, req.user.fullname, true, req.user.groups);
        res.status(200).json(newToken);
      } else{
        res.status(500).json({message: "Unexpected Error"});
      }
    }
  }catch(error){
    next(error);
  }
}