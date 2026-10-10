-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'APPLICATION_STATUS';
ALTER TYPE "NotificationType" ADD VALUE 'LEASE_EXPIRING';
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_DUE';
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_RECEIPT_UPLOADED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_RECEIPT_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_RECEIPT_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'INSURANCE_UPLOADED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RentCycle" ADD VALUE 'DAILY';
ALTER TYPE "RentCycle" ADD VALUE 'WEEKLY';

-- AlterTable
ALTER TABLE "Lease" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "invoices_createdById_idx" ON "invoices"("createdById");
