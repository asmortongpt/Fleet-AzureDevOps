-- Enable RLS on drivers table
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their tenant's drivers
CREATE POLICY drivers_tenant_isolation_select ON drivers
FOR SELECT
USING (tenant_id = current_setting('app.current_tenant', TRUE)::INTEGER);

-- Policy: Users can only insert drivers for their tenant
CREATE POLICY drivers_tenant_isolation_insert ON drivers
FOR INSERT
WITH CHECK (tenant_id = current_setting('app.current_tenant', TRUE)::INTEGER);

-- Policy: Users can only update their tenant's drivers
CREATE POLICY drivers_tenant_isolation_update ON drivers
FOR UPDATE
USING (tenant_id = current_setting('app.current_tenant', TRUE)::INTEGER);

-- Policy: Users can only delete their tenant's drivers
CREATE POLICY drivers_tenant_isolation_delete ON drivers
FOR DELETE
USING (tenant_id = current_setting('app.current_tenant', TRUE)::INTEGER);

-- Enable RLS on maintenance_records table
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their tenant's maintenance records
CREATE POLICY maintenance_records_tenant_isolation_select ON maintenance_records
FOR SELECT
USING (tenant_id = current_setting('app.current_tenant', TRUE)::INTEGER);

-- Policy: Users can only insert maintenance records for their tenant
CREATE POLICY maintenance_records_tenant_isolation_insert ON maintenance_records
FOR INSERT
WITH CHECK (tenant_id = current_setting('app.current_tenant', TRUE)::INTEGER);

-- Policy: Users can only update their tenant's maintenance records
CREATE POLICY maintenance_records_tenant_isolation_update ON maintenance_records
FOR UPDATE
USING (tenant_id = current_setting('app.current_tenant', TRUE)::INTEGER);

-- Policy: Users can only delete their tenant's maintenance records
CREATE POLICY maintenance_records_tenant_isolation_delete ON maintenance_records
FOR DELETE
USING (tenant_id = current_setting('app.current_tenant', TRUE)::INTEGER);

-- Enable RLS on work_orders table
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their tenant's work orders
CREATE POLICY work_orders_tenant_isolation_select ON work_orders
FOR SELECT
USING (tenant_id = current_setting('app.current_tenant', TRUE)::INTEGER);

-- Policy: Users can only insert work orders for their tenant
CREATE POLICY work_orders_tenant_isolation_insert ON work_orders
FOR INSERT
WITH CHECK (tenant_id = current_setting('app.current_tenant', TRUE)::INTEGER);

-- Policy: Users can only update their tenant's work orders
CREATE POLICY work_orders_tenant_isolation_update ON work_orders
FOR UPDATE
USING (tenant_id = current_setting('app.current_tenant', TRUE)::INTEGER);

-- Policy: Users can only delete their tenant's work orders
CREATE POLICY work_orders_tenant_isolation_delete ON work_orders
FOR DELETE
USING (tenant_id = current_setting('app.current_tenant', TRUE)::INTEGER);

-- Enable RLS on facilities table
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their tenant's facilities
CREATE POLICY facilities_tenant_isolation_select ON facilities
FOR SELECT
USING (tenant_id = current_setting('app.current_tenant', TRUE)::INTEGER);

-- Policy: Users can only insert facilities for their tenant
CREATE POLICY facilities_tenant_isolation_insert ON facilities
FOR INSERT
WITH CHECK (tenant_id = current_setting('app.current_tenant', TRUE)::INTEGER);

-- Policy: Users can only update their tenant's facilities
CREATE POLICY facilities_tenant_isolation_update ON facilities
FOR UPDATE
USING (tenant_id = current_setting('app.current_tenant', TRUE)::INTEGER);

-- Policy: Users can only delete their tenant's facilities
CREATE POLICY facilities_tenant_isolation_delete ON facilities
FOR DELETE
USING (tenant_id = current_setting('app.current_tenant', TRUE)::INTEGER);

-- Allow service role to bypass RLS for admin operations
ALTER TABLE vehicles FORCE ROW LEVEL SECURITY;
ALTER TABLE drivers FORCE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records FORCE ROW LEVEL SECURITY;
ALTER TABLE work_orders FORCE ROW LEVEL SECURITY;
ALTER TABLE facilities FORCE ROW LEVEL SECURITY;