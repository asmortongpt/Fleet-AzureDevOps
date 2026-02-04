-- Migration: Minimal dispatch radio tables (tenant-safe)
-- Created: 2026-02-04
-- Purpose: Back the dispatch console with real DB tables (no mocks).

-- ============================================================================
-- Dispatch Channels
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispatch_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  channel_type VARCHAR(50) NOT NULL DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority_level INTEGER NOT NULL DEFAULT 5,
  color_code VARCHAR(20),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  CONSTRAINT dispatch_channels_priority_range CHECK (priority_level BETWEEN 1 AND 10),
  CONSTRAINT dispatch_channels_tenant_name_unique UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_dispatch_channels_tenant ON dispatch_channels(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_channels_active ON dispatch_channels(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_dispatch_channels_priority ON dispatch_channels(tenant_id, priority_level DESC);

-- ============================================================================
-- Active Listeners
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispatch_active_listeners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES dispatch_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connection_id VARCHAR(255) NOT NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_type VARCHAR(50) DEFAULT 'web',
  device_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT dispatch_active_listeners_unique UNIQUE (tenant_id, channel_id, user_id, connection_id)
);

CREATE INDEX IF NOT EXISTS idx_dispatch_active_listeners_tenant_channel ON dispatch_active_listeners(tenant_id, channel_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_active_listeners_heartbeat ON dispatch_active_listeners(tenant_id, last_heartbeat DESC);

-- ============================================================================
-- Dispatch Transmissions (history / playback metadata)
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispatch_transmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES dispatch_channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  transmission_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  transmission_end TIMESTAMPTZ,
  duration_seconds NUMERIC(10,2),
  audio_blob_url TEXT,
  audio_format VARCHAR(20) NOT NULL DEFAULT 'opus',
  is_emergency BOOLEAN NOT NULL DEFAULT false,
  location_lat NUMERIC(10,7),
  location_lng NUMERIC(10,7),
  message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_transmissions_tenant_channel_time ON dispatch_transmissions(tenant_id, channel_id, transmission_start DESC);
CREATE INDEX IF NOT EXISTS idx_dispatch_transmissions_tenant_time ON dispatch_transmissions(tenant_id, transmission_start DESC);

-- ============================================================================
-- Emergency Alerts
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispatch_emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  alert_type VARCHAR(50) NOT NULL,
  alert_status VARCHAR(50) NOT NULL DEFAULT 'active',
  location_lat NUMERIC(10,7),
  location_lng NUMERIC(10,7),
  location_address TEXT,
  description TEXT,
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispatch_emergency_alerts_tenant_status ON dispatch_emergency_alerts(tenant_id, alert_status);
CREATE INDEX IF NOT EXISTS idx_dispatch_emergency_alerts_tenant_created ON dispatch_emergency_alerts(tenant_id, created_at DESC);

-- ============================================================================
-- Seed Default Channels (per-tenant)
-- ============================================================================

DO $$
DECLARE
  t RECORD;
BEGIN
  FOR t IN SELECT id FROM tenants LOOP
    INSERT INTO dispatch_channels (tenant_id, name, description, channel_type, priority_level, color_code)
    VALUES
      (t.id, 'Main Dispatch', 'Primary dispatch and coordination channel', 'general', 5, '#3B82F6'),
      (t.id, 'Emergency', 'Emergency and high-priority communications', 'emergency', 10, '#EF4444'),
      (t.id, 'Maintenance', 'Maintenance operations and support', 'maintenance', 6, '#F59E0B'),
      (t.id, 'Operations', 'Field operations and logistics', 'operations', 4, '#10B981')
    ON CONFLICT (tenant_id, name) DO NOTHING;
  END LOOP;
END $$;

