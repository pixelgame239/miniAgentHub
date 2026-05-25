import { prisma } from "../../lib/prisma";
import { MyError } from "../utils/MyError";

export class ConversationService {
    public async getConversations(id: number, groupId: number){
        let findGroupId;
        findGroupId=groupId;
        if(groupId==-1){
            findGroupId=null;
        }
        const response = await prisma.conversation.findMany({where:{userId:id, groupId:findGroupId}});
        return response;
    }
    public async createNewConversation(id: number, title:string, model: string, groupId: any){
        const response = await prisma.conversation.create({data:{title: title,userId:id,AIModel: model, groupId:groupId}, select:{
            id: true,
            title: true,
            AIModel:true,
            groupId:true
        }});
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