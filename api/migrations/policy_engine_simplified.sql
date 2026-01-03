-- Simplified Policy Engine Migration for Local Development
-- Created: 2026-01-03
-- This creates the minimum required tables for Policy Engine functionality

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- POLICY VIOLATIONS TABLE (Simplified)
-- ============================================================================

CREATE TABLE IF NOT EXISTS policy_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,  -- Optional for local dev

    -- Violation Details
    violation_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Context Information
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    vehicle_number VARCHAR(50),
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    driver_name VARCHAR(255),
    user_id UUID,
    user_name VARCHAR(255),

    -- Violation Specifics
    policy_name VARCHAR(255) NOT NULL,
    policy_id INTEGER,
    description TEXT NOT NULL,
    violation_details JSONB DEFAULT '{}',

    -- Metrics
    threshold_value DECIMAL(10,2),
    actual_value DECIMAL(10,2),
    difference DECIMAL(10,2),
    unit VARCHAR(50),

    -- Geographic Data
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    location_address TEXT,

    -- Status
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
    resolution_notes TEXT,
    resolved_at TIMESTAMP,
    resolved_by UUID,

    -- Progressive Discipline
    is_first_offense BOOLEAN DEFAULT TRUE,
    prior_violations_count INTEGER DEFAULT 0,
    discipline_action VARCHAR(100),

    -- Notifications
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP,

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for policy_violations
CREATE INDEX IF NOT EXISTS idx_policy_violations_tenant ON policy_violations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_vehicle ON policy_violations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_driver ON policy_violations(driver_id);
CREATE INDEX IF NOT EXISTS idx_policy_violations_status ON policy_violations(status);
CREATE INDEX IF NOT EXISTS idx_policy_violations_severity ON policy_violations(severity);
CREATE INDEX IF NOT EXISTS idx_policy_violations_type ON policy_violations(violation_type);
CREATE INDEX IF NOT EXISTS idx_policy_violations_created ON policy_violations(created_at);

-- ============================================================================
-- POLICY EXECUTIONS TABLE (Simplified)
-- ============================================================================

CREATE TABLE IF NOT EXISTS policy_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    policy_id INTEGER REFERENCES policy_templates(id) ON DELETE CASCADE,

    -- Trigger Information
    trigger_type VARCHAR(50) NOT NULL,
    trigger_event VARCHAR(100),
    trigger_data JSONB,
    trigger_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Conditions Evaluation
    conditions_met BOOLEAN NOT NULL,
    conditions_evaluated JSONB,
    evaluation_details TEXT,

    -- Actions Taken
    actions_executed JSONB NOT NULL DEFAULT '[]',
    action_results JSONB,
    actions_successful INTEGER DEFAULT 0,
    actions_failed INTEGER DEFAULT 0,

    -- Related Entities
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,

    -- Execution Details
    execution_status VARCHAR(50) NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    -- Audit
    executed_by UUID,
    execution_mode VARCHAR(20) DEFAULT 'automatic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for policy_executions
CREATE INDEX IF NOT EXISTS idx_policy_executions_tenant ON policy_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policy_executions_policy ON policy_executions(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_executions_trigger ON policy_executions(trigger_type);
CREATE INDEX IF NOT EXISTS idx_policy_executions_status ON policy_executions(execution_status);
CREATE INDEX IF NOT EXISTS idx_policy_executions_vehicle ON policy_executions(vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_policy_executions_driver ON policy_executions(driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_policy_executions_started ON policy_executions(started_at);

-- ============================================================================
-- UPDATE POLICY_TEMPLATES WITH CONDITIONS AND ACTIONS
-- ============================================================================

ALTER TABLE policy_templates
ADD COLUMN IF NOT EXISTS conditions JSONB,
ADD COLUMN IF NOT EXISTS actions JSONB,
ADD COLUMN IF NOT EXISTS execution_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS execution_schedule VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_execution_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS next_execution_at TIMESTAMP;

-- Indexes for policy_templates
CREATE INDEX IF NOT EXISTS idx_policy_templates_execution_enabled
    ON policy_templates(execution_enabled) WHERE execution_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_policy_templates_next_execution
    ON policy_templates(next_execution_at) WHERE next_execution_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_policy_templates_conditions
    ON policy_templates USING GIN (conditions);
CREATE INDEX IF NOT EXISTS idx_policy_templates_actions
    ON policy_templates USING GIN (actions);

-- ============================================================================
-- POLICY ACKNOWLEDGMENTS TABLE (Simplified)
-- ============================================================================

CREATE TABLE IF NOT EXISTS policy_acknowledgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id INTEGER REFERENCES policy_templates(id) NOT NULL,
    driver_id UUID REFERENCES drivers(id) NOT NULL,

    -- Acknowledgment Details
    acknowledged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledgment_method VARCHAR(50) DEFAULT 'Electronic',

    -- Digital Signature
    signature_data TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Quiz/Test Results
    test_score DECIMAL(5,2),
    test_passed BOOLEAN,
    test_answers JSONB,

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(policy_id, driver_id)
);

-- Indexes for policy_acknowledgments
CREATE INDEX IF NOT EXISTS idx_policy_acknowledgments_policy ON policy_acknowledgments(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_acknowledgments_driver ON policy_acknowledgments(driver_id);
CREATE INDEX IF NOT EXISTS idx_policy_acknowledgments_acknowledged ON policy_acknowledgments(acknowledged_at);

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert a sample active policy if none exists
INSERT INTO policy_templates (
    policy_code,
    policy_name,
    policy_category,
    policy_objective,
    policy_scope,
    policy_content,
    status,
    effective_date,
    execution_enabled
) VALUES (
    'FLT-SAF-001',
    'Vehicle Safety Inspection Policy',
    'Safety',
    'Ensure all vehicles meet safety standards',
    'All fleet vehicles',
    'All vehicles must undergo safety inspection every 90 days',
    'Active',
    CURRENT_DATE,
    TRUE
) ON CONFLICT (policy_code) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
SELECT
    'Policy Engine Tables Created:' as status,
    COUNT(*) FILTER (WHERE table_name = 'policy_templates') as policy_templates,
    COUNT(*) FILTER (WHERE table_name = 'policy_violations') as policy_violations,
    COUNT(*) FILTER (WHERE table_name = 'policy_executions') as policy_executions,
    COUNT(*) FILTER (WHERE table_name = 'policy_acknowledgments') as policy_acknowledgments
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('policy_templates', 'policy_violations', 'policy_executions', 'policy_acknowledgments');
