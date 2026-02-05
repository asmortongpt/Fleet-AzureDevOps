-- ============================================================================
-- Migration: 007_warranty_tracking.sql
-- Description: Warranty tracking and claims recovery system
-- Author: Claude Code - Agent 7 (Phase 3)
-- Date: 2026-02-02
-- Reference: /Users/andrewmorton/Documents/fleet_database_analysis_and_recommendations.md (Section 1.5)
-- ============================================================================

-- ============================================================================
-- 1. WARRANTIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS warranties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    warranty_number VARCHAR(100),
    warranty_type VARCHAR(50) NOT NULL, -- manufacturer, extended, powertrain, component
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    component VARCHAR(100), -- engine, transmission, battery, tires, etc.
    part_id UUID, -- REFERENCES parts_inventory(id) ON DELETE SET NULL (if parts_inventory exists)
    vendor_id UUID, -- REFERENCES vendors(id) ON DELETE SET NULL (if vendors exists)
    start_date DATE NOT NULL,
    end_date DATE,
    end_mileage INTEGER,
    coverage_description TEXT NOT NULL,
    exclusions TEXT,
    claim_process TEXT,
    warranty_contact_name VARCHAR(255),
    warranty_contact_phone VARCHAR(50),
    warranty_contact_email VARCHAR(255),
    warranty_document_url VARCHAR(1000),
    transferable BOOLEAN DEFAULT false,
    prorated BOOLEAN DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, expired, voided, claimed
    void_date DATE,
    void_reason TEXT,
    claims_filed INTEGER DEFAULT 0,
    claims_approved INTEGER DEFAULT 0,
    total_claimed NUMERIC(12,2) DEFAULT 0,
    total_recovered NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_warranty_type CHECK (warranty_type IN ('manufacturer', 'extended', 'powertrain', 'component', 'other')),
    CONSTRAINT chk_warranty_status CHECK (status IN ('active', 'expired', 'voided', 'claimed')),
    CONSTRAINT chk_warranty_dates CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT chk_warranty_mileage CHECK (end_mileage IS NULL OR end_mileage > 0),
    CONSTRAINT chk_warranty_claims_filed CHECK (claims_filed >= 0),
    CONSTRAINT chk_warranty_claims_approved CHECK (claims_approved >= 0 AND claims_approved <= claims_filed),
    CONSTRAINT chk_warranty_amounts CHECK (total_claimed >= 0 AND total_recovered >= 0 AND total_recovered <= total_claimed)
);

-- ============================================================================
-- 2. WARRANTY CLAIMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS warranty_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    warranty_id UUID NOT NULL REFERENCES warranties(id) ON DELETE RESTRICT,
    claim_number VARCHAR(100) UNIQUE NOT NULL,
    work_order_id UUID, -- REFERENCES work_orders(id) ON DELETE SET NULL (if work_orders exists)
    claim_date DATE NOT NULL,
    filed_by UUID, -- REFERENCES users(id) ON DELETE SET NULL
    failure_description TEXT NOT NULL,
    failure_date DATE NOT NULL,
    vehicle_odometer INTEGER,
    failed_component VARCHAR(100),
    root_cause VARCHAR(255),
    repair_performed TEXT,
    parts_replaced JSONB, -- [{part_number, description, quantity, unit_cost}]
    labor_hours NUMERIC(6,2),
    claim_amount NUMERIC(10,2) NOT NULL,
    approved_amount NUMERIC(10,2),
    denied_amount NUMERIC(10,2),
    payout_amount NUMERIC(10,2),
    payout_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'submitted', -- submitted, under-review, approved, denied, paid
    approval_date DATE,
    denial_date DATE,
    denial_reason TEXT,
    adjuster_name VARCHAR(255),
    adjuster_contact VARCHAR(255),
    authorization_number VARCHAR(100),
    supporting_documents JSONB, -- [{name, url, upload_date}]
    timeline JSONB, -- [{date, event, description}]
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_warranty_claim_status CHECK (status IN ('submitted', 'under-review', 'approved', 'denied', 'paid', 'cancelled')),
    CONSTRAINT chk_warranty_claim_dates CHECK (failure_date <= claim_date),
    CONSTRAINT chk_warranty_claim_odometer CHECK (vehicle_odometer IS NULL OR vehicle_odometer >= 0),
    CONSTRAINT chk_warranty_claim_labor CHECK (labor_hours IS NULL OR labor_hours >= 0),
    CONSTRAINT chk_warranty_claims_amounts_positive CHECK (
        claim_amount >= 0 AND
        (approved_amount IS NULL OR approved_amount >= 0) AND
        (denied_amount IS NULL OR denied_amount >= 0) AND
        (payout_amount IS NULL OR payout_amount >= 0)
    ),
    CONSTRAINT chk_warranty_claim_approval_logic CHECK (
        (approved_amount IS NULL OR approval_date IS NOT NULL) AND
        (denial_reason IS NULL OR denial_date IS NOT NULL)
    )
);

-- If the table already existed (from prior runs/unversioned scripts), ensure key columns exist.
ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS work_order_id UUID;

-- Some environments may have a pre-existing `warranty_claims` table created outside this
-- migration. `CREATE TABLE IF NOT EXISTS` will not add missing columns, so guard index
-- creation by adding any required columns if absent.
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'warranty_claims') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'warranty_claims' AND column_name = 'claim_date') THEN
            ALTER TABLE warranty_claims ADD COLUMN claim_date DATE;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'warranty_claims' AND column_name = 'status') THEN
            ALTER TABLE warranty_claims ADD COLUMN status VARCHAR(50) DEFAULT 'submitted';
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'warranty_claims' AND column_name = 'tenant_id') THEN
            ALTER TABLE warranty_claims ADD COLUMN tenant_id UUID;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'warranty_claims' AND column_name = 'warranty_id') THEN
            ALTER TABLE warranty_claims ADD COLUMN warranty_id UUID;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 3. ALTER WORK_ORDERS TABLE (if exists)
-- ============================================================================

-- Check if work_orders table exists, then add warranty columns
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'work_orders') THEN
        -- Add warranty_claim_eligible column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns
                       WHERE table_name = 'work_orders'
                       AND column_name = 'warranty_claim_eligible') THEN
            ALTER TABLE work_orders ADD COLUMN warranty_claim_eligible BOOLEAN DEFAULT false;
        END IF;

        -- Add warranty_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns
                       WHERE table_name = 'work_orders'
                       AND column_name = 'warranty_id') THEN
            ALTER TABLE work_orders ADD COLUMN warranty_id UUID REFERENCES warranties(id) ON DELETE SET NULL;
        END IF;

        -- Add warranty_claim_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns
                       WHERE table_name = 'work_orders'
                       AND column_name = 'warranty_claim_id') THEN
            ALTER TABLE work_orders ADD COLUMN warranty_claim_id UUID REFERENCES warranty_claims(id) ON DELETE SET NULL;
        END IF;

        -- Add warranty_covered_amount column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns
                       WHERE table_name = 'work_orders'
                       AND column_name = 'warranty_covered_amount') THEN
            ALTER TABLE work_orders ADD COLUMN warranty_covered_amount NUMERIC(10,2);
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Warranties indexes
CREATE INDEX IF NOT EXISTS idx_warranties_vehicle_status ON warranties(vehicle_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_warranties_end_date ON warranties(end_date) WHERE end_date IS NOT NULL AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_warranties_tenant_status ON warranties(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_warranties_warranty_type ON warranties(warranty_type);
CREATE INDEX IF NOT EXISTS idx_warranties_component ON warranties(component) WHERE component IS NOT NULL;

-- Warranty claims indexes
CREATE INDEX IF NOT EXISTS idx_warranty_claims_warranty_status ON warranty_claims(warranty_id, status);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_work_order_id ON warranty_claims(work_order_id) WHERE work_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_warranty_claims_tenant_status ON warranty_claims(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_claim_date ON warranty_claims(claim_date DESC);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_status ON warranty_claims(status);

-- ============================================================================
-- 5. TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Trigger for warranties.updated_at
CREATE OR REPLACE FUNCTION update_warranties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_warranties_updated_at
    BEFORE UPDATE ON warranties
    FOR EACH ROW
    EXECUTE FUNCTION update_warranties_updated_at();

-- Trigger for warranty_claims.updated_at
CREATE OR REPLACE FUNCTION update_warranty_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_warranty_claims_updated_at
    BEFORE UPDATE ON warranty_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_warranty_claims_updated_at();

-- ============================================================================
-- 6. TRIGGER TO AUTO-UPDATE WARRANTY STATISTICS
-- ============================================================================

-- Update warranty statistics when a claim is filed or updated
CREATE OR REPLACE FUNCTION update_warranty_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- On INSERT or UPDATE of warranty claim
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE warranties
        SET
            claims_filed = (SELECT COUNT(*) FROM warranty_claims WHERE warranty_id = NEW.warranty_id),
            claims_approved = (SELECT COUNT(*) FROM warranty_claims WHERE warranty_id = NEW.warranty_id AND status = 'approved'),
            total_claimed = (SELECT COALESCE(SUM(claim_amount), 0) FROM warranty_claims WHERE warranty_id = NEW.warranty_id),
            total_recovered = (SELECT COALESCE(SUM(payout_amount), 0) FROM warranty_claims WHERE warranty_id = NEW.warranty_id AND status = 'paid'),
            updated_at = NOW()
        WHERE id = NEW.warranty_id;

        RETURN NEW;
    END IF;

    -- On DELETE of warranty claim
    IF TG_OP = 'DELETE' THEN
        UPDATE warranties
        SET
            claims_filed = (SELECT COUNT(*) FROM warranty_claims WHERE warranty_id = OLD.warranty_id),
            claims_approved = (SELECT COUNT(*) FROM warranty_claims WHERE warranty_id = OLD.warranty_id AND status = 'approved'),
            total_claimed = (SELECT COALESCE(SUM(claim_amount), 0) FROM warranty_claims WHERE warranty_id = OLD.warranty_id),
            total_recovered = (SELECT COALESCE(SUM(payout_amount), 0) FROM warranty_claims WHERE warranty_id = OLD.warranty_id AND status = 'paid'),
            updated_at = NOW()
        WHERE id = OLD.warranty_id;

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_warranty_statistics
    AFTER INSERT OR UPDATE OR DELETE ON warranty_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_warranty_statistics();

-- ============================================================================
-- 7. FUNCTION TO CHECK WARRANTY ELIGIBILITY
-- ============================================================================

CREATE OR REPLACE FUNCTION check_warranty_eligibility(
    p_vehicle_id UUID,
    p_component VARCHAR(100),
    p_failure_date DATE,
    p_odometer INTEGER
)
RETURNS TABLE (
    warranty_id UUID,
    warranty_number VARCHAR(100),
    warranty_type VARCHAR(50),
    coverage_description TEXT,
    is_eligible BOOLEAN,
    ineligibility_reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        w.id,
        w.warranty_number,
        w.warranty_type,
        w.coverage_description,
        CASE
            WHEN w.status != 'active' THEN false
            WHEN w.end_date IS NOT NULL AND p_failure_date > w.end_date THEN false
            WHEN w.end_mileage IS NOT NULL AND p_odometer > w.end_mileage THEN false
            WHEN p_component IS NOT NULL AND w.component IS NOT NULL AND w.component != p_component THEN false
            ELSE true
        END as is_eligible,
        CASE
            WHEN w.status != 'active' THEN 'Warranty is not active (status: ' || w.status || ')'
            WHEN w.end_date IS NOT NULL AND p_failure_date > w.end_date THEN 'Failure date (' || p_failure_date::text || ') is after warranty end date (' || w.end_date::text || ')'
            WHEN w.end_mileage IS NOT NULL AND p_odometer > w.end_mileage THEN 'Odometer (' || p_odometer::text || ') exceeds warranty mileage limit (' || w.end_mileage::text || ')'
            WHEN p_component IS NOT NULL AND w.component IS NOT NULL AND w.component != p_component THEN 'Component (' || p_component || ') is not covered by this warranty (covers: ' || w.component || ')'
            ELSE NULL
        END as ineligibility_reason
    FROM warranties w
    WHERE w.vehicle_id = p_vehicle_id
    ORDER BY
        CASE WHEN w.status = 'active' THEN 0 ELSE 1 END,
        w.end_date DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. FUNCTION TO EXPIRE WARRANTIES
-- ============================================================================

CREATE OR REPLACE FUNCTION expire_warranties()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER;
BEGIN
    -- Expire warranties by date
    WITH expired_by_date AS (
        UPDATE warranties
        SET status = 'expired',
            updated_at = NOW()
        WHERE status = 'active'
          AND end_date IS NOT NULL
          AND end_date < CURRENT_DATE
        RETURNING id
    )
    SELECT COUNT(*) INTO updated_count FROM expired_by_date;

    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE warranties IS 'Vehicle and component warranty tracking including manufacturer and extended warranties';
COMMENT ON TABLE warranty_claims IS 'Warranty claims filed for repairs, tracking submission through payout';

COMMENT ON COLUMN warranties.warranty_type IS 'Type of warranty: manufacturer, extended, powertrain, component, other';
COMMENT ON COLUMN warranties.status IS 'Warranty status: active, expired, voided, claimed';
COMMENT ON COLUMN warranties.transferable IS 'Whether warranty can be transferred to new owner';
COMMENT ON COLUMN warranties.prorated IS 'Whether warranty coverage is prorated based on time/mileage';

COMMENT ON COLUMN warranty_claims.status IS 'Claim status: submitted, under-review, approved, denied, paid, cancelled';
COMMENT ON COLUMN warranty_claims.parts_replaced IS 'JSON array of parts replaced: [{part_number, description, quantity, unit_cost}]';
COMMENT ON COLUMN warranty_claims.supporting_documents IS 'JSON array of documents: [{name, url, upload_date}]';
COMMENT ON COLUMN warranty_claims.timeline IS 'JSON array of claim events: [{date, event, description}]';

-- ============================================================================
-- 10. GRANT PERMISSIONS (adjust as needed for your RBAC system)
-- ============================================================================

-- Grant basic permissions (adjust based on your role system)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON warranties TO fleet_user;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON warranty_claims TO fleet_user;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 007_warranty_tracking.sql completed successfully';
    RAISE NOTICE 'Tables created: warranties, warranty_claims';
    RAISE NOTICE 'Indexes created: 10';
    RAISE NOTICE 'Triggers created: 3';
    RAISE NOTICE 'Functions created: 3';
END $$;
