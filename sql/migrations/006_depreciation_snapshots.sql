BEGIN;

CREATE TABLE IF NOT EXISTS asset_depreciation_snapshots (
  id SERIAL PRIMARY KEY,
  accounting_period_id INTEGER NOT NULL REFERENCES accounting_periods(id) ON DELETE CASCADE,
  asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  component_id INTEGER REFERENCES asset_components(id) ON DELETE SET NULL,
  cost_basis NUMERIC(12,2) NOT NULL,
  accumulated_depreciation NUMERIC(12,2) NOT NULL,
  depreciation_for_period NUMERIC(12,2) NOT NULL,
  net_book_value NUMERIC(12,2) NOT NULL,
  method TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_snapshot_nbv_nonnegative CHECK (net_book_value >= 0)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_asset_period ON asset_depreciation_snapshots(asset_id, accounting_period_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_component_period ON asset_depreciation_snapshots(component_id, accounting_period_id);

COMMIT;
