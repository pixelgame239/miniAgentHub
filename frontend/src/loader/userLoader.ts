import type { LoaderFunction } from "react-router";
import { getUsers } from "../api/userApi";
import type { Group } from "./groupLoader";

export interface User {
  id: number;
  fullname: string;
  email: string;
  groups: Group[];
  active: boolean;
}
export const userLoader:LoaderFunction = async ():Promise<User[]> => {
    const { data: users, error } = await getUsers();
    if(users){
        return users;
    }
    if(error){
        console.error("Failed to fetch users:", error);
    }
    return [];
};