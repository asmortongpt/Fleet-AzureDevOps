-- Migration: Enhanced Financial Operations
-- Created: 2026-02-06
-- Purpose: Comprehensive fuel transaction analytics, expense management, and IFTA reporting
-- Integrates with: 001_fuel_card_integration.sql, 007_financial_accounting.sql

-- ============================================================================
-- ENHANCE fuel_transactions TABLE (from base schema)
-- ============================================================================

-- Add fleet card integration fields
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS fleet_card_id UUID REFERENCES fuel_cards(id) ON DELETE SET NULL;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS fleet_card_number_last4 VARCHAR(4);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS card_network VARCHAR(50); -- 'WEX', 'Voyager', 'Comdata', 'FleetOne'
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS authorization_code VARCHAR(50);

-- Merchant details
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS merchant_id VARCHAR(50);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS merchant_category_code VARCHAR(10); -- '5542' for fuel stations

-- MPG tracking and analytics
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS previous_odometer INTEGER;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS miles_driven INTEGER; -- odometer - previous_odometer
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS mpg NUMERIC(6,2); -- miles_driven / gallons
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS mpg_variance_percent NUMERIC(5,2); -- variance from vehicle avg MPG

-- Fraud detection
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS unusual_transaction BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS unusual_reason TEXT;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS risk_score NUMERIC(3,2) CHECK (risk_score >= 0 AND risk_score <= 1);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS verified_by_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- IFTA (International Fuel Tax Agreement) reporting
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS fuel_tax_amount NUMERIC(10,4); -- IFTA tax amount
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS fuel_tax_rate NUMERIC(8,4); -- State tax rate per gallon
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS taxable_gallons NUMERIC(10,3);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS ifta_jurisdiction VARCHAR(2); -- 2-letter state code

-- Discounts and rewards
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS discount_applied NUMERIC(8,2) DEFAULT 0;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS rewards_points_earned INTEGER DEFAULT 0;

-- Create indexes for new fuel_transactions fields
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_fleet_card ON fuel_transactions(fleet_card_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_unusual ON fuel_transactions(unusual_transaction, transaction_date DESC) WHERE unusual_transaction = TRUE;
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_risk_score ON fuel_transactions(risk_score DESC) WHERE risk_score > 0.5;
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_ifta_jurisdiction ON fuel_transactions(ifta_jurisdiction, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_transactions_mpg ON fuel_transactions(vehicle_id, mpg) WHERE mpg IS NOT NULL;

COMMENT ON COLUMN fuel_transactions.fleet_card_id IS 'Links to fuel card used for payment';
COMMENT ON COLUMN fuel_transactions.mpg IS 'Miles per gallon for this transaction';
COMMENT ON COLUMN fuel_transactions.mpg_variance_percent IS 'Percentage variance from vehicle average MPG';
COMMENT ON COLUMN fuel_transactions.unusual_transaction IS 'Flagged for unusual activity (fraud detection)';
COMMENT ON COLUMN fuel_transactions.ifta_jurisdiction IS 'State/jurisdiction for IFTA tax reporting';
COMMENT ON COLUMN fuel_transactions.fuel_tax_amount IS 'IFTA fuel tax amount for this transaction';

-- ============================================================================
-- ENHANCE expenses TABLE (from 007_financial_accounting.sql)
-- ============================================================================

-- Add missing organizational fields
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS approval_threshold NUMERIC(12,2);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS odometer_reading INTEGER;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_url VARCHAR(500);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(100);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reimbursement_amount NUMERIC(12,2);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reimbursed_date DATE;

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_expenses_department ON expenses(department, expense_date DESC) WHERE department IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(expense_type, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_pending_approval ON expenses(reimbursement_status, expense_date DESC) WHERE reimbursement_status = 'pending';

COMMENT ON COLUMN expenses.department IS 'Department responsible for expense';
COMMENT ON COLUMN expenses.odometer_reading IS 'Vehicle odometer reading at time of expense';
COMMENT ON COLUMN expenses.receipt_url IS 'URL to receipt image or PDF';

-- ============================================================================
-- ENHANCE invoices TABLE (from 007_financial_accounting.sql)
-- ============================================================================

-- Add approval workflow enhancements
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT TRUE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS approval_threshold NUMERIC(12,2);

-- Recurring invoice support
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS recurring_frequency VARCHAR(20); -- 'MONTHLY', 'QUARTERLY', 'ANNUAL'
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS parent_invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS next_invoice_date DATE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invoices_department ON invoices(department, invoice_date DESC) WHERE department IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_recurring ON invoices(recurring, next_invoice_date) WHERE recurring = TRUE;
CREATE INDEX IF NOT EXISTS idx_invoices_pending_approval ON invoices(approval_status, invoice_date DESC) WHERE approval_status = 'pending';

COMMENT ON COLUMN invoices.recurring IS 'True for recurring invoices (monthly fuel, leases, insurance)';
COMMENT ON COLUMN invoices.recurring_frequency IS 'Frequency for recurring invoices';
COMMENT ON COLUMN invoices.parent_invoice_id IS 'Links to original invoice if this is a recurring copy';

-- ============================================================================
-- CREATE budget_categories TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS budget_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Category structure
    category_name VARCHAR(100) NOT NULL,
    category_code VARCHAR(50),
    parent_category_id UUID REFERENCES budget_categories(id) ON DELETE CASCADE,
    category_type VARCHAR(50) CHECK (category_type IN (
        'fuel', 'maintenance', 'insurance', 'registration', 'tolls',
        'parking', 'depreciation', 'labor', 'parts', 'tires', 'other'
    )),

    -- Budget amounts
    budget_amount NUMERIC(12,2) NOT NULL CHECK (budget_amount >= 0),
    spent_amount NUMERIC(12,2) DEFAULT 0 CHECK (spent_amount >= 0),
    committed_amount NUMERIC(12,2) DEFAULT 0 CHECK (committed_amount >= 0), -- Reserved for POs
    remaining_amount NUMERIC(12,2) GENERATED ALWAYS AS (budget_amount - spent_amount - committed_amount) STORED,

    -- Time period
    budget_period VARCHAR(20) DEFAULT 'ANNUAL' CHECK (budget_period IN ('MONTHLY', 'QUARTERLY', 'ANNUAL')),
    fiscal_year INTEGER NOT NULL,
    fiscal_quarter INTEGER CHECK (fiscal_quarter BETWEEN 1 AND 4),
    fiscal_month INTEGER CHECK (fiscal_month BETWEEN 1 AND 12),
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,

    -- Organizational allocation
    department VARCHAR(100),
    cost_center VARCHAR(100),

    -- Alerts
    alert_threshold_percent INTEGER DEFAULT 80 CHECK (alert_threshold_percent BETWEEN 0 AND 100),
    alert_triggered BOOLEAN DEFAULT FALSE,
    alert_triggered_at TIMESTAMPTZ,

    -- Notes
    description TEXT,
    notes TEXT,

    -- Audit
    created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_period CHECK (period_end_date > period_start_date),
    CONSTRAINT unique_budget_category UNIQUE(tenant_id, category_name, fiscal_year, fiscal_quarter, fiscal_month)
);

CREATE INDEX idx_budget_categories_tenant ON budget_categories(tenant_id, fiscal_year DESC);
CREATE INDEX idx_budget_categories_type ON budget_categories(category_type, fiscal_year DESC);
CREATE INDEX idx_budget_categories_period ON budget_categories(budget_period, fiscal_year, fiscal_quarter);
CREATE INDEX idx_budget_categories_dept ON budget_categories(department, fiscal_year DESC) WHERE department IS NOT NULL;
CREATE INDEX idx_budget_categories_alert ON budget_categories(alert_triggered, alert_threshold_percent) WHERE alert_triggered = TRUE;

COMMENT ON TABLE budget_categories IS 'Budget tracking by category with alerts';
COMMENT ON COLUMN budget_categories.spent_amount IS 'Actual expenses posted against this budget';
COMMENT ON COLUMN budget_categories.committed_amount IS 'Purchase orders not yet invoiced';
COMMENT ON COLUMN budget_categories.remaining_amount IS 'Budget - spent - committed';

-- ============================================================================
-- CREATE expense_approvals TABLE (Approval Workflow)
-- ============================================================================

CREATE TABLE IF NOT EXISTS expense_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    approver_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    -- Approval details
    approval_level INTEGER NOT NULL DEFAULT 1, -- Multi-level approval (1, 2, 3...)
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'delegated')),
    approval_date TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Delegation
    delegated_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
    delegated_at TIMESTAMPTZ,

    -- Notification tracking
    notified_at TIMESTAMPTZ,
    reminder_sent_at TIMESTAMPTZ,

    -- Metadata
    approval_notes TEXT,
    metadata JSONB DEFAULT '{}',

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expense_approvals_expense ON expense_approvals(expense_id, approval_level);
CREATE INDEX idx_expense_approvals_approver ON expense_approvals(approver_id, approval_status, created_at DESC);
CREATE INDEX idx_expense_approvals_pending ON expense_approvals(approval_status, created_at DESC) WHERE approval_status = 'pending';

COMMENT ON TABLE expense_approvals IS 'Multi-level expense approval workflow';

-- ============================================================================
-- CREATE ifta_reports TABLE (IFTA Quarterly Reporting)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ifta_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Report period
    report_quarter INTEGER NOT NULL CHECK (report_quarter BETWEEN 1 AND 4),
    report_year INTEGER NOT NULL,
    quarter_start_date DATE NOT NULL,
    quarter_end_date DATE NOT NULL,

    -- Vehicle
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

    -- Totals by jurisdiction
    jurisdiction_data JSONB NOT NULL DEFAULT '[]',
    -- Structure: [{jurisdiction: 'CA', miles: 5000, taxable_gallons: 200, tax_rate: 0.54, tax_owed: 108.00}, ...]

    -- Summary
    total_miles INTEGER NOT NULL DEFAULT 0,
    total_gallons NUMERIC(10,3) NOT NULL DEFAULT 0,
    total_tax_owed NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_tax_paid NUMERIC(12,2) DEFAULT 0,
    net_tax_due NUMERIC(12,2) GENERATED ALWAYS AS (total_tax_owed - COALESCE(total_tax_paid, 0)) STORED,

    -- Status
    report_status VARCHAR(20) DEFAULT 'draft' CHECK (report_status IN ('draft', 'submitted', 'filed', 'paid')),
    filed_date DATE,
    payment_date DATE,
    payment_reference VARCHAR(100),

    -- Files
    report_pdf_url VARCHAR(500),
    supporting_docs JSONB DEFAULT '[]',

    -- Notes
    notes TEXT,

    -- Audit
    generated_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_ifta_report UNIQUE(tenant_id, vehicle_id, report_year, report_quarter)
);

CREATE INDEX idx_ifta_reports_tenant ON ifta_reports(tenant_id, report_year DESC, report_quarter DESC);
CREATE INDEX idx_ifta_reports_vehicle ON ifta_reports(vehicle_id, report_year DESC);
CREATE INDEX idx_ifta_reports_status ON ifta_reports(report_status, report_year DESC);
CREATE INDEX idx_ifta_reports_quarter ON ifta_reports(report_year, report_quarter);

COMMENT ON TABLE ifta_reports IS 'IFTA quarterly fuel tax reports by vehicle';
COMMENT ON COLUMN ifta_reports.jurisdiction_data IS 'Array of tax by jurisdiction: [{jurisdiction, miles, gallons, tax_rate, tax_owed}]';

-- ============================================================================
-- CREATE fuel_price_history TABLE (Track fuel price trends)
-- ============================================================================

CREATE TABLE IF NOT EXISTS fuel_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Location
    state VARCHAR(2),
    city VARCHAR(100),
    station_name VARCHAR(255),
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),

    -- Fuel details
    fuel_type VARCHAR(50) NOT NULL, -- 'diesel', 'unleaded', 'premium', 'e85'
    price_per_gallon NUMERIC(6,3) NOT NULL CHECK (price_per_gallon > 0),

    -- Date
    price_date DATE NOT NULL,
    price_timestamp TIMESTAMPTZ DEFAULT NOW(),

    -- Source
    data_source VARCHAR(50), -- 'transaction', 'api', 'manual'
    reference_transaction_id UUID REFERENCES fuel_transactions(id) ON DELETE SET NULL,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fuel_price_history_tenant ON fuel_price_history(tenant_id, price_date DESC);
CREATE INDEX idx_fuel_price_history_location ON fuel_price_history(state, city, fuel_type, price_date DESC);
CREATE INDEX idx_fuel_price_history_type ON fuel_price_history(fuel_type, price_date DESC);
CREATE INDEX idx_fuel_price_history_date ON fuel_price_history(price_date DESC);

COMMENT ON TABLE fuel_price_history IS 'Historical fuel pricing data for analytics';

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Calculate MPG for fuel transaction
CREATE OR REPLACE FUNCTION calculate_fuel_transaction_mpg()
RETURNS TRIGGER AS $$
DECLARE
    prev_odometer_val INTEGER;
    prev_transaction_date TIMESTAMPTZ;
    vehicle_avg_mpg NUMERIC(6,2);
BEGIN
    -- Get previous odometer reading for this vehicle
    SELECT odometer, transaction_date INTO prev_odometer_val, prev_transaction_date
    FROM fuel_transactions
    WHERE vehicle_id = NEW.vehicle_id
      AND transaction_date < NEW.transaction_date
      AND odometer IS NOT NULL
    ORDER BY transaction_date DESC
    LIMIT 1;

    IF prev_odometer_val IS NOT NULL AND NEW.odometer IS NOT NULL AND NEW.gallons > 0 THEN
        NEW.previous_odometer = prev_odometer_val;
        NEW.miles_driven = NEW.odometer - prev_odometer_val;

        -- Only calculate MPG if miles driven is positive and reasonable (< 1000 miles between fillups)
        IF NEW.miles_driven > 0 AND NEW.miles_driven < 1000 THEN
            NEW.mpg = ROUND((NEW.miles_driven::NUMERIC / NEW.gallons)::NUMERIC, 2);

            -- Calculate variance from vehicle average
            SELECT AVG(mpg) INTO vehicle_avg_mpg
            FROM fuel_transactions
            WHERE vehicle_id = NEW.vehicle_id
              AND mpg IS NOT NULL
              AND mpg > 0
              AND mpg < 100; -- Exclude anomalies

            IF vehicle_avg_mpg IS NOT NULL AND vehicle_avg_mpg > 0 THEN
                NEW.mpg_variance_percent = ROUND(((NEW.mpg - vehicle_avg_mpg) / vehicle_avg_mpg * 100)::NUMERIC, 2);
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_fuel_mpg_trigger
    BEFORE INSERT OR UPDATE OF odometer, gallons ON fuel_transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_fuel_transaction_mpg();

-- Function: Detect unusual fuel transactions
CREATE OR REPLACE FUNCTION detect_unusual_fuel_transaction()
RETURNS TRIGGER AS $$
DECLARE
    avg_gallons NUMERIC(10,3);
    stddev_gallons NUMERIC(10,3);
    avg_cost NUMERIC(10,2);
    stddev_cost NUMERIC(10,2);
    max_daily_transactions INTEGER;
    risk_factors INTEGER := 0;
    risk_reasons TEXT[] := '{}';
BEGIN
    -- Calculate vehicle averages
    SELECT AVG(gallons), STDDEV(gallons), AVG(total_cost), STDDEV(total_cost)
    INTO avg_gallons, stddev_gallons, avg_cost, stddev_cost
    FROM fuel_transactions
    WHERE vehicle_id = NEW.vehicle_id
      AND transaction_date >= CURRENT_DATE - INTERVAL '90 days';

    -- Check for unusual gallons (> 2 standard deviations)
    IF stddev_gallons > 0 AND NEW.gallons > (avg_gallons + 2 * stddev_gallons) THEN
        risk_factors := risk_factors + 1;
        risk_reasons := array_append(risk_reasons, 'Unusual fuel quantity');
    END IF;

    -- Check for unusual cost (> 2 standard deviations)
    IF stddev_cost > 0 AND NEW.total_cost > (avg_cost + 2 * stddev_cost) THEN
        risk_factors := risk_factors + 1;
        risk_reasons := array_append(risk_reasons, 'Unusual transaction cost');
    END IF;

    -- Check for multiple transactions same day
    SELECT COUNT(*) INTO max_daily_transactions
    FROM fuel_transactions
    WHERE vehicle_id = NEW.vehicle_id
      AND DATE(transaction_date) = DATE(NEW.transaction_date);

    IF max_daily_transactions >= 2 THEN
        risk_factors := risk_factors + 1;
        risk_reasons := array_append(risk_reasons, 'Multiple transactions same day');
    END IF;

    -- Check for weekend transaction (if unusual for this vehicle)
    IF EXTRACT(DOW FROM NEW.transaction_date) IN (0, 6) THEN
        -- Check if vehicle rarely fuels on weekends
        DECLARE weekend_pct NUMERIC;
        BEGIN
            SELECT COUNT(*) FILTER (WHERE EXTRACT(DOW FROM transaction_date) IN (0, 6))::NUMERIC / NULLIF(COUNT(*), 0) INTO weekend_pct
            FROM fuel_transactions
            WHERE vehicle_id = NEW.vehicle_id;

            IF weekend_pct IS NOT NULL AND weekend_pct < 0.1 THEN
                risk_factors := risk_factors + 1;
                risk_reasons := array_append(risk_reasons, 'Unusual weekend transaction');
            END IF;
        END;
    END IF;

    -- Calculate risk score (0-1 scale)
    NEW.risk_score = LEAST(risk_factors::NUMERIC / 4, 1.0);

    -- Flag if risk score > 0.5
    IF NEW.risk_score > 0.5 THEN
        NEW.unusual_transaction = TRUE;
        NEW.unusual_reason = array_to_string(risk_reasons, '; ');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER detect_unusual_fuel_trigger
    BEFORE INSERT ON fuel_transactions
    FOR EACH ROW
    EXECUTE FUNCTION detect_unusual_fuel_transaction();

-- Function: Update budget spent amount
CREATE OR REPLACE FUNCTION update_budget_spent_on_expense()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reimbursement_status = 'paid' AND (OLD IS NULL OR OLD.reimbursement_status != 'paid') THEN
        UPDATE budget_categories
        SET spent_amount = spent_amount + NEW.total_amount
        WHERE tenant_id = NEW.tenant_id
          AND category_type = NEW.expense_type
          AND period_start_date <= NEW.expense_date
          AND period_end_date >= NEW.expense_date
          AND (department = NEW.department OR (department IS NULL AND NEW.department IS NULL))
          AND (cost_center = NEW.cost_center OR (cost_center IS NULL AND NEW.cost_center IS NULL));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_budget_on_expense_trigger
    AFTER INSERT OR UPDATE OF reimbursement_status ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_budget_spent_on_expense();

-- Function: Trigger budget alert
CREATE OR REPLACE FUNCTION check_budget_alert()
RETURNS TRIGGER AS $$
DECLARE
    utilization_pct NUMERIC(5,2);
BEGIN
    utilization_pct = ((NEW.spent_amount + NEW.committed_amount) / NULLIF(NEW.budget_amount, 0)) * 100;

    IF utilization_pct >= NEW.alert_threshold_percent AND NOT NEW.alert_triggered THEN
        NEW.alert_triggered = TRUE;
        NEW.alert_triggered_at = NOW();

        -- TODO: Send notification (integrate with alerts system)
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_budget_alert_trigger
    BEFORE UPDATE OF spent_amount, committed_amount ON budget_categories
    FOR EACH ROW
    EXECUTE FUNCTION check_budget_alert();

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_financial_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_budget_categories_updated_at
    BEFORE UPDATE ON budget_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_financial_updated_at();

CREATE TRIGGER update_expense_approvals_updated_at
    BEFORE UPDATE ON expense_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_financial_updated_at();

CREATE TRIGGER update_ifta_reports_updated_at
    BEFORE UPDATE ON ifta_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_financial_updated_at();

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- Fuel efficiency by vehicle
CREATE OR REPLACE VIEW vehicle_fuel_efficiency AS
SELECT
    v.id as vehicle_id,
    v.name as vehicle_name,
    v.vin,
    v.make,
    v.model,
    COUNT(ft.id) as fuel_transaction_count,
    SUM(ft.gallons) as total_gallons,
    SUM(ft.total_cost) as total_fuel_cost,
    SUM(ft.miles_driven) as total_miles,
    ROUND(AVG(ft.mpg), 2) as average_mpg,
    ROUND(STDDEV(ft.mpg), 2) as mpg_std_dev,
    ROUND(SUM(ft.total_cost) / NULLIF(SUM(ft.miles_driven), 0), 4) as cost_per_mile,
    MAX(ft.transaction_date) as last_fuel_date
FROM vehicles v
LEFT JOIN fuel_transactions ft ON v.id = ft.vehicle_id AND ft.mpg IS NOT NULL
WHERE v.status = 'active'
GROUP BY v.id, v.name, v.vin, v.make, v.model
ORDER BY average_mpg DESC NULLS LAST;

COMMENT ON VIEW vehicle_fuel_efficiency IS 'Fuel efficiency metrics by vehicle';

-- Budget utilization summary
CREATE OR REPLACE VIEW budget_utilization_summary AS
SELECT
    bc.id,
    bc.tenant_id,
    bc.category_name,
    bc.category_type,
    bc.fiscal_year,
    bc.fiscal_quarter,
    bc.department,
    bc.budget_amount,
    bc.spent_amount,
    bc.committed_amount,
    bc.remaining_amount,
    ROUND(((bc.spent_amount + bc.committed_amount) / NULLIF(bc.budget_amount, 0) * 100)::NUMERIC, 2) as utilization_percent,
    bc.alert_threshold_percent,
    bc.alert_triggered,
    CASE
        WHEN ((bc.spent_amount + bc.committed_amount) / NULLIF(bc.budget_amount, 0) * 100) >= 95 THEN 'critical'
        WHEN ((bc.spent_amount + bc.committed_amount) / NULLIF(bc.budget_amount, 0) * 100) >= bc.alert_threshold_percent THEN 'warning'
        ELSE 'normal'
    END as status
FROM budget_categories bc
ORDER BY utilization_percent DESC NULLS LAST;

COMMENT ON VIEW budget_utilization_summary IS 'Budget utilization with status indicators';

-- Expense approval queue
CREATE OR REPLACE VIEW expense_approval_queue AS
SELECT
    e.id as expense_id,
    e.expense_number,
    e.expense_date,
    e.expense_type,
    e.total_amount,
    e.description,
    e.submitted_by_user_id,
    CONCAT_WS(' ', u.first_name, u.last_name) as submitted_by_name,
    ea.id as approval_id,
    ea.approver_id,
    CONCAT_WS(' ', approver.first_name, approver.last_name) as approver_name,
    ea.approval_level,
    ea.approval_status,
    ea.created_at as pending_since,
    EXTRACT(EPOCH FROM (NOW() - ea.created_at)) / 3600 as hours_pending
FROM expenses e
JOIN expense_approvals ea ON e.id = ea.expense_id
LEFT JOIN users u ON e.submitted_by_user_id = u.id
LEFT JOIN users approver ON ea.approver_id = approver.id
WHERE ea.approval_status = 'pending'
ORDER BY e.total_amount DESC, ea.created_at ASC;

COMMENT ON VIEW expense_approval_queue IS 'Pending expense approvals with time tracking';

-- ============================================================================
-- GRANT PERMISSIONS (if using RLS)
-- ============================================================================

-- Grant read access to authenticated users
-- GRANT SELECT ON budget_categories TO authenticated;
-- GRANT SELECT ON expense_approvals TO authenticated;
-- GRANT SELECT ON ifta_reports TO authenticated;
-- GRANT SELECT ON fuel_price_history TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON MIGRATION IS 'Enhanced financial operations with fuel analytics, expense workflow, and IFTA reporting';
