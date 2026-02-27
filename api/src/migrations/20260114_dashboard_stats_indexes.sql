-- Migration: Add indexes for dashboard stats optimization
-- Purpose: Improve query performance for /api/dashboard/stats endpoint
-- Date: 2026-01-14
-- Updated: 2026-01-14 - Fixed for UUID tenant_id, added timeouts
-- Updated: 2026-02-17 - Fixed enum values, table names, and conditional operations

-- NOTE: tenant_id is UUID type, not integer

-- Index for vehicles table - tenant_id and status filtering
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='tenant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_status ON vehicles (tenant_id, status);
  END IF;
END $$;

-- Index for drivers table - tenant_id and status filtering
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='tenant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_tenant_status ON drivers (tenant_id, status);
  END IF;
END $$;

-- Index for work_orders table - tenant_id and status filtering
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='tenant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_status ON work_orders (tenant_id, status);
  END IF;
END $$;

-- Partial index for active vehicles (most common query)
-- vehicles.status uses the vehicle_status enum type
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vehicles' AND column_name='tenant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_active ON vehicles (tenant_id) WHERE status = 'active';
  END IF;
END $$;

-- Partial index for active drivers (most common query)
-- drivers.status uses the driver_status enum type
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='drivers' AND column_name='tenant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_tenant_active ON drivers (tenant_id) WHERE status = 'active';
  END IF;
END $$;

-- Partial index for pending/in_progress work orders (most common query)
-- work_orders.status uses the status enum type: pending, in_progress, completed, cancelled, on_hold, failed
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='work_orders' AND column_name='tenant_id') THEN
    CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_open ON work_orders (tenant_id) WHERE status IN ('pending', 'in_progress');
  END IF;
END $$;

-- Add indexes for cost/date queries (for /api/dashboard/costs/summary)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fuel_transactions' AND column_name='date') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_transactions_date ON fuel_transactions (date DESC);
  END IF;
END $$;

-- Use 'maintenance' table (not 'maintenance_records')
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='maintenance') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='maintenance' AND column_name='scheduled_date') THEN
      CREATE INDEX IF NOT EXISTS idx_maintenance_scheduled_date_desc ON maintenance (scheduled_date DESC);
    END IF;
  END IF;
END $$;

-- Analyze tables to update statistics
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='vehicles') THEN
    ANALYZE vehicles;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='drivers') THEN
    ANALYZE drivers;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='work_orders') THEN
    ANALYZE work_orders;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='fuel_transactions') THEN
    ANALYZE fuel_transactions;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='maintenance') THEN
    ANALYZE maintenance;
  END IF;
END $$;
