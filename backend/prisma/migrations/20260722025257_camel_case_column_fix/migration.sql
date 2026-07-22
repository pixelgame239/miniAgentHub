/*
  Warnings:

  - You are about to drop the column `AIModel` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `FlowiseAPIKey` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `FlowiseUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `GroqAPIKey` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `OpenRouterAPIKey` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "AIModel",
ADD COLUMN     "aiModel" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "FlowiseAPIKey",
DROP COLUMN "FlowiseUrl",
DROP COLUMN "GroqAPIKey",
DROP COLUMN "OpenRouterAPIKey",
ADD COLUMN     "flowiseApiKey" TEXT,
ADD COLUMN     "flowiseUrl" TEXT,
ADD COLUMN     "groqApiKey" TEXT,
ADD COLUMN     "openRouterApiKey" TEXT;
