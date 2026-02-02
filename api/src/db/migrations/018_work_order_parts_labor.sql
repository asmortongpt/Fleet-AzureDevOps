-- Migration: 018_work_order_parts_labor.sql
-- Description: Create work_order_parts and work_order_labor tables for tracking
--              parts used and labor performed on work orders
-- Date: 2026-02-02

-- Work Order Parts - Parts associated with a work order
CREATE TABLE IF NOT EXISTS work_order_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts_inventory(id) ON DELETE SET NULL,
  part_number VARCHAR(100),
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit_cost DECIMAL(12, 2) NOT NULL,
  total_cost DECIMAL(12, 2) NOT NULL,
  supplier VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for work_order_parts
CREATE INDEX IF NOT EXISTS work_order_parts_work_order_idx ON work_order_parts(work_order_id);
CREATE INDEX IF NOT EXISTS work_order_parts_tenant_idx ON work_order_parts(tenant_id);
CREATE INDEX IF NOT EXISTS work_order_parts_part_idx ON work_order_parts(part_id);

-- Work Order Labor - Labor associated with a work order
CREATE TABLE IF NOT EXISTS work_order_labor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
  technician_name VARCHAR(255) NOT NULL,
  task VARCHAR(255) NOT NULL,
  hours DECIMAL(8, 2) NOT NULL,
  rate DECIMAL(10, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for work_order_labor
CREATE INDEX IF NOT EXISTS work_order_labor_work_order_idx ON work_order_labor(work_order_id);
CREATE INDEX IF NOT EXISTS work_order_labor_tenant_idx ON work_order_labor(tenant_id);
CREATE INDEX IF NOT EXISTS work_order_labor_technician_idx ON work_order_labor(technician_id);
CREATE INDEX IF NOT EXISTS work_order_labor_date_idx ON work_order_labor(date);

-- Row-Level Security Policies
ALTER TABLE work_order_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_order_labor ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work_order_parts
CREATE POLICY tenant_isolation_work_order_parts ON work_order_parts
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- RLS Policies for work_order_labor
CREATE POLICY tenant_isolation_work_order_labor ON work_order_labor
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Update triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_work_order_parts_updated_at ON work_order_parts;
CREATE TRIGGER update_work_order_parts_updated_at
  BEFORE UPDATE ON work_order_parts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_work_order_labor_updated_at ON work_order_labor;
CREATE TRIGGER update_work_order_labor_updated_at
  BEFORE UPDATE ON work_order_labor
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE work_order_parts IS 'Parts used in work orders with cost tracking';
COMMENT ON TABLE work_order_labor IS 'Labor hours and costs for work order execution';
COMMENT ON COLUMN work_order_parts.total_cost IS 'Calculated as quantity * unit_cost';
COMMENT ON COLUMN work_order_labor.total IS 'Calculated as hours * rate';
