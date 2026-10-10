-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('APARTMENT', 'CONDO', 'TOWNHOUSE', 'MULTI_FAMILY', 'SINGLE_FAMILY', 'STUDIO', 'INDUSTRIAL', 'OFFICE', 'RETAIL', 'SHOPPING_CENTER', 'STORAGE', 'PARKING_SPACE', 'WAREHOUSE');

-- CreateEnum
CREATE TYPE "PropertyCategory" AS ENUM ('RESIDENTIAL', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "ResidentialType" AS ENUM ('APARTMENT', 'CONDO', 'TOWNHOUSE', 'MULTI_FAMILY', 'SINGLE_FAMILY', 'STUDIO');

-- CreateEnum
CREATE TYPE "CommercialType" AS ENUM ('INDUSTRIAL', 'OFFICE', 'RETAIL', 'SHOPPING_CENTER', 'STORAGE', 'PARKING_SPACE', 'WAREHOUSE');

-- CreateEnum
CREATE TYPE "RentCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "LeaseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "LeaseTermType" AS ENUM ('LONG_TERM', 'MONTH_TO_MONTH', 'YEAR_TO_YEAR');

-- CreateEnum
CREATE TYPE "NoticeType" AS ENUM ('LEGAL_MINIMUM', 'MORE_THAN_MINIMUM');

-- CreateEnum
CREATE TYPE "DepositNoticeType" AS ENUM ('LEGAL_MAXIMUM', 'LESS_THAN_MINIMUM');

-- CreateEnum
CREATE TYPE "LandlordType" AS ENUM ('INDIVIDUAL', 'CORPORATION');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'TENANT');

-- CreateEnum
CREATE TYPE "MaintenanceStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MaintenancePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "MaintenanceCategory" AS ENUM ('PLUMBING', 'ELECTRICAL', 'HVAC', 'APPLIANCE', 'STRUCTURAL', 'PEST_CONTROL', 'CLEANING', 'LANDSCAPING', 'SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('NEW', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Lease" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "rentAmount" DOUBLE PRECISION NOT NULL,
    "paymentFrequency" "RentCycle" NOT NULL,
    "securityDeposit" DOUBLE PRECISION,
    "paymentMethod" TEXT,
    "leaseStatus" "LeaseStatus" NOT NULL DEFAULT 'DRAFT',
    "leaseDocument" TEXT,
    "signedContract" TEXT,
    "notes" TEXT,
    "propertyCategory" "PropertyCategory",
    "residentialType" "ResidentialType",
    "commercialType" "CommercialType",
    "propertyAddress" TEXT,
    "propertyCity" TEXT,
    "propertyState" TEXT,
    "propertyCountry" TEXT,
    "propertyZipCode" TEXT,
    "leaseTermType" "LeaseTermType",
    "paymentDay" INTEGER,
    "acceptsCash" BOOLEAN NOT NULL DEFAULT false,
    "acceptsCheque" BOOLEAN NOT NULL DEFAULT false,
    "acceptsDirectDebit" BOOLEAN NOT NULL DEFAULT false,
    "acceptsETransfer" BOOLEAN NOT NULL DEFAULT false,
    "acceptsOther" BOOLEAN NOT NULL DEFAULT false,
    "customPaymentInfo" TEXT,
    "rentIncreaseNoticeType" "NoticeType",
    "customRentIncreaseNoticeDays" INTEGER,
    "hasSecurityDeposit" BOOLEAN NOT NULL DEFAULT false,
    "discloseBankInfo" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DOUBLE PRECISION,
    "depositBankName" TEXT,
    "depositAccountInfo" TEXT,
    "depositReturnNoticeType" "DepositNoticeType",
    "customDepositNoticeDays" INTEGER,
    "landlordType" "LandlordType",
    "landlordFullName" TEXT,
    "landlordEmail" TEXT,
    "landlordPhone" TEXT,
    "landlordAddress" TEXT,
    "additionalLandlords" JSONB,
    "tenantFullName" TEXT,
    "tenantEmail" TEXT,
    "tenantPhone" TEXT,
    "additionalTenants" JSONB,
    "allowsOccupants" BOOLEAN NOT NULL DEFAULT false,
    "occupants" JSONB,
    "numberOfOccupants" INTEGER,

    CONSTRAINT "Lease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "propertyOwner" TEXT,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "totalSquareFeet" INTEGER,
    "yearBuilt" INTEGER,
    "country" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "streetAddress" TEXT NOT NULL,
    "zipCode" TEXT,
    "rentCycle" "RentCycle" NOT NULL,
    "rentAmount" DOUBLE PRECISION NOT NULL,
    "securityDeposit" DOUBLE PRECISION,
    "petDeposit" DOUBLE PRECISION,
    "availableDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "contactName" TEXT,
    "phoneNumber" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingAmenity" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListingImage" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRequest" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "MaintenanceStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "MaintenancePriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "leaseId" TEXT,
    "category" "MaintenanceCategory" NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "MaintenanceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceImage" (
    "id" TEXT NOT NULL,
    "maintenanceRequestId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestApplication" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "tenantId" TEXT,
    "landlordId" TEXT NOT NULL,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "monthlyIncome" DOUBLE PRECISION,
    "currentAddress" TEXT,
    "moveInDate" TIMESTAMP(3),
    "occupants" JSONB,
    "pets" JSONB,
    "documents" JSONB,
    "references" JSONB,
    "message" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "decisionNotes" TEXT,
    "leaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3),

    CONSTRAINT "RequestApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmploymentInfo" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "employerName" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "income" DOUBLE PRECISION,
    "duration" TEXT,
    "address" TEXT,
    "proofDocument" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmploymentInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'TENANT',
    "profileImage" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lease_tenantId_idx" ON "Lease"("tenantId");

-- CreateIndex
CREATE INDEX "Lease_landlordId_idx" ON "Lease"("landlordId");

-- CreateIndex
CREATE INDEX "Listing_landlordId_idx" ON "Listing"("landlordId");

-- CreateIndex
CREATE INDEX "Listing_city_propertyType_idx" ON "Listing"("city", "propertyType");

-- CreateIndex
CREATE INDEX "Listing_rentCycle_idx" ON "Listing"("rentCycle");

-- CreateIndex
CREATE INDEX "Listing_availableDate_idx" ON "Listing"("availableDate");

-- CreateIndex
CREATE INDEX "ListingAmenity_listingId_idx" ON "ListingAmenity"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingAmenity_listingId_name_key" ON "ListingAmenity"("listingId", "name");

-- CreateIndex
CREATE INDEX "ListingImage_listingId_idx" ON "ListingImage"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "ListingImage_listingId_url_key" ON "ListingImage"("listingId", "url");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_userId_createdAt_idx" ON "MaintenanceRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_listingId_createdAt_idx" ON "MaintenanceRequest"("listingId", "createdAt");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_status_priority_createdAt_idx" ON "MaintenanceRequest"("status", "priority", "createdAt");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_category_idx" ON "MaintenanceRequest"("category");

-- CreateIndex
CREATE INDEX "MaintenanceRequest_createdAt_idx" ON "MaintenanceRequest"("createdAt");

-- CreateIndex
CREATE INDEX "MaintenanceImage_maintenanceRequestId_idx" ON "MaintenanceImage"("maintenanceRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestApplication_publicId_key" ON "RequestApplication"("publicId");

-- CreateIndex
CREATE INDEX "RequestApplication_listingId_idx" ON "RequestApplication"("listingId");

-- CreateIndex
CREATE INDEX "RequestApplication_landlordId_idx" ON "RequestApplication"("landlordId");

-- CreateIndex
CREATE INDEX "RequestApplication_tenantId_idx" ON "RequestApplication"("tenantId");

-- CreateIndex
CREATE INDEX "RequestApplication_publicId_idx" ON "RequestApplication"("publicId");

-- CreateIndex
CREATE INDEX "RequestApplication_status_idx" ON "RequestApplication"("status");

-- CreateIndex
CREATE INDEX "EmploymentInfo_applicationId_idx" ON "EmploymentInfo"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingAmenity" ADD CONSTRAINT "ListingAmenity_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListingImage" ADD CONSTRAINT "ListingImage_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceImage" ADD CONSTRAINT "MaintenanceImage_maintenanceRequestId_fkey" FOREIGN KEY ("maintenanceRequestId") REFERENCES "MaintenanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestApplication" ADD CONSTRAINT "RequestApplication_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestApplication" ADD CONSTRAINT "RequestApplication_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestApplication" ADD CONSTRAINT "RequestApplication_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestApplication" ADD CONSTRAINT "RequestApplication_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentInfo" ADD CONSTRAINT "EmploymentInfo_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "RequestApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
