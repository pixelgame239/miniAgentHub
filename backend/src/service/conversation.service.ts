import { prisma } from "../../lib/prisma";
import { MyError } from "../utils/MyError";

export class ConversationService {
    public async getConversations(id: number, groupId: number){
        let findGroupId;
        if(groupId==-1){
            findGroupId=null;
        }
        findGroupId=groupId;
        const response = await prisma.conversation.findMany({where:{userId:id, groupId:findGroupId}});
        return response;
    }
    public async createNewConversation(id: number, title:string, model: string){
        const response = await prisma.conversation.create({data:{title: title,userId:id,AIModel: model}});
        return response;
    }
    public async getConversationDetail(userId:number, convId: number){
        if(isNaN(convId)){
            throw new MyError("Not found", 404);
        }
        const response = await prisma.conversation.findUnique({where: {userId: userId, id:convId}, include:{
            messages: {
                orderBy: {
                    id:"asc"
                }
            }
        }})
        return response;
    }   
}