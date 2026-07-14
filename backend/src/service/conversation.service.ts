import { prisma } from "../../lib/prisma";
import { MyError } from "../utils/MyError";

export class ConversationService {
    public async getConversations(id: number, page: number){
        const [totalItems, conversations] = await prisma.$transaction([
            prisma.conversation.count({
                where: { userId: id }
            }),
            prisma.conversation.findMany({
                where: { userId: id },
                orderBy: { id: "desc" },
                skip: (page) * 10,
                take: 10,
            })
        ]);
        const totalPages = Math.ceil(totalItems / 10);
        return { totalPages, conversations }
    }
    public async createNewConversation(id: number, title:string){
        const response = await prisma.conversation.create({data:{title: title,userId:id}, select:{
            id: true,
            title: true,
            messages: {
                orderBy: {
                    createdAt:"asc"
                }
            }
        }});
        return response;
    }
    public async getConversationDetail(userId:number, convId: number, page: number){
        if(isNaN(convId)){
            throw new MyError("Not found", 404);
        }
        const  [data, totalItems] = await prisma.$transaction([
            prisma.conversation.findUnique({where: {userId: userId, id:convId}, include:{
            messages: {
                orderBy: {
                    createdAt:"asc"
                }, skip: (page) * 10, take: 10
            }
        }}),
        prisma.message.count({where:{conversationId: convId}})
        ])
        if(!data){
            throw new MyError("Not found", 404);
        }
        const totalPages = Math.ceil(totalItems / 10);
        return { id: data.id, title: data.title,messages: data.messages, totalPages: totalPages };
    }
    public async deleteConversation(convId:number, userId: number){
        const response = await prisma.conversation.findFirst({where:{id: convId, userId:userId}});
        if(!response) throw new MyError("Forbidden",403);
        const deleteRes = await prisma.conversation.delete({where:{id: convId}});
        return deleteRes;
    }   
    public async deleteAllConversations(userId:number){
        const response = await prisma.conversation.deleteMany({where:{userId: userId}});
        return response;
    }
    public async updateConversationTitle(userId: number, convId: number, title: string){
        const response = await prisma.conversation.update({where:{id: convId, userId: userId}, data:{title: title}});
        return response;
    }
}