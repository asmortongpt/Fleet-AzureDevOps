-- Migration: Photo Processing Queue and Enhanced Mobile Photos
-- Description: Add photo processing queue, enhance mobile_photos table, and update related tables
-- Dependencies: 015_mobile_integration.sql

-- =====================================================
-- Photo Processing Queue Table
-- =====================================================

CREATE TABLE IF NOT EXISTS photo_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_id INTEGER NOT NULL REFERENCES mobile_photos(id) ON DELETE CASCADE,
    blob_url TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    error_message TEXT,
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_photo_processing_queue_tenant ON photo_processing_queue(tenant_id);
CREATE INDEX idx_photo_processing_queue_user ON photo_processing_queue(user_id);
CREATE INDEX idx_photo_processing_queue_photo ON photo_processing_queue(photo_id);
CREATE INDEX idx_photo_processing_queue_status ON photo_processing_queue(status);
CREATE INDEX idx_photo_processing_queue_priority ON photo_processing_queue(priority);
CREATE INDEX idx_photo_processing_queue_created_at ON photo_processing_queue(created_at);

-- Composite index for queue processing
CREATE INDEX idx_photo_processing_queue_processing ON photo_processing_queue(status, priority, created_at)
WHERE status = 'pending';

COMMENT ON TABLE photo_processing_queue IS 'Queue for asynchronous photo processing (thumbnails, compression, EXIF, OCR)';
COMMENT ON COLUMN photo_processing_queue.status IS 'Processing status: pending, processing, completed, failed';
COMMENT ON COLUMN photo_processing_queue.priority IS 'Processing priority: high (damage reports), normal, low';
COMMENT ON COLUMN photo_processing_queue.retry_count IS 'Number of processing retry attempts';

-- =====================================================
-- Enhance Mobile Photos Table
-- =====================================================

-- Add new columns for processing results
ALTER TABLE mobile_photos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE mobile_photos ADD COLUMN IF NOT EXISTS compressed_url TEXT;
ALTER TABLE mobile_photos ADD COLUMN IF NOT EXISTS exif_data JSONB;
ALTER TABLE mobile_photos ADD COLUMN IF NOT EXISTS ocr_text TEXT;
ALTER TABLE mobile_photos ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE mobile_photos ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE mobile_photos ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;
ALTER TABLE mobile_photos ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP;
ALTER TABLE mobile_photos ADD COLUMN IF NOT EXISTS synced_from_device VARCHAR(255);
ALTER TABLE mobile_photos ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE mobile_photos ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
ALTER TABLE mobile_photos ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_mobile_photos_processed_at ON mobile_photos(processed_at);
CREATE INDEX IF NOT EXISTS idx_mobile_photos_synced_at ON mobile_photos(synced_at);
CREATE INDEX IF NOT EXISTS idx_mobile_photos_exif_data ON mobile_photos USING GIN(exif_data);

-- Update existing mobile_id column to be nullable (some photos may not come from mobile)
ALTER TABLE mobile_photos ALTER COLUMN mobile_id DROP NOT NULL;

COMMENT ON COLUMN mobile_photos.thumbnail_url IS 'URL of generated thumbnail (300x300)';
COMMENT ON COLUMN mobile_photos.compressed_url IS 'URL of compressed/optimized image';
COMMENT ON COLUMN mobile_photos.exif_data IS 'Extracted EXIF metadata (GPS, camera info, etc.)';
COMMENT ON COLUMN mobile_photos.ocr_text IS 'Extracted text from OCR processing';
COMMENT ON COLUMN mobile_photos.processed_at IS 'Timestamp when photo processing completed';
COMMENT ON COLUMN mobile_photos.synced_at IS 'Timestamp when photo was synced to server';

-- =====================================================
-- Update Damage Reports Table
-- =====================================================

-- Add photo-related columns to damage_reports
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'damage_reports') THEN
        ALTER TABLE damage_reports ADD COLUMN IF NOT EXISTS processed_photo_url TEXT;
        ALTER TABLE damage_reports ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
        ALTER TABLE damage_reports ADD COLUMN IF NOT EXISTS photo_metadata JSONB;

        CREATE INDEX IF NOT EXISTS idx_damage_reports_photo_metadata ON damage_reports USING GIN(photo_metadata);

        COMMENT ON COLUMN damage_reports.processed_photo_url IS 'URL of processed/compressed photo';
        COMMENT ON COLUMN damage_reports.thumbnail_url IS 'URL of thumbnail for quick preview';
    END IF;
END
$$;

-- =====================================================
-- Update Vehicle Inspections Table
-- =====================================================

-- Add photo-related columns to vehicle_inspections
ALTER TABLE vehicle_inspections ADD COLUMN IF NOT EXISTS photo_urls JSONB DEFAULT '[]'::jsonb;
ALTER TABLE vehicle_inspections ADD COLUMN IF NOT EXISTS photo_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_photo_urls ON vehicle_inspections USING GIN(photo_urls);

COMMENT ON COLUMN vehicle_inspections.photo_urls IS 'Array of photo URLs and thumbnails for inspection';
COMMENT ON COLUMN vehicle_inspections.photo_count IS 'Number of photos attached to inspection';

-- =====================================================
-- Update Fuel Transactions Table (if exists)
-- =====================================================

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fuel_transactions') THEN
        ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS receipt_url TEXT;
        ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS receipt_thumbnail_url TEXT;
        ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS receipt_ocr_text TEXT;
        ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS receipt_ocr_data JSONB;

        CREATE INDEX IF NOT EXISTS idx_fuel_transactions_receipt_ocr ON fuel_transactions USING GIN(receipt_ocr_data);

        COMMENT ON COLUMN fuel_transactions.receipt_url IS 'URL of fuel receipt photo';
        COMMENT ON COLUMN fuel_transactions.receipt_ocr_text IS 'Text extracted from receipt via OCR';
        COMMENT ON COLUMN fuel_transactions.receipt_ocr_data IS 'Structured data extracted from receipt';
    END IF;
END
$$;

-- =====================================================
-- Create Views for Photo Analytics
-- =====================================================

-- Photo processing statistics view
CREATE OR REPLACE VIEW photo_processing_stats AS
SELECT
    tenant_id,
    COUNT(*) as total_photos,
    COUNT(*) FILTER (WHERE processed_at IS NOT NULL) as processed_photos,
    COUNT(*) FILTER (WHERE processed_at IS NULL) as unprocessed_photos,
    COUNT(*) FILTER (WHERE thumbnail_url IS NOT NULL) as photos_with_thumbnails,
    COUNT(*) FILTER (WHERE compressed_url IS NOT NULL) as photos_compressed,
    COUNT(*) FILTER (WHERE ocr_text IS NOT NULL) as photos_with_ocr,
    COUNT(*) FILTER (WHERE exif_data IS NOT NULL) as photos_with_exif,
    SUM(file_size) as total_storage_bytes,
    AVG(file_size) as avg_file_size,
    MAX(created_at) as latest_upload,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as last_30_days
FROM mobile_photos
GROUP BY tenant_id;

COMMENT ON VIEW photo_processing_stats IS 'Photo upload and processing statistics by tenant';

-- Photo queue health view
CREATE OR REPLACE VIEW photo_queue_health AS
SELECT
    tenant_id,
    status,
    priority,
    COUNT(*) as job_count,
    AVG(retry_count) as avg_retries,
    MAX(created_at) as newest_job,
    MIN(created_at) as oldest_job,
    EXTRACT(EPOCH FROM (NOW() - MIN(created_at)))/60 as oldest_job_minutes
FROM photo_processing_queue
GROUP BY tenant_id, status, priority;

COMMENT ON VIEW photo_queue_health IS 'Photo processing queue health metrics';

-- User photo upload activity
CREATE OR REPLACE VIEW user_photo_activity AS
SELECT
    u.tenant_id,
    u.id as user_id,
    u.name as user_name,
    u.email,
    COUNT(mp.id) as total_photos,
    COUNT(mp.id) FILTER (WHERE mp.created_at >= CURRENT_DATE - INTERVAL '7 days') as photos_last_7_days,
    COUNT(mp.id) FILTER (WHERE mp.created_at >= CURRENT_DATE - INTERVAL '30 days') as photos_last_30_days,
    SUM(mp.file_size) as total_storage_bytes,
    MAX(mp.created_at) as last_upload_at,
    COUNT(DISTINCT DATE(mp.created_at)) as active_days
FROM users u
LEFT JOIN mobile_photos mp ON mp.user_id = u.id
GROUP BY u.tenant_id, u.id, u.name, u.email;

COMMENT ON VIEW user_photo_activity IS 'Photo upload activity by user';

-- =====================================================
-- Create Functions
-- =====================================================

-- Function to update photo_count on vehicle_inspections
CREATE OR REPLACE FUNCTION update_inspection_photo_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE vehicle_inspections
    SET photo_count = jsonb_array_length(photo_urls)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update photo_count
DROP TRIGGER IF EXISTS trigger_update_inspection_photo_count ON vehicle_inspections;
CREATE TRIGGER trigger_update_inspection_photo_count
AFTER INSERT OR UPDATE OF photo_urls ON vehicle_inspections
FOR EACH ROW
EXECUTE FUNCTION update_inspection_photo_count();

-- Function to automatically add high-priority photos to processing queue
CREATE OR REPLACE FUNCTION auto_queue_high_priority_photos()
RETURNS TRIGGER AS $$
BEGIN
    -- Auto-queue damage report photos with high priority
    IF NEW.metadata->>'reportType' = 'damage' THEN
        INSERT INTO photo_processing_queue (tenant_id, user_id, photo_id, blob_url, priority)
        VALUES (NEW.tenant_id, NEW.user_id, NEW.id, NEW.photo_url, 'high')
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-queue high-priority photos
DROP TRIGGER IF EXISTS trigger_auto_queue_high_priority ON mobile_photos;
CREATE TRIGGER trigger_auto_queue_high_priority
AFTER INSERT ON mobile_photos
FOR EACH ROW
EXECUTE FUNCTION auto_queue_high_priority_photos();

-- Function to clean up old processing queue entries
CREATE OR REPLACE FUNCTION cleanup_old_processing_queue_entries()
RETURNS void AS $$
BEGIN
    DELETE FROM photo_processing_queue
    WHERE status = 'completed'
      AND processing_completed_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_processing_queue_entries IS 'Remove completed processing jobs older than 30 days';

-- =====================================================
-- Triggers for Updated Timestamp
-- =====================================================

CREATE TRIGGER update_photo_processing_queue_updated_at
BEFORE UPDATE ON photo_processing_queue
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Sample Data (for testing)
-- =====================================================

-- Sample processing queue entries
DO $$
DECLARE
    sample_photo_id INTEGER;
BEGIN
    -- Get a sample photo
    SELECT id INTO sample_photo_id FROM mobile_photos LIMIT 1;

    IF sample_photo_id IS NOT NULL THEN
        INSERT INTO photo_processing_queue (tenant_id, user_id, photo_id, blob_url, status, priority)
        SELECT
            tenant_id,
            user_id,
            id,
            photo_url,
            'pending',
            'normal'
        FROM mobile_photos
        WHERE id = sample_photo_id
        ON CONFLICT DO NOTHING;
    END IF;
END
$$;

-- =====================================================
-- Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON photo_processing_queue TO fleetapp;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fleetapp;
GRANT SELECT ON photo_processing_stats TO fleetapp;
GRANT SELECT ON photo_queue_health TO fleetapp;
GRANT SELECT ON user_photo_activity TO fleetapp;

-- =====================================================
-- Performance Optimizations
-- =====================================================

-- Partial index for pending photos that need processing
CREATE INDEX IF NOT EXISTS idx_mobile_photos_unprocessed
ON mobile_photos(created_at)
WHERE processed_at IS NULL;

-- Index for finding photos by GPS coordinates (if PostGIS is enabled)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
        CREATE INDEX IF NOT EXISTS idx_mobile_photos_gps
        ON mobile_photos USING GIST(
            ST_SetSRID(
                ST_MakePoint(
                    (exif_data->>'gps'->>'longitude')::float,
                    (exif_data->>'gps'->>'latitude')::float
                ),
                4326
            )::geography
        )
        WHERE exif_data ? 'gps';
    END IF;
END
$$;

-- =====================================================
-- Monitoring Queries
-- =====================================================

-- View for monitoring stuck processing jobs
CREATE OR REPLACE VIEW stuck_processing_jobs AS
SELECT
    ppq.*,
    mp.file_name,
    u.name as user_name,
    EXTRACT(EPOCH FROM (NOW() - ppq.processing_started_at))/60 as processing_minutes
FROM photo_processing_queue ppq
JOIN mobile_photos mp ON mp.id = ppq.photo_id
JOIN users u ON u.id = ppq.user_id
WHERE ppq.status = 'processing'
  AND ppq.processing_started_at < NOW() - INTERVAL '30 minutes'
ORDER BY ppq.processing_started_at;

COMMENT ON VIEW stuck_processing_jobs IS 'Processing jobs stuck for more than 30 minutes';

-- =====================================================
-- Data Integrity Constraints
-- =====================================================

-- Ensure photo processing queue has unique photo entries per status
CREATE UNIQUE INDEX IF NOT EXISTS idx_photo_processing_queue_unique_active
ON photo_processing_queue(photo_id)
WHERE status IN ('pending', 'processing');

-- =====================================================
-- Completion Message
-- =====================================================

DO $$
DECLARE
    photo_count INTEGER;
    queue_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO photo_count FROM mobile_photos;
    SELECT COUNT(*) INTO queue_count FROM photo_processing_queue;

    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Photo Processing Queue Migration Completed Successfully!';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Mobile Photos: %', photo_count;
    RAISE NOTICE 'Processing Queue Jobs: %', queue_count;
    RAISE NOTICE '';
    RAISE NOTICE 'New Tables:';
    RAISE NOTICE '  - photo_processing_queue';
    RAISE NOTICE '';
    RAISE NOTICE 'Enhanced Tables:';
    RAISE NOTICE '  - mobile_photos (added processing columns)';
    RAISE NOTICE '  - damage_reports (added photo columns)';
    RAISE NOTICE '  - vehicle_inspections (added photo columns)';
    RAISE NOTICE '  - fuel_transactions (added receipt columns)';
    RAISE NOTICE '';
    RAISE NOTICE 'New Views:';
    RAISE NOTICE '  - photo_processing_stats';
    RAISE NOTICE '  - photo_queue_health';
    RAISE NOTICE '  - user_photo_activity';
    RAISE NOTICE '  - stuck_processing_jobs';
    RAISE NOTICE '====================================================';
END
$$;
