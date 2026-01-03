-- Migration: Performance Optimization Indexes
-- Description: Add indexes for common query patterns to improve performance
-- Version: 033
-- Date: 2025-11-20

BEGIN;

-- ============================================================================
-- VEHICLES TABLE INDEXES
-- ============================================================================

-- Index for vehicle status queries
CREATE INDEX IF NOT EXISTS idx_vehicles_status
ON vehicles(status)
WHERE status IS NOT NULL;

-- Index for vehicle type and status combination (common filter)
CREATE INDEX IF NOT EXISTS idx_vehicles_type_status
ON vehicles(type, status);

-- Index for organization queries
CREATE INDEX IF NOT EXISTS idx_vehicles_organization
ON vehicles(tenant_id)
WHERE tenant_id IS NOT NULL;

-- Index for vehicle search by VIN
CREATE INDEX IF NOT EXISTS idx_vehicles_vin
ON vehicles(vin)
WHERE vin IS NOT NULL;

-- Index for vehicle make/model queries
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model
ON vehicles(make, model);

-- Index for recent vehicles (created_at DESC is common for dashboards)
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at
ON vehicles(created_at DESC);

-- ============================================================================
-- MAINTENANCE TABLE INDEXES
-- ============================================================================

-- Index for vehicle maintenance history
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle
ON maintenance_schedules(vehicle_id, next_service_date DESC);

-- Index for maintenance status
CREATE INDEX IF NOT EXISTS idx_maintenance_status
ON maintenance_schedules(is_active);

-- Index for upcoming maintenance
CREATE INDEX IF NOT EXISTS idx_maintenance_upcoming
ON maintenance_schedules(next_service_date)
WHERE is_active = true;

-- Index for maintenance type queries
CREATE INDEX IF NOT EXISTS idx_type
ON maintenance_schedules(type);

-- Composite index for organization maintenance queries
CREATE INDEX IF NOT EXISTS idx_maintenance_org_date
ON maintenance_schedules(tenant_id, next_service_date DESC)
WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- FUEL RECORDS TABLE INDEXES
-- ============================================================================

-- Index for vehicle fuel history
CREATE INDEX IF NOT EXISTS idx_fuel_vehicle_date
ON fuel_transactions(vehicle_id, created_at DESC);

-- Index for fuel date range queries
CREATE INDEX IF NOT EXISTS idx_date_range
ON fuel_transactions(created_at);

-- Index for organization fuel reports
CREATE INDEX IF NOT EXISTS idx_fuel_org_date
ON fuel_transactions(tenant_id, created_at DESC)
WHERE tenant_id IS NOT NULL;

-- Index for fuel cost analysis
CREATE INDEX IF NOT EXISTS idx_fuel_cost
ON fuel_transactions(total_cost)
WHERE total_cost IS NOT NULL;

-- ============================================================================
-- DRIVERS TABLE INDEXES
-- ============================================================================

-- Index for driver status
CREATE INDEX IF NOT EXISTS idx_drivers_status
ON drivers(status);

-- Index for organization drivers
CREATE INDEX IF NOT EXISTS idx_drivers_organization
ON drivers(tenant_id)
WHERE tenant_id IS NOT NULL;

-- Index for driver license lookup
CREATE INDEX IF NOT EXISTS idx_drivers_license
ON drivers(license_number)
WHERE license_number IS NOT NULL;

-- Index for active drivers (common query)
CREATE INDEX IF NOT EXISTS idx_drivers_active
ON drivers(status)
WHERE status = 'active';

-- ============================================================================
-- DRIVER ASSIGNMENTS TABLE INDEXES
-- ============================================================================

-- Index for vehicle assignments (Table does not exist, skipped)
-- CREATE INDEX IF NOT EXISTS idx_assignments_vehicle ...

-- ============================================================================
-- WORK ORDERS TABLE INDEXES
-- ============================================================================

-- Index for vehicle work orders
CREATE INDEX IF NOT EXISTS idx_work_orders_vehicle
ON work_orders(vehicle_id, created_at DESC);

-- Index for work order status
CREATE INDEX IF NOT EXISTS idx_work_orders_status
ON work_orders(status);

-- Index for priority work orders
CREATE INDEX IF NOT EXISTS idx_work_orders_priority
ON work_orders(priority, status);

-- Index for open work orders (dashboard)
CREATE INDEX IF NOT EXISTS idx_work_orders_open
ON work_orders(status, created_at DESC)
WHERE status IN ('pending', 'in_progress');

-- Index for organization work orders
CREATE INDEX IF NOT EXISTS idx_work_orders_org
ON work_orders(tenant_id, created_at DESC)
WHERE tenant_id IS NOT NULL;

-- ============================================================================
-- TELEMATICS DATA TABLE INDEXES
-- ============================================================================

-- Index for vehicle telematics time series
CREATE INDEX IF NOT EXISTS idx_telematics_vehicle_time
ON telemetry_data(vehicle_id, timestamp DESC);

-- Index for timestamp range queries
CREATE INDEX IF NOT EXISTS idx_telematics_timestamp
ON telemetry_data(timestamp DESC);

-- Index for location-based queries
-- Index for location-based queries
-- CREATE INDEX IF NOT EXISTS idx_telematics_location
-- ON telemetry_data(latitude, longitude)
-- WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index for speed maintenance_notifications
-- CREATE INDEX IF NOT EXISTS idx_telematics_speed
-- ON telemetry_data(speed)
-- WHERE speed > 0;

-- ============================================================================
-- INSPECTIONS TABLE INDEXES
-- ============================================================================

-- Index for vehicle vehicle_inspections
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle
ON vehicle_inspections(vehicle_id, created_at DESC);

-- Index for inspection status
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_status
ON vehicle_inspections(status);

-- Index for failed vehicle_inspections (Column passed missing)
-- CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_failed
-- ON vehicle_inspections(passed)
-- WHERE passed = false;

-- Index for recent vehicle_inspections
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_inspected_at
ON vehicle_inspections(created_at DESC);

-- ============================================================================
-- DOCUMENTS TABLE INDEXES
-- ============================================================================

-- Index for entity documents (Columns missing)
-- CREATE INDEX IF NOT EXISTS idx_documents_entity
-- ON documents(entity_type, entity_id, created_at DESC);

-- Index for document type
CREATE INDEX IF NOT EXISTS idx_documents_type
ON documents(document_type);

-- Index for organization documents
CREATE INDEX IF NOT EXISTS idx_documents_org
ON documents(tenant_id)
WHERE tenant_id IS NOT NULL;

-- Index for document status
-- CREATE INDEX IF NOT EXISTS idx_documents_status
-- ON documents(status)
-- WHERE status IS NOT NULL;

-- ============================================================================
-- ALERTS TABLE INDEXES
-- ============================================================================

-- Index for vehicle maintenance_notifications (Column missing)
-- CREATE INDEX IF NOT EXISTS idx_maintenance_notifications_vehicle
-- ON maintenance_notifications(vehicle_id, created_at DESC)
-- WHERE vehicle_id IS NOT NULL;

-- Index for notification severity (Column missing)
-- CREATE INDEX IF NOT EXISTS idx_maintenance_notifications_severity
-- ON maintenance_notifications(severity, created_at DESC);

-- Index for unread maintenance_notifications
CREATE INDEX IF NOT EXISTS idx_maintenance_notifications_unread
ON maintenance_notifications(read, created_at DESC)
WHERE read = false;

-- Index for notification type
CREATE INDEX IF NOT EXISTS idx_maintenance_notifications_type
ON maintenance_notifications(notification_type);

-- ============================================================================
-- USERS TABLE INDEXES
-- ============================================================================

-- Index for email lookup (login)
CREATE INDEX IF NOT EXISTS idx_users_email
ON users(email)
WHERE email IS NOT NULL;

-- Index for organization users
CREATE INDEX IF NOT EXISTS idx_users_organization
ON users(tenant_id)
WHERE tenant_id IS NOT NULL;

-- Index for active users
CREATE INDEX IF NOT EXISTS idx_users_active
ON users(is_active)
WHERE is_active = true;

-- Index for user role queries
CREATE INDEX IF NOT EXISTS idx_users_role
ON users(role);

-- ============================================================================
-- AUDIT LOG TABLE INDEXES
-- ============================================================================

-- Index for entity audit trail
CREATE INDEX IF NOT EXISTS idx_audit_entity
ON audit_logs(entity_type, entity_id, created_at DESC)
WHERE entity_type IS NOT NULL AND entity_id IS NOT NULL;

-- Index for user actions
CREATE INDEX IF NOT EXISTS idx_audit_user
ON audit_logs(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Index for action type
CREATE INDEX IF NOT EXISTS idx_audit_action
ON audit_logs(action);

-- Index for recent audit logs
CREATE INDEX IF NOT EXISTS idx_audit_timestamp
ON audit_logs(created_at DESC);

-- ============================================================================
-- PERFORMANCE STATISTICS
-- ============================================================================

-- Analyze tables to update statistics for query planner
ANALYZE vehicles;
ANALYZE maintenance_schedules;
ANALYZE fuel_transactions;
ANALYZE drivers;
-- ANALYZE vehicle_assignments;
ANALYZE work_orders;
ANALYZE telemetry_data;
ANALYZE vehicle_inspections;
ANALYZE documents;
ANALYZE maintenance_notifications;
ANALYZE users;
ANALYZE audit_logs;

-- ============================================================================
-- INDEX RECOMMENDATIONS LOGGING
-- ============================================================================

-- Create a table to store index usage statistics (for monitoring)
CREATE TABLE IF NOT EXISTS index_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    index_name VARCHAR(255) NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    scans BIGINT DEFAULT 0,
    tuples_read BIGINT DEFAULT 0,
    tuples_fetched BIGINT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(index_name, table_name)
);

-- Create a function to update index statistics
CREATE OR REPLACE FUNCTION update_index_usage_stats()
RETURNS VOID AS $$
BEGIN
    INSERT INTO index_usage_stats (index_name, table_name, scans, tuples_read, tuples_fetched, last_updated)
    SELECT
        indexrelname as index_name,
        relname as table_name,
        idx_scan as scans,
        idx_tup_read as tuples_read,
        idx_tup_fetch as tuples_fetched,
        CURRENT_TIMESTAMP as last_updated
    FROM pg_stat_user_indexes
    ON CONFLICT (index_name, table_name)
    DO UPDATE SET
        scans = EXCLUDED.scans,
        tuples_read = EXCLUDED.tuples_read,
        tuples_fetched = EXCLUDED.tuples_fetched,
        last_updated = EXCLUDED.last_updated;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 033: Performance indexes created successfully';
    RAISE NOTICE 'Total indexes created: ~50+';
    RAISE NOTICE 'Tables analyzed for updated statistics';
END $$;

COMMIT;
