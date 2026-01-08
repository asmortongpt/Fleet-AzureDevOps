-- Migration: Add Geospatial Fields to Documents Table
-- Agent 4: Map Server Document Integration
-- Date: 2025-11-16

-- ============================================
-- Create Documents Table with Geospatial Support
-- ============================================

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- File Information
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_url TEXT NOT NULL,
    file_hash VARCHAR(64),

    -- Organization
    category_id UUID,
    tags TEXT[] DEFAULT '{}',
    description TEXT,

    -- Access Control
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT false,

    -- Versioning
    version_number INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,

    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),

    -- Content Processing
    extracted_text TEXT,
    ocr_status VARCHAR(50) DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed', 'not_needed')),
    ocr_completed_at TIMESTAMP WITH TIME ZONE,
    embedding_status VARCHAR(50) DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'processing', 'completed', 'failed')),
    embedding_completed_at TIMESTAMP WITH TIME ZONE,

    -- Geospatial Fields
    location GEOGRAPHY(POINT, 4326),           -- PostGIS point for single location
    location_address VARCHAR(500),              -- Parsed address from document
    location_city VARCHAR(100),                 -- City
    location_state VARCHAR(50),                 -- State/Province
    location_country VARCHAR(100),              -- Country
    location_postal_code VARCHAR(20),           -- Postal/ZIP code
    location_coordinates_lat DECIMAL(10, 8),    -- Latitude (for indexing)
    location_coordinates_lng DECIMAL(11, 8),    -- Longitude (for indexing)
    geojson_data JSONB,                         -- Complex geometries (polygons, linestrings, etc.)
    geo_accuracy VARCHAR(50),                   -- Geocoding accuracy level
    geo_source VARCHAR(100),                    -- Source of geolocation (EXIF, address, manual)
    geo_extracted_at TIMESTAMP WITH TIME ZONE,  -- When geolocation was extracted

    -- Metadata
    metadata JSONB DEFAULT '{}',
    exif_data JSONB,                            -- EXIF data for images

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON documents(file_hash);
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Geospatial Indexes
CREATE INDEX IF NOT EXISTS idx_documents_location ON documents USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_documents_coordinates ON documents(location_coordinates_lat, location_coordinates_lng) WHERE location_coordinates_lat IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_city ON documents(location_city) WHERE location_city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_state ON documents(location_state) WHERE location_state IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_postal_code ON documents(location_postal_code) WHERE location_postal_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_geojson ON documents USING GIN(geojson_data) WHERE geojson_data IS NOT NULL;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_documents_fts ON documents USING GIN(to_tsvector('english', COALESCE(file_name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(extracted_text, '')));

-- ============================================
-- Document Categories
-- ============================================

CREATE TABLE IF NOT EXISTS document_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    category_name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    icon VARCHAR(50),
    parent_category_id UUID REFERENCES document_categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, category_name)
);

CREATE INDEX IF NOT EXISTS idx_document_categories_tenant ON document_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_categories_parent ON document_categories(parent_category_id);

-- Add foreign key constraint for category_id
ALTER TABLE documents DROP CONSTRAINT IF EXISTS fk_documents_category;
ALTER TABLE documents ADD CONSTRAINT fk_documents_category
    FOREIGN KEY (category_id) REFERENCES document_categories(id) ON DELETE SET NULL;

-- ============================================
-- Document Versions
-- ============================================

CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    change_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON document_versions(created_at DESC);

-- ============================================
-- Document Access Log
-- ============================================

CREATE TABLE IF NOT EXISTS document_access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'download', 'edit', 'delete', 'upload', 'share')),
    ip_address INET,
    user_agent TEXT,
    accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_access_log_document ON document_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_user ON document_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_accessed_at ON document_access_log(accessed_at DESC);

-- ============================================
-- Document Comments
-- ============================================

CREATE TABLE IF NOT EXISTS document_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    comment_text TEXT NOT NULL,
    parent_comment_id UUID REFERENCES document_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_comments_document ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_user ON document_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_parent ON document_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_created_at ON document_comments(created_at DESC);

-- ============================================
-- Document Embeddings (for RAG/Vector Search)
-- ============================================

CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(1536),                     -- OpenAI ada-002 dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, chunk_index)
);

CREATE INDEX IF NOT EXISTS idx_document_embeddings_document ON document_embeddings(document_id);

-- Vector similarity search index (requires pgvector extension)
-- CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector ON document_embeddings USING ivfflat (embedding vector_cosine_ops);

-- ============================================
-- Document Geospatial Functions
-- ============================================

/**
 * Function: Find documents within radius
 * @param p_tenant_id - Tenant ID
 * @param p_lat - Center latitude
 * @param p_lng - Center longitude
 * @param p_radius_meters - Search radius in meters
 * @param p_limit - Maximum results
 */
CREATE OR REPLACE FUNCTION find_documents_within_radius(
    p_tenant_id UUID,
    p_lat DECIMAL,
    p_lng DECIMAL,
    p_radius_meters INTEGER,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
    document_id UUID,
    file_name VARCHAR,
    location_address VARCHAR,
    distance_meters DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.file_name,
        d.location_address,
        ST_Distance(
            d.location::geography,
            ST_MakePoint(p_lng, p_lat)::geography
        )::DECIMAL as distance_meters
    FROM documents d
    WHERE d.tenant_id = p_tenant_id
    AND d.location IS NOT NULL
    AND d.status = 'active'
    AND ST_DWithin(
        d.location::geography,
        ST_MakePoint(p_lng, p_lat)::geography,
        p_radius_meters
    )
    ORDER BY distance_meters ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

/**
 * Function: Find documents within polygon
 * @param p_tenant_id - Tenant ID
 * @param p_geojson - GeoJSON polygon
 * @param p_limit - Maximum results
 */
CREATE OR REPLACE FUNCTION find_documents_within_polygon(
    p_tenant_id UUID,
    p_geojson JSONB,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
    document_id UUID,
    file_name VARCHAR,
    location_address VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.file_name,
        d.location_address
    FROM documents d
    WHERE d.tenant_id = p_tenant_id
    AND d.location IS NOT NULL
    AND d.status = 'active'
    AND ST_Within(
        d.location::geometry,
        ST_GeomFromGeoJSON(p_geojson)
    )
    ORDER BY d.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

/**
 * Function: Get document density heatmap
 * @param p_tenant_id - Tenant ID
 * @param p_grid_size_meters - Size of each grid cell in meters
 */
CREATE OR REPLACE FUNCTION get_document_density_heatmap(
    p_tenant_id UUID,
    p_grid_size_meters INTEGER DEFAULT 1000
)
RETURNS TABLE(
    grid_cell GEOMETRY,
    document_count BIGINT,
    center_lat DECIMAL,
    center_lng DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH gridded_docs AS (
        SELECT
            ST_SnapToGrid(d.location::geometry, p_grid_size_meters) as grid,
            d.id
        FROM documents d
        WHERE d.tenant_id = p_tenant_id
        AND d.location IS NOT NULL
        AND d.status = 'active'
    )
    SELECT
        grid as grid_cell,
        COUNT(*)::BIGINT as document_count,
        ST_Y(ST_Centroid(grid))::DECIMAL as center_lat,
        ST_X(ST_Centroid(grid))::DECIMAL as center_lng
    FROM gridded_docs
    GROUP BY grid
    HAVING COUNT(*) > 0
    ORDER BY document_count DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Triggers
-- ============================================

-- Update updated_at timestamp
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

CREATE TRIGGER trigger_document_categories_updated_at
    BEFORE UPDATE ON document_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_document_comments_updated_at
    BEFORE UPDATE ON document_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Views for Common Queries
-- ============================================

-- Documents with geolocation
CREATE OR REPLACE VIEW v_geolocated_documents AS
SELECT
    d.*,
    dc.category_name,
    dc.color as category_color,
    u.first_name || ' ' || u.last_name as uploaded_by_name,
    ST_Y(d.location::geometry) as latitude,
    ST_X(d.location::geometry) as longitude
FROM documents d
LEFT JOIN document_categories dc ON d.category_id = dc.id
LEFT JOIN users u ON d.uploaded_by = u.id
WHERE d.location IS NOT NULL
AND d.status = 'active';

-- Document statistics by location
CREATE OR REPLACE VIEW v_document_stats_by_city AS
SELECT
    d.tenant_id,
    d.location_city,
    d.location_state,
    d.location_country,
    COUNT(*) as document_count,
    COUNT(DISTINCT d.category_id) as unique_categories,
    SUM(d.file_size) as total_size_bytes,
    MIN(d.created_at) as earliest_document,
    MAX(d.created_at) as latest_document
FROM documents d
WHERE d.location_city IS NOT NULL
AND d.status = 'active'
GROUP BY d.tenant_id, d.location_city, d.location_state, d.location_country
ORDER BY document_count DESC;

-- ============================================
-- Sample Data (for testing)
-- ============================================

-- Insert sample document categories
INSERT INTO document_categories (id, tenant_id, category_name, description, color, icon)
VALUES
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', 'Property Photos', 'Photos of properties and facilities', '#10B981', 'camera'),
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', 'Site Plans', 'Site plans and blueprints', '#3B82F6', 'map'),
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', 'Inspection Reports', 'Inspection and survey reports', '#F59E0B', 'clipboard'),
    (uuid_generate_v4(), '00000000-0000-0000-0000-000000000001', 'Legal Documents', 'Deeds, permits, and legal documents', '#EF4444', 'gavel')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE documents IS 'Documents with geospatial metadata for location-based search and visualization';
COMMENT ON COLUMN documents.location IS 'PostGIS geography point for spatial queries';
COMMENT ON COLUMN documents.geojson_data IS 'Complex geometries (polygons, linestrings) in GeoJSON format';
COMMENT ON COLUMN documents.geo_source IS 'Source of geolocation: EXIF, address, manual, or geocoded';
