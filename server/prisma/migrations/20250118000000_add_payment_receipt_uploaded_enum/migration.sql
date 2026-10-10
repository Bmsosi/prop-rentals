-- Add PAYMENT_RECEIPT_UPLOADED enum value if it doesn't exist
-- This migration ensures the enum value exists even if the previous migration was a no-op
DO $$ 
BEGIN
    -- Check if NotificationType enum exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
        -- Check if PAYMENT_RECEIPT_UPLOADED exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'PAYMENT_RECEIPT_UPLOADED' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
        ) THEN
            ALTER TYPE "NotificationType" ADD VALUE 'PAYMENT_RECEIPT_UPLOADED';
            RAISE NOTICE 'Added PAYMENT_RECEIPT_UPLOADED to NotificationType enum';
        ELSE
            RAISE NOTICE 'PAYMENT_RECEIPT_UPLOADED already exists in NotificationType enum';
        END IF;
    ELSE
        RAISE EXCEPTION 'NotificationType enum does not exist';
    END IF;
EXCEPTION
    WHEN others THEN 
        -- Log error but don't fail
        RAISE WARNING 'Error adding PAYMENT_RECEIPT_UPLOADED: %', SQLERRM;
END $$;

