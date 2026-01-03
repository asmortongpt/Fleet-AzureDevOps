/**
 * OCR System Tables
 *
 * Comprehensive OCR processing system with:
 * - OCR results storage
 * - Job queue management
 * - Batch processing
 * - Full-text search capabilities
 */

-- OCR Results Table
CREATE TABLE IF NOT EXISTS ocr_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL,
  full_text TEXT NOT NULL,
  pages JSONB NOT NULL DEFAULT '[]',
  tables JSONB,
  forms JSONB,
  languages TEXT[] NOT NULL DEFAULT '{}',
  primary_language VARCHAR(10) NOT NULL,
  average_confidence DECIMAL(5, 4) NOT NULL,
  processing_time INTEGER NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_document
    FOREIGN KEY (document_id)
    REFERENCES documents(id)
    ON DELETE CASCADE,

  CONSTRAINT unique_document_ocr UNIQUE (document_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ocr_results_document_id ON ocr_results(document_id);
CREATE INDEX IF NOT EXISTS idx_ocr_results_provider ON ocr_results(provider);
CREATE INDEX IF NOT EXISTS idx_ocr_results_languages ON ocr_results USING GIN(languages);
CREATE INDEX IF NOT EXISTS idx_ocr_results_created_at ON ocr_results(created_at DESC);

-- Full-text search index on OCR text
CREATE INDEX IF NOT EXISTS idx_ocr_results_fulltext
  ON ocr_results
  USING GIN(to_tsvector('english', full_text));

-- OCR Jobs Queue Table
CREATE TABLE IF NOT EXISTS ocr_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  batch_id UUID,
  queue_job_id VARCHAR(255),
  file_path TEXT NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  options JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  priority INTEGER DEFAULT 5,
  progress INTEGER DEFAULT 0,
  result JSONB,
  error TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  failed_at TIMESTAMP,
  processing_time DECIMAL(10, 2),
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_ocr_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_ocr_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL,

  CONSTRAINT chk_status
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

  CONSTRAINT chk_progress
    CHECK (progress >= 0 AND progress <= 100)
);

-- Create indexes for OCR jobs
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_document_id ON ocr_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_tenant_id ON ocr_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_user_id ON ocr_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_batch_id ON ocr_jobs(batch_id);
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_status ON ocr_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_priority ON ocr_jobs(priority ASC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_created_at ON ocr_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_queue_job_id ON ocr_jobs(queue_job_id);

-- OCR Batch Jobs Table
CREATE TABLE IF NOT EXISTS ocr_batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  total_documents INTEGER NOT NULL,
  completed_documents INTEGER DEFAULT 0,
  failed_documents INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  options JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_batch_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_batch_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL,

  CONSTRAINT chk_batch_status
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

-- Create indexes for batch jobs
CREATE INDEX IF NOT EXISTS idx_ocr_batch_tenant_id ON ocr_batch_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ocr_batch_user_id ON ocr_batch_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_ocr_batch_status ON ocr_batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ocr_batch_created_at ON ocr_batch_jobs(created_at DESC);

-- Add foreign key for batch_id in ocr_jobs
ALTER TABLE ocr_jobs
  DROP CONSTRAINT IF EXISTS fk_ocr_batch,
  ADD CONSTRAINT fk_ocr_batch
    FOREIGN KEY (batch_id)
    REFERENCES ocr_batch_jobs(id)
    ON DELETE SET NULL;

-- OCR Provider Statistics Table
CREATE TABLE IF NOT EXISTS ocr_provider_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  provider VARCHAR(50) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_jobs INTEGER DEFAULT 0,
  successful_jobs INTEGER DEFAULT 0,
  failed_jobs INTEGER DEFAULT 0,
  total_pages INTEGER DEFAULT 0,
  avg_confidence DECIMAL(5, 4),
  avg_processing_time DECIMAL(10, 2),
  total_cost DECIMAL(10, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_provider_stats_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(id)
    ON DELETE CASCADE,

  CONSTRAINT unique_provider_stats UNIQUE (tenant_id, provider, date)
);

-- Create indexes for provider stats
CREATE INDEX IF NOT EXISTS idx_provider_stats_tenant_id ON ocr_provider_stats(tenant_id);
CREATE INDEX IF NOT EXISTS idx_provider_stats_provider ON ocr_provider_stats(provider);
CREATE INDEX IF NOT EXISTS idx_provider_stats_date ON ocr_provider_stats(date DESC);

-- OCR Language Detection Results
CREATE TABLE IF NOT EXISTS ocr_language_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ocr_result_id UUID NOT NULL,
  language_code VARCHAR(10) NOT NULL,
  confidence DECIMAL(5, 4) NOT NULL,
  page_number INTEGER,
  detected_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_language_ocr_result
    FOREIGN KEY (ocr_result_id)
    REFERENCES ocr_results(id)
    ON DELETE CASCADE
);

-- Create indexes for language detections
CREATE INDEX IF NOT EXISTS idx_language_detections_ocr_result_id ON ocr_language_detections(ocr_result_id);
CREATE INDEX IF NOT EXISTS idx_language_detections_language_code ON ocr_language_detections(language_code);

-- Update documents table with OCR status if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'documents' AND column_name = 'ocr_status'
  ) THEN
    ALTER TABLE documents
      ADD COLUMN ocr_status VARCHAR(20) DEFAULT 'not_needed',
      ADD COLUMN ocr_completed_at TIMESTAMP,
      ADD COLUMN ocr_provider VARCHAR(50),
      ADD CONSTRAINT chk_ocr_status
        CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed', 'not_needed'));
  END IF;
END $$;

-- Function to update OCR provider statistics
CREATE OR REPLACE FUNCTION update_ocr_provider_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' OR NEW.status = 'failed' THEN
    INSERT INTO ocr_provider_stats (
      tenant_id,
      provider,
      date,
      total_jobs,
      successful_jobs,
      failed_jobs,
      total_pages,
      avg_confidence,
      avg_processing_time
    )
    SELECT
      NEW.tenant_id,
      (NEW.result->>'provider')::VARCHAR,
      CURRENT_DATE,
      1,
      CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
      CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
      COALESCE((NEW.result->'metadata'->>'pageCount')::INTEGER, 0),
      CASE WHEN NEW.status = 'completed'
        THEN (NEW.result->>'averageConfidence')::DECIMAL
        ELSE NULL
      END,
      NEW.processing_time
    ON CONFLICT (tenant_id, provider, date) DO UPDATE SET
      total_jobs = ocr_provider_stats.total_jobs + 1,
      successful_jobs = ocr_provider_stats.successful_jobs +
        CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END,
      failed_jobs = ocr_provider_stats.failed_jobs +
        CASE WHEN NEW.status = 'failed' THEN 1 ELSE 0 END,
      total_pages = ocr_provider_stats.total_pages +
        COALESCE((NEW.result->'metadata'->>'pageCount')::INTEGER, 0),
      avg_confidence = (
        COALESCE(ocr_provider_stats.avg_confidence * ocr_provider_stats.successful_jobs, 0) +
        COALESCE((NEW.result->>'averageConfidence')::DECIMAL, 0)
      ) / NULLIF(ocr_provider_stats.successful_jobs +
        CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END, 0),
      avg_processing_time = (
        COALESCE(ocr_provider_stats.avg_processing_time * ocr_provider_stats.total_jobs, 0) +
        COALESCE(NEW.processing_time, 0)
      ) / (ocr_provider_stats.total_jobs + 1),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update provider statistics
DROP TRIGGER IF EXISTS trigger_update_ocr_stats ON ocr_jobs;
CREATE TRIGGER trigger_update_ocr_stats
  AFTER UPDATE ON ocr_jobs
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'failed') AND OLD.status != NEW.status)
  EXECUTE FUNCTION update_ocr_provider_stats();

-- Function to clean up old OCR jobs
CREATE OR REPLACE FUNCTION cleanup_old_ocr_jobs(days_old INTEGER DEFAULT 30)
RETURNS TABLE(deleted_count BIGINT) AS $$
BEGIN
  WITH deleted AS (
    DELETE FROM ocr_jobs
    WHERE status IN ('completed', 'failed')
      AND completed_at < NOW() - (days_old || ' days')::INTERVAL
    RETURNING *
  )
  SELECT COUNT(*) FROM deleted INTO deleted_count;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ocr_results TO fleetadmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON ocr_jobs TO fleetadmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON ocr_batch_jobs TO fleetadmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON ocr_provider_stats TO fleetadmin;
GRANT SELECT, INSERT, UPDATE, DELETE ON ocr_language_detections TO fleetadmin;

-- Comments for documentation
COMMENT ON TABLE ocr_results IS 'Stores OCR processing results with full text, pages, tables, and forms';
COMMENT ON TABLE ocr_jobs IS 'Manages OCR job queue with status tracking and retry logic';
COMMENT ON TABLE ocr_batch_jobs IS 'Tracks batch OCR processing jobs';
COMMENT ON TABLE ocr_provider_stats IS 'Aggregates OCR provider usage statistics per tenant';
COMMENT ON TABLE ocr_language_detections IS 'Stores language detection results from OCR';

COMMENT ON COLUMN ocr_results.pages IS 'JSONB array of page-level OCR results with lines, words, and bounding boxes';
COMMENT ON COLUMN ocr_results.tables IS 'JSONB array of extracted table structures';
COMMENT ON COLUMN ocr_results.forms IS 'JSONB array of extracted form fields and values';
COMMENT ON COLUMN ocr_jobs.options IS 'JSONB object with OCR processing options (provider, languages, etc.)';
COMMENT ON COLUMN ocr_jobs.result IS 'JSONB object with complete OCR result';
