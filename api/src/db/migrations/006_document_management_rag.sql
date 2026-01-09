-- Migration 006: Document Management & RAG System Tables
-- Created: 2026-01-08
-- Description: Complete document management with AI/RAG capabilities, version control, and collaboration

-- Ensure vector extension is enabled for RAG embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- DOCUMENT FOLDERS - Hierarchical Folder Structure
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    folder_name VARCHAR(255) NOT NULL,
    parent_folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
    path TEXT,  -- Materialized path: /parent/child/grandchild
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',  -- Hex color
    icon VARCHAR(50) DEFAULT 'folder',
    access_control JSONB DEFAULT '{"users": [], "roles": [], "departments": []}'::jsonb,
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE INDEX idx_document_folders_tenant_parent ON document_folders(tenant_id, parent_folder_id);
CREATE INDEX idx_document_folders_path ON document_folders(path);
CREATE INDEX idx_document_folders_tenant_name ON document_folders(tenant_id, folder_name);

COMMENT ON TABLE document_folders IS 'Hierarchical folder structure for document organization';

-- ============================================================================
-- DOCUMENTS - Document Metadata and Storage
-- ============================================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_name VARCHAR(500) NOT NULL,
    description TEXT,
    file_type VARCHAR(50),  -- 'pdf', 'docx', 'xlsx', 'jpg', 'png', 'txt', 'csv'
    file_size_bytes BIGINT,
    file_url TEXT NOT NULL,  -- Azure Blob Storage URL or file path
    thumbnail_url TEXT,
    folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL,
    uploaded_by_user_id UUID NOT NULL,

    -- Entity linking
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    entity_type VARCHAR(50),  -- 'vehicle', 'driver', 'policy', 'maintenance', 'expense', 'work_order'
    entity_id UUID,

    -- Version control
    version INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,  -- Previous version

    -- Classification and search
    tags TEXT[] DEFAULT '{}',

    -- AI/RAG features
    is_scanned_ai BOOLEAN DEFAULT FALSE,
    ai_extracted_text TEXT,  -- Full text extraction from Claude/OCR
    ai_metadata JSONB,  -- {entities: [], keywords: [], summary: '', confidence: 0.95}
    embedding_vector vector(1536),  -- OpenAI ada-002 or similar embeddings

    -- Access control
    access_control JSONB DEFAULT '{"users": [], "roles": [], "departments": []}'::jsonb,

    -- Retention and archival
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    retention_date DATE,  -- Auto-delete date

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_file_type CHECK (file_type IN ('pdf', 'docx', 'xlsx', 'doc', 'xls', 'txt', 'csv', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'zip', 'rar', 'other'))
);

CREATE INDEX idx_documents_tenant ON documents(tenant_id, created_at DESC);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id) WHERE entity_type IS NOT NULL;
CREATE INDEX idx_documents_folder ON documents(folder_id, created_at DESC) WHERE folder_id IS NOT NULL;
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by_user_id, created_at DESC);
CREATE INDEX idx_documents_tags ON documents USING GIN (tags);
CREATE INDEX idx_documents_vehicle ON documents(vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX idx_documents_driver ON documents(driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_documents_archived ON documents(is_archived, archived_at) WHERE is_archived = TRUE;
CREATE INDEX idx_documents_retention ON documents(retention_date) WHERE retention_date IS NOT NULL;
CREATE INDEX idx_documents_version ON documents(parent_document_id, version) WHERE parent_document_id IS NOT NULL;
CREATE INDEX idx_documents_ai_scanned ON documents(is_scanned_ai, created_at DESC);

-- Vector similarity search index (IVFFlat for approximate nearest neighbor)
CREATE INDEX idx_documents_embedding ON documents USING ivfflat (embedding_vector vector_cosine_ops)
    WITH (lists = 100) WHERE embedding_vector IS NOT NULL;

-- Full-text search on extracted text
CREATE INDEX idx_documents_ai_text_search ON documents USING GIN (to_tsvector('english', ai_extracted_text))
    WHERE ai_extracted_text IS NOT NULL;

COMMENT ON TABLE documents IS 'Document metadata with AI extraction and RAG embedding support';
COMMENT ON COLUMN documents.embedding_vector IS 'Vector embeddings for semantic search (1536 dimensions for OpenAI ada-002)';
COMMENT ON COLUMN documents.ai_extracted_text IS 'Full text extracted via Claude/OCR for search and analysis';

-- ============================================================================
-- DOCUMENT SHARES - Document Sharing and Permissions
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    shared_by_user_id UUID NOT NULL,

    -- Share target (one of these should be set)
    shared_with_user_id UUID,
    shared_with_role VARCHAR(100),
    shared_with_department VARCHAR(100),

    permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('view', 'comment', 'edit', 'admin')),

    -- Share settings
    expires_at TIMESTAMPTZ,
    can_reshare BOOLEAN DEFAULT FALSE,

    -- Public sharing
    share_link VARCHAR(255) UNIQUE,  -- Unique shareable link
    share_link_password VARCHAR(255),  -- Optional password protection (hashed)

    -- Usage tracking
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT share_target_check CHECK (
        (shared_with_user_id IS NOT NULL)::INTEGER +
        (shared_with_role IS NOT NULL)::INTEGER +
        (shared_with_department IS NOT NULL)::INTEGER +
        (share_link IS NOT NULL)::INTEGER = 1
    )
);

CREATE INDEX idx_document_shares_document ON document_shares(document_id);
CREATE INDEX idx_document_shares_user ON document_shares(shared_with_user_id) WHERE shared_with_user_id IS NOT NULL;
CREATE INDEX idx_document_shares_role ON document_shares(shared_with_role) WHERE shared_with_role IS NOT NULL;
CREATE INDEX idx_document_shares_department ON document_shares(shared_with_department) WHERE shared_with_department IS NOT NULL;
CREATE INDEX idx_document_shares_link ON document_shares(share_link) WHERE share_link IS NOT NULL;
CREATE INDEX idx_document_shares_expires ON document_shares(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE document_shares IS 'Document sharing permissions and public links';

-- ============================================================================
-- DOCUMENT VERSIONS - Version History
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    change_description TEXT,
    changed_by_user_id UUID NOT NULL,
    checksum VARCHAR(64),  -- SHA-256 hash for integrity verification
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(document_id, version_number)
);

CREATE INDEX idx_document_versions_document ON document_versions(document_id, version_number DESC);
CREATE INDEX idx_document_versions_changed_by ON document_versions(changed_by_user_id, created_at DESC);
CREATE INDEX idx_document_versions_current ON document_versions(document_id, is_current) WHERE is_current = TRUE;

COMMENT ON TABLE document_versions IS 'Complete version history for all documents';

-- ============================================================================
-- DOCUMENT COMMENTS - Collaborative Annotations
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    comment_text TEXT NOT NULL,

    -- Position for PDF annotations
    page_number INTEGER,
    position_x DECIMAL(5, 2),  -- Percentage position (0-100)
    position_y DECIMAL(5, 2),  -- Percentage position (0-100)

    -- Threading
    reply_to_comment_id UUID REFERENCES document_comments(id) ON DELETE CASCADE,
    thread_depth INTEGER DEFAULT 0,

    -- Resolution tracking
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by_user_id UUID,
    resolved_at TIMESTAMPTZ,

    -- Mentions
    mentioned_user_ids UUID[] DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_position CHECK (
        (position_x IS NULL AND position_y IS NULL) OR
        (position_x >= 0 AND position_x <= 100 AND position_y >= 0 AND position_y <= 100)
    )
);

CREATE INDEX idx_document_comments_document ON document_comments(document_id, created_at DESC);
CREATE INDEX idx_document_comments_user ON document_comments(user_id, created_at DESC);
CREATE INDEX idx_document_comments_thread ON document_comments(reply_to_comment_id, created_at) WHERE reply_to_comment_id IS NOT NULL;
CREATE INDEX idx_document_comments_unresolved ON document_comments(document_id, is_resolved) WHERE is_resolved = FALSE;
CREATE INDEX idx_document_comments_mentions ON document_comments USING GIN (mentioned_user_ids);

COMMENT ON TABLE document_comments IS 'Collaborative comments and annotations on documents';

-- ============================================================================
-- DOCUMENT AI ANALYSIS - AI Processing Results
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL CHECK (analysis_type IN (
        'extraction', 'classification', 'summary', 'qa',
        'entity_recognition', 'sentiment', 'translation', 'ocr'
    )),
    ai_model VARCHAR(100),  -- 'claude-3-5-sonnet-20241022', 'gpt-4', 'gemini-pro'

    -- Prompt and response
    prompt_used TEXT,
    response TEXT NOT NULL,

    -- Confidence and metadata
    confidence_score DECIMAL(3, 2),  -- 0.00 to 1.00
    processing_time_ms INTEGER,

    -- Extracted structured data
    extracted_entities JSONB,  -- {names: [], dates: [], amounts: [], locations: []}

    -- Additional metadata
    metadata JSONB,  -- Model-specific metadata

    analyzed_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

CREATE INDEX idx_document_ai_analysis_document ON document_ai_analysis(document_id, analysis_type, analyzed_at DESC);
CREATE INDEX idx_document_ai_analysis_type ON document_ai_analysis(analysis_type, analyzed_at DESC);
CREATE INDEX idx_document_ai_analysis_model ON document_ai_analysis(ai_model, analyzed_at DESC);
CREATE INDEX idx_document_ai_analysis_entities ON document_ai_analysis USING GIN (extracted_entities);

COMMENT ON TABLE document_ai_analysis IS 'AI-powered document analysis results (Claude, GPT-4, Gemini)';

-- ============================================================================
-- RAG EMBEDDINGS - Vector Embeddings for Semantic Search
-- ============================================================================
CREATE TABLE IF NOT EXISTS rag_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Source reference
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN (
        'document', 'policy', 'sop', 'training', 'manual',
        'work_order', 'maintenance_note', 'comment', 'message'
    )),
    source_id UUID NOT NULL,

    -- Chunk information
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER DEFAULT 0,  -- Order within source
    chunk_metadata JSONB,  -- {page: 1, section: "Safety Procedures", heading: "..."}

    -- Embedding
    embedding_vector vector(1536) NOT NULL,
    model_used VARCHAR(100) DEFAULT 'text-embedding-ada-002',

    -- Search optimization
    token_count INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT chunk_index_positive CHECK (chunk_index >= 0)
);

CREATE INDEX idx_rag_embeddings_source ON rag_embeddings(source_type, source_id, chunk_index);
CREATE INDEX idx_rag_embeddings_tenant ON rag_embeddings(tenant_id);

-- Vector similarity search index
CREATE INDEX idx_rag_embeddings_vector ON rag_embeddings USING ivfflat (embedding_vector vector_cosine_ops)
    WITH (lists = 100);

COMMENT ON TABLE rag_embeddings IS 'Vector embeddings for RAG (Retrieval Augmented Generation) semantic search';
COMMENT ON COLUMN rag_embeddings.chunk_text IS 'Text chunk (typically 512-1024 tokens) for embedding';
COMMENT ON COLUMN rag_embeddings.embedding_vector IS '1536-dimensional vector for semantic similarity search';

-- ============================================================================
-- DOCUMENT AUDIT LOG - Comprehensive Audit Trail
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    user_id UUID NOT NULL,

    action VARCHAR(50) NOT NULL CHECK (action IN (
        'created', 'viewed', 'downloaded', 'edited', 'deleted',
        'shared', 'unshared', 'commented', 'version_created',
        'moved', 'renamed', 'archived', 'restored', 'printed'
    )),

    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),

    -- Details
    details JSONB,  -- Action-specific details

    occurred_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_document_audit_document ON document_audit_log(document_id, occurred_at DESC) WHERE document_id IS NOT NULL;
CREATE INDEX idx_document_audit_user ON document_audit_log(user_id, occurred_at DESC);
CREATE INDEX idx_document_audit_tenant ON document_audit_log(tenant_id, action, occurred_at DESC);
CREATE INDEX idx_document_audit_action ON document_audit_log(action, occurred_at DESC);

-- Partition by month for performance
-- ALTER TABLE document_audit_log PARTITION BY RANGE (occurred_at);
-- (Add partitions as needed)

COMMENT ON TABLE document_audit_log IS 'Complete audit trail for all document operations';

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_document_updated_at();

CREATE TRIGGER update_document_folders_updated_at
    BEFORE UPDATE ON document_folders
    FOR EACH ROW EXECUTE FUNCTION update_document_updated_at();

CREATE TRIGGER update_document_comments_updated_at
    BEFORE UPDATE ON document_comments
    FOR EACH ROW EXECUTE FUNCTION update_document_updated_at();

-- Auto-update document folder path on insert/update
CREATE OR REPLACE FUNCTION update_folder_path()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_folder_id IS NULL THEN
        NEW.path = '/' || NEW.folder_name;
    ELSE
        SELECT path || '/' || NEW.folder_name INTO NEW.path
        FROM document_folders
        WHERE id = NEW.parent_folder_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_folders_path
    BEFORE INSERT OR UPDATE ON document_folders
    FOR EACH ROW EXECUTE FUNCTION update_folder_path();

-- Increment access count on document share access
CREATE OR REPLACE FUNCTION increment_share_access_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.access_count = COALESCE(OLD.access_count, 0) + 1;
    NEW.last_accessed_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create audit log entry on document operations
CREATE OR REPLACE FUNCTION log_document_operation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO document_audit_log (tenant_id, document_id, user_id, action, details)
        VALUES (NEW.tenant_id, NEW.id, NEW.uploaded_by_user_id, 'created',
                jsonb_build_object('file_name', NEW.document_name, 'file_size', NEW.file_size_bytes));
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_archived = FALSE AND NEW.is_archived = TRUE THEN
            INSERT INTO document_audit_log (tenant_id, document_id, user_id, action)
            VALUES (NEW.tenant_id, NEW.id, NEW.uploaded_by_user_id, 'archived');
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO document_audit_log (tenant_id, document_id, user_id, action, details)
        VALUES (OLD.tenant_id, OLD.id, OLD.uploaded_by_user_id, 'deleted',
                jsonb_build_object('file_name', OLD.document_name));
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_document_changes
    AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION log_document_operation();

-- Helper function for vector similarity search
CREATE OR REPLACE FUNCTION search_similar_documents(
    query_embedding vector(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    filter_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE (
    document_id UUID,
    document_name VARCHAR(500),
    similarity FLOAT,
    chunk_text TEXT,
    chunk_metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.document_name,
        1 - (r.embedding_vector <=> query_embedding) AS similarity,
        r.chunk_text,
        r.chunk_metadata
    FROM rag_embeddings r
    JOIN documents d ON d.id = r.source_id AND r.source_type = 'document'
    WHERE
        (filter_tenant_id IS NULL OR r.tenant_id = filter_tenant_id)
        AND 1 - (r.embedding_vector <=> query_embedding) > match_threshold
    ORDER BY r.embedding_vector <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_similar_documents IS 'Semantic search across document embeddings using cosine similarity';
