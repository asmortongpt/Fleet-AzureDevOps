-- Webhook Infrastructure for Microsoft Graph Notifications
-- Migration: 023_webhook_subscriptions.sql
-- Supports Teams and Outlook webhook notifications

-- Webhook subscriptions table for tracking active Microsoft Graph subscriptions
CREATE TABLE webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id VARCHAR(255) UNIQUE NOT NULL,
    resource VARCHAR(500) NOT NULL,
    change_type VARCHAR(100) NOT NULL,
    notification_url TEXT NOT NULL,
    expiration_date_time TIMESTAMP NOT NULL,
    client_state VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'failed', 'deleted')),
    subscription_type VARCHAR(50) NOT NULL CHECK (subscription_type IN ('teams_messages', 'outlook_emails', 'calendar_events')),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    team_id VARCHAR(255),
    channel_id VARCHAR(255),
    user_email VARCHAR(255),
    folder_id VARCHAR(255),
    last_renewed_at TIMESTAMP,
    renewal_failure_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Webhook events table for logging all incoming webhook notifications
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id VARCHAR(255) REFERENCES webhook_subscriptions(subscription_id) ON DELETE SET NULL,
    change_type VARCHAR(100) NOT NULL,
    resource VARCHAR(500) NOT NULL,
    resource_data JSONB,
    client_state VARCHAR(255),
    processed BOOLEAN DEFAULT false,
    error TEXT,
    retry_count INTEGER DEFAULT 0,
    communication_id UUID REFERENCES communications(id) ON DELETE SET NULL,
    received_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- Webhook processing queue for async processing
CREATE TABLE webhook_processing_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_event_id UUID REFERENCES webhook_events(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX idx_webhook_subscriptions_subscription_id ON webhook_subscriptions(subscription_id);
CREATE INDEX idx_webhook_subscriptions_status ON webhook_subscriptions(status);
CREATE INDEX idx_webhook_subscriptions_expiration ON webhook_subscriptions(expiration_date_time);
CREATE INDEX idx_webhook_subscriptions_type ON webhook_subscriptions(subscription_type);
CREATE INDEX idx_webhook_subscriptions_tenant ON webhook_subscriptions(tenant_id);

CREATE INDEX idx_webhook_events_subscription ON webhook_events(subscription_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_received ON webhook_events(received_at DESC);
CREATE INDEX idx_webhook_events_resource ON webhook_events(resource);

CREATE INDEX idx_webhook_queue_status ON webhook_processing_queue(status);
CREATE INDEX idx_webhook_queue_next_retry ON webhook_processing_queue(next_retry_at) WHERE status = 'retrying';
CREATE INDEX idx_webhook_queue_pending ON webhook_processing_queue(priority DESC, created_at ASC) WHERE status = 'pending';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_webhook_subscriptions_updated_at
    BEFORE UPDATE ON webhook_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_updated_at();

-- Function to auto-create processing queue entry when webhook event is created
CREATE OR REPLACE FUNCTION create_webhook_processing_queue()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO webhook_processing_queue (webhook_event_id, priority)
    VALUES (
        NEW.id,
        CASE
            WHEN NEW.change_type = 'created' THEN 7
            WHEN NEW.change_type = 'updated' THEN 5
            WHEN NEW.change_type = 'deleted' THEN 3
            ELSE 5
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create processing queue entries
CREATE TRIGGER create_webhook_queue_on_event
    AFTER INSERT ON webhook_events
    FOR EACH ROW
    EXECUTE FUNCTION create_webhook_processing_queue();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON webhook_subscriptions TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON webhook_events TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON webhook_processing_queue TO fleet_user;

-- Comments
COMMENT ON TABLE webhook_subscriptions IS 'Tracks active Microsoft Graph webhook subscriptions for Teams and Outlook';
COMMENT ON TABLE webhook_events IS 'Logs all incoming webhook notifications from Microsoft Graph';
COMMENT ON TABLE webhook_processing_queue IS 'Queue for async processing of webhook events';
COMMENT ON COLUMN webhook_subscriptions.subscription_id IS 'Microsoft Graph subscription ID';
COMMENT ON COLUMN webhook_subscriptions.resource IS 'Microsoft Graph resource path (e.g., /teams/{id}/channels/{id}/messages)';
COMMENT ON COLUMN webhook_subscriptions.change_type IS 'Event types to monitor (created, updated, deleted)';
COMMENT ON COLUMN webhook_subscriptions.client_state IS 'Secret token for validating webhook authenticity';
COMMENT ON COLUMN webhook_subscriptions.expiration_date_time IS 'Subscription expiration time (max 3 days for most resources)';
COMMENT ON COLUMN webhook_events.resource_data IS 'Full notification payload from Microsoft Graph';
COMMENT ON COLUMN webhook_events.communication_id IS 'Link to created communication record if processed';
