-- ============================================================================
-- Create security_events table
-- Migration was defined in 20260203_demo_connections.sql but never applied
-- ============================================================================

BEGIN;

-- Create the table
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL,  -- low, medium, high, critical
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_security_events_tenant ON security_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_event_type ON security_events(event_type);

-- Enable RLS
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- RLS policy for tenant isolation
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'security_events' AND policyname = 'tenant_isolation'
    ) THEN
        CREATE POLICY tenant_isolation ON security_events
            USING (tenant_id::text = current_setting('app.current_tenant_id', true));
    END IF;
END $$;

-- Seed sample data for the dev tenant
DO $$
DECLARE
    tenant_id_var UUID := '12345678-1234-1234-1234-123456789012';
BEGIN
    IF (SELECT COUNT(*) FROM security_events WHERE tenant_id = tenant_id_var) = 0 THEN
        INSERT INTO security_events (tenant_id, event_type, severity, message, metadata, created_at)
        VALUES
            (tenant_id_var, 'login', 'low', 'User login successful', '{"source":"web","user":"admin@mortontech.com"}'::jsonb, NOW() - INTERVAL '30 minutes'),
            (tenant_id_var, 'login', 'low', 'User login successful', '{"source":"mobile","user":"driver1@mortontech.com"}'::jsonb, NOW() - INTERVAL '1 hour'),
            (tenant_id_var, 'login_failed', 'medium', 'Failed login attempt - invalid credentials', '{"source":"web","ip":"192.168.1.45","attempts":3}'::jsonb, NOW() - INTERVAL '2 hours'),
            (tenant_id_var, 'policy_change', 'medium', 'Policy configuration updated', '{"policy":"Speed Limit Enforcement","changed_by":"admin"}'::jsonb, NOW() - INTERVAL '4 hours'),
            (tenant_id_var, 'access_denied', 'high', 'Unauthorized access attempt blocked', '{"ip":"10.0.0.55","path":"/api/admin/users","method":"DELETE"}'::jsonb, NOW() - INTERVAL '6 hours'),
            (tenant_id_var, 'role_change', 'medium', 'User role updated from User to Manager', '{"user":"fleet-mgr@mortontech.com","old_role":"User","new_role":"Manager"}'::jsonb, NOW() - INTERVAL '12 hours'),
            (tenant_id_var, 'api_key_created', 'medium', 'New API key generated', '{"key_name":"Telematics Integration","created_by":"admin"}'::jsonb, NOW() - INTERVAL '1 day'),
            (tenant_id_var, 'session_expired', 'low', 'Session expired due to inactivity', '{"user":"dispatcher@mortontech.com","duration":"30m"}'::jsonb, NOW() - INTERVAL '1 day 3 hours'),
            (tenant_id_var, 'data_export', 'medium', 'Fleet data exported to CSV', '{"table":"vehicles","rows":50,"exported_by":"admin"}'::jsonb, NOW() - INTERVAL '2 days'),
            (tenant_id_var, 'brute_force_detected', 'critical', 'Brute force login attempt detected and blocked', '{"ip":"203.0.113.42","attempts":15,"blocked":true}'::jsonb, NOW() - INTERVAL '2 days 6 hours'),
            (tenant_id_var, 'mfa_disabled', 'high', 'Multi-factor authentication disabled for user', '{"user":"tech@mortontech.com","disabled_by":"admin"}'::jsonb, NOW() - INTERVAL '3 days'),
            (tenant_id_var, 'permission_change', 'medium', 'Permission group updated', '{"group":"Fleet Managers","added":["vehicle:delete"],"removed":[]}'::jsonb, NOW() - INTERVAL '3 days 12 hours'),
            (tenant_id_var, 'login', 'low', 'User login successful via SSO', '{"source":"azure_ad","user":"ops@mortontech.com"}'::jsonb, NOW() - INTERVAL '4 days'),
            (tenant_id_var, 'suspicious_activity', 'high', 'Unusual API usage pattern detected', '{"user":"api-service","requests_per_minute":250,"threshold":100}'::jsonb, NOW() - INTERVAL '5 days'),
            (tenant_id_var, 'firewall_rule_change', 'high', 'IP whitelist updated', '{"added":["10.0.1.0/24"],"removed":["192.168.50.0/24"],"changed_by":"admin"}'::jsonb, NOW() - INTERVAL '6 days'),
            (tenant_id_var, 'backup_completed', 'low', 'Database backup completed successfully', '{"size_mb":1250,"duration_seconds":45,"storage":"azure_blob"}'::jsonb, NOW() - INTERVAL '7 days'),
            (tenant_id_var, 'certificate_expiring', 'high', 'SSL certificate expiring in 14 days', '{"domain":"api.fleet.mortontech.com","expires":"2026-03-06"}'::jsonb, NOW() - INTERVAL '7 days 12 hours'),
            (tenant_id_var, 'access_denied', 'high', 'Unauthorized attempt to access admin panel', '{"ip":"10.0.0.99","user":"readonly@mortontech.com","path":"/admin"}'::jsonb, NOW() - INTERVAL '8 days'),
            (tenant_id_var, 'config_change', 'medium', 'System configuration updated', '{"setting":"session_timeout","old":"30m","new":"15m"}'::jsonb, NOW() - INTERVAL '10 days'),
            (tenant_id_var, 'login', 'low', 'User login successful', '{"source":"web","user":"maintenance@mortontech.com"}'::jsonb, NOW() - INTERVAL '12 days');
    END IF;
END $$;

COMMIT;
