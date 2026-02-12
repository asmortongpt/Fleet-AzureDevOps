-- ============================================================================
-- Migration: 20260211_expand_core_tables.sql
-- Purpose: Expand core tables with all relevant fields to match frontend types
-- Tables: vehicles, drivers, work_orders, facilities, fuel_transactions,
--         charging_stations, charging_sessions, incidents, inspections
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. VEHICLES TABLE EXPANSION
-- Frontend expects: color, department, region, ownership, engine_hours,
-- gvwr, seating_capacity, asset_category, tags, health_score, image_url, etc.
-- ============================================================================

-- Physical attributes
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS exterior_color VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS interior_color VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS trim_level VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS body_style VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS doors INTEGER;

-- Engine & drivetrain
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS engine_type VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS engine_displacement VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transmission VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS drivetrain VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS cylinders INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS horsepower INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS torque INTEGER;

-- Capacity & weight
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS gvwr NUMERIC(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS curb_weight NUMERIC(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS payload_capacity NUMERIC(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS towing_capacity NUMERIC(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS seating_capacity INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS cargo_volume_cubic_ft NUMERIC(8,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_capacity NUMERIC(8,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tank_capacity NUMERIC(8,2);

-- EV / Hybrid specific
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS battery_capacity_kwh NUMERIC(8,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS battery_level NUMERIC(5,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS charging_status VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS range_miles NUMERIC(8,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS efficiency_kwh_per_mile NUMERIC(6,3);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS carbon_saved_kg NUMERIC(10,2) DEFAULT 0;

-- Multi-metric tracking (equipment, heavy vehicles)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS engine_hours NUMERIC(12,2) DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS pto_hours NUMERIC(12,2) DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS aux_hours NUMERIC(12,2) DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS cycle_count INTEGER DEFAULT 0;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS primary_metric VARCHAR(20) DEFAULT 'ODOMETER';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_metric_update TIMESTAMPTZ;

-- Asset classification
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS asset_category VARCHAR(30);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS asset_type VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS power_type VARCHAR(20);

-- Equipment specifications (heavy equipment, tractors)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS capacity_tons NUMERIC(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS max_reach_feet NUMERIC(8,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS lift_height_feet NUMERIC(8,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS bucket_capacity_yards NUMERIC(8,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS operating_weight_lbs NUMERIC(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS axle_count INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS max_payload_kg NUMERIC(10,2);

-- Equipment capabilities
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_pto BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS has_aux_power BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_road_legal BOOLEAN DEFAULT TRUE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS requires_cdl BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS requires_special_license BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS max_speed_kph NUMERIC(6,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_off_road_only BOOLEAN DEFAULT FALSE;

-- Organizational
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS cost_center VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS ownership VARCHAR(20) DEFAULT 'owned';
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fleet_id VARCHAR(50);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS group_id UUID;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS parent_asset_id UUID;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Registration & compliance
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_state VARCHAR(2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS registration_expiry DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS emissions_class VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS dot_number VARCHAR(20);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS ifta_account VARCHAR(20);

-- Health & performance
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS health_score NUMERIC(5,2) DEFAULT 100;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_efficiency NUMERIC(6,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS speed NUMERIC(6,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_moving BOOLEAN DEFAULT FALSE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS uptime NUMERIC(5,2) DEFAULT 100;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS operational_status VARCHAR(20) DEFAULT 'AVAILABLE';

-- Media
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS primary_image VARCHAR(500);

-- Lifecycle
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS expected_life_miles INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS expected_life_years INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS disposal_date TIMESTAMPTZ;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS disposal_value NUMERIC(12,2);

-- Add indexes for new searchable columns
CREATE INDEX IF NOT EXISTS idx_vehicles_department ON vehicles(department);
CREATE INDEX IF NOT EXISTS idx_vehicles_region ON vehicles(region);
CREATE INDEX IF NOT EXISTS idx_vehicles_ownership ON vehicles(ownership);
CREATE INDEX IF NOT EXISTS idx_vehicles_asset_category ON vehicles(asset_category);
CREATE INDEX IF NOT EXISTS idx_vehicles_color ON vehicles(color);
CREATE INDEX IF NOT EXISTS idx_vehicles_health_score ON vehicles(health_score);
CREATE INDEX IF NOT EXISTS idx_vehicles_tags ON vehicles USING GIN(tags);


-- ============================================================================
-- 2. DRIVERS TABLE EXPANSION
-- Frontend expects: avatar_url, address, department, medical_card_expiry,
-- endorsements, restrictions, drug_test_date, background_check_date, etc.
-- ============================================================================

-- Personal details
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS suffix VARCHAR(10);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS preferred_name VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS profile_photo_url VARCHAR(500);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS ssn_last4 VARCHAR(4);

-- Address
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address_line1 VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS address_line2 VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS state VARCHAR(2);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS country VARCHAR(2) DEFAULT 'US';

-- Employment
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS position_title VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS supervisor_id UUID;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cost_center VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS pay_rate NUMERIC(10,2);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS pay_type VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS employment_type VARCHAR(20) DEFAULT 'full-time';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS facility_id UUID;

-- License & compliance
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS license_class VARCHAR(10);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS endorsements TEXT[];
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS restrictions TEXT[];
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS medical_card_number VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS medical_card_expiry DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS medical_card_status VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS twic_card_number VARCHAR(50);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS twic_card_expiry DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hazmat_endorsement BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS tanker_endorsement BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS doubles_triples BOOLEAN DEFAULT FALSE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS passenger_endorsement BOOLEAN DEFAULT FALSE;

-- Safety & testing
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS drug_test_date DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS drug_test_result VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS alcohol_test_date DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS alcohol_test_result VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS background_check_date DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS background_check_status VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS mvr_check_date DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS mvr_check_status VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS safety_score NUMERIC(5,2) DEFAULT 100;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS total_incidents INTEGER DEFAULT 0;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS total_violations INTEGER DEFAULT 0;

-- Assignment
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS assigned_vehicle_id UUID;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS home_terminal VARCHAR(255);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS dispatch_zone VARCHAR(100);

-- Hours of Service
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hos_status VARCHAR(20);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hours_available NUMERIC(4,2);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS cycle_hours_used NUMERIC(6,2);
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS last_rest_start TIMESTAMPTZ;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_drivers_department ON drivers(department);
CREATE INDEX IF NOT EXISTS idx_drivers_region ON drivers(region);
CREATE INDEX IF NOT EXISTS idx_drivers_safety_score ON drivers(safety_score);
CREATE INDEX IF NOT EXISTS idx_drivers_medical_card_expiry ON drivers(medical_card_expiry);
CREATE INDEX IF NOT EXISTS idx_drivers_assigned_vehicle ON drivers(assigned_vehicle_id);


-- ============================================================================
-- 3. WORK_ORDERS TABLE EXPANSION
-- Frontend expects: facility_id, category, root_cause, resolution_notes,
-- vendor_id, external_reference, downtime_hours, parts_cost, labor_cost
-- ============================================================================

ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS facility_id UUID;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS root_cause TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS vendor_id UUID;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS external_reference VARCHAR(100);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS downtime_hours NUMERIC(8,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS parts_cost NUMERIC(12,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS labor_cost NUMERIC(12,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(12,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS total_cost NUMERIC(12,2);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS driver_id UUID;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS bay_number VARCHAR(20);
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT FALSE;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS customer_complaint TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS technician_notes TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quality_check_passed BOOLEAN;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quality_check_by UUID;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS quality_check_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_work_orders_facility ON work_orders(facility_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_vendor ON work_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_driver ON work_orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_due_date ON work_orders(due_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_category ON work_orders(category);


-- ============================================================================
-- 4. FACILITIES TABLE EXPANSION
-- Frontend expects: description, timezone, phone, bay_count, fuel_storage,
-- parking_capacity, security_level, weather_zone, manager_name, services
-- ============================================================================

ALTER TABLE facilities ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'America/New_York';
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS fax VARCHAR(20);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS website VARCHAR(500);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS manager_name VARCHAR(255);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS manager_email VARCHAR(255);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS manager_phone VARCHAR(20);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS bay_count INTEGER DEFAULT 0;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS parking_capacity INTEGER;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS fuel_storage_capacity NUMERIC(10,2);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS security_level VARCHAR(20) DEFAULT 'standard';
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS weather_zone VARCHAR(50);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS region VARCHAR(100);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS services_offered TEXT[];
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS square_footage NUMERIC(10,2);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS year_built INTEGER;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS lease_expiry DATE;
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS monthly_rent NUMERIC(12,2);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS property_tax NUMERIC(12,2);
ALTER TABLE facilities ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_facilities_region ON facilities(region);


-- ============================================================================
-- 5. FUEL_TRANSACTIONS TABLE EXPANSION
-- Frontend expects: mpg_calculated, tank_level_before/after, is_full_fill,
-- state_tax, federal_tax, discount_amount, fleet_card_number
-- ============================================================================

ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS mpg_calculated NUMERIC(6,2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS tank_level_before NUMERIC(5,2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS tank_level_after NUMERIC(5,2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS is_full_fill BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS miles_since_last_fill NUMERIC(10,2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS state_tax NUMERIC(8,2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS federal_tax NUMERIC(8,2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(8,2);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS fleet_card_number VARCHAR(50);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS pump_number VARCHAR(10);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS station_name VARCHAR(255);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS station_brand VARCHAR(100);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS ifta_jurisdiction VARCHAR(10);
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE fuel_transactions ADD COLUMN IF NOT EXISTS flag_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_fuel_transactions_flagged ON fuel_transactions(is_flagged) WHERE is_flagged = TRUE;


-- ============================================================================
-- 6. CHARGING_STATIONS TABLE EXPANSION
-- ============================================================================

ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS model VARCHAR(100);
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS firmware_version VARCHAR(50);
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS max_power_kw NUMERIC(8,2);
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS voltage NUMERIC(6,2);
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS amperage NUMERIC(6,2);
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS connector_types TEXT[];
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS total_energy_delivered_kwh NUMERIC(12,2) DEFAULT 0;
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 0;
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS last_maintenance_date TIMESTAMPTZ;
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS next_maintenance_date TIMESTAMPTZ;
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS installation_date DATE;
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS warranty_expiry DATE;
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS cost_per_kwh NUMERIC(6,4);
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS network_provider VARCHAR(100);
ALTER TABLE charging_stations ADD COLUMN IF NOT EXISTS ocpp_id VARCHAR(100);


-- ============================================================================
-- 7. CHARGING_SESSIONS TABLE EXPANSION
-- ============================================================================

ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS connector_type VARCHAR(20);
ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS max_power_kw NUMERIC(8,2);
ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS avg_power_kw NUMERIC(8,2);
ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS soc_start NUMERIC(5,2);
ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS soc_end NUMERIC(5,2);
ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS range_added_miles NUMERIC(8,2);
ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS carbon_offset_kg NUMERIC(8,2);
ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT FALSE;
ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS interruption_count INTEGER DEFAULT 0;
ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS error_code VARCHAR(20);
ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS billing_amount NUMERIC(10,2);
ALTER TABLE charging_sessions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);


-- ============================================================================
-- 8. INCIDENTS TABLE EXPANSION
-- ============================================================================

ALTER TABLE incidents ADD COLUMN IF NOT EXISTS incident_number VARCHAR(50);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS weather_conditions VARCHAR(100);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS road_conditions VARCHAR(100);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS light_conditions VARCHAR(50);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS speed_at_time NUMERIC(6,2);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS injuries_count INTEGER DEFAULT 0;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS fatalities_count INTEGER DEFAULT 0;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS property_damage_estimate NUMERIC(12,2);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS police_report_number VARCHAR(50);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS police_report_filed BOOLEAN DEFAULT FALSE;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS insurance_claim_id UUID;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS witness_count INTEGER DEFAULT 0;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS witness_info JSONB;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS root_cause TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS corrective_actions TEXT;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS preventable BOOLEAN;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS dot_recordable BOOLEAN DEFAULT FALSE;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS osha_recordable BOOLEAN DEFAULT FALSE;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS investigation_status VARCHAR(20);
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS investigator_id UUID;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS investigation_completed_at TIMESTAMPTZ;
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_investigation_status ON incidents(investigation_status);


-- ============================================================================
-- 9. INSPECTIONS TABLE EXPANSION
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspection_number VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS template_id UUID;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS odometer_reading INTEGER;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS engine_hours_reading NUMERIC(12,2);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS location_address VARCHAR(500);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS pass_fail VARCHAR(10);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defects_found INTEGER DEFAULT 0;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS critical_defects INTEGER DEFAULT 0;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_details JSONB DEFAULT '[]';
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]';
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS signature_url VARCHAR(500);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS next_inspection_due DATE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS regulatory_body VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS compliance_score NUMERIC(5,2);

CREATE INDEX IF NOT EXISTS idx_inspections_pass_fail ON inspections(pass_fail);
CREATE INDEX IF NOT EXISTS idx_inspections_next_due ON inspections(next_inspection_due);


COMMIT;
