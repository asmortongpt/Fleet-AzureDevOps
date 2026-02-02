-- ============================================================================
-- Migration 022: Attachment Enhancements for Azure Blob Storage
-- Created: 2025-11-16
-- Description: Enhance communication_attachments table for Azure Blob Storage,
--              Microsoft Teams, and Outlook integration
-- ============================================================================

-- Add new columns to communication_attachments table
ALTER TABLE communication_attachments
  ADD COLUMN IF NOT EXISTS blob_url VARCHAR(2000),
  ADD COLUMN IF NOT EXISTS sas_url VARCHAR(2000),
  ADD COLUMN IF NOT EXISTS teams_file_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS outlook_attachment_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(2000),
  ADD COLUMN IF NOT EXISTS virus_scan_status VARCHAR(50) DEFAULT 'pending' CHECK (virus_scan_status IN ('pending', 'clean', 'infected', 'error')),
  ADD COLUMN IF NOT EXISTS compression_status VARCHAR(50) DEFAULT 'uncompressed' CHECK (compression_status IN ('uncompressed', 'compressed', 'failed')),
  ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Add comments on new columns
COMMENT ON COLUMN communication_attachments.blob_url IS 'Azure Blob Storage URL for the file';
COMMENT ON COLUMN communication_attachments.sas_url IS 'Temporary SAS URL for secure file access';
COMMENT ON COLUMN communication_attachments.teams_file_id IS 'Microsoft Teams file ID reference';
COMMENT ON COLUMN communication_attachments.outlook_attachment_id IS 'Outlook attachment ID reference';
COMMENT ON COLUMN communication_attachments.thumbnail_url IS 'URL to generated thumbnail for images';
COMMENT ON COLUMN communication_attachments.virus_scan_status IS 'Status of antivirus scan (pending, clean, infected, error)';
COMMENT ON COLUMN communication_attachments.compression_status IS 'File compression status';
COMMENT ON COLUMN communication_attachments.download_count IS 'Number of times file has been downloaded';
COMMENT ON COLUMN communication_attachments.last_accessed_at IS 'Timestamp of last file access';
COMMENT ON COLUMN communication_attachments.uploaded_by IS 'User ID who uploaded the file';
COMMENT ON COLUMN communication_attachments.tenant_id IS 'Tenant ID for multi-tenancy support';

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_comm_attachments_blob_url ON communication_attachments(blob_url);
CREATE INDEX IF NOT EXISTS idx_comm_attachments_teams_file_id ON communication_attachments(teams_file_id) WHERE teams_file_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comm_attachments_outlook_id ON communication_attachments(outlook_attachment_id) WHERE outlook_attachment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comm_attachments_scan_status ON communication_attachments(virus_scan_status);
CREATE INDEX IF NOT EXISTS idx_comm_attachments_uploaded_by ON communication_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_comm_attachments_tenant_id ON communication_attachments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comm_attachments_last_accessed ON communication_attachments(last_accessed_at DESC) WHERE last_accessed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comm_attachments_created_at ON communication_attachments(created_at DESC);

-- Create a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_comm_attachments_comm_mime ON communication_attachments(communication_id, mime_type);

-- ============================================================================
-- File Storage Containers Table
-- Track Azure Blob Storage containers and their usage
-- ============================================================================

CREATE TABLE IF NOT EXISTS file_storage_containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_name VARCHAR(255) NOT NULL UNIQUE,
  container_type VARCHAR(100) NOT NULL CHECK (container_type IN ('teams-files', 'email-attachments', 'communication-files', 'general')),
  description TEXT,
  access_level VARCHAR(50) DEFAULT 'private' CHECK (access_level IN ('private', 'blob', 'container')),
  file_count INTEGER DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,
  last_cleanup_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE file_storage_containers IS 'Tracks Azure Blob Storage containers and their metadata';

-- Insert default containers
INSERT INTO file_storage_containers (container_name, container_type, description, access_level)
VALUES
  ('teams-files', 'teams-files', 'Microsoft Teams file uploads', 'private'),
  ('email-attachments', 'email-attachments', 'Email attachments from Outlook', 'private'),
  ('communication-files', 'communication-files', 'General communication file storage', 'private')
ON CONFLICT (container_name) DO NOTHING;

-- ============================================================================
-- Attachment Access Log Table
-- Track who accessed files and when for security/compliance
-- ============================================================================

CREATE TABLE IF NOT EXISTS attachment_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attachment_id INTEGER REFERENCES communication_attachments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(50) NOT NULL CHECK (action IN ('upload', 'download', 'view', 'delete', 'share', 'scan')),
  ip_address INET,
  user_agent TEXT,
  access_method VARCHAR(100), -- 'web', 'api', 'teams', 'outlook', 'mobile'
  metadata JSONB DEFAULT '{}',
  accessed_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE attachment_access_log IS 'Audit trail for all file attachment access';

-- Create indexes for access log
CREATE INDEX IF NOT EXISTS idx_attachment_access_log_attachment ON attachment_access_log(attachment_id);
CREATE INDEX IF NOT EXISTS idx_attachment_access_log_user ON attachment_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_attachment_access_log_action ON attachment_access_log(action);
CREATE INDEX IF NOT EXISTS idx_attachment_access_log_accessed_at ON attachment_access_log(accessed_at DESC);

-- ============================================================================
-- File Virus Scan Results Table
-- Detailed virus scan results for compliance and security
-- ============================================================================

CREATE TABLE IF NOT EXISTS file_virus_scan_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attachment_id INTEGER REFERENCES communication_attachments(id) ON DELETE CASCADE,
  scanner_name VARCHAR(100) NOT NULL, -- 'Azure Security', 'ClamAV', etc.
  scan_result VARCHAR(50) NOT NULL CHECK (scan_result IN ('clean', 'infected', 'suspicious', 'error')),
  threat_names TEXT[], -- List of detected threats
  scan_details JSONB DEFAULT '{}',
  scan_duration_ms INTEGER,
  scanned_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE file_virus_scan_results IS 'Detailed virus scan results for file attachments';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_virus_scan_attachment ON file_virus_scan_results(attachment_id);
CREATE INDEX IF NOT EXISTS idx_virus_scan_result ON file_virus_scan_results(scan_result);
CREATE INDEX IF NOT EXISTS idx_virus_scan_scanned_at ON file_virus_scan_results(scanned_at DESC);

-- ============================================================================
-- File Processing Queue Table
-- Queue for asynchronous file processing (thumbnails, OCR, compression)
-- ============================================================================

CREATE TABLE IF NOT EXISTS file_processing_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attachment_id INTEGER REFERENCES communication_attachments(id) ON DELETE CASCADE,
  processing_type VARCHAR(100) NOT NULL CHECK (processing_type IN ('thumbnail', 'ocr', 'compression', 'virus_scan', 'metadata_extraction')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest, 10 = lowest
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  processing_started_at TIMESTAMP,
  processing_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE file_processing_queue IS 'Queue for asynchronous file processing tasks';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_file_processing_attachment ON file_processing_queue(attachment_id);
CREATE INDEX IF NOT EXISTS idx_file_processing_status ON file_processing_queue(status) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_file_processing_priority ON file_processing_queue(priority, created_at) WHERE status = 'pending';

-- ============================================================================
-- Functions and Triggers
-- ============================================================================

-- Function to update container statistics
CREATE OR REPLACE FUNCTION update_container_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE file_storage_containers
    SET
      file_count = file_count + 1,
      total_size_bytes = total_size_bytes + NEW.file_size_bytes,
      updated_at = NOW()
    WHERE container_name = SPLIT_PART(NEW.storage_path, '/', 1);
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE file_storage_containers
    SET
      file_count = GREATEST(file_count - 1, 0),
      total_size_bytes = GREATEST(total_size_bytes - OLD.file_size_bytes, 0),
      updated_at = NOW()
    WHERE container_name = SPLIT_PART(OLD.storage_path, '/', 1);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update container stats
CREATE TRIGGER trigger_update_container_stats
AFTER INSERT OR DELETE ON communication_attachments
FOR EACH ROW EXECUTE FUNCTION update_container_stats();

-- Function to log file access
CREATE OR REPLACE FUNCTION log_attachment_access(
  p_attachment_id INTEGER,
  p_user_id UUID,
  p_action VARCHAR,
  p_ip_address INET DEFAULT NULL,
  p_access_method VARCHAR DEFAULT 'api'
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO attachment_access_log (
    attachment_id,
    user_id,
    action,
    ip_address,
    access_method
  ) VALUES (
    p_attachment_id,
    p_user_id,
    p_action,
    p_ip_address,
    p_access_method
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to queue file processing
CREATE OR REPLACE FUNCTION queue_file_processing(
  p_attachment_id INTEGER,
  p_processing_type VARCHAR,
  p_priority INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO file_processing_queue (
    attachment_id,
    processing_type,
    priority
  ) VALUES (
    p_attachment_id,
    p_processing_type,
    p_priority
  ) RETURNING id INTO v_queue_id;

  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get orphaned files
CREATE OR REPLACE FUNCTION get_orphaned_attachments(p_days_old INTEGER DEFAULT 30)
RETURNS TABLE (
  id INTEGER,
  filename VARCHAR,
  file_size_bytes BIGINT,
  blob_url VARCHAR,
  created_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ca.id,
    ca.filename,
    ca.file_size_bytes,
    ca.blob_url,
    ca.created_at
  FROM communication_attachments ca
  WHERE ca.communication_id IS NULL
    AND ca.created_at < NOW() - (p_days_old || ' days')::INTERVAL
  ORDER BY ca.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View for attachment statistics by type
CREATE OR REPLACE VIEW v_attachment_stats_by_type AS
SELECT
  mime_type,
  COUNT(*) as file_count,
  SUM(file_size_bytes) as total_size_bytes,
  AVG(file_size_bytes) as avg_size_bytes,
  COUNT(CASE WHEN virus_scan_status = 'clean' THEN 1 END) as clean_count,
  COUNT(CASE WHEN virus_scan_status = 'infected' THEN 1 END) as infected_count,
  COUNT(CASE WHEN thumbnail_url IS NOT NULL THEN 1 END) as with_thumbnail_count
FROM communication_attachments
GROUP BY mime_type
ORDER BY file_count DESC;

COMMENT ON VIEW v_attachment_stats_by_type IS 'Statistics on attachments grouped by MIME type';

-- View for recent file uploads
CREATE OR REPLACE VIEW v_recent_uploads AS
SELECT
  ca.id,
  ca.original_filename,
  ca.file_size_bytes,
  ca.mime_type,
  ca.virus_scan_status,
  ca.created_at,
  u.first_name || ' ' || u.last_name as uploaded_by_name,
  c.subject as communication_subject
FROM communication_attachments ca
LEFT JOIN users u ON ca.uploaded_by = u.id
LEFT JOIN communications c ON ca.communication_id = c.id
WHERE ca.created_at > NOW() - INTERVAL '7 days'
ORDER BY ca.created_at DESC;

COMMENT ON VIEW v_recent_uploads IS 'Files uploaded in the last 7 days';

-- View for files pending virus scan
CREATE OR REPLACE VIEW v_pending_virus_scans AS
SELECT
  ca.id,
  ca.original_filename,
  ca.file_size_bytes,
  ca.mime_type,
  ca.blob_url,
  ca.created_at,
  EXTRACT(EPOCH FROM (NOW() - ca.created_at))/3600 as hours_pending
FROM communication_attachments ca
WHERE ca.virus_scan_status = 'pending'
  AND ca.is_scanned = FALSE
ORDER BY ca.created_at ASC;

COMMENT ON VIEW v_pending_virus_scans IS 'Files awaiting virus scan';

-- ============================================================================
-- Scheduled Maintenance Procedures
-- ============================================================================

-- Procedure to cleanup old SAS URLs (should be run daily)
CREATE OR REPLACE FUNCTION cleanup_expired_sas_urls()
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- SAS URLs expire after 60 minutes, clear them after 2 hours to be safe
  UPDATE communication_attachments
  SET sas_url = NULL
  WHERE sas_url IS NOT NULL
    AND last_accessed_at < NOW() - INTERVAL '2 hours';

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Procedure to cleanup failed processing queue items
CREATE OR REPLACE FUNCTION cleanup_failed_processing_queue()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM file_processing_queue
  WHERE status = 'failed'
    AND created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Grant Permissions
-- ============================================================================

-- Grant permissions on new tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE file_storage_containers TO fleet_user;
GRANT SELECT, INSERT ON TABLE attachment_access_log TO fleet_user;
GRANT SELECT, INSERT, UPDATE ON TABLE file_virus_scan_results TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE file_processing_queue TO fleet_user;

-- Grant permissions on views
GRANT SELECT ON v_attachment_stats_by_type TO fleet_user;
GRANT SELECT ON v_recent_uploads TO fleet_user;
GRANT SELECT ON v_pending_virus_scans TO fleet_user;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION log_attachment_access TO fleet_user;
GRANT EXECUTE ON FUNCTION queue_file_processing TO fleet_user;
GRANT EXECUTE ON FUNCTION get_orphaned_attachments TO fleet_user;
GRANT EXECUTE ON FUNCTION cleanup_expired_sas_urls TO fleet_user;
GRANT EXECUTE ON FUNCTION cleanup_failed_processing_queue TO fleet_user;

-- ============================================================================
-- Sample Data for Testing (Development Only)
-- ============================================================================

-- Note: Add sample data only in development environments
-- Production migrations should not include test data

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 022 completed successfully';
  RAISE NOTICE 'Added Azure Blob Storage support to communication_attachments';
  RAISE NOTICE 'Created file_storage_containers table';
  RAISE NOTICE 'Created attachment_access_log table';
  RAISE NOTICE 'Created file_virus_scan_results table';
  RAISE NOTICE 'Created file_processing_queue table';
  RAISE NOTICE 'Added indexes and views for performance optimization';
END $$;
