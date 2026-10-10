-- CreateEnum
CREATE TYPE "InsuranceStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRING_SOON', 'EXPIRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'INSURANCE_EXPIRING';
ALTER TYPE "NotificationType" ADD VALUE 'INSURANCE_EXPIRED';
ALTER TYPE "NotificationType" ADD VALUE 'INSURANCE_VERIFIED';
ALTER TYPE "NotificationType" ADD VALUE 'INSURANCE_REJECTED';

-- CreateTable
CREATE TABLE "TenantInsurance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leaseId" TEXT,
    "customLeaseId" TEXT,
    "providerName" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "coverageType" TEXT NOT NULL,
    "coverageAmount" DOUBLE PRECISION,
    "monthlyCost" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "documentKey" TEXT NOT NULL,
    "status" "InsuranceStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantInsurance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantInsurance_tenantId_idx" ON "TenantInsurance"("tenantId");

-- CreateIndex
CREATE INDEX "TenantInsurance_leaseId_idx" ON "TenantInsurance"("leaseId");

-- CreateIndex
CREATE INDEX "TenantInsurance_customLeaseId_idx" ON "TenantInsurance"("customLeaseId");

-- CreateIndex
CREATE INDEX "TenantInsurance_status_idx" ON "TenantInsurance"("status");

-- CreateIndex
CREATE INDEX "TenantInsurance_expiryDate_idx" ON "TenantInsurance"("expiryDate");

-- CreateIndex
CREATE INDEX "TenantInsurance_verifiedBy_idx" ON "TenantInsurance"("verifiedBy");

-- AddForeignKey
ALTER TABLE "TenantInsurance" ADD CONSTRAINT "TenantInsurance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInsurance" ADD CONSTRAINT "TenantInsurance_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInsurance" ADD CONSTRAINT "TenantInsurance_customLeaseId_fkey" FOREIGN KEY ("customLeaseId") REFERENCES "CustomLease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInsurance" ADD CONSTRAINT "TenantInsurance_verifiedBy_fkey" FOREIGN KEY ("verifiedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
