/*
  Warnings:

  - You are about to drop the column `FlowiseURL` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "FlowiseURL",
ADD COLUMN     "FlowiseUrl" TEXT;
