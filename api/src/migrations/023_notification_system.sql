-- Migration: Push Notification and SMS System
-- Description: Complete notification system with push notifications and SMS
-- Business Value: Enhanced user engagement and communication

-- =====================================================
-- Update Mobile Devices for Push Notifications
-- =====================================================

-- Add new columns to existing mobile_devices table for push notifications
ALTER TABLE mobile_devices
  ADD COLUMN IF NOT EXISTS tenant_id INTEGER,
  ADD COLUMN IF NOT EXISTS device_token TEXT,
  ADD COLUMN IF NOT EXISTS platform VARCHAR(20),
  ADD COLUMN IF NOT EXISTS device_model VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add index for device_token lookups
CREATE INDEX IF NOT EXISTS idx_mobile_devices_token ON mobile_devices(device_token);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_platform ON mobile_devices(platform);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_tenant ON mobile_devices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_active ON mobile_devices(is_active);

-- Update existing records to populate platform from device_type
UPDATE mobile_devices SET platform = device_type WHERE platform IS NULL;

-- =====================================================
-- Push Notifications Table
-- =====================================================

CREATE TABLE IF NOT EXISTS push_notifications (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    notification_type VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('critical_alert', 'maintenance_reminder', 'task_assignment', 'driver_alert', 'administrative', 'performance')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'critical')) DEFAULT 'normal',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data_payload JSONB,
    action_buttons JSONB,
    image_url TEXT,
    sound VARCHAR(50) DEFAULT 'default',
    badge_count INTEGER DEFAULT 1,
    total_recipients INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'scheduled', 'sending', 'sent', 'failed')),
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_push_notifications_tenant ON push_notifications(tenant_id);
CREATE INDEX idx_push_notifications_category ON push_notifications(category);
CREATE INDEX idx_push_notifications_priority ON push_notifications(priority);
CREATE INDEX idx_push_notifications_status ON push_notifications(delivery_status);
CREATE INDEX idx_push_notifications_scheduled ON push_notifications(scheduled_for);
CREATE INDEX idx_push_notifications_created_at ON push_notifications(created_at);
CREATE INDEX idx_push_notifications_type ON push_notifications(notification_type);

-- =====================================================
-- Push Notification Recipients Table
-- =====================================================

CREATE TABLE IF NOT EXISTS push_notification_recipients (
    id SERIAL PRIMARY KEY,
    push_notification_id INTEGER NOT NULL REFERENCES push_notifications(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id INTEGER REFERENCES mobile_devices(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'failed')),
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP,
    action_taken VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_push_recipients_notification ON push_notification_recipients(push_notification_id);
CREATE INDEX idx_push_recipients_user ON push_notification_recipients(user_id);
CREATE INDEX idx_push_recipients_device ON push_notification_recipients(device_id);
CREATE INDEX idx_push_recipients_status ON push_notification_recipients(delivery_status);
CREATE INDEX idx_push_recipients_delivered_at ON push_notification_recipients(delivered_at);

-- =====================================================
-- Push Notification Templates Table
-- =====================================================

CREATE TABLE IF NOT EXISTS push_notification_templates (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    title_template VARCHAR(255) NOT NULL,
    message_template TEXT NOT NULL,
    data_payload_template JSONB,
    action_buttons JSONB,
    priority VARCHAR(20) NOT NULL DEFAULT 'normal',
    sound VARCHAR(50) DEFAULT 'default',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, template_name)
);

CREATE INDEX idx_push_templates_tenant ON push_notification_templates(tenant_id);
CREATE INDEX idx_push_templates_category ON push_notification_templates(category);
CREATE INDEX idx_push_templates_active ON push_notification_templates(is_active);

-- =====================================================
-- SMS Logs Table
-- =====================================================

CREATE TABLE IF NOT EXISTS sms_logs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    from_number VARCHAR(20) NOT NULL,
    body TEXT NOT NULL,
    message_sid VARCHAR(100) UNIQUE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'delivered', 'failed', 'undelivered')),
    error_code VARCHAR(20),
    error_message TEXT,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sms_logs_tenant ON sms_logs(tenant_id);
CREATE INDEX idx_sms_logs_to_number ON sms_logs(to_number);
CREATE INDEX idx_sms_logs_message_sid ON sms_logs(message_sid);
CREATE INDEX idx_sms_logs_status ON sms_logs(status);
CREATE INDEX idx_sms_logs_created_at ON sms_logs(created_at);

-- =====================================================
-- SMS Templates Table
-- =====================================================

CREATE TABLE IF NOT EXISTS sms_templates (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    body TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    variables JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_sms_templates_tenant ON sms_templates(tenant_id);
CREATE INDEX idx_sms_templates_category ON sms_templates(category);
CREATE INDEX idx_sms_templates_active ON sms_templates(is_active);

-- =====================================================
-- Notification Preferences Table
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id INTEGER NOT NULL,
    push_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    categories JSONB DEFAULT '{"critical_alert": true, "maintenance_reminder": true, "task_assignment": true, "driver_alert": true, "administrative": true, "performance": true}'::jsonb,
    quiet_hours_enabled BOOLEAN DEFAULT false,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tenant_id)
);

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX idx_notification_preferences_tenant ON notification_preferences(tenant_id);

-- =====================================================
-- Views for Reporting
-- =====================================================

-- Push notification statistics
CREATE OR REPLACE VIEW push_notification_stats AS
SELECT
    pn.tenant_id,
    pn.category,
    pn.priority,
    DATE(pn.created_at) as date,
    COUNT(*) as total_notifications,
    SUM(pn.total_recipients) as total_recipients,
    SUM(pn.delivered_count) as delivered,
    SUM(pn.opened_count) as opened,
    SUM(pn.clicked_count) as clicked,
    SUM(pn.failed_count) as failed,
    ROUND(AVG(CASE WHEN pn.total_recipients > 0 THEN (pn.delivered_count::float / pn.total_recipients * 100) ELSE 0 END), 2) as delivery_rate,
    ROUND(AVG(CASE WHEN pn.delivered_count > 0 THEN (pn.opened_count::float / pn.delivered_count * 100) ELSE 0 END), 2) as open_rate,
    ROUND(AVG(CASE WHEN pn.opened_count > 0 THEN (pn.clicked_count::float / pn.opened_count * 100) ELSE 0 END), 2) as click_rate
FROM push_notifications pn
GROUP BY pn.tenant_id, pn.category, pn.priority, DATE(pn.created_at);

-- SMS statistics
CREATE OR REPLACE VIEW sms_stats AS
SELECT
    tenant_id,
    DATE(created_at) as date,
    COUNT(*) as total_messages,
    COUNT(*) FILTER (WHERE status = 'sent') as sent,
    COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
    COUNT(*) FILTER (WHERE status = 'failed') as failed,
    ROUND(AVG(CASE WHEN status IN ('sent', 'delivered') THEN 1.0 ELSE 0.0 END) * 100, 2) as success_rate
FROM sms_logs
GROUP BY tenant_id, DATE(created_at);

-- Active devices summary
CREATE OR REPLACE VIEW active_devices_summary AS
SELECT
    md.tenant_id,
    md.platform,
    COUNT(*) as total_devices,
    COUNT(*) FILTER (WHERE md.is_active = true) as active_devices,
    COUNT(*) FILTER (WHERE md.last_active > CURRENT_TIMESTAMP - INTERVAL '24 hours') as active_24h,
    COUNT(*) FILTER (WHERE md.last_active > CURRENT_TIMESTAMP - INTERVAL '7 days') as active_7d,
    COUNT(*) FILTER (WHERE md.last_active > CURRENT_TIMESTAMP - INTERVAL '30 days') as active_30d
FROM mobile_devices md
GROUP BY md.tenant_id, md.platform;

-- =====================================================
-- Triggers
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_push_notifications_updated_at') THEN
        CREATE TRIGGER update_push_notifications_updated_at
        BEFORE UPDATE ON push_notifications
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_push_templates_updated_at') THEN
        CREATE TRIGGER update_push_templates_updated_at
        BEFORE UPDATE ON push_notification_templates
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sms_logs_updated_at') THEN
        CREATE TRIGGER update_sms_logs_updated_at
        BEFORE UPDATE ON sms_logs
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_sms_templates_updated_at') THEN
        CREATE TRIGGER update_sms_templates_updated_at
        BEFORE UPDATE ON sms_templates
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notification_preferences_updated_at') THEN
        CREATE TRIGGER update_notification_preferences_updated_at
        BEFORE UPDATE ON notification_preferences
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- Seed Default Templates
-- =====================================================

-- Push notification templates
INSERT INTO push_notification_templates (tenant_id, template_name, category, title_template, message_template, data_payload_template, action_buttons, priority, sound)
VALUES
    (1, 'maintenance_due', 'maintenance_reminder', 'Maintenance Due: {{vehicleName}}', '{{maintenanceType}} is due on {{dueDate}}', '{"screen": "MaintenanceDetail", "maintenanceId": "{{maintenanceId}}", "vehicleId": "{{vehicleId}}"}'::jsonb, '[{"id": "view", "title": "View Details"}, {"id": "snooze", "title": "Remind Later"}]'::jsonb, 'normal', 'default'),
    (1, 'task_assigned', 'task_assignment', 'New Task Assigned', 'You have been assigned: {{taskTitle}}', '{"screen": "TaskDetail", "taskId": "{{taskId}}"}'::jsonb, '[{"id": "accept", "title": "Accept"}, {"id": "view", "title": "View"}]'::jsonb, 'high', 'default'),
    (1, 'vehicle_alert', 'critical_alert', 'Vehicle Alert: {{vehicleName}}', '{{alertMessage}}', '{"screen": "VehicleDetail", "vehicleId": "{{vehicleId}}"}'::jsonb, '[{"id": "view", "title": "View Details"}, {"id": "acknowledge", "title": "Acknowledge"}]'::jsonb, 'critical', 'urgent'),
    (1, 'inspection_required', 'maintenance_reminder', 'Inspection Required', 'Pre-trip inspection needed for {{vehicleName}}', '{"screen": "InspectionForm", "vehicleId": "{{vehicleId}}"}'::jsonb, '[{"id": "start_inspection", "title": "Start Inspection"}]'::jsonb, 'normal', 'default'),
    (1, 'shift_reminder', 'task_assignment', 'Shift Starting Soon', 'Your shift starts in {{minutesBefore}} minutes', '{"screen": "Schedule"}'::jsonb, '[{"id": "acknowledge", "title": "Got It"}]'::jsonb, 'normal', 'default')
ON CONFLICT (tenant_id, template_name) DO NOTHING;

-- SMS templates
INSERT INTO sms_templates (tenant_id, name, body, category, variables)
VALUES
    (1, 'maintenance_reminder', 'FLEET ALERT: Maintenance due for {{vehicleName}}. {{maintenanceType}} scheduled for {{dueDate}}. Contact dispatch for details.', 'maintenance', '["vehicleName", "maintenanceType", "dueDate"]'::jsonb),
    (1, 'task_assignment', 'FLEET: New task assigned - {{taskTitle}}. Due: {{dueDate}}. Check app for details.', 'task', '["taskTitle", "dueDate"]'::jsonb),
    (1, 'vehicle_alert', 'URGENT: {{vehicleName}} - {{alertMessage}}. Contact dispatch immediately.', 'alert', '["vehicleName", "alertMessage"]'::jsonb),
    (1, 'shift_reminder', 'FLEET: Your shift starts at {{shiftTime}}. Report to {{location}}.', 'schedule', '["shiftTime", "location"]'::jsonb),
    (1, 'inspection_overdue', 'FLEET: Vehicle inspection overdue for {{vehicleName}}. Complete before next trip.', 'compliance', '["vehicleName"]'::jsonb)
ON CONFLICT (tenant_id, name) DO NOTHING;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE push_notifications IS 'Push notifications sent to mobile devices via FCM';
COMMENT ON TABLE push_notification_recipients IS 'Individual recipients of push notifications with delivery tracking';
COMMENT ON TABLE push_notification_templates IS 'Reusable templates for push notifications';
COMMENT ON TABLE sms_logs IS 'SMS messages sent via Twilio with delivery tracking';
COMMENT ON TABLE sms_templates IS 'Reusable templates for SMS messages';
COMMENT ON TABLE notification_preferences IS 'User notification preferences and quiet hours';

-- =====================================================
-- Grant Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO fleetapp;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fleetapp;

-- =====================================================
-- Completion
-- =====================================================

SELECT 'Notification System migration completed successfully!' as status;
