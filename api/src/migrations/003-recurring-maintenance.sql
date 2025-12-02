-- Migration: Add Recurring Maintenance Features
-- Description: Database schema for automated recurring maintenance scheduling and work order generation
-- Created: 2025-11-08

-- Add recurring maintenance columns to maintenance_schedules table
ALTER TABLE maintenance_schedules
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB,
  ADD COLUMN IF NOT EXISTS auto_create_work_order BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS work_order_template JSONB,
  ADD COLUMN IF NOT EXISTS last_work_order_created_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS current_mileage INTEGER,
  ADD COLUMN IF NOT EXISTS current_engine_hours INTEGER;

-- Create maintenance_schedule_history table to track generated work orders
CREATE TABLE IF NOT EXISTS maintenance_schedule_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES maintenance_schedules(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  execution_type VARCHAR(50) NOT NULL, -- 'auto_scheduled', 'manual_trigger', 'mileage_based', 'time_based'
  next_due_before TIMESTAMP WITH TIME ZONE,
  next_due_after TIMESTAMP WITH TIME ZONE,
  mileage_at_creation INTEGER,
  engine_hours_at_creation INTEGER,
  error_message TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'success', -- 'success', 'failed', 'skipped'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vehicle_telemetry_snapshots for tracking current vehicle state
CREATE TABLE IF NOT EXISTS vehicle_telemetry_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  odometer_reading INTEGER,
  engine_hours INTEGER,
  fuel_level INTEGER,
  battery_level INTEGER,
  last_gps_location JSONB,
  snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, vehicle_id, snapshot_date)
);

-- Create maintenance_notifications table for tracking alerts
CREATE TABLE IF NOT EXISTS maintenance_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES maintenance_schedules(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(100) NOT NULL, -- 'due_soon', 'overdue', 'work_order_created', 'work_order_completed'
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  sent_via VARCHAR(50)[], -- ['email', 'sms', 'in_app']
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_recurring ON maintenance_schedules(tenant_id, is_recurring, next_due)
  WHERE is_recurring = TRUE;

CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_auto_create ON maintenance_schedules(tenant_id, auto_create_work_order, next_due)
  WHERE auto_create_work_order = TRUE;

CREATE INDEX IF NOT EXISTS idx_maintenance_schedule_history_schedule ON maintenance_schedule_history(schedule_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedule_history_work_order ON maintenance_schedule_history(work_order_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_schedule_history_tenant ON maintenance_schedule_history(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_vehicle ON vehicle_telemetry_snapshots(vehicle_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_tenant ON vehicle_telemetry_snapshots(tenant_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_maintenance_notifications_user ON maintenance_notifications(user_id, read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_maintenance_notifications_schedule ON maintenance_notifications(schedule_id, created_at DESC);

-- Function to calculate next due date based on recurrence pattern
CREATE OR REPLACE FUNCTION calculate_next_due_date(
  p_current_date TIMESTAMP WITH TIME ZONE,
  p_recurrence_pattern JSONB
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
  v_type TEXT;
  v_interval_value INTEGER;
  v_interval_unit TEXT;
  v_next_due TIMESTAMP WITH TIME ZONE;
BEGIN
  v_type := p_recurrence_pattern->>'type';
  v_interval_value := (p_recurrence_pattern->>'interval_value')::INTEGER;
  v_interval_unit := p_recurrence_pattern->>'interval_unit';

  IF v_type = 'time' THEN
    CASE v_interval_unit
      WHEN 'days' THEN
        v_next_due := p_current_date + (v_interval_value || ' days')::INTERVAL;
      WHEN 'weeks' THEN
        v_next_due := p_current_date + (v_interval_value || ' weeks')::INTERVAL;
      WHEN 'months' THEN
        v_next_due := p_current_date + (v_interval_value || ' months')::INTERVAL;
      ELSE
        v_next_due := p_current_date + (v_interval_value || ' days')::INTERVAL;
    END CASE;
  ELSE
    -- For mileage/engine_hours based, return current_date + estimated time
    -- This will be calculated in the application layer with actual vehicle data
    v_next_due := p_current_date + (v_interval_value || ' days')::INTERVAL;
  END IF;

  RETURN v_next_due;
END;
$$ LANGUAGE plpgsql;

-- Function to check if schedule is due based on multiple criteria
CREATE OR REPLACE FUNCTION is_schedule_due(
  p_schedule_id UUID,
  p_current_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
) RETURNS BOOLEAN AS $$
DECLARE
  v_schedule RECORD;
  v_vehicle RECORD;
  v_is_due BOOLEAN := FALSE;
  v_mileage_due BOOLEAN := FALSE;
  v_time_due BOOLEAN := FALSE;
  v_hours_due BOOLEAN := FALSE;
BEGIN
  -- Get schedule details
  SELECT * INTO v_schedule
  FROM maintenance_schedules
  WHERE id = p_schedule_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Get vehicle telemetry
  SELECT vts.odometer_reading, vts.engine_hours
  INTO v_vehicle
  FROM vehicle_telemetry_snapshots vts
  WHERE vts.vehicle_id = v_schedule.vehicle_id
  ORDER BY vts.snapshot_date DESC
  LIMIT 1;

  -- Check time-based due
  IF v_schedule.next_due <= p_current_date THEN
    v_time_due := TRUE;
  END IF;

  -- Check mileage-based due (if pattern exists)
  IF v_schedule.recurrence_pattern IS NOT NULL AND v_vehicle.odometer_reading IS NOT NULL THEN
    IF (v_schedule.recurrence_pattern->>'type' IN ('mileage', 'combined')) THEN
      IF v_vehicle.odometer_reading >= COALESCE(v_schedule.current_mileage, 0) +
         COALESCE((v_schedule.recurrence_pattern->>'interval_value')::INTEGER, 999999) THEN
        v_mileage_due := TRUE;
      END IF;
    END IF;
  END IF;

  -- Check engine hours-based due
  IF v_schedule.recurrence_pattern IS NOT NULL AND v_vehicle.engine_hours IS NOT NULL THEN
    IF (v_schedule.recurrence_pattern->>'type' = 'engine_hours') THEN
      IF v_vehicle.engine_hours >= COALESCE(v_schedule.current_engine_hours, 0) +
         COALESCE((v_schedule.recurrence_pattern->>'interval_value')::INTEGER, 999999) THEN
        v_hours_due := TRUE;
      END IF;
    END IF;
  END IF;

  -- Combined logic
  IF v_schedule.recurrence_pattern IS NOT NULL THEN
    IF (v_schedule.recurrence_pattern->>'type' = 'combined') THEN
      v_is_due := v_time_due OR v_mileage_due;
    ELSIF (v_schedule.recurrence_pattern->>'type' = 'mileage') THEN
      v_is_due := v_mileage_due;
    ELSIF (v_schedule.recurrence_pattern->>'type' = 'engine_hours') THEN
      v_is_due := v_hours_due;
    ELSE
      v_is_due := v_time_due;
    END IF;
  ELSE
    v_is_due := v_time_due;
  END IF;

  RETURN v_is_due;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_maintenance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_maintenance_schedules_timestamp
BEFORE UPDATE ON maintenance_schedules
FOR EACH ROW
EXECUTE FUNCTION update_maintenance_timestamp();

-- Comments for documentation
COMMENT ON TABLE maintenance_schedule_history IS 'Audit trail of automatically generated work orders from recurring schedules';
COMMENT ON TABLE vehicle_telemetry_snapshots IS 'Periodic snapshots of vehicle telemetry for mileage-based maintenance tracking';
COMMENT ON TABLE maintenance_notifications IS 'User notifications for maintenance due dates and work order updates';
COMMENT ON COLUMN maintenance_schedules.is_recurring IS 'Flag indicating if this is a recurring schedule';
COMMENT ON COLUMN maintenance_schedules.recurrence_pattern IS 'JSON configuration: {type: "mileage"|"time"|"engine_hours"|"combined", interval_value: number, interval_unit: "miles"|"days"|"weeks"|"months"|"engine_hours"}';
COMMENT ON COLUMN maintenance_schedules.auto_create_work_order IS 'Automatically create work orders when schedule is due';
COMMENT ON COLUMN maintenance_schedules.work_order_template IS 'JSON template for auto-generated work orders: {priority, assigned_technician, estimated_cost, description, parts}';
COMMENT ON FUNCTION calculate_next_due_date IS 'Calculates the next due date based on recurrence pattern';
COMMENT ON FUNCTION is_schedule_due IS 'Checks if a schedule is due based on time, mileage, or engine hours';
