BEGIN;

CREATE TABLE IF NOT EXISTS useful_life_rules (
  id SERIAL PRIMARY KEY,
  category TEXT NOT NULL,
  min_months INTEGER NOT NULL,
  max_months INTEGER NOT NULL,
  default_months INTEGER NOT NULL,
  default_method TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
  notes TEXT,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_useful_life_range CHECK (min_months > 0 AND max_months >= min_months),
  CONSTRAINT chk_default_in_range CHECK (default_months BETWEEN min_months AND max_months)
);

CREATE INDEX IF NOT EXISTS idx_useful_life_rules_category ON useful_life_rules(category);

COMMIT;
