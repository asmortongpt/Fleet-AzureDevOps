-- ============================================================================
-- Migration: Enhance Inspections Table for DVIR & DOT Compliance
-- Created: 2026-02-06
-- Purpose: Add FMCSA Part 396 DVIR compliance fields, defect tracking, signatures
-- ============================================================================

-- ============================================================================
-- PART 1: DVIR (Driver Vehicle Inspection Report) Compliance
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS dvir_number VARCHAR(50) UNIQUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS dvir_type VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS fmcsa_compliant BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspection_level VARCHAR(20);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS annual_inspection BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS annual_inspection_sticker_number VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS next_annual_due DATE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspection_duration_minutes INTEGER;

COMMENT ON COLUMN inspections.dvir_type IS 'pre_trip, post_trip, annual, periodic, roadside';
COMMENT ON COLUMN inspections.inspection_level IS 'Level I-VI (DOT Roadside Inspection Levels)';
COMMENT ON COLUMN inspections.fmcsa_compliant IS 'Meets FMCSA Part 396.11 requirements';

-- ============================================================================
-- PART 2: Inspector Information & Certification
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspector_name VARCHAR(200);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspector_employee_id VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspector_license_number VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspector_license_state VARCHAR(2);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspector_signature_image TEXT;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspector_signature_timestamp TIMESTAMP;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspector_certification_type VARCHAR(100);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspector_cert_number VARCHAR(100);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS inspector_cert_expiry DATE;

COMMENT ON COLUMN inspections.inspector_certification_type IS 'ASE, DOT Inspector, State Inspector, etc.';

-- ============================================================================
-- PART 3: Mechanic/Repair Information (for failed inspections)
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS mechanic_id UUID;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS mechanic_name VARCHAR(200);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS mechanic_signature_image TEXT;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS mechanic_signature_timestamp TIMESTAMP;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS mechanic_cert_number VARCHAR(100);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS mechanic_cert_expiry DATE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS mechanic_license_number VARCHAR(50);

-- ============================================================================
-- PART 4: Defect Counts & Categorization
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_count INTEGER DEFAULT 0;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS critical_defects INTEGER DEFAULT 0;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS major_defects INTEGER DEFAULT 0;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS minor_defects INTEGER DEFAULT 0;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS safety_critical BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS out_of_service BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS out_of_service_until TIMESTAMP;

COMMENT ON COLUMN inspections.critical_defects IS 'Immediate safety hazard - vehicle cannot operate';
COMMENT ON COLUMN inspections.major_defects IS 'Significant issue - repair required soon';
COMMENT ON COLUMN inspections.minor_defects IS 'Non-safety cosmetic or minor issues';

-- ============================================================================
-- PART 5: FMCSA Part 396 Defect Categories (Checkboxes)
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_brake_system BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_coupling_devices BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_exhaust_system BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_fuel_system BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_lighting BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_safe_loading BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_steering BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_suspension BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_tires BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_wheels_rims BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_windshield_wipers BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_emergency_equipment BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_cargo_securement BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_frame BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_engine BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_transmission BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defect_other BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN inspections.defect_brake_system IS 'Brake system defects (FMCSA Part 396.3)';
COMMENT ON COLUMN inspections.defect_coupling_devices IS 'Fifth wheel, pintle hook, drawbar defects';
COMMENT ON COLUMN inspections.defect_safe_loading IS 'Cargo not properly secured or distributed';

-- ============================================================================
-- PART 6: Specific Defect Details
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS brake_defects_detail TEXT;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS tire_defects_detail TEXT;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS light_defects_detail TEXT;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS fluid_leaks_detail TEXT;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS body_damage_detail TEXT;

-- ============================================================================
-- PART 7: Repair Status & Verification
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS defects_repaired BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS repair_date TIMESTAMP;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS repaired_by UUID;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS repair_work_order_id UUID;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS repair_verification_method VARCHAR(100);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS repair_verification_date TIMESTAMP;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS repair_verified_by UUID;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS driver_notified_of_repairs BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS driver_acknowledgment_signature TEXT;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS driver_acknowledgment_timestamp TIMESTAMP;

COMMENT ON COLUMN inspections.repair_verification_method IS 're_inspection, supervisor_review, driver_report, mechanic_cert';

-- ============================================================================
-- PART 8: Pre-Trip Specific Fields
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS pre_trip_weather_conditions VARCHAR(100);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS pre_trip_temperature_fahrenheit INTEGER;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS pre_trip_road_conditions VARCHAR(100);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS pre_trip_cargo_secured BOOLEAN;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS pre_trip_load_distribution VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS pre_trip_cargo_weight_lbs INTEGER;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS pre_trip_hazmat_placard_check BOOLEAN;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS pre_trip_emergency_equipment_check BOOLEAN;

COMMENT ON COLUMN inspections.pre_trip_load_distribution IS 'balanced, front_heavy, rear_heavy, side_heavy';

-- ============================================================================
-- PART 9: Post-Trip Specific Fields
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS post_trip_miles_driven NUMERIC(10,2);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS post_trip_fuel_level_start NUMERIC(5,2);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS post_trip_fuel_level_end NUMERIC(5,2);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS post_trip_fuel_consumed_gallons NUMERIC(10,2);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS post_trip_unusual_noises BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS post_trip_unusual_noises_detail TEXT;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS post_trip_warning_lights BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS post_trip_warning_lights_detail TEXT;

-- ============================================================================
-- PART 10: Tire-Specific Inspection Details
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS tire_pressure_checked BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS tire_tread_depth_measured BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS tire_min_tread_depth_32nds INTEGER;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS tire_avg_tread_depth_32nds INTEGER;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS tire_worn_below_limit BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS tire_cuts_or_damage BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS tire_uneven_wear BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN inspections.tire_min_tread_depth_32nds IS 'Minimum tread depth in 32nds of an inch (DOT: 2/32" steer, 4/32" others)';

-- ============================================================================
-- PART 11: Brake-Specific Inspection Details
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS brake_adjustment_checked BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS brake_pad_thickness_mm NUMERIC(5,2);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS brake_rotor_thickness_mm NUMERIC(5,2);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS brake_fluid_level VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS brake_lines_checked BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS brake_warning_light BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS air_brake_pressure_psi INTEGER;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS air_brake_leakage_test_passed BOOLEAN;

COMMENT ON COLUMN inspections.brake_fluid_level IS 'full, low, critical, ok';
COMMENT ON COLUMN inspections.air_brake_pressure_psi IS 'Air pressure PSI (should be 90-120 PSI for commercial vehicles)';

-- ============================================================================
-- PART 12: Fluid Levels & Leaks
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS oil_level VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS coolant_level VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS transmission_fluid_level VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS windshield_washer_level VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS def_level VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS hydraulic_fluid_level VARCHAR(50);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS oil_leak BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS coolant_leak BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS transmission_leak BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS fuel_leak BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS hydraulic_leak BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN inspections.def_level IS 'Diesel Exhaust Fluid level for emissions compliance';

-- ============================================================================
-- PART 13: Lights & Electrical
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS headlights_working BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS taillights_working BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS brake_lights_working BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS turn_signals_working BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS hazard_lights_working BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS marker_lights_working BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS reverse_lights_working BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS instrument_panel_lights_working BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS battery_voltage NUMERIC(5,2);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS alternator_voltage NUMERIC(5,2);

-- ============================================================================
-- PART 14: Safety Equipment
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS fire_extinguisher_present BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS fire_extinguisher_charged BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS fire_extinguisher_inspection_date DATE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS triangle_reflectors_present BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS first_aid_kit_present BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS spare_fuses_present BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS spare_bulbs_present BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS tools_present BOOLEAN DEFAULT TRUE;

-- ============================================================================
-- PART 15: Documentation & Compliance
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS registration_current BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS registration_expiry_date DATE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS insurance_card_present BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS insurance_expiry_date DATE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS dot_permit_present BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS ifta_decals_current BOOLEAN DEFAULT TRUE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS hazmat_placards_correct BOOLEAN;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS driver_log_current BOOLEAN DEFAULT TRUE;

-- ============================================================================
-- PART 16: Environmental & Emissions
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS emissions_test_passed BOOLEAN;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS emissions_test_date DATE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS excessive_smoke BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS check_engine_light BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS dpf_regeneration_needed BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN inspections.dpf_regeneration_needed IS 'Diesel Particulate Filter regeneration required';

-- ============================================================================
-- PART 17: Timestamps & Workflow
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS submitted_to_office_at TIMESTAMP;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS reviewed_notes TEXT;

-- ============================================================================
-- PART 18: Mobile App & Offline Support
-- ============================================================================

ALTER TABLE inspections ADD COLUMN IF NOT EXISTS completed_offline BOOLEAN DEFAULT FALSE;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP;
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS device_id VARCHAR(100);
ALTER TABLE inspections ADD COLUMN IF NOT EXISTS app_version VARCHAR(50);

-- ============================================================================
-- PART 19: Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_inspections_dvir_number ON inspections(dvir_number);
CREATE INDEX IF NOT EXISTS idx_inspections_dvir_type ON inspections(dvir_type);
CREATE INDEX IF NOT EXISTS idx_inspections_out_of_service ON inspections(out_of_service) WHERE out_of_service = TRUE;
CREATE INDEX IF NOT EXISTS idx_inspections_safety_critical ON inspections(safety_critical) WHERE safety_critical = TRUE;
CREATE INDEX IF NOT EXISTS idx_inspections_defects_repaired ON inspections(defects_repaired) WHERE defects_repaired = FALSE;
CREATE INDEX IF NOT EXISTS idx_inspections_annual ON inspections(annual_inspection) WHERE annual_inspection = TRUE;
CREATE INDEX IF NOT EXISTS idx_inspections_next_annual_due ON inspections(next_annual_due);
CREATE INDEX IF NOT EXISTS idx_inspections_mechanic ON inspections(mechanic_id);
CREATE INDEX IF NOT EXISTS idx_inspections_repaired_by ON inspections(repaired_by);
CREATE INDEX IF NOT EXISTS idx_inspections_repair_work_order ON inspections(repair_work_order_id);
CREATE INDEX IF NOT EXISTS idx_inspections_reviewed_by ON inspections(reviewed_by);

-- ============================================================================
-- PART 20: Foreign Key Constraints
-- ============================================================================

ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_mechanic_id_fkey;
ALTER TABLE inspections ADD CONSTRAINT inspections_mechanic_id_fkey
  FOREIGN KEY (mechanic_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_repaired_by_fkey;
ALTER TABLE inspections ADD CONSTRAINT inspections_repaired_by_fkey
  FOREIGN KEY (repaired_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_repair_work_order_id_fkey;
ALTER TABLE inspections ADD CONSTRAINT inspections_repair_work_order_id_fkey
  FOREIGN KEY (repair_work_order_id) REFERENCES work_orders(id) ON DELETE SET NULL;

ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_reviewed_by_fkey;
ALTER TABLE inspections ADD CONSTRAINT inspections_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_repair_verified_by_fkey;
ALTER TABLE inspections ADD CONSTRAINT inspections_repair_verified_by_fkey
  FOREIGN KEY (repair_verified_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- PART 21: Check Constraints
-- ============================================================================

ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_dvir_type_check;
ALTER TABLE inspections ADD CONSTRAINT inspections_dvir_type_check
  CHECK (dvir_type IN ('pre_trip', 'post_trip', 'annual', 'periodic', 'roadside', 'random'));

ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_inspection_level_check;
ALTER TABLE inspections ADD CONSTRAINT inspections_inspection_level_check
  CHECK (inspection_level IN ('Level I', 'Level II', 'Level III', 'Level IV', 'Level V', 'Level VI'));

ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_fluid_level_check;
ALTER TABLE inspections ADD CONSTRAINT inspections_fluid_level_check
  CHECK (
    (oil_level IS NULL OR oil_level IN ('full', 'adequate', 'low', 'critical')) AND
    (coolant_level IS NULL OR coolant_level IN ('full', 'adequate', 'low', 'critical')) AND
    (brake_fluid_level IS NULL OR brake_fluid_level IN ('full', 'ok', 'low', 'critical'))
  );

-- ============================================================================
-- Summary
-- ============================================================================

COMMENT ON TABLE inspections IS 'Enhanced DVIR-compliant inspections with FMCSA Part 396 defect tracking, signatures, tire/brake details, and repair verification';
