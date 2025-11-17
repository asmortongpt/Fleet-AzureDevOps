-- ============================================================================
-- Migration: Search and Indexing System
-- Description: Comprehensive full-text search and document indexing system
-- Created: 2025-11-16
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For fuzzy/similarity search
CREATE EXTENSION IF NOT EXISTS btree_gin; -- For better indexing performance

-- ============================================================================
-- Search Index Tables
-- ============================================================================

-- Add search columns to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS search_vector tsvector,
ADD COLUMN IF NOT EXISTS indexed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS index_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create full-text search index on documents
CREATE INDEX IF NOT EXISTS idx_documents_search_vector
ON documents USING GIN (search_vector);

-- Create indexes for common search filters
CREATE INDEX IF NOT EXISTS idx_documents_category_status
ON documents(category_id, status);

CREATE INDEX IF NOT EXISTS idx_documents_tenant_status
ON documents(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_documents_file_type
ON documents(file_type);

CREATE INDEX IF NOT EXISTS idx_documents_created_at
ON documents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_documents_tags
ON documents USING GIN (tags);

-- Trigram indexes for fuzzy matching
CREATE INDEX IF NOT EXISTS idx_documents_file_name_trgm
ON documents USING GIN (file_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_documents_description_trgm
ON documents USING GIN (description gin_trgm_ops);

-- ============================================================================
-- Search Query Log
-- ============================================================================

CREATE TABLE IF NOT EXISTS search_query_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  query_text TEXT NOT NULL,
  query_terms TEXT[],
  filters JSONB,
  result_count INTEGER DEFAULT 0,
  search_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_query_log_tenant
ON search_query_log(tenant_id);

CREATE INDEX IF NOT EXISTS idx_search_query_log_created_at
ON search_query_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_query_log_query_text
ON search_query_log(query_text);

CREATE INDEX IF NOT EXISTS idx_search_query_log_result_count
ON search_query_log(result_count);

-- ============================================================================
-- Document Indexing Jobs
-- ============================================================================

CREATE TABLE IF NOT EXISTS indexing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_type VARCHAR(20) NOT NULL CHECK (job_type IN ('index', 'reindex', 'optimize', 'delete')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  total_documents INTEGER,
  processed_documents INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_indexing_jobs_tenant
ON indexing_jobs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_indexing_jobs_status
ON indexing_jobs(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_indexing_jobs_job_type
ON indexing_jobs(job_type);

-- ============================================================================
-- Document Indexing Log
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_indexing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  indexing_time_ms INTEGER,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_indexing_log_tenant
ON document_indexing_log(tenant_id);

CREATE INDEX IF NOT EXISTS idx_doc_indexing_log_document
ON document_indexing_log(document_id);

CREATE INDEX IF NOT EXISTS idx_doc_indexing_log_created_at
ON document_indexing_log(created_at DESC);

-- ============================================================================
-- Tenant Index Statistics
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_index_stats (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  total_indexed INTEGER DEFAULT 0,
  last_indexed_at TIMESTAMP,
  last_optimization TIMESTAMP,
  optimization_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Search History
-- ============================================================================

CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  clicked_documents UUID[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user
ON search_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_history_query
ON search_history(query);

CREATE INDEX IF NOT EXISTS idx_search_history_created_at
ON search_history(created_at DESC);

-- ============================================================================
-- Saved Searches
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  query TEXT NOT NULL,
  filters JSONB,
  notification_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_run_at TIMESTAMP,
  UNIQUE(user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user
ON saved_searches(user_id);

CREATE INDEX IF NOT EXISTS idx_saved_searches_tenant
ON saved_searches(tenant_id);

CREATE INDEX IF NOT EXISTS idx_saved_searches_notification
ON saved_searches(notification_enabled, last_run_at)
WHERE notification_enabled = TRUE;

-- ============================================================================
-- Search Result Click Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS search_click_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  result_position INTEGER,
  relevance_score DECIMAL(10, 4),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_click_user
ON search_click_tracking(user_id);

CREATE INDEX IF NOT EXISTS idx_search_click_document
ON search_click_tracking(document_id);

CREATE INDEX IF NOT EXISTS idx_search_click_query
ON search_click_tracking(query);

CREATE INDEX IF NOT EXISTS idx_search_click_created_at
ON search_click_tracking(created_at DESC);

-- ============================================================================
-- Document Categories (Enhanced for Search)
-- ============================================================================

-- Add indexes to document_categories if not exists
CREATE INDEX IF NOT EXISTS idx_document_categories_tenant
ON document_categories(tenant_id);

CREATE INDEX IF NOT EXISTS idx_document_categories_name
ON document_categories(category_name);

-- Trigram index for fuzzy category search
CREATE INDEX IF NOT EXISTS idx_document_categories_name_trgm
ON document_categories USING GIN (category_name gin_trgm_ops);

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Function to automatically update search vector on document insert/update
CREATE OR REPLACE FUNCTION update_document_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Build search vector from multiple fields with different weights
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.file_name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.extracted_text, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'A');

  -- Update indexed timestamp
  NEW.indexed_at := NOW();
  NEW.index_status := 'indexed';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic search vector updates
DROP TRIGGER IF EXISTS trigger_update_document_search_vector ON documents;
CREATE TRIGGER trigger_update_document_search_vector
  BEFORE INSERT OR UPDATE OF file_name, description, extracted_text, tags
  ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_search_vector();

-- Function to update tenant index statistics
CREATE OR REPLACE FUNCTION update_tenant_index_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tenant_index_stats (tenant_id, total_indexed, last_indexed_at)
  VALUES (
    (SELECT tenant_id FROM documents WHERE id = NEW.document_id),
    1,
    NOW()
  )
  ON CONFLICT (tenant_id)
  DO UPDATE SET
    total_indexed = tenant_index_stats.total_indexed + 1,
    last_indexed_at = NOW(),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for index stats updates
DROP TRIGGER IF EXISTS trigger_update_tenant_index_stats ON document_indexing_log;
CREATE TRIGGER trigger_update_tenant_index_stats
  AFTER INSERT ON document_indexing_log
  FOR EACH ROW
  WHEN (NEW.status = 'success')
  EXECUTE FUNCTION update_tenant_index_stats();

-- Function to increment document view count
CREATE OR REPLACE FUNCTION increment_document_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE documents
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = NEW.document_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for view count tracking
DROP TRIGGER IF EXISTS trigger_increment_document_views ON search_click_tracking;
CREATE TRIGGER trigger_increment_document_views
  AFTER INSERT ON search_click_tracking
  FOR EACH ROW
  EXECUTE FUNCTION increment_document_views();

-- ============================================================================
-- Materialized Views for Search Performance
-- ============================================================================

-- Popular search terms view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_popular_search_terms AS
SELECT
  query_text,
  COUNT(*) as search_count,
  AVG(result_count) as avg_results,
  MAX(created_at) as last_searched
FROM search_query_log
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY query_text
HAVING COUNT(*) > 1
ORDER BY search_count DESC
LIMIT 100;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_popular_search_terms
ON mv_popular_search_terms(query_text);

-- No-result queries view (for improving search)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_no_result_queries AS
SELECT
  query_text,
  COUNT(*) as attempt_count,
  MAX(created_at) as last_attempt
FROM search_query_log
WHERE result_count = 0
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY query_text
ORDER BY attempt_count DESC
LIMIT 100;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_no_result_queries
ON mv_no_result_queries(query_text);

-- Document popularity view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_document_popularity AS
SELECT
  d.id,
  d.file_name,
  d.category_id,
  d.tenant_id,
  COUNT(sct.id) as click_count,
  d.view_count,
  AVG(sct.relevance_score) as avg_relevance
FROM documents d
LEFT JOIN search_click_tracking sct ON d.id = sct.document_id
  AND sct.created_at > NOW() - INTERVAL '30 days'
WHERE d.status = 'active'
GROUP BY d.id, d.file_name, d.category_id, d.tenant_id, d.view_count
HAVING COUNT(sct.id) > 0
ORDER BY click_count DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_document_popularity
ON mv_document_popularity(id);

CREATE INDEX IF NOT EXISTS idx_mv_document_popularity_tenant
ON mv_document_popularity(tenant_id);

-- ============================================================================
-- Scheduled Jobs (Comments for implementation in application code)
-- ============================================================================

-- The following should be implemented as scheduled jobs in the application:
--
-- 1. Refresh materialized views (hourly):
--    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_popular_search_terms;
--    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_no_result_queries;
--    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_document_popularity;
--
-- 2. Clean up old search logs (daily):
--    DELETE FROM search_query_log WHERE created_at < NOW() - INTERVAL '90 days';
--    DELETE FROM search_history WHERE created_at < NOW() - INTERVAL '90 days';
--    DELETE FROM search_click_tracking WHERE created_at < NOW() - INTERVAL '90 days';
--
-- 3. Optimize indexes (weekly):
--    VACUUM ANALYZE documents;
--    REINDEX TABLE documents;
--
-- 4. Clean up completed indexing jobs (daily):
--    DELETE FROM indexing_jobs
--    WHERE status IN ('completed', 'failed')
--      AND completed_at < NOW() - INTERVAL '7 days';

-- ============================================================================
-- Initial Data Setup
-- ============================================================================

-- Initialize tenant index stats for existing tenants
INSERT INTO tenant_index_stats (tenant_id, total_indexed, last_indexed_at)
SELECT
  id as tenant_id,
  0 as total_indexed,
  NOW() as last_indexed_at
FROM tenants
ON CONFLICT (tenant_id) DO NOTHING;

-- Update search vectors for existing documents (in batches to avoid locks)
-- This will be handled by the application's indexing service

-- ============================================================================
-- Permissions
-- ============================================================================

-- Grant appropriate permissions
-- GRANT SELECT, INSERT, UPDATE ON search_query_log TO fleet_app_user;
-- GRANT SELECT, INSERT, UPDATE ON search_history TO fleet_app_user;
-- GRANT SELECT, INSERT, UPDATE ON saved_searches TO fleet_app_user;
-- GRANT SELECT, INSERT, UPDATE ON search_click_tracking TO fleet_app_user;
-- GRANT SELECT, INSERT, UPDATE ON indexing_jobs TO fleet_app_user;
-- GRANT SELECT, INSERT, UPDATE ON document_indexing_log TO fleet_app_user;
-- GRANT SELECT, UPDATE ON tenant_index_stats TO fleet_app_user;
-- GRANT SELECT ON mv_popular_search_terms TO fleet_app_user;
-- GRANT SELECT ON mv_no_result_queries TO fleet_app_user;
-- GRANT SELECT ON mv_document_popularity TO fleet_app_user;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE search_query_log IS 'Logs all search queries for analytics and improvement';
COMMENT ON TABLE indexing_jobs IS 'Background jobs for document indexing and optimization';
COMMENT ON TABLE document_indexing_log IS 'Detailed log of document indexing operations';
COMMENT ON TABLE tenant_index_stats IS 'Aggregated indexing statistics per tenant';
COMMENT ON TABLE search_history IS 'User search history for personalization';
COMMENT ON TABLE saved_searches IS 'User-saved search queries with optional notifications';
COMMENT ON TABLE search_click_tracking IS 'Tracks which documents users click from search results';

COMMENT ON COLUMN documents.search_vector IS 'Full-text search vector combining all searchable fields';
COMMENT ON COLUMN documents.indexed_at IS 'Timestamp when document was last indexed';
COMMENT ON COLUMN documents.index_status IS 'Current indexing status: pending, indexed, failed, deleted';
COMMENT ON COLUMN documents.view_count IS 'Number of times document has been viewed from search';

-- ============================================================================
-- Completion
-- ============================================================================

-- Migration completed successfully
SELECT 'Search and Indexing System migration completed successfully' as status;
