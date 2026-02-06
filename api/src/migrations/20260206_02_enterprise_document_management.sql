-- ============================================================================
-- Migration: Enterprise Document Management System
-- Created: 2026-02-06
-- Purpose: Complete document lifecycle with OCR, versioning, CDN, compliance
-- Features: Storage, OCR, Thumbnails, Versions, Access Control, Legal Hold
-- ============================================================================

-- ============================================================================
-- PART 1: Enhance Documents Table with 80+ Enterprise Fields
-- ============================================================================

-- Storage & CDN
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_provider VARCHAR(50) DEFAULT 's3'; -- 's3', 'azure-blob', 'gcs', 'local'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_bucket VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_key VARCHAR(500); -- Full S3 key or blob path
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_region VARCHAR(50); -- us-east-1, westus2, etc.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cdn_url VARCHAR(500); -- CloudFront/Azure CDN URL
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cdn_cache_key VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cdn_invalidation_id VARCHAR(100);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_class VARCHAR(50) DEFAULT 'STANDARD'; -- 'STANDARD', 'GLACIER', 'ARCHIVE', 'COOL', 'HOT'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS presigned_url_expires_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS presigned_url_last_generated TIMESTAMPTZ;

-- File Integrity & Security
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_hash_md5 VARCHAR(32); -- MD5 checksum
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_hash_sha256 VARCHAR(64); -- SHA-256 checksum
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_hash_algorithm VARCHAR(20) DEFAULT 'sha256';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS virus_scan_status VARCHAR(20) DEFAULT 'pending'; -- 'pending', 'scanning', 'clean', 'infected', 'failed'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS virus_scan_date TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS virus_scan_engine VARCHAR(50); -- 'ClamAV', 'Windows Defender', 'Sophos'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS virus_signature_version VARCHAR(50);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS virus_threat_name VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS quarantined BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS quarantine_reason TEXT;

-- OCR & Text Extraction
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_status VARCHAR(20) DEFAULT 'pending'; -- 'pending', 'processing', 'completed', 'failed', 'not_applicable'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_provider VARCHAR(50); -- 'AWS Textract', 'Azure Vision', 'Google Vision', 'Tesseract'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_started_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_completed_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_error TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_confidence_score NUMERIC(5,2); -- 0-100
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_language_detected VARCHAR(10); -- 'en', 'es', 'fr', 'de', etc.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_languages_requested VARCHAR(50)[]; -- Array for multi-language
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_text TEXT; -- Full OCR text
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_text_length INTEGER; -- Character count
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_text_tsv TSVECTOR; -- Full-text search vector
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_json JSONB; -- Raw OCR response with bounding boxes
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_page_count INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_billable_pages INTEGER; -- For cost tracking

-- Thumbnail & Preview Generation
ALTER TABLE documents ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500); -- Small thumbnail (150x150)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS thumbnail_medium_url VARCHAR(500); -- Medium preview (800x600)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS thumbnail_large_url VARCHAR(500); -- Large preview (1920x1080)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS thumbnail_generated_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS thumbnail_generation_status VARCHAR(20) DEFAULT 'pending'; -- 'pending', 'processing', 'completed', 'failed'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS thumbnail_error TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS preview_available BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS preview_page_count INTEGER; -- For PDFs

-- Version Control & History
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version_major INTEGER DEFAULT 1; -- Semantic versioning
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version_minor INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version_patch INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version_number VARCHAR(20) DEFAULT '1.0.0'; -- "1.2.3"
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version_label VARCHAR(100); -- "Initial Draft", "Final", "Approved"
ALTER TABLE documents ADD COLUMN IF NOT EXISTS parent_version_id UUID REFERENCES documents(id); -- Previous version
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT TRUE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version_comment TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS superseded_by_id UUID REFERENCES documents(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS superseded_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS first_version_id UUID; -- Root document in version tree
ALTER TABLE documents ADD COLUMN IF NOT EXISTS version_tree_path TEXT; -- "1 > 2 > 5" for tracking lineage

-- Access Control & Sharing
ALTER TABLE documents ADD COLUMN IF NOT EXISTS access_level VARCHAR(20) DEFAULT 'private'; -- 'public', 'tenant', 'private', 'restricted'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS requires_approval_to_view BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS approved_viewers UUID[]; -- Array of user IDs
ALTER TABLE documents ADD COLUMN IF NOT EXISTS approved_editors UUID[];
ALTER TABLE documents ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS shared_with_tenants UUID[]; -- Multi-tenant sharing
ALTER TABLE documents ADD COLUMN IF NOT EXISTS shared_via_link BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS share_link_token VARCHAR(100);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS share_link_expires_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS share_link_password_hash VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS share_link_max_downloads INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS share_link_download_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS share_link_requires_login BOOLEAN DEFAULT TRUE;

-- Compliance & Legal Hold
ALTER TABLE documents ADD COLUMN IF NOT EXISTS retention_policy_id UUID; -- Link to retention_policies table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS retention_required_until TIMESTAMPTZ; -- Cannot delete before
ALTER TABLE documents ADD COLUMN IF NOT EXISTS auto_delete_after TIMESTAMPTZ; -- Auto-purge after retention
ALTER TABLE documents ADD COLUMN IF NOT EXISTS legal_hold BOOLEAN DEFAULT FALSE; -- Cannot delete even after retention
ALTER TABLE documents ADD COLUMN IF NOT EXISTS legal_hold_reason TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS legal_hold_case_number VARCHAR(100);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS legal_hold_placed_by UUID REFERENCES users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS legal_hold_placed_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS legal_hold_released_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS legal_hold_released_by UUID REFERENCES users(id);

-- Data Classification & Sensitivity
ALTER TABLE documents ADD COLUMN IF NOT EXISTS classification_level VARCHAR(50) DEFAULT 'internal'; -- 'public', 'internal', 'confidential', 'secret', 'top_secret'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS contains_pii BOOLEAN DEFAULT FALSE; -- Personal Identifiable Information
ALTER TABLE documents ADD COLUMN IF NOT EXISTS contains_phi BOOLEAN DEFAULT FALSE; -- Protected Health Information (HIPAA)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS contains_pci BOOLEAN DEFAULT FALSE; -- Payment Card Industry data
ALTER TABLE documents ADD COLUMN IF NOT EXISTS contains_financial_data BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS contains_trade_secrets BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS gdpr_applicable BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ccpa_applicable BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS data_residency_requirement VARCHAR(50); -- 'US', 'EU', 'UK', 'CA'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS encryption_required BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS encryption_key_id VARCHAR(255); -- KMS key ID or vault reference
ALTER TABLE documents ADD COLUMN IF NOT EXISTS encrypted_at_rest BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS encrypted_in_transit BOOLEAN DEFAULT TRUE;

-- AI/ML Content Analysis
ALTER TABLE documents ADD COLUMN IF NOT EXISTS analyzed_by_ai BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_analysis_date TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(50); -- 'OpenAI', 'Claude', 'Azure OpenAI'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_model_version VARCHAR(50); -- 'gpt-4', 'claude-3-opus'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_extracted_entities JSONB; -- {people: [], dates: [], amounts: [], organizations: []}
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_sentiment_score NUMERIC(5,2); -- -100 to +100
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_sentiment VARCHAR(20); -- 'positive', 'negative', 'neutral'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_summary TEXT; -- Auto-generated summary
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_keywords TEXT[]; -- Extracted keywords
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_category_suggestion VARCHAR(100);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ai_confidence_score NUMERIC(5,2); -- 0-100

-- Document Intelligence (Form Recognition)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_form BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS form_type VARCHAR(100); -- 'invoice', 'receipt', 'contract', 'w9', 'bill_of_lading'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS form_confidence NUMERIC(5,2);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_date_detected DATE; -- Invoice date, report date
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_amount_detected NUMERIC(12,2); -- Invoice amount
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_currency VARCHAR(3); -- 'USD', 'EUR', 'GBP'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS document_parties_detected JSONB; -- {vendor: '', customer: '', issuer: ''}
ALTER TABLE documents ADD COLUMN IF NOT EXISTS form_fields_detected JSONB; -- Structured form field extraction
ALTER TABLE documents ADD COLUMN IF NOT EXISTS invoice_number_detected VARCHAR(100);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS purchase_order_detected VARCHAR(100);

-- Workflow & Approval
ALTER TABLE documents ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'draft'; -- 'draft', 'pending', 'approved', 'rejected', 'expired'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS submitted_for_approval_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS submitted_by_id UUID REFERENCES users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS approval_workflow_id UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS current_approver_id UUID REFERENCES users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS approval_deadline TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS approved_by_id UUID REFERENCES users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS rejected_by_id UUID REFERENCES users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS approval_history JSONB; -- [{user, action, date, comments, level}]

-- Collaboration & Activity
ALTER TABLE documents ADD COLUMN IF NOT EXISTS locked_by_id UUID REFERENCES users(id); -- Check-out/check-in
ALTER TABLE documents ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS lock_expires_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS lock_reason TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_viewed_by_id UUID REFERENCES users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS unique_viewer_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS print_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0;

-- Performance & Caching
ALTER TABLE documents ADD COLUMN IF NOT EXISTS cache_control VARCHAR(100); -- 'public, max-age=3600'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS etag VARCHAR(100); -- For HTTP caching (file hash)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_modified TIMESTAMPTZ; -- For conditional requests
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_encoding VARCHAR(50); -- 'gzip', 'br', 'deflate'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS compressed_size INTEGER; -- Bytes after compression
ALTER TABLE documents ADD COLUMN IF NOT EXISTS compression_ratio NUMERIC(5,2); -- Original / compressed
ALTER TABLE documents ADD COLUMN IF NOT EXISTS optimized_for_web BOOLEAN DEFAULT FALSE;

-- Quality & Validation
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_validated BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS validation_errors JSONB; -- Array of validation issues
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_corrupted BOOLEAN DEFAULT FALSE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS corruption_detected_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type_verified BOOLEAN DEFAULT FALSE; -- Actual vs declared mime type
ALTER TABLE documents ADD COLUMN IF NOT EXISTS actual_mime_type VARCHAR(100); -- From magic number inspection
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_extension VARCHAR(10);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS has_embedded_macros BOOLEAN DEFAULT FALSE; -- Security risk
ALTER TABLE documents ADD COLUMN IF NOT EXISTS has_external_links BOOLEAN DEFAULT FALSE; -- Security risk

-- Indexing & Constraints
CREATE INDEX IF NOT EXISTS idx_documents_storage_provider ON documents(storage_provider);
CREATE INDEX IF NOT EXISTS idx_documents_storage_bucket_key ON documents(storage_bucket, storage_key);
CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON documents(file_hash_sha256);
CREATE INDEX IF NOT EXISTS idx_documents_virus_scan_status ON documents(virus_scan_status) WHERE virus_scan_status != 'clean';
CREATE INDEX IF NOT EXISTS idx_documents_ocr_status ON documents(ocr_status) WHERE ocr_status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_documents_ocr_tsv ON documents USING GIN(extracted_text_tsv);
CREATE INDEX IF NOT EXISTS idx_documents_version_tree ON documents(first_version_id, version_major, version_minor);
CREATE INDEX IF NOT EXISTS idx_documents_latest_version ON documents(is_latest_version) WHERE is_latest_version = TRUE;
CREATE INDEX IF NOT EXISTS idx_documents_access_level ON documents(access_level);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_legal_hold ON documents(legal_hold) WHERE legal_hold = TRUE;
CREATE INDEX IF NOT EXISTS idx_documents_classification ON documents(classification_level);
CREATE INDEX IF NOT EXISTS idx_documents_pii ON documents(contains_pii) WHERE contains_pii = TRUE;
CREATE INDEX IF NOT EXISTS idx_documents_approval_status ON documents(approval_status);
CREATE INDEX IF NOT EXISTS idx_documents_locked ON documents(locked_by_id) WHERE locked_by_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_ai_analyzed ON documents(analyzed_by_ai, ai_analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_documents_form_type ON documents(form_type) WHERE form_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_retention ON documents(retention_required_until);
CREATE INDEX IF NOT EXISTS idx_documents_ai_entities ON documents USING GIN(ai_extracted_entities);
CREATE INDEX IF NOT EXISTS idx_documents_form_fields ON documents USING GIN(form_fields_detected);

-- Constraints
ALTER TABLE documents ADD CONSTRAINT chk_documents_version_valid CHECK (
    version_major >= 0 AND version_minor >= 0 AND version_patch >= 0
);

ALTER TABLE documents ADD CONSTRAINT chk_documents_virus_status CHECK (
    virus_scan_status IN ('pending', 'scanning', 'clean', 'infected', 'failed', 'not_applicable')
);

ALTER TABLE documents ADD CONSTRAINT chk_documents_ocr_status CHECK (
    ocr_status IN ('pending', 'processing', 'completed', 'failed', 'not_applicable')
);

ALTER TABLE documents ADD CONSTRAINT chk_documents_access_level CHECK (
    access_level IN ('public', 'tenant', 'private', 'restricted')
);

ALTER TABLE documents ADD CONSTRAINT chk_documents_classification CHECK (
    classification_level IN ('public', 'internal', 'confidential', 'secret', 'top_secret')
);

ALTER TABLE documents ADD CONSTRAINT chk_documents_approval_status CHECK (
    approval_status IN ('draft', 'pending', 'approved', 'rejected', 'expired')
);

ALTER TABLE documents ADD CONSTRAINT chk_documents_file_size_positive CHECK (
    file_size > 0
);

ALTER TABLE documents ADD CONSTRAINT chk_documents_share_link_max_downloads CHECK (
    share_link_max_downloads IS NULL OR share_link_max_downloads > 0
);

-- ============================================================================
-- PART 2: Document Comments Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    parent_comment_id UUID REFERENCES document_comments(id), -- For threaded comments
    user_id UUID NOT NULL REFERENCES users(id),
    comment_text TEXT NOT NULL,
    page_number INTEGER, -- For PDF page-specific comments
    annotation_coordinates JSONB, -- {x, y, width, height} for highlighting
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by_id UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_document_comments_document ON document_comments(document_id, created_at DESC);
CREATE INDEX idx_document_comments_user ON document_comments(user_id);
CREATE INDEX idx_document_comments_parent ON document_comments(parent_comment_id);
CREATE INDEX idx_document_comments_unresolved ON document_comments(resolved) WHERE resolved = FALSE;

-- ============================================================================
-- PART 3: Document Access Log (Who viewed/downloaded what)
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_access_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    access_type VARCHAR(20) NOT NULL, -- 'view', 'download', 'print', 'share', 'edit', 'delete'
    accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    access_granted BOOLEAN DEFAULT TRUE, -- FALSE if access denied
    denial_reason TEXT,
    metadata JSONB DEFAULT '{}'
) PARTITION BY RANGE (accessed_at);

-- Create partitions for document access log
CREATE TABLE document_access_log_2026_02 PARTITION OF document_access_log
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE INDEX idx_document_access_log_document ON document_access_log(document_id, accessed_at DESC);
CREATE INDEX idx_document_access_log_user ON document_access_log(user_id, accessed_at DESC);
CREATE INDEX idx_document_access_log_type ON document_access_log(access_type);
CREATE INDEX idx_document_access_log_denied ON document_access_log(access_granted) WHERE access_granted = FALSE;

-- ============================================================================
-- PART 4: OCR Processing Queue
-- ============================================================================

CREATE TABLE IF NOT EXISTS document_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    processing_type VARCHAR(50) NOT NULL, -- 'ocr', 'thumbnail', 'virus_scan', 'ai_analysis', 'form_extraction'
    priority INTEGER DEFAULT 5, -- 1-10, 1 = highest
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    processing_started_at TIMESTAMPTZ,
    processing_completed_at TIMESTAMPTZ,
    processing_duration_ms INTEGER, -- Milliseconds
    worker_id VARCHAR(100), -- Which worker processed it
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_processing_queue_status ON document_processing_queue(status, priority DESC) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_processing_queue_document ON document_processing_queue(document_id);
CREATE INDEX idx_processing_queue_type ON document_processing_queue(processing_type);

-- ============================================================================
-- PART 5: Automatic Full-Text Search Update Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION documents_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.extracted_text_tsv :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.extracted_text, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.tags, ' '), '')), 'D');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_search_vector_trigger
    BEFORE INSERT OR UPDATE OF name, description, extracted_text, tags ON documents
    FOR EACH ROW EXECUTE FUNCTION documents_search_vector_update();

-- ============================================================================
-- PART 6: Document Access Control Function
-- ============================================================================

CREATE OR REPLACE FUNCTION can_user_access_document(
    p_document_id UUID,
    p_user_id UUID,
    p_access_type VARCHAR DEFAULT 'view'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_document documents%ROWTYPE;
    v_user_role VARCHAR(50);
    v_user_tenant UUID;
BEGIN
    -- Get document
    SELECT * INTO v_document FROM documents WHERE id = p_document_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Get user info
    SELECT role, tenant_id INTO v_user_role, v_user_tenant
    FROM users WHERE id = p_user_id;

    -- SuperAdmin can access anything
    IF v_user_role = 'SuperAdmin' THEN
        RETURN TRUE;
    END IF;

    -- Check tenant isolation
    IF v_document.tenant_id != v_user_tenant THEN
        -- Check if shared with this tenant
        IF NOT (v_document.tenant_id = ANY(v_document.shared_with_tenants)) THEN
            RETURN FALSE;
        END IF;
    END IF;

    -- Check legal hold (only certain roles can access)
    IF v_document.legal_hold AND v_user_role NOT IN ('SuperAdmin', 'Admin', 'Manager') THEN
        RETURN FALSE;
    END IF;

    -- Check access level
    CASE v_document.access_level
        WHEN 'public' THEN
            RETURN TRUE;
        WHEN 'tenant' THEN
            RETURN v_document.tenant_id = v_user_tenant;
        WHEN 'private' THEN
            RETURN v_document.owner_id = p_user_id OR v_document.uploaded_by_id = p_user_id;
        WHEN 'restricted' THEN
            IF p_access_type = 'view' THEN
                RETURN p_user_id = ANY(v_document.approved_viewers) OR p_user_id = ANY(v_document.approved_editors);
            ELSIF p_access_type = 'edit' THEN
                RETURN p_user_id = ANY(v_document.approved_editors);
            END IF;
    END CASE;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION can_user_access_document IS 'Checks if user has permission to access document based on ACL, tenant, legal hold, etc.';
