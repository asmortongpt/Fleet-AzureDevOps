
CREATE TABLE IF NOT EXISTS scan_sessions (
  id UUID PRIMARY KEY,
  vehicle_id UUID NOT NULL,
  capture_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  raw_assets JSONB NOT NULL DEFAULT '[]'::jsonb,
  processed_assets JSONB NOT NULL DEFAULT '[]'::jsonb,
  quality JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_sessions_vehicle_created ON scan_sessions(vehicle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_status ON scan_sessions(status);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_raw_assets_gin ON scan_sessions USING GIN (raw_assets);
