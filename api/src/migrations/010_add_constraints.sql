-- ============================================================================
-- Migration: 010_add_constraints.sql
-- Description: Add 85 data integrity constraints to prevent invalid data
-- Phase 4 - Agent 10
-- Date: 2026-02-02
-- ============================================================================

-- ============================================================================
-- SECTION 1: PREVENT NEGATIVE VALUES (20 constraints)
-- ============================================================================

-- Vehicles table
ALTER TABLE vehicles
ADD CONSTRAINT chk_vehicles_odometer_positive
CHECK (odometer IS NULL OR odometer >= 0);

ALTER TABLE vehicles
ADD CONSTRAINT chk_vehicles_fuel_level_valid
CHECK (fuel_level IS NULL OR (fuel_level >= 0 AND fuel_level <= 100));

ALTER TABLE vehicles
ADD CONSTRAINT chk_vehicles_year_valid
CHECK (year IS NULL OR (year >= 1900 AND year <= EXTRACT(YEAR FROM NOW()) + 2));

ALTER TABLE vehicles
ADD CONSTRAINT chk_vehicles_purchase_price_positive
CHECK (purchase_price IS NULL OR purchase_price >= 0);

ALTER TABLE vehicles
ADD CONSTRAINT chk_vehicles_current_value_positive
CHECK (current_value IS NULL OR current_value >= 0);

-- GPS Tracks table
ALTER TABLE gps_tracks
ADD CONSTRAINT chk_gps_tracks_odometer_positive
CHECK (odometer IS NULL OR odometer >= 0);

ALTER TABLE gps_tracks
ADD CONSTRAINT chk_gps_tracks_speed_valid
CHECK (speed IS NULL OR speed >= 0);

ALTER TABLE gps_tracks
ADD CONSTRAINT chk_gps_tracks_fuel_level_valid
CHECK (fuel_level IS NULL OR (fuel_level >= 0 AND fuel_level <= 100));

ALTER TABLE gps_tracks
ADD CONSTRAINT chk_gps_tracks_accuracy_positive
CHECK (accuracy IS NULL OR accuracy >= 0);

ALTER TABLE gps_tracks
ADD CONSTRAINT chk_gps_tracks_heading_valid
CHECK (heading IS NULL OR (heading >= 0 AND heading < 360));

ALTER TABLE gps_tracks
ADD CONSTRAINT chk_gps_tracks_latitude_valid
CHECK (latitude >= -90 AND latitude <= 90);

ALTER TABLE gps_tracks
ADD CONSTRAINT chk_gps_tracks_longitude_valid
CHECK (longitude >= -180 AND longitude <= 180);

-- Telemetry Data table
ALTER TABLE telemetry_data
ADD CONSTRAINT chk_telemetry_rpm_valid
CHECK (engine_rpm IS NULL OR engine_rpm >= 0);

ALTER TABLE telemetry_data
ADD CONSTRAINT chk_telemetry_temp_valid
CHECK (engine_temperature IS NULL OR engine_temperature >= -50);

ALTER TABLE telemetry_data
ADD CONSTRAINT chk_telemetry_speed_valid
CHECK (vehicle_speed IS NULL OR vehicle_speed >= 0);

ALTER TABLE telemetry_data
ADD CONSTRAINT chk_telemetry_throttle_valid
CHECK (throttle_position IS NULL OR (throttle_position >= 0 AND throttle_position <= 100));

ALTER TABLE telemetry_data
ADD CONSTRAINT chk_telemetry_fuel_valid
CHECK (fuel_level IS NULL OR (fuel_level >= 0 AND fuel_level <= 100));

ALTER TABLE telemetry_data
ADD CONSTRAINT chk_telemetry_odometer_positive
CHECK (odometer IS NULL OR odometer >= 0);

-- Assets table
ALTER TABLE assets
ADD CONSTRAINT chk_assets_purchase_price_positive
CHECK (purchase_price IS NULL OR purchase_price >= 0);

ALTER TABLE assets
ADD CONSTRAINT chk_assets_current_value_positive
CHECK (current_value IS NULL OR current_value >= 0);

-- ============================================================================
-- SECTION 2: PREVENT FUTURE DATES ON HISTORICAL RECORDS (15 constraints)
-- ============================================================================

ALTER TABLE fuel_transactions
ADD CONSTRAINT chk_fuel_transaction_date_not_future
CHECK (transaction_date <= NOW());

ALTER TABLE incidents
ADD CONSTRAINT chk_incident_date_not_future
CHECK (incident_date <= NOW());

ALTER TABLE inspections
ADD CONSTRAINT chk_inspection_date_not_future
CHECK (inspection_date <= NOW());

ALTER TABLE certifications
ADD CONSTRAINT chk_certification_issued_not_future
CHECK (issued_date <= NOW());

ALTER TABLE training_records
ADD CONSTRAINT chk_training_completed_not_future
CHECK (completion_date IS NULL OR completion_date <= NOW());

ALTER TABLE maintenance_schedules
ADD CONSTRAINT chk_maintenance_last_service_not_future
CHECK (last_service_date IS NULL OR last_service_date <= NOW());

ALTER TABLE work_orders
ADD CONSTRAINT chk_work_order_actual_start_not_future
CHECK (actual_start_date IS NULL OR actual_start_date <= NOW());

ALTER TABLE work_orders
ADD CONSTRAINT chk_work_order_actual_end_not_future
CHECK (actual_end_date IS NULL OR actual_end_date <= NOW());

ALTER TABLE purchase_orders
ADD CONSTRAINT chk_po_date_not_future
CHECK (order_date <= NOW());

ALTER TABLE invoices
ADD CONSTRAINT chk_invoice_date_not_future
CHECK (invoice_date <= NOW());

ALTER TABLE charging_sessions
ADD CONSTRAINT chk_charging_start_not_future
CHECK (start_time <= NOW());

ALTER TABLE assets
ADD CONSTRAINT chk_asset_purchase_not_future
CHECK (purchase_date IS NULL OR purchase_date <= NOW());

ALTER TABLE assets
ADD CONSTRAINT chk_asset_last_maintenance_not_future
CHECK (last_maintenance_date IS NULL OR last_maintenance_date <= NOW());

ALTER TABLE audit_logs
ADD CONSTRAINT chk_audit_created_not_future
CHECK (created_at <= NOW());

ALTER TABLE gps_tracks
ADD CONSTRAINT chk_gps_timestamp_not_future
CHECK (timestamp <= NOW() + INTERVAL '5 minutes'); -- Allow 5 minute clock skew

-- ============================================================================
-- SECTION 3: ENSURE DATE RANGES ARE LOGICAL (12 constraints)
-- ============================================================================

ALTER TABLE work_orders
ADD CONSTRAINT chk_work_order_scheduled_dates
CHECK (scheduled_end_date IS NULL OR scheduled_end_date >= scheduled_start_date);

ALTER TABLE work_orders
ADD CONSTRAINT chk_work_order_actual_dates
CHECK (actual_end_date IS NULL OR actual_end_date >= actual_start_date);

ALTER TABLE routes
ADD CONSTRAINT chk_route_scheduled_times
CHECK (scheduled_end_time IS NULL OR scheduled_end_time >= scheduled_start_time);

ALTER TABLE routes
ADD CONSTRAINT chk_route_actual_times
CHECK (actual_end_time IS NULL OR actual_end_time >= actual_start_time);

ALTER TABLE charging_sessions
ADD CONSTRAINT chk_charging_times
CHECK (end_time IS NULL OR end_time >= start_time);

ALTER TABLE training_records
ADD CONSTRAINT chk_training_dates
CHECK (completion_date IS NULL OR completion_date >= start_date);

ALTER TABLE certifications
ADD CONSTRAINT chk_certification_dates
CHECK (expiry_date >= issued_date);

ALTER TABLE dispatches
ADD CONSTRAINT chk_dispatch_times
CHECK (actual_start_time IS NULL OR actual_start_time >= scheduled_start_time - INTERVAL '1 hour');

ALTER TABLE dispatches
ADD CONSTRAINT chk_dispatch_end_times
CHECK (actual_end_time IS NULL OR actual_end_time >= actual_start_time);

ALTER TABLE announcements
ADD CONSTRAINT chk_announcement_dates
CHECK (expires_at IS NULL OR expires_at >= published_at);

ALTER TABLE maintenance_schedules
ADD CONSTRAINT chk_maintenance_schedule_dates
CHECK (next_service_date IS NULL OR next_service_date >= last_service_date);

ALTER TABLE assets
ADD CONSTRAINT chk_asset_maintenance_dates
CHECK (next_maintenance_date IS NULL OR next_maintenance_date >= last_maintenance_date);

-- ============================================================================
-- SECTION 4: ENSURE AMOUNTS ARE POSITIVE (18 constraints)
-- ============================================================================

ALTER TABLE invoices
ADD CONSTRAINT chk_invoice_amount_positive
CHECK (total_amount >= 0);

ALTER TABLE invoices
ADD CONSTRAINT chk_invoice_subtotal_positive
CHECK (subtotal IS NULL OR subtotal >= 0);

ALTER TABLE invoices
ADD CONSTRAINT chk_invoice_tax_positive
CHECK (tax_amount IS NULL OR tax_amount >= 0);

ALTER TABLE work_orders
ADD CONSTRAINT chk_work_order_estimated_cost_positive
CHECK (estimated_cost IS NULL OR estimated_cost >= 0);

ALTER TABLE work_orders
ADD CONSTRAINT chk_work_order_actual_cost_positive
CHECK (actual_cost IS NULL OR actual_cost >= 0);

ALTER TABLE fuel_transactions
ADD CONSTRAINT chk_fuel_gallons_positive
CHECK (gallons > 0);

ALTER TABLE fuel_transactions
ADD CONSTRAINT chk_fuel_cost_per_gallon_positive
CHECK (cost_per_gallon > 0);

ALTER TABLE fuel_transactions
ADD CONSTRAINT chk_fuel_total_cost_positive
CHECK (total_cost > 0);

ALTER TABLE fuel_transactions
ADD CONSTRAINT chk_fuel_odometer_positive
CHECK (odometer_reading IS NULL OR odometer_reading >= 0);

ALTER TABLE parts_inventory
ADD CONSTRAINT chk_part_cost_positive
CHECK (unit_cost >= 0);

ALTER TABLE parts_inventory
ADD CONSTRAINT chk_part_quantity_nonnegative
CHECK (quantity_on_hand >= 0);

ALTER TABLE parts_inventory
ADD CONSTRAINT chk_part_reorder_nonnegative
CHECK (reorder_point IS NULL OR reorder_point >= 0);

ALTER TABLE purchase_orders
ADD CONSTRAINT chk_po_total_positive
CHECK (total_amount >= 0);

ALTER TABLE purchase_orders
ADD CONSTRAINT chk_po_subtotal_positive
CHECK (subtotal IS NULL OR subtotal >= 0);

ALTER TABLE charging_sessions
ADD CONSTRAINT chk_charging_kwh_positive
CHECK (kwh_consumed IS NULL OR kwh_consumed >= 0);

ALTER TABLE charging_sessions
ADD CONSTRAINT chk_charging_cost_positive
CHECK (cost IS NULL OR cost >= 0);

ALTER TABLE charging_sessions
ADD CONSTRAINT chk_charging_soc_valid
CHECK (
  (start_soc IS NULL OR (start_soc >= 0 AND start_soc <= 100)) AND
  (end_soc IS NULL OR (end_soc >= 0 AND end_soc <= 100))
);

ALTER TABLE incidents
ADD CONSTRAINT chk_incident_cost_positive
CHECK (cost IS NULL OR cost >= 0);

-- ============================================================================
-- SECTION 5: ENSURE VALID STATUS VALUES (10 constraints)
-- ============================================================================

-- Note: Most status fields use ENUMs which already enforce valid values
-- These add additional business logic constraints

ALTER TABLE work_orders
ADD CONSTRAINT chk_work_order_completed_has_dates
CHECK (
  status != 'completed' OR
  (actual_start_date IS NOT NULL AND actual_end_date IS NOT NULL)
);

ALTER TABLE work_orders
ADD CONSTRAINT chk_work_order_completed_has_cost
CHECK (
  status != 'completed' OR
  actual_cost IS NOT NULL
);

ALTER TABLE routes
ADD CONSTRAINT chk_route_completed_has_times
CHECK (
  status != 'completed' OR
  (actual_start_time IS NOT NULL AND actual_end_time IS NOT NULL)
);

ALTER TABLE charging_sessions
ADD CONSTRAINT chk_charging_completed_has_end
CHECK (
  end_time IS NULL OR
  (end_time IS NOT NULL AND end_soc IS NOT NULL)
);

ALTER TABLE training_records
ADD CONSTRAINT chk_training_passed_has_score
CHECK (
  (passed IS NULL OR passed = false) OR
  score IS NOT NULL
);

ALTER TABLE certifications
ADD CONSTRAINT chk_certification_verified_has_verifier
CHECK (
  verified_at IS NULL OR
  verified_by_id IS NOT NULL
);

ALTER TABLE purchase_orders
ADD CONSTRAINT chk_po_approved_has_approver
CHECK (
  status != 'approved' OR
  approved_by_id IS NOT NULL
);

ALTER TABLE incidents
ADD CONSTRAINT chk_incident_resolved_has_date
CHECK (
  resolved_at IS NULL OR
  status IN ('resolved', 'closed')
);

ALTER TABLE announcements
ADD CONSTRAINT chk_announcement_published_has_date
CHECK (
  is_active = false OR
  published_at IS NOT NULL
);

ALTER TABLE dispatches
ADD CONSTRAINT chk_dispatch_completed_has_times
CHECK (
  status != 'completed' OR
  (actual_start_time IS NOT NULL AND actual_end_time IS NOT NULL)
);

-- ============================================================================
-- SECTION 6: REFERENTIAL INTEGRITY & DATA CONSISTENCY (10 constraints)
-- ============================================================================

ALTER TABLE fuel_transactions
ADD CONSTRAINT chk_fuel_calculation_valid
CHECK (ABS(total_cost - (gallons * cost_per_gallon)) < 0.01);

ALTER TABLE charging_sessions
ADD CONSTRAINT chk_charging_soc_increase
CHECK (
  start_soc IS NULL OR end_soc IS NULL OR
  end_soc >= start_soc
);

ALTER TABLE parts_inventory
ADD CONSTRAINT chk_part_quantity_vs_reorder
CHECK (
  reorder_point IS NULL OR
  reorder_point < quantity_on_hand + 1000
); -- Sanity check

ALTER TABLE vehicles
ADD CONSTRAINT chk_vehicle_value_vs_purchase
CHECK (
  purchase_price IS NULL OR current_value IS NULL OR
  current_value <= purchase_price
);

ALTER TABLE work_orders
ADD CONSTRAINT chk_work_order_actual_vs_estimated
CHECK (
  estimated_cost IS NULL OR actual_cost IS NULL OR
  actual_cost <= estimated_cost * 3
); -- Prevent 3x overruns without explicit override

ALTER TABLE invoices
ADD CONSTRAINT chk_invoice_total_calculation
CHECK (
  subtotal IS NULL OR tax_amount IS NULL OR
  ABS(total_amount - (subtotal + tax_amount)) < 0.01
);

ALTER TABLE routes
ADD CONSTRAINT chk_route_distance_reasonable
CHECK (
  planned_distance_miles IS NULL OR
  planned_distance_miles <= 5000
); -- Single route shouldn't exceed 5000 miles

ALTER TABLE routes
ADD CONSTRAINT chk_route_actual_vs_planned
CHECK (
  planned_distance_miles IS NULL OR actual_distance_miles IS NULL OR
  actual_distance_miles <= planned_distance_miles * 1.5
); -- Actual shouldn't exceed 150% of planned

ALTER TABLE gps_tracks
ADD CONSTRAINT chk_gps_speed_reasonable
CHECK (
  speed IS NULL OR
  speed <= 150
); -- Maximum 150 mph for fleet vehicles

ALTER TABLE telemetry_data
ADD CONSTRAINT chk_telemetry_rpm_reasonable
CHECK (
  engine_rpm IS NULL OR
  engine_rpm <= 8000
); -- Maximum 8000 RPM

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Total constraints added: 85
--
-- Breakdown:
-- - Prevent negative values: 20
-- - Prevent future dates: 15
-- - Ensure logical date ranges: 12
-- - Ensure positive amounts: 18
-- - Ensure valid status: 10
-- - Referential integrity & consistency: 10
--
-- Performance impact: Minimal - constraints are checked only on INSERT/UPDATE
-- Rollback: DROP CONSTRAINT for each constraint name
-- ============================================================================
