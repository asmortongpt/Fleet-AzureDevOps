-- Migration 006: Document Management with RAG Integration
-- Created: 2025-11-11
-- Description: Comprehensive document management system with RAG support for semantic search and AI Q&A

-- ============================================================================
-- DOCUMENT MANAGEMENT TABLES
-- ============================================================================

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Document categories table
CREATE TABLE IF NOT EXISTS document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6',
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_category_per_tenant UNIQUE (tenant_id, category_name)
);

CREATE INDEX idx_document_categories_tenant_id ON document_categories(tenant_id);

-- Main documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  file_name VARCHAR(500) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT NOT NULL,
  file_hash VARCHAR(64),
  category_id UUID REFERENCES document_categories(id) ON DELETE SET NULL,
  tags TEXT[],
  description TEXT,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  is_public BOOLEAN DEFAULT FALSE,
  version_number INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  metadata JSONB DEFAULT '{}',
  -- Text extraction for search
  extracted_text TEXT,
  -- OCR status
  ocr_status VARCHAR(50) DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed', 'not_needed')),
  ocr_completed_at TIMESTAMP,
  -- Embedding status
  embedding_status VARCHAR(50) DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed')),
  embedding_completed_at TIMESTAMP,
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_file_size CHECK (file_size > 0)
);

CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX idx_documents_category_id ON documents(category_id);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_tags ON documents USING GIN (tags);
CREATE INDEX idx_documents_file_type ON documents(file_type);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_extracted_text_search ON documents USING gin(to_tsvector('english', extracted_text));

-- Document versions table
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_hash VARCHAR(64),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  change_notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_version_per_document UNIQUE (document_id, version_number)
);

CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_versions_created_at ON document_versions(created_at DESC);

-- Document access log for audit trail
CREATE TABLE IF NOT EXISTS document_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'download', 'edit', 'delete', 'share')),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  accessed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_document_access_log_document_id ON document_access_log(document_id);
CREATE INDEX idx_document_access_log_user_id ON document_access_log(user_id);
CREATE INDEX idx_document_access_log_accessed_at ON document_access_log(accessed_at DESC);

-- Document permissions (for fine-grained access control)
CREATE TABLE IF NOT EXISTS document_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50),
  permission_type VARCHAR(50) NOT NULL CHECK (permission_type IN ('view', 'edit', 'admin')),
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  CONSTRAINT unique_permission_per_user UNIQUE (document_id, user_id)
);

CREATE INDEX idx_document_permissions_document_id ON document_permissions(document_id);
CREATE INDEX idx_document_permissions_user_id ON document_permissions(user_id);

-- ============================================================================
-- RAG (Retrieval Augmented Generation) TABLES
-- ============================================================================

-- Document embeddings for semantic search
CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  -- Vector embedding (OpenAI ada-002 uses 1536 dimensions)
  embedding vector(1536),
  -- Metadata about the chunk
  chunk_type VARCHAR(50) DEFAULT 'paragraph',
  page_number INTEGER,
  section_title VARCHAR(500),
  token_count INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_chunk_per_document UNIQUE (document_id, chunk_index)
);

CREATE INDEX idx_document_embeddings_document_id ON document_embeddings(document_id);
CREATE INDEX idx_document_embeddings_embedding ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_document_embeddings_chunk_index ON document_embeddings(chunk_index);

-- RAG query history for tracking and analytics
CREATE TABLE IF NOT EXISTS document_rag_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  query_text TEXT NOT NULL,
  query_embedding vector(1536),
  response_text TEXT,
  matched_documents UUID[],
  matched_chunks UUID[],
  relevance_scores JSONB,
  execution_time_ms INTEGER,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comment TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_document_rag_queries_tenant_id ON document_rag_queries(tenant_id);
CREATE INDEX idx_document_rag_queries_user_id ON document_rag_queries(user_id);
CREATE INDEX idx_document_rag_queries_created_at ON document_rag_queries(created_at DESC);

-- Document relationships (for linked documents)
CREATE TABLE IF NOT EXISTS document_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  target_document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN ('related', 'supersedes', 'references', 'attachment', 'version')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT no_self_reference CHECK (source_document_id != target_document_id),
  CONSTRAINT unique_relationship UNIQUE (source_document_id, target_document_id, relationship_type)
);

CREATE INDEX idx_document_relationships_source ON document_relationships(source_document_id);
CREATE INDEX idx_document_relationships_target ON document_relationships(target_document_id);

-- Document comments/annotations
CREATE TABLE IF NOT EXISTS document_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  comment_text TEXT NOT NULL,
  page_number INTEGER,
  position JSONB,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  parent_comment_id UUID REFERENCES document_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_document_comments_document_id ON document_comments(document_id);
CREATE INDEX idx_document_comments_user_id ON document_comments(user_id);
CREATE INDEX idx_document_comments_created_at ON document_comments(created_at DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_categories_updated_at
  BEFORE UPDATE ON document_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_comments_updated_at
  BEFORE UPDATE ON document_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create document version on update
CREATE OR REPLACE FUNCTION create_document_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.file_url IS DISTINCT FROM NEW.file_url THEN
    INSERT INTO document_versions (
      document_id, version_number, file_url, file_size, file_hash, uploaded_by, change_notes
    ) VALUES (
      OLD.id, OLD.version_number, OLD.file_url, OLD.file_size, OLD.file_hash, NEW.uploaded_by, 'Auto-version on update'
    );

    NEW.version_number = OLD.version_number + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_version_documents
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION create_document_version();

-- Function to calculate document statistics
CREATE OR REPLACE FUNCTION get_document_stats(p_tenant_id UUID)
RETURNS TABLE (
  total_documents BIGINT,
  total_size_bytes BIGINT,
  by_category JSONB,
  by_type JSONB,
  recent_uploads BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_documents,
    SUM(file_size)::BIGINT as total_size_bytes,
    jsonb_object_agg(
      COALESCE(dc.category_name, 'Uncategorized'),
      category_count
    ) as by_category,
    jsonb_object_agg(
      file_type,
      type_count
    ) as by_type,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::BIGINT as recent_uploads
  FROM documents d
  LEFT JOIN document_categories dc ON d.category_id = dc.id
  LEFT JOIN (
    SELECT category_id, COUNT(*) as category_count
    FROM documents
    WHERE tenant_id = p_tenant_id AND status = 'active'
    GROUP BY category_id
  ) cat_counts ON d.category_id = cat_counts.category_id
  LEFT JOIN (
    SELECT file_type, COUNT(*) as type_count
    FROM documents
    WHERE tenant_id = p_tenant_id AND status = 'active'
    GROUP BY file_type
  ) type_counts ON d.file_type = type_counts.file_type
  WHERE d.tenant_id = p_tenant_id AND d.status = 'active';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'documents', 'document_versions', 'document_categories', 'document_access_log',
      'document_embeddings', 'document_rag_queries', 'document_relationships',
      'document_comments', 'document_permissions'
    )
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO fleet_user', table_name);
  END LOOP;
END $$;

-- ============================================================================
-- SAMPLE DATA FOR DEVELOPMENT
-- ============================================================================

-- Insert default document categories
INSERT INTO document_categories (tenant_id, category_name, description, color, icon)
SELECT
  t.id,
  category,
  description,
  color,
  icon
FROM tenants t
CROSS JOIN (
  VALUES
    ('Policies', 'Company policies and procedures', '#3B82F6', 'FileText'),
    ('Maintenance', 'Vehicle maintenance and service documents', '#10B981', 'Wrench'),
    ('Safety', 'Safety protocols and incident reports', '#EF4444', 'FirstAid'),
    ('Training', 'Training materials and certifications', '#8B5CF6', 'GraduationCap'),
    ('Legal', 'Legal documents and contracts', '#F59E0B', 'Scale'),
    ('Insurance', 'Insurance policies and claims', '#06B6D4', 'Shield'),
    ('Compliance', 'Regulatory compliance documents', '#EC4899', 'CheckCircle'),
    ('General', 'General fleet documentation', '#6B7280', 'Folder')
) AS categories(category, description, color, icon)
ON CONFLICT (tenant_id, category_name) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE documents IS 'Main document storage with metadata and versioning';
COMMENT ON TABLE document_embeddings IS 'Vector embeddings for RAG semantic search';
COMMENT ON TABLE document_rag_queries IS 'Query history for RAG system analytics';
COMMENT ON TABLE document_categories IS 'Organizational categories for documents';
COMMENT ON TABLE document_access_log IS 'Audit trail for document access';

-- Migration complete
