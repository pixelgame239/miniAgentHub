import { prisma } from "../../lib/prisma";
import { MyError } from "../utils/MyError";

export class ExportService {
    public async exportAllMessages(userId: number, conversationId: number) {
        try{
            const conversationData = await prisma.conversation.findUnique({
            where: { id: conversationId, userId: userId },
            include: {
                messages: {
                orderBy: {
                    createdAt: "asc",
                },
                },
            },
            });
            if (!conversationData) {
                throw new MyError("Conversation not found", 404);
            }
            return conversationData;
        } catch (error) {
            console.error("Error exporting conversation:", error);
            throw new MyError("Failed to export conversation", 500);
        }
    }
    public async exportMessage(userId: number, messageId: number) {
        try {
            const targetMessage = await prisma.message.findUnique({
            where: { id: messageId },
            include: { conversation: true }
            });

            if (!targetMessage || !targetMessage.conversation) {
                throw new MyError("Message or associated Conversation not found", 404);
            }

            const conversationData = targetMessage.conversation;
            if (conversationData.userId !== userId) {
                throw new MyError("Unauthorized access to this message", 403);
            }

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