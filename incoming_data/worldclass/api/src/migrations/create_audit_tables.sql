-- ============================================================================
-- Comprehensive Audit Logging Migration
-- Creates tables for structured audit logging, encryption, and retention
-- ============================================================================

-- Drop table to ensure clean slate and schema alignment
DROP TABLE IF EXISTS audit_log_verification CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Main audit logs table with comprehensive schema
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Core Identity & Scope
    tenant_id UUID,
    user_id UUID,
    
    -- Action Details
    action VARCHAR(255),
    action_display_name VARCHAR(255),
    method VARCHAR(20),
    endpoint VARCHAR(500),
    
    -- Resource Context
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    resource_name VARCHAR(500),
    resource_attributes JSONB,
    
    -- Result & Status
    result_status VARCHAR(20) DEFAULT 'success',
    result_code INTEGER,
    result_message TEXT,
    severity VARCHAR(20) DEFAULT 'INFO',
    
    -- Tracing & Security
    correlation_id UUID,
    session_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    
    -- Data & Retention
    encrypted_data JSONB DEFAULT '{}',
    checksum VARCHAR(64) DEFAULT '',
    tier VARCHAR(20) DEFAULT 'HOT',
    
    -- Timestamps
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archived_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(event_timestamp DESC);
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
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
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
CREATE INDEX IF NOT EXISTS idx_security_alerts_timestamp ON security_alerts(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON security_alerts(resolved);

-- Create view for recent audit activity
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT
  id,
  correlation_id,
  event_timestamp,
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
WHERE event_timestamp > NOW() - INTERVAL '24 hours'
ORDER BY event_timestamp DESC;

-- Create view for failed operations
CREATE OR REPLACE VIEW failed_operations AS
SELECT
  id,
  event_timestamp,
  user_id,
  action,
  resource_type,
  resource_id,
  result_message,
  severity,
  ip_address
FROM audit_logs
WHERE result_status = 'failure'
  AND event_timestamp > NOW() - INTERVAL '7 days'
ORDER BY event_timestamp DESC;

-- Create view for user activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT
  user_id,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE result_status = 'success') as successful_events,
  COUNT(*) FILTER (WHERE result_status = 'failure') as failed_events,
  COUNT(DISTINCT resource_type) as resource_types_accessed,
  MAX(event_timestamp) as last_activity,
  ARRAY_AGG(DISTINCT action ORDER BY action) as actions_performed
FROM audit_logs
WHERE event_timestamp > NOW() - INTERVAL '30 days'
GROUP BY user_id;

-- Create view for resource access summary
CREATE OR REPLACE VIEW resource_access_summary AS
SELECT
  resource_type,
  resource_id,
  COUNT(*) as total_accesses,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) FILTER (WHERE result_status = 'failure') as failed_accesses,
  MAX(event_timestamp) as last_accessed,
  ARRAY_AGG(DISTINCT user_id ORDER BY user_id) as accessed_by_users
FROM audit_logs
WHERE event_timestamp > NOW() - INTERVAL '90 days'
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
