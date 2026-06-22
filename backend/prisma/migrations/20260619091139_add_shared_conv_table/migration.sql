/*
  Warnings:

  - Added the required column `originalId` to the `SharedConversation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SharedConversation" ADD COLUMN     "originalId" INTEGER NOT NULL;
