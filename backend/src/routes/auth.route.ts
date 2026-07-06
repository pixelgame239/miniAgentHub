import express, { Router } from 'express';
import { register, login, getMe, changePassword } from '../controller/auth.controller';
import { jwtVerify } from '../middleware/jwt.middleware';
import { checkPermission } from '../utils/checkPermission';

const authRouter: Router = express.Router();

authRouter.post('/login', login);
authRouter.use(jwtVerify);
authRouter.post('/register', checkPermission("USER_C"), register);
authRouter.get('/me', getMe);
authRouter.patch('/changePassword', changePassword);
export default authRouter;