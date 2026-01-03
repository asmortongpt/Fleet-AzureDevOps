-- ============================================================================
-- Capital City Fleet Solutions - Tallahassee, Florida
-- Complete Data Update Script
-- ============================================================================

BEGIN;

-- Get driver IDs for assignment (first 23 drivers)
WITH driver_ids AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM drivers
  LIMIT 23
),
vehicle_ids AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM vehicles
  LIMIT 23
)
-- Update vehicles with Tallahassee locations, drivers, and service data
UPDATE vehicles v
SET
  -- Tallahassee GPS coordinates (varied locations)
  latitude = CASE (vi.rn - 1) % 10
    WHEN 0 THEN 30.4383  -- Downtown Tallahassee
    WHEN 1 THEN 30.4518  -- FSU Campus
    WHEN 2 THEN 30.4197  -- FAMU Campus
    WHEN 3 THEN 30.5089  -- Innovation Park
    WHEN 4 THEN 30.4782  -- Midtown
    WHEN 5 THEN 30.3935  -- Southwood
    WHEN 6 THEN 30.5244  -- Killearn
    WHEN 7 THEN 30.4245  -- Lake Ella
    WHEN 8 THEN 30.4615  -- Railroad Square
    WHEN 9 THEN 30.4397  -- Cascades Park
  END,
  longitude = CASE (vi.rn - 1) % 10
    WHEN 0 THEN -84.2806  -- Downtown Tallahassee
    WHEN 1 THEN -84.2981  -- FSU Campus
    WHEN 2 THEN -84.2873  -- FAMU Campus
    WHEN 3 THEN -84.2143  -- Innovation Park
    WHEN 4 THEN -84.2516  -- Midtown
    WHEN 5 THEN -84.2165  -- Southwood
    WHEN 6 THEN -84.2532  -- Killearn
    WHEN 7 THEN -84.2852  -- Lake Ella
    WHEN 8 THEN -84.2721  -- Railroad Square
    WHEN 9 THEN -84.2735  -- Cascades Park
  END,
  -- Tallahassee addresses
  location_address = CASE (vi.rn - 1) % 10
    WHEN 0 THEN '1245 Monroe Street, Tallahassee, FL 32301'
    WHEN 1 THEN '600 W College Ave, Tallahassee, FL 32306'
    WHEN 2 THEN '1500 Wahnish Way, Tallahassee, FL 32307'
    WHEN 3 THEN '2010 Levy Ave, Tallahassee, FL 32310'
    WHEN 4 THEN '1940 N Monroe St, Tallahassee, FL 32303'
    WHEN 5 THEN '3750 Capital Cir SE, Tallahassee, FL 32301'
    WHEN 6 THEN '2810 Sharer Rd, Tallahassee, FL 32312'
    WHEN 7 THEN '580 N Woodward Ave, Tallahassee, FL 32303'
    WHEN 8 THEN '922 Railroad Ave, Tallahassee, FL 32310'
    WHEN 9 THEN '1001 S Gadsden St, Tallahassee, FL 32301'
  END,
  -- Assign drivers
  assigned_driver_id = d.id,
  -- Service dates (last 30-90 days, next 30-90 days)
  last_service_date = NOW() - (INTERVAL '1 day' * (30 + (vi.rn * 2))),
  next_service_date = NOW() + (INTERVAL '1 day' * (30 + (vi.rn * 3))),
  next_service_mileage = odometer + (3000 + (vi.rn * 200)),
  -- Purchase info
  purchase_date = NOW() - (INTERVAL '1 year' * (year - 2015)),
  purchase_price = CASE type
    WHEN 'van' THEN 42000 + (vi.rn * 500)
    WHEN 'truck' THEN 55000 + (vi.rn * 800)
    WHEN 'bus' THEN 85000 + (vi.rn * 1200)
    ELSE 35000 + (vi.rn * 400)
  END,
  current_value = CASE type
    WHEN 'van' THEN 32000 + (vi.rn * 300)
    WHEN 'truck' THEN 42000 + (vi.rn * 600)
    WHEN 'bus' THEN 65000 + (vi.rn * 900)
    ELSE 28000 + (vi.rn * 300)
  END,
  -- Insurance
  insurance_policy_number = 'TLH-FL-' || LPAD(vi.rn::text, 5, '0'),
  insurance_expiry_date = NOW() + INTERVAL '6 months',
  -- Update names to reflect Tallahassee fleet
  name = CASE
    WHEN make = 'Ford' AND model LIKE '%Transit%' THEN 'Transit Van #' || vi.rn
    WHEN make = 'Chevrolet' AND model LIKE '%Silverado%' THEN 'Silverado Truck #' || vi.rn
    WHEN make = 'RAM' THEN 'RAM Service Van #' || vi.rn
    WHEN make = 'Toyota' THEN 'Toyota Utility #' || vi.rn
    ELSE make || ' #' || vi.rn
  END,
  number = 'TLH-' || LPAD(vi.rn::text, 3, '0'),
  -- Florida license plates
  license_plate = 'FL-TLH' || LPAD(vi.rn::text, 3, '0'),
  updated_at = NOW()
FROM vehicle_ids vi
LEFT JOIN driver_ids d ON d.rn = vi.rn
WHERE v.id = vi.id;

-- Update routes with Tallahassee-specific information
UPDATE routes
SET
  name = CASE (ROW_NUMBER() OVER (ORDER BY created_at) - 1) % 18
    WHEN 0 THEN 'Downtown Loop'
    WHEN 1 THEN 'FSU Campus Shuttle'
    WHEN 2 THEN 'FAMU Campus Route'
    WHEN 3 THEN 'Medical District Circuit'
    WHEN 4 THEN 'Southwood Express'
    WHEN 5 THEN 'Capital Circle Route'
    WHEN 6 THEN 'Killearn Estates Service'
    WHEN 7 THEN 'Midtown Connector'
    WHEN 8 THEN 'Innovation Park Loop'
    WHEN 9 THEN 'State Capitol Route'
    WHEN 10 THEN 'Tallahassee Mall Circuit'
    WHEN 11 THEN 'Airport Express'
    WHEN 12 THEN 'Hospital District Route'
    WHEN 13 THEN 'University Loop'
    WHEN 14 THEN 'Government Center Circuit'
    WHEN 15 THEN 'Railroad Square Arts Route'
    WHEN 16 THEN 'Cascades Park Connector'
    WHEN 17 THEN 'Lake Ella Community Route'
  END,
  description = 'Tallahassee city route serving local businesses and residents',
  start_location = '1245 Monroe Street, Tallahassee, FL 32301',
  end_location = CASE (ROW_NUMBER() OVER (ORDER BY created_at) - 1) % 5
    WHEN 0 THEN '600 W College Ave, Tallahassee, FL 32306'
    WHEN 1 THEN '1500 Wahnish Way, Tallahassee, FL 32307'
    WHEN 2 THEN '2010 Levy Ave, Tallahassee, FL 32310'
    WHEN 3 THEN '1940 N Monroe St, Tallahassee, FL 32303'
    WHEN 4 THEN '3750 Capital Cir SE, Tallahassee, FL 32301'
  END,
  start_lat = 30.4383,
  start_lng = -84.2806,
  end_lat = CASE (ROW_NUMBER() OVER (ORDER BY created_at) - 1) % 5
    WHEN 0 THEN 30.4518
    WHEN 1 THEN 30.4197
    WHEN 2 THEN 30.5089
    WHEN 3 THEN 30.4782
    WHEN 4 THEN 30.3935
  END,
  end_lng = CASE (ROW_NUMBER() OVER (ORDER BY created_at) - 1) % 5
    WHEN 0 THEN -84.2981
    WHEN 1 THEN -84.2873
    WHEN 2 THEN -84.2143
    WHEN 3 THEN -84.2516
    WHEN 4 THEN -84.2165
  END,
  updated_at = NOW()
WHERE id IN (SELECT id FROM routes ORDER BY created_at LIMIT 18);

-- Update drivers with Tallahassee phone numbers (850 area code)
UPDATE drivers
SET
  phone = '850-' || LPAD(((ROW_NUMBER() OVER (ORDER BY created_at)) * 17 + 100)::text, 3, '0') || '-' || LPAD(((ROW_NUMBER() OVER (ORDER BY created_at)) * 23 + 1000)::text, 4, '0'),
  updated_at = NOW()
WHERE id IN (SELECT id FROM drivers ORDER BY created_at LIMIT 30);

COMMIT;

-- Verification queries
SELECT
  COUNT(*) as vehicles_with_gps,
  COUNT(DISTINCT assigned_driver_id) as vehicles_with_drivers,
  COUNT(CASE WHEN last_service_date IS NOT NULL THEN 1 END) as vehicles_with_service_dates
FROM vehicles;

SELECT
  COUNT(*) as tallahassee_routes
FROM routes
WHERE name LIKE '%FSU%' OR name LIKE '%FAMU%' OR name LIKE '%Tallahassee%' OR name LIKE '%Downtown%';

SELECT
  COUNT(*) as drivers_with_850_phone
FROM drivers
WHERE phone LIKE '850-%';
