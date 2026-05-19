import type { LoaderFunction } from "react-router";
import { getAllGroups, getUserGroups } from "../api/groupApi";

export interface Group {
  id: number;
  groupName: string;
  totalUsers?:number
}
export const groupLoader:LoaderFunction = async():Promise<Group[]>=>{
    try {
        const response = await getAllGroups();
        if(response.data){
            return response.data;
        }
        return [];
    } catch(err){
        console.error(err);
        return [];
    }
};
export const userGroupLoader:LoaderFunction = async():Promise<Group[]>=>{
    try {
        const response = await getUserGroups();
        if(response.data){
            return response.data;
        }
        return [];
    } catch(err){
        console.error(err);
        return [];
    }
}
