-- Migration 030: Enhanced Task & Asset Management System
-- Created: 2025-11-16
-- Description: Industry-leading task and asset management with AI, real-time collaboration, and advanced analytics

-- =================================================================
-- NOTIFICATIONS SYSTEM
-- =================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(50) DEFAULT 'normal',
  data JSONB DEFAULT '{}',
  action_url TEXT,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  in_app_notifications BOOLEAN DEFAULT true,
  notification_types JSONB DEFAULT '{}',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  email_subject VARCHAR(255),
  email_body TEXT,
  sms_text TEXT,
  push_title VARCHAR(255),
  push_body TEXT,
  in_app_title VARCHAR(255),
  in_app_message TEXT,
  variables TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  channels TEXT[],
  priority VARCHAR(50) DEFAULT 'normal',
  data JSONB DEFAULT '{}',
  action_url TEXT,
  scheduled_for TIMESTAMP NOT NULL,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);

-- =================================================================
-- CUSTOM FIELDS SYSTEM
-- =================================================================

CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL,
  description TEXT,
  required BOOLEAN DEFAULT false,
  default_value TEXT,
  options JSONB,
  validation JSONB,
  conditional JSONB,
  group_name VARCHAR(100),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_field_name_per_tenant UNIQUE (tenant_id, entity_type, field_name)
);

CREATE INDEX idx_custom_field_definitions_tenant ON custom_field_definitions(tenant_id);
CREATE INDEX idx_custom_field_definitions_entity ON custom_field_definitions(entity_type);

CREATE TABLE IF NOT EXISTS custom_field_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  group_name VARCHAR(100) NOT NULL,
  group_label VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_collapsible BOOLEAN DEFAULT true,
  is_collapsed_by_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  value JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_field_value UNIQUE (field_id, entity_id)
);

CREATE INDEX idx_custom_field_values_entity ON custom_field_values(entity_type, entity_id);
CREATE INDEX idx_custom_field_values_field ON custom_field_values(field_id);

-- =================================================================
-- ACTIVITY LOG & AUDIT TRAIL
-- =================================================================

CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id),
  user_name VARCHAR(255),
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_user ON activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);

-- =================================================================
-- JOB QUEUE SYSTEM
-- =================================================================

CREATE TABLE IF NOT EXISTS job_queue (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'queued',
  payload JSONB NOT NULL,
  progress JSONB,
  error_message TEXT,
  user_id UUID REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX idx_job_queue_status ON job_queue(status);
CREATE INDEX idx_job_queue_type ON job_queue(type);
CREATE INDEX idx_job_queue_tenant ON job_queue(tenant_id);
CREATE INDEX idx_job_queue_created_at ON job_queue(created_at);

-- =================================================================
-- TASK ATTACHMENTS
-- =================================================================

CREATE TABLE IF NOT EXISTS task_file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_file_attachments_task ON task_file_attachments(task_id);

-- =================================================================
-- ASSET ATTACHMENTS
-- =================================================================

CREATE TABLE IF NOT EXISTS asset_file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_asset_file_attachments_asset ON asset_file_attachments(asset_id);

-- =================================================================
-- ASSET COMMENTS
-- =================================================================

CREATE TABLE IF NOT EXISTS asset_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_asset_comments_asset ON asset_comments(asset_id);

-- =================================================================
-- ASSET HISTORY (Enhanced version of asset_audit_log)
-- =================================================================

CREATE TABLE IF NOT EXISTS asset_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  performed_by UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  location VARCHAR(255),
  notes TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_asset_history_asset ON asset_history(asset_id);
CREATE INDEX idx_asset_history_timestamp ON asset_history(timestamp);

-- =================================================================
-- MAINTENANCE SCHEDULES (if not exists)
-- =================================================================

CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_maintenance_schedules_asset ON maintenance_schedules(asset_id);
CREATE INDEX idx_maintenance_schedules_date ON maintenance_schedules(scheduled_date);

-- =================================================================
-- TASK TEMPLATES
-- =================================================================

CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  description TEXT,
  task_type VARCHAR(100),
  priority VARCHAR(50),
  estimated_hours DECIMAL(8,2),
  checklist_items JSONB,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_task_templates_tenant ON task_templates(tenant_id);

-- =================================================================
-- ASSET TEMPLATES
-- =================================================================

CREATE TABLE IF NOT EXISTS asset_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  description TEXT,
  asset_type VARCHAR(50),
  default_depreciation_rate DECIMAL(5,2),
  custom_fields JSONB,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_asset_templates_tenant ON asset_templates(tenant_id);

-- =================================================================
-- SAVED FILTERS
-- =================================================================

CREATE TABLE IF NOT EXISTS saved_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  filter_name VARCHAR(255) NOT NULL,
  filter_config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_saved_filters_user ON saved_filters(user_id);

-- =================================================================
-- TASK TAGS (Many-to-Many relationship)
-- =================================================================

CREATE TABLE IF NOT EXISTS task_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tag_name VARCHAR(100) NOT NULL,
  tag_color VARCHAR(7),
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_tag_per_tenant UNIQUE (tenant_id, tag_name)
);

CREATE TABLE IF NOT EXISTS task_tag_mappings (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES task_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- =================================================================
-- USER PREFERENCES
-- =================================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  default_task_view VARCHAR(50) DEFAULT 'table',
  default_asset_view VARCHAR(50) DEFAULT 'table',
  items_per_page INTEGER DEFAULT 50,
  enable_keyboard_shortcuts BOOLEAN DEFAULT true,
  theme VARCHAR(50) DEFAULT 'system',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =================================================================
-- GRANT PERMISSIONS
-- =================================================================

DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'notifications', 'notification_preferences', 'notification_templates', 'scheduled_notifications',
      'custom_field_definitions', 'custom_field_groups', 'custom_field_values',
      'activity_log', 'job_queue',
      'task_file_attachments', 'asset_file_attachments', 'asset_comments', 'asset_history',
      'maintenance_schedules', 'task_templates', 'asset_templates',
      'saved_filters', 'task_tags', 'task_tag_mappings', 'user_preferences'
    )
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE %I TO fleet_user', table_name);
  END LOOP;
END $$;

-- =================================================================
-- COMMENTS
-- =================================================================

COMMENT ON TABLE notifications IS 'In-app and multi-channel notifications';
COMMENT ON TABLE custom_field_definitions IS 'Dynamic custom fields for tasks and assets';
COMMENT ON TABLE activity_log IS 'Comprehensive audit trail for all entities';
COMMENT ON TABLE job_queue IS 'Background job processing queue';
COMMENT ON TABLE task_templates IS 'Reusable task templates';
COMMENT ON TABLE asset_templates IS 'Reusable asset configuration templates';
