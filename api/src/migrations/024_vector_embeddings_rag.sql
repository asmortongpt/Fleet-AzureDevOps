-- ============================================================================
-- Vector Embeddings & RAG System Migration
-- ============================================================================
-- Creates comprehensive vector embedding infrastructure for RAG:
-- - Document embeddings table with pgvector support
-- - Multiple distance metric indexes
-- - Embedding versioning and lineage
-- - Query history and analytics
-- - Feedback loop for continuous improvement
-- ============================================================================

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- Main Document Embeddings Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_embeddings (
    id SERIAL PRIMARY KEY,

    -- Tenant isolation
    tenant_id VARCHAR(100) NOT NULL,

    -- Document reference
    document_id VARCHAR(255) NOT NULL,
    chunk_id VARCHAR(255), -- For multi-chunk documents
    chunk_index INTEGER DEFAULT 0,

    -- Content
    content TEXT NOT NULL,
    content_hash VARCHAR(64), -- SHA-256 hash for deduplication

    -- Vector embedding (supports various dimensions)
    embedding vector(1536), -- Default: OpenAI ada-002/text-embedding-3-small
    embedding_large vector(3072), -- OpenAI text-embedding-3-large
    embedding_small vector(384), -- Local models (all-MiniLM-L6-v2)

    -- Embedding metadata
    embedding_provider VARCHAR(50) NOT NULL, -- 'openai', 'cohere', 'local'
    embedding_model VARCHAR(100) NOT NULL,
    embedding_dimensions INTEGER NOT NULL,
    embedding_version VARCHAR(50), -- Track model versions

    -- Chunking information
    chunk_strategy VARCHAR(50), -- 'semantic', 'fixed', 'sentence', 'paragraph'
    chunk_size INTEGER, -- Size in tokens
    chunk_overlap INTEGER, -- Overlap in tokens
    token_count INTEGER,

    -- Source metadata
    source_type VARCHAR(50), -- 'document', 'conversation', 'knowledge_base', 'web_page'
    source_id VARCHAR(255),
    page_number INTEGER,
    section_title VARCHAR(500),

    -- Additional metadata (flexible JSON)
    metadata JSONB DEFAULT '{}',

    -- Processing info
    processing_time_ms INTEGER,
    cost_usd DECIMAL(10, 6),

    -- Quality metrics
    content_quality_score DECIMAL(5, 4), -- AI-assessed quality
    relevance_score DECIMAL(5, 4), -- Domain relevance

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- For temporary/cached embeddings

    -- Soft delete
    is_active BOOLEAN DEFAULT TRUE,
    deleted_at TIMESTAMP,

    -- Unique constraint
    CONSTRAINT unique_tenant_document_chunk UNIQUE (tenant_id, document_id, chunk_index)
);

-- ============================================================================
-- Embedding Collections (for organizing embeddings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS embedding_collections (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,

    collection_name VARCHAR(255) NOT NULL,
    collection_type VARCHAR(100), -- 'documents', 'knowledge_base', 'conversations', 'custom'
    description TEXT,

    -- Collection settings
    embedding_provider VARCHAR(50) NOT NULL,
    embedding_model VARCHAR(100) NOT NULL,
    embedding_dimensions INTEGER NOT NULL,
    distance_metric VARCHAR(20) DEFAULT 'cosine', -- 'cosine', 'l2', 'inner_product'

    -- Statistics
    total_embeddings INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost_usd DECIMAL(12, 6) DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    CONSTRAINT unique_tenant_collection UNIQUE (tenant_id, collection_name)
);

-- ============================================================================
-- RAG Query History
-- ============================================================================

CREATE TABLE IF NOT EXISTS rag_queries (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,

    -- Query information
    query_text TEXT NOT NULL,
    query_embedding vector(1536),
    query_type VARCHAR(50), -- 'semantic_search', 'qa', 'summarization', 'chat'

    -- User context
    user_id VARCHAR(255),
    session_id VARCHAR(255),

    -- Search parameters
    search_strategy VARCHAR(50), -- 'vector', 'keyword', 'hybrid'
    max_results INTEGER,
    min_similarity DECIMAL(5, 4),
    filters JSONB,

    -- Results
    results_count INTEGER,
    results JSONB, -- Store result IDs and scores
    top_similarity_score DECIMAL(5, 4),

    -- Response
    response_text TEXT,
    response_model VARCHAR(100), -- AI model used for generation
    response_tokens INTEGER,

    -- Performance metrics
    search_time_ms INTEGER,
    generation_time_ms INTEGER,
    total_time_ms INTEGER,
    cost_usd DECIMAL(10, 6),

    -- User feedback
    feedback_rating INTEGER, -- 1-5 stars
    feedback_helpful BOOLEAN,
    feedback_comment TEXT,
    feedback_at TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Document Classification Results
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_classifications (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,
    document_id VARCHAR(255) NOT NULL,

    -- Classification
    detected_type VARCHAR(100) NOT NULL, -- 'invoice', 'receipt', 'contract', 'report', etc.
    confidence DECIMAL(5, 4) NOT NULL,

    -- Category hierarchy
    primary_category VARCHAR(100),
    secondary_category VARCHAR(100),
    tags TEXT[],

    -- AI model info
    model_name VARCHAR(100),
    model_version VARCHAR(50),

    -- Processing
    processing_time_ms INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_tenant_document_classification UNIQUE (tenant_id, document_id)
);

-- ============================================================================
-- Extracted Entities
-- ============================================================================

CREATE TABLE IF NOT EXISTS extracted_entities (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,
    document_id VARCHAR(255) NOT NULL,

    -- Entity information
    entity_type VARCHAR(100) NOT NULL, -- 'date', 'amount', 'vendor', 'person', 'location', 'vehicle_id'
    entity_value TEXT NOT NULL,
    entity_normalized TEXT, -- Normalized/standardized value

    -- Context
    context_text TEXT, -- Surrounding text
    position_start INTEGER,
    position_end INTEGER,
    page_number INTEGER,

    -- Confidence
    confidence DECIMAL(5, 4),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Document Summaries
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_summaries (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL,
    document_id VARCHAR(255) NOT NULL,

    -- Summary types
    summary_type VARCHAR(50), -- 'brief', 'detailed', 'executive', 'technical'
    summary_text TEXT NOT NULL,

    -- Key points
    key_points TEXT[],
    keywords TEXT[],

    -- Sentiment analysis
    sentiment VARCHAR(20), -- 'positive', 'negative', 'neutral'
    sentiment_score DECIMAL(5, 4),

    -- AI model
    model_name VARCHAR(100),

    -- Metrics
    original_length INTEGER,
    summary_length INTEGER,
    compression_ratio DECIMAL(5, 2),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_tenant_document_summary_type UNIQUE (tenant_id, document_id, summary_type)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Vector similarity indexes (different distance metrics)
CREATE INDEX IF NOT EXISTS idx_embeddings_vector_cosine ON document_embeddings
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_embeddings_vector_l2 ON document_embeddings
USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_embeddings_vector_inner ON document_embeddings
USING ivfflat (embedding vector_ip_ops) WITH (lists = 100);

-- Large embeddings indexes
CREATE INDEX IF NOT EXISTS idx_embeddings_large_cosine ON document_embeddings
USING ivfflat (embedding_large vector_cosine_ops) WITH (lists = 100)
WHERE embedding_large IS NOT NULL;

-- Small embeddings indexes
CREATE INDEX IF NOT EXISTS idx_embeddings_small_cosine ON document_embeddings
USING ivfflat (embedding_small vector_cosine_ops) WITH (lists = 100)
WHERE embedding_small IS NOT NULL;

-- Standard B-tree indexes
CREATE INDEX IF NOT EXISTS idx_embeddings_tenant ON document_embeddings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_document ON document_embeddings(document_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_source ON document_embeddings(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_created ON document_embeddings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_embeddings_active ON document_embeddings(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_embeddings_provider ON document_embeddings(embedding_provider, embedding_model);

-- Content hash index for deduplication
CREATE INDEX IF NOT EXISTS idx_embeddings_hash ON document_embeddings(content_hash);

-- Metadata indexes (GIN for JSONB)
CREATE INDEX IF NOT EXISTS idx_embeddings_metadata ON document_embeddings USING GIN(metadata);

-- Collections indexes
CREATE INDEX IF NOT EXISTS idx_collections_tenant ON embedding_collections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_collections_active ON embedding_collections(is_active) WHERE is_active = TRUE;

-- Query history indexes
CREATE INDEX IF NOT EXISTS idx_queries_tenant ON rag_queries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_queries_user ON rag_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_queries_session ON rag_queries(session_id);
CREATE INDEX IF NOT EXISTS idx_queries_created ON rag_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_queries_rating ON rag_queries(feedback_rating) WHERE feedback_rating IS NOT NULL;

-- Classification indexes
CREATE INDEX IF NOT EXISTS idx_classifications_tenant ON document_classifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_classifications_type ON document_classifications(detected_type);
CREATE INDEX IF NOT EXISTS idx_classifications_document ON document_classifications(document_id);

-- Entity indexes
CREATE INDEX IF NOT EXISTS idx_entities_tenant ON extracted_entities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entities_document ON extracted_entities(document_id);
CREATE INDEX IF NOT EXISTS idx_entities_type ON extracted_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_entities_value ON extracted_entities(entity_normalized);

-- Summary indexes
CREATE INDEX IF NOT EXISTS idx_summaries_tenant ON document_summaries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_summaries_document ON document_summaries(document_id);
CREATE INDEX IF NOT EXISTS idx_summaries_type ON document_summaries(summary_type);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_embeddings_updated_at
BEFORE UPDATE ON document_embeddings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_embedding_collections_updated_at
BEFORE UPDATE ON embedding_collections
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate content hash
CREATE OR REPLACE FUNCTION generate_content_hash()
RETURNS TRIGGER AS $$
BEGIN
    NEW.content_hash = encode(digest(NEW.content, 'sha256'), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_embedding_content_hash
BEFORE INSERT ON document_embeddings
FOR EACH ROW EXECUTE FUNCTION generate_content_hash();

-- Update collection statistics
CREATE OR REPLACE FUNCTION update_collection_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE embedding_collections
        SET total_embeddings = total_embeddings + 1,
            total_tokens = total_tokens + COALESCE(NEW.token_count, 0),
            total_cost_usd = total_cost_usd + COALESCE(NEW.cost_usd, 0)
        WHERE tenant_id = NEW.tenant_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE embedding_collections
        SET total_embeddings = GREATEST(0, total_embeddings - 1),
            total_tokens = GREATEST(0, total_tokens - COALESCE(OLD.token_count, 0)),
            total_cost_usd = GREATEST(0, total_cost_usd - COALESCE(OLD.cost_usd, 0))
        WHERE tenant_id = OLD.tenant_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_embedding_collection_stats
AFTER INSERT OR DELETE ON document_embeddings
FOR EACH ROW EXECUTE FUNCTION update_collection_stats();

-- ============================================================================
-- Utility Functions
-- ============================================================================

-- Cosine similarity function
CREATE OR REPLACE FUNCTION cosine_similarity(a vector, b vector)
RETURNS DECIMAL AS $$
BEGIN
    RETURN 1 - (a <=> b);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Find similar embeddings
CREATE OR REPLACE FUNCTION find_similar_embeddings(
    query_embedding vector,
    p_tenant_id VARCHAR,
    p_limit INTEGER DEFAULT 10,
    p_min_score DECIMAL DEFAULT 0.7
)
RETURNS TABLE (
    document_id VARCHAR,
    content TEXT,
    similarity_score DECIMAL,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        de.document_id,
        de.content,
        (1 - (de.embedding <=> query_embedding))::DECIMAL as similarity_score,
        de.metadata
    FROM document_embeddings de
    WHERE de.tenant_id = p_tenant_id
        AND de.is_active = TRUE
        AND (1 - (de.embedding <=> query_embedding)) >= p_min_score
    ORDER BY de.embedding <=> query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Views for Analytics
-- ============================================================================

-- Embedding statistics view
CREATE OR REPLACE VIEW v_embedding_statistics AS
SELECT
    tenant_id,
    embedding_provider,
    embedding_model,
    COUNT(*) as total_embeddings,
    SUM(token_count) as total_tokens,
    SUM(cost_usd) as total_cost,
    AVG(processing_time_ms) as avg_processing_time,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM document_embeddings
WHERE is_active = TRUE
GROUP BY tenant_id, embedding_provider, embedding_model;

-- Query performance view
CREATE OR REPLACE VIEW v_query_performance AS
SELECT
    tenant_id,
    query_type,
    search_strategy,
    COUNT(*) as total_queries,
    AVG(total_time_ms) as avg_response_time,
    AVG(results_count) as avg_results,
    AVG(top_similarity_score) as avg_similarity,
    AVG(CASE WHEN feedback_rating IS NOT NULL THEN feedback_rating END) as avg_rating,
    COUNT(CASE WHEN feedback_helpful = TRUE THEN 1 END) as helpful_count,
    COUNT(CASE WHEN feedback_helpful = FALSE THEN 1 END) as not_helpful_count
FROM rag_queries
GROUP BY tenant_id, query_type, search_strategy;

-- Document processing stats
CREATE OR REPLACE VIEW v_document_processing_stats AS
SELECT
    d.tenant_id,
    COUNT(DISTINCT de.document_id) as documents_with_embeddings,
    COUNT(DISTINCT dc.document_id) as documents_classified,
    COUNT(DISTINCT ds.document_id) as documents_summarized,
    COUNT(DISTINCT ee.document_id) as documents_with_entities
FROM documents d
LEFT JOIN document_embeddings de ON d.id::VARCHAR = de.document_id AND d.tenant_id = de.tenant_id
LEFT JOIN document_classifications dc ON d.id::VARCHAR = dc.document_id AND d.tenant_id = dc.tenant_id
LEFT JOIN document_summaries ds ON d.id::VARCHAR = ds.document_id AND d.tenant_id = ds.tenant_id
LEFT JOIN extracted_entities ee ON d.id::VARCHAR = ee.document_id AND d.tenant_id = ee.tenant_id
GROUP BY d.tenant_id;

-- ============================================================================
-- Sample Data / Initial Collections
-- ============================================================================

INSERT INTO embedding_collections (tenant_id, collection_name, collection_type, embedding_provider, embedding_model, embedding_dimensions)
VALUES
    ('default', 'documents', 'documents', 'openai', 'text-embedding-3-small', 1536),
    ('default', 'knowledge_base', 'knowledge_base', 'openai', 'text-embedding-3-small', 1536),
    ('default', 'conversations', 'conversations', 'openai', 'text-embedding-3-small', 1536)
ON CONFLICT (tenant_id, collection_name) DO NOTHING;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE document_embeddings IS 'Vector embeddings for RAG semantic search with multiple embedding provider support';
COMMENT ON TABLE embedding_collections IS 'Logical groupings of embeddings with shared configuration';
COMMENT ON TABLE rag_queries IS 'Query history and analytics for RAG system with user feedback';
COMMENT ON TABLE document_classifications IS 'AI-powered document type classification results';
COMMENT ON TABLE extracted_entities IS 'Named entities extracted from documents (dates, amounts, names, etc.)';
COMMENT ON TABLE document_summaries IS 'AI-generated document summaries with sentiment analysis';

COMMENT ON COLUMN document_embeddings.embedding IS 'Vector embedding (1536-dim for OpenAI ada-002/text-embedding-3-small)';
COMMENT ON COLUMN document_embeddings.embedding_large IS 'Large vector embedding (3072-dim for OpenAI text-embedding-3-large)';
COMMENT ON COLUMN document_embeddings.embedding_small IS 'Small vector embedding (384-dim for local models)';
COMMENT ON COLUMN document_embeddings.content_hash IS 'SHA-256 hash for deduplication and content integrity';

-- ============================================================================
-- Migration Complete
-- ============================================================================
