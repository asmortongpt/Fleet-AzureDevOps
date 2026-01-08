-- ============================================================================
-- Notification and Communication Tables
-- ============================================================================
-- Created: 2026-01-08
-- Purpose: Support notification logging and communication tracking
-- ============================================================================

-- Notification Logs Table
-- Tracks all notifications sent through the system
CREATE TABLE IF NOT EXISTS notification_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  tenant_id UUID,

  -- Notification details
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info', -- info, warning, error, success
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent

  -- Delivery channels
  channel VARCHAR(50) NOT NULL, -- email, sms, push, in_app
  recipient VARCHAR(255) NOT NULL, -- email address, phone number, device token, user_id

  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, failed, read
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  read_at TIMESTAMP,
  failed_at TIMESTAMP,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  related_entity_type VARCHAR(100), -- vehicle, driver, work_order, etc.
  related_entity_id VARCHAR(100),

  -- Audit fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Indexes
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for notification_logs
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_tenant_id ON notification_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_channel ON notification_logs(channel);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_priority ON notification_logs(priority);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_related_entity ON notification_logs(related_entity_type, related_entity_id);

-- Communication Logs Table
-- Tracks all communications (emails, SMS, etc.) sent from the system
CREATE TABLE IF NOT EXISTS communication_logs (
  id SERIAL PRIMARY KEY,
  tenant_id UUID,

  -- Communication details
  communication_type VARCHAR(50) NOT NULL, -- email, sms, phone_call, fax
  direction VARCHAR(20) NOT NULL, -- outbound, inbound

  -- Sender/Recipient
  from_address VARCHAR(255),
  to_address VARCHAR(255) NOT NULL,
  cc_addresses TEXT[], -- Array of CC addresses
  bcc_addresses TEXT[], -- Array of BCC addresses

  -- Content
  subject VARCHAR(500),
  body TEXT,
  html_body TEXT,
  attachments JSONB DEFAULT '[]', -- Array of attachment metadata

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, queued, sending, sent, delivered, failed, bounced
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  bounced_at TIMESTAMP,

  -- Error tracking
  error_code VARCHAR(100),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- External tracking
  external_id VARCHAR(255), -- ID from email service provider
  external_metadata JSONB DEFAULT '{}',

  -- Related entities
  user_id INTEGER,
  related_entity_type VARCHAR(100),
  related_entity_id VARCHAR(100),

  -- Cost tracking
  cost_cents INTEGER DEFAULT 0, -- Cost in cents (for SMS, etc.)

  -- Metadata
  metadata JSONB DEFAULT '{}',
  tags TEXT[], -- Array of tags for categorization

  -- Audit fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER,

  CONSTRAINT fk_communication_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_communication_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for communication_logs
CREATE INDEX IF NOT EXISTS idx_communication_logs_tenant_id ON communication_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_type ON communication_logs(communication_type);
CREATE INDEX IF NOT EXISTS idx_communication_logs_direction ON communication_logs(direction);
CREATE INDEX IF NOT EXISTS idx_communication_logs_status ON communication_logs(status);
CREATE INDEX IF NOT EXISTS idx_communication_logs_user_id ON communication_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_to_address ON communication_logs(to_address);
CREATE INDEX IF NOT EXISTS idx_communication_logs_from_address ON communication_logs(from_address);
CREATE INDEX IF NOT EXISTS idx_communication_logs_created_at ON communication_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_communication_logs_related_entity ON communication_logs(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_external_id ON communication_logs(external_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_tags ON communication_logs USING gin(tags);

-- Report History Table
-- Tracks generated reports for auditing and caching
CREATE TABLE IF NOT EXISTS report_history (
  id SERIAL PRIMARY KEY,
  tenant_id UUID,

  -- Report details
  report_type VARCHAR(100) NOT NULL, -- maintenance, cost-analysis, utilization, etc.
  report_name VARCHAR(255) NOT NULL,
  report_format VARCHAR(20) NOT NULL, -- pdf, excel, csv, json

  -- Parameters
  parameters JSONB DEFAULT '{}', -- Report generation parameters
  filters JSONB DEFAULT '{}', -- Applied filters

  -- File information
  file_path VARCHAR(500),
  file_size_bytes BIGINT,
  file_url VARCHAR(1000), -- Presigned URL or permanent URL
  storage_provider VARCHAR(50) DEFAULT 'local', -- local, s3, azure_blob, etc.

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, generating, completed, failed, expired
  progress_percent INTEGER DEFAULT 0,

  -- Generation details
  generated_by INTEGER NOT NULL,
  generated_at TIMESTAMP,
  generation_time_ms INTEGER, -- Time taken to generate in milliseconds

  -- Expiration
  expires_at TIMESTAMP, -- When the file should be deleted
  accessed_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP,

  -- Delivery
  delivery_method VARCHAR(50), -- download, email, scheduled
  delivered_to VARCHAR(255),
  delivered_at TIMESTAMP,

  -- Error tracking
  error_message TEXT,
  error_stack TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Row counts (for validation)
  row_count INTEGER,
  page_count INTEGER,

  -- Audit fields
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_report_history_generated_by FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for report_history
CREATE INDEX IF NOT EXISTS idx_report_history_tenant_id ON report_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_report_history_type ON report_history(report_type);
CREATE INDEX IF NOT EXISTS idx_report_history_status ON report_history(status);
CREATE INDEX IF NOT EXISTS idx_report_history_generated_by ON report_history(generated_by);
CREATE INDEX IF NOT EXISTS idx_report_history_created_at ON report_history(created_at);
CREATE INDEX IF NOT EXISTS idx_report_history_expires_at ON report_history(expires_at);
CREATE INDEX IF NOT EXISTS idx_report_history_format ON report_history(report_format);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_logs_updated_at BEFORE UPDATE ON notification_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communication_logs_updated_at BEFORE UPDATE ON communication_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_history_updated_at BEFORE UPDATE ON report_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_logs TO webapp;
GRANT SELECT, INSERT, UPDATE, DELETE ON communication_logs TO webapp;
GRANT SELECT, INSERT, UPDATE, DELETE ON report_history TO webapp;
GRANT USAGE, SELECT ON SEQUENCE notification_logs_id_seq TO webapp;
GRANT USAGE, SELECT ON SEQUENCE communication_logs_id_seq TO webapp;
GRANT USAGE, SELECT ON SEQUENCE report_history_id_seq TO webapp;

-- Comments
COMMENT ON TABLE notification_logs IS 'Tracks all system notifications (push, email, SMS, in-app)';
COMMENT ON TABLE communication_logs IS 'Tracks all outbound and inbound communications';
COMMENT ON TABLE report_history IS 'Tracks generated reports for auditing and caching';

COMMENT ON COLUMN notification_logs.priority IS 'Notification priority: low, normal, high, urgent';
COMMENT ON COLUMN notification_logs.channel IS 'Delivery channel: email, sms, push, in_app';
COMMENT ON COLUMN communication_logs.cost_cents IS 'Cost in cents (useful for SMS tracking)';
COMMENT ON COLUMN report_history.expires_at IS 'When the generated file should be auto-deleted';
