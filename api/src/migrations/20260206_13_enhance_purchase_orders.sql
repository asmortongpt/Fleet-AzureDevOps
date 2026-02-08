-- ============================================================================
-- Migration: Enhance Purchase Orders for Procurement Workflow
-- Created: 2026-02-06
-- Purpose: Add multi-level approval, receiving, 3-way matching, budget tracking
-- ============================================================================

-- ============================================================================
-- PART 1: PO Classification & Workflow
-- ============================================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS po_type VARCHAR(50);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS po_category VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS requisition_id UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS requisition_number VARCHAR(50);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(20);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50) DEFAULT 'draft';

COMMENT ON COLUMN purchase_orders.po_type IS 'standard, blanket, contract, emergency';
COMMENT ON COLUMN purchase_orders.workflow_status IS 'draft, pending_approval, approved, rejected, issued, partially_received, fully_received, closed, cancelled';

-- ============================================================================
-- PART 2: Multi-Level Approval Workflow
-- ============================================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT TRUE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS approval_level_required INTEGER DEFAULT 1;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS current_approval_level INTEGER DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS level1_approver_id UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS level1_approved_date TIMESTAMP;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS level1_approval_notes TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS level2_approver_id UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS level2_approved_date TIMESTAMP;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS level2_approval_notes TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS level3_approver_id UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS level3_approved_date TIMESTAMP;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS level3_approval_notes TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS final_approver_id UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS final_approved_date TIMESTAMP;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS fully_approved BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- PART 3: Rejection & Cancellation
-- ============================================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rejected BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rejected_by UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rejected_date TIMESTAMP;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS cancelled BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS cancelled_by UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS cancelled_date TIMESTAMP;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- ============================================================================
-- PART 4: Pricing & Financial
-- ============================================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5,4);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS handling_fee NUMERIC(10,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS discount_percent NUMERIC(5,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(12,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS currency_code VARCHAR(3) DEFAULT 'USD';
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(12,6);

-- ============================================================================
-- PART 5: Budget Tracking
-- ============================================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS budget_id UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS budget_year INTEGER;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS budget_category VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS cost_center VARCHAR(50);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS gl_account VARCHAR(50);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS capital_expense BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS depreciation_years INTEGER;

-- ============================================================================
-- PART 6: Receiving & Fulfillment
-- ============================================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS expected_delivery_date DATE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS actual_delivery_date DATE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS partial_shipments_allowed BOOLEAN DEFAULT TRUE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS shipment_count INTEGER DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS received_date TIMESTAMP;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS received_by UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS received_at_facility_id UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS quantity_ordered INTEGER;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS quantity_received INTEGER DEFAULT 0;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS quantity_outstanding INTEGER;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS fully_received BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS receiving_notes TEXT;

-- ============================================================================
-- PART 7: Inspection & Quality Control
-- ============================================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS inspection_required BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS inspection_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS inspected_by UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS inspection_date TIMESTAMP;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS inspection_passed BOOLEAN;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS inspection_notes TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS defects_found BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS defect_details TEXT;

-- ============================================================================
-- PART 8: Returns & Disputes
-- ============================================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS return_initiated BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS return_date TIMESTAMP;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS return_reason TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS return_quantity INTEGER;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS return_amount NUMERIC(10,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS rma_number VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS dispute_active BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS dispute_reason TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS dispute_amount NUMERIC(10,2);

-- ============================================================================
-- PART 9: Invoice Matching (3-Way Match)
-- ============================================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS invoice_received BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS invoice_date DATE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS invoice_amount NUMERIC(12,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS invoice_matched BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS invoice_variance_amount NUMERIC(10,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS invoice_variance_percent NUMERIC(5,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS three_way_match_passed BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS match_exception TEXT;

COMMENT ON COLUMN purchase_orders.three_way_match_passed IS 'PO vs Invoice vs Goods Receipt matching';

-- ============================================================================
-- PART 10: Payment Tracking
-- ============================================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_due_date DATE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_made BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_date DATE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(12,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_check_number VARCHAR(50);

-- ============================================================================
-- PART 11: Shipping & Logistics
-- ============================================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS shipping_carrier VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS shipping_account_number VARCHAR(50);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS freight_terms VARCHAR(50);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS incoterms VARCHAR(10);

COMMENT ON COLUMN purchase_orders.freight_terms IS 'prepaid, collect, third_party';
COMMENT ON COLUMN purchase_orders.incoterms IS 'FOB, CIF, DDP, etc.';

-- ============================================================================
-- PART 12: Related Documents & Attachments
-- ============================================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS quote_number VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS quote_date DATE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS contract_reference VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS attachments JSONB;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- ============================================================================
-- PART 13: Communication & Notes
-- ============================================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS buyer_contact_name VARCHAR(200);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS buyer_contact_phone VARCHAR(20);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS buyer_contact_email VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_contact_name VARCHAR(200);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_contact_phone VARCHAR(20);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_contact_email VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_notes TEXT;

-- ============================================================================
-- PART 14: Performance & SLA
-- ============================================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS lead_time_days INTEGER;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS actual_lead_time_days INTEGER;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS on_time_delivery BOOLEAN;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS days_late INTEGER;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS days_early INTEGER;

-- ============================================================================
-- PART 15: Blanket PO Specific
-- ============================================================================

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS blanket_po BOOLEAN DEFAULT FALSE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS blanket_po_start_date DATE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS blanket_po_end_date DATE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS blanket_po_total_value NUMERIC(12,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS blanket_po_remaining_value NUMERIC(12,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS release_number INTEGER;

-- ============================================================================
-- PART 16: Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_purchase_orders_workflow_status ON purchase_orders(workflow_status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_requisition ON purchase_orders(requisition_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_level1_approver ON purchase_orders(level1_approver_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_level2_approver ON purchase_orders(level2_approver_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_level3_approver ON purchase_orders(level3_approver_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_budget ON purchase_orders(budget_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_received_by ON purchase_orders(received_by);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_inspected_by ON purchase_orders(inspected_by);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_fully_approved ON purchase_orders(fully_approved) WHERE fully_approved = FALSE;
CREATE INDEX IF NOT EXISTS idx_purchase_orders_fully_received ON purchase_orders(fully_received) WHERE fully_received = FALSE;
CREATE INDEX IF NOT EXISTS idx_purchase_orders_three_way_match ON purchase_orders(three_way_match_passed) WHERE invoice_received = TRUE;

-- ============================================================================
-- PART 17: Foreign Keys
-- ============================================================================

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_requisition_id_fkey;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_requisition_id_fkey
  FOREIGN KEY (requisition_id) REFERENCES purchase_requisitions(id) ON DELETE SET NULL;

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_level1_approver_id_fkey;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_level1_approver_id_fkey
  FOREIGN KEY (level1_approver_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_level2_approver_id_fkey;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_level2_approver_id_fkey
  FOREIGN KEY (level2_approver_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_level3_approver_id_fkey;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_level3_approver_id_fkey
  FOREIGN KEY (level3_approver_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_final_approver_id_fkey;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_final_approver_id_fkey
  FOREIGN KEY (final_approver_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_rejected_by_fkey;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_rejected_by_fkey
  FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_cancelled_by_fkey;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_cancelled_by_fkey
  FOREIGN KEY (cancelled_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_received_by_fkey;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_received_by_fkey
  FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_inspected_by_fkey;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_inspected_by_fkey
  FOREIGN KEY (inspected_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_budget_id_fkey;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_budget_id_fkey
  FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE SET NULL;

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_received_at_facility_id_fkey;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_received_at_facility_id_fkey
  FOREIGN KEY (received_at_facility_id) REFERENCES facilities(id) ON DELETE SET NULL;

-- ============================================================================
-- PART 18: Check Constraints
-- ============================================================================

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_po_type_check;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_po_type_check
  CHECK (po_type IN ('standard', 'blanket', 'contract', 'emergency'));

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_urgency_check;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_urgency_check
  CHECK (urgency_level IN ('low', 'normal', 'high', 'critical'));

ALTER TABLE purchase_orders DROP CONSTRAINT IF EXISTS purchase_orders_freight_terms_check;
ALTER TABLE purchase_orders ADD CONSTRAINT purchase_orders_freight_terms_check
  CHECK (freight_terms IN ('prepaid', 'collect', 'third_party'));

COMMENT ON TABLE purchase_orders IS 'Enhanced purchase orders with multi-level approval, receiving, 3-way matching, budget tracking, and performance metrics';
