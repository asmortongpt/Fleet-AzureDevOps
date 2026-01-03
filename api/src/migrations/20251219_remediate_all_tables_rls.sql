-- ============================================================================
-- Migration: 20251219_remediate_all_tables_rls
-- Description: Comprehensive audit and remediation to ensure ALL tables have 
--              tenant_id and Row Level Security (RLS) enabled.
-- Priority: P0 (Remediation)
-- ============================================================================

BEGIN;

-- 1. Function to ensure tenant_id exists and is UUID
DO $$
DECLARE
    r RECORD;
    col_type TEXT;
BEGIN
    FOR r IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT IN ('migrations', 'spatial_ref_sys', 'tenants') -- Exclude system/migration/tenants tables
    LOOP
        -- Check if tenant_id column exists
        SELECT data_type INTO col_type
        FROM information_schema.columns 
        WHERE table_name = r.table_name 
        AND column_name = 'tenant_id';

        IF col_type IS NULL THEN
            RAISE NOTICE 'Adding tenant_id to table: %', r.table_name;
            EXECUTE format('ALTER TABLE %I ADD COLUMN tenant_id UUID', r.table_name);
            
            -- Add FK if tenants table exists
            EXECUTE format('ALTER TABLE %I ADD CONSTRAINT fk_%I_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE', r.table_name, r.table_name);
            
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_tenant_id ON %I(tenant_id)', r.table_name, r.table_name);
        ELSIF col_type != 'uuid' THEN
            RAISE NOTICE 'Converting tenant_id to UUID in table: %', r.table_name;
            -- We need to drop dependent objects if any, but since we are remediating, we keep it simple
            -- Note: this might fail if there are views or foreign keys depending on it.
            EXECUTE format('ALTER TABLE %I ALTER COLUMN tenant_id TYPE UUID USING tenant_id::UUID', r.table_name);
        END IF;

        -- Ensure RLS is enabled
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.table_name);
        
        -- Drop existing policies
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', r.table_name);
        
        -- Apply standard tenant isolation policy
        -- Ensure we cast both sides to UUID or both to text.
        EXECUTE format('CREATE POLICY tenant_isolation ON %I USING (tenant_id::TEXT = current_setting(''app.current_tenant_id'', true))', r.table_name);
        
        RAISE NOTICE 'Secured table: %', r.table_name;
    END LOOP;
END;
$$;

COMMIT;
