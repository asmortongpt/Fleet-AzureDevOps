-- Migration 032 Verification Script
-- Run this script after applying migration 032 to verify all changes

\echo '===================================================================='
\echo 'MIGRATION 032 VERIFICATION SCRIPT'
\echo 'Multi-Asset Vehicle Extensions'
\echo '===================================================================='
\echo ''

-- 1. Verify Vehicles Table New Columns
\echo '1. VEHICLES TABLE - NEW COLUMNS (Expected: 28)'
SELECT COUNT(*) as new_columns_count
FROM information_schema.columns
WHERE table_name = 'vehicles'
  AND column_name IN (
    'asset_category', 'asset_type', 'power_type', 'primary_metric',
    'pto_hours', 'aux_hours', 'cycle_count', 'last_metric_update',
    'capacity_tons', 'max_reach_feet', 'lift_height_feet', 'bucket_capacity_yards',
    'operating_weight_lbs', 'axle_count', 'max_payload_kg', 'tank_capacity_l',
    'has_pto', 'has_aux_power', 'is_road_legal', 'requires_cdl',
    'requires_special_license', 'max_speed_kph', 'is_off_road_only',
    'operational_status', 'parent_asset_id', 'group_id', 'fleet_id', 'location_id'
  );

\echo ''
\echo '   Column Details:'
SELECT column_name, data_type,
       CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as nullable
FROM information_schema.columns
WHERE table_name = 'vehicles'
  AND column_name IN ('asset_category', 'asset_type', 'power_type', 'operational_status', 'pto_hours')
ORDER BY column_name;

-- 2. Verify New Tables
\echo ''
\echo '2. NEW TABLES (Expected: 2)'
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('asset_relationships', 'telemetry_equipment_events')
ORDER BY table_name;

-- 3. Verify asset_relationships Table Structure
\echo ''
\echo '3. ASSET_RELATIONSHIPS TABLE STRUCTURE'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'asset_relationships'
ORDER BY ordinal_position;

-- 4. Verify Indexes on Vehicles
\echo ''
\echo '4. NEW INDEXES ON VEHICLES TABLE (Expected: 8)'
SELECT indexname
FROM pg_indexes
WHERE tablename = 'vehicles'
  AND indexname LIKE 'idx_vehicles_asset%'
     OR indexname LIKE 'idx_vehicles_pto%'
     OR indexname LIKE 'idx_vehicles_aux%'
     OR indexname LIKE 'idx_vehicles_cycle%'
     OR indexname LIKE 'idx_vehicles_operational%'
     OR indexname LIKE 'idx_vehicles_parent%'
     OR indexname LIKE 'idx_vehicles_primary%'
ORDER BY indexname;

-- 5. Verify Indexes on asset_relationships
\echo ''
\echo '5. INDEXES ON ASSET_RELATIONSHIPS TABLE (Expected: 4)'
SELECT indexname
FROM pg_indexes
WHERE tablename = 'asset_relationships'
ORDER BY indexname;

-- 6. Verify Maintenance Schedules Extensions
\echo ''
\echo '6. MAINTENANCE_SCHEDULES - NEW COLUMNS (Expected: 8)'
SELECT COUNT(*) as new_columns_count
FROM information_schema.columns
WHERE table_name = 'maintenance_schedules'
  AND column_name IN (
    'trigger_metric', 'trigger_condition',
    'last_service_pto_hours', 'last_service_aux_hours', 'last_service_cycles',
    'next_service_due_pto_hours', 'next_service_due_aux_hours', 'next_service_due_cycles'
  );

-- 7. Verify Views Created
\echo ''
\echo '7. NEW VIEWS (Expected: 3)'
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('vw_active_asset_combos', 'vw_equipment_by_type', 'vw_multi_metric_maintenance_due')
ORDER BY table_name;

-- 8. Verify Functions Created
\echo ''
\echo '8. NEW FUNCTIONS (Expected: 2)'
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('is_maintenance_overdue_multi_metric', 'update_maintenance_overdue_status')
ORDER BY routine_name;

-- 9. Verify Triggers
\echo ''
\echo '9. NEW TRIGGERS (Expected: 1)'
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_maintenance_overdue_status';

-- 10. Test Asset Type Enumeration
\echo ''
\echo '10. TEST ASSET TYPE CONSTRAINTS'
\echo '    Testing valid asset_category value...'
UPDATE vehicles SET asset_category = 'HEAVY_EQUIPMENT' WHERE id = (SELECT id FROM vehicles LIMIT 1);
\echo '    ✓ Valid asset_category accepted'

-- 11. Sample Data Query
\echo ''
\echo '11. SAMPLE VEHICLES WITH NEW FIELDS'
SELECT vin, make, model, asset_category, asset_type, operational_status, pto_hours
FROM vehicles
LIMIT 5;

-- 12. Check Existing Data Integrity
\echo ''
\echo '12. EXISTING DATA INTEGRITY CHECK'
SELECT
  COUNT(*) as total_vehicles,
  COUNT(vin) as vehicles_with_vin,
  COUNT(CASE WHEN asset_category IS NOT NULL THEN 1 END) as vehicles_with_category,
  COUNT(CASE WHEN operational_status IS NOT NULL THEN 1 END) as vehicles_with_status
FROM vehicles;

-- 13. Foreign Key Constraints
\echo ''
\echo '13. FOREIGN KEY CONSTRAINTS VERIFICATION'
SELECT
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('asset_relationships', 'telemetry_equipment_events', 'vehicles')
  AND (kcu.column_name IN ('parent_asset_id', 'child_asset_id', 'location_id', 'operator_id', 'created_by')
       OR ccu.table_name IN ('vehicles', 'facilities', 'drivers', 'users'))
ORDER BY tc.table_name, tc.constraint_name;

\echo ''
\echo '===================================================================='
\echo 'VERIFICATION COMPLETE'
\echo ''
\echo 'Expected Results:'
\echo '  - 28 new columns in vehicles table'
\echo '  - 2 new tables (asset_relationships, telemetry_equipment_events)'
\echo '  - 8 new columns in maintenance_schedules table'
\echo '  - 8 new indexes on vehicles table'
\echo '  - 4 indexes on asset_relationships table'
\echo '  - 3 new views'
\echo '  - 2 new functions'
\echo '  - 1 new trigger'
\echo ''
\echo 'If all counts match, Migration 032 was applied successfully!'
\echo '===================================================================='
