import { useContext } from "react"
import { AuthContext } from "../context/AuthContext"

export const useAuth = () =>{
    const context = useContext(AuthContext);
    if(context===undefined){
        throw new Error("Unexpected Error");
    }
    return context;
}