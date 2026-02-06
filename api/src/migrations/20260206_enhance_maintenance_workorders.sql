-- ============================================================================
-- COMPREHENSIVE MAINTENANCE & WORK ORDERS ENHANCEMENT
-- ============================================================================
-- Created: 2026-02-06
-- Purpose: Add 60+ industry-standard fields to work_orders, inspections,
--          and maintenance_schedules tables. Create junction tables for
--          parts and inspection items.
-- ============================================================================

-- ============================================================================
-- PART 1: ENHANCE WORK_ORDERS TABLE (35+ NEW FIELDS)
-- ============================================================================

-- Add vendor and location tracking
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendors(id);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS facility_id UUID REFERENCES facilities(id);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS work_location VARCHAR(50) DEFAULT 'shop';
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS bay_number VARCHAR(20);

-- Add detailed costing fields
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS labor_rate_per_hour NUMERIC(10,2) DEFAULT 85.00;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS labor_cost NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS parts_cost NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2) DEFAULT 0.00;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS shop_supplies_fee NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS environmental_fee NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS discount_reason TEXT;

-- Add warranty tracking
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS warranty_work BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS warranty_claim_number VARCHAR(100);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS warranty_vendor_id UUID REFERENCES vendors(id);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS warranty_coverage_amount NUMERIC(12,2) DEFAULT 0.00;

-- Add approval workflow
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS approval_threshold_amount NUMERIC(12,2) DEFAULT 1000.00;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS approval_requested_at TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS approval_decision VARCHAR(20); -- 'approved', 'rejected', 'pending'
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add customer authorization
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS customer_authorized BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS customer_authorized_by VARCHAR(255);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS customer_authorized_at TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS customer_po_number VARCHAR(100);

-- Add completion tracking
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS completion_notes TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS root_cause_analysis TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS preventive_measures TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quality_check_by_id UUID REFERENCES users(id);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quality_check_passed BOOLEAN;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quality_check_notes TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quality_check_at TIMESTAMPTZ;

-- Add signature capture
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS customer_signature_url VARCHAR(500);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS technician_signature_url VARCHAR(500);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS manager_signature_url VARCHAR(500);

-- Add invoicing
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES invoices(id);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS invoice_sent_date DATE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS payment_received_date DATE;

-- Add telematics integration
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS fault_codes_before JSONB DEFAULT '[]';
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS fault_codes_after JSONB DEFAULT '[]';

-- Add soft delete (if not already exists)
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Add indexes for new work_orders fields
CREATE INDEX IF NOT EXISTS idx_work_orders_vendor_id ON work_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_facility_id ON work_orders(facility_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_approval_decision ON work_orders(approval_decision);
CREATE INDEX IF NOT EXISTS idx_work_orders_invoice_id ON work_orders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_deleted_at ON work_orders(deleted_at) WHERE deleted_at IS NULL;

-- ============================================================================
-- PART 2: CREATE WORK_ORDER_PARTS JUNCTION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS work_order_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  part_id UUID REFERENCES parts_inventory(id),

  -- Part details (denormalized for historical accuracy)
  part_number VARCHAR(100),
  part_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(10,2) NOT NULL CHECK (unit_cost >= 0),
  line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),

  -- Warranty and core charges
  warranty_part BOOLEAN DEFAULT FALSE,
  core_charge NUMERIC(10,2) DEFAULT 0.00,
  core_returned BOOLEAN DEFAULT FALSE,

  -- Supplier info
  supplier VARCHAR(255),
  supplier_part_number VARCHAR(100),

  -- Status
  status VARCHAR(50) DEFAULT 'ordered', -- ordered, received, installed, backordered, cancelled
  ordered_date TIMESTAMPTZ,
  received_date TIMESTAMPTZ,
  installed_date TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_id UUID REFERENCES users(id)
);

-- Indexes for work_order_parts
CREATE INDEX IF NOT EXISTS idx_work_order_parts_tenant_id ON work_order_parts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_work_order_parts_work_order_id ON work_order_parts(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_parts_part_id ON work_order_parts(part_id);
CREATE INDEX IF NOT EXISTS idx_work_order_parts_status ON work_order_parts(status);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON work_order_parts TO webapp;

-- Comments
COMMENT ON TABLE work_order_parts IS 'Parts used in work orders - junction table with historical accuracy';
COMMENT ON COLUMN work_order_parts.line_total IS 'Calculated as quantity * unit_cost (stored for historical accuracy)';
COMMENT ON COLUMN work_order_parts.core_charge IS 'Refundable core charge for returnable parts';

-- ============================================================================
-- PART 3: ENHANCE INSPECTIONS TABLE (25+ NEW FIELDS)
-- ============================================================================

-- Add DVIR compliance fields
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS is_dvir BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS dvir_type VARCHAR(20); -- 'pre_trip', 'post_trip'
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS trip_id UUID;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS odometer_reading INTEGER;

-- Add driver certification
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS driver_certified_safe BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS driver_signature_url VARCHAR(500);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS driver_signature_date TIMESTAMPTZ;

-- Add DOT annual inspection fields
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS dot_inspection_sticker_number VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS dot_inspection_passed BOOLEAN;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS dot_inspection_expiry_date DATE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS dot_inspector_license_number VARCHAR(50);

-- Add mechanic review
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS mechanic_reviewed BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS mechanic_id UUID REFERENCES users(id);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS mechanic_signature_url VARCHAR(500);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS mechanic_signature_date TIMESTAMPTZ;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS mechanic_certified_repairs BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS mechanic_notes TEXT;

-- Add corrective action workflow
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS requires_corrective_action BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS corrective_work_order_id UUID REFERENCES work_orders(id);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS vehicle_placed_out_of_service BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS out_of_service_reason TEXT;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS out_of_service_at TIMESTAMPTZ;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS returned_to_service_at TIMESTAMPTZ;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS returned_by_id UUID REFERENCES users(id);

-- Add compliance tracking
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS fmcsa_recordable BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS retention_until_date DATE;

-- Add indexes for new inspections fields
CREATE INDEX IF NOT EXISTS idx_inspections_is_dvir ON inspections(is_dvir);
CREATE INDEX IF NOT EXISTS idx_inspections_trip_id ON inspections(trip_id);
CREATE INDEX IF NOT EXISTS idx_inspections_mechanic_id ON inspections(mechanic_id);
CREATE INDEX IF NOT EXISTS idx_inspections_corrective_work_order_id ON inspections(corrective_work_order_id);
CREATE INDEX IF NOT EXISTS idx_inspections_out_of_service ON inspections(vehicle_placed_out_of_service) WHERE vehicle_placed_out_of_service = TRUE;
CREATE INDEX IF NOT EXISTS idx_inspections_fmcsa_recordable ON inspections(fmcsa_recordable) WHERE fmcsa_recordable = TRUE;

-- ============================================================================
-- PART 4: CREATE INSPECTION_ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS inspection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  inspection_id UUID NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,

  -- Item details
  category VARCHAR(100) NOT NULL, -- 'Brakes', 'Tires', 'Lights', 'Engine', 'Fluid Levels', etc.
  item_name VARCHAR(255) NOT NULL,
  item_number INTEGER, -- Sequential number within inspection

  -- Condition assessment
  condition VARCHAR(20) NOT NULL, -- 'Satisfactory', 'Defective', 'Not Applicable'
  severity VARCHAR(20), -- 'Minor', 'Major', 'Critical', 'Out of Service'
  defect_description TEXT,

  -- Documentation
  photo_url VARCHAR(500),
  photo_urls JSONB DEFAULT '[]', -- Array of multiple photos

  -- Corrective action
  corrective_action_required BOOLEAN DEFAULT FALSE,
  corrective_action TEXT,
  repaired_on_spot BOOLEAN DEFAULT FALSE,
  repair_notes TEXT,
  repair_by_id UUID REFERENCES users(id),
  repair_date TIMESTAMPTZ,

  -- FMCSA classification
  fmcsa_basic VARCHAR(50), -- 'Vehicle Maintenance', 'Driver Fitness', etc.
  fmcsa_violation_code VARCHAR(20),

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for inspection_items
CREATE INDEX IF NOT EXISTS idx_inspection_items_tenant_id ON inspection_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inspection_items_inspection_id ON inspection_items(inspection_id);
CREATE INDEX IF NOT EXISTS idx_inspection_items_category ON inspection_items(category);
CREATE INDEX IF NOT EXISTS idx_inspection_items_condition ON inspection_items(condition);
CREATE INDEX IF NOT EXISTS idx_inspection_items_severity ON inspection_items(severity);
CREATE INDEX IF NOT EXISTS idx_inspection_items_corrective_action ON inspection_items(corrective_action_required) WHERE corrective_action_required = TRUE;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON inspection_items TO webapp;

-- Comments
COMMENT ON TABLE inspection_items IS 'Individual checklist items for vehicle inspections';
COMMENT ON COLUMN inspection_items.category IS 'FMCSA categories: Brakes, Coupling Devices, Exhaust System, Frame, Fuel System, Lighting, Safe Loading, Steering, Suspension, Tires, Wheels & Rims, Windshield, Wipers';
COMMENT ON COLUMN inspection_items.condition IS 'Satisfactory (OK), Defective (needs repair), Not Applicable';
COMMENT ON COLUMN inspection_items.severity IS 'Minor (repair soon), Major (repair before next trip), Critical (repair immediately), Out of Service (cannot operate)';

-- ============================================================================
-- PART 5: ENHANCE MAINTENANCE_SCHEDULES TABLE
-- ============================================================================

-- Add recurrence and automation fields
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS recurring_enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS recurrence_rule TEXT; -- iCalendar RRULE format
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS auto_create_work_order BOOLEAN DEFAULT FALSE;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS notification_lead_time_days INTEGER DEFAULT 7;
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS notification_recipients UUID[]; -- Array of user IDs

-- Add template fields
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS work_order_template JSONB DEFAULT '{}';
ALTER TABLE maintenance_schedules ADD COLUMN IF NOT EXISTS checklist_template JSONB DEFAULT '[]';

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_recurring ON maintenance_schedules(recurring_enabled) WHERE recurring_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_maintenance_schedules_auto_create ON maintenance_schedules(auto_create_work_order) WHERE auto_create_work_order = TRUE;

-- ============================================================================
-- PART 6: CREATE TRIGGER FUNCTIONS FOR AUTO-CALCULATION
-- ============================================================================

-- Trigger function to auto-calculate work_order parts_cost and total cost
CREATE OR REPLACE FUNCTION update_work_order_costs()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate parts_cost from work_order_parts
  UPDATE work_orders
  SET
    parts_cost = COALESCE((
      SELECT SUM(line_total)
      FROM work_order_parts
      WHERE work_order_id = NEW.work_order_id
    ), 0),
    updated_at = NOW()
  WHERE id = NEW.work_order_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on work_order_parts for cost recalculation
DROP TRIGGER IF EXISTS trg_update_work_order_costs ON work_order_parts;
CREATE TRIGGER trg_update_work_order_costs
  AFTER INSERT OR UPDATE OR DELETE ON work_order_parts
  FOR EACH ROW
  EXECUTE FUNCTION update_work_order_costs();

-- Trigger function to auto-calculate labor_cost
CREATE OR REPLACE FUNCTION calculate_work_order_labor_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate labor_cost as labor_hours * labor_rate_per_hour
  IF NEW.labor_hours IS NOT NULL AND NEW.labor_rate_per_hour IS NOT NULL THEN
    NEW.labor_cost := NEW.labor_hours * NEW.labor_rate_per_hour;
  END IF;

  -- Calculate actual_cost as labor_cost + parts_cost + tax_amount + fees - discount
  NEW.actual_cost := COALESCE(NEW.labor_cost, 0)
                   + COALESCE(NEW.parts_cost, 0)
                   + COALESCE(NEW.tax_amount, 0)
                   + COALESCE(NEW.shop_supplies_fee, 0)
                   + COALESCE(NEW.environmental_fee, 0)
                   - COALESCE(NEW.discount_amount, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on work_orders for labor cost calculation
DROP TRIGGER IF EXISTS trg_calculate_work_order_costs ON work_orders;
CREATE TRIGGER trg_calculate_work_order_costs
  BEFORE INSERT OR UPDATE OF labor_hours, labor_rate_per_hour, parts_cost,
                              tax_amount, shop_supplies_fee, environmental_fee, discount_amount
  ON work_orders
  FOR EACH ROW
  EXECUTE FUNCTION calculate_work_order_labor_cost();

-- ============================================================================
-- PART 7: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN work_orders.labor_rate_per_hour IS 'Hourly labor rate for this work order (default $85/hour)';
COMMENT ON COLUMN work_orders.labor_cost IS 'Auto-calculated: labor_hours * labor_rate_per_hour';
COMMENT ON COLUMN work_orders.parts_cost IS 'Auto-calculated: sum of all work_order_parts.line_total';
COMMENT ON COLUMN work_orders.actual_cost IS 'Auto-calculated: labor_cost + parts_cost + tax + fees - discount';
COMMENT ON COLUMN work_orders.warranty_work IS 'TRUE if this work is covered under warranty';
COMMENT ON COLUMN work_orders.requires_approval IS 'TRUE if cost exceeds approval_threshold_amount';
COMMENT ON COLUMN work_orders.fault_codes_before IS 'JSONB array of OBD-II fault codes before repair';
COMMENT ON COLUMN work_orders.fault_codes_after IS 'JSONB array of OBD-II fault codes after repair (should be cleared)';

COMMENT ON COLUMN inspections.is_dvir IS 'TRUE if this is a Driver Vehicle Inspection Report';
COMMENT ON COLUMN inspections.fmcsa_recordable IS 'TRUE if this inspection must be retained for FMCSA compliance (14 months for DVIR)';
COMMENT ON COLUMN inspections.vehicle_placed_out_of_service IS 'TRUE if vehicle was placed out of service due to defects';

COMMENT ON COLUMN maintenance_schedules.recurrence_rule IS 'iCalendar RRULE format for complex recurrence patterns';
COMMENT ON COLUMN maintenance_schedules.auto_create_work_order IS 'TRUE to automatically create work orders when maintenance is due';

-- ============================================================================
-- PART 8: CREATE VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Work orders with full cost breakdown
CREATE OR REPLACE VIEW work_orders_with_costs AS
SELECT
  wo.id,
  wo.tenant_id,
  wo.number AS work_order_number,
  wo.vehicle_id,
  wo.title,
  wo.type,
  wo.priority,
  wo.status,
  wo.labor_hours,
  wo.labor_rate_per_hour,
  wo.labor_cost,
  wo.parts_cost,
  wo.tax_amount,
  wo.shop_supplies_fee,
  wo.environmental_fee,
  wo.discount_amount,
  wo.actual_cost AS total_cost,
  wo.warranty_work,
  wo.warranty_coverage_amount,
  wo.created_at,
  wo.completed_at,
  v.name AS vehicle_name,
  v.number AS vehicle_number,
  COALESCE(u.first_name || ' ' || u.last_name, 'Unassigned') AS technician_name
FROM work_orders wo
LEFT JOIN vehicles v ON wo.vehicle_id = v.id
LEFT JOIN users u ON wo.assigned_to_id = u.id
WHERE wo.deleted_at IS NULL;

-- View: Inspections requiring corrective action
CREATE OR REPLACE VIEW inspections_requiring_action AS
SELECT
  i.id,
  i.tenant_id,
  i.vehicle_id,
  i.type AS inspection_type,
  i.completed_at,
  i.requires_corrective_action,
  i.corrective_work_order_id,
  i.vehicle_placed_out_of_service,
  i.out_of_service_at,
  v.name AS vehicle_name,
  v.number AS vehicle_number,
  COUNT(ii.id) AS defect_count,
  COUNT(ii.id) FILTER (WHERE ii.severity = 'Critical') AS critical_defects,
  COUNT(ii.id) FILTER (WHERE ii.severity = 'Out of Service') AS out_of_service_defects
FROM inspections i
LEFT JOIN vehicles v ON i.vehicle_id = v.id
LEFT JOIN inspection_items ii ON i.id = ii.inspection_id AND ii.condition = 'Defective'
WHERE i.requires_corrective_action = TRUE
GROUP BY i.id, i.tenant_id, i.vehicle_id, i.type, i.completed_at,
         i.requires_corrective_action, i.corrective_work_order_id,
         i.vehicle_placed_out_of_service, i.out_of_service_at,
         v.name, v.number;

-- Grant view permissions
GRANT SELECT ON work_orders_with_costs TO webapp;
GRANT SELECT ON inspections_requiring_action TO webapp;

-- ============================================================================
-- PART 9: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate total work order cost with all fees
CREATE OR REPLACE FUNCTION calculate_work_order_total(
  p_labor_hours NUMERIC,
  p_labor_rate NUMERIC,
  p_parts_cost NUMERIC,
  p_tax_rate NUMERIC DEFAULT 0.07,
  p_shop_supplies_fee NUMERIC DEFAULT 25.00,
  p_environmental_fee NUMERIC DEFAULT 5.00,
  p_discount_amount NUMERIC DEFAULT 0.00
) RETURNS NUMERIC AS $$
DECLARE
  v_labor_cost NUMERIC;
  v_subtotal NUMERIC;
  v_tax_amount NUMERIC;
  v_total NUMERIC;
BEGIN
  -- Calculate labor cost
  v_labor_cost := COALESCE(p_labor_hours, 0) * COALESCE(p_labor_rate, 85.00);

  -- Calculate subtotal (labor + parts + fees)
  v_subtotal := v_labor_cost
              + COALESCE(p_parts_cost, 0)
              + COALESCE(p_shop_supplies_fee, 0)
              + COALESCE(p_environmental_fee, 0);

  -- Calculate tax on subtotal
  v_tax_amount := v_subtotal * COALESCE(p_tax_rate, 0.07);

  -- Calculate total
  v_total := v_subtotal + v_tax_amount - COALESCE(p_discount_amount, 0);

  RETURN ROUND(v_total, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_work_order_total IS 'Calculate total work order cost including labor, parts, tax, fees, and discounts';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary:
-- - Added 35+ columns to work_orders table
-- - Created work_order_parts junction table
-- - Added 25+ columns to inspections table
-- - Created inspection_items table
-- - Enhanced maintenance_schedules with recurrence fields
-- - Created auto-calculation triggers
-- - Created views for common queries
-- - Created helper functions for cost calculation
