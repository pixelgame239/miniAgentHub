import express, { Router } from 'express';
import { register, login, getMe, changePassword, refreshAccessToken, logout, sendResetPasswordMagicLink, resetPassword, verifyResetPasswordToken } from '../controller/auth.controller';
import { jwtVerify } from '../middleware/jwt.middleware';
import { checkPermission } from '../utils/checkPermission';

const authRouter: Router = express.Router();

authRouter.post('/login', login);
authRouter.post("/refresh", refreshAccessToken);
authRouter.post("/sendResetMagicLink", sendResetPasswordMagicLink);
authRouter.post("/verifyResetMagicLink", verifyResetPasswordToken);
authRouter.put("/resetPassword", resetPassword);
authRouter.use(jwtVerify);
authRouter.post("/logout", logout);
authRouter.post('/register', checkPermission("USER_C"), register);
authRouter.get('/me', getMe);
authRouter.patch('/changePassword', changePassword);
export default authRouter;