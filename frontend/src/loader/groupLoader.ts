import type { LoaderFunction } from "react-router";
import { getAllGroups } from "../api/groupApi";
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
// export const userGroupLoader:LoaderFunction = async():Promise<Group[]>=>{
//     try {
//         const response = await getUserGroups();
//         if(response.data){
//             return response.data;
//         }
//         return [];
//     } catch(err){
//         console.error(err);
//         return [];
//     }
// }
export const layoutLoader: LoaderFunction = async():Promise<{AIModels: AIModels[]}> => {
    try {
        // const userGroups = await getUserGroups();
        const aiModels = await getGroqModels();
        if(aiModels){
            return {AIModels: aiModels.data||[]};
        }
        return {AIModels: []};
    } catch(err){
        console.error(err);
        return {AIModels: []};
    }
}