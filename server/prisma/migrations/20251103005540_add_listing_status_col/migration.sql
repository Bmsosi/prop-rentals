-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'RENTED');

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE';
