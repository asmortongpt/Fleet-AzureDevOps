-- ============================================================================
-- PURCHASE ORDER WORKFLOW SYSTEM
-- Complete PO management with multi-level approvals, receiving, and audit
-- Fortune 50 Security Standards: RLS, parameterized queries, audit logging
-- ============================================================================

-- ============================================================================
-- PURCHASE ORDER LINE ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase_order_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,

    -- Line identification
    line_number INTEGER NOT NULL,

    -- Item reference
    inventory_item_id UUID REFERENCES inventory_items(id),
    part_number VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,

    -- Quantities
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    quantity_received INTEGER DEFAULT 0 CHECK (quantity_received >= 0),
    quantity_remaining INTEGER GENERATED ALWAYS AS (quantity - COALESCE(quantity_received, 0)) STORED,

    -- Pricing
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
    tax_rate NUMERIC(5,4) DEFAULT 0 CHECK (tax_rate >= 0 AND tax_rate <= 1),
    discount NUMERIC(5,4) DEFAULT 0 CHECK (discount >= 0 AND discount <= 1),
    line_total NUMERIC(10,2) GENERATED ALWAYS AS (
        quantity * unit_price * (1 + tax_rate) * (1 - discount)
    ) STORED,

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'backordered', 'partial', 'received', 'cancelled')),

    -- Additional info
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_line_number UNIQUE (purchase_order_id, line_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_po_line_items_purchase_order ON purchase_order_line_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_line_items_inventory_item ON purchase_order_line_items(inventory_item_id) WHERE inventory_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_po_line_items_status ON purchase_order_line_items(status);

-- ============================================================================
-- PURCHASE ORDER APPROVALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase_order_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,

    -- Approver
    approver_id UUID NOT NULL REFERENCES users(id),
    approval_level INTEGER NOT NULL CHECK (approval_level > 0),

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,

    -- Comments
    comments TEXT,

    -- Audit
    ip_address INET,
    user_agent TEXT,

    CONSTRAINT unique_approval_per_level UNIQUE (purchase_order_id, approver_id, approval_level)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_po_approvals_purchase_order ON purchase_order_approvals(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_approvals_approver ON purchase_order_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_po_approvals_status ON purchase_order_approvals(status);
CREATE INDEX IF NOT EXISTS idx_po_approvals_pending ON purchase_order_approvals(purchase_order_id, status) WHERE status = 'pending';

-- ============================================================================
-- PURCHASE ORDER RECEIVING
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase_order_receiving (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,

    -- Receiving details
    received_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    received_by UUID NOT NULL REFERENCES users(id),
    received_by_name VARCHAR(255) NOT NULL,

    -- Shipping info
    packing_slip_number VARCHAR(100),
    carrier VARCHAR(100),
    tracking_number VARCHAR(100),
    freight_cost NUMERIC(10,2),

    -- Inspection
    inspection_status VARCHAR(20) DEFAULT 'pending' CHECK (inspection_status IN ('pending', 'passed', 'failed', 'partial')),
    inspector_id UUID REFERENCES users(id),
    inspected_at TIMESTAMP WITH TIME ZONE,

    -- Notes
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_po_receiving_purchase_order ON purchase_order_receiving(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_receiving_date ON purchase_order_receiving(received_date DESC);
CREATE INDEX IF NOT EXISTS idx_po_receiving_received_by ON purchase_order_receiving(received_by);
CREATE INDEX IF NOT EXISTS idx_po_receiving_packing_slip ON purchase_order_receiving(packing_slip_number) WHERE packing_slip_number IS NOT NULL;

-- ============================================================================
-- PURCHASE ORDER RECEIVING LINE ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase_order_receiving_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receiving_id UUID NOT NULL REFERENCES purchase_order_receiving(id) ON DELETE CASCADE,
    line_item_id UUID NOT NULL REFERENCES purchase_order_line_items(id),
    inventory_item_id UUID REFERENCES inventory_items(id),

    -- Quantities
    quantity_received INTEGER NOT NULL CHECK (quantity_received > 0),

    -- Condition
    condition VARCHAR(20) DEFAULT 'good' CHECK (condition IN ('good', 'damaged', 'defective', 'wrong_item')),

    -- Location where item was put
    warehouse_location VARCHAR(100),
    bin_location VARCHAR(50),

    -- Notes
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_po_receiving_items_receiving ON purchase_order_receiving_items(receiving_id);
CREATE INDEX IF NOT EXISTS idx_po_receiving_items_line_item ON purchase_order_receiving_items(line_item_id);
CREATE INDEX IF NOT EXISTS idx_po_receiving_items_inventory ON purchase_order_receiving_items(inventory_item_id) WHERE inventory_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_po_receiving_items_condition ON purchase_order_receiving_items(condition) WHERE condition != 'good';

-- ============================================================================
-- PURCHASE ORDER HISTORY/AUDIT
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase_order_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,

    -- Change details
    changed_by UUID NOT NULL REFERENCES users(id),
    changed_by_name VARCHAR(255) NOT NULL,
    change_type VARCHAR(50) NOT NULL, -- 'status_change', 'approval', 'modification', 'receiving', etc.

    -- Old and new values
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    old_values JSONB,
    new_values JSONB,

    -- Context
    reason TEXT,
    notes TEXT,

    -- Timestamp
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Audit metadata
    ip_address INET,
    user_agent TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_po_history_purchase_order ON purchase_order_history(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_po_history_changed_by ON purchase_order_history(changed_by);
CREATE INDEX IF NOT EXISTS idx_po_history_changed_at ON purchase_order_history(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_po_history_change_type ON purchase_order_history(change_type);

-- ============================================================================
-- UPDATE EXISTING PURCHASE_ORDERS TABLE (add workflow fields)
-- ============================================================================
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS submitted_for_approval_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS ordered_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS ordered_by UUID REFERENCES users(id);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES users(id);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS last_received_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_confirmation_number VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS vendor_po_number VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Purchase orders with approval status
CREATE OR REPLACE VIEW v_purchase_orders_with_approvals AS
SELECT
    po.*,
    v.name as vendor_name,
    COUNT(DISTINCT pol.id) as line_item_count,
    SUM(pol.quantity) as total_quantity_ordered,
    SUM(COALESCE(pol.quantity_received, 0)) as total_quantity_received,
    COUNT(DISTINCT poa.id) FILTER (WHERE poa.status = 'pending') as pending_approvals,
    COUNT(DISTINCT poa.id) FILTER (WHERE poa.status = 'approved') as approved_count,
    COUNT(DISTINCT poa.id) FILTER (WHERE poa.status = 'rejected') as rejected_count
FROM purchase_orders po
LEFT JOIN vendors v ON po.vendor_id = v.id
LEFT JOIN purchase_order_line_items pol ON po.id = pol.purchase_order_id
LEFT JOIN purchase_order_approvals poa ON po.id = poa.purchase_order_id
GROUP BY po.id, v.name;

-- Pending approvals for users
CREATE OR REPLACE VIEW v_pending_approvals_for_user AS
SELECT
    poa.id as approval_id,
    poa.approver_id,
    poa.approval_level,
    po.*,
    v.name as vendor_name,
    v.contact_name as vendor_contact,
    COALESCE(NULLIF(TRIM(CONCAT(u.first_name, ' ', u.last_name)), ''), u.email) as submitted_by_name,
    EXTRACT(DAY FROM NOW() - po.submitted_for_approval_at) as days_pending
FROM purchase_order_approvals poa
JOIN purchase_orders po ON poa.purchase_order_id = po.id
JOIN vendors v ON po.vendor_id = v.id
LEFT JOIN users u ON po.submitted_by = u.id
WHERE poa.status = 'pending'
  AND po.status = 'pending'
ORDER BY po.submitted_for_approval_at;

-- Receiving summary
CREATE OR REPLACE VIEW v_purchase_order_receiving_summary AS
SELECT
    po.id as purchase_order_id,
    po.number as po_number,
    v.name as vendor_name,
    COUNT(DISTINCT por.id) as receiving_count,
    SUM(pori.quantity_received) as total_received,
    MAX(por.received_date) as last_received_date,
    SUM(CASE WHEN pori.condition != 'good' THEN pori.quantity_received ELSE 0 END) as damaged_quantity,
    SUM(CASE WHEN pori.condition = 'defective' THEN pori.quantity_received ELSE 0 END) as defective_quantity
FROM purchase_orders po
JOIN vendors v ON po.vendor_id = v.id
LEFT JOIN purchase_order_receiving por ON po.id = por.purchase_order_id
LEFT JOIN purchase_order_receiving_items pori ON por.id = pori.receiving_id
GROUP BY po.id, po.number, v.name;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-create history record on status change
CREATE OR REPLACE FUNCTION log_purchase_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO purchase_order_history (
            purchase_order_id,
            changed_by,
            changed_by_name,
            change_type,
            old_status,
            new_status,
            reason
        ) VALUES (
            NEW.id,
            COALESCE(NEW.approved_by, NEW.ordered_by, NEW.cancelled_by, NEW.submitted_by),
            'System',
            'status_change',
            OLD.status,
            NEW.status,
            CASE NEW.status
                WHEN 'pending_approval' THEN 'Submitted for approval'
                WHEN 'approved' THEN 'Approved'
                WHEN 'ordered' THEN 'Sent to vendor'
                WHEN 'partially_received' THEN 'Partially received'
                WHEN 'received' THEN 'Fully received'
                WHEN 'cancelled' THEN NEW.cancellation_reason
                ELSE 'Status changed'
            END
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_po_status_change
AFTER UPDATE OF status ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION log_purchase_order_status_change();

-- Update line item status based on quantities
CREATE OR REPLACE FUNCTION update_po_line_item_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.quantity_received >= NEW.quantity THEN
        NEW.status := 'received';
    ELSIF NEW.quantity_received > 0 THEN
        NEW.status := 'partial';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_po_line_item_status
BEFORE UPDATE OF quantity_received ON purchase_order_line_items
FOR EACH ROW
EXECUTE FUNCTION update_po_line_item_status();

-- Update timestamps
CREATE TRIGGER update_po_line_items_updated_at
BEFORE UPDATE ON purchase_order_line_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE purchase_order_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_receiving ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_receiving_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_history ENABLE ROW LEVEL SECURITY;

-- Policies (tenant isolation through purchase_orders FK)
CREATE POLICY po_line_items_tenant_isolation ON purchase_order_line_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM purchase_orders po
            WHERE po.id = purchase_order_id
              AND po.tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID
        )
    );

CREATE POLICY po_approvals_tenant_isolation ON purchase_order_approvals
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM purchase_orders po
            WHERE po.id = purchase_order_id
              AND po.tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID
        )
    );

CREATE POLICY po_receiving_tenant_isolation ON purchase_order_receiving
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM purchase_orders po
            WHERE po.id = purchase_order_id
              AND po.tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID
        )
    );

CREATE POLICY po_receiving_items_tenant_isolation ON purchase_order_receiving_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM purchase_order_receiving por
            JOIN purchase_orders po ON por.purchase_order_id = po.id
            WHERE por.id = receiving_id
              AND po.tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID
        )
    );

CREATE POLICY po_history_tenant_isolation ON purchase_order_history
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM purchase_orders po
            WHERE po.id = purchase_order_id
              AND po.tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID
        )
    );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE purchase_order_line_items IS 'Individual line items for each purchase order';
COMMENT ON TABLE purchase_order_approvals IS 'Multi-level approval workflow for purchase orders';
COMMENT ON TABLE purchase_order_receiving IS 'Receiving records for purchase order deliveries';
COMMENT ON TABLE purchase_order_receiving_items IS 'Individual items received per receiving record';
COMMENT ON TABLE purchase_order_history IS 'Complete audit trail of all purchase order changes';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
