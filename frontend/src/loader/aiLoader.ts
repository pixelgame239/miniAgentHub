import type { LoaderFunction } from "react-router"
import { getGroqModels } from "../api/aiApi";

export interface AIModels{
    id: string
}
export const aiLoader: LoaderFunction = async():Promise<AIModels[]>=>{
    try{
        const response = await getGroqModels();
        if(response.data){
            return response.data;
        }
        return [];
    }catch(error){
        console.error();
        return[];
    }
}