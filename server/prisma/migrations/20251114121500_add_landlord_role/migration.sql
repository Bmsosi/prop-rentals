-- Add LANDLORD value to UserRole enum if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum
        WHERE enumlabel = 'LANDLORD'
          AND enumtypid = to_regtype('"UserRole"')
    ) THEN
        ALTER TYPE "UserRole" ADD VALUE 'LANDLORD';
    END IF;
END $$;

