-- ============================================================================
-- Migration: 013_user_management_rbac.sql
-- Description: User Management & Role-Based Access Control (RBAC)
-- Author: Claude Code
-- Date: 2026-01-08
-- ============================================================================
-- Tables: 6
--   1. roles - Role definitions with hierarchical structure
--   2. user_roles - User-role assignments with time-based activation
--   3. permissions - Granular permission definitions
--   4. user_permissions - Direct user permission overrides
--   5. user_activity_log - Comprehensive user activity auditing
--   6. api_tokens - API authentication tokens
-- ============================================================================

-- ============================================================================
-- Table: roles
-- Purpose: Role-Based Access Control role definitions
-- ============================================================================

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Role identification
    role_name VARCHAR(100) NOT NULL,
    role_key VARCHAR(100) NOT NULL,  -- 'fleet_manager', 'driver', 'mechanic'
    role_description TEXT,

    -- Role hierarchy
    parent_role_id UUID REFERENCES roles(id),
    role_level INTEGER DEFAULT 0,  -- 0=top level, increases with nesting
    hierarchy_path TEXT,  -- Materialized path: '/admin/fleet_manager/supervisor'

    -- Role type
    role_type VARCHAR(30) DEFAULT 'custom' CHECK (role_type IN (
        'system', 'tenant_admin', 'built_in', 'custom'
    )),
    is_system_role BOOLEAN DEFAULT FALSE,  -- Cannot be deleted

    -- Permissions
    permissions TEXT[] DEFAULT '{}',  -- Array of permission keys
    -- Examples: ['vehicles.read', 'vehicles.write', 'maintenance.approve']

    -- Access scope
    access_scope VARCHAR(30) DEFAULT 'tenant_wide' CHECK (access_scope IN (
        'tenant_wide', 'department', 'location', 'team', 'self_only'
    )),
    scope_restrictions JSONB,  -- {departments: [uuid], locations: [uuid]}

    -- Features
    can_create_work_orders BOOLEAN DEFAULT FALSE,
    can_approve_expenses BOOLEAN DEFAULT FALSE,
    can_manage_users BOOLEAN DEFAULT FALSE,
    can_view_reports BOOLEAN DEFAULT TRUE,
    can_export_data BOOLEAN DEFAULT FALSE,
    max_approval_amount DECIMAL(12, 2),  -- Maximum $ amount for approvals

    -- UI/Dashboard
    default_dashboard_id UUID,
    accessible_modules TEXT[] DEFAULT '{}',  -- ['fleet', 'maintenance', 'reports']
    ui_restrictions JSONB,  -- {hide_features: [], readonly_features: []}

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    user_count INTEGER DEFAULT 0,  -- How many users have this role

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    CONSTRAINT unique_role_key_per_tenant UNIQUE (tenant_id, role_key)
);

-- Indexes
CREATE INDEX idx_roles_tenant ON roles(tenant_id);
CREATE INDEX idx_roles_parent ON roles(parent_role_id);
CREATE INDEX idx_roles_type ON roles(role_type, is_active);
CREATE INDEX idx_roles_hierarchy ON roles(hierarchy_path) WHERE hierarchy_path IS NOT NULL;
CREATE INDEX idx_roles_permissions ON roles USING GIN(permissions);
CREATE INDEX idx_roles_modules ON roles USING GIN(accessible_modules);

-- Trigger: Update timestamp
CREATE TRIGGER update_roles_timestamp
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Build hierarchy path
CREATE OR REPLACE FUNCTION build_role_hierarchy_path() RETURNS TRIGGER AS $$
DECLARE
    parent_path TEXT;
BEGIN
    IF NEW.parent_role_id IS NULL THEN
        NEW.hierarchy_path := '/' || NEW.role_key;
        NEW.role_level := 0;
    ELSE
        SELECT hierarchy_path, role_level INTO parent_path, NEW.role_level
        FROM roles WHERE id = NEW.parent_role_id;

        NEW.hierarchy_path := parent_path || '/' || NEW.role_key;
        NEW.role_level := NEW.role_level + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_build_role_hierarchy
    BEFORE INSERT OR UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION build_role_hierarchy_path();

-- Comments
COMMENT ON TABLE roles IS 'Role definitions with hierarchical structure and granular permissions';
COMMENT ON COLUMN roles.hierarchy_path IS 'Materialized path for efficient hierarchy queries';
COMMENT ON COLUMN roles.permissions IS 'Array of permission keys (e.g., vehicles.read, maintenance.approve)';

-- ============================================================================
-- Table: user_roles
-- Purpose: User-role assignments with time-based activation
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Assignment
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,

    -- Time-based activation
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    is_active BOOLEAN GENERATED ALWAYS AS (
        CASE
            WHEN effective_from > CURRENT_DATE THEN FALSE
            WHEN effective_until IS NOT NULL AND effective_until < CURRENT_DATE THEN FALSE
            ELSE TRUE
        END
    ) STORED,

    -- Priority (for users with multiple roles)
    priority INTEGER DEFAULT 0,  -- Higher = takes precedence
    is_primary_role BOOLEAN DEFAULT FALSE,

    -- Context-specific activation
    active_locations UUID[] DEFAULT '{}',  -- Role only active at these locations
    active_departments UUID[] DEFAULT '{}',  -- Role only active in these departments
    active_days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',  -- 0=Sunday, 6=Saturday
    active_hours_start TIME,  -- e.g., '08:00:00'
    active_hours_end TIME,    -- e.g., '17:00:00'

    -- Assignment details
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assignment_reason TEXT,

    -- Approval workflow
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,

    -- Revocation
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES users(id),
    revocation_reason TEXT,

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_role_assignment UNIQUE (user_id, role_id)
);

-- Indexes
CREATE INDEX idx_user_roles_tenant ON user_roles(tenant_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id, is_active);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_effective ON user_roles(effective_from, effective_until);
CREATE INDEX idx_user_roles_primary ON user_roles(user_id, is_primary_role) WHERE is_primary_role = TRUE;
CREATE INDEX idx_user_roles_locations ON user_roles USING GIN(active_locations);
CREATE INDEX idx_user_roles_departments ON user_roles USING GIN(active_departments);

-- Trigger: Update timestamp
CREATE TRIGGER update_user_roles_timestamp
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update role user count
CREATE OR REPLACE FUNCTION update_role_user_count() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE roles SET user_count = user_count + 1 WHERE id = NEW.role_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE roles SET user_count = user_count - 1 WHERE id = OLD.role_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.role_id != NEW.role_id THEN
        UPDATE roles SET user_count = user_count - 1 WHERE id = OLD.role_id;
        UPDATE roles SET user_count = user_count + 1 WHERE id = NEW.role_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_role_user_count
    AFTER INSERT OR UPDATE OR DELETE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_role_user_count();

-- Trigger: Ensure only one primary role per user
CREATE OR REPLACE FUNCTION enforce_single_primary_role() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary_role = TRUE THEN
        UPDATE user_roles
        SET is_primary_role = FALSE
        WHERE user_id = NEW.user_id
          AND id != NEW.id
          AND is_primary_role = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_one_primary_role
    BEFORE INSERT OR UPDATE ON user_roles
    FOR EACH ROW
    WHEN (NEW.is_primary_role = TRUE)
    EXECUTE FUNCTION enforce_single_primary_role();

-- Comments
COMMENT ON TABLE user_roles IS 'User-role assignments with time-based and context-based activation';
COMMENT ON COLUMN user_roles.is_active IS 'Auto-calculated based on effective_from and effective_until dates';
COMMENT ON COLUMN user_roles.active_days_of_week IS 'Array of integers 0-6 (Sunday-Saturday) when role is active';

-- ============================================================================
-- Table: permissions
-- Purpose: Granular permission definitions
-- ============================================================================

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL for system-wide

    -- Permission identification
    permission_key VARCHAR(200) NOT NULL UNIQUE,  -- 'vehicles.read', 'maintenance.approve'
    permission_name VARCHAR(200) NOT NULL,
    permission_description TEXT,

    -- Permission structure
    resource VARCHAR(100) NOT NULL,  -- 'vehicles', 'maintenance', 'users', etc.
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'read', 'create', 'update', 'delete', 'approve', 'export',
        'import', 'share', 'assign', 'manage', 'admin'
    )),

    -- Permission hierarchy
    parent_permission_key VARCHAR(200) REFERENCES permissions(permission_key),
    implies_permissions TEXT[] DEFAULT '{}',  -- Auto-grants these permissions

    -- Scope
    scope_level VARCHAR(30) DEFAULT 'entity' CHECK (scope_level IN (
        'system', 'tenant', 'department', 'team', 'entity', 'self'
    )),

    -- Constraints
    requires_permissions TEXT[] DEFAULT '{}',  -- Must have these permissions first
    conflicts_with_permissions TEXT[] DEFAULT '{}',  -- Cannot have these together

    -- Risk level
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN (
        'low', 'medium', 'high', 'critical'
    )),
    requires_mfa BOOLEAN DEFAULT FALSE,  -- Requires multi-factor authentication
    requires_approval BOOLEAN DEFAULT FALSE,

    -- UI metadata
    category VARCHAR(50),  -- For grouping in UI
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_deprecated BOOLEAN DEFAULT FALSE,
    deprecated_by VARCHAR(200),  -- New permission key

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_permissions_tenant ON permissions(tenant_id);
CREATE INDEX idx_permissions_resource ON permissions(resource, action);
CREATE INDEX idx_permissions_parent ON permissions(parent_permission_key);
CREATE INDEX idx_permissions_risk ON permissions(risk_level) WHERE risk_level IN ('high', 'critical');
CREATE INDEX idx_permissions_implies ON permissions USING GIN(implies_permissions);
CREATE INDEX idx_permissions_requires ON permissions USING GIN(requires_permissions);

-- Trigger: Update timestamp
CREATE TRIGGER update_permissions_timestamp
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE permissions IS 'Granular permission definitions with hierarchical structure';
COMMENT ON COLUMN permissions.permission_key IS 'Unique permission identifier (e.g., vehicles.read, maintenance.approve)';
COMMENT ON COLUMN permissions.implies_permissions IS 'Granting this permission auto-grants these child permissions';

-- ============================================================================
-- Table: user_permissions
-- Purpose: Direct user permission overrides (grant or deny)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Assignment
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_key VARCHAR(200) NOT NULL REFERENCES permissions(permission_key),

    -- Grant or deny
    permission_type VARCHAR(10) NOT NULL CHECK (permission_type IN ('grant', 'deny')),
    -- 'grant' = explicitly give permission (even if role doesn't have it)
    -- 'deny' = explicitly remove permission (even if role has it)

    -- Scope restriction
    scope_type VARCHAR(30) CHECK (scope_type IN (
        'all', 'specific_entities', 'department', 'location', 'conditions'
    )),
    scope_entities UUID[] DEFAULT '{}',  -- Specific entity IDs
    scope_conditions JSONB,  -- {field: 'status', operator: '=', value: 'active'}

    -- Time-based
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    is_active BOOLEAN GENERATED ALWAYS AS (
        CASE
            WHEN effective_from > CURRENT_DATE THEN FALSE
            WHEN effective_until IS NOT NULL AND effective_until < CURRENT_DATE THEN FALSE
            ELSE TRUE
        END
    ) STORED,

    -- Assignment details
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT NOT NULL,

    -- Approval (for sensitive permissions)
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,

    -- Revocation
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES users(id),
    revocation_reason TEXT,

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_permission UNIQUE (user_id, permission_key, scope_type)
);

-- Indexes
CREATE INDEX idx_user_permissions_tenant ON user_permissions(tenant_id);
CREATE INDEX idx_user_permissions_user ON user_permissions(user_id, is_active);
CREATE INDEX idx_user_permissions_permission ON user_permissions(permission_key);
CREATE INDEX idx_user_permissions_type ON user_permissions(permission_type, is_active);
CREATE INDEX idx_user_permissions_scope_entities ON user_permissions USING GIN(scope_entities);
CREATE INDEX idx_user_permissions_effective ON user_permissions(effective_from, effective_until);

-- Trigger: Update timestamp
CREATE TRIGGER update_user_permissions_timestamp
    BEFORE UPDATE ON user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE user_permissions IS 'Direct user permission overrides - can grant or deny specific permissions';
COMMENT ON COLUMN user_permissions.permission_type IS 'grant = explicitly add permission, deny = explicitly remove permission';
COMMENT ON COLUMN user_permissions.scope_entities IS 'Array of entity UUIDs this permission applies to';

-- ============================================================================
-- Table: user_activity_log
-- Purpose: Comprehensive user activity auditing
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- User and session
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    user_name VARCHAR(200),
    session_id UUID,

    -- Activity details
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'login', 'logout', 'login_failed', 'password_change', 'password_reset',
        'create', 'read', 'update', 'delete', 'export', 'import',
        'approve', 'reject', 'share', 'download', 'upload',
        'settings_change', 'role_change', 'permission_change'
    )),
    activity_category VARCHAR(50),  -- 'authentication', 'data', 'security', 'settings'

    -- Resource affected
    resource_type VARCHAR(100),  -- 'vehicle', 'work_order', 'document', etc.
    resource_id UUID,
    resource_name VARCHAR(200),

    -- Action details
    action_description TEXT,
    changes JSONB,  -- {before: {...}, after: {...}}
    affected_fields TEXT[] DEFAULT '{}',

    -- Request details
    http_method VARCHAR(10),
    endpoint VARCHAR(500),
    request_body JSONB,
    response_status INTEGER,
    response_time_ms INTEGER,

    -- Client information
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),  -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(100),
    os VARCHAR(100),

    -- Location
    geo_location JSONB,  -- {country, region, city, lat, lng}
    timezone VARCHAR(50),

    -- Security
    authentication_method VARCHAR(50),  -- 'password', 'azure_ad', 'mfa', 'api_token'
    mfa_verified BOOLEAN,
    is_suspicious BOOLEAN DEFAULT FALSE,
    security_flags TEXT[] DEFAULT '{}',  -- ['unusual_location', 'unusual_time', 'too_many_attempts']
    risk_score DECIMAL(3, 2) CHECK (risk_score >= 0 AND risk_score <= 1),

    -- Success/failure
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    error_code VARCHAR(50),

    -- Performance
    query_count INTEGER,
    database_time_ms INTEGER,
    cache_hit BOOLEAN,

    -- Timestamp
    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_activity_tenant ON user_activity_log(tenant_id);
CREATE INDEX idx_user_activity_user ON user_activity_log(user_id, occurred_at DESC);
CREATE INDEX idx_user_activity_type ON user_activity_log(activity_type, occurred_at DESC);
CREATE INDEX idx_user_activity_resource ON user_activity_log(resource_type, resource_id, occurred_at DESC);
CREATE INDEX idx_user_activity_session ON user_activity_log(session_id, occurred_at DESC);
CREATE INDEX idx_user_activity_ip ON user_activity_log(ip_address, occurred_at DESC);
CREATE INDEX idx_user_activity_suspicious ON user_activity_log(occurred_at DESC)
    WHERE is_suspicious = TRUE OR risk_score > 0.7;
CREATE INDEX idx_user_activity_failed_logins ON user_activity_log(user_email, occurred_at DESC)
    WHERE activity_type = 'login_failed';
CREATE INDEX idx_user_activity_timestamp ON user_activity_log(occurred_at DESC);

-- Partitioning recommendation: Partition by month for high-volume tenants
-- Example: CREATE TABLE user_activity_log_2026_01 PARTITION OF user_activity_log
--          FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Comments
COMMENT ON TABLE user_activity_log IS 'Comprehensive audit trail of all user activities for security and compliance';
COMMENT ON COLUMN user_activity_log.changes IS 'JSON diff showing before/after state for update actions';
COMMENT ON COLUMN user_activity_log.security_flags IS 'Array of security anomalies detected';

-- ============================================================================
-- Table: api_tokens
-- Purpose: API authentication tokens for programmatic access
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Token details
    token_name VARCHAR(200) NOT NULL,
    token_description TEXT,
    token_hash VARCHAR(128) NOT NULL UNIQUE,  -- SHA-256 hash of actual token
    token_prefix VARCHAR(20),  -- First few characters for identification (e.g., 'ft_abc')

    -- Owner
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Permissions
    scopes TEXT[] DEFAULT '{}',  -- ['vehicles:read', 'maintenance:write', 'reports:read']
    role_id UUID REFERENCES roles(id),  -- Token assumes this role's permissions

    -- Access restrictions
    ip_whitelist INET[] DEFAULT '{}',  -- Only allow from these IPs
    allowed_endpoints TEXT[] DEFAULT '{}',  -- Only allow these API paths
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_hour INTEGER DEFAULT 1000,

    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    last_used_ip INET,
    last_used_endpoint VARCHAR(500),
    total_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,

    -- Time-based
    expires_at TIMESTAMPTZ,
    is_expired BOOLEAN GENERATED ALWAYS AS (
        expires_at IS NOT NULL AND expires_at < NOW()
    ) STORED,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES users(id),
    revocation_reason TEXT,

    -- Security
    last_rotated_at TIMESTAMPTZ,
    rotation_policy_days INTEGER DEFAULT 90,  -- Auto-rotate every N days
    requires_mfa BOOLEAN DEFAULT FALSE,

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_api_tokens_tenant ON api_tokens(tenant_id);
CREATE INDEX idx_api_tokens_user ON api_tokens(user_id);
CREATE INDEX idx_api_tokens_hash ON api_tokens(token_hash);
CREATE INDEX idx_api_tokens_active ON api_tokens(is_active, is_expired)
    WHERE is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW());
CREATE INDEX idx_api_tokens_expiring ON api_tokens(expires_at)
    WHERE is_active = TRUE AND expires_at IS NOT NULL AND expires_at > NOW();
CREATE INDEX idx_api_tokens_scopes ON api_tokens USING GIN(scopes);

-- Trigger: Update timestamp
CREATE TRIGGER update_api_tokens_timestamp
    BEFORE UPDATE ON api_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE api_tokens IS 'API authentication tokens for programmatic access with scoped permissions';
COMMENT ON COLUMN api_tokens.token_hash IS 'SHA-256 hash of actual token - never store plaintext tokens';
COMMENT ON COLUMN api_tokens.scopes IS 'Array of permission scopes (e.g., vehicles:read, maintenance:write)';

-- ============================================================================
-- Helper function: Check user permission
-- ============================================================================

CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id UUID,
    p_permission_key VARCHAR(200),
    p_entity_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    has_permission BOOLEAN := FALSE;
BEGIN
    -- Check explicit deny first (overrides everything)
    SELECT TRUE INTO has_permission
    FROM user_permissions
    WHERE user_id = p_user_id
      AND permission_key = p_permission_key
      AND permission_type = 'deny'
      AND is_active = TRUE
      AND (scope_type = 'all' OR p_entity_id = ANY(scope_entities))
    LIMIT 1;

    IF has_permission THEN
        RETURN FALSE;  -- Explicitly denied
    END IF;

    -- Check explicit grant
    SELECT TRUE INTO has_permission
    FROM user_permissions
    WHERE user_id = p_user_id
      AND permission_key = p_permission_key
      AND permission_type = 'grant'
      AND is_active = TRUE
      AND (scope_type = 'all' OR p_entity_id = ANY(scope_entities))
    LIMIT 1;

    IF has_permission THEN
        RETURN TRUE;  -- Explicitly granted
    END IF;

    -- Check role permissions
    SELECT TRUE INTO has_permission
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND ur.is_active = TRUE
      AND r.is_active = TRUE
      AND p_permission_key = ANY(r.permissions)
    LIMIT 1;

    RETURN COALESCE(has_permission, FALSE);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION user_has_permission IS 'Check if user has specific permission - checks denies, grants, and role permissions';

-- ============================================================================
-- Helper function: Get user effective permissions
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_effective_permissions(
    p_user_id UUID
) RETURNS TABLE (
    permission_key VARCHAR(200),
    source VARCHAR(50),  -- 'role' or 'direct_grant'
    scope_type VARCHAR(30)
) AS $$
BEGIN
    RETURN QUERY
    -- Permissions from roles
    SELECT DISTINCT
        unnest(r.permissions)::VARCHAR(200),
        'role'::VARCHAR(50),
        r.access_scope::VARCHAR(30)
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND ur.is_active = TRUE
      AND r.is_active = TRUE

    UNION

    -- Direct grants
    SELECT
        up.permission_key,
        'direct_grant'::VARCHAR(50),
        up.scope_type::VARCHAR(30)
    FROM user_permissions up
    WHERE up.user_id = p_user_id
      AND up.permission_type = 'grant'
      AND up.is_active = TRUE

    EXCEPT

    -- Remove explicit denies
    SELECT
        up.permission_key,
        'direct_grant'::VARCHAR(50),
        up.scope_type::VARCHAR(30)
    FROM user_permissions up
    WHERE up.user_id = p_user_id
      AND up.permission_type = 'deny'
      AND up.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_effective_permissions IS 'Returns complete list of effective permissions for a user after applying grants and denies';

-- ============================================================================
-- END OF MIGRATION 013
-- ============================================================================
