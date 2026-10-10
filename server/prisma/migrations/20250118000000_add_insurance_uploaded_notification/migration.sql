-- Add INSURANCE_UPLOADED enum value if it doesn't exist
DO $$ 
BEGIN
    -- Check if NotificationType enum exists
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType') THEN
        -- Check if INSURANCE_UPLOADED exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'INSURANCE_UPLOADED' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'NotificationType')
        ) THEN
            ALTER TYPE "NotificationType" ADD VALUE 'INSURANCE_UPLOADED';
            RAISE NOTICE 'Added INSURANCE_UPLOADED to NotificationType enum';
        ELSE
            RAISE NOTICE 'INSURANCE_UPLOADED already exists in NotificationType enum';
        END IF;
    ELSE
        RAISE EXCEPTION 'NotificationType enum does not exist';
    END IF;
EXCEPTION
    WHEN others THEN 
        -- Log error but don't fail
        RAISE WARNING 'Error adding INSURANCE_UPLOADED: %', SQLERRM;
END $$;

