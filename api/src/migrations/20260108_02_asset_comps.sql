BEGIN;

CREATE TABLE IF NOT EXISTS asset_components (
  id SERIAL PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  installed_date DATE NOT NULL,
  depreciation_start_date DATE NOT NULL,
  cost_basis NUMERIC(12,2) NOT NULL DEFAULT 0,
  salvage_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  useful_life_months INTEGER NOT NULL DEFAULT 60,
  depreciation_method TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
  disposed_date DATE,
  disposed_amount NUMERIC(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_components_asset_id ON asset_components(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_components_active ON asset_components(asset_id, disposed_date);

ALTER TABLE asset_components
  ADD CONSTRAINT chk_cost_basis_nonnegative CHECK (cost_basis >= 0),
  ADD CONSTRAINT chk_salvage_nonnegative CHECK (salvage_value >= 0),
  ADD CONSTRAINT chk_life_positive CHECK (useful_life_months > 0),
  ADD CONSTRAINT chk_salvage_lte_cost CHECK (salvage_value <= cost_basis),
  ADD CONSTRAINT chk_disposed_amount_nonnegative CHECK (disposed_amount IS NULL OR disposed_amount >= 0),
  ADD CONSTRAINT chk_disposed_date_after_install CHECK (disposed_date IS NULL OR disposed_date >= installed_date),
  ADD CONSTRAINT chk_dep_start_after_install CHECK (depreciation_start_date >= installed_date);

COMMIT;
