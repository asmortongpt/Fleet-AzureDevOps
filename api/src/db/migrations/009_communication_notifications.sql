-- Migration 009: Communication & Notifications Tables
-- Created: 2026-01-08
-- Description: Notification center, internal messaging, Teams/Outlook integration, and alert management

-- ============================================================================
-- NOTIFICATIONS - System-wide Notification Center
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,

    -- Notification classification
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        'alert', 'reminder', 'approval', 'message', 'system',
        'info', 'warning', 'error', 'success'
    )),
    category VARCHAR(50) CHECK (category IN (
        'vehicle', 'maintenance', 'safety', 'policy', 'expense',
        'compliance', 'document', 'task', 'message', 'system'
    )),

    -- Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

    -- Entity reference
    entity_type VARCHAR(50),  -- 'vehicle', 'driver', 'work_order', 'expense', 'document'
    entity_id UUID,

    -- Action
    action_url TEXT,
    action_label VARCHAR(100),
    action_button_color VARCHAR(7),  -- Hex color

    -- Read status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_dismissed BOOLEAN DEFAULT FALSE,
    dismissed_at TIMESTAMPTZ,

    -- Delivery channels
    delivery_channels TEXT[] DEFAULT '{in_app}'::TEXT[],  -- 'in_app', 'email', 'sms', 'push', 'teams'
    email_sent_at TIMESTAMPTZ,
    sms_sent_at TIMESTAMPTZ,
    push_sent_at TIMESTAMPTZ,
    teams_sent_at TIMESTAMPTZ,

    -- Delivery status
    delivery_status JSONB DEFAULT '{}'::jsonb,
    -- Structure: {email: {status: 'sent', sent_at: '...', error: null}, sms: {...}}

    -- Additional metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    icon VARCHAR(50),

    -- Expiration
    expires_at TIMESTAMPTZ,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_tenant_type ON notifications(tenant_id, notification_type, created_at DESC);
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id) WHERE entity_type IS NOT NULL;
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_priority ON notifications(user_id, priority, created_at DESC) WHERE priority IN ('high', 'urgent');
CREATE INDEX idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL AND is_read = FALSE;

COMMENT ON TABLE notifications IS 'System-wide notification center with multi-channel delivery';

-- ============================================================================
-- NOTIFICATION PREFERENCES - User Notification Settings
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,

    -- Global toggles
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    push_enabled BOOLEAN DEFAULT TRUE,
    teams_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,

    -- Quiet hours
    quiet_hours_enabled BOOLEAN DEFAULT FALSE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    quiet_hours_timezone VARCHAR(50) DEFAULT 'America/New_York',

    -- Category-specific settings
    notification_settings JSONB DEFAULT '{}'::jsonb,
    -- Structure: {vehicle: {email: true, sms: false, push: true}, maintenance: {...}}

    -- Frequency settings
    digest_enabled BOOLEAN DEFAULT FALSE,
    digest_frequency VARCHAR(20) CHECK (digest_frequency IN ('daily', 'weekly', 'monthly', NULL)),
    digest_time TIME DEFAULT '09:00:00',
    digest_day_of_week INTEGER CHECK (digest_day_of_week BETWEEN 0 AND 6),  -- 0=Sunday

    -- Advanced settings
    group_similar_notifications BOOLEAN DEFAULT TRUE,
    auto_dismiss_after_days INTEGER DEFAULT 30,
    sound_enabled BOOLEAN DEFAULT TRUE,

    -- Contact information
    email_addresses TEXT[] DEFAULT '{}',  -- Additional email addresses
    phone_numbers TEXT[] DEFAULT '{}',  -- Additional phone numbers

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);

COMMENT ON TABLE notification_preferences IS 'User-specific notification preferences and channel settings';

-- ============================================================================
-- MESSAGES - Internal Messaging System
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    conversation_id UUID,  -- Group messages by conversation

    -- Sender and recipient
    sender_user_id UUID NOT NULL,
    recipient_user_id UUID,
    recipient_group_id UUID,
    recipient_role VARCHAR(100),
    recipient_department VARCHAR(100),

    -- Message content
    subject VARCHAR(500),
    message_body TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'direct' CHECK (message_type IN ('direct', 'group', 'broadcast', 'system')),

    -- Threading
    parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    thread_depth INTEGER DEFAULT 0,
    root_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,

    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{file_name: '', file_url: '', file_type: '', file_size: 0, document_id: uuid}]

    -- Read status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    delivery_status VARCHAR(20) DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'read', 'failed')),

    -- Organization
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMPTZ,
    is_starred BOOLEAN DEFAULT FALSE,
    starred_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,

    -- Priority and flags
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_important BOOLEAN DEFAULT FALSE,
    requires_response BOOLEAN DEFAULT FALSE,
    response_due_date TIMESTAMPTZ,

    -- Mentions
    mentioned_user_ids UUID[] DEFAULT '{}',

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    sent_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT recipient_specified CHECK (
        (recipient_user_id IS NOT NULL) OR
        (recipient_group_id IS NOT NULL) OR
        (recipient_role IS NOT NULL) OR
        (recipient_department IS NOT NULL)
    )
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, sent_at DESC) WHERE conversation_id IS NOT NULL;
CREATE INDEX idx_messages_recipient_user ON messages(recipient_user_id, is_read, sent_at DESC) WHERE recipient_user_id IS NOT NULL;
CREATE INDEX idx_messages_sender ON messages(sender_user_id, sent_at DESC);
CREATE INDEX idx_messages_parent ON messages(parent_message_id, sent_at) WHERE parent_message_id IS NOT NULL;
CREATE INDEX idx_messages_unread ON messages(recipient_user_id, sent_at DESC) WHERE is_read = FALSE AND is_deleted = FALSE;
CREATE INDEX idx_messages_starred ON messages(recipient_user_id, starred_at DESC) WHERE is_starred = TRUE;
CREATE INDEX idx_messages_tenant ON messages(tenant_id, sent_at DESC);
CREATE INDEX idx_messages_mentions ON messages USING GIN (mentioned_user_ids);

COMMENT ON TABLE messages IS 'Internal messaging system with threading and mentions';

-- ============================================================================
-- TEAMS INTEGRATION MESSAGES - Microsoft Teams Message Sync
-- ============================================================================
CREATE TABLE IF NOT EXISTS teams_integration_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Teams identifiers
    teams_message_id VARCHAR(255) UNIQUE NOT NULL,
    teams_channel_id VARCHAR(255) NOT NULL,
    teams_team_id VARCHAR(255) NOT NULL,
    teams_conversation_id VARCHAR(255),

    -- Sender information
    sender_email VARCHAR(255),
    sender_name VARCHAR(255),
    sender_user_id UUID,  -- Mapped to internal user

    -- Message content
    message_content TEXT,
    message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'html', 'card', 'file')),
    subject VARCHAR(500),

    -- Mentions
    mentions JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{user_id: uuid, email: '', name: '', mention_text: ''}]

    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{name: '', url: '', type: '', size: 0}]

    -- Reactions
    reactions JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{reaction_type: 'like', user_id: uuid, created_at: ''}]

    -- Threading
    is_reply BOOLEAN DEFAULT FALSE,
    reply_to_message_id VARCHAR(255),
    parent_message_id UUID REFERENCES teams_integration_messages(id) ON DELETE SET NULL,

    -- Entity linking (auto-detected references)
    linked_entities JSONB DEFAULT '{}'::jsonb,
    -- Structure: {vehicles: [uuid], work_orders: [uuid], drivers: [uuid]}

    -- Importance
    importance VARCHAR(20) CHECK (importance IN ('low', 'normal', 'high', 'urgent', NULL)),

    -- Timestamps
    created_at_teams TIMESTAMPTZ NOT NULL,
    last_modified_at_teams TIMESTAMPTZ,
    deleted_at_teams TIMESTAMPTZ,

    -- Sync status
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'failed', 'pending')),
    sync_error TEXT
);

CREATE INDEX idx_teams_messages_channel ON teams_integration_messages(teams_channel_id, created_at_teams DESC);
CREATE INDEX idx_teams_messages_tenant ON teams_integration_messages(tenant_id, created_at_teams DESC);
CREATE INDEX idx_teams_messages_id ON teams_integration_messages(teams_message_id);
CREATE INDEX idx_teams_messages_sender ON teams_integration_messages(sender_email, created_at_teams DESC);
CREATE INDEX idx_teams_messages_reply ON teams_integration_messages(reply_to_message_id) WHERE reply_to_message_id IS NOT NULL;
CREATE INDEX idx_teams_messages_entities ON teams_integration_messages USING GIN (linked_entities);

COMMENT ON TABLE teams_integration_messages IS 'Microsoft Teams message synchronization and storage';

-- ============================================================================
-- OUTLOOK EMAILS - Outlook Email Integration
-- ============================================================================
CREATE TABLE IF NOT EXISTS outlook_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Outlook identifiers
    outlook_message_id VARCHAR(255) UNIQUE NOT NULL,
    conversation_id VARCHAR(255),
    conversation_index VARCHAR(500),

    -- User association
    user_email VARCHAR(255) NOT NULL,
    user_id UUID,  -- Mapped to internal user

    -- Email addresses
    from_address VARCHAR(255),
    from_name VARCHAR(255),
    to_addresses TEXT[] NOT NULL,
    cc_addresses TEXT[] DEFAULT '{}',
    bcc_addresses TEXT[] DEFAULT '{}',
    reply_to_addresses TEXT[] DEFAULT '{}',

    -- Content
    subject VARCHAR(1000),
    body_preview TEXT,
    body_content TEXT,
    body_content_type VARCHAR(20) CHECK (body_content_type IN ('html', 'text')),

    -- Importance and categories
    importance VARCHAR(20) CHECK (importance IN ('low', 'normal', 'high')),
    categories TEXT[] DEFAULT '{}',
    flag_status VARCHAR(20) CHECK (flag_status IN ('notFlagged', 'complete', 'flagged', NULL)),

    -- Attachments
    has_attachments BOOLEAN DEFAULT FALSE,
    attachments JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{name: '', content_type: '', size: 0, is_inline: false, content_id: '', download_url: ''}]

    -- Status flags
    is_read BOOLEAN DEFAULT FALSE,
    is_draft BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT TRUE,

    -- Timestamps
    received_datetime TIMESTAMPTZ,
    sent_datetime TIMESTAMPTZ,
    created_datetime TIMESTAMPTZ,
    last_modified_datetime TIMESTAMPTZ,

    -- Entity linking (auto-detected references in email)
    entity_references JSONB DEFAULT '{}'::jsonb,
    -- Structure: {vehicles: [uuid], work_orders: [uuid], drivers: [uuid], expenses: [uuid]}

    -- Folder information
    parent_folder_id VARCHAR(255),
    folder_name VARCHAR(255),

    -- Sync information
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'failed', 'pending')),
    sync_error TEXT
);

CREATE INDEX idx_outlook_emails_user ON outlook_emails(user_email, received_datetime DESC);
CREATE INDEX idx_outlook_emails_tenant ON outlook_emails(tenant_id, received_datetime DESC);
CREATE INDEX idx_outlook_emails_id ON outlook_emails(outlook_message_id);
CREATE INDEX idx_outlook_emails_conversation ON outlook_emails(conversation_id, received_datetime) WHERE conversation_id IS NOT NULL;
CREATE INDEX idx_outlook_emails_from ON outlook_emails(from_address, received_datetime DESC);
CREATE INDEX idx_outlook_emails_unread ON outlook_emails(user_email, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_outlook_emails_entities ON outlook_emails USING GIN (entity_references);
CREATE INDEX idx_outlook_emails_categories ON outlook_emails USING GIN (categories);

COMMENT ON TABLE outlook_emails IS 'Outlook email synchronization with entity linking';

-- ============================================================================
-- ALERT RULES - Configurable Alerting Rules
-- ============================================================================
CREATE TABLE IF NOT EXISTS alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Rule identification
    rule_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Alert type
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'maintenance_due', 'inspection_expiring', 'license_expiring',
        'certification_expiring', 'cost_threshold', 'budget_exceeded',
        'geofence_violation', 'driver_behavior', 'vehicle_idle',
        'fuel_anomaly', 'speed_violation', 'custom'
    )),

    -- Trigger conditions (stored as JSON for flexibility)
    trigger_conditions JSONB NOT NULL,
    -- Structure: {metric: 'fuel_level', operator: '<', value: 25, unit: '%'}
    -- Or: {and: [{...}, {...}], or: [{...}]}

    -- Severity
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'emergency')),

    -- Notification settings
    notification_channels TEXT[] NOT NULL,  -- 'in_app', 'email', 'sms', 'teams', 'webhook'
    recipient_users UUID[] DEFAULT '{}',
    recipient_roles TEXT[] DEFAULT '{}',
    recipient_departments TEXT[] DEFAULT '{}',
    recipient_emails TEXT[] DEFAULT '{}',

    -- Alert message template
    message_template TEXT,
    -- Can use variables: {vehicle_name}, {driver_name}, {metric_value}, etc.

    -- Cooldown to prevent spam
    cooldown_minutes INTEGER DEFAULT 60 CHECK (cooldown_minutes >= 0),
    last_triggered_at TIMESTAMPTZ,

    -- Scheduling
    active_days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}'::INTEGER[],  -- 0=Sunday
    active_time_start TIME,
    active_time_end TIME,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_system_rule BOOLEAN DEFAULT FALSE,  -- Cannot be deleted by users

    -- Escalation
    escalate_after_minutes INTEGER,
    escalation_recipient_users UUID[] DEFAULT '{}',
    escalation_recipient_roles TEXT[] DEFAULT '{}',

    -- Statistics
    times_triggered INTEGER DEFAULT 0,
    last_trigger_details JSONB,

    -- Audit fields
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alert_rules_tenant_active ON alert_rules(tenant_id, is_active);
CREATE INDEX idx_alert_rules_type ON alert_rules(alert_type, is_active);
CREATE INDEX idx_alert_rules_conditions ON alert_rules USING GIN (trigger_conditions);
CREATE INDEX idx_alert_rules_last_triggered ON alert_rules(last_triggered_at) WHERE is_active = TRUE;

COMMENT ON TABLE alert_rules IS 'Configurable alert rules with flexible trigger conditions';

-- ============================================================================
-- ALERT HISTORY - Alert Firing History
-- ============================================================================
CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    alert_rule_id UUID NOT NULL REFERENCES alert_rules(id) ON DELETE CASCADE,

    -- Alert details
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    alert_message TEXT NOT NULL,

    -- Entity reference
    entity_type VARCHAR(50),  -- 'vehicle', 'driver', 'work_order', 'expense'
    entity_id UUID,
    entity_name VARCHAR(255),

    -- Trigger data snapshot
    trigger_data JSONB NOT NULL,
    -- Snapshot of the data that triggered the alert

    -- Notification delivery
    notification_channels_used TEXT[],
    delivery_results JSONB DEFAULT '{}'::jsonb,
    -- Structure: {email: {status: 'sent', sent_to: [...], error: null}, sms: {...}}

    -- Acknowledgment
    acknowledged_by_user_id UUID,
    acknowledged_at TIMESTAMPTZ,
    acknowledgment_notes TEXT,

    -- Resolution
    resolved_by_user_id UUID,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    resolution_action_taken TEXT,

    -- Escalation
    was_escalated BOOLEAN DEFAULT FALSE,
    escalated_at TIMESTAMPTZ,
    escalated_to_users UUID[],

    -- Audit fields
    fired_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alert_history_rule ON alert_history(alert_rule_id, fired_at DESC);
CREATE INDEX idx_alert_history_tenant ON alert_history(tenant_id, alert_type, fired_at DESC);
CREATE INDEX idx_alert_history_entity ON alert_history(entity_type, entity_id, fired_at DESC) WHERE entity_type IS NOT NULL;
CREATE INDEX idx_alert_history_unacknowledged ON alert_history(tenant_id, fired_at DESC)
    WHERE acknowledged_by_user_id IS NULL;
CREATE INDEX idx_alert_history_unresolved ON alert_history(tenant_id, severity, fired_at DESC)
    WHERE resolved_by_user_id IS NULL;

COMMENT ON TABLE alert_history IS 'Alert firing history with acknowledgment and resolution tracking';

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_communication_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_communication_updated_at();
CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON alert_rules FOR EACH ROW EXECUTE FUNCTION update_communication_updated_at();

-- Mark notification as read when accessed
CREATE OR REPLACE FUNCTION mark_notification_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = TRUE AND (OLD.is_read IS NULL OR OLD.is_read = FALSE) THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mark_notification_read_trigger
    BEFORE UPDATE OF is_read ON notifications
    FOR EACH ROW EXECUTE FUNCTION mark_notification_read();

-- Mark message as read when accessed
CREATE OR REPLACE FUNCTION mark_message_read()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_read = TRUE AND (OLD.is_read IS NULL OR OLD.is_read = FALSE) THEN
        NEW.read_at = NOW();
        NEW.delivery_status = 'read';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER mark_message_read_trigger
    BEFORE UPDATE OF is_read ON messages
    FOR EACH ROW EXECUTE FUNCTION mark_message_read();

-- Auto-generate conversation ID for messages
CREATE OR REPLACE FUNCTION generate_conversation_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.conversation_id IS NULL THEN
        IF NEW.parent_message_id IS NOT NULL THEN
            -- Use same conversation as parent
            SELECT conversation_id INTO NEW.conversation_id
            FROM messages
            WHERE id = NEW.parent_message_id;
        ELSE
            -- Generate new conversation ID
            NEW.conversation_id = gen_random_uuid();
        END IF;
    END IF;

    -- Set root message ID
    IF NEW.parent_message_id IS NOT NULL THEN
        SELECT COALESCE(root_message_id, id) INTO NEW.root_message_id
        FROM messages
        WHERE id = NEW.parent_message_id;
    ELSE
        NEW.root_message_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_conversation_id_trigger
    BEFORE INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION generate_conversation_id();

-- Update alert rule statistics when alert fires
CREATE OR REPLACE FUNCTION update_alert_rule_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE alert_rules
    SET
        times_triggered = times_triggered + 1,
        last_triggered_at = NEW.fired_at,
        last_trigger_details = NEW.trigger_data
    WHERE id = NEW.alert_rule_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_alert_rule_stats_trigger
    AFTER INSERT ON alert_history
    FOR EACH ROW EXECUTE FUNCTION update_alert_rule_stats();

-- Helper function to check if alert rule is in cooldown
CREATE OR REPLACE FUNCTION is_alert_in_cooldown(
    rule_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    rule RECORD;
BEGIN
    SELECT last_triggered_at, cooldown_minutes INTO rule
    FROM alert_rules
    WHERE id = rule_id;

    IF rule.last_triggered_at IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN (NOW() - rule.last_triggered_at) < (rule.cooldown_minutes || ' minutes')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_alert_in_cooldown IS 'Check if an alert rule is currently in cooldown period';

-- Helper function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(
    p_user_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM notifications
    WHERE
        user_id = p_user_id
        AND is_read = FALSE
        AND is_deleted = FALSE
        AND (expires_at IS NULL OR expires_at > NOW());

    RETURN unread_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_unread_notification_count IS 'Get count of unread notifications for a user';
