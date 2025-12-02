-- OSHA Compliance Forms and Templates Database Schema
-- Industry-standard safety and compliance tracking for fleet management

-- ============================================================================
-- OSHA Form Templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS osha_form_templates (
    id SERIAL PRIMARY KEY,
    form_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'OSHA-300', 'OSHA-301', 'OSHA-300A'
    form_name VARCHAR(255) NOT NULL,
    form_category VARCHAR(100) NOT NULL, -- 'Injury/Illness', 'Inspection', 'Training', 'Safety Data'
    description TEXT,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    effective_date DATE NOT NULL,
    expiration_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    requires_signature BOOLEAN DEFAULT TRUE,
    retention_years INTEGER DEFAULT 5, -- OSHA retention requirements
    json_schema JSONB NOT NULL, -- Field definitions and validation rules
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- OSHA 300 Log of Work-Related Injuries and Illnesses
-- ============================================================================

CREATE TABLE IF NOT EXISTS osha_300_log (
    id SERIAL PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    employee_id INTEGER REFERENCES drivers(id),
    employee_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255),
    date_of_injury DATE NOT NULL,
    time_of_injury TIME,
    location_of_incident VARCHAR(500),
    vehicle_id INTEGER REFERENCES vehicles(id),

    -- Injury Classification
    injury_type VARCHAR(100) NOT NULL, -- 'Injury', 'Skin Disorder', 'Respiratory', 'Poisoning', 'Hearing Loss', 'Other'
    body_part_affected VARCHAR(255),
    object_or_substance VARCHAR(255),

    -- Outcome Classification
    death BOOLEAN DEFAULT FALSE,
    days_away_from_work INTEGER DEFAULT 0,
    job_transfer_restriction BOOLEAN DEFAULT FALSE,
    days_of_restriction INTEGER DEFAULT 0,
    other_recordable_case BOOLEAN DEFAULT FALSE,

    -- Treatment
    treatment_provided TEXT,
    treated_by VARCHAR(255),
    healthcare_facility VARCHAR(255),

    -- Privacy Case
    is_privacy_case BOOLEAN DEFAULT FALSE,

    -- Status
    case_status VARCHAR(50) DEFAULT 'Open', -- 'Open', 'Under Investigation', 'Closed'
    investigation_notes TEXT,
    corrective_actions TEXT,

    -- Compliance
    osha_reported BOOLEAN DEFAULT FALSE,
    osha_report_date DATE,
    osha_case_number VARCHAR(100),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

-- ============================================================================
-- OSHA 301 Injury and Illness Incident Report
-- ============================================================================

CREATE TABLE IF NOT EXISTS osha_301_reports (
    id SERIAL PRIMARY KEY,
    osha_300_log_id INTEGER REFERENCES osha_300_log(id),

    -- Employee Information
    employee_name VARCHAR(255) NOT NULL,
    employee_address TEXT,
    employee_hire_date DATE,

    -- Incident Details
    incident_date DATE NOT NULL,
    incident_time TIME NOT NULL,
    location_where_occurred TEXT NOT NULL,
    doing_what TEXT NOT NULL,
    how_injury_occurred TEXT NOT NULL,

    -- Injury Details
    injury_illness_description TEXT NOT NULL,
    body_parts_affected TEXT NOT NULL,

    -- Treatment
    physician_hospital_name VARCHAR(255),
    physician_hospital_address TEXT,
    emergency_room_treatment BOOLEAN DEFAULT FALSE,
    hospitalized_overnight BOOLEAN DEFAULT FALSE,

    -- Completion Info
    completed_by VARCHAR(255) NOT NULL,
    completion_title VARCHAR(255) NOT NULL,
    completion_phone VARCHAR(50),
    completion_date DATE NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Vehicle Safety Inspections (Daily Pre-Trip/Post-Trip)
-- ============================================================================

CREATE TABLE IF NOT EXISTS vehicle_safety_inspections (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id) NOT NULL,
    driver_id INTEGER REFERENCES drivers(id) NOT NULL,
    inspection_date DATE NOT NULL,
    inspection_time TIME NOT NULL,
    inspection_type VARCHAR(50) NOT NULL, -- 'Pre-Trip', 'Post-Trip', 'Monthly', 'Annual'
    odometer_reading INTEGER,

    -- Inspection Items (FMCSA requirements)
    brakes_status VARCHAR(20) DEFAULT 'Pass', -- 'Pass', 'Fail', 'N/A'
    brakes_notes TEXT,

    steering_status VARCHAR(20) DEFAULT 'Pass',
    steering_notes TEXT,

    lights_status VARCHAR(20) DEFAULT 'Pass',
    lights_notes TEXT,

    tires_status VARCHAR(20) DEFAULT 'Pass',
    tires_notes TEXT,

    horn_status VARCHAR(20) DEFAULT 'Pass',
    horn_notes TEXT,

    windshield_wipers_status VARCHAR(20) DEFAULT 'Pass',
    windshield_wipers_notes TEXT,

    mirrors_status VARCHAR(20) DEFAULT 'Pass',
    mirrors_notes TEXT,

    seatbelts_status VARCHAR(20) DEFAULT 'Pass',
    seatbelts_notes TEXT,

    emergency_equipment_status VARCHAR(20) DEFAULT 'Pass',
    emergency_equipment_notes TEXT,

    fluid_leaks_status VARCHAR(20) DEFAULT 'Pass',
    fluid_leaks_notes TEXT,

    body_damage_status VARCHAR(20) DEFAULT 'Pass',
    body_damage_notes TEXT,

    -- Overall Assessment
    overall_status VARCHAR(20) NOT NULL DEFAULT 'Pass', -- 'Pass', 'Fail', 'Conditional'
    defects_found BOOLEAN DEFAULT FALSE,
    defects_corrected BOOLEAN DEFAULT FALSE,
    vehicle_out_of_service BOOLEAN DEFAULT FALSE,

    -- Signatures
    driver_signature TEXT, -- Base64 encoded signature image
    mechanic_signature TEXT,
    supervisor_signature TEXT,

    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Safety Training Records
-- ============================================================================

CREATE TABLE IF NOT EXISTS safety_training_records (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES drivers(id) NOT NULL,
    training_type VARCHAR(100) NOT NULL,
    training_topic VARCHAR(255) NOT NULL,
    training_date DATE NOT NULL,
    training_duration_hours DECIMAL(4,2),

    -- Training Details
    trainer_name VARCHAR(255),
    training_location VARCHAR(255),
    training_method VARCHAR(100), -- 'Classroom', 'Online', 'On-the-Job', 'Simulation'

    -- OSHA Required Training
    is_osha_required BOOLEAN DEFAULT FALSE,
    osha_standard VARCHAR(100), -- e.g., '29 CFR 1910.134'

    -- Certification
    certification_issued BOOLEAN DEFAULT FALSE,
    certification_number VARCHAR(100),
    certification_expiry_date DATE,

    -- Assessment
    test_score DECIMAL(5,2),
    passed BOOLEAN DEFAULT TRUE,

    -- Documentation
    certificate_url VARCHAR(500),
    training_materials_url VARCHAR(500),

    -- Renewal
    renewal_required BOOLEAN DEFAULT FALSE,
    renewal_frequency_months INTEGER, -- e.g., 12 for annual, 36 for every 3 years
    next_renewal_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Hazardous Materials (HazMat) Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS hazmat_inventory (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),

    -- Material Identification
    material_name VARCHAR(255) NOT NULL,
    un_number VARCHAR(10), -- UN/NA identification number
    hazard_class VARCHAR(50), -- DOT Hazard Class
    packing_group VARCHAR(10), -- I, II, III

    -- Quantity
    quantity DECIMAL(10,2) NOT NULL,
    unit_of_measure VARCHAR(50) NOT NULL, -- 'Gallons', 'Pounds', 'Liters', etc.

    -- Storage
    storage_location VARCHAR(255),
    storage_temperature_min DECIMAL(5,2),
    storage_temperature_max DECIMAL(5,2),

    -- Safety Data Sheet
    sds_available BOOLEAN DEFAULT FALSE,
    sds_url VARCHAR(500),
    sds_last_reviewed DATE,

    -- Compliance
    requires_placard BOOLEAN DEFAULT FALSE,
    requires_special_permit BOOLEAN DEFAULT FALSE,
    special_permit_number VARCHAR(100),

    -- Emergency Response
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    emergency_procedures TEXT,

    -- Dates
    received_date DATE,
    expiration_date DATE,
    disposal_date DATE,
    disposal_method VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Safety Data Sheets (SDS) Library
-- ============================================================================

CREATE TABLE IF NOT EXISTS safety_data_sheets (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255) NOT NULL,
    product_code VARCHAR(100),

    -- Chemical Information
    cas_number VARCHAR(50),
    chemical_formula VARCHAR(100),

    -- Hazard Information
    ghs_pictograms TEXT[], -- Array of GHS pictogram codes
    signal_word VARCHAR(50), -- 'Danger', 'Warning'
    hazard_statements TEXT[],
    precautionary_statements TEXT[],

    -- Physical Properties
    appearance VARCHAR(255),
    odor VARCHAR(255),
    ph DECIMAL(4,2),
    flash_point VARCHAR(100),
    autoignition_temperature VARCHAR(100),

    -- Storage and Handling
    storage_requirements TEXT,
    handling_precautions TEXT,
    incompatible_materials TEXT[],

    -- Emergency Response
    first_aid_measures TEXT,
    firefighting_measures TEXT,
    accidental_release_measures TEXT,

    -- Documentation
    sds_document_url VARCHAR(500) NOT NULL,
    revision_date DATE NOT NULL,
    version VARCHAR(20),

    -- Compliance
    is_current BOOLEAN DEFAULT TRUE,
    next_review_date DATE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Accident Investigation Reports
-- ============================================================================

CREATE TABLE IF NOT EXISTS accident_investigations (
    id SERIAL PRIMARY KEY,
    accident_date DATE NOT NULL,
    accident_time TIME NOT NULL,
    location TEXT NOT NULL,
    vehicle_id INTEGER REFERENCES vehicles(id),
    driver_id INTEGER REFERENCES drivers(id),

    -- Investigation Details
    investigation_date DATE NOT NULL,
    investigator_name VARCHAR(255) NOT NULL,
    investigator_title VARCHAR(255),

    -- Accident Description
    accident_type VARCHAR(100) NOT NULL, -- 'Collision', 'Rollover', 'Fixed Object', 'Pedestrian', etc.
    severity VARCHAR(50) NOT NULL, -- 'Fatal', 'Serious Injury', 'Minor Injury', 'Property Damage Only'
    weather_conditions VARCHAR(100),
    road_conditions VARCHAR(100),
    visibility VARCHAR(100),

    -- Description
    what_happened TEXT NOT NULL,
    why_it_happened TEXT NOT NULL,

    -- Root Cause Analysis
    immediate_causes TEXT[],
    root_causes TEXT[],
    contributing_factors TEXT[],

    -- Corrective Actions
    corrective_actions TEXT[] NOT NULL,
    preventive_measures TEXT[] NOT NULL,
    responsible_party VARCHAR(255),
    target_completion_date DATE,
    actual_completion_date DATE,

    -- Follow-up
    effectiveness_review_date DATE,
    effectiveness_review_notes TEXT,

    -- Attachments
    photos_url TEXT[],
    police_report_url VARCHAR(500),
    witness_statements_url TEXT[],

    -- Status
    investigation_status VARCHAR(50) DEFAULT 'In Progress',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Personal Protective Equipment (PPE) Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS ppe_assignments (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES drivers(id) NOT NULL,

    -- Equipment Details
    equipment_type VARCHAR(100) NOT NULL, -- 'Hard Hat', 'Safety Vest', 'Gloves', 'Safety Shoes', etc.
    equipment_description VARCHAR(255),
    size VARCHAR(50),
    manufacturer VARCHAR(255),
    model_number VARCHAR(100),

    -- Assignment
    issue_date DATE NOT NULL,
    expected_replacement_date DATE,
    actual_replacement_date DATE,

    -- Condition
    condition_status VARCHAR(50) DEFAULT 'Good', -- 'New', 'Good', 'Fair', 'Needs Replacement'
    last_inspection_date DATE,
    next_inspection_date DATE,

    -- Compliance
    osha_required BOOLEAN DEFAULT FALSE,
    certification_required BOOLEAN DEFAULT FALSE,
    certification_number VARCHAR(100),
    certification_expiry_date DATE,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    retirement_date DATE,
    retirement_reason VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_osha_300_employee ON osha_300_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_osha_300_vehicle ON osha_300_log(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_osha_300_date ON osha_300_log(date_of_injury);
CREATE INDEX IF NOT EXISTS idx_osha_300_status ON osha_300_log(case_status);

CREATE INDEX IF NOT EXISTS idx_inspections_vehicle ON vehicle_safety_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_inspections_driver ON vehicle_safety_inspections(driver_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON vehicle_safety_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON vehicle_safety_inspections(overall_status);

CREATE INDEX IF NOT EXISTS idx_training_employee ON safety_training_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_training_date ON safety_training_records(training_date);
CREATE INDEX IF NOT EXISTS idx_training_expiry ON safety_training_records(certification_expiry_date);

CREATE INDEX IF NOT EXISTS idx_hazmat_vehicle ON hazmat_inventory(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_hazmat_un_number ON hazmat_inventory(un_number);

CREATE INDEX IF NOT EXISTS idx_accidents_vehicle ON accident_investigations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_accidents_driver ON accident_investigations(driver_id);
CREATE INDEX IF NOT EXISTS idx_accidents_date ON accident_investigations(accident_date);

CREATE INDEX IF NOT EXISTS idx_ppe_employee ON ppe_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_ppe_active ON ppe_assignments(is_active);

-- ============================================================================
-- Triggers for updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_osha_form_templates_updated_at BEFORE UPDATE ON osha_form_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_osha_300_log_updated_at BEFORE UPDATE ON osha_300_log FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_osha_301_reports_updated_at BEFORE UPDATE ON osha_301_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicle_safety_inspections_updated_at BEFORE UPDATE ON vehicle_safety_inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_safety_training_records_updated_at BEFORE UPDATE ON safety_training_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hazmat_inventory_updated_at BEFORE UPDATE ON hazmat_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_safety_data_sheets_updated_at BEFORE UPDATE ON safety_data_sheets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_accident_investigations_updated_at BEFORE UPDATE ON accident_investigations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ppe_assignments_updated_at BEFORE UPDATE ON ppe_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE osha_form_templates IS 'Master templates for all OSHA forms and safety documentation';
COMMENT ON TABLE osha_300_log IS 'OSHA 300 Log of Work-Related Injuries and Illnesses - Required for all employers with 11+ employees';
COMMENT ON TABLE osha_301_reports IS 'OSHA 301 Injury and Illness Incident Report - Detailed incident documentation';
COMMENT ON TABLE vehicle_safety_inspections IS 'Daily pre-trip and post-trip vehicle safety inspections per FMCSA requirements';
COMMENT ON TABLE safety_training_records IS 'Employee safety training history and certification tracking';
COMMENT ON TABLE hazmat_inventory IS 'Hazardous materials inventory and DOT compliance tracking';
COMMENT ON TABLE safety_data_sheets IS 'Safety Data Sheets (SDS) library per OSHA HazCom Standard';
COMMENT ON TABLE accident_investigations IS 'Comprehensive accident investigation reports with root cause analysis';
COMMENT ON TABLE ppe_assignments IS 'Personal protective equipment assignment and maintenance tracking';
