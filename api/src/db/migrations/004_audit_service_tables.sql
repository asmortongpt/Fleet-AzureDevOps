-- ============================================================================
-- Fleet Management System - Audit Service Migration
-- ============================================================================
-- Description: Tamper-proof, blockchain-style audit logging for compliance
-- Compliance: SOC 2 Type II, HIPAA, GDPR, FedRAMP
-- Author: Fleet Management System
-- Created: 2026-01-06
-- Version: 1.0.0
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- MAIN AUDIT LOGS TABLE (PARTITIONED)
-- ============================================================================

-- Create parent table for audit logs with monthly partitioning
CREATE TABLE IF NOT EXISTS audit_logs (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_number BIGSERIAL NOT NULL,

    -- Hash chain for tamper detection
    previous_hash VARCHAR(64) NOT NULL,
    current_hash VARCHAR(64) NOT NULL,
    anchor_hash VARCHAR(256), -- Periodic signed anchor

    -- Who performed the action
    user_id VARCHAR(255) NOT NULL,
    user_role VARCHAR(100),
    impersonated_by VARCHAR(255), -- For admin impersonation tracking

    -- What action was performed
    action VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,

    -- Resource being acted upon
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    resource_attributes JSONB,

    -- When the action occurred
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- How the action was performed
    ip_address INET NOT NULL,
    user_agent TEXT,
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    geolocation JSONB, -- {lat, lon}

    -- Details of the change
    before_state JSONB,
    after_state JSONB,
    changes JSONB, -- Array of {field, oldValue, newValue}

    -- Result of the action
    result VARCHAR(20) NOT NULL, -- success, failure, partial
    error_message TEXT,

    -- Compliance and retention
    compliance_flags TEXT[], -- ['PII', 'PHI', 'PCI', etc.]
    retention_years INTEGER NOT NULL DEFAULT 7,

    -- Chain verification
    verified BOOLEAN DEFAULT TRUE,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Indexes for fast lookups
    CONSTRAINT audit_logs_result_check CHECK (result IN ('success', 'failure', 'partial')),
    CONSTRAINT audit_logs_severity_check CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    CONSTRAINT audit_logs_category_check CHECK (category IN (
        'authentication',
        'authorization',
        'data-access',
        'data-modification',
        'configuration-change',
        'security-event',
        'policy-enforcement',
        'admin-action'
    ))
) PARTITION BY RANGE (timestamp);

-- Create unique index on sequence_number across all partitions
CREATE UNIQUE INDEX IF NOT EXISTS audit_logs_sequence_number_idx ON audit_logs (sequence_number);

-- Create indexes for fast queries (on parent table, will be inherited by partitions)
CREATE INDEX IF NOT EXISTS audit_logs_user_id_timestamp_idx ON audit_logs (user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS audit_logs_resource_idx ON audit_logs (resource_type, resource_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS audit_logs_action_timestamp_idx ON audit_logs (action, timestamp DESC);
CREATE INDEX IF NOT EXISTS audit_logs_timestamp_idx ON audit_logs (timestamp DESC);
CREATE INDEX IF NOT EXISTS audit_logs_compliance_flags_idx ON audit_logs USING GIN (compliance_flags);
CREATE INDEX IF NOT EXISTS audit_logs_session_id_idx ON audit_logs (session_id) WHERE session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS audit_logs_request_id_idx ON audit_logs (request_id) WHERE request_id IS NOT NULL;

-- Create hash chain index for verification
CREATE INDEX IF NOT EXISTS audit_logs_hash_chain_idx ON audit_logs (sequence_number, previous_hash, current_hash);

-- ============================================================================
-- MONTHLY PARTITIONS (Auto-create for current and next 12 months)
-- ============================================================================

-- Create partitions for 2026
CREATE TABLE IF NOT EXISTS audit_logs_2026_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE IF NOT EXISTS audit_logs_2026_02 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE IF NOT EXISTS audit_logs_2026_03 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE IF NOT EXISTS audit_logs_2026_04 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE IF NOT EXISTS audit_logs_2026_05 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE IF NOT EXISTS audit_logs_2026_06 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE IF NOT EXISTS audit_logs_2026_07 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE IF NOT EXISTS audit_logs_2026_08 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE IF NOT EXISTS audit_logs_2026_09 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE IF NOT EXISTS audit_logs_2026_10 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE IF NOT EXISTS audit_logs_2026_11 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE IF NOT EXISTS audit_logs_2026_12 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

-- Create partitions for 2027 (future-proofing)
CREATE TABLE IF NOT EXISTS audit_logs_2027_01 PARTITION OF audit_logs
    FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');

-- ============================================================================
-- AUDIT ANCHORS TABLE (Signed Hash Anchors)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_anchors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_number BIGINT NOT NULL UNIQUE,
    hash VARCHAR(64) NOT NULL,
    signature TEXT NOT NULL, -- RSA signature with private key
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    logs_in_chain INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_anchors_sequence_number_idx ON audit_anchors (sequence_number);
CREATE INDEX IF NOT EXISTS audit_anchors_timestamp_idx ON audit_anchors (timestamp DESC);

-- ============================================================================
-- AUDIT DIGESTS TABLE (Daily Published Digests)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_digests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    digest_date DATE NOT NULL UNIQUE,
    total_logs INTEGER NOT NULL,
    start_sequence_number BIGINT NOT NULL,
    end_sequence_number BIGINT NOT NULL,
    digest_hash VARCHAR(64) NOT NULL,
    signature TEXT NOT NULL,
    azure_blob_url TEXT, -- Published to immutable Azure Blob Storage
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_digests_date_idx ON audit_digests (digest_date DESC);
CREATE INDEX IF NOT EXISTS audit_digests_sequence_range_idx ON audit_digests (start_sequence_number, end_sequence_number);

-- ============================================================================
-- AUDIT ARCHIVES TABLE (Archive Metadata)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_archives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    archive_date DATE NOT NULL,
    start_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    end_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    total_logs INTEGER NOT NULL,
    archive_size_mb NUMERIC(10, 2),
    azure_blob_url TEXT NOT NULL,
    compression_format VARCHAR(20) DEFAULT 'gzip',
    encryption_algorithm VARCHAR(50) DEFAULT 'AES-256-GCM',
    retention_until DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'archived',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT audit_archives_status_check CHECK (status IN ('archiving', 'archived', 'restored', 'purged'))
);

CREATE INDEX IF NOT EXISTS audit_archives_date_idx ON audit_archives (archive_date DESC);
CREATE INDEX IF NOT EXISTS audit_archives_timestamp_range_idx ON audit_archives (start_timestamp, end_timestamp);
CREATE INDEX IF NOT EXISTS audit_archives_retention_idx ON audit_archives (retention_until) WHERE status = 'archived';

-- ============================================================================
-- AUDIT TAMPERING REPORTS TABLE (Tampering Detection)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_tampering_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    detection_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    start_sequence_number BIGINT NOT NULL,
    end_sequence_number BIGINT NOT NULL,
    broken_links JSONB NOT NULL, -- Array of {sequenceNumber, expectedHash, actualHash}
    total_broken_links INTEGER NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'critical',
    investigated BOOLEAN DEFAULT FALSE,
    investigation_notes TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT audit_tampering_severity_check CHECK (severity IN ('warning', 'error', 'critical'))
);

CREATE INDEX IF NOT EXISTS audit_tampering_reports_timestamp_idx ON audit_tampering_reports (detection_timestamp DESC);
CREATE INDEX IF NOT EXISTS audit_tampering_reports_resolved_idx ON audit_tampering_reports (resolved) WHERE NOT resolved;

-- ============================================================================
-- AUDIT METRICS TABLE (Performance Metrics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL UNIQUE,
    total_logs INTEGER NOT NULL DEFAULT 0,
    logs_by_category JSONB,
    logs_by_severity JSONB,
    logs_by_result JSONB,
    average_write_time_ms NUMERIC(10, 2),
    average_read_time_ms NUMERIC(10, 2),
    chain_verification_time_ms NUMERIC(10, 2),
    storage_size_mb NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_metrics_date_idx ON audit_metrics (metric_date DESC);

-- ============================================================================
-- IMMUTABILITY ENFORCEMENT
-- ============================================================================

-- Create trigger function to prevent updates/deletes on audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. Updates and deletes are not allowed.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to prevent modifications
DROP TRIGGER IF EXISTS prevent_audit_log_update ON audit_logs;
CREATE TRIGGER prevent_audit_log_update
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_modification();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate SHA-256 hash of audit log entry
CREATE OR REPLACE FUNCTION calculate_audit_log_hash(
    p_id UUID,
    p_sequence_number BIGINT,
    p_previous_hash VARCHAR(64),
    p_user_id VARCHAR(255),
    p_action VARCHAR(255),
    p_timestamp TIMESTAMP WITH TIME ZONE,
    p_resource_type VARCHAR(100),
    p_resource_id VARCHAR(255),
    p_result VARCHAR(20)
) RETURNS VARCHAR(64) AS $$
DECLARE
    v_data TEXT;
BEGIN
    v_data := p_id::TEXT || '|' ||
              p_sequence_number::TEXT || '|' ||
              p_previous_hash || '|' ||
              p_user_id || '|' ||
              p_action || '|' ||
              p_timestamp::TEXT || '|' ||
              COALESCE(p_resource_type, '') || '|' ||
              COALESCE(p_resource_id, '') || '|' ||
              p_result;

    RETURN encode(digest(v_data, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get the last audit log hash
CREATE OR REPLACE FUNCTION get_last_audit_log_hash()
RETURNS TABLE(sequence_number BIGINT, current_hash VARCHAR(64)) AS $$
BEGIN
    RETURN QUERY
    SELECT al.sequence_number, al.current_hash
    FROM audit_logs al
    ORDER BY al.sequence_number DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to create new partition for upcoming month
CREATE OR REPLACE FUNCTION create_audit_log_partition(p_year INTEGER, p_month INTEGER)
RETURNS VOID AS $$
DECLARE
    v_partition_name TEXT;
    v_start_date DATE;
    v_end_date DATE;
    v_sql TEXT;
BEGIN
    -- Calculate partition dates
    v_start_date := make_date(p_year, p_month, 1);
    v_end_date := v_start_date + INTERVAL '1 month';

    -- Generate partition name
    v_partition_name := 'audit_logs_' || p_year || '_' || LPAD(p_month::TEXT, 2, '0');

    -- Create partition
    v_sql := format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
        v_partition_name,
        v_start_date,
        v_end_date
    );

    EXECUTE v_sql;

    RAISE NOTICE 'Created partition: %', v_partition_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert genesis hash (first entry in the chain)
INSERT INTO audit_logs (
    sequence_number,
    previous_hash,
    current_hash,
    user_id,
    action,
    category,
    severity,
    ip_address,
    result,
    compliance_flags,
    retention_years
) VALUES (
    0,
    '0000000000000000000000000000000000000000000000000000000000000000',
    encode(digest('FLEET_AUDIT_GENESIS_BLOCK_2026', 'sha256'), 'hex'),
    'system',
    'audit:genesis',
    'admin-action',
    'info',
    '127.0.0.1'::INET,
    'success',
    ARRAY[]::TEXT[],
    7
) ON CONFLICT (sequence_number) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE audit_logs IS 'Immutable, tamper-proof audit logs with blockchain-style hash chaining';
COMMENT ON COLUMN audit_logs.sequence_number IS 'Auto-incrementing sequence number for hash chain';
COMMENT ON COLUMN audit_logs.previous_hash IS 'SHA-256 hash of previous log entry';
COMMENT ON COLUMN audit_logs.current_hash IS 'SHA-256 hash of current log entry';
COMMENT ON COLUMN audit_logs.anchor_hash IS 'Periodic signed anchor hash for integrity verification';
COMMENT ON COLUMN audit_logs.compliance_flags IS 'Compliance flags like PII, PHI, PCI for data classification';
COMMENT ON COLUMN audit_logs.retention_years IS 'Retention period in years (default 7 for financial compliance)';

COMMENT ON TABLE audit_anchors IS 'Cryptographically signed anchor hashes for periodic chain verification';
COMMENT ON TABLE audit_digests IS 'Daily published digests to immutable Azure Blob Storage';
COMMENT ON TABLE audit_archives IS 'Archive metadata for long-term retention';
COMMENT ON TABLE audit_tampering_reports IS 'Tampering detection reports with broken chain links';

-- ============================================================================
-- GRANTS (Restrict access)
-- ============================================================================

-- Revoke all public access
REVOKE ALL ON TABLE audit_logs FROM PUBLIC;
REVOKE ALL ON TABLE audit_anchors FROM PUBLIC;
REVOKE ALL ON TABLE audit_digests FROM PUBLIC;
REVOKE ALL ON TABLE audit_archives FROM PUBLIC;
REVOKE ALL ON TABLE audit_tampering_reports FROM PUBLIC;
REVOKE ALL ON TABLE audit_metrics FROM PUBLIC;

-- Grant read-only access to audit viewer role (should be created separately)
-- GRANT SELECT ON TABLE audit_logs TO audit_viewer_role;

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT
    'Audit Service Migration Completed' AS status,
    NOW() AS timestamp,
    (SELECT COUNT(*) FROM audit_logs) AS total_audit_logs,
    (SELECT MAX(sequence_number) FROM audit_logs) AS latest_sequence_number;
