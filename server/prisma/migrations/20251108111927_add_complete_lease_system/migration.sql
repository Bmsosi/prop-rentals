/*
  Warnings:

  - Added the required column `updatedAt` to the `Lease` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum (skip if already exists)
DO $$ BEGIN
    CREATE TYPE "PaymentType" AS ENUM ('RENT', 'DEPOSIT', 'REFUND', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (skip if already exists)
DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterEnum (skip if already exists)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'APPLICATION_STATUS' AND enumtypid = 'NotificationType'::regtype) THEN
        ALTER TYPE "NotificationType" ADD VALUE 'APPLICATION_STATUS';
    END IF;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LEASE_EXPIRING' AND enumtypid = 'NotificationType'::regtype) THEN
        ALTER TYPE "NotificationType" ADD VALUE 'LEASE_EXPIRING';
    END IF;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PAYMENT_DUE' AND enumtypid = 'NotificationType'::regtype) THEN
        ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_DUE';
    END IF;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PAYMENT_RECEIVED' AND enumtypid = 'NotificationType'::regtype) THEN
        ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_RECEIVED';
    END IF;
EXCEPTION
    WHEN others THEN null;
END $$;

-- AlterEnum (skip if already exists)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DAILY' AND enumtypid = 'RentCycle'::regtype) THEN
        ALTER TYPE "RentCycle" ADD VALUE 'DAILY';
    END IF;
EXCEPTION
    WHEN others THEN null;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'WEEKLY' AND enumtypid = 'RentCycle'::regtype) THEN
        ALTER TYPE "RentCycle" ADD VALUE 'WEEKLY';
    END IF;
EXCEPTION
    WHEN others THEN null;
END $$;

-- DropForeignKey (skip if doesn't exist)
DO $$ BEGIN
    ALTER TABLE "public"."Lease" DROP CONSTRAINT IF EXISTS "Lease_tenantId_fkey";
EXCEPTION
    WHEN others THEN null;
END $$;

-- AlterTable (add columns if they don't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CustomLease' AND column_name='accountingNotes') THEN
        ALTER TABLE "CustomLease" ADD COLUMN "accountingNotes" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CustomLease' AND column_name='depositAmount') THEN
        ALTER TABLE "CustomLease" ADD COLUMN "depositAmount" DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CustomLease' AND column_name='endDate') THEN
        ALTER TABLE "CustomLease" ADD COLUMN "endDate" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CustomLease' AND column_name='paymentDay') THEN
        ALTER TABLE "CustomLease" ADD COLUMN "paymentDay" INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CustomLease' AND column_name='paymentFrequency') THEN
        ALTER TABLE "CustomLease" ADD COLUMN "paymentFrequency" "RentCycle";
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CustomLease' AND column_name='paymentMethod') THEN
        ALTER TABLE "CustomLease" ADD COLUMN "paymentMethod" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CustomLease' AND column_name='rentAmount') THEN
        ALTER TABLE "CustomLease" ADD COLUMN "rentAmount" DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CustomLease' AND column_name='securityDeposit') THEN
        ALTER TABLE "CustomLease" ADD COLUMN "securityDeposit" DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CustomLease' AND column_name='startDate') THEN
        ALTER TABLE "CustomLease" ADD COLUMN "startDate" TIMESTAMP(3);
    END IF;
END $$;

-- AlterTable (add columns if they don't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Lease' AND column_name='createdAt') THEN
        ALTER TABLE "Lease" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Lease' AND column_name='fixedEndCondition') THEN
        ALTER TABLE "Lease" ADD COLUMN "fixedEndCondition" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Lease' AND column_name='includedServices') THEN
        ALTER TABLE "Lease" ADD COLUMN "includedServices" JSONB;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Lease' AND column_name='parkingSpaces') THEN
        ALTER TABLE "Lease" ADD COLUMN "parkingSpaces" INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Lease' AND column_name='periodicBasis') THEN
        ALTER TABLE "Lease" ADD COLUMN "periodicBasis" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Lease' AND column_name='periodicOther') THEN
        ALTER TABLE "Lease" ADD COLUMN "periodicOther" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Lease' AND column_name='petDeposit') THEN
        ALTER TABLE "Lease" ADD COLUMN "petDeposit" DOUBLE PRECISION;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Lease' AND column_name='petDepositDueDate') THEN
        ALTER TABLE "Lease" ADD COLUMN "petDepositDueDate" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Lease' AND column_name='securityDepositDueDate') THEN
        ALTER TABLE "Lease" ADD COLUMN "securityDepositDueDate" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Lease' AND column_name='terminatedBy') THEN
        ALTER TABLE "Lease" ADD COLUMN "terminatedBy" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Lease' AND column_name='terminationDate') THEN
        ALTER TABLE "Lease" ADD COLUMN "terminationDate" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Lease' AND column_name='terminationNotes') THEN
        ALTER TABLE "Lease" ADD COLUMN "terminationNotes" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Lease' AND column_name='terminationReason') THEN
        ALTER TABLE "Lease" ADD COLUMN "terminationReason" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Lease' AND column_name='updatedAt') THEN
        ALTER TABLE "Lease" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Lease' AND column_name='vacateReason') THEN
        ALTER TABLE "Lease" ADD COLUMN "vacateReason" TEXT;
    END IF;
END $$;

-- Alter tenantId to allow NULL (skip if already nullable)
DO $$ BEGIN
    ALTER TABLE "Lease" ALTER COLUMN "tenantId" DROP NOT NULL;
EXCEPTION
    WHEN others THEN null;
END $$;

-- CreateTable (skip if already exists)
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT,
    "customLeaseId" TEXT,
    "landlordId" TEXT NOT NULL,
    "tenantId" TEXT,
    "type" "PaymentType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (skip if already exists)
CREATE INDEX IF NOT EXISTS "Payment_leaseId_idx" ON "Payment"("leaseId");

-- CreateIndex (skip if already exists)
CREATE INDEX IF NOT EXISTS "Payment_customLeaseId_idx" ON "Payment"("customLeaseId");

-- CreateIndex (skip if already exists)
CREATE INDEX IF NOT EXISTS "Payment_landlordId_idx" ON "Payment"("landlordId");

-- CreateIndex (skip if already exists)
CREATE INDEX IF NOT EXISTS "Payment_tenantId_idx" ON "Payment"("tenantId");

-- CreateIndex (skip if already exists)
CREATE INDEX IF NOT EXISTS "Payment_dueDate_idx" ON "Payment"("dueDate");

-- CreateIndex (skip if already exists)
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");

-- AddForeignKey (skip if already exists)
DO $$ BEGIN
    ALTER TABLE "Lease" ADD CONSTRAINT "Lease_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (skip if already exists)
DO $$ BEGIN
    ALTER TABLE "Payment" ADD CONSTRAINT "Payment_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (skip if already exists)
DO $$ BEGIN
    ALTER TABLE "Payment" ADD CONSTRAINT "Payment_customLeaseId_fkey" FOREIGN KEY ("customLeaseId") REFERENCES "CustomLease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (skip if already exists)
DO $$ BEGIN
    ALTER TABLE "Payment" ADD CONSTRAINT "Payment_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey (skip if already exists)
DO $$ BEGIN
    ALTER TABLE "Payment" ADD CONSTRAINT "Payment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
