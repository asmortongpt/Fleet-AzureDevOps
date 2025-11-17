-- Migration: 3D Vehicle Models & AR Support
-- Created: 2025-11-10
-- Purpose: High-fidelity 3D vehicle visualization with AR capabilities

-- ============================================================================
-- 3D Vehicle Model Assets
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_3d_models (
  id SERIAL PRIMARY KEY,

  -- Model identification
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  trim VARCHAR(100),
  body_style VARCHAR(50), -- 'sedan', 'suv', 'truck', 'coupe', 'van', 'convertible'

  -- 3D Model files (stored in Azure Blob Storage)
  glb_model_url TEXT, -- GLTF Binary format (web/Android)
  usdz_model_url TEXT, -- Universal Scene Description (iOS AR)
  gltf_model_url TEXT, -- GLTF JSON format (alternative)

  -- Model quality levels
  high_poly_url TEXT, -- High-detail model for close-ups
  medium_poly_url TEXT, -- Standard quality for general viewing
  low_poly_url TEXT, -- Optimized for mobile/AR

  -- Texture maps (PBR - Physically Based Rendering)
  diffuse_map_url TEXT, -- Base color/albedo texture
  normal_map_url TEXT, -- Surface detail normals
  metallic_map_url TEXT, -- Metallic/smoothness values
  roughness_map_url TEXT, -- Surface roughness
  ao_map_url TEXT, -- Ambient occlusion
  emissive_map_url TEXT, -- Lights/glowing elements

  -- Model metadata
  polygon_count INT, -- Number of polygons/triangles
  file_size_mb DECIMAL(8, 2), -- Model file size
  model_scale DECIMAL(6, 4) DEFAULT 1.0, -- Scale factor

  -- Bounding box (for AR placement)
  bbox_width_m DECIMAL(6, 3), -- Width in meters
  bbox_height_m DECIMAL(6, 3), -- Height in meters
  bbox_length_m DECIMAL(6, 3), -- Length in meters

  -- Camera presets (JSON)
  default_camera_position JSONB, -- {x, y, z, target}
  camera_presets JSONB, -- Array of named camera angles

  -- Model status
  is_published BOOLEAN DEFAULT false,
  quality_verified BOOLEAN DEFAULT false,
  supports_ar BOOLEAN DEFAULT true,

  -- Version control
  version INT DEFAULT 1,
  replaced_by_id INT REFERENCES vehicle_3d_models(id),

  -- Metadata
  created_by INT REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(make, model, year, trim, version)
);

CREATE INDEX idx_3d_models_make_model ON vehicle_3d_models(make, model, year);
CREATE INDEX idx_3d_models_published ON vehicle_3d_models(is_published) WHERE is_published = true;
CREATE INDEX idx_3d_models_ar ON vehicle_3d_models(supports_ar) WHERE supports_ar = true;

-- ============================================================================
-- Vehicle 3D Instances (Link vehicles to their 3D models)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_3d_instances (
  id SERIAL PRIMARY KEY,

  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  model_3d_id INT NOT NULL REFERENCES vehicle_3d_models(id),

  -- Current customization state
  exterior_color_hex VARCHAR(7), -- #RRGGBB
  exterior_color_name VARCHAR(100), -- 'Midnight Black', 'Pearl White'
  interior_color_hex VARCHAR(7),
  interior_color_name VARCHAR(100),

  -- Customization options
  wheel_style VARCHAR(100), -- '18" Alloy', '20" Sport'
  trim_package VARCHAR(100), -- 'Sport', 'Luxury', 'Off-Road'

  -- Custom textures (overrides)
  custom_paint_url TEXT, -- Custom paint texture
  custom_interior_url TEXT, -- Custom interior texture
  custom_wheels_url TEXT, -- Custom wheel texture

  -- Accessories/modifications
  accessories JSONB, -- [{type: 'roof_rack', model: 'thule_canyon'}, ...]
  modifications JSONB, -- [{type: 'lift_kit', height_inches: 3}, ...]

  -- Damage overlay (AI detection integration)
  damage_markers JSONB, -- [{location: {x, y, z}, severity: 'minor', type: 'dent'}, ...]
  damage_texture_url TEXT, -- Overlay texture showing damage
  last_damage_scan TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(vehicle_id)
);

CREATE INDEX idx_3d_instances_vehicle ON vehicle_3d_instances(vehicle_id);
CREATE INDEX idx_3d_instances_model ON vehicle_3d_instances(model_3d_id);

-- ============================================================================
-- 3D Customization Options Catalog
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_3d_customization_catalog (
  id SERIAL PRIMARY KEY,

  -- Applicability
  model_3d_id INT REFERENCES vehicle_3d_models(id), -- NULL = applies to all
  make VARCHAR(100), -- Filter by make
  model VARCHAR(100), -- Filter by model

  -- Customization type
  category VARCHAR(50) NOT NULL, -- 'exterior_color', 'interior_color', 'wheels', 'trim', 'accessory'
  item_name VARCHAR(255) NOT NULL,
  item_code VARCHAR(100), -- SKU or part number

  -- 3D Asset
  preview_image_url TEXT,
  model_url TEXT, -- 3D model for accessory
  texture_url TEXT, -- Texture for paint/material

  -- Material properties (PBR)
  color_hex VARCHAR(7),
  metallic_value DECIMAL(3, 2), -- 0.0 to 1.0
  roughness_value DECIMAL(3, 2), -- 0.0 to 1.0

  -- Pricing
  price_usd DECIMAL(10, 2),
  requires_installation BOOLEAN DEFAULT false,
  installation_cost_usd DECIMAL(8, 2),

  -- Availability
  is_available BOOLEAN DEFAULT true,
  lead_time_days INT, -- Manufacturing/ordering time

  -- Display
  display_order INT DEFAULT 0,
  description TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_customization_category ON vehicle_3d_customization_catalog(category, is_available);
CREATE INDEX idx_customization_model ON vehicle_3d_customization_catalog(model_3d_id);

-- ============================================================================
-- AR Session Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS ar_sessions (
  id SERIAL PRIMARY KEY,

  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,

  -- Session details
  platform VARCHAR(20) NOT NULL, -- 'iOS', 'Android', 'WebXR'
  ar_framework VARCHAR(50), -- 'ARKit', 'ARCore', 'WebXR'
  device_model VARCHAR(100),
  os_version VARCHAR(50),

  -- Session timing
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration_seconds INT,

  -- AR metrics
  placement_attempts INT DEFAULT 0,
  successful_placements INT DEFAULT 0,
  screenshots_taken INT DEFAULT 0,

  -- User interactions
  viewed_angles INT DEFAULT 0, -- Number of viewpoint changes
  zoomed_in BOOLEAN DEFAULT false,
  opened_doors BOOLEAN DEFAULT false,
  viewed_interior BOOLEAN DEFAULT false,

  -- Session outcome
  led_to_inquiry BOOLEAN DEFAULT false,
  led_to_purchase BOOLEAN DEFAULT false,
  session_rating INT, -- 1-5 stars

  -- Technical data
  anchor_type VARCHAR(50), -- 'horizontal_plane', 'vertical_plane', 'image_marker'
  lighting_estimation BOOLEAN,
  occlusion_enabled BOOLEAN,

  session_data JSONB, -- Additional session metadata

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ar_sessions_vehicle ON ar_sessions(vehicle_id, started_at DESC);
CREATE INDEX idx_ar_sessions_user ON ar_sessions(user_id, started_at DESC);
CREATE INDEX idx_ar_sessions_platform ON ar_sessions(platform);

-- ============================================================================
-- 3D Render Presets (for marketing/listings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_3d_renders (
  id SERIAL PRIMARY KEY,

  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  instance_3d_id INT REFERENCES vehicle_3d_instances(id),

  -- Render details
  render_name VARCHAR(255) NOT NULL, -- 'hero_shot', 'front_3quarter', 'interior'
  camera_angle VARCHAR(50) NOT NULL, -- 'front', 'rear', 'side', '3quarter', 'interior', 'overhead'

  -- Image outputs
  render_url TEXT NOT NULL, -- Final rendered image
  thumbnail_url TEXT, -- Small preview

  -- Render settings
  resolution_width INT DEFAULT 1920,
  resolution_height INT DEFAULT 1080,
  render_quality VARCHAR(20) DEFAULT 'high', -- 'low', 'medium', 'high', 'ultra'

  -- Environment
  background_type VARCHAR(50), -- 'studio', 'outdoor', 'showroom', 'transparent'
  hdri_environment VARCHAR(100), -- HDRI lighting preset
  time_of_day VARCHAR(20), -- 'morning', 'noon', 'sunset', 'night'

  -- Usage
  used_in_listing BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  view_count INT DEFAULT 0,

  -- Render metadata
  render_engine VARCHAR(50), -- 'Three.js', 'Blender', 'Unreal', 'Unity'
  render_time_seconds INT,
  file_size_kb INT,

  rendered_by INT REFERENCES users(id),
  rendered_at TIMESTAMP DEFAULT NOW(),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_3d_renders_vehicle ON vehicle_3d_renders(vehicle_id, is_featured);
CREATE INDEX idx_3d_renders_listing ON vehicle_3d_renders(used_in_listing) WHERE used_in_listing = true;

-- ============================================================================
-- 3D Animation Presets
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_3d_animations (
  id SERIAL PRIMARY KEY,

  model_3d_id INT NOT NULL REFERENCES vehicle_3d_models(id) ON DELETE CASCADE,

  -- Animation details
  animation_name VARCHAR(100) NOT NULL, -- 'door_open_driver', 'trunk_open', 'wheel_spin'
  animation_type VARCHAR(50) NOT NULL, -- 'mechanical', 'camera', 'lighting'

  -- Animation data
  keyframes JSONB NOT NULL, -- Animation keyframe data
  duration_seconds DECIMAL(5, 2) DEFAULT 2.0,
  loop BOOLEAN DEFAULT false,

  -- Triggering
  trigger_event VARCHAR(50), -- 'click', 'hover', 'auto', 'api'
  target_component VARCHAR(100), -- 'door_driver', 'trunk', 'wheel_fl'

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_3d_animations_model ON vehicle_3d_animations(model_3d_id, is_active);

-- ============================================================================
-- Performance Analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_3d_performance_metrics (
  id SERIAL PRIMARY KEY,

  -- Session identification
  session_id VARCHAR(100), -- Unique session identifier
  vehicle_id INT REFERENCES vehicles(id),
  model_3d_id INT REFERENCES vehicle_3d_models(id),

  -- Device/platform
  platform VARCHAR(20), -- 'web', 'ios', 'android'
  device_type VARCHAR(50), -- 'desktop', 'mobile', 'tablet'
  gpu_info TEXT,

  -- Performance metrics
  load_time_ms INT, -- Time to load 3D model
  fps_average INT, -- Average frames per second
  fps_min INT, -- Minimum FPS during session
  memory_usage_mb INT, -- GPU memory usage

  -- Model quality served
  quality_level VARCHAR(20), -- 'low', 'medium', 'high'
  polygon_count INT,
  texture_resolution VARCHAR(20), -- '1k', '2k', '4k'

  -- Render settings
  shadows_enabled BOOLEAN,
  reflections_enabled BOOLEAN,
  ao_enabled BOOLEAN,

  -- Session duration
  session_duration_seconds INT,

  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_3d_performance_vehicle ON vehicle_3d_performance_metrics(vehicle_id, timestamp DESC);
CREATE INDEX idx_3d_performance_platform ON vehicle_3d_performance_metrics(platform);

-- ============================================================================
-- Functions & Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_3d_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_3d_models_updated_at
  BEFORE UPDATE ON vehicle_3d_models
  FOR EACH ROW
  EXECUTE FUNCTION update_3d_updated_at();

CREATE TRIGGER update_3d_instances_updated_at
  BEFORE UPDATE ON vehicle_3d_instances
  FOR EACH ROW
  EXECUTE FUNCTION update_3d_updated_at();

CREATE TRIGGER update_customization_catalog_updated_at
  BEFORE UPDATE ON vehicle_3d_customization_catalog
  FOR EACH ROW
  EXECUTE FUNCTION update_3d_updated_at();

-- Function to calculate AR session duration
CREATE OR REPLACE FUNCTION calculate_ar_session_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
    NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_ar_duration
  BEFORE UPDATE ON ar_sessions
  FOR EACH ROW
  EXECUTE FUNCTION calculate_ar_session_duration();

-- ============================================================================
-- Views
-- ============================================================================

-- Published 3D models catalog
CREATE OR REPLACE VIEW published_3d_models AS
SELECT
  m.id,
  m.make,
  m.model,
  m.year,
  m.trim,
  m.body_style,
  m.glb_model_url,
  m.usdz_model_url,
  m.polygon_count,
  m.supports_ar,
  COUNT(DISTINCT vi.vehicle_id) as vehicles_using_model
FROM vehicle_3d_models m
LEFT JOIN vehicle_3d_instances vi ON m.id = vi.model_3d_id
WHERE m.is_published = true
GROUP BY m.id
ORDER BY m.make, m.model, m.year;

-- Vehicle 3D viewer data (complete package for frontend)
CREATE OR REPLACE VIEW vehicle_3d_viewer_data AS
SELECT
  v.id as vehicle_id,
  v.name as vehicle_name,
  v.vin,
  v.make,
  v.model,
  v.year,
  vi.exterior_color_name,
  vi.exterior_color_hex,
  vi.interior_color_name,
  vi.wheel_style,
  vi.trim_package,
  vi.damage_markers,
  m.glb_model_url,
  m.usdz_model_url,
  m.high_poly_url,
  m.medium_poly_url,
  m.low_poly_url,
  m.diffuse_map_url,
  m.normal_map_url,
  m.metallic_map_url,
  m.roughness_map_url,
  m.ao_map_url,
  m.default_camera_position,
  m.camera_presets,
  m.bbox_width_m,
  m.bbox_height_m,
  m.bbox_length_m,
  m.supports_ar
FROM vehicles v
LEFT JOIN vehicle_3d_instances vi ON v.id = vi.vehicle_id
LEFT JOIN vehicle_3d_models m ON vi.model_3d_id = m.id
WHERE m.is_published = true;

-- AR session analytics
CREATE OR REPLACE VIEW ar_session_analytics AS
SELECT
  DATE_TRUNC('day', started_at) as session_date,
  platform,
  COUNT(*) as total_sessions,
  AVG(duration_seconds) as avg_duration_seconds,
  SUM(successful_placements) as total_placements,
  SUM(screenshots_taken) as total_screenshots,
  COUNT(*) FILTER (WHERE led_to_inquiry) as inquiry_count,
  COUNT(*) FILTER (WHERE led_to_purchase) as purchase_count,
  ROUND(AVG(session_rating), 2) as avg_rating
FROM ar_sessions
WHERE started_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', started_at), platform
ORDER BY session_date DESC, platform;

-- 3D performance summary
CREATE OR REPLACE VIEW performance_3d_summary AS
SELECT
  platform,
  device_type,
  quality_level,
  AVG(load_time_ms) as avg_load_time_ms,
  AVG(fps_average) as avg_fps,
  AVG(memory_usage_mb) as avg_memory_mb,
  COUNT(*) as session_count
FROM vehicle_3d_performance_metrics
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY platform, device_type, quality_level
ORDER BY session_count DESC;

-- ============================================================================
-- Sample Data (Placeholder Models)
-- ============================================================================

-- Insert placeholder 3D models for common vehicle types
INSERT INTO vehicle_3d_models (
  make, model, year, body_style,
  glb_model_url, usdz_model_url,
  polygon_count, is_published, supports_ar,
  bbox_width_m, bbox_height_m, bbox_length_m,
  default_camera_position,
  created_at
) VALUES
-- Sedan placeholder
('Generic', 'Sedan', 2024, 'sedan',
 '/models/placeholder/sedan.glb', '/models/placeholder/sedan.usdz',
 50000, true, true,
 1.8, 1.5, 4.8,
 '{"x": 5, "y": 2, "z": 8, "target": {"x": 0, "y": 0.5, "z": 0}}',
 NOW()),

-- SUV placeholder
('Generic', 'SUV', 2024, 'suv',
 '/models/placeholder/suv.glb', '/models/placeholder/suv.usdz',
 60000, true, true,
 2.0, 1.8, 5.0,
 '{"x": 6, "y": 2.5, "z": 9, "target": {"x": 0, "y": 0.8, "z": 0}}',
 NOW()),

-- Truck placeholder
('Generic', 'Pickup', 2024, 'truck',
 '/models/placeholder/truck.glb', '/models/placeholder/truck.usdz',
 65000, true, true,
 2.1, 1.9, 5.8,
 '{"x": 7, "y": 2.5, "z": 10, "target": {"x": 0, "y": 0.9, "z": 0}}',
 NOW());

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE vehicle_3d_models IS '3D vehicle model assets with PBR textures';
COMMENT ON TABLE vehicle_3d_instances IS 'Links vehicles to 3D models with customization state';
COMMENT ON TABLE vehicle_3d_customization_catalog IS 'Available customization options for 3D models';
COMMENT ON TABLE ar_sessions IS 'AR viewing session tracking and analytics';
COMMENT ON TABLE vehicle_3d_renders IS 'Pre-rendered vehicle images for marketing';
COMMENT ON TABLE vehicle_3d_animations IS 'Animation presets for interactive 3D viewer';
COMMENT ON TABLE vehicle_3d_performance_metrics IS '3D viewer performance monitoring';
