import type { LoaderFunction } from "react-router";
import { countUsers, getUsers } from "../api/userApi";
import type { Group } from "./groupLoader";

export interface User {
  id: number;
  fullname: string;
  email: string;
  groups: Group[];
  active: boolean;
}
export const userLoader:LoaderFunction = async ():Promise<{ totalPages: number, users: User[] }> => {
    const { data: users, error } = await getUsers(0);
    const { data: countData, error: countError } = await countUsers();
    if(countError){
        console.error("Failed to fetch user count:", countError);
    } else {
        
        console.log("Total users:", countData);
    }
    if(users){
        return { totalPages: countData || 0, users };
    }
    if(error){
        console.error("Failed to fetch users:", error);
    }
    return { totalPages: 0, users: [] };
};