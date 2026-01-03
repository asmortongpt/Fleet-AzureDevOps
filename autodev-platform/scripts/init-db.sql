-- Initialize AutoDev Platform Database
-- PostgreSQL 16 with pgvector extension

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Create schema for RAG embeddings
CREATE SCHEMA IF NOT EXISTS rag;
CREATE SCHEMA IF NOT EXISTS cag;
CREATE SCHEMA IF NOT EXISTS orchestrator;

-- ===========================================================================
-- RAG: Vector embeddings for code and documentation
-- ===========================================================================

CREATE TABLE IF NOT EXISTS rag.embeddings (
    id BIGSERIAL PRIMARY KEY,
    namespace VARCHAR(255) NOT NULL,
    chunk_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    file_path TEXT,
    line_start INTEGER,
    line_end INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(namespace, chunk_id)
);

-- Indexes for vector similarity search
CREATE INDEX IF NOT EXISTS idx_embeddings_namespace ON rag.embeddings(namespace);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON rag.embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_embeddings_metadata ON rag.embeddings USING gin (metadata);
CREATE INDEX IF NOT EXISTS idx_embeddings_file_path ON rag.embeddings(file_path);

-- Namespaces for different knowledge domains
-- rag_fleet_core: Fleet Management System codebase
-- rag_platform_core: AutoDev platform internals
-- rag_external_patterns: Best practices and patterns from external sources

-- ===========================================================================
-- CAG: Structured specifications and artifacts
-- ===========================================================================

CREATE TABLE IF NOT EXISTS cag.artifacts (
    id BIGSERIAL PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL,
    artifact_type VARCHAR(100) NOT NULL, -- architecture, domain_model, api_contracts, etc.
    version INTEGER DEFAULT 1,
    content JSONB NOT NULL,
    schema_version VARCHAR(50) DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, artifact_type, version)
);

CREATE INDEX IF NOT EXISTS idx_artifacts_project ON cag.artifacts(project_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON cag.artifacts(artifact_type);
CREATE INDEX IF NOT EXISTS idx_artifacts_content ON cag.artifacts USING gin (content);

-- Artifact types:
-- architecture: System architecture and component diagrams
-- domain_model: Domain entities, value objects, aggregates
-- api_contracts: API specifications and contracts
-- test_strategy: Testing approach and requirements
-- deployment_spec: Deployment and infrastructure requirements
-- security_requirements: Security controls and requirements

-- ===========================================================================
-- Orchestrator: State machine and work items
-- ===========================================================================

CREATE TYPE orchestrator.work_item_status AS ENUM (
    'pending',
    'queued',
    'in_progress',
    'verifying',
    'reflection',
    'completed',
    'failed',
    'blocked'
);

CREATE TYPE orchestrator.work_item_type AS ENUM (
    'feature',
    'bugfix',
    'refactor',
    'test',
    'docs',
    'security',
    'performance'
);

CREATE TABLE IF NOT EXISTS orchestrator.projects (
    id BIGSERIAL PRIMARY KEY,
    project_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    repository_url TEXT,
    repository_path TEXT,
    target_environment VARCHAR(50) DEFAULT 'production',
    config JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orchestrator.work_items (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES orchestrator.projects(id) ON DELETE CASCADE,
    work_item_id VARCHAR(255) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type orchestrator.work_item_type NOT NULL,
    status orchestrator.work_item_status DEFAULT 'pending',
    priority INTEGER DEFAULT 0,

    -- Dependencies
    depends_on BIGINT[] DEFAULT '{}',
    blocked_by BIGINT[] DEFAULT '{}',

    -- Branch management
    branch_name VARCHAR(255),
    file_scope TEXT[], -- Files this work item is allowed to modify

    -- Implementation tracking
    implementation JSONB DEFAULT '{}',
    verification_results JSONB DEFAULT '{}',
    reflection_verdict JSONB DEFAULT '{}',

    -- Evidence and artifacts
    test_coverage DECIMAL(5,2),
    security_scan_results JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',

    -- Metadata
    assigned_to VARCHAR(255), -- Agent or user
    estimated_effort INTEGER, -- Story points or hours
    actual_effort INTEGER,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_work_items_project ON orchestrator.work_items(project_id);
CREATE INDEX IF NOT EXISTS idx_work_items_status ON orchestrator.work_items(status);
CREATE INDEX IF NOT EXISTS idx_work_items_type ON orchestrator.work_items(type);
CREATE INDEX IF NOT EXISTS idx_work_items_priority ON orchestrator.work_items(priority DESC);

CREATE TABLE IF NOT EXISTS orchestrator.state_transitions (
    id BIGSERIAL PRIMARY KEY,
    work_item_id BIGINT REFERENCES orchestrator.work_items(id) ON DELETE CASCADE,
    from_state orchestrator.work_item_status,
    to_state orchestrator.work_item_status NOT NULL,
    reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_state_transitions_work_item ON orchestrator.state_transitions(work_item_id);

-- ===========================================================================
-- Quality Gates: Track gate executions and results
-- ===========================================================================

CREATE TABLE IF NOT EXISTS orchestrator.quality_gates (
    id BIGSERIAL PRIMARY KEY,
    work_item_id BIGINT REFERENCES orchestrator.work_items(id) ON DELETE CASCADE,
    gate_name VARCHAR(100) NOT NULL,
    gate_type VARCHAR(50) NOT NULL, -- lint, test, security, coverage, etc.
    status VARCHAR(50) NOT NULL, -- pass, fail, warning
    results JSONB NOT NULL,
    evidence_path TEXT,
    execution_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quality_gates_work_item ON orchestrator.quality_gates(work_item_id);
CREATE INDEX IF NOT EXISTS idx_quality_gates_status ON orchestrator.quality_gates(status);

-- ===========================================================================
-- Celery Tasks: Track async task execution
-- ===========================================================================

CREATE TABLE IF NOT EXISTS orchestrator.celery_tasks (
    id BIGSERIAL PRIMARY KEY,
    task_id VARCHAR(255) UNIQUE NOT NULL,
    work_item_id BIGINT REFERENCES orchestrator.work_items(id) ON DELETE CASCADE,
    task_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- pending, started, success, failure, retry
    args JSONB DEFAULT '{}',
    kwargs JSONB DEFAULT '{}',
    result JSONB,
    error TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_celery_tasks_task_id ON orchestrator.celery_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_celery_tasks_work_item ON orchestrator.celery_tasks(work_item_id);
CREATE INDEX IF NOT EXISTS idx_celery_tasks_status ON orchestrator.celery_tasks(status);

-- ===========================================================================
-- Audit Log: Track all platform operations
-- ===========================================================================

CREATE TABLE IF NOT EXISTS orchestrator.audit_log (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES orchestrator.projects(id) ON DELETE CASCADE,
    work_item_id BIGINT REFERENCES orchestrator.work_items(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    user_id VARCHAR(255),
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_project ON orchestrator.audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_work_item ON orchestrator.audit_log(work_item_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON orchestrator.audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON orchestrator.audit_log(created_at DESC);

-- ===========================================================================
-- Helper Functions
-- ===========================================================================

-- Function to search RAG embeddings by semantic similarity
CREATE OR REPLACE FUNCTION rag.search_embeddings(
    query_embedding vector(1536),
    search_namespace VARCHAR(255),
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    chunk_id VARCHAR(255),
    content TEXT,
    metadata JSONB,
    file_path TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.chunk_id,
        e.content,
        e.metadata,
        e.file_path,
        1 - (e.embedding <=> query_embedding) AS similarity
    FROM rag.embeddings e
    WHERE e.namespace = search_namespace
    ORDER BY e.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get next work items (topological sort considering dependencies)
CREATE OR REPLACE FUNCTION orchestrator.get_next_work_items(
    p_project_id BIGINT,
    limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    work_item_id VARCHAR(255),
    title TEXT,
    priority INTEGER,
    type orchestrator.work_item_type
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        wi.work_item_id,
        wi.title,
        wi.priority,
        wi.type
    FROM orchestrator.work_items wi
    WHERE
        wi.project_id = p_project_id
        AND wi.status = 'pending'
        AND NOT EXISTS (
            SELECT 1
            FROM UNNEST(wi.depends_on) dep_id
            JOIN orchestrator.work_items dep ON dep.id = dep_id
            WHERE dep.status != 'completed'
        )
    ORDER BY wi.priority DESC, wi.created_at ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ===========================================================================
-- Initial Data
-- ===========================================================================

-- Insert default project
INSERT INTO orchestrator.projects (project_id, name, repository_url, target_environment)
VALUES ('demo_app', 'Demo Application', '/workspace/demo_app', 'production')
ON CONFLICT (project_id) DO NOTHING;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA rag TO autodev;
GRANT ALL PRIVILEGES ON SCHEMA cag TO autodev;
GRANT ALL PRIVILEGES ON SCHEMA orchestrator TO autodev;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA rag TO autodev;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cag TO autodev;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA orchestrator TO autodev;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA rag TO autodev;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA cag TO autodev;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA orchestrator TO autodev;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_rag_embeddings_updated_at BEFORE UPDATE ON rag.embeddings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cag_artifacts_updated_at BEFORE UPDATE ON cag.artifacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON orchestrator.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_items_updated_at BEFORE UPDATE ON orchestrator.work_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
