-- Migration: Add vehicle damage tracking system
-- Version: 1.9.0
-- Date: 2025-11-11
-- Description: Creates tables and indexes for 3D damage mapping and visualization

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: vehicle_damage
-- Purpose: Store 3D-mapped vehicle damage information
-- =====================================================

CREATE TABLE IF NOT EXISTS vehicle_damage (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign Key to vehicles table
    vehicle_id UUID NOT NULL,

    -- 3D Position (world coordinates on vehicle model)
    -- Values typically range from -5 to +5 for standard vehicle models
    position_x DECIMAL(10, 6) NOT NULL,
    position_y DECIMAL(10, 6) NOT NULL,
    position_z DECIMAL(10, 6) NOT NULL,

    -- Surface normal vector (for correct marker orientation)
    -- Unit vector pointing outward from surface
    normal_x DECIMAL(10, 6) DEFAULT 0.0,
    normal_y DECIMAL(10, 6) DEFAULT 1.0,
    normal_z DECIMAL(10, 6) DEFAULT 0.0,

    -- Damage Classification
    severity VARCHAR(20) NOT NULL CHECK (
        severity IN ('minor', 'moderate', 'severe', 'critical')
    ),
    damage_type VARCHAR(50) CHECK (
        damage_type IN (
            'scratch', 'dent', 'crack', 'broken', 'rust',
            'paint_chip', 'collision', 'hail', 'vandalism', 'other'
        )
    ),

    -- Vehicle Part Identification
    part_name VARCHAR(100) CHECK (
        part_name IN (
            'front_bumper', 'rear_bumper', 'hood', 'trunk', 'roof',
            'driver_door', 'passenger_door', 'rear_left_door', 'rear_right_door',
            'driver_fender', 'passenger_fender', 'driver_quarter_panel', 'passenger_quarter_panel',
            'windshield', 'rear_window', 'driver_window', 'passenger_window',
            'headlight', 'taillight', 'mirror', 'wheel', 'tire', 'undercarriage', 'other'
        )
    ),

    -- Damage Description and Documentation
    description TEXT,
    repair_notes TEXT,

    -- Photo Documentation
    -- Array of URLs pointing to Azure Blob Storage or similar
    photo_urls TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Cost Information
    cost_estimate DECIMAL(10, 2),
    actual_repair_cost DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'USD',

    -- Repair Workflow Status
    repair_status VARCHAR(20) DEFAULT 'pending' CHECK (
        repair_status IN ('pending', 'scheduled', 'in_progress', 'completed', 'deferred', 'not_repairable')
    ),
    repair_scheduled_date TIMESTAMP,
    repair_completed_date TIMESTAMP,
    repair_shop_name VARCHAR(255),
    repair_order_number VARCHAR(100),

    -- Insurance Information
    insurance_claim_number VARCHAR(100),
    insurance_approved BOOLEAN DEFAULT FALSE,
    insurance_approved_amount DECIMAL(10, 2),

    -- Audit Trail
    reported_by UUID,  -- References users(id)
    reported_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID,   -- References users(id)

    -- Soft Delete
    deleted_at TIMESTAMP,
    deleted_by UUID,   -- References users(id)

    -- Data Validation
    CONSTRAINT valid_position CHECK (
        position_x BETWEEN -10 AND 10 AND
        position_y BETWEEN -10 AND 10 AND
        position_z BETWEEN -10 AND 10
    ),
    CONSTRAINT valid_normal CHECK (
        normal_x BETWEEN -1 AND 1 AND
        normal_y BETWEEN -1 AND 1 AND
        normal_z BETWEEN -1 AND 1
    ),
    CONSTRAINT valid_cost CHECK (
        cost_estimate IS NULL OR cost_estimate >= 0
    ),
    CONSTRAINT valid_repair_dates CHECK (
        repair_completed_date IS NULL OR
        repair_scheduled_date IS NULL OR
        repair_completed_date >= repair_scheduled_date
    )
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Primary lookup: Get all damage for a vehicle
CREATE INDEX IF NOT EXISTS idx_vehicle_damage_vehicle_id
    ON vehicle_damage(vehicle_id)
    WHERE deleted_at IS NULL;

-- Filter by severity (for high-priority damage reports)
CREATE INDEX IF NOT EXISTS idx_vehicle_damage_severity
    ON vehicle_damage(severity)
    WHERE deleted_at IS NULL;

-- Sort by report date (for timeline views)
CREATE INDEX IF NOT EXISTS idx_vehicle_damage_reported_at
    ON vehicle_damage(reported_at DESC)
    WHERE deleted_at IS NULL;

-- Filter by repair status (for workflow management)
CREATE INDEX IF NOT EXISTS idx_vehicle_damage_repair_status
    ON vehicle_damage(repair_status)
    WHERE deleted_at IS NULL;

-- Composite index for vehicle + status queries
CREATE INDEX IF NOT EXISTS idx_vehicle_damage_vehicle_status
    ON vehicle_damage(vehicle_id, repair_status)
    WHERE deleted_at IS NULL;

-- Filter by part name (for damage pattern analysis)
CREATE INDEX IF NOT EXISTS idx_vehicle_damage_part_name
    ON vehicle_damage(part_name)
    WHERE deleted_at IS NULL;

-- Full-text search on descriptions
CREATE INDEX IF NOT EXISTS idx_vehicle_damage_description_fts
    ON vehicle_damage USING gin(to_tsvector('english', description))
    WHERE deleted_at IS NULL AND description IS NOT NULL;

-- =====================================================
-- Triggers for Automatic Timestamp Updates
-- =====================================================

CREATE OR REPLACE FUNCTION update_vehicle_damage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vehicle_damage_updated_at ON vehicle_damage;
CREATE TRIGGER trigger_vehicle_damage_updated_at
    BEFORE UPDATE ON vehicle_damage
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_damage_updated_at();

-- =====================================================
-- View: Active Damage Summary
-- Purpose: Quick overview of active damage per vehicle
-- =====================================================

CREATE OR REPLACE VIEW v_vehicle_damage_summary AS
SELECT
    vehicle_id,
    COUNT(*) as total_damages,
    COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
    COUNT(*) FILTER (WHERE severity = 'severe') as severe_count,
    COUNT(*) FILTER (WHERE severity = 'moderate') as moderate_count,
    COUNT(*) FILTER (WHERE severity = 'minor') as minor_count,
    SUM(cost_estimate) as total_estimated_cost,
    SUM(actual_repair_cost) as total_actual_cost,
    COUNT(*) FILTER (WHERE repair_status = 'pending') as pending_repairs,
    COUNT(*) FILTER (WHERE repair_status = 'completed') as completed_repairs,
    MAX(reported_at) as most_recent_damage_date
FROM vehicle_damage
WHERE deleted_at IS NULL
GROUP BY vehicle_id;

COMMENT ON VIEW v_vehicle_damage_summary IS 'Aggregated damage statistics per vehicle for quick dashboards';

-- =====================================================
-- View: Damage Heat Map Data
-- Purpose: Identify common damage areas across fleet
-- =====================================================

CREATE OR REPLACE VIEW v_damage_heat_map AS
SELECT
    part_name,
    severity,
    COUNT(*) as damage_count,
    AVG(cost_estimate) as avg_cost,
    COUNT(DISTINCT vehicle_id) as affected_vehicles
FROM vehicle_damage
WHERE deleted_at IS NULL
    AND part_name IS NOT NULL
GROUP BY part_name, severity
ORDER BY damage_count DESC;

COMMENT ON VIEW v_damage_heat_map IS 'Fleet-wide damage patterns by part and severity';

-- =====================================================
-- Sample Data (for testing)
-- =====================================================

-- Uncomment to insert sample data

/*
-- Sample vehicle (assuming vehicles table exists)
INSERT INTO vehicles (id, make, model, year, vin)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Ford', 'F-150', 2024, 'TEST1234567890123'
) ON CONFLICT DO NOTHING;

-- Sample damage records
INSERT INTO vehicle_damage (
    vehicle_id,
    position_x, position_y, position_z,
    normal_x, normal_y, normal_z,
    severity,
    damage_type,
    part_name,
    description,
    cost_estimate
) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    2.5, 0.8, 1.2,
    0.0, 0.0, 1.0,
    'moderate',
    'dent',
    'front_bumper',
    'Moderate dent on front bumper from parking lot incident. Approximately 3 inches diameter.',
    450.00
),
(
    '00000000-0000-0000-0000-000000000001',
    -1.8, 1.0, -0.5,
    -1.0, 0.0, 0.0,
    'minor',
    'scratch',
    'driver_door',
    'Minor surface scratch on driver door. Paint not penetrated.',
    150.00
),
(
    '00000000-0000-0000-0000-000000000001',
    0.0, 1.5, 2.8,
    0.0, 1.0, 0.0,
    'critical',
    'crack',
    'windshield',
    'Large crack across windshield. Requires immediate replacement for safety.',
    800.00
);
*/

-- =====================================================
-- Grants (adjust based on your user roles)
-- =====================================================

-- Grant SELECT to read-only reporting users
-- GRANT SELECT ON vehicle_damage TO fleet_viewer;
-- GRANT SELECT ON v_vehicle_damage_summary TO fleet_viewer;
-- GRANT SELECT ON v_damage_heat_map TO fleet_viewer;

-- Grant full access to application users
-- GRANT ALL ON vehicle_damage TO fleet_app;

-- =====================================================
-- Rollback Script (for development)
-- =====================================================

/*
-- Uncomment to rollback this migration

DROP VIEW IF EXISTS v_damage_heat_map;
DROP VIEW IF EXISTS v_vehicle_damage_summary;
DROP TRIGGER IF EXISTS trigger_vehicle_damage_updated_at ON vehicle_damage;
DROP FUNCTION IF EXISTS update_vehicle_damage_updated_at();
DROP INDEX IF EXISTS idx_vehicle_damage_description_fts;
DROP INDEX IF EXISTS idx_vehicle_damage_part_name;
DROP INDEX IF EXISTS idx_vehicle_damage_vehicle_status;
DROP INDEX IF EXISTS idx_vehicle_damage_repair_status;
DROP INDEX IF EXISTS idx_vehicle_damage_reported_at;
DROP INDEX IF EXISTS idx_vehicle_damage_severity;
DROP INDEX IF EXISTS idx_vehicle_damage_vehicle_id;
DROP TABLE IF EXISTS vehicle_damage;
*/

-- =====================================================
-- Migration Complete
-- =====================================================

-- Output confirmation
DO $$
BEGIN
    RAISE NOTICE 'Vehicle damage tracking system migration completed successfully';
    RAISE NOTICE 'Table created: vehicle_damage';
    RAISE NOTICE 'Views created: v_vehicle_damage_summary, v_damage_heat_map';
    RAISE NOTICE 'Indexes created: 7 indexes for optimized queries';
    RAISE NOTICE 'Ready for 3D damage mapping and visualization';
END $$;
