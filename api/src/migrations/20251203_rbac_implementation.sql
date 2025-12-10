-- ============================================================================
-- RBAC Implementation Migration
-- CRIT-F-003: Comprehensive Role-Based Access Control
-- ============================================================================
-- This migration creates the necessary tables and data for a complete RBAC
-- system with role hierarchy, granular permissions, and audit logging.
--
-- Security Features:
-- - Role hierarchy (admin > manager > user > guest)
-- - Granular permission system
-- - Tenant isolation
-- - Authorization audit logging
-- - Permission check logging (existing)
--
-- Date: 2025-12-03
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. ROLES TABLE
-- ============================================================================
-- Defines available roles in the system
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  level INTEGER NOT NULL, -- Higher number = higher privilege (admin=4, manager=3, user=2, guest=1)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (name, description, level) VALUES
  ('admin', 'Full system access, can manage users and roles', 4),
  ('manager', 'Can manage fleet operations, vehicles, and drivers', 3),
  ('user', 'Standard user with read access and limited write access', 2),
  ('guest', 'Read-only access to public resources', 1)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 2. PERMISSIONS TABLE
-- ============================================================================
-- Defines granular permissions for specific actions
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  resource VARCHAR(50) NOT NULL, -- e.g., 'vehicle', 'driver', 'maintenance'
  action VARCHAR(50) NOT NULL,   -- e.g., 'create', 'read', 'update', 'delete'
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster permission lookups
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);

-- Insert default permissions
INSERT INTO permissions (name, resource, action, description) VALUES
  -- Vehicle permissions
  ('vehicle:create', 'vehicle', 'create', 'Create new vehicles'),
  ('vehicle:read', 'vehicle', 'read', 'View vehicle information'),
  ('vehicle:update', 'vehicle', 'update', 'Update vehicle details'),
  ('vehicle:delete', 'vehicle', 'delete', 'Delete vehicles'),

  -- Driver permissions
  ('driver:create', 'driver', 'create', 'Create new drivers'),
  ('driver:read', 'driver', 'read', 'View driver information'),
  ('driver:update', 'driver', 'update', 'Update driver details'),
  ('driver:delete', 'driver', 'delete', 'Delete drivers'),

  -- Maintenance permissions
  ('maintenance:create', 'maintenance', 'create', 'Create maintenance records'),
  ('maintenance:read', 'maintenance', 'read', 'View maintenance records'),
  ('maintenance:update', 'maintenance', 'update', 'Update maintenance records'),
  ('maintenance:delete', 'maintenance', 'delete', 'Delete maintenance records'),
  ('maintenance:approve', 'maintenance', 'approve', 'Approve maintenance requests'),

  -- Work order permissions
  ('work_order:create', 'work_order', 'create', 'Create work orders'),
  ('work_order:read', 'work_order', 'read', 'View work orders'),
  ('work_order:update', 'work_order', 'update', 'Update work orders'),
  ('work_order:delete', 'work_order', 'delete', 'Delete work orders'),
  ('work_order:approve', 'work_order', 'approve', 'Approve work orders'),

  -- Report permissions
  ('report:view', 'report', 'view', 'View reports'),
  ('report:export', 'report', 'export', 'Export reports'),
  ('report:schedule', 'report', 'schedule', 'Schedule automated reports'),

  -- Admin permissions
  ('user:manage', 'user', 'manage', 'Manage user accounts'),
  ('role:manage', 'role', 'manage', 'Manage roles and permissions'),
  ('audit:view', 'audit', 'view', 'View audit logs'),
  ('settings:manage', 'settings', 'manage', 'Manage system settings'),

  -- Fuel transaction permissions
  ('fuel:create', 'fuel', 'create', 'Create fuel transaction records'),
  ('fuel:read', 'fuel', 'read', 'View fuel transactions'),
  ('fuel:update', 'fuel', 'update', 'Update fuel transactions'),
  ('fuel:delete', 'fuel', 'delete', 'Delete fuel transactions'),

  -- Document permissions
  ('document:upload', 'document', 'upload', 'Upload documents'),
  ('document:read', 'document', 'read', 'View documents'),
  ('document:delete', 'document', 'delete', 'Delete documents')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. ROLE_PERMISSIONS TABLE (Junction Table)
-- ============================================================================
-- Maps which permissions are granted to which roles
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- Assign permissions to roles
-- Admin: ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager: Most permissions except user/role management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'manager'
  AND p.name NOT IN ('user:manage', 'role:manage', 'settings:manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- User: Read permissions + limited write
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'user'
  AND p.action IN ('read', 'create', 'update')
  AND p.resource NOT IN ('user', 'role', 'settings')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Guest: Read-only permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'guest'
  AND p.action = 'read'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- 4. USER_ROLES TABLE
-- ============================================================================
-- Tracks role assignments for users (supports multiple roles per user)
CREATE TABLE IF NOT EXISTS user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP, -- Optional expiration for temporary role assignments
  assigned_by INTEGER REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(user_id, is_active);

-- ============================================================================
-- 5. AUTHORIZATION AUDIT LOG TABLE
-- ============================================================================
-- Logs all authorization failures for security monitoring
CREATE TABLE IF NOT EXISTS authorization_audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  tenant_id VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  required_roles JSONB,
  user_role VARCHAR(50),
  required_permissions JSONB,
  user_permissions JSONB,
  resource_type VARCHAR(50),
  resource_id VARCHAR(255),
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_auth_audit_user ON authorization_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_tenant ON authorization_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created ON authorization_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_audit_resource ON authorization_audit_log(resource_type, resource_id);

-- ============================================================================
-- 6. UPDATE USERS TABLE
-- ============================================================================
-- Ensure users table has role column (it already exists from schema.ts)
-- Also add tenant_id if it doesn't exist
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255) DEFAULT 'default-tenant';

-- Create index for tenant queries
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

-- Update existing users to have default role assignments
-- This creates user_roles entries for all existing users based on their role column
INSERT INTO user_roles (user_id, role_id, is_active)
SELECT u.id, r.id, true
FROM users u
JOIN roles r ON r.name = COALESCE(u.role, 'user')
WHERE NOT EXISTS (
  SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
)
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ============================================================================
-- 7. ADD TENANT_ID TO RESOURCE TABLES (for tenant isolation)
-- ============================================================================
-- Add tenant_id to all major resource tables if not exists
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255) DEFAULT 'default-tenant';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255) DEFAULT 'default-tenant';
ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255) DEFAULT 'default-tenant';
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255) DEFAULT 'default-tenant';
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255) DEFAULT 'default-tenant';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(255) DEFAULT 'default-tenant';

-- Create indexes for tenant isolation queries
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant ON vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_drivers_tenant ON drivers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant ON maintenance_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant ON work_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fuel_tenant ON fuel_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);

-- ============================================================================
-- 8. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(p_user_id INTEGER, p_permission_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      AND p.name = p_permission_name
      AND p.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's effective role (highest level)
CREATE OR REPLACE FUNCTION get_user_effective_role(p_user_id INTEGER)
RETURNS VARCHAR AS $$
DECLARE
  v_role VARCHAR;
BEGIN
  SELECT r.name INTO v_role
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ORDER BY r.level DESC
  LIMIT 1;

  RETURN COALESCE(v_role, 'guest');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all user permissions
CREATE OR REPLACE FUNCTION get_user_permissions(p_user_id INTEGER)
RETURNS TABLE(permission_name VARCHAR, resource VARCHAR, action VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name, p.resource, p.action
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    AND p.is_active = true
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. CREATE VIEWS FOR EASIER QUERYING
-- ============================================================================

-- View for user permissions (denormalized for easy querying)
CREATE OR REPLACE VIEW v_user_permissions AS
SELECT
  u.id as user_id,
  u.email,
  u.tenant_id,
  r.name as role_name,
  r.level as role_level,
  p.name as permission_name,
  p.resource,
  p.action,
  ur.is_active,
  ur.expires_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.is_active = true
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  AND p.is_active = true;

-- View for authorization audit summary (for security dashboard)
CREATE OR REPLACE VIEW v_authorization_failures AS
SELECT
  user_id,
  COUNT(*) as failure_count,
  MAX(created_at) as last_failure,
  array_agg(DISTINCT action) as attempted_actions,
  array_agg(DISTINCT reason) as failure_reasons
FROM authorization_audit_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id
HAVING COUNT(*) > 5
ORDER BY failure_count DESC;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================
-- Run these to verify the migration was successful:
--
-- SELECT id, name, display_name, description, is_system_role, mfa_required, just_in_time_elevation_allowed, max_dataset_size, created_at, updated_at FROM roles;
-- SELECT id, name, resource, verb, scope, description, created_at FROM permissions ORDER BY resource, action;
-- SELECT r.name, COUNT(p.id) as permission_count
-- FROM roles r
-- JOIN role_permissions rp ON r.id = rp.role_id
-- JOIN permissions p ON rp.permission_id = p.id
-- GROUP BY r.name;
--
-- SELECT * FROM v_user_permissions WHERE user_id = 1;
-- SELECT * FROM v_authorization_failures;
-- ============================================================================
