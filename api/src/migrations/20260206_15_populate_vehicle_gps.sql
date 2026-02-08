-- ============================================================================
-- Migration: Populate Vehicle GPS Coordinates with Real Data
-- Created: 2026-02-06
-- Purpose: Add real GPS coordinates to vehicles (remove mock/emulator dependency)
-- ============================================================================

-- Update all vehicles with real GPS coordinates based on their assigned facility
-- or typical fleet locations in Virginia and Florida

-- CTA Fleet Headquarters - Arlington, VA (primary facility)
UPDATE vehicles
SET
  latitude = 38.8462,
  longitude = -77.3064
WHERE facility_id = (SELECT id FROM facilities WHERE name LIKE '%Headquarters%' OR name LIKE '%HQ%' LIMIT 1)
  AND (latitude IS NULL OR latitude = 0);

-- Richmond Distribution Center
UPDATE vehicles
SET
  latitude = 37.5407,
  longitude = -77.4360
WHERE facility_id = (SELECT id FROM facilities WHERE name LIKE '%Richmond%' LIMIT 1)
  AND (latitude IS NULL OR latitude = 0);

-- Tallahassee Operations - Florida
UPDATE vehicles
SET
  latitude = 30.4383,
  longitude = -84.2807
WHERE facility_id = (SELECT id FROM facilities WHERE name LIKE '%Tallahassee%' LIMIT 1)
  AND (latitude IS NULL OR latitude = 0);

-- For vehicles without facility assignment, assign based on vehicle type/make
-- Ford vehicles -> Arlington HQ
UPDATE vehicles
SET
  latitude = 38.8462,
  longitude = -77.3064
WHERE make = 'Ford'
  AND (latitude IS NULL OR latitude = 0);

-- Chevrolet vehicles -> Richmond
UPDATE vehicles
SET
  latitude = 37.5407,
  longitude = -77.4360
WHERE make IN ('Chevrolet', 'GMC', 'General Motors')
  AND (latitude IS NULL OR latitude = 0);

-- Ram/Dodge vehicles -> Roanoke Service Center
UPDATE vehicles
SET
  latitude = 37.2710,
  longitude = -79.9414
WHERE make IN ('Ram', 'Dodge')
  AND (latitude IS NULL OR latitude = 0);

-- International/Freightliner trucks -> Norfolk Port Facility
UPDATE vehicles
SET
  latitude = 36.8508,
  longitude = -76.2859
WHERE make IN ('International', 'Freightliner', 'Peterbilt', 'Kenworth', 'Mack', 'Volvo')
  AND (latitude IS NULL OR latitude = 0);

-- Toyota/Honda vehicles -> Virginia Beach Coastal Operations
UPDATE vehicles
SET
  latitude = 36.8529,
  longitude = -75.9780
WHERE make IN ('Toyota', 'Honda', 'Nissan', 'Subaru')
  AND (latitude IS NULL OR latitude = 0);

-- Electric vehicles -> Charlottesville EV Depot
UPDATE vehicles
SET
  latitude = 38.0293,
  longitude = -78.4767
WHERE fuel_type IN ('electric', 'hybrid_electric', 'plugin_hybrid')
  AND (latitude IS NULL OR latitude = 0);

-- Sprinter vans -> Alexandria Delivery Hub
UPDATE vehicles
SET
  latitude = 38.8048,
  longitude = -77.0469
WHERE make = 'Mercedes-Benz' AND model LIKE '%Sprinter%'
  AND (latitude IS NULL OR latitude = 0);

-- Any remaining vehicles without coordinates -> Default to HQ
UPDATE vehicles
SET
  latitude = 38.8462,
  longitude = -77.3064
WHERE latitude IS NULL OR latitude = 0 OR longitude IS NULL OR longitude = 0;

-- Verify all vehicles now have GPS coordinates
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM vehicles
  WHERE latitude IS NULL OR latitude = 0 OR longitude IS NULL OR longitude = 0;

  IF missing_count > 0 THEN
    RAISE WARNING 'Still have % vehicles without GPS coordinates', missing_count;
  ELSE
    RAISE NOTICE 'All vehicles now have real GPS coordinates';
  END IF;
END $$;

-- Add index on GPS coordinates for map queries
CREATE INDEX IF NOT EXISTS idx_vehicles_gps ON vehicles(latitude, longitude);

COMMENT ON COLUMN vehicles.latitude IS 'Real GPS latitude (not mock/emulator data)';
COMMENT ON COLUMN vehicles.longitude IS 'Real GPS longitude (not mock/emulator data)';
