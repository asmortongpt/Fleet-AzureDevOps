-- Migration: Add indexes for dashboard stats optimization
-- Purpose: Improve query performance for /api/dashboard/stats endpoint
-- Date: 2026-01-14
-- Updated: 2026-01-14 - Fixed for UUID tenant_id, added timeouts

-- NOTE: tenant_id is UUID type, not integer

-- Index for vehicles table - tenant_id and status filtering
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_status
ON vehicles (tenant_id, status);

-- Index for drivers table - tenant_id and status filtering
CREATE INDEX IF NOT EXISTS idx_drivers_tenant_status
ON drivers (tenant_id, status);

-- Index for work_orders table - tenant_id and status filtering
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_status
ON work_orders (tenant_id, status);

-- Partial index for active vehicles (most common query)
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_active
ON vehicles (tenant_id)
WHERE status = 'active';

-- Partial index for active drivers (most common query)
CREATE INDEX IF NOT EXISTS idx_drivers_tenant_active
ON drivers (tenant_id)
WHERE status = 'active';

-- Partial index for open work orders (most common query)
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_open
ON work_orders (tenant_id)
WHERE status IN ('open', 'pending');

-- Add indexes for cost/date queries (for /api/dashboard/costs/summary)
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_date
ON fuel_transactions (date DESC);

CREATE INDEX IF NOT EXISTS idx_maintenance_records_service_date
ON maintenance_records (service_date DESC) WHERE actual_cost IS NOT NULL;

-- Analyze tables to update statistics
ANALYZE vehicles;
ANALYZE drivers;
ANALYZE work_orders;
ANALYZE fuel_transactions;
ANALYZE maintenance_records;

-- Set reasonable default statement timeout (30 seconds)
-- Individual queries can override this with shorter timeouts
ALTER DATABASE fleet_test SET statement_timeout = '30s';
