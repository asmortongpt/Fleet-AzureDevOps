-- Migration 024: Document Full-Text Search Enhancement
-- Created: 2025-11-16
-- Description: Add search_vector column and triggers for PostgreSQL full-text search

-- ============================================================================
-- ADD SEARCH VECTOR COLUMN
-- ============================================================================

-- Add search_vector column to documents table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE documents ADD COLUMN search_vector tsvector;
  END IF;
END $$;

-- ============================================================================
-- CREATE GIN INDEX FOR FAST FULL-TEXT SEARCH
-- ============================================================================

-- Drop existing index if it exists (to allow recreation with correct config)
DROP INDEX IF EXISTS idx_documents_search_vector;

-- Create GIN index on search_vector for optimal full-text search performance
CREATE INDEX idx_documents_search_vector ON documents USING GIN(search_vector);

-- Additional index on ocr_text for fallback searches
DROP INDEX IF EXISTS idx_documents_ocr_fulltext;
CREATE INDEX idx_documents_ocr_fulltext ON documents USING GIN(
  to_tsvector('english', COALESCE(ocr_raw_text, ''))
) WHERE ocr_raw_text IS NOT NULL;

-- Index on extracted_text for the new schema
DROP INDEX IF EXISTS idx_documents_extracted_text_fulltext;
CREATE INDEX idx_documents_extracted_text_fulltext ON documents USING GIN(
  to_tsvector('english', COALESCE(extracted_text, ''))
) WHERE extracted_text IS NOT NULL;

-- ============================================================================
-- CREATE UPDATE TRIGGER FUNCTION
-- ============================================================================

-- Function to automatically update search_vector when document is inserted/updated
CREATE OR REPLACE FUNCTION documents_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Build weighted search vector from multiple fields
  -- Weight A (highest): file_name, document_name
  -- Weight B (medium): description, vendor_name, tags
  -- Weight C (lower): extracted_text, ocr_raw_text
  -- Weight D (lowest): metadata

  NEW.search_vector :=
    -- File/document name gets highest weight
    setweight(
      to_tsvector('english', COALESCE(NEW.file_name, COALESCE(NEW.document_name, ''))),
      'A'
    ) ||
    -- Description and vendor name get medium-high weight
    setweight(
      to_tsvector('english', COALESCE(NEW.description, '')),
      'B'
    ) ||
    setweight(
      to_tsvector('english', COALESCE(NEW.vendor_name, '')),
      'B'
    ) ||
    -- Tags get medium-high weight
    setweight(
      to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), COALESCE(array_to_string(NEW.ai_tags, ' '), COALESCE(array_to_string(NEW.manual_tags, ' '), '')))),
      'B'
    ) ||
    -- OCR/extracted text gets lower weight (more content, less relevance)
    setweight(
      to_tsvector('english', COALESCE(NEW.extracted_text, COALESCE(NEW.ocr_raw_text, ''))),
      'C'
    ) ||
    -- Document type and category for filtering
    setweight(
      to_tsvector('english', COALESCE(NEW.document_type, COALESCE(NEW.file_type, ''))),
      'B'
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CREATE TRIGGER
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS documents_search_vector_trigger ON documents;

-- Create trigger to automatically update search_vector
CREATE TRIGGER documents_search_vector_trigger
  BEFORE INSERT OR UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION documents_search_vector_update();

-- ============================================================================
-- POPULATE EXISTING DOCUMENTS
-- ============================================================================

-- Update search_vector for all existing documents
-- This may take a while for large datasets
DO $$
DECLARE
  doc_count INTEGER;
  batch_size INTEGER := 1000;
  updated_count INTEGER := 0;
BEGIN
  -- Get total count
  SELECT COUNT(*) INTO doc_count FROM documents WHERE search_vector IS NULL;

  RAISE NOTICE 'Updating search vectors for % documents...', doc_count;

  -- Update in batches to avoid long-running transactions
  LOOP
    WITH batch AS (
      SELECT id FROM documents
      WHERE search_vector IS NULL
      LIMIT batch_size
      FOR UPDATE SKIP LOCKED
    )
    UPDATE documents d
    SET search_vector = documents_search_vector_update.search_vector
    FROM batch
    WHERE d.id = batch.id;

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    IF updated_count = 0 THEN
      EXIT;
    END IF;

    RAISE NOTICE 'Updated % documents...', updated_count;
    COMMIT;
  END LOOP;

  RAISE NOTICE 'Search vector update complete!';
END $$;

-- ============================================================================
-- HELPER FUNCTIONS FOR SEARCH
-- ============================================================================

-- Function to search documents with ranking
CREATE OR REPLACE FUNCTION search_documents_ranked(
  p_tenant_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  file_name VARCHAR,
  description TEXT,
  rank REAL,
  headline TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.file_name,
    d.description,
    ts_rank(d.search_vector, to_tsquery('english', p_query)) AS rank,
    ts_headline(
      'english',
      COALESCE(d.file_name, '') || ' ' || COALESCE(d.description, ''),
      to_tsquery('english', p_query),
      'MaxWords=50, MinWords=25, ShortWord=3'
    ) AS headline
  FROM documents d
  WHERE d.tenant_id = p_tenant_id
    AND d.search_vector @@ to_tsquery('english', p_query)
    AND d.status = 'active'
  ORDER BY rank DESC, d.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEARCH STATISTICS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW v_document_search_stats AS
SELECT
  tenant_id,
  COUNT(*) as total_documents,
  COUNT(*) FILTER (WHERE search_vector IS NOT NULL) as searchable_documents,
  COUNT(*) FILTER (WHERE ocr_status = 'completed' OR embedding_status = 'completed') as processed_documents,
  COUNT(*) FILTER (WHERE ocr_status IN ('pending', 'processing')) as pending_ocr,
  ROUND(AVG(LENGTH(COALESCE(extracted_text, COALESCE(ocr_raw_text, ''))))::numeric, 2) as avg_text_length,
  SUM(file_size_bytes) FILTER (WHERE search_vector IS NOT NULL) as total_searchable_size_bytes
FROM documents
WHERE status = 'active'
GROUP BY tenant_id;

-- ============================================================================
-- INDEXES FOR RELATED FIELDS
-- ============================================================================

-- Ensure we have proper indexes for common search filters
CREATE INDEX IF NOT EXISTS idx_documents_related_vehicle
  ON documents(related_vehicle_id) WHERE related_vehicle_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_related_driver
  ON documents(related_driver_id) WHERE related_driver_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_related_maintenance
  ON documents(related_maintenance_id) WHERE related_maintenance_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_document_date
  ON documents(document_date DESC NULLS LAST) WHERE document_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_tenant_status
  ON documents(tenant_id, status);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permission on search function to fleet users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'fleet_user') THEN
    GRANT EXECUTE ON FUNCTION search_documents_ranked(UUID, TEXT, INTEGER, INTEGER) TO fleet_user;
  END IF;
END $$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN documents.search_vector IS 'Full-text search vector with weighted content (A=title, B=metadata, C=content)';
COMMENT ON INDEX idx_documents_search_vector IS 'GIN index for fast full-text search on search_vector';
COMMENT ON FUNCTION documents_search_vector_update() IS 'Automatically updates search_vector with weighted content from multiple fields';
COMMENT ON FUNCTION search_documents_ranked(UUID, TEXT, INTEGER, INTEGER) IS 'Search documents with relevance ranking and headline generation';
COMMENT ON VIEW v_document_search_stats IS 'Statistics about document search indexing status per tenant';

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the migration was successful
DO $$
DECLARE
  index_exists BOOLEAN;
  trigger_exists BOOLEAN;
  vector_count INTEGER;
BEGIN
  -- Check if index exists
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'documents' AND indexname = 'idx_documents_search_vector'
  ) INTO index_exists;

  -- Check if trigger exists
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'documents_search_vector_trigger'
  ) INTO trigger_exists;

  -- Count documents with search vectors
  SELECT COUNT(*) INTO vector_count
  FROM documents
  WHERE search_vector IS NOT NULL;

  -- Report status
  RAISE NOTICE '=== Migration 024 Verification ===';
  RAISE NOTICE 'Search index exists: %', index_exists;
  RAISE NOTICE 'Search trigger exists: %', trigger_exists;
  RAISE NOTICE 'Documents with search vectors: %', vector_count;

  IF NOT index_exists OR NOT trigger_exists THEN
    RAISE EXCEPTION 'Migration verification failed!';
  END IF;

  RAISE NOTICE '=== Migration 024 Complete ===';
END $$;
