-- Migration 005: Telematics & GPS Tracking Tables
-- Created: 2026-01-08
-- Description: Add comprehensive telematic and GPS tracking capabilities

-- Enable PostGIS extension for geospatial functions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS earthdistance CASCADE;
CREATE EXTENSION IF NOT EXISTS vector;  -- For RAG embeddings

-- ============================================================================
-- VEHICLE LOCATIONS - Real-time & Historical GPS Tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    altitude DECIMAL(8, 2),
    speed DECIMAL(6, 2),  -- km/h
    heading DECIMAL(5, 2),  -- degrees 0-360
    accuracy DECIMAL(6, 2),  -- meters
    source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('geotab', 'samsara', 'obd', 'manual', 'gps_device')),
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicle_locations_vehicle_time ON vehicle_locations(vehicle_id, recorded_at DESC);
CREATE INDEX idx_vehicle_locations_tenant_time ON vehicle_locations(tenant_id, recorded_at DESC);
CREATE INDEX idx_vehicle_locations_geospatial ON vehicle_locations USING GIST (ll_to_earth(latitude, longitude));
CREATE INDEX idx_vehicle_locations_recent ON vehicle_locations(vehicle_id, recorded_at DESC) WHERE recorded_at > NOW() - INTERVAL '24 hours';

COMMENT ON TABLE vehicle_locations IS 'Real-time and historical GPS tracking for all vehicles';

-- ============================================================================
-- OBD TELEMETRY - Real-time Vehicle Diagnostics
-- ============================================================================
CREATE TABLE IF NOT EXISTS obd_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    rpm INTEGER,
    speed INTEGER,  -- km/h
    engine_load DECIMAL(5, 2),  -- percentage
    coolant_temp INTEGER,  -- celsius
    fuel_level DECIMAL(5, 2),  -- percentage
    throttle_position DECIMAL(5, 2),
    intake_air_temp INTEGER,
    maf_rate DECIMAL(8, 2),  -- Mass Air Flow g/s
    battery_voltage DECIMAL(4, 2),
    fuel_pressure DECIMAL(6, 2),
    dtc_codes TEXT[],  -- Diagnostic Trouble Codes array
    odometer INTEGER,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_obd_telemetry_vehicle_time ON obd_telemetry(vehicle_id, recorded_at DESC);
CREATE INDEX idx_obd_telemetry_tenant_time ON obd_telemetry(tenant_id, recorded_at DESC);
CREATE INDEX idx_obd_telemetry_dtc_codes ON obd_telemetry USING GIN (dtc_codes);

COMMENT ON TABLE obd_telemetry IS 'Real-time OBD-II vehicle diagnostics from connected devices';

-- ============================================================================
-- GEOFENCES - Geographic Boundary Definitions
-- ============================================================================
CREATE TABLE IF NOT EXISTS geofences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('circle', 'polygon', 'rectangle')),
    center_lat DECIMAL(10, 8),  -- For circles
    center_lng DECIMAL(11, 8),  -- For circles
    radius_meters INTEGER,  -- For circles
    coordinates JSONB,  -- GeoJSON for polygons {type: "Polygon", coordinates: [...]}
    color VARCHAR(7) DEFAULT '#3B82F6',  -- Hex color
    is_active BOOLEAN DEFAULT TRUE,
    alert_on_entry BOOLEAN DEFAULT FALSE,
    alert_on_exit BOOLEAN DEFAULT FALSE,
    alert_on_dwell BOOLEAN DEFAULT FALSE,
    dwell_minutes INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_geofences_tenant_active ON geofences(tenant_id, is_active);
CREATE INDEX idx_geofences_coordinates ON geofences USING GIN (coordinates);

COMMENT ON TABLE geofences IS 'Geographic boundaries for alerts and tracking';

-- ============================================================================
-- GEOFENCE EVENTS - Entry/Exit Logging
-- ============================================================================
CREATE TABLE IF NOT EXISTS geofence_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    geofence_id UUID NOT NULL REFERENCES geofences(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('entry', 'exit', 'dwell')),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    dwell_duration_minutes INTEGER,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_geofence_events_vehicle_time ON geofence_events(vehicle_id, recorded_at DESC);
CREATE INDEX idx_geofence_events_geofence_time ON geofence_events(geofence_id, recorded_at DESC);
CREATE INDEX idx_geofence_events_tenant_time ON geofence_events(tenant_id, recorded_at DESC);

COMMENT ON TABLE geofence_events IS 'Vehicle geofence entry/exit event log';

-- ============================================================================
-- DRIVER BEHAVIOR EVENTS - Harsh Driving Events
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_behavior_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'harsh_braking', 'harsh_acceleration', 'harsh_cornering',
        'speeding', 'idle_excess', 'distracted_driving', 'no_seatbelt'
    )),
    severity VARCHAR(20) CHECK (severity IN ('minor', 'moderate', 'severe')),
    speed_at_event DECIMAL(6, 2),  -- km/h
    speed_limit INTEGER,  -- km/h
    g_force DECIMAL(4, 2),  -- For acceleration events
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    video_url TEXT,  -- Link to dashcam footage
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_driver_behavior_driver_time ON driver_behavior_events(driver_id, recorded_at DESC);
CREATE INDEX idx_driver_behavior_vehicle_time ON driver_behavior_events(vehicle_id, recorded_at DESC);
CREATE INDEX idx_driver_behavior_tenant_type_time ON driver_behavior_events(tenant_id, event_type, recorded_at DESC);

COMMENT ON TABLE driver_behavior_events IS 'Driver behavior events for safety analysis';

-- ============================================================================
-- VIDEO TELEMATICS FOOTAGE - Dashcam & AI-Cam Storage
-- ============================================================================
CREATE TABLE IF NOT EXISTS video_telematics_footage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    event_id UUID,  -- FK to driver_behavior_events or incidents
    camera_position VARCHAR(20) CHECK (camera_position IN ('forward', 'interior', 'rear', 'side_left', 'side_right')),
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    file_size_bytes BIGINT,
    resolution VARCHAR(20),  -- '1080p', '720p', '4K'
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    recorded_at TIMESTAMPTZ NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    ai_analysis JSONB,  -- AI detection results
    tags TEXT[],
    is_archived BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ  -- Auto-delete after retention period
);

CREATE INDEX idx_video_footage_vehicle_time ON video_telematics_footage(vehicle_id, recorded_at DESC);
CREATE INDEX idx_video_footage_driver_time ON video_telematics_footage(driver_id, recorded_at DESC) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_video_footage_event ON video_telematics_footage(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX idx_video_footage_tags ON video_telematics_footage USING GIN (tags);
CREATE INDEX idx_video_footage_archived ON video_telematics_footage(is_archived, expires_at) WHERE is_archived = FALSE;

COMMENT ON TABLE video_telematics_footage IS 'Dashcam and AI-cam video footage metadata and storage references';

-- ============================================================================
-- TRIPS - Complete Trip Records
-- ============================================================================
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    trip_number VARCHAR(50) UNIQUE,
    start_location_lat DECIMAL(10, 8),
    start_location_lng DECIMAL(11, 8),
    start_address TEXT,
    end_location_lat DECIMAL(10, 8),
    end_location_lng DECIMAL(11, 8),
    end_address TEXT,
    start_odometer INTEGER,
    end_odometer INTEGER,
    distance_km DECIMAL(8, 2),
    duration_minutes INTEGER,
    idle_time_minutes INTEGER,
    max_speed_kph DECIMAL(6, 2),
    avg_speed_kph DECIMAL(6, 2),
    fuel_consumed_liters DECIMAL(8, 2),
    fuel_efficiency_l_per_100km DECIMAL(6, 2),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    route_polyline TEXT,  -- Encoded polyline
    usage_type VARCHAR(20) CHECK (usage_type IN ('business', 'personal', 'mixed')),
    business_purpose TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trips_vehicle_start ON trips(vehicle_id, started_at DESC);
CREATE INDEX idx_trips_driver_start ON trips(driver_id, started_at DESC) WHERE driver_id IS NOT NULL;
CREATE INDEX idx_trips_tenant_start ON trips(tenant_id, started_at DESC);
CREATE INDEX idx_trips_usage_type ON trips(tenant_id, usage_type, started_at DESC);

COMMENT ON TABLE trips IS 'Complete trip records from ignition on to off';

-- ============================================================================
-- ROUTES - Planned or Optimized Routes
-- ============================================================================
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    route_name VARCHAR(255),
    description TEXT,
    stops JSONB,  -- Array of {address, lat, lng, order, duration_minutes, notes}
    polyline TEXT,  -- Encoded polyline
    total_distance_km DECIMAL(8, 2),
    estimated_duration_minutes INTEGER,
    optimization_criteria VARCHAR(50) CHECK (optimization_criteria IN ('fastest', 'shortest', 'fuel_efficient', 'avoid_tolls')),
    assigned_vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    scheduled_date DATE,
    status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    actual_trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routes_tenant_date_status ON routes(tenant_id, scheduled_date, status);
CREATE INDEX idx_routes_assigned_vehicle_date ON routes(assigned_vehicle_id, scheduled_date) WHERE assigned_vehicle_id IS NOT NULL;
CREATE INDEX idx_routes_stops ON routes USING GIN (stops);

COMMENT ON TABLE routes IS 'Planned or optimized routes for dispatch';

-- ============================================================================
-- TRAFFIC CAMERAS - Florida 511 Integration
-- ============================================================================
CREATE TABLE IF NOT EXISTS traffic_cameras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fdot_id VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    road VARCHAR(100),
    direction VARCHAR(10),
    county VARCHAR(50),
    feed_url TEXT,
    thumbnail_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    metadata JSONB,
    last_updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_traffic_cameras_county ON traffic_cameras(county);
CREATE INDEX idx_traffic_cameras_geospatial ON traffic_cameras USING GIST (ll_to_earth(latitude, longitude));
CREATE INDEX idx_traffic_cameras_status ON traffic_cameras(status) WHERE status = 'active';

COMMENT ON TABLE traffic_cameras IS 'Florida DOT traffic camera locations and live feeds';

-- ============================================================================
-- WEATHER STATIONS - Weather Conditions
-- ============================================================================
CREATE TABLE IF NOT EXISTS weather_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id VARCHAR(50) UNIQUE,
    name VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    temperature_f DECIMAL(5, 2),
    conditions VARCHAR(100),
    wind_speed_mph DECIMAL(5, 2),
    visibility_miles DECIMAL(5, 2),
    road_conditions VARCHAR(50) CHECK (road_conditions IN ('dry', 'wet', 'icy', 'snow', 'unknown')),
    last_updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weather_stations_geospatial ON weather_stations USING GIST (ll_to_earth(latitude, longitude));

COMMENT ON TABLE weather_stations IS 'Weather conditions affecting fleet routes';

-- ============================================================================
-- EV CHARGING STATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS ev_charging_stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    operator VARCHAR(100),
    network VARCHAR(100),
    num_ports INTEGER,
    charging_levels TEXT[],  -- 'level1', 'level2', 'dcfast'
    max_power_kw DECIMAL(6, 2),
    pricing TEXT,
    access_type VARCHAR(20) CHECK (access_type IN ('public', 'private', 'restricted')),
    available_24x7 BOOLEAN DEFAULT FALSE,
    amenities JSONB,
    last_updated TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ev_charging_geospatial ON ev_charging_stations USING GIST (ll_to_earth(latitude, longitude));
CREATE INDEX idx_ev_charging_operator ON ev_charging_stations(operator);
CREATE INDEX idx_ev_charging_levels ON ev_charging_stations USING GIN (charging_levels);

COMMENT ON TABLE ev_charging_stations IS 'EV charging station locations and availability';

-- ============================================================================
-- TOLL PLAZAS
-- ============================================================================
CREATE TABLE IF NOT EXISTS toll_plazas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plaza_id VARCHAR(50) UNIQUE,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    road VARCHAR(100),
    direction VARCHAR(10),
    operator VARCHAR(100),
    supports_sunpass BOOLEAN DEFAULT FALSE,
    supports_ezpass BOOLEAN DEFAULT FALSE,
    num_lanes INTEGER,
    toll_rates JSONB,  -- {class1: 2.50, class2: 5.00}
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_toll_plazas_geospatial ON toll_plazas USING GIST (ll_to_earth(latitude, longitude));

COMMENT ON TABLE toll_plazas IS 'Toll plaza locations and operators';

-- ============================================================================
-- TRIP USAGE CLASSIFICATIONS (IRS Personal vs Business)
-- ============================================================================
CREATE TABLE IF NOT EXISTS trip_usage_classifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    usage_type VARCHAR(20) NOT NULL CHECK (usage_type IN ('business', 'personal', 'mixed')),
    business_purpose TEXT,
    business_percentage DECIMAL(5, 2),
    personal_notes TEXT,
    miles_total DECIMAL(8, 2) NOT NULL,
    miles_business DECIMAL(8, 2) GENERATED ALWAYS AS (
        CASE
            WHEN usage_type = 'business' THEN miles_total
            WHEN usage_type = 'personal' THEN 0
            WHEN usage_type = 'mixed' THEN ROUND(miles_total * (business_percentage / 100), 2)
            ELSE 0
        END
    ) STORED,
    miles_personal DECIMAL(8, 2) GENERATED ALWAYS AS (
        miles_total - CASE
            WHEN usage_type = 'business' THEN miles_total
            WHEN usage_type = 'personal' THEN 0
            WHEN usage_type = 'mixed' THEN ROUND(miles_total * (business_percentage / 100), 2)
            ELSE 0
        END
    ) STORED,
    trip_date DATE NOT NULL,
    start_location TEXT,
    end_location TEXT,
    start_odometer INTEGER,
    end_odometer INTEGER,
    approved_by_user_id UUID,
    approved_at TIMESTAMPTZ,
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
    rejection_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID
);

CREATE INDEX idx_trip_usage_vehicle_date ON trip_usage_classifications(vehicle_id, trip_date DESC);
CREATE INDEX idx_trip_usage_driver_date ON trip_usage_classifications(driver_id, trip_date DESC);
CREATE INDEX idx_trip_usage_tenant_date ON trip_usage_classifications(tenant_id, trip_date DESC);
CREATE INDEX idx_trip_usage_approval_status ON trip_usage_classifications(approval_status, trip_date DESC);

COMMENT ON TABLE trip_usage_classifications IS 'IRS-compliant personal vs business trip usage tracking';

-- ============================================================================
-- PERSONAL USE POLICIES (IRS Compliance)
-- ============================================================================
CREATE TABLE IF NOT EXISTS personal_use_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    allow_personal_use BOOLEAN DEFAULT FALSE,
    require_approval BOOLEAN DEFAULT TRUE,
    max_personal_miles_per_month INTEGER,
    max_personal_miles_per_year INTEGER,
    charge_personal_use BOOLEAN DEFAULT FALSE,
    personal_use_rate_per_mile DECIMAL(6, 3),
    reporting_required BOOLEAN DEFAULT TRUE,
    approval_workflow VARCHAR(50) CHECK (approval_workflow IN ('manager', 'fleet_admin', 'both', 'none')),
    notification_settings JSONB,  -- {notify_at_percentage: 80, notify_manager_on_exceed: true}
    auto_approve_under_miles INTEGER,
    auto_approve_days_advance INTEGER,
    effective_date DATE NOT NULL,
    expiration_date DATE,
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_personal_use_policies_tenant ON personal_use_policies(tenant_id, effective_date DESC);

COMMENT ON TABLE personal_use_policies IS 'Fleet-wide personal use policies for IRS compliance';

-- ============================================================================
-- PERSONAL USE CHARGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS personal_use_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    trip_usage_id UUID REFERENCES trip_usage_classifications(id) ON DELETE SET NULL,
    charge_period VARCHAR(7) NOT NULL,  -- YYYY-MM
    charge_period_start DATE NOT NULL,
    charge_period_end DATE NOT NULL,
    miles_charged DECIMAL(8, 2) NOT NULL,
    rate_per_mile DECIMAL(6, 3) NOT NULL,
    total_charge DECIMAL(12, 2) NOT NULL,
    charge_status VARCHAR(20) DEFAULT 'pending' CHECK (charge_status IN ('pending', 'invoiced', 'billed', 'paid', 'waived', 'disputed')),
    payment_method VARCHAR(50),
    paid_at TIMESTAMPTZ,
    waived_by_user_id UUID,
    waived_at TIMESTAMPTZ,
    waived_reason TEXT,
    invoice_number VARCHAR(100),
    invoice_date DATE,
    due_date DATE,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_user_id UUID
);

CREATE INDEX idx_personal_use_charges_driver_period ON personal_use_charges(driver_id, charge_period DESC);
CREATE INDEX idx_personal_use_charges_tenant_period ON personal_use_charges(tenant_id, charge_period DESC);
CREATE INDEX idx_personal_use_charges_status ON personal_use_charges(charge_status, due_date);

COMMENT ON TABLE personal_use_charges IS 'Personal use mileage charges for IRS compliance';

-- Add update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_geofences_updated_at BEFORE UPDATE ON geofences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trip_usage_updated_at BEFORE UPDATE ON trip_usage_classifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personal_use_policies_updated_at BEFORE UPDATE ON personal_use_policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personal_use_charges_updated_at BEFORE UPDATE ON personal_use_charges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
