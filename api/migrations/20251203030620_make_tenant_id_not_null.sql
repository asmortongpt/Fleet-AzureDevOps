-- Multi-Tenancy Database Schema Fixes
-- Auto-generated migration

-- Make tenant_id NOT NULL in drivers
-- First, set default tenant_id for existing rows (MANUAL REVIEW REQUIRED)
-- UPDATE drivers SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE drivers ALTER COLUMN tenant_id SET NOT NULL;

-- Make tenant_id NOT NULL in fuel_transactions
-- First, set default tenant_id for existing rows (MANUAL REVIEW REQUIRED)
-- UPDATE fuel_transactions SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE fuel_transactions ALTER COLUMN tenant_id SET NOT NULL;

-- Make tenant_id NOT NULL in work_orders
-- First, set default tenant_id for existing rows (MANUAL REVIEW REQUIRED)
-- UPDATE work_orders SET tenant_id = 1 WHERE tenant_id IS NULL;
ALTER TABLE work_orders ALTER COLUMN tenant_id SET NOT NULL;

