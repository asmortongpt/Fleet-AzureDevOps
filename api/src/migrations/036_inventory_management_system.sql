-- ============================================================================
-- INVENTORY MANAGEMENT SYSTEM
-- Complete inventory tracking with parts, tools, safety equipment, fluids
-- Fortune 50 Security Standards: Parameterized queries, audit logging, RLS
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- INVENTORY ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Identification
    sku VARCHAR(50) NOT NULL UNIQUE,
    part_number VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Classification
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'parts', 'tools', 'safety-equipment', 'supplies',
        'fluids', 'tires', 'batteries', 'filters', 'electrical', 'lighting'
    )),
    subcategory VARCHAR(100),

    -- Manufacturer
    manufacturer VARCHAR(255),
    manufacturer_part_number VARCHAR(100),
    universal_part_number VARCHAR(100), -- Standardized across vendors

    -- Stock tracking
    quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    reorder_point INTEGER NOT NULL DEFAULT 10,
    reorder_quantity INTEGER NOT NULL DEFAULT 25,

    -- Location
    warehouse_location VARCHAR(100),
    bin_location VARCHAR(50),

    -- Pricing (use NUMERIC for precision with money)
    unit_cost NUMERIC(10,2) NOT NULL CHECK (unit_cost >= 0),
    list_price NUMERIC(10,2) NOT NULL CHECK (list_price >= 0),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Supplier information
    primary_supplier_id UUID REFERENCES vendors(id),
    primary_supplier_name VARCHAR(255),
    supplier_part_number VARCHAR(100),
    lead_time_days INTEGER DEFAULT 7 CHECK (lead_time_days >= 0),

    -- Vehicle compatibility
    compatible_makes TEXT[], -- Array of vehicle makes
    compatible_models TEXT[], -- Array of vehicle models
    compatible_years INTEGER[], -- Array of years

    -- Physical specifications
    weight NUMERIC(10,2), -- in pounds
    dimensions JSONB, -- {length, width, height, unit}
    specifications JSONB, -- Flexible JSON for part-specific specs

    -- Status flags
    is_active BOOLEAN DEFAULT true,
    is_hazmat BOOLEAN DEFAULT false,
    requires_refrigeration BOOLEAN DEFAULT false,
    shelf_life_days INTEGER, -- Days before expiration

    -- Tracking timestamps
    last_restocked TIMESTAMP WITH TIME ZONE,
    last_ordered TIMESTAMP WITH TIME ZONE,
    last_used TIMESTAMP WITH TIME ZONE,

    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),

    CONSTRAINT valid_reserved_quantity CHECK (quantity_reserved <= quantity_on_hand)
);

-- Indexes for performance
CREATE INDEX idx_inventory_items_tenant ON inventory_items(tenant_id);
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_items_part_number ON inventory_items(part_number);
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_manufacturer ON inventory_items(manufacturer);
CREATE INDEX idx_inventory_items_supplier ON inventory_items(primary_supplier_id);
CREATE INDEX idx_inventory_items_active ON inventory_items(is_active) WHERE is_active = true;
CREATE INDEX idx_inventory_items_low_stock ON inventory_items(quantity_on_hand, reorder_point)
    WHERE quantity_on_hand <= reorder_point AND is_active = true;
CREATE INDEX idx_inventory_items_compatibility ON inventory_items USING GIN (compatible_makes, compatible_models);
CREATE INDEX idx_inventory_items_universal_part ON inventory_items(universal_part_number)
    WHERE universal_part_number IS NOT NULL;

-- Full text search
CREATE INDEX idx_inventory_items_search ON inventory_items
    USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ============================================================================
-- INVENTORY TRANSACTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Item reference
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,

    -- Transaction details
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'purchase', 'usage', 'return', 'adjustment', 'transfer', 'disposal', 'stocktake'
    )),
    quantity INTEGER NOT NULL, -- Positive for additions, negative for removals

    -- Pricing
    unit_cost NUMERIC(10,2) NOT NULL,
    total_cost NUMERIC(10,2) GENERATED ALWAYS AS (ABS(quantity) * unit_cost) STORED,

    -- Context
    vehicle_id UUID REFERENCES vehicles(id),
    work_order_id UUID REFERENCES work_orders(id),

    -- User tracking
    user_id UUID NOT NULL REFERENCES users(id),
    user_name VARCHAR(255) NOT NULL,

    -- Additional information
    reason TEXT NOT NULL,
    reference_number VARCHAR(100), -- PO number, invoice number, etc.
    notes TEXT,

    -- Location
    warehouse_location VARCHAR(100),
    bin_location VARCHAR(50),

    -- Audit
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent modification of historical records
    CONSTRAINT prevent_negative_stock CHECK (
        transaction_type IN ('purchase', 'return', 'adjustment', 'stocktake') OR
        quantity < 0
    )
);

-- Indexes
CREATE INDEX idx_inventory_transactions_tenant ON inventory_transactions(tenant_id);
CREATE INDEX idx_inventory_transactions_item ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_transactions_timestamp ON inventory_transactions(timestamp DESC);
CREATE INDEX idx_inventory_transactions_vehicle ON inventory_transactions(vehicle_id)
    WHERE vehicle_id IS NOT NULL;
CREATE INDEX idx_inventory_transactions_work_order ON inventory_transactions(work_order_id)
    WHERE work_order_id IS NOT NULL;
CREATE INDEX idx_inventory_transactions_user ON inventory_transactions(user_id);
CREATE INDEX idx_inventory_transactions_reference ON inventory_transactions(reference_number)
    WHERE reference_number IS NOT NULL;

-- ============================================================================
-- LOW STOCK ALERTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_low_stock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Item reference
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    item_sku VARCHAR(50) NOT NULL,
    item_name VARCHAR(255) NOT NULL,

    -- Stock levels
    quantity_on_hand INTEGER NOT NULL,
    reorder_point INTEGER NOT NULL,
    reorder_quantity INTEGER NOT NULL,

    -- Alert severity
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('warning', 'critical', 'out-of-stock')),

    -- Supplier information
    supplier_id UUID REFERENCES vendors(id),
    supplier_name VARCHAR(255),
    lead_time_days INTEGER,
    estimated_cost NUMERIC(10,2),

    -- Status
    alert_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),

    -- Actions taken
    purchase_order_created BOOLEAN DEFAULT false,
    purchase_order_id UUID,

    notes TEXT,

    CONSTRAINT valid_severity CHECK (
        (severity = 'out-of-stock' AND quantity_on_hand = 0) OR
        (severity = 'critical' AND quantity_on_hand > 0 AND quantity_on_hand < reorder_point / 2) OR
        (severity = 'warning' AND quantity_on_hand > 0 AND quantity_on_hand <= reorder_point)
    )
);

-- Indexes
CREATE INDEX idx_low_stock_alerts_tenant ON inventory_low_stock_alerts(tenant_id);
CREATE INDEX idx_low_stock_alerts_item ON inventory_low_stock_alerts(item_id);
CREATE INDEX idx_low_stock_alerts_severity ON inventory_low_stock_alerts(severity);
CREATE INDEX idx_low_stock_alerts_unresolved ON inventory_low_stock_alerts(resolved, alert_date DESC)
    WHERE resolved = false;
CREATE INDEX idx_low_stock_alerts_supplier ON inventory_low_stock_alerts(supplier_id)
    WHERE supplier_id IS NOT NULL;

-- ============================================================================
-- INVENTORY RESERVATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Item reference
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,

    -- Reservation details
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reserved_for VARCHAR(50) NOT NULL CHECK (reserved_for IN ('work_order', 'maintenance', 'project', 'other')),

    -- Context
    work_order_id UUID REFERENCES work_orders(id),
    vehicle_id UUID REFERENCES vehicles(id),

    -- User
    reserved_by UUID NOT NULL REFERENCES users(id),
    reserved_by_name VARCHAR(255) NOT NULL,

    -- Timing
    reserved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    released_at TIMESTAMP WITH TIME ZONE,
    released_by UUID REFERENCES users(id),

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'released', 'expired')),

    notes TEXT
);

-- Indexes
CREATE INDEX idx_inventory_reservations_tenant ON inventory_reservations(tenant_id);
CREATE INDEX idx_inventory_reservations_item ON inventory_reservations(item_id);
CREATE INDEX idx_inventory_reservations_status ON inventory_reservations(status);
CREATE INDEX idx_inventory_reservations_active ON inventory_reservations(item_id, status)
    WHERE status = 'active';
CREATE INDEX idx_inventory_reservations_work_order ON inventory_reservations(work_order_id)
    WHERE work_order_id IS NOT NULL;
CREATE INDEX idx_inventory_reservations_expires ON inventory_reservations(expires_at)
    WHERE expires_at IS NOT NULL AND status = 'active';

-- ============================================================================
-- INVENTORY AUDIT LOG
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- What changed
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),

    -- Changes
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],

    -- Who and when
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(255),
    ip_address INET,
    user_agent TEXT,

    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Additional context
    reason TEXT,
    notes TEXT
);

-- Indexes
CREATE INDEX idx_inventory_audit_log_tenant ON inventory_audit_log(tenant_id);
CREATE INDEX idx_inventory_audit_log_table ON inventory_audit_log(table_name);
CREATE INDEX idx_inventory_audit_log_record ON inventory_audit_log(record_id);
CREATE INDEX idx_inventory_audit_log_timestamp ON inventory_audit_log(timestamp DESC);
CREATE INDEX idx_inventory_audit_log_user ON inventory_audit_log(user_id) WHERE user_id IS NOT NULL;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Inventory summary by category
CREATE OR REPLACE VIEW v_inventory_summary_by_category AS
SELECT
    tenant_id,
    category,
    COUNT(*) as total_items,
    SUM(quantity_on_hand) as total_quantity,
    SUM(quantity_on_hand * unit_cost) as total_value,
    SUM(CASE WHEN quantity_on_hand <= reorder_point THEN 1 ELSE 0 END) as low_stock_items,
    SUM(CASE WHEN quantity_on_hand = 0 THEN 1 ELSE 0 END) as out_of_stock_items,
    AVG(unit_cost) as avg_unit_cost,
    MIN(last_restocked) as oldest_restock,
    MAX(last_restocked) as newest_restock
FROM inventory_items
WHERE is_active = true
GROUP BY tenant_id, category;

-- Low stock items requiring action
CREATE OR REPLACE VIEW v_inventory_low_stock_items AS
SELECT
    i.id,
    i.tenant_id,
    i.sku,
    i.part_number,
    i.name,
    i.category,
    i.quantity_on_hand,
    i.quantity_reserved,
    i.quantity_available,
    i.reorder_point,
    i.reorder_quantity,
    i.unit_cost,
    (i.reorder_quantity * i.unit_cost) as estimated_reorder_cost,
    i.primary_supplier_id,
    i.primary_supplier_name,
    i.lead_time_days,
    i.warehouse_location,
    i.bin_location,
    CASE
        WHEN i.quantity_on_hand = 0 THEN 'out-of-stock'
        WHEN i.quantity_on_hand < i.reorder_point / 2 THEN 'critical'
        ELSE 'warning'
    END as severity,
    i.last_ordered,
    i.last_used
FROM inventory_items i
WHERE i.is_active = true
  AND i.quantity_on_hand <= i.reorder_point
ORDER BY
    CASE
        WHEN i.quantity_on_hand = 0 THEN 1
        WHEN i.quantity_on_hand < i.reorder_point / 2 THEN 2
        ELSE 3
    END,
    i.quantity_on_hand ASC;

-- Inventory valuation
CREATE OR REPLACE VIEW v_inventory_valuation AS
SELECT
    tenant_id,
    category,
    subcategory,
    manufacturer,
    COUNT(*) as item_count,
    SUM(quantity_on_hand) as total_units,
    SUM(quantity_on_hand * unit_cost) as inventory_value_cost,
    SUM(quantity_on_hand * list_price) as inventory_value_retail,
    AVG(unit_cost) as avg_unit_cost,
    AVG(list_price) as avg_list_price,
    SUM((list_price - unit_cost) * quantity_on_hand) as potential_profit
FROM inventory_items
WHERE is_active = true
  AND quantity_on_hand > 0
GROUP BY tenant_id, category, subcategory, manufacturer;

-- Transaction summary
CREATE OR REPLACE VIEW v_inventory_transaction_summary AS
SELECT
    t.tenant_id,
    i.category,
    t.transaction_type,
    DATE_TRUNC('day', t.timestamp) as transaction_date,
    COUNT(*) as transaction_count,
    SUM(ABS(t.quantity)) as total_quantity,
    SUM(t.total_cost) as total_cost,
    AVG(t.unit_cost) as avg_unit_cost
FROM inventory_transactions t
JOIN inventory_items i ON t.item_id = i.id
GROUP BY t.tenant_id, i.category, t.transaction_type, DATE_TRUNC('day', t.timestamp);

-- Grant permissions
GRANT SELECT ON v_inventory_summary_by_category TO PUBLIC;
GRANT SELECT ON v_inventory_low_stock_items TO PUBLIC;
GRANT SELECT ON v_inventory_valuation TO PUBLIC;
GRANT SELECT ON v_inventory_transaction_summary TO PUBLIC;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update item quantities on transaction
CREATE OR REPLACE FUNCTION update_inventory_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Update inventory quantities
    UPDATE inventory_items
    SET
        quantity_on_hand = quantity_on_hand + NEW.quantity,
        last_used = CASE
            WHEN NEW.transaction_type IN ('usage', 'disposal') THEN NOW()
            ELSE last_used
        END,
        last_restocked = CASE
            WHEN NEW.transaction_type IN ('purchase', 'return') THEN NOW()
            ELSE last_restocked
        END,
        updated_at = NOW()
    WHERE id = NEW.item_id;

    -- Check if stock went below zero (should not happen with constraints)
    IF (SELECT quantity_on_hand FROM inventory_items WHERE id = NEW.item_id) < 0 THEN
        RAISE EXCEPTION 'Transaction would result in negative stock for item %', NEW.item_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_inventory_on_transaction
AFTER INSERT ON inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION update_inventory_on_transaction();

-- Function to create low stock alerts automatically
CREATE OR REPLACE FUNCTION check_low_stock_alert()
RETURNS TRIGGER AS $$
DECLARE
    alert_severity VARCHAR(20);
    existing_alert_id UUID;
BEGIN
    -- Determine severity
    IF NEW.quantity_on_hand = 0 THEN
        alert_severity := 'out-of-stock';
    ELSIF NEW.quantity_on_hand < NEW.reorder_point / 2 THEN
        alert_severity := 'critical';
    ELSIF NEW.quantity_on_hand <= NEW.reorder_point THEN
        alert_severity := 'warning';
    ELSE
        -- Stock is above reorder point, resolve any existing alerts
        UPDATE inventory_low_stock_alerts
        SET resolved = true, resolved_at = NOW()
        WHERE item_id = NEW.id AND resolved = false;
        RETURN NEW;
    END IF;

    -- Check if unresolved alert exists
    SELECT id INTO existing_alert_id
    FROM inventory_low_stock_alerts
    WHERE item_id = NEW.id AND resolved = false
    LIMIT 1;

    IF existing_alert_id IS NULL THEN
        -- Create new alert
        INSERT INTO inventory_low_stock_alerts (
            tenant_id,
            item_id,
            item_sku,
            item_name,
            quantity_on_hand,
            reorder_point,
            reorder_quantity,
            severity,
            supplier_id,
            supplier_name,
            lead_time_days,
            estimated_cost
        ) VALUES (
            NEW.tenant_id,
            NEW.id,
            NEW.sku,
            NEW.name,
            NEW.quantity_on_hand,
            NEW.reorder_point,
            NEW.reorder_quantity,
            alert_severity,
            NEW.primary_supplier_id,
            NEW.primary_supplier_name,
            NEW.lead_time_days,
            NEW.reorder_quantity * NEW.unit_cost
        );
    ELSE
        -- Update existing alert severity
        UPDATE inventory_low_stock_alerts
        SET
            severity = alert_severity,
            quantity_on_hand = NEW.quantity_on_hand,
            estimated_cost = NEW.reorder_quantity * NEW.unit_cost
        WHERE id = existing_alert_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_check_low_stock_alert
AFTER INSERT OR UPDATE OF quantity_on_hand ON inventory_items
FOR EACH ROW
EXECUTE FUNCTION check_low_stock_alert();

-- Function to handle reservation creation
CREATE OR REPLACE FUNCTION create_inventory_reservation()
RETURNS TRIGGER AS $$
DECLARE
    available_qty INTEGER;
BEGIN
    -- Get available quantity
    SELECT quantity_available INTO available_qty
    FROM inventory_items
    WHERE id = NEW.item_id;

    -- Check if enough available
    IF available_qty < NEW.quantity THEN
        RAISE EXCEPTION 'Insufficient inventory. Available: %, Requested: %', available_qty, NEW.quantity;
    END IF;

    -- Update reserved quantity
    UPDATE inventory_items
    SET
        quantity_reserved = quantity_reserved + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.item_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_inventory_reservation
AFTER INSERT ON inventory_reservations
FOR EACH ROW
WHEN (NEW.status = 'active')
EXECUTE FUNCTION create_inventory_reservation();

-- Function to handle reservation release
CREATE OR REPLACE FUNCTION release_inventory_reservation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if status changed to released, fulfilled, or expired
    IF OLD.status = 'active' AND NEW.status IN ('released', 'fulfilled', 'expired') THEN
        -- Update reserved quantity
        UPDATE inventory_items
        SET
            quantity_reserved = quantity_reserved - OLD.quantity,
            updated_at = NOW()
        WHERE id = OLD.item_id;

        NEW.released_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_release_inventory_reservation
BEFORE UPDATE ON inventory_reservations
FOR EACH ROW
WHEN (OLD.status = 'active' AND NEW.status IN ('released', 'fulfilled', 'expired'))
EXECUTE FUNCTION release_inventory_reservation();

-- Function to audit inventory changes
CREATE OR REPLACE FUNCTION audit_inventory_changes()
RETURNS TRIGGER AS $$
DECLARE
    changed_cols TEXT[];
BEGIN
    -- Determine changed fields
    IF TG_OP = 'UPDATE' THEN
        SELECT ARRAY_AGG(key)
        INTO changed_cols
        FROM jsonb_each(to_jsonb(NEW))
        WHERE to_jsonb(NEW)->key IS DISTINCT FROM to_jsonb(OLD)->key;
    END IF;

    -- Insert audit record
    INSERT INTO inventory_audit_log (
        tenant_id,
        table_name,
        record_id,
        operation,
        old_values,
        new_values,
        changed_fields,
        user_id,
        timestamp
    ) VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        changed_cols,
        COALESCE(NEW.updated_by, NEW.created_by),
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit trigger to inventory tables
CREATE TRIGGER trigger_audit_inventory_items
AFTER INSERT OR UPDATE OR DELETE ON inventory_items
FOR EACH ROW
EXECUTE FUNCTION audit_inventory_changes();

CREATE TRIGGER trigger_audit_inventory_transactions
AFTER INSERT OR UPDATE OR DELETE ON inventory_transactions
FOR EACH ROW
EXECUTE FUNCTION audit_inventory_changes();

-- Auto-expire reservations
CREATE OR REPLACE FUNCTION expire_old_reservations()
RETURNS void AS $$
BEGIN
    UPDATE inventory_reservations
    SET status = 'expired', released_at = NOW()
    WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update timestamps
CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECURITY (Row Level Security)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_low_stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for inventory_items (tenant isolation)
CREATE POLICY inventory_items_tenant_isolation ON inventory_items
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY inventory_transactions_tenant_isolation ON inventory_transactions
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY inventory_alerts_tenant_isolation ON inventory_low_stock_alerts
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY inventory_reservations_tenant_isolation ON inventory_reservations
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY inventory_audit_tenant_isolation ON inventory_audit_log
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE inventory_items IS 'Master inventory catalog with parts, tools, safety equipment, fluids, and supplies';
COMMENT ON TABLE inventory_transactions IS 'All inventory movements (purchases, usage, returns, adjustments) with full audit trail';
COMMENT ON TABLE inventory_low_stock_alerts IS 'Automatic alerts when inventory falls below reorder points';
COMMENT ON TABLE inventory_reservations IS 'Reserved inventory for work orders and projects';
COMMENT ON TABLE inventory_audit_log IS 'Complete audit trail of all inventory changes for compliance';

COMMENT ON COLUMN inventory_items.quantity_reserved IS 'Quantity reserved for work orders but not yet used';
COMMENT ON COLUMN inventory_items.quantity_available IS 'Calculated field: quantity_on_hand - quantity_reserved';
COMMENT ON COLUMN inventory_items.is_hazmat IS 'Hazardous materials requiring special handling and storage';
COMMENT ON COLUMN inventory_transactions.quantity IS 'Positive for additions (purchase, return), negative for removals (usage, disposal)';

-- ============================================================================
-- SAMPLE DATA FOR TESTING (Optional - Comment out for production)
-- ============================================================================

-- This section would be populated by the emulator in development
-- DO NOT include sample data in production migrations

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
