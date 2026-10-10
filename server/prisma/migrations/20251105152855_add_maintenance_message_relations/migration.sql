-- CreateTable
CREATE TABLE "MaintenanceMessage" (
    "id" TEXT NOT NULL,
    "maintenanceRequestId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MaintenanceMessage_maintenanceRequestId_idx" ON "MaintenanceMessage"("maintenanceRequestId");

-- CreateIndex
CREATE INDEX "MaintenanceMessage_senderId_idx" ON "MaintenanceMessage"("senderId");

-- AddForeignKey
ALTER TABLE "MaintenanceMessage" ADD CONSTRAINT "MaintenanceMessage_maintenanceRequestId_fkey" FOREIGN KEY ("maintenanceRequestId") REFERENCES "MaintenanceRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceMessage" ADD CONSTRAINT "MaintenanceMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
