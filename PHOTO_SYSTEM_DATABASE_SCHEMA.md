# Photo Upload System - Database Schema

Complete database schema documentation for the Fleet photo upload and processing system.

---

## Tables Overview

### 1. photo_processing_queue

**Purpose:** Queue for asynchronous photo processing jobs

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique job identifier |
| tenant_id | INTEGER | NOT NULL | Tenant identifier |
| user_id | INTEGER | NOT NULL, FK(users) | User who uploaded photo |
| photo_id | INTEGER | NOT NULL, FK(mobile_photos) | Photo to process |
| blob_url | TEXT | NOT NULL | Azure Blob Storage URL |
| status | VARCHAR(20) | NOT NULL, CHECK | pending, processing, completed, failed |
| priority | VARCHAR(10) | NOT NULL, CHECK | high, normal, low |
| retry_count | INTEGER | NOT NULL, DEFAULT 0 | Number of retry attempts |
| max_retries | INTEGER | NOT NULL, DEFAULT 3 | Maximum retry attempts |
| error_message | TEXT | NULL | Error details if failed |
| processing_started_at | TIMESTAMP | NULL | Processing start time |
| processing_completed_at | TIMESTAMP | NULL | Processing completion time |
| created_at | TIMESTAMP | DEFAULT NOW() | Job creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes:**
```sql
idx_photo_processing_queue_tenant (tenant_id)
idx_photo_processing_queue_user (user_id)
idx_photo_processing_queue_photo (photo_id)
idx_photo_processing_queue_status (status)
idx_photo_processing_queue_priority (priority)
idx_photo_processing_queue_created_at (created_at)
idx_photo_processing_queue_processing (status, priority, created_at) WHERE status = 'pending'
idx_photo_processing_queue_unique_active (photo_id) UNIQUE WHERE status IN ('pending', 'processing')
```

**Constraints:**
- Status must be: 'pending', 'processing', 'completed', 'failed'
- Priority must be: 'high', 'normal', 'low'
- ON DELETE CASCADE for user_id and photo_id

---

### 2. mobile_photos (Enhanced)

**Purpose:** Store uploaded photos from mobile app with processing results

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Photo identifier |
| tenant_id | INTEGER | NOT NULL | Tenant identifier |
| user_id | INTEGER | NOT NULL, FK(users) | User who took photo |
| mobile_id | VARCHAR(255) | UNIQUE, NULL | Mobile app ID for sync |
| photo_url | TEXT | NOT NULL | Original photo URL (Azure Blob) |
| **thumbnail_url** | **TEXT** | **NULL** | **Generated thumbnail URL** |
| **compressed_url** | **TEXT** | **NULL** | **Compressed photo URL** |
| **file_name** | **VARCHAR(255)** | **NULL** | **Original filename** |
| **file_size** | **BIGINT** | **NULL** | **File size in bytes** |
| **mime_type** | **VARCHAR(100)** | **NULL** | **MIME type (image/jpeg, etc.)** |
| **width** | **INTEGER** | **NULL** | **Image width in pixels** |
| **height** | **INTEGER** | **NULL** | **Image height in pixels** |
| metadata | JSONB | NULL | Photo metadata (GPS, vehicle, etc.) |
| **exif_data** | **JSONB** | **NULL** | **Extracted EXIF metadata** |
| **ocr_text** | **TEXT** | **NULL** | **OCR extracted text** |
| taken_at | TIMESTAMP | NOT NULL | Photo capture time |
| **processed_at** | **TIMESTAMP** | **NULL** | **Processing completion time** |
| **synced_at** | **TIMESTAMP** | **NULL** | **Sync to server time** |
| **synced_from_device** | **VARCHAR(255)** | **NULL** | **Device ID that synced** |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation time |

**Bold** = New columns added by migration

**Indexes:**
```sql
idx_mobile_photos_tenant (tenant_id)
idx_mobile_photos_user (user_id)
idx_mobile_photos_mobile_id (mobile_id)
idx_mobile_photos_processed_at (processed_at)
idx_mobile_photos_synced_at (synced_at)
idx_mobile_photos_exif_data GIN(exif_data)
idx_mobile_photos_unprocessed (created_at) WHERE processed_at IS NULL
```

**Example EXIF Data Structure:**
```json
{
  "dateTime": "2024:01:15 14:23:45",
  "make": "Apple",
  "model": "iPhone 14 Pro",
  "orientation": 1,
  "gps": {
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude": "10.5m"
  },
  "width": 4032,
  "height": 3024
}
```

**Example Metadata Structure:**
```json
{
  "vehicleId": 123,
  "reportType": "damage",
  "inspectionId": 456,
  "latitude": 37.7749,
  "longitude": -122.4194,
  "tags": ["front-bumper", "scratch"],
  "description": "Minor scratch on front bumper"
}
```

---

### 3. damage_reports (Enhanced)

**Purpose:** Vehicle damage reports with photo support

**New Columns Added:**

| Column | Type | Description |
|--------|------|-------------|
| processed_photo_url | TEXT | Compressed/optimized photo URL |
| thumbnail_url | TEXT | Thumbnail for preview |
| photo_metadata | JSONB | Photo metadata (dimensions, EXIF, etc.) |

**Indexes:**
```sql
idx_damage_reports_photo_metadata GIN(photo_metadata)
```

**Example Usage:**
```sql
UPDATE damage_reports
SET processed_photo_url = 'https://blob.../compressed_123.jpg',
    thumbnail_url = 'https://blob.../thumb_123.jpg',
    photo_metadata = '{
      "width": 1920,
      "height": 1080,
      "fileSize": 1048576,
      "exif": {...}
    }'::jsonb
WHERE id = 123;
```

---

### 4. vehicle_inspections (Enhanced)

**Purpose:** Vehicle inspections with multiple photos

**New Columns Added:**

| Column | Type | Description |
|--------|------|-------------|
| photo_urls | JSONB | Array of photo URLs and thumbnails |
| photo_count | INTEGER | Number of photos (auto-updated) |

**photo_urls Structure:**
```json
[
  {
    "url": "https://blob.../photo1.jpg",
    "thumbnail": "https://blob.../thumb1.jpg",
    "type": "front-view",
    "takenAt": "2024-01-15T14:23:45Z"
  },
  {
    "url": "https://blob.../photo2.jpg",
    "thumbnail": "https://blob.../thumb2.jpg",
    "type": "tire-check",
    "takenAt": "2024-01-15T14:24:12Z"
  }
]
```

**Indexes:**
```sql
idx_vehicle_inspections_photo_urls GIN(photo_urls)
```

**Auto-Update Trigger:**
```sql
-- photo_count automatically updates when photo_urls changes
CREATE TRIGGER trigger_update_inspection_photo_count
AFTER INSERT OR UPDATE OF photo_urls ON vehicle_inspections
FOR EACH ROW
EXECUTE FUNCTION update_inspection_photo_count();
```

---

### 5. fuel_transactions (Enhanced)

**Purpose:** Fuel purchases with receipt photos and OCR

**New Columns Added:**

| Column | Type | Description |
|--------|------|-------------|
| receipt_url | TEXT | Receipt photo URL |
| receipt_thumbnail_url | TEXT | Receipt thumbnail |
| receipt_ocr_text | TEXT | Full OCR text from receipt |
| receipt_ocr_data | JSONB | Structured OCR data |

**receipt_ocr_data Structure:**
```json
{
  "merchant": "Shell Gas Station",
  "date": "2024-01-15",
  "time": "14:23:45",
  "total": 65.50,
  "gallons": 15.2,
  "pricePerGallon": 4.31,
  "paymentMethod": "Credit Card",
  "cardLast4": "1234",
  "receiptNumber": "12345678",
  "confidence": 0.95
}
```

**Indexes:**
```sql
idx_fuel_transactions_receipt_ocr GIN(receipt_ocr_data)
```

**Example Query:**
```sql
-- Find all fuel transactions with OCR data for a vehicle
SELECT
  ft.*,
  ft.receipt_ocr_data->>'merchant' as merchant,
  ft.receipt_ocr_data->>'total' as total_amount
FROM fuel_transactions ft
WHERE vehicle_id = 123
  AND receipt_ocr_data IS NOT NULL
ORDER BY ft.transaction_date DESC;
```

---

## Views

### 1. photo_processing_stats

**Purpose:** Photo upload and processing statistics by tenant

```sql
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
```

**Example Query:**
```sql
SELECT * FROM photo_processing_stats WHERE tenant_id = 1;

-- Results:
-- total_photos: 1000
-- processed_photos: 950
-- unprocessed_photos: 50
-- photos_with_thumbnails: 950
-- photos_compressed: 900
-- photos_with_ocr: 150
-- total_storage_bytes: 1073741824 (1GB)
-- avg_file_size: 1073742 (~1MB)
-- last_7_days: 150
```

---

### 2. photo_queue_health

**Purpose:** Photo processing queue health metrics

```sql
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
```

**Example Query:**
```sql
SELECT * FROM photo_queue_health
WHERE status = 'pending'
ORDER BY oldest_job_minutes DESC;

-- Identify backlogs:
-- tenant_id: 1, status: pending, priority: high, job_count: 50, oldest_job_minutes: 120
```

---

### 3. user_photo_activity

**Purpose:** Photo upload activity by user

```sql
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
```

**Example Query:**
```sql
-- Top uploaders
SELECT * FROM user_photo_activity
ORDER BY total_photos DESC
LIMIT 10;

-- Active users last 7 days
SELECT * FROM user_photo_activity
WHERE photos_last_7_days > 0
ORDER BY photos_last_7_days DESC;
```

---

### 4. stuck_processing_jobs

**Purpose:** Monitor jobs stuck in processing state

```sql
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
```

**Example Query:**
```sql
-- Check for stuck jobs
SELECT * FROM stuck_processing_jobs;

-- Alert if any found:
-- id: abc-123, photo_id: 456, processing_minutes: 65, user_name: John Doe
```

---

## Functions

### 1. update_inspection_photo_count()

**Purpose:** Automatically update photo_count when photo_urls changes

```sql
CREATE OR REPLACE FUNCTION update_inspection_photo_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE vehicle_inspections
    SET photo_count = jsonb_array_length(photo_urls)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger:**
```sql
CREATE TRIGGER trigger_update_inspection_photo_count
AFTER INSERT OR UPDATE OF photo_urls ON vehicle_inspections
FOR EACH ROW
EXECUTE FUNCTION update_inspection_photo_count();
```

---

### 2. auto_queue_high_priority_photos()

**Purpose:** Automatically queue damage report photos with high priority

```sql
CREATE OR REPLACE FUNCTION auto_queue_high_priority_photos()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.metadata->>'reportType' = 'damage' THEN
        INSERT INTO photo_processing_queue (tenant_id, user_id, photo_id, blob_url, priority)
        VALUES (NEW.tenant_id, NEW.user_id, NEW.id, NEW.photo_url, 'high')
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger:**
```sql
CREATE TRIGGER trigger_auto_queue_high_priority
AFTER INSERT ON mobile_photos
FOR EACH ROW
EXECUTE FUNCTION auto_queue_high_priority_photos();
```

---

### 3. cleanup_old_processing_queue_entries()

**Purpose:** Remove completed processing jobs older than 30 days

```sql
CREATE OR REPLACE FUNCTION cleanup_old_processing_queue_entries()
RETURNS void AS $$
BEGIN
    DELETE FROM photo_processing_queue
    WHERE status = 'completed'
      AND processing_completed_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
```

**Usage:**
```sql
-- Run manually or via cron
SELECT cleanup_old_processing_queue_entries();

-- Schedule with pg_cron:
SELECT cron.schedule('cleanup-photo-queue', '0 2 * * *',
  'SELECT cleanup_old_processing_queue_entries()');
```

---

## Relationships

```
users
  │
  ├─> mobile_photos (user_id)
  │     │
  │     ├─> photo_processing_queue (photo_id)
  │     │
  │     └─> damage_reports (via metadata)
  │           vehicle_inspections (via metadata)
  │           fuel_transactions (via metadata)
  │
  └─> photo_processing_queue (user_id)

mobile_photos
  │
  └─> photo_processing_queue (photo_id)
```

---

## Indexes Summary

### Performance Indexes

1. **Queue Processing:**
   - `idx_photo_processing_queue_processing` - Find pending jobs by priority
   - `idx_photo_processing_queue_unique_active` - Prevent duplicate active jobs

2. **Photo Lookup:**
   - `idx_mobile_photos_unprocessed` - Find unprocessed photos
   - `idx_mobile_photos_synced_at` - Sync queries

3. **JSONB Search:**
   - `idx_mobile_photos_exif_data` - EXIF data queries
   - `idx_fuel_transactions_receipt_ocr` - OCR data queries
   - `idx_damage_reports_photo_metadata` - Photo metadata queries

### Storage Optimization

**Partial Indexes:**
```sql
-- Only index unprocessed photos
CREATE INDEX idx_mobile_photos_unprocessed
ON mobile_photos(created_at)
WHERE processed_at IS NULL;

-- Only index active queue jobs
CREATE INDEX idx_photo_processing_queue_processing
ON photo_processing_queue(status, priority, created_at)
WHERE status = 'pending';
```

---

## Sample Queries

### 1. Queue Monitoring

```sql
-- Current queue status
SELECT status, priority, COUNT(*) as count
FROM photo_processing_queue
GROUP BY status, priority
ORDER BY priority, status;

-- Processing rate (last hour)
SELECT
  DATE_TRUNC('hour', processing_completed_at) as hour,
  COUNT(*) as photos_processed,
  AVG(EXTRACT(EPOCH FROM (processing_completed_at - processing_started_at))) as avg_seconds
FROM photo_processing_queue
WHERE status = 'completed'
  AND processing_completed_at > NOW() - INTERVAL '1 hour'
GROUP BY hour;

-- Failed jobs with errors
SELECT id, photo_id, retry_count, error_message, created_at
FROM photo_processing_queue
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 20;
```

---

### 2. Photo Analytics

```sql
-- Photos by type
SELECT
  metadata->>'reportType' as report_type,
  COUNT(*) as count,
  SUM(file_size) as total_bytes
FROM mobile_photos
GROUP BY metadata->>'reportType'
ORDER BY count DESC;

-- Photos with GPS data
SELECT
  id,
  exif_data->'gps'->>'latitude' as lat,
  exif_data->'gps'->>'longitude' as lon,
  taken_at
FROM mobile_photos
WHERE exif_data ? 'gps'
ORDER BY taken_at DESC;

-- Unprocessed photos older than 1 hour
SELECT id, photo_url, created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as age_minutes
FROM mobile_photos
WHERE processed_at IS NULL
  AND created_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at;
```

---

### 3. Storage Analysis

```sql
-- Storage by tenant
SELECT
  tenant_id,
  COUNT(*) as photos,
  SUM(file_size) as original_bytes,
  SUM(file_size) FILTER (WHERE compressed_url IS NOT NULL) as compressed_bytes,
  ROUND(100.0 * COUNT(*) FILTER (WHERE compressed_url IS NOT NULL) / COUNT(*), 2) as compression_rate
FROM mobile_photos
GROUP BY tenant_id
ORDER BY original_bytes DESC;

-- Storage trend (daily)
SELECT
  DATE(created_at) as date,
  COUNT(*) as photos,
  SUM(file_size) as bytes,
  ROUND(AVG(file_size), 0) as avg_bytes
FROM mobile_photos
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

### 4. User Activity

```sql
-- Most active users (last 7 days)
SELECT * FROM user_photo_activity
WHERE photos_last_7_days > 0
ORDER BY photos_last_7_days DESC
LIMIT 10;

-- Users not uploading
SELECT * FROM user_photo_activity
WHERE last_upload_at < NOW() - INTERVAL '30 days'
  OR last_upload_at IS NULL
ORDER BY last_upload_at NULLS FIRST;
```

---

### 5. OCR Analytics

```sql
-- Fuel receipts with OCR
SELECT
  ft.id,
  ft.transaction_date,
  ft.receipt_ocr_data->>'merchant' as merchant,
  (ft.receipt_ocr_data->>'total')::numeric as total,
  (ft.receipt_ocr_data->>'gallons')::numeric as gallons,
  (ft.receipt_ocr_data->>'confidence')::numeric as ocr_confidence
FROM fuel_transactions ft
WHERE ft.receipt_ocr_data IS NOT NULL
ORDER BY ft.transaction_date DESC;

-- OCR accuracy
SELECT
  AVG((receipt_ocr_data->>'confidence')::numeric) as avg_confidence,
  COUNT(*) FILTER (WHERE (receipt_ocr_data->>'confidence')::numeric > 0.9) as high_confidence,
  COUNT(*) as total
FROM fuel_transactions
WHERE receipt_ocr_data IS NOT NULL;
```

---

## Maintenance

### Daily Tasks

```sql
-- Clean up old completed jobs
SELECT cleanup_old_processing_queue_entries();

-- Check for stuck jobs
SELECT COUNT(*) FROM stuck_processing_jobs;

-- Monitor queue backlog
SELECT COUNT(*) FROM photo_processing_queue WHERE status = 'pending';
```

### Weekly Tasks

```sql
-- VACUUM ANALYZE for updated tables
VACUUM ANALYZE mobile_photos;
VACUUM ANALYZE photo_processing_queue;
VACUUM ANALYZE fuel_transactions;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename IN ('mobile_photos', 'photo_processing_queue')
ORDER BY idx_scan;
```

### Monthly Tasks

```sql
-- Archive old photos (optional)
CREATE TABLE mobile_photos_archive AS
SELECT * FROM mobile_photos
WHERE created_at < NOW() - INTERVAL '12 months';

DELETE FROM mobile_photos
WHERE created_at < NOW() - INTERVAL '12 months';
```

---

## Migration Rollback

If you need to rollback the migration:

```sql
-- Drop new table
DROP TABLE IF EXISTS photo_processing_queue CASCADE;

-- Drop new columns from mobile_photos
ALTER TABLE mobile_photos DROP COLUMN IF EXISTS thumbnail_url;
ALTER TABLE mobile_photos DROP COLUMN IF EXISTS compressed_url;
ALTER TABLE mobile_photos DROP COLUMN IF EXISTS exif_data;
ALTER TABLE mobile_photos DROP COLUMN IF EXISTS ocr_text;
ALTER TABLE mobile_photos DROP COLUMN IF EXISTS width;
ALTER TABLE mobile_photos DROP COLUMN IF EXISTS height;
ALTER TABLE mobile_photos DROP COLUMN IF EXISTS processed_at;
ALTER TABLE mobile_photos DROP COLUMN IF EXISTS synced_at;
ALTER TABLE mobile_photos DROP COLUMN IF EXISTS synced_from_device;
ALTER TABLE mobile_photos DROP COLUMN IF EXISTS file_size;
ALTER TABLE mobile_photos DROP COLUMN IF EXISTS mime_type;
ALTER TABLE mobile_photos DROP COLUMN IF EXISTS file_name;

-- Drop views
DROP VIEW IF EXISTS photo_processing_stats;
DROP VIEW IF EXISTS photo_queue_health;
DROP VIEW IF EXISTS user_photo_activity;
DROP VIEW IF EXISTS stuck_processing_jobs;

-- Drop functions
DROP FUNCTION IF EXISTS update_inspection_photo_count();
DROP FUNCTION IF EXISTS auto_queue_high_priority_photos();
DROP FUNCTION IF EXISTS cleanup_old_processing_queue_entries();
```

---

## Backup Recommendations

```bash
# Backup photo processing data
pg_dump -U postgres -d fleet_db \
  -t mobile_photos \
  -t photo_processing_queue \
  -f photo_system_backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres -d fleet_db -f photo_system_backup_20240115.sql
```

---

**Schema Version:** 1.0.0
**Migration:** 024_photo_processing_queue.sql
**Last Updated:** November 17, 2025
