-- Migration 011: Custom Report Builder
-- Created: 2025-11-11
-- Description: Comprehensive custom report builder with drag-and-drop interface and scheduled reports

-- ============================================================================
-- CUSTOM REPORTS TABLES
-- ============================================================================

-- Custom reports - User-defined report configurations
CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  report_name VARCHAR(255) NOT NULL,
  description TEXT,
  data_sources TEXT[] NOT NULL, -- ['vehicles', 'drivers', 'trips', etc.]
  filters JSONB DEFAULT '[]'::jsonb, -- Array of filter conditions
  columns JSONB NOT NULL, -- Array of selected columns with display config
  grouping JSONB DEFAULT '[]'::jsonb, -- Grouping configuration
  sorting JSONB DEFAULT '[]'::jsonb, -- Sorting configuration
  aggregations JSONB DEFAULT '[]'::jsonb, -- Aggregation functions (sum, avg, count, etc.)
  joins JSONB DEFAULT '[]'::jsonb, -- Join configurations between tables
  created_by UUID NOT NULL REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  is_public BOOLEAN DEFAULT FALSE, -- Share with other users in tenant
  is_template BOOLEAN DEFAULT FALSE, -- System or user template
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_custom_reports_tenant_id ON custom_reports(tenant_id);
CREATE INDEX idx_custom_reports_created_by ON custom_reports(created_by);
CREATE INDEX idx_custom_reports_is_public ON custom_reports(is_public);
CREATE INDEX idx_custom_reports_is_template ON custom_reports(is_template);

-- Report schedules - Scheduled report execution
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
  schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'quarterly', 'custom')),
  schedule_config JSONB NOT NULL, -- Detailed schedule configuration (time, day of week, etc.)
  recipients TEXT[] NOT NULL, -- Email addresses to receive report
  format VARCHAR(20) NOT NULL CHECK (format IN ('xlsx', 'csv', 'pdf')),
  is_active BOOLEAN DEFAULT TRUE,
  last_run TIMESTAMP,
  next_run TIMESTAMP NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_report_schedules_report_id ON report_schedules(report_id);
CREATE INDEX idx_report_schedules_is_active ON report_schedules(is_active);
CREATE INDEX idx_report_schedules_next_run ON report_schedules(next_run);

-- Report executions - History of report runs
CREATE TABLE IF NOT EXISTS report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES report_schedules(id) ON DELETE SET NULL,
  executed_by UUID REFERENCES users(id), -- NULL for scheduled runs
  execution_time TIMESTAMP DEFAULT NOW(),
  execution_duration_ms INTEGER,
  row_count INTEGER,
  file_url VARCHAR(500), -- Path to generated file
  file_size_bytes BIGINT,
  format VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_report_executions_report_id ON report_executions(report_id);
CREATE INDEX idx_report_executions_schedule_id ON report_executions(schedule_id);
CREATE INDEX idx_report_executions_executed_by ON report_executions(executed_by);
CREATE INDEX idx_report_executions_execution_time ON report_executions(execution_time DESC);
CREATE INDEX idx_report_executions_status ON report_executions(status);

-- Report templates - Pre-built report templates
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for system templates
  template_name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- 'utilization', 'maintenance', 'fuel', 'compliance', etc.
  preview_image VARCHAR(500),
  config JSONB NOT NULL, -- Template configuration matching custom_reports structure
  is_system_template BOOLEAN DEFAULT FALSE, -- System-provided templates
  usage_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_report_templates_tenant_id ON report_templates(tenant_id);
CREATE INDEX idx_report_templates_category ON report_templates(category);
CREATE INDEX idx_report_templates_is_system_template ON report_templates(is_system_template);

-- Report shares - Share reports with specific users
CREATE TABLE IF NOT EXISTS report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission VARCHAR(20) NOT NULL CHECK (permission IN ('view', 'edit', 'execute')),
  shared_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_report_share UNIQUE (report_id, shared_with_user_id)
);

CREATE INDEX idx_report_shares_report_id ON report_shares(report_id);
CREATE INDEX idx_report_shares_shared_with_user_id ON report_shares(shared_with_user_id);

-- Report favorites - User's favorite reports
CREATE TABLE IF NOT EXISTS report_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_report_favorite UNIQUE (user_id, report_id)
);

CREATE INDEX idx_report_favorites_user_id ON report_favorites(user_id);
CREATE INDEX idx_report_favorites_report_id ON report_favorites(report_id);

-- ============================================================================
-- INSERT SYSTEM REPORT TEMPLATES
-- ============================================================================

-- Fleet Utilization Summary Template
INSERT INTO report_templates (
  template_name, description, category, config, is_system_template
) VALUES (
  'Fleet Utilization Summary',
  'Comprehensive view of vehicle utilization rates, active hours, and recommendations',
  'utilization',
  '{
    "data_sources": ["vehicles", "trips", "utilization_metrics"],
    "columns": [
      {"field": "vehicle_number", "label": "Vehicle", "table": "vehicles", "type": "string"},
      {"field": "vehicle_type", "label": "Type", "table": "vehicles", "type": "string"},
      {"field": "utilization_rate", "label": "Utilization %", "table": "utilization_metrics", "type": "percentage"},
      {"field": "active_hours", "label": "Active Hours", "table": "utilization_metrics", "type": "number"},
      {"field": "idle_hours", "label": "Idle Hours", "table": "utilization_metrics", "type": "number"},
      {"field": "total_miles", "label": "Total Miles", "table": "utilization_metrics", "type": "number"},
      {"field": "recommendation", "label": "Recommendation", "table": "utilization_metrics", "type": "string"}
    ],
    "joins": [
      {"type": "left", "from": "vehicles", "to": "utilization_metrics", "on": "vehicles.id = utilization_metrics.vehicle_id"}
    ],
    "sorting": [{"field": "utilization_rate", "direction": "desc"}]
  }'::jsonb,
  true
);

-- Maintenance Cost Analysis Template
INSERT INTO report_templates (
  template_name, description, category, config, is_system_template
) VALUES (
  'Maintenance Cost Analysis',
  'Detailed breakdown of maintenance costs by vehicle, type, and vendor',
  'maintenance',
  '{
    "data_sources": ["vehicles", "work_orders", "vendors"],
    "columns": [
      {"field": "vehicle_number", "label": "Vehicle", "table": "vehicles", "type": "string"},
      {"field": "work_order_type", "label": "Work Type", "table": "work_orders", "type": "string"},
      {"field": "vendor_name", "label": "Vendor", "table": "vendors", "type": "string"},
      {"field": "labor_cost", "label": "Labor Cost", "table": "work_orders", "type": "currency"},
      {"field": "parts_cost", "label": "Parts Cost", "table": "work_orders", "type": "currency"},
      {"field": "total_cost", "label": "Total Cost", "table": "work_orders", "type": "currency", "aggregate": "sum"},
      {"field": "completed_date", "label": "Completed", "table": "work_orders", "type": "date"}
    ],
    "joins": [
      {"type": "left", "from": "work_orders", "to": "vehicles", "on": "work_orders.vehicle_id = vehicles.id"},
      {"type": "left", "from": "work_orders", "to": "vendors", "on": "work_orders.vendor_id = vendors.id"}
    ],
    "filters": [
      {"field": "work_orders.status", "operator": "equals", "value": "completed"}
    ],
    "grouping": [{"field": "vehicle_number"}],
    "sorting": [{"field": "total_cost", "direction": "desc"}]
  }'::jsonb,
  true
);

-- Driver Performance Report Template
INSERT INTO report_templates (
  template_name, description, category, config, is_system_template
) VALUES (
  'Driver Performance Report',
  'Driver safety scores, incidents, and trip statistics',
  'performance',
  '{
    "data_sources": ["drivers", "trips", "safety_incidents"],
    "columns": [
      {"field": "first_name", "label": "First Name", "table": "drivers", "type": "string"},
      {"field": "last_name", "label": "Last Name", "table": "drivers", "type": "string"},
      {"field": "trips_count", "label": "Total Trips", "table": "trips", "type": "count"},
      {"field": "total_distance", "label": "Total Miles", "table": "trips", "type": "number", "aggregate": "sum"},
      {"field": "incidents_count", "label": "Incidents", "table": "safety_incidents", "type": "count"},
      {"field": "avg_speed", "label": "Avg Speed", "table": "trips", "type": "number", "aggregate": "avg"}
    ],
    "joins": [
      {"type": "left", "from": "drivers", "to": "trips", "on": "drivers.id = trips.driver_id"},
      {"type": "left", "from": "drivers", "to": "safety_incidents", "on": "drivers.id = safety_incidents.driver_id"}
    ],
    "grouping": [{"field": "drivers.id"}, {"field": "first_name"}, {"field": "last_name"}],
    "sorting": [{"field": "incidents_count", "direction": "asc"}]
  }'::jsonb,
  true
);

-- Fuel Efficiency Report Template
INSERT INTO report_templates (
  template_name, description, category, config, is_system_template
) VALUES (
  'Fuel Efficiency Report',
  'Fuel consumption, MPG, and cost analysis by vehicle',
  'fuel',
  '{
    "data_sources": ["vehicles", "fuel_transactions"],
    "columns": [
      {"field": "vehicle_number", "label": "Vehicle", "table": "vehicles", "type": "string"},
      {"field": "vehicle_type", "label": "Type", "table": "vehicles", "type": "string"},
      {"field": "gallons", "label": "Total Gallons", "table": "fuel_transactions", "type": "number", "aggregate": "sum"},
      {"field": "cost", "label": "Total Fuel Cost", "table": "fuel_transactions", "type": "currency", "aggregate": "sum"},
      {"field": "odometer", "label": "Latest Odometer", "table": "fuel_transactions", "type": "number", "aggregate": "max"}
    ],
    "joins": [
      {"type": "left", "from": "vehicles", "to": "fuel_transactions", "on": "vehicles.id = fuel_transactions.vehicle_id"}
    ],
    "grouping": [{"field": "vehicle_number"}, {"field": "vehicle_type"}],
    "sorting": [{"field": "cost", "direction": "desc"}]
  }'::jsonb,
  true
);

-- Incident Summary Report Template
INSERT INTO report_templates (
  template_name, description, category, config, is_system_template
) VALUES (
  'Incident Summary Report',
  'Safety incidents with severity, cost, and resolution status',
  'safety',
  '{
    "data_sources": ["safety_incidents", "drivers", "vehicles"],
    "columns": [
      {"field": "incident_date", "label": "Date", "table": "safety_incidents", "type": "date"},
      {"field": "incident_type", "label": "Type", "table": "safety_incidents", "type": "string"},
      {"field": "severity", "label": "Severity", "table": "safety_incidents", "type": "string"},
      {"field": "vehicle_number", "label": "Vehicle", "table": "vehicles", "type": "string"},
      {"field": "driver_name", "label": "Driver", "table": "drivers", "type": "string"},
      {"field": "estimated_cost", "label": "Est. Cost", "table": "safety_incidents", "type": "currency"},
      {"field": "status", "label": "Status", "table": "safety_incidents", "type": "string"}
    ],
    "joins": [
      {"type": "left", "from": "safety_incidents", "to": "vehicles", "on": "safety_incidents.vehicle_id = vehicles.id"},
      {"type": "left", "from": "safety_incidents", "to": "drivers", "on": "safety_incidents.driver_id = drivers.id"}
    ],
    "sorting": [{"field": "incident_date", "direction": "desc"}]
  }'::jsonb,
  true
);

-- Asset Depreciation Report Template
INSERT INTO report_templates (
  template_name, description, category, config, is_system_template
) VALUES (
  'Asset Depreciation Report',
  'Vehicle asset values, depreciation, and current book value',
  'financial',
  '{
    "data_sources": ["vehicles"],
    "columns": [
      {"field": "vehicle_number", "label": "Vehicle", "table": "vehicles", "type": "string"},
      {"field": "vehicle_type", "label": "Type", "table": "vehicles", "type": "string"},
      {"field": "year", "label": "Year", "table": "vehicles", "type": "number"},
      {"field": "purchase_price", "label": "Purchase Price", "table": "vehicles", "type": "currency"},
      {"field": "current_value", "label": "Current Value", "table": "vehicles", "type": "currency"},
      {"field": "purchase_date", "label": "Purchase Date", "table": "vehicles", "type": "date"},
      {"field": "status", "label": "Status", "table": "vehicles", "type": "string"}
    ],
    "sorting": [{"field": "current_value", "direction": "desc"}]
  }'::jsonb,
  true
);

-- Compliance Report Template
INSERT INTO report_templates (
  template_name, description, category, config, is_system_template
) VALUES (
  'Compliance Report',
  'Vehicle registrations, inspections, and driver license expirations',
  'compliance',
  '{
    "data_sources": ["vehicles", "drivers", "inspections"],
    "columns": [
      {"field": "vehicle_number", "label": "Vehicle", "table": "vehicles", "type": "string"},
      {"field": "registration_expiry", "label": "Registration Expiry", "table": "vehicles", "type": "date"},
      {"field": "inspection_date", "label": "Last Inspection", "table": "inspections", "type": "date"},
      {"field": "inspection_type", "label": "Inspection Type", "table": "inspections", "type": "string"},
      {"field": "pass_fail", "label": "Result", "table": "inspections", "type": "string"}
    ],
    "joins": [
      {"type": "left", "from": "vehicles", "to": "inspections", "on": "vehicles.id = inspections.vehicle_id"}
    ],
    "sorting": [{"field": "registration_expiry", "direction": "asc"}]
  }'::jsonb,
  true
);

-- Cost Breakdown by Department Template
INSERT INTO report_templates (
  template_name, description, category, config, is_system_template
) VALUES (
  'Cost Breakdown by Department',
  'Total fleet costs grouped by department',
  'financial',
  '{
    "data_sources": ["vehicles", "cost_tracking"],
    "columns": [
      {"field": "department", "label": "Department", "table": "vehicles", "type": "string"},
      {"field": "cost_type", "label": "Cost Type", "table": "cost_tracking", "type": "string"},
      {"field": "amount", "label": "Amount", "table": "cost_tracking", "type": "currency", "aggregate": "sum"},
      {"field": "transaction_date", "label": "Period", "table": "cost_tracking", "type": "date"}
    ],
    "joins": [
      {"type": "left", "from": "vehicles", "to": "cost_tracking", "on": "vehicles.id = cost_tracking.vehicle_id"}
    ],
    "grouping": [{"field": "department"}, {"field": "cost_type"}],
    "sorting": [{"field": "amount", "direction": "desc"}]
  }'::jsonb,
  true
);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_custom_reports_updated_at BEFORE UPDATE ON custom_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_schedules_updated_at BEFORE UPDATE ON report_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'custom_reports', 'report_schedules', 'report_executions',
      'report_templates', 'report_shares', 'report_favorites'
    )
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO fleet_user', table_name);
  END LOOP;
END $$;

COMMENT ON TABLE custom_reports IS 'User-defined custom report configurations';
COMMENT ON TABLE report_schedules IS 'Scheduled report execution configurations';
COMMENT ON TABLE report_executions IS 'History of report execution runs';
COMMENT ON TABLE report_templates IS 'Pre-built report templates for quick start';
COMMENT ON TABLE report_shares IS 'Share reports with specific users';
COMMENT ON TABLE report_favorites IS 'User favorite reports for quick access';
