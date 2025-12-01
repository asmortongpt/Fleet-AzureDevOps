-- ARCHITECT-PRIME Tracking Database Schema

CREATE TABLE IF NOT EXISTS findings (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    target_hours INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    agent_assigned VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assessed_at TIMESTAMP,
    corrected_at TIMESTAMP,
    validated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assessments (
    id SERIAL PRIMARY KEY,
    finding_id VARCHAR(50) REFERENCES findings(id),
    confirmed BOOLEAN NOT NULL,
    affected_files TEXT[],
    impact_analysis TEXT,
    dependencies TEXT[],
    effort_original INTEGER,
    effort_revised INTEGER,
    effort_justification TEXT,
    risk_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS corrections (
    id SERIAL PRIMARY KEY,
    finding_id VARCHAR(50) REFERENCES findings(id),
    assessment_id INTEGER REFERENCES assessments(id),
    files_changed JSONB,
    validation_commands TEXT[],
    breaking_changes TEXT[],
    migration_guide TEXT,
    test_coverage_before DECIMAL(5,2),
    test_coverage_after DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS validations (
    id SERIAL PRIMARY KEY,
    correction_id INTEGER REFERENCES corrections(id),
    validation_type VARCHAR(50) NOT NULL,
    passed BOOLEAN NOT NULL,
    output TEXT,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ui_tasks (
    id VARCHAR(50) PRIMARY KEY,
    task_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    files_to_create TEXT[],
    dependencies TEXT[],
    status VARCHAR(20) DEFAULT 'pending',
    agent_assigned VARCHAR(100),
    result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS code_metrics (
    id SERIAL PRIMARY KEY,
    metric_type VARCHAR(50) NOT NULL,
    file_path TEXT,
    value DECIMAL(10,2),
    baseline_value DECIMAL(10,2),
    improvement_percentage DECIMAL(5,2),
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_performance (
    id SERIAL PRIMARY KEY,
    agent_type VARCHAR(100) NOT NULL,
    task_id VARCHAR(50),
    finding_id VARCHAR(50),
    execution_time_ms INTEGER,
    tokens_used INTEGER,
    cost_usd DECIMAL(10,4),
    success BOOLEAN,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_findings_status ON findings(status);
CREATE INDEX idx_findings_severity ON findings(severity);
CREATE INDEX idx_assessments_finding ON assessments(finding_id);
CREATE INDEX idx_corrections_finding ON corrections(finding_id);
CREATE INDEX idx_validations_correction ON validations(correction_id);
CREATE INDEX idx_ui_tasks_status ON ui_tasks(status);
CREATE INDEX idx_agent_performance_type ON agent_performance(agent_type);
CREATE INDEX idx_agent_performance_created ON agent_performance(created_at);

-- Views for reporting
CREATE OR REPLACE VIEW findings_summary AS
SELECT 
    category,
    severity,
    status,
    COUNT(*) as count,
    SUM(target_hours) as total_hours
FROM findings
GROUP BY category, severity, status;

CREATE OR REPLACE VIEW correction_success_rate AS
SELECT 
    f.category,
    COUNT(*) as total_findings,
    SUM(CASE WHEN f.status = 'corrected' THEN 1 ELSE 0 END) as corrected_count,
    ROUND(100.0 * SUM(CASE WHEN f.status = 'corrected' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM findings f
GROUP BY f.category;

CREATE OR REPLACE VIEW agent_efficiency AS
SELECT 
    agent_type,
    COUNT(*) as tasks_executed,
    AVG(execution_time_ms) as avg_time_ms,
    SUM(cost_usd) as total_cost_usd,
    ROUND(100.0 * SUM(CASE WHEN success THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM agent_performance
GROUP BY agent_type;
