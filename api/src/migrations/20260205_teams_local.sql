-- ============================================================================
-- Migration: 20260205_teams_local.sql
-- Description: Local Teams-like channels/messages for demo/offline mode
-- ============================================================================

CREATE TABLE IF NOT EXISTS teams_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  channel_id VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, team_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_teams_channels_tenant_team ON teams_channels(tenant_id, team_id);

CREATE TABLE IF NOT EXISTS teams_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  channel_id VARCHAR(255) NOT NULL,
  message_id VARCHAR(255) NOT NULL,
  sender_name VARCHAR(255),
  body TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, team_id, channel_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_teams_messages_tenant_team_channel_time ON teams_messages(tenant_id, team_id, channel_id, sent_at DESC);

-- Seed baseline "General" channel per team (DB-backed, idempotent).
INSERT INTO teams_channels (tenant_id, team_id, channel_id, display_name, description)
SELECT t.tenant_id, t.id, 'general', 'General', 'Operational updates and coordination'
FROM teams t
WHERE t.is_active = true
ON CONFLICT (tenant_id, team_id, channel_id) DO NOTHING;

-- Seed a small set of messages from existing operational data (dispatches/work orders),
-- so the UI has non-empty drilldowns without hardcoded frontend mocks.
INSERT INTO teams_messages (tenant_id, team_id, channel_id, message_id, sender_name, body, sent_at, metadata)
SELECT
  tm.tenant_id,
  tm.id AS team_id,
  'general' AS channel_id,
  CONCAT('dispatch:', d.id::text) AS message_id,
  'Dispatch System' AS sender_name,
  CONCAT(
    'Dispatch ',
    COALESCE(d.type, 'request'),
    ' for vehicle ',
    COALESCE(v.number, v.name, d.vehicle_id::text),
    ' status ',
    d.status::text
  ) AS body,
  d.dispatched_at AS sent_at,
  jsonb_build_object('source', 'dispatches', 'dispatch_id', d.id)
FROM teams tm
JOIN dispatches d ON d.tenant_id = tm.tenant_id
LEFT JOIN vehicles v ON v.id = d.vehicle_id
WHERE tm.is_active = true
ORDER BY d.dispatched_at DESC NULLS LAST
LIMIT 50
ON CONFLICT (tenant_id, team_id, channel_id, message_id) DO NOTHING;

INSERT INTO teams_messages (tenant_id, team_id, channel_id, message_id, sender_name, body, sent_at, metadata)
SELECT
  t.tenant_id,
  t.id AS team_id,
  'general' AS channel_id,
  CONCAT('workorder:', w.id::text) AS message_id,
  'Maintenance System' AS sender_name,
  CONCAT(
    'Work Order ',
    COALESCE(w.work_order_number, w.id::text),
    ' (',
    w.status::text,
    ') for vehicle ',
    COALESCE(v.number, v.name, w.vehicle_id::text)
  ) AS body,
  COALESCE(w.updated_at, w.created_at) AS sent_at,
  jsonb_build_object('source', 'work_orders', 'work_order_id', w.id)
FROM teams t
JOIN work_orders w ON w.tenant_id = t.tenant_id
LEFT JOIN vehicles v ON v.id = w.vehicle_id
WHERE t.is_active = true
ORDER BY COALESCE(w.updated_at, w.created_at) DESC NULLS LAST
LIMIT 50
ON CONFLICT (tenant_id, team_id, channel_id, message_id) DO NOTHING;

