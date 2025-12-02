-- Migration: Enhanced Personal Use System with Reimbursement Support
-- Description: Extends personal use tracking with flexible payment methods and reimbursement workflows
-- Version: 006
-- Date: 2025-11-15
-- Dependencies: Requires migration 005_personal_business_use.sql
-- Purpose: Add payment method options, reimbursement requests, and receipt tracking

-- =====================================================
-- Step 1: Add new enum types
-- =====================================================

-- Payment method options for personal use policies
DO $$ BEGIN
    CREATE TYPE payment_method_type AS ENUM (
        'driver_direct',        -- Driver pays directly (no company involvement)
        'driver_reimburse',     -- Driver pays upfront, requests reimbursement
        'company_bill',         -- Company bills driver monthly
        'payroll_deduct'        -- Automatic payroll deduction
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Calculation method for charges
DO $$ BEGIN
    CREATE TYPE calculation_method_type AS ENUM (
        'per_mile',     -- Charge per mile driven
        'flat_fee',     -- Fixed monthly/yearly fee
        'actual_cost'   -- Actual costs (fuel, maintenance proportional)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Reimbursement request status
DO $$ BEGIN
    CREATE TYPE reimbursement_status_type AS ENUM (
        'pending',          -- Awaiting review
        'approved',         -- Approved for payment
        'rejected',         -- Rejected
        'paid',             -- Payment processed
        'cancelled'         -- Cancelled by driver
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- Step 2: Extend personal_use_policies table
-- =====================================================

-- Add new columns to personal_use_policies
ALTER TABLE personal_use_policies
ADD COLUMN IF NOT EXISTS payment_method payment_method_type DEFAULT 'driver_direct',
ADD COLUMN IF NOT EXISTS calculation_method calculation_method_type DEFAULT 'per_mile',
ADD COLUMN IF NOT EXISTS flat_fee_amount DECIMAL(10,2) CHECK (flat_fee_amount >= 0),
ADD COLUMN IF NOT EXISTS flat_fee_frequency VARCHAR(20) CHECK (flat_fee_frequency IN ('monthly', 'quarterly', 'yearly')),
ADD COLUMN IF NOT EXISTS reimbursement_approval_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_approve_under_amount DECIMAL(10,2) CHECK (auto_approve_under_amount >= 0),
ADD COLUMN IF NOT EXISTS reimbursement_payment_terms_days INTEGER DEFAULT 30 CHECK (reimbursement_payment_terms_days > 0),
ADD COLUMN IF NOT EXISTS require_receipt_upload BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS receipt_required_over_amount DECIMAL(10,2) CHECK (receipt_required_over_amount >= 0);

-- Add constraint for flat fee configuration
ALTER TABLE personal_use_policies
DROP CONSTRAINT IF EXISTS policy_flat_fee_valid;

ALTER TABLE personal_use_policies
ADD CONSTRAINT policy_flat_fee_valid CHECK (
    (calculation_method = 'flat_fee' AND flat_fee_amount IS NOT NULL AND flat_fee_frequency IS NOT NULL)
    OR calculation_method != 'flat_fee'
);

-- Update existing constraint for rate per mile
ALTER TABLE personal_use_policies
DROP CONSTRAINT IF EXISTS policy_charge_rate_required;

ALTER TABLE personal_use_policies
ADD CONSTRAINT policy_charge_rate_required CHECK (
    (charge_personal_use = true AND (
        (calculation_method = 'per_mile' AND personal_use_rate_per_mile IS NOT NULL) OR
        (calculation_method = 'flat_fee' AND flat_fee_amount IS NOT NULL) OR
        (calculation_method = 'actual_cost')
    ))
    OR charge_personal_use = false
);

-- =====================================================
-- Step 3: Extend personal_use_charges table
-- =====================================================

-- Add reimbursement and receipt tracking fields
ALTER TABLE personal_use_charges
ADD COLUMN IF NOT EXISTS is_reimbursement BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reimbursement_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reimbursement_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reimbursement_approved_by UUID,
ADD COLUMN IF NOT EXISTS reimbursement_rejected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reimbursement_rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS reimbursement_paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reimbursement_payment_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS receipt_file_path VARCHAR(500),
ADD COLUMN IF NOT EXISTS receipt_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_cost_breakdown JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS driver_notes TEXT;

-- Add index for reimbursement queries
CREATE INDEX IF NOT EXISTS idx_personal_use_charges_reimbursement
ON personal_use_charges(driver_id, is_reimbursement)
WHERE is_reimbursement = true;

CREATE INDEX IF NOT EXISTS idx_personal_use_charges_reimbursement_status
ON personal_use_charges(charge_status)
WHERE is_reimbursement = true AND charge_status IN ('pending', 'approved');

-- =====================================================
-- Step 4: Create reimbursement_requests table
-- =====================================================
-- Separate table for tracking reimbursement request lifecycle

CREATE TABLE IF NOT EXISTS reimbursement_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    driver_id UUID NOT NULL,
    charge_id UUID NOT NULL REFERENCES personal_use_charges(id) ON DELETE CASCADE,

    -- Request details
    request_amount DECIMAL(10,2) NOT NULL CHECK (request_amount >= 0),
    description TEXT,
    expense_date DATE NOT NULL,
    category VARCHAR(100), -- e.g., 'fuel', 'maintenance', 'insurance'

    -- Receipt information
    receipt_file_path VARCHAR(500),
    receipt_uploaded_at TIMESTAMP WITH TIME ZONE,
    receipt_metadata JSONB DEFAULT '{}',

    -- Approval workflow
    status reimbursement_status_type NOT NULL DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by_user_id UUID,
    reviewer_notes TEXT,

    -- Payment information
    approved_amount DECIMAL(10,2) CHECK (approved_amount >= 0),
    payment_date DATE,
    payment_method VARCHAR(50), -- e.g., 'direct_deposit', 'check', 'payroll'
    payment_reference VARCHAR(100),

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_user_id UUID,

    -- Constraints
    CONSTRAINT reimbursement_approved_amount_valid CHECK (
        (status = 'approved' AND approved_amount IS NOT NULL AND approved_amount <= request_amount)
        OR status != 'approved'
    ),
    CONSTRAINT reimbursement_payment_valid CHECK (
        (status = 'paid' AND payment_date IS NOT NULL AND payment_reference IS NOT NULL)
        OR status != 'paid'
    ),
    CONSTRAINT reimbursement_rejection_valid CHECK (
        (status = 'rejected' AND reviewer_notes IS NOT NULL)
        OR status != 'rejected'
    )
);

-- Indexes for reimbursement_requests
CREATE INDEX idx_reimbursement_requests_tenant ON reimbursement_requests(tenant_id);
CREATE INDEX idx_reimbursement_requests_driver ON reimbursement_requests(driver_id);
CREATE INDEX idx_reimbursement_requests_status ON reimbursement_requests(status);
CREATE INDEX idx_reimbursement_requests_driver_status ON reimbursement_requests(driver_id, status);
CREATE INDEX idx_reimbursement_requests_submitted ON reimbursement_requests(submitted_at DESC);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reimbursement_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reimbursement_requests_update_timestamp
    BEFORE UPDATE ON reimbursement_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_reimbursement_timestamp();

-- =====================================================
-- Step 5: Create payment_schedules table
-- =====================================================
-- For tracking recurring monthly bills and payroll deductions

CREATE TABLE IF NOT EXISTS payment_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    driver_id UUID NOT NULL,

    -- Schedule details
    payment_method payment_method_type NOT NULL,
    schedule_type VARCHAR(20) NOT NULL CHECK (schedule_type IN ('monthly', 'biweekly', 'weekly')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),

    -- Schedule timing
    start_date DATE NOT NULL,
    end_date DATE,
    next_payment_date DATE NOT NULL,
    last_payment_date DATE,

    -- Status
    is_active BOOLEAN DEFAULT true,
    suspended_at TIMESTAMP WITH TIME ZONE,
    suspended_reason TEXT,

    -- Linked charges
    charge_ids UUID[] DEFAULT ARRAY[]::UUID[],

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_user_id UUID,

    CONSTRAINT payment_schedule_dates_valid CHECK (
        end_date IS NULL OR end_date > start_date
    )
);

-- Indexes for payment_schedules
CREATE INDEX idx_payment_schedules_tenant ON payment_schedules(tenant_id);
CREATE INDEX idx_payment_schedules_driver ON payment_schedules(driver_id);
CREATE INDEX idx_payment_schedules_active ON payment_schedules(is_active) WHERE is_active = true;
CREATE INDEX idx_payment_schedules_next_payment ON payment_schedules(next_payment_date) WHERE is_active = true;

-- Trigger to update updated_at timestamp
CREATE TRIGGER payment_schedules_update_timestamp
    BEFORE UPDATE ON payment_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_reimbursement_timestamp();

-- =====================================================
-- Step 6: Create enhanced views
-- =====================================================

-- View: Driver reimbursement summary
CREATE OR REPLACE VIEW v_driver_reimbursement_summary AS
SELECT
    r.tenant_id,
    r.driver_id,
    r.status,
    COUNT(*) AS request_count,
    SUM(r.request_amount) AS total_requested,
    SUM(r.approved_amount) AS total_approved,
    SUM(CASE WHEN r.status = 'paid' THEN r.approved_amount ELSE 0 END) AS total_paid,
    MIN(r.submitted_at) AS earliest_request,
    MAX(r.submitted_at) AS latest_request,
    AVG(EXTRACT(EPOCH FROM (r.reviewed_at - r.submitted_at))/86400) AS avg_review_days
FROM reimbursement_requests r
GROUP BY r.tenant_id, r.driver_id, r.status;

-- View: Pending reimbursement queue (for admins)
CREATE OR REPLACE VIEW v_pending_reimbursements AS
SELECT
    r.id,
    r.tenant_id,
    r.driver_id,
    r.request_amount,
    r.description,
    r.expense_date,
    r.submitted_at,
    r.receipt_file_path,
    EXTRACT(EPOCH FROM (NOW() - r.submitted_at))/86400 AS days_pending,
    CASE
        WHEN r.receipt_file_path IS NOT NULL THEN true
        ELSE false
    END AS has_receipt
FROM reimbursement_requests r
WHERE r.status = 'pending'
ORDER BY r.submitted_at ASC;

-- View: Monthly payment obligations by driver
CREATE OR REPLACE VIEW v_monthly_payment_obligations AS
SELECT
    c.tenant_id,
    c.driver_id,
    c.charge_period,
    SUM(CASE WHEN c.is_reimbursement = false THEN c.total_charge ELSE 0 END) AS charges_owed,
    SUM(CASE WHEN c.is_reimbursement = true AND c.charge_status = 'approved' THEN c.total_charge ELSE 0 END) AS reimbursements_due,
    SUM(CASE WHEN c.charge_status = 'paid' THEN c.total_charge ELSE 0 END) AS total_paid,
    COUNT(CASE WHEN c.charge_status IN ('pending', 'invoiced', 'billed') THEN 1 END) AS pending_count
FROM personal_use_charges c
GROUP BY c.tenant_id, c.driver_id, c.charge_period;

-- View: Personal use dashboard metrics
CREATE OR REPLACE VIEW v_personal_use_dashboard AS
SELECT
    t.tenant_id,
    t.driver_id,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM') AS current_month,
    -- Current month usage
    COALESCE(SUM(CASE
        WHEN TO_CHAR(t.trip_date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
        THEN t.miles_personal
        ELSE 0
    END), 0) AS month_personal_miles,
    -- Current year usage
    COALESCE(SUM(CASE
        WHEN EXTRACT(YEAR FROM t.trip_date) = EXTRACT(YEAR FROM CURRENT_DATE)
        THEN t.miles_personal
        ELSE 0
    END), 0) AS year_personal_miles,
    -- Pending approvals
    COUNT(CASE WHEN t.approval_status = 'pending' THEN 1 END) AS pending_approvals,
    -- Charges summary
    (SELECT COUNT(*) FROM personal_use_charges c
     WHERE c.driver_id = t.driver_id AND c.charge_status IN ('pending', 'invoiced', 'billed')) AS pending_charges_count,
    (SELECT COALESCE(SUM(total_charge), 0) FROM personal_use_charges c
     WHERE c.driver_id = t.driver_id AND c.charge_status IN ('pending', 'invoiced', 'billed')) AS pending_charges_amount,
    -- Reimbursement summary
    (SELECT COUNT(*) FROM reimbursement_requests r
     WHERE r.driver_id = t.driver_id AND r.status = 'pending') AS pending_reimbursements_count,
    (SELECT COALESCE(SUM(request_amount), 0) FROM reimbursement_requests r
     WHERE r.driver_id = t.driver_id AND r.status = 'pending') AS pending_reimbursements_amount
FROM trip_usage_classification t
GROUP BY t.tenant_id, t.driver_id;

-- =====================================================
-- Step 7: Add helpful functions
-- =====================================================

-- Function to calculate charge based on policy
CREATE OR REPLACE FUNCTION calculate_personal_use_charge(
    p_tenant_id UUID,
    p_miles DECIMAL,
    p_actual_costs JSONB DEFAULT NULL
) RETURNS DECIMAL AS $$
DECLARE
    v_policy personal_use_policies%ROWTYPE;
    v_charge DECIMAL;
BEGIN
    -- Get policy
    SELECT * INTO v_policy
    FROM personal_use_policies
    WHERE tenant_id = p_tenant_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No policy found for tenant %', p_tenant_id;
    END IF;

    -- Calculate based on method
    CASE v_policy.calculation_method
        WHEN 'per_mile' THEN
            v_charge := ROUND(p_miles * v_policy.personal_use_rate_per_mile, 2);
        WHEN 'flat_fee' THEN
            v_charge := v_policy.flat_fee_amount;
        WHEN 'actual_cost' THEN
            -- Sum all costs from JSONB
            IF p_actual_costs IS NOT NULL THEN
                v_charge := (
                    SELECT SUM((value->>'amount')::DECIMAL)
                    FROM jsonb_each(p_actual_costs)
                );
            ELSE
                v_charge := 0;
            END IF;
        ELSE
            RAISE EXCEPTION 'Invalid calculation method: %', v_policy.calculation_method;
    END CASE;

    RETURN COALESCE(v_charge, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to auto-approve reimbursements under threshold
CREATE OR REPLACE FUNCTION auto_approve_reimbursement()
RETURNS TRIGGER AS $$
DECLARE
    v_policy personal_use_policies%ROWTYPE;
BEGIN
    -- Only process on INSERT of pending requests
    IF NEW.status != 'pending' THEN
        RETURN NEW;
    END IF;

    -- Get policy
    SELECT * INTO v_policy
    FROM personal_use_policies
    WHERE tenant_id = NEW.tenant_id;

    -- Check if auto-approval applies
    IF v_policy.auto_approve_under_amount IS NOT NULL
       AND NEW.request_amount <= v_policy.auto_approve_under_amount
       AND (NOT v_policy.require_receipt_upload OR NEW.receipt_file_path IS NOT NULL) THEN

        NEW.status := 'approved';
        NEW.approved_amount := NEW.request_amount;
        NEW.reviewed_at := NOW();
        NEW.reviewer_notes := 'Auto-approved under policy threshold';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach auto-approval trigger
DROP TRIGGER IF EXISTS auto_approve_reimbursement_trigger ON reimbursement_requests;
CREATE TRIGGER auto_approve_reimbursement_trigger
    BEFORE INSERT OR UPDATE ON reimbursement_requests
    FOR EACH ROW
    EXECUTE FUNCTION auto_approve_reimbursement();

-- =====================================================
-- Step 8: Add comments for documentation
-- =====================================================

COMMENT ON COLUMN personal_use_policies.payment_method IS 'How drivers pay for personal use: driver_direct, driver_reimburse, company_bill, payroll_deduct';
COMMENT ON COLUMN personal_use_policies.calculation_method IS 'How charges are calculated: per_mile, flat_fee, actual_cost';
COMMENT ON COLUMN personal_use_policies.auto_approve_under_amount IS 'Auto-approve reimbursement requests under this dollar amount';
COMMENT ON COLUMN personal_use_policies.reimbursement_payment_terms_days IS 'Number of days to process approved reimbursements';

COMMENT ON TABLE reimbursement_requests IS 'Driver reimbursement requests for personal use expenses - Migration 006';
COMMENT ON TABLE payment_schedules IS 'Recurring payment schedules for monthly billing and payroll deductions - Migration 006';

COMMENT ON COLUMN personal_use_charges.is_reimbursement IS 'True if this is a reimbursement to driver, false if driver owes company';
COMMENT ON COLUMN personal_use_charges.actual_cost_breakdown IS 'JSONB breakdown of actual costs (fuel, maintenance, insurance, etc.)';

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Migration 006 completed successfully';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Extended tables:';
    RAISE NOTICE '  - personal_use_policies (added 9 columns)';
    RAISE NOTICE '  - personal_use_charges (added 11 columns)';
    RAISE NOTICE 'Created tables:';
    RAISE NOTICE '  - reimbursement_requests';
    RAISE NOTICE '  - payment_schedules';
    RAISE NOTICE 'Created 4 new views for reporting';
    RAISE NOTICE 'Created helper functions for charge calculation';
    RAISE NOTICE 'Created auto-approval trigger for reimbursements';
    RAISE NOTICE '========================================';
END $$;
