-- Scheduling Notifications System Migration
-- Tables for managing scheduling notification preferences and reminder tracking

-- ============================================================================
-- Scheduling Notification Preferences
-- User preferences for scheduling-related notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduling_notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Channel Preferences
    email_enabled BOOLEAN DEFAULT TRUE,
    sms_enabled BOOLEAN DEFAULT FALSE,
    teams_enabled BOOLEAN DEFAULT TRUE,

    -- Reminder Settings
    reminder_times INTEGER[] DEFAULT ARRAY[24, 1], -- Hours before event to send reminders

    -- Quiet Hours
    quiet_hours_start TIME, -- Don't send during these hours (e.g., '22:00')
    quiet_hours_end TIME,   -- End of quiet hours (e.g., '07:00')

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id)
);

COMMENT ON TABLE scheduling_notification_preferences IS 'User preferences for scheduling notifications (reservations, maintenance)';
COMMENT ON COLUMN scheduling_notification_preferences.reminder_times IS 'Array of hours before event to send reminders, e.g., [24, 1] for 24h and 1h before';
COMMENT ON COLUMN scheduling_notification_preferences.quiet_hours_start IS 'Start of quiet hours when notifications should not be sent';

-- ============================================================================
-- Scheduling Reminders Sent Log
-- Track which reminders have been sent to avoid duplicates
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduling_reminders_sent (
    id SERIAL PRIMARY KEY,
    entity_id VARCHAR(100) NOT NULL, -- ID of reservation or maintenance appointment
    entity_type VARCHAR(50) NOT NULL, -- 'reservation' or 'maintenance'
    hours_before INTEGER NOT NULL, -- How many hours before the event this was sent
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Prevent duplicate reminders
    UNIQUE(entity_id, entity_type, hours_before)
);

COMMENT ON TABLE scheduling_reminders_sent IS 'Tracks sent reminders to prevent duplicate notifications';
COMMENT ON COLUMN scheduling_reminders_sent.entity_id IS 'ID of the reservation or maintenance appointment';
COMMENT ON COLUMN scheduling_reminders_sent.entity_type IS 'Type of entity: reservation or maintenance';
COMMENT ON COLUMN scheduling_reminders_sent.hours_before IS 'Number of hours before event when reminder was sent';

-- ============================================================================
-- Tenant Teams Configuration
-- Maps tenants to their default Teams channels for notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_teams_config (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    team_id VARCHAR(255) NOT NULL,
    channel_id VARCHAR(255) NOT NULL,
    channel_name VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    notification_types TEXT[], -- Types of notifications to send to this channel
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(tenant_id, team_id, channel_id)
);

COMMENT ON TABLE tenant_teams_config IS 'Maps tenants to Microsoft Teams channels for notifications';
COMMENT ON COLUMN tenant_teams_config.notification_types IS 'Array of notification types to send to this channel, e.g., [reservation_request, conflict_detected]';

-- ============================================================================
-- Notification Templates (for scheduling)
-- Store reusable notification templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_templates (
    id SERIAL PRIMARY KEY,
    template_key VARCHAR(100) NOT NULL UNIQUE,
    template_name VARCHAR(255) NOT NULL,
    template_category VARCHAR(100) NOT NULL, -- 'scheduling', 'maintenance', 'safety', etc.

    -- Template Content
    email_subject_template TEXT,
    email_body_template TEXT,
    sms_text_template TEXT,
    teams_message_template TEXT,

    -- Variables
    required_variables TEXT[], -- e.g., ['vehicle_id', 'start_time']
    optional_variables TEXT[],

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER REFERENCES users(id)
);

COMMENT ON TABLE notification_templates IS 'Reusable notification templates with variable substitution';
COMMENT ON COLUMN notification_templates.template_key IS 'Unique key to reference this template in code';

-- ============================================================================
-- Notification Preferences (generic table if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,

    -- Global Preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    in_app_notifications BOOLEAN DEFAULT TRUE,

    -- Type-specific preferences
    notification_types JSONB DEFAULT '{}',

    -- Timing
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'UTC',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Scheduled Notifications (for future delivery)
-- ============================================================================

CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification Details
    type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    channels TEXT[] NOT NULL, -- e.g., ['email', 'sms', 'teams']
    priority VARCHAR(50) DEFAULT 'normal',

    -- Data & Action
    data JSONB,
    action_url VARCHAR(1000),

    -- Scheduling
    scheduled_for TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,

    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE scheduled_notifications IS 'Notifications scheduled for future delivery';

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sched_notif_prefs_user ON scheduling_notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_reminders_sent_entity ON scheduling_reminders_sent(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_reminders_sent_time ON scheduling_reminders_sent(sent_at);

CREATE INDEX IF NOT EXISTS idx_tenant_teams_config_tenant ON tenant_teams_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_teams_config_default ON tenant_teams_config(tenant_id, is_default) WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_notif_templates_key ON notification_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_notif_templates_category ON notification_templates(template_category);
CREATE INDEX IF NOT EXISTS idx_notif_templates_active ON notification_templates(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_scheduled_notifs_user ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifs_scheduled ON scheduled_notifications(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scheduled_notifs_status ON scheduled_notifications(status, scheduled_for);

-- ============================================================================
-- Triggers for Timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_scheduling_notification_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_scheduling_notification_preferences_timestamp
BEFORE UPDATE ON scheduling_notification_preferences
FOR EACH ROW EXECUTE FUNCTION update_scheduling_notification_preferences_timestamp();

-- ============================================================================
-- Seed Default Notification Templates
-- ============================================================================

INSERT INTO notification_templates (template_key, template_name, template_category, email_subject_template, sms_text_template, required_variables, is_active)
VALUES
    (
        'reservation_request',
        'Vehicle Reservation Request',
        'scheduling',
        'New Reservation Request - {{vehicle_name}}',
        'New reservation request for {{vehicle_name}} from {{requester_name}}. Approve/reject in Fleet app.',
        ARRAY['vehicle_name', 'requester_name', 'start_time', 'end_time'],
        TRUE
    ),
    (
        'reservation_approved',
        'Reservation Approved',
        'scheduling',
        'Reservation Approved - {{vehicle_name}}',
        'Your reservation for {{vehicle_name}} has been approved. Pickup: {{start_time}}',
        ARRAY['vehicle_name', 'start_time', 'end_time'],
        TRUE
    ),
    (
        'reservation_rejected',
        'Reservation Declined',
        'scheduling',
        'Reservation Declined - {{vehicle_name}}',
        'Your reservation for {{vehicle_name}} was declined. Reason: {{reason}}',
        ARRAY['vehicle_name', 'reason'],
        TRUE
    ),
    (
        'reservation_reminder',
        'Reservation Reminder',
        'scheduling',
        'Reminder: Vehicle Reservation in {{hours_until}} hour(s)',
        'Reminder: Your reservation for {{vehicle_name}} starts in {{hours_until}} hour(s)',
        ARRAY['vehicle_name', 'hours_until', 'start_time'],
        TRUE
    ),
    (
        'maintenance_reminder',
        'Maintenance Appointment Reminder',
        'scheduling',
        'Reminder: Maintenance Appointment in {{hours_until}} hour(s)',
        'Reminder: Maintenance for {{vehicle_name}} in {{hours_until}} hour(s) at {{location}}',
        ARRAY['vehicle_name', 'hours_until', 'location', 'service_type'],
        TRUE
    ),
    (
        'conflict_detected',
        'Scheduling Conflict Detected',
        'scheduling',
        'Scheduling Conflict - {{conflict_type}}',
        'Scheduling conflict detected: {{description}}. Please review in Fleet app.',
        ARRAY['conflict_type', 'description'],
        TRUE
    )
ON CONFLICT (template_key) DO NOTHING;

-- ============================================================================
-- Views for Reporting
-- ============================================================================

-- View for notification analytics
CREATE OR REPLACE VIEW v_scheduling_notification_stats AS
SELECT
    DATE_TRUNC('day', srs.sent_at) as date,
    srs.entity_type,
    srs.hours_before,
    COUNT(*) as reminders_sent,
    COUNT(DISTINCT CASE WHEN srs.entity_type = 'reservation' THEN srs.entity_id END) as unique_reservations,
    COUNT(DISTINCT CASE WHEN srs.entity_type = 'maintenance' THEN srs.entity_id END) as unique_maintenance
FROM scheduling_reminders_sent srs
WHERE srs.sent_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', srs.sent_at), srs.entity_type, srs.hours_before
ORDER BY date DESC;

COMMENT ON VIEW v_scheduling_notification_stats IS 'Daily statistics on scheduling reminders sent';

-- View for user notification preferences summary
CREATE OR REPLACE VIEW v_user_notification_settings AS
SELECT
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    COALESCE(snp.email_enabled, TRUE) as email_enabled,
    COALESCE(snp.sms_enabled, FALSE) as sms_enabled,
    COALESCE(snp.teams_enabled, TRUE) as teams_enabled,
    COALESCE(snp.reminder_times, ARRAY[24, 1]) as reminder_times,
    snp.quiet_hours_start,
    snp.quiet_hours_end
FROM users u
LEFT JOIN scheduling_notification_preferences snp ON u.id = snp.user_id
WHERE u.active = TRUE;

COMMENT ON VIEW v_user_notification_settings IS 'Complete notification settings for all active users';
