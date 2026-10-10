-- AlterEnum
-- Add PAYMENT_RECEIPT_APPROVED and PAYMENT_RECEIPT_REJECTED notification types
-- Note: This migration may run before the NotificationType enum is created
-- So we check if the enum type exists first, then check if the value exists
DO $$ 
BEGIN
    -- Check if NotificationType enum exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
        -- Check if PAYMENT_RECEIPT_APPROVED exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'PAYMENT_RECEIPT_APPROVED' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
        ) THEN
            ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_RECEIPT_APPROVED';
        END IF;
        
        -- Check if PAYMENT_RECEIPT_REJECTED exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'PAYMENT_RECEIPT_REJECTED' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
        ) THEN
            ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_RECEIPT_REJECTED';
        END IF;
    END IF;
    -- If the enum doesn't exist yet, this migration will be a no-op
    -- The enum value will be added in a later migration or manually
EXCEPTION
    WHEN undefined_object THEN 
        -- Enum type doesn't exist yet, skip this migration
        NULL;
    WHEN others THEN 
        -- Re-raise other errors
        RAISE;
END $$;

