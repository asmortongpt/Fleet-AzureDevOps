-- Migration: Seed CTA Demo Tenant (Tallahassee) - DB-backed data (idempotent)
-- Created: 2026-02-05
-- Purpose:
--   Create a realistic CTA (Tallahassee) demo tenant dataset with:
--   - ~50 vehicles
--   - ~100 staff/users
--   - ~70 heavy equipment (assets + heavy_equipment)
--   - ~100 small items (assets: generators, welders, tools, etc.)
--
-- Notes:
--   - Idempotent: safe to re-run.
--   - Uses deterministic, human-readable identifiers (UNIT-####, HEQ-####, SMI-####).
--   - Password hash corresponds to `TestPassword123!` (bcrypt, cost=12).

-- ============================================================================
-- 0) Resolve CTA Tenant
-- ============================================================================
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
)
SELECT tenant_id FROM cta;

-- ============================================================================
-- 1) Seed Staff (Users) to 100
-- ============================================================================
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
existing AS (
  SELECT COUNT(*)::int AS c
  FROM users
  WHERE tenant_id = (SELECT tenant_id FROM cta)
),
missing AS (
  SELECT GREATEST(0, 100 - (SELECT c FROM existing))::int AS n,
         (SELECT c FROM existing)::int AS start_idx
),
series AS (
  SELECT generate_series(1, (SELECT n FROM missing)) AS seq
)
INSERT INTO users (
  tenant_id,
  email,
  password_hash,
  first_name,
  last_name,
  phone,
  role,
  is_active,
  provider
)
SELECT
  (SELECT tenant_id FROM cta),
  -- Unique and clearly demo-scoped
  'cta.staff.' || lpad(((SELECT start_idx FROM missing) + s.seq)::text, 3, '0') || '@cta-fleet.local',
  '$2b$12$.N3w8k/dGtbbLVChW.xX7OH7f3dZ8.v34QqKaDGkzSEj6I8pWZhEO',
  'CTA' || lpad(((SELECT start_idx FROM missing) + s.seq)::text, 3, '0'),
  CASE
    WHEN s.seq % 11 = 0 THEN 'Rivera'
    WHEN s.seq % 11 = 1 THEN 'Patel'
    WHEN s.seq % 11 = 2 THEN 'Nguyen'
    WHEN s.seq % 11 = 3 THEN 'Brooks'
    WHEN s.seq % 11 = 4 THEN 'Johnson'
    WHEN s.seq % 11 = 5 THEN 'Williams'
    WHEN s.seq % 11 = 6 THEN 'Martinez'
    WHEN s.seq % 11 = 7 THEN 'Robinson'
    WHEN s.seq % 11 = 8 THEN 'Gonzalez'
    WHEN s.seq % 11 = 9 THEN 'Davis'
    ELSE 'Lee'
  END,
  '(850) 555-' || lpad(((1000 + s.seq) % 10000)::text, 4, '0'),
  CASE
    WHEN s.seq <= 35 THEN 'Driver'::user_role
    WHEN s.seq <= 45 THEN 'Mechanic'::user_role
    WHEN s.seq <= 57 THEN 'Dispatcher'::user_role
    WHEN s.seq <= 65 THEN 'Supervisor'::user_role
    WHEN s.seq <= 72 THEN 'Manager'::user_role
    ELSE 'Viewer'::user_role
  END,
  true,
  'local'
FROM series s
WHERE NOT EXISTS (
  SELECT 1
  FROM users u
  WHERE u.tenant_id = (SELECT tenant_id FROM cta)
    AND u.email = ('cta.staff.' || lpad(((SELECT start_idx FROM missing) + s.seq)::text, 3, '0') || '@cta-fleet.local')
);

-- ============================================================================
-- 2) Seed Drivers to 40 (derived from users)
-- ============================================================================
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
existing AS (
  SELECT COUNT(*)::int AS c
  FROM drivers
  WHERE tenant_id = (SELECT tenant_id FROM cta)
),
missing AS (
  SELECT GREATEST(0, 40 - (SELECT c FROM existing))::int AS n,
         (SELECT c FROM existing)::int AS start_idx
),
candidates AS (
  SELECT
    u.id AS user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    row_number() OVER (ORDER BY u.created_at ASC) AS rn
  FROM users u
  WHERE u.tenant_id = (SELECT tenant_id FROM cta)
    AND u.role = 'Driver'::user_role
    AND NOT EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = u.id)
),
to_insert AS (
  SELECT *
  FROM candidates
  WHERE rn <= (SELECT n FROM missing)
)
INSERT INTO drivers (
  tenant_id,
  user_id,
  first_name,
  last_name,
  email,
  phone,
  employee_number,
  license_number,
  license_state,
  license_expiry_date,
  cdl,
  cdl_class,
  status,
  hire_date,
  performance_score,
  metadata
)
SELECT
  (SELECT tenant_id FROM cta),
  t.user_id,
  t.first_name,
  t.last_name,
  t.email,
  COALESCE(t.phone, '(850) 555-0000'),
  'CTA-D' || lpad(((SELECT start_idx FROM missing) + t.rn)::text, 4, '0'),
  'FLDL' || lpad(((SELECT start_idx FROM missing) + t.rn)::text, 6, '0'),
  'FL',
  NOW() + INTERVAL '2 years',
  true,
  CASE WHEN (t.rn % 3) = 0 THEN 'A' WHEN (t.rn % 3) = 1 THEN 'B' ELSE 'C' END,
  'active'::driver_status,
  NOW() - INTERVAL '2 years',
  85 + ((t.rn % 15))::numeric,
  jsonb_build_object('seed', 'cta_demo', 'city', 'Tallahassee', 'state', 'FL')
FROM to_insert t;

-- ============================================================================
-- 3) Seed Vehicles to 50
-- ============================================================================
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
existing AS (
  SELECT COUNT(*)::int AS c
  FROM vehicles
  WHERE tenant_id = (SELECT tenant_id FROM cta)
),
missing AS (
  SELECT GREATEST(0, 50 - (SELECT c FROM existing))::int AS n
),
max_unit AS (
  SELECT COALESCE(MAX((regexp_match(number, 'UNIT-(\\d+)$'))[1]::int), 0) AS max_n
  FROM vehicles
  WHERE tenant_id = (SELECT tenant_id FROM cta)
),
series AS (
  SELECT generate_series(1, (SELECT n FROM missing)) AS seq
),
unit_numbers AS (
  SELECT (SELECT max_n FROM max_unit) + s.seq AS unit_no
  FROM series s
),
facility AS (
  SELECT id AS facility_id
  FROM facilities
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY created_at ASC
  LIMIT 1
),
driver_list AS (
  SELECT id, row_number() OVER (ORDER BY created_at ASC) AS rn
  FROM drivers
  WHERE tenant_id = (SELECT tenant_id FROM cta)
),
driver_count AS (
  SELECT COUNT(*)::int AS c FROM driver_list
),
assigned AS (
  SELECT
    u.unit_no,
    (SELECT facility_id FROM facility) AS facility_id,
    CASE
      WHEN (SELECT c FROM driver_count) > 0 THEN (
        SELECT id
        FROM driver_list
        WHERE rn = 1 + ((u.unit_no - 1) % (SELECT c FROM driver_count))
        LIMIT 1
      )
      ELSE NULL::uuid
    END AS driver_id
  FROM unit_numbers u
)
INSERT INTO vehicles (
  tenant_id,
  vin,
  name,
  number,
  type,
  make,
  model,
  year,
  license_plate,
  status,
  fuel_type,
  fuel_level,
  odometer,
  latitude,
  longitude,
  location_address,
  last_service_date,
  next_service_date,
  next_service_mileage,
  purchase_date,
  purchase_price,
  current_value,
  insurance_policy_number,
  insurance_expiry_date,
  assigned_driver_id,
  assigned_facility_id,
  metadata,
  is_active
)
SELECT
  (SELECT tenant_id FROM cta),
  'CTA' || lpad(a.unit_no::text, 14, '0'),
  format('CTA Fleet Unit %s', lpad(a.unit_no::text, 4, '0')),
  'UNIT-' || lpad(a.unit_no::text, 4, '0'),
  CASE
    WHEN (a.unit_no % 5) = 0 THEN 'truck'::vehicle_type
    WHEN (a.unit_no % 5) = 1 THEN 'van'::vehicle_type
    WHEN (a.unit_no % 5) = 2 THEN 'suv'::vehicle_type
    WHEN (a.unit_no % 5) = 3 THEN 'sedan'::vehicle_type
    ELSE 'construction'::vehicle_type
  END,
  CASE
    WHEN (a.unit_no % 6) = 0 THEN 'Ford'
    WHEN (a.unit_no % 6) = 1 THEN 'Chevrolet'
    WHEN (a.unit_no % 6) = 2 THEN 'GMC'
    WHEN (a.unit_no % 6) = 3 THEN 'RAM'
    WHEN (a.unit_no % 6) = 4 THEN 'Toyota'
    ELSE 'Nissan'
  END,
  CASE
    WHEN (a.unit_no % 6) = 0 THEN 'F-150'
    WHEN (a.unit_no % 6) = 1 THEN 'Express'
    WHEN (a.unit_no % 6) = 2 THEN 'Sierra'
    WHEN (a.unit_no % 6) = 3 THEN 'ProMaster'
    WHEN (a.unit_no % 6) = 4 THEN 'RAV4'
    ELSE 'NV200'
  END,
  2019 + ((a.unit_no % 7))::int,
  'CTA' || lpad(a.unit_no::text, 4, '0'),
  CASE
    WHEN (a.unit_no % 10) = 0 THEN 'maintenance'::vehicle_status
    WHEN (a.unit_no % 10) = 1 THEN 'service'::vehicle_status
    WHEN (a.unit_no % 10) = 2 THEN 'idle'::vehicle_status
    ELSE 'active'::vehicle_status
  END,
  CASE
    WHEN (a.unit_no % 9) = 0 THEN 'diesel'::fuel_type
    WHEN (a.unit_no % 9) = 1 THEN 'electric'::fuel_type
    ELSE 'gasoline'::fuel_type
  END,
  55 + ((a.unit_no % 45))::numeric,
  12000 + (a.unit_no * 337),
  -- Tight cluster around Tallahassee center with a slight grid to show markers clearly
  30.4383 + (((a.unit_no % 10) - 5) * 0.003)::numeric,
  -84.2807 + ((((a.unit_no / 10) % 10) - 5) * 0.003)::numeric,
  'Tallahassee, FL',
  NOW() - INTERVAL '90 days',
  NOW() + INTERVAL '90 days',
  15000 + (a.unit_no * 400),
  NOW() - INTERVAL '5 years' + ((a.unit_no % 36) * INTERVAL '30 days'),
  28000 + ((a.unit_no % 10) * 2500),
  19000 + ((a.unit_no % 10) * 1750),
  'CTA-POL-' || lpad(a.unit_no::text, 6, '0'),
  NOW() + INTERVAL '180 days',
  a.driver_id,
  a.facility_id,
  jsonb_build_object('seed', 'cta_demo', 'city', 'Tallahassee', 'state', 'FL', 'unit', a.unit_no),
  true
FROM assigned a
WHERE NOT EXISTS (
  SELECT 1
  FROM vehicles v
  WHERE v.tenant_id = (SELECT tenant_id FROM cta)
    AND v.number = ('UNIT-' || lpad(a.unit_no::text, 4, '0'))
);

-- ============================================================================
-- 4) Seed Heavy Equipment to 70 (assets + heavy_equipment)
-- ============================================================================
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
existing_he AS (
  SELECT COUNT(*)::int AS c
  FROM heavy_equipment
  WHERE tenant_id = (SELECT tenant_id FROM cta)
),
missing_he AS (
  SELECT GREATEST(0, 70 - (SELECT c FROM existing_he))::int AS n
),
existing_assets AS (
  SELECT COUNT(*)::int AS c
  FROM assets
  WHERE tenant_id = (SELECT tenant_id FROM cta)
    AND asset_number LIKE 'HEQ-%'
),
missing_assets AS (
  SELECT (SELECT n FROM missing_he)::int AS n,
         (SELECT c FROM existing_assets)::int AS start_idx
),
series AS (
  SELECT generate_series(1, (SELECT n FROM missing_assets)) AS seq
),
facility AS (
  SELECT id AS facility_id
  FROM facilities
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY created_at ASC
  LIMIT 1
),
inserted_assets AS (
  INSERT INTO assets (
    tenant_id,
    asset_number,
    name,
    description,
    type,
    category,
    manufacturer,
    model,
    serial_number,
    purchase_date,
    purchase_price,
    current_value,
    status,
    assigned_facility_id,
    condition,
    notes,
    metadata
  )
  SELECT
    (SELECT tenant_id FROM cta),
    'HEQ-' || lpad(((SELECT start_idx FROM missing_assets) + s.seq)::text, 4, '0'),
    CASE
      WHEN (s.seq % 10) = 0 THEN 'Excavator'
      WHEN (s.seq % 10) = 1 THEN 'Bulldozer'
      WHEN (s.seq % 10) = 2 THEN 'Wheel Loader'
      WHEN (s.seq % 10) = 3 THEN 'Backhoe Loader'
      WHEN (s.seq % 10) = 4 THEN 'Skid Steer'
      WHEN (s.seq % 10) = 5 THEN 'Road Roller'
      WHEN (s.seq % 10) = 6 THEN 'Asphalt Paver'
      WHEN (s.seq % 10) = 7 THEN 'Crane Truck'
      WHEN (s.seq % 10) = 8 THEN 'Bucket Truck'
      ELSE 'Forklift'
    END || ' #' || ((SELECT start_idx FROM missing_assets) + s.seq)::text,
    'CTA heavy equipment (Tallahassee demo fleet)',
    'equipment',
    CASE
      WHEN (s.seq % 4) = 0 THEN 'construction'
      WHEN (s.seq % 4) = 1 THEN 'roads'
      WHEN (s.seq % 4) = 2 THEN 'utilities'
      ELSE 'logistics'
    END,
    CASE
      WHEN (s.seq % 6) = 0 THEN 'Caterpillar'
      WHEN (s.seq % 6) = 1 THEN 'John Deere'
      WHEN (s.seq % 6) = 2 THEN 'Volvo'
      WHEN (s.seq % 6) = 3 THEN 'Komatsu'
      WHEN (s.seq % 6) = 4 THEN 'Bobcat'
      ELSE 'Toyota'
    END,
    CASE
      WHEN (s.seq % 6) = 0 THEN '320 GC'
      WHEN (s.seq % 6) = 1 THEN '750K'
      WHEN (s.seq % 6) = 2 THEN 'L60H'
      WHEN (s.seq % 6) = 3 THEN 'D65'
      WHEN (s.seq % 6) = 4 THEN 'S650'
      ELSE '8FGU25'
    END,
    'CTA-HEQ-' || lpad(((SELECT start_idx FROM missing_assets) + s.seq)::text, 6, '0'),
    NOW() - INTERVAL '6 years' + ((s.seq % 48) * INTERVAL '30 days'),
    75000 + ((s.seq % 12) * 25000),
    45000 + ((s.seq % 12) * 18000),
    'active',
    (SELECT facility_id FROM facility),
    CASE WHEN (s.seq % 5) = 0 THEN 'excellent' WHEN (s.seq % 5) = 1 THEN 'good' WHEN (s.seq % 5) = 2 THEN 'fair' ELSE 'good' END,
    'Seeded for CTA demo',
    jsonb_build_object(
      'latitude', 30.4383 + (((s.seq % 10) - 5) * 0.004),
      'longitude', -84.2807 + ((((s.seq / 10) % 10) - 5) * 0.004),
      'city', 'Tallahassee',
      'state', 'FL',
      'seed', 'cta_demo'
    )
  FROM series s
  WHERE NOT EXISTS (
    SELECT 1
    FROM assets a
    WHERE a.tenant_id = (SELECT tenant_id FROM cta)
      AND a.asset_number = ('HEQ-' || lpad(((SELECT start_idx FROM missing_assets) + s.seq)::text, 4, '0'))
  )
  RETURNING id AS asset_id, tenant_id, asset_number, name
)
INSERT INTO heavy_equipment (
  tenant_id,
  asset_id,
  equipment_type,
  model_year,
  engine_hours,
  engine_type,
  inspection_required,
  last_inspection_date,
  next_inspection_date,
  certification_number,
  requires_certification,
  operator_license_type,
  metadata
)
SELECT
  ia.tenant_id,
  ia.asset_id,
  CASE
    WHEN ia.name ILIKE '%excavator%' THEN 'excavator'
    WHEN ia.name ILIKE '%bulldozer%' THEN 'bulldozer'
    WHEN ia.name ILIKE '%loader%' THEN 'loader'
    WHEN ia.name ILIKE '%backhoe%' THEN 'backhoe'
    WHEN ia.name ILIKE '%skid%' THEN 'skid_steer'
    WHEN ia.name ILIKE '%roller%' THEN 'roller'
    WHEN ia.name ILIKE '%paver%' THEN 'paver'
    WHEN ia.name ILIKE '%crane%' THEN 'crane'
    WHEN ia.name ILIKE '%bucket%' THEN 'bucket_truck'
    WHEN ia.name ILIKE '%forklift%' THEN 'forklift'
    ELSE 'equipment'
  END,
  EXTRACT(YEAR FROM (NOW() - INTERVAL '4 years'))::int,
  600 + (ABS(('x' || substr(md5(ia.asset_number), 1, 8))::bit(32)::int) % 2000),
  'diesel',
  true,
  (CURRENT_DATE - INTERVAL '90 days')::date,
  (CURRENT_DATE + INTERVAL '275 days')::date,
  'CTA-CERT-' || replace(ia.asset_number, 'HEQ-', ''),
  true,
  'Class A',
  jsonb_build_object('seed', 'cta_demo', 'asset_number', ia.asset_number)
FROM inserted_assets ia
WHERE NOT EXISTS (
  SELECT 1 FROM heavy_equipment he
  WHERE he.tenant_id = ia.tenant_id AND he.asset_id = ia.asset_id
);

-- ============================================================================
-- 5) Seed Small Items to 100 (assets)
-- ============================================================================
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
existing_small AS (
  SELECT COUNT(*)::int AS c
  FROM assets
  WHERE tenant_id = (SELECT tenant_id FROM cta)
    AND asset_number LIKE 'SMI-%'
),
missing_small AS (
  SELECT GREATEST(0, 100 - (SELECT c FROM existing_small))::int AS n,
         (SELECT c FROM existing_small)::int AS start_idx
),
series AS (
  SELECT generate_series(1, (SELECT n FROM missing_small)) AS seq
),
facility AS (
  SELECT id AS facility_id
  FROM facilities
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY created_at ASC
  LIMIT 1
)
INSERT INTO assets (
  tenant_id,
  asset_number,
  name,
  description,
  type,
  category,
  manufacturer,
  model,
  serial_number,
  purchase_date,
  purchase_price,
  current_value,
  status,
  assigned_facility_id,
  condition,
  notes,
  metadata
)
SELECT
  (SELECT tenant_id FROM cta),
  'SMI-' || lpad(((SELECT start_idx FROM missing_small) + s.seq)::text, 4, '0'),
  CASE
    WHEN (s.seq % 10) = 0 THEN 'Portable Generator'
    WHEN (s.seq % 10) = 1 THEN 'Welding Rig'
    WHEN (s.seq % 10) = 2 THEN 'Air Compressor'
    WHEN (s.seq % 10) = 3 THEN 'Light Tower'
    WHEN (s.seq % 10) = 4 THEN 'Concrete Saw'
    WHEN (s.seq % 10) = 5 THEN 'Pressure Washer'
    WHEN (s.seq % 10) = 6 THEN 'Hydraulic Pump'
    WHEN (s.seq % 10) = 7 THEN 'Jackhammer'
    WHEN (s.seq % 10) = 8 THEN 'Portable Fuel Tank'
    ELSE 'Tool Kit'
  END || ' #' || ((SELECT start_idx FROM missing_small) + s.seq)::text,
  'CTA small equipment/tools (Tallahassee demo inventory)',
  'tool',
  CASE
    WHEN (s.seq % 4) = 0 THEN 'power'
    WHEN (s.seq % 4) = 1 THEN 'tool'
    WHEN (s.seq % 4) = 2 THEN 'support'
    ELSE 'safety'
  END,
  CASE
    WHEN (s.seq % 8) = 0 THEN 'Generac'
    WHEN (s.seq % 8) = 1 THEN 'Miller'
    WHEN (s.seq % 8) = 2 THEN 'Ingersoll Rand'
    WHEN (s.seq % 8) = 3 THEN 'Wacker Neuson'
    WHEN (s.seq % 8) = 4 THEN 'Honda'
    WHEN (s.seq % 8) = 5 THEN 'DeWalt'
    WHEN (s.seq % 8) = 6 THEN 'Bosch'
    ELSE 'Makita'
  END,
  'Model-' || lpad((100 + (s.seq % 900))::text, 3, '0'),
  'CTA-SMI-' || lpad(((SELECT start_idx FROM missing_small) + s.seq)::text, 6, '0'),
  NOW() - INTERVAL '3 years' + ((s.seq % 36) * INTERVAL '30 days'),
  500 + ((s.seq % 20) * 250),
  250 + ((s.seq % 20) * 175),
  CASE WHEN (s.seq % 25) = 0 THEN 'maintenance' WHEN (s.seq % 17) = 0 THEN 'inactive' ELSE 'active' END,
  (SELECT facility_id FROM facility),
  CASE WHEN (s.seq % 6) = 0 THEN 'fair' WHEN (s.seq % 6) = 1 THEN 'good' ELSE 'excellent' END,
  'Seeded for CTA demo',
  jsonb_build_object(
    'latitude', 30.4383 + (((s.seq % 10) - 5) * 0.002),
    'longitude', -84.2807 + ((((s.seq / 10) % 10) - 5) * 0.002),
    'city', 'Tallahassee',
    'state', 'FL',
    'seed', 'cta_demo'
  )
FROM series s
WHERE NOT EXISTS (
  SELECT 1
  FROM assets a
  WHERE a.tenant_id = (SELECT tenant_id FROM cta)
    AND a.asset_number = ('SMI-' || lpad(((SELECT start_idx FROM missing_small) + s.seq)::text, 4, '0'))
);
