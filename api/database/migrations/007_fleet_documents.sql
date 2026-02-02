-- Fleet Documents Migration
-- Document management system for vehicle registrations, insurance, inspections, etc.

CREATE TABLE IF NOT EXISTS fleet_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id INTEGER NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,

    -- Document classification
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('registration', 'insurance', 'inspection', 'maintenance', 'incident', 'other')),
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- File information
    file_name VARCHAR(255) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    blob_url TEXT NOT NULL,

    -- OCR and AI extracted data
    ocr_text TEXT,
    metadata JSONB DEFAULT '{}',

    -- Tracking and lifecycle
    uploaded_by INTEGER NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN DEFAULT false,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fleet_documents_tenant ON fleet_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fleet_documents_vehicle ON fleet_documents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fleet_documents_driver ON fleet_documents(driver_id);
CREATE INDEX IF NOT EXISTS idx_fleet_documents_work_order ON fleet_documents(work_order_id);
CREATE INDEX IF NOT EXISTS idx_fleet_documents_type ON fleet_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_fleet_documents_uploaded_at ON fleet_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_fleet_documents_expires_at ON fleet_documents(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fleet_documents_archived ON fleet_documents(is_archived);

-- Full-text search on OCR text
CREATE INDEX IF NOT EXISTS idx_fleet_documents_ocr_text ON fleet_documents USING gin(to_tsvector('english', COALESCE(ocr_text, '')));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_fleet_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_fleet_documents_updated_at
    BEFORE UPDATE ON fleet_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_fleet_documents_updated_at();

COMMENT ON TABLE fleet_documents IS 'Fleet document management with Azure Blob Storage integration';
COMMENT ON COLUMN fleet_documents.document_type IS 'Type of document: registration, insurance, inspection, maintenance, incident, other';
COMMENT ON COLUMN fleet_documents.storage_path IS 'Relative path in Azure Blob Storage (year/month/day/filename)';
COMMENT ON COLUMN fleet_documents.blob_url IS 'Full Azure Blob Storage URL';
COMMENT ON COLUMN fleet_documents.ocr_text IS 'Extracted text from OCR processing';
COMMENT ON COLUMN fleet_documents.expires_at IS 'Document expiration date (for registrations, insurance, inspections)';
COMMENT ON COLUMN fleet_documents.is_archived IS 'Soft delete flag';
