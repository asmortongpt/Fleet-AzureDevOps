-- Migration 024: Sync Metadata and Error Tracking
-- Purpose: Support real-time message synchronization for Teams and Outlook
-- Features: Delta token storage, sync state tracking, error logging

-- Sync State Table
-- Tracks synchronization state for each resource (Teams channel, Outlook folder, etc.)
CREATE TABLE IF NOT EXISTS sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255) NOT NULL,
  last_sync_at TIMESTAMP NOT NULL,
  delta_token VARCHAR(500),
  sync_status VARCHAR(50) DEFAULT 'success',
  error_message TEXT,
  items_synced INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(resource_type, resource_id)
);

-- Sync Errors Table
-- Logs errors encountered during synchronization for analysis and retry
CREATE TABLE IF NOT EXISTS sync_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(255),
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sync_state_resource ON sync_state(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_sync_state_status ON sync_state(sync_status);
CREATE INDEX IF NOT EXISTS idx_sync_state_updated ON sync_state(updated_at);
CREATE INDEX IF NOT EXISTS idx_sync_errors_unresolved ON sync_errors(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_sync_errors_type ON sync_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_sync_errors_resource ON sync_errors(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_sync_errors_created ON sync_errors(created_at);

-- Webhook Subscriptions Table
-- Tracks active Microsoft Graph webhook subscriptions
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id VARCHAR(255) UNIQUE NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_path VARCHAR(500) NOT NULL,
  expiration_date TIMESTAMP NOT NULL,
  client_state VARCHAR(255),
  notification_url VARCHAR(500) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_notification_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_expiration ON webhook_subscriptions(expiration_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_resource ON webhook_subscriptions(resource_type, resource_path);

-- Sync Jobs Table
-- Tracks execution of sync jobs for monitoring
CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  resources_processed INTEGER DEFAULT 0,
  items_synced INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  metadata JSONB,
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_type ON sync_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_started ON sync_jobs(started_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sync_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS sync_state_updated_at ON sync_state;
CREATE TRIGGER sync_state_updated_at
  BEFORE UPDATE ON sync_state
  FOR EACH ROW
  EXECUTE FUNCTION update_sync_state_timestamp();

DROP TRIGGER IF EXISTS webhook_subscriptions_updated_at ON webhook_subscriptions;
CREATE TRIGGER webhook_subscriptions_updated_at
  BEFORE UPDATE ON webhook_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_sync_state_timestamp();

-- Comments for documentation
COMMENT ON TABLE sync_state IS 'Tracks synchronization state for Teams channels and Outlook folders';
COMMENT ON TABLE sync_errors IS 'Logs synchronization errors for debugging and retry logic';
COMMENT ON TABLE webhook_subscriptions IS 'Active Microsoft Graph webhook subscriptions';
COMMENT ON TABLE sync_jobs IS 'Historical record of sync job executions';

COMMENT ON COLUMN sync_state.delta_token IS 'Microsoft Graph delta token for incremental sync';
COMMENT ON COLUMN sync_state.resource_type IS 'Type: teams_channel, outlook_folder, etc.';
COMMENT ON COLUMN sync_state.sync_status IS 'Status: success, failed, in_progress, skipped';

COMMENT ON COLUMN webhook_subscriptions.client_state IS 'Secret value for webhook validation';
COMMENT ON COLUMN webhook_subscriptions.subscription_id IS 'Microsoft Graph subscription ID';
