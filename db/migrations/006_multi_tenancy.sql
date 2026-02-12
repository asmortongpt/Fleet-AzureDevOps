-- Multi-Tenancy Database Migration
-- Adds tenant_id to all tables and enables Row-Level Security

-- Add tenant_id column to existing tables
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Enable Row-Level Security
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policies
CREATE POLICY tenant_isolation_vehicles ON vehicles
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation_drivers ON drivers
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation_reservations ON reservations
  FOR ALL USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Create indexes for tenant filtering
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant ON vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_drivers_tenant ON drivers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_tenant ON reservations(tenant_id);

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  features JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  branding JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE tenants IS 'Multi-tenant configuration and isolation';
