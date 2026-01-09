-- ============================================================================
-- Migration: 015_system_miscellaneous.sql
-- Description: System Configuration and Miscellaneous Supporting Tables
-- Author: Claude Code
-- Date: 2026-01-08
-- ============================================================================
-- Tables: 8
--   1. audit_trails - System-wide audit logging
--   2. system_settings - Application-level configuration
--   3. feature_flags - Feature toggles and A/B testing
--   4. import_jobs - Bulk data import job tracking
--   5. export_jobs - Data export job tracking
--   6. scheduled_jobs - Background job scheduler
--   7. job_execution_history - Job execution audit trail
--   8. data_retention_policies - Automated data lifecycle management
-- ============================================================================

-- ============================================================================
-- Table: audit_trails
-- Purpose: System-wide comprehensive audit logging
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_trails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- User and session
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    user_name VARCHAR(200),
    impersonated_by UUID REFERENCES users(id),  -- If user was impersonated
    session_id UUID,

    -- Action details
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'create', 'read', 'update', 'delete', 'approve', 'reject',
        'export', 'import', 'share', 'restore', 'archive', 'login',
        'logout', 'permission_change', 'setting_change'
    )),
    action_category VARCHAR(50),  -- 'data', 'security', 'configuration', 'authentication'
    action_description TEXT NOT NULL,

    -- Resource details
    table_name VARCHAR(100),
    record_id UUID,
    record_name VARCHAR(200),

    -- Change tracking (for updates)
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[] DEFAULT '{}',

    -- Context
    source VARCHAR(50) CHECK (source IN (
        'web_ui', 'mobile_app', 'api', 'system', 'scheduled_job', 'import', 'integration'
    )),
    source_ip INET,
    user_agent TEXT,

    -- Request details
    http_method VARCHAR(10),
    endpoint VARCHAR(500),
    request_id UUID,

    -- Compliance flags
    is_sensitive BOOLEAN DEFAULT FALSE,
    compliance_tags TEXT[] DEFAULT '{}',  -- ['pii', 'hipaa', 'fedramp']
    retention_period_days INTEGER DEFAULT 2555,  -- 7 years default

    -- Timestamp
    occurred_at TIMESTAMPTZ DEFAULT NOW(),

    -- Metadata
    custom_fields JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_audit_trails_tenant ON audit_trails(tenant_id);
CREATE INDEX idx_audit_trails_user ON audit_trails(user_id, occurred_at DESC);
CREATE INDEX idx_audit_trails_action ON audit_trails(action, occurred_at DESC);
CREATE INDEX idx_audit_trails_table ON audit_trails(table_name, record_id, occurred_at DESC);
CREATE INDEX idx_audit_trails_session ON audit_trails(session_id, occurred_at DESC);
CREATE INDEX idx_audit_trails_sensitive ON audit_trails(occurred_at DESC) WHERE is_sensitive = TRUE;
CREATE INDEX idx_audit_trails_compliance ON audit_trails USING GIN(compliance_tags);
CREATE INDEX idx_audit_trails_timestamp ON audit_trails(occurred_at DESC);

-- Partitioning by month for large audit logs
-- Example: CREATE TABLE audit_trails_2026_01 PARTITION OF audit_trails
--          FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Comments
COMMENT ON TABLE audit_trails IS 'Comprehensive system-wide audit logging for compliance and security';
COMMENT ON COLUMN audit_trails.retention_period_days IS 'Days to retain this audit record (default 7 years for compliance)';
COMMENT ON COLUMN audit_trails.compliance_tags IS 'Compliance categories: pii, hipaa, fedramp, sox, gdpr';

-- ============================================================================
-- Table: system_settings
-- Purpose: Application-level configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL for system-wide

    -- Setting identification
    setting_key VARCHAR(200) NOT NULL,
    setting_category VARCHAR(50) NOT NULL CHECK (setting_category IN (
        'general', 'security', 'notifications', 'integrations', 'features',
        'maintenance', 'billing', 'compliance', 'ui'
    )),
    setting_name VARCHAR(200) NOT NULL,
    setting_description TEXT,

    -- Value
    value_type VARCHAR(20) NOT NULL CHECK (value_type IN (
        'string', 'integer', 'decimal', 'boolean', 'json', 'encrypted'
    )),
    string_value TEXT,
    integer_value BIGINT,
    decimal_value DECIMAL(20, 6),
    boolean_value BOOLEAN,
    json_value JSONB,
    encrypted_value TEXT,  -- For sensitive data

    -- Validation
    validation_rules JSONB,  -- {min: 0, max: 100, pattern: '^[A-Z]+$', enum: ['opt1', 'opt2']}
    default_value TEXT,

    -- Scope
    scope VARCHAR(30) DEFAULT 'tenant' CHECK (scope IN (
        'system', 'tenant', 'user', 'location', 'department'
    )),
    scope_id UUID,  -- For user/location/department scoped settings

    -- UI metadata
    display_order INTEGER DEFAULT 0,
    is_editable BOOLEAN DEFAULT TRUE,
    is_visible BOOLEAN DEFAULT TRUE,
    requires_restart BOOLEAN DEFAULT FALSE,

    -- Access control
    requires_permission VARCHAR(100),  -- Permission key required to change
    requires_approval BOOLEAN DEFAULT FALSE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_deprecated BOOLEAN DEFAULT FALSE,
    deprecated_by VARCHAR(200),  -- New setting key

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    CONSTRAINT unique_setting_key_scope UNIQUE (tenant_id, setting_key, scope, scope_id)
);

-- Indexes
CREATE INDEX idx_system_settings_tenant ON system_settings(tenant_id);
CREATE INDEX idx_system_settings_key ON system_settings(setting_key, scope);
CREATE INDEX idx_system_settings_category ON system_settings(setting_category, is_active);
CREATE INDEX idx_system_settings_scope ON system_settings(scope, scope_id);

-- Trigger: Update timestamp
CREATE TRIGGER update_system_settings_timestamp
    BEFORE UPDATE ON system_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Helper function: Get setting value
CREATE OR REPLACE FUNCTION get_setting(
    p_setting_key VARCHAR(200),
    p_tenant_id UUID DEFAULT NULL,
    p_scope_id UUID DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    setting_value TEXT;
    setting_type VARCHAR(20);
BEGIN
    SELECT value_type,
           COALESCE(string_value, integer_value::TEXT, decimal_value::TEXT,
                    boolean_value::TEXT, json_value::TEXT)
    INTO setting_type, setting_value
    FROM system_settings
    WHERE setting_key = p_setting_key
      AND (tenant_id = p_tenant_id OR (p_tenant_id IS NULL AND tenant_id IS NULL))
      AND (scope_id = p_scope_id OR p_scope_id IS NULL)
      AND is_active = TRUE
    ORDER BY
        CASE scope
            WHEN 'user' THEN 1
            WHEN 'location' THEN 2
            WHEN 'department' THEN 3
            WHEN 'tenant' THEN 4
            WHEN 'system' THEN 5
        END
    LIMIT 1;

    RETURN setting_value;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_setting IS 'Get setting value with scope precedence (user > location > department > tenant > system)';

-- Comments
COMMENT ON TABLE system_settings IS 'Application-level configuration with tenant, user, and location scoping';
COMMENT ON COLUMN system_settings.validation_rules IS 'JSON validation rules: min, max, pattern, enum, required';

-- ============================================================================
-- Table: feature_flags
-- Purpose: Feature toggles and A/B testing
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL for system-wide

    -- Feature identification
    feature_key VARCHAR(200) NOT NULL,
    feature_name VARCHAR(200) NOT NULL,
    feature_description TEXT,

    -- Feature status
    is_enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),

    -- Targeting rules
    targeting_rules JSONB,
    -- Structure: {
    --   user_ids: [uuid],
    --   user_roles: ['admin', 'fleet_manager'],
    --   departments: [uuid],
    --   locations: [uuid],
    --   custom_attributes: {plan: 'enterprise'}
    -- }

    -- A/B testing
    is_ab_test BOOLEAN DEFAULT FALSE,
    ab_variants JSONB,  -- {control: 50, variant_a: 25, variant_b: 25}

    -- Schedule
    enabled_from TIMESTAMPTZ,
    enabled_until TIMESTAMPTZ,

    -- Dependencies
    requires_features TEXT[] DEFAULT '{}',  -- Other features that must be enabled
    conflicts_with_features TEXT[] DEFAULT '{}',

    -- Monitoring
    usage_count INTEGER DEFAULT 0,
    last_checked_at TIMESTAMPTZ,
    error_rate DECIMAL(5, 4),  -- Error rate when feature is enabled

    -- Rollback
    killswitch_enabled BOOLEAN DEFAULT FALSE,  -- Emergency disable
    killswitch_reason TEXT,
    killswitch_activated_by UUID REFERENCES users(id),
    killswitch_activated_at TIMESTAMPTZ,

    -- Metadata
    owner_team VARCHAR(100),
    jira_ticket VARCHAR(100),
    documentation_url TEXT,
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    CONSTRAINT unique_feature_key_per_tenant UNIQUE (tenant_id, feature_key)
);

-- Indexes
CREATE INDEX idx_feature_flags_tenant ON feature_flags(tenant_id);
CREATE INDEX idx_feature_flags_key ON feature_flags(feature_key);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(is_enabled, killswitch_enabled);
CREATE INDEX idx_feature_flags_schedule ON feature_flags(enabled_from, enabled_until)
    WHERE is_enabled = TRUE;
CREATE INDEX idx_feature_flags_ab_test ON feature_flags(is_ab_test) WHERE is_ab_test = TRUE;

-- Trigger: Update timestamp
CREATE TRIGGER update_feature_flags_timestamp
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Helper function: Check if feature is enabled for user
CREATE OR REPLACE FUNCTION is_feature_enabled(
    p_feature_key VARCHAR(200),
    p_user_id UUID,
    p_tenant_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    feature RECORD;
    is_enabled BOOLEAN := FALSE;
BEGIN
    SELECT * INTO feature
    FROM feature_flags
    WHERE feature_key = p_feature_key
      AND (tenant_id = p_tenant_id OR (p_tenant_id IS NULL AND tenant_id IS NULL))
      AND killswitch_enabled = FALSE
    LIMIT 1;

    IF NOT FOUND OR feature.is_enabled = FALSE THEN
        RETURN FALSE;
    END IF;

    -- Check schedule
    IF feature.enabled_from IS NOT NULL AND NOW() < feature.enabled_from THEN
        RETURN FALSE;
    END IF;
    IF feature.enabled_until IS NOT NULL AND NOW() > feature.enabled_until THEN
        RETURN FALSE;
    END IF;

    -- Check rollout percentage (simple hash-based assignment)
    IF feature.rollout_percentage < 100 THEN
        -- Use hash of user_id to deterministically assign
        IF (hashtext(p_user_id::TEXT)::BIGINT % 100) >= feature.rollout_percentage THEN
            RETURN FALSE;
        END IF;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_feature_enabled IS 'Check if feature is enabled for specific user with rollout percentage';

-- Comments
COMMENT ON TABLE feature_flags IS 'Feature toggles with gradual rollout, A/B testing, and killswitch support';
COMMENT ON COLUMN feature_flags.rollout_percentage IS 'Percentage of users who see the feature (0-100)';
COMMENT ON COLUMN feature_flags.killswitch_enabled IS 'Emergency disable flag - overrides everything';

-- ============================================================================
-- Table: import_jobs
-- Purpose: Bulk data import job tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Job identification
    job_name VARCHAR(200) NOT NULL,
    import_type VARCHAR(50) NOT NULL,  -- 'vehicles', 'drivers', 'maintenance_records', etc.

    -- Source file
    source_file_name VARCHAR(500),
    source_file_url TEXT,
    source_file_size_mb DECIMAL(10, 2),
    source_file_format VARCHAR(20) CHECK (source_file_format IN (
        'csv', 'excel', 'json', 'xml', 'api'
    )),

    -- Job status
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'validating', 'processing', 'completed', 'failed',
        'partially_completed', 'cancelled'
    )),

    -- Progress tracking
    total_rows INTEGER,
    rows_processed INTEGER DEFAULT 0,
    rows_created INTEGER DEFAULT 0,
    rows_updated INTEGER DEFAULT 0,
    rows_skipped INTEGER DEFAULT 0,
    rows_failed INTEGER DEFAULT 0,
    progress_percent INTEGER GENERATED ALWAYS AS (
        CASE WHEN total_rows > 0
        THEN (rows_processed * 100 / total_rows)
        ELSE 0 END
    ) STORED,

    -- Timing
    queued_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    processing_duration_seconds INTEGER,

    -- Configuration
    import_config JSONB,  -- {field_mappings, default_values, validation_rules}
    skip_duplicates BOOLEAN DEFAULT TRUE,
    update_existing BOOLEAN DEFAULT TRUE,
    validate_before_import BOOLEAN DEFAULT TRUE,

    -- Validation results
    validation_errors JSONB DEFAULT '[]'::jsonb,
    validation_warnings JSONB DEFAULT '[]'::jsonb,

    -- Error tracking
    error_log_url TEXT,  -- URL to detailed error log file
    error_summary TEXT,

    -- Results
    result_file_url TEXT,  -- Summary report
    imported_record_ids UUID[] DEFAULT '{}',

    -- User
    created_by UUID NOT NULL REFERENCES users(id),

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_import_jobs_tenant ON import_jobs(tenant_id);
CREATE INDEX idx_import_jobs_type ON import_jobs(import_type, status);
CREATE INDEX idx_import_jobs_status ON import_jobs(status, queued_at DESC);
CREATE INDEX idx_import_jobs_created_by ON import_jobs(created_by, created_at DESC);
CREATE INDEX idx_import_jobs_timestamp ON import_jobs(queued_at DESC);

-- Trigger: Update timestamp
CREATE TRIGGER update_import_jobs_timestamp
    BEFORE UPDATE ON import_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Calculate processing duration
CREATE OR REPLACE FUNCTION calculate_import_duration() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        NEW.processing_duration_seconds := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_import_duration
    BEFORE INSERT OR UPDATE ON import_jobs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_import_duration();

-- Comments
COMMENT ON TABLE import_jobs IS 'Bulk data import job tracking with validation and error reporting';
COMMENT ON COLUMN import_jobs.import_config IS 'Field mappings, defaults, and validation rules for import';

-- ============================================================================
-- Table: export_jobs
-- Purpose: Data export job tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS export_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Job identification
    job_name VARCHAR(200) NOT NULL,
    export_type VARCHAR(50) NOT NULL,  -- 'vehicles', 'maintenance_history', 'financial_report', etc.

    -- Export configuration
    export_format VARCHAR(20) NOT NULL CHECK (export_format IN (
        'csv', 'excel', 'json', 'xml', 'pdf'
    )),
    fields_to_export TEXT[] DEFAULT '{}',
    filter_criteria JSONB,  -- Query filters
    sort_criteria JSONB,

    -- Job status
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'expired', 'cancelled'
    )),

    -- Progress tracking
    total_records INTEGER,
    records_processed INTEGER DEFAULT 0,
    progress_percent INTEGER GENERATED ALWAYS AS (
        CASE WHEN total_records > 0
        THEN (records_processed * 100 / total_records)
        ELSE 0 END
    ) STORED,

    -- Timing
    queued_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    processing_duration_seconds INTEGER,
    expires_at TIMESTAMPTZ,  -- Exported file deletion date

    -- Output file
    output_file_name VARCHAR(500),
    output_file_url TEXT,
    output_file_size_mb DECIMAL(10, 2),
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMPTZ,

    -- Security
    is_encrypted BOOLEAN DEFAULT FALSE,
    encryption_password_hint VARCHAR(200),
    access_requires_auth BOOLEAN DEFAULT TRUE,
    allowed_download_count INTEGER,  -- Limit downloads

    -- Error tracking
    error_message TEXT,

    -- User
    created_by UUID NOT NULL REFERENCES users(id),

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_export_jobs_tenant ON export_jobs(tenant_id);
CREATE INDEX idx_export_jobs_type ON export_jobs(export_type, status);
CREATE INDEX idx_export_jobs_status ON export_jobs(status, queued_at DESC);
CREATE INDEX idx_export_jobs_created_by ON export_jobs(created_by, created_at DESC);
CREATE INDEX idx_export_jobs_expires ON export_jobs(expires_at) WHERE status = 'completed';
CREATE INDEX idx_export_jobs_timestamp ON export_jobs(queued_at DESC);

-- Trigger: Update timestamp
CREATE TRIGGER update_export_jobs_timestamp
    BEFORE UPDATE ON export_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Calculate processing duration
CREATE OR REPLACE FUNCTION calculate_export_duration() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        NEW.processing_duration_seconds := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at))::INTEGER;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_calculate_export_duration
    BEFORE INSERT OR UPDATE ON export_jobs
    FOR EACH ROW
    EXECUTE FUNCTION calculate_export_duration();

-- Comments
COMMENT ON TABLE export_jobs IS 'Data export job tracking with file expiration and download limits';
COMMENT ON COLUMN export_jobs.expires_at IS 'When exported file will be deleted (typically 7-30 days)';

-- ============================================================================
-- Table: scheduled_jobs
-- Purpose: Background job scheduler
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL for system jobs

    -- Job identification
    job_name VARCHAR(200) NOT NULL,
    job_type VARCHAR(50) NOT NULL,  -- 'report', 'sync', 'cleanup', 'notification', 'calculation'
    job_description TEXT,

    -- Job configuration
    job_function VARCHAR(200) NOT NULL,  -- Function/endpoint to call
    job_parameters JSONB DEFAULT '{}'::jsonb,

    -- Schedule
    schedule_type VARCHAR(30) NOT NULL CHECK (schedule_type IN (
        'cron', 'interval', 'one_time', 'manual'
    )),
    cron_expression VARCHAR(100),  -- '0 2 * * *' = daily at 2am
    interval_seconds INTEGER,  -- For interval-based jobs
    scheduled_time TIMESTAMPTZ,  -- For one-time jobs

    -- Execution tracking
    last_run_at TIMESTAMPTZ,
    last_run_status VARCHAR(20) CHECK (last_run_status IN (
        'success', 'failed', 'timeout', 'cancelled', NULL
    )),
    last_run_duration_seconds INTEGER,
    last_error_message TEXT,

    next_run_at TIMESTAMPTZ,
    run_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,

    -- Performance
    average_duration_seconds DECIMAL(8, 2),
    max_duration_seconds INTEGER,

    -- Execution constraints
    timeout_seconds INTEGER DEFAULT 300,
    max_retries INTEGER DEFAULT 3,
    retry_delay_seconds INTEGER DEFAULT 60,

    -- Concurrency
    allow_concurrent_execution BOOLEAN DEFAULT FALSE,
    is_currently_running BOOLEAN DEFAULT FALSE,
    running_since TIMESTAMPTZ,

    -- Priority
    priority INTEGER DEFAULT 0,  -- Higher = runs first

    -- Conditions
    run_conditions JSONB,  -- {business_hours_only: true, weekdays_only: true}

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_paused BOOLEAN DEFAULT FALSE,
    paused_until TIMESTAMPTZ,

    -- Notifications
    notify_on_success BOOLEAN DEFAULT FALSE,
    notify_on_failure BOOLEAN DEFAULT TRUE,
    notification_recipients TEXT[] DEFAULT '{}',

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
CREATE INDEX idx_scheduled_jobs_tenant ON scheduled_jobs(tenant_id);
CREATE INDEX idx_scheduled_jobs_type ON scheduled_jobs(job_type, is_active);
CREATE INDEX idx_scheduled_jobs_next_run ON scheduled_jobs(next_run_at)
    WHERE is_active = TRUE AND is_paused = FALSE;
CREATE INDEX idx_scheduled_jobs_running ON scheduled_jobs(is_currently_running, running_since)
    WHERE is_currently_running = TRUE;
CREATE INDEX idx_scheduled_jobs_priority ON scheduled_jobs(priority DESC, next_run_at);

-- Trigger: Update timestamp
CREATE TRIGGER update_scheduled_jobs_timestamp
    BEFORE UPDATE ON scheduled_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE scheduled_jobs IS 'Background job scheduler with cron, interval, and one-time scheduling';
COMMENT ON COLUMN scheduled_jobs.cron_expression IS 'Standard cron format: minute hour day month weekday';

-- ============================================================================
-- Table: job_execution_history
-- Purpose: Job execution audit trail
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_execution_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Job reference
    scheduled_job_id UUID REFERENCES scheduled_jobs(id) ON DELETE SET NULL,
    job_name VARCHAR(200) NOT NULL,
    job_type VARCHAR(50),

    -- Execution details
    execution_status VARCHAR(20) NOT NULL CHECK (execution_status IN (
        'started', 'success', 'failed', 'timeout', 'cancelled', 'skipped'
    )),

    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- Results
    result_data JSONB,
    records_processed INTEGER,

    -- Error tracking
    error_message TEXT,
    error_stack_trace TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Performance
    memory_used_mb DECIMAL(8, 2),
    cpu_time_seconds DECIMAL(8, 2),

    -- Trigger
    triggered_by VARCHAR(30) CHECK (triggered_by IN (
        'schedule', 'manual', 'api', 'system_event', 'dependency'
    )),
    triggered_by_user_id UUID REFERENCES users(id),

    -- Metadata
    custom_fields JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_job_execution_history_tenant ON job_execution_history(tenant_id);
CREATE INDEX idx_job_execution_history_job ON job_execution_history(scheduled_job_id, started_at DESC);
CREATE INDEX idx_job_execution_history_status ON job_execution_history(execution_status, started_at DESC);
CREATE INDEX idx_job_execution_history_failed ON job_execution_history(started_at DESC)
    WHERE execution_status IN ('failed', 'timeout');
CREATE INDEX idx_job_execution_history_timestamp ON job_execution_history(started_at DESC);

-- Trigger: Update scheduled job stats
CREATE OR REPLACE FUNCTION update_scheduled_job_stats() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.execution_status = 'success' THEN
        UPDATE scheduled_jobs
        SET
            last_run_at = NEW.started_at,
            last_run_status = 'success',
            last_run_duration_seconds = NEW.duration_seconds,
            run_count = run_count + 1,
            success_count = success_count + 1,
            average_duration_seconds = (
                COALESCE(average_duration_seconds * run_count, 0) + NEW.duration_seconds
            ) / (run_count + 1),
            max_duration_seconds = GREATEST(COALESCE(max_duration_seconds, 0), NEW.duration_seconds),
            is_currently_running = FALSE,
            running_since = NULL
        WHERE id = NEW.scheduled_job_id;
    ELSIF NEW.execution_status IN ('failed', 'timeout') THEN
        UPDATE scheduled_jobs
        SET
            last_run_at = NEW.started_at,
            last_run_status = NEW.execution_status,
            last_error_message = NEW.error_message,
            run_count = run_count + 1,
            failure_count = failure_count + 1,
            is_currently_running = FALSE,
            running_since = NULL
        WHERE id = NEW.scheduled_job_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_scheduled_job_stats
    AFTER INSERT OR UPDATE ON job_execution_history
    FOR EACH ROW
    WHEN (NEW.execution_status IN ('success', 'failed', 'timeout'))
    EXECUTE FUNCTION update_scheduled_job_stats();

-- Comments
COMMENT ON TABLE job_execution_history IS 'Complete audit trail of all scheduled job executions';
COMMENT ON COLUMN job_execution_history.triggered_by IS 'How the job was triggered: schedule, manual, api, system_event';

-- ============================================================================
-- Table: data_retention_policies
-- Purpose: Automated data lifecycle management
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL for system policies

    -- Policy identification
    policy_name VARCHAR(200) NOT NULL,
    policy_description TEXT,

    -- Target data
    table_name VARCHAR(100) NOT NULL,
    data_category VARCHAR(50),  -- 'audit_logs', 'telemetry', 'documents', 'archived_records'

    -- Retention rules
    retention_period_days INTEGER NOT NULL,
    archive_before_delete BOOLEAN DEFAULT TRUE,
    archive_storage_location VARCHAR(100),  -- 's3://bucket/path', 'azure://container/path'

    -- Date field to use for retention
    date_field VARCHAR(100) DEFAULT 'created_at',

    -- Additional filters
    filter_conditions JSONB,  -- {status: 'archived', is_deleted: true}

    -- Actions
    action VARCHAR(30) NOT NULL CHECK (action IN (
        'archive', 'delete', 'anonymize', 'compress'
    )),
    anonymization_rules JSONB,  -- {fields: ['email', 'phone'], method: 'hash'}

    -- Execution schedule
    run_frequency VARCHAR(20) DEFAULT 'daily' CHECK (run_frequency IN (
        'hourly', 'daily', 'weekly', 'monthly'
    )),
    run_time TIME DEFAULT '02:00:00',  -- 2 AM
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,

    -- Execution results
    last_run_records_processed INTEGER,
    last_run_records_archived INTEGER,
    last_run_records_deleted INTEGER,
    last_run_status VARCHAR(20),
    last_run_error TEXT,

    -- Safety limits
    max_records_per_run INTEGER DEFAULT 10000,
    dry_run_mode BOOLEAN DEFAULT TRUE,  -- Preview only, don't actually delete

    -- Compliance
    compliance_requirement TEXT,  -- 'GDPR', 'HIPAA', 'SOX', 'FedRAMP'
    legal_hold_exempt BOOLEAN DEFAULT FALSE,  -- Excluded from retention policy

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,

    -- Notifications
    notify_before_execution BOOLEAN DEFAULT TRUE,
    notification_recipients TEXT[] DEFAULT '{}',

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
CREATE INDEX idx_data_retention_policies_tenant ON data_retention_policies(tenant_id);
CREATE INDEX idx_data_retention_policies_table ON data_retention_policies(table_name, is_active);
CREATE INDEX idx_data_retention_policies_next_run ON data_retention_policies(next_run_at)
    WHERE is_active = TRUE AND is_approved = TRUE;
CREATE INDEX idx_data_retention_policies_compliance ON data_retention_policies(compliance_requirement);

-- Trigger: Update timestamp
CREATE TRIGGER update_data_retention_policies_timestamp
    BEFORE UPDATE ON data_retention_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE data_retention_policies IS 'Automated data lifecycle policies for compliance and storage optimization';
COMMENT ON COLUMN data_retention_policies.dry_run_mode IS 'When true, preview actions without actually deleting/archiving';
COMMENT ON COLUMN data_retention_policies.legal_hold_exempt IS 'Data under legal hold is exempt from deletion';

-- ============================================================================
-- END OF MIGRATION 015 - ALL MIGRATIONS COMPLETE
-- ============================================================================
