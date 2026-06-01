import type { LoaderFunction } from "react-router";
import { getAllGroups } from "../api/groupApi";
import type { AIModels } from "./aiLoader";
import { getGroqModels } from "../api/aiApi";
import { getConversations } from "../api/conversationApi";

export interface Group {
  id: number;
  groupName: string;
  totalUsers?:number,
  permissions?:string[]
}
export interface Conversation {
  id: number;
  title: string;
  AIModel: string;
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
export const layoutLoader: LoaderFunction = async():Promise<{conversations: Conversation[], AIModels: AIModels[]}> => {
    try {
        // const userGroups = await getUserGroups();
        const aiModels = await getGroqModels();
        const conversations = await getConversations();
        if(aiModels&&conversations){
            return {AIModels: aiModels.data||[], conversations: conversations.data||[]};
        }
        return {AIModels: [], conversations: []};
    } catch(err){
        console.error(err);
        return {AIModels: [], conversations: []};
    }
}