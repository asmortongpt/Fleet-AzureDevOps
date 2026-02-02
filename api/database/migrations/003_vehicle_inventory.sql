-- Vehicle Inventory Management Migration
-- Creates tables for tracking per-vehicle equipment and inventory
-- FedRAMP Compliant with full audit trail

-- ============================================
-- Vehicle Inventory Items
-- ============================================

CREATE TABLE vehicle_inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,

    -- Equipment Details
    equipment_type VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('safety', 'emergency', 'medical', 'tools', 'communication', 'specialty')),
    manufacturer VARCHAR(255),
    model_number VARCHAR(100),
    serial_number VARCHAR(100),

    -- Quantity and Value
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_cost DECIMAL(10,2),
    total_value DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,

    -- Dates
    purchase_date DATE,
    install_date DATE,
    warranty_expiration DATE,

    -- Condition
    condition VARCHAR(50) DEFAULT 'good' CHECK (condition IN ('new', 'good', 'fair', 'needs_replacement', 'expired')),
    location VARCHAR(255), -- Location within vehicle

    -- Expiration Tracking
    has_expiration BOOLEAN DEFAULT false,
    expiration_date DATE,

    -- Inspection Tracking
    requires_inspection BOOLEAN DEFAULT false,
    last_inspection_date DATE,
    next_inspection_date DATE,
    inspection_interval_days INTEGER,

    -- Compliance
    compliance_status VARCHAR(50) DEFAULT 'compliant' CHECK (compliance_status IN ('compliant', 'warning', 'expired', 'missing')),
    required_by_regulation TEXT[], -- Array of regulation codes (e.g., ["DOT", "OSHA"])
    is_required BOOLEAN DEFAULT false,

    -- Audit Trail
    last_checked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    last_checked_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_expiration_date CHECK (
        (has_expiration = false) OR (has_expiration = true AND expiration_date IS NOT NULL)
    ),
    CONSTRAINT valid_inspection_date CHECK (
        (requires_inspection = false) OR (requires_inspection = true AND inspection_interval_days IS NOT NULL)
    )
);

-- Indexes for performance
CREATE INDEX idx_vehicle_inventory_tenant ON vehicle_inventory_items(tenant_id);
CREATE INDEX idx_vehicle_inventory_vehicle ON vehicle_inventory_items(vehicle_id);
CREATE INDEX idx_vehicle_inventory_category ON vehicle_inventory_items(category);
CREATE INDEX idx_vehicle_inventory_compliance ON vehicle_inventory_items(compliance_status);
CREATE INDEX idx_vehicle_inventory_expiration ON vehicle_inventory_items(expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX idx_vehicle_inventory_next_inspection ON vehicle_inventory_items(next_inspection_date) WHERE next_inspection_date IS NOT NULL;

-- ============================================
-- Inventory Inspections
-- ============================================

CREATE TABLE vehicle_inventory_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,

    -- Inspector Details
    inspector_id UUID REFERENCES users(id) ON DELETE SET NULL,
    inspector_name VARCHAR(255) NOT NULL,

    -- Inspection Details
    inspection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inspection_type VARCHAR(50) NOT NULL CHECK (inspection_type IN ('routine', 'annual', 'incident', 'audit')),

    -- Metrics
    items_inspected INTEGER NOT NULL DEFAULT 0,
    items_compliant INTEGER NOT NULL DEFAULT 0,
    items_non_compliant INTEGER NOT NULL DEFAULT 0,
    items_missing INTEGER NOT NULL DEFAULT 0,
    overall_compliance DECIMAL(5,2) NOT NULL DEFAULT 0, -- Percentage

    -- Status
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('completed', 'pending_review', 'approved')),

    -- Approval
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_date TIMESTAMP WITH TIME ZONE,

    -- Signature
    signature_data TEXT, -- Base64 encoded signature

    -- Next Inspection
    next_inspection_due DATE NOT NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_inspections_tenant ON vehicle_inventory_inspections(tenant_id);
CREATE INDEX idx_inventory_inspections_vehicle ON vehicle_inventory_inspections(vehicle_id);
CREATE INDEX idx_inventory_inspections_inspector ON vehicle_inventory_inspections(inspector_id);
CREATE INDEX idx_inventory_inspections_date ON vehicle_inventory_inspections(inspection_date DESC);
CREATE INDEX idx_inventory_inspections_next_due ON vehicle_inventory_inspections(next_inspection_due);

-- ============================================
-- Inspection Findings
-- ============================================

CREATE TABLE vehicle_inventory_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    inspection_id UUID REFERENCES vehicle_inventory_inspections(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES vehicle_inventory_items(id) ON DELETE CASCADE,

    -- Finding Details
    finding_type VARCHAR(50) NOT NULL CHECK (finding_type IN ('expired', 'missing', 'damaged', 'insufficient_quantity', 'non_compliant')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    required_action TEXT NOT NULL,
    due_date DATE NOT NULL,

    -- Resolution
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_date TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_findings_tenant ON vehicle_inventory_findings(tenant_id);
CREATE INDEX idx_inventory_findings_inspection ON vehicle_inventory_findings(inspection_id);
CREATE INDEX idx_inventory_findings_equipment ON vehicle_inventory_findings(equipment_id);
CREATE INDEX idx_inventory_findings_severity ON vehicle_inventory_findings(severity);
CREATE INDEX idx_inventory_findings_unresolved ON vehicle_inventory_findings(resolved) WHERE resolved = false;

-- ============================================
-- Corrective Actions
-- ============================================

CREATE TABLE vehicle_inventory_corrective_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    finding_id UUID REFERENCES vehicle_inventory_findings(id) ON DELETE CASCADE,

    -- Action Details
    action TEXT NOT NULL,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE NOT NULL,

    -- Status
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'overdue')),

    -- Completion
    completed_date TIMESTAMP WITH TIME ZONE,
    cost DECIMAL(10,2),
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_corrective_actions_tenant ON vehicle_inventory_corrective_actions(tenant_id);
CREATE INDEX idx_corrective_actions_finding ON vehicle_inventory_corrective_actions(finding_id);
CREATE INDEX idx_corrective_actions_assigned ON vehicle_inventory_corrective_actions(assigned_to);
CREATE INDEX idx_corrective_actions_status ON vehicle_inventory_corrective_actions(status);

-- ============================================
-- Compliance Alerts
-- ============================================

CREATE TABLE vehicle_inventory_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    equipment_id UUID REFERENCES vehicle_inventory_items(id) ON DELETE CASCADE,

    -- Alert Details
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('expiration_warning', 'inspection_due', 'missing_equipment', 'regulatory_violation')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    message TEXT NOT NULL,
    due_date DATE NOT NULL,
    days_until_due INTEGER,

    -- Notifications
    notifications_sent INTEGER DEFAULT 0,
    last_notification_sent TIMESTAMP WITH TIME ZONE,

    -- Acknowledgement
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_date TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inventory_alerts_tenant ON vehicle_inventory_alerts(tenant_id);
CREATE INDEX idx_inventory_alerts_vehicle ON vehicle_inventory_alerts(vehicle_id);
CREATE INDEX idx_inventory_alerts_equipment ON vehicle_inventory_alerts(equipment_id);
CREATE INDEX idx_inventory_alerts_severity ON vehicle_inventory_alerts(severity);
CREATE INDEX idx_inventory_alerts_unacknowledged ON vehicle_inventory_alerts(acknowledged) WHERE acknowledged = false;
CREATE INDEX idx_inventory_alerts_due_date ON vehicle_inventory_alerts(due_date);

-- ============================================
-- Triggers for updated_at
-- ============================================

CREATE TRIGGER update_vehicle_inventory_items_updated_at
    BEFORE UPDATE ON vehicle_inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_inventory_inspections_updated_at
    BEFORE UPDATE ON vehicle_inventory_inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_inventory_findings_updated_at
    BEFORE UPDATE ON vehicle_inventory_findings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicle_inventory_corrective_actions_updated_at
    BEFORE UPDATE ON vehicle_inventory_corrective_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Views for Common Queries
-- ============================================

-- Expired or Expiring Items
CREATE OR REPLACE VIEW v_inventory_expiring_items AS
SELECT
    vii.*,
    v.vin,
    v.make,
    v.model,
    CASE
        WHEN vii.expiration_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN vii.expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
        WHEN vii.expiration_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'EXPIRING_WARNING'
        ELSE 'OK'
    END as expiration_status,
    (vii.expiration_date - CURRENT_DATE) as days_until_expiration
FROM vehicle_inventory_items vii
JOIN vehicles v ON vii.vehicle_id = v.id
WHERE vii.has_expiration = true
    AND vii.expiration_date IS NOT NULL
ORDER BY vii.expiration_date ASC;

-- Items Needing Inspection
CREATE OR REPLACE VIEW v_inventory_inspection_due AS
SELECT
    vii.*,
    v.vin,
    v.make,
    v.model,
    CASE
        WHEN vii.next_inspection_date < CURRENT_DATE THEN 'OVERDUE'
        WHEN vii.next_inspection_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'DUE_SOON'
        ELSE 'SCHEDULED'
    END as inspection_status,
    (vii.next_inspection_date - CURRENT_DATE) as days_until_inspection
FROM vehicle_inventory_items vii
JOIN vehicles v ON vii.vehicle_id = v.id
WHERE vii.requires_inspection = true
    AND vii.next_inspection_date IS NOT NULL
ORDER BY vii.next_inspection_date ASC;

-- Vehicle Inventory Summary
CREATE OR REPLACE VIEW v_vehicle_inventory_summary AS
SELECT
    v.id as vehicle_id,
    v.vin,
    v.make,
    v.model,
    COUNT(vii.id) as total_items,
    SUM(vii.total_value) as total_value,
    COUNT(CASE WHEN vii.compliance_status = 'compliant' THEN 1 END) as compliant_items,
    COUNT(CASE WHEN vii.compliance_status = 'warning' THEN 1 END) as warning_items,
    COUNT(CASE WHEN vii.compliance_status = 'expired' THEN 1 END) as expired_items,
    COUNT(CASE WHEN vii.has_expiration AND vii.expiration_date < CURRENT_DATE + INTERVAL '30 days' THEN 1 END) as expiring_within_30_days,
    COUNT(CASE WHEN vii.requires_inspection AND vii.next_inspection_date < CURRENT_DATE THEN 1 END) as inspections_overdue,
    MAX(vi.inspection_date) as last_inspection_date,
    (SELECT next_inspection_due FROM vehicle_inventory_inspections WHERE vehicle_id = v.id ORDER BY inspection_date DESC LIMIT 1) as next_inspection_due
FROM vehicles v
LEFT JOIN vehicle_inventory_items vii ON v.id = vii.vehicle_id
LEFT JOIN vehicle_inventory_inspections vi ON v.id = vi.vehicle_id
WHERE v.status = 'active'
GROUP BY v.id, v.vin, v.make, v.model;

-- Active Alerts by Vehicle
CREATE OR REPLACE VIEW v_active_inventory_alerts AS
SELECT
    via.*,
    v.vin,
    v.make,
    v.model,
    vii.equipment_type,
    vii.category
FROM vehicle_inventory_alerts via
JOIN vehicles v ON via.vehicle_id = v.id
JOIN vehicle_inventory_items vii ON via.equipment_id = vii.id
WHERE via.acknowledged = false
ORDER BY via.severity DESC, via.due_date ASC;

-- ============================================
-- Functions for Compliance Calculations
-- ============================================

-- Calculate vehicle compliance rate
CREATE OR REPLACE FUNCTION calculate_vehicle_inventory_compliance(p_vehicle_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    v_total_items INTEGER;
    v_compliant_items INTEGER;
BEGIN
    SELECT
        COUNT(*),
        COUNT(CASE WHEN compliance_status = 'compliant' THEN 1 END)
    INTO v_total_items, v_compliant_items
    FROM vehicle_inventory_items
    WHERE vehicle_id = p_vehicle_id;

    IF v_total_items = 0 THEN
        RETURN 100.00;
    END IF;

    RETURN (v_compliant_items::DECIMAL / v_total_items::DECIMAL) * 100;
END;
$$ LANGUAGE plpgsql;

-- Update compliance status based on expiration/inspection dates
CREATE OR REPLACE FUNCTION update_inventory_compliance_status()
RETURNS void AS $$
BEGIN
    -- Mark expired items
    UPDATE vehicle_inventory_items
    SET
        compliance_status = 'expired',
        condition = 'expired',
        updated_at = NOW()
    WHERE has_expiration = true
        AND expiration_date < CURRENT_DATE
        AND compliance_status != 'expired';

    -- Mark items with warning (expiring within 30 days)
    UPDATE vehicle_inventory_items
    SET
        compliance_status = 'warning',
        updated_at = NOW()
    WHERE has_expiration = true
        AND expiration_date >= CURRENT_DATE
        AND expiration_date <= CURRENT_DATE + INTERVAL '30 days'
        AND compliance_status = 'compliant';

    -- Mark items with overdue inspections
    UPDATE vehicle_inventory_items
    SET
        compliance_status = 'warning',
        updated_at = NOW()
    WHERE requires_inspection = true
        AND next_inspection_date < CURRENT_DATE
        AND compliance_status = 'compliant';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Sample Data (for testing/development)
-- ============================================

-- This would be populated by the emulator in production
-- The emulator generates realistic data for all 50 vehicles

-- ============================================
-- Permissions
-- ============================================

-- Grant appropriate permissions to application role
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO fleetadmin;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fleetadmin;

-- ============================================
-- Migration Version
-- ============================================

INSERT INTO schema_version (version, description)
VALUES (3, 'Vehicle Inventory Management - Equipment tracking, inspections, and compliance alerts');

-- ============================================
-- END OF MIGRATION
-- ============================================
