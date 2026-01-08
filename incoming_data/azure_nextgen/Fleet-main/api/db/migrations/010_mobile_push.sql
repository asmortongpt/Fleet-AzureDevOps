-- Mobile Push Notification Infrastructure
-- Migration: 010_mobile_push.sql

-- Mobile devices table for storing registered devices
CREATE TABLE mobile_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL UNIQUE,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android')),
    device_name VARCHAR(255),
    device_model VARCHAR(100),
    os_version VARCHAR(50),
    app_version VARCHAR(50),
    last_active TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_device UNIQUE (user_id, device_token)
);

-- Push notifications table for tracking all sent notifications
CREATE TABLE push_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'critical_alert',
        'maintenance_reminder',
        'task_assignment',
        'driver_alert',
        'administrative',
        'performance'
    )),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data_payload JSONB DEFAULT '{}',
    action_buttons JSONB DEFAULT '[]',
    image_url TEXT,
    sound VARCHAR(50) DEFAULT 'default',
    badge_count INTEGER DEFAULT 1,
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN (
        'pending',
        'scheduled',
        'sending',
        'sent',
        'failed',
        'cancelled'
    )),
    total_recipients INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Push notification recipients for tracking individual deliveries
CREATE TABLE push_notification_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    push_notification_id UUID NOT NULL REFERENCES push_notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id UUID REFERENCES mobile_devices(id) ON DELETE SET NULL,
    device_token TEXT,
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN (
        'pending',
        'sent',
        'delivered',
        'failed',
        'expired'
    )),
    error_message TEXT,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    action_taken VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Push notification templates for reusable notification formats
CREATE TABLE push_notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    data_payload_template JSONB DEFAULT '{}',
    action_buttons JSONB DEFAULT '[]',
    priority VARCHAR(20) DEFAULT 'normal',
    sound VARCHAR(50) DEFAULT 'default',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_template_name UNIQUE (tenant_id, template_name)
);

-- Notification preferences for users
CREATE TABLE push_notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_category UNIQUE (user_id, category)
);

-- Indexes for performance optimization
CREATE INDEX idx_mobile_devices_user ON mobile_devices(user_id);
CREATE INDEX idx_mobile_devices_tenant ON mobile_devices(tenant_id);
CREATE INDEX idx_mobile_devices_token ON mobile_devices(device_token);
CREATE INDEX idx_mobile_devices_active ON mobile_devices(is_active) WHERE is_active = true;
CREATE INDEX idx_mobile_devices_platform ON mobile_devices(platform);

CREATE INDEX idx_push_notifications_tenant ON push_notifications(tenant_id);
CREATE INDEX idx_push_notifications_status ON push_notifications(delivery_status);
CREATE INDEX idx_push_notifications_scheduled ON push_notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX idx_push_notifications_category ON push_notifications(category);
CREATE INDEX idx_push_notifications_created ON push_notifications(created_at DESC);

CREATE INDEX idx_push_recipients_notification ON push_notification_recipients(push_notification_id);
CREATE INDEX idx_push_recipients_user ON push_notification_recipients(user_id);
CREATE INDEX idx_push_recipients_device ON push_notification_recipients(device_id);
CREATE INDEX idx_push_recipients_status ON push_notification_recipients(delivery_status);

CREATE INDEX idx_push_templates_tenant ON push_notification_templates(tenant_id);
CREATE INDEX idx_push_templates_category ON push_notification_templates(category);
CREATE INDEX idx_push_templates_active ON push_notification_templates(is_active) WHERE is_active = true;

CREATE INDEX idx_push_preferences_user ON push_notification_preferences(user_id);

-- Insert default notification templates
INSERT INTO push_notification_templates (tenant_id, template_name, category, title_template, message_template, data_payload_template, action_buttons, priority, sound) VALUES
-- Critical Alerts
((SELECT id FROM tenants LIMIT 1), 'vehicle_breakdown', 'critical_alert',
 'Vehicle Breakdown: {{vehicleId}}',
 'Vehicle {{vehicleId}} has broken down at {{location}}. Immediate attention required.',
 '{"type": "vehicle_breakdown", "vehicleId": "{{vehicleId}}", "location": "{{location}}"}',
 '[{"id": "acknowledge", "title": "Acknowledge"}, {"id": "view", "title": "View Details"}, {"id": "dispatch", "title": "Dispatch Help"}]',
 'critical', 'alert'),

((SELECT id FROM tenants LIMIT 1), 'accident_alert', 'critical_alert',
 'Accident Alert: {{vehicleId}}',
 'Vehicle {{vehicleId}} involved in accident. Driver status: {{driverStatus}}',
 '{"type": "accident", "vehicleId": "{{vehicleId}}", "severity": "{{severity}}"}',
 '[{"id": "acknowledge", "title": "Acknowledge"}, {"id": "view", "title": "View Details"}, {"id": "call_driver", "title": "Call Driver"}]',
 'critical', 'alert'),

-- Maintenance Reminders
((SELECT id FROM tenants LIMIT 1), 'maintenance_due', 'maintenance_reminder',
 'Maintenance Due: {{vehicleId}}',
 'Vehicle {{vehicleId}} maintenance is due in {{days}} days. Schedule service soon.',
 '{"type": "maintenance_due", "vehicleId": "{{vehicleId}}", "maintenanceType": "{{maintenanceType}}"}',
 '[{"id": "schedule", "title": "Schedule Now"}, {"id": "view", "title": "View Details"}, {"id": "dismiss", "title": "Dismiss"}]',
 'normal', 'default'),

((SELECT id FROM tenants LIMIT 1), 'inspection_reminder', 'maintenance_reminder',
 'Inspection Reminder: {{vehicleId}}',
 'Vehicle {{vehicleId}} inspection is scheduled for {{date}}',
 '{"type": "inspection", "vehicleId": "{{vehicleId}}", "date": "{{date}}"}',
 '[{"id": "confirm", "title": "Confirm"}, {"id": "reschedule", "title": "Reschedule"}]',
 'normal', 'default'),

-- Task Assignments
((SELECT id FROM tenants LIMIT 1), 'task_assigned', 'task_assignment',
 'New Task Assigned: {{taskTitle}}',
 'You have been assigned: {{taskTitle}}. Priority: {{priority}}',
 '{"type": "task_assigned", "taskId": "{{taskId}}", "priority": "{{priority}}"}',
 '[{"id": "accept", "title": "Accept"}, {"id": "view", "title": "View Details"}]',
 'normal', 'default'),

((SELECT id FROM tenants LIMIT 1), 'task_updated', 'task_assignment',
 'Task Updated: {{taskTitle}}',
 'Task {{taskTitle}} has been updated. Check new details.',
 '{"type": "task_updated", "taskId": "{{taskId}}"}',
 '[{"id": "view", "title": "View Details"}]',
 'normal', 'default'),

-- Driver Alerts
((SELECT id FROM tenants LIMIT 1), 'route_change', 'driver_alert',
 'Route Change: {{routeName}}',
 'Your route has been changed. New destination: {{destination}}',
 '{"type": "route_change", "routeId": "{{routeId}}", "destination": "{{destination}}"}',
 '[{"id": "acknowledge", "title": "Got It"}, {"id": "view_map", "title": "View Map"}]',
 'high', 'default'),

((SELECT id FROM tenants LIMIT 1), 'weather_alert', 'driver_alert',
 'Weather Alert: {{alertType}}',
 '{{alertType}} warning along your route. Drive safely.',
 '{"type": "weather_alert", "severity": "{{severity}}"}',
 '[{"id": "acknowledge", "title": "Acknowledge"}]',
 'high', 'alert'),

-- Administrative
((SELECT id FROM tenants LIMIT 1), 'policy_update', 'administrative',
 'Policy Update: {{policyName}}',
 'New policy update: {{policyName}}. Please review.',
 '{"type": "policy_update", "policyId": "{{policyId}}"}',
 '[{"id": "view", "title": "View Policy"}, {"id": "dismiss", "title": "Dismiss"}]',
 'low', 'default'),

-- Performance
((SELECT id FROM tenants LIMIT 1), 'scorecard_update', 'performance',
 'Scorecard Updated',
 'Your driver scorecard has been updated. Overall score: {{score}}',
 '{"type": "scorecard_update", "score": "{{score}}"}',
 '[{"id": "view", "title": "View Scorecard"}]',
 'low', 'default');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_push_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_mobile_devices_updated_at
    BEFORE UPDATE ON mobile_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_push_notification_updated_at();

CREATE TRIGGER update_push_notifications_updated_at
    BEFORE UPDATE ON push_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_push_notification_updated_at();

CREATE TRIGGER update_push_recipients_updated_at
    BEFORE UPDATE ON push_notification_recipients
    FOR EACH ROW
    EXECUTE FUNCTION update_push_notification_updated_at();

CREATE TRIGGER update_push_templates_updated_at
    BEFORE UPDATE ON push_notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_push_notification_updated_at();

CREATE TRIGGER update_push_preferences_updated_at
    BEFORE UPDATE ON push_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_push_notification_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON mobile_devices TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON push_notifications TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON push_notification_recipients TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON push_notification_templates TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON push_notification_preferences TO fleet_user;

-- Comments
COMMENT ON TABLE mobile_devices IS 'Stores registered mobile devices for push notifications';
COMMENT ON TABLE push_notifications IS 'Tracks all push notifications sent through the system';
COMMENT ON TABLE push_notification_recipients IS 'Individual delivery tracking for each notification recipient';
COMMENT ON TABLE push_notification_templates IS 'Reusable notification templates for common scenarios';
COMMENT ON TABLE push_notification_preferences IS 'User preferences for push notification delivery';
