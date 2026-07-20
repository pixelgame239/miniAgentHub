import { prisma } from "../../lib/prisma";
import { INTERNAL_SERVER_ERROR, NOT_FOUND_ERROR } from "../utils/generalKey";
import { MyError } from "../utils/MyError";
import { ExportService } from "./export.service";

const exportService = new ExportService();
export class ShareService {
  public async shareConversation(userId: number, conversationId: number) {
    try{
        const conversationData = await exportService.exportAllMessages(userId, conversationId);
        if(!conversationData){
            throw new MyError(NOT_FOUND_ERROR, 404);
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
        throw new MyError(INTERNAL_SERVER_ERROR, 500);
    }
  }
  public async shareMessage(userId: number, messageId: number) {
    try {
      const sharedSnapshot = await exportService.exportMessage(userId, messageId);

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
      throw new MyError(INTERNAL_SERVER_ERROR, 500);
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
        throw new MyError(NOT_FOUND_ERROR, 404);
      }

      return sharedData;
    } catch (error) {
      console.error("Error retrieving shared conversation:", error);
      throw new MyError(INTERNAL_SERVER_ERROR, 500);
    }
  }
}