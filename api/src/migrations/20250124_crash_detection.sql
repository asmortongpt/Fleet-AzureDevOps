/**
 * Crash Detection Database Schema
 *
 * Tables and indexes for storing crash detection data from mobile devices
 */

-- ============================================================================
-- CRASH INCIDENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS crash_incidents (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,

  -- Crash details
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  max_acceleration DECIMAL(5, 2) NOT NULL, -- In G-force
  user_canceled BOOLEAN DEFAULT FALSE,

  -- Emergency response
  emergency_services_notified BOOLEAN DEFAULT FALSE,
  emergency_response_time TIMESTAMP WITH TIME ZONE,
  emergency_contact_notified BOOLEAN DEFAULT FALSE,

  -- Additional data
  telemetry_data JSONB,
  photos_urls TEXT[],
  video_url TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_crash_incidents_tenant ON crash_incidents(tenant_id);
CREATE INDEX idx_crash_incidents_user ON crash_incidents(user_id);
CREATE INDEX idx_crash_incidents_driver ON crash_incidents(driver_id);
CREATE INDEX idx_crash_incidents_timestamp ON crash_incidents(timestamp DESC);
CREATE INDEX idx_crash_incidents_emergency ON crash_incidents(tenant_id, emergency_services_notified, user_canceled);

-- GiST index for location-based queries
CREATE INDEX idx_crash_incidents_location ON crash_incidents
  USING GIST (ll_to_earth(latitude::float8, longitude::float8))
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ============================================================================
-- EMERGENCY CONTACTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Contact details
  name VARCHAR(255) NOT NULL,
  relationship VARCHAR(100),
  phone_number VARCHAR(50) NOT NULL,
  email VARCHAR(255),

  -- Priority
  priority INTEGER DEFAULT 1, -- 1 = primary, 2 = secondary, etc.
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tenant_id, user_id, phone_number)
);

-- Indexes
CREATE INDEX idx_emergency_contacts_user ON emergency_contacts(user_id, is_active);

-- ============================================================================
-- CRASH DETECTION SETTINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS crash_detection_settings (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,

  -- Settings (user-level or fleet-level)
  enabled BOOLEAN DEFAULT TRUE,
  auto_call_911 BOOLEAN DEFAULT TRUE,
  countdown_seconds INTEGER DEFAULT 10,
  acceleration_threshold DECIMAL(4, 2) DEFAULT 3.0, -- G-force threshold

  -- Notification preferences
  notify_emergency_contacts BOOLEAN DEFAULT TRUE,
  notify_fleet_manager BOOLEAN DEFAULT TRUE,
  notify_insurance BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(tenant_id, user_id)
);

-- Indexes
CREATE INDEX idx_crash_settings_tenant ON crash_detection_settings(tenant_id);
CREATE INDEX idx_crash_settings_user ON crash_detection_settings(user_id);

-- ============================================================================
-- VIEWS FOR CRASH ANALYTICS
-- ============================================================================

-- Recent Crashes (Last 30 Days)
CREATE OR REPLACE VIEW recent_crash_incidents AS
SELECT
  ci.id,
  ci.tenant_id,
  ci.timestamp,
  ci.latitude,
  ci.longitude,
  ci.max_acceleration,
  ci.user_canceled,
  ci.emergency_services_notified,
  u.first_name || ' ' || u.last_name AS driver_name,
  u.email AS driver_email,
  u.phone AS driver_phone,
  d.license_number,
  v.name AS vehicle_name,
  v.license_plate
FROM crash_incidents ci
LEFT JOIN users u ON ci.user_id = u.id
LEFT JOIN drivers d ON ci.driver_id = d.id
LEFT JOIN vehicles v ON ci.vehicle_id = v.id
WHERE ci.timestamp >= NOW() - INTERVAL '30 days'
ORDER BY ci.timestamp DESC;

-- Crash Statistics by Driver
CREATE OR REPLACE VIEW driver_crash_statistics AS
SELECT
  ci.tenant_id,
  ci.driver_id,
  u.first_name || ' ' || u.last_name AS driver_name,
  COUNT(*) AS total_crashes,
  SUM(CASE WHEN ci.user_canceled = FALSE THEN 1 ELSE 0 END) AS confirmed_crashes,
  SUM(CASE WHEN ci.user_canceled = TRUE THEN 1 ELSE 0 END) AS false_alarms,
  AVG(ci.max_acceleration) AS avg_impact_force,
  MAX(ci.max_acceleration) AS max_impact_force,
  MAX(ci.timestamp) AS last_crash_date
FROM crash_incidents ci
LEFT JOIN users u ON ci.user_id = u.id
WHERE ci.timestamp >= NOW() - INTERVAL '1 year'
GROUP BY ci.tenant_id, ci.driver_id, driver_name
ORDER BY total_crashes DESC;

-- Fleet Crash Summary (Monthly)
CREATE OR REPLACE VIEW fleet_crash_summary_monthly AS
SELECT
  tenant_id,
  DATE_TRUNC('month', timestamp) AS month,
  COUNT(*) AS total_incidents,
  SUM(CASE WHEN user_canceled = FALSE THEN 1 ELSE 0 END) AS confirmed_crashes,
  SUM(CASE WHEN user_canceled = TRUE THEN 1 ELSE 0 END) AS false_alarms,
  SUM(CASE WHEN emergency_services_notified = TRUE THEN 1 ELSE 0 END) AS emergency_responses,
  AVG(max_acceleration) AS avg_impact_force,
  MAX(max_acceleration) AS max_impact_force
FROM crash_incidents
WHERE timestamp >= NOW() - INTERVAL '12 months'
GROUP BY tenant_id, DATE_TRUNC('month', timestamp)
ORDER BY month DESC;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_crash_incident_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_crash_incidents_timestamp
  BEFORE UPDATE ON crash_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_crash_incident_timestamp();

CREATE TRIGGER update_emergency_contacts_timestamp
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_crash_incident_timestamp();

CREATE TRIGGER update_crash_settings_timestamp
  BEFORE UPDATE ON crash_detection_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_crash_incident_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE crash_incidents IS 'Stores crash detection events from mobile devices';
COMMENT ON TABLE emergency_contacts IS 'Emergency contacts for users in case of crash';
COMMENT ON TABLE crash_detection_settings IS 'Per-user or fleet-wide crash detection settings';

COMMENT ON COLUMN crash_incidents.max_acceleration IS 'Maximum G-force detected during impact';
COMMENT ON COLUMN crash_incidents.user_canceled IS 'Whether the user canceled the emergency response';
COMMENT ON COLUMN crash_incidents.telemetry_data IS 'Additional sensor data (gyroscope, GPS, etc.)';

-- ============================================================================
-- SAMPLE DATA (For Testing Only)
-- ============================================================================

-- Insert default settings for existing users
INSERT INTO crash_detection_settings (tenant_id, user_id, enabled, auto_call_911)
SELECT DISTINCT tenant_id, id, TRUE, TRUE
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM crash_detection_settings cds
  WHERE cds.user_id = users.id
)
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- ============================================================================
-- PERMISSIONS (RLS - Row Level Security)
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE crash_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crash_detection_settings ENABLE ROW LEVEL SECURITY;

-- Policies for crash_incidents
CREATE POLICY crash_incidents_tenant_isolation ON crash_incidents
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- Policies for emergency_contacts
CREATE POLICY emergency_contacts_user_access ON emergency_contacts
  FOR ALL
  USING (
    user_id = current_setting('app.current_user_id')::INTEGER
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = current_setting('app.current_user_id')::INTEGER
        AND r.name IN ('fleet_manager', 'admin')
    )
  );

-- Policies for crash_detection_settings
CREATE POLICY crash_settings_user_access ON crash_detection_settings
  FOR ALL
  USING (
    user_id = current_setting('app.current_user_id')::INTEGER
    OR user_id IS NULL -- Fleet-wide settings
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = current_setting('app.current_user_id')::INTEGER
        AND r.name IN ('fleet_manager', 'admin')
    )
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant appropriate permissions (adjust based on your role setup)
-- GRANT SELECT, INSERT, UPDATE ON crash_incidents TO fleet_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON emergency_contacts TO fleet_user;
-- GRANT SELECT, INSERT, UPDATE ON crash_detection_settings TO fleet_user;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('crash_incidents', 'emergency_contacts', 'crash_detection_settings');

-- Verify indexes created
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('crash_incidents', 'emergency_contacts', 'crash_detection_settings');

-- Verify views created
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE '%crash%';

COMMIT;
