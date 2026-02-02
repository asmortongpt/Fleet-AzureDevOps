-- Migration: LiDAR 3D Scanning System
-- Description: Tables for LiDAR point cloud processing, 3D model generation, damage detection, and AR integration
-- Version: 020
-- Date: 2026-01-11

-- ============================================================================
-- LiDAR Scans Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS lidar_scans (
  -- Primary Key
  scan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,

  -- Vehicle Reference
  vehicle_id INTEGER NOT NULL,
  damage_report_id UUID,

  -- Scanner Information
  scanner_id VARCHAR(255) NOT NULL,
  scanner_type VARCHAR(50) NOT NULL CHECK (scanner_type IN ('iphone_lidar', 'ipad_pro', 'standalone', 'industrial')),

  -- Scan Metadata
  scan_date TIMESTAMP WITH TIME ZONE NOT NULL,
  scan_duration_ms INTEGER NOT NULL,
  point_count INTEGER NOT NULL,
  resolution DECIMAL(10, 6) NOT NULL, -- points per meter
  accuracy DECIMAL(10, 6) NOT NULL, -- meters

  -- Capture Device
  capture_device JSONB NOT NULL, -- {model, osVersion, appVersion}
  environmental_conditions JSONB, -- {lighting, temperature, humidity}
  bounding_box JSONB NOT NULL, -- {minX, minY, minZ, maxX, maxY, maxZ}

  -- Point Cloud Storage
  point_cloud_url TEXT, -- Azure Blob Storage URL
  point_cloud_size_bytes BIGINT,

  -- Processing Status
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('initiated', 'scanning', 'processing', 'completed', 'failed')),
  error_message TEXT,

  -- Audit Fields
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes
  CONSTRAINT fk_lidar_scans_tenant FOREIGN KEY (tenant_id, vehicle_id)
    REFERENCES vehicles(tenant_id, id) ON DELETE CASCADE
);

-- Indexes for lidar_scans
CREATE INDEX idx_lidar_scans_tenant_vehicle ON lidar_scans(tenant_id, vehicle_id);
CREATE INDEX idx_lidar_scans_damage_report ON lidar_scans(damage_report_id) WHERE damage_report_id IS NOT NULL;
CREATE INDEX idx_lidar_scans_scan_date ON lidar_scans(scan_date DESC);
CREATE INDEX idx_lidar_scans_status ON lidar_scans(status) WHERE status != 'completed';
CREATE INDEX idx_lidar_scans_created_at ON lidar_scans(created_at DESC);

-- Row-level security
ALTER TABLE lidar_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY lidar_scans_tenant_isolation ON lidar_scans
  USING (tenant_id = current_setting('app.tenant_id', true));

-- ============================================================================
-- LiDAR 3D Models Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS lidar_3d_models (
  -- Primary Key
  model_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  scan_id UUID NOT NULL,

  -- Model Format
  format VARCHAR(10) NOT NULL CHECK (format IN ('glb', 'usdz', 'obj', 'ply', 'stl', 'fbx')),

  -- Model Storage
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,

  -- Model Metadata
  polygon_count INTEGER,
  vertex_count INTEGER NOT NULL,
  texture_urls JSONB, -- Array of texture file URLs

  -- Damage Annotations embedded in model
  damage_annotations JSONB,

  -- Generation Info
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_time_ms INTEGER NOT NULL,
  metadata JSONB NOT NULL, -- {software, version, algorithm}

  -- Quality Settings
  quality VARCHAR(20) CHECK (quality IN ('low', 'medium', 'high', 'ultra')),
  optimized_for_ar BOOLEAN DEFAULT FALSE,

  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign Keys
  CONSTRAINT fk_lidar_3d_models_scan FOREIGN KEY (tenant_id, scan_id)
    REFERENCES lidar_scans(tenant_id, scan_id) ON DELETE CASCADE
);

-- Indexes for lidar_3d_models
CREATE INDEX idx_lidar_3d_models_tenant_scan ON lidar_3d_models(tenant_id, scan_id);
CREATE INDEX idx_lidar_3d_models_format ON lidar_3d_models(format);
CREATE INDEX idx_lidar_3d_models_created_at ON lidar_3d_models(created_at DESC);

-- Row-level security
ALTER TABLE lidar_3d_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY lidar_3d_models_tenant_isolation ON lidar_3d_models
  USING (tenant_id = current_setting('app.tenant_id', true));

-- ============================================================================
-- LiDAR Damage Annotations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS lidar_damage_annotations (
  -- Primary Key
  annotation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  scan_id UUID NOT NULL,

  -- Damage Classification
  damage_type VARCHAR(50) NOT NULL CHECK (damage_type IN ('dent', 'scratch', 'crack', 'hole', 'rust', 'paint_damage', 'structural')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe', 'critical')),

  -- 3D Location
  location_x DECIMAL(10, 6) NOT NULL,
  location_y DECIMAL(10, 6) NOT NULL,
  location_z DECIMAL(10, 6) NOT NULL,

  -- Measurements
  area DECIMAL(12, 8) NOT NULL, -- square meters
  volume DECIMAL(12, 8), -- cubic meters
  depth DECIMAL(12, 8), -- meters
  length DECIMAL(12, 8), -- meters
  width DECIMAL(12, 8), -- meters

  -- Detection Info
  confidence DECIMAL(4, 3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  detection_method VARCHAR(20) NOT NULL CHECK (detection_method IN ('manual', 'ai', 'lidar_analysis')),

  -- Bounding Box
  bounding_box JSONB, -- {minX, minY, minZ, maxX, maxY, maxZ}

  -- Additional Data
  affected_parts JSONB, -- Array of affected vehicle parts
  estimated_repair_cost DECIMAL(10, 2),
  photos JSONB, -- Array of photo URLs
  notes TEXT,

  -- Review Status
  reviewed BOOLEAN DEFAULT FALSE,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP WITH TIME ZONE,

  -- Audit Fields
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign Keys
  CONSTRAINT fk_lidar_damage_annotations_scan FOREIGN KEY (tenant_id, scan_id)
    REFERENCES lidar_scans(tenant_id, scan_id) ON DELETE CASCADE
);

-- Indexes for lidar_damage_annotations
CREATE INDEX idx_lidar_damage_annotations_tenant_scan ON lidar_damage_annotations(tenant_id, scan_id);
CREATE INDEX idx_lidar_damage_annotations_severity ON lidar_damage_annotations(severity);
CREATE INDEX idx_lidar_damage_annotations_damage_type ON lidar_damage_annotations(damage_type);
CREATE INDEX idx_lidar_damage_annotations_location ON lidar_damage_annotations(location_x, location_y, location_z);
CREATE INDEX idx_lidar_damage_annotations_reviewed ON lidar_damage_annotations(reviewed) WHERE NOT reviewed;
CREATE INDEX idx_lidar_damage_annotations_created_at ON lidar_damage_annotations(created_at DESC);

-- Spatial index for location-based queries (requires PostGIS extension if available)
-- CREATE INDEX idx_lidar_damage_annotations_spatial ON lidar_damage_annotations
--   USING gist(point(location_x, location_y));

-- Row-level security
ALTER TABLE lidar_damage_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY lidar_damage_annotations_tenant_isolation ON lidar_damage_annotations
  USING (tenant_id = current_setting('app.tenant_id', true));

-- ============================================================================
-- LiDAR Volume Calculations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS lidar_volume_calculations (
  -- Primary Key
  calculation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  scan_id UUID NOT NULL,

  -- Calculation Method
  method VARCHAR(50) NOT NULL CHECK (method IN ('convex_hull', 'delaunay', 'marching_cubes', 'voxel')),

  -- Results
  total_volume DECIMAL(12, 8) NOT NULL, -- cubic meters
  surface_area DECIMAL(12, 8) NOT NULL, -- square meters
  damage_volumes JSONB NOT NULL, -- Array of {annotationId, volume, surfaceArea, depth, severity}

  -- Performance Metrics
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  compute_time_ms INTEGER NOT NULL,

  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign Keys
  CONSTRAINT fk_lidar_volume_calculations_scan FOREIGN KEY (tenant_id, scan_id)
    REFERENCES lidar_scans(tenant_id, scan_id) ON DELETE CASCADE
);

-- Indexes for lidar_volume_calculations
CREATE INDEX idx_lidar_volume_calculations_tenant_scan ON lidar_volume_calculations(tenant_id, scan_id);
CREATE INDEX idx_lidar_volume_calculations_method ON lidar_volume_calculations(method);
CREATE INDEX idx_lidar_volume_calculations_calculated_at ON lidar_volume_calculations(calculated_at DESC);

-- Row-level security
ALTER TABLE lidar_volume_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY lidar_volume_calculations_tenant_isolation ON lidar_volume_calculations
  USING (tenant_id = current_setting('app.tenant_id', true));

-- ============================================================================
-- LiDAR Scan Comparisons Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS lidar_scan_comparisons (
  -- Primary Key
  comparison_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,

  -- Scans Being Compared
  base_scan_id UUID NOT NULL,
  compare_scan_id UUID NOT NULL,

  -- Difference Statistics
  points_added INTEGER NOT NULL DEFAULT 0,
  points_removed INTEGER NOT NULL DEFAULT 0,
  points_changed INTEGER NOT NULL DEFAULT 0,
  max_deviation DECIMAL(10, 6) NOT NULL, -- meters
  average_deviation DECIMAL(10, 6) NOT NULL, -- meters
  rms_deviation DECIMAL(10, 6) NOT NULL, -- root mean square deviation

  -- New Damage Detected
  new_damage_count INTEGER DEFAULT 0,
  progressed_damage_count INTEGER DEFAULT 0,

  -- Visualization
  visualization_url TEXT,
  difference_map_url TEXT,

  -- Comparison Metadata
  comparison_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tolerance DECIMAL(10, 6) DEFAULT 0.001, -- meters

  -- Audit Fields
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign Keys
  CONSTRAINT fk_lidar_scan_comparisons_base FOREIGN KEY (tenant_id, base_scan_id)
    REFERENCES lidar_scans(tenant_id, scan_id) ON DELETE CASCADE,
  CONSTRAINT fk_lidar_scan_comparisons_compare FOREIGN KEY (tenant_id, compare_scan_id)
    REFERENCES lidar_scans(tenant_id, scan_id) ON DELETE CASCADE,

  -- Constraint: cannot compare scan with itself
  CONSTRAINT chk_different_scans CHECK (base_scan_id != compare_scan_id)
);

-- Indexes for lidar_scan_comparisons
CREATE INDEX idx_lidar_scan_comparisons_tenant ON lidar_scan_comparisons(tenant_id);
CREATE INDEX idx_lidar_scan_comparisons_base_scan ON lidar_scan_comparisons(base_scan_id);
CREATE INDEX idx_lidar_scan_comparisons_compare_scan ON lidar_scan_comparisons(compare_scan_id);
CREATE INDEX idx_lidar_scan_comparisons_comparison_date ON lidar_scan_comparisons(comparison_date DESC);

-- Row-level security
ALTER TABLE lidar_scan_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY lidar_scan_comparisons_tenant_isolation ON lidar_scan_comparisons
  USING (tenant_id = current_setting('app.tenant_id', true));

-- ============================================================================
-- AR Session Tracking Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS lidar_ar_sessions (
  -- Primary Key
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  scan_id UUID NOT NULL,

  -- User Info
  user_id VARCHAR(255),

  -- Session Data
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('iOS', 'Android', 'WebXR')),
  ar_framework VARCHAR(50), -- ARKit, ARCore, WebXR, etc.
  device_model VARCHAR(100),
  os_version VARCHAR(50),

  -- Session Metrics
  session_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  session_end TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,

  -- Interaction Metrics
  placement_attempts INTEGER DEFAULT 0,
  successful_placements INTEGER DEFAULT 0,
  screenshots_taken INTEGER DEFAULT 0,
  viewed_angles INTEGER DEFAULT 0,

  -- Outcome
  led_to_inquiry BOOLEAN DEFAULT FALSE,
  session_rating INTEGER CHECK (session_rating >= 1 AND session_rating <= 5),

  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Foreign Keys
  CONSTRAINT fk_lidar_ar_sessions_scan FOREIGN KEY (tenant_id, scan_id)
    REFERENCES lidar_scans(tenant_id, scan_id) ON DELETE CASCADE
);

-- Indexes for lidar_ar_sessions
CREATE INDEX idx_lidar_ar_sessions_tenant_scan ON lidar_ar_sessions(tenant_id, scan_id);
CREATE INDEX idx_lidar_ar_sessions_platform ON lidar_ar_sessions(platform);
CREATE INDEX idx_lidar_ar_sessions_session_start ON lidar_ar_sessions(session_start DESC);

-- Row-level security
ALTER TABLE lidar_ar_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY lidar_ar_sessions_tenant_isolation ON lidar_ar_sessions
  USING (tenant_id = current_setting('app.tenant_id', true));

-- ============================================================================
-- Performance Statistics View
-- ============================================================================

CREATE OR REPLACE VIEW lidar_scan_statistics AS
SELECT
  ls.tenant_id,
  COUNT(DISTINCT ls.scan_id) as total_scans,
  COUNT(DISTINCT lm.model_id) as total_models,
  COUNT(DISTINCT lda.annotation_id) as total_annotations,
  SUM(ls.point_count) as total_points_scanned,
  AVG(ls.point_count) as avg_points_per_scan,
  AVG(ls.scan_duration_ms) as avg_scan_duration_ms,
  SUM(lm.file_size) as total_model_storage_bytes,
  COUNT(DISTINCT CASE WHEN lda.severity = 'critical' THEN lda.annotation_id END) as critical_damage_count,
  COUNT(DISTINCT CASE WHEN lda.severity = 'severe' THEN lda.annotation_id END) as severe_damage_count,
  COUNT(DISTINCT CASE WHEN lda.severity = 'moderate' THEN lda.annotation_id END) as moderate_damage_count,
  COUNT(DISTINCT CASE WHEN lda.severity = 'minor' THEN lda.annotation_id END) as minor_damage_count,
  MAX(ls.scan_date) as last_scan_date
FROM lidar_scans ls
LEFT JOIN lidar_3d_models lm ON ls.scan_id = lm.scan_id AND ls.tenant_id = lm.tenant_id
LEFT JOIN lidar_damage_annotations lda ON ls.scan_id = lda.scan_id AND ls.tenant_id = lda.tenant_id
GROUP BY ls.tenant_id;

-- Grant permissions
GRANT SELECT ON lidar_scan_statistics TO authenticated;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_lidar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_lidar_scans_updated_at
  BEFORE UPDATE ON lidar_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_lidar_updated_at();

CREATE TRIGGER trigger_lidar_damage_annotations_updated_at
  BEFORE UPDATE ON lidar_damage_annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_lidar_updated_at();

CREATE TRIGGER trigger_lidar_ar_sessions_updated_at
  BEFORE UPDATE ON lidar_ar_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_lidar_updated_at();

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE lidar_scans IS 'LiDAR scan sessions with metadata and point cloud storage';
COMMENT ON TABLE lidar_3d_models IS '3D models generated from LiDAR scans in various formats';
COMMENT ON TABLE lidar_damage_annotations IS 'Damage detections with 3D coordinates and measurements';
COMMENT ON TABLE lidar_volume_calculations IS 'Volume calculations for damage zones';
COMMENT ON TABLE lidar_scan_comparisons IS 'Comparisons between two scans for damage progression tracking';
COMMENT ON TABLE lidar_ar_sessions IS 'AR viewing sessions for tracking user engagement';

-- ============================================================================
-- End of Migration
-- ============================================================================
