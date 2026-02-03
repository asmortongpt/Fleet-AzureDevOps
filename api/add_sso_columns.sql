-- Migration: Add SSO columns to users table
-- Required for Microsoft Azure AD SSO authentication

BEGIN;

-- Add provider column to track authentication method (local, microsoft, google, etc.)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'local';

-- Add provider_user_id to store external provider's user ID (e.g., Azure AD oid)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS provider_user_id VARCHAR(255);

-- Add azure_tenant_id to support multi-tenant Azure AD scenarios
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS azure_tenant_id VARCHAR(255);

-- Create composite index for faster SSO user lookups
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_user_id);

-- Update password_hash column to be nullable for SSO users
ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL;

COMMIT;

-- Verify columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name='users'
  AND column_name IN ('provider', 'provider_user_id', 'azure_tenant_id', 'password_hash')
ORDER BY ordinal_position;
