-- Job Queue System Migration
-- pg-boss creates its own tables automatically, this migration adds custom tracking and indexes

-- Custom job tracking table for enhanced monitoring and analytics
CREATE TABLE IF NOT EXISTS job_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR(255) UNIQUE NOT NULL,
    queue_name VARCHAR(100) NOT NULL,
    job_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority INTEGER DEFAULT 5,
    payload JSONB,
    result JSONB,
    error TEXT,
    stack_trace TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 5,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_status CHECK (status IN ('pending', 'active', 'completed', 'failed', 'cancelled', 'dead-letter'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_tracking_status ON job_tracking(status);
CREATE INDEX IF NOT EXISTS idx_job_tracking_queue ON job_tracking(queue_name);
CREATE INDEX IF NOT EXISTS idx_job_tracking_job_type ON job_tracking(job_type);
CREATE INDEX IF NOT EXISTS idx_job_tracking_failed ON job_tracking(failed_at) WHERE failed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_tracking_created ON job_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_tracking_priority ON job_tracking(priority, created_at);

-- Queue statistics table for monitoring
CREATE TABLE IF NOT EXISTS queue_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_name VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    jobs_pending INTEGER DEFAULT 0,
    jobs_active INTEGER DEFAULT 0,
    jobs_completed INTEGER DEFAULT 0,
    jobs_failed INTEGER DEFAULT 0,
    avg_processing_time_ms NUMERIC(10, 2),
    jobs_per_minute NUMERIC(10, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_queue_stats_name_time ON queue_statistics(queue_name, timestamp DESC);

-- Dead letter queue table for failed jobs requiring manual intervention
CREATE TABLE IF NOT EXISTS dead_letter_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id VARCHAR(255) NOT NULL,
    queue_name VARCHAR(100) NOT NULL,
    job_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    error TEXT,
    stack_trace TEXT,
    retry_count INTEGER NOT NULL,
    original_created_at TIMESTAMP,
    moved_to_dlq_at TIMESTAMP DEFAULT NOW(),
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    resolution_notes TEXT,
    retry_attempted BOOLEAN DEFAULT FALSE,
    retry_attempted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dlq_queue_name ON dead_letter_queue(queue_name);
CREATE INDEX IF NOT EXISTS idx_dlq_reviewed ON dead_letter_queue(reviewed) WHERE reviewed = FALSE;
CREATE INDEX IF NOT EXISTS idx_dlq_created ON dead_letter_queue(created_at DESC);

-- Rate limiting tracking table
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    request_count INTEGER DEFAULT 0,
    limit_value INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(service_name, endpoint, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_service_window ON rate_limit_tracking(service_name, window_start);

-- Scheduled jobs table for future execution
CREATE TABLE IF NOT EXISTS scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(255) NOT NULL,
    queue_name VARCHAR(100) NOT NULL,
    cron_expression VARCHAR(100),
    payload JSONB,
    next_run_at TIMESTAMP NOT NULL,
    last_run_at TIMESTAMP,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_next_run ON scheduled_jobs(next_run_at) WHERE enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_scheduled_queue ON scheduled_jobs(queue_name);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_job_tracking_updated_at BEFORE UPDATE ON job_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_jobs_updated_at BEFORE UPDATE ON scheduled_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Queue alerts table for monitoring
CREATE TABLE IF NOT EXISTS queue_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(20) NOT NULL,
    queue_name VARCHAR(100),
    message TEXT NOT NULL,
    metric VARCHAR(100),
    current_value NUMERIC(10, 2),
    threshold NUMERIC(10, 2),
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by VARCHAR(255),
    acknowledged_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_alert_level CHECK (level IN ('info', 'warning', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_queue_alerts_level ON queue_alerts(level);
CREATE INDEX IF NOT EXISTS idx_queue_alerts_created ON queue_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_queue_alerts_unack ON queue_alerts(acknowledged) WHERE acknowledged = FALSE;

-- Webhook events table
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id VARCHAR(255) UNIQUE NOT NULL,
    source VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_source ON webhook_events(source);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed) WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at DESC);

-- Sync history table
CREATE TABLE IF NOT EXISTS sync_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type VARCHAR(50) NOT NULL,
    user_id VARCHAR(255),
    team_id VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    delta_token TEXT,
    items_synced INTEGER DEFAULT 0,
    error TEXT,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_sync_status CHECK (status IN ('pending', 'running', 'completed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_sync_history_resource ON sync_history(resource_type);
CREATE INDEX IF NOT EXISTS idx_sync_history_user ON sync_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_history_status ON sync_history(status);
CREATE INDEX IF NOT EXISTS idx_sync_history_created ON sync_history(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE job_tracking IS 'Tracks all jobs processed through the queue system';
COMMENT ON TABLE queue_statistics IS 'Stores queue performance metrics over time';
COMMENT ON TABLE dead_letter_queue IS 'Stores failed jobs that require manual intervention';
COMMENT ON TABLE rate_limit_tracking IS 'Tracks API rate limiting to prevent throttling';
COMMENT ON TABLE scheduled_jobs IS 'Manages scheduled and recurring jobs';
COMMENT ON TABLE queue_alerts IS 'Stores queue monitoring alerts';
COMMENT ON TABLE webhook_events IS 'Stores incoming webhook notifications';
COMMENT ON TABLE sync_history IS 'Tracks synchronization operations';
