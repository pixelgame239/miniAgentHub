import { prisma } from "../../lib/prisma";
import { FORBIDDEN_ERROR, INTERNAL_SERVER_ERROR, NOT_FOUND_ERROR } from "../utils/generalKey";
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
                throw new MyError(NOT_FOUND_ERROR, 404);
            }
            return conversationData;
        } catch (error) {
            console.error("Error exporting conversation:", error);
            throw new MyError(INTERNAL_SERVER_ERROR, 500);
        }
    }
    public async exportMessage(userId: number, messageId: number) {
        try {
            const targetMessage = await prisma.message.findUnique({
            where: { id: messageId },
            include: { conversation: true }
            });

            if (!targetMessage || !targetMessage.conversation) {
                throw new MyError(NOT_FOUND_ERROR, 404);
            }

            const conversationData = targetMessage.conversation;
            if (conversationData.userId !== userId) {
                throw new MyError(FORBIDDEN_ERROR, 403);
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
            throw new MyError(INTERNAL_SERVER_ERROR, 500);
        }
    }
}