-- Migration: 002_tire_management.sql
-- Description: Complete tire lifecycle tracking with rotation scheduling
-- Author: Fleet CTA Database Enhancement Project
-- Date: 2026-02-02

-- ============================================================================
-- TABLE 1: tire_inventory
-- Complete tire inventory with purchase history and warranty tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS tire_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tire_number VARCHAR(50) UNIQUE NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    size VARCHAR(50) NOT NULL, -- e.g., "295/75R22.5"
    load_range VARCHAR(10), -- e.g., "G", "H"
    tire_type VARCHAR(50) NOT NULL, -- steer, drive, trailer, all-position
    tread_depth_32nds INTEGER NOT NULL DEFAULT 20, -- new tire typically 20/32"
    dot_number VARCHAR(20), -- DOT serial number
    manufacture_date DATE,
    purchase_date DATE,
    purchase_price NUMERIC(10,2),
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    warranty_miles INTEGER,
    expected_life_miles INTEGER,
    status VARCHAR(50) NOT NULL DEFAULT 'in-stock', -- in-stock, mounted, retreaded, scrapped
    facility_id UUID REFERENCES facilities(id) ON DELETE SET NULL,
    location_in_warehouse VARCHAR(100),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_tire_inventory_tread_depth_positive CHECK (tread_depth_32nds >= 0),
    CONSTRAINT chk_tire_inventory_purchase_price_positive CHECK (purchase_price IS NULL OR purchase_price >= 0)
);

-- ============================================================================
-- TABLE 2: vehicle_tire_positions
-- Tracks tire mounting history with full position tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS vehicle_tire_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    tire_id UUID NOT NULL REFERENCES tire_inventory(id) ON DELETE RESTRICT,
    position VARCHAR(50) NOT NULL, -- LF, RF, LR1, LR2, RR1, RR2, spare, etc.
    mounted_date DATE NOT NULL,
    mounted_odometer INTEGER NOT NULL,
    mounted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    removed_date DATE,
    removed_odometer INTEGER,
    removed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    removal_reason VARCHAR(100), -- rotation, blowout, wear, damage, seasonal-swap
    is_current BOOLEAN NOT NULL DEFAULT true,
    miles_on_tire INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN removed_odometer IS NOT NULL AND removed_odometer >= mounted_odometer
            THEN removed_odometer - mounted_odometer
            ELSE NULL
        END
    ) STORED,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_vehicle_tire_positions_odometer_logical CHECK (
        removed_odometer IS NULL OR removed_odometer >= mounted_odometer
    )
);

-- ============================================================================
-- TABLE 3: tire_inspections
-- Records tire inspections with tread depth and pressure readings
-- ============================================================================
CREATE TABLE IF NOT EXISTS tire_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    inspection_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    inspector_id UUID REFERENCES users(id) ON DELETE SET NULL,
    odometer_reading INTEGER NOT NULL,
    tire_positions JSONB NOT NULL, -- [{position: "LF", tire_id: "...", tread_depth: 12, psi: 105, condition: "good"}]
    defects_found BOOLEAN NOT NULL DEFAULT false,
    defects JSONB, -- [{position: "RR1", issue: "low tread", severity: "high"}]
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 4: tire_rotation_schedules
-- Automated rotation scheduling by vehicle or vehicle type
-- ============================================================================
CREATE TABLE IF NOT EXISTS tire_rotation_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    vehicle_type VARCHAR(100), -- for defaults by vehicle type
    interval_miles INTEGER NOT NULL,
    rotation_pattern VARCHAR(100) NOT NULL, -- front-to-rear, cross, rearward-cross, five-tire
    last_rotation_date DATE,
    last_rotation_odometer INTEGER,
    next_rotation_odometer INTEGER,
    alert_threshold_percentage INTEGER DEFAULT 80, -- alert at 80% of interval
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT chk_tire_rotation_schedules_interval_positive CHECK (interval_miles > 0),
    CONSTRAINT chk_tire_rotation_schedules_threshold_valid CHECK (
        alert_threshold_percentage IS NULL OR
        (alert_threshold_percentage >= 0 AND alert_threshold_percentage <= 100)
    ),

    -- Either vehicle_id or vehicle_type must be set, not both
    CONSTRAINT chk_tire_rotation_schedules_vehicle_or_type CHECK (
        (vehicle_id IS NOT NULL AND vehicle_type IS NULL) OR
        (vehicle_id IS NULL AND vehicle_type IS NOT NULL)
    )
);

-- ============================================================================
-- TABLE 5: tire_pressure_logs
-- TPMS and manual pressure readings with alerting
-- ============================================================================
CREATE TABLE IF NOT EXISTS tire_pressure_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    log_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tire_positions JSONB NOT NULL, -- [{position: "LF", psi: 105, temp_f: 80, tire_id: "..."}]
    checked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'manual', -- manual, tpms, inspection
    alerts_triggered JSONB, -- [{position: "LF", alert_type: "low_pressure", threshold: 95, actual: 85}]
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES for performance optimization
-- ============================================================================

-- tire_inventory indexes
CREATE INDEX IF NOT EXISTS idx_tire_inventory_status
    ON tire_inventory(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_tire_inventory_facility
    ON tire_inventory(facility_id) WHERE facility_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tire_inventory_vendor
    ON tire_inventory(vendor_id) WHERE vendor_id IS NOT NULL;

-- vehicle_tire_positions indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_tire_positions_vehicle_current
    ON vehicle_tire_positions(vehicle_id, is_current);
CREATE INDEX IF NOT EXISTS idx_vehicle_tire_positions_tire_id
    ON vehicle_tire_positions(tire_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_tire_positions_mounted_date
    ON vehicle_tire_positions(mounted_date DESC);

-- Partial unique index to ensure only one current tire per position per vehicle
CREATE UNIQUE INDEX IF NOT EXISTS uq_vehicle_tire_positions_current
    ON vehicle_tire_positions(vehicle_id, position)
    WHERE is_current = true;

-- tire_inspections indexes
CREATE INDEX IF NOT EXISTS idx_tire_inspections_vehicle_date
    ON tire_inspections(vehicle_id, inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_tire_inspections_defects
    ON tire_inspections(tenant_id, defects_found) WHERE defects_found = true;
CREATE INDEX IF NOT EXISTS idx_tire_inspections_work_order
    ON tire_inspections(work_order_id) WHERE work_order_id IS NOT NULL;

-- tire_rotation_schedules indexes
CREATE INDEX IF NOT EXISTS idx_tire_rotation_schedules_vehicle_active
    ON tire_rotation_schedules(vehicle_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tire_rotation_schedules_vehicle_type
    ON tire_rotation_schedules(tenant_id, vehicle_type, is_active)
    WHERE vehicle_type IS NOT NULL AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_tire_rotation_schedules_next_rotation
    ON tire_rotation_schedules(tenant_id, next_rotation_odometer)
    WHERE is_active = true AND next_rotation_odometer IS NOT NULL;

-- tire_pressure_logs indexes
CREATE INDEX IF NOT EXISTS idx_tire_pressure_logs_vehicle_date
    ON tire_pressure_logs(vehicle_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_tire_pressure_logs_alerts
    ON tire_pressure_logs(tenant_id, log_date DESC)
    WHERE alerts_triggered IS NOT NULL;

-- ============================================================================
-- TRIGGERS for automatic timestamp updates
-- ============================================================================

-- Update updated_at timestamp on tire_inventory
CREATE OR REPLACE FUNCTION update_tire_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tire_inventory_updated_at ON tire_inventory;
CREATE TRIGGER tire_inventory_updated_at
    BEFORE UPDATE ON tire_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_tire_inventory_timestamp();

-- Update updated_at timestamp on vehicle_tire_positions
CREATE OR REPLACE FUNCTION update_vehicle_tire_positions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vehicle_tire_positions_updated_at ON vehicle_tire_positions;
CREATE TRIGGER vehicle_tire_positions_updated_at
    BEFORE UPDATE ON vehicle_tire_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_tire_positions_timestamp();

-- Update updated_at timestamp on tire_rotation_schedules
CREATE OR REPLACE FUNCTION update_tire_rotation_schedules_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tire_rotation_schedules_updated_at ON tire_rotation_schedules;
CREATE TRIGGER tire_rotation_schedules_updated_at
    BEFORE UPDATE ON tire_rotation_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_tire_rotation_schedules_timestamp();

-- ============================================================================
-- COMMENTS for documentation
-- ============================================================================

COMMENT ON TABLE tire_inventory IS 'Complete tire inventory with purchase history, warranty tracking, and lifecycle management';
COMMENT ON TABLE vehicle_tire_positions IS 'Tracks tire mounting history with full position tracking and rotation history';
COMMENT ON TABLE tire_inspections IS 'Records tire inspections with tread depth and pressure readings';
COMMENT ON TABLE tire_rotation_schedules IS 'Automated rotation scheduling by vehicle or vehicle type';
COMMENT ON TABLE tire_pressure_logs IS 'TPMS and manual pressure readings with alerting capabilities';

COMMENT ON COLUMN tire_inventory.tread_depth_32nds IS 'Tread depth measured in 32nds of an inch (new tire typically 20/32")';
COMMENT ON COLUMN tire_inventory.dot_number IS 'DOT serial number for tire identification and recall tracking';
COMMENT ON COLUMN tire_inventory.status IS 'Current status: in-stock, mounted, retreaded, scrapped';
COMMENT ON COLUMN vehicle_tire_positions.position IS 'Tire position: LF, RF, LR1, LR2, RR1, RR2, spare, etc.';
COMMENT ON COLUMN vehicle_tire_positions.miles_on_tire IS 'Calculated miles driven on this tire during this mounting';
COMMENT ON COLUMN tire_rotation_schedules.rotation_pattern IS 'Rotation pattern: front-to-rear, cross, rearward-cross, five-tire';
COMMENT ON COLUMN tire_rotation_schedules.alert_threshold_percentage IS 'Alert when reaching this percentage of rotation interval (default 80%)';
COMMENT ON COLUMN tire_pressure_logs.source IS 'Source of reading: manual, tpms, inspection';

-- ============================================================================
-- INITIAL DATA: Default rotation schedules by vehicle type
-- ============================================================================

-- Insert default rotation schedules for common vehicle types
INSERT INTO tire_rotation_schedules (tenant_id, vehicle_type, interval_miles, rotation_pattern, is_active, metadata)
SELECT
    id as tenant_id,
    vehicle_type,
    interval_miles,
    rotation_pattern,
    true as is_active,
    jsonb_build_object(
        'description', description,
        'recommended_by', 'manufacturer',
        'auto_generated', true
    ) as metadata
FROM tenants
CROSS JOIN (
    VALUES
        ('sedan', 6000, 'cross', 'Standard cross rotation for passenger sedans'),
        ('suv', 6000, 'cross', 'Standard cross rotation for SUVs'),
        ('truck', 8000, 'front-to-rear', 'Front-to-rear rotation for pickup trucks'),
        ('van', 7000, 'front-to-rear', 'Front-to-rear rotation for vans'),
        ('commercial-truck', 12000, 'front-to-rear', 'Front-to-rear rotation for commercial trucks'),
        ('trailer', 15000, 'side-to-side', 'Side-to-side rotation for trailers')
) AS defaults(vehicle_type, interval_miles, rotation_pattern, description)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
