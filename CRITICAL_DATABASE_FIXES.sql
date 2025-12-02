-- ================================================================
-- CRITICAL DATABASE SCHEMA FIXES
-- Fleet Management System - Production Remediation
-- Date: November 16, 2025
-- Priority: CRITICAL - Execute Immediately
-- ================================================================

-- Issue #1: Missing recurring_maintenance_schedules table
-- Impact: Maintenance scheduler failing for all 3 tenants
-- Severity: CRITICAL

CREATE TABLE IF NOT EXISTS recurring_maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  schedule_name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency_type VARCHAR(50) NOT NULL CHECK (frequency_type IN ('daily', 'weekly', 'monthly', 'mileage', 'engine_hours')),
  frequency_value INTEGER NOT NULL,
  next_due TIMESTAMP NOT NULL,
  last_completed TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes for performance
  CONSTRAINT valid_frequency_value CHECK (frequency_value > 0)
);

-- Create indexes for recurring_maintenance_schedules
CREATE INDEX IF NOT EXISTS idx_recurring_maint_tenant_id ON recurring_maintenance_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recurring_maint_vehicle_id ON recurring_maintenance_schedules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_recurring_maint_next_due ON recurring_maintenance_schedules(next_due);
CREATE INDEX IF NOT EXISTS idx_recurring_maint_active ON recurring_maintenance_schedules(is_active) WHERE is_active = true;

-- Issue #2: Missing changes column in audit_logs
-- Impact: Audit logging metrics collection failing
-- Severity: MODERATE

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS changes JSONB;

-- Create index for audit_logs.changes (for querying change history)
CREATE INDEX IF NOT EXISTS idx_audit_logs_changes ON audit_logs USING GIN (changes);

-- Verification queries
-- Run these after applying fixes to confirm success

-- Verify recurring_maintenance_schedules table exists
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'recurring_maintenance_schedules'
ORDER BY ordinal_position;

-- Verify audit_logs.changes column exists
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'audit_logs'
  AND column_name = 'changes';

-- Check indexes created
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('recurring_maintenance_schedules', 'audit_logs')
ORDER BY tablename, indexname;

-- ================================================================
-- EXECUTION INSTRUCTIONS
-- ================================================================

-- Method 1: Execute from kubectl
-- kubectl exec -n fleet-management fleet-postgres-0 -- psql -U fleetadmin -d fleetdb -f /path/to/this/file.sql

-- Method 2: Execute via port-forward
-- kubectl port-forward -n fleet-management fleet-postgres-0 5432:5432
-- psql -h localhost -U fleetadmin -d fleetdb -f CRITICAL_DATABASE_FIXES.sql

-- Method 3: Copy file into pod and execute
-- kubectl cp CRITICAL_DATABASE_FIXES.sql fleet-management/fleet-postgres-0:/tmp/fixes.sql
-- kubectl exec -n fleet-management fleet-postgres-0 -- psql -U fleetadmin -d fleetdb -f /tmp/fixes.sql

-- ================================================================
-- POST-EXECUTION VALIDATION
-- ================================================================

-- 1. Check maintenance scheduler logs after fix:
--    kubectl logs -n fleet-management deployment/fleet-api --tail=50 | grep -i maintenance

-- 2. Verify no more "column does not exist" errors:
--    kubectl logs -n fleet-management deployment/fleet-api --tail=100 | grep -i "does not exist"

-- 3. Test maintenance scheduler manually (if endpoint exists):
--    curl -X POST http://68.220.148.2/api/maintenance/scheduler/run \
--      -H "Authorization: Bearer YOUR_JWT_TOKEN"

-- ================================================================
-- ROLLBACK PLAN (if needed)
-- ================================================================

-- DROP TABLE IF EXISTS recurring_maintenance_schedules CASCADE;
-- ALTER TABLE audit_logs DROP COLUMN IF EXISTS changes;
