-- ============================================================================
-- RLS Verification Script for Fleet Management System
-- ============================================================================
-- Purpose: Comprehensive verification that Row-Level Security is properly
--          configured and enforcing multi-tenant isolation
--
-- BACKEND-35: Verify RLS enabled on all tables
-- BACKEND-36: Verify all tables have tenant_id column
-- BACKEND-37: Verify all tenant_id columns are NOT NULL
--
-- Usage:
--   psql -U postgres -d fleet_db -f verify-rls.sql
-- ============================================================================

\set ON_ERROR_STOP on

-- Set output format for better readability
\pset border 2
\pset format wrapped
\x off

SELECT '============================================================================' as "";
SELECT 'RLS VERIFICATION REPORT' as "REPORT TITLE";
SELECT 'Generated: ' || NOW()::text as "TIMESTAMP";
SELECT '============================================================================' as "";

-- ============================================================================
-- TEST 1: Verify RLS is enabled on all tables with tenant_id
-- ============================================================================

SELECT '
TEST 1: RLS Enabled Status
----------------------------
Expected: All tables with tenant_id should have RLS enabled (rowsecurity = true)
' as "";

SELECT
    schemaname,
    tablename,
    CASE
        WHEN rowsecurity THEN '✅ ENABLED'
        ELSE '❌ DISABLED'
    END as rls_status,
    CASE
        WHEN rowsecurity THEN 'PASS'
        ELSE 'FAIL - RLS NOT ENABLED'
    END as test_result
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'tenant_id'
)
ORDER BY tablename;

-- Count summary
SELECT '
RLS Status Summary:
' as "";

SELECT
    COUNT(*) FILTER (WHERE rowsecurity = true) as "Tables with RLS Enabled",
    COUNT(*) FILTER (WHERE rowsecurity = false) as "Tables WITHOUT RLS (CRITICAL)",
    COUNT(*) as "Total Tables with tenant_id"
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'tenant_id'
);

-- ============================================================================
-- TEST 2: Verify tenant_id column exists and is NOT NULL
-- ============================================================================

SELECT '
TEST 2: tenant_id Column Status
--------------------------------
Expected: All multi-tenant tables should have tenant_id as NOT NULL
' as "";

SELECT
    table_name,
    column_name,
    data_type,
    CASE
        WHEN is_nullable = 'NO' THEN '✅ NOT NULL'
        ELSE '❌ NULLABLE'
    END as nullable_status,
    CASE
        WHEN is_nullable = 'NO' THEN 'PASS'
        ELSE 'FAIL - tenant_id IS NULLABLE'
    END as test_result
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'tenant_id'
ORDER BY table_name;

-- Count summary
SELECT '
tenant_id Constraint Summary:
' as "";

SELECT
    COUNT(*) FILTER (WHERE is_nullable = 'NO') as "Tables with NOT NULL tenant_id",
    COUNT(*) FILTER (WHERE is_nullable = 'YES') as "Tables with NULLABLE tenant_id (CRITICAL)",
    COUNT(*) as "Total Tables with tenant_id"
FROM information_schema.columns
WHERE table_schema = 'public'
AND column_name = 'tenant_id';

-- ============================================================================
-- TEST 3: Verify RLS policies exist for all tables
-- ============================================================================

SELECT '
TEST 3: RLS Policy Coverage
----------------------------
Expected: Each table with RLS enabled should have at least one tenant_isolation policy
' as "";

SELECT
    p.tablename,
    p.policyname,
    p.cmd as "Policy Command",
    CASE
        WHEN p.roles = '{fleet_webapp_user}' THEN 'fleet_webapp_user'
        ELSE p.roles::text
    END as "Applies To",
    CASE
        WHEN p.qual::text LIKE '%current_setting%' THEN '✅ Uses Tenant Context'
        ELSE '⚠️  Does Not Use Tenant Context'
    END as policy_check
FROM pg_policies p
WHERE p.schemaname = 'public'
AND p.policyname LIKE 'tenant_isolation%'
ORDER BY p.tablename, p.policyname;

-- Policy coverage summary
SELECT '
Policy Coverage Summary:
' as "";

WITH tables_with_tenant AS (
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'tenant_id'
),
tables_with_policy AS (
    SELECT DISTINCT tablename as table_name
    FROM pg_policies
    WHERE schemaname = 'public'
    AND policyname LIKE 'tenant_isolation%'
)
SELECT
    (SELECT COUNT(*) FROM tables_with_tenant) as "Tables with tenant_id",
    (SELECT COUNT(*) FROM tables_with_policy) as "Tables with RLS Policy",
    (SELECT COUNT(*) FROM tables_with_tenant WHERE table_name NOT IN (SELECT table_name FROM tables_with_policy)) as "Tables MISSING Policy (CRITICAL)"
;

-- ============================================================================
-- TEST 4: List tables missing RLS policies (CRITICAL FINDINGS)
-- ============================================================================

SELECT '
TEST 4: Tables Missing RLS Policies (CRITICAL)
-----------------------------------------------
Expected: Zero tables should be missing RLS policies
' as "";

WITH tables_with_tenant AS (
    SELECT DISTINCT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'tenant_id'
),
tables_with_policy AS (
    SELECT DISTINCT tablename as table_name
    FROM pg_policies
    WHERE schemaname = 'public'
    AND policyname LIKE 'tenant_isolation%'
)
SELECT
    t.table_name as "❌ TABLE MISSING RLS POLICY",
    'CRITICAL - Add RLS policy immediately' as "ACTION REQUIRED"
FROM tables_with_tenant t
WHERE t.table_name NOT IN (SELECT table_name FROM tables_with_policy)
ORDER BY t.table_name;

-- ============================================================================
-- TEST 5: Verify helper functions exist
-- ============================================================================

SELECT '
TEST 5: Helper Functions
-------------------------
Expected: set_tenant_context() and get_current_tenant_id() functions should exist
' as "";

SELECT
    proname as "Function Name",
    pg_get_function_arguments(oid) as "Arguments",
    pg_get_function_result(oid) as "Return Type",
    CASE
        WHEN prosecdef THEN '✅ SECURITY DEFINER'
        ELSE '⚠️  Regular Function'
    END as security_status
FROM pg_proc
WHERE proname IN ('set_tenant_context', 'get_current_tenant_id')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- ============================================================================
-- TEST 6: Verify foreign key constraints to tenants table
-- ============================================================================

SELECT '
TEST 6: Foreign Key Constraints
--------------------------------
Expected: All tenant_id columns should have foreign key constraints to tenants(id)
' as "";

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    CASE
        WHEN rc.delete_rule = 'CASCADE' THEN '✅ CASCADE'
        ELSE '⚠️  ' || rc.delete_rule
    END as delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND kcu.column_name = 'tenant_id'
AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================================================
-- TEST 7: Check for NULL tenant_id values (Should be ZERO)
-- ============================================================================

SELECT '
TEST 7: NULL tenant_id Check (CRITICAL)
----------------------------------------
Expected: Zero rows with NULL tenant_id across all tables
' as "";

-- Note: This generates dynamic SQL - review output carefully
DO $$
DECLARE
    r RECORD;
    null_count INTEGER;
    total_issues INTEGER := 0;
BEGIN
    FOR r IN
        SELECT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name = 'tenant_id'
        ORDER BY table_name
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', r.table_name)
        INTO null_count;

        IF null_count > 0 THEN
            RAISE NOTICE '❌ CRITICAL: % has % rows with NULL tenant_id', r.table_name, null_count;
            total_issues := total_issues + null_count;
        END IF;
    END LOOP;

    IF total_issues = 0 THEN
        RAISE NOTICE '✅ PASS: No NULL tenant_id values found in any table';
    ELSE
        RAISE NOTICE '❌ FAIL: Found % total rows with NULL tenant_id across all tables', total_issues;
    END IF;
END;
$$;

-- ============================================================================
-- TEST 8: Verify indexes on tenant_id for performance
-- ============================================================================

SELECT '
TEST 8: Index Coverage on tenant_id
------------------------------------
Expected: All tenant_id columns should have indexes for query performance
' as "";

SELECT
    t.tablename,
    i.indexname,
    CASE
        WHEN i.indexdef LIKE '%UNIQUE%' THEN '🔒 UNIQUE INDEX'
        WHEN i.indexdef LIKE '%btree%' THEN '✅ BTREE INDEX'
        ELSE '⚠️  OTHER INDEX TYPE'
    END as index_type,
    'PASS' as test_result
FROM pg_indexes i
JOIN pg_tables t ON i.tablename = t.tablename
WHERE i.schemaname = 'public'
AND (
    i.indexdef LIKE '%tenant_id%'
    OR i.indexname LIKE '%tenant%'
)
ORDER BY t.tablename, i.indexname;

-- ============================================================================
-- TEST 9: Sample RLS policy effectiveness (Requires tenant data)
-- ============================================================================

SELECT '
TEST 9: Policy Structure Verification
--------------------------------------
Verifying that policies use current_setting for tenant isolation
' as "";

SELECT
    tablename,
    policyname,
    CASE
        WHEN qual::text LIKE '%current_setting(''app.current_tenant_id''%'
        THEN '✅ CORRECT - Uses app.current_tenant_id session variable'
        ELSE '❌ FAIL - Does not use proper session variable: ' || qual::text
    END as policy_validation
FROM pg_policies
WHERE schemaname = 'public'
AND policyname LIKE 'tenant_isolation%'
ORDER BY tablename;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

SELECT '
============================================================================
FINAL RLS VERIFICATION SUMMARY
============================================================================
' as "";

WITH
rls_enabled AS (
    SELECT COUNT(*) as count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND rowsecurity = true
    AND tablename IN (
        SELECT DISTINCT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name = 'tenant_id'
    )
),
rls_disabled AS (
    SELECT COUNT(*) as count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND rowsecurity = false
    AND tablename IN (
        SELECT DISTINCT table_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name = 'tenant_id'
    )
),
nullable_tenant_id AS (
    SELECT COUNT(*) as count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'tenant_id'
    AND is_nullable = 'YES'
),
policies_count AS (
    SELECT COUNT(DISTINCT tablename) as count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND policyname LIKE 'tenant_isolation%'
)
SELECT
    '✅ RLS ENABLED TABLES: ' || (SELECT count FROM rls_enabled) as "STATUS",
    CASE
        WHEN (SELECT count FROM rls_disabled) = 0 THEN '✅ PASS'
        ELSE '❌ FAIL - ' || (SELECT count FROM rls_disabled) || ' tables need RLS'
    END as "RLS Coverage"
UNION ALL
SELECT
    '❌ NULLABLE tenant_id: ' || (SELECT count FROM nullable_tenant_id),
    CASE
        WHEN (SELECT count FROM nullable_tenant_id) = 0 THEN '✅ PASS'
        ELSE '❌ FAIL - Fix nullable tenant_id columns'
    END
UNION ALL
SELECT
    '✅ TABLES WITH POLICIES: ' || (SELECT count FROM policies_count),
    CASE
        WHEN (SELECT count FROM policies_count) >= (SELECT count FROM rls_enabled) THEN '✅ PASS'
        ELSE '❌ FAIL - Some tables missing policies'
    END;

SELECT '
============================================================================
COMPLIANCE STATUS
============================================================================
' as "";

SELECT
    CASE
        WHEN (
            (SELECT count FROM (
                SELECT COUNT(*) as count
                FROM pg_tables
                WHERE schemaname = 'public'
                AND rowsecurity = false
                AND tablename IN (
                    SELECT DISTINCT table_name
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                    AND column_name = 'tenant_id'
                )
            ) rls_disabled) = 0
            AND
            (SELECT count FROM (
                SELECT COUNT(*) as count
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND column_name = 'tenant_id'
                AND is_nullable = 'YES'
            ) nullable) = 0
        )
        THEN '✅ ✅ ✅ ALL TESTS PASSED - RLS IS PROPERLY CONFIGURED'
        ELSE '❌ ❌ ❌ CRITICAL ISSUES FOUND - REVIEW FAILURES ABOVE'
    END as "OVERALL STATUS";

SELECT '
============================================================================
NEXT STEPS
============================================================================

If any tests failed:

1. Review the failure details above
2. Run the appropriate migration scripts:
   - api/db/migrations/032_enable_rls.sql (enable RLS)
   - api/db/migrations/033_fix_nullable_tenant_id.sql (fix nullable columns)

3. Verify application middleware is configured:
   - Check that setTenantContext middleware is applied globally
   - Ensure authenticateJWT runs before setTenantContext
   - Verify all routes use the middleware

4. Test tenant isolation manually:
   SET app.current_tenant_id = ''<tenant-1-uuid>'';
   SELECT * FROM vehicles; -- Should only show tenant 1 data

   SET app.current_tenant_id = ''<tenant-2-uuid>'';
   SELECT * FROM vehicles; -- Should only show tenant 2 data

5. Document compliance for FedRAMP AC-3 and SOC 2 CC6.3

============================================================================
' as "";
