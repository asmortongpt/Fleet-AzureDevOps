-- ============================================================================
-- Migration: 019_vehicle_contracts_leasing.sql
-- Description: Vehicle Contracts, Leasing, and Lease-End Inspection Management
-- Author: Claude Code
-- Date: 2026-02-02
-- Phase: 3 - Agent 6
-- ============================================================================
-- Tables: 3
--   1. vehicle_contracts - Lease agreements, purchase contracts, rentals, service contracts
--   2. lease_end_inspections - Lease return inspections with wear/damage charges
--   3. service_contracts - Extended warranties, maintenance plans, roadside assistance
-- Enhancements: ALTER vehicles table with ownership fields
-- ============================================================================

-- ============================================================================
-- Table: vehicle_contracts
-- Purpose: Track vehicle leases, purchase contracts, rentals, and service agreements
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Contract identification
    contract_number VARCHAR(100) NOT NULL,
    contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN (
        'lease', 'purchase', 'rental', 'service-contract'
    )),

    -- Associations
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,

    -- Contract dates and terms
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    term_months INTEGER,

    -- Financial terms
    monthly_payment NUMERIC(10, 2),
    down_payment NUMERIC(10, 2),
    buyout_option BOOLEAN DEFAULT false,
    buyout_amount NUMERIC(10, 2),

    -- Lease-specific terms
    mileage_allowance_annual INTEGER,  -- Annual mileage allowance for leases
    excess_mileage_fee NUMERIC(6, 4),  -- Dollar amount per mile over allowance
    early_termination_fee NUMERIC(10, 2),

    -- Coverage and services included
    wear_and_tear_coverage BOOLEAN DEFAULT false,
    maintenance_included BOOLEAN DEFAULT false,
    insurance_included BOOLEAN DEFAULT false,

    -- Contract management
    contract_document_url VARCHAR(1000),
    auto_renew BOOLEAN DEFAULT false,
    renewal_notice_days INTEGER DEFAULT 60,

    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN (
        'active', 'expired', 'terminated', 'renewed'
    )),
    termination_date DATE,
    termination_reason TEXT,

    -- Financial tracking
    total_paid NUMERIC(12, 2) DEFAULT 0,
    final_buyout_exercised BOOLEAN DEFAULT false,

    -- Additional metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    CONSTRAINT unique_contract_number_per_tenant UNIQUE (tenant_id, contract_number),
    CONSTRAINT chk_vehicle_contracts_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_vehicle_contracts_payments_positive CHECK (
        (monthly_payment IS NULL OR monthly_payment >= 0) AND
        (down_payment IS NULL OR down_payment >= 0) AND
        (buyout_amount IS NULL OR buyout_amount >= 0) AND
        (total_paid IS NULL OR total_paid >= 0)
    )
);

-- Indexes for vehicle_contracts
CREATE INDEX idx_vehicle_contracts_tenant ON vehicle_contracts(tenant_id);
CREATE INDEX idx_vehicle_contracts_vehicle ON vehicle_contracts(vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX idx_vehicle_contracts_vendor ON vehicle_contracts(vendor_id);
CREATE INDEX idx_vehicle_contracts_vehicle_status ON vehicle_contracts(vehicle_id, status);
CREATE INDEX idx_vehicle_contracts_end_date ON vehicle_contracts(end_date) WHERE status = 'active';
CREATE INDEX idx_vehicle_contracts_type ON vehicle_contracts(contract_type, status);
CREATE INDEX idx_vehicle_contracts_expiring ON vehicle_contracts(end_date, status)
    WHERE status = 'active' AND end_date >= CURRENT_DATE;

-- Trigger: Update timestamp
CREATE TRIGGER update_vehicle_contracts_timestamp
    BEFORE UPDATE ON vehicle_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE vehicle_contracts IS 'Vehicle lease agreements, purchase contracts, rentals, and service contracts';
COMMENT ON COLUMN vehicle_contracts.mileage_allowance_annual IS 'Annual mileage allowance for leases (total allowance divided by term)';
COMMENT ON COLUMN vehicle_contracts.excess_mileage_fee IS 'Cost per mile over allowance (e.g., $0.25/mile)';
COMMENT ON COLUMN vehicle_contracts.total_paid IS 'Total amount paid to date on this contract';

-- ============================================================================
-- Table: lease_end_inspections
-- Purpose: Track lease-end inspections, wear & tear charges, and dispositions
-- ============================================================================

CREATE TABLE IF NOT EXISTS lease_end_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Associations
    contract_id UUID NOT NULL REFERENCES vehicle_contracts(id) ON DELETE RESTRICT,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

    -- Inspection details
    inspection_date DATE NOT NULL,
    inspector_name VARCHAR(255),
    inspector_company VARCHAR(255),

    -- Mileage assessment
    final_odometer INTEGER NOT NULL,
    mileage_overage INTEGER DEFAULT 0,
    mileage_penalty NUMERIC(10, 2) DEFAULT 0,

    -- Wear and tear charges
    excess_wear_items JSONB,  -- [{item: "front bumper", description: "scratched", charge: 250}]
    excess_wear_total NUMERIC(10, 2) DEFAULT 0,

    -- Missing items
    missing_items JSONB,  -- [{item: "spare tire", description: "missing", charge: 150}]
    missing_items_total NUMERIC(10, 2) DEFAULT 0,

    -- Total charges
    total_charges NUMERIC(12, 2),

    -- Disposition
    disposition VARCHAR(50) CHECK (disposition IN (
        'returned', 'purchased', 'extended'
    )),
    disposition_date DATE,

    -- Documentation
    final_invoice_url VARCHAR(1000),
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    CONSTRAINT chk_lease_end_inspections_odometer_positive CHECK (final_odometer >= 0),
    CONSTRAINT chk_lease_end_inspections_charges_positive CHECK (
        (mileage_penalty IS NULL OR mileage_penalty >= 0) AND
        (excess_wear_total IS NULL OR excess_wear_total >= 0) AND
        (missing_items_total IS NULL OR missing_items_total >= 0) AND
        (total_charges IS NULL OR total_charges >= 0)
    ),
    CONSTRAINT chk_lease_end_inspections_dates CHECK (
        disposition_date IS NULL OR disposition_date >= inspection_date
    )
);

-- Indexes for lease_end_inspections
CREATE INDEX idx_lease_end_inspections_tenant ON lease_end_inspections(tenant_id);
CREATE INDEX idx_lease_end_inspections_contract_id ON lease_end_inspections(contract_id);
CREATE INDEX idx_lease_end_inspections_vehicle ON lease_end_inspections(vehicle_id);
CREATE INDEX idx_lease_end_inspections_date ON lease_end_inspections(inspection_date DESC);
CREATE INDEX idx_lease_end_inspections_disposition ON lease_end_inspections(disposition);

-- Trigger: Update timestamp
CREATE TRIGGER update_lease_end_inspections_timestamp
    BEFORE UPDATE ON lease_end_inspections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE lease_end_inspections IS 'Lease-end vehicle inspections with wear, tear, and mileage overage charges';
COMMENT ON COLUMN lease_end_inspections.final_odometer IS 'Vehicle odometer reading at lease end';
COMMENT ON COLUMN lease_end_inspections.mileage_overage IS 'Miles over the lease allowance';
COMMENT ON COLUMN lease_end_inspections.excess_wear_items IS 'JSON array of wear items and associated charges';
COMMENT ON COLUMN lease_end_inspections.missing_items IS 'JSON array of missing equipment and charges';

-- ============================================================================
-- Table: service_contracts
-- Purpose: Track extended warranties, maintenance plans, roadside assistance
-- ============================================================================

CREATE TABLE IF NOT EXISTS service_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Contract identification
    contract_number VARCHAR(100) NOT NULL,
    contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN (
        'extended-warranty', 'maintenance-plan', 'roadside-assistance'
    )),

    -- Associations
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    vehicle_type VARCHAR(100),  -- Applies to all vehicles of this type
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,

    -- Contract terms
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    coverage_mileage INTEGER,  -- Max mileage covered

    -- Financial terms
    contract_cost NUMERIC(10, 2) NOT NULL,
    deductible NUMERIC(10, 2),

    -- Coverage details
    covered_services JSONB NOT NULL,  -- ["engine", "transmission", "electrical", etc.]
    exclusions TEXT,
    claim_process TEXT,
    claims_phone VARCHAR(50),

    -- Contract management
    contract_document_url VARCHAR(1000),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN (
        'active', 'expired', 'cancelled'
    )),

    -- Claims tracking
    claims_filed INTEGER DEFAULT 0,
    claims_paid NUMERIC(12, 2) DEFAULT 0,

    -- Additional metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    CONSTRAINT unique_service_contract_number_per_tenant UNIQUE (tenant_id, contract_number),
    CONSTRAINT chk_service_contracts_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_service_contracts_amounts_positive CHECK (
        (contract_cost IS NULL OR contract_cost >= 0) AND
        (deductible IS NULL OR deductible >= 0) AND
        (claims_paid IS NULL OR claims_paid >= 0)
    )
);

-- Indexes for service_contracts
CREATE INDEX idx_service_contracts_tenant ON service_contracts(tenant_id);
CREATE INDEX idx_service_contracts_vehicle ON service_contracts(vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX idx_service_contracts_vendor ON service_contracts(vendor_id);
CREATE INDEX idx_service_contracts_type ON service_contracts(contract_type, status);
CREATE INDEX idx_service_contracts_status ON service_contracts(status);
CREATE INDEX idx_service_contracts_end_date ON service_contracts(end_date) WHERE status = 'active';

-- Trigger: Update timestamp
CREATE TRIGGER update_service_contracts_timestamp
    BEFORE UPDATE ON service_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE service_contracts IS 'Extended warranties, maintenance plans, and roadside assistance contracts';
COMMENT ON COLUMN service_contracts.coverage_mileage IS 'Maximum mileage covered by this contract';
COMMENT ON COLUMN service_contracts.covered_services IS 'JSON array of covered service types';

-- ============================================================================
-- ALTER vehicles table to add ownership and contract tracking
-- ============================================================================

DO $$
BEGIN
    -- Add ownership_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'ownership_type'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN ownership_type VARCHAR(50) DEFAULT 'owned'
            CHECK (ownership_type IN ('owned', 'leased', 'rented'));
        COMMENT ON COLUMN vehicles.ownership_type IS 'Vehicle ownership type: owned, leased, or rented';
    END IF;

    -- Add contract_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'contract_id'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN contract_id UUID REFERENCES vehicle_contracts(id) ON DELETE SET NULL;
        CREATE INDEX idx_vehicles_contract ON vehicles(contract_id) WHERE contract_id IS NOT NULL;
        COMMENT ON COLUMN vehicles.contract_id IS 'Current active contract for this vehicle';
    END IF;

    -- Add lease_end_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'lease_end_date'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN lease_end_date DATE;
        CREATE INDEX idx_vehicles_lease_end_date ON vehicles(lease_end_date)
            WHERE lease_end_date IS NOT NULL AND ownership_type = 'leased';
        COMMENT ON COLUMN vehicles.lease_end_date IS 'Lease end date for leased vehicles';
    END IF;

    -- Add lease_mileage_allowance column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'vehicles' AND column_name = 'lease_mileage_allowance'
    ) THEN
        ALTER TABLE vehicles ADD COLUMN lease_mileage_allowance INTEGER;
        COMMENT ON COLUMN vehicles.lease_mileage_allowance IS 'Total mileage allowance for the lease term';
    END IF;
END $$;

-- ============================================================================
-- Functions for lease management calculations
-- ============================================================================

-- Function to calculate mileage overage for a vehicle
CREATE OR REPLACE FUNCTION calculate_mileage_overage(
    p_vehicle_id UUID,
    p_current_odometer INTEGER DEFAULT NULL
) RETURNS TABLE (
    mileage_allowance INTEGER,
    current_mileage INTEGER,
    mileage_used INTEGER,
    mileage_remaining INTEGER,
    mileage_overage INTEGER,
    percentage_used NUMERIC(5, 2),
    excess_mileage_fee NUMERIC(6, 4),
    estimated_overage_charge NUMERIC(10, 2)
) AS $$
DECLARE
    v_allowance INTEGER;
    v_current INTEGER;
    v_fee NUMERIC(6, 4);
BEGIN
    -- Get vehicle's current odometer and lease allowance
    SELECT
        COALESCE(v.lease_mileage_allowance, 0),
        COALESCE(p_current_odometer, v.odometer, 0),
        COALESCE(vc.excess_mileage_fee, 0)
    INTO v_allowance, v_current, v_fee
    FROM vehicles v
    LEFT JOIN vehicle_contracts vc ON v.contract_id = vc.id
    WHERE v.id = p_vehicle_id;

    RETURN QUERY SELECT
        v_allowance AS mileage_allowance,
        v_current AS current_mileage,
        v_current AS mileage_used,
        GREATEST(0, v_allowance - v_current) AS mileage_remaining,
        GREATEST(0, v_current - v_allowance) AS mileage_overage,
        CASE
            WHEN v_allowance > 0 THEN ROUND((v_current::NUMERIC / v_allowance::NUMERIC) * 100, 2)
            ELSE 0
        END AS percentage_used,
        v_fee AS excess_mileage_fee,
        ROUND(GREATEST(0, v_current - v_allowance) * v_fee, 2) AS estimated_overage_charge;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_mileage_overage IS 'Calculate mileage overage and estimated charges for a leased vehicle';

-- Function to get contracts expiring within a specified number of days
CREATE OR REPLACE FUNCTION get_expiring_contracts(
    p_tenant_id UUID,
    p_days_ahead INTEGER DEFAULT 60
) RETURNS TABLE (
    contract_id UUID,
    contract_number VARCHAR,
    contract_type VARCHAR,
    vehicle_id UUID,
    vehicle_number VARCHAR,
    vendor_name VARCHAR,
    end_date DATE,
    days_until_expiry INTEGER,
    status VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        vc.id,
        vc.contract_number,
        vc.contract_type,
        vc.vehicle_id,
        v.vehicle_number,
        vn.name,
        vc.end_date,
        (vc.end_date - CURRENT_DATE)::INTEGER,
        vc.status
    FROM vehicle_contracts vc
    LEFT JOIN vehicles v ON vc.vehicle_id = v.id
    LEFT JOIN vendors vn ON vc.vendor_id = vn.id
    WHERE vc.tenant_id = p_tenant_id
        AND vc.status = 'active'
        AND vc.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + p_days_ahead)
    ORDER BY vc.end_date ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_expiring_contracts IS 'Get all contracts expiring within specified days';

-- ============================================================================
-- Sample data for development/testing (optional - comment out for production)
-- ============================================================================

-- Note: This section can be used to seed sample contract data for development
-- Uncomment and modify as needed for testing

/*
INSERT INTO vehicle_contracts (
    tenant_id, contract_number, contract_type, vehicle_id, vendor_id,
    start_date, end_date, term_months, monthly_payment, mileage_allowance_annual,
    excess_mileage_fee, status
) VALUES (
    (SELECT id FROM tenants LIMIT 1),
    'LEASE-2024-001',
    'lease',
    (SELECT id FROM vehicles LIMIT 1),
    (SELECT id FROM vendors LIMIT 1),
    '2024-01-01',
    '2027-01-01',
    36,
    450.00,
    15000,
    0.25,
    'active'
);
*/

-- ============================================================================
-- Migration complete
-- ============================================================================
