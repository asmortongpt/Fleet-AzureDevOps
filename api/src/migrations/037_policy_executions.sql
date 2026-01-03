-- Migration: 037 - Policy Executions Tracking
-- Description: Creates table for tracking automatic and manual policy enforcement actions
-- Author: Policy Engine Implementation
-- Date: 2026-01-02
-- Dependencies: 022_policy_templates_library.sql

-- ==============================================================================
-- POLICY EXECUTIONS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS policy_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    policy_id UUID REFERENCES policy_templates(id) ON DELETE CASCADE NOT NULL,

    -- Trigger Information
    trigger_type VARCHAR(50) NOT NULL, -- 'scheduled', 'event', 'manual', 'violation'
    trigger_event VARCHAR(100), -- e.g., 'vehicle_inspection_overdue', 'license_expiring'
    trigger_data JSONB, -- Additional data about what triggered the execution
    trigger_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Conditions Evaluation
    conditions_met BOOLEAN NOT NULL, -- True if all conditions passed
    conditions_evaluated JSONB, -- Results of each condition check: [{condition, result, value}]
    evaluation_details TEXT, -- Human-readable evaluation summary

    -- Actions Taken
    actions_executed JSONB NOT NULL, -- Array of actions: [{type, status, result, timestamp}]
    action_results JSONB, -- Detailed results from each action
    actions_successful INTEGER DEFAULT 0,
    actions_failed INTEGER DEFAULT 0,

    -- Related Entities
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,

    -- Execution Details
    execution_status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'skipped'
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER, -- Execution duration in milliseconds
    error_message TEXT, -- Error details if execution failed
    retry_count INTEGER DEFAULT 0, -- Number of retry attempts

    -- Audit
    executed_by UUID, -- User who triggered manual execution (NULL for automatic)
    execution_mode VARCHAR(20) DEFAULT 'automatic', -- 'automatic', 'manual', 'test'

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================

CREATE INDEX idx_policy_executions_tenant ON policy_executions(tenant_id);
CREATE INDEX idx_policy_executions_policy ON policy_executions(policy_id);
CREATE INDEX idx_policy_executions_trigger ON policy_executions(trigger_type);
CREATE INDEX idx_policy_executions_status ON policy_executions(execution_status);
CREATE INDEX idx_policy_executions_vehicle ON policy_executions(vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX idx_policy_executions_driver ON policy_executions(driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_policy_executions_work_order ON policy_executions(work_order_id) WHERE work_order_id IS NOT NULL;
CREATE INDEX idx_policy_executions_started ON policy_executions(started_at);
CREATE INDEX idx_policy_executions_conditions_met ON policy_executions(conditions_met);

-- ==============================================================================
-- ROW-LEVEL SECURITY
-- ==============================================================================

ALTER TABLE policy_executions ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policy
CREATE POLICY tenant_isolation_policy_executions ON policy_executions
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Allow service accounts to read all executions for monitoring
CREATE POLICY service_account_read_policy_executions ON policy_executions
    FOR SELECT
    USING (
        current_setting('app.service_account', true) = 'true'
        OR tenant_id = current_setting('app.current_tenant_id')::uuid
    );

-- ==============================================================================
-- VIEWS
-- ==============================================================================

-- Policy Execution Summary View
CREATE OR REPLACE VIEW v_policy_execution_summary AS
SELECT
    pt.policy_code,
    pt.policy_name,
    pe.trigger_type,
    COUNT(*) AS total_executions,
    COUNT(*) FILTER (WHERE pe.execution_status = 'completed') AS successful_executions,
    COUNT(*) FILTER (WHERE pe.execution_status = 'failed') AS failed_executions,
    COUNT(*) FILTER (WHERE pe.conditions_met = TRUE) AS conditions_met_count,
    AVG(pe.duration_ms) AS avg_duration_ms,
    MAX(pe.started_at) AS last_execution,
    SUM(pe.actions_successful) AS total_actions_successful,
    SUM(pe.actions_failed) AS total_actions_failed
FROM policy_executions pe
JOIN policy_templates pt ON pe.policy_id = pt.id
GROUP BY pt.policy_code, pt.policy_name, pe.trigger_type
ORDER BY last_execution DESC;

-- Recent Failed Executions View
CREATE OR REPLACE VIEW v_policy_execution_failures AS
SELECT
    pe.id,
    pe.started_at,
    pt.policy_code,
    pt.policy_name,
    pe.trigger_type,
    pe.error_message,
    pe.retry_count,
    v.number AS vehicle,
    d.first_name || ' ' || d.last_name AS driver
FROM policy_executions pe
JOIN policy_templates pt ON pe.policy_id = pt.id
LEFT JOIN vehicles v ON pe.vehicle_id = v.id
LEFT JOIN drivers d ON pe.driver_id = d.id
WHERE pe.execution_status = 'failed'
    AND pe.started_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY pe.started_at DESC;

-- ==============================================================================
-- FUNCTIONS
-- ==============================================================================

-- Function to update execution statistics
CREATE OR REPLACE FUNCTION update_policy_execution_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate duration when execution completes
    IF NEW.execution_status = 'completed' AND OLD.execution_status != 'completed' THEN
        NEW.completed_at := CURRENT_TIMESTAMP;
        NEW.duration_ms := EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
    END IF;

    -- Update timestamp
    NEW.updated_at := CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_policy_execution_stats
    BEFORE UPDATE ON policy_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_policy_execution_stats();

-- ==============================================================================
-- COMMENTS
-- ==============================================================================

COMMENT ON TABLE policy_executions IS 'Audit trail for automatic and manual policy enforcement actions';
COMMENT ON COLUMN policy_executions.trigger_type IS 'What triggered the execution: scheduled, event, manual, violation';
COMMENT ON COLUMN policy_executions.trigger_event IS 'Specific event name like vehicle_inspection_overdue, license_expiring';
COMMENT ON COLUMN policy_executions.conditions_evaluated IS 'JSON array of each condition check result with details';
COMMENT ON COLUMN policy_executions.actions_executed IS 'JSON array of actions taken: [{type, status, result, timestamp}]';
COMMENT ON COLUMN policy_executions.execution_mode IS 'automatic (scheduled), manual (user-triggered), or test (dry-run)';
COMMENT ON COLUMN policy_executions.work_order_id IS 'Work order created as result of policy execution';

-- ==============================================================================
-- EXAMPLE DATA STRUCTURE
-- ==============================================================================

/*
Example trigger_data:
{
    "vehicle_id": "uuid-123",
    "days_overdue": 5,
    "inspection_type": "annual",
    "last_inspection_date": "2025-12-01"
}

Example conditions_evaluated:
[
    {
        "condition_index": 0,
        "type": "vehicle_inspection_overdue",
        "operator": "greater_than",
        "expected_value": 0,
        "actual_value": 5,
        "result": "PASS",
        "evaluated_at": "2026-01-02T10:00:00Z"
    }
]

Example actions_executed:
[
    {
        "action_index": 0,
        "type": "send_notification",
        "target": "fleet_manager",
        "template": "inspection_overdue_alert",
        "status": "success",
        "result": {
            "notification_id": "notif-456",
            "recipients": ["manager@example.com"],
            "sent_at": "2026-01-02T10:00:01Z"
        }
    },
    {
        "action_index": 1,
        "type": "create_work_order",
        "status": "success",
        "result": {
            "work_order_id": "uuid-789",
            "work_order_number": "WO-12345",
            "created_at": "2026-01-02T10:00:02Z"
        }
    }
]
*/
