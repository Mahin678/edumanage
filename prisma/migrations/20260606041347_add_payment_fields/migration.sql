-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fullDueDate" TIMESTAMP(3),
ADD COLUMN     "fullPaidDate" TIMESTAMP(3),
ADD COLUMN     "fullReferenceNo" TEXT,
ADD COLUMN     "halfDueDate" TIMESTAMP(3),
ADD COLUMN     "halfPaidDate" TIMESTAMP(3),
ADD COLUMN     "halfReferenceNo" TEXT;

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "email" TEXT,
    "programmeId" TEXT,
    "halfDueDate" TIMESTAMP(3),
    "halfPaidDate" TIMESTAMP(3),
    "halfReferenceNo" TEXT,
    "fullDueDate" TIMESTAMP(3),
    "fullPaidDate" TIMESTAMP(3),
    "fullReferenceNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_studentId_key" ON "Payment"("studentId");
