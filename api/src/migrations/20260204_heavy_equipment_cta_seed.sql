-- Migration: Seed Heavy Equipment (CTA) - DB-backed demo data (deterministic)
-- Created: 2026-02-04
-- Purpose: Ensure Heavy Equipment module is fully functional with database-backed data.
-- Notes:
-- - No random values (stable, deterministic inserts)
-- - Idempotent (safe to re-run)

-- ----------------------------------------------------------------------------
-- 1) Ensure CTA tenant exists
-- ----------------------------------------------------------------------------
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
)
SELECT tenant_id FROM cta;

-- ----------------------------------------------------------------------------
-- 2) Seed equipment assets for CTA (if missing)
-- ----------------------------------------------------------------------------
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
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
  cta.tenant_id,
  seed.asset_number,
  seed.name,
  seed.description,
  'equipment',
  seed.category,
  seed.manufacturer,
  seed.model,
  seed.serial_number,
  seed.purchase_date,
  seed.purchase_price,
  seed.current_value,
  seed.status,
  (SELECT facility_id FROM facility),
  seed.condition,
  seed.notes,
  jsonb_build_object(
    'latitude', seed.latitude,
    'longitude', seed.longitude
  )
FROM cta,
LATERAL (
  VALUES
    ('HEQ-0001', 'Excavator #1', 'CAT 320 excavator - earthmoving operations', 'construction', 'Caterpillar', '320', 'CTA-HEQ-0001', NOW() - INTERVAL '6 years', 245000.00, 142000.00, 'active', 'good', 'Primary earthmoving unit', 30.4383, -84.2807),
    ('HEQ-0002', 'Bulldozer #1', 'D6T bulldozer - grading and clearing', 'construction', 'Caterpillar', 'D6T', 'CTA-HEQ-0002', NOW() - INTERVAL '7 years', 315000.00, 168000.00, 'active', 'good', 'Used for road and site prep', 30.4470, -84.2560),
    ('HEQ-0003', 'Wheel Loader #1', '950M wheel loader - material handling', 'construction', 'Caterpillar', '950M', 'CTA-HEQ-0003', NOW() - INTERVAL '5 years', 285000.00, 173000.00, 'active', 'excellent', 'High utilization loader', 30.4207, -84.2652),
    ('HEQ-0004', 'Forklift #1', 'Toyota 8FGCU25 forklift - yard operations', 'logistics', 'Toyota', '8FGCU25', 'CTA-HEQ-0004', NOW() - INTERVAL '4 years', 32000.00, 21500.00, 'active', 'good', 'Warehouse support', 30.4664, -84.2422),
    ('HEQ-0005', 'Crane Truck #1', 'National 9125A boom truck - lifting', 'utilities', 'National', '9125A', 'CTA-HEQ-0005', NOW() - INTERVAL '8 years', 395000.00, 188000.00, 'active', 'good', 'Utility lift operations', 30.4518, -84.2724),
    ('HEQ-0006', 'Backhoe Loader #1', 'John Deere 310SL backhoe - trenching', 'construction', 'John Deere', '310SL', 'CTA-HEQ-0006', NOW() - INTERVAL '5 years', 132000.00, 78000.00, 'active', 'good', 'General utility digging', 30.4328, -84.2902),
    ('HEQ-0007', 'Skid Steer #1', 'Bobcat S650 skid steer - site work', 'construction', 'Bobcat', 'S650', 'CTA-HEQ-0007', NOW() - INTERVAL '3 years', 52000.00, 36000.00, 'active', 'excellent', 'Compact loader', 30.4580, -84.2816),
    ('HEQ-0008', 'Paver #1', 'Vogele Super 1900-3i asphalt paver', 'roads', 'Vogele', 'Super 1900-3i', 'CTA-HEQ-0008', NOW() - INTERVAL '6 years', 475000.00, 255000.00, 'active', 'good', 'Road resurfacing', 30.4372, -84.2478),
    ('HEQ-0009', 'Road Roller #1', 'Bomag BW 174 roller compactor', 'roads', 'BOMAG', 'BW 174', 'CTA-HEQ-0009', NOW() - INTERVAL '6 years', 98000.00, 61000.00, 'active', 'good', 'Compaction unit', 30.4499, -84.2597),
    ('HEQ-0010', 'Bucket Truck #1', 'Altec AA55E bucket truck - aerial', 'utilities', 'Altec', 'AA55E', 'CTA-HEQ-0010', NOW() - INTERVAL '7 years', 265000.00, 140000.00, 'active', 'good', 'Aerial work platform', 30.4289, -84.2712)
) AS seed(
  asset_number,
  name,
  description,
  category,
  manufacturer,
  model,
  serial_number,
  purchase_date,
  purchase_price,
  current_value,
  status,
  condition,
  notes,
  latitude,
  longitude
)
WHERE NOT EXISTS (
  SELECT 1 FROM assets a
  WHERE a.tenant_id = cta.tenant_id AND a.asset_number = seed.asset_number
);

-- ----------------------------------------------------------------------------
-- 3) Create heavy_equipment records for CTA assets (if missing)
-- ----------------------------------------------------------------------------
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
asset_rows AS (
  SELECT
    a.id AS asset_id,
    a.tenant_id,
    a.asset_number,
    a.name,
    a.manufacturer,
    a.model,
    a.purchase_price,
    a.current_value
  FROM assets a
  WHERE a.tenant_id = (SELECT tenant_id FROM cta)
    AND a.type = 'equipment'
)
INSERT INTO heavy_equipment (
  tenant_id,
  asset_id,
  equipment_type,
  model_year,
  engine_hours,
  engine_type,
  weight_capacity_lbs,
  load_capacity,
  reach_distance_ft,
  inspection_required,
  last_inspection_date,
  next_inspection_date,
  certification_number,
  requires_certification,
  operator_license_type,
  metadata
)
SELECT
  ar.tenant_id,
  ar.asset_id,
  CASE
    WHEN ar.name ILIKE '%excavator%' THEN 'excavator'
    WHEN ar.name ILIKE '%bulldozer%' THEN 'bulldozer'
    WHEN ar.name ILIKE '%loader%' THEN 'loader'
    WHEN ar.name ILIKE '%forklift%' THEN 'forklift'
    WHEN ar.name ILIKE '%crane%' THEN 'crane'
    WHEN ar.name ILIKE '%backhoe%' THEN 'backhoe'
    WHEN ar.name ILIKE '%skid%' THEN 'skid_steer'
    WHEN ar.name ILIKE '%paver%' THEN 'paver'
    WHEN ar.name ILIKE '%roller%' THEN 'roller'
    WHEN ar.name ILIKE '%bucket%' THEN 'bucket_truck'
    ELSE 'equipment'
  END AS equipment_type,
  EXTRACT(YEAR FROM (NOW() - INTERVAL '4 years'))::int AS model_year,
  -- Stable per asset_number: 600..2600 hours
  600 + (ABS(('x' || substr(md5(ar.asset_number), 1, 8))::bit(32)::int) % 2000) AS engine_hours,
  CASE WHEN ar.name ILIKE '%electric%' THEN 'electric' ELSE 'diesel' END AS engine_type,
  NULL::numeric,
  NULL::numeric,
  NULL::numeric,
  TRUE,
  (CURRENT_DATE - INTERVAL '90 days')::date,
  (CURRENT_DATE + INTERVAL '275 days')::date,
  'CTA-CERT-' || replace(ar.asset_number, 'HEQ-', '') AS certification_number,
  TRUE,
  'Class A',
  jsonb_build_object(
    'availability_status', 'available',
    'current_job_site', 'Tallahassee Operations',
    'is_rental', false,
    'manufacturer', ar.manufacturer,
    'model', ar.model,
    'acquisition_cost', COALESCE(ar.purchase_price, 0),
    'current_value', COALESCE(ar.current_value, 0)
  )
FROM asset_rows ar
WHERE NOT EXISTS (
  SELECT 1 FROM heavy_equipment he
  WHERE he.tenant_id = ar.tenant_id AND he.asset_id = ar.asset_id
);

-- ----------------------------------------------------------------------------
-- 4) Seed schedules, events, certifications, utilization, telematics (idempotent)
-- ----------------------------------------------------------------------------
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
),
he AS (
  SELECT id, tenant_id, equipment_type
  FROM heavy_equipment
  WHERE tenant_id = (SELECT tenant_id FROM cta)
),
first_user AS (
  SELECT id AS user_id
  FROM users
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY created_at ASC
  LIMIT 1
),
first_driver AS (
  SELECT id AS driver_id
  FROM drivers
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY created_at ASC
  LIMIT 1
)
INSERT INTO equipment_maintenance_schedules (
  tenant_id, equipment_id, schedule_type, title, description,
  interval_days, interval_hours, last_completed_date, next_due_date,
  last_completed_hours, next_due_hours, status, is_active, metadata
)
SELECT
  he.tenant_id,
  he.id,
  'both',
  'Preventive Maintenance',
  'Standard PM schedule (calendar + hours)',
  90,
  250,
  (CURRENT_DATE - INTERVAL '45 days')::date,
  (CURRENT_DATE + INTERVAL '45 days')::date,
  1000,
  1250,
  'scheduled',
  true,
  '{}'::jsonb
FROM he
WHERE NOT EXISTS (
  SELECT 1 FROM equipment_maintenance_schedules ems
  WHERE ems.tenant_id = he.tenant_id AND ems.equipment_id = he.id
);

-- Maintenance events (costs) for last 6 months (deterministic by month)
WITH cta AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
),
he AS (
  SELECT id, tenant_id FROM heavy_equipment WHERE tenant_id = (SELECT tenant_id FROM cta)
),
u AS (
  SELECT id AS user_id FROM users WHERE tenant_id = (SELECT tenant_id FROM cta) ORDER BY created_at ASC LIMIT 1
),
months AS (
  SELECT generate_series(0, 5) AS m
)
INSERT INTO equipment_maintenance_events (
  tenant_id, equipment_id, event_date, description, cost, performed_by, metadata
)
SELECT
  he.tenant_id,
  he.id,
  (date_trunc('month', CURRENT_DATE) - (months.m || ' months')::interval + INTERVAL '10 days')::date,
  'Routine maintenance service',
  180 + (months.m * 25),
  (SELECT user_id FROM u),
  jsonb_build_object('cost_type','maintenance')
FROM he, months
WHERE NOT EXISTS (
  SELECT 1 FROM equipment_maintenance_events eme
  WHERE eme.tenant_id = he.tenant_id AND eme.equipment_id = he.id AND eme.event_date =
    (date_trunc('month', CURRENT_DATE) - (months.m || ' months')::interval + INTERVAL '10 days')::date
);

-- Operator certifications (one driver per tenant across equipment types)
WITH cta AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
),
d AS (
  SELECT id AS driver_id, tenant_id
  FROM drivers
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY created_at ASC
  LIMIT 1
),
types AS (
  SELECT DISTINCT equipment_type
  FROM heavy_equipment
  WHERE tenant_id = (SELECT tenant_id FROM cta)
)
INSERT INTO equipment_operator_certifications (
  tenant_id, driver_id, equipment_type, certification_number, certification_date,
  expiry_date, certifying_authority, certification_level, status, metadata
)
SELECT
  d.tenant_id,
  d.driver_id,
  t.equipment_type,
  'CTA-OP-' || substr(md5(d.driver_id::text || t.equipment_type), 1, 8),
  (CURRENT_DATE - INTERVAL '1 year')::date,
  (CURRENT_DATE + INTERVAL '1 year')::date,
  'CTA Training Division',
  'basic',
  'active',
  '{}'::jsonb
FROM d, types t
WHERE NOT EXISTS (
  SELECT 1 FROM equipment_operator_certifications eoc
  WHERE eoc.tenant_id = d.tenant_id AND eoc.driver_id = d.driver_id AND eoc.equipment_type = t.equipment_type
);

-- Utilization logs (14 days) and telematics snapshots (latest) for CTA equipment
INSERT INTO equipment_utilization_logs (
  tenant_id, equipment_id, log_date, operator_id,
  productive_hours, idle_hours, maintenance_hours, down_hours, billable_hours,
  total_revenue, engine_hours, fuel_consumption_rate, metadata
)
SELECT
  he.tenant_id,
  he.id,
  (CURRENT_DATE - gs.day_offset)::date AS log_date,
  (SELECT id FROM drivers d WHERE d.tenant_id = he.tenant_id ORDER BY d.created_at ASC LIMIT 1),
  (4 + (gs.day_offset % 3))::numeric AS productive_hours,
  (1 + (gs.day_offset % 2))::numeric AS idle_hours,
  (CASE WHEN gs.day_offset % 7 = 0 THEN 1 ELSE 0 END)::numeric AS maintenance_hours,
  0::numeric AS down_hours,
  (4 + (gs.day_offset % 3))::numeric AS billable_hours,
  ((4 + (gs.day_offset % 3)) * 125)::numeric AS total_revenue,
  (600 + (14 - gs.day_offset))::numeric AS engine_hours,
  5.0 + (gs.day_offset % 4) * 0.25 AS fuel_consumption_rate,
  jsonb_build_object('job_site','Tallahassee Operations')
FROM heavy_equipment he
CROSS JOIN LATERAL (SELECT generate_series(0, 13) AS day_offset) gs
WHERE he.tenant_id = (SELECT id FROM tenants WHERE slug='cta-fleet' LIMIT 1)
ON CONFLICT (tenant_id, equipment_id, log_date) DO NOTHING;

-- Telematics snapshot: insert only if none exist for the equipment today
INSERT INTO equipment_telematics_snapshots (
  tenant_id, equipment_id, timestamp, engine_hours, engine_rpm, engine_temp_celsius,
  fuel_level_percent, fuel_consumption_rate, latitude, longitude, speed_mph, altitude_feet,
  hydraulic_pressure_psi, battery_voltage, diagnostic_codes, alerts
)
SELECT
  he.tenant_id,
  he.id,
  NOW(),
  COALESCE(he.engine_hours, 0),
  1500,
  88,
  72,
  5.5,
  COALESCE(NULLIF(a.metadata->>'latitude','')::numeric, 30.4383),
  COALESCE(NULLIF(a.metadata->>'longitude','')::numeric, -84.2807),
  0,
  150,
  2500,
  12.6,
  ARRAY[]::TEXT[],
  '[]'::jsonb
FROM heavy_equipment he
LEFT JOIN assets a ON a.id = he.asset_id
WHERE he.tenant_id = (SELECT id FROM tenants WHERE slug='cta-fleet' LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM equipment_telematics_snapshots ets
    WHERE ets.tenant_id = he.tenant_id
      AND ets.equipment_id = he.id
      AND ets.timestamp::date = CURRENT_DATE
  );

