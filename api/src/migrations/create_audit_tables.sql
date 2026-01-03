-- ============================================================================
-- Comprehensive Audit Logging Migration
-- Creates tables for structured audit logging, encryption, and retention
-- ============================================================================

-- Main audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correlation_id UUID NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  user_id VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL,
  action_display_name VARCHAR(255),

  -- Resource information
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  resource_name VARCHAR(500),

  -- Result tracking
  result_status VARCHAR(20) NOT NULL, -- 'success' or 'failure'
  result_code INTEGER,
  result_message TEXT,

  -- Context
  severity VARCHAR(20) NOT NULL, -- 'INFO', 'WARNING', 'ERROR', 'CRITICAL'
  ip_address INET,
  user_agent TEXT,
  method VARCHAR(20), -- HTTP method
  endpoint VARCHAR(500),
  session_id VARCHAR(255),

  -- Encryption
  encrypted_data JSONB NOT NULL,
  checksum VARCHAR(64) NOT NULL,

  -- Storage management
  tier VARCHAR(20) DEFAULT 'HOT', -- 'HOT', 'WARM', 'COLD'
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes for common queries
  CONSTRAINT audit_logs_user_id_idx UNIQUE NULLS NOT DISTINCT (user_id, timestamp),
  CONSTRAINT audit_logs_correlation_idx UNIQUE NULLS NOT DISTINCT (correlation_id, timestamp),
  CONSTRAINT audit_logs_resource_idx UNIQUE NULLS NOT DISTINCT (resource_type, resource_id, timestamp)
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation_id ON audit_logs(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tier ON audit_logs(tier);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Retention policies table
CREATE TABLE IF NOT EXISTS retention_policies (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  resource_type VARCHAR(100) NOT NULL,
  retention_days INTEGER NOT NULL,
  tier VARCHAR(20) NOT NULL, -- 'HOT', 'WARM', 'COLD'
  compression BOOLEAN DEFAULT false,
  encryption BOOLEAN DEFAULT true,
  automatic_purge BOOLEAN DEFAULT false,
  delete_after_days INTEGER,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for retention policies
CREATE INDEX IF NOT EXISTS idx_retention_policies_resource_type ON retention_policies(resource_type);
CREATE INDEX IF NOT EXISTS idx_retention_policies_enabled ON retention_policies(enabled);

-- Retention events tracking
CREATE TABLE IF NOT EXISTS retention_events (
  id VARCHAR(255) PRIMARY KEY,
  policy_id VARCHAR(255) NOT NULL REFERENCES retention_policies(id),
  action VARCHAR(50) NOT NULL, -- 'ARCHIVE', 'PURGE', 'RESTORE', 'VERIFY'
  records_affected INTEGER DEFAULT 0,
  status VARCHAR(50) NOT NULL, -- 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for retention events
CREATE INDEX IF NOT EXISTS idx_retention_events_policy_id ON retention_events(policy_id);
CREATE INDEX IF NOT EXISTS idx_retention_events_status ON retention_events(status);
CREATE INDEX IF NOT EXISTS idx_retention_events_started_at ON retention_events(started_at DESC);

-- Audit reports table
CREATE TABLE IF NOT EXISTS audit_reports (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(100) NOT NULL, -- 'EXECUTIVE_SUMMARY', 'ACTIVITY_REPORT', etc.
  title VARCHAR(500) NOT NULL,
  description TEXT,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit reports
CREATE INDEX IF NOT EXISTS idx_audit_reports_type ON audit_reports(type);
CREATE INDEX IF NOT EXISTS idx_audit_reports_generated_at ON audit_reports(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_reports_period ON audit_reports(period_start, period_end);

-- Audit log verification table (for tamper detection)
CREATE TABLE IF NOT EXISTS audit_log_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_log_id UUID NOT NULL REFERENCES audit_logs(id),
  verified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_valid BOOLEAN NOT NULL,
  verification_hash VARCHAR(64),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for verification table
CREATE INDEX IF NOT EXISTS idx_audit_log_verification_audit_log_id ON audit_log_verification(audit_log_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_verification_verified_at ON audit_log_verification(verified_at DESC);

-- Security alerts table
CREATE TABLE IF NOT EXISTS security_alerts (
  id VARCHAR(255) PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  severity VARCHAR(20) NOT NULL, -- 'INFO', 'WARNING', 'ERROR', 'CRITICAL'
  alert_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  affected_users TEXT[], -- Array of user IDs
  affected_resources JSONB, -- Array of {type, id}
  recommended_actions TEXT[],
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for security alerts
CREATE INDEX IF NOT EXISTS idx_security_alerts_timestamp ON security_alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON security_alerts(resolved);

-- Create view for recent audit activity
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT
  id,
  correlation_id,
  timestamp,
  user_id,
  action,
  action_display_name,
  resource_type,
  resource_id,
  result_status,
  result_code,
  severity,
  ip_address,
  endpoint
FROM audit_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Create view for failed operations
CREATE OR REPLACE VIEW failed_operations AS
SELECT
  id,
  timestamp,
  user_id,
  action,
  resource_type,
  resource_id,
  result_message,
  severity,
  ip_address
FROM audit_logs
WHERE result_status = 'failure'
  AND timestamp > NOW() - INTERVAL '7 days'
ORDER BY timestamp DESC;

-- Create view for user activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
  user_id,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE result_status = 'success') as successful_events,
  COUNT(*) FILTER (WHERE result_status = 'failure') as failed_events,
  COUNT(DISTINCT resource_type) as resource_types_accessed,
  MAX(timestamp) as last_activity,
  ARRAY_AGG(DISTINCT action ORDER BY action) as actions_performed
FROM audit_logs
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY user_id;

-- Create view for resource access summary
CREATE OR REPLACE VIEW resource_access_summary AS
SELECT
  resource_type,
  resource_id,
  COUNT(*) as total_accesses,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) FILTER (WHERE result_status = 'failure') as failed_accesses,
  MAX(timestamp) as last_accessed,
  ARRAY_AGG(DISTINCT user_id ORDER BY user_id) as accessed_by_users
FROM audit_logs
WHERE timestamp > NOW() - INTERVAL '90 days'
  AND resource_type IS NOT NULL
  AND resource_id IS NOT NULL
GROUP BY resource_type, resource_id;

-- Grant permissions (adjust to your security model)
-- ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE retention_policies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_reports ENABLE ROW LEVEL SECURITY;

-- Insert default retention policies
INSERT INTO retention_policies
  (id, name, description, resource_type, retention_days, tier, compression, encryption, automatic_purge, delete_after_days, enabled)
VALUES
  ('default-security', 'Default Security Events', 'Standard 7-year retention for security-related events', 'SECURITY_EVENT', 2555, 'WARM', true, true, true, 2555, true),
  ('default-audit', 'Default Audit Logs', 'Standard 7-year retention for audit logs', 'AUDIT_LOG', 2555, 'WARM', true, true, true, 2555, true),
  ('default-access', 'Default Access Logs', 'Standard 90-day retention for access logs', 'ACCESS_LOG', 90, 'HOT', false, true, true, 90, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Comment on tables for documentation
-- ============================================================================
COMMENT ON TABLE audit_logs IS 'Comprehensive audit logs with encrypted data storage and correlation tracking';
COMMENT ON COLUMN audit_logs.correlation_id IS 'UUID for request tracing across distributed systems';
COMMENT ON COLUMN audit_logs.encrypted_data IS 'AES-256-GCM encrypted log entry data with IV, salt, and authTag';
COMMENT ON COLUMN audit_logs.checksum IS 'SHA-256 checksum for tamper detection';
COMMENT ON COLUMN audit_logs.tier IS 'Storage tier: HOT (recent), WARM (active), COLD (archive)';
COMMENT ON TABLE retention_policies IS 'Configurable retention policies for compliance (HIPAA, SOC 2, etc.)';
COMMENT ON TABLE security_alerts IS 'Generated security alerts from audit analysis and anomaly detection';
