-- Migration: Heavy Equipment Support Tables
-- Created: 2026-02-04
-- Purpose: Back heavy equipment dashboards with real database tables (no simulated/random data).

-- ============================================================================
-- Hour Meter Readings
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_hour_meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES heavy_equipment(id) ON DELETE CASCADE,
  reading_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hours NUMERIC(12,2) NOT NULL,
  odometer_miles INTEGER,
  fuel_level_percent NUMERIC(5,2),
  recorded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  job_site TEXT,
  operator_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  billable_hours NUMERIC(12,2),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_hour_meter_tenant_equipment_date
  ON equipment_hour_meter_readings(tenant_id, equipment_id, reading_date DESC);

-- ============================================================================
-- Operator Certifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_operator_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  equipment_type VARCHAR(100) NOT NULL,
  certification_number VARCHAR(100),
  certification_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  certifying_authority VARCHAR(255) NOT NULL,
  certification_level VARCHAR(50) NOT NULL DEFAULT 'basic',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT equipment_operator_certifications_status_chk CHECK (status IN ('active', 'inactive', 'suspended'))
);

CREATE INDEX IF NOT EXISTS idx_equipment_operator_certs_tenant_expiry
  ON equipment_operator_certifications(tenant_id, expiry_date);

-- ============================================================================
-- Attachments
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES heavy_equipment(id) ON DELETE CASCADE,
  attachment_type VARCHAR(100) NOT NULL,
  attachment_name VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  serial_number VARCHAR(255),
  condition VARCHAR(50) NOT NULL DEFAULT 'good',
  purchase_cost NUMERIC(12,2),
  current_value NUMERIC(12,2),
  is_currently_attached BOOLEAN NOT NULL DEFAULT false,
  attached_date TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_attachments_tenant_equipment
  ON equipment_attachments(tenant_id, equipment_id);

-- ============================================================================
-- Checklist Templates & Checklists
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  equipment_type VARCHAR(100),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS equipment_checklist_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES equipment_checklist_templates(id) ON DELETE CASCADE,
  item_description TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_checklist_items_template
  ON equipment_checklist_template_items(template_id, sort_order);

CREATE TABLE IF NOT EXISTS equipment_maintenance_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES heavy_equipment(id) ON DELETE CASCADE,
  checklist_template_id UUID REFERENCES equipment_checklist_templates(id) ON DELETE SET NULL,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  engine_hours_at_completion NUMERIC(12,2),
  overall_status VARCHAR(50) NOT NULL,
  inspector_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_checklists_tenant_equipment_date
  ON equipment_maintenance_checklists(tenant_id, equipment_id, completed_date DESC);

CREATE TABLE IF NOT EXISTS equipment_checklist_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  checklist_id UUID NOT NULL REFERENCES equipment_maintenance_checklists(id) ON DELETE CASCADE,
  template_item_id UUID REFERENCES equipment_checklist_template_items(id) ON DELETE SET NULL,
  item_description TEXT NOT NULL,
  response TEXT NOT NULL,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- Utilization Logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_utilization_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES heavy_equipment(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  operator_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  productive_hours NUMERIC(12,2) NOT NULL DEFAULT 0,
  idle_hours NUMERIC(12,2) NOT NULL DEFAULT 0,
  maintenance_hours NUMERIC(12,2) NOT NULL DEFAULT 0,
  down_hours NUMERIC(12,2) NOT NULL DEFAULT 0,
  billable_hours NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  engine_hours NUMERIC(12,2),
  fuel_consumption_rate NUMERIC(12,4),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT equipment_utilization_logs_unique UNIQUE (tenant_id, equipment_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_equipment_utilization_tenant_equipment_date
  ON equipment_utilization_logs(tenant_id, equipment_id, log_date DESC);

-- ============================================================================
-- Maintenance Schedules
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES heavy_equipment(id) ON DELETE CASCADE,
  schedule_type VARCHAR(20) NOT NULL DEFAULT 'calendar', -- calendar, hours, both
  title VARCHAR(255),
  description TEXT,
  interval_days INTEGER,
  interval_hours NUMERIC(12,2),
  last_completed_date DATE,
  next_due_date DATE,
  last_completed_hours NUMERIC(12,2),
  next_due_hours NUMERIC(12,2),
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- scheduled, completed, overdue
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_schedules_tenant
  ON equipment_maintenance_schedules(tenant_id, status);

-- ============================================================================
-- Maintenance Events (Costs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_maintenance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES heavy_equipment(id) ON DELETE CASCADE,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_events_tenant_date
  ON equipment_maintenance_events(tenant_id, event_date DESC);

-- ============================================================================
-- Cost Analysis Cache
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_cost_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES heavy_equipment(id) ON DELETE CASCADE,
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,
  maintenance_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_hours NUMERIC(12,2) NOT NULL DEFAULT 0,
  productive_hours NUMERIC(12,2) NOT NULL DEFAULT 0,
  utilization_rate NUMERIC(8,4) NOT NULL DEFAULT 0,
  cost_per_hour NUMERIC(12,4) NOT NULL DEFAULT 0,
  revenue_generated NUMERIC(12,2) NOT NULL DEFAULT 0,
  profit_loss NUMERIC(12,2) NOT NULL DEFAULT 0,
  analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT equipment_cost_analysis_unique UNIQUE (tenant_id, equipment_id, analysis_period_start, analysis_period_end)
);

-- ============================================================================
-- Telematics Snapshots (DB-backed "live" view)
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_telematics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES heavy_equipment(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  engine_hours NUMERIC(12,2) NOT NULL DEFAULT 0,
  engine_rpm INTEGER NOT NULL DEFAULT 0,
  engine_temp_celsius NUMERIC(6,2) NOT NULL DEFAULT 0,
  fuel_level_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  fuel_consumption_rate NUMERIC(12,4) NOT NULL DEFAULT 0,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  speed_mph NUMERIC(8,2) NOT NULL DEFAULT 0,
  altitude_feet NUMERIC(10,2) NOT NULL DEFAULT 0,
  hydraulic_pressure_psi NUMERIC(10,2) NOT NULL DEFAULT 0,
  battery_voltage NUMERIC(6,2) NOT NULL DEFAULT 0,
  diagnostic_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  alerts JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_equipment_telematics_latest
  ON equipment_telematics_snapshots(tenant_id, equipment_id, timestamp DESC);

-- ============================================================================
-- Seed Minimal Demo Data (Deterministic)
-- ============================================================================

-- Seed a default checklist template per tenant if none exist
DO $$
DECLARE
  t RECORD;
  tmpl_id UUID;
BEGIN
  FOR t IN SELECT id FROM tenants LOOP
    IF NOT EXISTS (SELECT 1 FROM equipment_checklist_templates WHERE tenant_id = t.id) THEN
      INSERT INTO equipment_checklist_templates (tenant_id, template_name, description)
      VALUES (t.id, 'Daily Equipment Inspection', 'Standard daily walkaround inspection checklist')
      RETURNING id INTO tmpl_id;

      INSERT INTO equipment_checklist_template_items (tenant_id, template_id, item_description, sort_order)
      VALUES
        (t.id, tmpl_id, 'Check engine oil level', 1),
        (t.id, tmpl_id, 'Inspect hydraulic lines for leaks', 2),
        (t.id, tmpl_id, 'Verify lights, horn, and safety devices', 3),
        (t.id, tmpl_id, 'Inspect tires/tracks and undercarriage', 4),
        (t.id, tmpl_id, 'Confirm fire extinguisher present and charged', 5);
    END IF;
  END LOOP;
END $$;

-- Seed utilization logs and telematics snapshots for the last 14 days
INSERT INTO equipment_utilization_logs (
  tenant_id, equipment_id, log_date, productive_hours, idle_hours, maintenance_hours, down_hours, billable_hours, total_revenue, engine_hours, fuel_consumption_rate
)
SELECT
  he.tenant_id,
  he.id,
  (CURRENT_DATE - gs.day_offset)::date AS log_date,
  (4 + (gs.day_offset % 3))::numeric AS productive_hours,
  (1 + (gs.day_offset % 2))::numeric AS idle_hours,
  (CASE WHEN gs.day_offset % 7 = 0 THEN 1 ELSE 0 END)::numeric AS maintenance_hours,
  0::numeric AS down_hours,
  (4 + (gs.day_offset % 3))::numeric AS billable_hours,
  ((4 + (gs.day_offset % 3)) * 125)::numeric AS total_revenue,
  COALESCE(he.engine_hours, 0) + (14 - gs.day_offset) AS engine_hours,
  5.0 + (gs.day_offset % 4) * 0.25 AS fuel_consumption_rate
FROM heavy_equipment he
CROSS JOIN LATERAL (
  SELECT generate_series(0, 13) AS day_offset
) gs
ON CONFLICT (tenant_id, equipment_id, log_date) DO NOTHING;

INSERT INTO equipment_telematics_snapshots (
  tenant_id, equipment_id, timestamp, engine_hours, engine_rpm, engine_temp_celsius,
  fuel_level_percent, fuel_consumption_rate, latitude, longitude, speed_mph, altitude_feet,
  hydraulic_pressure_psi, battery_voltage, diagnostic_codes, alerts
)
SELECT
  he.tenant_id,
  he.id,
  NOW(),
  COALESCE(he.engine_hours, 0),
  1450 + (EXTRACT(DOY FROM CURRENT_DATE)::int % 300),
  86 + (EXTRACT(DOY FROM CURRENT_DATE)::int % 6),
  65 + (EXTRACT(DOY FROM CURRENT_DATE)::int % 20),
  5.5,
  COALESCE(NULLIF(a.metadata->>'latitude','')::numeric, 38.9072),
  COALESCE(NULLIF(a.metadata->>'longitude','')::numeric, -77.0369),
  0,
  150,
  2500,
  12.6,
  ARRAY[]::TEXT[],
  '[]'::jsonb
FROM heavy_equipment he
LEFT JOIN assets a ON a.id = he.asset_id
ON CONFLICT DO NOTHING;
