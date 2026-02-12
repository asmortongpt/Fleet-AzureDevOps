-- ============================================================================
-- CTAFleet Spider Certification Orchestration Database Schema
-- ============================================================================
-- Purpose: Track multi-agent certification workflow with evidence and scoring
-- Created: 2026-02-01
-- ============================================================================

-- Drop existing tables if they exist (for fresh start)
DROP TABLE IF EXISTS evidence CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS test_results CASCADE;
DROP TABLE IF EXISTS gate_violations CASCADE;
DROP TABLE IF EXISTS remediation_actions CASCADE;

-- ============================================================================
-- PROJECTS: Top-level certification runs
-- ============================================================================
CREATE TABLE projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'created', -- created, running, gating, remediating, completed, failed
    certification_type VARCHAR(100) NOT NULL DEFAULT 'full_spider',

    -- Preconditions tracking
    preconditions_validated BOOLEAN DEFAULT FALSE,
    preconditions_report JSONB,

    -- Progress tracking
    total_items INTEGER DEFAULT 0,
    tested_items INTEGER DEFAULT 0,
    passed_items INTEGER DEFAULT 0,
    failed_items INTEGER DEFAULT 0,

    -- Scoring
    min_score_threshold INTEGER DEFAULT 990,
    avg_score DECIMAL(6,2),

    -- Timing
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Final certification
    certified BOOLEAN DEFAULT FALSE,
    certification_report JSONB,
    evidence_bundle_path TEXT,

    CONSTRAINT valid_status CHECK (status IN ('created', 'running', 'gating', 'remediating', 'completed', 'failed'))
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- ============================================================================
-- AGENTS: Specialized agent workers
-- ============================================================================
CREATE TABLE agents (
    agent_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    agent_type VARCHAR(100) NOT NULL, -- inventory, ui-test, api-test, service-test, integration-test, ai-test, evidence-collector, scoring, gate-enforcer, remediation
    model VARCHAR(50), -- sonnet, opus, haiku

    status VARCHAR(50) NOT NULL DEFAULT 'idle', -- idle, running, waiting, completed, failed

    -- Capabilities
    capabilities JSONB, -- {can_spawn_subagents: true, max_parallel_tasks: 5}
    constraints JSONB, -- rate limits, resource limits

    -- Progress
    tasks_assigned INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0,

    -- Timing
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Results
    output_summary JSONB,
    error_log TEXT,

    CONSTRAINT valid_agent_status CHECK (status IN ('idle', 'running', 'waiting', 'completed', 'failed'))
);

CREATE INDEX idx_agents_project ON agents(project_id);
CREATE INDEX idx_agents_type ON agents(agent_type);
CREATE INDEX idx_agents_status ON agents(status);

-- ============================================================================
-- TASKS: Individual work units
-- ============================================================================
CREATE TABLE tasks (
    task_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    task_type VARCHAR(100) NOT NULL, -- inventory, test, score, gate, remediate

    -- Task details
    description TEXT,
    priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)

    -- Phase tracking
    phase VARCHAR(50) NOT NULL, -- phase_0, phase_1, phase_2, phase_3, phase_4, phase_5, phase_6

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, assigned, in_progress, completed, failed, blocked

    -- Dependencies
    blocks_on UUID[], -- Array of task_ids that must complete first
    blocked_by_count INTEGER DEFAULT 0,

    -- Assignment
    assigned_to_agent UUID REFERENCES agents(agent_id),

    -- Input/Output
    input_data JSONB,
    output_data JSONB,

    -- Evidence
    evidence_required BOOLEAN DEFAULT TRUE,
    evidence_collected BOOLEAN DEFAULT FALSE,
    evidence_paths TEXT[],

    -- Scoring
    score INTEGER, -- 0-1000
    gate_passed BOOLEAN,

    -- Timing
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    assigned_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Error handling
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,

    CONSTRAINT valid_task_status CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'failed', 'blocked'))
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_phase ON tasks(phase);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_agent ON tasks(assigned_to_agent);

-- ============================================================================
-- TASK_DEPENDENCIES: Explicit task dependency graph
-- ============================================================================
CREATE TABLE task_dependencies (
    dependency_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT no_self_dependency CHECK (task_id != depends_on_task_id),
    UNIQUE (task_id, depends_on_task_id)
);

CREATE INDEX idx_dependencies_task ON task_dependencies(task_id);
CREATE INDEX idx_dependencies_depends_on ON task_dependencies(depends_on_task_id);

-- ============================================================================
-- ASSIGNMENTS: Agent task assignments with timing
-- ============================================================================
CREATE TABLE assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES agents(agent_id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,

    status VARCHAR(50) NOT NULL DEFAULT 'assigned', -- assigned, in_progress, completed, failed

    -- Timing
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Results
    result_summary JSONB,
    error_message TEXT,

    CONSTRAINT valid_assignment_status CHECK (status IN ('assigned', 'in_progress', 'completed', 'failed'))
);

CREATE INDEX idx_assignments_project ON assignments(project_id);
CREATE INDEX idx_assignments_agent ON assignments(agent_id);
CREATE INDEX idx_assignments_task ON assignments(task_id);
CREATE INDEX idx_assignments_status ON assignments(status);

-- ============================================================================
-- INVENTORY_ITEMS: Complete system inventory (UI/API/Services/AI/Integrations)
-- ============================================================================
CREATE TABLE inventory_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,

    -- Item identification
    item_type VARCHAR(100) NOT NULL, -- ui_page, ui_component, api_endpoint, service, job, integration, ai_feature
    name VARCHAR(500) NOT NULL,
    path TEXT, -- route/endpoint path

    -- Categorization
    category VARCHAR(100), -- frontend, backend, infrastructure, ai
    subcategory VARCHAR(100),

    -- Technical details
    technical_details JSONB, -- {method: 'GET', auth_required: true, params: [...]}

    -- Prerequisites
    prerequisites JSONB, -- {role: 'admin', dataset: 'vehicles', toggles: ['feature_x']}

    -- Testing requirements
    expected_behavior TEXT,
    invariants TEXT[],
    evidence_requirements TEXT[],

    -- Scoring rubric
    scoring_rubric JSONB,

    -- Enumeration source
    discovered_by VARCHAR(100), -- code_scan, runtime_discovery, openapi_spec, manual
    source_file TEXT,
    source_line INTEGER,

    -- Status
    tested BOOLEAN DEFAULT FALSE,
    test_task_id UUID REFERENCES tasks(task_id),

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (project_id, item_type, path)
);

CREATE INDEX idx_inventory_project ON inventory_items(project_id);
CREATE INDEX idx_inventory_type ON inventory_items(item_type);
CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_inventory_tested ON inventory_items(tested);

-- ============================================================================
-- TEST_RESULTS: Evidence and results for each inventory item test
-- ============================================================================
CREATE TABLE test_results (
    result_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(item_id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(task_id),

    -- Test execution
    test_run_number INTEGER DEFAULT 1, -- For remediation loops

    -- Evidence artifacts
    evidence_artifacts JSONB, -- {screenshots: [...], traces: [...], logs: [...]}
    evidence_complete BOOLEAN DEFAULT FALSE,

    -- Test outcomes
    status VARCHAR(50) NOT NULL, -- pass, fail, blocked, unknown, not_tested

    -- Gate results
    correctness_gate BOOLEAN, -- Must be TRUE (1000/1000)
    correctness_score INTEGER, -- 0-1000

    accuracy_gate BOOLEAN, -- Must be TRUE where applicable
    accuracy_score INTEGER, -- 0-1000

    -- Overall scoring
    category_scores JSONB, -- {functionality: 950, performance: 980, ...}
    total_score INTEGER, -- 0-1000 weighted total

    -- Pass/fail threshold
    passes_threshold BOOLEAN, -- total_score >= 990

    -- Deductions
    deductions JSONB, -- [{reason: '...', points: 10, evidence_link: '...'}]

    -- Timing
    tested_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Error info
    error_message TEXT,
    blocked_reason TEXT
);

CREATE INDEX idx_results_project ON test_results(project_id);
CREATE INDEX idx_results_item ON test_results(item_id);
CREATE INDEX idx_results_status ON test_results(status);
CREATE INDEX idx_results_score ON test_results(total_score);
CREATE INDEX idx_results_threshold ON test_results(passes_threshold);

-- ============================================================================
-- GATE_VIOLATIONS: Track correctness/accuracy gate failures
-- ============================================================================
CREATE TABLE gate_violations (
    violation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(item_id) ON DELETE CASCADE,
    result_id UUID REFERENCES test_results(result_id),

    -- Violation details
    gate_type VARCHAR(50) NOT NULL, -- correctness, accuracy
    violation_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'critical', -- critical, high, medium, low

    description TEXT NOT NULL,

    -- Evidence
    evidence_link TEXT,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'open', -- open, remediating, resolved, wont_fix

    -- Remediation tracking
    remediation_task_id UUID REFERENCES tasks(task_id),

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMP,

    CONSTRAINT valid_gate_type CHECK (gate_type IN ('correctness', 'accuracy')),
    CONSTRAINT valid_severity CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    CONSTRAINT valid_violation_status CHECK (status IN ('open', 'remediating', 'resolved', 'wont_fix'))
);

CREATE INDEX idx_violations_project ON gate_violations(project_id);
CREATE INDEX idx_violations_item ON gate_violations(item_id);
CREATE INDEX idx_violations_gate_type ON gate_violations(gate_type);
CREATE INDEX idx_violations_status ON gate_violations(status);

-- ============================================================================
-- REMEDIATION_ACTIONS: Track fixes applied during remediation loop
-- ============================================================================
CREATE TABLE remediation_actions (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,

    -- What's being remediated
    item_id UUID REFERENCES inventory_items(item_id),
    violation_id UUID REFERENCES gate_violations(violation_id),

    -- Remediation details
    action_type VARCHAR(100) NOT NULL, -- code_fix, config_change, test_update, rubric_adjustment
    description TEXT NOT NULL,

    -- Implementation
    files_changed TEXT[],
    github_pr_url TEXT,
    commit_sha TEXT,

    -- Assignment
    assigned_to_agent UUID REFERENCES agents(agent_id),
    remediation_task_id UUID REFERENCES tasks(task_id),

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'planned', -- planned, in_progress, testing, completed, failed

    -- Re-test results
    retest_result_id UUID REFERENCES test_results(result_id),
    improvement_score_delta INTEGER, -- Change in score after fix

    -- Timing
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    CONSTRAINT valid_remediation_status CHECK (status IN ('planned', 'in_progress', 'testing', 'completed', 'failed'))
);

CREATE INDEX idx_remediation_project ON remediation_actions(project_id);
CREATE INDEX idx_remediation_item ON remediation_actions(item_id);
CREATE INDEX idx_remediation_violation ON remediation_actions(violation_id);
CREATE INDEX idx_remediation_status ON remediation_actions(status);

-- ============================================================================
-- EVIDENCE: Central evidence artifact registry
-- ============================================================================
CREATE TABLE evidence (
    evidence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,

    -- Links to source
    item_id UUID REFERENCES inventory_items(item_id),
    task_id UUID REFERENCES tasks(task_id),
    result_id UUID REFERENCES test_results(result_id),

    -- Evidence details
    evidence_type VARCHAR(100) NOT NULL, -- screenshot, video, trace, log, request, response, schema, metric
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT,

    -- Metadata
    description TEXT,
    tags TEXT[],
    metadata JSONB,

    -- Verification
    checksum TEXT, -- SHA256 of file
    verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    UNIQUE (project_id, file_path)
);

CREATE INDEX idx_evidence_project ON evidence(project_id);
CREATE INDEX idx_evidence_item ON evidence(item_id);
CREATE INDEX idx_evidence_task ON evidence(task_id);
CREATE INDEX idx_evidence_result ON evidence(result_id);
CREATE INDEX idx_evidence_type ON evidence(evidence_type);

-- ============================================================================
-- VIEWS: Useful aggregations
-- ============================================================================

-- Project summary view
CREATE VIEW project_summary AS
SELECT
    p.project_id,
    p.name,
    p.status,
    p.certified,
    p.total_items,
    p.tested_items,
    p.passed_items,
    p.failed_items,
    p.avg_score,
    COUNT(DISTINCT a.agent_id) AS active_agents,
    COUNT(DISTINCT t.task_id) AS total_tasks,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.task_id END) AS completed_tasks,
    COUNT(DISTINCT gv.violation_id) AS open_violations,
    p.created_at,
    p.completed_at
FROM projects p
LEFT JOIN agents a ON p.project_id = a.project_id
LEFT JOIN tasks t ON p.project_id = t.project_id
LEFT JOIN gate_violations gv ON p.project_id = gv.project_id AND gv.status = 'open'
GROUP BY p.project_id;

-- Leaderboard view (items ranked by score)
CREATE VIEW leaderboard AS
SELECT
    ii.item_id,
    ii.item_type,
    ii.name,
    ii.category,
    tr.total_score,
    tr.passes_threshold,
    tr.correctness_gate,
    tr.accuracy_gate,
    tr.status,
    tr.tested_at,
    RANK() OVER (PARTITION BY ii.item_type ORDER BY tr.total_score DESC) AS rank_in_type,
    RANK() OVER (ORDER BY tr.total_score DESC) AS overall_rank
FROM inventory_items ii
LEFT JOIN LATERAL (
    SELECT *
    FROM test_results
    WHERE item_id = ii.item_id
    ORDER BY test_run_number DESC
    LIMIT 1
) tr ON TRUE
WHERE tr.result_id IS NOT NULL;

-- Agent performance view
CREATE VIEW agent_performance AS
SELECT
    a.agent_id,
    a.name,
    a.agent_type,
    a.status,
    a.tasks_assigned,
    a.tasks_completed,
    a.tasks_failed,
    CASE
        WHEN a.tasks_assigned > 0
        THEN ROUND((a.tasks_completed::DECIMAL / a.tasks_assigned) * 100, 2)
        ELSE 0
    END AS completion_rate_pct,
    EXTRACT(EPOCH FROM (COALESCE(a.completed_at, NOW()) - a.started_at)) / NULLIF(a.tasks_completed, 0) AS avg_task_duration_seconds
FROM agents a;

-- ============================================================================
-- FUNCTIONS: Utility functions
-- ============================================================================

-- Function to update project progress
CREATE OR REPLACE FUNCTION update_project_progress(p_project_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE projects
    SET
        total_items = (SELECT COUNT(*) FROM inventory_items WHERE project_id = p_project_id),
        tested_items = (SELECT COUNT(*) FROM inventory_items WHERE project_id = p_project_id AND tested = TRUE),
        passed_items = (SELECT COUNT(*) FROM test_results tr JOIN inventory_items ii ON tr.item_id = ii.item_id WHERE ii.project_id = p_project_id AND tr.passes_threshold = TRUE),
        failed_items = (SELECT COUNT(*) FROM test_results tr JOIN inventory_items ii ON tr.item_id = ii.item_id WHERE ii.project_id = p_project_id AND tr.passes_threshold = FALSE),
        avg_score = (SELECT AVG(total_score) FROM test_results tr JOIN inventory_items ii ON tr.item_id = ii.item_id WHERE ii.project_id = p_project_id)
    WHERE project_id = p_project_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if task dependencies are met
CREATE OR REPLACE FUNCTION check_task_dependencies_met(p_task_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    unmet_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO unmet_count
    FROM task_dependencies td
    JOIN tasks t ON td.depends_on_task_id = t.task_id
    WHERE td.task_id = p_task_id
    AND t.status != 'completed';

    RETURN unmet_count = 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INITIAL GRANTS (adjust as needed for your user)
-- ============================================================================
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO fleet_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO fleet_user;

-- ============================================================================
-- Schema created successfully
-- ============================================================================
