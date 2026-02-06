-- ============================================================================
-- Migration: Comprehensive Vehicles Table Enhancement
-- Created: 2026-02-06
-- Purpose: Add 60+ enterprise fields for DOT, IoT, predictive maintenance
-- ============================================================================

-- Physical Specifications
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS engine_size VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS engine_cylinders SMALLINT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS horsepower INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transmission_type VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transmission_gears SMALLINT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS drivetrain VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS exterior_color VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS interior_color VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS body_style VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS doors SMALLINT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS seating_capacity SMALLINT;

-- DOT Compliance (CRITICAL)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS gvwr INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS gcwr INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS curb_weight INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS payload_capacity INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS towing_capacity INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dot_number VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS mc_number VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dot_inspection_due_date TIMESTAMP;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_dot_inspection_date TIMESTAMP;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dot_inspection_sticker_number VARCHAR(50);

-- Title & Registration
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS title_status VARCHAR(50) DEFAULT 'clean';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS title_state VARCHAR(2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_number VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_state VARCHAR(2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_expiry_date TIMESTAMP;

-- Depreciation (Financial)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS salvage_value NUMERIC(12,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS useful_life_years INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS useful_life_miles INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS depreciation_method VARCHAR(50) DEFAULT 'straight_line';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS accumulated_depreciation NUMERIC(12,2) DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS book_value NUMERIC(12,2);

-- EV Battery
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS battery_capacity_kwh NUMERIC(8,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS battery_health_percent NUMERIC(5,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS charge_port_type VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS estimated_range_miles INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS charging_speed_kw NUMERIC(8,2);

-- IoT & Telematics
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS telematics_device_id VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS telematics_provider VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_telematics_sync TIMESTAMP;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS iot_firmware_version VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS iot_last_heartbeat TIMESTAMP;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dash_cam_installed BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS adas_enabled BOOLEAN DEFAULT FALSE;

-- Maintenance Tracking
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS oil_change_interval_miles INTEGER DEFAULT 5000;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tire_rotation_interval_miles INTEGER DEFAULT 7500;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_oil_change_date TIMESTAMP;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_oil_change_mileage INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_tire_rotation_date TIMESTAMP;

-- Acquisition
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS acquisition_type VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS lease_end_date TIMESTAMP;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS lease_monthly_payment NUMERIC(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS lessor_name VARCHAR(255);

-- Predictive Maintenance
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS health_score NUMERIC(5,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS predicted_failure_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS predicted_failure_component VARCHAR(100);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_gvwr ON vehicles(gvwr) WHERE gvwr IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_dot_inspection ON vehicles(dot_inspection_due_date) WHERE dot_inspection_due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicles_telematics_provider ON vehicles(telematics_provider);
CREATE INDEX IF NOT EXISTS idx_vehicles_health_score ON vehicles(health_score) WHERE health_score < 70;

-- Constraints
ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_gvwr_positive CHECK (gvwr IS NULL OR gvwr > 0);
ALTER TABLE vehicles ADD CONSTRAINT chk_vehicles_health_score_range CHECK (health_score IS NULL OR (health_score >= 0 AND health_score <= 100));
