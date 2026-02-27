-- ============================================================================
-- Maintenance Tables
-- ============================================================================
-- Created: 2026-01-08
-- Purpose: Comprehensive maintenance tracking and scheduling
-- ============================================================================

-- Maintenance Table (Main maintenance records)
CREATE TABLE IF NOT EXISTS maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,

  -- Vehicle reference
  vehicle_id UUID NOT NULL,

  -- Maintenance details
  maintenance_type VARCHAR(100) NOT NULL, -- preventive, corrective, inspection, recall, upgrade
  service_category VARCHAR(100), -- engine, transmission, brakes, electrical, etc.
  description TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical

  -- Status tracking
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled, deferred

  -- Scheduling
  scheduled_date DATE,
  scheduled_time TIME,
  due_date DATE,
  due_mileage INTEGER, -- Mileage when maintenance is due

  -- Completion tracking
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  actual_mileage INTEGER, -- Actual mileage when performed
  actual_duration_minutes INTEGER,

  -- Assignment
  assigned_to UUID, -- Mechanic/technician user_id
  assigned_shop VARCHAR(255),
  work_order_number VARCHAR(100),

  -- Cost tracking
  estimated_cost_cents INTEGER, -- Estimated cost in cents
  actual_cost_cents INTEGER, -- Actual cost in cents
  labor_cost_cents INTEGER,
  parts_cost_cents INTEGER,
  tax_amount_cents INTEGER,

  -- Parts and labor
  parts_used JSONB DEFAULT '[]', -- Array of parts: [{part_id, quantity, cost}]
  labor_hours DECIMAL(10,2),

  -- Warranty
  under_warranty BOOLEAN DEFAULT FALSE,
  warranty_claim_number VARCHAR(100),

  -- Vendor/Provider
  vendor_id UUID,
  vendor_name VARCHAR(255),
  invoice_number VARCHAR(100),
  invoice_date DATE,

  -- Odometer
  odometer_reading INTEGER,
  odometer_unit VARCHAR(10) DEFAULT 'miles', -- miles or kilometers

  -- Next service
  next_service_date DATE,
  next_service_mileage INTEGER,

  -- Inspection results
  inspection_passed BOOLEAN,
  inspection_notes TEXT,
  inspection_checklist JSONB DEFAULT '{}',

  -- Safety and compliance
  safety_critical BOOLEAN DEFAULT FALSE,
  dot_inspection BOOLEAN DEFAULT FALSE,
  compliance_status VARCHAR(50), -- compliant, non_compliant, pending

  -- Documentation
  attachments JSONB DEFAULT '[]', -- Array of file references
  photos JSONB DEFAULT '[]',
  documentation_url VARCHAR(1000),

  -- Notes
  notes TEXT,
  internal_notes TEXT,
  customer_notes TEXT,

  -- Recurring maintenance
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern VARCHAR(50), -- daily, weekly, monthly, mileage_based
  recurrence_interval INTEGER, -- Number of days/weeks/months or miles
  parent_maintenance_id UUID, -- Reference to parent recurring maintenance

  -- Approval workflow
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID,
  approved_at TIMESTAMP,
  rejection_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[], -- For categorization

  -- Audit fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,

  -- Foreign keys
  CONSTRAINT fk_maintenance_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  CONSTRAINT fk_maintenance_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_maintenance_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_maintenance_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_maintenance_parent FOREIGN KEY (parent_maintenance_id) REFERENCES maintenance(id) ON DELETE SET NULL
);

-- Indexes for maintenance
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant_id ON maintenance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_type ON maintenance(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON maintenance(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_date ON maintenance(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_due_date ON maintenance(due_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_completed_at ON maintenance(completed_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_assigned_to ON maintenance(assigned_to);
CREATE INDEX IF NOT EXISTS idx_maintenance_created_at ON maintenance(created_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_order ON maintenance(work_order_number);
CREATE INDEX IF NOT EXISTS idx_maintenance_recurring ON maintenance(is_recurring, parent_maintenance_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_safety_critical ON maintenance(safety_critical);
CREATE INDEX IF NOT EXISTS idx_maintenance_tags ON maintenance USING gin(tags);

-- Maintenance Schedule Table
-- Defines preventive maintenance schedules
-- maintenance_schedules already exists from initial schema; add missing columns
DO $$ BEGIN
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS schedule_name VARCHAR(255);
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(100);
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS service_type VARCHAR(100);
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS trigger_type VARCHAR(50);
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS interval_days INTEGER;
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS interval_miles INTEGER;
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS interval_engine_hours INTEGER;
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS early_warning_days INTEGER DEFAULT 7;
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS early_warning_miles INTEGER DEFAULT 500;
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS auto_create_work_orders BOOLEAN DEFAULT TRUE;
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 7;
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS default_priority VARCHAR(20) DEFAULT 'normal';
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS default_duration_minutes INTEGER;
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS default_cost_estimate_cents INTEGER;
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS default_assigned_shop VARCHAR(255);
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS checklist_template JSONB DEFAULT '[]';
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS required_parts JSONB DEFAULT '[]';
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS preferred_vendor_id UUID;
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
  ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS created_by UUID;
END $$;

-- Indexes for maintenance_schedules
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_tenant_id ON maintenance_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_vehicle_id ON maintenance_schedules(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_vehicle_type ON maintenance_schedules(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_service_type ON maintenance_schedules(service_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_active ON maintenance_schedules(is_active);

-- Update triggers (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS update_maintenance_updated_at ON maintenance;
CREATE TRIGGER update_maintenance_updated_at BEFORE UPDATE ON maintenance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maintenance_schedules_updated_at ON maintenance_schedules;
CREATE TRIGGER update_maintenance_schedules_updated_at BEFORE UPDATE ON maintenance_schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (only if webapp role exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'webapp') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON maintenance TO webapp;
    GRANT SELECT, INSERT, UPDATE, DELETE ON maintenance_schedules TO webapp;
  END IF;
END $$;

-- Comments
COMMENT ON TABLE maintenance IS 'Main maintenance records for vehicles';
COMMENT ON TABLE maintenance_schedules IS 'Preventive maintenance schedules and rules';

COMMENT ON COLUMN maintenance.maintenance_type IS 'Type: preventive, corrective, inspection, recall, upgrade';
COMMENT ON COLUMN maintenance.status IS 'Status: scheduled, in_progress, completed, cancelled, deferred';
COMMENT ON COLUMN maintenance.safety_critical IS 'Indicates if this maintenance is safety-critical';
COMMENT ON COLUMN maintenance_schedules.trigger_type IS 'Trigger: time_based, mileage_based, engine_hours, both';
COMMENT ON COLUMN maintenance_schedules.auto_create_work_orders IS 'Automatically create work orders when due';
