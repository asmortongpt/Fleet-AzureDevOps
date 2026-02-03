-- ============================================================================
-- VENDOR PERFORMANCE & CONTRACT MANAGEMENT SYSTEM
-- Phase 3 - Agent 8: Complete vendor tracking with performance scorecards,
-- contract management, and vendor contacts
-- Fortune 50 Security Standards: RLS, parameterized queries, audit logging
-- ============================================================================

-- ============================================================================
-- VENDOR PERFORMANCE SCORECARDS
-- Track vendor performance metrics over time for data-driven decisions
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendor_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

    -- Evaluation period
    evaluation_period_start DATE NOT NULL,
    evaluation_period_end DATE NOT NULL,

    -- Order metrics
    total_orders INTEGER DEFAULT 0 CHECK (total_orders >= 0),
    on_time_deliveries INTEGER DEFAULT 0 CHECK (on_time_deliveries >= 0),
    on_time_percentage NUMERIC(5,2) DEFAULT 0,

    -- Performance scores (1-5 scale)
    quality_score NUMERIC(5,2) DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 5),
    pricing_competitiveness NUMERIC(5,2) DEFAULT 0 CHECK (pricing_competitiveness >= 0 AND pricing_competitiveness <= 5),
    responsiveness_score NUMERIC(5,2) DEFAULT 0 CHECK (responsiveness_score >= 0 AND responsiveness_score <= 5),

    -- Financial metrics
    total_spend NUMERIC(12,2) DEFAULT 0 CHECK (total_spend >= 0),

    -- Warranty performance
    warranty_claims INTEGER DEFAULT 0 CHECK (warranty_claims >= 0),
    warranty_approval_rate NUMERIC(5,2) DEFAULT 0 CHECK (warranty_approval_rate >= 0 AND warranty_approval_rate <= 100),

    -- Customer satisfaction
    customer_satisfaction NUMERIC(5,2) DEFAULT 0 CHECK (customer_satisfaction >= 0 AND customer_satisfaction <= 5),

    -- Overall score and ranking
    overall_score NUMERIC(5,2) DEFAULT 0,
    ranking INTEGER,
    preferred_vendor BOOLEAN DEFAULT false,

    -- Notes and improvement areas
    improvement_areas TEXT,
    notes TEXT,

    -- Evaluation metadata
    evaluated_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Audit timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique evaluations per period
    CONSTRAINT unique_vendor_evaluation_period UNIQUE (tenant_id, vendor_id, evaluation_period_start)
);

-- Indexes for vendor performance
CREATE INDEX IF NOT EXISTS idx_vendor_performance_vendor_period
    ON vendor_performance(vendor_id, evaluation_period_start DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_performance_ranking
    ON vendor_performance(tenant_id, ranking) WHERE ranking IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendor_performance_preferred
    ON vendor_performance(tenant_id, vendor_id) WHERE preferred_vendor = true;
CREATE INDEX IF NOT EXISTS idx_vendor_performance_overall_score
    ON vendor_performance(tenant_id, overall_score DESC);

-- Check constraint for scores
ALTER TABLE vendor_performance ADD CONSTRAINT chk_vendor_performance_scores_valid
    CHECK (
        quality_score BETWEEN 0 AND 5 AND
        pricing_competitiveness BETWEEN 0 AND 5 AND
        responsiveness_score BETWEEN 0 AND 5 AND
        customer_satisfaction BETWEEN 0 AND 5
    );

-- ============================================================================
-- VENDOR CONTRACTS
-- Track service agreements, pricing contracts, MSAs, and blanket POs
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendor_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,

    -- Contract identification
    contract_number VARCHAR(100) NOT NULL,
    contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN (
        'service-agreement', 'blanket-po', 'pricing-contract', 'msa', 'maintenance-plan', 'other'
    )),

    -- Contract period
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    term_months INTEGER,

    -- Financial terms
    contract_value NUMERIC(12,2) CHECK (contract_value IS NULL OR contract_value >= 0),
    payment_terms VARCHAR(100),

    -- Service level agreement
    service_level_agreement TEXT,
    sla_response_time_hours INTEGER,
    sla_resolution_time_hours INTEGER,

    -- Pricing terms (structured as JSONB for flexibility)
    pricing_terms JSONB DEFAULT '{}',

    -- Renewal terms
    auto_renew BOOLEAN DEFAULT false,
    renewal_notice_days INTEGER DEFAULT 60 CHECK (renewal_notice_days >= 0),

    -- Termination clause
    termination_clause TEXT,
    early_termination_penalty NUMERIC(10,2),

    -- Document management
    contract_document_url VARCHAR(1000),
    signed_contract_url VARCHAR(1000),

    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN (
        'draft', 'pending-approval', 'active', 'expired', 'terminated', 'renewed'
    )),

    -- Termination tracking
    terminated_date DATE,
    termination_reason TEXT,
    terminated_by UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    -- Audit fields
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique contract numbers per tenant
    CONSTRAINT unique_vendor_contract_number UNIQUE (tenant_id, contract_number),

    -- Ensure dates are logical
    CONSTRAINT chk_vendor_contract_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_vendor_contract_termination CHECK (
        terminated_date IS NULL OR terminated_date >= start_date
    )
);

-- Indexes for vendor contracts
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_vendor_status
    ON vendor_contracts(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_expiring
    ON vendor_contracts(tenant_id, end_date)
    WHERE status = 'active' AND end_date > CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_type
    ON vendor_contracts(tenant_id, contract_type);
CREATE INDEX IF NOT EXISTS idx_vendor_contracts_auto_renew
    ON vendor_contracts(tenant_id, end_date)
    WHERE auto_renew = true AND status = 'active';

-- Check constraint for positive values
ALTER TABLE vendor_contracts ADD CONSTRAINT chk_vendor_contracts_value_positive
    CHECK (contract_value IS NULL OR contract_value >= 0);

-- ============================================================================
-- VENDOR CONTACTS
-- Multiple contacts per vendor with different roles and responsibilities
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendor_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

    -- Contact information
    contact_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255),
    department VARCHAR(100),

    -- Contact methods
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    mobile VARCHAR(50),
    fax VARCHAR(50),

    -- Contact type and preferences
    contact_type VARCHAR(50) NOT NULL CHECK (contact_type IN (
        'primary', 'accounting', 'sales', 'support', 'technical', 'emergency', 'legal', 'other'
    )),
    is_primary BOOLEAN DEFAULT false,
    preferred_contact_method VARCHAR(50) DEFAULT 'email' CHECK (preferred_contact_method IN (
        'email', 'phone', 'mobile', 'fax'
    )),

    -- Availability
    availability_hours VARCHAR(100),
    timezone VARCHAR(50),

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Notes
    notes TEXT,

    -- Audit timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for vendor contacts
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_vendor_type
    ON vendor_contacts(vendor_id, contact_type);
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_primary
    ON vendor_contacts(vendor_id) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_active
    ON vendor_contacts(vendor_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_email
    ON vendor_contacts(email) WHERE is_active = true;

-- ============================================================================
-- TRIGGERS FOR TIMESTAMP UPDATES AND CALCULATED FIELDS
-- ============================================================================

-- Update vendor_performance timestamp and calculated fields
CREATE OR REPLACE FUNCTION update_vendor_performance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();

    -- Calculate on_time_percentage
    IF NEW.total_orders > 0 THEN
        NEW.on_time_percentage = ROUND((NEW.on_time_deliveries::NUMERIC / NEW.total_orders::NUMERIC * 100), 2);
    ELSE
        NEW.on_time_percentage = 0;
    END IF;

    -- Calculate overall_score
    NEW.overall_score = ROUND((
        COALESCE(NEW.quality_score, 0) * 0.30 +
        COALESCE(NEW.pricing_competitiveness, 0) * 0.25 +
        COALESCE(NEW.responsiveness_score, 0) * 0.20 +
        COALESCE(NEW.customer_satisfaction, 0) * 0.15 +
        COALESCE(NEW.on_time_percentage / 20, 0) * 0.10
    ), 2);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_vendor_performance_timestamp
BEFORE INSERT OR UPDATE ON vendor_performance
FOR EACH ROW
EXECUTE FUNCTION update_vendor_performance_timestamp();

-- Update vendor_contracts timestamp and calculated fields
CREATE OR REPLACE FUNCTION update_vendor_contracts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();

    -- Calculate term_months
    NEW.term_months = EXTRACT(YEAR FROM AGE(NEW.end_date, NEW.start_date))::INTEGER * 12 +
                      EXTRACT(MONTH FROM AGE(NEW.end_date, NEW.start_date))::INTEGER;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_vendor_contracts_timestamp
BEFORE INSERT OR UPDATE ON vendor_contracts
FOR EACH ROW
EXECUTE FUNCTION update_vendor_contracts_timestamp();

-- Update vendor_contacts timestamp
CREATE OR REPLACE FUNCTION update_vendor_contacts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_vendor_contacts_timestamp
BEFORE UPDATE ON vendor_contacts
FOR EACH ROW
EXECUTE FUNCTION update_vendor_contacts_timestamp();

-- ============================================================================
-- AUTOMATIC VENDOR RANKING CALCULATION
-- Recalculate rankings whenever performance scores change
-- ============================================================================

CREATE OR REPLACE FUNCTION update_vendor_rankings()
RETURNS TRIGGER AS $$
BEGIN
    -- Update rankings for all vendors in the same tenant and evaluation period
    WITH ranked_vendors AS (
        SELECT
            id,
            ROW_NUMBER() OVER (
                PARTITION BY tenant_id, evaluation_period_start
                ORDER BY overall_score DESC, total_spend DESC
            ) AS new_rank
        FROM vendor_performance
        WHERE tenant_id = NEW.tenant_id
          AND evaluation_period_start = NEW.evaluation_period_start
    )
    UPDATE vendor_performance vp
    SET ranking = rv.new_rank
    FROM ranked_vendors rv
    WHERE vp.id = rv.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_vendor_rankings
AFTER INSERT OR UPDATE OF overall_score ON vendor_performance
FOR EACH ROW
EXECUTE FUNCTION update_vendor_rankings();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- Enforce tenant isolation at the database level
-- ============================================================================

ALTER TABLE vendor_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_contacts ENABLE ROW LEVEL SECURITY;

-- Vendor performance RLS policy
CREATE POLICY vendor_performance_tenant_isolation ON vendor_performance
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Vendor contracts RLS policy
CREATE POLICY vendor_contracts_tenant_isolation ON vendor_contracts
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Vendor contacts RLS policy
CREATE POLICY vendor_contacts_tenant_isolation ON vendor_contacts
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Current vendor performance rankings
CREATE OR REPLACE VIEW v_current_vendor_rankings AS
SELECT
    vp.*,
    v.name as vendor_name,
    v.type as vendor_type,
    v.preferred_vendor as vendor_preferred_flag,
    v.rating as vendor_rating
FROM vendor_performance vp
INNER JOIN vendors v ON vp.vendor_id = v.id
WHERE vp.evaluation_period_end >= CURRENT_DATE - INTERVAL '90 days'
ORDER BY vp.tenant_id, vp.ranking;

-- Expiring contracts (next 90 days)
CREATE OR REPLACE VIEW v_expiring_vendor_contracts AS
SELECT
    vc.*,
    v.name as vendor_name,
    v.contact_name as vendor_contact_name,
    v.contact_email as vendor_contact_email,
    v.contact_phone as vendor_contact_phone,
    (vc.end_date - CURRENT_DATE) as days_until_expiry
FROM vendor_contracts vc
INNER JOIN vendors v ON vc.vendor_id = v.id
WHERE vc.status = 'active'
  AND vc.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '90 days'
ORDER BY vc.end_date;

-- Vendor contact directory
CREATE OR REPLACE VIEW v_vendor_contact_directory AS
SELECT
    v.id as vendor_id,
    v.name as vendor_name,
    v.type as vendor_type,
    vc.contact_name,
    vc.job_title,
    vc.department,
    vc.email,
    vc.phone,
    vc.mobile,
    vc.contact_type,
    vc.is_primary,
    vc.preferred_contact_method,
    vc.availability_hours,
    vc.timezone
FROM vendors v
INNER JOIN vendor_contacts vc ON v.id = vc.vendor_id
WHERE vc.is_active = true
ORDER BY v.name, vc.is_primary DESC, vc.contact_type;

-- Vendor spend summary
CREATE OR REPLACE VIEW v_vendor_spend_summary AS
SELECT
    v.id as vendor_id,
    v.tenant_id,
    v.name as vendor_name,
    v.type as vendor_type,
    COUNT(DISTINCT po.id) as total_purchase_orders,
    SUM(po.total_amount) as total_spend,
    MAX(po.order_date) as last_order_date,
    AVG(EXTRACT(DAY FROM (po.delivered_date - po.order_date))) as avg_delivery_days,
    COUNT(DISTINCT vc.id) as active_contracts
FROM vendors v
LEFT JOIN purchase_orders po ON v.id = po.vendor_id
LEFT JOIN vendor_contracts vc ON v.id = vc.vendor_id AND vc.status = 'active'
GROUP BY v.id, v.tenant_id, v.name, v.type;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate on-time delivery percentage
CREATE OR REPLACE FUNCTION calculate_vendor_on_time_percentage(
    p_vendor_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS NUMERIC AS $$
DECLARE
    v_total_orders INTEGER;
    v_on_time_deliveries INTEGER;
BEGIN
    SELECT
        COUNT(*) FILTER (WHERE delivered_date IS NOT NULL),
        COUNT(*) FILTER (WHERE delivered_date IS NOT NULL AND delivered_date <= expected_delivery_date)
    INTO v_total_orders, v_on_time_deliveries
    FROM purchase_orders
    WHERE vendor_id = p_vendor_id
      AND order_date BETWEEN p_start_date AND p_end_date;

    IF v_total_orders > 0 THEN
        RETURN ROUND((v_on_time_deliveries::NUMERIC / v_total_orders::NUMERIC * 100), 2);
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to get vendor spend for a period
CREATE OR REPLACE FUNCTION calculate_vendor_spend(
    p_vendor_id UUID,
    p_start_date DATE,
    p_end_date DATE
) RETURNS NUMERIC AS $$
DECLARE
    v_total_spend NUMERIC(12,2);
BEGIN
    SELECT COALESCE(SUM(total_amount), 0)
    INTO v_total_spend
    FROM purchase_orders
    WHERE vendor_id = p_vendor_id
      AND order_date BETWEEN p_start_date AND p_end_date
      AND status NOT IN ('cancelled', 'draft');

    RETURN v_total_spend;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE vendor_performance IS 'Vendor performance scorecards with metrics and rankings for data-driven vendor management';
COMMENT ON TABLE vendor_contracts IS 'Vendor contracts including service agreements, pricing contracts, and MSAs with SLA tracking';
COMMENT ON TABLE vendor_contacts IS 'Multiple contacts per vendor with roles, contact preferences, and availability';

COMMENT ON COLUMN vendor_performance.overall_score IS 'Weighted average of all performance metrics (auto-calculated)';
COMMENT ON COLUMN vendor_performance.ranking IS 'Vendor ranking within tenant for the evaluation period (auto-calculated)';
COMMENT ON COLUMN vendor_contracts.auto_renew IS 'Whether contract automatically renews at end date';
COMMENT ON COLUMN vendor_contracts.renewal_notice_days IS 'Days before expiry to send renewal notification';
COMMENT ON COLUMN vendor_contacts.is_primary IS 'Primary contact for the vendor';

-- ============================================================================
-- MIGRATION COMPLETE
-- Phase 3 - Agent 8: Vendor Performance & Contracts
-- Tables: vendor_performance, vendor_contracts, vendor_contacts
-- ============================================================================
