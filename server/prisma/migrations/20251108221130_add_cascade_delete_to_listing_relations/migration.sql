-- DropForeignKey
ALTER TABLE "public"."CustomLease" DROP CONSTRAINT "CustomLease_listingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Lease" DROP CONSTRAINT "Lease_listingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."MaintenanceRequest" DROP CONSTRAINT "MaintenanceRequest_listingId_fkey";

-- AddForeignKey
ALTER TABLE "CustomLease" ADD CONSTRAINT "CustomLease_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
