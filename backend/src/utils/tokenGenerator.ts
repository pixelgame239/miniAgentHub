import jwt, { type SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const generateAccessToken = (id: number, email: string, address: string|null, phoneNumber: string|null, userAccess: boolean, groupAccess:boolean, fullname: string, active: boolean, groups: {id: number, groupName:string}[]): string => {
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET as string;
  const payload = {
    id,
    email,
    address,
    phoneNumber,
    userAccess,
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
