-- Migration: Add tenant_id and audit fields to ALL tables
-- Purpose: Implement multi-tenancy isolation and audit trail
-- Security: Required for FedRAMP and SOC2 compliance
-- Date: 2025-12-02

BEGIN;

-- ============================================================================
-- 1. Add tenant_id column to ALL tables (multi-tenancy isolation)
-- ============================================================================

-- Vehicles table
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Drivers table
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Facilities table
ALTER TABLE facilities
  ADD COLUMN IF NOT EXISTS tenant_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';

-- Work orders table (new)
CREATE TABLE IF NOT EXISTS work_orders (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to INTEGER REFERENCES users(id),
  estimated_completion_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_by INTEGER NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMP
);

-- Fuel transactions table (new)
CREATE TABLE IF NOT EXISTS fuel_transactions (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  driver_id INTEGER REFERENCES drivers(id),
  transaction_date TIMESTAMP DEFAULT NOW() NOT NULL,
  fuel_type VARCHAR(50) NOT NULL CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid', 'cng')),
  quantity_gallons DECIMAL(10, 2) NOT NULL CHECK (quantity_gallons > 0),
  cost_per_gallon DECIMAL(10, 2) NOT NULL CHECK (cost_per_gallon > 0),
  total_cost DECIMAL(10, 2) NOT NULL CHECK (total_cost > 0),
  odometer_reading INTEGER NOT NULL CHECK (odometer_reading >= 0),
  location VARCHAR(255),
  receipt_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_by INTEGER NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMP
);

-- Routes table (new)
CREATE TABLE IF NOT EXISTS routes (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  route_name VARCHAR(255) NOT NULL,
  description TEXT,
  start_location VARCHAR(255) NOT NULL,
  end_location VARCHAR(255) NOT NULL,
  waypoints JSONB, -- Array of coordinates
  distance_miles DECIMAL(10, 2) NOT NULL CHECK (distance_miles > 0),
  estimated_duration_minutes INTEGER NOT NULL CHECK (estimated_duration_minutes > 0),
  assigned_vehicle_id INTEGER REFERENCES vehicles(id),
  assigned_driver_id INTEGER REFERENCES drivers(id),
  status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  scheduled_start_time TIMESTAMP,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_by INTEGER NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMP
);

-- Maintenance records table (new)
CREATE TABLE IF NOT EXISTS maintenance_records (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  maintenance_type VARCHAR(100) NOT NULL CHECK (maintenance_type IN ('oil_change', 'tire_rotation', 'brake_service', 'engine_repair', 'transmission', 'inspection', 'other')),
  description TEXT NOT NULL,
  service_date TIMESTAMP NOT NULL,
  service_provider VARCHAR(255),
  cost DECIMAL(10, 2) CHECK (cost >= 0),
  odometer_reading INTEGER NOT NULL CHECK (odometer_reading >= 0),
  next_service_date TIMESTAMP,
  next_service_odometer INTEGER,
  parts_replaced TEXT,
  labor_hours DECIMAL(10, 2) CHECK (labor_hours >= 0),
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_by INTEGER NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMP
);

-- Inspections table (new)
CREATE TABLE IF NOT EXISTS inspections (
  id SERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  vehicle_id INTEGER NOT NULL REFERENCES vehicles(id),
  inspector_id INTEGER REFERENCES users(id),
  inspection_type VARCHAR(100) NOT NULL CHECK (inspection_type IN ('pre_trip', 'post_trip', 'annual', 'safety', 'emissions', 'compliance', 'damage', 'other')),
  inspection_date TIMESTAMP DEFAULT NOW() NOT NULL,
  result VARCHAR(50) DEFAULT 'pending' CHECK (result IN ('passed', 'failed', 'conditional', 'pending')),
  checklist_items JSONB NOT NULL, -- Array of {item: string, passed: boolean, notes: string}
  overall_condition VARCHAR(50) CHECK (overall_condition IN ('excellent', 'good', 'fair', 'poor')),
  defects_found TEXT,
  corrective_actions_required TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMP,
  odometer_reading INTEGER CHECK (odometer_reading >= 0),
  attachments JSONB, -- Array of file URLs/references
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_by INTEGER NOT NULL REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_by INTEGER NOT NULL REFERENCES users(id),
  deleted_at TIMESTAMP
);

-- ============================================================================
-- 2. Add audit fields to EXISTING tables (created_by, updated_by, updated_at, deleted_at)
-- ============================================================================

-- Vehicles table
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Drivers table
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Facilities table
ALTER TABLE facilities
  ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- ============================================================================
-- 3. Create indexes for tenant_id (critical for multi-tenancy performance)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON vehicles(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_tenant_id ON drivers(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_facilities_tenant_id ON facilities(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_id ON work_orders(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_tenant_id ON fuel_transactions(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_routes_tenant_id ON routes(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_maintenance_records_tenant_id ON maintenance_records(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inspections_tenant_id ON inspections(tenant_id) WHERE deleted_at IS NULL;

-- ============================================================================
-- 4. Create indexes for soft delete (deleted_at)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_vehicles_deleted_at ON vehicles(deleted_at);
CREATE INDEX IF NOT EXISTS idx_drivers_deleted_at ON drivers(deleted_at);
CREATE INDEX IF NOT EXISTS idx_facilities_deleted_at ON facilities(deleted_at);
CREATE INDEX IF NOT EXISTS idx_work_orders_deleted_at ON work_orders(deleted_at);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_deleted_at ON fuel_transactions(deleted_at);
CREATE INDEX IF NOT EXISTS idx_routes_deleted_at ON routes(deleted_at);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_deleted_at ON maintenance_records(deleted_at);
CREATE INDEX IF NOT EXISTS idx_inspections_deleted_at ON inspections(deleted_at);

-- ============================================================================
-- 5. Create Row-Level Security (RLS) policies for tenant isolation
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (enforce tenant_id = current_setting('app.current_tenant'))
CREATE POLICY tenant_isolation_policy ON vehicles
  USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_policy ON drivers
  USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_policy ON facilities
  USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_policy ON work_orders
  USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_policy ON fuel_transactions
  USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_policy ON routes
  USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_policy ON maintenance_records
  USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY tenant_isolation_policy ON inspections
  USING (tenant_id::text = current_setting('app.current_tenant', true));

-- ============================================================================
-- 6. Create updated_at trigger function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fuel_transactions_updated_at BEFORE UPDATE ON fuel_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_records_updated_at BEFORE UPDATE ON maintenance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;

-- ============================================================================
-- Migration Complete!
-- ============================================================================
--
-- Security improvements:
-- ✅ tenant_id on ALL tables (multi-tenancy isolation)
-- ✅ Audit trail (created_by, updated_by, updated_at, created_at)
-- ✅ Soft deletes (deleted_at)
-- ✅ Row-Level Security policies
-- ✅ Performance indexes
-- ✅ Automatic updated_at triggers
--
-- Next steps:
-- 1. Apply this migration to production database
-- 2. Update all existing queries to filter by tenant_id
-- 3. Test tenant isolation with real Cursor/Datadog/Retool validation
-- ============================================================================
