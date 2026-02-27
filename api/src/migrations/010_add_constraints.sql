-- ============================================================================
-- Migration: 010_add_constraints.sql
-- Description: Add data integrity constraints to prevent invalid data
-- Phase 4 - Agent 10
-- Date: 2026-02-02
-- Fixed: 2026-02-17 - Column name mismatches corrected, conditional checks added
-- ============================================================================

-- ============================================================================
-- SECTION 1: PREVENT NEGATIVE VALUES
-- ============================================================================

-- Vehicles table
DO $do$
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'odometer')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_vehicles_odometer_positive') THEN
    ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_odometer_positive CHECK (odometer IS NULL OR odometer >= 0);
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'fuel_level')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_vehicles_fuel_level_valid') THEN
    ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_fuel_level_valid CHECK (fuel_level IS NULL OR (fuel_level >= 0 AND fuel_level <= 100));
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'year')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_vehicles_year_valid') THEN
    ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_year_valid CHECK (year IS NULL OR (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 2));
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'purchase_price')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_vehicles_purchase_price_positive') THEN
    ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_purchase_price_positive CHECK (purchase_price IS NULL OR purchase_price >= 0);
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'current_value')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_vehicles_current_value_positive') THEN
    ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_current_value_positive CHECK (current_value IS NULL OR current_value >= 0);
  END IF;
END $do$;

-- GPS Tracks table
DO $do$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gps_tracks') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'gps_tracks' AND column_name = 'odometer')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_gps_tracks_odometer_positive') THEN
      ALTER TABLE gps_tracks ADD CONSTRAINT chk_gps_tracks_odometer_positive CHECK (odometer IS NULL OR odometer >= 0);
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'gps_tracks' AND column_name = 'speed')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_gps_tracks_speed_valid') THEN
      ALTER TABLE gps_tracks ADD CONSTRAINT chk_gps_tracks_speed_valid CHECK (speed IS NULL OR speed >= 0);
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'gps_tracks' AND column_name = 'fuel_level')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_gps_tracks_fuel_level_valid') THEN
      ALTER TABLE gps_tracks ADD CONSTRAINT chk_gps_tracks_fuel_level_valid CHECK (fuel_level IS NULL OR (fuel_level >= 0 AND fuel_level <= 100));
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'gps_tracks' AND column_name = 'accuracy')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_gps_tracks_accuracy_positive') THEN
      ALTER TABLE gps_tracks ADD CONSTRAINT chk_gps_tracks_accuracy_positive CHECK (accuracy IS NULL OR accuracy >= 0);
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'gps_tracks' AND column_name = 'heading')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_gps_tracks_heading_valid') THEN
      ALTER TABLE gps_tracks ADD CONSTRAINT chk_gps_tracks_heading_valid CHECK (heading IS NULL OR (heading >= 0 AND heading < 360));
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'gps_tracks' AND column_name = 'latitude')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_gps_tracks_latitude_valid') THEN
      ALTER TABLE gps_tracks ADD CONSTRAINT chk_gps_tracks_latitude_valid CHECK (latitude >= -90 AND latitude <= 90);
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'gps_tracks' AND column_name = 'longitude')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_gps_tracks_longitude_valid') THEN
      ALTER TABLE gps_tracks ADD CONSTRAINT chk_gps_tracks_longitude_valid CHECK (longitude >= -180 AND longitude <= 180);
    END IF;
  END IF;
END $do$;

-- Telemetry Data table
DO $do$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'telemetry_data') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'telemetry_data' AND column_name = 'engine_rpm')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_telemetry_rpm_valid') THEN
      ALTER TABLE telemetry_data ADD CONSTRAINT chk_telemetry_rpm_valid CHECK (engine_rpm IS NULL OR engine_rpm >= 0);
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'telemetry_data' AND column_name = 'engine_temperature')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_telemetry_temp_valid') THEN
      ALTER TABLE telemetry_data ADD CONSTRAINT chk_telemetry_temp_valid CHECK (engine_temperature IS NULL OR engine_temperature >= -50);
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'telemetry_data' AND column_name = 'battery_voltage')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_telemetry_battery_valid') THEN
      ALTER TABLE telemetry_data ADD CONSTRAINT chk_telemetry_battery_valid CHECK (battery_voltage IS NULL OR battery_voltage >= 0);
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'telemetry_data' AND column_name = 'oil_pressure')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_telemetry_oil_pressure_valid') THEN
      ALTER TABLE telemetry_data ADD CONSTRAINT chk_telemetry_oil_pressure_valid CHECK (oil_pressure IS NULL OR oil_pressure >= 0);
    END IF;
  END IF;
END $do$;

-- Assets table
DO $do$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assets') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'purchase_price')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_assets_purchase_price_positive') THEN
      ALTER TABLE assets ADD CONSTRAINT chk_assets_purchase_price_positive CHECK (purchase_price IS NULL OR purchase_price >= 0);
    END IF;

    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'current_value')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_assets_current_value_positive') THEN
      ALTER TABLE assets ADD CONSTRAINT chk_assets_current_value_positive CHECK (current_value IS NULL OR current_value >= 0);
    END IF;
  END IF;
END $do$;

-- ============================================================================
-- SECTION 2: PREVENT FUTURE DATES ON HISTORICAL RECORDS
-- ============================================================================

DO $do$
BEGIN
  -- fuel_transactions.transaction_date
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'fuel_transactions' AND column_name = 'transaction_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_fuel_transaction_date_not_future') THEN
    ALTER TABLE fuel_transactions ADD CONSTRAINT chk_fuel_transaction_date_not_future CHECK (transaction_date <= NOW());
  END IF;

  -- incidents.incident_date
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'incident_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_incident_date_not_future') THEN
    ALTER TABLE incidents ADD CONSTRAINT chk_incident_date_not_future CHECK (incident_date <= NOW());
  END IF;
END $do$;

-- inspections (may have inspection_date or started_at)
DO $do$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inspections') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'inspections' AND column_name = 'inspection_date')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_inspection_date_not_future') THEN
      ALTER TABLE inspections ADD CONSTRAINT chk_inspection_date_not_future CHECK (inspection_date <= NOW());
    ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'inspections' AND column_name = 'started_at')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_inspection_date_not_future') THEN
      ALTER TABLE inspections ADD CONSTRAINT chk_inspection_date_not_future CHECK (started_at <= NOW());
    END IF;
  END IF;
END $do$;

DO $do$
BEGIN
  -- certifications.issued_date
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'certifications' AND column_name = 'issued_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_certification_issued_not_future') THEN
    ALTER TABLE certifications ADD CONSTRAINT chk_certification_issued_not_future CHECK (issued_date <= NOW());
  END IF;

  -- training_records.completion_date
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'training_records' AND column_name = 'completion_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_training_completed_not_future') THEN
    ALTER TABLE training_records ADD CONSTRAINT chk_training_completed_not_future CHECK (completion_date IS NULL OR completion_date <= NOW());
  END IF;

  -- maintenance_schedules.last_service_date
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'maintenance_schedules' AND column_name = 'last_service_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_maintenance_last_service_not_future') THEN
    ALTER TABLE maintenance_schedules ADD CONSTRAINT chk_maintenance_last_service_not_future CHECK (last_service_date IS NULL OR last_service_date <= NOW());
  END IF;

  -- work_orders.actual_start_date
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'actual_start_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_work_order_actual_start_not_future') THEN
    ALTER TABLE work_orders ADD CONSTRAINT chk_work_order_actual_start_not_future CHECK (actual_start_date IS NULL OR actual_start_date <= NOW());
  END IF;

  -- work_orders.actual_end_date
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'actual_end_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_work_order_actual_end_not_future') THEN
    ALTER TABLE work_orders ADD CONSTRAINT chk_work_order_actual_end_not_future CHECK (actual_end_date IS NULL OR actual_end_date <= NOW());
  END IF;

  -- purchase_orders.order_date
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'order_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_po_date_not_future') THEN
    ALTER TABLE purchase_orders ADD CONSTRAINT chk_po_date_not_future CHECK (order_date <= NOW());
  END IF;

  -- invoices.invoice_date
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_invoice_date_not_future') THEN
    ALTER TABLE invoices ADD CONSTRAINT chk_invoice_date_not_future CHECK (invoice_date <= NOW());
  END IF;

  -- charging_sessions.start_time
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'charging_sessions' AND column_name = 'start_time')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_charging_start_not_future') THEN
    ALTER TABLE charging_sessions ADD CONSTRAINT chk_charging_start_not_future CHECK (start_time <= NOW());
  END IF;

  -- assets.purchase_date
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'purchase_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_asset_purchase_not_future') THEN
    ALTER TABLE assets ADD CONSTRAINT chk_asset_purchase_not_future CHECK (purchase_date IS NULL OR purchase_date <= NOW());
  END IF;

  -- assets.last_maintenance_date
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'last_maintenance_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_asset_last_maintenance_not_future') THEN
    ALTER TABLE assets ADD CONSTRAINT chk_asset_last_maintenance_not_future CHECK (last_maintenance_date IS NULL OR last_maintenance_date <= NOW());
  END IF;

  -- audit_logs.created_at
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'created_at')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_audit_created_not_future') THEN
    ALTER TABLE audit_logs ADD CONSTRAINT chk_audit_created_not_future CHECK (created_at <= NOW());
  END IF;

  -- gps_tracks.timestamp (allow 5 minute clock skew)
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'gps_tracks' AND column_name = 'timestamp')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_gps_timestamp_not_future') THEN
    ALTER TABLE gps_tracks ADD CONSTRAINT chk_gps_timestamp_not_future CHECK ("timestamp" <= NOW() + INTERVAL '5 minutes');
  END IF;
END $do$;

-- ============================================================================
-- SECTION 3: ENSURE DATE RANGES ARE LOGICAL
-- ============================================================================

DO $do$
BEGIN
  -- work_orders: scheduled_end_date >= scheduled_start_date
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'scheduled_end_date')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'scheduled_start_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_work_order_scheduled_dates') THEN
    ALTER TABLE work_orders ADD CONSTRAINT chk_work_order_scheduled_dates CHECK (scheduled_end_date IS NULL OR scheduled_end_date >= scheduled_start_date);
  END IF;

  -- work_orders: actual_end_date >= actual_start_date
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'actual_end_date')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'actual_start_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_work_order_actual_dates') THEN
    ALTER TABLE work_orders ADD CONSTRAINT chk_work_order_actual_dates CHECK (actual_end_date IS NULL OR actual_end_date >= actual_start_date);
  END IF;

  -- routes: scheduled_end_time >= scheduled_start_time
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'scheduled_end_time')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'scheduled_start_time')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_route_scheduled_times') THEN
    ALTER TABLE routes ADD CONSTRAINT chk_route_scheduled_times CHECK (scheduled_end_time IS NULL OR scheduled_end_time >= scheduled_start_time);
  END IF;

  -- routes: actual_end_time >= actual_start_time
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'actual_end_time')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'actual_start_time')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_route_actual_times') THEN
    ALTER TABLE routes ADD CONSTRAINT chk_route_actual_times CHECK (actual_end_time IS NULL OR actual_end_time >= actual_start_time);
  END IF;

  -- charging_sessions: end_time >= start_time
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'charging_sessions' AND column_name = 'end_time')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'charging_sessions' AND column_name = 'start_time')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_charging_times') THEN
    ALTER TABLE charging_sessions ADD CONSTRAINT chk_charging_times CHECK (end_time IS NULL OR end_time >= start_time);
  END IF;

  -- training_records: completion_date >= start_date
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'training_records' AND column_name = 'completion_date')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'training_records' AND column_name = 'start_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_training_dates') THEN
    ALTER TABLE training_records ADD CONSTRAINT chk_training_dates CHECK (completion_date IS NULL OR completion_date >= start_date);
  END IF;

  -- certifications: expiry_date >= issued_date
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'certifications' AND column_name = 'expiry_date')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'certifications' AND column_name = 'issued_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_certification_dates') THEN
    ALTER TABLE certifications ADD CONSTRAINT chk_certification_dates CHECK (expiry_date >= issued_date);
  END IF;
END $do$;

-- dispatches: date range checks using actual columns (dispatched_at, completed_at)
DO $do$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dispatches') THEN
    -- dispatched_at should not be far in the future
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'dispatched_at')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_dispatch_times') THEN
      ALTER TABLE dispatches ADD CONSTRAINT chk_dispatch_times CHECK (dispatched_at <= NOW() + INTERVAL '5 minutes');
    END IF;

    -- completed_at >= dispatched_at
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'completed_at')
      AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'dispatched_at')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_dispatch_end_times') THEN
      ALTER TABLE dispatches ADD CONSTRAINT chk_dispatch_end_times CHECK (completed_at IS NULL OR completed_at >= dispatched_at);
    END IF;

    -- acknowledged_at >= dispatched_at
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'acknowledged_at')
      AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'dispatched_at')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_dispatch_acknowledged_times') THEN
      ALTER TABLE dispatches ADD CONSTRAINT chk_dispatch_acknowledged_times CHECK (acknowledged_at IS NULL OR acknowledged_at >= dispatched_at);
    END IF;

    -- arrived_at >= dispatched_at
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'arrived_at')
      AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'dispatched_at')
      AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_dispatch_arrived_times') THEN
      ALTER TABLE dispatches ADD CONSTRAINT chk_dispatch_arrived_times CHECK (arrived_at IS NULL OR arrived_at >= dispatched_at);
    END IF;
  END IF;
END $do$;

DO $do$
BEGIN
  -- announcements: expires_at >= published_at
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'expires_at')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'published_at')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_announcement_dates') THEN
    ALTER TABLE announcements ADD CONSTRAINT chk_announcement_dates CHECK (expires_at IS NULL OR published_at IS NULL OR expires_at >= published_at);
  END IF;

  -- maintenance_schedules: next_service_date >= last_service_date
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'maintenance_schedules' AND column_name = 'next_service_date')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'maintenance_schedules' AND column_name = 'last_service_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_maintenance_schedule_dates') THEN
    ALTER TABLE maintenance_schedules ADD CONSTRAINT chk_maintenance_schedule_dates CHECK (next_service_date IS NULL OR last_service_date IS NULL OR next_service_date >= last_service_date);
  END IF;

  -- assets: next_maintenance_date >= last_maintenance_date
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'next_maintenance_date')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assets' AND column_name = 'last_maintenance_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_asset_maintenance_dates') THEN
    ALTER TABLE assets ADD CONSTRAINT chk_asset_maintenance_dates CHECK (next_maintenance_date IS NULL OR last_maintenance_date IS NULL OR next_maintenance_date >= last_maintenance_date);
  END IF;
END $do$;

-- ============================================================================
-- SECTION 4: ENSURE AMOUNTS ARE POSITIVE
-- ============================================================================

DO $do$
BEGIN
  -- invoices
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'total_amount')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_invoice_amount_positive') THEN
    ALTER TABLE invoices ADD CONSTRAINT chk_invoice_amount_positive CHECK (total_amount >= 0);
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'subtotal')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_invoice_subtotal_positive') THEN
    ALTER TABLE invoices ADD CONSTRAINT chk_invoice_subtotal_positive CHECK (subtotal IS NULL OR subtotal >= 0);
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tax_amount')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_invoice_tax_positive') THEN
    ALTER TABLE invoices ADD CONSTRAINT chk_invoice_tax_positive CHECK (tax_amount IS NULL OR tax_amount >= 0);
  END IF;

  -- work_orders
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'estimated_cost')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_work_order_estimated_cost_positive') THEN
    ALTER TABLE work_orders ADD CONSTRAINT chk_work_order_estimated_cost_positive CHECK (estimated_cost IS NULL OR estimated_cost >= 0);
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'actual_cost')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_work_order_actual_cost_positive') THEN
    ALTER TABLE work_orders ADD CONSTRAINT chk_work_order_actual_cost_positive CHECK (actual_cost IS NULL OR actual_cost >= 0);
  END IF;

  -- fuel_transactions
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'fuel_transactions' AND column_name = 'gallons')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_fuel_gallons_positive') THEN
    ALTER TABLE fuel_transactions ADD CONSTRAINT chk_fuel_gallons_positive CHECK (gallons > 0);
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'fuel_transactions' AND column_name = 'cost_per_gallon')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_fuel_cost_per_gallon_positive') THEN
    ALTER TABLE fuel_transactions ADD CONSTRAINT chk_fuel_cost_per_gallon_positive CHECK (cost_per_gallon > 0);
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'fuel_transactions' AND column_name = 'total_cost')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_fuel_total_cost_positive') THEN
    ALTER TABLE fuel_transactions ADD CONSTRAINT chk_fuel_total_cost_positive CHECK (total_cost > 0);
  END IF;

  -- fuel_transactions odometer (column is named 'odometer' in actual schema)
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'fuel_transactions' AND column_name = 'odometer')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_fuel_odometer_positive') THEN
    ALTER TABLE fuel_transactions ADD CONSTRAINT chk_fuel_odometer_positive CHECK (odometer >= 0);
  END IF;

  -- parts_inventory
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'parts_inventory' AND column_name = 'unit_cost')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_part_cost_positive') THEN
    ALTER TABLE parts_inventory ADD CONSTRAINT chk_part_cost_positive CHECK (unit_cost IS NULL OR unit_cost >= 0);
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'parts_inventory' AND column_name = 'quantity_on_hand')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_part_quantity_nonnegative') THEN
    ALTER TABLE parts_inventory ADD CONSTRAINT chk_part_quantity_nonnegative CHECK (quantity_on_hand >= 0);
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'parts_inventory' AND column_name = 'reorder_point')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_part_reorder_nonnegative') THEN
    ALTER TABLE parts_inventory ADD CONSTRAINT chk_part_reorder_nonnegative CHECK (reorder_point IS NULL OR reorder_point >= 0);
  END IF;

  -- purchase_orders
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'total_amount')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_po_total_positive') THEN
    ALTER TABLE purchase_orders ADD CONSTRAINT chk_po_total_positive CHECK (total_amount >= 0);
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'subtotal')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_po_subtotal_positive') THEN
    ALTER TABLE purchase_orders ADD CONSTRAINT chk_po_subtotal_positive CHECK (subtotal IS NULL OR subtotal >= 0);
  END IF;

  -- charging_sessions: energy_delivered_kwh (was incorrectly kwh_consumed)
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'charging_sessions' AND column_name = 'energy_delivered_kwh')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_charging_kwh_positive') THEN
    ALTER TABLE charging_sessions ADD CONSTRAINT chk_charging_kwh_positive CHECK (energy_delivered_kwh IS NULL OR energy_delivered_kwh >= 0);
  END IF;

  -- charging_sessions: cost
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'charging_sessions' AND column_name = 'cost')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_charging_cost_positive') THEN
    ALTER TABLE charging_sessions ADD CONSTRAINT chk_charging_cost_positive CHECK (cost IS NULL OR cost >= 0);
  END IF;

  -- charging_sessions: start_soc_percent and end_soc_percent (was incorrectly start_soc/end_soc)
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'charging_sessions' AND column_name = 'start_soc_percent')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'charging_sessions' AND column_name = 'end_soc_percent')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_charging_soc_valid') THEN
    ALTER TABLE charging_sessions ADD CONSTRAINT chk_charging_soc_valid CHECK (
      (start_soc_percent IS NULL OR (start_soc_percent >= 0 AND start_soc_percent <= 100)) AND
      (end_soc_percent IS NULL OR (end_soc_percent >= 0 AND end_soc_percent <= 100))
    );
  END IF;

  -- incidents: estimated_cost and actual_cost (was incorrectly 'cost')
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'estimated_cost')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_incident_estimated_cost_positive') THEN
    ALTER TABLE incidents ADD CONSTRAINT chk_incident_estimated_cost_positive CHECK (estimated_cost IS NULL OR estimated_cost >= 0);
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'actual_cost')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_incident_actual_cost_positive') THEN
    ALTER TABLE incidents ADD CONSTRAINT chk_incident_actual_cost_positive CHECK (actual_cost IS NULL OR actual_cost >= 0);
  END IF;
END $do$;

-- ============================================================================
-- SECTION 5: ENSURE VALID STATUS VALUES
-- ============================================================================
-- Note: Most status fields use ENUMs which already enforce valid values.
-- These add additional business logic constraints.

DO $do$
BEGIN
  -- work_orders: completed status requires actual dates
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'status')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'actual_start_date')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'actual_end_date')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_work_order_completed_has_dates') THEN
    ALTER TABLE work_orders ADD CONSTRAINT chk_work_order_completed_has_dates CHECK (
      status != 'completed' OR (actual_start_date IS NOT NULL AND actual_end_date IS NOT NULL)
    );
  END IF;

  -- work_orders: completed status requires actual cost
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'status')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'actual_cost')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_work_order_completed_has_cost') THEN
    ALTER TABLE work_orders ADD CONSTRAINT chk_work_order_completed_has_cost CHECK (
      status != 'completed' OR actual_cost IS NOT NULL
    );
  END IF;

  -- routes: completed status requires actual times
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'status')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'actual_start_time')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'actual_end_time')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_route_completed_has_times') THEN
    ALTER TABLE routes ADD CONSTRAINT chk_route_completed_has_times CHECK (
      status != 'completed' OR (actual_start_time IS NOT NULL AND actual_end_time IS NOT NULL)
    );
  END IF;

  -- charging_sessions: if end_time exists, end_soc_percent should exist
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'charging_sessions' AND column_name = 'end_time')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'charging_sessions' AND column_name = 'end_soc_percent')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_charging_completed_has_end') THEN
    ALTER TABLE charging_sessions ADD CONSTRAINT chk_charging_completed_has_end CHECK (
      end_time IS NULL OR (end_time IS NOT NULL AND end_soc_percent IS NOT NULL)
    );
  END IF;

  -- training_records: passed requires score
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'training_records' AND column_name = 'passed')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'training_records' AND column_name = 'score')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_training_passed_has_score') THEN
    ALTER TABLE training_records ADD CONSTRAINT chk_training_passed_has_score CHECK (
      (passed IS NULL OR passed = false) OR score IS NOT NULL
    );
  END IF;

  -- certifications: verified_at requires verified_by_id
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'certifications' AND column_name = 'verified_at')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'certifications' AND column_name = 'verified_by_id')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_certification_verified_has_verifier') THEN
    ALTER TABLE certifications ADD CONSTRAINT chk_certification_verified_has_verifier CHECK (
      verified_at IS NULL OR verified_by_id IS NOT NULL
    );
  END IF;

  -- purchase_orders: approved_at requires approved_by_id
  -- Note: purchase_orders.status uses the 'status' enum which does not include 'approved'.
  -- Instead, we validate that if approved_at is set, approved_by_id must also be set.
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'approved_at')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'purchase_orders' AND column_name = 'approved_by_id')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_po_approved_has_approver') THEN
    ALTER TABLE purchase_orders ADD CONSTRAINT chk_po_approved_has_approver CHECK (
      approved_at IS NULL OR approved_by_id IS NOT NULL
    );
  END IF;

  -- announcements: active announcements require published_at
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'is_active')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'published_at')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_announcement_published_has_date') THEN
    ALTER TABLE announcements ADD CONSTRAINT chk_announcement_published_has_date CHECK (
      is_active = false OR published_at IS NOT NULL
    );
  END IF;

  -- dispatches: completed status requires completed_at (using actual column names)
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'status')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'dispatches' AND column_name = 'completed_at')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_dispatch_completed_has_times') THEN
    ALTER TABLE dispatches ADD CONSTRAINT chk_dispatch_completed_has_times CHECK (
      status != 'completed' OR completed_at IS NOT NULL
    );
  END IF;
END $do$;

-- ============================================================================
-- SECTION 6: REFERENTIAL INTEGRITY & DATA CONSISTENCY
-- ============================================================================

DO $do$
BEGIN
  -- fuel_transactions: total_cost should roughly equal gallons * cost_per_gallon
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'fuel_transactions' AND column_name = 'total_cost')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'fuel_transactions' AND column_name = 'gallons')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'fuel_transactions' AND column_name = 'cost_per_gallon')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_fuel_calculation_valid') THEN
    ALTER TABLE fuel_transactions ADD CONSTRAINT chk_fuel_calculation_valid CHECK (ABS(total_cost - (gallons * cost_per_gallon)) < 0.01);
  END IF;

  -- charging_sessions: end_soc_percent >= start_soc_percent (SOC should increase during charge)
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'charging_sessions' AND column_name = 'start_soc_percent')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'charging_sessions' AND column_name = 'end_soc_percent')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_charging_soc_increase') THEN
    ALTER TABLE charging_sessions ADD CONSTRAINT chk_charging_soc_increase CHECK (
      start_soc_percent IS NULL OR end_soc_percent IS NULL OR end_soc_percent >= start_soc_percent
    );
  END IF;

  -- parts_inventory: sanity check reorder_point vs quantity_on_hand
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'parts_inventory' AND column_name = 'reorder_point')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'parts_inventory' AND column_name = 'quantity_on_hand')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_part_quantity_vs_reorder') THEN
    ALTER TABLE parts_inventory ADD CONSTRAINT chk_part_quantity_vs_reorder CHECK (
      reorder_point IS NULL OR reorder_point < quantity_on_hand + 1000
    );
  END IF;

  -- vehicles: current_value <= purchase_price (depreciation)
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'purchase_price')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'current_value')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_vehicle_value_vs_purchase') THEN
    ALTER TABLE vehicles ADD CONSTRAINT chk_vehicle_value_vs_purchase CHECK (
      purchase_price IS NULL OR current_value IS NULL OR current_value <= purchase_price
    );
  END IF;

  -- work_orders: actual_cost <= estimated_cost * 3 (prevent extreme overruns)
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'estimated_cost')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'work_orders' AND column_name = 'actual_cost')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_work_order_actual_vs_estimated') THEN
    ALTER TABLE work_orders ADD CONSTRAINT chk_work_order_actual_vs_estimated CHECK (
      estimated_cost IS NULL OR actual_cost IS NULL OR actual_cost <= estimated_cost * 3
    );
  END IF;

  -- invoices: total_amount roughly equals subtotal + tax_amount
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'total_amount')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'subtotal')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'tax_amount')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_invoice_total_calculation') THEN
    ALTER TABLE invoices ADD CONSTRAINT chk_invoice_total_calculation CHECK (
      subtotal IS NULL OR tax_amount IS NULL OR ABS(total_amount - (subtotal + tax_amount)) < 0.01
    );
  END IF;

  -- routes: estimated_distance reasonable (max 5000 miles for single route)
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'estimated_distance')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_route_distance_reasonable') THEN
    ALTER TABLE routes ADD CONSTRAINT chk_route_distance_reasonable CHECK (
      estimated_distance IS NULL OR estimated_distance <= 5000
    );
  END IF;

  -- routes: actual_distance <= estimated_distance * 1.5
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'estimated_distance')
    AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'actual_distance')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_route_actual_vs_planned') THEN
    ALTER TABLE routes ADD CONSTRAINT chk_route_actual_vs_planned CHECK (
      estimated_distance IS NULL OR actual_distance IS NULL OR actual_distance <= estimated_distance * 1.5
    );
  END IF;

  -- gps_tracks: speed <= 150 mph
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'gps_tracks' AND column_name = 'speed')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_gps_speed_reasonable') THEN
    ALTER TABLE gps_tracks ADD CONSTRAINT chk_gps_speed_reasonable CHECK (speed IS NULL OR speed <= 150);
  END IF;

  -- telemetry_data: engine_rpm <= 8000
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'telemetry_data' AND column_name = 'engine_rpm')
    AND NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'chk_telemetry_rpm_reasonable') THEN
    ALTER TABLE telemetry_data ADD CONSTRAINT chk_telemetry_rpm_reasonable CHECK (engine_rpm IS NULL OR engine_rpm <= 8000);
  END IF;
END $do$;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- All constraints wrapped in DO $$ blocks with IF EXISTS checks on columns
-- and NOT EXISTS checks on constraint names for full idempotency.
--
-- Column name corrections from original:
-- - charging_sessions: kwh_consumed -> energy_delivered_kwh
-- - charging_sessions: start_soc/end_soc -> start_soc_percent/end_soc_percent
-- - incidents: cost -> estimated_cost/actual_cost (separate constraints)
-- - incidents: removed resolved_at constraint (column does not exist)
-- - dispatches: actual_start_time/actual_end_time -> dispatched_at/completed_at
-- - routes: planned_distance_miles -> estimated_distance
-- - routes: actual_distance_miles -> actual_distance
-- - telemetry_data: removed vehicle_speed/throttle_position/fuel_level/odometer
--   constraints (columns do not exist on this table)
-- - fuel_transactions: odometer_reading fallback removed (column is 'odometer')
--
-- Performance impact: Minimal - constraints are checked only on INSERT/UPDATE
-- Rollback: DROP CONSTRAINT for each constraint name
-- ============================================================================
