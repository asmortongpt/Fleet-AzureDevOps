-- Migration: Personal vs Business Vehicle Use Tracking
-- Description: Adds tables for trip usage classification, personal use policies, and charges
-- Version: 005
-- Date: 2025-11-10
-- Federal Compliance: IRS personal vs business use tracking requirements

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table 1: Trip Usage Classification
-- =====================================================
-- Tracks whether each trip is business, personal, or mixed use
-- Required for IRS compliance and mileage reimbursement accuracy

CREATE TABLE IF NOT EXISTS trip_usage_classification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Trip identification
    trip_id UUID, -- Optional reference to fuel_transactions, routes, or telemetry
    vehicle_id UUID NOT NULL,
    driver_id UUID NOT NULL,

    -- Usage classification
    usage_type VARCHAR(20) NOT NULL CHECK (usage_type IN ('business', 'personal', 'mixed')),
    business_purpose TEXT,
    business_percentage DECIMAL(5,2) CHECK (business_percentage >= 0 AND business_percentage <= 100),
    personal_notes TEXT,

    -- Mileage breakdown
    miles_total DECIMAL(10,2) NOT NULL CHECK (miles_total >= 0),
    miles_business DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE
            WHEN usage_type = 'business' THEN miles_total
            WHEN usage_type = 'personal' THEN 0
            WHEN usage_type = 'mixed' THEN ROUND(miles_total * (business_percentage / 100.0), 2)
            ELSE 0
        END
    ) STORED,
    miles_personal DECIMAL(10,2) GENERATED ALWAYS AS (
        CASE
            WHEN usage_type = 'business' THEN 0
            WHEN usage_type = 'personal' THEN miles_total
            WHEN usage_type = 'mixed' THEN ROUND(miles_total * ((100.0 - business_percentage) / 100.0), 2)
            ELSE 0
        END
    ) STORED,

    -- Trip details
    trip_date DATE NOT NULL,
    start_location VARCHAR(255),
    end_location VARCHAR(255),
    start_odometer DECIMAL(10,2),
    end_odometer DECIMAL(10,2),

    -- Approval workflow
    approved_by_user_id UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_approved')),
    rejection_reason TEXT,

    -- Additional metadata
    metadata JSONB DEFAULT '{}',

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_user_id UUID,

    -- Constraints
    CONSTRAINT trip_usage_business_purpose_required CHECK (
        (usage_type IN ('business', 'mixed') AND business_purpose IS NOT NULL)
        OR usage_type = 'personal'
    ),
    CONSTRAINT trip_usage_business_percentage_required CHECK (
        (usage_type = 'mixed' AND business_percentage IS NOT NULL)
        OR usage_type IN ('business', 'personal')
    ),
    CONSTRAINT trip_usage_odometer_valid CHECK (
        end_odometer IS NULL OR start_odometer IS NULL OR end_odometer >= start_odometer
    )
);

-- Indexes for performance
CREATE INDEX idx_trip_usage_tenant ON trip_usage_classification(tenant_id);
CREATE INDEX idx_trip_usage_driver ON trip_usage_classification(driver_id);
CREATE INDEX idx_trip_usage_vehicle ON trip_usage_classification(vehicle_id);
CREATE INDEX idx_trip_usage_type ON trip_usage_classification(usage_type);
CREATE INDEX idx_trip_usage_date ON trip_usage_classification(trip_date DESC);
CREATE INDEX idx_trip_usage_approval_status ON trip_usage_classification(approval_status);
CREATE INDEX idx_trip_usage_driver_date ON trip_usage_classification(driver_id, trip_date DESC);
CREATE INDEX idx_trip_usage_tenant_status ON trip_usage_classification(tenant_id, approval_status);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trip_usage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_usage_update_timestamp
    BEFORE UPDATE ON trip_usage_classification
    FOR EACH ROW
    EXECUTE FUNCTION update_trip_usage_timestamp();

-- =====================================================
-- Table 2: Personal Use Policies
-- =====================================================
-- Tenant-level configuration for personal vehicle use policies

CREATE TABLE IF NOT EXISTS personal_use_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL UNIQUE,

    -- Policy settings
    allow_personal_use BOOLEAN NOT NULL DEFAULT false,
    require_approval BOOLEAN NOT NULL DEFAULT true,
    max_personal_miles_per_month INTEGER CHECK (max_personal_miles_per_month > 0),
    max_personal_miles_per_year INTEGER CHECK (max_personal_miles_per_year > 0),

    -- Charging configuration
    charge_personal_use BOOLEAN NOT NULL DEFAULT false,
    personal_use_rate_per_mile DECIMAL(5,2) CHECK (personal_use_rate_per_mile >= 0),

    -- Reporting requirements
    reporting_required BOOLEAN NOT NULL DEFAULT true,
    approval_workflow VARCHAR(20) NOT NULL DEFAULT 'manager'
        CHECK (approval_workflow IN ('manager', 'fleet_admin', 'both', 'none')),

    -- Notification settings
    notification_settings JSONB DEFAULT '{
        "notify_at_percentage": 80,
        "notify_manager_on_exceed": true,
        "notify_driver_on_limit": true,
        "email_notifications": true
    }'::jsonb,

    -- Auto-approval thresholds
    auto_approve_under_miles INTEGER,
    auto_approve_days_advance INTEGER DEFAULT 0,

    -- Policy effective date
    effective_date DATE NOT NULL,
    expiration_date DATE,

    -- Audit fields
    created_by_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT policy_charge_rate_required CHECK (
        (charge_personal_use = true AND personal_use_rate_per_mile IS NOT NULL)
        OR charge_personal_use = false
    ),
    CONSTRAINT policy_dates_valid CHECK (
        expiration_date IS NULL OR expiration_date > effective_date
    ),
    CONSTRAINT policy_yearly_exceeds_monthly CHECK (
        max_personal_miles_per_year IS NULL
        OR max_personal_miles_per_month IS NULL
        OR max_personal_miles_per_year >= max_personal_miles_per_month
    )
);

-- Indexes
CREATE INDEX idx_personal_use_policies_tenant ON personal_use_policies(tenant_id);
CREATE INDEX idx_personal_use_policies_effective ON personal_use_policies(effective_date DESC);

-- Trigger to update updated_at timestamp
CREATE TRIGGER policies_update_timestamp
    BEFORE UPDATE ON personal_use_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_trip_usage_timestamp();

-- =====================================================
-- Table 3: Personal Use Charges
-- =====================================================
-- Tracks charges/billing for personal use of company vehicles

CREATE TABLE IF NOT EXISTS personal_use_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    driver_id UUID NOT NULL,
    trip_usage_id UUID REFERENCES trip_usage_classification(id) ON DELETE CASCADE,

    -- Billing period
    charge_period VARCHAR(7) NOT NULL, -- YYYY-MM format
    charge_period_start DATE NOT NULL,
    charge_period_end DATE NOT NULL,

    -- Charge calculation
    miles_charged DECIMAL(10,2) NOT NULL CHECK (miles_charged >= 0),
    rate_per_mile DECIMAL(5,2) NOT NULL CHECK (rate_per_mile >= 0),
    total_charge DECIMAL(10,2) NOT NULL CHECK (total_charge >= 0),

    -- Payment tracking
    charge_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (charge_status IN ('pending', 'invoiced', 'billed', 'paid', 'waived', 'disputed')),
    payment_method VARCHAR(50),
    paid_at TIMESTAMP WITH TIME ZONE,
    waived_by_user_id UUID,
    waived_at TIMESTAMP WITH TIME ZONE,
    waived_reason TEXT,

    -- Invoice information
    invoice_number VARCHAR(50),
    invoice_date DATE,
    due_date DATE,

    -- Additional information
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_user_id UUID,

    -- Constraints
    CONSTRAINT charge_calculation_valid CHECK (
        total_charge = ROUND(miles_charged * rate_per_mile, 2)
    ),
    CONSTRAINT charge_paid_fields_valid CHECK (
        (charge_status = 'paid' AND paid_at IS NOT NULL)
        OR charge_status != 'paid'
    ),
    CONSTRAINT charge_waived_fields_valid CHECK (
        (charge_status = 'waived' AND waived_by_user_id IS NOT NULL AND waived_reason IS NOT NULL)
        OR charge_status != 'waived'
    ),
    CONSTRAINT charge_period_dates_valid CHECK (
        charge_period_end > charge_period_start
    )
);

-- Indexes for performance
CREATE INDEX idx_personal_use_charges_tenant ON personal_use_charges(tenant_id);
CREATE INDEX idx_personal_use_charges_driver ON personal_use_charges(driver_id);
CREATE INDEX idx_personal_use_charges_period ON personal_use_charges(charge_period);
CREATE INDEX idx_personal_use_charges_status ON personal_use_charges(charge_status);
CREATE INDEX idx_personal_use_charges_driver_period ON personal_use_charges(driver_id, charge_period DESC);
CREATE INDEX idx_personal_use_charges_trip_usage ON personal_use_charges(trip_usage_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER charges_update_timestamp
    BEFORE UPDATE ON personal_use_charges
    FOR EACH ROW
    EXECUTE FUNCTION update_trip_usage_timestamp();

-- =====================================================
-- Helper Views for Reporting
-- =====================================================

-- View: Monthly personal use summary by driver
CREATE OR REPLACE VIEW v_monthly_personal_use_summary AS
SELECT
    t.tenant_id,
    t.driver_id,
    TO_CHAR(t.trip_date, 'YYYY-MM') AS month,
    COUNT(*) AS total_trips,
    SUM(t.miles_personal) AS total_personal_miles,
    SUM(t.miles_business) AS total_business_miles,
    SUM(t.miles_total) AS total_miles,
    SUM(CASE WHEN t.usage_type = 'personal' THEN 1 ELSE 0 END) AS personal_trips,
    SUM(CASE WHEN t.usage_type = 'business' THEN 1 ELSE 0 END) AS business_trips,
    SUM(CASE WHEN t.usage_type = 'mixed' THEN 1 ELSE 0 END) AS mixed_trips,
    SUM(CASE WHEN t.approval_status = 'pending' THEN 1 ELSE 0 END) AS pending_approvals
FROM trip_usage_classification t
GROUP BY t.tenant_id, t.driver_id, TO_CHAR(t.trip_date, 'YYYY-MM');

-- View: Driver usage with policy limits
CREATE OR REPLACE VIEW v_driver_usage_vs_limits AS
SELECT
    p.tenant_id,
    t.driver_id,
    TO_CHAR(t.trip_date, 'YYYY-MM') AS month,
    SUM(t.miles_personal) AS personal_miles_used,
    p.max_personal_miles_per_month AS monthly_limit,
    CASE
        WHEN p.max_personal_miles_per_month IS NULL THEN NULL
        ELSE ROUND((SUM(t.miles_personal) / p.max_personal_miles_per_month * 100), 2)
    END AS percentage_of_monthly_limit,
    CASE
        WHEN p.max_personal_miles_per_month IS NOT NULL
             AND SUM(t.miles_personal) > p.max_personal_miles_per_month
        THEN true
        ELSE false
    END AS exceeds_monthly_limit
FROM trip_usage_classification t
JOIN personal_use_policies p ON t.tenant_id = p.tenant_id
GROUP BY p.tenant_id, t.driver_id, TO_CHAR(t.trip_date, 'YYYY-MM'),
         p.max_personal_miles_per_month;

-- View: Pending charges summary
CREATE OR REPLACE VIEW v_pending_charges_summary AS
SELECT
    c.tenant_id,
    c.driver_id,
    c.charge_period,
    COUNT(*) AS total_charges,
    SUM(c.miles_charged) AS total_miles,
    SUM(c.total_charge) AS total_amount,
    MIN(c.created_at) AS earliest_charge_date,
    MAX(c.created_at) AS latest_charge_date
FROM personal_use_charges c
WHERE c.charge_status IN ('pending', 'invoiced', 'billed')
GROUP BY c.tenant_id, c.driver_id, c.charge_period;

-- =====================================================
-- Sample Data for Testing (Optional)
-- =====================================================

-- Insert a default policy for testing (commented out for production)
-- INSERT INTO personal_use_policies (
--     tenant_id,
--     allow_personal_use,
--     require_approval,
--     max_personal_miles_per_month,
--     max_personal_miles_per_year,
--     charge_personal_use,
--     personal_use_rate_per_mile,
--     effective_date
-- )
-- SELECT
--     id,
--     true,
--     true,
--     200,
--     2000,
--     false,
--     NULL,
--     CURRENT_DATE
-- FROM tenants
-- WHERE NOT EXISTS (
--     SELECT 1 FROM personal_use_policies WHERE tenant_id = tenants.id
-- );

-- =====================================================
-- Migration Complete
-- =====================================================

-- Add comment to track migration
COMMENT ON TABLE trip_usage_classification IS 'Personal vs Business trip usage classification - Migration 005';
COMMENT ON TABLE personal_use_policies IS 'Tenant-level personal vehicle use policies - Migration 005';
COMMENT ON TABLE personal_use_charges IS 'Personal use billing and charges - Migration 005';

-- Verification queries
DO $$
BEGIN
    RAISE NOTICE 'Migration 005 completed successfully';
    RAISE NOTICE 'Created tables: trip_usage_classification, personal_use_policies, personal_use_charges';
    RAISE NOTICE 'Created 3 views for reporting';
    RAISE NOTICE 'Created indexes for performance optimization';
END $$;
