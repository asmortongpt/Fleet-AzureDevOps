-- Module-Based RBAC Enhancement
-- Adds audit logging and enhances existing RBAC system for module-based permissions

-- ============================================
-- Permission Audit Log Table
-- ============================================

CREATE TABLE IF NOT EXISTS permission_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(200) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(200),
    allowed BOOLEAN NOT NULL,
    reason TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context JSONB,
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_permission_audit_user ON permission_audit_log(user_id);
CREATE INDEX idx_permission_audit_timestamp ON permission_audit_log(timestamp DESC);
CREATE INDEX idx_permission_audit_allowed ON permission_audit_log(allowed);
CREATE INDEX idx_permission_audit_resource ON permission_audit_log(resource_type, resource_id);
CREATE INDEX idx_permission_audit_action ON permission_audit_log(action);

-- ============================================
-- Security Audit Log Table
-- ============================================

CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    context JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_security_audit_user ON security_audit_log(user_id);
CREATE INDEX idx_security_audit_timestamp ON security_audit_log(timestamp DESC);
CREATE INDEX idx_security_audit_severity ON security_audit_log(severity);
CREATE INDEX idx_security_audit_event_type ON security_audit_log(event_type);

-- ============================================
-- Enhanced Roles Table (if not exists from previous migration)
-- ============================================

CREATE TABLE IF NOT EXISTS module_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- User Module Roles Junction Table
-- ============================================

CREATE TABLE IF NOT EXISTS user_module_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_name VARCHAR(50) NOT NULL,
    org_id UUID,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_name)
);

CREATE INDEX idx_user_module_roles_user ON user_module_roles(user_id);
CREATE INDEX idx_user_module_roles_role ON user_module_roles(role_name);
CREATE INDEX idx_user_module_roles_active ON user_module_roles(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_module_roles_org ON user_module_roles(org_id);

-- ============================================
-- Seed Module-Based Roles
-- ============================================

INSERT INTO module_roles (name, description, is_system) VALUES
('Admin', 'Full system administrator with unrestricted access', true),
('FleetManager', 'Fleet manager with operational oversight', true),
('MaintenanceManager', 'Maintenance operations manager', true),
('Inspector', 'Vehicle inspector conducting field inspections', true),
('Driver', 'Vehicle operator with self-service access', true),
('Finance', 'Financial officer with access to cost and valuation data', true),
('Safety', 'Safety officer managing incidents and compliance', true),
('Auditor', 'Read-only auditor for compliance review', true),
('Vendor', 'External vendor with limited work order access', true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Migrate Existing User Roles
-- ============================================

-- Migrate from existing roles table if it exists
INSERT INTO user_module_roles (user_id, role_name, org_id, granted_at, is_active)
SELECT
    ur.user_id,
    r.name,
    ur.org_id,
    ur.assigned_at,
    ur.is_active
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE r.name IN ('Admin', 'FleetManager', 'MaintenanceManager', 'Inspector', 'Driver', 'Finance', 'Safety', 'Auditor', 'Vendor')
ON CONFLICT (user_id, role_name) DO NOTHING;

-- Migrate from users.role field if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
        INSERT INTO user_module_roles (user_id, role_name, granted_at, is_active)
        SELECT
            id,
            CASE
                WHEN role = 'admin' THEN 'Admin'
                WHEN role = 'fleet_manager' THEN 'FleetManager'
                WHEN role = 'maintenance_manager' THEN 'MaintenanceManager'
                WHEN role = 'inspector' THEN 'Inspector'
                WHEN role = 'driver' THEN 'Driver'
                WHEN role = 'finance' THEN 'Finance'
                WHEN role = 'safety' THEN 'Safety'
                WHEN role = 'auditor' THEN 'Auditor'
                WHEN role = 'vendor' THEN 'Vendor'
                ELSE 'Driver'
            END,
            NOW(),
            true
        FROM users
        WHERE role IS NOT NULL
        ON CONFLICT (user_id, role_name) DO NOTHING;
    END IF;
END $$;

-- ============================================
-- Helper Functions
-- ============================================

-- Function to get user roles as array
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id UUID)
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT role_name
        FROM user_module_roles
        WHERE user_id = p_user_id
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(p_user_id UUID, p_role_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_module_roles
        WHERE user_id = p_user_id
        AND role_name = p_role_name
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION user_has_any_role(p_user_id UUID, p_roles VARCHAR[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_module_roles
        WHERE user_id = p_user_id
        AND role_name = ANY(p_roles)
        AND is_active = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Automated Cleanup Job for Expired Roles
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_roles()
RETURNS INTEGER AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    UPDATE user_module_roles
    SET is_active = false
    WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN rows_affected;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Trigger to Update module_roles.updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_module_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_module_roles_updated_at
BEFORE UPDATE ON module_roles
FOR EACH ROW
EXECUTE FUNCTION update_module_roles_updated_at();

-- ============================================
-- Views for Easier Querying
-- ============================================

-- View combining user info with their roles
CREATE OR REPLACE VIEW user_roles_view AS
SELECT
    u.id as user_id,
    u.email,
    u.name,
    u.org_id,
    umr.role_name,
    umr.granted_at,
    umr.expires_at,
    umr.is_active,
    mr.description as role_description
FROM users u
LEFT JOIN user_module_roles umr ON u.id = umr.user_id
LEFT JOIN module_roles mr ON umr.role_name = mr.name
WHERE umr.is_active = true
AND (umr.expires_at IS NULL OR umr.expires_at > NOW());

-- View for audit log analysis
CREATE OR REPLACE VIEW permission_audit_summary AS
SELECT
    DATE_TRUNC('day', timestamp) as audit_date,
    action,
    resource_type,
    allowed,
    COUNT(*) as attempt_count,
    COUNT(DISTINCT user_id) as unique_users
FROM permission_audit_log
GROUP BY DATE_TRUNC('day', timestamp), action, resource_type, allowed;

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE permission_audit_log IS 'Audit trail for all permission checks';
COMMENT ON TABLE security_audit_log IS 'Security events and incidents log';
COMMENT ON TABLE module_roles IS 'Module-based role definitions';
COMMENT ON TABLE user_module_roles IS 'User role assignments with multi-role support';

COMMENT ON FUNCTION get_user_roles IS 'Get all active roles for a user as text array';
COMMENT ON FUNCTION user_has_role IS 'Check if user has a specific role';
COMMENT ON FUNCTION user_has_any_role IS 'Check if user has any of the specified roles';
COMMENT ON FUNCTION cleanup_expired_roles IS 'Deactivate roles that have expired';

-- ============================================
-- Schema Version Update
-- ============================================

INSERT INTO schema_version (version, description)
VALUES (10, 'Module-based RBAC with audit logging and enhanced permission tracking')
ON CONFLICT DO NOTHING;

-- ============================================
-- END OF MIGRATION
-- ============================================
