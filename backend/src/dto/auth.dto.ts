import { IsArray, IsEmail, IsNumber, IsString, MinLength } from "class-validator";

export class RegisterRequest{
    @IsEmail({}, {message:"Invalid email"})
    public email!: string;
    @IsString({message:"Invalid Name"})
    public  fullname!: string;
    @IsArray({message:"Invalid group Id"})
    public groups!: number[];
    public userRole: string | undefined;
}
export class LoginRequest{
    @IsEmail({}, {message:"Invalid email"})
    public email!: string;
    @IsString({message:"Invalid password"})
    @MinLength(6, {message: "Password needs to have at least 6 characters"})
    public userPassword!: string
}