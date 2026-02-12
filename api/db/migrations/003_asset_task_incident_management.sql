-- Migration 003: Asset Management, Task Management, and Incident Management Tables
-- Created: 2025-11-11
-- Description: Comprehensive schema for asset tracking, task workflows, and incident investigation

-- ============================================================================
-- ASSET MANAGEMENT TABLES
-- ============================================================================

-- Assets table - Main asset inventory
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_tag VARCHAR(100) NOT NULL UNIQUE,
  asset_name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('vehicle', 'equipment', 'tool', 'electronics', 'furniture', 'facility', 'software', 'other')),
  category VARCHAR(100),
  description TEXT,
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  serial_number VARCHAR(255),
  purchase_date DATE,
  purchase_price DECIMAL(12,2),
  current_value DECIMAL(12,2),
  depreciation_rate DECIMAL(5,2) DEFAULT 20.00,
  condition VARCHAR(50) NOT NULL DEFAULT 'good' CHECK (condition IN ('excellent', 'good', 'fair', 'poor', 'needs_repair')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_use', 'maintenance', 'retired', 'disposed')),
  location VARCHAR(255),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  warranty_expiration DATE,
  last_maintenance DATE,
  qr_code VARCHAR(255) UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  CONSTRAINT unique_asset_tag_per_tenant UNIQUE (tenant_id, asset_tag)
);

CREATE INDEX idx_assets_tenant_id ON assets(tenant_id);
CREATE INDEX idx_assets_asset_type ON assets(asset_type);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_assigned_to ON assets(assigned_to);
CREATE INDEX idx_assets_condition ON assets(condition);
CREATE INDEX idx_assets_qr_code ON assets(qr_code);

-- Asset assignments tracking
CREATE TABLE IF NOT EXISTS asset_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assignment_date TIMESTAMP NOT NULL DEFAULT NOW(),
  return_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_asset_assignments_asset_id ON asset_assignments(asset_id);
CREATE INDEX idx_asset_assignments_assigned_to ON asset_assignments(assigned_to);

-- Asset transfers tracking
CREATE TABLE IF NOT EXISTS asset_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  from_location VARCHAR(255),
  to_location VARCHAR(255),
  from_user UUID REFERENCES users(id),
  to_user UUID REFERENCES users(id),
  transfer_date DATE NOT NULL,
  transfer_reason VARCHAR(100),
  notes TEXT,
  initiated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_asset_transfers_asset_id ON asset_transfers(asset_id);
CREATE INDEX idx_asset_transfers_transfer_date ON asset_transfers(transfer_date);

-- Asset maintenance history
CREATE TABLE IF NOT EXISTS asset_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  maintenance_type VARCHAR(100) NOT NULL,
  maintenance_date DATE NOT NULL,
  description TEXT,
  cost DECIMAL(10,2),
  performed_by VARCHAR(255),
  next_maintenance_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_asset_maintenance_asset_id ON asset_maintenance(asset_id);
CREATE INDEX idx_asset_maintenance_date ON asset_maintenance(maintenance_date);

-- Asset audit log
CREATE TABLE IF NOT EXISTS asset_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  performed_by UUID REFERENCES users(id),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_asset_audit_log_asset_id ON asset_audit_log(asset_id);
CREATE INDEX idx_asset_audit_log_timestamp ON asset_audit_log(timestamp);

-- ============================================================================
-- TASK MANAGEMENT TABLES
-- ============================================================================

-- Tasks table - Main task tracking
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  task_title VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(100) NOT NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  due_date DATE,
  start_date DATE,
  completed_date TIMESTAMP,
  estimated_hours DECIMAL(8,2),
  actual_hours DECIMAL(8,2),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  work_order_id UUID,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_task_type ON tasks(task_type);

-- Task comments
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_created_by ON task_comments(created_by);

-- Task time tracking
CREATE TABLE IF NOT EXISTS task_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_time_entries_task_id ON task_time_entries(task_id);
CREATE INDEX idx_task_time_entries_user_id ON task_time_entries(user_id);

-- Task checklist items
CREATE TABLE IF NOT EXISTS task_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  item_text VARCHAR(500) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_by UUID REFERENCES users(id),
  completed_at TIMESTAMP,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_checklist_items_task_id ON task_checklist_items(task_id);

-- Task attachments
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);

-- ============================================================================
-- INCIDENT MANAGEMENT TABLES
-- ============================================================================

-- Incidents table - Main incident tracking
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  incident_title VARCHAR(255) NOT NULL,
  incident_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  incident_date DATE NOT NULL,
  incident_time TIME,
  location VARCHAR(500),
  description TEXT,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  reported_by UUID NOT NULL REFERENCES users(id),
  assigned_investigator UUID REFERENCES users(id) ON DELETE SET NULL,
  injuries_reported BOOLEAN DEFAULT FALSE,
  injury_details TEXT,
  property_damage BOOLEAN DEFAULT FALSE,
  damage_estimate DECIMAL(12,2),
  weather_conditions VARCHAR(100),
  road_conditions VARCHAR(100),
  police_report_number VARCHAR(100),
  insurance_claim_number VARCHAR(100),
  resolution_notes TEXT,
  root_cause TEXT,
  preventive_measures TEXT,
  closed_by UUID REFERENCES users(id),
  closed_date TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_incidents_tenant_id ON incidents(tenant_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_incident_date ON incidents(incident_date);
CREATE INDEX idx_incidents_incident_type ON incidents(incident_type);
CREATE INDEX idx_incidents_vehicle_id ON incidents(vehicle_id);
CREATE INDEX idx_incidents_driver_id ON incidents(driver_id);
CREATE INDEX idx_incidents_reported_by ON incidents(reported_by);

-- Incident corrective actions
CREATE TABLE IF NOT EXISTS incident_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL CHECK (action_type IN ('corrective', 'preventive', 'training', 'policy_update', 'other')),
  action_description TEXT NOT NULL,
  assigned_to UUID REFERENCES users(id),
  due_date DATE,
  completed_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_incident_actions_incident_id ON incident_actions(incident_id);
CREATE INDEX idx_incident_actions_assigned_to ON incident_actions(assigned_to);
CREATE INDEX idx_incident_actions_status ON incident_actions(status);

-- Incident timeline (audit trail)
CREATE TABLE IF NOT EXISTS incident_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  performed_by UUID REFERENCES users(id),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_incident_timeline_incident_id ON incident_timeline(incident_id);
CREATE INDEX idx_incident_timeline_timestamp ON incident_timeline(timestamp);

-- Incident witnesses
CREATE TABLE IF NOT EXISTS incident_witnesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  witness_name VARCHAR(255) NOT NULL,
  contact_info VARCHAR(255),
  statement TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_incident_witnesses_incident_id ON incident_witnesses(incident_id);

-- Incident photos/attachments
CREATE TABLE IF NOT EXISTS incident_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type VARCHAR(50),
  caption TEXT,
  taken_at TIMESTAMP,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_incident_photos_incident_id ON incident_photos(incident_id);

-- ============================================================================
-- UPDATE TRIGGERS FOR TIMESTAMP MANAGEMENT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions on all new tables (adjust role name as needed)
DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'assets', 'asset_assignments', 'asset_transfers', 'asset_maintenance', 'asset_audit_log',
      'tasks', 'task_comments', 'task_time_entries', 'task_checklist_items', 'task_attachments',
      'incidents', 'incident_actions', 'incident_timeline', 'incident_witnesses', 'incident_photos'
    )
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO fleet_user', table_name);
  END LOOP;
END $$;

-- ============================================================================
-- SAMPLE DATA FOR DEVELOPMENT (Optional - Comment out for production)
-- ============================================================================

-- Insert sample data only if not in production
-- DO $$
-- BEGIN
--   IF current_setting('server.environment', true) != 'production' THEN
--     -- Sample asset
--     INSERT INTO assets (tenant_id, asset_tag, asset_name, asset_type, category, condition, status)
--     SELECT id, 'AST-001', 'Dell Laptop XPS 15', 'electronics', 'IT Equipment', 'good', 'active'
--     FROM tenants LIMIT 1;
--
--     -- Sample task
--     INSERT INTO tasks (tenant_id, task_title, task_type, priority, status, created_by)
--     SELECT t.id, 'Quarterly Vehicle Inspection', 'inspection', 'high', 'pending', u.id
--     FROM tenants t, users u WHERE u.role = 'admin' LIMIT 1;
--
--     -- Sample incident
--     INSERT INTO incidents (tenant_id, incident_title, incident_type, severity, status, incident_date, reported_by)
--     SELECT t.id, 'Minor Parking Lot Collision', 'accident', 'low', 'open', CURRENT_DATE, u.id
--     FROM tenants t, users u WHERE u.role = 'admin' LIMIT 1;
--   END IF;
-- END $$;

COMMENT ON TABLE assets IS 'Asset inventory and lifecycle management';
COMMENT ON TABLE tasks IS 'Task tracking and workflow management';
COMMENT ON TABLE incidents IS 'Incident reporting and investigation tracking';
