import type { LoaderFunction } from "react-router";
import { getAllGroups, getUserGroups } from "../api/groupApi";
import type { AIModels } from "./aiLoader";
import { getGroqModels } from "../api/aiApi";

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
export const layoutLoader: LoaderFunction = async():Promise<{userGroups: Group[], AIModels: AIModels[]}> => {
    try {
        const userGroups = await getUserGroups();
        const aiModels = await getGroqModels();
        if(userGroups && aiModels){
            return {userGroups: userGroups.data||[], AIModels: aiModels.data||[]};
        }
        return {userGroups:[],AIModels: []};
    } catch(err){
        console.error(err);
        return {userGroups:[],AIModels: []};
    }
}