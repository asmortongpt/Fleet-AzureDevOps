-- Performance Indexes Migration
-- Adds indexes to frequently queried columns

-- Vehicles table indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);

-- Drivers table indexes
CREATE INDEX IF NOT EXISTS idx_drivers_tenant_id ON drivers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_drivers_email ON drivers(email);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);

-- Maintenance table indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_tenant_id ON maintenance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance(status);

-- Work orders table indexes
CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_id ON work_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle_id ON work_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);

-- Fuel transactions table indexes
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_tenant_id ON fuel_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_vehicle_id ON fuel_transactions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_date ON fuel_transactions(date);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_status ON vehicles(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_status ON maintenance(vehicle_id, status);
