-- Fleet Database Schema with Multi-Tenancy

-- Charging Sessions
CREATE TABLE IF NOT EXISTS charging_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  energy_kwh DECIMAL(10, 2),
  cost_usd DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_charging_sessions_tenant_id ON charging_sessions(tenant_id);

-- Communications
CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subject VARCHAR(255),
  body TEXT,
  sender_id UUID,
  recipient_id UUID,
  sent_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_communications_tenant_id ON communications(tenant_id);

-- Vehicle Telemetry
CREATE TABLE IF NOT EXISTS vehicle_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  speed_mph DECIMAL(5, 2),
  fuel_level DECIMAL(5, 2),
  odometer_miles INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_vehicle_telemetry_tenant_id ON vehicle_telemetry(tenant_id);

-- Enforce NOT NULL on drivers
ALTER TABLE drivers ALTER COLUMN tenant_id SET NOT NULL;

-- Enforce NOT NULL on fuel_transactions
ALTER TABLE fuel_transactions ALTER COLUMN tenant_id SET NOT NULL;

-- Enforce NOT NULL on work_orders
ALTER TABLE work_orders ALTER COLUMN tenant_id SET NOT NULL;
