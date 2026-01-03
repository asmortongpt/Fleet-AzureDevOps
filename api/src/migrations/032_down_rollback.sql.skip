-- Migration 032 ROLLBACK: Multi-Asset Vehicle Extensions
-- Created: 2025-11-17
-- Description: Rollback migration 032 - removes all multi-asset extensions

-- ============================================================================
-- PART 1: DROP VIEWS
-- ============================================================================

DROP VIEW IF EXISTS vw_multi_metric_maintenance_due;
DROP VIEW IF EXISTS vw_equipment_by_type;
DROP VIEW IF EXISTS vw_active_asset_combos;

-- ============================================================================
-- PART 2: DROP TRIGGERS AND FUNCTIONS
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_update_maintenance_overdue_status ON vehicles;
DROP FUNCTION IF EXISTS update_maintenance_overdue_status();
DROP FUNCTION IF EXISTS is_maintenance_overdue_multi_metric(UUID);

-- ============================================================================
-- PART 3: DROP TABLES
-- ============================================================================

DROP TABLE IF EXISTS telemetry_equipment_events;
DROP TABLE IF EXISTS asset_relationships;

-- ============================================================================
-- PART 4: REMOVE COLUMNS FROM maintenance_schedules
-- ============================================================================

ALTER TABLE maintenance_schedules
  DROP COLUMN IF EXISTS next_service_due_cycles,
  DROP COLUMN IF EXISTS next_service_due_aux_hours,
  DROP COLUMN IF EXISTS next_service_due_pto_hours,
  DROP COLUMN IF EXISTS last_service_cycles,
  DROP COLUMN IF EXISTS last_service_aux_hours,
  DROP COLUMN IF EXISTS last_service_pto_hours,
  DROP COLUMN IF EXISTS trigger_condition,
  DROP COLUMN IF EXISTS trigger_metric;

-- ============================================================================
-- PART 5: REMOVE INDEXES FROM vehicles TABLE
-- ============================================================================

DROP INDEX IF EXISTS idx_vehicles_cycle_count;
DROP INDEX IF EXISTS idx_vehicles_aux_hours;
DROP INDEX IF EXISTS idx_vehicles_pto_hours;
DROP INDEX IF EXISTS idx_vehicles_parent_asset;
DROP INDEX IF EXISTS idx_vehicles_operational_status;
DROP INDEX IF EXISTS idx_vehicles_primary_metric;
DROP INDEX IF EXISTS idx_vehicles_asset_type;
DROP INDEX IF EXISTS idx_vehicles_asset_category;

-- ============================================================================
-- PART 6: REMOVE COLUMNS FROM vehicles TABLE
-- ============================================================================

ALTER TABLE vehicles
  DROP COLUMN IF EXISTS location_id,
  DROP COLUMN IF EXISTS fleet_id,
  DROP COLUMN IF EXISTS group_id,
  DROP COLUMN IF EXISTS parent_asset_id,
  DROP COLUMN IF EXISTS operational_status,
  DROP COLUMN IF EXISTS is_off_road_only,
  DROP COLUMN IF EXISTS max_speed_kph,
  DROP COLUMN IF EXISTS requires_special_license,
  DROP COLUMN IF EXISTS requires_cdl,
  DROP COLUMN IF EXISTS is_road_legal,
  DROP COLUMN IF EXISTS has_aux_power,
  DROP COLUMN IF EXISTS has_pto,
  DROP COLUMN IF EXISTS tank_capacity_l,
  DROP COLUMN IF EXISTS max_payload_kg,
  DROP COLUMN IF EXISTS axle_count,
  DROP COLUMN IF EXISTS operating_weight_lbs,
  DROP COLUMN IF EXISTS bucket_capacity_yards,
  DROP COLUMN IF EXISTS lift_height_feet,
  DROP COLUMN IF EXISTS max_reach_feet,
  DROP COLUMN IF EXISTS capacity_tons,
  DROP COLUMN IF EXISTS last_metric_update,
  DROP COLUMN IF EXISTS cycle_count,
  DROP COLUMN IF EXISTS aux_hours,
  DROP COLUMN IF EXISTS pto_hours,
  DROP COLUMN IF EXISTS primary_metric,
  DROP COLUMN IF EXISTS power_type,
  DROP COLUMN IF EXISTS asset_type,
  DROP COLUMN IF EXISTS asset_category;

-- ============================================================================
-- COMPLETED ROLLBACK
-- ============================================================================

-- Migration 032 rollback complete. Summary:
-- ✅ Dropped 3 views (vw_active_asset_combos, vw_equipment_by_type, vw_multi_metric_maintenance_due)
-- ✅ Dropped trigger and 2 functions
-- ✅ Dropped 2 tables (telemetry_equipment_events, asset_relationships)
-- ✅ Removed 8 columns from maintenance_schedules
-- ✅ Removed 8 indexes from vehicles
-- ✅ Removed 30+ columns from vehicles
-- ⚠️  WARNING: This rollback will lose all multi-asset data!
