import jwt, { type SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const generateAccessToken = (id: number, email: string, userAcess: boolean, groupAccess:boolean, fullname: string, active: boolean, groups: number[]): string => {
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET as string;
  const payload = {
    id,
    email,
    userAcess,
    groupAccess,
    fullname,
    active,
    groups
  };

  const options: SignOptions = {
    expiresIn: '1d',
  };

  return jwt.sign(payload, accessTokenSecret, options);
};
