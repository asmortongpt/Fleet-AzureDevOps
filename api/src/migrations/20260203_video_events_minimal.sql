-- Minimal video events table for video telematics module
-- Created: 2026-02-03

CREATE TABLE IF NOT EXISTS video_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  event_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
  video_url TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  severity VARCHAR(20),
  notes TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(11, 7),
  address TEXT,
  speed_mph INTEGER,
  ai_confidence DECIMAL(5, 4),
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITHOUT TIME ZONE,
  coaching_assigned BOOLEAN DEFAULT false,
  coaching_assigned_to UUID REFERENCES users(id),
  coaching_status VARCHAR(20) DEFAULT 'pending',
  coaching_notes TEXT,
  retained BOOLEAN DEFAULT true,
  retention_days INTEGER DEFAULT 30,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_events_tenant ON video_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_video_events_vehicle ON video_events(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_video_events_driver ON video_events(driver_id);
CREATE INDEX IF NOT EXISTS idx_video_events_date ON video_events(event_date DESC);
