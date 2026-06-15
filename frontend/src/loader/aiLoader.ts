import type { LoaderFunction } from "react-router"
import { getGroqModels } from "../api/aiApi";

export interface AIModels{
    id: string
}
export const aiLoader: LoaderFunction = async():Promise<AIModels[]>=>{
    const {data, error} = await getGroqModels();
    if(data){
        return data;
    }
    if(error){
        console.error("Failed to fetch AI models:", error);
    }
    return [];
}