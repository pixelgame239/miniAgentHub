import type { LoaderFunction } from "react-router";
import { getAllGroups } from "../api/groupApi";
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

export const layoutLoader: LoaderFunction = async():Promise<{conversations: Conversation[], totalPages: number}> => {
    const { data, error } = await getConversations(0) as { 
        data: { conversations: Conversation[], totalPages: number } | null, 
        error: any 
    };
    if(error){
        console.error("Failed to fetch conversations:", error);
        return { conversations: [], totalPages: 0 };
    }
    return { conversations: data?.conversations || [], totalPages: data?.totalPages || 0 };
}