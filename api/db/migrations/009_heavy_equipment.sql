-- Migration 009: Heavy Equipment Tracking System
-- Created: 2025-11-11
-- Description: Comprehensive heavy equipment management with specialized tracking for construction and industrial equipment

-- ============================================================================
-- HEAVY EQUIPMENT CORE TABLES
-- ============================================================================

-- Equipment types enumeration
CREATE TABLE IF NOT EXISTS equipment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name VARCHAR(100) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL CHECK (category IN ('construction', 'material_handling', 'earthmoving', 'paving', 'lifting', 'utility', 'other')),
  description TEXT,
  requires_certification BOOLEAN DEFAULT TRUE,
  default_maintenance_hours INTEGER DEFAULT 250,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_equipment_types_category ON equipment_types(category);

-- Pre-populate common equipment types
INSERT INTO equipment_types (type_name, category, requires_certification, default_maintenance_hours) VALUES
  ('excavator', 'earthmoving', TRUE, 250),
  ('bulldozer', 'earthmoving', TRUE, 250),
  ('crane', 'lifting', TRUE, 200),
  ('loader', 'material_handling', TRUE, 250),
  ('forklift', 'material_handling', TRUE, 200),
  ('dump_truck', 'material_handling', TRUE, 300),
  ('concrete_mixer', 'construction', TRUE, 200),
  ('paver', 'paving', TRUE, 200),
  ('grader', 'earthmoving', TRUE, 250),
  ('backhoe', 'earthmoving', TRUE, 250),
  ('skid_steer', 'material_handling', TRUE, 200),
  ('compactor', 'construction', TRUE, 250),
  ('trencher', 'earthmoving', TRUE, 200),
  ('aerial_lift', 'lifting', TRUE, 150),
  ('telehandler', 'lifting', TRUE, 200)
ON CONFLICT (type_name) DO NOTHING;

-- Heavy equipment main table (extends assets)
CREATE TABLE IF NOT EXISTS heavy_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  equipment_type VARCHAR(100) NOT NULL,
  manufacturer VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  model_year INTEGER,
  serial_number VARCHAR(255) UNIQUE,
  vin VARCHAR(50),

  -- Capacity specifications
  capacity_tons DECIMAL(10,2),
  max_reach_feet DECIMAL(10,2),
  lift_height_feet DECIMAL(10,2),
  bucket_capacity_yards DECIMAL(10,2),
  operating_weight_lbs DECIMAL(12,2),

  -- Engine and usage tracking
  engine_hours DECIMAL(10,1) DEFAULT 0,
  odometer_miles DECIMAL(10,1) DEFAULT 0,
  last_hour_meter_reading DECIMAL(10,1) DEFAULT 0,
  last_hour_meter_date DATE,

  -- Inspection and certification
  last_inspection_date DATE,
  next_inspection_date DATE,
  inspection_frequency_days INTEGER DEFAULT 365,
  certification_expiry DATE,
  certifying_authority VARCHAR(255),

  -- Operational status
  is_rental BOOLEAN DEFAULT FALSE,
  rental_rate_daily DECIMAL(10,2),
  rental_company VARCHAR(255),
  rental_contract_number VARCHAR(100),
  rental_start_date DATE,
  rental_end_date DATE,

  -- Financial tracking
  acquisition_cost DECIMAL(12,2),
  residual_value DECIMAL(12,2),
  total_maintenance_cost DECIMAL(12,2) DEFAULT 0,
  hourly_operating_cost DECIMAL(8,2),

  -- Location and availability
  current_job_site VARCHAR(255),
  availability_status VARCHAR(50) DEFAULT 'available' CHECK (availability_status IN ('available', 'in_use', 'maintenance', 'down', 'rental', 'disposed')),

  -- Additional data
  fuel_type VARCHAR(50),
  fuel_capacity_gallons DECIMAL(8,2),
  notes TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),

  CONSTRAINT unique_equipment_asset UNIQUE (tenant_id, asset_id)
);

CREATE INDEX idx_heavy_equipment_tenant_id ON heavy_equipment(tenant_id);
CREATE INDEX idx_heavy_equipment_asset_id ON heavy_equipment(asset_id);
CREATE INDEX idx_heavy_equipment_type ON heavy_equipment(equipment_type);
CREATE INDEX idx_heavy_equipment_availability ON heavy_equipment(availability_status);
CREATE INDEX idx_heavy_equipment_serial_number ON heavy_equipment(serial_number);
CREATE INDEX idx_heavy_equipment_engine_hours ON heavy_equipment(engine_hours);
CREATE INDEX idx_heavy_equipment_next_inspection ON heavy_equipment(next_inspection_date);

-- ============================================================================
-- OPERATOR CERTIFICATIONS
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
  certification_level VARCHAR(50) CHECK (certification_level IN ('basic', 'intermediate', 'advanced', 'master')),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'suspended', 'revoked')),
  training_hours DECIMAL(6,2),
  instructor_name VARCHAR(255),
  certificate_file_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_operator_certs_tenant_id ON equipment_operator_certifications(tenant_id);
CREATE INDEX idx_operator_certs_driver_id ON equipment_operator_certifications(driver_id);
CREATE INDEX idx_operator_certs_equipment_type ON equipment_operator_certifications(equipment_type);
CREATE INDEX idx_operator_certs_expiry_date ON equipment_operator_certifications(expiry_date);
CREATE INDEX idx_operator_certs_status ON equipment_operator_certifications(status);

-- ============================================================================
-- HOUR METER READINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_hour_meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES heavy_equipment(id) ON DELETE CASCADE,
  reading_date TIMESTAMP NOT NULL DEFAULT NOW(),
  hours DECIMAL(10,1) NOT NULL,
  odometer_miles DECIMAL(10,1),
  fuel_level_percent INTEGER CHECK (fuel_level_percent >= 0 AND fuel_level_percent <= 100),
  recorded_by UUID NOT NULL REFERENCES users(id),
  job_site VARCHAR(255),
  operator_id UUID REFERENCES drivers(id),
  billable_hours DECIMAL(8,2),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_hour_readings_equipment_id ON equipment_hour_meter_readings(equipment_id);
CREATE INDEX idx_hour_readings_date ON equipment_hour_meter_readings(reading_date);
CREATE INDEX idx_hour_readings_recorded_by ON equipment_hour_meter_readings(recorded_by);

-- ============================================================================
-- EQUIPMENT ATTACHMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES heavy_equipment(id) ON DELETE CASCADE,
  attachment_type VARCHAR(100) NOT NULL,
  attachment_name VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  serial_number VARCHAR(255),
  condition VARCHAR(50) DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'needs_repair')),
  purchase_date DATE,
  purchase_cost DECIMAL(10,2),
  current_value DECIMAL(10,2),
  last_inspection_date DATE,
  weight_lbs DECIMAL(8,2),
  is_currently_attached BOOLEAN DEFAULT FALSE,
  attached_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_attachments_equipment_id ON equipment_attachments(equipment_id);
CREATE INDEX idx_attachments_type ON equipment_attachments(attachment_type);
CREATE INDEX idx_attachments_condition ON equipment_attachments(condition);
CREATE INDEX idx_attachments_is_attached ON equipment_attachments(is_currently_attached);

-- ============================================================================
-- MAINTENANCE CHECKLISTS
-- ============================================================================

-- Checklist templates
CREATE TABLE IF NOT EXISTS equipment_checklist_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  equipment_type VARCHAR(100) NOT NULL,
  checklist_type VARCHAR(50) NOT NULL CHECK (checklist_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual', 'pre_operation', 'post_operation', 'hour_based')),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_checklist_templates_tenant_id ON equipment_checklist_templates(tenant_id);
CREATE INDEX idx_checklist_templates_equipment_type ON equipment_checklist_templates(equipment_type);
CREATE INDEX idx_checklist_templates_type ON equipment_checklist_templates(checklist_type);

-- Checklist template items
CREATE TABLE IF NOT EXISTS equipment_checklist_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES equipment_checklist_templates(id) ON DELETE CASCADE,
  item_description TEXT NOT NULL,
  item_category VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_critical BOOLEAN DEFAULT FALSE,
  requires_photo BOOLEAN DEFAULT FALSE,
  pass_fail BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_template_items_template_id ON equipment_checklist_template_items(template_id);

-- Completed maintenance checklists
CREATE TABLE IF NOT EXISTS equipment_maintenance_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES heavy_equipment(id) ON DELETE CASCADE,
  checklist_template_id UUID REFERENCES equipment_checklist_templates(id),
  completed_date TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_by UUID NOT NULL REFERENCES users(id),
  engine_hours_at_completion DECIMAL(10,1),
  overall_status VARCHAR(50) DEFAULT 'pass' CHECK (overall_status IN ('pass', 'pass_with_notes', 'fail', 'incomplete')),
  inspector_name VARCHAR(255),
  notes TEXT,
  signature_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_maintenance_checklists_equipment_id ON equipment_maintenance_checklists(equipment_id);
CREATE INDEX idx_maintenance_checklists_template_id ON equipment_maintenance_checklists(checklist_template_id);
CREATE INDEX idx_maintenance_checklists_completed_date ON equipment_maintenance_checklists(completed_date);
CREATE INDEX idx_maintenance_checklists_completed_by ON equipment_maintenance_checklists(completed_by);

-- Checklist item responses
CREATE TABLE IF NOT EXISTS equipment_checklist_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES equipment_maintenance_checklists(id) ON DELETE CASCADE,
  template_item_id UUID REFERENCES equipment_checklist_template_items(id),
  item_description TEXT NOT NULL,
  response VARCHAR(50) CHECK (response IN ('pass', 'fail', 'na', 'needs_attention')),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_checklist_responses_checklist_id ON equipment_checklist_responses(checklist_id);
CREATE INDEX idx_checklist_responses_template_item_id ON equipment_checklist_responses(template_item_id);

-- ============================================================================
-- UTILIZATION TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_utilization_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES heavy_equipment(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  shift VARCHAR(50),
  operator_id UUID REFERENCES drivers(id),
  job_site VARCHAR(255),
  project_code VARCHAR(100),

  -- Time tracking
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  productive_hours DECIMAL(6,2),
  idle_hours DECIMAL(6,2),
  maintenance_hours DECIMAL(6,2),
  down_hours DECIMAL(6,2),

  -- Usage metrics
  starting_hours DECIMAL(10,1),
  ending_hours DECIMAL(10,1),
  fuel_consumed_gallons DECIMAL(8,2),
  material_moved_units DECIMAL(10,2),

  -- Billing
  billable_hours DECIMAL(6,2),
  non_billable_hours DECIMAL(6,2),
  hourly_rate DECIMAL(8,2),
  total_revenue DECIMAL(10,2),

  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_utilization_logs_equipment_id ON equipment_utilization_logs(equipment_id);
CREATE INDEX idx_utilization_logs_log_date ON equipment_utilization_logs(log_date);
CREATE INDEX idx_utilization_logs_operator_id ON equipment_utilization_logs(operator_id);
CREATE INDEX idx_utilization_logs_job_site ON equipment_utilization_logs(job_site);

-- ============================================================================
-- MAINTENANCE SCHEDULING (Hour-based)
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES heavy_equipment(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(100) NOT NULL,
  description TEXT,
  schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN ('hours', 'calendar', 'both')),

  -- Hour-based scheduling
  interval_hours INTEGER,
  last_performed_hours DECIMAL(10,1),
  next_due_hours DECIMAL(10,1),

  -- Calendar-based scheduling
  interval_days INTEGER,
  last_performed_date DATE,
  next_due_date DATE,

  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  estimated_cost DECIMAL(10,2),
  estimated_downtime_hours DECIMAL(6,2),
  assigned_to UUID REFERENCES users(id),
  vendor_id UUID REFERENCES vendors(id),

  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'overdue', 'in_progress', 'completed', 'cancelled')),
  is_active BOOLEAN DEFAULT TRUE,

  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_equipment_maint_schedules_equipment_id ON equipment_maintenance_schedules(equipment_id);
CREATE INDEX idx_equipment_maint_schedules_status ON equipment_maintenance_schedules(status);
CREATE INDEX idx_equipment_maint_schedules_next_due_hours ON equipment_maintenance_schedules(next_due_hours);
CREATE INDEX idx_equipment_maint_schedules_next_due_date ON equipment_maintenance_schedules(next_due_date);

-- ============================================================================
-- WORK ASSIGNMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_work_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES heavy_equipment(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES drivers(id),
  job_site VARCHAR(255) NOT NULL,
  project_code VARCHAR(100),
  assignment_start DATE NOT NULL,
  assignment_end DATE,
  estimated_hours DECIMAL(8,2),
  actual_hours DECIMAL(8,2),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_work_assignments_equipment_id ON equipment_work_assignments(equipment_id);
CREATE INDEX idx_work_assignments_operator_id ON equipment_work_assignments(operator_id);
CREATE INDEX idx_work_assignments_status ON equipment_work_assignments(status);
CREATE INDEX idx_work_assignments_job_site ON equipment_work_assignments(job_site);

-- ============================================================================
-- COST ANALYSIS
-- ============================================================================

CREATE TABLE IF NOT EXISTS equipment_cost_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL REFERENCES heavy_equipment(id) ON DELETE CASCADE,
  analysis_period_start DATE NOT NULL,
  analysis_period_end DATE NOT NULL,

  -- Ownership costs
  depreciation_cost DECIMAL(10,2) DEFAULT 0,
  interest_cost DECIMAL(10,2) DEFAULT 0,
  insurance_cost DECIMAL(10,2) DEFAULT 0,
  storage_cost DECIMAL(10,2) DEFAULT 0,

  -- Operating costs
  fuel_cost DECIMAL(10,2) DEFAULT 0,
  maintenance_cost DECIMAL(10,2) DEFAULT 0,
  repair_cost DECIMAL(10,2) DEFAULT 0,
  operator_cost DECIMAL(10,2) DEFAULT 0,

  -- Utilization metrics
  total_hours DECIMAL(10,2) DEFAULT 0,
  productive_hours DECIMAL(10,2) DEFAULT 0,
  utilization_rate DECIMAL(5,2),

  -- Financial metrics
  total_cost DECIMAL(12,2),
  cost_per_hour DECIMAL(10,2),
  revenue_generated DECIMAL(12,2),
  profit_loss DECIMAL(12,2),
  roi_percentage DECIMAL(5,2),

  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cost_analysis_equipment_id ON equipment_cost_analysis(equipment_id);
CREATE INDEX idx_cost_analysis_period ON equipment_cost_analysis(analysis_period_start, analysis_period_end);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_heavy_equipment_updated_at BEFORE UPDATE ON heavy_equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_operator_certs_updated_at BEFORE UPDATE ON equipment_operator_certifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attachments_updated_at BEFORE UPDATE ON equipment_attachments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_templates_updated_at BEFORE UPDATE ON equipment_checklist_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maint_schedules_updated_at BEFORE UPDATE ON equipment_maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_assignments_updated_at BEFORE UPDATE ON equipment_work_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUTOMATIC HOUR METER UPDATE TRIGGER
-- ============================================================================

-- Function to update equipment hour meter when new reading is recorded
CREATE OR REPLACE FUNCTION update_equipment_hours()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE heavy_equipment
  SET
    engine_hours = NEW.hours,
    last_hour_meter_reading = NEW.hours,
    last_hour_meter_date = NEW.reading_date::DATE,
    updated_at = NOW()
  WHERE id = NEW.equipment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_equipment_hours
  AFTER INSERT ON equipment_hour_meter_readings
  FOR EACH ROW
  EXECUTE FUNCTION update_equipment_hours();

-- ============================================================================
-- AUTOMATIC MAINTENANCE SCHEDULE UPDATE
-- ============================================================================

-- Function to update maintenance schedule status based on hours
CREATE OR REPLACE FUNCTION check_maintenance_due()
RETURNS TRIGGER AS $$
BEGIN
  -- Update hour-based maintenance schedules
  UPDATE equipment_maintenance_schedules
  SET status = CASE
    WHEN next_due_hours IS NOT NULL AND NEW.engine_hours >= next_due_hours THEN 'overdue'
    ELSE status
  END
  WHERE equipment_id = NEW.id
    AND schedule_type IN ('hours', 'both')
    AND status = 'scheduled';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_maintenance_due
  AFTER UPDATE OF engine_hours ON heavy_equipment
  FOR EACH ROW
  EXECUTE FUNCTION check_maintenance_due();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Equipment with upcoming maintenance
CREATE OR REPLACE VIEW vw_equipment_maintenance_due AS
SELECT
  he.id,
  he.tenant_id,
  a.asset_tag,
  a.asset_name,
  he.equipment_type,
  he.manufacturer,
  he.model,
  he.engine_hours,
  ems.maintenance_type,
  ems.next_due_hours,
  ems.next_due_date,
  ems.priority,
  CASE
    WHEN ems.next_due_hours IS NOT NULL THEN ems.next_due_hours - he.engine_hours
    ELSE NULL
  END as hours_until_due,
  CASE
    WHEN ems.next_due_date IS NOT NULL THEN ems.next_due_date - CURRENT_DATE
    ELSE NULL
  END as days_until_due
FROM heavy_equipment he
JOIN assets a ON he.asset_id = a.id
JOIN equipment_maintenance_schedules ems ON he.id = ems.equipment_id
WHERE ems.status IN ('scheduled', 'overdue')
  AND ems.is_active = TRUE;

-- View: Operator certification matrix
CREATE OR REPLACE VIEW vw_operator_certification_matrix AS
SELECT
  d.id as driver_id,
  d.first_name || ' ' || d.last_name as operator_name,
  d.tenant_id,
  eoc.equipment_type,
  eoc.certification_number,
  eoc.expiry_date,
  eoc.status,
  CASE
    WHEN eoc.expiry_date < CURRENT_DATE THEN 'expired'
    WHEN eoc.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'valid'
  END as certification_status
FROM drivers d
LEFT JOIN equipment_operator_certifications eoc ON d.id = eoc.driver_id
WHERE d.status = 'active';

-- View: Equipment utilization summary
CREATE OR REPLACE VIEW vw_equipment_utilization_summary AS
SELECT
  he.id,
  he.tenant_id,
  a.asset_tag,
  a.asset_name,
  he.equipment_type,
  he.current_job_site,
  he.availability_status,
  SUM(eul.productive_hours) as total_productive_hours,
  SUM(eul.idle_hours) as total_idle_hours,
  SUM(eul.maintenance_hours) as total_maintenance_hours,
  CASE
    WHEN SUM(eul.productive_hours + eul.idle_hours + eul.maintenance_hours) > 0
    THEN (SUM(eul.productive_hours) / SUM(eul.productive_hours + eul.idle_hours + eul.maintenance_hours)) * 100
    ELSE 0
  END as utilization_percentage,
  SUM(eul.total_revenue) as total_revenue
FROM heavy_equipment he
JOIN assets a ON he.asset_id = a.id
LEFT JOIN equipment_utilization_logs eul ON he.id = eul.equipment_id
  AND eul.log_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY he.id, he.tenant_id, a.asset_tag, a.asset_name, he.equipment_type, he.current_job_site, he.availability_status;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE heavy_equipment IS 'Heavy equipment and specialized machinery tracking';
COMMENT ON TABLE equipment_operator_certifications IS 'Operator certifications and qualifications for equipment operation';
COMMENT ON TABLE equipment_hour_meter_readings IS 'Hour meter readings for usage tracking';
COMMENT ON TABLE equipment_attachments IS 'Equipment attachments and accessories';
COMMENT ON TABLE equipment_maintenance_checklists IS 'Completed maintenance inspection checklists';
COMMENT ON TABLE equipment_utilization_logs IS 'Daily utilization and productivity tracking';
COMMENT ON TABLE equipment_maintenance_schedules IS 'Hour-based and calendar-based maintenance scheduling';
COMMENT ON TABLE equipment_cost_analysis IS 'Equipment cost analysis and ROI tracking';
