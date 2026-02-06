-- ============================================================================
-- Migration: Comprehensive Audit Logging Infrastructure
-- Created: 2026-02-06
-- Purpose: Universal audit trail for ALL table changes with full forensics
-- Compliance: SOX, GDPR, HIPAA, FMCSA audit requirements
-- ============================================================================

-- ============================================================================
-- PART 1: Audit Trail Storage (Partitioned by Month)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- What changed
    table_name VARCHAR(100) NOT NULL,
    schema_name VARCHAR(100) DEFAULT 'public',
    record_id UUID NOT NULL,
    operation VARCHAR(10) NOT NULL,           -- INSERT, UPDATE, DELETE, TRUNCATE

    -- Who changed it
    user_id UUID,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    impersonated_by_id UUID,                  -- For support team impersonation

    -- When and where
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    request_id VARCHAR(100),                  -- For request tracing

    -- What was changed
    old_values JSONB,                         -- Complete before snapshot
    new_values JSONB,                         -- Complete after snapshot
    changed_fields TEXT[],                    -- Array of changed column names
    change_summary TEXT,                      -- Human-readable summary

    -- Why it changed
    change_reason TEXT,
    change_category VARCHAR(50),              -- 'user_action', 'system_automation', 'api_integration', 'data_migration'
    business_justification TEXT,

    -- Reversal & corrections
    reversal_of UUID,                         -- Links to reversed transaction (can't FK on partitioned table)
    reversed BOOLEAN DEFAULT FALSE,
    reversed_at TIMESTAMPTZ,
    reversed_by UUID,
    reversal_reason TEXT,

    -- Metadata
    api_endpoint VARCHAR(500),                -- REST endpoint called
    api_method VARCHAR(10),                   -- GET, POST, PUT, DELETE
    query_text TEXT,                          -- Raw SQL query (if direct DB)
    transaction_id BIGINT,                    -- PostgreSQL transaction ID
    statement_timestamp TIMESTAMPTZ,          -- Transaction start time
    application_name VARCHAR(100),            -- Connecting app

    metadata JSONB DEFAULT '{}',

    PRIMARY KEY (id, performed_at)
) PARTITION BY RANGE (performed_at);

-- Create partitions for current and next 24 months
CREATE TABLE audit_trail_2026_02 PARTITION OF audit_trail
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE audit_trail_2026_03 PARTITION OF audit_trail
    FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

CREATE TABLE audit_trail_2026_04 PARTITION OF audit_trail
    FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');

CREATE TABLE audit_trail_2026_05 PARTITION OF audit_trail
    FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE audit_trail_2026_06 PARTITION OF audit_trail
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');

CREATE TABLE audit_trail_2026_07 PARTITION OF audit_trail
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

CREATE TABLE audit_trail_2026_08 PARTITION OF audit_trail
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

CREATE TABLE audit_trail_2026_09 PARTITION OF audit_trail
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE audit_trail_2026_10 PARTITION OF audit_trail
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE TABLE audit_trail_2026_11 PARTITION OF audit_trail
    FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');

CREATE TABLE audit_trail_2026_12 PARTITION OF audit_trail
    FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

CREATE TABLE audit_trail_2027_01 PARTITION OF audit_trail
    FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');

-- Indexes for audit trail
CREATE INDEX idx_audit_trail_tenant ON audit_trail(tenant_id, performed_at DESC);
CREATE INDEX idx_audit_trail_table ON audit_trail(table_name, performed_at DESC);
CREATE INDEX idx_audit_trail_record ON audit_trail(record_id, performed_at DESC);
CREATE INDEX idx_audit_trail_user ON audit_trail(user_id, performed_at DESC);
CREATE INDEX idx_audit_trail_operation ON audit_trail(operation);
CREATE INDEX idx_audit_trail_reversed ON audit_trail(reversed) WHERE reversed = FALSE;
CREATE INDEX idx_audit_trail_changed_fields ON audit_trail USING GIN(changed_fields);
CREATE INDEX idx_audit_trail_metadata ON audit_trail USING GIN(metadata);
CREATE INDEX idx_audit_trail_old_values ON audit_trail USING GIN(old_values);
CREATE INDEX idx_audit_trail_new_values ON audit_trail USING GIN(new_values);

COMMENT ON TABLE audit_trail IS 'Universal audit log capturing all data changes across the system';
COMMENT ON COLUMN audit_trail.old_values IS 'Complete JSONB snapshot of row before change';
COMMENT ON COLUMN audit_trail.new_values IS 'Complete JSONB snapshot of row after change';
COMMENT ON COLUMN audit_trail.changed_fields IS 'Array of column names that changed (for UPDATE)';

-- ============================================================================
-- PART 2: Session & Request Context Storage
-- ============================================================================

-- Store audit context in session variables
CREATE TABLE IF NOT EXISTS audit_context (
    session_id VARCHAR(100) PRIMARY KEY,
    user_id UUID,
    user_email VARCHAR(255),
    user_role VARCHAR(50),
    tenant_id UUID,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    application_name VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX idx_audit_context_user ON audit_context(user_id);
CREATE INDEX idx_audit_context_tenant ON audit_context(tenant_id);
CREATE INDEX idx_audit_context_expires ON audit_context(expires_at);

-- ============================================================================
-- PART 3: Universal Audit Trigger Function
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    audit_row audit_trail;
    old_jsonb JSONB;
    new_jsonb JSONB;
    changed_fields TEXT[];
    current_user_id UUID;
    current_tenant_id UUID;
    current_user_email VARCHAR(255);
    current_user_role VARCHAR(50);
    current_ip_address INET;
    current_user_agent TEXT;
    current_session_id VARCHAR(100);
    current_request_id VARCHAR(100);
BEGIN
    -- Get audit context from session variables or audit_context table
    BEGIN
        current_user_id := current_setting('audit.user_id', TRUE)::UUID;
        current_tenant_id := current_setting('audit.tenant_id', TRUE)::UUID;
        current_user_email := current_setting('audit.user_email', TRUE);
        current_user_role := current_setting('audit.user_role', TRUE);
        current_ip_address := current_setting('audit.ip_address', TRUE)::INET;
        current_user_agent := current_setting('audit.user_agent', TRUE);
        current_session_id := current_setting('audit.session_id', TRUE);
        current_request_id := current_setting('audit.request_id', TRUE);
    EXCEPTION WHEN OTHERS THEN
        -- Context not set, use defaults
        current_user_id := NULL;
        current_tenant_id := COALESCE(NEW.tenant_id, OLD.tenant_id);
        current_user_email := NULL;
        current_user_role := NULL;
        current_ip_address := NULL;
        current_user_agent := NULL;
        current_session_id := NULL;
        current_request_id := NULL;
    END;

    -- Build audit record based on operation
    IF (TG_OP = 'DELETE') THEN
        old_jsonb := to_jsonb(OLD);
        new_jsonb := NULL;
        changed_fields := NULL;

        INSERT INTO audit_trail (
            tenant_id, table_name, schema_name, record_id, operation,
            user_id, user_email, user_role, ip_address, user_agent,
            session_id, request_id, old_values, new_values, changed_fields,
            change_category, transaction_id, statement_timestamp, application_name
        ) VALUES (
            current_tenant_id, TG_TABLE_NAME, TG_TABLE_SCHEMA, OLD.id, TG_OP,
            current_user_id, current_user_email, current_user_role, current_ip_address, current_user_agent,
            current_session_id, current_request_id, old_jsonb, NULL, NULL,
            'user_action', txid_current(), statement_timestamp(), current_setting('application_name', TRUE)
        );

        RETURN OLD;

    ELSIF (TG_OP = 'UPDATE') THEN
        old_jsonb := to_jsonb(OLD);
        new_jsonb := to_jsonb(NEW);

        -- Detect changed fields
        changed_fields := ARRAY(
            SELECT key
            FROM jsonb_each(old_jsonb) old_kv
            WHERE old_kv.value IS DISTINCT FROM (new_jsonb->old_kv.key)
        );

        -- Only log if something actually changed
        IF array_length(changed_fields, 1) > 0 THEN
            INSERT INTO audit_trail (
                tenant_id, table_name, schema_name, record_id, operation,
                user_id, user_email, user_role, ip_address, user_agent,
                session_id, request_id, old_values, new_values, changed_fields,
                change_category, transaction_id, statement_timestamp, application_name
            ) VALUES (
                current_tenant_id, TG_TABLE_NAME, TG_TABLE_SCHEMA, NEW.id, TG_OP,
                current_user_id, current_user_email, current_user_role, current_ip_address, current_user_agent,
                current_session_id, current_request_id, old_jsonb, new_jsonb, changed_fields,
                'user_action', txid_current(), statement_timestamp(), current_setting('application_name', TRUE)
            );
        END IF;

        RETURN NEW;

    ELSIF (TG_OP = 'INSERT') THEN
        new_jsonb := to_jsonb(NEW);

        INSERT INTO audit_trail (
            tenant_id, table_name, schema_name, record_id, operation,
            user_id, user_email, user_role, ip_address, user_agent,
            session_id, request_id, old_values, new_values, changed_fields,
            change_category, transaction_id, statement_timestamp, application_name
        ) VALUES (
            current_tenant_id, TG_TABLE_NAME, TG_TABLE_SCHEMA, NEW.id, TG_OP,
            current_user_id, current_user_email, current_user_role, current_ip_address, current_user_agent,
            current_session_id, current_request_id, NULL, new_jsonb, NULL,
            'user_action', txid_current(), statement_timestamp(), current_setting('application_name', TRUE)
        );

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION audit_trigger_func() IS 'Universal audit trigger - captures all changes with full forensics';

-- ============================================================================
-- PART 4: Apply Audit Triggers to ALL Critical Tables
-- ============================================================================

-- Core entities
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON tenants
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON drivers
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON facilities
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Financial
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON fuel_transactions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Maintenance
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON work_orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON inspections
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON maintenance_schedules
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Compliance
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON certifications
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON training_records
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON incidents
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Documents & assets
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON assets
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Vendor & inventory
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON vendors
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON parts_inventory
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Operations
CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON routes
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_trigger AFTER INSERT OR UPDATE OR DELETE ON dispatches
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================================================
-- PART 5: Audit Query Helper Functions
-- ============================================================================

-- Get audit history for a specific record
CREATE OR REPLACE FUNCTION get_audit_history(
    p_table_name VARCHAR,
    p_record_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    performed_at TIMESTAMPTZ,
    operation VARCHAR(10),
    user_email VARCHAR(255),
    changed_fields TEXT[],
    old_values JSONB,
    new_values JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.performed_at,
        a.operation,
        a.user_email,
        a.changed_fields,
        a.old_values,
        a.new_values
    FROM audit_trail a
    WHERE a.table_name = p_table_name
      AND a.record_id = p_record_id
    ORDER BY a.performed_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get who changed a specific field
CREATE OR REPLACE FUNCTION get_field_change_history(
    p_table_name VARCHAR,
    p_record_id UUID,
    p_field_name VARCHAR
)
RETURNS TABLE (
    performed_at TIMESTAMPTZ,
    user_email VARCHAR(255),
    old_value TEXT,
    new_value TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.performed_at,
        a.user_email,
        (a.old_values->>p_field_name)::TEXT,
        (a.new_values->>p_field_name)::TEXT
    FROM audit_trail a
    WHERE a.table_name = p_table_name
      AND a.record_id = p_record_id
      AND p_field_name = ANY(a.changed_fields)
    ORDER BY a.performed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 6: Automatic Partition Management
-- ============================================================================

CREATE OR REPLACE FUNCTION create_audit_trail_partition()
RETURNS void AS $$
DECLARE
    partition_date DATE;
    partition_name TEXT;
    start_date TEXT;
    end_date TEXT;
BEGIN
    -- Create partition for next month
    partition_date := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
    partition_name := 'audit_trail_' || TO_CHAR(partition_date, 'YYYY_MM');
    start_date := partition_date::TEXT;
    end_date := (partition_date + INTERVAL '1 month')::TEXT;

    -- Check if partition already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_class WHERE relname = partition_name
    ) THEN
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF audit_trail FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_date, end_date
        );

        RAISE NOTICE 'Created partition: %', partition_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 7: Cleanup Old Audit Records (Retention Policy)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_audit_records(retention_months INTEGER DEFAULT 24)
RETURNS INTEGER AS $$
DECLARE
    rows_deleted INTEGER;
    cutoff_date TIMESTAMPTZ;
BEGIN
    cutoff_date := NOW() - (retention_months || ' months')::INTERVAL;

    DELETE FROM audit_trail
    WHERE performed_at < cutoff_date
      AND table_name NOT IN ('drivers', 'certifications', 'incidents') -- Keep compliance records longer
    ;

    GET DIAGNOSTICS rows_deleted = ROW_COUNT;
    RETURN rows_deleted;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_audit_records IS 'Deletes audit records older than retention period (default 24 months). Preserves compliance-related records.';
