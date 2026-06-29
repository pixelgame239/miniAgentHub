/*
  Warnings:

  - You are about to drop the column `AIModel` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `APIKey` on the `User` table. All the data in the column will be lost.
  - Added the required column `AIModel` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "AIModel";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "AIModel" TEXT NOT NULL,
ADD COLUMN     "fileContent" TEXT,
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "APIKey",
ADD COLUMN     "DeepSeekAPIKey" TEXT,
ADD COLUMN     "FlowiseAPIKey" TEXT,
ADD COLUMN     "FlowiseURL" TEXT,
ADD COLUMN     "GroqAPIKey" TEXT;
