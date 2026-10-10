/*
  Warnings:

  - You are about to drop the column `createdAt` on the `Lease` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Lease" DROP COLUMN "createdAt";

-- CreateTable
CREATE TABLE "CustomLease" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leaseName" TEXT NOT NULL,
    "description" TEXT,
    "propertyType" TEXT,
    "fileUrl" TEXT NOT NULL,
    "leaseStatus" "LeaseStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomLease_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomLease_listingId_idx" ON "CustomLease"("listingId");

-- CreateIndex
CREATE INDEX "CustomLease_landlordId_idx" ON "CustomLease"("landlordId");

-- AddForeignKey
ALTER TABLE "CustomLease" ADD CONSTRAINT "CustomLease_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomLease" ADD CONSTRAINT "CustomLease_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomLease" ADD CONSTRAINT "CustomLease_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
