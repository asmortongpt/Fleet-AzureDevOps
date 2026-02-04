-- Scheduling & Calendar Integration Tables
-- Creates missing tables required by scheduling routes/services.

-- Vehicle Reservations (used by scheduling routes)
CREATE TABLE IF NOT EXISTS vehicle_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  reserved_by UUID NOT NULL REFERENCES users(id),
  driver_id UUID REFERENCES drivers(id),
  reservation_type VARCHAR(50) NOT NULL DEFAULT 'general',
  start_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  end_time TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  pickup_location VARCHAR(255),
  dropoff_location VARCHAR(255),
  estimated_miles NUMERIC(10,2),
  purpose TEXT,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITHOUT TIME ZONE,
  rejection_reason TEXT,
  microsoft_event_id VARCHAR(255),
  google_event_id VARCHAR(255),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT vehicle_reservations_time_check CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_reservations_tenant ON vehicle_reservations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_reservations_vehicle ON vehicle_reservations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_reservations_time ON vehicle_reservations(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_vehicle_reservations_status ON vehicle_reservations(status);

-- Service Bays
CREATE TABLE IF NOT EXISTS service_bays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id),
  bay_name VARCHAR(255) NOT NULL,
  bay_number INTEGER NOT NULL,
  bay_type VARCHAR(50) DEFAULT 'standard',
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_bays_unique
  ON service_bays(tenant_id, facility_id, bay_number);
CREATE INDEX IF NOT EXISTS idx_service_bays_tenant ON service_bays(tenant_id);

-- Appointment Types
CREATE TABLE IF NOT EXISTS appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 60,
  default_resource_id UUID,
  color VARCHAR(20) DEFAULT '#2563eb',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_types_tenant ON appointment_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointment_types_active ON appointment_types(tenant_id, is_active);

-- Service Bay Schedules (Maintenance Appointments)
CREATE TABLE IF NOT EXISTS service_bay_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id),
  service_bay_id UUID REFERENCES service_bays(id),
  appointment_type_id UUID REFERENCES appointment_types(id),
  assigned_technician_id UUID REFERENCES users(id),
  work_order_id UUID REFERENCES work_orders(id),
  priority VARCHAR(20) DEFAULT 'medium',
  notes TEXT,
  status VARCHAR(20) DEFAULT 'scheduled',
  scheduled_start TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  scheduled_end TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  actual_start TIMESTAMP WITHOUT TIME ZONE,
  actual_end TIMESTAMP WITHOUT TIME ZONE,
  microsoft_event_id VARCHAR(255),
  google_event_id VARCHAR(255),
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT service_bay_schedules_time_check CHECK (scheduled_end > scheduled_start)
);

CREATE INDEX IF NOT EXISTS idx_service_bay_schedules_tenant ON service_bay_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_bay_schedules_vehicle ON service_bay_schedules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_service_bay_schedules_bay ON service_bay_schedules(service_bay_id);
CREATE INDEX IF NOT EXISTS idx_service_bay_schedules_time ON service_bay_schedules(scheduled_start, scheduled_end);

-- Calendar Integrations (Google/Microsoft)
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  calendar_id VARCHAR(255),
  calendar_name VARCHAR(255),
  calendar_type VARCHAR(50) DEFAULT 'personal',
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITHOUT TIME ZONE,
  is_primary BOOLEAN DEFAULT FALSE,
  is_enabled BOOLEAN DEFAULT TRUE,
  is_synced BOOLEAN DEFAULT TRUE,
  sync_direction VARCHAR(50) DEFAULT 'bidirectional',
  sync_vehicle_reservations BOOLEAN DEFAULT TRUE,
  sync_maintenance_appointments BOOLEAN DEFAULT TRUE,
  sync_work_orders BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMP WITHOUT TIME ZONE,
  sync_status VARCHAR(50) DEFAULT 'idle',
  sync_errors TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_integrations_unique
  ON calendar_integrations(user_id, provider, calendar_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_tenant ON calendar_integrations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user ON calendar_integrations(user_id);
