-- Vehicle 3D Models Migration
-- Adds support for 3D model visualization with hybrid sourcing (Sketchfab, Azure Blob, car3d.net)
-- Version: 1.0.0
-- Created: 2025-11-27

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 3D Model Library Table
-- ============================================

CREATE TABLE IF NOT EXISTS vehicle_3d_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  vehicle_type VARCHAR(50), -- sedan, truck, suv, van, coupe, convertible, etc.
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,

  -- File information
  file_url VARCHAR(500) NOT NULL, -- Azure Blob, Sketchfab, or external URL
  file_format VARCHAR(10) DEFAULT 'glb' CHECK (file_format IN ('glb', 'gltf', 'fbx', 'obj')),
  file_size_mb DECIMAL(10,2),
  poly_count INTEGER, -- Triangle count for performance tracking

  -- Source tracking
  source VARCHAR(50) NOT NULL CHECK (source IN ('sketchfab', 'azure-blob', 'car3d', 'custom', 'triposr')),
  source_id VARCHAR(255), -- External ID from source platform
  license VARCHAR(100), -- CC0, CC-BY, CC-BY-SA, Commercial, etc.
  license_url VARCHAR(500),
  author VARCHAR(255),
  author_url VARCHAR(500),

  -- Asset URLs
  thumbnail_url VARCHAR(500),
  preview_images TEXT[], -- Array of preview image URLs
  usdz_url VARCHAR(500), -- iOS AR Quick Look format

  -- Quality and features
  quality_tier VARCHAR(20) DEFAULT 'medium' CHECK (quality_tier IN ('low', 'medium', 'high', 'ultra')),
  has_interior BOOLEAN DEFAULT false,
  has_engine BOOLEAN DEFAULT false,
  has_animations BOOLEAN DEFAULT false,
  has_pbr_materials BOOLEAN DEFAULT true, -- Physically Based Rendering

  -- Damage mapping support (for inspection integration)
  supports_damage_markers BOOLEAN DEFAULT true,
  damage_zones JSONB DEFAULT '[]', -- Predefined zones for damage reporting

  -- Usage tracking
  download_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,

  -- Metadata
  tags VARCHAR(100)[], -- Search tags: ['police', 'emergency', 'commercial']
  metadata JSONB DEFAULT '{}', -- Flexible storage for additional data

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_file_size CHECK (file_size_mb > 0),
  CONSTRAINT positive_poly_count CHECK (poly_count IS NULL OR poly_count > 0),
  CONSTRAINT valid_year CHECK (year IS NULL OR (year >= 1900 AND year <= 2100))
);

-- ============================================
-- Link Vehicles to 3D Models
-- ============================================

-- Add foreign key to vehicles table (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'model_3d_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN model_3d_id UUID REFERENCES vehicle_3d_models(id) ON DELETE SET NULL;
    CREATE INDEX idx_vehicles_model_3d ON vehicles(model_3d_id);
  END IF;
END $$;

-- ============================================
-- Model Usage Analytics
-- ============================================

CREATE TABLE IF NOT EXISTS vehicle_3d_model_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id UUID REFERENCES vehicle_3d_models(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('view', 'download', 'assign', 'customize', 'ar_view')),
  session_duration INTEGER, -- seconds
  device_type VARCHAR(50), -- desktop, mobile, tablet
  browser VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_model_usage_model ON vehicle_3d_model_usage(model_id);
CREATE INDEX idx_model_usage_vehicle ON vehicle_3d_model_usage(vehicle_id);
CREATE INDEX idx_model_usage_created_at ON vehicle_3d_model_usage(created_at DESC);

-- ============================================
-- Model Collections (Curated Sets)
-- ============================================

CREATE TABLE IF NOT EXISTS vehicle_3d_model_collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  collection_type VARCHAR(50), -- official, community, emergency, commercial
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_3d_model_collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES vehicle_3d_model_collections(id) ON DELETE CASCADE,
  model_id UUID REFERENCES vehicle_3d_models(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(collection_id, model_id)
);

CREATE INDEX idx_collection_items_collection ON vehicle_3d_model_collection_items(collection_id);
CREATE INDEX idx_collection_items_model ON vehicle_3d_model_collection_items(model_id);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX idx_vehicle_3d_models_type ON vehicle_3d_models(vehicle_type);
CREATE INDEX idx_vehicle_3d_models_make ON vehicle_3d_models(make);
CREATE INDEX idx_vehicle_3d_models_model ON vehicle_3d_models(model);
CREATE INDEX idx_vehicle_3d_models_source ON vehicle_3d_models(source);
CREATE INDEX idx_vehicle_3d_models_active ON vehicle_3d_models(is_active) WHERE is_active = true;
CREATE INDEX idx_vehicle_3d_models_featured ON vehicle_3d_models(is_featured) WHERE is_featured = true;
CREATE INDEX idx_vehicle_3d_models_tags ON vehicle_3d_models USING GIN(tags);

-- Full-text search index
CREATE INDEX idx_vehicle_3d_models_search ON vehicle_3d_models
  USING GIN(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(make, '') || ' ' || coalesce(model, '')));

-- ============================================
-- Triggers
-- ============================================

-- Update updated_at timestamp
CREATE TRIGGER update_vehicle_3d_models_updated_at
  BEFORE UPDATE ON vehicle_3d_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_3d_model_collections_updated_at
  BEFORE UPDATE ON vehicle_3d_model_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Functions
-- ============================================

-- Increment view count
CREATE OR REPLACE FUNCTION increment_model_view_count(p_model_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE vehicle_3d_models
  SET view_count = view_count + 1
  WHERE id = p_model_id;
END;
$$ LANGUAGE plpgsql;

-- Increment download count
CREATE OR REPLACE FUNCTION increment_model_download_count(p_model_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE vehicle_3d_models
  SET download_count = download_count + 1
  WHERE id = p_model_id;
END;
$$ LANGUAGE plpgsql;

-- Search models by text
CREATE OR REPLACE FUNCTION search_vehicle_3d_models(
  p_search_text TEXT,
  p_vehicle_type VARCHAR DEFAULT NULL,
  p_make VARCHAR DEFAULT NULL,
  p_source VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  name VARCHAR,
  description TEXT,
  make VARCHAR,
  model VARCHAR,
  year INTEGER,
  thumbnail_url VARCHAR,
  quality_tier VARCHAR,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.name,
    m.description,
    m.make,
    m.model,
    m.year,
    m.thumbnail_url,
    m.quality_tier,
    ts_rank(
      to_tsvector('english', coalesce(m.name, '') || ' ' || coalesce(m.description, '') || ' ' || coalesce(m.make, '') || ' ' || coalesce(m.model, '')),
      plainto_tsquery('english', p_search_text)
    ) as rank
  FROM vehicle_3d_models m
  WHERE m.is_active = true
    AND (p_vehicle_type IS NULL OR m.vehicle_type = p_vehicle_type)
    AND (p_make IS NULL OR m.make ILIKE '%' || p_make || '%')
    AND (p_source IS NULL OR m.source = p_source)
    AND (
      p_search_text IS NULL
      OR to_tsvector('english', coalesce(m.name, '') || ' ' || coalesce(m.description, '') || ' ' || coalesce(m.make, '') || ' ' || coalesce(m.model, ''))
         @@ plainto_tsquery('english', p_search_text)
    )
  ORDER BY rank DESC, m.featured DESC, m.view_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Views
-- ============================================

-- Popular models view
CREATE OR REPLACE VIEW v_popular_vehicle_3d_models AS
SELECT
  id,
  name,
  make,
  model,
  year,
  vehicle_type,
  thumbnail_url,
  source,
  quality_tier,
  view_count,
  download_count,
  (view_count * 0.3 + download_count * 0.7) as popularity_score
FROM vehicle_3d_models
WHERE is_active = true
ORDER BY popularity_score DESC;

-- Featured models view
CREATE OR REPLACE VIEW v_featured_vehicle_3d_models AS
SELECT *
FROM vehicle_3d_models
WHERE is_active = true AND is_featured = true
ORDER BY created_at DESC;

-- ============================================
-- Seed Data - Default Collections
-- ============================================

-- Official Models Collection
INSERT INTO vehicle_3d_model_collections (id, name, description, collection_type, is_public)
VALUES (
  '00000000-0000-0000-0000-000000000101'::UUID,
  'Official Fleet Models',
  'Officially curated high-quality 3D models for fleet management',
  'official',
  true
) ON CONFLICT DO NOTHING;

-- Emergency Vehicles Collection
INSERT INTO vehicle_3d_model_collections (id, name, description, collection_type, is_public)
VALUES (
  '00000000-0000-0000-0000-000000000102'::UUID,
  'Emergency Vehicles',
  'Police, fire, ambulance, and other emergency vehicle models',
  'emergency',
  true
) ON CONFLICT DO NOTHING;

-- Commercial Fleet Collection
INSERT INTO vehicle_3d_model_collections (id, name, description, collection_type, is_public)
VALUES (
  '00000000-0000-0000-0000-000000000103'::UUID,
  'Commercial Fleet',
  'Delivery vans, trucks, and commercial vehicle models',
  'commercial',
  true
) ON CONFLICT DO NOTHING;

-- ============================================
-- Comments for Documentation
-- ============================================

COMMENT ON TABLE vehicle_3d_models IS 'Library of 3D vehicle models from multiple sources';
COMMENT ON TABLE vehicle_3d_model_usage IS 'Analytics tracking for 3D model usage';
COMMENT ON TABLE vehicle_3d_model_collections IS 'Curated collections of 3D models';
COMMENT ON COLUMN vehicle_3d_models.source IS 'Source platform: sketchfab, azure-blob, car3d, custom, triposr';
COMMENT ON COLUMN vehicle_3d_models.license IS 'Usage license: CC0, CC-BY, CC-BY-SA, Commercial';
COMMENT ON COLUMN vehicle_3d_models.poly_count IS 'Triangle count for performance optimization';
COMMENT ON COLUMN vehicle_3d_models.usdz_url IS 'iOS AR Quick Look format URL';

-- ============================================
-- Update Schema Version
-- ============================================

INSERT INTO schema_version (version, description)
VALUES (2, 'Added 3D vehicle models support with hybrid sourcing (Sketchfab, Azure Blob, car3d.net)')
ON CONFLICT DO NOTHING;

-- ============================================
-- END OF MIGRATION
-- ============================================
