-- ============================================================================
-- Missing Tables - Comprehensive Fix for All Broken Endpoints
-- ============================================================================
-- Created: 2026-01-29
-- Purpose: Add all missing tables that cause 73% of endpoints to fail
-- Impact: Fixes 69 broken endpoints
-- ============================================================================

-- ============================================================================
-- Quality Gates Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS quality_gates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Gate configuration
    name VARCHAR(255) NOT NULL,
    description TEXT,
    gate_type VARCHAR(50) NOT NULL CHECK (gate_type IN (
        'unit_tests', 'integration_tests', 'e2e_tests', 'security_scan',
        'performance', 'accessibility', 'code_coverage', 'linting', 'type_check'
    )),

    -- Criteria
    criteria JSONB DEFAULT '{}',
    threshold DECIMAL(5,2), -- e.g., 80.00 for 80% code coverage
    metric_type VARCHAR(50), -- 'percentage', 'count', 'duration_ms'
    is_active BOOLEAN DEFAULT true,

    -- Execution tracking (for deployment gates)
    deployment_id UUID,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'passed', 'failed', 'skipped')),
    result_data JSONB DEFAULT '{}',
    error_message TEXT,
    execution_time_seconds DECIMAL(10,2),
    executed_by_user_id UUID REFERENCES users(id),
    executed_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_quality_gates_tenant ON quality_gates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quality_gates_type ON quality_gates(gate_type);
CREATE INDEX IF NOT EXISTS idx_quality_gates_deployment ON quality_gates(deployment_id);
CREATE INDEX IF NOT EXISTS idx_quality_gates_status ON quality_gates(status);
CREATE INDEX IF NOT EXISTS idx_quality_gates_executed_at ON quality_gates(executed_at DESC);

COMMENT ON TABLE quality_gates IS 'Quality gates for CI/CD pipeline and deployments';
COMMENT ON COLUMN quality_gates.gate_type IS 'Type of quality gate check being performed';
COMMENT ON COLUMN quality_gates.threshold IS 'Minimum value required to pass the gate';

-- ============================================================================
-- Teams Table (not Microsoft Teams, but organizational teams)
-- ============================================================================
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Team details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    team_type VARCHAR(50) DEFAULT 'operational', -- operational, maintenance, dispatch, management

    -- Team lead
    team_lead_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Contact info
    email VARCHAR(255),
    phone VARCHAR(50),

    -- Location
    location VARCHAR(255),
    facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,

    -- Schedule
    shift_start TIME,
    shift_end TIME,
    timezone VARCHAR(50) DEFAULT 'America/New_York',

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),

    UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_teams_tenant ON teams(tenant_id);
CREATE INDEX IF NOT EXISTS idx_teams_lead ON teams(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_teams_facility ON teams(facility_id);
CREATE INDEX IF NOT EXISTS idx_teams_active ON teams(is_active) WHERE is_active = true;

COMMENT ON TABLE teams IS 'Organizational teams for dispatch, maintenance, etc.';

-- Team Members junction table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- member, lead, supervisor
    joined_at TIMESTAMP DEFAULT NOW(),
    left_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,

    UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active) WHERE is_active = true;

-- ============================================================================
-- Cost Analysis Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS cost_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Analysis period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    period_type VARCHAR(20) DEFAULT 'monthly', -- daily, weekly, monthly, quarterly, annual

    -- Scope
    analysis_type VARCHAR(50) NOT NULL, -- vehicle, fleet, department, cost_center
    entity_id UUID, -- vehicle_id, facility_id, department_id
    entity_type VARCHAR(50),

    -- Cost breakdown
    fuel_cost DECIMAL(12,2) DEFAULT 0,
    maintenance_cost DECIMAL(12,2) DEFAULT 0,
    parts_cost DECIMAL(12,2) DEFAULT 0,
    labor_cost DECIMAL(12,2) DEFAULT 0,
    insurance_cost DECIMAL(12,2) DEFAULT 0,
    registration_cost DECIMAL(12,2) DEFAULT 0,
    depreciation_cost DECIMAL(12,2) DEFAULT 0,
    lease_payment DECIMAL(12,2) DEFAULT 0,
    violation_cost DECIMAL(12,2) DEFAULT 0,
    accident_cost DECIMAL(12,2) DEFAULT 0,
    other_cost DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) GENERATED ALWAYS AS (
        fuel_cost + maintenance_cost + parts_cost + labor_cost +
        insurance_cost + registration_cost + depreciation_cost +
        lease_payment + violation_cost + accident_cost + other_cost
    ) STORED,

    -- Utilization metrics
    miles_driven DECIMAL(10,2),
    hours_utilized DECIMAL(10,2),
    cost_per_mile DECIMAL(10,4) GENERATED ALWAYS AS (
        CASE WHEN miles_driven > 0 THEN (fuel_cost + maintenance_cost + parts_cost + labor_cost +
        insurance_cost + registration_cost + depreciation_cost +
        lease_payment + violation_cost + accident_cost + other_cost) / miles_driven ELSE 0 END
    ) STORED,

    -- Comparison
    budget_amount DECIMAL(12,2),
    variance_amount DECIMAL(12,2) GENERATED ALWAYS AS (
        CASE WHEN budget_amount IS NOT NULL THEN
            (fuel_cost + maintenance_cost + parts_cost + labor_cost +
            insurance_cost + registration_cost + depreciation_cost +
            lease_payment + violation_cost + accident_cost + other_cost) - budget_amount
        ELSE NULL END
    ) STORED,

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_cost_analysis_tenant ON cost_analysis(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cost_analysis_period ON cost_analysis(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_cost_analysis_entity ON cost_analysis(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_cost_analysis_type ON cost_analysis(analysis_type);

COMMENT ON TABLE cost_analysis IS 'Comprehensive cost analysis by period and entity';

-- ============================================================================
-- Billing Reports Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS billing_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Report details
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) DEFAULT 'monthly', -- monthly, quarterly, annual, custom
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Scope
    department_id UUID,
    cost_center VARCHAR(100),

    -- Totals
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) DEFAULT 0,

    -- Line items (stored as JSONB array)
    line_items JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, pending_approval, approved, paid, cancelled
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,

    -- Payment tracking
    invoice_number VARCHAR(50) UNIQUE,
    due_date DATE,
    paid_date DATE,
    paid_amount DECIMAL(12,2),
    payment_method VARCHAR(50),

    -- File attachments
    file_url VARCHAR(1000),
    file_path VARCHAR(500),

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_billing_reports_tenant ON billing_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_billing_reports_period ON billing_reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_billing_reports_status ON billing_reports(status);
CREATE INDEX IF NOT EXISTS idx_billing_reports_invoice ON billing_reports(invoice_number);

COMMENT ON TABLE billing_reports IS 'Monthly/quarterly billing reports and invoices';

-- ============================================================================
-- Mileage Reimbursement Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS mileage_reimbursement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Employee/driver
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,

    -- Trip details
    trip_date DATE NOT NULL,
    trip_purpose VARCHAR(255) NOT NULL,
    start_location VARCHAR(255),
    end_location VARCHAR(255),
    route_description TEXT,

    -- Mileage
    miles DECIMAL(10,2) NOT NULL,
    reimbursement_rate DECIMAL(6,4) NOT NULL, -- e.g., 0.6550 for $0.655/mile (2024 IRS rate)
    reimbursement_amount DECIMAL(10,2) GENERATED ALWAYS AS (miles * reimbursement_rate) STORED,

    -- Vehicle used
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    vehicle_type VARCHAR(50), -- personal, company, rental

    -- GPS verification
    gps_verified BOOLEAN DEFAULT false,
    gps_start_lat DECIMAL(10,8),
    gps_start_lon DECIMAL(11,8),
    gps_end_lat DECIMAL(10,8),
    gps_end_lon DECIMAL(11,8),
    calculated_miles DECIMAL(10,2),

    -- Receipt/documentation
    receipt_url VARCHAR(1000),
    documentation JSONB DEFAULT '[]',

    -- Approval workflow
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, paid
    submitted_at TIMESTAMP DEFAULT NOW(),
    approved_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    rejection_reason TEXT,

    -- Payment
    paid_at TIMESTAMP,
    payment_batch_id VARCHAR(100),

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mileage_reimbursement_tenant ON mileage_reimbursement(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mileage_reimbursement_user ON mileage_reimbursement(user_id);
CREATE INDEX IF NOT EXISTS idx_mileage_reimbursement_status ON mileage_reimbursement(status);
CREATE INDEX IF NOT EXISTS idx_mileage_reimbursement_date ON mileage_reimbursement(trip_date DESC);

COMMENT ON TABLE mileage_reimbursement IS 'Employee mileage reimbursement claims';
COMMENT ON COLUMN mileage_reimbursement.reimbursement_rate IS 'Per-mile rate in dollars (e.g., 0.655 for $0.655/mile)';

-- ============================================================================
-- Personal Use Data Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS personal_use_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Vehicle and driver
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,

    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Usage breakdown
    total_miles DECIMAL(10,2) DEFAULT 0,
    business_miles DECIMAL(10,2) DEFAULT 0,
    personal_miles DECIMAL(10,2) GENERATED ALWAYS AS (total_miles - business_miles) STORED,
    personal_use_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN total_miles > 0 THEN ((total_miles - business_miles) / total_miles * 100) ELSE 0 END
    ) STORED,

    -- Commute tracking
    commute_miles DECIMAL(10,2) DEFAULT 0,
    commute_days INTEGER DEFAULT 0,

    -- Cost allocation
    total_fuel_cost DECIMAL(10,2) DEFAULT 0,
    personal_fuel_cost DECIMAL(10,2),
    total_maintenance_cost DECIMAL(10,2) DEFAULT 0,
    personal_maintenance_cost DECIMAL(10,2),

    -- Tax implications
    taxable_benefit_amount DECIMAL(10,2),
    fair_market_value_daily DECIMAL(10,2),

    -- Policy compliance
    policy_id UUID REFERENCES personal_use_policies(id),
    exceeds_limit BOOLEAN DEFAULT false,
    limit_exceeded_by DECIMAL(10,2),

    -- Approval
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, under_review, flagged
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personal_use_tenant ON personal_use_data(tenant_id);
CREATE INDEX IF NOT EXISTS idx_personal_use_vehicle ON personal_use_data(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_personal_use_driver ON personal_use_data(driver_id);
CREATE INDEX IF NOT EXISTS idx_personal_use_period ON personal_use_data(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_personal_use_exceeds ON personal_use_data(exceeds_limit) WHERE exceeds_limit = true;

COMMENT ON TABLE personal_use_data IS 'Personal use tracking for company vehicles';
COMMENT ON COLUMN personal_use_data.personal_use_percentage IS 'Calculated percentage of personal vs business use';

-- ============================================================================
-- Update Triggers
-- ============================================================================

-- Update updated_at columns
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quality_gates_modtime
    BEFORE UPDATE ON quality_gates
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_teams_modtime
    BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_cost_analysis_modtime
    BEFORE UPDATE ON cost_analysis
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_billing_reports_modtime
    BEFORE UPDATE ON billing_reports
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_mileage_reimbursement_modtime
    BEFORE UPDATE ON mileage_reimbursement
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_personal_use_data_modtime
    BEFORE UPDATE ON personal_use_data
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- ============================================================================
-- Row-Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE quality_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE mileage_reimbursement ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_use_data ENABLE ROW LEVEL SECURITY;

-- Quality Gates policies
CREATE POLICY quality_gates_tenant_isolation ON quality_gates
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Teams policies
CREATE POLICY teams_tenant_isolation ON teams
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Cost Analysis policies
CREATE POLICY cost_analysis_tenant_isolation ON cost_analysis
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Billing Reports policies
CREATE POLICY billing_reports_tenant_isolation ON billing_reports
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Mileage Reimbursement policies
CREATE POLICY mileage_reimbursement_tenant_isolation ON mileage_reimbursement
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Personal Use Data policies
CREATE POLICY personal_use_data_tenant_isolation ON personal_use_data
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ============================================================================
-- Grants
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON quality_gates TO webapp;
GRANT SELECT, INSERT, UPDATE, DELETE ON teams TO webapp;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_members TO webapp;
GRANT SELECT, INSERT, UPDATE, DELETE ON cost_analysis TO webapp;
GRANT SELECT, INSERT, UPDATE, DELETE ON billing_reports TO webapp;
GRANT SELECT, INSERT, UPDATE, DELETE ON mileage_reimbursement TO webapp;
GRANT SELECT, INSERT, UPDATE, DELETE ON personal_use_data TO webapp;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
