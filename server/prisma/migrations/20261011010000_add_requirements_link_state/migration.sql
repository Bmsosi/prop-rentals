ALTER TABLE "RequestApplication"
  ADD COLUMN IF NOT EXISTS "requirementsSentAt" TIMESTAMP(3);
