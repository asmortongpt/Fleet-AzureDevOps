-- ============================================================================
-- Migration: 009 - Comprehensive Index Addition for Query Optimization
-- ============================================================================
-- Created: 2026-02-02
-- Updated: 2026-02-17 (Fixed column references, added conditional checks)
-- Purpose: Add missing indexes to improve query performance across all
--          high-traffic tables in the Fleet Management System
--
-- All index creation is wrapped in DO blocks with column existence checks
-- so the migration is safe to run regardless of schema state.
--
-- Expected Performance Improvements:
-- - GPS/Telemetry queries: 50-70% faster
-- - JOIN operations: 50-70% faster
-- - WHERE clause filtering: 40-60% faster
-- - ORDER BY operations: 30-50% faster
-- - COUNT queries: 60-80% faster
--
-- Based on: Fleet Database Analysis & Recommendations (Section 3.1)
-- ============================================================================

-- ============================================================================
-- 1. GPS TRACKS INDEXES (Extremely High Write Volume)
-- ============================================================================
-- Columns verified: vehicle_id, timestamp, tenant_id, latitude, longitude, speed
-- Column NOT present: trip_id (conditional)
DO $$ BEGIN

  -- Composite index for vehicle timeline queries (most common pattern)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gps_tracks' AND column_name='vehicle_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gps_tracks' AND column_name='timestamp') THEN
    CREATE INDEX IF NOT EXISTS idx_gps_tracks_vehicle_timestamp
    ON gps_tracks(vehicle_id, "timestamp" DESC);
  END IF;

  -- Index for timestamp-based queries (used for recent data filtering in app code)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gps_tracks' AND column_name='timestamp') THEN
    CREATE INDEX IF NOT EXISTS idx_gps_tracks_timestamp_desc
    ON gps_tracks("timestamp" DESC);
  END IF;

  -- Tenant isolation index
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gps_tracks' AND column_name='tenant_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gps_tracks' AND column_name='timestamp') THEN
    CREATE INDEX IF NOT EXISTS idx_gps_tracks_tenant_timestamp
    ON gps_tracks(tenant_id, "timestamp" DESC);
  END IF;

  -- Geospatial queries
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gps_tracks' AND column_name='latitude')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gps_tracks' AND column_name='longitude') THEN
    CREATE INDEX IF NOT EXISTS idx_gps_tracks_location
    ON gps_tracks(latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
  END IF;

  -- Speed analysis queries
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gps_tracks' AND column_name='vehicle_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gps_tracks' AND column_name='speed') THEN
    CREATE INDEX IF NOT EXISTS idx_gps_tracks_vehicle_speed
    ON gps_tracks(vehicle_id, speed DESC)
    WHERE speed > 0;
  END IF;

  -- Trip grouping queries (only if trip_id column exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='gps_tracks' AND column_name='trip_id') THEN
    CREATE INDEX IF NOT EXISTS idx_gps_tracks_trip_id ON gps_tracks(trip_id) WHERE trip_id IS NOT NULL;
  END IF;

END $$;

-- ============================================================================
-- 2. TELEMETRY DATA INDEXES (High Write Volume)
-- ============================================================================
-- Columns verified: vehicle_id, timestamp, tenant_id, battery_voltage
-- Columns NOT present: engine_state, fuel_level
DO $$ BEGIN

  -- Vehicle telemetry timeline
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='telemetry_data' AND column_name='vehicle_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='telemetry_data' AND column_name='timestamp') THEN
    CREATE INDEX IF NOT EXISTS idx_telemetry_vehicle_timestamp
    ON telemetry_data(vehicle_id, "timestamp" DESC);
  END IF;

  -- Index for telemetry timestamp queries
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='telemetry_data' AND column_name='timestamp') THEN
    CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp_desc
    ON telemetry_data("timestamp" DESC);
  END IF;

  -- Tenant isolation
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='telemetry_data' AND column_name='tenant_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='telemetry_data' AND column_name='timestamp') THEN
    CREATE INDEX IF NOT EXISTS idx_telemetry_tenant_timestamp
    ON telemetry_data(tenant_id, "timestamp" DESC);
  END IF;

  -- Engine state analysis (only if engine_state column exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='telemetry_data' AND column_name='engine_state')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='telemetry_data' AND column_name='vehicle_id') THEN
    CREATE INDEX IF NOT EXISTS idx_telemetry_engine_state
    ON telemetry_data(vehicle_id, engine_state)
    WHERE engine_state IS NOT NULL;
  END IF;

  -- Fuel level monitoring (only if fuel_level column exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='telemetry_data' AND column_name='fuel_level')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='telemetry_data' AND column_name='vehicle_id') THEN
    CREATE INDEX IF NOT EXISTS idx_telemetry_fuel_level
    ON telemetry_data(vehicle_id, fuel_level)
    WHERE fuel_level IS NOT NULL;
  END IF;

  -- Battery voltage monitoring
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='telemetry_data' AND column_name='battery_voltage')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='telemetry_data' AND column_name='vehicle_id') THEN
    CREATE INDEX IF NOT EXISTS idx_telemetry_battery_voltage
    ON telemetry_data(vehicle_id, battery_voltage)
    WHERE battery_voltage IS NOT NULL;
  END IF;

END $$;

-- ============================================================================
-- 3. FUEL TRANSACTIONS INDEXES (Frequent Queries)
-- ============================================================================
-- Columns verified: vehicle_id, transaction_date, driver_id, tenant_id,
--                   fuel_type, total_cost, fuel_card_id, odometer
-- Column NOT present: odometer_reading (actual column is "odometer")
DO $$ BEGIN

  -- Vehicle fuel history
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fuel_transactions' AND column_name='vehicle_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fuel_transactions' AND column_name='transaction_date') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_transactions_vehicle_date
    ON fuel_transactions(vehicle_id, transaction_date DESC);
  END IF;

  -- Driver fuel history
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fuel_transactions' AND column_name='driver_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fuel_transactions' AND column_name='transaction_date') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_transactions_driver_date
    ON fuel_transactions(driver_id, transaction_date DESC)
    WHERE driver_id IS NOT NULL;
  END IF;

  -- Tenant fuel reporting
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fuel_transactions' AND column_name='tenant_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fuel_transactions' AND column_name='transaction_date') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_transactions_tenant_date
    ON fuel_transactions(tenant_id, transaction_date DESC);
  END IF;

  -- Fuel type analysis
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fuel_transactions' AND column_name='fuel_type') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_transactions_type
    ON fuel_transactions(fuel_type)
    WHERE fuel_type IS NOT NULL;
  END IF;

  -- Cost analysis queries
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fuel_transactions' AND column_name='tenant_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fuel_transactions' AND column_name='total_cost') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_transactions_cost
    ON fuel_transactions(tenant_id, total_cost DESC);
  END IF;

  -- Fuel card reconciliation
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fuel_transactions' AND column_name='fuel_card_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fuel_transactions' AND column_name='transaction_date') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_transactions_fuel_card
    ON fuel_transactions(fuel_card_id, transaction_date DESC)
    WHERE fuel_card_id IS NOT NULL;
  END IF;

  -- Odometer-based queries (actual column is "odometer", not "odometer_reading")
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fuel_transactions' AND column_name='vehicle_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fuel_transactions' AND column_name='odometer') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_transactions_odometer
    ON fuel_transactions(vehicle_id, odometer);
  END IF;

END $$;

-- ============================================================================
-- 4. HOS (HOURS OF SERVICE) LOGS INDEXES (Compliance Queries)
-- ============================================================================
-- Table hos_logs does NOT exist in current schema. All indexes are conditional.
DO $$ BEGIN

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='hos_logs') THEN

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hos_logs' AND column_name='driver_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hos_logs' AND column_name='start_time') THEN
      CREATE INDEX IF NOT EXISTS idx_hos_logs_driver_date
      ON hos_logs(driver_id, start_time DESC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hos_logs' AND column_name='driver_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hos_logs' AND column_name='is_violation') THEN
      CREATE INDEX IF NOT EXISTS idx_hos_logs_violations
      ON hos_logs(driver_id, is_violation)
      WHERE is_violation = true;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hos_logs' AND column_name='tenant_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hos_logs' AND column_name='start_time') THEN
      CREATE INDEX IF NOT EXISTS idx_hos_logs_tenant_date
      ON hos_logs(tenant_id, start_time DESC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hos_logs' AND column_name='driver_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hos_logs' AND column_name='status')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hos_logs' AND column_name='start_time') THEN
      CREATE INDEX IF NOT EXISTS idx_hos_logs_status
      ON hos_logs(driver_id, status, start_time DESC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hos_logs' AND column_name='vehicle_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hos_logs' AND column_name='start_time') THEN
      CREATE INDEX IF NOT EXISTS idx_hos_logs_vehicle_date
      ON hos_logs(vehicle_id, start_time DESC)
      WHERE vehicle_id IS NOT NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hos_logs' AND column_name='driver_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='hos_logs' AND column_name='duration_minutes') THEN
      CREATE INDEX IF NOT EXISTS idx_hos_logs_duration
      ON hos_logs(driver_id, duration_minutes DESC)
      WHERE duration_minutes > 0;
    END IF;

  END IF;

END $$;

-- ============================================================================
-- 5. WORK ORDERS INDEXES (Frequent Status Queries)
-- ============================================================================
-- Columns verified: vehicle_id, status, assigned_to_id, tenant_id,
--                   scheduled_start_date, scheduled_end_date, priority,
--                   type, actual_cost, actual_end_date, warranty_id
-- Column NOT present: facility_id
DO $$ BEGIN

  -- Vehicle maintenance history
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='vehicle_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle_status
    ON work_orders(vehicle_id, status);
  END IF;

  -- Active work orders for technicians
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='assigned_to_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_status
    ON work_orders(assigned_to_id, status)
    WHERE status != 'completed';
  END IF;

  -- Tenant work order dashboard
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='tenant_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_status
    ON work_orders(tenant_id, status);
  END IF;

  -- Scheduled work order queries
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='scheduled_start_date')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='scheduled_end_date') THEN
    CREATE INDEX IF NOT EXISTS idx_work_orders_scheduled_dates
    ON work_orders(scheduled_start_date, scheduled_end_date)
    WHERE scheduled_start_date IS NOT NULL;
  END IF;

  -- Priority-based queries
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='priority')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_work_orders_priority
    ON work_orders(priority, status);
  END IF;

  -- Work order type analysis
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='type')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_work_orders_type_status
    ON work_orders(type, status);
  END IF;

  -- Cost analysis
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='vehicle_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='actual_cost') THEN
    CREATE INDEX IF NOT EXISTS idx_work_orders_actual_cost
    ON work_orders(vehicle_id, actual_cost DESC)
    WHERE actual_cost IS NOT NULL;
  END IF;

  -- Completion tracking
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='actual_end_date') THEN
    CREATE INDEX IF NOT EXISTS idx_work_orders_completion
    ON work_orders(actual_end_date DESC)
    WHERE actual_end_date IS NOT NULL;
  END IF;

  -- Facility-based queries (only if facility_id column exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='facility_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='scheduled_start_date') THEN
    CREATE INDEX IF NOT EXISTS idx_work_orders_facility_date
    ON work_orders(facility_id, scheduled_start_date DESC)
    WHERE facility_id IS NOT NULL;
  END IF;

  -- Warranty-eligible work orders
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='warranty_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_work_orders_warranty
    ON work_orders(warranty_id, status)
    WHERE warranty_id IS NOT NULL;
  END IF;

END $$;

-- ============================================================================
-- 6. VEHICLES INDEXES (Core Entity)
-- ============================================================================
-- Columns verified: tenant_id, status, assigned_driver_id, assigned_facility_id,
--                   latitude, longitude, vin, license_plate, odometer
-- Columns NOT present: asset_category, power_type, fleet_id, acquisition_date
DO $$ BEGIN

  -- Tenant vehicle listings
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='tenant_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_status
    ON vehicles(tenant_id, status);
  END IF;

  -- Driver assignments (active only)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='assigned_driver_id') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_assigned_driver
    ON vehicles(assigned_driver_id)
    WHERE assigned_driver_id IS NOT NULL;
  END IF;

  -- Facility assignments
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='assigned_facility_id') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_assigned_facility
    ON vehicles(assigned_facility_id)
    WHERE assigned_facility_id IS NOT NULL;
  END IF;

  -- Geolocation queries
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='latitude')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='longitude') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_location
    ON vehicles(latitude, longitude)
    WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
  END IF;

  -- Asset category filtering (only if asset_category column exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='asset_category')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='tenant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_asset_category
    ON vehicles(tenant_id, asset_category)
    WHERE asset_category IS NOT NULL;
  END IF;

  -- Power type (EV vs ICE) queries (only if power_type column exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='power_type')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_power_type
    ON vehicles(power_type, status)
    WHERE power_type IS NOT NULL;
  END IF;

  -- VIN lookups
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='vin') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_vin
    ON vehicles(vin);
  END IF;

  -- License plate lookups
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='license_plate') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate
    ON vehicles(license_plate)
    WHERE license_plate IS NOT NULL;
  END IF;

  -- Odometer-based queries
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='odometer') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_odometer
    ON vehicles(odometer DESC)
    WHERE odometer IS NOT NULL;
  END IF;

  -- Fleet grouping (only if fleet_id column exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='fleet_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_fleet_id
    ON vehicles(fleet_id, status)
    WHERE fleet_id IS NOT NULL;
  END IF;

  -- Acquisition tracking (only if acquisition_date column exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='acquisition_date') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_acquisition_date
    ON vehicles(acquisition_date DESC)
    WHERE acquisition_date IS NOT NULL;
  END IF;

END $$;

-- ============================================================================
-- 7. DRIVERS INDEXES (Core Entity)
-- ============================================================================
-- Columns verified: tenant_id, status, license_expiry_date, user_id,
--                   license_number, cdl
-- Columns NOT present: driver_type, cdl_required (actual column is "cdl")
DO $$ BEGIN

  -- Tenant driver listings
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='tenant_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_tenant_status
    ON drivers(tenant_id, status);
  END IF;

  -- License expiration monitoring
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='license_expiry_date') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_license_expiry
    ON drivers(license_expiry_date ASC)
    WHERE license_expiry_date IS NOT NULL;
  END IF;

  -- User account linkage
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='user_id') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_user_id
    ON drivers(user_id)
    WHERE user_id IS NOT NULL;
  END IF;

  -- License number lookups
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='license_number') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_license_number
    ON drivers(license_number)
    WHERE license_number IS NOT NULL;
  END IF;

  -- Driver type filtering (only if driver_type column exists)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='driver_type')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_type
    ON drivers(driver_type, status)
    WHERE driver_type IS NOT NULL;
  END IF;

  -- CDL requirement queries (actual column is "cdl", not "cdl_required")
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='cdl')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_cdl
    ON drivers(cdl, status);
  END IF;

END $$;

-- ============================================================================
-- 8. VEHICLE ASSIGNMENTS INDEXES
-- ============================================================================
-- Table vehicle_assignments does NOT exist in current schema. All indexes conditional.
DO $$ BEGIN

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='vehicle_assignments') THEN

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_assignments' AND column_name='vehicle_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_assignments' AND column_name='assigned_date')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_assignments' AND column_name='return_date') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_vehicle_current
      ON vehicle_assignments(vehicle_id, assigned_date DESC)
      WHERE return_date IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_assignments' AND column_name='driver_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_assignments' AND column_name='assigned_date')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_assignments' AND column_name='return_date') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_driver_current
      ON vehicle_assignments(driver_id, assigned_date DESC)
      WHERE return_date IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_assignments' AND column_name='assigned_date')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_assignments' AND column_name='return_date') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_dates
      ON vehicle_assignments(assigned_date DESC, return_date DESC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_assignments' AND column_name='tenant_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_assignments' AND column_name='assigned_date') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_tenant
      ON vehicle_assignments(tenant_id, assigned_date DESC);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_assignments' AND column_name='vehicle_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_assignments' AND column_name='assigned_date')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicle_assignments' AND column_name='return_date') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_duration
      ON vehicle_assignments(vehicle_id, assigned_date, return_date);
    END IF;

  END IF;

END $$;

-- ============================================================================
-- 9. INCIDENTS INDEXES (Safety & Compliance)
-- ============================================================================
-- Columns verified: vehicle_id, driver_id, tenant_id, status, severity,
--                   incident_date, type, at_fault_party, estimated_cost, claim_id
-- Note: column is "type" (not "incident_type")
DO $$ BEGIN

  -- Vehicle incident history
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='incidents' AND column_name='vehicle_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='incidents' AND column_name='incident_date') THEN
    CREATE INDEX IF NOT EXISTS idx_incidents_vehicle_date
    ON incidents(vehicle_id, incident_date DESC);
  END IF;

  -- Driver incident history
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='incidents' AND column_name='driver_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='incidents' AND column_name='incident_date') THEN
    CREATE INDEX IF NOT EXISTS idx_incidents_driver_date
    ON incidents(driver_id, incident_date DESC)
    WHERE driver_id IS NOT NULL;
  END IF;

  -- Tenant incident reporting
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='incidents' AND column_name='tenant_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='incidents' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_incidents_tenant_status
    ON incidents(tenant_id, status);
  END IF;

  -- Severity-based queries (major/critical/fatal)
  -- incident_severity enum values: {minor,moderate,major,critical,fatal}
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='incidents' AND column_name='severity')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='incidents' AND column_name='incident_date') THEN
    CREATE INDEX IF NOT EXISTS idx_incidents_severity
    ON incidents(severity, incident_date DESC)
    WHERE severity IN ('major', 'critical', 'fatal');
  END IF;

  -- Incident type analysis (actual column is "type", not "incident_type")
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='incidents' AND column_name='type')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='incidents' AND column_name='incident_date') THEN
    CREATE INDEX IF NOT EXISTS idx_incidents_type
    ON incidents(type, incident_date DESC);
  END IF;

  -- At-fault analysis
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='incidents' AND column_name='at_fault_party')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='incidents' AND column_name='incident_date') THEN
    CREATE INDEX IF NOT EXISTS idx_incidents_at_fault
    ON incidents(at_fault_party, incident_date DESC)
    WHERE at_fault_party IS NOT NULL;
  END IF;

  -- Cost tracking
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='incidents' AND column_name='tenant_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='incidents' AND column_name='estimated_cost') THEN
    CREATE INDEX IF NOT EXISTS idx_incidents_cost
    ON incidents(tenant_id, estimated_cost DESC)
    WHERE estimated_cost IS NOT NULL;
  END IF;

  -- Insurance claim linkage
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='incidents' AND column_name='claim_id') THEN
    CREATE INDEX IF NOT EXISTS idx_incidents_claim
    ON incidents(claim_id)
    WHERE claim_id IS NOT NULL;
  END IF;

END $$;

-- ============================================================================
-- 10. MAINTENANCE SCHEDULES INDEXES
-- ============================================================================
-- Columns verified: vehicle_id, tenant_id, type, is_active, is_recurring,
--                   next_service_date
-- Columns NOT present: next_due_date (actual column is "next_service_date"),
--                      service_type (actual column is "type")
DO $$ BEGIN

  -- Vehicle maintenance schedule (actual column: next_service_date)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='maintenance_schedules' AND column_name='vehicle_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='maintenance_schedules' AND column_name='next_service_date') THEN
    CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_vehicle
    ON maintenance_schedules(vehicle_id, next_service_date ASC)
    WHERE next_service_date IS NOT NULL;
  END IF;

  -- Upcoming maintenance by due date (actual column: next_service_date)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='maintenance_schedules' AND column_name='next_service_date') THEN
    CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_upcoming
    ON maintenance_schedules(next_service_date ASC)
    WHERE next_service_date IS NOT NULL;
  END IF;

  -- Tenant maintenance planning (actual column: next_service_date)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='maintenance_schedules' AND column_name='tenant_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='maintenance_schedules' AND column_name='next_service_date') THEN
    CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_tenant
    ON maintenance_schedules(tenant_id, next_service_date ASC);
  END IF;

  -- Service type analysis (actual column: "type", not "service_type")
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='maintenance_schedules' AND column_name='type')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='maintenance_schedules' AND column_name='is_active') THEN
    CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_type
    ON maintenance_schedules(type, is_active)
    WHERE is_active = true;
  END IF;

  -- Recurring maintenance (actual column: next_service_date)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='maintenance_schedules' AND column_name='is_recurring')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='maintenance_schedules' AND column_name='next_service_date') THEN
    CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_recurring
    ON maintenance_schedules(is_recurring, next_service_date ASC)
    WHERE is_recurring = true;
  END IF;

END $$;

-- ============================================================================
-- 11. INSPECTIONS INDEXES
-- ============================================================================
-- Columns verified: vehicle_id, driver_id, tenant_id, type, status,
--                   inspector_id, started_at, passed_inspection
-- Columns NOT present: inspection_date (actual: started_at),
--                      inspection_type (actual: type),
--                      passed (actual: passed_inspection)
DO $$ BEGIN

  -- Vehicle inspection history (actual column: started_at)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inspections' AND column_name='vehicle_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inspections' AND column_name='started_at') THEN
    CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_date
    ON inspections(vehicle_id, started_at DESC);
  END IF;

  -- Driver inspection history (actual column: started_at)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inspections' AND column_name='driver_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inspections' AND column_name='started_at') THEN
    CREATE INDEX IF NOT EXISTS idx_inspections_driver_date
    ON inspections(driver_id, started_at DESC)
    WHERE driver_id IS NOT NULL;
  END IF;

  -- Tenant inspection compliance (actual column: started_at)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inspections' AND column_name='tenant_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inspections' AND column_name='started_at') THEN
    CREATE INDEX IF NOT EXISTS idx_inspections_tenant_date
    ON inspections(tenant_id, started_at DESC);
  END IF;

  -- Inspection type queries (actual column: "type", not "inspection_type")
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inspections' AND column_name='type')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inspections' AND column_name='status') THEN
    CREATE INDEX IF NOT EXISTS idx_inspections_type_status
    ON inspections(type, status);
  END IF;

  -- Failed inspections (actual column: passed_inspection, not "passed")
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inspections' AND column_name='vehicle_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inspections' AND column_name='started_at')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inspections' AND column_name='passed_inspection') THEN
    CREATE INDEX IF NOT EXISTS idx_inspections_failed
    ON inspections(vehicle_id, started_at DESC)
    WHERE passed_inspection = false;
  END IF;

  -- Inspector performance tracking
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inspections' AND column_name='inspector_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='inspections' AND column_name='started_at') THEN
    CREATE INDEX IF NOT EXISTS idx_inspections_inspector
    ON inspections(inspector_id, started_at DESC)
    WHERE inspector_id IS NOT NULL;
  END IF;

END $$;

-- ============================================================================
-- 12. CONDITIONAL INDEXES (tables that may or may not exist)
-- ============================================================================
-- Each table is checked with column-level validation before index creation.

-- Parts inventory
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='parts_inventory') THEN
    -- Actual column is "category" (not "part_category")
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='parts_inventory' AND column_name='part_number') THEN
      CREATE INDEX IF NOT EXISTS idx_parts_inventory_part_number ON parts_inventory(part_number);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='parts_inventory' AND column_name='tenant_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='parts_inventory' AND column_name='category') THEN
      CREATE INDEX IF NOT EXISTS idx_parts_inventory_tenant ON parts_inventory(tenant_id, category);
    END IF;
  END IF;
END $$;

-- Purchase orders
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='purchase_orders') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='purchase_orders' AND column_name='vendor_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='purchase_orders' AND column_name='order_date') THEN
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_vendor_date ON purchase_orders(vendor_id, order_date DESC);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='purchase_orders' AND column_name='tenant_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='purchase_orders' AND column_name='status') THEN
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant_status ON purchase_orders(tenant_id, status);
    END IF;
    -- Actual column is "number" (not "po_number")
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='purchase_orders' AND column_name='number') THEN
      CREATE INDEX IF NOT EXISTS idx_purchase_orders_number ON purchase_orders(number);
    END IF;
  END IF;
END $$;

-- Vendors
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='vendors') THEN
    -- Actual column is "name" (not "vendor_name") and "type" (not "vendor_type")
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vendors' AND column_name='is_active')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vendors' AND column_name='name') THEN
      CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active, name) WHERE is_active = true;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vendors' AND column_name='tenant_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vendors' AND column_name='type') THEN
      CREATE INDEX IF NOT EXISTS idx_vendors_tenant ON vendors(tenant_id, type);
    END IF;
  END IF;
END $$;

-- Facilities
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='facilities') THEN
    -- Actual column is "type" (not "facility_type")
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='facilities' AND column_name='tenant_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='facilities' AND column_name='is_active') THEN
      CREATE INDEX IF NOT EXISTS idx_facilities_active ON facilities(tenant_id, is_active) WHERE is_active = true;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='facilities' AND column_name='type')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='facilities' AND column_name='is_active') THEN
      CREATE INDEX IF NOT EXISTS idx_facilities_type ON facilities(type, is_active);
    END IF;
  END IF;
END $$;

-- Invoices
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='invoices') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='tenant_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='invoice_date') THEN
      CREATE INDEX IF NOT EXISTS idx_invoices_tenant_date ON invoices(tenant_id, invoice_date DESC);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='status')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='due_date') THEN
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status, due_date ASC);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='vendor_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='invoices' AND column_name='invoice_date') THEN
      CREATE INDEX IF NOT EXISTS idx_invoices_vendor_date ON invoices(vendor_id, invoice_date DESC);
    END IF;
  END IF;
END $$;

-- Notifications
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='notifications') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='user_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='created_at')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='is_read') THEN
      CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='tenant_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='notifications' AND column_name='created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_notifications_tenant_date ON notifications(tenant_id, created_at DESC);
    END IF;
  END IF;
END $$;

-- Alerts (table does not currently exist)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='alerts') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='alerts' AND column_name='vehicle_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='alerts' AND column_name='created_at')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='alerts' AND column_name='status') THEN
      CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(vehicle_id, created_at DESC) WHERE status = 'active';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='alerts' AND column_name='alert_type')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='alerts' AND column_name='severity')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='alerts' AND column_name='created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_alerts_type_severity ON alerts(alert_type, severity, created_at DESC);
    END IF;
  END IF;
END $$;

-- Geofences
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='geofences') THEN
    -- Actual column is "type" (not "geofence_type")
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='geofences' AND column_name='tenant_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='geofences' AND column_name='is_active') THEN
      CREATE INDEX IF NOT EXISTS idx_geofences_active ON geofences(tenant_id, is_active) WHERE is_active = true;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='geofences' AND column_name='type')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='geofences' AND column_name='is_active') THEN
      CREATE INDEX IF NOT EXISTS idx_geofences_type ON geofences(type, is_active);
    END IF;
  END IF;
END $$;

-- Geofence events (table does not currently exist)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='geofence_events') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='geofence_events' AND column_name='vehicle_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='geofence_events' AND column_name='event_timestamp') THEN
      CREATE INDEX IF NOT EXISTS idx_geofence_events_vehicle_date ON geofence_events(vehicle_id, event_timestamp DESC);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='geofence_events' AND column_name='geofence_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='geofence_events' AND column_name='event_timestamp') THEN
      CREATE INDEX IF NOT EXISTS idx_geofence_events_geofence_date ON geofence_events(geofence_id, event_timestamp DESC);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='geofence_events' AND column_name='event_type')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='geofence_events' AND column_name='event_timestamp') THEN
      CREATE INDEX IF NOT EXISTS idx_geofence_events_type ON geofence_events(event_type, event_timestamp DESC);
    END IF;
  END IF;
END $$;

-- Charging stations
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='charging_stations') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='charging_stations' AND column_name='tenant_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='charging_stations' AND column_name='status') THEN
      CREATE INDEX IF NOT EXISTS idx_charging_stations_active ON charging_stations(tenant_id, status) WHERE status = 'active';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='charging_stations' AND column_name='facility_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='charging_stations' AND column_name='status') THEN
      CREATE INDEX IF NOT EXISTS idx_charging_stations_facility ON charging_stations(facility_id, status);
    END IF;
  END IF;
END $$;

-- Charging sessions
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='charging_sessions') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='charging_sessions' AND column_name='vehicle_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='charging_sessions' AND column_name='start_time') THEN
      CREATE INDEX IF NOT EXISTS idx_charging_sessions_vehicle_date ON charging_sessions(vehicle_id, start_time DESC);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='charging_sessions' AND column_name='station_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='charging_sessions' AND column_name='start_time') THEN
      CREATE INDEX IF NOT EXISTS idx_charging_sessions_station_date ON charging_sessions(station_id, start_time DESC);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='charging_sessions' AND column_name='station_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='charging_sessions' AND column_name='start_time')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='charging_sessions' AND column_name='end_time') THEN
      CREATE INDEX IF NOT EXISTS idx_charging_sessions_active ON charging_sessions(station_id, start_time DESC) WHERE end_time IS NULL;
    END IF;
  END IF;
END $$;

-- Documents
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='documents') THEN
    -- Actual columns: related_entity_type/related_entity_id (not entity_type/entity_id)
    -- Actual column: "type" (not "document_type" for the original enum column)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='related_entity_type')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='related_entity_id') THEN
      CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(related_entity_type, related_entity_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='type')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_documents_type_date ON documents(type, created_at DESC);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='tenant_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='documents' AND column_name='created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_documents_tenant_date ON documents(tenant_id, created_at DESC);
    END IF;
  END IF;
END $$;

-- Audit logs
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='audit_logs') THEN
    -- Actual columns: entity_type/entity_id (not resource_type/resource_id)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='user_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date ON audit_logs(user_id, created_at DESC);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='tenant_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_date ON audit_logs(tenant_id, created_at DESC);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='action')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action_date ON audit_logs(action, created_at DESC);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='entity_type')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='entity_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='audit_logs' AND column_name='created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(entity_type, entity_id, created_at DESC);
    END IF;
  END IF;
END $$;

-- Users
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='users') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='tenant_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='is_active') THEN
      CREATE INDEX IF NOT EXISTS idx_users_tenant_active ON users(tenant_id, is_active);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='role')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='is_active') THEN
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role, is_active) WHERE is_active = true;
    END IF;
  END IF;
END $$;

-- Tenants
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tenants') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tenants' AND column_name='is_active')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='tenants' AND column_name='created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(is_active, created_at DESC) WHERE is_active = true;
    END IF;
  END IF;
END $$;

-- Routes
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='routes') THEN
    -- Actual columns: assigned_vehicle_id (not vehicle_id),
    --                 assigned_driver_id (not driver_id),
    --                 scheduled_start_time (not scheduled_start)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='routes' AND column_name='assigned_vehicle_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='routes' AND column_name='scheduled_start_time') THEN
      CREATE INDEX IF NOT EXISTS idx_routes_vehicle_date ON routes(assigned_vehicle_id, scheduled_start_time DESC);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='routes' AND column_name='assigned_driver_id')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='routes' AND column_name='scheduled_start_time') THEN
      CREATE INDEX IF NOT EXISTS idx_routes_driver_date ON routes(assigned_driver_id, scheduled_start_time DESC);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='routes' AND column_name='status')
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='routes' AND column_name='scheduled_start_time') THEN
      -- status enum values: {pending,in_progress,completed,cancelled,on_hold,failed}
      CREATE INDEX IF NOT EXISTS idx_routes_active ON routes(status, scheduled_start_time ASC) WHERE status IN ('pending', 'in_progress');
    END IF;
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE - PERFORMANCE VERIFICATION
-- ============================================================================

-- Run ANALYZE to update query planner statistics
ANALYZE;

-- Display index count summary
SELECT
    schemaname,
    tablename,
    COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY index_count DESC;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
