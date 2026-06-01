/*
  Warnings:

  - You are about to drop the column `groupId` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `permission` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `user_role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_groupId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_user_role_fkey";

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "groupId";

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "permissions" TEXT[];

-- AlterTable
ALTER TABLE "User" DROP COLUMN "permission",
DROP COLUMN "user_role";

-- DropTable
DROP TABLE "Role";
