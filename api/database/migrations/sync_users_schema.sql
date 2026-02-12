-- Migration: Sync users table schema across all environments
-- Date: 2025-11-13
-- Description: Adds all missing columns from production schema to staging/dev
--              Ensures all 3 environments have identical users table structure

DO $$
BEGIN
    -- Add phone if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone') THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(20);
        RAISE NOTICE 'Added phone column';
    END IF;

    -- Add failed_login_attempts if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='failed_login_attempts') THEN
        ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
        RAISE NOTICE 'Added failed_login_attempts column';
    END IF;

    -- Add account_locked_until if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='account_locked_until') THEN
        ALTER TABLE users ADD COLUMN account_locked_until TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added account_locked_until column';
    END IF;

    -- Add last_login_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login_at') THEN
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_login_at column';
    END IF;

    -- Add mfa_enabled if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='mfa_enabled') THEN
        ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added mfa_enabled column';
    END IF;

    -- Add mfa_secret if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='mfa_secret') THEN
        ALTER TABLE users ADD COLUMN mfa_secret VARCHAR(255);
        RAISE NOTICE 'Added mfa_secret column';
    END IF;

    -- Add sso_provider if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='sso_provider') THEN
        ALTER TABLE users ADD COLUMN sso_provider VARCHAR(50);
        RAISE NOTICE 'Added sso_provider column';
    END IF;

    -- Add sso_provider_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='sso_provider_id') THEN
        ALTER TABLE users ADD COLUMN sso_provider_id VARCHAR(255);
        RAISE NOTICE 'Added sso_provider_id column';
    END IF;

    -- Add current_fingerprint if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='current_fingerprint') THEN
        ALTER TABLE users ADD COLUMN current_fingerprint VARCHAR(64);
        RAISE NOTICE 'Added current_fingerprint column';
    END IF;

    -- Add fingerprint_updated_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='fingerprint_updated_at') THEN
        ALTER TABLE users ADD COLUMN fingerprint_updated_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added fingerprint_updated_at column';
    END IF;

    -- Add ip_changes_last_hour if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ip_changes_last_hour') THEN
        ALTER TABLE users ADD COLUMN ip_changes_last_hour INTEGER DEFAULT 0;
        RAISE NOTICE 'Added ip_changes_last_hour column';
    END IF;

    -- Add last_ip_change_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_ip_change_at') THEN
        ALTER TABLE users ADD COLUMN last_ip_change_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_ip_change_at column';
    END IF;

    -- Add mfa_enrolled_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='mfa_enrolled_at') THEN
        ALTER TABLE users ADD COLUMN mfa_enrolled_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added mfa_enrolled_at column';
    END IF;

    -- Add last_mfa_verified_at if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_mfa_verified_at') THEN
        ALTER TABLE users ADD COLUMN last_mfa_verified_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_mfa_verified_at column';
    END IF;

    -- Add is_active if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column';
    END IF;

    -- Drop status column if it exists (not in production schema)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
        ALTER TABLE users DROP COLUMN status;
        RAISE NOTICE 'Dropped status column (not in production schema)';
    END IF;

END $$;
