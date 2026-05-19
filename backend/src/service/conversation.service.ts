import { prisma } from "../../lib/prisma";

export class ConversationService {
    public async getConversations(id: number){
        const response = await prisma.conversation.findMany({where:{userId:id}});
        return response;
    }
    public async createNewConversation(id: number){
        const response = await prisma.conversation.create({data:{title: "New conversation",userId:id}});
        return response;
    }   
}