-- Migration: 033 - Comprehensive Security Audit System
-- Description: Creates tables and indexes for security audit logging, rate limiting,
--              and compliance tracking with FedRAMP controls
-- Author: Backend Implementation Agent
-- Date: 2025-11-19

-- ==============================================================================
-- SECURITY AUDIT TABLES
-- ==============================================================================

-- Permission check logs (AC-3: Access Enforcement)
CREATE TABLE IF NOT EXISTS permission_check_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    permission_name VARCHAR(255) NOT NULL,
    granted BOOLEAN NOT NULL,
    reason TEXT,
    resource_type VARCHAR(100),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    request_method VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for permission logs
CREATE INDEX IF NOT EXISTS idx_permission_logs_user_id ON permission_check_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_logs_tenant_id ON permission_check_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permission_logs_granted ON permission_check_logs(granted);
CREATE INDEX IF NOT EXISTS idx_permission_logs_created_at ON permission_check_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_permission_logs_permission_name ON permission_check_logs(permission_name);

-- Authentication logs (IA-2: Identification and Authentication)
CREATE TABLE IF NOT EXISTS authentication_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email VARCHAR(255),
    tenant_id UUID,
    event_type VARCHAR(50) NOT NULL, -- login, logout, failed_login, token_refresh, password_reset
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    mfa_used BOOLEAN DEFAULT FALSE,
    location_country VARCHAR(2),
    location_city VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for authentication logs
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON authentication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_tenant_id ON authentication_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_email ON authentication_logs(email);
CREATE INDEX IF NOT EXISTS idx_auth_logs_event_type ON authentication_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_auth_logs_success ON authentication_logs(success);
CREATE INDEX IF NOT EXISTS idx_auth_logs_created_at ON authentication_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_auth_logs_ip_address ON authentication_logs(ip_address);

-- Data access logs (AU-2: Audit Events)
CREATE TABLE IF NOT EXISTS data_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL, -- read, write, delete, export
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    fields_accessed TEXT[], -- Array of field names accessed
    pii_accessed BOOLEAN DEFAULT FALSE,
    phi_accessed BOOLEAN DEFAULT FALSE, -- Protected Health Information
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    query_params JSONB,
    response_status INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for data access logs
CREATE INDEX IF NOT EXISTS idx_data_access_user_id ON data_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_data_access_tenant_id ON data_access_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_access_action ON data_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_data_access_resource_type ON data_access_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_data_access_pii ON data_access_logs(pii_accessed) WHERE pii_accessed = TRUE;
CREATE INDEX IF NOT EXISTS idx_data_access_phi ON data_access_logs(phi_accessed) WHERE phi_accessed = TRUE;
CREATE INDEX IF NOT EXISTS idx_data_access_created_at ON data_access_logs(created_at);

-- Security incidents (SI-4: Information System Monitoring)
CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_type VARCHAR(100) NOT NULL, -- rate_limit, brute_force, sql_injection, xss_attempt, csrf, idor, etc.
    severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
    user_id UUID,
    tenant_id UUID,
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    request_method VARCHAR(10),
    request_body JSONB,
    details JSONB,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for security incidents
CREATE INDEX IF NOT EXISTS idx_incidents_type ON security_incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON security_incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_tenant_id ON security_incidents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_incidents_ip_address ON security_incidents(ip_address);
CREATE INDEX IF NOT EXISTS idx_incidents_resolved ON security_incidents(resolved);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON security_incidents(created_at);

-- Configuration changes (CM-3: Configuration Change Control)
CREATE TABLE IF NOT EXISTS configuration_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    setting_name VARCHAR(255) NOT NULL,
    setting_category VARCHAR(100), -- security, system, integration, etc.
    old_value JSONB,
    new_value JSONB,
    change_reason TEXT,
    approved_by UUID,
    rollback_available BOOLEAN DEFAULT FALSE,
    rollback_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for configuration changes
CREATE INDEX IF NOT EXISTS idx_config_changes_user_id ON configuration_change_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_config_changes_tenant_id ON configuration_change_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_changes_setting_name ON configuration_change_logs(setting_name);
CREATE INDEX IF NOT EXISTS idx_config_changes_category ON configuration_change_logs(setting_category);
CREATE INDEX IF NOT EXISTS idx_config_changes_created_at ON configuration_change_logs(created_at);

-- Break-glass access logs (AC-6: Least Privilege + Emergency Access)
CREATE TABLE IF NOT EXISTS break_glass_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    reason TEXT NOT NULL,
    approver_id UUID,
    approval_method VARCHAR(50), -- manual, automated, emergency
    action_taken TEXT NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    duration_minutes INT,
    ip_address INET,
    user_agent TEXT,
    revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for break-glass logs
CREATE INDEX IF NOT EXISTS idx_break_glass_user_id ON break_glass_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_break_glass_tenant_id ON break_glass_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_break_glass_revoked ON break_glass_logs(revoked);
CREATE INDEX IF NOT EXISTS idx_break_glass_created_at ON break_glass_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_break_glass_expires_at ON break_glass_logs(expires_at);

-- API request logs (AU-3: Content of Audit Records)
CREATE TABLE IF NOT EXISTS api_request_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID,
    tenant_id UUID,
    method VARCHAR(10) NOT NULL,
    path TEXT NOT NULL,
    query_params JSONB,
    request_headers JSONB,
    request_body_size INT,
    response_status INT,
    response_size INT,
    response_time_ms INT,
    ip_address INET,
    user_agent TEXT,
    rate_limit_hit BOOLEAN DEFAULT FALSE,
    cached BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for API request logs
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_tenant_id ON api_request_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_path ON api_request_logs(path);
CREATE INDEX IF NOT EXISTS idx_api_logs_status ON api_request_logs(response_status);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_logs_response_time ON api_request_logs(response_time_ms);

-- Compliance audit trail (AU-1: Audit and Accountability Policy)
CREATE TABLE IF NOT EXISTS compliance_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    compliance_type VARCHAR(50) NOT NULL, -- OSHA, DOT, EPA, GDPR, SOC2, FedRAMP, etc.
    event_type VARCHAR(100) NOT NULL,
    event_description TEXT NOT NULL,
    related_resource_type VARCHAR(100),
    related_resource_id UUID,
    metadata JSONB,
    retention_years INT DEFAULT 7,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for compliance audit trail
CREATE INDEX IF NOT EXISTS idx_compliance_tenant_id ON compliance_audit_trail(tenant_id);
CREATE INDEX IF NOT EXISTS idx_compliance_user_id ON compliance_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_type ON compliance_audit_trail(compliance_type);
CREATE INDEX IF NOT EXISTS idx_compliance_event_type ON compliance_audit_trail(event_type);
CREATE INDEX IF NOT EXISTS idx_compliance_created_at ON compliance_audit_trail(created_at);

-- ==============================================================================
-- RATE LIMITING TABLES
-- ==============================================================================

-- Rate limit tracking (SI-10: Information Input Validation)
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL, -- user:123 or ip:1.2.3.4
    endpoint_pattern VARCHAR(255) NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    request_count INT DEFAULT 0,
    limit_exceeded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for rate limiting
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON rate_limit_tracking(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_endpoint ON rate_limit_tracking(endpoint_pattern);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window_end ON rate_limit_tracking(window_end);

-- ==============================================================================
-- PARTITIONING FOR PERFORMANCE (Optional but recommended)
-- ==============================================================================

-- Partition permission_check_logs by month
-- CREATE TABLE permission_check_logs_2025_11 PARTITION OF permission_check_logs
-- FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

-- ==============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ==============================================================================

COMMENT ON TABLE permission_check_logs IS 'FedRAMP AC-3: Logs all permission checks for access control enforcement';
COMMENT ON TABLE authentication_logs IS 'FedRAMP IA-2: Logs all authentication events including failed attempts';
COMMENT ON TABLE data_access_logs IS 'FedRAMP AU-2: Logs all data access operations for audit purposes';
COMMENT ON TABLE security_incidents IS 'FedRAMP SI-4: Tracks all security incidents for monitoring and response';
COMMENT ON TABLE configuration_change_logs IS 'FedRAMP CM-3: Logs all configuration changes for change control';
COMMENT ON TABLE break_glass_logs IS 'FedRAMP AC-6: Logs emergency access using break-glass procedures';
COMMENT ON TABLE api_request_logs IS 'FedRAMP AU-3: Comprehensive API request logging for audit trails';
COMMENT ON TABLE compliance_audit_trail IS 'FedRAMP AU-1: Master compliance audit trail for all regulations';
COMMENT ON TABLE rate_limit_tracking IS 'FedRAMP SI-10: Tracks rate limiting for input validation and DoS prevention';
