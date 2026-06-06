/*
  Warnings:

  - You are about to drop the column `studentId` on the `submissions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,assessmentId]` on the table `submissions` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `submissions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "submissions" DROP CONSTRAINT "submissions_studentId_fkey";

-- DropIndex
DROP INDEX "submissions_studentId_assessmentId_key";

-- AlterTable
ALTER TABLE "submissions" DROP COLUMN "studentId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "submissions_userId_assessmentId_key" ON "submissions"("userId", "assessmentId");

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
