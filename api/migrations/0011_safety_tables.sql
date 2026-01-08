-- Safety Scoring Tables Migration
-- Feature 2: Driver Behavior & Safety Scoring

-- Create driver_behavior_events table
CREATE TABLE IF NOT EXISTS driver_behavior_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  value DECIMAL(10, 2) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create driver_safety_scores table
CREATE TABLE IF NOT EXISTS driver_safety_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  period VARCHAR(20) NOT NULL,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  total_events INTEGER NOT NULL,
  event_breakdown JSONB NOT NULL,
  miles_driven DECIMAL(10, 2) NOT NULL,
  hours_driven DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(driver_id, period, period_start)
);

-- Create safety_scoring_configs table
CREATE TABLE IF NOT EXISTS safety_scoring_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  weights JSONB NOT NULL,
  thresholds JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes
CREATE INDEX idx_behavior_events_driver_id ON driver_behavior_events(driver_id);
CREATE INDEX idx_behavior_events_timestamp ON driver_behavior_events(timestamp);
CREATE INDEX idx_behavior_events_driver_timestamp ON driver_behavior_events(driver_id, timestamp DESC);
CREATE INDEX idx_safety_scores_driver_id ON driver_safety_scores(driver_id);
CREATE INDEX idx_safety_scores_period ON driver_safety_scores(period);
