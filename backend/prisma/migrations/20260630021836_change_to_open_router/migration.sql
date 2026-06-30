/*
  Warnings:

  - You are about to drop the column `DeepSeekAPIKey` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "DeepSeekAPIKey",
ADD COLUMN     "OpenRouterAPIKey" TEXT;
