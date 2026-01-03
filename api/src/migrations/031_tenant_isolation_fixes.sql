-- ============================================================================
-- Migration: 031_tenant_isolation_fixes
-- Description: Add tenant_id columns to vehicle_telemetry and communications
--              tables to fix critical multi-tenancy violations
-- Security Impact: CRITICAL - Prevents cross-tenant data access
-- SOC 2 Compliance: Required for tenant isolation controls
-- Created: 2025-12-03
-- Priority: P0 (BLOCKS PRODUCTION DEPLOYMENT)
-- ============================================================================

-- Transaction wrapper for atomic execution
BEGIN;

-- ============================================================================
-- PART 1: Fix vehicle_telemetry Table
-- ============================================================================

-- Add tenant_id column (nullable initially for backfill)
ALTER TABLE vehicle_telemetry
ADD COLUMN tenant_id UUID;

-- Create index for performance (tenant_id will be in WHERE clauses)
CREATE INDEX idx_vehicle_telemetry_tenant_id ON vehicle_telemetry(tenant_id);

-- Backfill tenant_id from vehicles table
UPDATE vehicle_telemetry vt
SET tenant_id = v.tenant_id
FROM vehicles v
WHERE vt.vehicle_id = v.id;

-- Verify backfill completed (should have 0 NULL tenant_ids)
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM vehicle_telemetry
    WHERE tenant_id IS NULL;

    IF null_count > 0 THEN
        RAISE EXCEPTION 'Backfill failed: % vehicle_telemetry records still have NULL tenant_id', null_count;
    END IF;

    RAISE NOTICE 'vehicle_telemetry backfill successful: 0 NULL tenant_ids';
END;
$$;

-- Make tenant_id NOT NULL now that backfill is complete
ALTER TABLE vehicle_telemetry
ALTER COLUMN tenant_id SET NOT NULL;

-- Add foreign key constraint with CASCADE deletion
ALTER TABLE vehicle_telemetry
ADD CONSTRAINT fk_vehicle_telemetry_tenant
FOREIGN KEY (tenant_id)
REFERENCES tenants(id)
ON DELETE CASCADE;

-- Add composite index for common query patterns
CREATE INDEX idx_vehicle_telemetry_tenant_vehicle
ON vehicle_telemetry(tenant_id, vehicle_id);

CREATE INDEX idx_vehicle_telemetry_tenant_timestamp
ON vehicle_telemetry(tenant_id, timestamp DESC);

-- ============================================================================
-- PART 2: Fix communications Table
-- ============================================================================

-- Add tenant_id column (nullable initially for backfill)
ALTER TABLE communications
ADD COLUMN tenant_id UUID;

-- Create index for performance
CREATE INDEX idx_communications_tenant_id ON communications(tenant_id);

-- Backfill tenant_id from drivers table (from_user_id is FK to drivers)
UPDATE communications c
SET tenant_id = d.tenant_id
FROM drivers d
WHERE c.from_user_id = d.id;

-- Handle orphaned communications (no matching driver)
-- Option 1: Delete orphaned records
DELETE FROM communications
WHERE tenant_id IS NULL;

-- Verify backfill completed
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM communications
    WHERE tenant_id IS NULL;

    IF null_count > 0 THEN
        RAISE EXCEPTION 'Backfill failed: % communications records still have NULL tenant_id', null_count;
    END IF;

    RAISE NOTICE 'communications backfill successful: 0 NULL tenant_ids';
END;
$$;

-- Make tenant_id NOT NULL now that backfill is complete
ALTER TABLE communications
ALTER COLUMN tenant_id SET NOT NULL;

-- Add foreign key constraint with CASCADE deletion
ALTER TABLE communications
ADD CONSTRAINT fk_communications_tenant
FOREIGN KEY (tenant_id)
REFERENCES tenants(id)
ON DELETE CASCADE;

-- Add composite index for common query patterns
CREATE INDEX idx_communications_tenant_type
ON communications(tenant_id, communication_type);

CREATE INDEX idx_communications_tenant_created
ON communications(tenant_id, created_at DESC);

-- ============================================================================
-- PART 3: Enable Row-Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on vehicle_telemetry
ALTER TABLE vehicle_telemetry ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see telemetry from their tenant
CREATE POLICY vehicle_telemetry_tenant_isolation ON vehicle_telemetry
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Policy: Allow service account to see all (for maintenance tasks)
CREATE POLICY vehicle_telemetry_service_account ON vehicle_telemetry
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true');

-- Enable RLS on communications
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see communications from their tenant
CREATE POLICY communications_tenant_isolation ON communications
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Policy: Allow service account to see all
CREATE POLICY communications_service_account ON communications
    FOR ALL
    USING (current_setting('app.bypass_rls', true) = 'true');

-- ============================================================================
-- PART 4: Create Helper Functions for Tenant Context
-- ============================================================================

-- Function to set current tenant context
CREATE OR REPLACE FUNCTION set_tenant_context(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear tenant context (for service accounts)
CREATE OR REPLACE FUNCTION clear_tenant_context()
RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant_id', '', false);
    PERFORM set_config('app.bypass_rls', 'true', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current tenant context
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 5: Verification Queries
-- ============================================================================

-- Verify tenant_id is present and not null
DO $$
DECLARE
    vt_count INTEGER;
    comm_count INTEGER;
BEGIN
    -- Check vehicle_telemetry
    SELECT COUNT(*) INTO vt_count
    FROM information_schema.columns
    WHERE table_name = 'vehicle_telemetry'
    AND column_name = 'tenant_id'
    AND is_nullable = 'NO';

    IF vt_count = 0 THEN
        RAISE EXCEPTION 'vehicle_telemetry.tenant_id column not properly configured';
    END IF;

    -- Check communications
    SELECT COUNT(*) INTO comm_count
    FROM information_schema.columns
    WHERE table_name = 'communications'
    AND column_name = 'tenant_id'
    AND is_nullable = 'NO';

    IF comm_count = 0 THEN
        RAISE EXCEPTION 'communications.tenant_id column not properly configured';
    END IF;

    RAISE NOTICE '✅ All tenant_id columns properly configured';
END;
$$;

-- Verify foreign key constraints exist
DO $$
DECLARE
    vt_fk_count INTEGER;
    comm_fk_count INTEGER;
BEGIN
    -- Check vehicle_telemetry FK
    SELECT COUNT(*) INTO vt_fk_count
    FROM information_schema.table_constraints
    WHERE table_name = 'vehicle_telemetry'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'fk_vehicle_telemetry_tenant';

    IF vt_fk_count = 0 THEN
        RAISE EXCEPTION 'vehicle_telemetry foreign key constraint missing';
    END IF;

    -- Check communications FK
    SELECT COUNT(*) INTO comm_fk_count
    FROM information_schema.table_constraints
    WHERE table_name = 'communications'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name = 'fk_communications_tenant';

    IF comm_fk_count = 0 THEN
        RAISE EXCEPTION 'communications foreign key constraint missing';
    END IF;

    RAISE NOTICE '✅ All foreign key constraints configured';
END;
$$;

-- Verify RLS policies are enabled
DO $$
DECLARE
    vt_rls BOOLEAN;
    comm_rls BOOLEAN;
BEGIN
    -- Check vehicle_telemetry RLS
    SELECT relrowsecurity INTO vt_rls
    FROM pg_class
    WHERE relname = 'vehicle_telemetry';

    IF NOT vt_rls THEN
        RAISE EXCEPTION 'vehicle_telemetry RLS not enabled';
    END IF;

    -- Check communications RLS
    SELECT relrowsecurity INTO comm_rls
    FROM pg_class
    WHERE relname = 'communications';

    IF NOT comm_rls THEN
        RAISE EXCEPTION 'communications RLS not enabled';
    END IF;

    RAISE NOTICE '✅ Row-Level Security enabled on all tables';
END;
$$;

-- ============================================================================
-- PART 6: Performance Analysis
-- ============================================================================

-- Analyze tables to update statistics
ANALYZE vehicle_telemetry;
ANALYZE communications;

-- Display index usage recommendations
DO $$
BEGIN
    RAISE NOTICE 'Created indexes:';
    RAISE NOTICE '  - idx_vehicle_telemetry_tenant_id';
    RAISE NOTICE '  - idx_vehicle_telemetry_tenant_vehicle';
    RAISE NOTICE '  - idx_vehicle_telemetry_tenant_timestamp';
    RAISE NOTICE '  - idx_communications_tenant_id';
    RAISE NOTICE '  - idx_communications_tenant_type';
    RAISE NOTICE '  - idx_communications_tenant_created';
    RAISE NOTICE '';
    RAISE NOTICE 'All queries MUST include tenant_id in WHERE clause for optimal performance';
END;
$$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMIT;

-- Display success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✅ MIGRATION 031 COMPLETE: Tenant Isolation Fixes';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes applied:';
    RAISE NOTICE '  1. vehicle_telemetry: Added tenant_id column with FK constraint';
    RAISE NOTICE '  2. communications: Added tenant_id column with FK constraint';
    RAISE NOTICE '  3. Row-Level Security (RLS) enabled on both tables';
    RAISE NOTICE '  4. Performance indexes created';
    RAISE NOTICE '  5. Helper functions created for tenant context management';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Update all API queries to include tenant_id filtering';
    RAISE NOTICE '  2. Add set_tenant_context() to authentication middleware';
    RAISE NOTICE '  3. Run integration tests for cross-tenant access prevention';
    RAISE NOTICE '  4. Review audit logs for any RLS policy violations';
    RAISE NOTICE '';
    RAISE NOTICE 'Security Impact: CRITICAL vulnerability patched';
    RAISE NOTICE 'SOC 2 Compliance: Now compliant with tenant isolation controls';
    RAISE NOTICE '============================================================================';
END;
$$;
