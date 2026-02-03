-- ============================================================================
-- Migration: 005_ap_depreciation.sql
-- Description: Accounts Payable Tracking and Asset Depreciation
-- Author: Fleet CTA System
-- Date: 2026-02-02
-- ============================================================================

-- ============================================================================
-- PART 1: ACCOUNTS PAYABLE TRACKING
-- ============================================================================

-- Accounts Payable Tracking Table
CREATE TABLE IF NOT EXISTS accounts_payable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE RESTRICT,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    amount_due NUMERIC(12,2) NOT NULL,
    amount_paid NUMERIC(12,2) DEFAULT 0,
    balance_remaining NUMERIC(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'unpaid', -- unpaid, partially-paid, paid, overdue, disputed
    payment_terms VARCHAR(100), -- net-30, net-60, 2/10-net-30
    aging_days INTEGER,
    aging_bucket VARCHAR(50), -- current, 1-30, 31-60, 61-90, 90+
    discount_available NUMERIC(10,2),
    discount_date DATE,
    payment_batch_id UUID,
    paid_date DATE,
    payment_method VARCHAR(50), -- check, ach, wire, credit-card, cash
    payment_reference VARCHAR(100),
    payment_notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_accounts_payable_amounts_logical CHECK (
        amount_due >= 0 AND
        amount_paid >= 0 AND
        balance_remaining >= 0 AND
        amount_paid <= amount_due AND
        balance_remaining = amount_due - amount_paid
    ),
    CONSTRAINT chk_accounts_payable_dates_logical CHECK (
        due_date >= invoice_date
    ),
    CONSTRAINT chk_accounts_payable_paid_date CHECK (
        (status = 'paid' AND paid_date IS NOT NULL) OR
        (status != 'paid' AND paid_date IS NULL) OR
        (status = 'partially-paid')
    )
);

-- Enhance invoices table with AP fields
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS accounts_payable_id UUID REFERENCES accounts_payable(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approval_workflow JSONB DEFAULT '[]'; -- [{approver_id, role, status, date, comments}]
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS coding JSONB DEFAULT '{}'; -- {department, cost_center, gl_account}

-- ============================================================================
-- PART 2: ASSET DEPRECIATION
-- ============================================================================

-- Asset Depreciation Table
CREATE TABLE IF NOT EXISTS asset_depreciation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    depreciation_method VARCHAR(50) NOT NULL, -- straight-line, declining-balance, units-of-production
    original_cost NUMERIC(12,2) NOT NULL,
    salvage_value NUMERIC(12,2) NOT NULL DEFAULT 0,
    useful_life_years INTEGER,
    useful_life_units INTEGER, -- miles or hours for units-of-production
    start_date DATE NOT NULL,
    depreciation_per_year NUMERIC(10,2),
    depreciation_per_unit NUMERIC(8,4),
    total_depreciation NUMERIC(12,2) DEFAULT 0,
    current_book_value NUMERIC(12,2),
    last_calculated_date DATE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_depreciation_cost_positive CHECK (original_cost > 0),
    CONSTRAINT chk_depreciation_salvage_logical CHECK (salvage_value >= 0 AND salvage_value < original_cost),
    CONSTRAINT chk_depreciation_useful_life CHECK (
        (useful_life_years > 0) OR (useful_life_units > 0)
    ),
    CONSTRAINT chk_depreciation_asset_xor_vehicle CHECK (
        (asset_id IS NOT NULL AND vehicle_id IS NULL) OR
        (asset_id IS NULL AND vehicle_id IS NOT NULL)
    )
);

-- Depreciation Schedule Table
CREATE TABLE IF NOT EXISTS depreciation_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_depreciation_id UUID NOT NULL REFERENCES asset_depreciation(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    beginning_book_value NUMERIC(12,2) NOT NULL,
    depreciation_expense NUMERIC(10,2) NOT NULL,
    accumulated_depreciation NUMERIC(12,2) NOT NULL,
    ending_book_value NUMERIC(12,2) NOT NULL,
    units_used INTEGER, -- miles or hours in period
    is_actual BOOLEAN DEFAULT false, -- false = projected, true = actual
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_schedule_dates_logical CHECK (period_end > period_start),
    CONSTRAINT chk_schedule_amounts_logical CHECK (
        beginning_book_value >= 0 AND
        depreciation_expense >= 0 AND
        accumulated_depreciation >= 0 AND
        ending_book_value >= 0 AND
        ending_book_value = beginning_book_value - depreciation_expense
    )
);

-- Asset Disposal Table
CREATE TABLE IF NOT EXISTS asset_disposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    disposal_date DATE NOT NULL,
    disposal_method VARCHAR(50) NOT NULL, -- sold, traded, scrapped, donated, stolen, destroyed
    disposal_reason VARCHAR(100) NOT NULL,
    book_value_at_disposal NUMERIC(12,2) NOT NULL,
    sale_price NUMERIC(12,2),
    trade_in_value NUMERIC(12,2),
    buyer_name VARCHAR(255),
    buyer_contact VARCHAR(255),
    sale_document_url VARCHAR(1000),
    title_transferred BOOLEAN DEFAULT false,
    title_transfer_date DATE,
    gain_loss NUMERIC(12,2), -- sale_price - book_value
    disposal_costs NUMERIC(10,2), -- advertising, prep, transport
    net_proceeds NUMERIC(12,2),
    odometer_at_disposal INTEGER,
    condition_at_disposal VARCHAR(50), -- excellent, good, fair, poor, salvage
    disposal_notes TEXT,
    processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_disposal_book_value CHECK (book_value_at_disposal >= 0),
    CONSTRAINT chk_disposal_asset_xor_vehicle CHECK (
        (asset_id IS NOT NULL AND vehicle_id IS NULL) OR
        (asset_id IS NULL AND vehicle_id IS NOT NULL)
    )
);

-- ============================================================================
-- PART 3: BUDGET MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    budget_name VARCHAR(255) NOT NULL,
    budget_period VARCHAR(50) NOT NULL, -- monthly, quarterly, annual
    fiscal_year INTEGER NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    department VARCHAR(100),
    cost_center VARCHAR(100),
    budget_category VARCHAR(50) NOT NULL, -- fuel, maintenance, insurance, depreciation, parts, labor
    budgeted_amount NUMERIC(12,2) NOT NULL,
    spent_to_date NUMERIC(12,2) DEFAULT 0,
    committed_amount NUMERIC(12,2) DEFAULT 0,
    available_amount NUMERIC(12,2),
    variance_amount NUMERIC(12,2),
    variance_percentage NUMERIC(5,2),
    forecast_end_of_period NUMERIC(12,2),
    status VARCHAR(50) DEFAULT 'active', -- active, closed, locked
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(tenant_id, fiscal_year, period_start, budget_category, department),

    -- Constraints
    CONSTRAINT chk_budget_amounts CHECK (
        budgeted_amount >= 0 AND
        spent_to_date >= 0 AND
        committed_amount >= 0
    ),
    CONSTRAINT chk_budget_dates CHECK (period_end > period_start)
);

-- Purchase Requisitions Table
CREATE TABLE IF NOT EXISTS purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    requisition_number VARCHAR(100) UNIQUE NOT NULL,
    requested_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    department VARCHAR(100),
    cost_center VARCHAR(100),
    requisition_date DATE NOT NULL,
    needed_by_date DATE,
    justification TEXT NOT NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    suggested_vendor VARCHAR(255),
    line_items JSONB NOT NULL, -- [{description, quantity, unit_cost, total}]
    subtotal NUMERIC(10,2) NOT NULL,
    tax_amount NUMERIC(10,2),
    shipping_cost NUMERIC(10,2),
    total_amount NUMERIC(10,2) NOT NULL,
    budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, submitted, approved, denied, converted-to-po, cancelled
    submitted_at TIMESTAMPTZ,
    approval_workflow JSONB DEFAULT '[]', -- [{approver_id, role, status, date, comments}]
    approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    denied_by UUID REFERENCES users(id) ON DELETE SET NULL,
    denied_at TIMESTAMPTZ,
    denial_reason TEXT,
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE SET NULL,
    converted_to_po_at TIMESTAMPTZ,
    notes TEXT,
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_requisition_amounts CHECK (
        subtotal >= 0 AND
        total_amount >= 0 AND
        total_amount >= subtotal
    )
);

-- ============================================================================
-- PART 4: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Accounts Payable Indexes
CREATE INDEX IF NOT EXISTS idx_accounts_payable_vendor_status
    ON accounts_payable(vendor_id, status);

CREATE INDEX IF NOT EXISTS idx_accounts_payable_due_date
    ON accounts_payable(due_date)
    WHERE status IN ('unpaid', 'partially-paid');

CREATE INDEX IF NOT EXISTS idx_accounts_payable_aging_bucket
    ON accounts_payable(aging_bucket, status);

CREATE INDEX IF NOT EXISTS idx_accounts_payable_tenant_status
    ON accounts_payable(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_accounts_payable_invoice_date
    ON accounts_payable(invoice_date DESC);

-- Asset Depreciation Indexes
CREATE INDEX IF NOT EXISTS idx_asset_depreciation_asset
    ON asset_depreciation(asset_id)
    WHERE asset_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asset_depreciation_vehicle
    ON asset_depreciation(vehicle_id)
    WHERE vehicle_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asset_depreciation_tenant
    ON asset_depreciation(tenant_id);

CREATE INDEX IF NOT EXISTS idx_depreciation_schedule_asset
    ON depreciation_schedule(asset_depreciation_id, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_depreciation_schedule_period
    ON depreciation_schedule(period_start, period_end);

-- Asset Disposal Indexes
CREATE INDEX IF NOT EXISTS idx_asset_disposals_asset
    ON asset_disposals(asset_id)
    WHERE asset_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asset_disposals_vehicle
    ON asset_disposals(vehicle_id)
    WHERE vehicle_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_asset_disposals_date
    ON asset_disposals(disposal_date DESC);

-- Budget Indexes
CREATE INDEX IF NOT EXISTS idx_budgets_tenant_fiscal_year
    ON budgets(tenant_id, fiscal_year, budget_period);

CREATE INDEX IF NOT EXISTS idx_budgets_category
    ON budgets(budget_category, status);

CREATE INDEX IF NOT EXISTS idx_budgets_period
    ON budgets(period_start, period_end)
    WHERE status = 'active';

-- Purchase Requisition Indexes
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_status
    ON purchase_requisitions(status, requisition_date DESC);

CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_requested_by
    ON purchase_requisitions(requested_by, status);

CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_vendor
    ON purchase_requisitions(vendor_id)
    WHERE vendor_id IS NOT NULL;

-- Invoice enhancement indexes
CREATE INDEX IF NOT EXISTS idx_invoices_ap_id
    ON invoices(accounts_payable_id)
    WHERE accounts_payable_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_approved
    ON invoices(approved_by, approved_at)
    WHERE approved_by IS NOT NULL;

-- ============================================================================
-- PART 5: TRIGGERS FOR AUTO-CALCULATIONS
-- ============================================================================

-- Trigger to auto-calculate aging days and bucket for accounts payable
CREATE OR REPLACE FUNCTION update_ap_aging()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate aging days
    NEW.aging_days := CURRENT_DATE - NEW.invoice_date;

    -- Calculate aging bucket
    IF NEW.aging_days <= 0 THEN
        NEW.aging_bucket := 'current';
    ELSIF NEW.aging_days BETWEEN 1 AND 30 THEN
        NEW.aging_bucket := '1-30';
    ELSIF NEW.aging_days BETWEEN 31 AND 60 THEN
        NEW.aging_bucket := '31-60';
    ELSIF NEW.aging_days BETWEEN 61 AND 90 THEN
        NEW.aging_bucket := '61-90';
    ELSE
        NEW.aging_bucket := '90+';
    END IF;

    -- Auto-set status to overdue if past due date and unpaid
    IF NEW.status IN ('unpaid', 'partially-paid') AND CURRENT_DATE > NEW.due_date THEN
        NEW.status := 'overdue';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_accounts_payable_aging
    BEFORE INSERT OR UPDATE ON accounts_payable
    FOR EACH ROW
    EXECUTE FUNCTION update_ap_aging();

-- Trigger to calculate current book value for depreciation
CREATE OR REPLACE FUNCTION update_depreciation_book_value()
RETURNS TRIGGER AS $$
BEGIN
    NEW.current_book_value := NEW.original_cost - NEW.total_depreciation;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_asset_depreciation_book_value
    BEFORE INSERT OR UPDATE ON asset_depreciation
    FOR EACH ROW
    EXECUTE FUNCTION update_depreciation_book_value();

-- Trigger to calculate gain/loss on disposal
CREATE OR REPLACE FUNCTION update_disposal_gain_loss()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sale_price IS NOT NULL THEN
        NEW.gain_loss := NEW.sale_price - NEW.book_value_at_disposal;
        NEW.net_proceeds := NEW.sale_price - COALESCE(NEW.disposal_costs, 0);
    ELSIF NEW.trade_in_value IS NOT NULL THEN
        NEW.gain_loss := NEW.trade_in_value - NEW.book_value_at_disposal;
        NEW.net_proceeds := NEW.trade_in_value - COALESCE(NEW.disposal_costs, 0);
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_asset_disposals_gain_loss
    BEFORE INSERT OR UPDATE ON asset_disposals
    FOR EACH ROW
    EXECUTE FUNCTION update_disposal_gain_loss();

-- Trigger to update budget available amount
CREATE OR REPLACE FUNCTION update_budget_available()
RETURNS TRIGGER AS $$
BEGIN
    NEW.available_amount := NEW.budgeted_amount - NEW.spent_to_date - NEW.committed_amount;
    NEW.variance_amount := NEW.budgeted_amount - NEW.spent_to_date;

    IF NEW.budgeted_amount > 0 THEN
        NEW.variance_percentage := (NEW.variance_amount / NEW.budgeted_amount) * 100;
    ELSE
        NEW.variance_percentage := 0;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_budgets_available_amount
    BEFORE INSERT OR UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_budget_available();

-- ============================================================================
-- PART 6: VIEWS FOR REPORTING
-- ============================================================================

-- AP Aging Summary View
CREATE OR REPLACE VIEW v_ap_aging_summary AS
SELECT
    ap.tenant_id,
    ap.vendor_id,
    v.name AS vendor_name,
    COUNT(*) AS total_invoices,
    SUM(ap.balance_remaining) AS total_balance,
    SUM(CASE WHEN ap.aging_bucket = 'current' THEN ap.balance_remaining ELSE 0 END) AS current_balance,
    SUM(CASE WHEN ap.aging_bucket = '1-30' THEN ap.balance_remaining ELSE 0 END) AS balance_1_30,
    SUM(CASE WHEN ap.aging_bucket = '31-60' THEN ap.balance_remaining ELSE 0 END) AS balance_31_60,
    SUM(CASE WHEN ap.aging_bucket = '61-90' THEN ap.balance_remaining ELSE 0 END) AS balance_61_90,
    SUM(CASE WHEN ap.aging_bucket = '90+' THEN ap.balance_remaining ELSE 0 END) AS balance_90_plus,
    AVG(ap.aging_days) AS avg_days_outstanding
FROM accounts_payable ap
JOIN vendors v ON ap.vendor_id = v.id
WHERE ap.status IN ('unpaid', 'partially-paid', 'overdue')
GROUP BY ap.tenant_id, ap.vendor_id, v.name;

-- Depreciation Summary View
CREATE OR REPLACE VIEW v_depreciation_summary AS
SELECT
    ad.tenant_id,
    ad.depreciation_method,
    COUNT(*) AS total_assets,
    SUM(ad.original_cost) AS total_original_cost,
    SUM(ad.total_depreciation) AS total_accumulated_depreciation,
    SUM(ad.current_book_value) AS total_book_value,
    AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, ad.start_date))) AS avg_age_years
FROM asset_depreciation ad
GROUP BY ad.tenant_id, ad.depreciation_method;

-- Budget vs Actual View
CREATE OR REPLACE VIEW v_budget_vs_actual AS
SELECT
    b.tenant_id,
    b.fiscal_year,
    b.budget_period,
    b.budget_category,
    b.department,
    b.budgeted_amount,
    b.spent_to_date,
    b.committed_amount,
    b.available_amount,
    b.variance_amount,
    b.variance_percentage,
    CASE
        WHEN b.variance_percentage < -10 THEN 'over-budget'
        WHEN b.variance_percentage < 0 THEN 'at-risk'
        WHEN b.variance_percentage < 10 THEN 'on-track'
        ELSE 'under-budget'
    END AS budget_health
FROM budgets b
WHERE b.status = 'active';

-- ============================================================================
-- PART 7: GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions on new tables
GRANT SELECT, INSERT, UPDATE, DELETE ON accounts_payable TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON asset_depreciation TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON depreciation_schedule TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON asset_disposals TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON budgets TO fleet_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_requisitions TO fleet_user;

-- Grant permissions on views
GRANT SELECT ON v_ap_aging_summary TO fleet_user;
GRANT SELECT ON v_depreciation_summary TO fleet_user;
GRANT SELECT ON v_budget_vs_actual TO fleet_user;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add migration record
INSERT INTO schema_migrations (version, description, applied_at)
VALUES ('005', 'Accounts Payable and Depreciation', NOW())
ON CONFLICT (version) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✓ Migration 005_ap_depreciation.sql completed successfully';
    RAISE NOTICE '  - Created 6 new tables (accounts_payable, asset_depreciation, depreciation_schedule, asset_disposals, budgets, purchase_requisitions)';
    RAISE NOTICE '  - Enhanced invoices table with AP tracking fields';
    RAISE NOTICE '  - Created 20+ indexes for performance';
    RAISE NOTICE '  - Created 4 triggers for auto-calculations';
    RAISE NOTICE '  - Created 3 reporting views';
END $$;
