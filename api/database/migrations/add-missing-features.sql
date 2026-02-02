-- ============================================================================
-- Fleet Database Missing Features Migration
-- ============================================================================
-- This migration adds all missing database elements identified in the
-- comparison matrix analysis:
--   1. damage_reports table
--   2. PostGIS geography columns
--   3. Spatial indexes
--   4. Geospatial helper functions
-- ============================================================================
-- Migration Version: 2
-- Date: 2026-01-08
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "postgis";

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

-- Create trigger for damage_reports updated_at
DROP TRIGGER IF EXISTS update_damage_reports_updated_at ON damage_reports;
CREATE TRIGGER update_damage_reports_updated_at
    BEFORE UPDATE ON damage_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PART 2: Add PostGIS Geography Columns
-- ============================================================================

-- Add geography column to vehicles table
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

-- Populate existing vehicle locations
UPDATE vehicles
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND location IS NULL;

-- Create spatial index on vehicles location
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles USING GIST(location);

-- Add geography column to facilities table
ALTER TABLE facilities
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(POINT, 4326);

-- Populate existing facility locations
UPDATE facilities
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND location IS NULL;

-- Create spatial index on facilities location
CREATE INDEX IF NOT EXISTS idx_facilities_location ON facilities USING GIST(location);

-- Add geography column to geofences table
ALTER TABLE geofences
ADD COLUMN IF NOT EXISTS geometry GEOGRAPHY(POLYGON, 4326);

-- Note: polygon_coordinates JSONB to GEOGRAPHY conversion requires custom logic
-- based on the JSONB structure. This will be handled by application code.

-- Create spatial index on geofences geometry
CREATE INDEX IF NOT EXISTS idx_geofences_geometry ON geofences USING GIST(geometry);

-- Add geography column to charging_stations table
ALTER TABLE charging_stations
ADD COLUMN IF NOT EXISTS location_point GEOGRAPHY(POINT, 4326);

-- Populate existing charging station locations
UPDATE charging_stations
SET location_point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND location_point IS NULL;

-- Create spatial index on charging_stations location
CREATE INDEX IF NOT EXISTS idx_charging_stations_location ON charging_stations USING GIST(location_point);

-- ============================================================================
-- PART 3: Create Geospatial Helper Functions
-- ============================================================================

-- Function: Calculate distance between two points using PostGIS (returns meters)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL,
    lng1 DECIMAL,
    lat2 DECIMAL,
    lng2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    point1 GEOGRAPHY;
    point2 GEOGRAPHY;
BEGIN
    point1 := ST_SetSRID(ST_MakePoint(lng1, lat1), 4326)::geography;
    point2 := ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)::geography;
    RETURN ST_Distance(point1, point2);
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
DECLARE
    target_point GEOGRAPHY;
BEGIN
    target_point := ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography;

    RETURN QUERY
    SELECT
        v.id,
        v.vin,
        v.make,
        v.model,
        ST_Distance(v.location, target_point)::DECIMAL AS distance_meters,
        v.latitude,
        v.longitude
    FROM vehicles v
    WHERE v.location IS NOT NULL
      AND (p_tenant_id IS NULL OR v.tenant_id = p_tenant_id)
      AND ST_DWithin(v.location, target_point, max_distance_meters)
    ORDER BY ST_Distance(v.location, target_point)
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
DECLARE
    target_point GEOGRAPHY;
BEGIN
    target_point := ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography;

    RETURN QUERY
    SELECT
        f.id,
        f.name,
        f.facility_type,
        ST_Distance(f.location, target_point)::DECIMAL AS distance_meters,
        f.address,
        f.city,
        f.state
    FROM facilities f
    WHERE f.location IS NOT NULL
      AND (p_tenant_id IS NULL OR f.tenant_id = p_tenant_id)
      AND f.is_active = true
    ORDER BY ST_Distance(f.location, target_point)
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Check if point is inside a geofence
CREATE OR REPLACE FUNCTION point_in_geofence(
    check_lat DECIMAL,
    check_lng DECIMAL,
    geofence_uuid UUID
) RETURNS BOOLEAN AS $$
DECLARE
    check_point GEOGRAPHY;
    fence_geometry GEOGRAPHY;
    fence_type VARCHAR;
    center_lat DECIMAL;
    center_lng DECIMAL;
    radius_meters DECIMAL;
BEGIN
    -- Create point to check
    check_point := ST_SetSRID(ST_MakePoint(check_lng, check_lat), 4326)::geography;

    -- Get geofence details
    SELECT g.geometry, g.geofence_type, g.center_latitude, g.center_longitude, g.radius
    INTO fence_geometry, fence_type, center_lat, center_lng, radius_meters
    FROM geofences g
    WHERE g.id = geofence_uuid AND g.is_active = true;

    IF fence_geometry IS NOT NULL THEN
        -- Use polygon geometry if available
        RETURN ST_Intersects(check_point, fence_geometry);
    ELSIF fence_type = 'circular' AND center_lat IS NOT NULL AND center_lng IS NOT NULL AND radius_meters IS NOT NULL THEN
        -- Fall back to circular geofence using center point and radius
        DECLARE
            center_point GEOGRAPHY;
        BEGIN
            center_point := ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography;
            RETURN ST_DWithin(check_point, center_point, radius_meters);
        END;
    ELSE
        RETURN false;
    END IF;
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
DECLARE
    target_point GEOGRAPHY;
BEGIN
    target_point := ST_SetSRID(ST_MakePoint(target_lng, target_lat), 4326)::geography;

    RETURN QUERY
    SELECT
        cs.id,
        cs.station_name,
        cs.station_type,
        ST_Distance(cs.location_point, target_point)::DECIMAL AS distance_meters,
        cs.is_operational,
        cs.number_of_ports,
        cs.power_output_kw,
        cs.cost_per_kwh
    FROM charging_stations cs
    WHERE cs.location_point IS NOT NULL
      AND (p_tenant_id IS NULL OR cs.tenant_id = p_tenant_id)
      AND cs.is_operational = true
      AND (station_type_filter IS NULL OR cs.station_type = station_type_filter)
    ORDER BY ST_Distance(cs.location_point, target_point)
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Find vehicles within geofence
CREATE OR REPLACE FUNCTION find_vehicles_in_geofence(
    geofence_uuid UUID
) RETURNS TABLE(
    vehicle_id UUID,
    vin VARCHAR,
    make VARCHAR,
    model VARCHAR,
    latitude DECIMAL,
    longitude DECIMAL
) AS $$
DECLARE
    fence_geometry GEOGRAPHY;
    fence_type VARCHAR;
    center_lat DECIMAL;
    center_lng DECIMAL;
    radius_meters DECIMAL;
    center_point GEOGRAPHY;
BEGIN
    -- Get geofence details
    SELECT g.geometry, g.geofence_type, g.center_latitude, g.center_longitude, g.radius
    INTO fence_geometry, fence_type, center_lat, center_lng, radius_meters
    FROM geofences g
    WHERE g.id = geofence_uuid AND g.is_active = true;

    IF fence_geometry IS NOT NULL THEN
        -- Use polygon geometry
        RETURN QUERY
        SELECT v.id, v.vin, v.make, v.model, v.latitude, v.longitude
        FROM vehicles v
        WHERE v.location IS NOT NULL
          AND ST_Intersects(v.location, fence_geometry);
    ELSIF fence_type = 'circular' AND center_lat IS NOT NULL AND center_lng IS NOT NULL AND radius_meters IS NOT NULL THEN
        -- Use circular geofence
        center_point := ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography;
        RETURN QUERY
        SELECT v.id, v.vin, v.make, v.model, v.latitude, v.longitude
        FROM vehicles v
        WHERE v.location IS NOT NULL
          AND ST_DWithin(v.location, center_point, radius_meters);
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Calculate route distance from waypoints (GeoJSON LineString)
CREATE OR REPLACE FUNCTION calculate_route_distance(
    route_geometry_json JSONB
) RETURNS DECIMAL AS $$
DECLARE
    route_line GEOGRAPHY;
BEGIN
    -- Convert GeoJSON to PostGIS geography
    route_line := ST_GeomFromGeoJSON(route_geometry_json::text)::geography;
    RETURN ST_Length(route_line);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- PART 4: Create Triggers for Automatic Geography Column Updates
-- ============================================================================

-- Trigger function to update vehicles.location when lat/lng changes
CREATE OR REPLACE FUNCTION update_vehicle_location()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL) AND
       (NEW.latitude != OLD.latitude OR NEW.longitude != OLD.longitude OR NEW.location IS NULL) THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_vehicle_location ON vehicles;
CREATE TRIGGER trigger_update_vehicle_location
    BEFORE UPDATE ON vehicles
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_location();

-- Trigger function to update facilities.location when lat/lng changes
CREATE OR REPLACE FUNCTION update_facility_location()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL) AND
       (NEW.latitude != OLD.latitude OR NEW.longitude != OLD.longitude OR NEW.location IS NULL) THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_facility_location ON facilities;
CREATE TRIGGER trigger_update_facility_location
    BEFORE UPDATE ON facilities
    FOR EACH ROW
    EXECUTE FUNCTION update_facility_location();

-- Trigger function to update charging_stations.location_point when lat/lng changes
CREATE OR REPLACE FUNCTION update_charging_station_location()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL) AND
       (NEW.latitude != OLD.latitude OR NEW.longitude != OLD.longitude OR NEW.location_point IS NULL) THEN
        NEW.location_point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_charging_station_location ON charging_stations;
CREATE TRIGGER trigger_update_charging_station_location
    BEFORE UPDATE ON charging_stations
    FOR EACH ROW
    EXECUTE FUNCTION update_charging_station_location();

-- ============================================================================
-- PART 5: Update Schema Version
-- ============================================================================

INSERT INTO schema_version (version, description)
VALUES (2, 'Added damage_reports table, PostGIS geography columns, spatial indexes, and geospatial helper functions')
ON CONFLICT (version) DO UPDATE
SET description = EXCLUDED.description,
    applied_at = NOW();

-- ============================================================================
-- PART 6: Create Useful Views
-- ============================================================================

-- View: Active vehicles with last known locations
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
    v.last_gps_update,
    ST_AsGeoJSON(v.location)::jsonb AS location_geojson,
    d.license_number AS driver_license,
    u.first_name || ' ' || u.last_name AS driver_name
FROM vehicles v
LEFT JOIN drivers d ON v.assigned_driver_id = d.id
LEFT JOIN users u ON d.user_id = u.id
WHERE v.location IS NOT NULL;

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
    dr.created_at,
    v.vin,
    v.make,
    v.model,
    v.year,
    d.license_number AS reported_by_license,
    u.first_name || ' ' || u.last_name AS reported_by_name,
    wo.work_order_number,
    wo.status AS work_order_status,
    i.inspection_date
FROM damage_reports dr
JOIN vehicles v ON dr.vehicle_id = v.id
LEFT JOIN drivers d ON dr.reported_by = d.id
LEFT JOIN users u ON d.user_id = u.id
LEFT JOIN work_orders wo ON dr.linked_work_order_id = wo.id
LEFT JOIN inspections i ON dr.inspection_id = i.id;

-- ============================================================================
-- PART 7: Grant Permissions (Adjust as needed)
-- ============================================================================

-- GRANT SELECT, INSERT, UPDATE, DELETE ON damage_reports TO fleetapp;
-- GRANT EXECUTE ON FUNCTION calculate_distance TO fleetapp;
-- GRANT EXECUTE ON FUNCTION find_nearest_vehicles TO fleetapp;
-- GRANT EXECUTE ON FUNCTION find_nearest_facility TO fleetapp;
-- GRANT EXECUTE ON FUNCTION point_in_geofence TO fleetapp;
-- GRANT EXECUTE ON FUNCTION find_nearest_charging_station TO fleetapp;
-- GRANT EXECUTE ON FUNCTION find_vehicles_in_geofence TO fleetapp;
-- GRANT EXECUTE ON FUNCTION calculate_route_distance TO fleetapp;

-- ============================================================================
-- PART 8: Verification Queries
-- ============================================================================

-- Verify damage_reports table
SELECT
    'damage_reports' AS table_name,
    COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'damage_reports';

-- Verify PostGIS installation
SELECT PostGIS_Version() AS postgis_version;

-- Verify geography columns
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name IN ('location', 'location_point', 'geometry')
  AND table_schema = 'public'
ORDER BY table_name, column_name;

-- Verify spatial indexes
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE '%location%'
ORDER BY tablename, indexname;

-- Verify geospatial functions
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_name LIKE '%distance%'
    OR routine_name LIKE '%nearest%'
    OR routine_name LIKE '%geofence%')
ORDER BY routine_name;

-- ============================================================================
-- Migration Complete
-- ============================================================================

SELECT
    'Migration completed successfully' AS status,
    NOW() AS completed_at;
