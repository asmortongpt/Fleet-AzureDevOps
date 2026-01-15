-- Migration 008: Comprehensive Scheduling System
-- Vehicle Reservations, Service Bay Management, Google Calendar Integration

-- ============================================
-- Appointment Types
-- ============================================
CREATE TABLE IF NOT EXISTS appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color for calendar display
  default_duration INTEGER DEFAULT 60, -- minutes
  requires_vehicle BOOLEAN DEFAULT false,
  requires_driver BOOLEAN DEFAULT false,
  requires_technician BOOLEAN DEFAULT false,
  requires_service_bay BOOLEAN DEFAULT false,
  buffer_time_before INTEGER DEFAULT 0, -- minutes
  buffer_time_after INTEGER DEFAULT 0, -- minutes
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_appointment_types_tenant ON appointment_types(tenant_id);
CREATE INDEX idx_appointment_types_active ON appointment_types(is_active);

-- ============================================
-- Vehicle Reservations
-- ============================================
CREATE TABLE IF NOT EXISTS vehicle_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  reserved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  reservation_type VARCHAR(50) DEFAULT 'general' CHECK (reservation_type IN ('general', 'delivery', 'business_trip', 'maintenance', 'training', 'inspection')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  pickup_location VARCHAR(500),
  dropoff_location VARCHAR(500),
  estimated_miles DECIMAL(10,2),
  purpose TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  actual_start_time TIMESTAMP WITH TIME ZONE,
  actual_end_time TIMESTAMP WITH TIME ZONE,
  actual_miles DECIMAL(10,2),
  start_odometer DECIMAL(10,2),
  end_odometer DECIMAL(10,2),
  calendar_event_id UUID,
  microsoft_event_id VARCHAR(255),
  google_event_id VARCHAR(255),
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vehicle_reservations_tenant ON vehicle_reservations(tenant_id);
CREATE INDEX idx_vehicle_reservations_vehicle ON vehicle_reservations(vehicle_id);
CREATE INDEX idx_vehicle_reservations_user ON vehicle_reservations(reserved_by);
CREATE INDEX idx_vehicle_reservations_driver ON vehicle_reservations(driver_id);
CREATE INDEX idx_vehicle_reservations_time ON vehicle_reservations(start_time, end_time);
CREATE INDEX idx_vehicle_reservations_status ON vehicle_reservations(status);
CREATE INDEX idx_vehicle_reservations_approval ON vehicle_reservations(approval_status);

-- ============================================
-- Service Bay Schedules
-- ============================================
CREATE TABLE IF NOT EXISTS service_bays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  bay_number VARCHAR(50) NOT NULL,
  bay_name VARCHAR(255),
  bay_type VARCHAR(50), -- general, lift, alignment, paint, inspection
  capabilities TEXT[], -- Array of service types supported
  equipment JSONB DEFAULT '[]', -- [{name, type, model}]
  max_vehicle_weight INTEGER, -- pounds
  max_vehicle_height INTEGER, -- inches
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(facility_id, bay_number)
);

CREATE INDEX idx_service_bays_tenant ON service_bays(tenant_id);
CREATE INDEX idx_service_bays_facility ON service_bays(facility_id);
CREATE INDEX idx_service_bays_active ON service_bays(is_active);

CREATE TABLE IF NOT EXISTS service_bay_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  service_bay_id UUID REFERENCES service_bays(id) ON DELETE CASCADE,
  work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  appointment_type_id UUID REFERENCES appointment_types(id) ON DELETE SET NULL,
  scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITH TIME ZONE,
  actual_end TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  assigned_technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  notes TEXT,
  calendar_event_id UUID,
  microsoft_event_id VARCHAR(255),
  google_event_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_service_bay_schedules_tenant ON service_bay_schedules(tenant_id);
CREATE INDEX idx_service_bay_schedules_bay ON service_bay_schedules(service_bay_id);
CREATE INDEX idx_service_bay_schedules_work_order ON service_bay_schedules(work_order_id);
CREATE INDEX idx_service_bay_schedules_vehicle ON service_bay_schedules(vehicle_id);
CREATE INDEX idx_service_bay_schedules_time ON service_bay_schedules(scheduled_start, scheduled_end);
CREATE INDEX idx_service_bay_schedules_status ON service_bay_schedules(status);
CREATE INDEX idx_service_bay_schedules_technician ON service_bay_schedules(assigned_technician_id);

-- ============================================
-- Technician Availability
-- ============================================
CREATE TABLE IF NOT EXISTS technician_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES users(id) ON DELETE CASCADE,
  availability_type VARCHAR(50) DEFAULT 'available' CHECK (availability_type IN ('available', 'unavailable', 'vacation', 'sick', 'training', 'lunch')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  recurring_pattern VARCHAR(50), -- daily, weekly, monthly
  recurring_days INTEGER[], -- Day of week: 0=Sunday, 6=Saturday
  recurrence_end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_technician_availability_tenant ON technician_availability(tenant_id);
CREATE INDEX idx_technician_availability_tech ON technician_availability(technician_id);
CREATE INDEX idx_technician_availability_time ON technician_availability(start_time, end_time);
CREATE INDEX idx_technician_availability_type ON technician_availability(availability_type);

-- ============================================
-- Recurring Maintenance Appointments
-- ============================================
CREATE TABLE IF NOT EXISTS recurring_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  appointment_type_id UUID REFERENCES appointment_types(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  recurrence_pattern VARCHAR(50) NOT NULL, -- daily, weekly, monthly, yearly
  recurrence_interval INTEGER DEFAULT 1, -- Every N days/weeks/months
  recurrence_days INTEGER[], -- For weekly: [1,3,5] = Mon, Wed, Fri
  recurrence_day_of_month INTEGER, -- For monthly: day of month
  start_date DATE NOT NULL,
  end_date DATE,
  time_of_day TIME NOT NULL,
  duration INTEGER DEFAULT 60, -- minutes
  assigned_technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
  service_bay_id UUID REFERENCES service_bays(id) ON DELETE SET NULL,
  last_generated_date DATE,
  next_occurrence_date DATE,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recurring_appointments_tenant ON recurring_appointments(tenant_id);
CREATE INDEX idx_recurring_appointments_vehicle ON recurring_appointments(vehicle_id);
CREATE INDEX idx_recurring_appointments_type ON recurring_appointments(appointment_type_id);
CREATE INDEX idx_recurring_appointments_next ON recurring_appointments(next_occurrence_date);
CREATE INDEX idx_recurring_appointments_active ON recurring_appointments(is_active);

-- ============================================
-- Calendar Integration Settings
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('microsoft', 'google')),
  is_primary BOOLEAN DEFAULT false,
  is_enabled BOOLEAN DEFAULT true,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  calendar_id VARCHAR(255), -- Provider's calendar ID
  calendar_name VARCHAR(255),
  sync_direction VARCHAR(50) DEFAULT 'bidirectional' CHECK (sync_direction IN ('to_calendar', 'from_calendar', 'bidirectional')),
  sync_vehicle_reservations BOOLEAN DEFAULT true,
  sync_maintenance_appointments BOOLEAN DEFAULT true,
  sync_work_orders BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(50) DEFAULT 'active',
  sync_errors JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider, calendar_id)
);

CREATE INDEX idx_calendar_integrations_tenant ON calendar_integrations(tenant_id);
CREATE INDEX idx_calendar_integrations_user ON calendar_integrations(user_id);
CREATE INDEX idx_calendar_integrations_provider ON calendar_integrations(provider);
CREATE INDEX idx_calendar_integrations_enabled ON calendar_integrations(is_enabled);
CREATE INDEX idx_calendar_integrations_sync ON calendar_integrations(last_sync_at);

-- ============================================
-- Calendar Sync Log
-- ============================================
CREATE TABLE IF NOT EXISTS calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_integration_id UUID REFERENCES calendar_integrations(id) ON DELETE CASCADE,
  sync_type VARCHAR(50), -- full, incremental
  sync_direction VARCHAR(50),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  events_synced INTEGER DEFAULT 0,
  events_created INTEGER DEFAULT 0,
  events_updated INTEGER DEFAULT 0,
  events_deleted INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_calendar_sync_log_integration ON calendar_sync_log(calendar_integration_id);
CREATE INDEX idx_calendar_sync_log_started ON calendar_sync_log(started_at DESC);
CREATE INDEX idx_calendar_sync_log_status ON calendar_sync_log(status);

-- ============================================
-- Scheduling Conflicts
-- ============================================
CREATE TABLE IF NOT EXISTS scheduling_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  conflict_type VARCHAR(50) NOT NULL, -- vehicle_double_booked, bay_double_booked, technician_unavailable, etc.
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  entity_type VARCHAR(50), -- vehicle, service_bay, technician
  entity_id UUID,
  appointment_1_id UUID,
  appointment_1_type VARCHAR(50),
  appointment_2_id UUID,
  appointment_2_type VARCHAR(50),
  conflict_start TIMESTAMP WITH TIME ZONE,
  conflict_end TIMESTAMP WITH TIME ZONE,
  description TEXT,
  resolution_status VARCHAR(50) DEFAULT 'unresolved' CHECK (resolution_status IN ('unresolved', 'resolved', 'ignored')),
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduling_conflicts_tenant ON scheduling_conflicts(tenant_id);
CREATE INDEX idx_scheduling_conflicts_entity ON scheduling_conflicts(entity_type, entity_id);
CREATE INDEX idx_scheduling_conflicts_status ON scheduling_conflicts(resolution_status);
CREATE INDEX idx_scheduling_conflicts_severity ON scheduling_conflicts(severity);
CREATE INDEX idx_scheduling_conflicts_time ON scheduling_conflicts(conflict_start, conflict_end);

-- ============================================
-- Enhanced Calendar Events (extend existing)
-- ============================================
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS service_bay_id UUID REFERENCES service_bays(id) ON DELETE SET NULL;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES vehicle_reservations(id) ON DELETE SET NULL;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'microsoft';
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS parent_event_id UUID REFERENCES calendar_events(id) ON DELETE CASCADE;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS reminder_minutes INTEGER DEFAULT 15;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS color VARCHAR(7);

CREATE INDEX IF NOT EXISTS idx_calendar_events_tenant ON calendar_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_vehicle ON calendar_events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_driver ON calendar_events(driver_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_service_bay ON calendar_events(service_bay_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_work_order ON calendar_events(work_order_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_reservation ON calendar_events(reservation_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_provider ON calendar_events(provider);
CREATE INDEX IF NOT EXISTS idx_calendar_events_recurring ON calendar_events(is_recurring);

-- ============================================
-- Views for Easy Querying
-- ============================================

-- View for upcoming maintenance appointments
CREATE OR REPLACE VIEW upcoming_maintenance_appointments AS
SELECT
  ce.id as event_id,
  ce.subject,
  ce.start_time,
  ce.end_time,
  v.id as vehicle_id,
  v.vin,
  v.make,
  v.model,
  v.license_plate,
  wo.id as work_order_id,
  wo.work_order_number,
  wo.type as work_order_type,
  wo.status as work_order_status,
  sb.bay_number,
  sb.bay_name,
  u.first_name || ' ' || u.last_name as technician_name,
  ce.location,
  ce.status
FROM calendar_events ce
LEFT JOIN vehicles v ON ce.vehicle_id = v.id
LEFT JOIN work_orders wo ON ce.work_order_id = wo.id
LEFT JOIN service_bay_schedules sbs ON sbs.calendar_event_id = ce.id
LEFT JOIN service_bays sb ON sbs.service_bay_id = sb.id
LEFT JOIN users u ON wo.assigned_technician_id = u.id
WHERE ce.entity_type = 'vehicle_maintenance'
  AND ce.start_time >= NOW()
ORDER BY ce.start_time;

-- View for active vehicle reservations
CREATE OR REPLACE VIEW active_vehicle_reservations AS
SELECT
  vr.id as reservation_id,
  vr.start_time,
  vr.end_time,
  vr.reservation_type,
  vr.status,
  vr.approval_status,
  v.id as vehicle_id,
  v.vin,
  v.make,
  v.model,
  v.license_plate,
  v.status as vehicle_status,
  u.first_name || ' ' || u.last_name as reserved_by_name,
  u.email as reserved_by_email,
  d.id as driver_id,
  du.first_name || ' ' || du.last_name as driver_name,
  vr.pickup_location,
  vr.dropoff_location,
  vr.purpose,
  vr.notes
FROM vehicle_reservations vr
JOIN vehicles v ON vr.vehicle_id = v.id
JOIN users u ON vr.reserved_by = u.id
LEFT JOIN drivers d ON vr.driver_id = d.id
LEFT JOIN users du ON d.user_id = du.id
WHERE vr.status IN ('pending', 'confirmed', 'in_progress')
  AND vr.end_time >= NOW()
ORDER BY vr.start_time;

-- View for service bay availability
CREATE OR REPLACE VIEW service_bay_availability AS
SELECT
  sb.id as service_bay_id,
  sb.bay_number,
  sb.bay_name,
  sb.bay_type,
  f.name as facility_name,
  f.city,
  f.state,
  COUNT(sbs.id) FILTER (WHERE sbs.scheduled_start <= NOW() AND sbs.scheduled_end >= NOW()) as currently_occupied,
  COUNT(sbs.id) FILTER (WHERE sbs.scheduled_start > NOW() AND sbs.scheduled_start <= NOW() + INTERVAL '24 hours') as scheduled_next_24h,
  sb.is_active
FROM service_bays sb
JOIN facilities f ON sb.facility_id = f.id
LEFT JOIN service_bay_schedules sbs ON sb.id = sbs.service_bay_id
  AND sbs.status IN ('scheduled', 'in_progress')
WHERE sb.is_active = true
GROUP BY sb.id, sb.bay_number, sb.bay_name, sb.bay_type, f.name, f.city, f.state, sb.is_active;

-- ============================================
-- Functions
-- ============================================

-- Function to check for scheduling conflicts
CREATE OR REPLACE FUNCTION check_scheduling_conflicts()
RETURNS TRIGGER AS $$
DECLARE
  conflict_count INTEGER;
  conflict_record RECORD;
BEGIN
  -- Check for vehicle double booking
  IF NEW.vehicle_id IS NOT NULL THEN
    SELECT COUNT(*) INTO conflict_count
    FROM vehicle_reservations vr
    WHERE vr.vehicle_id = NEW.vehicle_id
      AND vr.id != NEW.id
      AND vr.status NOT IN ('cancelled', 'completed')
      AND (
        (NEW.start_time BETWEEN vr.start_time AND vr.end_time) OR
        (NEW.end_time BETWEEN vr.start_time AND vr.end_time) OR
        (vr.start_time BETWEEN NEW.start_time AND NEW.end_time)
      );

    IF conflict_count > 0 THEN
      -- Log the conflict
      INSERT INTO scheduling_conflicts (
        tenant_id, conflict_type, severity, entity_type, entity_id,
        appointment_1_id, appointment_1_type, conflict_start, conflict_end,
        description
      ) VALUES (
        NEW.tenant_id, 'vehicle_double_booked', 'high', 'vehicle', NEW.vehicle_id,
        NEW.id, 'vehicle_reservation', NEW.start_time, NEW.end_time,
        'Vehicle is already reserved during this time period'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vehicle reservation conflicts
DROP TRIGGER IF EXISTS check_vehicle_reservation_conflicts ON vehicle_reservations;
CREATE TRIGGER check_vehicle_reservation_conflicts
  AFTER INSERT OR UPDATE ON vehicle_reservations
  FOR EACH ROW
  EXECUTE FUNCTION check_scheduling_conflicts();

-- Function to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_appointment_types_updated_at BEFORE UPDATE ON appointment_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vehicle_reservations_updated_at BEFORE UPDATE ON vehicle_reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_service_bays_updated_at BEFORE UPDATE ON service_bays
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_service_bay_schedules_updated_at BEFORE UPDATE ON service_bay_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_technician_availability_updated_at BEFORE UPDATE ON technician_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_recurring_appointments_updated_at BEFORE UPDATE ON recurring_appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_calendar_integrations_updated_at BEFORE UPDATE ON calendar_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- Insert Default Appointment Types
-- ============================================
INSERT INTO appointment_types (name, description, color, default_duration, requires_vehicle, requires_technician, requires_service_bay) VALUES
  ('Oil Change', 'Standard oil and filter change', '#10B981', 30, true, true, true),
  ('Tire Rotation', 'Rotate and balance tires', '#3B82F6', 45, true, true, true),
  ('Brake Inspection', 'Inspect brake pads, rotors, and fluid', '#F59E0B', 60, true, true, true),
  ('State Inspection', 'Annual state safety and emissions inspection', '#8B5CF6', 90, true, true, true),
  ('General Maintenance', 'Routine maintenance check', '#06B6D4', 120, true, true, true),
  ('Repair', 'Vehicle repair work', '#EF4444', 180, true, true, true),
  ('Diagnostic', 'Vehicle diagnostic and troubleshooting', '#EC4899', 90, true, true, true),
  ('Detail/Cleaning', 'Vehicle cleaning and detailing', '#14B8A6', 120, true, false, false),
  ('Vehicle Reservation', 'General vehicle reservation', '#6366F1', 240, true, false, false),
  ('Driver Training', 'Driver training session', '#F97316', 180, false, false, false)
ON CONFLICT DO NOTHING;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE appointment_types IS 'Types of appointments that can be scheduled';
COMMENT ON TABLE vehicle_reservations IS 'Vehicle booking and reservation system';
COMMENT ON TABLE service_bays IS 'Physical service bays in facilities';
COMMENT ON TABLE service_bay_schedules IS 'Schedules for service bay usage';
COMMENT ON TABLE technician_availability IS 'Technician work schedules and availability';
COMMENT ON TABLE recurring_appointments IS 'Recurring maintenance appointments';
COMMENT ON TABLE calendar_integrations IS 'Calendar integration settings per user';
COMMENT ON TABLE calendar_sync_log IS 'Log of calendar synchronization activities';
COMMENT ON TABLE scheduling_conflicts IS 'Detected scheduling conflicts and their resolution';
