-- =====================================================================
-- Row-Level Security (RLS) Migration
-- Enable tenant isolation at the database level
-- Issue #35: Row-Level Security (CRITICAL)
-- =====================================================================

-- Create helper function to get current tenant ID from session
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
DECLARE
  tenant_id_value TEXT;
BEGIN
  -- Try to get tenant_id from current setting
  BEGIN
    tenant_id_value := current_setting('app.current_tenant_id', TRUE);
    IF tenant_id_value IS NULL OR tenant_id_value = '' THEN
      RETURN NULL;
    END IF;
    RETURN tenant_id_value::UUID;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================================
-- VEHICLES TABLE
-- =====================================================================

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tenant's vehicles
CREATE POLICY vehicles_tenant_isolation ON vehicles
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- DRIVERS TABLE
-- =====================================================================

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY drivers_tenant_isolation ON drivers
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- WORK_ORDERS TABLE
-- =====================================================================

ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY work_orders_tenant_isolation ON work_orders
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- FUEL_TRANSACTIONS TABLE
-- =====================================================================

ALTER TABLE fuel_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY fuel_transactions_tenant_isolation ON fuel_transactions
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- MAINTENANCE_RECORDS TABLE
-- =====================================================================

ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY maintenance_records_tenant_isolation ON maintenance_records
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- INCIDENTS TABLE
-- =====================================================================

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY incidents_tenant_isolation ON incidents
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- PARTS TABLE
-- =====================================================================

ALTER TABLE parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY parts_tenant_isolation ON parts
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- VENDORS TABLE
-- =====================================================================

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY vendors_tenant_isolation ON vendors
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- INVOICES TABLE
-- =====================================================================

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoices_tenant_isolation ON invoices
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- PURCHASE_ORDERS TABLE
-- =====================================================================

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY purchase_orders_tenant_isolation ON purchase_orders
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- TASKS TABLE
-- =====================================================================

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY tasks_tenant_isolation ON tasks
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- ASSETS TABLE
-- =====================================================================

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY assets_tenant_isolation ON assets
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- HEAVY_EQUIPMENT TABLE
-- =====================================================================

ALTER TABLE heavy_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY heavy_equipment_tenant_isolation ON heavy_equipment
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- GEOFENCES TABLE
-- =====================================================================

ALTER TABLE geofences ENABLE ROW LEVEL SECURITY;

CREATE POLICY geofences_tenant_isolation ON geofences
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- INSPECTIONS TABLE
-- =====================================================================

ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY inspections_tenant_isolation ON inspections
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- DOCUMENTS TABLE
-- =====================================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_tenant_isolation ON documents
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- COSTS TABLE
-- =====================================================================

ALTER TABLE costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY costs_tenant_isolation ON costs
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- MILEAGE_REIMBURSEMENT TABLE
-- =====================================================================

ALTER TABLE mileage_reimbursement ENABLE ROW LEVEL SECURITY;

CREATE POLICY mileage_reimbursement_tenant_isolation ON mileage_reimbursement
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- CHARGING_SESSIONS TABLE
-- =====================================================================

ALTER TABLE charging_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY charging_sessions_tenant_isolation ON charging_sessions
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- CHARGING_STATIONS TABLE
-- =====================================================================

ALTER TABLE charging_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY charging_stations_tenant_isolation ON charging_stations
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- COMMUNICATIONS TABLE
-- =====================================================================

ALTER TABLE communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY communications_tenant_isolation ON communications
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- VEHICLE_TELEMETRY TABLE
-- =====================================================================

ALTER TABLE vehicle_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY vehicle_telemetry_tenant_isolation ON vehicle_telemetry
  FOR ALL
  USING (tenant_id = current_tenant_id());

-- =====================================================================
-- NOTES
-- =====================================================================

-- To use RLS in your application:
-- 1. Set tenant ID at the start of each request:
--    SET app.current_tenant_id = '<tenant_uuid>';
--
-- 2. Example in Node.js/PostgreSQL:
--    await pool.query('SET app.current_tenant_id = $1', [tenantId]);
--
-- 3. All subsequent queries in that session will automatically
--    filter by tenant_id via RLS policies
--
-- 4. RLS policies apply to ALL operations: SELECT, INSERT, UPDATE, DELETE
--
-- 5. To bypass RLS (for admin operations), use a superuser connection
--    or create an admin role with BYPASSRLS permission
