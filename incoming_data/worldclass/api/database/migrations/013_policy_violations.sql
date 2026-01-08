-- Policy Violations Tracking System
-- Comprehensive logging and compliance reporting for policy violations
-- Created: 2026-01-02

-- ============================================
-- Policy Violations Table
-- ============================================

CREATE TABLE IF NOT EXISTS policy_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Violation Details
    violation_type VARCHAR(100) NOT NULL CHECK (violation_type IN (
        'personal_use_unauthorized',
        'personal_use_exceeds_limit',
        'personal_use_weekend_violation',
        'mileage_limit_exceeded',
        'geofence_breach',
        'speed_violation',
        'after_hours_usage',
        'unauthorized_driver',
        'maintenance_overdue',
        'fuel_card_misuse',
        'safety_violation',
        'documentation_missing',
        'compliance_violation',
        'other'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Context Information
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    vehicle_number VARCHAR(50),
    driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    driver_name VARCHAR(255),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),

    -- Violation Specifics
    policy_name VARCHAR(255) NOT NULL,
    policy_id UUID,
    description TEXT NOT NULL,
    violation_details JSONB DEFAULT '{}', -- Flexible storage for violation-specific data

    -- Metrics
    threshold_value DECIMAL(10,2),
    actual_value DECIMAL(10,2),
    difference DECIMAL(10,2),
    unit VARCHAR(50), -- miles, hours, dollars, etc.

    -- Location Data
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    location_address TEXT,
    geofence_id UUID,
    geofence_name VARCHAR(255),

    -- Timestamps
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Resolution Tracking
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN (
        'open',
        'acknowledged',
        'under_review',
        'approved_override',
        'resolved',
        'dismissed',
        'escalated'
    )),
    resolution VARCHAR(100),
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_by_name VARCHAR(255),

    -- Approval Override
    override_requested BOOLEAN DEFAULT false,
    override_approved BOOLEAN,
    override_requested_by UUID REFERENCES users(id) ON DELETE SET NULL,
    override_requested_at TIMESTAMP WITH TIME ZONE,
    override_approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    override_approved_at TIMESTAMP WITH TIME ZONE,
    override_reason TEXT,

    -- Notifications
    notification_sent BOOLEAN DEFAULT false,
    notification_sent_at TIMESTAMP WITH TIME ZONE,
    notification_recipients TEXT[], -- Array of user IDs or emails
    escalation_sent BOOLEAN DEFAULT false,
    escalation_sent_at TIMESTAMP WITH TIME ZONE,

    -- Related Records
    request_id UUID, -- Related personal use request, etc.
    work_order_id UUID,
    fuel_transaction_id UUID,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_threshold CHECK (
        (threshold_value IS NULL AND actual_value IS NULL) OR
        (threshold_value IS NOT NULL AND actual_value IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_policy_violations_tenant ON policy_violations(tenant_id);
CREATE INDEX idx_policy_violations_vehicle ON policy_violations(vehicle_id);
CREATE INDEX idx_policy_violations_driver ON policy_violations(driver_id);
CREATE INDEX idx_policy_violations_user ON policy_violations(user_id);
CREATE INDEX idx_policy_violations_type ON policy_violations(violation_type);
CREATE INDEX idx_policy_violations_severity ON policy_violations(severity);
CREATE INDEX idx_policy_violations_status ON policy_violations(status);
CREATE INDEX idx_policy_violations_occurred_at ON policy_violations(occurred_at DESC);
CREATE INDEX idx_policy_violations_detected_at ON policy_violations(detected_at DESC);
CREATE INDEX idx_policy_violations_policy ON policy_violations(policy_id);

-- Composite indexes for common queries
CREATE INDEX idx_policy_violations_tenant_status ON policy_violations(tenant_id, status);
CREATE INDEX idx_policy_violations_tenant_severity ON policy_violations(tenant_id, severity);
CREATE INDEX idx_policy_violations_tenant_type ON policy_violations(tenant_id, violation_type);
CREATE INDEX idx_policy_violations_date_range ON policy_violations(tenant_id, occurred_at DESC);

-- ============================================
-- Policy Violation Comments
-- ============================================

CREATE TABLE IF NOT EXISTS policy_violation_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    violation_id UUID REFERENCES policy_violations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    comment_text TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_violation_comments_violation ON policy_violation_comments(violation_id);
CREATE INDEX idx_violation_comments_created ON policy_violation_comments(created_at DESC);

-- ============================================
-- Violation Trends & Analytics Materialized View
-- ============================================

CREATE MATERIALIZED VIEW IF NOT EXISTS policy_violation_trends AS
SELECT
    tenant_id,
    DATE_TRUNC('day', occurred_at) as violation_date,
    violation_type,
    severity,
    COUNT(*) as violation_count,
    COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_count,
    AVG(EXTRACT(EPOCH FROM (resolved_at - detected_at))/3600) as avg_resolution_hours,
    SUM(CASE WHEN override_approved = true THEN 1 ELSE 0 END) as override_count
FROM policy_violations
WHERE occurred_at >= NOW() - INTERVAL '90 days'
GROUP BY tenant_id, DATE_TRUNC('day', occurred_at), violation_type, severity;

CREATE INDEX idx_violation_trends_tenant_date ON policy_violation_trends(tenant_id, violation_date DESC);

-- Refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_violation_trends()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY policy_violation_trends;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Automated Triggers
-- ============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_violation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_policy_violations_updated
    BEFORE UPDATE ON policy_violations
    FOR EACH ROW
    EXECUTE FUNCTION update_violation_timestamp();

-- Auto-escalate critical violations
CREATE OR REPLACE FUNCTION auto_escalate_critical_violations()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.severity = 'critical' AND NEW.status = 'open' THEN
        -- Check if 24 hours have passed since detection
        IF NEW.detected_at < NOW() - INTERVAL '24 hours' AND NEW.escalation_sent = false THEN
            NEW.status = 'escalated';
            NEW.escalation_sent = true;
            NEW.escalation_sent_at = NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_escalate_violations
    BEFORE UPDATE ON policy_violations
    FOR EACH ROW
    EXECUTE FUNCTION auto_escalate_critical_violations();

-- ============================================
-- Audit Logging Integration
-- ============================================

CREATE OR REPLACE FUNCTION log_violation_changes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        tenant_id,
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        outcome,
        created_at
    ) VALUES (
        NEW.tenant_id,
        NEW.resolved_by,
        CASE
            WHEN TG_OP = 'INSERT' THEN 'CREATE'
            WHEN TG_OP = 'UPDATE' THEN 'UPDATE'
            WHEN TG_OP = 'DELETE' THEN 'DELETE'
        END,
        'policy_violation',
        NEW.id,
        jsonb_build_object(
            'violation_type', NEW.violation_type,
            'severity', NEW.severity,
            'status', NEW.status,
            'vehicle_id', NEW.vehicle_id,
            'driver_id', NEW.driver_id,
            'override_approved', NEW.override_approved
        ),
        'success',
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_violation_changes
    AFTER INSERT OR UPDATE ON policy_violations
    FOR EACH ROW
    EXECUTE FUNCTION log_violation_changes();

-- ============================================
-- Helper Functions
-- ============================================

-- Get violation statistics for a tenant
CREATE OR REPLACE FUNCTION get_violation_stats(p_tenant_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE(
    total_violations BIGINT,
    open_violations BIGINT,
    resolved_violations BIGINT,
    critical_violations BIGINT,
    avg_resolution_hours NUMERIC,
    top_violation_type VARCHAR,
    top_violating_vehicle VARCHAR,
    top_violating_driver VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'open' THEN 1 END) as open,
            COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
            COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical,
            AVG(EXTRACT(EPOCH FROM (resolved_at - detected_at))/3600) as avg_hours
        FROM policy_violations
        WHERE tenant_id = p_tenant_id
        AND occurred_at >= NOW() - INTERVAL '1 day' * p_days
    ),
    top_type AS (
        SELECT violation_type
        FROM policy_violations
        WHERE tenant_id = p_tenant_id
        AND occurred_at >= NOW() - INTERVAL '1 day' * p_days
        GROUP BY violation_type
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ),
    top_vehicle AS (
        SELECT vehicle_number
        FROM policy_violations
        WHERE tenant_id = p_tenant_id
        AND occurred_at >= NOW() - INTERVAL '1 day' * p_days
        AND vehicle_number IS NOT NULL
        GROUP BY vehicle_number
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ),
    top_driver AS (
        SELECT driver_name
        FROM policy_violations
        WHERE tenant_id = p_tenant_id
        AND occurred_at >= NOW() - INTERVAL '1 day' * p_days
        AND driver_name IS NOT NULL
        GROUP BY driver_name
        ORDER BY COUNT(*) DESC
        LIMIT 1
    )
    SELECT
        s.total,
        s.open,
        s.resolved,
        s.critical,
        s.avg_hours,
        tt.violation_type,
        tv.vehicle_number,
        td.driver_name
    FROM stats s
    CROSS JOIN top_type tt
    CROSS JOIN top_vehicle tv
    CROSS JOIN top_driver td;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Sample Policies Reference Table
-- ============================================

CREATE TABLE IF NOT EXISTS policy_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    policy_type VARCHAR(100) NOT NULL,
    policy_name VARCHAR(255) NOT NULL,
    description TEXT,
    threshold_value DECIMAL(10,2),
    threshold_unit VARCHAR(50),
    severity_default VARCHAR(20) CHECK (severity_default IN ('low', 'medium', 'high', 'critical')),
    auto_escalate BOOLEAN DEFAULT false,
    escalation_hours INTEGER,
    notification_rules JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_policy_definitions_tenant ON policy_definitions(tenant_id);
CREATE INDEX idx_policy_definitions_type ON policy_definitions(policy_type);

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE policy_violations IS 'Comprehensive policy violation tracking with audit trail and compliance reporting';
COMMENT ON COLUMN policy_violations.violation_details IS 'JSON storage for violation-specific data like mileage, duration, location details';
COMMENT ON COLUMN policy_violations.override_approved IS 'Indicates if a supervisor approved an exception to the policy violation';
COMMENT ON MATERIALIZED VIEW policy_violation_trends IS 'Pre-aggregated violation statistics for reporting dashboards';
