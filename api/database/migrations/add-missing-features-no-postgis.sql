-- ============================================================================
-- Fleet Database Missing Features Migration (Without PostGIS)
-- ============================================================================
-- This migration adds missing database elements for the simple schema:
--   1. damage_reports table ✓
--   2. Geospatial helper functions (using Haversine formula)
--   3. Missing triggers and functions
--   4. Update schema versioning
-- ============================================================================
-- Migration Version: 2
-- Date: 2026-01-08
-- Compatible with: schema-simple.sql (No PostGIS required)
-- ============================================================================

-- ============================================================================
-- PART 1: Create damage_reports Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS damage_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES drivers(id) ON DELETE SET NULL,
    damage_description TEXT NOT NULL,
    damage_severity VARCHAR(20) NOT NULL CHECK (damage_severity IN ('minor', 'moderate', 'severe')),
    damage_location VARCHAR(255),
    photos TEXT[], -- Array of photo URLs
    triposr_task_id VARCHAR(255), -- TripoSR background task ID for 3D model generation
    triposr_status VARCHAR(20) DEFAULT 'pending' CHECK (triposr_status IN ('pending', 'processing', 'completed', 'failed')),
    triposr_model_url TEXT, -- URL to generated GLB 3D model
    linked_work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    inspection_id UUID REFERENCES inspections(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for damage_reports table
CREATE INDEX IF NOT EXISTS idx_damage_reports_tenant ON damage_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_vehicle ON damage_reports(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_inspection ON damage_reports(inspection_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_work_order ON damage_reports(linked_work_order_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_triposr_status ON damage_reports(triposr_status);
CREATE INDEX IF NOT EXISTS idx_damage_reports_created ON damage_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_damage_reports_reported_by ON damage_reports(reported_by);

-- Create trigger for damage_reports updated_at
CREATE OR REPLACE FUNCTION update_damage_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_damage_reports_updated_at ON damage_reports;
CREATE TRIGGER trigger_damage_reports_updated_at
    BEFORE UPDATE ON damage_reports
    FOR EACH ROW EXECUTE FUNCTION update_damage_reports_updated_at();

-- ============================================================================
-- PART 2: Geospatial Helper Functions (Haversine Formula)
-- ============================================================================

-- Function: Calculate distance between two points using Haversine formula (returns meters)
CREATE OR REPLACE FUNCTION calculate_distance_haversine(
    lat1 DECIMAL,
    lng1 DECIMAL,
    lat2 DECIMAL,
    lng2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    earth_radius CONSTANT DECIMAL := 6371000; -- Earth radius in meters
    dlat DECIMAL;
    dlng DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    -- Handle NULL inputs
    IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
        RETURN NULL;
    END IF;

    -- Convert degrees to radians
    dlat := radians(lat2 - lat1);
    dlng := radians(lng2 - lng1);

    -- Haversine formula
    a := sin(dlat/2) * sin(dlat/2) +
         cos(radians(lat1)) * cos(radians(lat2)) *
         sin(dlng/2) * sin(dlng/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));

    RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Find nearest vehicles to a point
CREATE OR REPLACE FUNCTION find_nearest_vehicles(
    target_lat DECIMAL,
    target_lng DECIMAL,
    max_distance_meters DECIMAL DEFAULT 10000,
    max_results INTEGER DEFAULT 10,
    p_tenant_id UUID DEFAULT NULL
) RETURNS TABLE(
    vehicle_id UUID,
    vin VARCHAR,
    make VARCHAR,
    model VARCHAR,
    distance_meters DECIMAL,
    latitude DECIMAL,
    longitude DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id,
        v.vin,
        v.make,
        v.model,
        calculate_distance_haversine(target_lat, target_lng, v.latitude, v.longitude) AS distance_meters,
        v.latitude,
        v.longitude
    FROM vehicles v
    WHERE v.latitude IS NOT NULL
      AND v.longitude IS NOT NULL
      AND (p_tenant_id IS NULL OR v.tenant_id = p_tenant_id)
      AND calculate_distance_haversine(target_lat, target_lng, v.latitude, v.longitude) <= max_distance_meters
    ORDER BY calculate_distance_haversine(target_lat, target_lng, v.latitude, v.longitude)
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Find nearest facility to a point
CREATE OR REPLACE FUNCTION find_nearest_facility(
    target_lat DECIMAL,
    target_lng DECIMAL,
    p_tenant_id UUID DEFAULT NULL
) RETURNS TABLE(
    facility_id UUID,
    facility_name VARCHAR,
    facility_type VARCHAR,
    distance_meters DECIMAL,
    address VARCHAR,
    city VARCHAR,
    state VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.name,
        f.facility_type,
        calculate_distance_haversine(target_lat, target_lng, f.latitude, f.longitude) AS distance_meters,
        f.address,
        f.city,
        f.state
    FROM facilities f
    WHERE f.latitude IS NOT NULL
      AND f.longitude IS NOT NULL
      AND (p_tenant_id IS NULL OR f.tenant_id = p_tenant_id)
      AND f.is_active = true
    ORDER BY calculate_distance_haversine(target_lat, target_lng, f.latitude, f.longitude)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Check if point is inside circular geofence
CREATE OR REPLACE FUNCTION point_in_circular_geofence(
    check_lat DECIMAL,
    check_lng DECIMAL,
    geofence_uuid UUID
) RETURNS BOOLEAN AS $$
DECLARE
    fence_type VARCHAR;
    center_lat DECIMAL;
    center_lng DECIMAL;
    radius_meters DECIMAL;
    distance_to_center DECIMAL;
BEGIN
    -- Get geofence details
    SELECT g.geofence_type, g.center_latitude, g.center_longitude, g.radius
    INTO fence_type, center_lat, center_lng, radius_meters
    FROM geofences g
    WHERE g.id = geofence_uuid AND g.is_active = true;

    -- Only handle circular geofences
    IF fence_type != 'circular' OR center_lat IS NULL OR center_lng IS NULL OR radius_meters IS NULL THEN
        RETURN false;
    END IF;

    -- Calculate distance from point to geofence center
    distance_to_center := calculate_distance_haversine(check_lat, check_lng, center_lat, center_lng);

    -- Point is inside if distance is less than radius
    RETURN distance_to_center <= radius_meters;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Find nearest charging station
CREATE OR REPLACE FUNCTION find_nearest_charging_station(
    target_lat DECIMAL,
    target_lng DECIMAL,
    station_type_filter VARCHAR DEFAULT NULL,
    max_results INTEGER DEFAULT 5,
    p_tenant_id UUID DEFAULT NULL
) RETURNS TABLE(
    station_id UUID,
    station_name VARCHAR,
    station_type VARCHAR,
    distance_meters DECIMAL,
    is_operational BOOLEAN,
    number_of_ports INTEGER,
    power_output_kw DECIMAL,
    cost_per_kwh DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cs.id,
        cs.station_name,
        cs.station_type,
        calculate_distance_haversine(target_lat, target_lng, cs.latitude, cs.longitude) AS distance_meters,
        cs.is_operational,
        cs.number_of_ports,
        cs.power_output_kw,
        cs.cost_per_kwh
    FROM charging_stations cs
    WHERE cs.latitude IS NOT NULL
      AND cs.longitude IS NOT NULL
      AND (p_tenant_id IS NULL OR cs.tenant_id = p_tenant_id)
      AND cs.is_operational = true
      AND (station_type_filter IS NULL OR cs.station_type = station_type_filter)
    ORDER BY calculate_distance_haversine(target_lat, target_lng, cs.latitude, cs.longitude)
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Find vehicles within circular geofence
CREATE OR REPLACE FUNCTION find_vehicles_in_circular_geofence(
    geofence_uuid UUID
) RETURNS TABLE(
    vehicle_id UUID,
    vin VARCHAR,
    make VARCHAR,
    model VARCHAR,
    latitude DECIMAL,
    longitude DECIMAL,
    distance_from_center DECIMAL
) AS $$
DECLARE
    fence_type VARCHAR;
    center_lat DECIMAL;
    center_lng DECIMAL;
    radius_meters DECIMAL;
BEGIN
    -- Get geofence details
    SELECT g.geofence_type, g.center_latitude, g.center_longitude, g.radius
    INTO fence_type, center_lat, center_lng, radius_meters
    FROM geofences g
    WHERE g.id = geofence_uuid AND g.is_active = true;

    -- Only handle circular geofences
    IF fence_type != 'circular' OR center_lat IS NULL OR center_lng IS NULL OR radius_meters IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        v.id,
        v.vin,
        v.make,
        v.model,
        v.latitude,
        v.longitude,
        calculate_distance_haversine(center_lat, center_lng, v.latitude, v.longitude) AS distance_from_center
    FROM vehicles v
    WHERE v.latitude IS NOT NULL
      AND v.longitude IS NOT NULL
      AND calculate_distance_haversine(center_lat, center_lng, v.latitude, v.longitude) <= radius_meters;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- PART 3: Create schema_version table if it doesn't exist
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial version if not exists
INSERT INTO schema_version (version, description)
VALUES (1, 'Initial simplified schema without PostGIS')
ON CONFLICT (version) DO NOTHING;

-- Insert this migration version
INSERT INTO schema_version (version, description)
VALUES (2, 'Added damage_reports table and geospatial helper functions using Haversine formula')
ON CONFLICT (version) DO UPDATE
SET description = EXCLUDED.description,
    applied_at = NOW();

-- ============================================================================
-- PART 4: Create Useful Views
-- ============================================================================

-- View: Active vehicles with locations
CREATE OR REPLACE VIEW v_vehicles_with_location AS
SELECT
    v.id,
    v.tenant_id,
    v.vin,
    v.make,
    v.model,
    v.year,
    v.status,
    v.latitude,
    v.longitude,
    v.speed,
    v.heading,
    v.odometer,
    v.updated_at AS last_update,
    d.license_number AS driver_license,
    u.first_name || ' ' || u.last_name AS driver_name
FROM vehicles v
LEFT JOIN drivers d ON v.assigned_driver_id = d.user_id
LEFT JOIN users u ON d.user_id = u.id
WHERE v.latitude IS NOT NULL
  AND v.longitude IS NOT NULL;

-- View: Damage reports with related information
CREATE OR REPLACE VIEW v_damage_reports_detailed AS
SELECT
    dr.id,
    dr.tenant_id,
    dr.damage_description,
    dr.damage_severity,
    dr.damage_location,
    dr.triposr_status,
    dr.triposr_model_url,
    dr.photos,
    dr.created_at,
    dr.updated_at,
    v.id AS vehicle_id,
    v.vin,
    v.make,
    v.model,
    v.year,
    d.license_number AS reported_by_license,
    u.first_name || ' ' || u.last_name AS reported_by_name,
    wo.id AS work_order_id,
    wo.status AS work_order_status,
    i.inspection_date,
    i.status AS inspection_status
FROM damage_reports dr
JOIN vehicles v ON dr.vehicle_id = v.id
LEFT JOIN drivers d ON dr.reported_by = d.id
LEFT JOIN users u ON d.user_id = u.id
LEFT JOIN work_orders wo ON dr.linked_work_order_id = wo.id
LEFT JOIN inspections i ON dr.inspection_id = i.id;

-- ============================================================================
-- PART 5: Verification Queries
-- ============================================================================

-- Verify damage_reports table
DO $$
DECLARE
    column_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_name = 'damage_reports';

    RAISE NOTICE 'damage_reports table has % columns', column_count;
END $$;

-- Verify geospatial functions
DO $$
DECLARE
    function_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
      AND (routine_name LIKE '%distance%'
        OR routine_name LIKE '%nearest%'
        OR routine_name LIKE '%geofence%');

    RAISE NOTICE 'Created % geospatial helper functions', function_count;
END $$;

-- ============================================================================
-- Migration Complete
-- ============================================================================

SELECT
    'Migration completed successfully (without PostGIS)' AS status,
    NOW() AS completed_at;
