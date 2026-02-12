-- Migration: Seed CTA Heavy Equipment and Small Assets (Capital Transit Authority)
-- Created: 2026-02-10
-- Purpose:
--   Ensure CTA tenant has:
--   - ~70 heavy equipment (assets + heavy_equipment)
--   - ~100 small items (assets: generators, welders, tools, etc.)
-- Notes:
--   - Idempotent: safe to re-run.

-- Ensure RLS-aware inserts target CTA tenant
SELECT set_config('app.current_tenant_id', (
  SELECT id::text
  FROM tenants
  WHERE name = 'Capital Transit Authority'
  LIMIT 1
), true);

-- ============================================================================
-- 1) Seed Heavy Equipment to 70 (assets + heavy_equipment)
-- ============================================================================
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE name = 'Capital Transit Authority'
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
    asset_name,
    asset_type,
    description,
    manufacturer,
    model,
    serial_number,
    acquisition_date,
    acquisition_cost,
    status,
    facility_id,
    condition,
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
    'equipment',
    'CTA heavy equipment (Tallahassee fleet)',
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
    'active',
    (SELECT facility_id FROM facility),
    CASE WHEN (s.seq % 5) = 0 THEN 'excellent' WHEN (s.seq % 5) = 1 THEN 'good' WHEN (s.seq % 5) = 2 THEN 'fair' ELSE 'good' END,
    jsonb_build_object(
      'notes', 'Seeded for CTA demo',
      'current_value', 45000 + ((s.seq % 12) * 18000),
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
  RETURNING id AS asset_id, tenant_id, asset_number, asset_name AS name
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
-- 2) Seed Small Items to 100 (assets)
-- ============================================================================
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE name = 'Capital Transit Authority'
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
  asset_name,
  asset_type,
  description,
  manufacturer,
  model,
  serial_number,
  acquisition_date,
  acquisition_cost,
  status,
  facility_id,
  condition,
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
  'tool',
  'CTA small equipment/tools (Tallahassee inventory)',
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
  CASE WHEN (s.seq % 25) = 0 THEN 'maintenance' WHEN (s.seq % 17) = 0 THEN 'inactive' ELSE 'active' END,
  (SELECT facility_id FROM facility),
  CASE WHEN (s.seq % 6) = 0 THEN 'fair' WHEN (s.seq % 6) = 1 THEN 'good' ELSE 'excellent' END,
  jsonb_build_object(
    'notes', 'Seeded for CTA demo',
    'current_value', 250 + ((s.seq % 20) * 175),
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
