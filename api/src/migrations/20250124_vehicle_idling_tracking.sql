-- ============================================================================
-- Vehicle Idling Tracking Migration
-- ============================================================================
-- Purpose: Track vehicle idling time to reduce fuel costs and emissions
-- Features:
--   - Real-time idling detection
--   - Historical idling logs
--   - Cost calculations (fuel waste)
--   - Emission estimates (CO2)
--   - Driver behavior analytics
--   - Alert thresholds
-- ============================================================================

-- Idling Events Table
-- Stores individual idling events with duration and location
CREATE TABLE IF NOT EXISTS vehicle_idling_events (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    -- Event timing
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_seconds INTEGER, -- Calculated when event ends

    -- Location data
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_name VARCHAR(255), -- Reverse geocoded address
    geofence_id INTEGER REFERENCES geofences(id) ON DELETE SET NULL,

    -- Vehicle state during idling
    engine_rpm INTEGER, -- RPM during idle (typically 600-900)
    speed_mph DECIMAL(5, 2) DEFAULT 0, -- Should be 0 or very low
    fuel_level_percent DECIMAL(5, 2),
    engine_temp_celsius DECIMAL(5, 2),
    battery_voltage DECIMAL(5, 2),

    -- Cost and environmental impact
    estimated_fuel_wasted_gallons DECIMAL(8, 4), -- ~0.25 gal/hour idle
    estimated_fuel_cost_usd DECIMAL(10, 2), -- Based on local fuel price
    estimated_co2_kg DECIMAL(8, 4), -- ~2.3 kg CO2 per gallon

    -- Event classification
    idle_type VARCHAR(50) CHECK (idle_type IN (
        'traffic', 'loading_unloading', 'warmup',
        'cooldown', 'break', 'unauthorized', 'unknown'
    )),
    is_authorized BOOLEAN DEFAULT false, -- If driver reported reason
    driver_notes TEXT,

    -- Alert status
    alert_triggered BOOLEAN DEFAULT false,
    alert_sent_at TIMESTAMP,

    -- Metadata
    data_source VARCHAR(50) CHECK (data_source IN (
        'gps_telematics', 'obd2', 'samsara', 'manual'
    )),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_idling_vehicle_time ON vehicle_idling_events(vehicle_id, start_time DESC);
CREATE INDEX idx_idling_driver_time ON vehicle_idling_events(driver_id, start_time DESC);
CREATE INDEX idx_idling_duration ON vehicle_idling_events(duration_seconds DESC) WHERE duration_seconds IS NOT NULL;
CREATE INDEX idx_idling_location ON vehicle_idling_events(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_idling_date ON vehicle_idling_events(DATE(start_time));
CREATE INDEX idx_idling_alerts ON vehicle_idling_events(alert_triggered, alert_sent_at) WHERE alert_triggered = true;

-- ============================================================================
-- Idling Thresholds Configuration Table
-- Allows customization per vehicle type or specific vehicle
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_idling_thresholds (
    id SERIAL PRIMARY KEY,

    -- Applies to specific vehicle or vehicle type
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(50), -- 'sedan', 'truck', 'van', etc.

    -- Threshold settings (seconds)
    warning_threshold_seconds INTEGER DEFAULT 300, -- 5 minutes
    alert_threshold_seconds INTEGER DEFAULT 600, -- 10 minutes
    critical_threshold_seconds INTEGER DEFAULT 1800, -- 30 minutes

    -- Cost settings
    fuel_consumption_rate_gph DECIMAL(5, 3) DEFAULT 0.25, -- Gallons per hour idle
    avg_fuel_price_per_gallon DECIMAL(6, 3) DEFAULT 3.50,
    co2_kg_per_gallon DECIMAL(5, 3) DEFAULT 8.89, -- EPA standard

    -- Notification settings
    send_driver_alert BOOLEAN DEFAULT true,
    send_manager_alert BOOLEAN DEFAULT true,
    send_sms_alert BOOLEAN DEFAULT false,

    -- Exception rules
    allow_warmup_period_minutes INTEGER DEFAULT 5,
    allow_loading_unloading BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Ensure only one threshold per vehicle or vehicle type
    CONSTRAINT unique_threshold UNIQUE NULLS NOT DISTINCT (vehicle_id, vehicle_type)
);

-- Insert default thresholds for common vehicle types
INSERT INTO vehicle_idling_thresholds (vehicle_type, warning_threshold_seconds, alert_threshold_seconds, fuel_consumption_rate_gph) VALUES
    ('sedan', 300, 600, 0.16),
    ('truck', 300, 600, 0.30),
    ('van', 300, 600, 0.22),
    ('suv', 300, 600, 0.20),
    ('electric', 300, 600, 0.00), -- No fuel waste but still track idling
    ('hybrid', 300, 600, 0.10)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Daily Idling Summary Table
-- Pre-aggregated data for faster reporting
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_idling_daily_summary (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    summary_date DATE NOT NULL,

    -- Aggregate metrics
    total_idle_events INTEGER DEFAULT 0,
    total_idle_seconds INTEGER DEFAULT 0,
    total_idle_minutes DECIMAL(10, 2) GENERATED ALWAYS AS (total_idle_seconds / 60.0) STORED,
    total_idle_hours DECIMAL(10, 2) GENERATED ALWAYS AS (total_idle_seconds / 3600.0) STORED,

    -- Longest single idle event
    max_idle_duration_seconds INTEGER,
    max_idle_location VARCHAR(255),

    -- Cost and environmental
    total_fuel_wasted_gallons DECIMAL(10, 4),
    total_fuel_cost_usd DECIMAL(12, 2),
    total_co2_kg DECIMAL(10, 4),

    -- Event breakdown
    traffic_idle_seconds INTEGER DEFAULT 0,
    loading_idle_seconds INTEGER DEFAULT 0,
    unauthorized_idle_seconds INTEGER DEFAULT 0,

    -- Alert counts
    warnings_triggered INTEGER DEFAULT 0,
    alerts_triggered INTEGER DEFAULT 0,
    critical_alerts_triggered INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(vehicle_id, driver_id, summary_date)
);

CREATE INDEX idx_idling_summary_vehicle_date ON vehicle_idling_daily_summary(vehicle_id, summary_date DESC);
CREATE INDEX idx_idling_summary_driver_date ON vehicle_idling_daily_summary(driver_id, summary_date DESC);
CREATE INDEX idx_idling_summary_date ON vehicle_idling_daily_summary(summary_date DESC);

-- ============================================================================
-- Idling Alerts Log
-- Track all alerts sent for idling events
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_idling_alerts (
    id SERIAL PRIMARY KEY,
    idling_event_id INTEGER NOT NULL REFERENCES vehicle_idling_events(id) ON DELETE CASCADE,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

    alert_level VARCHAR(20) CHECK (alert_level IN ('warning', 'alert', 'critical')),
    alert_type VARCHAR(50) CHECK (alert_type IN ('duration', 'cost', 'location', 'unauthorized')),

    message TEXT NOT NULL,

    -- Notification channels
    sent_via_email BOOLEAN DEFAULT false,
    sent_via_sms BOOLEAN DEFAULT false,
    sent_via_push BOOLEAN DEFAULT false,
    sent_via_dashboard BOOLEAN DEFAULT true,

    -- Recipients
    recipient_user_ids INTEGER[],
    recipient_emails TEXT[],

    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_idling_alerts_event ON vehicle_idling_alerts(idling_event_id);
CREATE INDEX idx_idling_alerts_vehicle ON vehicle_idling_alerts(vehicle_id, created_at DESC);
CREATE INDEX idx_idling_alerts_unack ON vehicle_idling_alerts(acknowledged) WHERE acknowledged = false;

-- ============================================================================
-- Views for Reporting
-- ============================================================================

-- Current Active Idling Events
CREATE OR REPLACE VIEW active_idling_events AS
SELECT
    e.id,
    e.vehicle_id,
    v.name AS vehicle_name,
    v.vin,
    e.driver_id,
    u.name AS driver_name,
    e.start_time,
    EXTRACT(EPOCH FROM (NOW() - e.start_time))::INTEGER AS current_duration_seconds,
    ROUND((EXTRACT(EPOCH FROM (NOW() - e.start_time)) / 60)::NUMERIC, 2) AS current_duration_minutes,
    e.latitude,
    e.longitude,
    e.location_name,
    e.engine_rpm,
    e.speed_mph,
    t.warning_threshold_seconds,
    t.alert_threshold_seconds,
    CASE
        WHEN EXTRACT(EPOCH FROM (NOW() - e.start_time)) > t.critical_threshold_seconds THEN 'critical'
        WHEN EXTRACT(EPOCH FROM (NOW() - e.start_time)) > t.alert_threshold_seconds THEN 'alert'
        WHEN EXTRACT(EPOCH FROM (NOW() - e.start_time)) > t.warning_threshold_seconds THEN 'warning'
        ELSE 'normal'
    END AS severity_level
FROM vehicle_idling_events e
LEFT JOIN vehicles v ON e.vehicle_id = v.id
LEFT JOIN users u ON e.driver_id = u.id
LEFT JOIN vehicle_idling_thresholds t ON (e.vehicle_id = t.vehicle_id OR v.type = t.vehicle_type)
WHERE e.end_time IS NULL
ORDER BY e.start_time ASC;

-- Top Idling Offenders (Last 30 Days)
CREATE OR REPLACE VIEW top_idling_vehicles_30d AS
SELECT
    v.id AS vehicle_id,
    v.name AS vehicle_name,
    v.vin,
    COUNT(e.id) AS total_idle_events,
    SUM(e.duration_seconds) AS total_idle_seconds,
    ROUND((SUM(e.duration_seconds) / 3600.0)::NUMERIC, 2) AS total_idle_hours,
    ROUND(SUM(e.estimated_fuel_wasted_gallons)::NUMERIC, 2) AS total_fuel_wasted_gallons,
    ROUND(SUM(e.estimated_fuel_cost_usd)::NUMERIC, 2) AS total_fuel_cost_usd,
    ROUND(SUM(e.estimated_co2_kg)::NUMERIC, 2) AS total_co2_kg,
    ROUND(AVG(e.duration_seconds)::NUMERIC, 0) AS avg_idle_duration_seconds
FROM vehicles v
INNER JOIN vehicle_idling_events e ON v.id = e.vehicle_id
WHERE e.start_time >= CURRENT_DATE - INTERVAL '30 days'
    AND e.duration_seconds IS NOT NULL
GROUP BY v.id, v.name, v.vin
ORDER BY total_idle_seconds DESC;

-- Driver Idling Performance (Last 30 Days)
CREATE OR REPLACE VIEW driver_idling_performance_30d AS
SELECT
    u.id AS driver_id,
    u.name AS driver_name,
    u.email AS driver_email,
    COUNT(e.id) AS total_idle_events,
    SUM(e.duration_seconds) AS total_idle_seconds,
    ROUND((SUM(e.duration_seconds) / 3600.0)::NUMERIC, 2) AS total_idle_hours,
    ROUND(AVG(e.duration_seconds)::NUMERIC, 0) AS avg_idle_duration_seconds,
    ROUND(SUM(e.estimated_fuel_cost_usd)::NUMERIC, 2) AS total_fuel_cost_usd,
    COUNT(CASE WHEN e.alert_triggered THEN 1 END) AS alert_count
FROM users u
INNER JOIN vehicle_idling_events e ON u.id = e.driver_id
WHERE e.start_time >= CURRENT_DATE - INTERVAL '30 days'
    AND e.duration_seconds IS NOT NULL
GROUP BY u.id, u.name, u.email
ORDER BY total_idle_seconds DESC;

-- Fleet-Wide Idling Costs (Monthly)
CREATE OR REPLACE VIEW fleet_idling_costs_monthly AS
SELECT
    DATE_TRUNC('month', e.start_time)::DATE AS month,
    COUNT(e.id) AS total_idle_events,
    SUM(e.duration_seconds) AS total_idle_seconds,
    ROUND((SUM(e.duration_seconds) / 3600.0)::NUMERIC, 2) AS total_idle_hours,
    ROUND(SUM(e.estimated_fuel_wasted_gallons)::NUMERIC, 2) AS total_fuel_wasted_gallons,
    ROUND(SUM(e.estimated_fuel_cost_usd)::NUMERIC, 2) AS total_fuel_cost_usd,
    ROUND(SUM(e.estimated_co2_kg)::NUMERIC, 2) AS total_co2_kg,
    COUNT(DISTINCT e.vehicle_id) AS vehicles_with_idling,
    COUNT(DISTINCT e.driver_id) AS drivers_with_idling
FROM vehicle_idling_events e
WHERE e.duration_seconds IS NOT NULL
GROUP BY DATE_TRUNC('month', e.start_time)
ORDER BY month DESC;

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to calculate idling costs
CREATE OR REPLACE FUNCTION calculate_idling_costs(
    p_duration_seconds INTEGER,
    p_vehicle_id INTEGER
)
RETURNS TABLE (
    fuel_wasted_gallons DECIMAL(8,4),
    fuel_cost_usd DECIMAL(10,2),
    co2_kg DECIMAL(8,4)
) AS $$
DECLARE
    v_fuel_rate DECIMAL(5,3);
    v_fuel_price DECIMAL(6,3);
    v_co2_rate DECIMAL(5,3);
    v_hours DECIMAL(10,6);
BEGIN
    -- Get threshold settings for vehicle
    SELECT
        t.fuel_consumption_rate_gph,
        t.avg_fuel_price_per_gallon,
        t.co2_kg_per_gallon
    INTO v_fuel_rate, v_fuel_price, v_co2_rate
    FROM vehicle_idling_thresholds t
    LEFT JOIN vehicles v ON v.id = p_vehicle_id
    WHERE t.vehicle_id = p_vehicle_id OR t.vehicle_type = v.type
    LIMIT 1;

    -- Use defaults if not found
    v_fuel_rate := COALESCE(v_fuel_rate, 0.25);
    v_fuel_price := COALESCE(v_fuel_price, 3.50);
    v_co2_rate := COALESCE(v_co2_rate, 8.89);

    -- Calculate based on duration
    v_hours := p_duration_seconds / 3600.0;

    RETURN QUERY SELECT
        (v_hours * v_fuel_rate)::DECIMAL(8,4),
        (v_hours * v_fuel_rate * v_fuel_price)::DECIMAL(10,2),
        (v_hours * v_fuel_rate * v_co2_rate)::DECIMAL(8,4);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate costs when idling event ends
CREATE OR REPLACE FUNCTION auto_calculate_idling_costs()
RETURNS TRIGGER AS $$
DECLARE
    v_costs RECORD;
BEGIN
    IF NEW.end_time IS NOT NULL AND NEW.duration_seconds IS NOT NULL THEN
        SELECT * INTO v_costs
        FROM calculate_idling_costs(NEW.duration_seconds, NEW.vehicle_id);

        NEW.estimated_fuel_wasted_gallons := v_costs.fuel_wasted_gallons;
        NEW.estimated_fuel_cost_usd := v_costs.fuel_cost_usd;
        NEW.estimated_co2_kg := v_costs.co2_kg;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_idling_costs
    BEFORE INSERT OR UPDATE ON vehicle_idling_events
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_idling_costs();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_idling_events_timestamp
    BEFORE UPDATE ON vehicle_idling_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_idling_thresholds_timestamp
    BEFORE UPDATE ON vehicle_idling_thresholds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_idling_summary_timestamp
    BEFORE UPDATE ON vehicle_idling_daily_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Permissions
-- ============================================================================

-- Grant permissions (adjust based on your role structure)
GRANT SELECT, INSERT, UPDATE ON vehicle_idling_events TO fleet_user;
GRANT SELECT, INSERT, UPDATE ON vehicle_idling_thresholds TO fleet_user;
GRANT SELECT ON vehicle_idling_daily_summary TO fleet_user;
GRANT SELECT ON vehicle_idling_alerts TO fleet_user;
GRANT SELECT ON active_idling_events TO fleet_user;
GRANT SELECT ON top_idling_vehicles_30d TO fleet_user;
GRANT SELECT ON driver_idling_performance_30d TO fleet_user;
GRANT SELECT ON fleet_idling_costs_monthly TO fleet_user;

-- ============================================================================
-- End of Migration
-- ============================================================================
