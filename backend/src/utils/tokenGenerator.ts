import jwt, { type SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
export type TokenPayload = {
  id: number;
  email: string;
  address: string | null;
  phoneNumber: string | null;
  permissions: string[];
  fullname: string;
  active: boolean;
  groups: { id: number; groupName: string }[];
};

//Implement refresh token
export const generateRefreshToken = (userId: number) => {
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET as string;
  const options: SignOptions = {
    expiresIn: '7d',
  };
  return jwt.sign({ id: userId }, refreshTokenSecret, options);
};
export const generateAccessToken = (payload: TokenPayload) => {
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET as string;
  const options: SignOptions = {
    expiresIn: '5m',
  };
  return jwt.sign(payload, accessTokenSecret, options);
};