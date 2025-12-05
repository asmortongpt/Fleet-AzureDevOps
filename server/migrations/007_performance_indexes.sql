-- Composite index for common filters
CREATE INDEX CONCURRENTLY idx_tasks_tenant_status_created
ON tasks(tenant_id, status, created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_tasks_tenant_assigned_status
ON tasks(tenant_id, assigned_to, status)
WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY idx_tasks_tenant_vehicle_date
ON tasks(tenant_id, vehicle_id, date)
WHERE deleted_at IS NULL;

-- Partial index for active tasks
CREATE INDEX CONCURRENTLY idx_tasks_active
ON tasks(tenant_id, id)
WHERE status = 'active' AND deleted_at IS NULL;

-- GIN index for JSONB metadata
CREATE INDEX CONCURRENTLY idx_tasks_metadata_gin
ON tasks USING GIN(metadata jsonb_path_ops);

-- Full-text search index
CREATE INDEX CONCURRENTLY idx_tasks_search
ON tasks USING GIN(to_tsvector('english', title || ' ' || description));

-- Analyze tables to update statistics
ANALYZE tasks;

-- Index size monitoring
SELECT
  indexrelid::regclass AS index_name,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM
  pg_index
WHERE
  indrelid = 'tasks'::regclass;

-- EXPLAIN ANALYZE validation
EXPLAIN ANALYZE
SELECT *
FROM tasks
WHERE tenant_id = 1 AND status = 'open' AND created_at > NOW() - INTERVAL '30 days';

EXPLAIN ANALYZE
SELECT *
FROM tasks
WHERE tenant_id = 1 AND assigned_to = 42 AND status = 'in_progress';

EXPLAIN ANALYZE
SELECT *
FROM tasks
WHERE tenant_id = 1 AND vehicle_id = 101 AND date = CURRENT_DATE;

EXPLAIN ANALYZE
SELECT *
FROM tasks
WHERE tenant_id = 1 AND status = 'active';

EXPLAIN ANALYZE
SELECT *
FROM tasks
WHERE metadata @> '{"key": "value"}';

EXPLAIN ANALYZE
SELECT *
FROM tasks
WHERE to_tsvector('english', title || ' ' || description) @@ to_tsquery('english', 'search_term');