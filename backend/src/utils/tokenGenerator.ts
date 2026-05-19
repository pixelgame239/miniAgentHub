import jwt, { type SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const generateAccessToken = (id: number, email: string, userRole: string, fullname: string): string => {
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET as string;
  const payload = {
    id,
    email,
    userRole,
    fullname,
  };

  const options: SignOptions = {
    expiresIn: '1d',
  };

  return jwt.sign(payload, accessTokenSecret, options);
};
