-- ============================================================================
-- Migration: 20260227_dispatch_radio_system.sql
-- Description: Formalizes the dispatch radio system tables that were manually
--              created in PostgreSQL. Includes channels, transmissions,
--              active listeners, and emergency alerts with tenant isolation.
-- Created: 2026-02-27
-- ============================================================================

-- Drop the old UUID-based dispatch tables if they exist (from 20260204_dispatch_tables_minimal.sql)
-- These are being replaced with serial-PK versions that match the manually-created schema.
DROP TABLE IF EXISTS dispatch_emergency_alerts CASCADE;
DROP TABLE IF EXISTS dispatch_active_listeners CASCADE;
DROP TABLE IF EXISTS dispatch_transmissions CASCADE;
DROP TABLE IF EXISTS dispatch_channels CASCADE;

-- ============================================================================
-- 1. Dispatch Channels
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispatch_channels (
  id            SERIAL PRIMARY KEY,
  tenant_id     UUID NOT NULL,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  channel_type  VARCHAR(50) DEFAULT 'general',
  is_active     BOOLEAN DEFAULT true,
  priority_level INTEGER DEFAULT 5,
  color_code    VARCHAR(20) DEFAULT '#3B82F6',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  created_by    UUID
);

CREATE INDEX IF NOT EXISTS idx_dispatch_channels_tenant
  ON dispatch_channels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_channels_tenant_active
  ON dispatch_channels(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_dispatch_channels_tenant_priority
  ON dispatch_channels(tenant_id, priority_level DESC);

-- ============================================================================
-- 2. Dispatch Transmissions
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispatch_transmissions (
  id                SERIAL PRIMARY KEY,
  tenant_id         UUID NOT NULL,
  channel_id        INTEGER REFERENCES dispatch_channels(id) ON DELETE CASCADE,
  user_id           UUID,
  message           TEXT,
  transmission_type VARCHAR(50) DEFAULT 'voice',
  duration_seconds  INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_transmissions_tenant
  ON dispatch_transmissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_transmissions_channel
  ON dispatch_transmissions(channel_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_transmissions_tenant_created
  ON dispatch_transmissions(tenant_id, created_at DESC);

-- ============================================================================
-- 3. Dispatch Active Listeners
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispatch_active_listeners (
  id          SERIAL PRIMARY KEY,
  tenant_id   UUID NOT NULL,
  channel_id  INTEGER REFERENCES dispatch_channels(id) ON DELETE CASCADE,
  user_id     UUID,
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  is_muted    BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_dispatch_active_listeners_tenant
  ON dispatch_active_listeners(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_active_listeners_channel
  ON dispatch_active_listeners(channel_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_active_listeners_tenant_channel
  ON dispatch_active_listeners(tenant_id, channel_id);

-- ============================================================================
-- 4. Dispatch Emergency Alerts
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispatch_emergency_alerts (
  id              SERIAL PRIMARY KEY,
  tenant_id       UUID NOT NULL,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  severity        VARCHAR(20) DEFAULT 'high',
  status          VARCHAR(20) DEFAULT 'active',
  location_lat    DECIMAL(10,6),
  location_lng    DECIMAL(10,6),
  reported_by     UUID,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  resolved_by     UUID,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_emergency_alerts_tenant
  ON dispatch_emergency_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_emergency_alerts_tenant_status
  ON dispatch_emergency_alerts(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_dispatch_emergency_alerts_tenant_created
  ON dispatch_emergency_alerts(tenant_id, created_at DESC);

-- ============================================================================
-- 5. Seed Data — Dev tenant default channels
-- ============================================================================

INSERT INTO dispatch_channels (tenant_id, name, description, channel_type, priority_level, color_code)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Main Dispatch',  'Primary dispatch and coordination channel',  'general',     5,  '#3B82F6'),
  ('11111111-1111-1111-1111-111111111111', 'Emergency',      'Emergency and high-priority communications', 'emergency',   10, '#EF4444'),
  ('11111111-1111-1111-1111-111111111111', 'Maintenance',    'Maintenance operations and support',         'maintenance', 3,  '#F59E0B'),
  ('11111111-1111-1111-1111-111111111111', 'Operations',     'Field operations and logistics',             'operations',  5,  '#10B981')
ON CONFLICT DO NOTHING;
