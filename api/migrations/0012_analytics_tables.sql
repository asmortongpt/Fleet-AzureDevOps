-- Analytics Tables Migration
-- Feature 3: CPM & TCO Analytics

-- Create asset_cost_snapshots table
CREATE TABLE IF NOT EXISTS asset_cost_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  fuel_cost DECIMAL(10, 2) NOT NULL,
  maintenance_cost DECIMAL(10, 2) NOT NULL,
  labor_cost DECIMAL(10, 2) NOT NULL,
  parts_cost DECIMAL(10, 2) NOT NULL,
  miles_driven DECIMAL(10, 2) NOT NULL,
  cpm DECIMAL(10, 4) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  breakdown JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(asset_id, period_start, period_end)
);

-- Create indexes
CREATE INDEX idx_cost_snapshots_asset_id ON asset_cost_snapshots(asset_id);
CREATE INDEX idx_cost_snapshots_period ON asset_cost_snapshots(period_start, period_end);
