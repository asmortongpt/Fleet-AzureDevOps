-- ============================================================================
-- Migration 004: Budget Management & Purchase Requisitions
-- ============================================================================
-- Purpose: Implement budget tracking and purchase approval workflow
-- Created: 2026-02-02
-- Phase: 2 - Financial Management (Agent 4)
-- ============================================================================

BEGIN;

-- ============================================================================
-- Table: budgets
-- Purpose: Track departmental budgets by fiscal period and category
-- ============================================================================
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    budget_name VARCHAR(255) NOT NULL,
    budget_period VARCHAR(50) NOT NULL CHECK (budget_period IN ('monthly', 'quarterly', 'annual')),
    fiscal_year INTEGER NOT NULL CHECK (fiscal_year >= 2000 AND fiscal_year <= 2100),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    department VARCHAR(100),
    cost_center VARCHAR(100),
    budget_category VARCHAR(50) NOT NULL CHECK (budget_category IN (
        'fuel', 'maintenance', 'insurance', 'depreciation', 'parts',
        'labor', 'equipment', 'administrative', 'other'
    )),
    budgeted_amount NUMERIC(12,2) NOT NULL,
    spent_to_date NUMERIC(12,2) DEFAULT 0,
    committed_amount NUMERIC(12,2) DEFAULT 0,
    available_amount NUMERIC(12,2) GENERATED ALWAYS AS (budgeted_amount - spent_to_date - committed_amount) STORED,
    variance_amount NUMERIC(12,2) GENERATED ALWAYS AS (budgeted_amount - spent_to_date) STORED,
    variance_percentage NUMERIC(5,2) GENERATED ALWAYS AS (
        CASE
            WHEN budgeted_amount > 0 THEN ((budgeted_amount - spent_to_date) / budgeted_amount * 100)
            ELSE 0
        END
    ) STORED,
    forecast_end_of_period NUMERIC(12,2),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'suspended')),
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_budgets_amounts_positive CHECK (
        budgeted_amount >= 0 AND
        spent_to_date >= 0 AND
        committed_amount >= 0
    ),
    CONSTRAINT chk_budgets_period_dates CHECK (period_end > period_start)
);

-- Create unique index instead of UNIQUE constraint (to support COALESCE)
CREATE UNIQUE INDEX IF NOT EXISTS uq_budgets_unique_period ON budgets (
    tenant_id, fiscal_year, period_start, budget_category,
    COALESCE(department, ''), COALESCE(cost_center, '')
);

-- Indexes for budgets table
CREATE INDEX IF NOT EXISTS idx_budgets_tenant_id ON budgets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budgets_tenant_fiscal_year ON budgets(tenant_id, fiscal_year);
CREATE INDEX IF NOT EXISTS idx_budgets_department_period ON budgets(department, period_start, period_end) WHERE department IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(budget_category);
CREATE INDEX IF NOT EXISTS idx_budgets_period_dates ON budgets(period_start, period_end);

-- Comments for budgets table
COMMENT ON TABLE budgets IS 'Budget tracking by department, period, and category with real-time variance analysis';
COMMENT ON COLUMN budgets.available_amount IS 'Calculated: budgeted_amount - spent_to_date - committed_amount';
COMMENT ON COLUMN budgets.variance_amount IS 'Calculated: budgeted_amount - spent_to_date';
COMMENT ON COLUMN budgets.variance_percentage IS 'Calculated: (variance_amount / budgeted_amount) * 100';
COMMENT ON COLUMN budgets.forecast_end_of_period IS 'Projected spending at period end based on current trend';

-- ============================================================================
-- Table: purchase_requisitions
-- Purpose: Purchase approval workflow before purchase orders are created
-- ============================================================================
CREATE TABLE IF NOT EXISTS purchase_requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    requisition_number VARCHAR(100) NOT NULL,
    requested_by UUID NOT NULL,
    department VARCHAR(100),
    cost_center VARCHAR(100),
    requisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
    needed_by_date DATE,
    justification TEXT NOT NULL,
    vendor_id UUID,
    suggested_vendor VARCHAR(255),
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10,2) NOT NULL,
    tax_amount NUMERIC(10,2) DEFAULT 0,
    shipping_cost NUMERIC(10,2) DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL,
    budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'submitted', 'pending-approval', 'approved',
        'denied', 'converted-to-po', 'cancelled'
    )),
    submitted_at TIMESTAMPTZ,
    approval_workflow JSONB DEFAULT '[]'::jsonb,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    denied_by UUID,
    denied_at TIMESTAMPTZ,
    denial_reason TEXT,
    purchase_order_id UUID,
    converted_to_po_at TIMESTAMPTZ,
    notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_purchase_requisitions_total_positive CHECK (
        subtotal >= 0 AND
        tax_amount >= 0 AND
        shipping_cost >= 0 AND
        total_amount >= 0
    ),
    CONSTRAINT chk_purchase_requisitions_total_calc CHECK (
        total_amount = subtotal + COALESCE(tax_amount, 0) + COALESCE(shipping_cost, 0)
    ),
    CONSTRAINT chk_purchase_requisitions_dates CHECK (
        needed_by_date IS NULL OR needed_by_date >= requisition_date
    ),
    CONSTRAINT uq_purchase_requisitions_number UNIQUE (tenant_id, requisition_number)
);

-- Indexes for purchase_requisitions table
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_tenant_id ON purchase_requisitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_status ON purchase_requisitions(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_requested_by ON purchase_requisitions(requested_by);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_department ON purchase_requisitions(department) WHERE department IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_vendor_id ON purchase_requisitions(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_budget_id ON purchase_requisitions(budget_id) WHERE budget_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_date ON purchase_requisitions(requisition_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_approved_by ON purchase_requisitions(approved_by) WHERE approved_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_po_id ON purchase_requisitions(purchase_order_id) WHERE purchase_order_id IS NOT NULL;

-- Comments for purchase_requisitions table
COMMENT ON TABLE purchase_requisitions IS 'Purchase requisition approval workflow before PO creation';
COMMENT ON COLUMN purchase_requisitions.line_items IS 'Array of {description, quantity, unit_cost, total, part_number}';
COMMENT ON COLUMN purchase_requisitions.approval_workflow IS 'Array of {approver_id, role, status, date, comments, threshold_amount}';
COMMENT ON COLUMN purchase_requisitions.attachments IS 'Array of {filename, url, upload_date, uploaded_by}';

-- ============================================================================
-- Table: budget_alerts
-- Purpose: Track budget threshold alerts (80%, 90%, 100%)
-- ============================================================================
CREATE TABLE IF NOT EXISTS budget_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'threshold_80', 'threshold_90', 'threshold_100',
        'overspent', 'forecast_warning'
    )),
    alert_threshold INTEGER NOT NULL CHECK (alert_threshold BETWEEN 0 AND 200),
    current_percentage NUMERIC(5,2) NOT NULL,
    amount_spent NUMERIC(12,2) NOT NULL,
    amount_budgeted NUMERIC(12,2) NOT NULL,
    alert_message TEXT NOT NULL,
    recipients JSONB NOT NULL DEFAULT '[]'::jsonb,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for budget_alerts table
CREATE INDEX IF NOT EXISTS idx_budget_alerts_tenant_id ON budget_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_budget_id ON budget_alerts(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_type ON budget_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_sent_at ON budget_alerts(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_unacknowledged ON budget_alerts(budget_id, acknowledged) WHERE acknowledged = false;

-- Comments for budget_alerts table
COMMENT ON TABLE budget_alerts IS 'Budget consumption alerts at defined thresholds';
COMMENT ON COLUMN budget_alerts.recipients IS 'Array of {user_id, email, notification_sent}';

-- ============================================================================
-- Table: budget_transactions
-- Purpose: Audit trail of all budget changes
-- ============================================================================
CREATE TABLE IF NOT EXISTS budget_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'initial_allocation', 'adjustment', 'transfer', 'expense_recorded',
        'commitment', 'commitment_release', 'reallocation'
    )),
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    amount NUMERIC(12,2) NOT NULL,
    previous_spent NUMERIC(12,2),
    new_spent NUMERIC(12,2),
    previous_committed NUMERIC(12,2),
    new_committed NUMERIC(12,2),
    reference_type VARCHAR(50),
    reference_id UUID,
    description TEXT,
    performed_by UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for budget_transactions table
CREATE INDEX IF NOT EXISTS idx_budget_transactions_tenant_id ON budget_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_budget_id ON budget_transactions(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_date ON budget_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_type ON budget_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_budget_transactions_reference ON budget_transactions(reference_type, reference_id)
    WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL;

-- Comments for budget_transactions table
COMMENT ON TABLE budget_transactions IS 'Audit trail of all budget modifications and expense recordings';
COMMENT ON COLUMN budget_transactions.reference_type IS 'Source type: work_order, purchase_order, invoice, etc.';
COMMENT ON COLUMN budget_transactions.reference_id IS 'ID of the source record that triggered this transaction';

-- ============================================================================
-- Triggers: Automatic timestamp updates
-- ============================================================================

-- Update timestamp trigger function (check if exists first)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
    ) THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;
    END IF;
END
$$;

-- Apply timestamp triggers
DROP TRIGGER IF EXISTS update_budgets_updated_at ON budgets;
CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_requisitions_updated_at ON purchase_requisitions;
CREATE TRIGGER update_purchase_requisitions_updated_at
    BEFORE UPDATE ON purchase_requisitions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Triggers: Budget variance alerting
-- ============================================================================

CREATE OR REPLACE FUNCTION check_budget_thresholds()
RETURNS TRIGGER AS $$
DECLARE
    spent_percentage NUMERIC(5,2);
    alert_exists BOOLEAN;
BEGIN
    -- Calculate percentage spent
    IF NEW.budgeted_amount > 0 THEN
        spent_percentage := (NEW.spent_to_date / NEW.budgeted_amount) * 100;
    ELSE
        spent_percentage := 0;
    END IF;

    -- Check 80% threshold
    IF spent_percentage >= 80 AND spent_percentage < 90 THEN
        SELECT EXISTS(
            SELECT 1 FROM budget_alerts
            WHERE budget_id = NEW.id
            AND alert_type = 'threshold_80'
            AND sent_at > NOW() - INTERVAL '7 days'
        ) INTO alert_exists;

        IF NOT alert_exists THEN
            INSERT INTO budget_alerts (
                tenant_id, budget_id, alert_type, alert_threshold,
                current_percentage, amount_spent, amount_budgeted, alert_message
            ) VALUES (
                NEW.tenant_id, NEW.id, 'threshold_80', 80,
                spent_percentage, NEW.spent_to_date, NEW.budgeted_amount,
                format('Budget "%s" has reached 80%% consumption', NEW.budget_name)
            );
        END IF;
    END IF;

    -- Check 90% threshold
    IF spent_percentage >= 90 AND spent_percentage < 100 THEN
        SELECT EXISTS(
            SELECT 1 FROM budget_alerts
            WHERE budget_id = NEW.id
            AND alert_type = 'threshold_90'
            AND sent_at > NOW() - INTERVAL '7 days'
        ) INTO alert_exists;

        IF NOT alert_exists THEN
            INSERT INTO budget_alerts (
                tenant_id, budget_id, alert_type, alert_threshold,
                current_percentage, amount_spent, amount_budgeted, alert_message
            ) VALUES (
                NEW.tenant_id, NEW.id, 'threshold_90', 90,
                spent_percentage, NEW.spent_to_date, NEW.budgeted_amount,
                format('Budget "%s" has reached 90%% consumption - ACTION REQUIRED', NEW.budget_name)
            );
        END IF;
    END IF;

    -- Check 100% threshold (overspent)
    IF spent_percentage >= 100 THEN
        SELECT EXISTS(
            SELECT 1 FROM budget_alerts
            WHERE budget_id = NEW.id
            AND alert_type = 'threshold_100'
            AND sent_at > NOW() - INTERVAL '7 days'
        ) INTO alert_exists;

        IF NOT alert_exists THEN
            INSERT INTO budget_alerts (
                tenant_id, budget_id, alert_type, alert_threshold,
                current_percentage, amount_spent, amount_budgeted, alert_message
            ) VALUES (
                NEW.tenant_id, NEW.id, 'threshold_100', 100,
                spent_percentage, NEW.spent_to_date, NEW.budgeted_amount,
                format('Budget "%s" has been EXCEEDED - CRITICAL', NEW.budget_name)
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_budget_threshold_alerts ON budgets;
CREATE TRIGGER trigger_budget_threshold_alerts
    AFTER UPDATE OF spent_to_date ON budgets
    FOR EACH ROW
    WHEN (OLD.spent_to_date IS DISTINCT FROM NEW.spent_to_date)
    EXECUTE FUNCTION check_budget_thresholds();

-- ============================================================================
-- Helper Views
-- ============================================================================

-- Budget variance report view
CREATE OR REPLACE VIEW budget_variance_report AS
SELECT
    b.id,
    b.tenant_id,
    b.budget_name,
    b.department,
    b.cost_center,
    b.budget_category,
    b.fiscal_year,
    b.period_start,
    b.period_end,
    b.budgeted_amount,
    b.spent_to_date,
    b.committed_amount,
    b.available_amount,
    b.variance_amount,
    b.variance_percentage,
    b.forecast_end_of_period,
    b.status,
    CASE
        WHEN b.variance_percentage < 0 THEN 'over_budget'
        WHEN b.variance_percentage < 10 THEN 'critical'
        WHEN b.variance_percentage < 20 THEN 'warning'
        ELSE 'healthy'
    END AS health_status,
    ROUND((b.spent_to_date / NULLIF(b.budgeted_amount, 0)) * 100, 2) AS consumption_percentage,
    (b.period_end - CURRENT_DATE) AS days_remaining,
    ROUND(
        (CURRENT_DATE - b.period_start)::NUMERIC /
        NULLIF((b.period_end - b.period_start)::NUMERIC, 0) * 100,
        2
    ) AS period_elapsed_percentage,
    b.created_at,
    b.updated_at
FROM budgets b
WHERE b.status = 'active';

COMMENT ON VIEW budget_variance_report IS 'Comprehensive budget variance analysis with health indicators';

-- Active purchase requisitions needing approval
CREATE OR REPLACE VIEW pending_purchase_requisitions AS
SELECT
    pr.id,
    pr.tenant_id,
    pr.requisition_number,
    pr.requested_by,
    pr.department,
    pr.requisition_date,
    pr.needed_by_date,
    pr.total_amount,
    pr.status,
    pr.justification,
    (CURRENT_DATE - pr.requisition_date) AS days_pending,
    CASE
        WHEN pr.needed_by_date IS NOT NULL AND pr.needed_by_date < CURRENT_DATE + INTERVAL '7 days'
        THEN true
        ELSE false
    END AS is_urgent,
    pr.approval_workflow,
    pr.created_at
FROM purchase_requisitions pr
WHERE pr.status IN ('submitted', 'pending-approval')
ORDER BY
    CASE WHEN pr.needed_by_date IS NOT NULL AND pr.needed_by_date < CURRENT_DATE + INTERVAL '7 days'
    THEN 0 ELSE 1 END,
    pr.requisition_date ASC;

COMMENT ON VIEW pending_purchase_requisitions IS 'All purchase requisitions awaiting approval, sorted by urgency';

-- ============================================================================
-- Grant Permissions (adjust as needed for your security model)
-- ============================================================================

-- Example: Grant permissions to application role
-- GRANT SELECT, INSERT, UPDATE, DELETE ON budgets TO fleet_app_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON purchase_requisitions TO fleet_app_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON budget_alerts TO fleet_app_role;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON budget_transactions TO fleet_app_role;
-- GRANT SELECT ON budget_variance_report TO fleet_app_role;
-- GRANT SELECT ON pending_purchase_requisitions TO fleet_app_role;

COMMIT;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Tables created: 4 (budgets, purchase_requisitions, budget_alerts, budget_transactions)
-- Indexes created: 29
-- Triggers created: 3
-- Views created: 2
-- ============================================================================
