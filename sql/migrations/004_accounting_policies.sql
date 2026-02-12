BEGIN;

CREATE TABLE IF NOT EXISTS accounting_policies (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Example policy rows (edit as needed)
INSERT INTO accounting_policies(key, value, description)
VALUES
  ('capitalization_threshold', '{"amount": 2500, "currency":"USD"}', 'Items below this may be expensed unless policy overrides'),
  ('depreciation_convention', '{"type":"FULL_MONTH"}', 'Convention for partial months (FULL_MONTH, HALF_MONTH, ACTUAL_DAYS)')
ON CONFLICT (key) DO NOTHING;

COMMIT;
