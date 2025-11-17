-- Migration: Document Storage System
-- Description: Creates documents table for fleet document management with OCR support
-- Version: 007
-- Date: 2025-11-16

-- ============================================================================
-- Document Type Enum
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE document_type_enum AS ENUM (
        'registration',
        'insurance',
        'inspection',
        'maintenance',
        'incident',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- Documents Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS documents (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign Keys (at least one must be set)
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,

    -- Document Classification
    document_type document_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- File Information
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    mime_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,

    -- OCR Data
    ocr_text TEXT,

    -- Flexible Metadata
    metadata JSONB DEFAULT '{}',

    -- Upload Information
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Document Expiration (for time-sensitive documents like insurance)
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Archive and Soft Delete
    is_archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE,

    -- Multi-tenancy
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT documents_entity_check CHECK (
        vehicle_id IS NOT NULL OR
        driver_id IS NOT NULL OR
        work_order_id IS NOT NULL
    )
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS idx_documents_vehicle_id ON documents(vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_driver_id ON documents(driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_work_order_id ON documents(work_order_id) WHERE work_order_id IS NOT NULL;

-- Document type and status indexes
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_is_archived ON documents(is_archived) WHERE is_archived = false;

-- Expiration tracking
CREATE INDEX IF NOT EXISTS idx_documents_expires_at ON documents(expires_at) WHERE expires_at IS NOT NULL AND is_archived = false;

-- Full-text search on OCR text (GIN index)
CREATE INDEX IF NOT EXISTS idx_documents_ocr_text ON documents USING GIN(to_tsvector('english', COALESCE(ocr_text, '')));

-- Metadata search (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING GIN(metadata);

-- Upload tracking
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at DESC);

-- ============================================================================
-- Update Timestamp Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_updated_at();

-- ============================================================================
-- Archive Timestamp Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_documents_archived_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_archived = true AND OLD.is_archived = false THEN
        NEW.archived_at = NOW();
    ELSIF NEW.is_archived = false THEN
        NEW.archived_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_documents_archived_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_archived_at();

-- ============================================================================
-- Expiring Documents View
-- ============================================================================

CREATE OR REPLACE VIEW v_expiring_documents AS
SELECT
    d.id,
    d.document_type,
    d.title,
    d.file_name,
    d.expires_at,
    d.vehicle_id,
    v.make || ' ' || v.model || ' (' || v.unit_number || ')' AS vehicle_info,
    d.driver_id,
    dr.first_name || ' ' || dr.last_name AS driver_name,
    d.tenant_id,
    CASE
        WHEN d.expires_at < NOW() THEN 'expired'
        WHEN d.expires_at <= NOW() + INTERVAL '30 days' THEN 'expiring_soon'
        WHEN d.expires_at <= NOW() + INTERVAL '90 days' THEN 'expiring_later'
        ELSE 'valid'
    END AS expiration_status,
    EXTRACT(DAY FROM (d.expires_at - NOW())) AS days_until_expiration
FROM documents d
LEFT JOIN vehicles v ON d.vehicle_id = v.id
LEFT JOIN drivers dr ON d.driver_id = dr.id
WHERE d.expires_at IS NOT NULL
    AND d.is_archived = false
ORDER BY d.expires_at ASC;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE documents IS 'Central document storage for fleet management - vehicles, drivers, and work orders';
COMMENT ON COLUMN documents.id IS 'Unique document identifier';
COMMENT ON COLUMN documents.vehicle_id IS 'Related vehicle (optional, but one of vehicle/driver/work_order must be set)';
COMMENT ON COLUMN documents.driver_id IS 'Related driver (optional, but one of vehicle/driver/work_order must be set)';
COMMENT ON COLUMN documents.work_order_id IS 'Related work order (optional, but one of vehicle/driver/work_order must be set)';
COMMENT ON COLUMN documents.document_type IS 'Type of document: registration, insurance, inspection, maintenance, incident, other';
COMMENT ON COLUMN documents.title IS 'Document title or name';
COMMENT ON COLUMN documents.description IS 'Optional detailed description';
COMMENT ON COLUMN documents.file_name IS 'Original filename';
COMMENT ON COLUMN documents.file_size IS 'File size in bytes';
COMMENT ON COLUMN documents.mime_type IS 'MIME type (e.g., application/pdf, image/jpeg)';
COMMENT ON COLUMN documents.storage_path IS 'Azure Blob Storage path or file system path';
COMMENT ON COLUMN documents.ocr_text IS 'Extracted text from OCR processing (searchable)';
COMMENT ON COLUMN documents.metadata IS 'Flexible JSONB field for additional structured data';
COMMENT ON COLUMN documents.uploaded_by IS 'User who uploaded the document';
COMMENT ON COLUMN documents.uploaded_at IS 'Timestamp when document was uploaded';
COMMENT ON COLUMN documents.expires_at IS 'Expiration date for time-sensitive documents (insurance, registration, etc.)';
COMMENT ON COLUMN documents.is_archived IS 'Whether document is archived';
COMMENT ON COLUMN documents.tenant_id IS 'Tenant identifier for multi-tenancy';
COMMENT ON CONSTRAINT documents_entity_check ON documents IS 'Ensures at least one entity reference (vehicle, driver, or work_order) is set';
COMMENT ON VIEW v_expiring_documents IS 'Documents that are expired or expiring soon, with status categorization';

-- ============================================================================
-- Migration Complete
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 007: Documents table created successfully';
    RAISE NOTICE '  - Table: documents';
    RAISE NOTICE '  - Indexes: 11 indexes created for optimal query performance';
    RAISE NOTICE '  - Triggers: 2 triggers (updated_at, archived_at)';
    RAISE NOTICE '  - Views: 1 view (v_expiring_documents)';
    RAISE NOTICE '  - Features: OCR text search, JSONB metadata, expiration tracking';
END $$;
