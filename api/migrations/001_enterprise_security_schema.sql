-- ============================================================================
-- Fleet Management - Enterprise Security Schema Migration
-- ============================================================================
-- Version: 1.0.0
-- Date: 2026-01-05
-- Description: Add enterprise-grade security tables for configuration management,
--              audit logging, secrets management, and access control
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CONFIGURATION MANAGEMENT TABLES
-- ============================================================================

-- Configuration settings with encryption support
CREATE TABLE IF NOT EXISTS configuration_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT,
  encrypted_value TEXT, -- For sensitive values (encrypted with AES-256)
  value_type VARCHAR(50) NOT NULL DEFAULT 'string', -- string, number, boolean, json
  is_encrypted BOOLEAN DEFAULT false,
  category VARCHAR(100) NOT NULL, -- organization, modules, business-rules, integrations, etc.
  section VARCHAR(100) NOT NULL,
  description TEXT,
  requires_approval BOOLEAN DEFAULT false,
  validation_rules JSONB, -- JSON schema for validation
  last_modified_by VARCHAR(255) NOT NULL,
  last_modified_at TIMESTAMP DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  impact VARCHAR(20) DEFAULT 'low', -- low, medium, high
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_value_type CHECK (value_type IN ('string', 'number', 'boolean', 'json', 'select', 'multiselect', 'color', 'file')),
  CONSTRAINT valid_impact CHECK (impact IN ('low', 'medium', 'high')),
  CONSTRAINT value_or_encrypted CHECK (
    (is_encrypted = true AND encrypted_value IS NOT NULL AND value IS NULL) OR
    (is_encrypted = false AND value IS NOT NULL AND encrypted_value IS NULL)
  )
);

CREATE INDEX idx_config_key ON configuration_settings(key);
CREATE INDEX idx_config_category ON configuration_settings(category);
CREATE INDEX idx_config_section ON configuration_settings(category, section);
CREATE INDEX idx_config_active ON configuration_settings(is_active);
CREATE INDEX idx_config_requires_approval ON configuration_settings(requires_approval) WHERE requires_approval = true;

COMMENT ON TABLE configuration_settings IS 'Server-side configuration storage with encryption support for sensitive values';
COMMENT ON COLUMN configuration_settings.encrypted_value IS 'AES-256 encrypted value, decrypted only by authorized services';
COMMENT ON COLUMN configuration_settings.validation_rules IS 'JSON schema defining valid values, ranges, patterns';

-- Configuration version history (immutable audit trail)
CREATE TABLE IF NOT EXISTS configuration_versions (
  id SERIAL PRIMARY KEY,
  configuration_id INTEGER NOT NULL REFERENCES configuration_settings(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  value TEXT,
  encrypted_value TEXT,
  changed_by VARCHAR(255) NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  change_description TEXT,

  CONSTRAINT unique_config_version UNIQUE (configuration_id, version)
);

CREATE INDEX idx_config_version ON configuration_versions(configuration_id, version);
CREATE INDEX idx_config_version_changed_at ON configuration_versions(changed_at DESC);
CREATE INDEX idx_config_version_changed_by ON configuration_versions(changed_by);

COMMENT ON TABLE configuration_versions IS 'Immutable version history for configuration changes, enabling rollback';

-- Configuration approval workflow
CREATE TABLE IF NOT EXISTS configuration_approvals (
  id SERIAL PRIMARY KEY,
  configuration_id INTEGER NOT NULL REFERENCES configuration_settings(id) ON DELETE CASCADE,
  requested_value TEXT NOT NULL,
  encrypted_requested_value TEXT, -- If the value needs to be encrypted
  requested_by VARCHAR(255) NOT NULL,
  requested_by_role VARCHAR(50) NOT NULL,
  requested_at TIMESTAMP DEFAULT NOW(),
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approved_by VARCHAR(255),
  approved_by_role VARCHAR(50),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  approval_notes TEXT,
  ip_address INET,

  CONSTRAINT valid_approval_status CHECK (approval_status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

CREATE INDEX idx_approval_status ON configuration_approvals(approval_status);
CREATE INDEX idx_approval_requested_by ON configuration_approvals(requested_by);
CREATE INDEX idx_approval_config ON configuration_approvals(configuration_id);
CREATE INDEX idx_approval_pending ON configuration_approvals(approval_status, requested_at) WHERE approval_status = 'pending';

COMMENT ON TABLE configuration_approvals IS 'Approval workflow for high-impact configuration changes';

-- ============================================================================
-- 2. AUTHENTICATION & SESSION MANAGEMENT
-- ============================================================================

-- Multi-factor authentication tokens
CREATE TABLE IF NOT EXISTS mfa_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  secret_key_encrypted TEXT NOT NULL, -- TOTP secret encrypted with master key
  backup_codes_encrypted TEXT, -- Encrypted JSON array of backup codes
  is_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,

  CONSTRAINT unique_mfa_user UNIQUE (user_id)
);

CREATE INDEX idx_mfa_user ON mfa_tokens(user_id);
CREATE INDEX idx_mfa_enabled ON mfa_tokens(is_enabled) WHERE is_enabled = true;

COMMENT ON TABLE mfa_tokens IS 'TOTP-based multi-factor authentication for privileged users';
COMMENT ON COLUMN mfa_tokens.secret_key_encrypted IS 'Base32 TOTP secret encrypted with AES-256';

-- JWT session tokens (for revocation and tracking)
CREATE TABLE IF NOT EXISTS session_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_jti VARCHAR(255) NOT NULL UNIQUE, -- JWT ID for revocation
  refresh_token_hash VARCHAR(255) NOT NULL UNIQUE, -- SHA-256 hash of refresh token
  issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  last_activity_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  is_revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMP,
  revoked_reason TEXT,
  revoked_by VARCHAR(255),

  CONSTRAINT valid_expiration CHECK (expires_at > issued_at)
);

CREATE INDEX idx_session_user ON session_tokens(user_id);
CREATE INDEX idx_session_jti ON session_tokens(token_jti);
CREATE INDEX idx_session_expires ON session_tokens(expires_at) WHERE is_revoked = false;
CREATE INDEX idx_session_active ON session_tokens(user_id, is_revoked) WHERE is_revoked = false;

COMMENT ON TABLE session_tokens IS 'JWT session tracking for revocation and activity monitoring';

-- Revoked tokens list (for immediate logout)
CREATE TABLE IF NOT EXISTS revoked_tokens (
  id SERIAL PRIMARY KEY,
  token_jti VARCHAR(255) NOT NULL UNIQUE,
  revoked_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL, -- When token would have expired naturally
  revoked_by VARCHAR(255),
  revocation_reason TEXT,

  CONSTRAINT valid_revoked_expiration CHECK (expires_at > revoked_at)
);

CREATE INDEX idx_revoked_jti ON revoked_tokens(token_jti);
CREATE INDEX idx_revoked_expires ON revoked_tokens(expires_at);
CREATE INDEX idx_revoked_cleanup ON revoked_tokens(expires_at) WHERE expires_at < NOW();

COMMENT ON TABLE revoked_tokens IS 'Revoked JWT tokens for immediate session termination';

-- ============================================================================
-- 3. SECRETS MANAGEMENT
-- ============================================================================

-- API keys storage (encrypted, linked to Azure Key Vault)
CREATE TABLE IF NOT EXISTS api_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(255) NOT NULL UNIQUE,
  encrypted_key TEXT NOT NULL, -- Encrypted API key
  key_type VARCHAR(100) NOT NULL, -- google-maps, openai, anthropic, etc.
  azure_keyvault_secret_name VARCHAR(255), -- Reference to Azure Key Vault
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_rotated_at TIMESTAMP,
  next_rotation_date TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  rotation_policy_days INTEGER DEFAULT 90,
  last_accessed_at TIMESTAMP,
  access_count INTEGER DEFAULT 0,

  CONSTRAINT valid_key_type CHECK (key_type IN ('google-maps', 'openai', 'anthropic', 'twilio', 'sendgrid', 'azure', 'other'))
);

CREATE INDEX idx_apikey_name ON api_keys(key_name);
CREATE INDEX idx_apikey_type ON api_keys(key_type);
CREATE INDEX idx_apikey_active ON api_keys(is_active) WHERE is_active = true;
CREATE INDEX idx_apikey_rotation ON api_keys(next_rotation_date) WHERE is_active = true AND next_rotation_date IS NOT NULL;

COMMENT ON TABLE api_keys IS 'Encrypted API credentials with rotation tracking';
COMMENT ON COLUMN api_keys.azure_keyvault_secret_name IS 'Reference to Azure Key Vault secret for additional security';

-- Encryption keys metadata (actual keys in Azure Key Vault)
CREATE TABLE IF NOT EXISTS encryption_keys (
  id SERIAL PRIMARY KEY,
  key_name VARCHAR(255) NOT NULL UNIQUE,
  key_version INTEGER NOT NULL DEFAULT 1,
  azure_key_vault_id VARCHAR(500) NOT NULL, -- Azure Key Vault key identifier
  algorithm VARCHAR(50) NOT NULL DEFAULT 'AES-256-GCM',
  purpose VARCHAR(100) NOT NULL, -- data-encryption, token-signing, backup-encryption
  created_at TIMESTAMP DEFAULT NOW(),
  rotated_at TIMESTAMP,
  next_rotation_date TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  previous_key_version INTEGER,

  CONSTRAINT valid_algorithm CHECK (algorithm IN ('AES-256-GCM', 'RSA-2048', 'RSA-4096', 'ECDSA-P256')),
  CONSTRAINT valid_purpose CHECK (purpose IN ('data-encryption', 'token-signing', 'backup-encryption', 'database-encryption'))
);

CREATE INDEX idx_encryption_key_name ON encryption_keys(key_name);
CREATE INDEX idx_encryption_active ON encryption_keys(is_active) WHERE is_active = true;
CREATE INDEX idx_encryption_rotation ON encryption_keys(next_rotation_date) WHERE is_active = true;

COMMENT ON TABLE encryption_keys IS 'Metadata for encryption keys stored in Azure Key Vault';

-- ============================================================================
-- 4. COMPREHENSIVE AUDIT LOGGING
-- ============================================================================

-- Main audit log table (partitioned by month)
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL,
  event_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100) NOT NULL,
  resource_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  request_method VARCHAR(10),
  request_path TEXT,
  request_body JSONB, -- Sensitive data redacted
  response_status INTEGER,
  execution_time_ms INTEGER,
  metadata JSONB,
  severity VARCHAR(20) DEFAULT 'info',
  correlation_id VARCHAR(255), -- For distributed tracing

  PRIMARY KEY (id, event_timestamp),

  CONSTRAINT valid_severity CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
  CONSTRAINT valid_response_status CHECK (response_status >= 100 AND response_status < 600)
) PARTITION BY RANGE (event_timestamp);

-- Create initial partitions (monthly)
CREATE TABLE audit_logs_2026_01 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE audit_logs_2026_02 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE audit_logs_2026_03 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- Indexes on partitioned table
CREATE INDEX idx_audit_timestamp ON audit_logs(event_timestamp DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_severity ON audit_logs(severity) WHERE severity IN ('error', 'critical');
CREATE INDEX idx_audit_correlation ON audit_logs(correlation_id) WHERE correlation_id IS NOT NULL;

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all system operations, partitioned by month';
COMMENT ON COLUMN audit_logs.correlation_id IS 'Distributed tracing ID for following requests across services';

-- Audit log daily digests (for compliance and tamper detection)
CREATE TABLE IF NOT EXISTS audit_log_digests (
  id SERIAL PRIMARY KEY,
  digest_date DATE NOT NULL UNIQUE,
  total_events BIGINT NOT NULL,
  critical_events INTEGER NOT NULL,
  error_events INTEGER NOT NULL,
  warning_events INTEGER NOT NULL,
  unique_users INTEGER NOT NULL,
  unique_actions INTEGER NOT NULL,
  digest_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of all events for tamper detection
  previous_digest_hash VARCHAR(64), -- Chain of hashes (blockchain-style)
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_event_counts CHECK (
    total_events >= 0 AND
    critical_events >= 0 AND
    error_events >= 0 AND
    warning_events >= 0
  )
);

CREATE INDEX idx_digest_date ON audit_log_digests(digest_date DESC);

COMMENT ON TABLE audit_log_digests IS 'Daily audit log summaries with cryptographic hashes for tamper detection';
COMMENT ON COLUMN audit_log_digests.digest_hash IS 'SHA-256 hash of all events on this date for integrity verification';

-- Security events (subset of audit log for SOC/SIEM)
CREATE TABLE IF NOT EXISTS security_events (
  id BIGSERIAL PRIMARY KEY,
  event_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  user_id VARCHAR(255),
  ip_address INET,
  details JSONB NOT NULL,
  investigated BOOLEAN DEFAULT false,
  investigated_by VARCHAR(255),
  investigated_at TIMESTAMP,
  resolution_status VARCHAR(50),
  resolution_notes TEXT,
  false_positive BOOLEAN DEFAULT false,

  CONSTRAINT valid_security_event_type CHECK (event_type IN (
    'failed-login', 'unauthorized-access', 'suspicious-activity',
    'policy-violation', 'data-breach-attempt', 'privilege-escalation',
    'brute-force-detected', 'sql-injection-attempt', 'xss-attempt',
    'unusual-data-access', 'after-hours-access', 'geo-anomaly'
  )),
  CONSTRAINT valid_security_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_resolution_status CHECK (resolution_status IN (
    'new', 'investigating', 'resolved', 'dismissed', 'escalated', NULL
  ))
);

CREATE INDEX idx_security_timestamp ON security_events(event_timestamp DESC);
CREATE INDEX idx_security_type ON security_events(event_type);
CREATE INDEX idx_security_severity ON security_events(severity);
CREATE INDEX idx_security_investigated ON security_events(investigated) WHERE investigated = false;
CREATE INDEX idx_security_user ON security_events(user_id);
CREATE INDEX idx_security_ip ON security_events(ip_address);

COMMENT ON TABLE security_events IS 'Security incidents and suspicious activities for SOC monitoring';

-- ============================================================================
-- 5. RATE LIMITING & THROTTLING
-- ============================================================================

-- Rate limit tracking (could also use Redis in production)
CREATE TABLE IF NOT EXISTS rate_limits (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  ip_address INET,
  endpoint VARCHAR(255) NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  blocked BOOLEAN DEFAULT false,
  blocked_at TIMESTAMP,

  CONSTRAINT valid_window CHECK (window_end > window_start),
  CONSTRAINT unique_rate_limit_entry UNIQUE (user_id, ip_address, endpoint, window_start)
);

CREATE INDEX idx_ratelimit_user ON rate_limits(user_id, window_start);
CREATE INDEX idx_ratelimit_ip ON rate_limits(ip_address, window_start);
CREATE INDEX idx_ratelimit_endpoint ON rate_limits(endpoint, window_start);
CREATE INDEX idx_ratelimit_blocked ON rate_limits(blocked) WHERE blocked = true;
CREATE INDEX idx_ratelimit_cleanup ON rate_limits(window_end) WHERE window_end < NOW();

COMMENT ON TABLE rate_limits IS 'Rate limiting tracking per user/IP/endpoint (consider Redis for production)';

-- Blocked entities (IPs, users, API keys)
CREATE TABLE IF NOT EXISTS blocked_entities (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(20) NOT NULL,
  entity_value VARCHAR(255) NOT NULL,
  reason TEXT NOT NULL,
  blocked_by VARCHAR(255) NOT NULL,
  blocked_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_permanent BOOLEAN DEFAULT false,
  unblocked_at TIMESTAMP,
  unblocked_by VARCHAR(255),
  unblock_reason TEXT,

  CONSTRAINT valid_entity_type CHECK (entity_type IN ('ip', 'user', 'api-key', 'session')),
  CONSTRAINT unique_blocked_entity UNIQUE (entity_type, entity_value)
);

CREATE INDEX idx_blocked_entity ON blocked_entities(entity_type, entity_value);
CREATE INDEX idx_blocked_expires ON blocked_entities(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_blocked_active ON blocked_entities(entity_type, entity_value, unblocked_at) WHERE unblocked_at IS NULL;

COMMENT ON TABLE blocked_entities IS 'Temporarily or permanently blocked IPs, users, or API keys';

-- ============================================================================
-- 6. DATA GOVERNANCE & COMPLIANCE
-- ============================================================================

-- Data classification (for GDPR, privacy compliance)
CREATE TABLE IF NOT EXISTS data_classifications (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(255) NOT NULL,
  column_name VARCHAR(255) NOT NULL,
  classification VARCHAR(50) NOT NULL,
  contains_pii BOOLEAN DEFAULT false,
  retention_period_days INTEGER,
  encryption_required BOOLEAN DEFAULT false,
  access_restricted BOOLEAN DEFAULT false,
  allowed_roles TEXT[], -- Array of roles allowed to access
  notes TEXT,

  CONSTRAINT valid_classification CHECK (classification IN (
    'public', 'internal', 'confidential', 'restricted', 'highly-restricted'
  )),
  CONSTRAINT unique_data_classification UNIQUE (table_name, column_name)
);

CREATE INDEX idx_data_class_table ON data_classifications(table_name);
CREATE INDEX idx_data_class_pii ON data_classifications(contains_pii) WHERE contains_pii = true;
CREATE INDEX idx_data_class_classification ON data_classifications(classification);

COMMENT ON TABLE data_classifications IS 'Data classification and governance metadata for compliance';

-- Data access log (who accessed what sensitive data)
CREATE TABLE IF NOT EXISTS data_access_logs (
  id BIGSERIAL PRIMARY KEY,
  accessed_at TIMESTAMP DEFAULT NOW(),
  user_id VARCHAR(255) NOT NULL,
  table_name VARCHAR(255) NOT NULL,
  record_id VARCHAR(255),
  column_accessed VARCHAR(255),
  access_type VARCHAR(50) NOT NULL, -- read, update, delete, export
  access_purpose TEXT, -- Why was this data accessed?
  ip_address INET,
  application VARCHAR(100),

  CONSTRAINT valid_access_type CHECK (access_type IN ('read', 'update', 'delete', 'export', 'print'))
);

CREATE INDEX idx_data_access_timestamp ON data_access_logs(accessed_at DESC);
CREATE INDEX idx_data_access_user ON data_access_logs(user_id);
CREATE INDEX idx_data_access_table ON data_access_logs(table_name);
CREATE INDEX idx_data_access_type ON data_access_logs(access_type);

COMMENT ON TABLE data_access_logs IS 'Audit trail for accessing sensitive/PII data';

-- ============================================================================
-- 7. POLICY ENFORCEMENT ENHANCEMENTS
-- ============================================================================

-- Add missing columns to existing policies table
ALTER TABLE policies ADD COLUMN IF NOT EXISTS requires_mfa_for_execution BOOLEAN DEFAULT false;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS execution_rate_limit INTEGER; -- Max executions per hour
ALTER TABLE policies ADD COLUMN IF NOT EXISTS last_execution_at TIMESTAMP;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS server_side_enforcement BOOLEAN DEFAULT true;

CREATE INDEX idx_policies_server_enforcement ON policies(server_side_enforcement) WHERE server_side_enforcement = true;

COMMENT ON COLUMN policies.server_side_enforcement IS 'If true, policy is enforced server-side (cannot be bypassed)';

-- ============================================================================
-- 8. HELPER FUNCTIONS
-- ============================================================================

-- Function to create new audit log partition
CREATE OR REPLACE FUNCTION create_audit_log_partition(partition_date DATE)
RETURNS VOID AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  start_date := DATE_TRUNC('month', partition_date);
  end_date := start_date + INTERVAL '1 month';
  partition_name := 'audit_logs_' || TO_CHAR(start_date, 'YYYY_MM');

  EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date);

  RAISE NOTICE 'Created partition: %', partition_name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_audit_log_partition IS 'Automatically create monthly partition for audit_logs';

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM session_tokens
  WHERE expires_at < NOW() AND is_revoked = false;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM revoked_tokens WHERE expires_at < NOW();

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_sessions IS 'Clean up expired sessions and revoked tokens';

-- Function to generate daily audit digest
CREATE OR REPLACE FUNCTION generate_audit_digest(digest_date DATE)
RETURNS VOID AS $$
DECLARE
  event_stats RECORD;
  log_hash TEXT;
  prev_hash TEXT;
BEGIN
  -- Get statistics
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical,
    COUNT(*) FILTER (WHERE severity = 'error') as errors,
    COUNT(*) FILTER (WHERE severity = 'warning') as warnings,
    COUNT(DISTINCT user_id) as users,
    COUNT(DISTINCT action) as actions
  INTO event_stats
  FROM audit_logs
  WHERE DATE(event_timestamp) = digest_date;

  -- Generate hash of all events for tamper detection
  SELECT MD5(string_agg(id::text || action || event_timestamp::text, '' ORDER BY id))
  INTO log_hash
  FROM audit_logs
  WHERE DATE(event_timestamp) = digest_date;

  -- Get previous digest hash for chaining
  SELECT digest_hash INTO prev_hash
  FROM audit_log_digests
  WHERE digest_date = digest_date - INTERVAL '1 day';

  -- Insert or update digest
  INSERT INTO audit_log_digests (
    digest_date, total_events, critical_events, error_events,
    warning_events, unique_users, unique_actions, digest_hash, previous_digest_hash
  )
  VALUES (
    digest_date, event_stats.total, event_stats.critical, event_stats.errors,
    event_stats.warnings, event_stats.users, event_stats.actions, log_hash, prev_hash
  )
  ON CONFLICT (digest_date) DO UPDATE SET
    total_events = EXCLUDED.total_events,
    critical_events = EXCLUDED.critical_events,
    error_events = EXCLUDED.error_events,
    warning_events = EXCLUDED.warning_events,
    unique_users = EXCLUDED.unique_users,
    unique_actions = EXCLUDED.unique_actions,
    digest_hash = EXCLUDED.digest_hash,
    previous_digest_hash = EXCLUDED.previous_digest_hash;

  RAISE NOTICE 'Generated audit digest for %: % total events', digest_date, event_stats.total;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_audit_digest IS 'Generate daily audit digest with cryptographic hash chain';

-- ============================================================================
-- 9. SCHEDULED JOBS (PostgreSQL pg_cron extension required)
-- ============================================================================

-- Note: Requires pg_cron extension
-- SELECT cron.schedule('cleanup-sessions', '0 2 * * *', $$ SELECT cleanup_expired_sessions() $$);
-- SELECT cron.schedule('generate-digest', '0 1 * * *', $$ SELECT generate_audit_digest(CURRENT_DATE - INTERVAL '1 day') $$);
-- SELECT cron.schedule('create-partition', '0 0 1 * *', $$ SELECT create_audit_log_partition(CURRENT_DATE + INTERVAL '2 months') $$);

-- ============================================================================
-- 10. INITIAL DATA
-- ============================================================================

-- Insert default configuration settings
INSERT INTO configuration_settings (key, value, value_type, category, section, description, requires_approval, impact, last_modified_by)
VALUES
  -- Organization
  ('organization.name', 'Fleet Management System', 'string', 'organization', 'org-identity', 'Organization name', false, 'high', 'system'),
  ('organization.type', 'municipal', 'select', 'organization', 'org-identity', 'Organization type', false, 'high', 'system'),

  -- Security
  ('security.authentication.requireMFA', 'false', 'boolean', 'security', 'authentication', 'Require multi-factor authentication', true, 'high', 'system'),
  ('security.authentication.sessionTimeoutMinutes', '60', 'number', 'security', 'authentication', 'Session timeout in minutes', false, 'medium', 'system'),
  ('security.authentication.passwordExpiryDays', '90', 'number', 'security', 'authentication', 'Password expiry days', false, 'medium', 'system'),
  ('security.audit.retentionDays', '2555', 'number', 'security', 'audit-logging', 'Audit log retention (7 years)', true, 'high', 'system'),
  ('security.audit.logPolicyEnforcement', 'true', 'boolean', 'security', 'audit-logging', 'Log policy enforcement decisions', false, 'low', 'system'),

  -- Modules
  ('modules.policyHub.enabled', 'true', 'boolean', 'modules', 'enabled-hubs', 'Enable Policy Hub', false, 'high', 'system'),
  ('modules.fleetHub.enabled', 'true', 'boolean', 'modules', 'enabled-hubs', 'Enable Fleet Hub', false, 'high', 'system')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration
SELECT 'Enterprise Security Schema Migration Complete' as status,
       COUNT(*) as new_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'configuration_settings', 'configuration_versions', 'configuration_approvals',
    'mfa_tokens', 'session_tokens', 'revoked_tokens',
    'api_keys', 'encryption_keys',
    'audit_logs', 'audit_log_digests', 'security_events',
    'rate_limits', 'blocked_entities',
    'data_classifications', 'data_access_logs'
  );
