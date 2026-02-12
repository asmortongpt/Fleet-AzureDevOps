-- ============================================================================
-- ZERO-TRUST SECURITY SCHEMA MIGRATION
-- ============================================================================
-- Version: 1.0.0
-- Created: 2026-01-05
-- Description: Production-ready security tables for zero-trust architecture
-- Compliance: NIST 800-207, OWASP ASVS L3, SOC 2 Type II, FedRAMP
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ============================================================================
-- 1. AUTHENTICATION TABLES
-- ============================================================================

-- Users table (enhanced with security fields)
CREATE TABLE IF NOT EXISTS security_users (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,

    -- Identity
    email VARCHAR(255) NOT NULL UNIQUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified_at TIMESTAMP,

    -- Authentication
    password_hash TEXT, -- Argon2 hash (nullable for passwordless auth)
    password_changed_at TIMESTAMP,
    password_reset_token TEXT,
    password_reset_expires_at TIMESTAMP,

    -- Multi-Factor Authentication
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret TEXT, -- TOTP secret (encrypted)
    mfa_backup_codes TEXT[], -- Encrypted backup codes
    mfa_recovery_email VARCHAR(255),
    mfa_recovery_phone VARCHAR(20),

    -- WebAuthn / FIDO2
    webauthn_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    webauthn_credentials JSONB DEFAULT '[]',

    -- Profile
    display_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,

    -- Account Status
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, suspended, locked, deleted
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,

    -- Security
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    last_failed_login_at TIMESTAMP,
    locked_until TIMESTAMP,
    require_password_change BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit
    last_login_at TIMESTAMP,
    last_login_ip INET,
    last_login_user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_status CHECK (status IN ('active', 'suspended', 'locked', 'deleted', 'pending_verification'))
);

CREATE INDEX idx_security_users_email ON security_users(email);
CREATE INDEX idx_security_users_uuid ON security_users(uuid);
CREATE INDEX idx_security_users_status ON security_users(status);
CREATE INDEX idx_security_users_created_at ON security_users(created_at);

-- Sessions table
CREATE TABLE IF NOT EXISTS security_sessions (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
    user_id BIGINT NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,

    -- Tokens
    access_token_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash
    refresh_token_hash TEXT UNIQUE, -- SHA-256 hash

    -- Token Metadata
    access_token_expires_at TIMESTAMP NOT NULL,
    refresh_token_expires_at TIMESTAMP,
    token_family UUID NOT NULL DEFAULT uuid_generate_v4(), -- For token rotation

    -- Device Information
    device_id VARCHAR(255),
    device_name VARCHAR(255),
    device_type VARCHAR(50), -- desktop, mobile, tablet
    device_os VARCHAR(100),
    device_fingerprint TEXT, -- Browser fingerprint

    -- Location
    ip_address INET NOT NULL,
    user_agent TEXT,
    country_code VARCHAR(2),
    city VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Security
    is_suspicious BOOLEAN NOT NULL DEFAULT FALSE,
    risk_score INTEGER DEFAULT 0, -- 0-100
    trust_score INTEGER DEFAULT 50, -- 0-100

    -- Session Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    revoked_reason VARCHAR(255),

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_security_sessions_user_id ON security_sessions(user_id);
CREATE INDEX idx_security_sessions_access_token_hash ON security_sessions(access_token_hash);
CREATE INDEX idx_security_sessions_refresh_token_hash ON security_sessions(refresh_token_hash);
CREATE INDEX idx_security_sessions_expires_at ON security_sessions(expires_at);
CREATE INDEX idx_security_sessions_token_family ON security_sessions(token_family);

-- Login History
CREATE TABLE IF NOT EXISTS security_login_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES security_users(id) ON DELETE SET NULL,
    email VARCHAR(255) NOT NULL,

    -- Attempt Details
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(255),
    auth_method VARCHAR(50) NOT NULL, -- password, mfa, sso, magic_link, webauthn

    -- Location
    ip_address INET NOT NULL,
    user_agent TEXT,
    country_code VARCHAR(2),
    city VARCHAR(100),

    -- Risk Analysis
    is_suspicious BOOLEAN NOT NULL DEFAULT FALSE,
    anomaly_flags TEXT[], -- ['impossible_travel', 'new_device', 'brute_force']
    risk_score INTEGER DEFAULT 0,

    -- Timestamp
    attempted_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_login_history_user_id ON security_login_history(user_id);
CREATE INDEX idx_login_history_email ON security_login_history(email);
CREATE INDEX idx_login_history_ip_address ON security_login_history(ip_address);
CREATE INDEX idx_login_history_attempted_at ON security_login_history(attempted_at);
CREATE INDEX idx_login_history_success ON security_login_history(success);

-- Device Trust
CREATE TABLE IF NOT EXISTS security_trusted_devices (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,

    -- Device Identification
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    device_type VARCHAR(50),
    device_fingerprint TEXT NOT NULL,

    -- Trust Status
    is_trusted BOOLEAN NOT NULL DEFAULT FALSE,
    trust_score INTEGER DEFAULT 0,
    trusted_at TIMESTAMP,

    -- Last Seen
    last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_ip_address INET,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',

    UNIQUE(user_id, device_fingerprint)
);

CREATE INDEX idx_trusted_devices_user_id ON security_trusted_devices(user_id);
CREATE INDEX idx_trusted_devices_device_id ON security_trusted_devices(device_id);

-- ============================================================================
-- 2. AUTHORIZATION TABLES
-- ============================================================================

-- Roles
CREATE TABLE IF NOT EXISTS security_roles (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,

    -- Role Definition
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Role Type
    role_type VARCHAR(50) NOT NULL DEFAULT 'custom', -- system, custom, temporary

    -- Hierarchy
    parent_role_id BIGINT REFERENCES security_roles(id),
    level INTEGER NOT NULL DEFAULT 0,

    -- Permissions
    permissions JSONB NOT NULL DEFAULT '[]',

    -- Constraints
    max_users INTEGER, -- Maximum users allowed in this role
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    requires_mfa BOOLEAN NOT NULL DEFAULT FALSE,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit
    created_by BIGINT REFERENCES security_users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by BIGINT REFERENCES security_users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_security_roles_name ON security_roles(name);
CREATE INDEX idx_security_roles_role_type ON security_roles(role_type);

-- User Roles (Many-to-Many)
CREATE TABLE IF NOT EXISTS security_user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES security_roles(id) ON DELETE CASCADE,

    -- Assignment Details
    assigned_by BIGINT REFERENCES security_users(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Temporal Access
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,

    -- Constraints
    conditions JSONB DEFAULT '{}', -- IP whitelist, geofence, time-based

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    revoked_at TIMESTAMP,
    revoked_by BIGINT REFERENCES security_users(id),
    revoked_reason TEXT,

    UNIQUE(user_id, role_id, valid_from)
);

CREATE INDEX idx_user_roles_user_id ON security_user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON security_user_roles(role_id);
CREATE INDEX idx_user_roles_valid_until ON security_user_roles(valid_until);

-- Permissions
CREATE TABLE IF NOT EXISTS security_permissions (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,

    -- Permission Definition
    resource VARCHAR(100) NOT NULL, -- vehicles, drivers, fuel_transactions
    action VARCHAR(50) NOT NULL, -- read, write, delete, approve
    scope VARCHAR(100), -- own, department, all

    -- Display
    display_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- fleet, maintenance, procurement, admin

    -- Constraints
    conditions JSONB DEFAULT '[]',

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE(resource, action, scope)
);

CREATE INDEX idx_security_permissions_resource ON security_permissions(resource);
CREATE INDEX idx_security_permissions_action ON security_permissions(action);

-- Permission Cache (for performance)
CREATE TABLE IF NOT EXISTS security_permission_cache (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,

    -- Cached Permissions
    permissions JSONB NOT NULL DEFAULT '{}',

    -- Cache Metadata
    computed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    invalidated_at TIMESTAMP,

    UNIQUE(user_id)
);

CREATE INDEX idx_permission_cache_user_id ON security_permission_cache(user_id);
CREATE INDEX idx_permission_cache_expires_at ON security_permission_cache(expires_at);

-- Authorization Decisions (Audit Log)
CREATE TABLE IF NOT EXISTS security_authz_decisions (
    id BIGSERIAL PRIMARY KEY,

    -- Request Context
    user_id BIGINT REFERENCES security_users(id) ON DELETE SET NULL,
    session_id BIGINT REFERENCES security_sessions(id) ON DELETE SET NULL,

    -- Authorization Check
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255),

    -- Decision
    decision VARCHAR(20) NOT NULL, -- allowed, denied, error
    reason TEXT,

    -- Context
    ip_address INET,
    user_agent TEXT,
    request_id UUID,

    -- Timing
    evaluated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    duration_ms INTEGER,

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_authz_decisions_user_id ON security_authz_decisions(user_id);
CREATE INDEX idx_authz_decisions_resource ON security_authz_decisions(resource);
CREATE INDEX idx_authz_decisions_decision ON security_authz_decisions(decision);
CREATE INDEX idx_authz_decisions_evaluated_at ON security_authz_decisions(evaluated_at);

-- ============================================================================
-- 3. CONFIGURATION MANAGEMENT TABLES
-- ============================================================================

-- Configuration Items
CREATE TABLE IF NOT EXISTS config_items (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,

    -- Configuration Key
    key VARCHAR(255) NOT NULL,
    environment VARCHAR(50) NOT NULL DEFAULT 'production', -- development, staging, production

    -- Value (Encrypted)
    value_encrypted TEXT NOT NULL,
    value_type VARCHAR(50) NOT NULL DEFAULT 'string', -- string, number, boolean, json
    encryption_key_id VARCHAR(255) NOT NULL,

    -- Versioning
    version INTEGER NOT NULL DEFAULT 1,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- draft, pending_approval, approved, active, archived

    -- Validation
    validation_schema JSONB, -- JSON Schema
    is_valid BOOLEAN NOT NULL DEFAULT TRUE,

    -- Categorization
    category VARCHAR(100),
    tags TEXT[],

    -- Change Management
    change_request_id BIGINT,
    change_reason TEXT,
    impact_level VARCHAR(20), -- low, medium, high, critical
    rollback_plan TEXT,

    -- Approval
    requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by BIGINT REFERENCES security_users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,

    -- Audit
    created_by BIGINT REFERENCES security_users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by BIGINT REFERENCES security_users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    UNIQUE(key, environment, version)
);

CREATE INDEX idx_config_items_key ON config_items(key);
CREATE INDEX idx_config_items_environment ON config_items(environment);
CREATE INDEX idx_config_items_is_current ON config_items(is_current);
CREATE INDEX idx_config_items_status ON config_items(status);

-- Configuration Change History
CREATE TABLE IF NOT EXISTS config_change_history (
    id BIGSERIAL PRIMARY KEY,
    config_item_id BIGINT NOT NULL REFERENCES config_items(id) ON DELETE CASCADE,

    -- Change Details
    change_type VARCHAR(50) NOT NULL, -- created, updated, deleted, rolled_back
    old_value_encrypted TEXT,
    new_value_encrypted TEXT,

    -- Change Context
    changed_by BIGINT REFERENCES security_users(id),
    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    change_reason TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_config_change_history_config_item_id ON config_change_history(config_item_id);
CREATE INDEX idx_config_change_history_changed_at ON config_change_history(changed_at);

-- Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,

    -- Flag Definition
    flag_key VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Flag State
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    environment VARCHAR(50) NOT NULL DEFAULT 'production',

    -- Rollout Strategy
    rollout_percentage INTEGER DEFAULT 0, -- 0-100
    rollout_strategy VARCHAR(50) DEFAULT 'all_at_once', -- all_at_once, gradual, targeted
    rollout_targets JSONB DEFAULT '{}', -- User IDs, emails, segments

    -- A/B Testing
    is_ab_test BOOLEAN NOT NULL DEFAULT FALSE,
    ab_variants JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'active',

    -- Audit
    created_by BIGINT REFERENCES security_users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by BIGINT REFERENCES security_users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_feature_flags_flag_key ON feature_flags(flag_key);
CREATE INDEX idx_feature_flags_environment ON feature_flags(environment);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);

-- ============================================================================
-- 4. SECRETS MANAGEMENT TABLES
-- ============================================================================

-- Secrets (References to Azure Key Vault)
CREATE TABLE IF NOT EXISTS secrets (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,

    -- Secret Identification
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    description TEXT,

    -- Azure Key Vault Reference
    key_vault_name VARCHAR(255) NOT NULL,
    key_vault_secret_name VARCHAR(255) NOT NULL,
    key_vault_version VARCHAR(50),

    -- Secret Type
    secret_type VARCHAR(50) NOT NULL, -- api_key, database_password, certificate, encryption_key

    -- Rotation
    rotation_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    rotation_interval_days INTEGER DEFAULT 90,
    last_rotated_at TIMESTAMP,
    next_rotation_at TIMESTAMP,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, rotating, revoked, expired
    expires_at TIMESTAMP,

    -- Audit
    created_by BIGINT REFERENCES security_users(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by BIGINT REFERENCES security_users(id),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMP,
    revoked_by BIGINT REFERENCES security_users(id),
    revoked_reason TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_secrets_name ON secrets(name);
CREATE INDEX idx_secrets_secret_type ON secrets(secret_type);
CREATE INDEX idx_secrets_next_rotation_at ON secrets(next_rotation_at);

-- Secret Access Log
CREATE TABLE IF NOT EXISTS secret_access_log (
    id BIGSERIAL PRIMARY KEY,
    secret_id BIGINT NOT NULL REFERENCES secrets(id) ON DELETE CASCADE,

    -- Access Details
    accessed_by BIGINT REFERENCES security_users(id),
    service_name VARCHAR(255),
    access_type VARCHAR(50) NOT NULL, -- read, rotate, revoke

    -- Context
    ip_address INET,
    user_agent TEXT,
    request_id UUID,

    -- Result
    success BOOLEAN NOT NULL,
    error_message TEXT,

    -- Timing
    accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_secret_access_log_secret_id ON secret_access_log(secret_id);
CREATE INDEX idx_secret_access_log_accessed_by ON secret_access_log(accessed_by);
CREATE INDEX idx_secret_access_log_accessed_at ON secret_access_log(accessed_at);

-- ============================================================================
-- 5. AUDIT & COMPLIANCE TABLES
-- ============================================================================

-- Comprehensive Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,

    -- Event Details
    event_type VARCHAR(100) NOT NULL, -- auth.login, authz.permission_check, data.read, data.write, config.change
    event_category VARCHAR(50) NOT NULL, -- authentication, authorization, data_access, configuration, security

    -- Actor
    actor_type VARCHAR(50) NOT NULL, -- user, service, system
    actor_id BIGINT,
    actor_email VARCHAR(255),
    actor_service VARCHAR(255),

    -- Resource
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    resource_name VARCHAR(255),

    -- Action
    action VARCHAR(100) NOT NULL,
    outcome VARCHAR(20) NOT NULL, -- success, failure, denied, error

    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id BIGINT,
    request_id UUID,
    trace_id UUID,

    -- Location
    country_code VARCHAR(2),
    city VARCHAR(100),

    -- Details
    details JSONB DEFAULT '{}',
    error_message TEXT,

    -- Timing
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    duration_ms INTEGER,

    -- Tamper-Proofing (Hash Chain)
    previous_hash VARCHAR(64), -- SHA-256 of previous log entry
    hash VARCHAR(64) NOT NULL, -- SHA-256 of current log entry

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_event_category ON audit_logs(event_category);
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_outcome ON audit_logs(outcome);
CREATE INDEX idx_audit_logs_request_id ON audit_logs(request_id);

-- Security Events (High-Priority Audit Events)
CREATE TABLE IF NOT EXISTS security_events (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,

    -- Event Classification
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL, -- low, medium, high, critical

    -- Event Details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    -- Related Entities
    user_id BIGINT REFERENCES security_users(id),
    ip_address INET,

    -- Detection
    detection_method VARCHAR(50) NOT NULL, -- automated, manual, alert
    detection_source VARCHAR(100),

    -- Response
    status VARCHAR(50) NOT NULL DEFAULT 'detected', -- detected, investigating, mitigated, resolved, false_positive
    assigned_to BIGINT REFERENCES security_users(id),

    -- Mitigation
    mitigation_actions JSONB DEFAULT '[]',
    mitigated_at TIMESTAMP,
    resolution_notes TEXT,

    -- Timing
    detected_at TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP,

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_security_events_event_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_status ON security_events(status);
CREATE INDEX idx_security_events_detected_at ON security_events(detected_at);

-- ============================================================================
-- 6. DATA GOVERNANCE TABLES
-- ============================================================================

-- Data Classification
CREATE TABLE IF NOT EXISTS data_classification (
    id BIGSERIAL PRIMARY KEY,

    -- Data Element
    schema_name VARCHAR(255) NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    column_name VARCHAR(255) NOT NULL,

    -- Classification
    classification_level VARCHAR(50) NOT NULL, -- public, internal, confidential, restricted
    data_category VARCHAR(100), -- pii, phi, pci, financial, operational

    -- Sensitivity
    contains_pii BOOLEAN NOT NULL DEFAULT FALSE,
    pii_types TEXT[], -- email, ssn, phone, address, name

    -- Protection Requirements
    requires_encryption BOOLEAN NOT NULL DEFAULT FALSE,
    requires_masking BOOLEAN NOT NULL DEFAULT FALSE,
    requires_audit_logging BOOLEAN NOT NULL DEFAULT FALSE,

    -- Retention
    retention_period_days INTEGER,
    deletion_method VARCHAR(50), -- soft_delete, hard_delete, anonymize

    -- Compliance
    compliance_tags TEXT[], -- gdpr, ccpa, hipaa, pci_dss

    -- Audit
    classified_by BIGINT REFERENCES security_users(id),
    classified_at TIMESTAMP NOT NULL DEFAULT NOW(),
    reviewed_at TIMESTAMP,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    UNIQUE(schema_name, table_name, column_name)
);

CREATE INDEX idx_data_classification_table ON data_classification(schema_name, table_name);
CREATE INDEX idx_data_classification_level ON data_classification(classification_level);

-- Data Quality Metrics
CREATE TABLE IF NOT EXISTS data_quality_metrics (
    id BIGSERIAL PRIMARY KEY,

    -- Data Element
    schema_name VARCHAR(255) NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    column_name VARCHAR(255),

    -- Quality Dimensions
    completeness_score DECIMAL(5, 2), -- 0-100
    accuracy_score DECIMAL(5, 2),
    consistency_score DECIMAL(5, 2),
    timeliness_score DECIMAL(5, 2),
    uniqueness_score DECIMAL(5, 2),
    validity_score DECIMAL(5, 2),

    -- Overall Score
    overall_quality_score DECIMAL(5, 2),

    -- Issue Counts
    null_count INTEGER,
    duplicate_count INTEGER,
    invalid_count INTEGER,
    outlier_count INTEGER,

    -- Total Records
    total_records INTEGER,

    -- Assessment
    assessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    next_assessment_at TIMESTAMP,

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_data_quality_table ON data_quality_metrics(schema_name, table_name);
CREATE INDEX idx_data_quality_score ON data_quality_metrics(overall_quality_score);

-- Data Lineage
CREATE TABLE IF NOT EXISTS data_lineage (
    id BIGSERIAL PRIMARY KEY,

    -- Source
    source_system VARCHAR(255) NOT NULL,
    source_schema VARCHAR(255),
    source_table VARCHAR(255) NOT NULL,
    source_column VARCHAR(255),

    -- Target
    target_system VARCHAR(255) NOT NULL,
    target_schema VARCHAR(255),
    target_table VARCHAR(255) NOT NULL,
    target_column VARCHAR(255),

    -- Transformation
    transformation_type VARCHAR(100), -- copy, aggregate, join, calculate, anonymize
    transformation_logic TEXT,

    -- Metadata
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_data_lineage_source ON data_lineage(source_system, source_table);
CREATE INDEX idx_data_lineage_target ON data_lineage(target_system, target_table);

-- ============================================================================
-- 7. RATE LIMITING & THROTTLING
-- ============================================================================

-- Rate Limit Rules
CREATE TABLE IF NOT EXISTS rate_limit_rules (
    id BIGSERIAL PRIMARY KEY,

    -- Rule Identification
    rule_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,

    -- Scope
    scope VARCHAR(50) NOT NULL, -- global, per_user, per_ip, per_api_key
    endpoint_pattern VARCHAR(500), -- /api/v1/vehicles/*

    -- Limits
    max_requests INTEGER NOT NULL,
    window_seconds INTEGER NOT NULL,

    -- Actions on Limit Exceeded
    block_duration_seconds INTEGER DEFAULT 3600,
    response_status_code INTEGER DEFAULT 429,
    response_message TEXT,

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Rate Limit Violations
CREATE TABLE IF NOT EXISTS rate_limit_violations (
    id BIGSERIAL PRIMARY KEY,

    -- Violator
    user_id BIGINT REFERENCES security_users(id),
    ip_address INET NOT NULL,
    api_key_hash VARCHAR(64),

    -- Violation Details
    rule_id BIGINT NOT NULL REFERENCES rate_limit_rules(id),
    endpoint VARCHAR(500) NOT NULL,
    request_count INTEGER NOT NULL,

    -- Response
    blocked_until TIMESTAMP,

    -- Timing
    violated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_rate_limit_violations_ip ON rate_limit_violations(ip_address);
CREATE INDEX idx_rate_limit_violations_user_id ON rate_limit_violations(user_id);
CREATE INDEX idx_rate_limit_violations_violated_at ON rate_limit_violations(violated_at);

-- ============================================================================
-- 8. API KEY MANAGEMENT
-- ============================================================================

-- API Keys
CREATE TABLE IF NOT EXISTS api_keys (
    id BIGSERIAL PRIMARY KEY,
    uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,

    -- Key Identification
    key_name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA-256
    key_prefix VARCHAR(20) NOT NULL, -- First 8 chars for identification

    -- Ownership
    user_id BIGINT NOT NULL REFERENCES security_users(id) ON DELETE CASCADE,

    -- Permissions
    scopes TEXT[] NOT NULL,

    -- Rate Limits
    rate_limit_tier VARCHAR(50) DEFAULT 'standard', -- standard, premium, enterprise

    -- IP Whitelisting
    allowed_ips INET[],

    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Lifecycle
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP,
    last_used_at TIMESTAMP,
    revoked_at TIMESTAMP,
    revoked_reason TEXT,

    -- Usage Stats
    total_requests BIGINT DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- ============================================================================
-- 9. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all relevant tables
CREATE TRIGGER update_security_users_updated_at BEFORE UPDATE ON security_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_config_items_updated_at BEFORE UPDATE ON config_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_security_roles_updated_at BEFORE UPDATE ON security_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_secrets_updated_at BEFORE UPDATE ON secrets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-lock user accounts after failed login attempts
CREATE OR REPLACE FUNCTION auto_lock_user_account()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.failed_login_attempts >= 5 THEN
        NEW.status = 'locked';
        NEW.locked_until = NOW() + INTERVAL '1 hour';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_lock_account BEFORE UPDATE ON security_users FOR EACH ROW EXECUTE FUNCTION auto_lock_user_account();

-- Function to compute hash for audit log tamper-proofing
CREATE OR REPLACE FUNCTION compute_audit_log_hash()
RETURNS TRIGGER AS $$
DECLARE
    log_data TEXT;
    prev_hash TEXT;
BEGIN
    -- Get previous hash
    SELECT hash INTO prev_hash FROM audit_logs ORDER BY id DESC LIMIT 1;
    NEW.previous_hash = prev_hash;

    -- Compute current hash
    log_data = NEW.id::TEXT || NEW.event_type || NEW.actor_id::TEXT || NEW.action || NEW.timestamp::TEXT || COALESCE(prev_hash, '');
    NEW.hash = encode(digest(log_data, 'sha256'), 'hex');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_compute_audit_hash BEFORE INSERT ON audit_logs FOR EACH ROW EXECUTE FUNCTION compute_audit_log_hash();

-- ============================================================================
-- 10. SEED DATA (System Roles and Permissions)
-- ============================================================================

-- Insert system roles
INSERT INTO security_roles (name, display_name, description, role_type, permissions, requires_mfa) VALUES
('system_admin', 'System Administrator', 'Full system access with all permissions', 'system', '["*:*:*"]', TRUE),
('fleet_manager', 'Fleet Manager', 'Manage vehicles, drivers, and fleet operations', 'system', '["vehicles:*:*", "drivers:*:*", "fuel:*:*", "maintenance:*:*"]', FALSE),
('driver', 'Driver', 'View assigned vehicles and submit fuel/maintenance records', 'system', '["vehicles:read:assigned", "fuel:write:own", "maintenance:write:own"]', FALSE),
('auditor', 'Auditor', 'Read-only access to all data for compliance purposes', 'system', '["*:read:*"]', TRUE),
('guest', 'Guest', 'Limited read-only access', 'system', '["vehicles:read:public", "drivers:read:public"]', FALSE)
ON CONFLICT (name) DO NOTHING;

-- Insert base permissions
INSERT INTO security_permissions (resource, action, scope, display_name, description, category) VALUES
('vehicles', 'read', 'all', 'View All Vehicles', 'View all vehicles in the system', 'fleet'),
('vehicles', 'write', 'all', 'Edit All Vehicles', 'Create and edit all vehicles', 'fleet'),
('vehicles', 'delete', 'all', 'Delete Vehicles', 'Delete vehicles from the system', 'fleet'),
('drivers', 'read', 'all', 'View All Drivers', 'View all drivers in the system', 'fleet'),
('drivers', 'write', 'all', 'Edit All Drivers', 'Create and edit all drivers', 'fleet'),
('drivers', 'delete', 'all', 'Delete Drivers', 'Delete drivers from the system', 'fleet'),
('fuel', 'read', 'all', 'View All Fuel Records', 'View all fuel transactions', 'operations'),
('fuel', 'write', 'all', 'Edit All Fuel Records', 'Create and edit all fuel transactions', 'operations'),
('maintenance', 'read', 'all', 'View All Maintenance', 'View all maintenance records', 'operations'),
('maintenance', 'write', 'all', 'Edit All Maintenance', 'Create and edit all maintenance records', 'operations'),
('config', 'read', 'all', 'View Configuration', 'View system configuration', 'admin'),
('config', 'write', 'all', 'Edit Configuration', 'Modify system configuration', 'admin'),
('audit', 'read', 'all', 'View Audit Logs', 'View system audit logs', 'compliance')
ON CONFLICT (resource, action, scope) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Grant permissions (adjust as needed for your environment)
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO fleet_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fleet_api;
