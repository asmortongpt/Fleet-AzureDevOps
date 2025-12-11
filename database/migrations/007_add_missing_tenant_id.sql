-- Add tenant_id to charging_sessions
ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Backfill with first available tenant
UPDATE charging_sessions
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;

-- Make NOT NULL
ALTER TABLE charging_sessions ALTER COLUMN tenant_id SET NOT NULL;

-- Add foreign key
ALTER TABLE charging_sessions
  ADD CONSTRAINT fk_charging_sessions_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Add index
CREATE INDEX IF NOT EXISTS idx_charging_sessions_tenant_id ON charging_sessions(tenant_id);

-- Repeat for communications
ALTER TABLE communications ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE communications
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;
ALTER TABLE communications ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE communications
  ADD CONSTRAINT fk_communications_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_communications_tenant_id ON communications(tenant_id);

-- Repeat for vehicle_telemetry
ALTER TABLE vehicle_telemetry ADD COLUMN IF NOT EXISTS tenant_id UUID;
UPDATE vehicle_telemetry
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at LIMIT 1)
WHERE tenant_id IS NULL;
ALTER TABLE vehicle_telemetry ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE vehicle_telemetry
  ADD CONSTRAINT fk_vehicle_telemetry_tenant
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_vehicle_telemetry_tenant_id ON vehicle_telemetry(tenant_id);