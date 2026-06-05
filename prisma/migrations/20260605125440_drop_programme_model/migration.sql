/*
  Warnings:

  - You are about to drop the `Programme` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `studentId` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedAt` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_programmeId_fkey";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "studentId" SET NOT NULL,
ALTER COLUMN "updatedAt" SET NOT NULL;

-- DropTable
DROP TABLE "Programme";
