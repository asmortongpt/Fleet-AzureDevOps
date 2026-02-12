-- Migration: Database Users and Security Roles
-- Creates dedicated database users with restricted permissions for improved security
-- Date: 2025-11-17

-- ============================================
-- 1. CREATE DATABASE ROLES
-- ============================================

-- Create webapp user role for normal application operations
-- This user has read/write access to application tables but no admin privileges
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'fleet_webapp_user') THEN
    CREATE ROLE fleet_webapp_user LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';
    COMMENT ON ROLE fleet_webapp_user IS 'Standard web application user with read/write access to app tables';
  END IF;
END
$$;

-- Create read-only user for reporting and analytics
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'fleet_readonly_user') THEN
    CREATE ROLE fleet_readonly_user LOGIN PASSWORD 'CHANGE_ME_IN_PRODUCTION';
    COMMENT ON ROLE fleet_readonly_user IS 'Read-only user for reporting and analytics';
  END IF;
END
$$;

-- ============================================
-- 2. GRANT SCHEMA USAGE
-- ============================================

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO fleet_webapp_user;
GRANT USAGE ON SCHEMA public TO fleet_readonly_user;

-- ============================================
-- 3. GRANT TABLE PERMISSIONS TO WEBAPP USER
-- ============================================

-- Grant SELECT, INSERT, UPDATE, DELETE on all existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO fleet_webapp_user;

-- Grant SELECT, UPDATE on all sequences (for auto-increment IDs)
GRANT SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO fleet_webapp_user;

-- Grant EXECUTE on all functions (for stored procedures)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO fleet_webapp_user;

-- Make these grants default for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO fleet_webapp_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, UPDATE ON SEQUENCES TO fleet_webapp_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO fleet_webapp_user;

-- ============================================
-- 4. GRANT READ-ONLY PERMISSIONS
-- ============================================

-- Grant SELECT only on all existing tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO fleet_readonly_user;

-- Grant SELECT on sequences (for sequence information)
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO fleet_readonly_user;

-- Make these grants default for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO fleet_readonly_user;

-- ============================================
-- 5. REVOKE DANGEROUS PERMISSIONS
-- ============================================

-- Ensure webapp user cannot create, drop, or alter schemas
REVOKE CREATE ON SCHEMA public FROM fleet_webapp_user;
REVOKE CREATE ON SCHEMA public FROM fleet_readonly_user;

-- Ensure webapp user cannot create or drop databases
-- (This is already the default, but being explicit)

-- ============================================
-- 6. SECURITY POLICIES (Row Level Security)
-- ============================================

-- Example: Enable RLS on sensitive tables if needed
-- Note: Uncomment and customize for specific tables as needed

/*
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see records for their tenant
CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  TO fleet_webapp_user
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Similar policies can be created for other multi-tenant tables
*/

-- ============================================
-- 7. CONNECTION LIMITS
-- ============================================

-- Set connection limits to prevent resource exhaustion
ALTER ROLE fleet_webapp_user CONNECTION LIMIT 50;
ALTER ROLE fleet_readonly_user CONNECTION LIMIT 20;

-- ============================================
-- 8. SESSION SECURITY SETTINGS
-- ============================================

-- Prevent webapp user from modifying system settings
ALTER ROLE fleet_webapp_user SET statement_timeout = '30s';
ALTER ROLE fleet_webapp_user SET idle_in_transaction_session_timeout = '60s';
ALTER ROLE fleet_webapp_user SET lock_timeout = '10s';

ALTER ROLE fleet_readonly_user SET statement_timeout = '60s';
ALTER ROLE fleet_readonly_user SET idle_in_transaction_session_timeout = '120s';
ALTER ROLE fleet_readonly_user SET lock_timeout = '5s';

-- ============================================
-- 9. AUDIT TABLE FOR USER ACTIONS
-- ============================================

-- Create table to track which database user is used for operations
CREATE TABLE IF NOT EXISTS db_user_audit (
  id SERIAL PRIMARY KEY,
  db_user VARCHAR(100) NOT NULL,
  operation VARCHAR(50) NOT NULL,
  table_name VARCHAR(100),
  record_id VARCHAR(100),
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Grant webapp user permission to insert audit records
GRANT INSERT ON db_user_audit TO fleet_webapp_user;
GRANT SELECT ON db_user_audit TO fleet_readonly_user;

-- ============================================
-- 10. INFORMATIONAL QUERIES
-- ============================================

-- View current role permissions (for verification)
-- Run these manually after migration:

/*
-- Check webapp user permissions
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'fleet_webapp_user'
ORDER BY table_name, privilege_type;

-- Check readonly user permissions
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.table_privileges
WHERE grantee = 'fleet_readonly_user'
ORDER BY table_name, privilege_type;

-- Check role attributes
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin, rolconnlimit
FROM pg_roles
WHERE rolname IN ('fleet_webapp_user', 'fleet_readonly_user', 'fleetadmin');
*/

-- ============================================
-- 11. POST-MIGRATION CHECKLIST
-- ============================================

/*
After running this migration:

1. UPDATE PASSWORDS:
   - Change 'CHANGE_ME_IN_PRODUCTION' to secure passwords
   - Store passwords in environment variables or secrets manager
   - Command: ALTER ROLE fleet_webapp_user PASSWORD 'new_secure_password';

2. UPDATE APPLICATION CONFIGURATION:
   - Add DB_WEBAPP_USER=fleet_webapp_user to .env
   - Add DB_WEBAPP_PASSWORD=your_secure_password to .env
   - Add DB_READONLY_USER=fleet_readonly_user to .env (optional)
   - Add DB_READONLY_PASSWORD=your_secure_password to .env (optional)

3. TEST CONNECTIONS:
   - Test webapp user can read/write to application tables
   - Test webapp user CANNOT create schemas or drop tables
   - Test readonly user can only read data
   - Test admin user (fleetadmin) still has full access for migrations

4. VERIFY PERMISSIONS:
   - Run the informational queries above
   - Ensure no excessive privileges are granted
   - Check connection limits are appropriate

5. ENABLE ROW LEVEL SECURITY (Optional):
   - Uncomment RLS policies above if using multi-tenant isolation
   - Create policies for each tenant-scoped table
   - Test policies with different tenant contexts

6. MONITOR USAGE:
   - Check db_user_audit table periodically
   - Monitor connection pool statistics
   - Set up alerts for connection limit breaches

7. DOCUMENTATION:
   - Document which database user should be used for which operations
   - Update deployment runbooks with new environment variables
   - Train team on proper database user usage
*/

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================

/*
-- To rollback this migration (use with caution):

-- Revoke all permissions
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM fleet_webapp_user;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM fleet_webapp_user;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM fleet_webapp_user;
REVOKE ALL PRIVILEGES ON SCHEMA public FROM fleet_webapp_user;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM fleet_readonly_user;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM fleet_readonly_user;
REVOKE ALL PRIVILEGES ON SCHEMA public FROM fleet_readonly_user;

-- Reset default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM fleet_webapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM fleet_webapp_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM fleet_webapp_user;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM fleet_readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM fleet_readonly_user;

-- Drop roles (only if no active connections)
DROP ROLE IF EXISTS fleet_webapp_user;
DROP ROLE IF EXISTS fleet_readonly_user;

-- Drop audit table
DROP TABLE IF EXISTS db_user_audit;
*/
