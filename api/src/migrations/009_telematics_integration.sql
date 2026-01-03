-- Migration: Telematics Integration (Samsara, Geotab, Verizon, Motive)
-- Created: 2025-11-10
-- Purpose: Support multiple fleet telematics providers with unified data model

-- ============================================================================
-- Telematics Provider Connections
-- ============================================================================

CREATE TABLE IF NOT EXISTS telematics_providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE, -- 'samsara', 'geotab', 'verizon', 'motive', 'smartcar'
  display_name VARCHAR(100) NOT NULL,
  api_endpoint VARCHAR(255),
  supports_webhooks BOOLEAN DEFAULT false,
  supports_video BOOLEAN DEFAULT false,
  supports_temperature BOOLEAN DEFAULT false,
  supports_hos BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert supported providers
INSERT INTO telematics_providers (name, display_name, supports_webhooks, supports_video, supports_temperature, supports_hos) VALUES
  ('samsara', 'Samsara', true, true, true, true),
  ('geotab', 'Geotab', true, false, true, true),
  ('verizon', 'Verizon Connect', false, true, true, true),
  ('motive', 'Motive (KeepTruckin)', false, true, false, true),
  ('smartcar', 'Smartcar', true, false, false, false)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Vehicle-Provider Connections
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_telematics_connections (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  provider_id INT NOT NULL REFERENCES telematics_providers(id),
  external_vehicle_id VARCHAR(255) NOT NULL, -- Provider's vehicle ID
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP,
  last_sync_at TIMESTAMP,
  sync_status VARCHAR(20) DEFAULT 'active', -- 'active', 'disconnected', 'error', 'paused'
  sync_error TEXT,
  metadata JSONB, -- Provider-specific data (VIN, make, model, etc.)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(vehicle_id, provider_id),
  UNIQUE(provider_id, external_vehicle_id)
);

CREATE INDEX idx_vehicle_telematics_vehicle ON vehicle_telematics_connections(vehicle_id);
CREATE INDEX idx_vehicle_telematics_provider ON vehicle_telematics_connections(provider_id);
CREATE INDEX idx_vehicle_telematics_status ON vehicle_telematics_connections(sync_status);

-- ============================================================================
-- Real-Time Vehicle Telemetry
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_telemetry (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  provider_id INT REFERENCES telematics_providers(id),
  timestamp TIMESTAMP NOT NULL,

  -- Location data
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  heading INT, -- 0-360 degrees
  speed_mph DECIMAL(6, 2),
  altitude_ft DECIMAL(8, 2),
  address TEXT,

  -- Vehicle stats
  odometer_miles DECIMAL(12, 2),
  fuel_percent DECIMAL(5, 2),
  fuel_gallons DECIMAL(8, 2),
  battery_percent DECIMAL(5, 2), -- EV battery
  battery_voltage_12v DECIMAL(5, 2), -- 12V system
  engine_rpm INT,
  engine_state VARCHAR(20), -- 'on', 'off', 'idle'
  engine_hours DECIMAL(10, 2),

  -- Temperature (reefer trucks)
  temperature_f DECIMAL(5, 2),
  temperature_probe_1 DECIMAL(5, 2),
  temperature_probe_2 DECIMAL(5, 2),
  temperature_probe_3 DECIMAL(5, 2),

  -- Tire pressure (PSI)
  tire_pressure_fl INT,
  tire_pressure_fr INT,
  tire_pressure_rl INT,
  tire_pressure_rr INT,

  -- Diagnostics
  oil_life_percent DECIMAL(5, 2),
  coolant_temp_f INT,
  is_charging BOOLEAN,
  charge_rate_kw DECIMAL(6, 2),
  estimated_range_miles INT,

  -- Metadata
  raw_data JSONB, -- Store full provider response
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_telemetry_vehicle_time ON vehicle_telemetry(vehicle_id, timestamp DESC);
CREATE INDEX idx_telemetry_timestamp ON vehicle_telemetry(timestamp DESC);
CREATE INDEX idx_telemetry_provider ON vehicle_telemetry(provider_id, timestamp DESC);

-- Hypertable for TimescaleDB (if using)
-- SELECT create_hypertable('vehicle_telemetry', 'timestamp', if_not_exists => TRUE);

-- ============================================================================
-- Driver Safety Events
-- ============================================================================

CREATE TABLE IF NOT EXISTS driver_safety_events (
  id SERIAL PRIMARY KEY,
  external_event_id VARCHAR(255) UNIQUE, -- Provider's event ID
  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id INT REFERENCES drivers(id) ON DELETE SET NULL,
  provider_id INT REFERENCES telematics_providers(id),

  -- Event details
  event_type VARCHAR(50) NOT NULL, -- 'harsh_braking', 'harsh_acceleration', 'harsh_turning', 'speeding', 'distracted_driving', 'following_too_close'
  severity VARCHAR(20), -- 'minor', 'moderate', 'severe', 'critical'

  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,

  -- Event metrics
  speed_mph INT,
  g_force DECIMAL(5, 2), -- G-force (acceleration in Gs)
  duration_seconds INT,

  -- Video evidence
  video_request_id VARCHAR(255),
  video_url TEXT,
  video_thumbnail_url TEXT,
  video_expires_at TIMESTAMP,

  -- Additional data
  timestamp TIMESTAMP NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_safety_events_vehicle ON driver_safety_events(vehicle_id, timestamp DESC);
CREATE INDEX idx_safety_events_driver ON driver_safety_events(driver_id, timestamp DESC);
CREATE INDEX idx_safety_events_type ON driver_safety_events(event_type);
CREATE INDEX idx_safety_events_severity ON driver_safety_events(severity);

-- ============================================================================
-- Hours of Service (HOS) Logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS driver_hos_logs (
  id SERIAL PRIMARY KEY,
  external_log_id VARCHAR(255) UNIQUE,
  driver_id INT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  provider_id INT REFERENCES telematics_providers(id),

  -- HOS details
  log_date DATE NOT NULL,
  duty_status VARCHAR(50) NOT NULL, -- 'off_duty', 'sleeper_berth', 'driving', 'on_duty_not_driving'
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INT,

  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  odometer_miles DECIMAL(12, 2),

  -- Violations
  has_violations BOOLEAN DEFAULT false,
  violations JSONB, -- Array of violation objects

  -- Metadata
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hos_driver_date ON driver_hos_logs(driver_id, log_date DESC);
CREATE INDEX idx_hos_violations ON driver_hos_logs(has_violations) WHERE has_violations = true;

-- ============================================================================
-- Vehicle Diagnostics & Maintenance
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_diagnostic_codes (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  provider_id INT REFERENCES telematics_providers(id),

  -- Diagnostic code
  dtc_code VARCHAR(10) NOT NULL, -- e.g., 'P0420', 'C0035'
  dtc_description TEXT,
  severity VARCHAR(20), -- 'info', 'warning', 'critical'

  -- Timestamps
  first_detected_at TIMESTAMP NOT NULL,
  last_detected_at TIMESTAMP NOT NULL,
  cleared_at TIMESTAMP,

  -- Additional info
  freeze_frame_data JSONB,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_diagnostic_codes_vehicle ON vehicle_diagnostic_codes(vehicle_id, last_detected_at DESC);
CREATE INDEX idx_diagnostic_codes_active ON vehicle_diagnostic_codes(vehicle_id) WHERE cleared_at IS NULL;

-- ============================================================================
-- Geofences
-- ============================================================================

CREATE TABLE IF NOT EXISTS geofences (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  geofence_type VARCHAR(50), -- 'circle', 'polygon', 'route'

  -- Circle geofence
  center_latitude DECIMAL(10, 8),
  center_longitude DECIMAL(11, 8),
  radius_meters INT,

  -- Polygon geofence
  polygon_coordinates JSONB, -- Array of [lat, lng] pairs

  -- Alerts
  alert_on_entry BOOLEAN DEFAULT true,
  alert_on_exit BOOLEAN DEFAULT true,
  alert_on_dwell BOOLEAN DEFAULT false,
  dwell_threshold_minutes INT,

  -- Metadata
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_geofences_type ON geofences(geofence_type);

-- ============================================================================
-- Geofence Events
-- ============================================================================

CREATE TABLE IF NOT EXISTS geofence_events (
  id SERIAL PRIMARY KEY,
  vehicle_id INT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  geofence_id INT NOT NULL REFERENCES geofences(id) ON DELETE CASCADE,
  driver_id INT REFERENCES drivers(id) ON DELETE SET NULL,
  provider_id INT REFERENCES telematics_providers(id),

  -- Event details
  event_type VARCHAR(20) NOT NULL, -- 'entry', 'exit', 'dwell'

  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Timestamps
  timestamp TIMESTAMP NOT NULL,
  dwell_duration_minutes INT,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_geofence_events_vehicle ON geofence_events(vehicle_id, timestamp DESC);
CREATE INDEX idx_geofence_events_geofence ON geofence_events(geofence_id, timestamp DESC);

-- ============================================================================
-- Driver Behavior Scores
-- ============================================================================

CREATE TABLE IF NOT EXISTS driver_behavior_scores (
  id SERIAL PRIMARY KEY,
  driver_id INT NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  provider_id INT REFERENCES telematics_providers(id),

  -- Score period
  score_date DATE NOT NULL,
  score_type VARCHAR(20) DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'

  -- Overall score
  overall_score INT, -- 0-100

  -- Component scores
  harsh_braking_score INT,
  harsh_acceleration_score INT,
  harsh_turning_score INT,
  speeding_score INT,
  distracted_driving_score INT,
  following_distance_score INT,

  -- Event counts
  harsh_braking_count INT DEFAULT 0,
  harsh_acceleration_count INT DEFAULT 0,
  harsh_turning_count INT DEFAULT 0,
  speeding_count INT DEFAULT 0,
  distracted_driving_count INT DEFAULT 0,

  -- Miles driven
  miles_driven DECIMAL(10, 2),
  hours_driven DECIMAL(8, 2),

  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(driver_id, score_date, score_type)
);

CREATE INDEX idx_behavior_scores_driver_date ON driver_behavior_scores(driver_id, score_date DESC);

-- ============================================================================
-- Webhook Event Log
-- ============================================================================

CREATE TABLE IF NOT EXISTS telematics_webhook_events (
  id SERIAL PRIMARY KEY,
  provider_id INT REFERENCES telematics_providers(id),
  event_type VARCHAR(100) NOT NULL,
  external_id VARCHAR(255),
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_processed ON telematics_webhook_events(processed, created_at);
CREATE INDEX idx_webhook_events_provider_type ON telematics_webhook_events(provider_id, event_type);

-- ============================================================================
-- Functions & Triggers
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vehicle_telematics_connections
CREATE TRIGGER update_vehicle_telematics_updated_at
  BEFORE UPDATE ON vehicle_telematics_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Views for Reporting
-- ============================================================================

-- Latest telemetry per vehicle
CREATE OR REPLACE VIEW latest_vehicle_telemetry AS
SELECT DISTINCT ON (vehicle_id)
  vehicle_id,
  provider_id,
  timestamp,
  latitude,
  longitude,
  heading,
  speed_mph,
  address,
  odometer_miles,
  fuel_percent,
  battery_percent,
  engine_state,
  temperature_f
FROM vehicle_telemetry
ORDER BY vehicle_id, timestamp DESC;

-- Active diagnostic codes
CREATE OR REPLACE VIEW active_diagnostic_codes AS
SELECT
  vdc.*,
  v.name as vehicle_name,
  v.vin
FROM vehicle_diagnostic_codes vdc
JOIN vehicles v ON vdc.vehicle_id = v.id
WHERE vdc.cleared_at IS NULL
ORDER BY vdc.severity DESC, vdc.last_detected_at DESC;

-- Driver safety summary (last 30 days)
CREATE OR REPLACE VIEW driver_safety_summary_30d AS
SELECT
  d.id as driver_id,
  d.first_name || ' ' || d.last_name as driver_name,
  COUNT(*) as total_events,
  SUM(CASE WHEN event_type = 'harsh_braking' THEN 1 ELSE 0 END) as harsh_braking,
  SUM(CASE WHEN event_type = 'harsh_acceleration' THEN 1 ELSE 0 END) as harsh_acceleration,
  SUM(CASE WHEN event_type = 'speeding' THEN 1 ELSE 0 END) as speeding,
  AVG(dbs.overall_score) as avg_safety_score
FROM driver_safety_events dse
JOIN drivers d ON dse.driver_id = d.id
LEFT JOIN driver_behavior_scores dbs ON dbs.driver_id = d.id
  AND dbs.score_date >= CURRENT_DATE - INTERVAL '30 days'
WHERE dse.timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY d.id, d.first_name, d.last_name;

-- ============================================================================
-- Grants (adjust as needed)
-- ============================================================================

-- Grant SELECT to read-only users
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_role;

-- Grant INSERT, UPDATE, DELETE to api role
-- GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO api_role;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO api_role;

COMMENT ON TABLE telematics_providers IS 'Supported telematics providers (Samsara, Geotab, etc.)';
COMMENT ON TABLE vehicle_telematics_connections IS 'Links vehicles to their telematics provider accounts';
COMMENT ON TABLE vehicle_telemetry IS 'Real-time and historical vehicle location and stats';
COMMENT ON TABLE driver_safety_events IS 'Harsh driving events (braking, acceleration, turning, speeding)';
COMMENT ON TABLE driver_hos_logs IS 'Hours of Service (HOS) logs for ELD compliance';
COMMENT ON TABLE vehicle_diagnostic_codes IS 'Vehicle diagnostic trouble codes (DTCs)';
COMMENT ON TABLE geofences IS 'Geographic boundaries for alerts';
COMMENT ON TABLE geofence_events IS 'Vehicle geofence entry/exit/dwell events';
COMMENT ON TABLE driver_behavior_scores IS 'Daily/weekly/monthly driver safety scores';
COMMENT ON TABLE telematics_webhook_events IS 'Webhook events from telematics providers';
