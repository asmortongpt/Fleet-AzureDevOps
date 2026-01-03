-- AI Assistant Backend Services Database Schema
-- Creates tables for AI requests, OCR results, usage tracking, and audit logs

-- AI Requests Queue Table
CREATE TABLE IF NOT EXISTS ai_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL,
  prompt TEXT NOT NULL,
  context JSONB DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  parameters JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'queued',
  priority INTEGER NOT NULL DEFAULT 5,
  queue_position INTEGER,
  tokens_used INTEGER DEFAULT 0,
  cost DECIMAL(10, 4) DEFAULT 0,
  response TEXT,
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  CONSTRAINT valid_status CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  CONSTRAINT valid_priority CHECK (priority BETWEEN 1 AND 10)
);

CREATE INDEX idx_ai_requests_tenant_user ON ai_requests(tenant_id, user_id);
CREATE INDEX idx_ai_requests_status ON ai_requests(status);
CREATE INDEX idx_ai_requests_created_at ON ai_requests(created_at DESC);
CREATE INDEX idx_ai_requests_priority ON ai_requests(priority DESC, created_at ASC);

-- OCR Results Table
CREATE TABLE IF NOT EXISTS ocr_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  text TEXT NOT NULL,
  confidence DECIMAL(5, 4),
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  lines_count INTEGER,
  processing_time_ms INTEGER,
  blob_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ocr_results_tenant ON ocr_results(tenant_id);
CREATE INDEX idx_ocr_results_created_at ON ocr_results(created_at DESC);

-- AI Usage Logs Table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  cost DECIMAL(10, 4) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_tenant_user ON ai_usage_logs(tenant_id, user_id);
CREATE INDEX idx_ai_usage_created_at ON ai_usage_logs(created_at DESC);

-- AI Audit Logs Table
CREATE TABLE IF NOT EXISTS ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_audit_tenant ON ai_audit_logs(tenant_id);
CREATE INDEX idx_ai_audit_user ON ai_audit_logs(user_id);
CREATE INDEX idx_ai_audit_created_at ON ai_audit_logs(created_at DESC);
CREATE INDEX idx_ai_audit_action ON ai_audit_logs(action);

-- AI Validation Failures Table
CREATE TABLE IF NOT EXISTS ai_validation_failures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason VARCHAR(255) NOT NULL,
  prompt_preview TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_validation_failures_tenant ON ai_validation_failures(tenant_id);
CREATE INDEX idx_ai_validation_failures_created_at ON ai_validation_failures(created_at DESC);

-- Add subscription_tier to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'free';
  END IF;
END $$;

-- Create user permissions table if not exists
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  permission_name VARCHAR(100) NOT NULL,
  is_granted BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tenant_id, permission_name)
);

CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_tenant ON user_permissions(tenant_id);
CREATE INDEX idx_user_permissions_name ON user_permissions(permission_name);

-- Insert default AI permissions for existing users
INSERT INTO user_permissions (user_id, tenant_id, permission_name, is_granted)
SELECT u.id, u.tenant_id, 'ai:chat', true
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_permissions up
  WHERE up.user_id = u.id AND up.permission_name = 'ai:chat'
)
ON CONFLICT (user_id, tenant_id, permission_name) DO NOTHING;

-- Create function to automatically update queue position
CREATE OR REPLACE FUNCTION update_ai_request_queue_position()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'queued' THEN
    NEW.queue_position := (
      SELECT COUNT(*) + 1
      FROM ai_requests
      WHERE status = 'queued'
        AND priority >= NEW.priority
        AND created_at < NEW.created_at
    );
  ELSIF NEW.status IN ('processing', 'completed', 'failed', 'cancelled') THEN
    NEW.queue_position := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for queue position updates
DROP TRIGGER IF EXISTS trg_update_ai_request_queue_position ON ai_requests;
CREATE TRIGGER trg_update_ai_request_queue_position
  BEFORE INSERT OR UPDATE ON ai_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_request_queue_position();

-- Create views for analytics
CREATE OR REPLACE VIEW ai_usage_summary AS
SELECT
  tenant_id,
  user_id,
  DATE(created_at) as usage_date,
  COUNT(*) as request_count,
  SUM(tokens_used) as total_tokens,
  SUM(cost) as total_cost,
  AVG(tokens_used) as avg_tokens_per_request
FROM ai_usage_logs
GROUP BY tenant_id, user_id, DATE(created_at);

CREATE OR REPLACE VIEW ai_request_stats AS
SELECT
  tenant_id,
  request_type,
  status,
  COUNT(*) as request_count,
  AVG(tokens_used) as avg_tokens,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_processing_seconds,
  MAX(created_at) as last_request_at
FROM ai_requests
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY tenant_id, request_type, status;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_requests TO fleet_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ocr_results TO fleet_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_usage_logs TO fleet_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_audit_logs TO fleet_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_validation_failures TO fleet_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_permissions TO fleet_api;
GRANT SELECT ON ai_usage_summary TO fleet_api;
GRANT SELECT ON ai_request_stats TO fleet_api;

COMMENT ON TABLE ai_requests IS 'AI processing request queue with status tracking';
COMMENT ON TABLE ocr_results IS 'OCR processing results from Azure Computer Vision';
COMMENT ON TABLE ai_usage_logs IS 'AI usage tracking for rate limiting and billing';
COMMENT ON TABLE ai_audit_logs IS 'Audit trail for all AI operations';
COMMENT ON TABLE ai_validation_failures IS 'Log of failed validation attempts for security monitoring';
