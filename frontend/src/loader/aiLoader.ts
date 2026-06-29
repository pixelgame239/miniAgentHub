import type { LoaderFunction } from "react-router"
import { getGroqModels } from "../api/aiApi";

export interface AIModels{
    id: string
}
// export const aiLoader: LoaderFunction = async():Promise<AIModels[]>=>{
//     const APIKey = localStorage.getItem("APIKey");
//     if(!APIKey){
//         console.error("Missing API Key");
//         return [];
//     }
//     const userAPIKey = APIKey.trim();
//     if(userAPIKey.length === 0){
//         console.error("Empty API Key");
//         return [];
//     }
//     const {data, error} = await getGroqModels(userAPIKey);
//     if(data){
//         return data;
//     }
//     if(error){
//         console.error("Failed to fetch AI models:", error);
//     }
//     return [];
// }