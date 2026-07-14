import React, {createContext, useEffect, useState, type ReactNode } from "react";
import { getMe } from "../api/authApi";

interface UserType{
    id?:number;
    email?: string; 
    permissions?: string[];
    fullname?: string;
    active?: boolean;
    groups?: {id: number, groupName: string}[];
    address?: string;
    phoneNumber?: string;
}
interface AuthContextType{
    user: UserType|null;
    setUser: React.Dispatch<React.SetStateAction<UserType | null>>;
    loading: boolean;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;

}
export const AuthContext = createContext<AuthContextType|undefined>(undefined);
interface AuthProviderProps {
    children: ReactNode;
}
export const AuthProvider = ({children}:AuthProviderProps) =>{
    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    useEffect(()=>{
        const getUserData = async()=>{
            const {data, error} = await getMe();
            if(data){
                console.log("Fetched user data:", data);
                setUser(data);
            }
            if(error){
                console.error("Failed to fetch user data:", error);
                throw new Error(error.message);
            }
            setLoading(false);
        }
        getUserData();
    },[]);
    return(
        <AuthContext.Provider value={{user, setUser, loading, setLoading }}>
            {children}
        </AuthContext.Provider>
    )
}