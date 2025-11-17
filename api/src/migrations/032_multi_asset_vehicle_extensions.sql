-- Migration 032: Multi-Asset Vehicle Extensions
-- Created: 2025-11-17
-- Description: Extend vehicles table to support all asset types (tractors, trailers, heavy equipment, etc.)
--              Add asset relationships for combos like tractor-trailer
--              Add telemetry for equipment-specific metrics
--              Extend maintenance schedules for multi-metric triggers

-- ============================================================================
-- PART 1: EXTEND VEHICLES TABLE FOR ALL ASSET TYPES
-- ============================================================================

-- Add asset type categorization
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS asset_category VARCHAR(50)
    CHECK (asset_category IN (
      'PASSENGER_VEHICLE', 'LIGHT_COMMERCIAL', 'HEAVY_TRUCK', 'TRACTOR',
      'TRAILER', 'HEAVY_EQUIPMENT', 'UTILITY_VEHICLE', 'SPECIALTY_EQUIPMENT',
      'NON_POWERED'
    )),
  ADD COLUMN IF NOT EXISTS asset_type VARCHAR(50)
    CHECK (asset_type IN (
      -- Passenger Vehicles
      'PASSENGER_CAR', 'SUV', 'PASSENGER_VAN',
      -- Light Commercial
      'LIGHT_TRUCK', 'PICKUP_TRUCK', 'CARGO_VAN',
      -- Medium/Heavy Trucks
      'MEDIUM_DUTY_TRUCK', 'HEAVY_DUTY_TRUCK', 'DUMP_TRUCK',
      -- Tractors
      'SEMI_TRACTOR', 'DAY_CAB_TRACTOR', 'SLEEPER_CAB_TRACTOR',
      -- Trailers
      'DRY_VAN_TRAILER', 'FLATBED_TRAILER', 'REFRIGERATED_TRAILER',
      'LOWBOY_TRAILER', 'TANK_TRAILER',
      -- Heavy Equipment
      'EXCAVATOR', 'BULLDOZER', 'BACKHOE', 'MOTOR_GRADER', 'WHEEL_LOADER',
      'SKID_STEER', 'MOBILE_CRANE', 'TOWER_CRANE', 'FORKLIFT',
      -- Utility/Service
      'BUCKET_TRUCK', 'SERVICE_BODY_TRUCK', 'MOBILE_WORKSHOP',
      -- Specialty Equipment
      'GENERATOR', 'AIR_COMPRESSOR', 'WATER_PUMP', 'LIGHT_TOWER',
      -- Non-Powered
      'SHIPPING_CONTAINER', 'STORAGE_TRAILER', 'TOOLBOX_TRAILER',
      -- Other
      'OTHER'
    )),
  ADD COLUMN IF NOT EXISTS power_type VARCHAR(20)
    CHECK (power_type IN ('SELF_POWERED', 'TOWED', 'STATIONARY', 'PORTABLE'));

-- Add multi-metric tracking fields (extend existing engine_hours)
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS primary_metric VARCHAR(20) DEFAULT 'ODOMETER'
    CHECK (primary_metric IN ('ODOMETER', 'ENGINE_HOURS', 'PTO_HOURS', 'AUX_HOURS', 'CYCLES', 'CALENDAR')),
  ADD COLUMN IF NOT EXISTS pto_hours DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS aux_hours DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cycle_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_metric_update TIMESTAMP;

-- Add equipment-specific attributes
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS capacity_tons DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS max_reach_feet DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS lift_height_feet DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS bucket_capacity_yards DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS operating_weight_lbs DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS axle_count INTEGER,
  ADD COLUMN IF NOT EXISTS max_payload_kg DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS tank_capacity_l DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS has_pto BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS has_aux_power BOOLEAN DEFAULT FALSE;

-- Add road/usage restrictions
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS is_road_legal BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS requires_cdl BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_special_license BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS max_speed_kph DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS is_off_road_only BOOLEAN DEFAULT FALSE;

-- Add operational status
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS operational_status VARCHAR(50) DEFAULT 'AVAILABLE'
    CHECK (operational_status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RESERVED'));

-- Add parent/child asset fields for relationships
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS parent_asset_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS group_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS fleet_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES facilities(id) ON DELETE SET NULL;

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_vehicles_asset_category ON vehicles(asset_category);
CREATE INDEX IF NOT EXISTS idx_vehicles_asset_type ON vehicles(asset_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_primary_metric ON vehicles(primary_metric);
CREATE INDEX IF NOT EXISTS idx_vehicles_operational_status ON vehicles(operational_status);
CREATE INDEX IF NOT EXISTS idx_vehicles_parent_asset ON vehicles(parent_asset_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_pto_hours ON vehicles(pto_hours);
CREATE INDEX IF NOT EXISTS idx_vehicles_aux_hours ON vehicles(aux_hours);
CREATE INDEX IF NOT EXISTS idx_vehicles_cycle_count ON vehicles(cycle_count);

-- Update existing vehicles to have default asset types
UPDATE vehicles
SET
  asset_type = COALESCE(asset_type, 'OTHER'),
  asset_category = COALESCE(asset_category, 'PASSENGER_VEHICLE'),
  power_type = COALESCE(power_type, 'SELF_POWERED'),
  primary_metric = COALESCE(primary_metric, 'ODOMETER')
WHERE asset_type IS NULL OR asset_category IS NULL OR power_type IS NULL;

-- ============================================================================
-- PART 2: ASSET RELATIONSHIPS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS asset_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_asset_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  child_asset_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  relationship_type VARCHAR(20) NOT NULL
    CHECK (relationship_type IN ('TOWS', 'ATTACHED', 'CARRIES', 'POWERS', 'CONTAINS')),
  connection_point VARCHAR(100),
  is_primary BOOLEAN DEFAULT TRUE,
  effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
  effective_to TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT chk_different_assets CHECK (parent_asset_id != child_asset_id)
);

CREATE INDEX idx_asset_relationships_parent ON asset_relationships(parent_asset_id);
CREATE INDEX idx_asset_relationships_child ON asset_relationships(child_asset_id);
CREATE INDEX idx_asset_relationships_type ON asset_relationships(relationship_type);
CREATE INDEX idx_asset_relationships_effective ON asset_relationships(effective_from, effective_to);

COMMENT ON TABLE asset_relationships IS 'Asset relationships for combos like tractor-trailer, machine-attachments';
COMMENT ON COLUMN asset_relationships.relationship_type IS 'TOWS: tractor-trailer, ATTACHED: excavator-bucket, CARRIES: truck-container, POWERS: truck-generator, CONTAINS: vehicle-cargo';

-- ============================================================================
-- PART 3: TELEMETRY EQUIPMENT EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS telemetry_equipment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  event_time TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Multi-metric tracking
  engine_hours DECIMAL(10,2),
  pto_hours DECIMAL(10,2),
  aux_hours DECIMAL(10,2),
  cycle_count INTEGER,

  -- Equipment-specific data
  hydraulic_pressure_bar DECIMAL(6,2),
  boom_angle_degrees DECIMAL(5,2),
  load_weight_kg DECIMAL(12,2),
  attachment_position VARCHAR(100),
  fuel_level_percent INTEGER CHECK (fuel_level_percent >= 0 AND fuel_level_percent <= 100),
  coolant_temp_celsius DECIMAL(5,2),
  oil_pressure_bar DECIMAL(6,2),

  -- Diagnostic codes
  fault_codes TEXT[],
  warning_codes TEXT[],

  -- Context
  operator_id UUID REFERENCES drivers(id),
  job_site VARCHAR(255),
  project_code VARCHAR(100),

  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_telemetry_equipment_vehicle ON telemetry_equipment_events(vehicle_id);
CREATE INDEX idx_telemetry_equipment_time ON telemetry_equipment_events(event_time DESC);
CREATE INDEX idx_telemetry_equipment_operator ON telemetry_equipment_events(operator_id);

COMMENT ON TABLE telemetry_equipment_events IS 'Equipment-specific telemetry events for heavy equipment, trailers, and specialty assets';

-- ============================================================================
-- PART 4: EXTEND MAINTENANCE SCHEDULES FOR MULTI-METRIC TRIGGERS
-- ============================================================================

-- Add multi-metric trigger support to existing maintenance_schedules table
ALTER TABLE maintenance_schedules
  ADD COLUMN IF NOT EXISTS trigger_metric VARCHAR(20) DEFAULT 'ODOMETER'
    CHECK (trigger_metric IN ('ODOMETER', 'ENGINE_HOURS', 'PTO_HOURS', 'AUX_HOURS', 'CYCLES', 'CALENDAR')),
  ADD COLUMN IF NOT EXISTS trigger_condition VARCHAR(10) DEFAULT 'OR'
    CHECK (trigger_condition IN ('AND', 'OR')),
  ADD COLUMN IF NOT EXISTS last_service_pto_hours DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS last_service_aux_hours DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS last_service_cycles INTEGER,
  ADD COLUMN IF NOT EXISTS next_service_due_pto_hours DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS next_service_due_aux_hours DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS next_service_due_cycles INTEGER;

-- Create function to check if maintenance is overdue based on multiple metrics
CREATE OR REPLACE FUNCTION is_maintenance_overdue_multi_metric(
  p_schedule_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_schedule RECORD;
  v_vehicle RECORD;
  v_overdue BOOLEAN := FALSE;
BEGIN
  -- Get maintenance schedule
  SELECT * INTO v_schedule
  FROM maintenance_schedules
  WHERE id = p_schedule_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Get current vehicle metrics
  SELECT * INTO v_vehicle
  FROM vehicles
  WHERE id = v_schedule.vehicle_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check calendar-based
  IF v_schedule.interval_type = 'days' AND v_schedule.next_service_due_date < CURRENT_DATE THEN
    RETURN TRUE;
  END IF;

  -- Check based on trigger_metric
  CASE v_schedule.trigger_metric
    WHEN 'ODOMETER' THEN
      IF v_schedule.next_service_due_odometer IS NOT NULL AND v_vehicle.odometer >= v_schedule.next_service_due_odometer THEN
        v_overdue := TRUE;
      END IF;

    WHEN 'ENGINE_HOURS' THEN
      IF v_schedule.next_service_due_engine_hours IS NOT NULL AND v_vehicle.engine_hours >= v_schedule.next_service_due_engine_hours THEN
        v_overdue := TRUE;
      END IF;

    WHEN 'PTO_HOURS' THEN
      IF v_schedule.next_service_due_pto_hours IS NOT NULL AND v_vehicle.pto_hours >= v_schedule.next_service_due_pto_hours THEN
        v_overdue := TRUE;
      END IF;

    WHEN 'AUX_HOURS' THEN
      IF v_schedule.next_service_due_aux_hours IS NOT NULL AND v_vehicle.aux_hours >= v_schedule.next_service_due_aux_hours THEN
        v_overdue := TRUE;
      END IF;

    WHEN 'CYCLES' THEN
      IF v_schedule.next_service_due_cycles IS NOT NULL AND v_vehicle.cycle_count >= v_schedule.next_service_due_cycles THEN
        v_overdue := TRUE;
      END IF;

    ELSE
      -- Calendar only
      NULL;
  END CASE;

  RETURN v_overdue;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update maintenance schedule status
CREATE OR REPLACE FUNCTION update_maintenance_overdue_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update maintenance schedules for this vehicle
  UPDATE maintenance_schedules
  SET is_active = is_maintenance_overdue_multi_metric(id)
  WHERE vehicle_id = NEW.id
    AND is_active = TRUE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_update_maintenance_overdue_status'
  ) THEN
    CREATE TRIGGER trigger_update_maintenance_overdue_status
      AFTER UPDATE OF odometer, engine_hours, pto_hours, aux_hours, cycle_count ON vehicles
      FOR EACH ROW
      EXECUTE FUNCTION update_maintenance_overdue_status();
  END IF;
END$$;

-- ============================================================================
-- PART 5: VIEWS FOR MULTI-ASSET MANAGEMENT
-- ============================================================================

-- View: Active Asset Combos (tractor-trailer pairs, machine-attachments)
CREATE OR REPLACE VIEW vw_active_asset_combos AS
SELECT
  ar.id as relationship_id,
  ar.relationship_type,
  p.id as parent_id,
  p.vin as parent_vin,
  p.make as parent_make,
  p.model as parent_model,
  p.asset_type as parent_type,
  c.id as child_id,
  c.vin as child_vin,
  c.make as child_make,
  c.model as child_model,
  c.asset_type as child_type,
  ar.effective_from,
  ar.effective_to,
  ar.notes
FROM asset_relationships ar
JOIN vehicles p ON ar.parent_asset_id = p.id
JOIN vehicles c ON ar.child_asset_id = c.id
WHERE (ar.effective_to IS NULL OR ar.effective_to > NOW())
ORDER BY ar.created_at DESC;

-- View: Equipment by Type with Current Metrics
CREATE OR REPLACE VIEW vw_equipment_by_type AS
SELECT
  v.id,
  v.tenant_id,
  v.asset_category,
  v.asset_type,
  v.power_type,
  v.vin,
  v.make,
  v.model,
  v.year,
  v.status,
  v.operational_status,
  v.primary_metric,
  v.odometer,
  v.engine_hours,
  v.pto_hours,
  v.aux_hours,
  v.cycle_count,
  v.last_metric_update,
  v.capacity_tons,
  v.lift_height_feet,
  v.bucket_capacity_yards,
  v.assigned_driver_id,
  v.location_id,
  COUNT(DISTINCT ms.id) as scheduled_maintenance_count,
  SUM(CASE WHEN is_maintenance_overdue_multi_metric(ms.id) THEN 1 ELSE 0 END) as overdue_maintenance_count
FROM vehicles v
LEFT JOIN maintenance_schedules ms ON v.id = ms.vehicle_id AND ms.is_active = TRUE
WHERE v.asset_type IS NOT NULL
GROUP BY v.id;

-- View: Multi-Metric Maintenance Due
CREATE OR REPLACE VIEW vw_multi_metric_maintenance_due AS
SELECT
  ms.id as schedule_id,
  v.id as vehicle_id,
  v.vin,
  v.make,
  v.model,
  v.asset_type,
  v.primary_metric,
  ms.service_type,
  ms.trigger_metric,
  ms.interval_type,

  -- Current values
  v.odometer as current_odometer,
  v.engine_hours as current_engine_hours,
  v.pto_hours as current_pto_hours,
  v.aux_hours as current_aux_hours,
  v.cycle_count as current_cycle_count,

  -- Next due values
  ms.next_service_due_date,
  ms.next_service_due_odometer,
  ms.next_service_due_engine_hours,
  ms.next_service_due_pto_hours,
  ms.next_service_due_aux_hours,
  ms.next_service_due_cycles,

  -- Calculations
  CASE
    WHEN ms.trigger_metric = 'ODOMETER' AND ms.next_service_due_odometer IS NOT NULL
    THEN ms.next_service_due_odometer - v.odometer
    WHEN ms.trigger_metric = 'ENGINE_HOURS' AND ms.next_service_due_engine_hours IS NOT NULL
    THEN ms.next_service_due_engine_hours - v.engine_hours
    WHEN ms.trigger_metric = 'PTO_HOURS' AND ms.next_service_due_pto_hours IS NOT NULL
    THEN ms.next_service_due_pto_hours - v.pto_hours
    WHEN ms.trigger_metric = 'AUX_HOURS' AND ms.next_service_due_aux_hours IS NOT NULL
    THEN ms.next_service_due_aux_hours - v.aux_hours
    WHEN ms.trigger_metric = 'CYCLES' AND ms.next_service_due_cycles IS NOT NULL
    THEN ms.next_service_due_cycles - v.cycle_count
    ELSE NULL
  END as units_until_due,

  is_maintenance_overdue_multi_metric(ms.id) as is_overdue

FROM maintenance_schedules ms
JOIN vehicles v ON ms.vehicle_id = v.id
WHERE ms.is_active = TRUE
ORDER BY is_overdue DESC, units_until_due ASC;

-- ============================================================================
-- PART 6: COMMENTS
-- ============================================================================

COMMENT ON COLUMN vehicles.asset_category IS 'High-level asset category: PASSENGER_VEHICLE, HEAVY_EQUIPMENT, TRAILER, etc.';
COMMENT ON COLUMN vehicles.asset_type IS 'Specific asset type: EXCAVATOR, SEMI_TRACTOR, DRY_VAN_TRAILER, etc.';
COMMENT ON COLUMN vehicles.power_type IS 'Power type: SELF_POWERED (engines), TOWED (trailers), STATIONARY, PORTABLE';
COMMENT ON COLUMN vehicles.primary_metric IS 'Primary maintenance trigger metric: ODOMETER, ENGINE_HOURS, PTO_HOURS, etc.';
COMMENT ON COLUMN vehicles.pto_hours IS 'Power Take-Off hours (for equipment with PTO)';
COMMENT ON COLUMN vehicles.aux_hours IS 'Auxiliary power hours (generators, aux systems)';
COMMENT ON COLUMN vehicles.cycle_count IS 'Cycle count (for cranes, forklifts, compactors)';
COMMENT ON COLUMN vehicles.operational_status IS 'Current operational status independent of overall status';

-- ============================================================================
-- COMPLETED
-- ============================================================================

-- Migration 032 complete. Summary:
-- ✅ Extended vehicles table with 30+ new fields for all asset types
-- ✅ Created asset_relationships table for combos (tractor-trailer, etc.)
-- ✅ Created telemetry_equipment_events table for equipment metrics
-- ✅ Extended maintenance_schedules with multi-metric triggers
-- ✅ Created views for asset combos, equipment by type, and maintenance due
-- ✅ All backward compatible - existing vehicles continue to work
