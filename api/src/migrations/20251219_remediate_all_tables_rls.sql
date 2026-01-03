-- ============================================================================
-- Migration: 20251219_remediate_all_tables_rls
-- Description: Comprehensive audit and remediation to ensure ALL tables have 
--              tenant_id and Row Level Security (RLS) enabled.
-- Priority: P0 (Remediation)
-- ============================================================================

BEGIN;

-- 1. Function to ensure tenant_id exists
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('migrations', 'spatial_ref_sys') -- Exclude system/migration tables
    LOOP
        -- Check if tenant_id column exists
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = r.table_name 
            AND column_name = 'tenant_id'
        ) THEN
            RAISE NOTICE 'Adding tenant_id to table: %', r.table_name;
            EXECUTE format('ALTER TABLE %I ADD COLUMN tenant_id UUID', r.table_name);
            
            -- Add FK if tenants table exists (it should)
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenants') THEN
                EXECUTE format('ALTER TABLE %I ADD CONSTRAINT fk_%I_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE', r.table_name, r.table_name);
            END IF;
            
            EXECUTE format('CREATE INDEX idx_%I_tenant_id ON %I(tenant_id)', r.table_name, r.table_name);
        END IF;

        -- Ensure RLS is enabled
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.table_name);
        
        -- Drop existing policies to prevent duplicates/conflicts (simplified approach for remediation)
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', r.table_name);
        
        -- Apply standard tenant isolation policy
        EXECUTE format('CREATE POLICY tenant_isolation ON %I USING (tenant_id = current_setting(''app.current_tenant_id'', true)::UUID)', r.table_name);
        
        RAISE NOTICE 'Secured table: %', r.table_name;
    END LOOP;
END;
$$;

COMMIT;
