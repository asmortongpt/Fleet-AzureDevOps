BEGIN;

-- --------------------------------------------------------------------------
-- CTA tenant (Tallahassee, FL)
-- --------------------------------------------------------------------------
WITH inserted AS (
  INSERT INTO tenants (
    name,
    domain,
    billing_email,
    is_active,
    company_address,
    company_city,
    company_state,
    company_zip,
    company_country,
    feature_inventory,
    feature_procurement,
    feature_advanced_analytics,
    feature_telematics
  )
  VALUES (
    'Capital Transit Authority',
    'cta-fleet.local',
    'fleet-admin@capitaltechalliance.com',
    true,
    '1201 Fleet Ops Blvd',
    'Tallahassee',
    'FL',
    '32301',
    'US',
    true,
    true,
    true,
    true
  )
  ON CONFLICT (domain)
  DO UPDATE SET
    name = EXCLUDED.name,
    billing_email = EXCLUDED.billing_email,
    is_active = EXCLUDED.is_active
  RETURNING id
)
SELECT id FROM inserted
UNION ALL
SELECT id FROM tenants WHERE domain = 'cta-fleet.local';

-- Ensure RLS policies see the CTA tenant context
DO $$
DECLARE
  tid uuid;
BEGIN
  SELECT id INTO tid FROM tenants WHERE domain = 'cta-fleet.local' LIMIT 1;
  IF tid IS NOT NULL THEN
    PERFORM set_config('app.current_tenant_id', tid::text, true);
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- Core users (100 staff)
-- --------------------------------------------------------------------------
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE domain = 'cta-fleet.local' LIMIT 1
)
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, phone, is_active)
VALUES
  ((SELECT tenant_id FROM tenant), 'admin@capitaltechalliance.com', '$2b$12$7ybcjmhHpXg4YkWOUaqCQuXhytIINyUlOhM1Qwd1rCjqmJPFM45jS', 'Alex', 'Morgan', 'admin', '(850) 555-0101', true),
  ((SELECT tenant_id FROM tenant), 'fleetmanager@capitaltechalliance.com', '$2b$12$7ybcjmhHpXg4YkWOUaqCQuXhytIINyUlOhM1Qwd1rCjqmJPFM45jS', 'Jordan', 'Lee', 'fleet_manager', '(850) 555-0102', true),
  ((SELECT tenant_id FROM tenant), 'technician@capitaltechalliance.com', '$2b$12$7ybcjmhHpXg4YkWOUaqCQuXhytIINyUlOhM1Qwd1rCjqmJPFM45jS', 'Casey', 'Patel', 'technician', '(850) 555-0103', true),
  ((SELECT tenant_id FROM tenant), 'dispatcher@capitaltechalliance.com', '$2b$12$7ybcjmhHpXg4YkWOUaqCQuXhytIINyUlOhM1Qwd1rCjqmJPFM45jS', 'Riley', 'Nguyen', 'fleet_manager', '(850) 555-0104', true),
  ((SELECT tenant_id FROM tenant), 'viewer@capitaltechalliance.com', '$2b$12$7ybcjmhHpXg4YkWOUaqCQuXhytIINyUlOhM1Qwd1rCjqmJPFM45jS', 'Taylor', 'Brooks', 'viewer', '(850) 555-0105', true)
ON CONFLICT (email) DO NOTHING;

WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE domain = 'cta-fleet.local' LIMIT 1
)
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, phone, is_active)
SELECT
  tenant.tenant_id,
  'staff' || gs || '@capitaltechalliance.com',
  '$2b$12$7ybcjmhHpXg4YkWOUaqCQuXhytIINyUlOhM1Qwd1rCjqmJPFM45jS',
  (ARRAY['Avery','Quinn','Skylar','Parker','Jamie','Sam','Morgan','Jordan','Casey','Riley'])[((gs - 1) % 10) + 1],
  (ARRAY['Harper','Rivera','Reed','Morales','Griffin','Hayes','Patel','Nguyen','Brooks','Collins'])[((gs - 1) % 10) + 1],
  (ARRAY['driver','driver','technician','fleet_manager','viewer'])[((gs - 1) % 5) + 1],
  '(850) 555-' || LPAD((2000 + gs)::text, 4, '0'),
  true
FROM tenant
CROSS JOIN generate_series(1, 95) AS gs
ON CONFLICT (email) DO NOTHING;

-- --------------------------------------------------------------------------
-- Facilities
-- --------------------------------------------------------------------------
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE domain = 'cta-fleet.local' LIMIT 1
)
INSERT INTO facilities (
  tenant_id, name, facility_type, address, city, state, zip_code, latitude, longitude, phone, capacity,
  facility_code, service_bays_count, service_bays_occupied, ev_charging_stations_count
)
SELECT
  tenant.tenant_id,
  f.name,
  f.facility_type,
  f.address,
  f.city,
  f.state,
  f.zip,
  f.lat,
  f.lng,
  f.phone,
  f.capacity,
  f.code,
  f.bays,
  f.bays_occupied,
  f.ev
FROM tenant,
  (VALUES
    ('Central Operations Center', 'operations', '1201 Fleet Ops Blvd', 'Tallahassee', 'FL', '32301', 30.4383, -84.2807, '(850) 555-0111', 120, 'FAC-001', 12, 5, 6),
    ('North Maintenance Yard', 'maintenance', '4200 Northside Dr', 'Tallahassee', 'FL', '32303', 30.4867, -84.2485, '(850) 555-0112', 80, 'FAC-002', 10, 4, 2),
    ('East Charging Depot', 'charging', '3100 Capital Cir NE', 'Tallahassee', 'FL', '32308', 30.4660, -84.2302, '(850) 555-0113', 60, 'FAC-003', 6, 2, 10),
    ('South Logistics Hub', 'logistics', '9500 Apalachee Pkwy', 'Tallahassee', 'FL', '32311', 30.3930, -84.2164, '(850) 555-0114', 150, 'FAC-004', 8, 3, 4)
  ) AS f(name, facility_type, address, city, state, zip, lat, lng, phone, capacity, code, bays, bays_occupied, ev)
WHERE NOT EXISTS (
  SELECT 1 FROM facilities WHERE tenant_id = tenant.tenant_id
);

-- --------------------------------------------------------------------------
-- Drivers (50)
-- --------------------------------------------------------------------------
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE domain = 'cta-fleet.local' LIMIT 1
),
select_drivers AS (
  SELECT u.id, u.tenant_id, row_number() OVER () AS rn
  FROM users u
  WHERE u.tenant_id = (SELECT tenant_id FROM tenant)
    AND u.role = 'driver'
  ORDER BY u.created_at
  LIMIT 50
)
INSERT INTO drivers (
  tenant_id, user_id, license_number, license_state, license_expiration,
  hire_date, status, safety_score, city, state, zip_code
)
SELECT
  d.tenant_id,
  d.id,
  'FL-' || LPAD(d.rn::text, 8, '0'),
  'FL',
  (CURRENT_DATE + ((365 + (d.rn * 7) % 730) || ' days')::interval)::date,
  (CURRENT_DATE - ((d.rn * 15) || ' days')::interval)::date,
  CASE WHEN d.rn % 10 = 0 THEN 'on_leave' ELSE 'active' END,
  75 + (d.rn % 25),
  'Tallahassee',
  'FL',
  '32301'
FROM select_drivers d
ON CONFLICT (license_number) DO NOTHING;

-- --------------------------------------------------------------------------
-- Vehicles (50) with Tallahassee GPS
-- --------------------------------------------------------------------------
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE domain = 'cta-fleet.local' LIMIT 1
)
INSERT INTO vehicles (
  tenant_id, vin, make, model, year, license_plate, vehicle_type, fuel_type,
  status, odometer, latitude, longitude, registration_number, registration_state, health_score,
  battery_capacity_kwh, estimated_range_miles,
  assigned_driver_id, assigned_facility_id, purchase_date, purchase_price, current_value
)
SELECT
  tenant.tenant_id,
  '1HGBH41JXMN' || LPAD(gs::text, 6, '0'),
  (ARRAY['Ford','Chevrolet','RAM','GMC','Toyota'])[((gs - 1) % 5) + 1],
  (ARRAY['F-150','Express','ProMaster','Sierra','RAV4'])[((gs - 1) % 5) + 1],
  2017 + ((gs - 1) % 7),
  'FL-' || LPAD((10000 + gs)::text, 6, '0'),
  (ARRAY['truck','van','sedan','suv','bus'])[((gs - 1) % 5) + 1],
  (ARRAY['gasoline','diesel','gasoline','hybrid','electric'])[((gs - 1) % 5) + 1],
  (ARRAY['active','active','maintenance','out_of_service','active'])[((gs - 1) % 5) + 1],
  15000 + (gs * 1750) % 120000,
  30.44 + (random() * 0.06),
  -84.30 + (random() * 0.06),
  'REG-' || LPAD(gs::text, 6, '0'),
  'FL',
  72 + (gs % 24),
  CASE
    WHEN (ARRAY['gasoline','diesel','gasoline','hybrid','electric'])[((gs - 1) % 5) + 1] = 'electric' THEN 65 + ((gs * 2) % 24)
    ELSE NULL
  END,
  CASE
    WHEN (ARRAY['gasoline','diesel','gasoline','hybrid','electric'])[((gs - 1) % 5) + 1] = 'electric' THEN 220 + ((gs * 5) % 140)
    ELSE NULL
  END,
  (SELECT id FROM users WHERE tenant_id = tenant.tenant_id AND role = 'driver' ORDER BY random() LIMIT 1),
  (SELECT id FROM facilities WHERE tenant_id = tenant.tenant_id ORDER BY random() LIMIT 1),
  (CURRENT_DATE - ((gs * 40) % 2000) * INTERVAL '1 day')::date,
  28000 + (gs * 700) % 22000,
  18000 + (gs * 500) % 18000
FROM tenant
CROSS JOIN generate_series(1, 50) AS gs
WHERE NOT EXISTS (
  SELECT 1 FROM vehicles WHERE tenant_id = tenant.tenant_id AND vin LIKE '1HGBH41JXMN%'
);

-- Ensure health scores are populated for CTA vehicles
UPDATE vehicles v
SET health_score = COALESCE(v.health_score, s.health_score)
FROM (
  SELECT id, 72 + (ROW_NUMBER() OVER (ORDER BY created_at) % 24) AS health_score
  FROM vehicles
  WHERE tenant_id = (SELECT id FROM tenants WHERE domain = 'cta-fleet.local' LIMIT 1)
) s
WHERE v.id = s.id;

-- --------------------------------------------------------------------------
-- Fuel Transactions (seed per vehicle for telemetry)
-- --------------------------------------------------------------------------
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE domain = 'cta-fleet.local' LIMIT 1
),
vehicle_pool AS (
  SELECT v.id, v.tenant_id, v.fuel_type, v.odometer, row_number() OVER () AS rn
  FROM vehicles v
  WHERE v.tenant_id = (SELECT tenant_id FROM tenant)
),
driver_pool AS (
  SELECT id FROM drivers WHERE tenant_id = (SELECT tenant_id FROM tenant)
)
INSERT INTO fuel_transactions (
  tenant_id, vehicle_id, driver_id, transaction_date, gallons, price_per_gallon, fuel_type,
  location, latitude, longitude, ifta_jurisdiction, ifta_reportable, ifta_quarter, ifta_year,
  tank_capacity_gallons, mpg_calculated, mpg_expected, odometer_reading
)
SELECT
  v.tenant_id,
  v.id,
  (SELECT d.id FROM driver_pool d ORDER BY random() LIMIT 1),
  NOW() - ((gs * 7) || ' days')::interval,
  CASE WHEN v.fuel_type = 'electric' THEN 0.1 ELSE 8 + (v.rn % 12) + (gs % 4) END,
  CASE WHEN v.fuel_type = 'electric' THEN 0 ELSE 3.25 + ((v.rn % 5) * 0.15) END,
  v.fuel_type,
  'Tallahassee, FL',
  30.44 + (random() * 0.06),
  -84.30 + (random() * 0.06),
  'FL',
  true,
  EXTRACT(QUARTER FROM NOW())::int,
  EXTRACT(YEAR FROM NOW())::int,
  CASE WHEN v.fuel_type = 'electric' THEN 0 ELSE 14 + (v.rn % 9) END,
  CASE
    WHEN v.fuel_type = 'diesel' THEN 14 + (v.rn % 7)
    WHEN v.fuel_type = 'hybrid' THEN 28 + (v.rn % 10)
    WHEN v.fuel_type = 'electric' THEN 0
    ELSE 18 + (v.rn % 8)
  END,
  CASE
    WHEN v.fuel_type = 'diesel' THEN 16 + (v.rn % 6)
    WHEN v.fuel_type = 'hybrid' THEN 30 + (v.rn % 8)
    WHEN v.fuel_type = 'electric' THEN 0
    ELSE 20 + (v.rn % 6)
  END,
  v.odometer + (gs * 350)
FROM vehicle_pool v
CROSS JOIN generate_series(1, 3) AS gs
WHERE NOT EXISTS (
  SELECT 1 FROM fuel_transactions ft WHERE ft.vehicle_id = v.id
);

-- --------------------------------------------------------------------------
-- Assets: Heavy equipment (70)
-- --------------------------------------------------------------------------
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE domain = 'cta-fleet.local' LIMIT 1
),
new_assets AS (
  INSERT INTO assets (
    tenant_id, asset_number, asset_name, asset_type, description, manufacturer, model,
    serial_number, acquisition_date, acquisition_cost, current_location, facility_id,
    gps_latitude, gps_longitude, status, condition, created_by
  )
  SELECT
    tenant.tenant_id,
    'EQP-' || LPAD(gs::text, 4, '0'),
    (ARRAY['Excavator','Bulldozer','Crane','Loader','Backhoe','Dump Truck','Forklift'])[((gs - 1) % 7) + 1] || ' ' || gs,
    'equipment',
    'CTA heavy equipment asset',
    (ARRAY['Caterpillar','John Deere','Komatsu','Volvo','JCB'])[((gs - 1) % 5) + 1],
    'Series ' || ((gs - 1) % 5 + 1),
    'SN-EQP-' || LPAD(gs::text, 6, '0'),
    (CURRENT_DATE - ((gs * 37) % 2200) * INTERVAL '1 day')::date,
    75000 + (gs * 1200 % 110000),
    'Tallahassee, FL',
    (SELECT id FROM facilities WHERE tenant_id = tenant.tenant_id ORDER BY random() LIMIT 1),
    30.44 + (random() * 0.06),
    -84.30 + (random() * 0.06),
    CASE WHEN gs % 12 = 0 THEN 'maintenance' ELSE 'active' END,
    (ARRAY['excellent','good','good','fair'])[((gs - 1) % 4) + 1],
    (SELECT id FROM users WHERE tenant_id = tenant.tenant_id ORDER BY random() LIMIT 1)
  FROM tenant
  CROSS JOIN generate_series(1, 70) AS gs
  WHERE NOT EXISTS (
    SELECT 1 FROM assets WHERE tenant_id = tenant.tenant_id AND asset_type = 'equipment'
  )
  RETURNING id, tenant_id
)
INSERT INTO heavy_equipment (
  tenant_id, asset_id, equipment_type, model_year, engine_hours, engine_type,
  weight_capacity_lbs, load_capacity, reach_distance_ft, inspection_required,
  last_inspection_date, next_inspection_date, certification_number,
  requires_certification, operator_license_type, metadata, created_by
)
SELECT
  a.tenant_id,
  a.id,
  (ARRAY['excavator','bulldozer','crane','loader','backhoe','dump_truck','forklift'])[((ROW_NUMBER() OVER ()) - 1) % 7 + 1],
  2016 + ((ROW_NUMBER() OVER ()) % 8),
  1200 + ((ROW_NUMBER() OVER ()) * 37 % 2200),
  (ARRAY['diesel','diesel','hybrid'])[((ROW_NUMBER() OVER ()) - 1) % 3 + 1],
  12000 + ((ROW_NUMBER() OVER ()) * 200 % 16000),
  8000 + ((ROW_NUMBER() OVER ()) * 150 % 9000),
  18 + ((ROW_NUMBER() OVER ()) % 12),
  true,
  CURRENT_DATE - ((ROW_NUMBER() OVER ()) % 120) * INTERVAL '1 day',
  CURRENT_DATE + ((ROW_NUMBER() OVER ()) % 180) * INTERVAL '1 day',
  'CTA-CERT-' || LPAD((ROW_NUMBER() OVER ())::text, 4, '0'),
  true,
  'Class A',
  jsonb_build_object('inspector','CTA Safety'),
  (SELECT id FROM users WHERE tenant_id = a.tenant_id ORDER BY random() LIMIT 1)
FROM new_assets a;

-- --------------------------------------------------------------------------
-- Assets: Tools / small equipment (100)
-- --------------------------------------------------------------------------
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE domain = 'cta-fleet.local' LIMIT 1
)
INSERT INTO assets (
  tenant_id, asset_number, asset_name, asset_type, description, manufacturer, model,
  serial_number, acquisition_date, acquisition_cost, current_location, facility_id,
  gps_latitude, gps_longitude, status, condition, created_by
)
SELECT
  tenant.tenant_id,
  'TOOL-' || LPAD(gs::text, 4, '0'),
  (ARRAY['Generator','Welder','Compressor','Light Tower','Pressure Washer','Hydraulic Jack','Saw','Pump'])[((gs - 1) % 8) + 1] || ' ' || gs,
  'tool',
  'CTA portable asset',
  (ARRAY['Milwaukee','DeWalt','Honda','Caterpillar','Makita'])[((gs - 1) % 5) + 1],
  'Model ' || ((gs - 1) % 6 + 1),
  'SN-TOOL-' || LPAD(gs::text, 6, '0'),
  (CURRENT_DATE - ((gs * 21) % 1400) * INTERVAL '1 day')::date,
  1200 + (gs * 35 % 5000),
  'Tallahassee, FL',
  (SELECT id FROM facilities WHERE tenant_id = tenant.tenant_id ORDER BY random() LIMIT 1),
  30.44 + (random() * 0.06),
  -84.30 + (random() * 0.06),
  CASE WHEN gs % 10 = 0 THEN 'maintenance' ELSE 'active' END,
  (ARRAY['excellent','good','good','fair'])[((gs - 1) % 4) + 1],
  (SELECT id FROM users WHERE tenant_id = tenant.tenant_id ORDER BY random() LIMIT 1)
FROM tenant
CROSS JOIN generate_series(1, 100) AS gs
WHERE NOT EXISTS (
  SELECT 1 FROM assets WHERE tenant_id = tenant.tenant_id AND asset_type = 'tool'
);

COMMIT;
