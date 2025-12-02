-- Migration: Add is_active column to users table
-- Date: 2025-11-13
-- Description: Adds is_active boolean column to users table in staging and dev environments
--              This column was present in production but missing from staging/dev

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to users table';
    ELSE
        RAISE NOTICE 'is_active column already exists';
    END IF;
END $$;
