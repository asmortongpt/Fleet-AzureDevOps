BEGIN;

CREATE TABLE IF NOT EXISTS accounting_audit_log (
  id SERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  action TEXT NOT NULL,
  before JSONB,
  after JSONB,
  performed_by TEXT,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON accounting_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_time ON accounting_audit_log(performed_at);

COMMIT;
