-- Migration: Add tenant_id to refresh_tokens table for proper multi-tenant isolation
-- Date: 2025-12-04
-- Related: SECURITY_AUDIT_REPORT_TENANT_ISOLATION.md - auth.ts fixes
-- CRITICAL: This migration must be run before deploying auth.ts fixes

BEGIN;

-- Step 1: Add tenant_id column (nullable initially for backfill)
ALTER TABLE refresh_tokens
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

COMMENT ON COLUMN refresh_tokens.tenant_id IS 'Foreign key to tenants table for multi-tenant isolation';

-- Step 2: Backfill tenant_id from users table for existing tokens
-- This ensures existing refresh tokens are properly scoped to their tenant
UPDATE refresh_tokens rt
SET tenant_id = u.tenant_id
FROM users u
WHERE rt.user_id = u.id
  AND rt.tenant_id IS NULL;

-- Step 3: Verify backfill - should return 0
-- If this returns rows, investigate data integrity issues
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM refresh_tokens
  WHERE tenant_id IS NULL;

  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete: % refresh_tokens still have NULL tenant_id', missing_count;
  END IF;

  RAISE NOTICE 'Backfill verification passed: All refresh_tokens have tenant_id';
END $$;

-- Step 4: Make tenant_id NOT NULL after backfill
ALTER TABLE refresh_tokens
  ALTER COLUMN tenant_id SET NOT NULL;

-- Step 5: Add foreign key constraint to ensure referential integrity
ALTER TABLE refresh_tokens
  ADD CONSTRAINT fk_refresh_tokens_tenant_id
  FOREIGN KEY (tenant_id)
  REFERENCES tenants(id)
  ON DELETE CASCADE;

-- Step 6: Add indexes for query performance
-- Index for tenant_id alone (used in WHERE clauses)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_tenant_id
  ON refresh_tokens(tenant_id);

-- Composite index for common query pattern: (user_id, tenant_id, token_hash)
-- This optimizes the refresh token validation query
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_tenant_token
  ON refresh_tokens(user_id, tenant_id, token_hash)
  WHERE revoked_at IS NULL AND expires_at > NOW();

-- Composite index for cleanup queries: (tenant_id, expires_at)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_tenant_expires
  ON refresh_tokens(tenant_id, expires_at)
  WHERE revoked_at IS NULL;

-- Step 7: Update table comment
COMMENT ON TABLE refresh_tokens IS 'Stores JWT refresh tokens with tenant isolation for secure token rotation';

-- Step 8: Analyze table to update statistics for query planner
ANALYZE refresh_tokens;

COMMIT;

-- Rollback script (if needed):
-- BEGIN;
-- ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS fk_refresh_tokens_tenant_id;
-- DROP INDEX IF EXISTS idx_refresh_tokens_tenant_id;
-- DROP INDEX IF EXISTS idx_refresh_tokens_user_tenant_token;
-- DROP INDEX IF EXISTS idx_refresh_tokens_tenant_expires;
-- ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS tenant_id;
-- COMMIT;
