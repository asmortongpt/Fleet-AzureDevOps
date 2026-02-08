-- Add tenant isolation policy for heavy_equipment to allow inserts under current tenant context
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'heavy_equipment') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'heavy_equipment' AND policyname = 'heavy_equipment_tenant_isolation'
    ) THEN
      CREATE POLICY heavy_equipment_tenant_isolation
        ON heavy_equipment
        USING (tenant_id = (current_setting('app.current_tenant_id', true))::uuid)
        WITH CHECK (tenant_id = (current_setting('app.current_tenant_id', true))::uuid);
    END IF;
  END IF;
END $$;
