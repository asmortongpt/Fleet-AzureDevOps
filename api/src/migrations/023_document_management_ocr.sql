-- Enterprise Document Management System with OCR and Mobile Capture
-- Handles receipts, invoices, forms, photos, and all fleet-related documentation

-- ============================================================================
-- Document Categories & Types
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    parent_category_id INTEGER REFERENCES document_categories(id),
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
    id SERIAL PRIMARY KEY,

    -- Document Identification
    document_number VARCHAR(100) UNIQUE, -- Auto-generated or manual
    document_name VARCHAR(500) NOT NULL,
    document_category_id INTEGER REFERENCES document_categories(id) NOT NULL,
    document_type VARCHAR(100), -- 'Receipt', 'Invoice', 'Form', 'Photo', 'PDF', 'Scan', etc.

    -- File Information
    original_filename VARCHAR(500) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    file_extension VARCHAR(20),

    -- Storage
    storage_path VARCHAR(1000) NOT NULL,
    storage_url VARCHAR(1000),
    thumbnail_url VARCHAR(1000),
    is_encrypted BOOLEAN DEFAULT FALSE,

    -- Upload Information
    upload_method VARCHAR(50) NOT NULL, -- 'Web Upload', 'Mobile Camera', 'Mobile Gallery', 'Email', 'Scanner', 'API'
    uploaded_by INTEGER REFERENCES drivers(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    upload_device_info JSONB, -- {device_type, os, browser, location}

    -- OCR & AI Processing
    ocr_processed BOOLEAN DEFAULT FALSE,
    ocr_provider VARCHAR(50), -- 'Tesseract', 'Google Vision', 'AWS Textract', 'Azure Computer Vision'
    ocr_confidence_score DECIMAL(5,4),
    ocr_language VARCHAR(10) DEFAULT 'en',
    ocr_raw_text TEXT, -- Complete extracted text
    ocr_structured_data JSONB, -- Structured extraction: {vendor, date, amount, items: [...]}
    ocr_processing_time_ms INTEGER,
    ocr_processed_at TIMESTAMP,

    -- AI Classification & Enhancement
    ai_detected_type VARCHAR(100), -- Auto-detected: 'Gas Receipt', 'Repair Invoice', 'Insurance Card', etc.
    ai_confidence DECIMAL(5,4),
    ai_extracted_entities JSONB, -- {vendor_name, date, total_amount, tax, line_items: [...]}
    ai_tags TEXT[], -- Auto-generated searchable tags
    ai_summary TEXT, -- AI-generated summary

    -- Entity Linking (Polymorphic)
    related_vehicle_id INTEGER REFERENCES vehicles(id),
    related_driver_id INTEGER REFERENCES drivers(id),
    related_maintenance_id INTEGER,
    related_purchase_order_id INTEGER,
    related_incident_id INTEGER,
    related_osha_case_id INTEGER,
    related_communication_id INTEGER,

    -- Manual Metadata
    manual_tags TEXT[],
    description TEXT,
    notes TEXT,

    -- Date Information
    document_date DATE, -- Date on the document (not upload date)
    document_year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM document_date)) STORED,
    document_month INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM document_date)) STORED,

    -- Financial Data (for receipts/invoices)
    currency VARCHAR(10) DEFAULT 'USD',
    total_amount DECIMAL(12,2),
    tax_amount DECIMAL(12,2),
    subtotal_amount DECIMAL(12,2),
    payment_method VARCHAR(50), -- 'Cash', 'Credit Card', 'Fleet Card', 'Invoice'
    vendor_name VARCHAR(255),
    vendor_location VARCHAR(255),

    -- Security & Access
    is_confidential BOOLEAN DEFAULT FALSE,
    access_restricted_to_roles VARCHAR(100)[],
    requires_approval BOOLEAN DEFAULT FALSE,
    approved_by INTEGER,
    approved_at TIMESTAMP,

    -- Version Control
    version INTEGER DEFAULT 1,
    parent_document_id INTEGER REFERENCES documents(id), -- For versioning
    is_latest_version BOOLEAN DEFAULT TRUE,

    -- Status & Lifecycle
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Archived', 'Deleted', 'Under Review'
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP,
    archived_by INTEGER,

    -- Compliance
    retention_until DATE, -- Auto-calculated based on category retention policy
    is_legal_hold BOOLEAN DEFAULT FALSE, -- Prevent deletion for legal reasons
    legal_hold_reason TEXT,

    -- Search
    full_text_search TSVECTOR,

    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    deleted_by INTEGER
);

-- ============================================================================
-- Document Pages (for multi-page documents like PDFs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_pages (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) NOT NULL,
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
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) NOT NULL,

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
    approved_by INTEGER,
    approved_at TIMESTAMP,
    gl_account_code VARCHAR(50), -- General ledger account code
    cost_center VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Mobile Camera Capture Metadata
-- ============================================================================

CREATE TABLE IF NOT EXISTS camera_capture_metadata (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) UNIQUE NOT NULL,

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
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) NOT NULL,

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
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) NOT NULL,

    -- Share Target
    shared_with_user_id INTEGER REFERENCES drivers(id),
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
    created_by INTEGER,
    revoked_at TIMESTAMP,
    revoked_by INTEGER,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- Document Comments & Annotations
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_comments (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) NOT NULL,
    page_number INTEGER, -- NULL for document-level comments

    -- Comment
    comment_text TEXT NOT NULL,
    comment_type VARCHAR(50) DEFAULT 'General', -- 'General', 'Question', 'Issue', 'Approval', 'Rejection'

    -- Annotations (for marking up images/PDFs)
    annotation_data JSONB, -- {type: 'highlight|rectangle|arrow', coordinates: {...}, color: '#ff0000'}

    -- Author
    created_by INTEGER REFERENCES drivers(id) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Thread
    parent_comment_id INTEGER REFERENCES document_comments(id),
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
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) NOT NULL,

    -- Action
    action_type VARCHAR(100) NOT NULL, -- 'Uploaded', 'Viewed', 'Downloaded', 'Updated', 'Deleted', 'Shared', 'Approved', 'Rejected'
    action_description TEXT,

    -- Actor
    performed_by INTEGER REFERENCES drivers(id),
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
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id) NOT NULL,

    -- Original OCR
    ocr_text_original TEXT NOT NULL,
    ocr_confidence_original DECIMAL(5,4),

    -- Corrected Text
    ocr_text_corrected TEXT NOT NULL,
    correction_type VARCHAR(50), -- 'Manual', 'AI_Assisted', 'Spell_Check'

    -- Corrected By
    corrected_by INTEGER REFERENCES drivers(id) NOT NULL,
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

CREATE OR REPLACE FUNCTION retention_until_date(category_id INTEGER, doc_date DATE)
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
    v.unit_number AS related_vehicle,
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
