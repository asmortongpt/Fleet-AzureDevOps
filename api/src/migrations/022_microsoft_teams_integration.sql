-- Migration: Microsoft Teams Integration
-- Description: Adds columns to users table for storing Microsoft Graph API tokens
-- Required for Teams integration and other Microsoft 365 services
-- Created: 2025-11-16

-- ============================================================================
-- Add Microsoft Graph API Token Columns to Users Table
-- ============================================================================

DO $$
BEGIN
    -- Add microsoft_access_token column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'microsoft_access_token'
    ) THEN
        ALTER TABLE users ADD COLUMN microsoft_access_token TEXT;
        RAISE NOTICE 'Added microsoft_access_token column to users table';
    ELSE
        RAISE NOTICE 'microsoft_access_token column already exists';
    END IF;

    -- Add microsoft_refresh_token column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'microsoft_refresh_token'
    ) THEN
        ALTER TABLE users ADD COLUMN microsoft_refresh_token TEXT;
        RAISE NOTICE 'Added microsoft_refresh_token column to users table';
    ELSE
        RAISE NOTICE 'microsoft_refresh_token column already exists';
    END IF;

    -- Add microsoft_token_expires_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'microsoft_token_expires_at'
    ) THEN
        ALTER TABLE users ADD COLUMN microsoft_token_expires_at TIMESTAMP;
        RAISE NOTICE 'Added microsoft_token_expires_at column to users table';
    ELSE
        RAISE NOTICE 'microsoft_token_expires_at column already exists';
    END IF;
END $$;

-- ============================================================================
-- Add Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_microsoft_token_expires ON users(microsoft_token_expires_at)
    WHERE microsoft_token_expires_at IS NOT NULL;

-- ============================================================================
-- Add Comments for Documentation
-- ============================================================================

COMMENT ON COLUMN users.microsoft_access_token IS 'Microsoft Graph API access token for delegated permissions';
COMMENT ON COLUMN users.microsoft_refresh_token IS 'Microsoft Graph API refresh token for obtaining new access tokens';
COMMENT ON COLUMN users.microsoft_token_expires_at IS 'Expiration timestamp for the Microsoft access token';

-- ============================================================================
-- Verify Migration
-- ============================================================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name IN ('microsoft_access_token', 'microsoft_refresh_token', 'microsoft_token_expires_at');

    IF v_count = 3 THEN
        RAISE NOTICE 'Migration completed successfully - All Microsoft token columns added';
    ELSE
        RAISE EXCEPTION 'Migration failed - Expected 3 columns, found %', v_count;
    END IF;
END $$;

-- ============================================================================
-- Security Note
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts table with support for Microsoft 365 integration via Graph API tokens';
