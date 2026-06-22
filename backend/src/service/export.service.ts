import { prisma } from "../../lib/prisma";
import { MyError } from "../utils/MyError";

export class ExportService {
    public async exportAllMessages(conversationId: number) {
        try{
            const conversationData = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: {
                messages: {
                orderBy: {
                    createdAt: "asc",
                },
                },
            },
            });
            return conversationData;
        } catch (error) {
            console.error("Error exporting conversation:", error);
            throw new MyError("Failed to export conversation", 500);
        }
    }
    public async exportMessage(messageId: number) {
        try {
            const targetMessage = await prisma.message.findUnique({
            where: { id: messageId },
            include: { conversation: true }
            });

            if (!targetMessage || !targetMessage.conversation) {
            throw new MyError("Message or associated Conversation not found", 404);
            }

            const conversationData = targetMessage.conversation;

            const pairMessages = await prisma.message.findMany({
            where: {
                conversationId: conversationData.id,
                createdAt: {
                lte: targetMessage.createdAt
                }
            },
            orderBy: {
                createdAt: "desc"
            },
            take: 2
            });

            pairMessages.reverse();

            const sharedSnapshot = {
            ...conversationData,
            messages: pairMessages 
            };

            return sharedSnapshot;
        } catch (error) {
            console.error("Error exporting message:", error);
            throw new MyError("Failed to export message", 500);
        }
    }
}