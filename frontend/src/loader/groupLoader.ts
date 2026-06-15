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
    const { data, error } = await getAllGroups();
    if(data){
        return data;
    }
    if(error){
        console.error("Failed to fetch groups:", error);
    }
    return [];
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
        // const userGroups = await getUserGroups();
    const { data: aiModels, error: aiModelsError } = await getGroqModels();
    const { data: conversations, error: conversationsError } = await getConversations();
    if(aiModels&&conversations){
        return {AIModels: aiModels||[], conversations: conversations||[]};
    }
    if(aiModelsError){
        console.error("Failed to fetch AI models:", aiModelsError);
    }
    if(conversationsError){
        console.error("Failed to fetch conversations:", conversationsError);
    }
    return {AIModels: [], conversations: []};

}