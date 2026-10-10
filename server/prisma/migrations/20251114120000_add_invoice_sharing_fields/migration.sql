-- Add fields for tenant-created invoices and landlord sharing control
ALTER TABLE "invoices"
ADD COLUMN "sharedWithLandlord" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "createdByRole" "UserRole";

ALTER TABLE "invoices"
ADD CONSTRAINT "invoices_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

