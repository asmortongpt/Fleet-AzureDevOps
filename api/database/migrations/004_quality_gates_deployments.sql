-- Migration: Add Quality Gates and Deployment Tracking
-- Created: 2025-11-10
-- Purpose: Track automated quality checks and deployment history

-- Quality Gates table for tracking automated testing and validation
CREATE TABLE IF NOT EXISTS quality_gates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deployment_id UUID,
    gate_type VARCHAR(50) NOT NULL, -- unit_tests, integration_tests, security_scan, performance, e2e_tests
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'passed', 'failed', 'skipped')),
    result_data JSONB DEFAULT '{}', -- Test results, coverage metrics, scan findings
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    execution_time_seconds DECIMAL(10,2),
    executed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quality_gates_deployment ON quality_gates(deployment_id);
CREATE INDEX idx_quality_gates_status ON quality_gates(status);
CREATE INDEX idx_quality_gates_type ON quality_gates(gate_type);
CREATE INDEX idx_quality_gates_executed_at ON quality_gates(executed_at DESC);

-- Deployments table for tracking deployment history
CREATE TABLE IF NOT EXISTS deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    environment VARCHAR(50) NOT NULL, -- development, staging, production
    version VARCHAR(50),
    commit_hash VARCHAR(100),
    branch VARCHAR(100),
    deployed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    rollback_at TIMESTAMP WITH TIME ZONE,
    deployment_notes TEXT,
    quality_gate_summary JSONB DEFAULT '{}', -- Summary of all quality gate results
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deployments_tenant ON deployments(tenant_id);
CREATE INDEX idx_deployments_environment ON deployments(environment);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_started_at ON deployments(started_at DESC);

-- Add foreign key from quality_gates to deployments
ALTER TABLE quality_gates
    ADD CONSTRAINT fk_quality_gates_deployment
    FOREIGN KEY (deployment_id)
    REFERENCES deployments(id)
    ON DELETE CASCADE;

-- Comments
COMMENT ON TABLE quality_gates IS 'Automated quality checks for deployments including tests, security scans, and performance benchmarks';
COMMENT ON TABLE deployments IS 'Deployment history and status tracking for all environments';
COMMENT ON COLUMN quality_gates.gate_type IS 'Type of quality check: unit_tests, integration_tests, security_scan, performance, e2e_tests, accessibility, code_coverage';
COMMENT ON COLUMN quality_gates.result_data IS 'JSON object containing test results, coverage percentages, security findings, performance metrics';
COMMENT ON COLUMN deployments.quality_gate_summary IS 'Aggregated summary of all quality gate results for this deployment';
