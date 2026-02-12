-- Fleet Management System - Performance Optimization Indexes
-- Created: 2025-11-08

-- ===========================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ===========================================================================

-- Vehicles: Fast filtering by tenant and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_tenant_status 
ON vehicles(tenant_id, status) 
WHERE status = 'active';

-- Vehicles: Fast search by make/model
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_make_model 
ON vehicles(tenant_id, make, model);

-- Work Orders: Dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_tenant_status_priority 
ON work_orders(tenant_id, status, priority DESC, created_at DESC);

-- Work Orders: Technician workload
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_technician_status 
ON work_orders(assigned_technician_id, status) 
WHERE status IN ('open', 'in_progress');

-- Fuel Transactions: Cost analysis by date range
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fuel_transactions_vehicle_date 
ON fuel_transactions(vehicle_id, transaction_date DESC);

-- Fuel Transactions: Driver reporting
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_fuel_transactions_driver_date 
ON fuel_transactions(driver_id, transaction_date DESC);

-- Routes: Active route tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_routes_status_start_time 
ON routes(tenant_id, status, planned_start_time DESC) 
WHERE status IN ('planned', 'in_progress');

-- Drivers: Active drivers only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_drivers_tenant_status 
ON drivers(tenant_id, status) 
WHERE status = 'active';

-- Maintenance Schedules: Overdue maintenance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_overdue 
ON maintenance_schedules(tenant_id, next_service_due_date) 
WHERE is_active = true AND next_service_due_date < CURRENT_DATE;

-- Safety Incidents: Recent incidents by severity
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_safety_incidents_severity_date 
ON safety_incidents(tenant_id, severity, incident_date DESC);

-- Telemetry: Vehicle tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_vehicle_timestamp 
ON telemetry_data(vehicle_id, timestamp DESC);

-- Notifications: Unread by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
ON notifications(user_id, created_at DESC) 
WHERE is_read = false;

-- ===========================================================================
-- JSONB INDEXES FOR ADVANCED QUERIES
-- ===========================================================================

-- Vehicle telematics data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_telematics_gin 
ON vehicles USING gin(telematics_data);

-- Work order attachments search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_attachments_gin 
ON work_orders USING gin(attachments);

-- Route waypoints
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_routes_waypoints_gin 
ON routes USING gin(waypoints);

-- Tenant settings
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tenants_settings_gin 
ON tenants USING gin(settings);

-- ===========================================================================
-- FULL-TEXT SEARCH INDEXES
-- ===========================================================================

-- Work orders description search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_description_fts 
ON work_orders USING gin(to_tsvector('english', description));

-- Vehicles notes search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_notes_fts 
ON vehicles USING gin(to_tsvector('english', COALESCE(notes, '')));

-- Safety incidents search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_safety_incidents_description_fts 
ON safety_incidents USING gin(to_tsvector('english', description));

-- ===========================================================================
-- COVERING INDEXES (Include columns for index-only scans)
-- ===========================================================================

-- Vehicle list with assigned driver
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_list_covering 
ON vehicles(tenant_id, status) 
INCLUDE (vin, make, model, year, license_plate, assigned_driver_id, odometer);

-- Work order summary
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_summary_covering 
ON work_orders(tenant_id, status) 
INCLUDE (work_order_number, vehicle_id, type, priority, created_at);

-- ===========================================================================
-- PARTIAL INDEXES FOR SPECIFIC QUERIES
-- ===========================================================================

-- Active vehicles only
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vehicles_active_only 
ON vehicles(tenant_id, assigned_facility_id) 
WHERE status = 'active';

-- Open work orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_open 
ON work_orders(tenant_id, priority DESC, created_at DESC) 
WHERE status IN ('open', 'in_progress');

-- Overdue maintenance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_maintenance_due 
ON maintenance_schedules(vehicle_id, next_service_due_date) 
WHERE is_active = true;

-- Recent telemetry (last 7 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_telemetry_recent 
ON telemetry_data(vehicle_id, timestamp DESC) 
WHERE timestamp > NOW() - INTERVAL '7 days';

-- ===========================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ===========================================================================

ANALYZE tenants;
ANALYZE users;
ANALYZE vehicles;
ANALYZE drivers;
ANALYZE facilities;
ANALYZE work_orders;
ANALYZE maintenance_schedules;
ANALYZE fuel_transactions;
ANALYZE routes;
ANALYZE telemetry_data;
ANALYZE safety_incidents;
ANALYZE notifications;
ANALYZE audit_logs;

-- ===========================================================================
-- INDEX STATISTICS
-- ===========================================================================

\echo '========================================';
\echo 'Performance Index Creation Complete';
\echo '========================================';

SELECT 
    schemaname,
    tablename,
    COUNT(*) as index_count,
    pg_size_pretty(SUM(pg_relation_size(indexrelid))) as total_index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

\echo '========================================';
