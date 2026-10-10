-- CreateEnum
CREATE TYPE "LeaseType" AS ENUM ('STANDARD', 'CUSTOM');

-- CreateTable
CREATE TABLE "LeaseInvite" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "leaseType" "LeaseType" NOT NULL,
    "tenantId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LeaseInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaseInvite_token_key" ON "LeaseInvite"("token");
