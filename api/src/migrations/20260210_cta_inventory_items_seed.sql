-- Migration: Seed CTA Inventory Items
-- Created: 2026-02-10
-- Purpose:
--   Create ~100 inventory_items for CTA (Tallahassee) to back barcode/RFID tracking.
-- Notes:
--   - Idempotent: safe to re-run.

SELECT set_config('app.current_tenant_id', (
  SELECT id::text
  FROM tenants
  WHERE name = 'Capital Transit Authority'
  LIMIT 1
), true);

WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE name = 'Capital Transit Authority'
  LIMIT 1
),
existing AS (
  SELECT COUNT(*)::int AS c
  FROM inventory_items
  WHERE tenant_id = (SELECT tenant_id FROM cta)
),
missing AS (
  SELECT GREATEST(0, 100 - (SELECT c FROM existing))::int AS n,
         (SELECT c FROM existing)::int AS start_idx
),
series AS (
  SELECT generate_series(1, (SELECT n FROM missing)) AS seq
),
creator AS (
  SELECT id AS user_id
  FROM users
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY created_at ASC
  LIMIT 1
)
INSERT INTO inventory_items (
  tenant_id,
  sku,
  part_number,
  name,
  description,
  category,
  subcategory,
  manufacturer,
  manufacturer_part_number,
  universal_part_number,
  quantity_on_hand,
  reorder_point,
  reorder_quantity,
  warehouse_location,
  bin_location,
  unit_cost,
  list_price,
  currency,
  primary_supplier_name,
  lead_time_days,
  compatible_makes,
  compatible_models,
  compatible_years,
  last_restocked,
  last_used,
  created_by,
  updated_by
)
SELECT
  (SELECT tenant_id FROM cta),
  'CTA-INV-' || lpad(((SELECT start_idx FROM missing) + s.seq)::text, 4, '0'),
  'PN-' || lpad(((SELECT start_idx FROM missing) + s.seq)::text, 5, '0'),
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
  END || ' - CTA',
  'CTA inventory item seeded for Tallahassee operations',
  CASE
    WHEN (s.seq % 10) IN (0, 1, 2, 3) THEN 'tools'
    WHEN (s.seq % 10) IN (4, 5) THEN 'safety-equipment'
    WHEN (s.seq % 10) IN (6, 7) THEN 'parts'
    ELSE 'supplies'
  END,
  CASE
    WHEN (s.seq % 5) = 0 THEN 'power'
    WHEN (s.seq % 5) = 1 THEN 'tooling'
    WHEN (s.seq % 5) = 2 THEN 'repair'
    WHEN (s.seq % 5) = 3 THEN 'safety'
    ELSE 'support'
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
  'MPN-' || lpad(((SELECT start_idx FROM missing) + s.seq)::text, 5, '0'),
  'UPN-' || lpad(((SELECT start_idx FROM missing) + s.seq)::text, 5, '0'),
  5 + (s.seq % 40),
  6 + (s.seq % 10),
  12 + (s.seq % 20),
  'Tallahassee Main Warehouse',
  'B' || lpad((1 + (s.seq % 40))::text, 2, '0'),
  120 + ((s.seq % 30) * 7.5),
  180 + ((s.seq % 30) * 9.0),
  'USD',
  'CTA Preferred Supplier',
  5 + (s.seq % 15),
  ARRAY['Ford', 'Chevrolet', 'GMC'],
  ARRAY['F-150', 'Silverado', 'Sierra'],
  ARRAY[2018, 2019, 2020, 2021, 2022, 2023],
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '5 days',
  (SELECT user_id FROM creator),
  (SELECT user_id FROM creator)
FROM series s
WHERE NOT EXISTS (
  SELECT 1
  FROM inventory_items i
  WHERE i.tenant_id = (SELECT tenant_id FROM cta)
    AND i.sku = ('CTA-INV-' || lpad(((SELECT start_idx FROM missing) + s.seq)::text, 4, '0'))
);
