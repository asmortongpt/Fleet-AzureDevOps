-- Enterprise Document Management System with OCR and Mobile Capture
-- Handles receipts, invoices, forms, photos, and all fleet-related documentation

-- ============================================================================
-- Document Categories & Types
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(100) NOT NULL UNIQUE,
    parent_category_id UUID REFERENCES document_categories(id),
    description TEXT,
    icon VARCHAR(50), -- Icon name for UI
    color VARCHAR(20), -- Color code for UI
    retention_years INTEGER DEFAULT 7,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);

-- Insert standard categories
INSERT INTO document_categories (category_name, description, retention_years) VALUES
('Receipts', 'Fuel receipts, maintenance receipts, toll receipts, etc.', 7),
('Invoices', 'Vendor invoices, service invoices', 7),
('Safety Forms', 'OSHA forms, safety inspections, incident reports', 30),
('Vehicle Documentation', 'Registration, title, insurance, inspection certificates', 7),
('Driver Documentation', 'Licenses, certifications, medical cards', 7),
('Maintenance Records', 'Service records, repair orders, parts receipts', 7),
('Compliance Documents', 'Permits, licenses, regulatory filings', 10),
('Contracts', 'Vendor contracts, leases, agreements', 10),
('Photos', 'Vehicle photos, damage photos, incident photos', 5),
('Reports', 'Fleet reports, analytics, audits', 5)
ON CONFLICT (category_name) DO NOTHING;

-- ============================================================================
-- Main Documents Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_name VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_name VARCHAR(500);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_number VARCHAR(100);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_category_id UUID REFERENCES document_categories(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_type VARCHAR(100);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS original_filename VARCHAR(500);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_extension VARCHAR(20);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_path VARCHAR(1000);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_url VARCHAR(1000);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(1000);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS upload_method VARCHAR(50);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES drivers(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS upload_device_info JSONB;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_processed BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_provider VARCHAR(50);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_confidence_score DECIMAL(5,4);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_language VARCHAR(10) DEFAULT 'en';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_raw_text TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_structured_data JSONB;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_processing_time_ms INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_processed_at TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_detected_type VARCHAR(100);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(5,4);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_extracted_entities JSONB;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_tags TEXT[];
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS related_vehicle_id UUID REFERENCES vehicles(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS related_driver_id UUID REFERENCES drivers(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS manual_tags TEXT[];
ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_date DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12,2);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS subtotal_amount DECIMAL(12,2);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS vendor_location VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS access_restricted_to_roles VARCHAR(100)[];
ALTER TABLE documents ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS parent_document_id UUID REFERENCES documents(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT TRUE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS archived_by UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS retention_until DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_legal_hold BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS legal_hold_reason TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS full_text_search TSVECTOR;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Generated columns (add separately as they might already exist or fail if added via ADD COLUMN IF NOT EXISTS)
DO $$ BEGIN
    ALTER TABLE documents ADD COLUMN document_year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM document_date)) STORED;
    ALTER TABLE documents ADD COLUMN document_month INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM document_date)) STORED;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Constraints
DO $$ BEGIN
    ALTER TABLE documents ADD CONSTRAINT documents_document_number_key UNIQUE (document_number);
EXCEPTION
    WHEN duplicate_table OR duplicate_object THEN null;
END $$;

-- ============================================================================
-- Document Pages (for multi-page documents like PDFs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) NOT NULL,
    page_number INTEGER NOT NULL,

    -- Page File
    page_image_url VARCHAR(1000),
    page_thumbnail_url VARCHAR(1000),

    -- OCR per Page
    ocr_text TEXT,
    ocr_confidence DECIMAL(5,4),
    ocr_bounding_boxes JSONB, -- Word/line positions for highlighting

    -- AI Analysis per Page
    ai_detected_content_type VARCHAR(100), -- 'Table', 'Form', 'Text', 'Image', 'Mixed'
    ai_extracted_tables JSONB,
    ai_extracted_forms JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(document_id, page_number)
);

-- ============================================================================
-- Receipt Line Items (extracted from receipts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS receipt_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) NOT NULL,

    line_number INTEGER NOT NULL,
    item_description VARCHAR(500),
    quantity DECIMAL(10,3),
    unit_price DECIMAL(12,2),
    line_total DECIMAL(12,2),

    -- Product Classification
    product_category VARCHAR(100), -- 'Fuel', 'Parts', 'Labor', 'Supplies', etc.
    product_code VARCHAR(100),

    -- Tax
    is_taxable BOOLEAN DEFAULT TRUE,
    tax_rate DECIMAL(5,4),
    tax_amount DECIMAL(12,2),

    -- Approval & Coding
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID,
    approved_at TIMESTAMP,
    gl_account_code VARCHAR(50), -- General ledger account code
    cost_center VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Mobile Camera Capture Metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS camera_capture_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) UNIQUE NOT NULL,

    -- Camera & Device
    device_manufacturer VARCHAR(100),
    device_model VARCHAR(100),
    os_name VARCHAR(50),
    os_version VARCHAR(50),
    app_version VARCHAR(50),

    -- Photo Metadata
    photo_taken_at TIMESTAMP NOT NULL,
    camera_make VARCHAR(100),
    camera_model VARCHAR(100),
    focal_length DECIMAL(10,2),
    aperture DECIMAL(5,2),
    iso INTEGER,
    flash_used BOOLEAN,
    orientation INTEGER, -- EXIF orientation

    -- Location (if permission granted)
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    altitude DECIMAL(10,2),
    location_accuracy DECIMAL(10,2),
    location_address TEXT,

    -- Image Quality
    image_width INTEGER,
    image_height INTEGER,
    image_resolution_dpi INTEGER,
    file_size_original_bytes BIGINT,
    file_size_compressed_bytes BIGINT,
    compression_ratio DECIMAL(5,2),

    -- Auto-Enhancement Applied
    auto_crop_applied BOOLEAN DEFAULT FALSE,
    auto_rotate_applied BOOLEAN DEFAULT FALSE,
    auto_brightness_applied BOOLEAN DEFAULT FALSE,
    auto_contrast_applied BOOLEAN DEFAULT FALSE,
    edge_detection_applied BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Document Processing Queue
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) NOT NULL,

    -- Processing Job
    job_type VARCHAR(100) NOT NULL, -- 'OCR', 'AI_Classification', 'Thumbnail', 'Virus_Scan', 'Entity_Extraction'
    priority INTEGER DEFAULT 5, -- 1=highest, 10=lowest
    status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Processing', 'Completed', 'Failed', 'Retrying'

    -- Timing
    queued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    processing_duration_ms INTEGER,

    -- Results
    result JSONB,
    error_message TEXT,

    -- Retries
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP,

    -- Worker
    processed_by_worker VARCHAR(100), -- Worker ID/hostname

    CONSTRAINT unique_document_job UNIQUE(document_id, job_type, status)
);

-- ============================================================================
-- Document Sharing & Collaboration
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) NOT NULL,

    -- Share Target
    shared_with_user_id UUID REFERENCES drivers(id),
    shared_with_role VARCHAR(100),
    shared_with_email VARCHAR(255),

    -- Permissions
    can_view BOOLEAN DEFAULT TRUE,
    can_download BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_reshare BOOLEAN DEFAULT FALSE,

    -- Link Sharing
    share_token VARCHAR(100) UNIQUE,
    is_public_link BOOLEAN DEFAULT FALSE,
    link_expires_at TIMESTAMP,
    link_password_hash VARCHAR(255),

    -- Usage Tracking
    access_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP,

    -- Lifecycle
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    revoked_at TIMESTAMP,
    revoked_by INTEGER,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- Document Comments & Annotations
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) NOT NULL,
    page_number INTEGER, -- NULL for document-level comments

    -- Comment
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(50) DEFAULT 'General', -- 'General', 'Question', 'Issue', 'Approval', 'Rejection'

    -- Annotations (for marking up images/PDFs)
    annotation_data JSONB, -- {type: 'highlight|rectangle|arrow', coordinates: {...}, color: '#ff0000'}

    -- Author
    created_by UUID REFERENCES drivers(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Thread
    parent_comment_id UUID REFERENCES document_comments(id),
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by INTEGER,
    resolved_at TIMESTAMP,

    -- Status
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP
);

-- ============================================================================
-- Document Audit Log
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) NOT NULL,

    -- Action
    action_type VARCHAR(100) NOT NULL, -- 'Uploaded', 'Viewed', 'Downloaded', 'Updated', 'Deleted', 'Shared', 'Approved', 'Rejected'
    action_description TEXT,

    -- Actor
    performed_by UUID REFERENCES drivers(id),
    performed_by_ip VARCHAR(50),
    performed_by_device JSONB,

    -- Changes (for Updates)
    old_values JSONB,
    new_values JSONB,

    -- Timestamp
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- OCR Training & Correction
-- ============================================================================

CREATE TABLE IF NOT EXISTS ocr_corrections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) NOT NULL,

    -- Original OCR
    ocr_text_original TEXT NOT NULL,
    ocr_confidence_original DECIMAL(5,4),

    -- Corrected Text
    ocr_text_corrected TEXT NOT NULL,
    correction_type VARCHAR(50), -- 'Manual', 'AI_Assisted', 'Spell_Check'

    -- Corrected By
    corrected_by UUID REFERENCES drivers(id) NOT NULL,
    corrected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Feedback Loop (for ML training)
    sent_to_training BOOLEAN DEFAULT FALSE,
    training_batch_id VARCHAR(100)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(document_category_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_date ON documents(document_date DESC);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_vehicle ON documents(related_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_documents_driver ON documents(related_driver_id);
CREATE INDEX IF NOT EXISTS idx_documents_vendor ON documents(vendor_name);
CREATE INDEX IF NOT EXISTS idx_documents_fulltext ON documents USING GIN(full_text_search);
CREATE INDEX IF NOT EXISTS idx_documents_ocr_text ON documents USING GIN(to_tsvector('english', COALESCE(ocr_raw_text, '')));
CREATE INDEX IF NOT EXISTS idx_documents_ai_tags ON documents USING GIN(ai_tags);

CREATE INDEX IF NOT EXISTS idx_pages_document ON document_pages(document_id, page_number);

CREATE INDEX IF NOT EXISTS idx_receipt_items_document ON receipt_line_items(document_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_category ON receipt_line_items(product_category);

CREATE INDEX IF NOT EXISTS idx_processing_queue_status ON document_processing_queue(status, priority, queued_at);
CREATE INDEX IF NOT EXISTS idx_processing_queue_document ON document_processing_queue(document_id);

CREATE INDEX IF NOT EXISTS idx_shares_document ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_shares_user ON document_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_shares_token ON document_shares(share_token) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_comments_document ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON document_comments(created_by);

CREATE INDEX IF NOT EXISTS idx_audit_document ON document_audit_log(document_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON document_audit_log(action_type, performed_at DESC);

-- ============================================================================
-- Full-Text Search Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_document_fulltext()
RETURNS TRIGGER AS $$
BEGIN
    NEW.full_text_search :=
        setweight(to_tsvector('english', COALESCE(NEW.document_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.ocr_raw_text, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.vendor_name, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.ai_tags, ' '), '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.manual_tags, ' '), '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_document_fulltext
BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_document_fulltext();

-- ============================================================================
-- Automatic Retention Date Calculation
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_retention_date()
RETURNS TRIGGER AS $$
BEGIN
    SELECT retention_until_date(NEW.document_category_id, NEW.document_date)
    INTO NEW.retention_until;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION retention_until_date(category_id UUID, doc_date DATE)
RETURNS DATE AS $$
DECLARE
    retention_years INTEGER;
BEGIN
    SELECT dc.retention_years INTO retention_years
    FROM document_categories dc
    WHERE dc.id = category_id;

    RETURN COALESCE(doc_date, CURRENT_DATE) + (retention_years || ' years')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_retention
BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION calculate_retention_date();

-- ============================================================================
-- Auto-Audit Trail Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION log_document_action()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO document_audit_log (document_id, action_type, action_description, performed_by)
        VALUES (NEW.id, 'Uploaded', 'Document uploaded', NEW.uploaded_by);
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO document_audit_log (document_id, action_type, action_description, performed_by, old_values, new_values)
        VALUES (
            NEW.id,
            'Updated',
            'Document metadata updated',
            NEW.updated_at,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO document_audit_log (document_id, action_type, action_description, performed_by)
        VALUES (OLD.id, 'Deleted', 'Document deleted', OLD.deleted_by);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_document_audit
AFTER INSERT OR UPDATE OR DELETE ON documents
FOR EACH ROW EXECUTE FUNCTION log_document_action();

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- Documents Due for Retention
CREATE OR REPLACE VIEW v_documents_retention_due AS
SELECT
    d.id,
    d.document_number,
    d.document_name,
    dc.category_name,
    d.document_date,
    d.retention_until,
    d.is_legal_hold,
    CASE
        WHEN d.is_legal_hold THEN 'Legal Hold - Do Not Delete'
        WHEN d.retention_until < CURRENT_DATE THEN 'Can Delete'
        WHEN d.retention_until <= CURRENT_DATE + INTERVAL '90 days' THEN 'Delete Soon'
        ELSE 'Retain'
    END AS retention_status
FROM documents d
JOIN document_categories dc ON d.document_category_id = dc.id
WHERE d.status != 'Deleted'
    AND d.is_archived = FALSE
ORDER BY d.retention_until;

-- Recent Uploads Dashboard
CREATE OR REPLACE VIEW v_recent_uploads AS
SELECT
    d.id,
    d.document_number,
    d.document_name,
    dc.category_name AS category,
    d.document_type,
    d.file_size_bytes,
    d.upload_method,
    COALESCE(dr.first_name || ' ' || dr.last_name, 'System') AS uploaded_by_name,
    d.uploaded_at,
    d.ocr_processed,
    d.ai_detected_type,
    v."number" AS related_vehicle,
    d2.first_name || ' ' || d2.last_name AS related_driver
FROM documents d
JOIN document_categories dc ON d.document_category_id = dc.id
LEFT JOIN drivers dr ON d.uploaded_by = dr.id
LEFT JOIN vehicles v ON d.related_vehicle_id = v.id
LEFT JOIN drivers d2 ON d.related_driver_id = d2.id
WHERE d.status = 'Active'
ORDER BY d.uploaded_at DESC
LIMIT 100;

COMMENT ON TABLE documents IS 'Central document repository with OCR, AI classification, and mobile capture support';
COMMENT ON TABLE camera_capture_metadata IS 'Metadata from mobile camera captures including GPS location and EXIF data';
COMMENT ON TABLE document_processing_queue IS 'Async processing queue for OCR, AI analysis, and thumbnail generation';
COMMENT ON TABLE receipt_line_items IS 'Line-item details extracted from receipts and invoices via OCR';
COMMENT ON VIEW v_documents_retention_due IS 'Documents approaching retention date for archival/deletion';
