-- ============================================================================
-- AI Chat System Migration
-- ============================================================================
-- Creates chat infrastructure for conversational AI with document Q&A
-- ============================================================================

-- Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(255) NOT NULL,

    -- Session metadata
    title VARCHAR(500) DEFAULT 'New Chat',
    description TEXT,

    -- Document scope (which documents this chat can access)
    document_scope JSONB DEFAULT '[]', -- Array of document IDs

    -- AI configuration
    system_prompt TEXT,
    model_name VARCHAR(100) DEFAULT 'gpt-4-turbo-preview',
    temperature DECIMAL(3, 2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 1000,

    -- Statistics
    message_count INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    total_cost_usd DECIMAL(10, 6) DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP,

    -- Soft delete
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP
);

-- Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,

    -- Message content
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,

    -- Sources (for RAG responses)
    sources JSONB, -- Array of {documentId, score, content}

    -- AI metadata
    model_used VARCHAR(100),
    tokens_used INTEGER,
    cost_usd DECIMAL(10, 6),

    -- Processing info
    processing_time_ms INTEGER,
    error_message TEXT,

    -- User feedback
    feedback_rating INTEGER, -- 1-5
    feedback_helpful BOOLEAN,
    feedback_comment TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_role CHECK (role IN ('user', 'assistant', 'system'))
);

-- Chat session sharing (for team collaboration)
CREATE TABLE IF NOT EXISTS chat_session_shares (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,

    shared_with_user_id VARCHAR(255),
    shared_with_role VARCHAR(100),

    can_view BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_share BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    revoked_at TIMESTAMP
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_chat_sessions_tenant ON chat_sessions(tenant_id);
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_active ON chat_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_chat_sessions_updated ON chat_sessions(updated_at DESC);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_chat_messages_role ON chat_messages(role);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);

CREATE INDEX idx_chat_shares_session ON chat_session_shares(session_id);
CREATE INDEX idx_chat_shares_user ON chat_session_shares(shared_with_user_id);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update session updated_at
CREATE OR REPLACE FUNCTION update_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions
    SET updated_at = NOW(),
        last_message_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_on_message
AFTER INSERT ON chat_messages
FOR EACH ROW EXECUTE FUNCTION update_chat_session_timestamp();

-- Update session statistics
CREATE OR REPLACE FUNCTION update_chat_session_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions
    SET message_count = message_count + 1,
        total_tokens_used = total_tokens_used + COALESCE(NEW.tokens_used, 0),
        total_cost_usd = total_cost_usd + COALESCE(NEW.cost_usd, 0)
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_stats_on_message
AFTER INSERT ON chat_messages
FOR EACH ROW EXECUTE FUNCTION update_chat_session_stats();

-- ============================================================================
-- Views
-- ============================================================================

-- Active chat sessions with latest message
CREATE OR REPLACE VIEW v_active_chat_sessions AS
SELECT
    cs.id,
    cs.tenant_id,
    cs.user_id,
    cs.title,
    cs.message_count,
    cs.created_at,
    cs.updated_at,
    (SELECT content FROM chat_messages
     WHERE session_id = cs.id AND role = 'user'
     ORDER BY created_at DESC LIMIT 1) as last_user_message,
    (SELECT content FROM chat_messages
     WHERE session_id = cs.id AND role = 'assistant'
     ORDER BY created_at DESC LIMIT 1) as last_assistant_message
FROM chat_sessions cs
WHERE cs.is_active = TRUE
ORDER BY cs.updated_at DESC;

-- Chat analytics
CREATE OR REPLACE VIEW v_chat_analytics AS
SELECT
    tenant_id,
    COUNT(DISTINCT id) as total_sessions,
    COUNT(DISTINCT user_id) as unique_users,
    SUM(message_count) as total_messages,
    SUM(total_tokens_used) as total_tokens,
    SUM(total_cost_usd) as total_cost,
    AVG(message_count) as avg_messages_per_session,
    MAX(updated_at) as last_activity
FROM chat_sessions
WHERE is_active = TRUE
GROUP BY tenant_id;

-- ============================================================================
-- Sample data
-- ============================================================================

-- Insert default system prompts
CREATE TABLE IF NOT EXISTS chat_system_prompts (
    id SERIAL PRIMARY KEY,
    prompt_name VARCHAR(100) UNIQUE NOT NULL,
    prompt_text TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO chat_system_prompts (prompt_name, prompt_text, description, is_default) VALUES
(
    'fleet_assistant',
    'You are a helpful AI assistant for fleet management. You help users find information about their fleet operations, vehicles, drivers, maintenance, and compliance.

Guidelines:
- Be concise and professional
- Always cite sources when using document context
- If you don''t know something, say so clearly
- Focus on actionable insights
- Use bullet points for lists
- Include relevant metrics and numbers when available

You have access to the fleet''s document repository and can search through maintenance records, compliance documents, driver information, and operational data.',
    'Default fleet management assistant',
    true
),
(
    'maintenance_expert',
    'You are a fleet maintenance expert. Help users with maintenance schedules, diagnose issues, recommend preventive maintenance, and optimize maintenance costs.

Focus on:
- Preventive maintenance recommendations
- Issue diagnosis and troubleshooting
- Cost optimization strategies
- Compliance with maintenance regulations',
    'Maintenance-focused assistant',
    false
),
(
    'compliance_advisor',
    'You are a fleet compliance advisor. Help users stay compliant with DOT regulations, safety requirements, and industry standards.

Focus on:
- Regulatory compliance (DOT, OSHA, EPA)
- Safety standards and best practices
- Inspection requirements
- Documentation and record-keeping',
    'Compliance-focused assistant',
    false
);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE chat_sessions IS 'Chat sessions for conversational AI with document Q&A';
COMMENT ON TABLE chat_messages IS 'Individual messages within chat sessions';
COMMENT ON TABLE chat_session_shares IS 'Sharing permissions for collaborative chat sessions';

-- Migration complete
