
-- Indexes for vehicles table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_tenant_id ON vehicles(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_status ON vehicles(status) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id) WHERE driver_id IS NOT NULL;

-- Indexes for vehicle_telemetry (time-series data)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_vehicle_timestamp ON vehicle_telemetry(vehicle_id, timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_tenant_timestamp ON vehicle_telemetry(tenant_id, timestamp DESC);

-- Indexes for maintenance records
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_vehicle_id ON maintenance_records(vehicle_id, scheduled_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_status ON maintenance_records(status) WHERE status != 'completed';

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_tenant_status ON vehicles(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_tenant_active ON drivers(tenant_id, active);

-- Full-text search index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_search ON vehicles USING gin(to_tsvector('english', make || ' ' || model || ' ' || vin));
