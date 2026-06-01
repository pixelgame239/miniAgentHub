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
    try{
        const response = await getUsers();
        if(response.data){
            return response.data;
        }
        return [];
    } catch(err){
        console.error(err);
        return [];
    }
};