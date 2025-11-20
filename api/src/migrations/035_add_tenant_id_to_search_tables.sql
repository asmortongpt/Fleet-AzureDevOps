-- ============================================================================
-- Migration: Add tenant_id to Search Tables (CRITICAL Security Fix)
-- Description: Fix cross-tenant data leakage vulnerability in search tables
-- Created: 2025-11-20
-- Issue: DevSecOps Audit - Missing tenant_id causes data isolation violation
-- ============================================================================

-- SECURITY: Add tenant_id to search_history table
-- This prevents users from seeing other tenants' search history

ALTER TABLE search_history
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Backfill tenant_id from users table
UPDATE search_history sh
SET tenant_id = u.tenant_id
FROM users u
WHERE sh.user_id = u.id
  AND sh.tenant_id IS NULL;

-- Make tenant_id NOT NULL after backfill
ALTER TABLE search_history
  ALTER COLUMN tenant_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE search_history
  ADD CONSTRAINT fk_search_history_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Enable Row Level Security (RLS)
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenant isolation
DROP POLICY IF EXISTS search_history_tenant_isolation ON search_history;
CREATE POLICY search_history_tenant_isolation ON search_history
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_search_history_tenant_id
  ON search_history(tenant_id);

-- ============================================================================
-- SECURITY: Add tenant_id to search_click_tracking table
-- This prevents users from seeing other tenants' click tracking data
-- ============================================================================

ALTER TABLE search_click_tracking
  ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Backfill tenant_id from users table
UPDATE search_click_tracking sct
SET tenant_id = u.tenant_id
FROM users u
WHERE sct.user_id = u.id
  AND sct.tenant_id IS NULL;

-- Make tenant_id NOT NULL after backfill
ALTER TABLE search_click_tracking
  ALTER COLUMN tenant_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE search_click_tracking
  ADD CONSTRAINT fk_search_click_tracking_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Enable Row Level Security (RLS)
ALTER TABLE search_click_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for tenant isolation
DROP POLICY IF EXISTS search_click_tracking_tenant_isolation ON search_click_tracking;
CREATE POLICY search_click_tracking_tenant_isolation ON search_click_tracking
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_search_click_tracking_tenant_id
  ON search_click_tracking(tenant_id);

-- ============================================================================
-- Composite indexes for better query performance
-- ============================================================================

-- Composite index for search_history queries filtered by tenant and date
CREATE INDEX IF NOT EXISTS idx_search_history_tenant_created
  ON search_history(tenant_id, created_at DESC);

-- Composite index for search_history queries filtered by tenant and user
CREATE INDEX IF NOT EXISTS idx_search_history_tenant_user
  ON search_history(tenant_id, user_id);

-- Composite index for search_click_tracking queries filtered by tenant and document
CREATE INDEX IF NOT EXISTS idx_search_click_tracking_tenant_doc
  ON search_click_tracking(tenant_id, document_id);

-- Composite index for search_click_tracking queries filtered by tenant and user
CREATE INDEX IF NOT EXISTS idx_search_click_tracking_tenant_user
  ON search_click_tracking(tenant_id, user_id);

-- ============================================================================
-- Verification queries (run manually to verify security)
-- ============================================================================

-- COMMENT ON MIGRATION IS '
-- Verification steps:
--
-- 1. Verify all rows have tenant_id:
--    SELECT COUNT(*) FROM search_history WHERE tenant_id IS NULL;
--    SELECT COUNT(*) FROM search_click_tracking WHERE tenant_id IS NULL;
--    (Both should return 0)
--
-- 2. Verify RLS policies are active:
--    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
--    FROM pg_policies
--    WHERE tablename IN (''search_history'', ''search_click_tracking'');
--
-- 3. Test tenant isolation:
--    SET app.current_tenant_id = ''<tenant-uuid-1>'';
--    SELECT COUNT(*) FROM search_history;
--    SET app.current_tenant_id = ''<tenant-uuid-2>'';
--    SELECT COUNT(*) FROM search_history;
--    (Counts should differ, showing isolation)
-- ';

-- ============================================================================
-- Rollback script (in case of emergency)
-- ============================================================================

-- ROLLBACK COMMANDS (DO NOT RUN):
-- DROP POLICY IF EXISTS search_history_tenant_isolation ON search_history;
-- DROP POLICY IF EXISTS search_click_tracking_tenant_isolation ON search_click_tracking;
-- ALTER TABLE search_history DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE search_click_tracking DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE search_history DROP CONSTRAINT IF EXISTS fk_search_history_tenant;
-- ALTER TABLE search_click_tracking DROP CONSTRAINT IF EXISTS fk_search_click_tracking_tenant;
-- ALTER TABLE search_history DROP COLUMN IF EXISTS tenant_id;
-- ALTER TABLE search_click_tracking DROP COLUMN IF EXISTS tenant_id;

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON COLUMN search_history.tenant_id IS 'Tenant isolation field - prevents cross-tenant data leakage (CRITICAL security fix)';
COMMENT ON COLUMN search_click_tracking.tenant_id IS 'Tenant isolation field - prevents cross-tenant data leakage (CRITICAL security fix)';

-- Migration completed successfully
SELECT 'Migration 035: tenant_id added to search tables with RLS policies - SECURITY FIX COMPLETE' as status;
