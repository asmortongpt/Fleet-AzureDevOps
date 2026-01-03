-- Migration: 034 - Performance Optimization Indexes
-- Description: Creates comprehensive indexes for query optimization,
--              prevents N+1 queries, and improves multi-tenant isolation
-- Author: Backend Implementation Agent
-- Date: 2025-11-19

-- ==============================================================================
-- MULTI-TENANT ISOLATION INDEXES
-- ==============================================================================

-- Core entity indexes for tenant isolation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_tenant_id ON vehicles(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_tenant_id ON drivers(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_tenant_id ON work_orders(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_schedules_tenant_id ON maintenance_schedules(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fuel_transactions_tenant_id ON fuel_transactions(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inspections_tenant_id ON inspections(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_routes_tenant_id ON routes(tenant_id);

-- Composite indexes for common queries with tenant isolation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_tenant_status ON vehicles(tenant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_tenant_created ON vehicles(tenant_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_tenant_status ON drivers(tenant_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_tenant_status ON work_orders(tenant_id, status);

-- ==============================================================================
-- FOREIGN KEY INDEXES (Prevent N+1 queries)
-- ==============================================================================

-- Vehicle relationships
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_vehicle_id ON work_orders(vehicle_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fuel_transactions_vehicle_id ON fuel_transactions(vehicle_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inspections_vehicle_id ON inspections(vehicle_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_schedules_vehicle_id ON maintenance_schedules(vehicle_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_routes_vehicle_id ON routes(vehicle_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_damage_reports_vehicle_id ON damage_reports(vehicle_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_video_events_vehicle_id ON video_events(vehicle_id);

-- Driver relationships
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_routes_driver_id ON routes(driver_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fuel_transactions_driver_id ON fuel_transactions(driver_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_safety_incidents_driver_id ON safety_incidents(driver_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_assigned_driver ON vehicles(assigned_driver_id);

-- Work order relationships
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_assigned_to ON work_orders(assigned_to);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_facility_id ON work_orders(facility_id);

-- ==============================================================================
-- DATE/TIME INDEXES FOR REPORTING
-- ==============================================================================

-- Created/Updated timestamps
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_created_at ON vehicles(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_updated_at ON vehicles(updated_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_created_at ON work_orders(created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_scheduled_date ON work_orders(scheduled_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_completed_at ON work_orders(completed_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fuel_transactions_date ON fuel_transactions(transaction_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inspections_date ON inspections(inspection_date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_routes_start_time ON routes(start_time DESC);

-- ==============================================================================
-- STATUS AND PRIORITY INDEXES
-- ==============================================================================

-- Status columns for filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_status ON vehicles(status) WHERE status != 'retired';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_status ON drivers(status) WHERE status = 'active';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_status ON work_orders(status) WHERE status != 'completed';
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_priority ON work_orders(priority) WHERE priority IN ('high', 'critical');

-- ==============================================================================
-- SEARCH AND LOOKUP INDEXES
-- ==============================================================================

-- Full-text search (GIN indexes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_email ON drivers(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_license ON drivers(license_number);

-- Case-insensitive search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_make_lower ON vehicles(LOWER(make));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_model_lower ON vehicles(LOWER(model));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_name_lower ON drivers(LOWER(first_name || ' ' || last_name));

-- GIN indexes for JSONB columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_metadata_gin ON vehicles USING GIN (metadata);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_metadata_gin ON work_orders USING GIN (metadata);

-- ==============================================================================
-- GEOSPATIAL INDEXES
-- ==============================================================================

-- GIST indexes for geographic queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_location_gist ON vehicles USING GIST (last_location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_routes_start_location_gist ON routes USING GIST (start_location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_routes_end_location_gist ON routes USING GIST (end_location);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_geofences_geometry_gist ON geofences USING GIST (geometry);

-- ==============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ==============================================================================

-- Vehicle queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_tenant_status_created
    ON vehicles(tenant_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_tenant_type_status
    ON vehicles(tenant_id, vehicle_type, status);

-- Work order queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_tenant_vehicle_status
    ON work_orders(tenant_id, vehicle_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_tenant_priority_scheduled
    ON work_orders(tenant_id, priority, scheduled_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_tenant_status_scheduled
    ON work_orders(tenant_id, status, scheduled_date)
    WHERE status != 'completed';

-- Fuel transaction queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fuel_tenant_vehicle_date
    ON fuel_transactions(tenant_id, vehicle_id, transaction_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fuel_tenant_date_type
    ON fuel_transactions(tenant_id, transaction_date DESC, fuel_type);

-- Route queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_routes_tenant_driver_start
    ON routes(tenant_id, driver_id, start_time DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_routes_tenant_vehicle_start
    ON routes(tenant_id, vehicle_id, start_time DESC);

-- Inspection queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inspections_tenant_vehicle_date
    ON inspections(tenant_id, vehicle_id, inspection_date DESC);

-- ==============================================================================
-- USER AND PERMISSION INDEXES
-- ==============================================================================

-- User lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);

-- Permission system indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);

-- ==============================================================================
-- PARTIAL INDEXES FOR COMMON FILTERS
-- ==============================================================================

-- Active records only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_active
    ON vehicles(tenant_id, created_at DESC)
    WHERE status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_active
    ON drivers(tenant_id, created_at DESC)
    WHERE status = 'active';

-- Pending/In-Progress work orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_pending
    ON work_orders(tenant_id, priority, scheduled_date)
    WHERE status IN ('pending', 'in_progress');

-- Overdue work orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_overdue
    ON work_orders(tenant_id, scheduled_date)
    WHERE status != 'completed' AND scheduled_date < CURRENT_DATE;

-- High priority items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_high_priority
    ON work_orders(tenant_id, scheduled_date, created_at DESC)
    WHERE priority IN ('high', 'critical') AND status != 'completed';

-- ==============================================================================
-- AGGREGATE AND STATISTICS INDEXES
-- ==============================================================================

-- Odometer tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_odometer
    ON vehicles(tenant_id, odometer DESC);

-- Maintenance costs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_cost
    ON work_orders(tenant_id, vehicle_id, actual_cost)
    WHERE actual_cost IS NOT NULL;

-- Fuel efficiency
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fuel_gallons_cost
    ON fuel_transactions(tenant_id, vehicle_id, gallons, total_cost);

-- ==============================================================================
-- UNIQUE CONSTRAINTS (Data Integrity)
-- ==============================================================================

-- Prevent duplicate VINs within tenant
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_vin_tenant
    ON vehicles(tenant_id, vin) WHERE vin IS NOT NULL;

-- Prevent duplicate license plates within tenant
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_license_tenant
    ON vehicles(tenant_id, license_plate) WHERE license_plate IS NOT NULL;

-- Prevent duplicate driver licenses
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_license_unique
    ON drivers(license_number) WHERE license_number IS NOT NULL;

-- Prevent duplicate user emails
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_unique
    ON users(email);

-- ==============================================================================
-- EXPRESSION INDEXES FOR COMPUTED QUERIES
-- ==============================================================================

-- Vehicle age calculation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_age
    ON vehicles(tenant_id, (EXTRACT(YEAR FROM CURRENT_DATE) - year));

-- Days since last inspection
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_last_inspection_days
    ON vehicles(tenant_id, (CURRENT_DATE - last_inspection_date))
    WHERE last_inspection_date IS NOT NULL;

-- ==============================================================================
-- COVERING INDEXES FOR INDEX-ONLY SCANS
-- ==============================================================================

-- Vehicle list queries (covering index)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_list_covering
    ON vehicles(tenant_id, status, created_at DESC)
    INCLUDE (id, vin, make, model, year, license_plate);

-- Work order list queries (covering index)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_list_covering
    ON work_orders(tenant_id, status, priority, scheduled_date)
    INCLUDE (id, vehicle_id, title, estimated_cost, actual_cost);

-- ==============================================================================
-- STATISTICS AND MAINTENANCE
-- ==============================================================================

-- Update statistics for query planner
ANALYZE vehicles;
ANALYZE drivers;
ANALYZE work_orders;
ANALYZE maintenance_schedules;
ANALYZE fuel_transactions;
ANALYZE inspections;
ANALYZE routes;

-- ==============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ==============================================================================

COMMENT ON INDEX idx_vehicles_tenant_status_created IS 'Optimizes common vehicle listing queries with tenant isolation';
COMMENT ON INDEX idx_work_orders_tenant_vehicle_status IS 'Prevents N+1 queries when fetching work orders for vehicles';
COMMENT ON INDEX idx_vehicles_active IS 'Partial index for active vehicles only - improves dashboard queries';
COMMENT ON INDEX idx_work_orders_overdue IS 'Optimizes overdue work order reports';
COMMENT ON INDEX idx_vehicles_list_covering IS 'Covering index for index-only scans on vehicle lists';
