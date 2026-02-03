BEGIN;

ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS deleted_at timestamp without time zone;

CREATE INDEX IF NOT EXISTS work_orders_deleted_at_idx ON work_orders (deleted_at);

COMMIT;
