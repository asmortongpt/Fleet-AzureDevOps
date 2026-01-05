-- ============================================================================
-- Comprehensive Database Schema Expansion for Fleet Management System
-- ============================================================================
-- Includes: Document Management, Knowledge Management, Policy Management,
-- Rules Engines, RAG/CAG Integration, and Complete Enterprise Data Model
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- DOCUMENT MANAGEMENT SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type VARCHAR(100) NOT NULL, -- contract, policy, manual, report, etc.
    title VARCHAR(500) NOT NULL,
    description TEXT,
    file_name VARCHAR(500),
    file_path TEXT,
    file_size BIGINT,
    mime_type VARCHAR(100),
    storage_location VARCHAR(50), -- azure_blob, local, s3, etc.
    storage_url TEXT,
    version VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft', -- draft, review, approved, archived
    security_classification VARCHAR(50), -- public, internal, confidential, secret
    retention_period_days INTEGER,
    expiration_date TIMESTAMP,
    owner_id UUID,
    department VARCHAR(100),
    tags TEXT[], -- Array of tags for categorization
    metadata JSONB, -- Flexible metadata storage
    checksum VARCHAR(64), -- SHA-256 hash
    ocr_text TEXT, -- Extracted text from OCR
    ocr_confidence DECIMAL(5,2),
    embedding vector(1536), -- OpenAI ada-002 embeddings for semantic search
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    deleted_at TIMESTAMP,
    deleted_by UUID
);

CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_metadata ON documents USING GIN(metadata);
CREATE INDEX idx_documents_embedding ON documents USING ivfflat(embedding vector_cosine_ops);
CREATE INDEX idx_documents_ocr_text ON documents USING GIN(to_tsvector('english', ocr_text));

-- Document Versions
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    checksum VARCHAR(64),
    changes_summary TEXT,
    change_type VARCHAR(50), -- minor, major, revision
    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    UNIQUE(document_id, version_number)
);

-- Document Access Log
CREATE TABLE IF NOT EXISTS document_access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID,
    access_type VARCHAR(50), -- view, download, edit, delete
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_doc_access_log_document ON document_access_log(document_id);
CREATE INDEX idx_doc_access_log_user ON document_access_log(user_id);
CREATE INDEX idx_doc_access_log_time ON document_access_log(accessed_at DESC);

-- ============================================================================
-- KNOWLEDGE MANAGEMENT SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) UNIQUE,
    content TEXT NOT NULL,
    summary TEXT,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    keywords TEXT[],
    difficulty_level VARCHAR(50), -- beginner, intermediate, advanced
    estimated_read_time INTEGER, -- in minutes
    article_type VARCHAR(50), -- how-to, troubleshooting, reference, faq
    status VARCHAR(50) DEFAULT 'draft',
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    embedding vector(1536),
    author_id UUID,
    reviewer_id UUID,
    published_at TIMESTAMP,
    last_reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE INDEX idx_knowledge_category ON knowledge_articles(category, subcategory);
CREATE INDEX idx_knowledge_status ON knowledge_articles(status);
CREATE INDEX idx_knowledge_embedding ON knowledge_articles USING ivfflat(embedding vector_cosine_ops);
CREATE INDEX idx_knowledge_content ON knowledge_articles USING GIN(to_tsvector('english', content));

-- Knowledge Article Relationships
CREATE TABLE IF NOT EXISTS knowledge_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_article_id UUID NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
    related_article_id UUID NOT NULL REFERENCES knowledge_articles(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50), -- related, prerequisite, supersedes, see_also
    strength DECIMAL(3,2), -- 0.0 to 1.0
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- POLICY MANAGEMENT SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    policy_type VARCHAR(100) NOT NULL, -- security, compliance, operational, safety
    category VARCHAR(100),
    scope VARCHAR(100), -- company-wide, department, role, location
    priority VARCHAR(50), -- critical, high, medium, low
    status VARCHAR(50) DEFAULT 'draft', -- draft, review, approved, active, archived
    version VARCHAR(50) NOT NULL,
    effective_date DATE,
    expiration_date DATE,
    review_frequency_days INTEGER, -- How often to review
    next_review_date DATE,
    policy_owner_id UUID,
    approver_id UUID,
    approved_at TIMESTAMP,
    content TEXT NOT NULL,
    enforcement_level VARCHAR(50), -- mandatory, recommended, optional
    exceptions_allowed BOOLEAN DEFAULT FALSE,
    penalties TEXT, -- What happens on violation
    related_regulations TEXT[], -- GDPR, HIPAA, SOC2, etc.
    applicability_rules JSONB, -- Complex rules for who/what/when policy applies
    embedding vector(1536),
    document_id UUID REFERENCES documents(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_policies_type ON policies(policy_type);
CREATE INDEX idx_policies_status ON policies(status);
CREATE INDEX idx_policies_effective ON policies(effective_date, expiration_date);
CREATE INDEX idx_policies_embedding ON policies USING ivfflat(embedding vector_cosine_ops);

-- Policy Acknowledgments
CREATE TABLE IF NOT EXISTS policy_acknowledgments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    version_acknowledged VARCHAR(50),
    acknowledged_at TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    signature_data TEXT, -- Digital signature if required
    UNIQUE(policy_id, user_id, version_acknowledged)
);

-- Policy Violations
CREATE TABLE IF NOT EXISTS policy_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id UUID NOT NULL REFERENCES policies(id),
    violated_by_user_id UUID,
    violation_type VARCHAR(100),
    severity VARCHAR(50), -- critical, high, medium, low
    description TEXT,
    evidence JSONB,
    detected_by VARCHAR(100), -- system, manual_report, audit
    detected_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'open', -- open, investigating, resolved, dismissed
    resolution_notes TEXT,
    resolved_at TIMESTAMP,
    resolved_by UUID
);

-- ============================================================================
-- RULES ENGINE
-- ============================================================================

CREATE TABLE IF NOT EXISTS business_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(200) NOT NULL UNIQUE,
    rule_code VARCHAR(100) UNIQUE,
    description TEXT,
    category VARCHAR(100), -- validation, calculation, workflow, compliance
    rule_type VARCHAR(50), -- decision, derivation, constraint, computation
    priority INTEGER DEFAULT 100,
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, testing, archived
    effective_date DATE,
    expiration_date DATE,

    -- Rule Definition (multiple formats supported)
    condition_expression TEXT, -- SQL-like or JSON logic
    condition_json JSONB, -- Structured condition format
    action_expression TEXT,
    action_json JSONB,

    -- Rule execution context
    applies_to VARCHAR(100), -- vehicle, driver, route, maintenance, etc.
    trigger_event VARCHAR(100), -- on_create, on_update, on_delete, scheduled
    execution_order INTEGER DEFAULT 100,

    -- Error handling
    on_error_action VARCHAR(50), -- stop, continue, alert, log
    max_retries INTEGER DEFAULT 0,

    -- Performance
    cache_results BOOLEAN DEFAULT FALSE,
    cache_duration_seconds INTEGER,

    -- Metadata
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_executed_at TIMESTAMP,
    execution_count BIGINT DEFAULT 0,
    success_count BIGINT DEFAULT 0,
    failure_count BIGINT DEFAULT 0
);

CREATE INDEX idx_rules_category ON business_rules(category);
CREATE INDEX idx_rules_status ON business_rules(status);
CREATE INDEX idx_rules_applies_to ON business_rules(applies_to);

-- Rule Execution Log
CREATE TABLE IF NOT EXISTS rule_execution_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID NOT NULL REFERENCES business_rules(id),
    execution_context JSONB, -- Input data
    result JSONB, -- Output data
    success BOOLEAN,
    error_message TEXT,
    execution_time_ms INTEGER,
    executed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rule_exec_rule ON rule_execution_log(rule_id);
CREATE INDEX idx_rule_exec_time ON rule_execution_log(executed_at DESC);

-- ============================================================================
-- RAG (Retrieval-Augmented Generation) SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS code_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_path TEXT NOT NULL,
    file_type VARCHAR(50), -- typescript, javascript, tsx, etc.
    chunk_index INTEGER,
    chunk_content TEXT NOT NULL,
    start_line INTEGER,
    end_line INTEGER,
    function_name VARCHAR(200),
    class_name VARCHAR(200),
    module_name VARCHAR(200),
    context_summary TEXT,
    embedding vector(1536) NOT NULL,
    token_count INTEGER,
    code_quality_score DECIMAL(3,2), -- 0.0 to 1.0
    complexity_score INTEGER,
    has_tests BOOLEAN DEFAULT FALSE,
    test_coverage DECIMAL(5,2),
    last_modified TIMESTAMP,
    indexed_at TIMESTAMP DEFAULT NOW(),
    reindex_needed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_code_embeddings_file ON code_embeddings(file_path);
CREATE INDEX idx_code_embeddings_type ON code_embeddings(file_type);
CREATE INDEX idx_code_embeddings_embedding ON code_embeddings USING ivfflat(embedding vector_cosine_ops);
CREATE INDEX idx_code_embeddings_function ON code_embeddings(function_name);

-- RAG Query Cache
CREATE TABLE IF NOT EXISTS rag_query_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_text TEXT NOT NULL,
    query_embedding vector(1536),
    results JSONB NOT NULL,
    result_count INTEGER,
    relevance_threshold DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW(),
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rag_cache_embedding ON rag_query_cache USING ivfflat(query_embedding vector_cosine_ops);
CREATE INDEX idx_rag_cache_accessed ON rag_query_cache(last_accessed DESC);

-- ============================================================================
-- CAG (Context-Augmented Generation) SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS cag_fix_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_path TEXT NOT NULL,
    issue_type VARCHAR(100), -- bug, security, performance, style, test
    issue_severity VARCHAR(50), -- critical, high, medium, low
    issue_description TEXT NOT NULL,
    context_retrieved JSONB, -- RAG results used
    original_code TEXT,
    suggested_fix TEXT,
    fix_explanation TEXT,
    confidence_score DECIMAL(3,2), -- AI confidence 0.0 to 1.0
    human_approved BOOLEAN,
    approved_by UUID,
    approved_at TIMESTAMP,
    applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP,
    ai_provider VARCHAR(50), -- openai, grok, claude
    model_used VARCHAR(100),
    tokens_used INTEGER,
    generation_time_ms INTEGER,
    quality_iteration INTEGER DEFAULT 1, -- "Is this the best you can do" counter
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cag_file ON cag_fix_requests(file_path);
CREATE INDEX idx_cag_type ON cag_fix_requests(issue_type);
CREATE INDEX idx_cag_severity ON cag_fix_requests(issue_severity);

-- CAG Quality Iterations (for "is this the best you can do" loop)
CREATE TABLE IF NOT EXISTS cag_quality_iterations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fix_request_id UUID NOT NULL REFERENCES cag_fix_requests(id) ON DELETE CASCADE,
    iteration_number INTEGER NOT NULL,
    prompt_used TEXT,
    response_generated TEXT,
    quality_score DECIMAL(3,2),
    improvements_made TEXT[],
    still_needs_improvement BOOLEAN,
    ai_provider VARCHAR(50),
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- AGENT TASK MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_type VARCHAR(100) NOT NULL, -- review, test-gen, security, performance, ux
    priority VARCHAR(50), -- critical, high, medium, low
    status VARCHAR(50) DEFAULT 'pending', -- pending, assigned, running, completed, failed
    target_file TEXT,
    target_component VARCHAR(200),
    context JSONB,
    assigned_agent_id VARCHAR(100),
    agent_provider VARCHAR(50), -- grok, openai, claude
    result JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    progress DECIMAL(3,2) DEFAULT 0.0,
    quality_check_passed BOOLEAN,
    quality_iterations INTEGER DEFAULT 0, -- "Is this the best" counter
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX idx_agent_tasks_type ON agent_tasks(task_type);
CREATE INDEX idx_agent_tasks_agent ON agent_tasks(assigned_agent_id);
CREATE INDEX idx_agent_tasks_created ON agent_tasks(created_at DESC);

-- Agent Performance Metrics
CREATE TABLE IF NOT EXISTS agent_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id VARCHAR(100) NOT NULL,
    agent_provider VARCHAR(50),
    metric_date DATE DEFAULT CURRENT_DATE,
    tasks_assigned INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0,
    average_task_time_ms INTEGER,
    average_quality_score DECIMAL(3,2),
    total_tokens_used BIGINT DEFAULT 0,
    cost_usd DECIMAL(10,2),
    quality_iterations_average DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(agent_id, metric_date)
);

-- ============================================================================
-- QUALITY GATE RESULTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS quality_gate_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gate_name VARCHAR(100) NOT NULL,
    gate_category VARCHAR(50), -- code, security, performance, accessibility
    status VARCHAR(50), -- passed, failed, warning, skipped
    score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    threshold DECIMAL(5,2),
    violations INTEGER DEFAULT 0,
    evidence_hash VARCHAR(64), -- SHA-256
    evidence_signature TEXT, -- Ed25519 signature
    evidence_data JSONB,
    recommendations TEXT[],
    run_id UUID,
    executed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_quality_gate_name ON quality_gate_results(gate_name);
CREATE INDEX idx_quality_gate_status ON quality_gate_results(status);
CREATE INDEX idx_quality_gate_executed ON quality_gate_results(executed_at DESC);

-- ============================================================================
-- COMPREHENSIVE FLEET DATA MODEL
-- ============================================================================

-- Vehicles (Enhanced)
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vin VARCHAR(17) UNIQUE,
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    license_plate VARCHAR(20),
    vehicle_type VARCHAR(50),
    status VARCHAR(50),
    odometer_reading DECIMAL(10,2),
    fuel_type VARCHAR(50),
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    depreciation_rate DECIMAL(5,4),
    current_value DECIMAL(12,2),
    insurance_policy_number VARCHAR(100),
    insurance_expiry DATE,
    registration_expiry DATE,
    telematics_device_id VARCHAR(100),
    home_location_id UUID,
    assigned_driver_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Drivers (Enhanced)
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    license_number VARCHAR(50),
    license_class VARCHAR(10),
    license_expiry DATE,
    hire_date DATE,
    status VARCHAR(50),
    performance_score DECIMAL(3,2),
    safety_score DECIMAL(3,2),
    certifications TEXT[],
    preferred_vehicle_types TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Routes (Enhanced with AI optimization)
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_name VARCHAR(200),
    origin_address TEXT,
    destination_address TEXT,
    waypoints JSONB, -- Array of {lat, lng, address}
    distance_km DECIMAL(10,2),
    estimated_duration_minutes INTEGER,
    optimized_by_ai BOOLEAN DEFAULT FALSE,
    optimization_score DECIMAL(3,2),
    fuel_efficiency_score DECIMAL(3,2),
    safety_score DECIMAL(3,2),
    traffic_pattern JSONB,
    preferred_time_windows JSONB,
    restrictions JSONB, -- Weight, height, hazmat, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Maintenance Records
CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    maintenance_type VARCHAR(100),
    description TEXT,
    service_provider VARCHAR(200),
    cost DECIMAL(10,2),
    odometer_at_service DECIMAL(10,2),
    parts_replaced TEXT[],
    service_date DATE,
    next_service_due DATE,
    next_service_odometer DECIMAL(10,2),
    ai_predicted_next_service DATE, -- AI prediction
    prediction_confidence DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Telematics Data
CREATE TABLE IF NOT EXISTS telematics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    event_type VARCHAR(50), -- harsh_brake, speeding, idle, fuel_level, etc.
    severity VARCHAR(20),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    speed_kmh DECIMAL(5,2),
    fuel_level DECIMAL(5,2),
    engine_temp DECIMAL(5,2),
    event_data JSONB,
    recorded_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_telematics_vehicle ON telematics_events(vehicle_id);
CREATE INDEX idx_telematics_recorded ON telematics_events(recorded_at DESC);
CREATE INDEX idx_telematics_type ON telematics_events(event_type);

-- ============================================================================
-- ANALYTICS & REPORTING
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    snapshot_type VARCHAR(100), -- daily, weekly, monthly, annual
    snapshot_date DATE NOT NULL,
    category VARCHAR(100), -- fleet, maintenance, safety, costs, etc.
    metrics JSONB NOT NULL,
    trends JSONB,
    predictions JSONB, -- AI-powered predictions
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(snapshot_type, snapshot_date, category)
);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

CREATE OR REPLACE VIEW active_policies AS
SELECT * FROM policies
WHERE status = 'active'
AND (expiration_date IS NULL OR expiration_date > CURRENT_DATE)
ORDER BY priority DESC, effective_date DESC;

CREATE OR REPLACE VIEW recent_violations AS
SELECT v.*, p.title as policy_title, p.policy_number
FROM policy_violations v
JOIN policies p ON v.policy_id = p.id
WHERE v.status = 'open'
ORDER BY v.detected_at DESC;

CREATE OR REPLACE VIEW agent_performance_summary AS
SELECT
    agent_id,
    agent_provider,
    SUM(tasks_completed) as total_completed,
    SUM(tasks_failed) as total_failed,
    AVG(average_quality_score) as avg_quality,
    AVG(quality_iterations_average) as avg_quality_iterations,
    SUM(cost_usd) as total_cost
FROM agent_metrics
GROUP BY agent_id, agent_provider
ORDER BY total_completed DESC;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_updated_at BEFORE UPDATE ON knowledge_articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (Optional)
-- ============================================================================

-- Insert default business rules categories
INSERT INTO business_rules (rule_name, rule_code, description, category, applies_to, status)
VALUES
    ('Vehicle Maintenance Due Alert', 'MAINT_001', 'Alert when vehicle maintenance is due within 7 days', 'workflow', 'vehicle', 'active'),
    ('Speed Limit Enforcement', 'SAFETY_001', 'Flag vehicles exceeding speed limits by 10+ kmh', 'compliance', 'telematics', 'active'),
    ('Fuel Efficiency Calculation', 'CALC_001', 'Calculate fuel efficiency based on distance and fuel consumption', 'calculation', 'vehicle', 'active')
ON CONFLICT (rule_code) DO NOTHING;

-- ============================================================================
-- GRANTS (Adjust based on your user setup)
-- ============================================================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO qauser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO qauser;

-- ============================================================================
-- COMPLETION
-- ============================================================================

SELECT 'Database schema expansion completed successfully!' as status;
SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';
