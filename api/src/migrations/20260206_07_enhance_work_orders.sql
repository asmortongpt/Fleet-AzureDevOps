-- ============================================================================
-- Migration: Enhance Work Orders Table for Enterprise Maintenance Management
-- Created: 2026-02-06
-- Purpose: Add industry-standard fields for VMRS, warranty, root cause, QC
-- ============================================================================

-- ============================================================================
-- PART 1: VMRS Classification (Vehicle Maintenance Reporting Standards)
-- ============================================================================

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS vmrs_code VARCHAR(20);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS vmrs_system VARCHAR(100);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS vmrs_assembly VARCHAR(100);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS vmrs_component VARCHAR(100);

COMMENT ON COLUMN work_orders.vmrs_code IS 'VMRS system code (e.g., 033 = Brakes, 013 = Tires, 042 = Engine)';
COMMENT ON COLUMN work_orders.vmrs_system IS 'VMRS system name';
COMMENT ON COLUMN work_orders.vmrs_assembly IS 'VMRS assembly name';
COMMENT ON COLUMN work_orders.vmrs_component IS 'VMRS component name';

-- ============================================================================
-- PART 2: Warranty & Claims
-- ============================================================================

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS warranty_claim BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS warranty_provider VARCHAR(100);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS warranty_claim_number VARCHAR(100);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS warranty_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS warranty_status VARCHAR(50);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS warranty_submitted_date TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS warranty_approved_date TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS warranty_denial_reason TEXT;

COMMENT ON COLUMN work_orders.warranty_claim IS 'Is this work covered under warranty?';
COMMENT ON COLUMN work_orders.warranty_amount IS 'Amount reimbursed by warranty (parts + labor)';

-- ============================================================================
-- PART 3: Root Cause Analysis & Failure Classification
-- ============================================================================

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS failure_type VARCHAR(50);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS failure_mode VARCHAR(100);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS root_cause TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS corrective_action TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS preventive_action TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS component_replaced VARCHAR(200);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS component_condition VARCHAR(50);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS component_age_months INTEGER;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS component_age_miles INTEGER;

COMMENT ON COLUMN work_orders.failure_type IS 'e.g., mechanical_failure, electrical_failure, wear_and_tear, accident_damage, operator_error';
COMMENT ON COLUMN work_orders.failure_mode IS 'e.g., fatigue, corrosion, overload, misalignment';
COMMENT ON COLUMN work_orders.component_condition IS 'e.g., failed, worn, damaged, serviceable';

-- ============================================================================
-- PART 4: Labor Details & Cost Breakdown
-- ============================================================================

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS technician_count INTEGER DEFAULT 1;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS labor_rate_per_hour NUMERIC(10,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS overtime_hours NUMERIC(5,2) DEFAULT 0;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS overtime_rate_per_hour NUMERIC(10,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS overtime_cost NUMERIC(10,2) DEFAULT 0;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS parts_markup_percent NUMERIC(5,2) DEFAULT 0;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS parts_tax NUMERIC(10,2) DEFAULT 0;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS outside_services_cost NUMERIC(10,2) DEFAULT 0;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS outside_services_vendor_id UUID;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS shop_supplies_cost NUMERIC(10,2) DEFAULT 0;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS hazmat_disposal_cost NUMERIC(10,2) DEFAULT 0;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS sublet_cost NUMERIC(10,2) DEFAULT 0;

COMMENT ON COLUMN work_orders.technician_count IS 'Number of techs working on this job';
COMMENT ON COLUMN work_orders.outside_services_cost IS 'Cost for outsourced work (towing, mobile repair, specialty services)';
COMMENT ON COLUMN work_orders.shop_supplies_cost IS 'Consumables (rags, cleaners, fluids not tracked as parts)';

-- ============================================================================
-- PART 5: Compliance & Safety
-- ============================================================================

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS safety_critical BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS out_of_service BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS out_of_service_tag_number VARCHAR(50);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS recall_related BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS recall_number VARCHAR(100);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS regulatory_inspection BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS regulatory_agency VARCHAR(100);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS inspection_passed BOOLEAN;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS inspection_failure_reason TEXT;

COMMENT ON COLUMN work_orders.safety_critical IS 'Safety-critical repair (brakes, steering, lights, etc.)';
COMMENT ON COLUMN work_orders.out_of_service IS 'Vehicle tagged out of service until repair';
COMMENT ON COLUMN work_orders.recall_related IS 'Manufacturer recall or TSB (Technical Service Bulletin)';

-- ============================================================================
-- PART 6: Service Location & Workflow
-- ============================================================================

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS service_location_type VARCHAR(50);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS service_location_address VARCHAR(500);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS requested_by UUID;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS requested_date TIMESTAMP DEFAULT NOW();
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS approved_date TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS approval_notes TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS po_number VARCHAR(50);

COMMENT ON COLUMN work_orders.service_location_type IS 'in_house, mobile_service, roadside, outsourced, tow_in';
COMMENT ON COLUMN work_orders.po_number IS 'Purchase order number for parts/services';

-- ============================================================================
-- PART 7: Quality Control & Rework
-- ============================================================================

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS qc_inspector_id UUID;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS qc_inspection_date TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS qc_passed BOOLEAN;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS qc_notes TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS rework_required BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS rework_reason TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS rework_completed_date TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS customer_complaint TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS customer_concern_verified BOOLEAN;

COMMENT ON COLUMN work_orders.qc_inspector_id IS 'Technician or supervisor who performed QC inspection';
COMMENT ON COLUMN work_orders.qc_passed IS 'Did the work pass quality inspection?';

-- ============================================================================
-- PART 8: Downtime Tracking & Financial Impact
-- ============================================================================

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS downtime_start TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS downtime_end TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS downtime_hours NUMERIC(10,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS lost_revenue NUMERIC(10,2) DEFAULT 0;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS lost_revenue_calculation_method VARCHAR(100);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS rental_vehicle_cost NUMERIC(10,2) DEFAULT 0;

COMMENT ON COLUMN work_orders.downtime_hours IS 'Total vehicle downtime (may exceed actual labor hours)';
COMMENT ON COLUMN work_orders.lost_revenue IS 'Estimated revenue lost due to vehicle being unavailable';
COMMENT ON COLUMN work_orders.rental_vehicle_cost IS 'Cost of rental/loaner vehicle while unit is down';

-- ============================================================================
-- PART 9: Follow-up & Recurring Issues
-- ============================================================================

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS follow_up_required BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS follow_up_date DATE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS follow_up_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS repeat_repair BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS previous_work_order_id UUID;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS days_since_last_repair INTEGER;

COMMENT ON COLUMN work_orders.repeat_repair IS 'Has this issue been repaired before within the last 90 days?';
COMMENT ON COLUMN work_orders.previous_work_order_id IS 'Reference to previous WO for the same issue';

-- ============================================================================
-- PART 10: Meter Readings at Completion
-- ============================================================================

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS odometer_at_completion NUMERIC(10,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS engine_hours_at_completion NUMERIC(10,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS next_service_due_miles NUMERIC(10,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS next_service_due_hours NUMERIC(10,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS next_service_due_date DATE;

COMMENT ON COLUMN work_orders.odometer_at_completion IS 'Odometer reading when work was completed (for PM tracking)';
COMMENT ON COLUMN work_orders.next_service_due_miles IS 'Next PM service due at this mileage';

-- ============================================================================
-- PART 11: Communication & Customer Service
-- ============================================================================

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS customer_notified BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS customer_notified_date TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS estimated_completion_date TIMESTAMP;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS estimated_total_cost NUMERIC(10,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS customer_approved_estimate BOOLEAN;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS customer_approval_date TIMESTAMP;

-- ============================================================================
-- PART 12: Technician Performance Metrics
-- ============================================================================

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS estimated_labor_hours NUMERIC(5,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS labor_efficiency_percent NUMERIC(5,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS first_time_fix BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN work_orders.labor_efficiency_percent IS '(estimated_hours / actual_hours) * 100 - measures tech efficiency';
COMMENT ON COLUMN work_orders.first_time_fix IS 'Was the issue resolved on first attempt (no comebacks)?';

-- ============================================================================
-- PART 13: Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_work_orders_vmrs_code ON work_orders(vmrs_code);
CREATE INDEX IF NOT EXISTS idx_work_orders_warranty_claim ON work_orders(warranty_claim) WHERE warranty_claim = TRUE;
CREATE INDEX IF NOT EXISTS idx_work_orders_safety_critical ON work_orders(safety_critical) WHERE safety_critical = TRUE;
CREATE INDEX IF NOT EXISTS idx_work_orders_out_of_service ON work_orders(out_of_service) WHERE out_of_service = TRUE;
CREATE INDEX IF NOT EXISTS idx_work_orders_qc_failed ON work_orders(qc_passed) WHERE qc_passed = FALSE;
CREATE INDEX IF NOT EXISTS idx_work_orders_rework ON work_orders(rework_required) WHERE rework_required = TRUE;
CREATE INDEX IF NOT EXISTS idx_work_orders_repeat_repair ON work_orders(repeat_repair) WHERE repeat_repair = TRUE;
CREATE INDEX IF NOT EXISTS idx_work_orders_requested_by ON work_orders(requested_by);
CREATE INDEX IF NOT EXISTS idx_work_orders_approved_by ON work_orders(approved_by);
CREATE INDEX IF NOT EXISTS idx_work_orders_qc_inspector ON work_orders(qc_inspector_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_follow_up_date ON work_orders(follow_up_date) WHERE follow_up_completed = FALSE;

-- ============================================================================
-- PART 14: Foreign Key Constraints
-- ============================================================================

ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_requested_by_fkey;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_requested_by_fkey
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_approved_by_fkey;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_qc_inspector_id_fkey;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_qc_inspector_id_fkey
  FOREIGN KEY (qc_inspector_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_outside_services_vendor_id_fkey;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_outside_services_vendor_id_fkey
  FOREIGN KEY (outside_services_vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;

ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_previous_work_order_id_fkey;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_previous_work_order_id_fkey
  FOREIGN KEY (previous_work_order_id) REFERENCES work_orders(id) ON DELETE SET NULL;

-- ============================================================================
-- PART 15: Check Constraints
-- ============================================================================

ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_failure_type_check;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_failure_type_check
  CHECK (failure_type IN (
    'mechanical_failure', 'electrical_failure', 'hydraulic_failure', 'pneumatic_failure',
    'wear_and_tear', 'accident_damage', 'operator_error', 'vandalism',
    'environmental_damage', 'corrosion', 'manufacturing_defect'
  ));

ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_service_location_type_check;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_service_location_type_check
  CHECK (service_location_type IN (
    'in_house', 'mobile_service', 'roadside', 'outsourced', 'tow_in', 'customer_site'
  ));

ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_warranty_status_check;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_warranty_status_check
  CHECK (warranty_status IN (
    'pending', 'submitted', 'approved', 'denied', 'paid', 'cancelled'
  ));

ALTER TABLE work_orders DROP CONSTRAINT IF EXISTS work_orders_component_condition_check;
ALTER TABLE work_orders ADD CONSTRAINT work_orders_component_condition_check
  CHECK (component_condition IN (
    'failed', 'worn', 'damaged', 'serviceable', 'replaced', 'repaired'
  ));

-- ============================================================================
-- PART 16: Update Total Cost Calculation (Drop and Recreate)
-- ============================================================================

-- Drop the existing generated column
ALTER TABLE work_orders DROP COLUMN IF EXISTS total_cost;

-- Recreate with comprehensive cost calculation
ALTER TABLE work_orders ADD COLUMN total_cost NUMERIC(10,2) GENERATED ALWAYS AS (
  COALESCE(labor_cost, 0) +
  COALESCE(overtime_cost, 0) +
  COALESCE(parts_cost, 0) +
  COALESCE(parts_tax, 0) +
  COALESCE(outside_services_cost, 0) +
  COALESCE(shop_supplies_cost, 0) +
  COALESCE(hazmat_disposal_cost, 0) +
  COALESCE(sublet_cost, 0) -
  COALESCE(warranty_amount, 0)
) STORED;

COMMENT ON COLUMN work_orders.total_cost IS 'Total WO cost = labor + OT + parts + tax + outside + supplies + hazmat + sublet - warranty';

-- ============================================================================
-- Summary
-- ============================================================================

COMMENT ON TABLE work_orders IS 'Enhanced work orders with VMRS codes, warranty tracking, root cause analysis, QC, downtime tracking, and comprehensive cost breakdown';
