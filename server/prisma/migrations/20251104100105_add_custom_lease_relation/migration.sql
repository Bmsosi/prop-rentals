-- AlterTable
ALTER TABLE "MaintenanceRequest" ADD COLUMN     "customLeaseId" TEXT;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_customLeaseId_fkey" FOREIGN KEY ("customLeaseId") REFERENCES "CustomLease"("id") ON DELETE SET NULL ON UPDATE CASCADE;
