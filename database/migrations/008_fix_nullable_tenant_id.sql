-- Migration to make tenant_id NOT NULL in relevant tables
-- This migration updates existing NULL values with the first tenant_id and sets the column to NOT NULL

-- Ensure there is at least one tenant in the tenants table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tenants LIMIT 1) THEN
        RAISE EXCEPTION 'No tenants found in the tenants table. Please ensure at least one tenant exists before running this migration.';
    END IF;
END $$;

-- Fix drivers table
UPDATE drivers
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE drivers ALTER COLUMN tenant_id SET NOT NULL;

-- Fix fuel_transactions table
UPDATE fuel_transactions
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE fuel_transactions ALTER COLUMN tenant_id SET NOT NULL;

-- Fix work_orders table
UPDATE work_orders
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE work_orders ALTER COLUMN tenant_id SET NOT NULL;