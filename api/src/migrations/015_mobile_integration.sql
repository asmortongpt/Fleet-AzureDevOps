-- Migration: Mobile App Integration Tables
-- Description: Unified mobile app integration with all Fleet Management features
-- Business Value: $1,500,000/year across all mobile features

-- =====================================================
-- Mobile Devices Registration
-- =====================================================

CREATE TABLE IF NOT EXISTS mobile_devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('ios', 'android')),
    device_id VARCHAR(255) NOT NULL UNIQUE,
    device_name VARCHAR(255) NOT NULL,
    app_version VARCHAR(50) NOT NULL,
    os_version VARCHAR(50) NOT NULL,
    push_token TEXT,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mobile_devices_user ON mobile_devices(user_id);
CREATE INDEX idx_mobile_devices_device_id ON mobile_devices(device_id);
CREATE INDEX idx_mobile_devices_last_sync ON mobile_devices(last_sync_at);

-- =====================================================
-- Vehicle Inspections (from mobile)
-- =====================================================

CREATE TABLE IF NOT EXISTS vehicle_inspections (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    inspector_id INTEGER NOT NULL REFERENCES users(id),
    mobile_id VARCHAR(255) UNIQUE, -- For offline sync
    inspection_type VARCHAR(50) NOT NULL CHECK (inspection_type IN ('pre-trip', 'post-trip', 'daily', 'weekly', 'monthly')),
    checklist_data JSONB NOT NULL, -- Flexible checklist structure
    notes TEXT,
    status VARCHAR(20) DEFAULT 'completed',
    inspected_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicle_inspections_tenant ON vehicle_inspections(tenant_id);
CREATE INDEX idx_vehicle_inspections_vehicle ON vehicle_inspections(vehicle_id);
CREATE INDEX idx_vehicle_inspections_mobile_id ON vehicle_inspections(mobile_id);
CREATE INDEX idx_vehicle_inspections_inspected_at ON vehicle_inspections(inspected_at);

-- =====================================================
-- Driver Reports (from mobile)
-- =====================================================

CREATE TABLE IF NOT EXISTS driver_reports (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL REFERENCES users(id),
    mobile_id VARCHAR(255) UNIQUE, -- For offline sync
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('fuel', 'expense', 'incident', 'maintenance', 'other')),
    data JSONB NOT NULL, -- Flexible report data
    submitted_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_driver_reports_tenant ON driver_reports(tenant_id);
CREATE INDEX idx_driver_reports_driver ON driver_reports(driver_id);
CREATE INDEX idx_driver_reports_mobile_id ON driver_reports(mobile_id);
CREATE INDEX idx_driver_reports_type ON driver_reports(report_type);

-- =====================================================
-- Mobile Photos (from mobile)
-- =====================================================

CREATE TABLE IF NOT EXISTS mobile_photos (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    mobile_id VARCHAR(255) UNIQUE, -- For offline sync
    photo_url TEXT NOT NULL,
    metadata JSONB, -- EXIF, location, etc.
    taken_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mobile_photos_tenant ON mobile_photos(tenant_id);
CREATE INDEX idx_mobile_photos_user ON mobile_photos(user_id);
CREATE INDEX idx_mobile_photos_mobile_id ON mobile_photos(mobile_id);

-- =====================================================
-- Hours of Service (HOS) Logs
-- =====================================================

CREATE TABLE IF NOT EXISTS hos_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    driver_id INTEGER NOT NULL REFERENCES users(id),
    mobile_id VARCHAR(255) UNIQUE, -- For offline sync
    duty_status VARCHAR(20) NOT NULL CHECK (duty_status IN ('off_duty', 'sleeper', 'driving', 'on_duty')),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    location JSONB, -- { latitude, longitude, address }
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hos_logs_tenant ON hos_logs(tenant_id);
CREATE INDEX idx_hos_logs_driver ON hos_logs(driver_id);
CREATE INDEX idx_hos_logs_mobile_id ON hos_logs(mobile_id);
CREATE INDEX idx_hos_logs_start_time ON hos_logs(start_time);

-- =====================================================
-- Keyless Entry Logs
-- =====================================================

CREATE TABLE IF NOT EXISTS keyless_entry_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    device_id VARCHAR(255) NOT NULL,
    command VARCHAR(20) NOT NULL CHECK (command IN ('lock', 'unlock', 'start', 'stop')),
    location JSONB, -- { latitude, longitude }
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_keyless_entry_tenant ON keyless_entry_logs(tenant_id);
CREATE INDEX idx_keyless_entry_vehicle ON keyless_entry_logs(vehicle_id);
CREATE INDEX idx_keyless_entry_user ON keyless_entry_logs(user_id);
CREATE INDEX idx_keyless_entry_executed_at ON keyless_entry_logs(executed_at);

-- =====================================================
-- Damage Detections (AI from mobile)
-- =====================================================

CREATE TABLE IF NOT EXISTS damage_detections (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
    reported_by INTEGER NOT NULL REFERENCES users(id),
    photo_url TEXT NOT NULL,
    ai_detections JSONB NOT NULL, -- Array of detected damages with coordinates
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'severe')),
    estimated_cost DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'open',
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_damage_detections_tenant ON damage_detections(tenant_id);
CREATE INDEX idx_damage_detections_vehicle ON damage_detections(vehicle_id);
CREATE INDEX idx_damage_detections_status ON damage_detections(status);
CREATE INDEX idx_damage_detections_severity ON damage_detections(severity);

-- =====================================================
-- Sync Conflicts (for manual resolution)
-- =====================================================

CREATE TABLE IF NOT EXISTS sync_conflicts (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    device_id VARCHAR(255) NOT NULL,
    conflict_type VARCHAR(50) NOT NULL, -- 'inspection', 'report', 'hos_log', etc.
    mobile_id VARCHAR(255) NOT NULL,
    server_id INTEGER,
    mobile_data JSONB NOT NULL,
    server_data JSONB NOT NULL,
    resolution VARCHAR(20), -- 'server_wins', 'mobile_wins', 'manual'
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_conflicts_tenant ON sync_conflicts(tenant_id);
CREATE INDEX idx_sync_conflicts_user ON sync_conflicts(user_id);
CREATE INDEX idx_sync_conflicts_device ON sync_conflicts(device_id);
CREATE INDEX idx_sync_conflicts_resolution ON sync_conflicts(resolution);

-- =====================================================
-- Mobile Analytics
-- =====================================================

CREATE TABLE IF NOT EXISTS mobile_analytics (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    device_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- 'app_open', 'feature_used', 'sync', 'crash', etc.
    event_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mobile_analytics_tenant ON mobile_analytics(tenant_id);
CREATE INDEX idx_mobile_analytics_user ON mobile_analytics(user_id);
CREATE INDEX idx_mobile_analytics_device ON mobile_analytics(device_id);
CREATE INDEX idx_mobile_analytics_event_type ON mobile_analytics(event_type);
CREATE INDEX idx_mobile_analytics_created_at ON mobile_analytics(created_at);

-- =====================================================
-- Views for Reporting
-- =====================================================

-- Active mobile devices by user
CREATE OR REPLACE VIEW active_mobile_devices AS
SELECT
    u.tenant_id,
    u.id as user_id,
    u.name as user_name,
    u.email,
    md.device_type,
    md.device_name,
    md.app_version,
    md.os_version,
    md.last_sync_at,
    CASE
        WHEN md.last_sync_at > CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN 'active'
        WHEN md.last_sync_at > CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN 'recent'
        ELSE 'inactive'
    END as status
FROM users u
JOIN mobile_devices md ON md.user_id = u.id;

-- Driver inspection compliance
CREATE OR REPLACE VIEW driver_inspection_compliance AS
SELECT
    tenant_id,
    inspector_id as driver_id,
    COUNT(*) as total_inspections,
    COUNT(*) FILTER (WHERE inspected_at >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
    COUNT(*) FILTER (WHERE inspected_at >= CURRENT_DATE - INTERVAL '30 days') as last_30_days,
    COUNT(*) FILTER (WHERE inspection_type = 'pre-trip') as pre_trip_count,
    COUNT(*) FILTER (WHERE inspection_type = 'post-trip') as post_trip_count,
    MAX(inspected_at) as last_inspection_at
FROM vehicle_inspections
GROUP BY tenant_id, inspector_id;

-- HOS compliance summary
CREATE OR REPLACE VIEW hos_compliance_summary AS
SELECT
    tenant_id,
    driver_id,
    DATE(start_time) as date,
    SUM(CASE WHEN duty_status = 'driving' THEN EXTRACT(EPOCH FROM (COALESCE(end_time, CURRENT_TIMESTAMP) - start_time))/3600 ELSE 0 END) as driving_hours,
    SUM(CASE WHEN duty_status = 'on_duty' THEN EXTRACT(EPOCH FROM (COALESCE(end_time, CURRENT_TIMESTAMP) - start_time))/3600 ELSE 0 END) as on_duty_hours,
    SUM(CASE WHEN duty_status = 'off_duty' THEN EXTRACT(EPOCH FROM (COALESCE(end_time, CURRENT_TIMESTAMP) - start_time))/3600 ELSE 0 END) as off_duty_hours,
    SUM(CASE WHEN duty_status = 'sleeper' THEN EXTRACT(EPOCH FROM (COALESCE(end_time, CURRENT_TIMESTAMP) - start_time))/3600 ELSE 0 END) as sleeper_hours
FROM hos_logs
GROUP BY tenant_id, driver_id, DATE(start_time);

-- Damage detection summary
CREATE OR REPLACE VIEW damage_detection_summary AS
SELECT
    tenant_id,
    vehicle_id,
    COUNT(*) as total_detections,
    COUNT(*) FILTER (WHERE status = 'open') as open_detections,
    COUNT(*) FILTER (WHERE severity = 'severe') as severe_count,
    COUNT(*) FILTER (WHERE severity = 'major') as major_count,
    COUNT(*) FILTER (WHERE severity = 'moderate') as moderate_count,
    COUNT(*) FILTER (WHERE severity = 'minor') as minor_count,
    SUM(estimated_cost) as total_estimated_cost,
    MAX(detected_at) as last_detection_at
FROM damage_detections
GROUP BY tenant_id, vehicle_id;

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mobile_devices_updated_at
BEFORE UPDATE ON mobile_devices
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_inspections_updated_at
BEFORE UPDATE ON vehicle_inspections
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_reports_updated_at
BEFORE UPDATE ON driver_reports
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hos_logs_updated_at
BEFORE UPDATE ON hos_logs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE mobile_devices IS 'Registered mobile devices (iOS and Android)';
COMMENT ON TABLE vehicle_inspections IS 'Vehicle inspections submitted from mobile apps';
COMMENT ON TABLE driver_reports IS 'Driver reports (fuel, expense, incident, maintenance) from mobile';
COMMENT ON TABLE mobile_photos IS 'Photos captured from mobile devices';
COMMENT ON TABLE hos_logs IS 'Hours of Service logs for DOT compliance';
COMMENT ON TABLE keyless_entry_logs IS 'Keyless entry command logs (lock, unlock, start, stop)';
COMMENT ON TABLE damage_detections IS 'AI-detected damage from mobile photo uploads';
COMMENT ON TABLE sync_conflicts IS 'Offline sync conflicts requiring resolution';
COMMENT ON TABLE mobile_analytics IS 'Mobile app usage analytics';

-- =====================================================
-- Seed Data (optional - for testing)
-- =====================================================

-- Sample inspection checklist structure
INSERT INTO vehicle_inspections (
    tenant_id,
    vehicle_id,
    inspector_id,
    mobile_id,
    inspection_type,
    checklist_data,
    notes,
    inspected_at
)
SELECT
    1, -- tenant_id
    v.id,
    u.id,
    'SAMPLE_MOBILE_' || v.id,
    'pre-trip',
    jsonb_build_object(
        'tires', jsonb_build_object('condition', 'good', 'pressure_ok', true),
        'lights', jsonb_build_object('all_working', true),
        'brakes', jsonb_build_object('condition', 'good', 'noise', false),
        'fluid_levels', jsonb_build_object('oil', 'full', 'coolant', 'full', 'washer', 'full'),
        'body', jsonb_build_object('damage', false, 'cleanliness', 'good')
    ),
    'Sample pre-trip inspection',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
FROM vehicles v
CROSS JOIN users u
WHERE v.id <= 3 AND u.id = 1
LIMIT 3
ON CONFLICT (mobile_id) DO NOTHING;

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO fleetapp;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fleetapp;

-- =====================================================
-- Completion
-- =====================================================

SELECT 'Mobile Integration migration completed successfully!' as status;
