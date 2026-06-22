import { prisma } from "../../lib/prisma";
import { MyError } from "../utils/MyError";
import { ExportService } from "./export.service";

const exportService = new ExportService();
export class ShareService {
  public async shareConversation(conversationId: number) {
    try{
        const conversationData = await exportService.exportAllMessages(conversationId);
        if(!conversationData){
            throw new MyError("Conversation not found", 404);
        }
        const sharedData = await prisma.sharedConversation.create({
        data: {
            originalId: conversationId,
            title: conversationData.title,
            snapShotData: JSON.stringify(conversationData),
        },
        });
        return `/sharedChat/${sharedData.id}`;  
    } catch (error) {
        console.error("Error sharing conversation:", error);
        throw new MyError("Failed to share conversation", 500);
    }
  }
  public async shareMessage(messageId: number) {
    try {
      const sharedSnapshot = await exportService.exportMessage(messageId);

      const sharedData = await prisma.sharedConversation.create({
        data: {
          originalId: sharedSnapshot.id,
          title: sharedSnapshot.title,
          snapShotData: JSON.stringify(sharedSnapshot),
        },
      });

      return `/sharedChat/${sharedData.id}`;
    } catch (error) {
      console.error("Error sharing message pair:", error);
      if (error instanceof MyError) throw error;
      throw new MyError("Failed to share message pair", 500);
    }
  }
  public async getSharedConversation(sharedId: string) {
    try {
      const sharedData = await prisma.sharedConversation.findUnique({
        where: { id: sharedId }, select: {
            snapShotData: true
        }
      });

      if (!sharedData) {
        throw new MyError("Shared conversation not found", 404);
      }

      return sharedData;
    } catch (error) {
      console.error("Error retrieving shared conversation:", error);
      throw new MyError("Failed to retrieve shared conversation", 500);
    }
  }
}