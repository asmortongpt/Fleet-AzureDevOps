-- Multi-Tenancy Database Schema Fixes
-- Auto-generated migration

-- Add tenant_id to charging_sessions
ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
ALTER TABLE charging_sessions ADD CONSTRAINT fk_charging_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Add tenant_id to communications
ALTER TABLE communications ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
ALTER TABLE communications ADD CONSTRAINT fk_communications_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Add tenant_id to telemetry
ALTER TABLE telemetry ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
ALTER TABLE telemetry ADD CONSTRAINT fk_telemetry_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id);

