-- Add realistic vehicle location data for Fleet Management System
-- Locations distributed around Tallahassee, Florida area

-- Update vehicles table with location data if columns don't exist
DO $$
BEGIN
    -- Add latitude column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'latitude') THEN
        ALTER TABLE vehicles ADD COLUMN latitude DECIMAL(10, 8);
    END IF;

    -- Add longitude column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'longitude') THEN
        ALTER TABLE vehicles ADD COLUMN longitude DECIMAL(11, 8);
    END IF;

    -- Add last_location_update column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'last_location_update') THEN
        ALTER TABLE vehicles ADD COLUMN last_location_update TIMESTAMP;
    END IF;
END $$;

-- Update vehicles with realistic Tallahassee-area locations
-- Tallahassee center: 30.4383°N, 84.2807°W

UPDATE vehicles SET
    latitude = 30.4383 + (random() * 0.2 - 0.1), -- Random offset within ~11 miles
    longitude = -84.2807 + (random() * 0.2 - 0.1), -- Random offset within ~11 miles
    last_location_update = NOW() - (random() * interval '2 hours')
WHERE latitude IS NULL OR longitude IS NULL;

-- Create specific locations for demo purposes (well-known Tallahassee locations)
UPDATE vehicles SET
    latitude = 30.4518,
    longitude = -84.2742,
    last_location_update = NOW() - interval '5 minutes'
WHERE unit_number = 'UNIT-001'; -- Florida State Capitol area

UPDATE vehicles SET
    latitude = 30.4213,
    longitude = -84.2698,
    last_location_update = NOW() - interval '10 minutes'
WHERE unit_number = 'UNIT-002'; -- Tallahassee Memorial Hospital area

UPDATE vehicles SET
    latitude = 30.4397,
    longitude = -84.2989,
    last_location_update = NOW() - interval '3 minutes'
WHERE unit_number = 'UNIT-003'; -- FSU Campus area

UPDATE vehicles SET
    latitude = 30.4565,
    longitude = -84.2533,
    last_location_update = NOW() - interval '15 minutes'
WHERE unit_number = 'UNIT-004'; -- Tallahassee Airport area

UPDATE vehicles SET
    latitude = 30.4789,
    longitude = -84.3178,
    last_location_update = NOW() - interval '8 minutes'
WHERE unit_number = 'UNIT-005'; -- FAMU Campus area

UPDATE vehicles SET
    latitude = 30.5089,
    longitude = -84.2345,
    last_location_update = NOW() - interval '12 minutes'
WHERE unit_number = 'UNIT-006'; -- North Tallahassee area

UPDATE vehicles SET
    latitude = 30.3967,
    longitude = -84.3456,
    last_location_update = NOW() - interval '20 minutes'
WHERE unit_number = 'UNIT-007'; -- South Tallahassee area

UPDATE vehicles SET
    latitude = 30.4823,
    longitude = -84.2156,
    last_location_update = NOW() - interval '6 minutes'
WHERE unit_number = 'UNIT-008'; -- East Tallahassee area

UPDATE vehicles SET
    latitude = 30.4134,
    longitude = -84.3789,
    last_location_update = NOW() - interval '18 minutes'
WHERE unit_number = 'UNIT-009'; -- West Tallahassee area

UPDATE vehicles SET
    latitude = 30.4456,
    longitude = -84.2612,
    last_location_update = NOW() - interval '4 minutes'
WHERE unit_number = 'UNIT-010'; -- Downtown Tallahassee

-- Add speed and heading columns for enhanced tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'current_speed') THEN
        ALTER TABLE vehicles ADD COLUMN current_speed INTEGER; -- mph
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'heading') THEN
        ALTER TABLE vehicles ADD COLUMN heading INTEGER; -- 0-359 degrees
    END IF;
END $$;

-- Add realistic speed and heading data
UPDATE vehicles SET
    current_speed = CASE
        WHEN status = 'active' THEN FLOOR(random() * 45 + 15)::INTEGER -- 15-60 mph for active vehicles
        WHEN status = 'maintenance' THEN 0
        ELSE FLOOR(random() * 30 + 10)::INTEGER -- 10-40 mph for others
    END,
    heading = FLOOR(random() * 360)::INTEGER
WHERE latitude IS NOT NULL;

-- Create view for vehicle locations with additional info
CREATE OR REPLACE VIEW v_vehicle_locations AS
SELECT
    v.id,
    v.unit_number,
    v.make,
    v.model,
    v.year,
    v.license_plate,
    v.status,
    v.latitude,
    v.longitude,
    v.current_speed,
    v.heading,
    v.last_location_update,
    v.odometer,
    d.first_name || ' ' || d.last_name AS driver_name,
    EXTRACT(EPOCH FROM (NOW() - v.last_location_update)) / 60 AS minutes_since_update
FROM vehicles v
LEFT JOIN drivers d ON v.assigned_driver_id = d.id
WHERE v.latitude IS NOT NULL AND v.longitude IS NOT NULL;

COMMENT ON VIEW v_vehicle_locations IS 'Active vehicle locations with driver info and status';
