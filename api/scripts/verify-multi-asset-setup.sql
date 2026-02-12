-- ============================================
-- Multi-Asset Setup Verification Script
-- ============================================
-- This script verifies that Migration 032 and
-- test data were successfully loaded
-- ============================================

\echo '========================================'
\echo 'MULTI-ASSET SETUP VERIFICATION'
\echo '========================================'
\echo ''

-- 1. Check Migration 032 Schema Changes
\echo '1. Verifying Migration 032 Schema...'
\echo ''

\echo '   Checking vehicles table columns:'
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'vehicles'
  AND column_name IN (
    'asset_category', 'asset_type', 'power_type',
    'primary_metric', 'pto_hours', 'aux_hours',
    'operational_status', 'capacity_tons', 'has_pto'
  )
ORDER BY column_name;

\echo ''
\echo '   Expected: 9 columns related to multi-asset support'
\echo ''

-- 2. Check New Tables
\echo '2. Verifying New Tables...'
\echo ''

\echo '   asset_relationships table:'
SELECT COUNT(*) as relationship_count FROM asset_relationships;

\echo ''
\echo '   telemetry_equipment_events table:'
SELECT COUNT(*) as telemetry_events_count FROM telemetry_equipment_events;

\echo ''

-- 3. Check Views
\echo '3. Verifying Database Views...'
\echo ''

SELECT viewname
FROM pg_views
WHERE viewname IN (
  'vw_active_asset_combos',
  'vw_equipment_by_type',
  'vw_multi_metric_maintenance_due'
)
ORDER BY viewname;

\echo ''
\echo '   Expected: 3 views'
\echo ''

-- 4. Check Functions
\echo '4. Verifying Database Functions...'
\echo ''

SELECT proname as function_name
FROM pg_proc
WHERE proname = 'is_maintenance_overdue_multi_metric';

\echo ''
\echo '   Expected: 1 function'
\echo ''

-- 5. Verify Test Data
\echo '5. Verifying Test Data...'
\echo ''

\echo '   Test tenant:'
SELECT id, name, domain
FROM tenants
WHERE domain = 'multi-asset-test.local';

\echo ''
\echo '   Assets by Category:'
SELECT
  asset_category,
  COUNT(*) as asset_count
FROM vehicles
WHERE tenant_id IN (SELECT id FROM tenants WHERE domain = 'multi-asset-test.local')
  AND asset_category IS NOT NULL
GROUP BY asset_category
ORDER BY asset_category;

\echo ''
\echo '   Expected:'
\echo '   - HEAVY_EQUIPMENT: 7'
\echo '   - TRACTOR: 5'
\echo '   - TRAILER: 10'
\echo ''

\echo '   Assets by Type:'
SELECT
  asset_type,
  COUNT(*) as count
FROM vehicles
WHERE tenant_id IN (SELECT id FROM tenants WHERE domain = 'multi-asset-test.local')
  AND asset_type IS NOT NULL
GROUP BY asset_type
ORDER BY asset_type;

\echo ''
\echo '   Assets by Operational Status:'
SELECT
  operational_status,
  COUNT(*) as count
FROM vehicles
WHERE tenant_id IN (SELECT id FROM tenants WHERE domain = 'multi-asset-test.local')
  AND operational_status IS NOT NULL
GROUP BY operational_status
ORDER BY operational_status;

\echo ''
\echo '   Asset Relationships:'
SELECT
  relationship_type,
  COUNT(*) as total,
  SUM(CASE WHEN effective_to IS NULL THEN 1 ELSE 0 END) as active,
  SUM(CASE WHEN effective_to IS NOT NULL THEN 1 ELSE 0 END) as historical
FROM asset_relationships
GROUP BY relationship_type
ORDER BY relationship_type;

\echo ''
\echo '   Expected: 5 total TOWS relationships (4 active, 1 historical)'
\echo ''

\echo '   Maintenance Schedules by Trigger Metric:'
SELECT
  trigger_metric,
  COUNT(*) as count
FROM maintenance_schedules
WHERE vehicle_id IN (
  SELECT id FROM vehicles
  WHERE tenant_id IN (SELECT id FROM tenants WHERE domain = 'multi-asset-test.local')
)
GROUP BY trigger_metric
ORDER BY trigger_metric;

\echo ''
\echo '   Expected: ODOMETER, ENGINE_HOURS, PTO_HOURS, CYCLES, CALENDAR'
\echo ''

-- 6. Test Multi-Metric Tracking
\echo '6. Testing Multi-Metric Tracking...'
\echo ''

\echo '   Excavators with PTO Hours:'
SELECT
  make || ' ' || model as excavator,
  engine_hours,
  pto_hours,
  aux_hours,
  has_pto
FROM vehicles
WHERE asset_type = 'EXCAVATOR'
  AND tenant_id IN (SELECT id FROM tenants WHERE domain = 'multi-asset-test.local')
ORDER BY make, model;

\echo ''
\echo '   Expected: All excavators should have pto_hours > 0 and has_pto = true'
\echo ''

\echo '   Forklifts with Cycle Count:'
SELECT
  make || ' ' || model as forklift,
  engine_hours,
  cycle_count
FROM vehicles
WHERE asset_type = 'FORKLIFT'
  AND tenant_id IN (SELECT id FROM tenants WHERE domain = 'multi-asset-test.local')
ORDER BY make, model;

\echo ''
\echo '   Expected: All forklifts should have cycle_count > 0'
\echo ''

-- 7. Test Views
\echo '7. Testing Database Views...'
\echo ''

\echo '   Active Asset Combos:'
SELECT
  relationship_type,
  parent_type,
  child_type,
  COUNT(*) as count
FROM vw_active_asset_combos
GROUP BY relationship_type, parent_type, child_type
ORDER BY relationship_type, parent_type, child_type;

\echo ''

\echo '   Equipment by Type Summary:'
SELECT
  asset_category,
  asset_type,
  COUNT(*) as count,
  SUM(scheduled_maintenance_count) as total_maintenance_schedules
FROM vw_equipment_by_type
GROUP BY asset_category, asset_type
ORDER BY asset_category, asset_type;

\echo ''

\echo '   Multi-Metric Maintenance Due (Next 5):'
SELECT
  make || ' ' || model as vehicle,
  asset_type,
  service_type,
  trigger_metric,
  units_until_due,
  is_overdue
FROM vw_multi_metric_maintenance_due
ORDER BY is_overdue DESC, units_until_due ASC
LIMIT 5;

\echo ''

-- 8. Test Functions
\echo '8. Testing Database Functions...'
\echo ''

\echo '   is_maintenance_overdue_multi_metric() function test:'
SELECT
  ms.id as schedule_id,
  v.make || ' ' || v.model as vehicle,
  ms.service_type,
  ms.trigger_metric,
  is_maintenance_overdue_multi_metric(ms.id) as is_overdue
FROM maintenance_schedules ms
JOIN vehicles v ON ms.vehicle_id = v.id
WHERE v.tenant_id IN (SELECT id FROM tenants WHERE domain = 'multi-asset-test.local')
  AND ms.is_active = true
ORDER BY is_overdue DESC, v.make, v.model
LIMIT 10;

\echo ''

-- 9. Summary
\echo '========================================'
\echo 'VERIFICATION SUMMARY'
\echo '========================================'
\echo ''
\echo 'Run the following checks:'
\echo '  ✓ Migration 032 columns exist in vehicles table'
\echo '  ✓ asset_relationships table exists and has data'
\echo '  ✓ telemetry_equipment_events table exists'
\echo '  ✓ All 3 views created'
\echo '  ✓ is_maintenance_overdue_multi_metric function exists'
\echo '  ✓ Test tenant and assets created'
\echo '  ✓ 22 total assets (5 tractors, 10 trailers, 7 equipment)'
\echo '  ✓ 5 asset relationships created'
\echo '  ✓ 6 maintenance schedules with different metrics'
\echo '  ✓ Multi-metric tracking working (engine_hours, pto_hours, cycles)'
\echo ''
\echo 'If all checks pass, setup is complete!'
\echo '========================================'
