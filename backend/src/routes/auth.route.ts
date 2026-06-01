import express, { Router } from 'express';
import { register, login, getMe, changePassword } from '../controller/auth.controller';
import { checkAdmin } from '../middleware/admin.middleware';
import { jwtVerify } from '../middleware/jwt.middleware';
import { checkPermission, narrowCheckPermission } from '../utils/checkPermission';

const authRouter: Router = express.Router();

authRouter.post('/login', login);
authRouter.use(jwtVerify);
authRouter.post('/register', narrowCheckPermission("USER"), checkPermission("USER_C"), register);
authRouter.get('/me', getMe);
authRouter.patch('/changePassword', changePassword);
export default authRouter;