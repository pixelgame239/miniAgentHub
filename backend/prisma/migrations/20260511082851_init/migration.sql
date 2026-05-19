/*
  Warnings:

  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - Added the required column `user_role` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "user_role" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Role" (
    "roleId" TEXT NOT NULL,
    "permission" TEXT[],

    CONSTRAINT "Role_pkey" PRIMARY KEY ("roleId")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_user_role_fkey" FOREIGN KEY ("user_role") REFERENCES "Role"("roleId") ON DELETE CASCADE ON UPDATE CASCADE;
