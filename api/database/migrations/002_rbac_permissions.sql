-- RBAC Permissions and Roles Migration
-- Adds fine-grained permission system with SoD enforcement

-- ============================================
-- Permissions and Roles Tables
-- ============================================

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL, -- e.g., "work_order:create:team"
    resource VARCHAR(50) NOT NULL,     -- e.g., "work_order"
    verb VARCHAR(50) NOT NULL,          -- e.g., "create", "view", "approve"
    scope VARCHAR(20) NOT NULL,         -- "own", "team", "fleet", "global"
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_permissions_resource ON permissions(resource);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT false,
    mfa_required BOOLEAN DEFAULT false,
    just_in_time_elevation_allowed BOOLEAN DEFAULT false,
    max_dataset_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_roles_name ON roles(name);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    conditions JSONB DEFAULT '{}', -- Row-level policy conditions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

-- Separation of Duties (SoD) rules
CREATE TABLE sod_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    conflicting_role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, conflicting_role_id)
);

CREATE INDEX idx_sod_rules_role ON sod_rules(role_id);

-- User role assignments (supports multiple roles per user)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- For temporary elevations
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_active ON user_roles(user_id, is_active) WHERE is_active = true;

-- ============================================
-- Extend Users Table for Scope and Approvals
-- ============================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS facility_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS team_driver_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS team_vehicle_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS approval_limit DECIMAL(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS scope_level VARCHAR(20) DEFAULT 'team' CHECK (scope_level IN ('own', 'team', 'fleet', 'global'));

CREATE INDEX idx_users_facility_ids ON users USING GIN(facility_ids);
CREATE INDEX idx_users_team_driver_ids ON users USING GIN(team_driver_ids);
CREATE INDEX idx_users_team_vehicle_ids ON users USING GIN(team_vehicle_ids);

-- ============================================
-- Break-Glass Emergency Access
-- ============================================

CREATE TABLE break_glass_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    elevated_role_id UUID REFERENCES roles(id),
    reason TEXT NOT NULL,
    ticket_reference VARCHAR(100) NOT NULL,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    max_duration_minutes INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'expired', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_break_glass_user ON break_glass_sessions(user_id);
CREATE INDEX idx_break_glass_status ON break_glass_sessions(status);

-- ============================================
-- Validation Functions
-- ============================================

-- Function to check SoD violations when assigning roles
CREATE OR REPLACE FUNCTION check_sod_violation(
    p_user_id UUID,
    p_new_role_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_conflict BOOLEAN;
BEGIN
    -- Check if the new role conflicts with any existing user roles
    SELECT EXISTS (
        SELECT 1
        FROM user_roles ur
        JOIN sod_rules sr ON (
            (sr.role_id = ur.role_id AND sr.conflicting_role_id = p_new_role_id)
            OR
            (sr.conflicting_role_id = ur.role_id AND sr.role_id = p_new_role_id)
        )
        WHERE ur.user_id = p_user_id
        AND ur.is_active = true
    ) INTO v_has_conflict;

    RETURN v_has_conflict;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent SoD violations on user_roles insert/update
CREATE OR REPLACE FUNCTION prevent_sod_violation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_active = true AND check_sod_violation(NEW.user_id, NEW.role_id) THEN
        RAISE EXCEPTION 'Separation of Duties violation: This role conflicts with an existing user role';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_sod_violation
BEFORE INSERT OR UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION prevent_sod_violation();

-- ============================================
-- Seed Roles and Permissions
-- ============================================

-- Insert roles
INSERT INTO roles (name, display_name, description, mfa_required, just_in_time_elevation_allowed, max_dataset_size) VALUES
('FleetAdmin', 'Fleet Administrator', 'Tenant administrator with full organizational access except financial approvals', true, true, NULL),
('Manager', 'Fleet Manager', 'Fleet manager with operational oversight and approval authority', false, false, 10000),
('Supervisor', 'Operations Supervisor', 'Day-to-day team management and vehicle assignments', false, false, 5000),
('Dispatcher', 'Dispatcher', 'Dispatch coordinator managing routes and assignments', false, false, 5000),
('Mechanic', 'Maintenance Technician', 'Executes repairs and maintenance tasks', false, false, 1000),
('Driver', 'Vehicle Operator', 'Driver with self-service access to own records', false, false, 100),
('SafetyOfficer', 'Safety & Compliance Officer', 'Manages safety incidents, OSHA, and compliance', true, false, 10000),
('Finance', 'Finance & Procurement', 'Creates purchase orders and manages vendor relationships', true, false, NULL),
('Analyst', 'Data Analyst', 'Read-only access with reporting and export capabilities', false, false, 50000),
('Auditor', 'Compliance Auditor', 'Read-only access to all data including audit logs', true, false, 50000)
ON CONFLICT (name) DO NOTHING;

-- Insert core permissions (sample set - extend as needed)
INSERT INTO permissions (name, resource, verb, scope, description) VALUES
-- Vehicle permissions
('vehicle:view:own', 'vehicle', 'view', 'own', 'View own assigned vehicle'),
('vehicle:view:team', 'vehicle', 'view', 'team', 'View team vehicles'),
('vehicle:view:fleet', 'vehicle', 'view', 'fleet', 'View all fleet vehicles'),
('vehicle:view:global', 'vehicle', 'view', 'global', 'View all vehicles in organization'),
('vehicle:create:global', 'vehicle', 'create', 'global', 'Create new vehicles'),
('vehicle:update:team', 'vehicle', 'update', 'team', 'Update team vehicles'),
('vehicle:update:global', 'vehicle', 'update', 'global', 'Update any vehicle'),
('vehicle:delete:global', 'vehicle', 'delete', 'global', 'Delete sold/retired vehicles'),
('vehicle:assign:team', 'vehicle', 'assign', 'team', 'Assign drivers to team vehicles'),
('vehicle:assign:fleet', 'vehicle', 'assign', 'fleet', 'Assign drivers to any fleet vehicle'),

-- Driver permissions
('driver:view:own', 'driver', 'view', 'own', 'View own driver profile'),
('driver:view:team', 'driver', 'view', 'team', 'View team drivers'),
('driver:view:fleet', 'driver', 'view', 'fleet', 'View all fleet drivers'),
('driver:view:global', 'driver', 'view', 'global', 'View all drivers'),
('driver:create:global', 'driver', 'create', 'global', 'Create new drivers'),
('driver:update:global', 'driver', 'update', 'global', 'Update driver information'),
('driver:certify:global', 'driver', 'certify', 'global', 'Certify driver compliance'),

-- Work order permissions
('work_order:view:own', 'work_order', 'view', 'own', 'View assigned work orders'),
('work_order:view:team', 'work_order', 'view', 'team', 'View team work orders'),
('work_order:view:fleet', 'work_order', 'view', 'fleet', 'View all work orders'),
('work_order:create:team', 'work_order', 'create', 'team', 'Create work orders for team'),
('work_order:create:fleet', 'work_order', 'create', 'fleet', 'Create any work order'),
('work_order:update:own', 'work_order', 'update', 'own', 'Update assigned work orders'),
('work_order:complete:own', 'work_order', 'complete', 'own', 'Complete assigned work orders'),
('work_order:approve:fleet', 'work_order', 'approve', 'fleet', 'Approve work orders'),
('work_order:delete:fleet', 'work_order', 'delete', 'fleet', 'Delete work orders'),

-- Route permissions
('route:view:own', 'route', 'view', 'own', 'View own routes'),
('route:view:fleet', 'route', 'view', 'fleet', 'View all routes'),
('route:create:fleet', 'route', 'create', 'fleet', 'Create routes'),
('route:update:fleet', 'route', 'update', 'fleet', 'Update routes'),

-- Purchase order permissions
('purchase_order:view:global', 'purchase_order', 'view', 'global', 'View all purchase orders'),
('purchase_order:create:global', 'purchase_order', 'create', 'global', 'Create purchase orders'),
('purchase_order:approve:fleet', 'purchase_order', 'approve', 'fleet', 'Approve purchase orders'),

-- Safety permissions
('safety_incident:view:global', 'safety_incident', 'view', 'global', 'View all safety incidents'),
('safety_incident:create:global', 'safety_incident', 'create', 'global', 'Create safety incidents'),
('safety_incident:approve:global', 'safety_incident', 'approve', 'global', 'Approve incident reports'),

-- Video permissions
('video_event:view:global', 'video_event', 'view', 'global', 'View video events'),

-- GPS/Telemetry permissions
('telemetry:view:fleet', 'telemetry', 'view', 'fleet', 'View vehicle telemetry'),

-- Inspection permissions
('inspection:create:own', 'inspection', 'create', 'own', 'Create inspections'),
('inspection:view:fleet', 'inspection', 'view', 'fleet', 'View all inspections'),

-- Fuel permissions
('fuel_transaction:create:own', 'fuel_transaction', 'create', 'own', 'Log own fuel purchases'),
('fuel_transaction:view:fleet', 'fuel_transaction', 'view', 'fleet', 'View fuel transactions'),

-- User/Role management
('user:manage:global', 'user', 'manage', 'global', 'Manage user accounts'),
('role:manage:global', 'role', 'manage', 'global', 'Manage roles and permissions'),

-- Audit permissions
('audit_log:view:global', 'audit_log', 'view', 'global', 'View audit logs'),
('audit_log:export:global', 'audit_log', 'export', 'global', 'Export audit logs'),

-- Report permissions
('report:view:global', 'report', 'view', 'global', 'View reports'),
('report:generate:global', 'report', 'generate', 'global', 'Generate reports'),
('report:export:global', 'report', 'export', 'global', 'Export reports')
ON CONFLICT (name) DO NOTHING;

-- Insert SoD rules
INSERT INTO sod_rules (role_id, conflicting_role_id, reason)
SELECT r1.id, r2.id, 'Finance cannot also be FleetAdmin to prevent budget control conflicts'
FROM roles r1, roles r2
WHERE r1.name = 'Finance' AND r2.name = 'FleetAdmin'
UNION ALL
SELECT r1.id, r2.id, 'Finance cannot also be Manager to prevent self-approval of POs'
FROM roles r1, roles r2
WHERE r1.name = 'Finance' AND r2.name = 'Manager'
UNION ALL
SELECT r1.id, r2.id, 'Auditor cannot also be FleetAdmin to ensure independent oversight'
FROM roles r1, roles r2
WHERE r1.name = 'Auditor' AND r2.name = 'FleetAdmin'
UNION ALL
SELECT r1.id, r2.id, 'Auditor cannot also be Finance to ensure financial audit independence'
FROM roles r1, roles r2
WHERE r1.name = 'Auditor' AND r2.name = 'Finance'
UNION ALL
SELECT r1.id, r2.id, 'Driver cannot also be Mechanic to prevent maintenance fraud'
FROM roles r1, roles r2
WHERE r1.name = 'Driver' AND r2.name = 'Mechanic'
UNION ALL
SELECT r1.id, r2.id, 'Dispatcher cannot also be Finance to separate operations from procurement'
FROM roles r1, roles r2
WHERE r1.name = 'Dispatcher' AND r2.name = 'Finance'
ON CONFLICT DO NOTHING;

-- Assign permissions to roles (sample mapping - FleetAdmin role)
INSERT INTO role_permissions (role_id, permission_id, conditions)
SELECT r.id, p.id, '{}'::jsonb
FROM roles r, permissions p
WHERE r.name = 'FleetAdmin'
AND p.name IN (
    'vehicle:view:global', 'vehicle:create:global', 'vehicle:update:global', 'vehicle:delete:global',
    'driver:view:global', 'driver:create:global', 'driver:update:global',
    'work_order:view:fleet', 'work_order:create:fleet', 'work_order:approve:fleet',
    'user:manage:global', 'role:manage:global',
    'route:view:fleet', 'route:create:fleet', 'route:update:fleet',
    'telemetry:view:fleet', 'video_event:view:global',
    'inspection:view:fleet', 'fuel_transaction:view:fleet',
    'report:view:global', 'report:generate:global', 'report:export:global'
)
ON CONFLICT DO NOTHING;

-- Dispatcher permissions
INSERT INTO role_permissions (role_id, permission_id, conditions)
SELECT r.id, p.id, '{}'::jsonb
FROM roles r, permissions p
WHERE r.name = 'Dispatcher'
AND p.name IN (
    'vehicle:view:fleet', 'vehicle:assign:fleet',
    'driver:view:fleet',
    'route:view:fleet', 'route:create:fleet', 'route:update:fleet',
    'telemetry:view:fleet',
    'work_order:view:fleet'
)
ON CONFLICT DO NOTHING;

-- Mechanic permissions
INSERT INTO role_permissions (role_id, permission_id, conditions)
SELECT r.id, p.id, '{}'::jsonb
FROM roles r, permissions p
WHERE r.name = 'Mechanic'
AND p.name IN (
    'vehicle:view:fleet',
    'work_order:view:own', 'work_order:complete:own',
    'inspection:create:own'
)
ON CONFLICT DO NOTHING;

-- Driver permissions
INSERT INTO role_permissions (role_id, permission_id, conditions)
SELECT r.id, p.id, '{}'::jsonb
FROM roles r, permissions p
WHERE r.name = 'Driver'
AND p.name IN (
    'vehicle:view:own',
    'driver:view:own',
    'route:view:own',
    'inspection:create:own',
    'fuel_transaction:create:own'
)
ON CONFLICT DO NOTHING;

-- SafetyOfficer permissions
INSERT INTO role_permissions (role_id, permission_id, conditions)
SELECT r.id, p.id, '{}'::jsonb
FROM roles r, permissions p
WHERE r.name = 'SafetyOfficer'
AND p.name IN (
    'vehicle:view:global',
    'driver:view:global', 'driver:certify:global',
    'safety_incident:view:global', 'safety_incident:create:global', 'safety_incident:approve:global',
    'video_event:view:global',
    'inspection:view:fleet',
    'report:view:global', 'report:generate:global'
)
ON CONFLICT DO NOTHING;

-- Finance permissions
INSERT INTO role_permissions (role_id, permission_id, conditions)
SELECT r.id, p.id, '{}'::jsonb
FROM roles r, permissions p
WHERE r.name = 'Finance'
AND p.name IN (
    'purchase_order:view:global', 'purchase_order:create:global',
    'fuel_transaction:view:fleet',
    'report:view:global'
)
ON CONFLICT DO NOTHING;

-- Auditor permissions (read-only)
INSERT INTO role_permissions (role_id, permission_id, conditions)
SELECT r.id, p.id, '{}'::jsonb
FROM roles r, permissions p
WHERE r.name = 'Auditor'
AND p.name LIKE '%:view:%' OR p.name LIKE 'audit_log:%'
ON CONFLICT DO NOTHING;

-- ============================================
-- Migration: Convert existing role field to new system
-- ============================================

-- Insert user_roles entries based on existing users.role field
INSERT INTO user_roles (user_id, role_id, assigned_at, is_active)
SELECT u.id, r.id, NOW(), true
FROM users u
JOIN roles r ON (
    (u.role = 'admin' AND r.name = 'FleetAdmin') OR
    (u.role = 'fleet_manager' AND r.name = 'Manager') OR
    (u.role = 'technician' AND r.name = 'Mechanic') OR
    (u.role = 'driver' AND r.name = 'Driver') OR
    (u.role = 'viewer' AND r.name = 'Auditor')
)
ON CONFLICT DO NOTHING;

-- ============================================
-- Update Audit Log Function to Log Permission Checks
-- ============================================

CREATE TABLE permission_check_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    tenant_id UUID,
    permission_name VARCHAR(100),
    resource_type VARCHAR(50),
    resource_id UUID,
    granted BOOLEAN,
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_permission_check_logs_user ON permission_check_logs(user_id);
CREATE INDEX idx_permission_check_logs_granted ON permission_check_logs(granted);
CREATE INDEX idx_permission_check_logs_created_at ON permission_check_logs(created_at DESC);

-- ============================================
-- Updated Triggers
-- ============================================

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Schema Version Update
-- ============================================

INSERT INTO schema_version (version, description) VALUES (2, 'RBAC permissions with fine-grained access control, SoD enforcement, and break-glass mechanism');

-- ============================================
-- END OF MIGRATION
-- ============================================
