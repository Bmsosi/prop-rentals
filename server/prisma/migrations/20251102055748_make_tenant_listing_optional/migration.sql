-- DropForeignKey
ALTER TABLE "public"."CustomLease" DROP CONSTRAINT "CustomLease_listingId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CustomLease" DROP CONSTRAINT "CustomLease_tenantId_fkey";

-- AlterTable
ALTER TABLE "CustomLease" ALTER COLUMN "listingId" DROP NOT NULL,
ALTER COLUMN "tenantId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "CustomLease" ADD CONSTRAINT "CustomLease_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomLease" ADD CONSTRAINT "CustomLease_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
