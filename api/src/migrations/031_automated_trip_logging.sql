-- Migration: Automated Trip Logging with OBD2 Integration
-- Description: Comprehensive trip tracking with OBD2 data, GPS breadcrumbs, and driver scoring
-- Business Value: Automated mileage tracking, driver safety scoring, fuel efficiency monitoring

-- =====================================================
-- Trips Table (Enhanced with OBD2 and GPS)
-- =====================================================

CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id INTEGER NOT NULL,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Trip Status
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),

    -- Trip Times
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_seconds INTEGER,

    -- Location Data
    start_location JSONB, -- { latitude, longitude, address }
    end_location JSONB,

    -- OBD2 Odometer Readings
    start_odometer_miles DECIMAL(10, 2),
    end_odometer_miles DECIMAL(10, 2),
    distance_miles DECIMAL(10, 2),

    -- Trip Statistics
    avg_speed_mph DECIMAL(5, 2),
    max_speed_mph DECIMAL(5, 2),
    idle_time_seconds INTEGER DEFAULT 0,

    -- Fuel Data (from OBD2)
    fuel_consumed_gallons DECIMAL(8, 3),
    fuel_efficiency_mpg DECIMAL(6, 2),
    fuel_cost DECIMAL(8, 2),

    -- Driver Score (0-100)
    driver_score INTEGER CHECK (driver_score >= 0 AND driver_score <= 100),
    harsh_acceleration_count INTEGER DEFAULT 0,
    harsh_braking_count INTEGER DEFAULT 0,
    harsh_cornering_count INTEGER DEFAULT 0,
    speeding_count INTEGER DEFAULT 0,

    -- Classification
    usage_type VARCHAR(20) CHECK (usage_type IN ('business', 'personal', 'mixed')),
    business_purpose TEXT,
    classification_status VARCHAR(20) DEFAULT 'unclassified' CHECK (classification_status IN ('unclassified', 'pending', 'classified')),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes for common queries
    CONSTRAINT trips_end_after_start CHECK (end_time IS NULL OR end_time >= start_time),
    CONSTRAINT trips_distance_valid CHECK (distance_miles IS NULL OR distance_miles >= 0)
);

CREATE INDEX idx_trips_tenant ON trips(tenant_id);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_start_time ON trips(start_time);
CREATE INDEX idx_trips_classification ON trips(classification_status);
CREATE INDEX idx_trips_usage_type ON trips(usage_type);

-- =====================================================
-- Trip GPS Breadcrumbs (Location History)
-- =====================================================

CREATE TABLE IF NOT EXISTS trip_gps_breadcrumbs (
    id BIGSERIAL PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,

    -- GPS Data
    timestamp TIMESTAMP NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(11, 7) NOT NULL,
    accuracy_meters DECIMAL(6, 2),
    altitude_meters DECIMAL(8, 2),

    -- Motion Data
    speed_mph DECIMAL(5, 2),
    heading_degrees DECIMAL(5, 2),

    -- OBD2 Data at this point
    engine_rpm INTEGER,
    fuel_level_percent DECIMAL(5, 2),
    coolant_temp_f INTEGER,
    throttle_position_percent DECIMAL(5, 2),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trip_breadcrumbs_trip ON trip_gps_breadcrumbs(trip_id);
CREATE INDEX idx_trip_breadcrumbs_timestamp ON trip_gps_breadcrumbs(trip_id, timestamp);
CREATE INDEX idx_trip_breadcrumbs_location ON trip_gps_breadcrumbs USING GIST (
    ll_to_earth(latitude::float8, longitude::float8)
);

-- =====================================================
-- Trip OBD2 Metrics (10-second intervals)
-- =====================================================

CREATE TABLE IF NOT EXISTS trip_obd2_metrics (
    id BIGSERIAL PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,

    timestamp TIMESTAMP NOT NULL,

    -- Engine Data
    engine_rpm INTEGER,
    engine_load_percent DECIMAL(5, 2),
    engine_coolant_temp_f INTEGER,
    oil_temp_f INTEGER,

    -- Fuel Data
    fuel_level_percent DECIMAL(5, 2),
    fuel_flow_rate_gph DECIMAL(6, 3), -- Gallons per hour
    fuel_pressure_psi DECIMAL(6, 2),

    -- Performance Data
    speed_mph DECIMAL(5, 2),
    throttle_position_percent DECIMAL(5, 2),
    accelerator_pedal_position_percent DECIMAL(5, 2),

    -- Transmission
    transmission_gear INTEGER,
    transmission_temp_f INTEGER,

    -- Battery & Electrical
    battery_voltage DECIMAL(4, 2),
    alternator_voltage DECIMAL(4, 2),

    -- Air & Intake
    intake_air_temp_f INTEGER,
    mass_air_flow_gps DECIMAL(6, 2), -- Grams per second
    manifold_pressure_psi DECIMAL(6, 2),

    -- Odometer
    odometer_miles DECIMAL(10, 2),

    -- Diagnostic
    dtc_count INTEGER DEFAULT 0, -- Diagnostic Trouble Code count
    mil_status BOOLEAN, -- Malfunction Indicator Lamp (Check Engine Light)

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trip_obd2_trip ON trip_obd2_metrics(trip_id);
CREATE INDEX idx_trip_obd2_timestamp ON trip_obd2_metrics(trip_id, timestamp);

-- =====================================================
-- Trip Events (Harsh driving, speeding, etc.)
-- =====================================================

CREATE TABLE IF NOT EXISTS trip_events (
    id BIGSERIAL PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,

    -- Event Type
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'harsh_acceleration',
        'harsh_braking',
        'harsh_cornering',
        'speeding',
        'rapid_lane_change',
        'tailgating',
        'idling_excessive',
        'engine_warning',
        'low_fuel',
        'geofence_entry',
        'geofence_exit'
    )),

    -- Event Severity
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

    -- Location
    timestamp TIMESTAMP NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(11, 7),
    address TEXT,

    -- Event Details
    speed_mph DECIMAL(5, 2),
    g_force DECIMAL(5, 3), -- For acceleration/braking events
    speed_limit_mph INTEGER, -- For speeding events

    -- Additional Data
    description TEXT,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trip_events_trip ON trip_events(trip_id);
CREATE INDEX idx_trip_events_type ON trip_events(event_type);
CREATE INDEX idx_trip_events_severity ON trip_events(severity);
CREATE INDEX idx_trip_events_timestamp ON trip_events(timestamp);

-- =====================================================
-- Trip Segments (For multi-stop trips)
-- =====================================================

CREATE TABLE IF NOT EXISTS trip_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,

    segment_number INTEGER NOT NULL,

    -- Segment Times
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_seconds INTEGER,

    -- Segment Location
    start_location JSONB,
    end_location JSONB,
    distance_miles DECIMAL(10, 2),

    -- Segment Type
    segment_type VARCHAR(20) CHECK (segment_type IN ('driving', 'stopped', 'idling')),

    -- Segment Purpose (for business trip breakdown)
    purpose TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT trip_segments_unique UNIQUE (trip_id, segment_number)
);

CREATE INDEX idx_trip_segments_trip ON trip_segments(trip_id);
CREATE INDEX idx_trip_segments_start_time ON trip_segments(start_time);

-- =====================================================
-- Driver Scores (Historical tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS driver_scores_history (
    id BIGSERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Score Period
    date DATE NOT NULL,

    -- Overall Score (0-100)
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),

    -- Component Scores
    smooth_driving_score INTEGER CHECK (smooth_driving_score >= 0 AND smooth_driving_score <= 100),
    speed_compliance_score INTEGER CHECK (speed_compliance_score >= 0 AND speed_compliance_score <= 100),
    fuel_efficiency_score INTEGER CHECK (fuel_efficiency_score >= 0 AND fuel_efficiency_score <= 100),
    safety_score INTEGER CHECK (safety_score >= 0 AND safety_score <= 100),

    -- Event Counts
    trips_count INTEGER DEFAULT 0,
    miles_driven DECIMAL(10, 2),
    harsh_events_count INTEGER DEFAULT 0,
    speeding_events_count INTEGER DEFAULT 0,

    -- Rankings
    rank_in_fleet INTEGER,
    percentile INTEGER,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT driver_scores_unique UNIQUE (driver_id, date)
);

CREATE INDEX idx_driver_scores_driver ON driver_scores_history(driver_id);
CREATE INDEX idx_driver_scores_date ON driver_scores_history(date);
CREATE INDEX idx_driver_scores_overall ON driver_scores_history(overall_score);

-- =====================================================
-- Views for Reporting
-- =====================================================

-- Active trips (currently in progress)
CREATE OR REPLACE VIEW active_trips AS
SELECT
    t.id,
    t.tenant_id,
    t.vehicle_id,
    t.driver_id,
    v.name as vehicle_name,
    v.license_plate,
    u.name as driver_name,
    t.start_time,
    t.start_location,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.start_time)) / 60 as duration_minutes,
    (
        SELECT COUNT(*)
        FROM trip_events te
        WHERE te.trip_id = t.id AND te.severity IN ('high', 'critical')
    ) as critical_events_count,
    (
        SELECT jsonb_build_object(
            'latitude', latitude,
            'longitude', longitude,
            'speed_mph', speed_mph,
            'timestamp', timestamp
        )
        FROM trip_gps_breadcrumbs gb
        WHERE gb.trip_id = t.id
        ORDER BY gb.timestamp DESC
        LIMIT 1
    ) as current_location
FROM trips t
LEFT JOIN vehicles v ON t.vehicle_id = v.id
LEFT JOIN users u ON t.driver_id = u.id
WHERE t.status = 'in_progress';

-- Trip summary statistics
CREATE OR REPLACE VIEW trip_statistics_daily AS
SELECT
    tenant_id,
    driver_id,
    DATE(start_time) as trip_date,
    COUNT(*) as trips_count,
    SUM(distance_miles) as total_miles,
    AVG(driver_score) as avg_driver_score,
    SUM(fuel_consumed_gallons) as total_fuel_gallons,
    AVG(fuel_efficiency_mpg) as avg_fuel_efficiency,
    SUM(harsh_acceleration_count) as total_harsh_acceleration,
    SUM(harsh_braking_count) as total_harsh_braking,
    SUM(harsh_cornering_count) as total_harsh_cornering,
    SUM(speeding_count) as total_speeding,
    SUM(duration_seconds) / 3600.0 as total_hours
FROM trips
WHERE status = 'completed'
GROUP BY tenant_id, driver_id, DATE(start_time);

-- Unclassified trips requiring attention
CREATE OR REPLACE VIEW unclassified_trips AS
SELECT
    t.id,
    t.tenant_id,
    t.vehicle_id,
    t.driver_id,
    v.name as vehicle_name,
    u.name as driver_name,
    t.start_time,
    t.end_time,
    t.distance_miles,
    t.start_location,
    t.end_location,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.end_time)) / 3600 as hours_since_completion
FROM trips t
LEFT JOIN vehicles v ON t.vehicle_id = v.id
LEFT JOIN users u ON t.driver_id = u.id
WHERE t.status = 'completed'
  AND t.classification_status = 'unclassified'
  AND t.end_time IS NOT NULL
ORDER BY t.end_time DESC;

-- Driver safety ranking
CREATE OR REPLACE VIEW driver_safety_ranking AS
SELECT
    tenant_id,
    driver_id,
    u.name as driver_name,
    COUNT(*) as trips_count,
    SUM(distance_miles) as total_miles,
    AVG(driver_score) as avg_driver_score,
    SUM(harsh_acceleration_count + harsh_braking_count + harsh_cornering_count + speeding_count) as total_events,
    ROUND((SUM(harsh_acceleration_count + harsh_braking_count + harsh_cornering_count + speeding_count)::numeric /
           NULLIF(SUM(distance_miles), 0) * 100)::numeric, 2) as events_per_100_miles,
    AVG(fuel_efficiency_mpg) as avg_mpg,
    RANK() OVER (PARTITION BY tenant_id ORDER BY AVG(driver_score) DESC) as safety_rank
FROM trips t
LEFT JOIN users u ON t.driver_id = u.id
WHERE t.status = 'completed'
  AND t.end_time >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY tenant_id, driver_id, u.name
HAVING COUNT(*) >= 5; -- Minimum 5 trips for ranking

-- =====================================================
-- Functions
-- =====================================================

-- Function to calculate driver score
CREATE OR REPLACE FUNCTION calculate_driver_score(
    p_trip_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_harsh_events INTEGER;
    v_speeding_events INTEGER;
    v_distance DECIMAL(10, 2);
    v_score INTEGER;
BEGIN
    SELECT
        harsh_acceleration_count + harsh_braking_count + harsh_cornering_count,
        speeding_count,
        distance_miles
    INTO v_harsh_events, v_speeding_events, v_distance
    FROM trips
    WHERE id = p_trip_id;

    -- Start with perfect score
    v_score := 100;

    -- Deduct points for events (scaled by distance)
    IF v_distance > 0 THEN
        -- Deduct 5 points per harsh event per 10 miles
        v_score := v_score - (v_harsh_events * 5 * LEAST(10, v_distance) / 10)::INTEGER;

        -- Deduct 10 points per speeding event per 10 miles
        v_score := v_score - (v_speeding_events * 10 * LEAST(10, v_distance) / 10)::INTEGER;
    END IF;

    -- Ensure score is between 0 and 100
    v_score := GREATEST(0, LEAST(100, v_score));

    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Function to complete trip and calculate statistics
CREATE OR REPLACE FUNCTION complete_trip(
    p_trip_id UUID,
    p_end_time TIMESTAMP,
    p_end_location JSONB,
    p_end_odometer_miles DECIMAL
) RETURNS VOID AS $$
DECLARE
    v_start_time TIMESTAMP;
    v_start_odometer DECIMAL;
    v_distance DECIMAL;
    v_duration INTEGER;
    v_driver_score INTEGER;
BEGIN
    -- Get trip start data
    SELECT start_time, start_odometer_miles
    INTO v_start_time, v_start_odometer
    FROM trips
    WHERE id = p_trip_id;

    -- Calculate distance and duration
    v_distance := p_end_odometer_miles - v_start_odometer;
    v_duration := EXTRACT(EPOCH FROM (p_end_time - v_start_time))::INTEGER;

    -- Calculate driver score
    v_driver_score := calculate_driver_score(p_trip_id);

    -- Update trip
    UPDATE trips SET
        end_time = p_end_time,
        end_location = p_end_location,
        end_odometer_miles = p_end_odometer_miles,
        distance_miles = v_distance,
        duration_seconds = v_duration,
        driver_score = v_driver_score,
        status = 'completed',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_trip_id;

    -- Calculate avg/max speed from breadcrumbs
    UPDATE trips t SET
        avg_speed_mph = (SELECT AVG(speed_mph) FROM trip_gps_breadcrumbs WHERE trip_id = p_trip_id),
        max_speed_mph = (SELECT MAX(speed_mph) FROM trip_gps_breadcrumbs WHERE trip_id = p_trip_id)
    WHERE id = p_trip_id;

    -- Calculate fuel efficiency if fuel data available
    UPDATE trips t SET
        fuel_efficiency_mpg = CASE
            WHEN t.fuel_consumed_gallons > 0 THEN t.distance_miles / t.fuel_consumed_gallons
            ELSE NULL
        END
    WHERE id = p_trip_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trip_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trips_timestamp
BEFORE UPDATE ON trips
FOR EACH ROW EXECUTE FUNCTION update_trip_timestamp();

-- Auto-calculate event counts on trip
CREATE OR REPLACE FUNCTION update_trip_event_counts()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE trips SET
        harsh_acceleration_count = (
            SELECT COUNT(*) FROM trip_events
            WHERE trip_id = NEW.trip_id AND event_type = 'harsh_acceleration'
        ),
        harsh_braking_count = (
            SELECT COUNT(*) FROM trip_events
            WHERE trip_id = NEW.trip_id AND event_type = 'harsh_braking'
        ),
        harsh_cornering_count = (
            SELECT COUNT(*) FROM trip_events
            WHERE trip_id = NEW.trip_id AND event_type = 'harsh_cornering'
        ),
        speeding_count = (
            SELECT COUNT(*) FROM trip_events
            WHERE trip_id = NEW.trip_id AND event_type = 'speeding'
        )
    WHERE id = NEW.trip_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trip_event_counts_trigger
AFTER INSERT ON trip_events
FOR EACH ROW EXECUTE FUNCTION update_trip_event_counts();

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE trips IS 'Automated trip logging with OBD2 integration and GPS tracking';
COMMENT ON TABLE trip_gps_breadcrumbs IS 'GPS location history for trip route visualization';
COMMENT ON TABLE trip_obd2_metrics IS 'OBD2 vehicle data collected every 10 seconds during trip';
COMMENT ON TABLE trip_events IS 'Driving events (harsh acceleration, braking, speeding, etc.)';
COMMENT ON TABLE trip_segments IS 'Multi-stop trip segments for complex routes';
COMMENT ON TABLE driver_scores_history IS 'Historical driver safety scores for trend analysis';

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO fleetapp;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fleetapp;

-- =====================================================
-- Completion
-- =====================================================

SELECT 'Automated Trip Logging migration completed successfully!' as status;
