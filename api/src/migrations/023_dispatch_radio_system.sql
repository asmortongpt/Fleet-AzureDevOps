-- Migration: Dispatch Radio Communication System
-- Description: Creates tables and functions for realistic dispatch radio emulation
-- Version: 023
-- Created: 2025-11-27

-- ============================================================================
-- DISPATCH TRANSMISSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispatch_transmissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS transmission_id VARCHAR(255);
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE;
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS channel VARCHAR(50);
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS priority VARCHAR(20);
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0;
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS location_lat DECIMAL(10, 8);
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS location_lng DECIMAL(11, 8);
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS location_address TEXT;
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS "number" VARCHAR(50);
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS incident_number VARCHAR(50);
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS response_required BOOLEAN DEFAULT false;
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN DEFAULT false;
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS audio_clip_id VARCHAR(255);
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS signal_strength INTEGER;
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS battery_level INTEGER;
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS background_noise INTEGER;
ALTER TABLE dispatch_transmissions ADD COLUMN IF NOT EXISTS transmission_quality VARCHAR(20);

-- Ensure constraints (added in DO block for idempotency)
DO $$ BEGIN
    ALTER TABLE dispatch_transmissions ADD CONSTRAINT dispatch_transmissions_channel_check CHECK (channel IN ('dispatch', 'emergency', 'maintenance', 'operations'));
    ALTER TABLE dispatch_transmissions ADD CONSTRAINT dispatch_transmissions_type_check CHECK (type IN ('emergency', 'routine', 'incident', 'status', 'acknowledgment', 'request'));
    ALTER TABLE dispatch_transmissions ADD CONSTRAINT dispatch_transmissions_priority_check CHECK (priority IN ('low', 'medium', 'high', 'critical'));
    ALTER TABLE dispatch_transmissions ADD CONSTRAINT dispatch_transmissions_signal_strength_check CHECK (signal_strength >= 0 AND signal_strength <= 100);
    ALTER TABLE dispatch_transmissions ADD CONSTRAINT dispatch_transmissions_battery_level_check CHECK (battery_level >= 0 AND battery_level <= 100);
    ALTER TABLE dispatch_transmissions ADD CONSTRAINT dispatch_transmissions_background_noise_check CHECK (background_noise >= 0 AND background_noise <= 100);
    ALTER TABLE dispatch_transmissions ADD CONSTRAINT dispatch_transmissions_transmission_quality_check CHECK (transmission_quality IN ('clear', 'static', 'weak', 'broken'));
    ALTER TABLE dispatch_transmissions ADD CONSTRAINT valid_location CHECK (
        (location_lat IS NULL AND location_lng IS NULL) OR
        (location_lat IS NOT NULL AND location_lng IS NOT NULL)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Indexes for dispatch_transmissions
CREATE INDEX IF NOT EXISTS idx_dispatch_transmissions_vehicle_id ON dispatch_transmissions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_transmissions_driver_id ON dispatch_transmissions(driver_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_transmissions_channel ON dispatch_transmissions(channel);
CREATE INDEX IF NOT EXISTS idx_dispatch_transmissions_timestamp ON dispatch_transmissions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_dispatch_transmissions_priority ON dispatch_transmissions(priority);
CREATE INDEX IF NOT EXISTS idx_dispatch_transmissions_type ON dispatch_transmissions(type);
CREATE INDEX IF NOT EXISTS idx_dispatch_transmissions_response_required ON dispatch_transmissions(response_required) WHERE response_required = true;
CREATE INDEX IF NOT EXISTS idx_dispatch_transmissions_unacknowledged ON dispatch_transmissions(acknowledged, timestamp DESC) WHERE acknowledged = false;
CREATE INDEX IF NOT EXISTS idx_dispatch_transmissions_incident ON dispatch_transmissions(incident_number) WHERE incident_number IS NOT NULL;

-- GiST index for location-based queries
CREATE INDEX IF NOT EXISTS idx_dispatch_transmissions_location ON dispatch_transmissions
    USING gist (ll_to_earth(location_lat, location_lng)) WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- ============================================================================
-- DISPATCH CHANNELS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispatch_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist
ALTER TABLE dispatch_channels ADD COLUMN IF NOT EXISTS channel_id VARCHAR(50);
ALTER TABLE dispatch_channels ADD COLUMN IF NOT EXISTS frequency VARCHAR(50);
ALTER TABLE dispatch_channels ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE dispatch_channels ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE dispatch_channels ADD COLUMN IF NOT EXISTS priority_level INTEGER DEFAULT 1;
ALTER TABLE dispatch_channels ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;
ALTER TABLE dispatch_channels ADD COLUMN IF NOT EXISTS max_concurrent_transmissions INTEGER DEFAULT 10;
ALTER TABLE dispatch_channels ADD COLUMN IF NOT EXISTS emergency_override BOOLEAN DEFAULT false;
ALTER TABLE dispatch_channels ADD COLUMN IF NOT EXISTS recording_enabled BOOLEAN DEFAULT true;
ALTER TABLE dispatch_channels ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE dispatch_channels ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add unique constraint if missing
DO $$ BEGIN
    ALTER TABLE dispatch_channels ADD CONSTRAINT dispatch_channels_channel_id_key UNIQUE (channel_id);
EXCEPTION
    WHEN duplicate_table OR duplicate_object THEN null;
END $$;

-- Update channel_id from name if missing
UPDATE dispatch_channels SET channel_id = LOWER(REPLACE(name, ' ', '_')) WHERE channel_id IS NULL;
ALTER TABLE dispatch_channels ALTER COLUMN channel_id SET NOT NULL;

-- Initial channel data
DO $$ BEGIN
    INSERT INTO dispatch_channels (channel_id, name, frequency, status, description, priority_level, emergency_override)
    VALUES ('dispatch', 'Main Dispatch', '154.280', 'active', 'Primary dispatch and coordination channel', 1, false)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO dispatch_channels (channel_id, name, frequency, status, description, priority_level, emergency_override)
    VALUES ('emergency', 'Emergency Operations', '155.475', 'standby', 'Emergency and high-priority communications', 5, true)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO dispatch_channels (channel_id, name, frequency, status, description, priority_level, emergency_override)
    VALUES ('maintenance', 'Maintenance Operations', '154.570', 'active', 'Vehicle maintenance and support', 2, false)
    ON CONFLICT DO NOTHING;
    
    INSERT INTO dispatch_channels (channel_id, name, frequency, status, description, priority_level, emergency_override)
    VALUES ('operations', 'Field Operations', '155.160', 'active', 'General field operations and logistics', 1, false)
    ON CONFLICT DO NOTHING;
EXCEPTION
    WHEN others THEN RAISE NOTICE 'Some channels could not be inserted';
END $$;

CREATE INDEX IF NOT EXISTS idx_dispatch_channels_status ON dispatch_channels(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_channels_priority ON dispatch_channels(priority_level DESC);

-- ============================================================================
-- CHANNEL ASSIGNMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispatch_channel_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    channel_id VARCHAR(50) NOT NULL,
    "number" VARCHAR(50) NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,

    -- Radio state
    signal_strength INTEGER DEFAULT 100 CHECK (signal_strength >= 0 AND signal_strength <= 100),
    battery_level INTEGER DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
    last_transmission TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(vehicle_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_assignments_vehicle ON dispatch_channel_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_channel_assignments_channel ON dispatch_channel_assignments(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_assignments_active ON dispatch_channel_assignments(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_channel_assignments_unit ON dispatch_channel_assignments(number);

-- ============================================================================
-- INCIDENT REPORTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispatch_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('emergency', 'accident', 'breakdown', 'hazard', 'security', 'other')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'responding', 'resolved', 'closed')),

    -- Location
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,

    -- Involved entities
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Timeline
    reported_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,

    -- Response
    responding_units TEXT[], -- Array of unit numbers
    response_time_minutes INTEGER,
    resolution_notes TEXT,

    -- Costs and impacts
    estimated_cost DECIMAL(10, 2),
    downtime_minutes INTEGER,
    injuries_reported BOOLEAN DEFAULT false,
    property_damage BOOLEAN DEFAULT false,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_dispatch_incidents_number ON dispatch_incidents(incident_number);
CREATE INDEX IF NOT EXISTS idx_dispatch_incidents_status ON dispatch_incidents(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_incidents_severity ON dispatch_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_dispatch_incidents_vehicle ON dispatch_incidents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_incidents_reported_at ON dispatch_incidents(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_dispatch_incidents_type ON dispatch_incidents(type);

-- GiST index for location-based incident queries
CREATE INDEX IF NOT EXISTS idx_dispatch_incidents_location ON dispatch_incidents
    USING gist (ll_to_earth(location_lat, location_lng)) WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;

-- ============================================================================
-- TRANSMISSION ACKNOWLEDGMENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispatch_transmission_acknowledgments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transmission_id UUID NOT NULL REFERENCES dispatch_transmissions(id) ON DELETE CASCADE,
    acknowledged_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    acknowledged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    response_message TEXT,
    response_time_seconds INTEGER,

    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transmission_acks_transmission ON dispatch_transmission_acknowledgments(transmission_id);
CREATE INDEX IF NOT EXISTS idx_transmission_acks_user ON dispatch_transmission_acknowledgments(acknowledged_by);
CREATE INDEX IF NOT EXISTS idx_transmission_acks_time ON dispatch_transmission_acknowledgments(acknowledged_at DESC);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_dispatch_transmissions_updated_at
    BEFORE UPDATE ON dispatch_transmissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispatch_channels_updated_at
    BEFORE UPDATE ON dispatch_channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispatch_channel_assignments_updated_at
    BEFORE UPDATE ON dispatch_channel_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispatch_incidents_updated_at
    BEFORE UPDATE ON dispatch_incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to acknowledge transmission
CREATE OR REPLACE FUNCTION acknowledge_transmission(
    p_transmission_id UUID,
    p_user_id UUID,
    p_response_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_transmission_time TIMESTAMP WITH TIME ZONE;
    v_response_time INTEGER;
BEGIN
    -- Get transmission timestamp
    SELECT timestamp INTO v_transmission_time
    FROM dispatch_transmissions
    WHERE id = p_transmission_id;

    IF v_transmission_time IS NULL THEN
        RETURN false;
    END IF;

    -- Calculate response time in seconds
    v_response_time := EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - v_transmission_time))::INTEGER;

    -- Update transmission
    UPDATE dispatch_transmissions
    SET acknowledged = true,
        acknowledged_at = CURRENT_TIMESTAMP,
        acknowledged_by = p_user_id
    WHERE id = p_transmission_id;

    -- Insert acknowledgment record
    INSERT INTO dispatch_transmission_acknowledgments (
        transmission_id,
        acknowledged_by,
        response_message,
        response_time_seconds
    ) VALUES (
        p_transmission_id,
        p_user_id,
        p_response_message,
        v_response_time
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unacknowledged critical transmissions
CREATE OR REPLACE FUNCTION get_critical_unacknowledged_transmissions()
RETURNS TABLE (
    id UUID,
    transmission_id VARCHAR,
    vehicle_id UUID,
    "number" VARCHAR,
    channel VARCHAR,
    message TEXT,
    "timestamp" TIMESTAMP WITH TIME ZONE,
    age_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dt.id,
        dt.transmission_id,
        dt.vehicle_id,
        dt."number",
        dt.channel,
        dt.message,
        dt.timestamp,
        EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - dt.timestamp))::INTEGER / 60 AS age_minutes
    FROM dispatch_transmissions dt
    WHERE dt.priority = 'critical'
        AND dt.acknowledged = false
        AND dt.response_required = true
    ORDER BY dt.timestamp ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get channel activity summary
CREATE OR REPLACE FUNCTION get_channel_activity_summary(
    p_channel_id VARCHAR DEFAULT NULL,
    p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    channel VARCHAR,
    total_transmissions BIGINT,
    emergency_count BIGINT,
    critical_count BIGINT,
    unacknowledged_count BIGINT,
    avg_response_time_seconds NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dt.channel,
        COUNT(*) AS total_transmissions,
        COUNT(*) FILTER (WHERE dt.type = 'emergency') AS emergency_count,
        COUNT(*) FILTER (WHERE dt.priority = 'critical') AS critical_count,
        COUNT(*) FILTER (WHERE dt.acknowledged = false AND dt.response_required = true) AS unacknowledged_count,
        AVG(
            CASE
                WHEN dt.acknowledged = true AND dt.acknowledged_at IS NOT NULL
                THEN EXTRACT(EPOCH FROM (dt.acknowledged_at - dt.timestamp))
                ELSE NULL
            END
        ) AS avg_response_time_seconds
    FROM dispatch_transmissions dt
    WHERE dt.timestamp >= CURRENT_TIMESTAMP - (p_hours || ' hours')::INTERVAL
        AND (p_channel_id IS NULL OR dt.channel = p_channel_id)
    GROUP BY dt.channel
    ORDER BY total_transmissions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create incident from transmission
CREATE OR REPLACE FUNCTION create_incident_from_transmission(
    p_transmission_id UUID,
    p_title VARCHAR,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_incident_id UUID;
    v_incident_number VARCHAR;
    v_transmission RECORD;
BEGIN
    -- Get transmission details
    SELECT * INTO v_transmission
    FROM dispatch_transmissions
    WHERE id = p_transmission_id;

    IF v_transmission IS NULL THEN
        RAISE EXCEPTION 'Transmission not found';
    END IF;

    -- Generate incident number
    v_incident_number := TO_CHAR(CURRENT_TIMESTAMP, 'YY') || '-' ||
                         LPAD(FLOOR(RANDOM() * 90000 + 10000)::TEXT, 5, '0');

    -- Create incident
    INSERT INTO dispatch_incidents (
        incident_number,
        title,
        description,
        type,
        severity,
        status,
        location_lat,
        location_lng,
        location_address,
        vehicle_id,
        driver_id,
        reported_at,
        metadata
    ) VALUES (
        v_incident_number,
        p_title,
        COALESCE(p_description, v_transmission.message),
        CASE v_transmission.type
            WHEN 'emergency' THEN 'emergency'
            WHEN 'incident' THEN 'accident'
            ELSE 'other'
        END,
        CASE v_transmission.priority
            WHEN 'critical' THEN 'critical'
            WHEN 'high' THEN 'high'
            WHEN 'medium' THEN 'medium'
            ELSE 'low'
        END,
        'open',
        v_transmission.location_lat,
        v_transmission.location_lng,
        v_transmission.location_address,
        v_transmission.vehicle_id,
        v_transmission.driver_id,
        v_transmission.timestamp,
        jsonb_build_object('transmission_id', v_transmission.transmission_id)
    ) RETURNING id INTO v_incident_id;

    -- Update transmission with incident number
    UPDATE dispatch_transmissions
    SET incident_number = v_incident_number
    WHERE id = p_transmission_id;

    RETURN v_incident_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for recent transmissions with vehicle details
CREATE OR REPLACE VIEW v_recent_dispatch_transmissions AS
SELECT
    dt.id,
    dt.transmission_id,
    dt.channel,
    dt.type,
    dt.priority,
    dt.message,
    dt.timestamp,
    dt.duration,
    dt.acknowledged,
    dt.response_required,
    dt."number",
    v.id AS vehicle_id,
    v.make || ' ' || v.model AS vehicle_name,
    v.license_plate,
    d.id AS driver_id,
    d.first_name || ' ' || d.last_name AS driver_name,
    dt.location_lat,
    dt.location_lng,
    dt.location_address,
    dt.transmission_quality,
    dt.signal_strength
FROM dispatch_transmissions dt
LEFT JOIN vehicles v ON dt.vehicle_id = v.id
LEFT JOIN drivers d ON dt.driver_id = d.id
ORDER BY dt.timestamp DESC;

-- View for active incidents
CREATE OR REPLACE VIEW v_active_dispatch_incidents AS
SELECT
    di.*,
    v.make || ' ' || v.model AS vehicle_name,
    v.license_plate,
    d.first_name || ' ' || d.last_name AS driver_name,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - di.reported_at))::INTEGER / 60 AS age_minutes
FROM dispatch_incidents di
LEFT JOIN vehicles v ON di.vehicle_id = v.id
LEFT JOIN drivers d ON di.driver_id = d.id
WHERE di.status NOT IN ('resolved', 'closed')
ORDER BY di.severity DESC, di.reported_at ASC;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Grant appropriate permissions (adjust based on your role structure)
-- GRANT SELECT, INSERT, UPDATE ON dispatch_transmissions -- TO authenticated;
-- GRANT SELECT ON dispatch_channels -- TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON dispatch_channel_assignments -- TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON dispatch_incidents -- TO authenticated;
-- GRANT SELECT, INSERT ON dispatch_transmission_acknowledgments -- TO authenticated;
-- GRANT SELECT ON v_recent_dispatch_transmissions -- TO authenticated;
-- GRANT SELECT ON v_active_dispatch_incidents -- TO authenticated;

-- Grant execute on functions
-- GRANT EXECUTE ON FUNCTION acknowledge_transmission -- TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_critical_unacknowledged_transmissions -- TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_channel_activity_summary -- TO authenticated;
-- GRANT EXECUTE ON FUNCTION create_incident_from_transmission -- TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE dispatch_transmissions IS 'Radio transmissions for dispatch communication system';
COMMENT ON TABLE dispatch_channels IS 'Radio channels for dispatch operations';
COMMENT ON TABLE dispatch_channel_assignments IS 'Vehicle assignments to radio channels';
COMMENT ON TABLE dispatch_incidents IS 'Incidents reported through dispatch system';
COMMENT ON TABLE dispatch_transmission_acknowledgments IS 'Acknowledgment records for transmissions';

COMMENT ON FUNCTION acknowledge_transmission IS 'Acknowledge a dispatch transmission and record response time';
COMMENT ON FUNCTION get_critical_unacknowledged_transmissions IS 'Get all critical unacknowledged transmissions';
COMMENT ON FUNCTION get_channel_activity_summary IS 'Get activity summary for dispatch channels';
COMMENT ON FUNCTION create_incident_from_transmission IS 'Create an incident record from a transmission';
