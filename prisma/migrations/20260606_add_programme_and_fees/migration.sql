-- CreateTable
CREATE TABLE "Programme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "feeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- AddColumn to User
ALTER TABLE "User" ADD COLUMN "totalFee" DOUBLE PRECISION,
ADD COLUMN "halfFee" DOUBLE PRECISION,
ADD COLUMN "fullFee" DOUBLE PRECISION,
ADD COLUMN "adjustedFee" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "Programme_name_key" ON "Programme"("name");
CREATE UNIQUE INDEX "Programme_code_key" ON "Programme"("code");