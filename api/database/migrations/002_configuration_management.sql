-- ============================================================================
-- Configuration Management System Migration
-- Implements versioning, rollback, approval workflows, and feature flags
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Configuration Scopes and Impact Levels
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE config_scope AS ENUM ('global', 'org', 'team', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE impact_level AS ENUM ('none', 'low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE change_status AS ENUM ('pending', 'approved', 'rejected', 'applied');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- Configuration Settings (Current State)
-- ============================================================================

CREATE TABLE IF NOT EXISTS configuration_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL,
    scope config_scope NOT NULL DEFAULT 'global',
    scope_id UUID, -- org_id, team_id, or user_id depending on scope
    current_version VARCHAR(64) NOT NULL,
    schema_version VARCHAR(20),
    is_encrypted BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID, -- References users table
    UNIQUE(key, scope, scope_id)
);

CREATE INDEX idx_config_settings_key ON configuration_settings(key);
CREATE INDEX idx_config_settings_scope ON configuration_settings(scope, scope_id);
CREATE INDEX idx_config_settings_version ON configuration_settings(current_version);
CREATE INDEX idx_config_settings_active ON configuration_settings(is_active) WHERE is_active = true;
CREATE INDEX idx_config_settings_value ON configuration_settings USING GIN(value);

-- ============================================================================
-- Configuration Versions (Complete History)
-- ============================================================================

CREATE TABLE IF NOT EXISTS configuration_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL,
    version VARCHAR(64) NOT NULL, -- Git-like SHA or timestamp-based
    previous_version VARCHAR(64),
    scope config_scope NOT NULL,
    scope_id UUID,
    impact_level impact_level DEFAULT 'low',
    changed_by UUID NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    comment TEXT,
    tags TEXT[] DEFAULT '{}',
    is_rollback BOOLEAN DEFAULT false,
    rollback_from_version VARCHAR(64),
    diff JSONB, -- Stores the diff from previous version
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(key, version, scope, scope_id)
);

CREATE INDEX idx_config_versions_key ON configuration_versions(key);
CREATE INDEX idx_config_versions_version ON configuration_versions(version);
CREATE INDEX idx_config_versions_changed_at ON configuration_versions(changed_at DESC);
CREATE INDEX idx_config_versions_changed_by ON configuration_versions(changed_by);
CREATE INDEX idx_config_versions_tags ON configuration_versions USING GIN(tags);
CREATE INDEX idx_config_versions_scope ON configuration_versions(scope, scope_id);

-- ============================================================================
-- Configuration Schemas (Validation Rules)
-- ============================================================================

CREATE TABLE IF NOT EXISTS configuration_schemas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    schema JSONB NOT NULL, -- Zod-compatible JSON schema
    description TEXT,
    example_value JSONB,
    default_impact_level impact_level DEFAULT 'medium',
    requires_approval BOOLEAN DEFAULT false,
    minimum_approvals INTEGER DEFAULT 1,
    allowed_scopes config_scope[] DEFAULT '{global}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_config_schemas_key ON configuration_schemas(key);
CREATE INDEX idx_config_schemas_requires_approval ON configuration_schemas(requires_approval) WHERE requires_approval = true;

-- ============================================================================
-- Change Requests (Approval Workflow)
-- ============================================================================

CREATE TABLE IF NOT EXISTS configuration_change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) NOT NULL,
    current_value JSONB,
    proposed_value JSONB NOT NULL,
    scope config_scope NOT NULL,
    scope_id UUID,
    status change_status DEFAULT 'pending',
    impact_level impact_level NOT NULL,
    requested_by UUID NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    justification TEXT NOT NULL,
    minimum_approvals INTEGER DEFAULT 1,
    applied_at TIMESTAMP WITH TIME ZONE,
    applied_version VARCHAR(64),
    expires_at TIMESTAMP WITH TIME ZONE, -- Auto-reject after expiry
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_change_requests_status ON configuration_change_requests(status);
CREATE INDEX idx_change_requests_key ON configuration_change_requests(key);
CREATE INDEX idx_change_requests_requested_by ON configuration_change_requests(requested_by);
CREATE INDEX idx_change_requests_requested_at ON configuration_change_requests(requested_at DESC);

-- ============================================================================
-- Change Request Approvals
-- ============================================================================

CREATE TABLE IF NOT EXISTS configuration_change_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    change_request_id UUID NOT NULL REFERENCES configuration_change_requests(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL,
    approved BOOLEAN NOT NULL, -- true = approved, false = rejected
    comment TEXT,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(change_request_id, approver_id)
);

CREATE INDEX idx_change_approvals_request ON configuration_change_approvals(change_request_id);
CREATE INDEX idx_change_approvals_approver ON configuration_change_approvals(approver_id);

-- ============================================================================
-- Feature Flags
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    enabled BOOLEAN DEFAULT false,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
    conditions JSONB DEFAULT '[]'::jsonb, -- Array of condition objects
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_feature_flags_name ON feature_flags(name);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled) WHERE enabled = true;

-- ============================================================================
-- Feature Flag Evaluations (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flag_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_name VARCHAR(255) NOT NULL,
    user_id UUID,
    organization_id UUID,
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    result BOOLEAN NOT NULL,
    context JSONB,
    -- Partition by month for performance
    PARTITION BY RANGE (evaluated_at)
);

CREATE INDEX idx_flag_evaluations_flag ON feature_flag_evaluations(flag_name, evaluated_at DESC);
CREATE INDEX idx_flag_evaluations_user ON feature_flag_evaluations(user_id, evaluated_at DESC);

-- Create partitions for current and next 3 months
CREATE TABLE feature_flag_evaluations_2026_01 PARTITION OF feature_flag_evaluations
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE feature_flag_evaluations_2026_02 PARTITION OF feature_flag_evaluations
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE feature_flag_evaluations_2026_03 PARTITION OF feature_flag_evaluations
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- ============================================================================
-- Configuration Dependencies (Impact Analysis)
-- ============================================================================

CREATE TABLE IF NOT EXISTS configuration_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(255) NOT NULL,
    depends_on_key VARCHAR(255) NOT NULL,
    dependency_type VARCHAR(50) DEFAULT 'required', -- required, optional, conflicts
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(config_key, depends_on_key)
);

CREATE INDEX idx_config_deps_key ON configuration_dependencies(config_key);
CREATE INDEX idx_config_deps_depends_on ON configuration_dependencies(depends_on_key);

-- ============================================================================
-- Configuration Tags (Stable Versions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS configuration_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag_name VARCHAR(100) UNIQUE NOT NULL,
    config_key VARCHAR(255) NOT NULL,
    version VARCHAR(64) NOT NULL,
    description TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_config_tags_name ON configuration_tags(tag_name);
CREATE INDEX idx_config_tags_key ON configuration_tags(config_key);

-- ============================================================================
-- Audit Trail for All Configuration Operations
-- ============================================================================

CREATE TABLE IF NOT EXISTS configuration_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation VARCHAR(50) NOT NULL, -- get, set, delete, rollback, approve, reject
    config_key VARCHAR(255),
    user_id UUID,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    success BOOLEAN NOT NULL,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Partition by month for performance
    PARTITION BY RANGE (created_at)
);

CREATE INDEX idx_audit_log_key ON configuration_audit_log(config_key, created_at DESC);
CREATE INDEX idx_audit_log_user ON configuration_audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_operation ON configuration_audit_log(operation, created_at DESC);

-- Create partitions for current and next 3 months
CREATE TABLE configuration_audit_log_2026_01 PARTITION OF configuration_audit_log
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE configuration_audit_log_2026_02 PARTITION OF configuration_audit_log
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE configuration_audit_log_2026_03 PARTITION OF configuration_audit_log
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Generate version hash (SHA-256 of timestamp + key + value)
CREATE OR REPLACE FUNCTION generate_config_version(
    p_key VARCHAR,
    p_value JSONB
) RETURNS VARCHAR AS $$
BEGIN
    RETURN encode(
        digest(
            EXTRACT(EPOCH FROM NOW())::TEXT || p_key || p_value::TEXT,
            'sha256'
        ),
        'hex'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate diff between two JSON values
CREATE OR REPLACE FUNCTION calculate_config_diff(
    p_old_value JSONB,
    p_new_value JSONB
) RETURNS JSONB AS $$
DECLARE
    v_diff JSONB := '[]'::jsonb;
    v_key TEXT;
    v_old_val JSONB;
    v_new_val JSONB;
BEGIN
    -- Find modified and deleted keys
    FOR v_key IN SELECT jsonb_object_keys(p_old_value)
    LOOP
        v_old_val := p_old_value -> v_key;
        v_new_val := p_new_value -> v_key;

        IF v_new_val IS NULL THEN
            -- Deleted key
            v_diff := v_diff || jsonb_build_object(
                'path', v_key,
                'operation', 'delete',
                'oldValue', v_old_val
            );
        ELSIF v_old_val != v_new_val THEN
            -- Modified key
            v_diff := v_diff || jsonb_build_object(
                'path', v_key,
                'operation', 'modify',
                'oldValue', v_old_val,
                'newValue', v_new_val
            );
        END IF;
    END LOOP;

    -- Find added keys
    FOR v_key IN SELECT jsonb_object_keys(p_new_value)
    LOOP
        v_old_val := p_old_value -> v_key;
        v_new_val := p_new_value -> v_key;

        IF v_old_val IS NULL THEN
            -- Added key
            v_diff := v_diff || jsonb_build_object(
                'path', v_key,
                'operation', 'add',
                'newValue', v_new_val
            );
        END IF;
    END LOOP;

    RETURN v_diff;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_configuration_settings_updated_at
    BEFORE UPDATE ON configuration_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuration_schemas_updated_at
    BEFORE UPDATE ON configuration_schemas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Initial Data: Common Configuration Schemas
-- ============================================================================

INSERT INTO configuration_schemas (key, schema, description, default_impact_level, requires_approval, allowed_scopes) VALUES
-- Branding configuration
('branding', '{
    "type": "object",
    "properties": {
        "logo": {"type": "string", "format": "uri"},
        "primaryColor": {"type": "string", "pattern": "^#[0-9A-F]{6}$"},
        "secondaryColor": {"type": "string", "pattern": "^#[0-9A-F]{6}$"},
        "companyName": {"type": "string", "minLength": 1, "maxLength": 100},
        "tagline": {"type": "string", "maxLength": 200}
    },
    "required": ["companyName", "primaryColor"]
}'::jsonb, 'Organization branding configuration', 'low', false, '{org}'::config_scope[]),

-- PM intervals (maintenance policy)
('pm_intervals', '{
    "type": "object",
    "properties": {
        "lightDuty": {"type": "number", "minimum": 1000, "maximum": 10000},
        "mediumDuty": {"type": "number", "minimum": 5000, "maximum": 20000},
        "heavyDuty": {"type": "number", "minimum": 10000, "maximum": 50000}
    },
    "required": ["lightDuty", "mediumDuty", "heavyDuty"]
}'::jsonb, 'Preventive maintenance intervals by vehicle class (miles)', 'high', true, '{global,org}'::config_scope[]),

-- Approval thresholds
('approval_thresholds', '{
    "type": "object",
    "properties": {
        "maintenanceApproval": {"type": "number", "minimum": 0},
        "procurementApproval": {"type": "number", "minimum": 0},
        "budgetVariance": {"type": "number", "minimum": 0, "maximum": 100}
    },
    "required": ["maintenanceApproval", "procurementApproval"]
}'::jsonb, 'Financial approval thresholds (dollars/percentage)', 'critical', true, '{global,org}'::config_scope[]),

-- Email notifications
('email_notifications', '{
    "type": "object",
    "properties": {
        "maintenanceDue": {"type": "boolean"},
        "inspectionDue": {"type": "boolean"},
        "documentExpiring": {"type": "boolean"},
        "workOrderAssigned": {"type": "boolean"},
        "dailyDigest": {"type": "boolean"}
    }
}'::jsonb, 'Email notification preferences', 'none', false, '{user}'::config_scope[]),

-- System settings
('system_settings', '{
    "type": "object",
    "properties": {
        "maintenanceMode": {"type": "boolean"},
        "allowSelfRegistration": {"type": "boolean"},
        "sessionTimeout": {"type": "number", "minimum": 5, "maximum": 1440},
        "maxLoginAttempts": {"type": "number", "minimum": 3, "maximum": 10}
    }
}'::jsonb, 'Global system settings', 'critical', true, '{global}'::config_scope[])

ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- Default Feature Flags
-- ============================================================================

INSERT INTO feature_flags (name, enabled, rollout_percentage, description) VALUES
('new-ui-redesign', false, 0, 'New UI redesign with improved UX'),
('advanced-analytics', true, 100, 'Advanced analytics dashboard for enterprise users'),
('ai-maintenance-predictions', false, 10, 'AI-powered predictive maintenance (gradual rollout)'),
('mobile-app-sync', true, 100, 'Mobile app offline sync capability'),
('real-time-tracking', false, 0, 'Real-time GPS vehicle tracking')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Grants (adjust based on your user roles)
-- ============================================================================

-- Grant read access to all configuration tables for app users
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO fleet_app_user;

-- Grant write access only to specific tables for app users
-- GRANT INSERT, UPDATE ON configuration_settings TO fleet_app_user;
-- GRANT INSERT ON configuration_versions TO fleet_app_user;
-- GRANT INSERT ON configuration_audit_log TO fleet_app_user;

COMMENT ON TABLE configuration_settings IS 'Current configuration values with scope inheritance';
COMMENT ON TABLE configuration_versions IS 'Complete version history for all configuration changes (git-like)';
COMMENT ON TABLE configuration_schemas IS 'Zod-compatible validation schemas for configuration keys';
COMMENT ON TABLE configuration_change_requests IS 'Approval workflow for high-impact configuration changes';
COMMENT ON TABLE feature_flags IS 'Feature flag definitions with rollout control';
COMMENT ON TABLE configuration_dependencies IS 'Configuration dependency graph for impact analysis';
