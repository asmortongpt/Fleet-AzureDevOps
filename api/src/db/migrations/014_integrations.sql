-- ============================================================================
-- Migration: 014_integrations.sql
-- Description: Third-Party Integrations and External System Synchronization
-- Author: Claude Code
-- Date: 2026-01-08
-- ============================================================================
-- Tables: 7
--   1. microsoft_graph_sync - Microsoft Graph API synchronization state
--   2. calendar_integrations - External calendar sync configuration
--   3. webhook_subscriptions - Outgoing webhook subscriptions
--   4. webhook_deliveries - Webhook delivery logs and retry tracking
--   5. api_integrations - Third-party API integration configs
--   6. integration_logs - Integration activity and error logging
--   7. external_system_mappings - Map internal IDs to external system IDs
-- ============================================================================

-- ============================================================================
-- Table: microsoft_graph_sync
-- Purpose: Microsoft Graph API synchronization state management
-- ============================================================================

CREATE TABLE IF NOT EXISTS microsoft_graph_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Sync configuration
    sync_type VARCHAR(50) NOT NULL CHECK (sync_type IN (
        'users', 'calendar_events', 'emails', 'teams_messages', 'onedrive_files',
        'sharepoint_documents', 'contacts', 'groups'
    )),
    resource_path VARCHAR(500) NOT NULL,  -- '/users', '/me/calendar/events', etc.

    -- Delta sync tracking
    delta_link TEXT,  -- Microsoft Graph delta link for incremental sync
    skip_token TEXT,  -- Pagination token
    sync_token TEXT,  -- Sync state token

    -- Sync status
    sync_status VARCHAR(30) DEFAULT 'idle' CHECK (sync_status IN (
        'idle', 'running', 'completed', 'failed', 'paused'
    )),
    last_sync_started_at TIMESTAMPTZ,
    last_sync_completed_at TIMESTAMPTZ,
    last_sync_duration_seconds INTEGER,
    next_sync_scheduled_at TIMESTAMPTZ,

    -- Sync results
    records_fetched INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_deleted INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,

    -- Configuration
    sync_frequency VARCHAR(20) DEFAULT 'hourly' CHECK (sync_frequency IN (
        'realtime', 'every_15_min', 'hourly', 'every_4_hours', 'daily', 'manual'
    )),
    enabled BOOLEAN DEFAULT TRUE,
    auto_sync BOOLEAN DEFAULT TRUE,

    -- Filtering
    filter_query TEXT,  -- OData $filter query
    select_fields TEXT[] DEFAULT '{}',  -- Fields to fetch
    expand_relations TEXT[] DEFAULT '{}',  -- Relations to expand

    -- User/entity scope
    user_id UUID REFERENCES users(id),  -- For user-specific syncs
    entity_type VARCHAR(50),
    entity_id UUID,

    -- Error handling
    error_count INTEGER DEFAULT 0,
    last_error_message TEXT,
    last_error_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    -- Rate limiting
    rate_limit_remaining INTEGER,
    rate_limit_reset_at TIMESTAMPTZ,

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_microsoft_graph_sync_tenant ON microsoft_graph_sync(tenant_id);
CREATE INDEX idx_microsoft_graph_sync_type ON microsoft_graph_sync(sync_type, sync_status);
CREATE INDEX idx_microsoft_graph_sync_user ON microsoft_graph_sync(user_id);
CREATE INDEX idx_microsoft_graph_sync_scheduled ON microsoft_graph_sync(next_sync_scheduled_at)
    WHERE enabled = TRUE AND auto_sync = TRUE;
CREATE INDEX idx_microsoft_graph_sync_failed ON microsoft_graph_sync(last_error_at DESC)
    WHERE error_count > 0;

-- Trigger: Update timestamp
CREATE TRIGGER update_microsoft_graph_sync_timestamp
    BEFORE UPDATE ON microsoft_graph_sync
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE microsoft_graph_sync IS 'Microsoft Graph API synchronization state with delta sync support';
COMMENT ON COLUMN microsoft_graph_sync.delta_link IS 'Microsoft Graph delta link for efficient incremental synchronization';

-- ============================================================================
-- Table: calendar_integrations
-- Purpose: External calendar synchronization configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS calendar_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Integration identification
    integration_name VARCHAR(200) NOT NULL,
    calendar_provider VARCHAR(50) NOT NULL CHECK (calendar_provider IN (
        'microsoft_365', 'google_calendar', 'apple_calendar', 'exchange',
        'ical_url', 'caldav'
    )),

    -- User and calendar
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calendar_id VARCHAR(255),  -- Provider's calendar ID
    calendar_name VARCHAR(200),
    calendar_color VARCHAR(7),  -- Hex color
    is_primary_calendar BOOLEAN DEFAULT FALSE,

    -- Authentication
    auth_method VARCHAR(30) CHECK (auth_method IN (
        'oauth2', 'api_key', 'basic_auth', 'bearer_token'
    )),
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    caldav_url TEXT,  -- For CalDAV calendars

    -- Sync configuration
    sync_direction VARCHAR(30) DEFAULT 'bidirectional' CHECK (sync_direction IN (
        'import_only', 'export_only', 'bidirectional'
    )),
    sync_frequency VARCHAR(20) DEFAULT 'every_15_min' CHECK (sync_frequency IN (
        'realtime', 'every_5_min', 'every_15_min', 'hourly', 'daily'
    )),

    -- Event filtering
    sync_event_types TEXT[] DEFAULT '{}',  -- ['maintenance', 'reservations', 'inspections']
    date_range_days_past INTEGER DEFAULT 30,
    date_range_days_future INTEGER DEFAULT 90,

    -- Field mapping
    field_mappings JSONB,  -- {title: 'summary', location: 'location', notes: 'description'}

    -- Conflict resolution
    conflict_resolution VARCHAR(30) DEFAULT 'newest_wins' CHECK (conflict_resolution IN (
        'newest_wins', 'provider_wins', 'fleet_wins', 'manual_review'
    )),

    -- Sync status
    last_sync_at TIMESTAMPTZ,
    last_sync_status VARCHAR(30),
    events_synced_count INTEGER DEFAULT 0,
    sync_errors_count INTEGER DEFAULT 0,

    -- Notifications
    notify_on_sync_errors BOOLEAN DEFAULT TRUE,
    notification_email VARCHAR(255),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,  -- Calendar connection verified

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_calendar_integrations_tenant ON calendar_integrations(tenant_id);
CREATE INDEX idx_calendar_integrations_user ON calendar_integrations(user_id);
CREATE INDEX idx_calendar_integrations_provider ON calendar_integrations(calendar_provider, is_active);
CREATE INDEX idx_calendar_integrations_primary ON calendar_integrations(user_id, is_primary_calendar)
    WHERE is_primary_calendar = TRUE;
CREATE INDEX idx_calendar_integrations_sync_status ON calendar_integrations(last_sync_status, last_sync_at)
    WHERE is_active = TRUE;

-- Trigger: Update timestamp
CREATE TRIGGER update_calendar_integrations_timestamp
    BEFORE UPDATE ON calendar_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE calendar_integrations IS 'External calendar synchronization for Microsoft 365, Google Calendar, and CalDAV';
COMMENT ON COLUMN calendar_integrations.sync_direction IS 'import_only: read from calendar, export_only: write to calendar, bidirectional: both';

-- ============================================================================
-- Table: webhook_subscriptions
-- Purpose: Outgoing webhook subscriptions for external systems
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Subscription identification
    subscription_name VARCHAR(200) NOT NULL,
    subscription_description TEXT,

    -- Webhook endpoint
    target_url TEXT NOT NULL,
    http_method VARCHAR(10) DEFAULT 'POST' CHECK (http_method IN ('POST', 'PUT', 'PATCH')),
    content_type VARCHAR(100) DEFAULT 'application/json',

    -- Authentication
    auth_type VARCHAR(30) CHECK (auth_type IN (
        'none', 'api_key', 'bearer_token', 'basic_auth', 'hmac_signature', 'oauth2'
    )),
    auth_header_name VARCHAR(100),  -- e.g., 'Authorization', 'X-API-Key'
    auth_value_encrypted TEXT,
    hmac_secret_encrypted TEXT,  -- For HMAC signature validation

    -- Event triggers
    event_types TEXT[] NOT NULL DEFAULT '{}',
    -- Examples: ['vehicle.created', 'work_order.completed', 'maintenance.due']

    -- Filtering
    filter_conditions JSONB,  -- {status: 'active', department_id: 'uuid'}
    include_fields TEXT[] DEFAULT '{}',  -- Specific fields to send
    exclude_fields TEXT[] DEFAULT '{}',  -- Fields to exclude

    -- Payload configuration
    payload_template JSONB,  -- Custom payload structure
    include_metadata BOOLEAN DEFAULT TRUE,
    include_timestamp BOOLEAN DEFAULT TRUE,

    -- Delivery settings
    retry_policy VARCHAR(30) DEFAULT 'exponential' CHECK (retry_policy IN (
        'none', 'immediate', 'exponential', 'custom'
    )),
    max_retries INTEGER DEFAULT 3,
    retry_intervals INTEGER[] DEFAULT '{60, 300, 900}',  -- Seconds between retries
    timeout_seconds INTEGER DEFAULT 30,

    -- Rate limiting
    rate_limit_per_minute INTEGER,
    rate_limit_per_hour INTEGER,

    -- Batching
    enable_batching BOOLEAN DEFAULT FALSE,
    batch_size INTEGER DEFAULT 10,
    batch_window_seconds INTEGER DEFAULT 60,

    -- Status tracking
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,  -- Endpoint verified via challenge
    last_delivery_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,

    -- Performance metrics
    total_deliveries INTEGER DEFAULT 0,
    successful_deliveries INTEGER DEFAULT 0,
    failed_deliveries INTEGER DEFAULT 0,
    average_response_time_ms INTEGER,

    -- Health monitoring
    consecutive_failures INTEGER DEFAULT 0,
    health_status VARCHAR(20) DEFAULT 'healthy' CHECK (health_status IN (
        'healthy', 'degraded', 'unhealthy', 'paused'
    )),
    auto_pause_on_failures INTEGER DEFAULT 10,  -- Auto-pause after N failures

    -- Alerts
    alert_on_failure BOOLEAN DEFAULT TRUE,
    alert_recipients TEXT[] DEFAULT '{}',

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_webhook_subscriptions_tenant ON webhook_subscriptions(tenant_id);
CREATE INDEX idx_webhook_subscriptions_active ON webhook_subscriptions(is_active, health_status);
CREATE INDEX idx_webhook_subscriptions_event_types ON webhook_subscriptions USING GIN(event_types);
CREATE INDEX idx_webhook_subscriptions_health ON webhook_subscriptions(health_status, consecutive_failures)
    WHERE is_active = TRUE;

-- Trigger: Update timestamp
CREATE TRIGGER update_webhook_subscriptions_timestamp
    BEFORE UPDATE ON webhook_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-pause on consecutive failures
CREATE OR REPLACE FUNCTION auto_pause_unhealthy_webhook() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.consecutive_failures >= NEW.auto_pause_on_failures THEN
        NEW.health_status := 'paused';
        NEW.is_active := FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_webhook_health
    BEFORE UPDATE ON webhook_subscriptions
    FOR EACH ROW
    WHEN (NEW.consecutive_failures >= NEW.auto_pause_on_failures)
    EXECUTE FUNCTION auto_pause_unhealthy_webhook();

-- Comments
COMMENT ON TABLE webhook_subscriptions IS 'Outgoing webhook subscriptions for notifying external systems of events';
COMMENT ON COLUMN webhook_subscriptions.event_types IS 'Array of event types that trigger this webhook';
COMMENT ON COLUMN webhook_subscriptions.retry_intervals IS 'Array of seconds to wait between retry attempts';

-- ============================================================================
-- Table: webhook_deliveries
-- Purpose: Webhook delivery logs and retry tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Subscription reference
    webhook_subscription_id UUID NOT NULL REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
    subscription_name VARCHAR(200),

    -- Event details
    event_type VARCHAR(100) NOT NULL,
    event_id UUID NOT NULL,  -- ID of the event that triggered webhook
    event_timestamp TIMESTAMPTZ NOT NULL,

    -- Delivery attempt
    attempt_number INTEGER DEFAULT 1,
    delivery_status VARCHAR(30) NOT NULL CHECK (delivery_status IN (
        'pending', 'sending', 'delivered', 'failed', 'retrying', 'abandoned'
    )),

    -- Request details
    request_url TEXT NOT NULL,
    request_method VARCHAR(10),
    request_headers JSONB,
    request_payload JSONB,
    request_size_bytes INTEGER,

    -- Response details
    response_status_code INTEGER,
    response_headers JSONB,
    response_body TEXT,
    response_size_bytes INTEGER,
    response_time_ms INTEGER,

    -- Timing
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,

    -- Error handling
    error_message TEXT,
    error_code VARCHAR(50),
    error_type VARCHAR(50),  -- 'timeout', 'connection_error', 'http_error', 'rate_limit'

    -- Retry tracking
    is_retry BOOLEAN DEFAULT FALSE,
    parent_delivery_id UUID REFERENCES webhook_deliveries(id),
    retries_remaining INTEGER,

    -- Metadata
    custom_fields JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_webhook_deliveries_tenant ON webhook_deliveries(tenant_id);
CREATE INDEX idx_webhook_deliveries_subscription ON webhook_deliveries(webhook_subscription_id, sent_at DESC);
CREATE INDEX idx_webhook_deliveries_event ON webhook_deliveries(event_type, event_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(delivery_status, sent_at DESC);
CREATE INDEX idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at)
    WHERE delivery_status = 'retrying';
CREATE INDEX idx_webhook_deliveries_failed ON webhook_deliveries(sent_at DESC)
    WHERE delivery_status IN ('failed', 'abandoned');
CREATE INDEX idx_webhook_deliveries_timestamp ON webhook_deliveries(sent_at DESC);

-- Trigger: Update webhook subscription stats
CREATE OR REPLACE FUNCTION update_webhook_subscription_stats() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.delivery_status = 'delivered' THEN
        UPDATE webhook_subscriptions
        SET
            total_deliveries = total_deliveries + 1,
            successful_deliveries = successful_deliveries + 1,
            last_delivery_at = NEW.sent_at,
            last_success_at = NEW.received_at,
            consecutive_failures = 0,
            health_status = 'healthy',
            average_response_time_ms = (
                COALESCE(average_response_time_ms * total_deliveries, 0) + NEW.response_time_ms
            ) / (total_deliveries + 1)
        WHERE id = NEW.webhook_subscription_id;
    ELSIF NEW.delivery_status IN ('failed', 'abandoned') THEN
        UPDATE webhook_subscriptions
        SET
            total_deliveries = total_deliveries + 1,
            failed_deliveries = failed_deliveries + 1,
            last_delivery_at = NEW.sent_at,
            last_failure_at = NEW.received_at,
            consecutive_failures = consecutive_failures + 1,
            health_status = CASE
                WHEN consecutive_failures + 1 >= auto_pause_on_failures THEN 'unhealthy'
                WHEN consecutive_failures + 1 >= 5 THEN 'degraded'
                ELSE health_status
            END
        WHERE id = NEW.webhook_subscription_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_update_webhook_stats
    AFTER INSERT OR UPDATE ON webhook_deliveries
    FOR EACH ROW
    WHEN (NEW.delivery_status IN ('delivered', 'failed', 'abandoned'))
    EXECUTE FUNCTION update_webhook_subscription_stats();

-- Comments
COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery logs with retry tracking and performance metrics';
COMMENT ON COLUMN webhook_deliveries.attempt_number IS 'Delivery attempt number (1 = initial, 2+ = retries)';

-- ============================================================================
-- Table: api_integrations
-- Purpose: Third-party API integration configurations
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Integration identification
    integration_name VARCHAR(200) NOT NULL,
    integration_type VARCHAR(50) NOT NULL,  -- 'telematics', 'fuel_card', 'accounting', etc.
    provider VARCHAR(100) NOT NULL,  -- 'Geotab', 'Samsara', 'WEX', 'QuickBooks', etc.
    provider_logo_url TEXT,

    -- API configuration
    api_base_url TEXT NOT NULL,
    api_version VARCHAR(50),
    environment VARCHAR(20) DEFAULT 'production' CHECK (environment IN (
        'sandbox', 'staging', 'production'
    )),

    -- Authentication
    auth_type VARCHAR(30) NOT NULL CHECK (auth_type IN (
        'api_key', 'oauth2', 'basic_auth', 'bearer_token', 'jwt', 'custom'
    )),
    api_key_encrypted TEXT,
    client_id VARCHAR(255),
    client_secret_encrypted TEXT,
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,
    token_refresh_url TEXT,

    -- Configuration
    config JSONB DEFAULT '{}'::jsonb,
    -- Structure varies by provider: {account_id, database_name, warehouse_id, etc.}

    -- Features enabled
    features_enabled TEXT[] DEFAULT '{}',
    -- Examples: ['vehicle_tracking', 'fuel_transactions', 'driver_behavior']

    -- Data sync settings
    sync_enabled BOOLEAN DEFAULT TRUE,
    sync_frequency VARCHAR(20) DEFAULT 'hourly',
    last_sync_at TIMESTAMPTZ,
    next_sync_at TIMESTAMPTZ,

    -- Rate limiting
    rate_limit_per_second INTEGER,
    rate_limit_per_minute INTEGER,
    rate_limit_per_day INTEGER,
    current_usage_count INTEGER DEFAULT 0,
    usage_reset_at TIMESTAMPTZ,

    -- Health monitoring
    health_status VARCHAR(20) DEFAULT 'unknown' CHECK (health_status IN (
        'healthy', 'degraded', 'unhealthy', 'unknown'
    )),
    last_health_check_at TIMESTAMPTZ,
    consecutive_failures INTEGER DEFAULT 0,

    -- Error tracking
    last_error_at TIMESTAMPTZ,
    last_error_message TEXT,
    error_count_24h INTEGER DEFAULT 0,

    -- Performance metrics
    average_response_time_ms INTEGER,
    total_api_calls INTEGER DEFAULT 0,
    successful_api_calls INTEGER DEFAULT 0,
    failed_api_calls INTEGER DEFAULT 0,

    -- Webhooks from provider
    webhook_url TEXT,  -- Our endpoint for this provider
    webhook_secret_encrypted TEXT,

    -- Contact information
    support_email VARCHAR(255),
    support_phone VARCHAR(50),
    support_url TEXT,

    -- Billing
    billing_plan VARCHAR(100),
    billing_cycle VARCHAR(20),
    monthly_cost DECIMAL(10, 2),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes
CREATE INDEX idx_api_integrations_tenant ON api_integrations(tenant_id);
CREATE INDEX idx_api_integrations_type ON api_integrations(integration_type, provider);
CREATE INDEX idx_api_integrations_active ON api_integrations(is_active, health_status);
CREATE INDEX idx_api_integrations_sync ON api_integrations(next_sync_at)
    WHERE sync_enabled = TRUE AND is_active = TRUE;
CREATE INDEX idx_api_integrations_health ON api_integrations(health_status, last_health_check_at);
CREATE INDEX idx_api_integrations_features ON api_integrations USING GIN(features_enabled);

-- Trigger: Update timestamp
CREATE TRIGGER update_api_integrations_timestamp
    BEFORE UPDATE ON api_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE api_integrations IS 'Third-party API integration configurations for telematics, fuel cards, accounting systems, etc.';
COMMENT ON COLUMN api_integrations.config IS 'Provider-specific configuration (account IDs, database names, custom settings)';

-- ============================================================================
-- Table: integration_logs
-- Purpose: Integration activity and error logging
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Integration reference
    integration_id UUID REFERENCES api_integrations(id) ON DELETE SET NULL,
    integration_name VARCHAR(200),
    integration_type VARCHAR(50),

    -- Log details
    log_level VARCHAR(20) NOT NULL CHECK (log_level IN (
        'debug', 'info', 'warning', 'error', 'critical'
    )),
    log_category VARCHAR(50),  -- 'authentication', 'sync', 'webhook', 'api_call'

    -- Operation details
    operation VARCHAR(100),  -- 'fetch_vehicles', 'sync_fuel_transactions', 'send_invoice'
    operation_status VARCHAR(20) CHECK (operation_status IN (
        'started', 'in_progress', 'completed', 'failed', 'timeout'
    )),

    -- Request/response
    request_method VARCHAR(10),
    request_url TEXT,
    request_payload JSONB,
    response_status_code INTEGER,
    response_body JSONB,
    response_time_ms INTEGER,

    -- Results
    records_processed INTEGER,
    records_created INTEGER,
    records_updated INTEGER,
    records_failed INTEGER,

    -- Error details
    error_message TEXT,
    error_code VARCHAR(50),
    error_stack_trace TEXT,

    -- Context
    user_id UUID REFERENCES users(id),
    related_entity_type VARCHAR(50),
    related_entity_id UUID,

    -- Timestamp
    occurred_at TIMESTAMPTZ DEFAULT NOW(),

    -- Metadata
    custom_fields JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_integration_logs_tenant ON integration_logs(tenant_id);
CREATE INDEX idx_integration_logs_integration ON integration_logs(integration_id, occurred_at DESC);
CREATE INDEX idx_integration_logs_level ON integration_logs(log_level, occurred_at DESC)
    WHERE log_level IN ('error', 'critical');
CREATE INDEX idx_integration_logs_operation ON integration_logs(operation, operation_status, occurred_at DESC);
CREATE INDEX idx_integration_logs_user ON integration_logs(user_id, occurred_at DESC);
CREATE INDEX idx_integration_logs_timestamp ON integration_logs(occurred_at DESC);

-- Partitioning recommendation for high-volume logs
-- CREATE TABLE integration_logs_2026_01 PARTITION OF integration_logs
-- FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Comments
COMMENT ON TABLE integration_logs IS 'Comprehensive activity and error logs for all third-party integrations';
COMMENT ON COLUMN integration_logs.log_level IS 'debug, info, warning, error, critical';

-- ============================================================================
-- Table: external_system_mappings
-- Purpose: Map internal IDs to external system IDs
-- ============================================================================

CREATE TABLE IF NOT EXISTS external_system_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Internal entity
    internal_entity_type VARCHAR(50) NOT NULL,  -- 'vehicle', 'driver', 'work_order', etc.
    internal_entity_id UUID NOT NULL,
    internal_entity_name VARCHAR(200),

    -- External system
    external_system VARCHAR(100) NOT NULL,  -- 'Geotab', 'QuickBooks', 'WEX', etc.
    integration_id UUID REFERENCES api_integrations(id) ON DELETE CASCADE,

    -- External identifier
    external_id VARCHAR(255) NOT NULL,
    external_id_type VARCHAR(50),  -- 'vehicle_id', 'customer_id', 'account_number', etc.
    external_entity_type VARCHAR(100),  -- External system's entity type name

    -- Additional mapping data
    external_metadata JSONB,  -- Any additional data from external system
    -- Structure: {name, status, last_updated, custom_fields: {...}}

    -- Synchronization
    sync_direction VARCHAR(30) CHECK (sync_direction IN (
        'import_only', 'export_only', 'bidirectional'
    )),
    last_synced_at TIMESTAMPTZ,
    sync_status VARCHAR(20) CHECK (sync_status IN (
        'active', 'inactive', 'error', 'orphaned'
    )),

    -- Validation
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    last_validation_error TEXT,

    -- Metadata
    notes TEXT,
    custom_fields JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    CONSTRAINT unique_internal_external_mapping UNIQUE (
        tenant_id, internal_entity_type, internal_entity_id, external_system
    ),
    CONSTRAINT unique_external_id_per_system UNIQUE (
        tenant_id, external_system, external_id
    )
);

-- Indexes
CREATE INDEX idx_external_mappings_tenant ON external_system_mappings(tenant_id);
CREATE INDEX idx_external_mappings_internal ON external_system_mappings(
    internal_entity_type, internal_entity_id
);
CREATE INDEX idx_external_mappings_external ON external_system_mappings(
    external_system, external_id
);
CREATE INDEX idx_external_mappings_integration ON external_system_mappings(integration_id);
CREATE INDEX idx_external_mappings_sync ON external_system_mappings(sync_status, last_synced_at);

-- Trigger: Update timestamp
CREATE TRIGGER update_external_mappings_timestamp
    BEFORE UPDATE ON external_system_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE external_system_mappings IS 'Bidirectional ID mappings between internal entities and external systems';
COMMENT ON COLUMN external_system_mappings.external_metadata IS 'Additional data from external system for reference';

-- ============================================================================
-- Helper function: Get external ID for entity
-- ============================================================================

CREATE OR REPLACE FUNCTION get_external_id(
    p_internal_entity_type VARCHAR(50),
    p_internal_entity_id UUID,
    p_external_system VARCHAR(100)
) RETURNS VARCHAR(255) AS $$
DECLARE
    ext_id VARCHAR(255);
BEGIN
    SELECT external_id INTO ext_id
    FROM external_system_mappings
    WHERE internal_entity_type = p_internal_entity_type
      AND internal_entity_id = p_internal_entity_id
      AND external_system = p_external_system
      AND sync_status = 'active'
    LIMIT 1;

    RETURN ext_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_external_id IS 'Lookup external system ID for an internal entity';

-- ============================================================================
-- Helper function: Get internal ID from external ID
-- ============================================================================

CREATE OR REPLACE FUNCTION get_internal_id(
    p_external_system VARCHAR(100),
    p_external_id VARCHAR(255)
) RETURNS UUID AS $$
DECLARE
    int_id UUID;
BEGIN
    SELECT internal_entity_id INTO int_id
    FROM external_system_mappings
    WHERE external_system = p_external_system
      AND external_id = p_external_id
      AND sync_status = 'active'
    LIMIT 1;

    RETURN int_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_internal_id IS 'Lookup internal entity ID from external system ID';

-- ============================================================================
-- END OF MIGRATION 014
-- ============================================================================
