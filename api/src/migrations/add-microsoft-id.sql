-- Migration: Add microsoft_id column to users table
-- Description: Enables Microsoft/Azure AD Single Sign-On (SSO) by linking user accounts to Microsoft identities
-- Created: 2025-11-08

-- Add microsoft_id column to users table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'microsoft_id'
    ) THEN
        ALTER TABLE users ADD COLUMN microsoft_id VARCHAR(255) UNIQUE;
        RAISE NOTICE 'Added microsoft_id column to users table';
    ELSE
        RAISE NOTICE 'microsoft_id column already exists';
    END IF;
END $$;

-- Create index on microsoft_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_microsoft_id ON users(microsoft_id);

-- Add comment to column for documentation
COMMENT ON COLUMN users.microsoft_id IS 'Microsoft Azure AD user object ID for SSO integration';

-- Verify the migration
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'microsoft_id';

    IF v_count = 1 THEN
        RAISE NOTICE 'Migration completed successfully - microsoft_id column added';
    ELSE
        RAISE EXCEPTION 'Migration failed - microsoft_id column not found';
    END IF;
END $$;
