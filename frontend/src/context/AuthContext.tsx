import React, {createContext, useEffect, useState, type ReactNode } from "react";
import { getMe } from "../api/authApi";
import { getToken, removeToken } from "../api/apiClient";

interface UserType{
    id:number;
    email: string; 
    userRole: string;
    fullname: string;
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
        const token = getToken();
        const getUserData = async()=>{
            try{
                const response = await getMe();
                setUser(response.data)
            }catch(err){
                console.error(err);
                removeToken();
            } finally{
                setLoading(false);
            }
        }
        if(token){
            setLoading(true);
            getUserData();      
        }else{
            setLoading(false);
        }
    },[]);
    return(
        <AuthContext.Provider value={{user, setUser, loading, setLoading }}>
            {children}
        </AuthContext.Provider>
    )
}