-- ============================================================================
-- Insurance & Claims Management Migration
-- File: 003_insurance_claims.sql
-- Description: Comprehensive insurance policy and claims tracking system
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. INSURANCE POLICIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS insurance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    policy_number VARCHAR(100) UNIQUE NOT NULL,
    policy_type VARCHAR(50) NOT NULL CHECK (policy_type IN ('liability', 'collision', 'comprehensive', 'cargo', 'workers-comp')),
    insurance_carrier VARCHAR(255) NOT NULL,
    carrier_contact_name VARCHAR(255),
    carrier_contact_phone VARCHAR(50),
    carrier_contact_email VARCHAR(255),
    policy_start_date DATE NOT NULL,
    policy_end_date DATE NOT NULL,
    premium_amount NUMERIC(12,2) NOT NULL CHECK (premium_amount >= 0),
    premium_frequency VARCHAR(20) CHECK (premium_frequency IN ('monthly', 'quarterly', 'annual')),
    deductible_amount NUMERIC(10,2) CHECK (deductible_amount >= 0),
    coverage_limits JSONB NOT NULL DEFAULT '{}',
    covered_vehicles JSONB DEFAULT '[]',
    covered_drivers JSONB DEFAULT '[]',
    policy_document_url VARCHAR(1000),
    certificate_of_insurance_url VARCHAR(1000),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending-renewal')),
    auto_renew BOOLEAN NOT NULL DEFAULT false,
    renewal_notice_days INTEGER DEFAULT 30,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_insurance_policies_dates_logical CHECK (policy_end_date >= policy_start_date)
);

-- ============================================================================
-- 2. INSURANCE CLAIMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS insurance_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    claim_number VARCHAR(100) UNIQUE NOT NULL,
    incident_id UUID NOT NULL,
    policy_id UUID NOT NULL,
    claim_type VARCHAR(50) NOT NULL CHECK (claim_type IN ('property-damage', 'bodily-injury', 'comprehensive', 'collision')),
    filed_date DATE NOT NULL,
    filed_by UUID,
    insurance_adjuster_name VARCHAR(255),
    insurance_adjuster_phone VARCHAR(50),
    insurance_adjuster_email VARCHAR(255),
    claim_amount_requested NUMERIC(12,2) CHECK (claim_amount_requested >= 0),
    claim_amount_approved NUMERIC(12,2) CHECK (claim_amount_approved >= 0),
    deductible_paid NUMERIC(10,2) CHECK (deductible_paid >= 0),
    payout_amount NUMERIC(12,2) CHECK (payout_amount >= 0),
    payout_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'filed' CHECK (status IN ('filed', 'under-review', 'approved', 'denied', 'settled', 'closed')),
    status_updated_at TIMESTAMPTZ,
    denial_reason TEXT,
    at_fault_party VARCHAR(50) CHECK (at_fault_party IN ('our-driver', 'third-party', 'unknown', 'both')),
    at_fault_percentage INTEGER CHECK (at_fault_percentage >= 0 AND at_fault_percentage <= 100),
    total_loss BOOLEAN DEFAULT false,
    salvage_value NUMERIC(10,2) CHECK (salvage_value >= 0),
    claim_notes TEXT,
    timeline JSONB DEFAULT '[]',
    documents JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_insurance_claims_amounts_logical CHECK (
        (claim_amount_approved IS NULL OR claim_amount_approved <= COALESCE(claim_amount_requested, claim_amount_approved)) AND
        (payout_amount IS NULL OR payout_amount <= COALESCE(claim_amount_approved, payout_amount))
    )
);

-- ============================================================================
-- 3. VEHICLE INSURANCE ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_insurance_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    vehicle_id UUID NOT NULL,
    policy_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(vehicle_id, policy_id, start_date),
    CONSTRAINT chk_vehicle_insurance_dates_logical CHECK (end_date IS NULL OR end_date >= start_date)
);

-- ============================================================================
-- 4. DRIVER INSURANCE ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_insurance_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    driver_id UUID NOT NULL,
    policy_id UUID NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(driver_id, policy_id, start_date),
    CONSTRAINT chk_driver_insurance_dates_logical CHECK (end_date IS NULL OR end_date >= start_date)
);

-- ============================================================================
-- 5. ENHANCE EXISTING INCIDENTS TABLE
-- ============================================================================
DO $$
BEGIN
    -- Add claim_filed column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'incidents' AND column_name = 'claim_filed') THEN
        ALTER TABLE incidents ADD COLUMN claim_filed BOOLEAN DEFAULT false;
    END IF;

    -- Add claim_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'incidents' AND column_name = 'claim_id') THEN
        ALTER TABLE incidents ADD COLUMN claim_id UUID;
    END IF;

    -- Add at_fault_party column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'incidents' AND column_name = 'at_fault_party') THEN
        ALTER TABLE incidents ADD COLUMN at_fault_party VARCHAR(50);
    END IF;

    -- Add total_loss column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'incidents' AND column_name = 'total_loss') THEN
        ALTER TABLE incidents ADD COLUMN total_loss BOOLEAN DEFAULT false;
    END IF;

    -- Add subrogation column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'incidents' AND column_name = 'subrogation') THEN
        ALTER TABLE incidents ADD COLUMN subrogation BOOLEAN DEFAULT false;
    END IF;

    -- Add subrogation_amount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'incidents' AND column_name = 'subrogation_amount') THEN
        ALTER TABLE incidents ADD COLUMN subrogation_amount NUMERIC(12,2);
    END IF;

    -- Add third_party_insurance_company column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'incidents' AND column_name = 'third_party_insurance_company') THEN
        ALTER TABLE incidents ADD COLUMN third_party_insurance_company VARCHAR(255);
    END IF;

    -- Add third_party_policy_number column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'incidents' AND column_name = 'third_party_policy_number') THEN
        ALTER TABLE incidents ADD COLUMN third_party_policy_number VARCHAR(100);
    END IF;
END $$;

-- ============================================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Insurance Policies indexes
CREATE INDEX IF NOT EXISTS idx_insurance_policies_tenant_status
    ON insurance_policies(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_insurance_policies_expiry_date
    ON insurance_policies(policy_end_date)
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_insurance_policies_carrier
    ON insurance_policies(insurance_carrier, tenant_id);

-- Insurance Claims indexes
CREATE INDEX IF NOT EXISTS idx_insurance_claims_tenant_id
    ON insurance_claims(tenant_id);

CREATE INDEX IF NOT EXISTS idx_insurance_claims_incident_id
    ON insurance_claims(incident_id);

CREATE INDEX IF NOT EXISTS idx_insurance_claims_policy_id
    ON insurance_claims(policy_id);

CREATE INDEX IF NOT EXISTS idx_insurance_claims_policy_status
    ON insurance_claims(policy_id, status);

CREATE INDEX IF NOT EXISTS idx_insurance_claims_filed_date
    ON insurance_claims(filed_date DESC);

CREATE INDEX IF NOT EXISTS idx_insurance_claims_status
    ON insurance_claims(status, tenant_id);

-- Vehicle Insurance Assignments indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_insurance_assignments_vehicle_id
    ON vehicle_insurance_assignments(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_insurance_assignments_policy_id
    ON vehicle_insurance_assignments(policy_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_insurance_assignments_vehicle_active
    ON vehicle_insurance_assignments(vehicle_id, is_active)
    WHERE is_active = true;

-- Driver Insurance Assignments indexes
CREATE INDEX IF NOT EXISTS idx_driver_insurance_assignments_driver_id
    ON driver_insurance_assignments(driver_id);

CREATE INDEX IF NOT EXISTS idx_driver_insurance_assignments_policy_id
    ON driver_insurance_assignments(policy_id);

CREATE INDEX IF NOT EXISTS idx_driver_insurance_assignments_driver_active
    ON driver_insurance_assignments(driver_id, is_active)
    WHERE is_active = true;

-- Incidents claim tracking indexes
CREATE INDEX IF NOT EXISTS idx_incidents_claim_id
    ON incidents(claim_id)
    WHERE claim_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_incidents_claim_filed
    ON incidents(tenant_id, claim_filed)
    WHERE claim_filed = true;

-- ============================================================================
-- 7. ADD FOREIGN KEY CONSTRAINTS (IF TABLES EXIST)
-- ============================================================================

-- Note: We use conditional FK creation to avoid errors if referenced tables don't exist yet

DO $$
BEGIN
    -- Insurance Claims foreign keys
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incidents') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                       WHERE constraint_name = 'fk_insurance_claims_incident_id') THEN
            ALTER TABLE insurance_claims
                ADD CONSTRAINT fk_insurance_claims_incident_id
                FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE RESTRICT;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'fk_insurance_claims_policy_id') THEN
        ALTER TABLE insurance_claims
            ADD CONSTRAINT fk_insurance_claims_policy_id
            FOREIGN KEY (policy_id) REFERENCES insurance_policies(id) ON DELETE RESTRICT;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                       WHERE constraint_name = 'fk_insurance_claims_filed_by') THEN
            ALTER TABLE insurance_claims
                ADD CONSTRAINT fk_insurance_claims_filed_by
                FOREIGN KEY (filed_by) REFERENCES users(id) ON DELETE SET NULL;
        END IF;
    END IF;

    -- Vehicle Insurance Assignments foreign keys
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                       WHERE constraint_name = 'fk_vehicle_insurance_vehicle_id') THEN
            ALTER TABLE vehicle_insurance_assignments
                ADD CONSTRAINT fk_vehicle_insurance_vehicle_id
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'fk_vehicle_insurance_policy_id') THEN
        ALTER TABLE vehicle_insurance_assignments
            ADD CONSTRAINT fk_vehicle_insurance_policy_id
            FOREIGN KEY (policy_id) REFERENCES insurance_policies(id) ON DELETE CASCADE;
    END IF;

    -- Driver Insurance Assignments foreign keys
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                       WHERE constraint_name = 'fk_driver_insurance_driver_id') THEN
            ALTER TABLE driver_insurance_assignments
                ADD CONSTRAINT fk_driver_insurance_driver_id
                FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE;
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE constraint_name = 'fk_driver_insurance_policy_id') THEN
        ALTER TABLE driver_insurance_assignments
            ADD CONSTRAINT fk_driver_insurance_policy_id
            FOREIGN KEY (policy_id) REFERENCES insurance_policies(id) ON DELETE CASCADE;
    END IF;

    -- Incidents claim_id foreign key
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incidents') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                       WHERE constraint_name = 'fk_incidents_claim_id') THEN
            ALTER TABLE incidents
                ADD CONSTRAINT fk_incidents_claim_id
                FOREIGN KEY (claim_id) REFERENCES insurance_claims(id) ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- ============================================================================
-- 8. CREATE UPDATED_AT TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column'
    ) THEN
        CREATE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;
    END IF;
END $$;

-- Insurance Policies trigger
DROP TRIGGER IF EXISTS update_insurance_policies_updated_at ON insurance_policies;
CREATE TRIGGER update_insurance_policies_updated_at
    BEFORE UPDATE ON insurance_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insurance Claims trigger
DROP TRIGGER IF EXISTS update_insurance_claims_updated_at ON insurance_claims;
CREATE TRIGGER update_insurance_claims_updated_at
    BEFORE UPDATE ON insurance_claims
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vehicle Insurance Assignments trigger
DROP TRIGGER IF EXISTS update_vehicle_insurance_assignments_updated_at ON vehicle_insurance_assignments;
CREATE TRIGGER update_vehicle_insurance_assignments_updated_at
    BEFORE UPDATE ON vehicle_insurance_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Driver Insurance Assignments trigger
DROP TRIGGER IF EXISTS update_driver_insurance_assignments_updated_at ON driver_insurance_assignments;
CREATE TRIGGER update_driver_insurance_assignments_updated_at
    BEFORE UPDATE ON driver_insurance_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. GRANT PERMISSIONS (OPTIONAL - ADJUST BASED ON YOUR ROLE STRUCTURE)
-- ============================================================================

-- Grant permissions to application role (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'fleet_app') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON insurance_policies TO fleet_app;
        GRANT SELECT, INSERT, UPDATE, DELETE ON insurance_claims TO fleet_app;
        GRANT SELECT, INSERT, UPDATE, DELETE ON vehicle_insurance_assignments TO fleet_app;
        GRANT SELECT, INSERT, UPDATE, DELETE ON driver_insurance_assignments TO fleet_app;
    END IF;
END $$;

-- ============================================================================
-- 10. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE insurance_policies IS 'Insurance policy master table tracking all types of fleet insurance coverage';
COMMENT ON TABLE insurance_claims IS 'Insurance claims filed against policies with full workflow tracking';
COMMENT ON TABLE vehicle_insurance_assignments IS 'Many-to-many relationship between vehicles and insurance policies';
COMMENT ON TABLE driver_insurance_assignments IS 'Many-to-many relationship between drivers and insurance policies';

COMMENT ON COLUMN insurance_policies.coverage_limits IS 'JSON object containing coverage limits by type, e.g., {"bodily_injury": 1000000, "property_damage": 500000}';
COMMENT ON COLUMN insurance_policies.covered_vehicles IS 'JSON array of vehicle IDs or "all" indicator';
COMMENT ON COLUMN insurance_policies.covered_drivers IS 'JSON array of driver IDs or "all" indicator';

COMMENT ON COLUMN insurance_claims.timeline IS 'JSON array of timeline events: [{"date": "2026-01-15", "event": "Filed", "description": "..."}]';
COMMENT ON COLUMN insurance_claims.documents IS 'JSON array of document references: [{"name": "Police Report", "url": "...", "upload_date": "..."}]';

COMMIT;

-- ============================================================================
-- Migration Complete
-- ============================================================================
