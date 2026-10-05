-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'SENT');

-- AlterTable
ALTER TABLE "Plan" ADD COLUMN     "name" TEXT,
ADD COLUMN     "patientId" UUID,
ADD COLUMN     "status" "PlanStatus";

-- CreateIndex
CREATE INDEX "Plan_patientId_updatedAt_idx" ON "Plan"("patientId", "updatedAt");

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

