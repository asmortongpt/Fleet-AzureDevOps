-- ============================================================================
-- Capital City Fleet Solutions - Update Vehicles with Tallahassee Data
-- ============================================================================

-- Update first 23 vehicles with complete Tallahassee data
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
UPDATE vehicles v
SET
  -- Tallahassee GPS coordinates (varied locations across the city)
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
    WHEN 0 THEN -84.2806
    WHEN 1 THEN -84.2981
    WHEN 2 THEN -84.2873
    WHEN 3 THEN -84.2143
    WHEN 4 THEN -84.2516
    WHEN 5 THEN -84.2165
    WHEN 6 THEN -84.2532
    WHEN 7 THEN -84.2852
    WHEN 8 THEN -84.2721
    WHEN 9 THEN -84.2735
  END,
  -- Tallahassee addresses matching GPS coordinates
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
  -- Assign drivers to vehicles
  assigned_driver_id = d.id,
  -- Service dates (last service 30-90 days ago, next service 30-90 days from now)
  last_service_date = NOW() - (INTERVAL '1 day' * (30 + (vi.rn * 2))),
  next_service_date = NOW() + (INTERVAL '1 day' * (30 + (vi.rn * 3))),
  next_service_mileage = odometer + (3000 + (vi.rn * 200)),
  -- Purchase info based on vehicle age
  purchase_date = NOW() - (INTERVAL '1 year' * (GREATEST(year - 2015, 0))),
  purchase_price = CASE type
    WHEN 'van' THEN 42000 + (vi.rn * 500)
    WHEN 'truck' THEN 55000 + (vi.rn * 800)
    WHEN 'bus' THEN 85000 + (vi.rn * 1200)
    ELSE 35000 + (vi.rn * 400)
  END::numeric(12,2),
  current_value = CASE type
    WHEN 'van' THEN 32000 + (vi.rn * 300)
    WHEN 'truck' THEN 42000 + (vi.rn * 600)
    WHEN 'bus' THEN 65000 + (vi.rn * 900)
    ELSE 28000 + (vi.rn * 300)
  END::numeric(12,2),
  -- Insurance
  insurance_policy_number = 'TLH-FL-' || LPAD(vi.rn::text, 5, '0'),
  insurance_expiry_date = NOW() + INTERVAL '6 months',
  -- Fleet identification
  name = CASE
    WHEN make = 'Ford' AND model LIKE '%Transit%' THEN 'Capital City Transit ' || vi.rn
    WHEN make = 'Chevrolet' AND model LIKE '%Silverado%' THEN 'Capital City Truck ' || vi.rn
    WHEN make = 'RAM' THEN 'Capital City Van ' || vi.rn
    WHEN make = 'Toyota' THEN 'Capital City Utility ' || vi.rn
    ELSE 'Capital City Fleet ' || vi.rn
  END,
  number = 'TLH-' || LPAD(vi.rn::text, 3, '0'),
  license_plate = 'FL-TLH' || LPAD(vi.rn::text, 3, '0'),
  updated_at = NOW()
FROM vehicle_ids vi
LEFT JOIN driver_ids d ON d.rn = vi.rn
WHERE v.id = vi.id;

-- Verification
SELECT
  'VEHICLES UPDATED' as status,
  COUNT(*) as total_updated,
  COUNT(CASE WHEN latitude IS NOT NULL THEN 1 END) as with_gps,
  COUNT(DISTINCT assigned_driver_id) FILTER (WHERE assigned_driver_id IS NOT NULL) as with_drivers,
  COUNT(CASE WHEN last_service_date IS NOT NULL THEN 1 END) as with_service_dates
FROM vehicles
WHERE number LIKE 'TLH-%';

\echo '\nSample Updated Vehicles:'
SELECT
  number,
  name,
  location_address,
  assigned_driver_id IS NOT NULL as has_driver,
  last_service_date IS NOT NULL as has_service_date
FROM vehicles
WHERE number LIKE 'TLH-%'
ORDER BY number
LIMIT 5;
