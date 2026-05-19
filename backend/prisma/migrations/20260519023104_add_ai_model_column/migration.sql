/*
  Warnings:

  - Added the required column `AIModel` to the `Conversation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "AIModel" TEXT NOT NULL;
