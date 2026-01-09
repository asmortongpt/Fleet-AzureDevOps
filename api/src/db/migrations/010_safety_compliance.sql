-- Migration 010: Safety & Compliance Tables
-- Created: 2026-01-08
-- Description: Accident reporting, safety inspections, violations, DOT HOS compliance, training, and insurance tracking

-- ============================================================================
-- ACCIDENT REPORTS - Detailed Accident/Incident Reporting
-- ============================================================================
CREATE TABLE IF NOT EXISTS accident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
    report_number VARCHAR(100) UNIQUE NOT NULL,

    -- Vehicle and driver
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,

    -- Incident details
    incident_date TIMESTAMPTZ NOT NULL,
    location TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Environmental conditions
    weather_conditions VARCHAR(100),
    road_conditions VARCHAR(100),
    traffic_conditions VARCHAR(100),
    lighting_conditions VARCHAR(50) CHECK (lighting_conditions IN ('daylight', 'dusk', 'dawn', 'dark_street_lit', 'dark_no_street_lights', NULL)),

    -- Incident classification
    incident_type VARCHAR(50) NOT NULL CHECK (incident_type IN (
        'collision', 'rollover', 'vandalism', 'theft', 'fire', 'natural_disaster', 'other'
    )),
    collision_type VARCHAR(50) CHECK (collision_type IN (
        'rear_end', 'head_on', 'sideswipe', 'angle', 'backing', 'pedestrian', 'animal', 'fixed_object', NULL
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe', 'fatal')),

    -- Fault determination
    at_fault BOOLEAN,
    fault_percentage INTEGER CHECK (fault_percentage >= 0 AND fault_percentage <= 100),
    contributing_factors TEXT[],

    -- Police involvement
    police_notified BOOLEAN DEFAULT FALSE,
    police_report_number VARCHAR(100),
    police_department VARCHAR(255),
    officer_name VARCHAR(255),
    officer_badge VARCHAR(50),

    -- Injuries and fatalities
    injuries JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{person: 'driver|passenger|pedestrian|other_driver', name: '', injury_type: '', severity: '', hospitalized: true, hospital_name: ''}]
    fatalities INTEGER DEFAULT 0 CHECK (fatalities >= 0),

    -- Damage assessment
    property_damage TEXT,
    vehicle_damage_description TEXT,
    estimated_vehicle_damage_cost DECIMAL(12, 2),
    estimated_property_damage_cost DECIMAL(12, 2),
    total_estimated_cost DECIMAL(12, 2) GENERATED ALWAYS AS (
        COALESCE(estimated_vehicle_damage_cost, 0) + COALESCE(estimated_property_damage_cost, 0)
    ) STORED,

    -- Other parties involved
    other_parties JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{name: '', contact: '', address: '', phone: '', insurance: {company: '', policy: '', agent: ''}, vehicle: {year: '', make: '', model: '', license: '', vin: ''}}]

    -- Witnesses
    witnesses JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{name: '', contact: '', phone: '', statement: ''}]

    -- Documentation
    description TEXT NOT NULL,
    driver_statement TEXT,
    photos TEXT[] DEFAULT '{}',
    video_urls TEXT[] DEFAULT '{}',
    dashcam_footage_id UUID REFERENCES video_telematics_footage(id) ON DELETE SET NULL,
    police_report_document_id UUID,

    -- Drug and alcohol testing
    drug_alcohol_test_required BOOLEAN DEFAULT FALSE,
    drug_test_administered BOOLEAN DEFAULT FALSE,
    drug_test_result VARCHAR(50) CHECK (drug_test_result IN ('negative', 'positive', 'refused', 'pending', NULL)),
    drug_test_date DATE,
    alcohol_test_administered BOOLEAN DEFAULT FALSE,
    alcohol_test_result VARCHAR(50) CHECK (alcohol_test_result IN ('negative', 'positive', 'refused', 'pending', NULL)),
    alcohol_test_bac DECIMAL(4, 3),  -- Blood Alcohol Content

    -- Insurance claims
    claims_filed JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{claim_number: '', insurer: '', claim_type: 'liability|collision|comprehensive', status: '', amount_claimed: 0, amount_paid: 0, adjuster: {name: '', phone: ''}}]

    -- Investigation
    investigation_status VARCHAR(50) DEFAULT 'pending' CHECK (investigation_status IN (
        'pending', 'in_progress', 'completed', 'closed'
    )),
    investigation_notes TEXT,
    investigated_by_user_id UUID,
    investigation_completed_at TIMESTAMPTZ,

    -- Preventability determination
    preventability VARCHAR(50) CHECK (preventability IN ('preventable', 'non_preventable', 'pending_review', NULL)),
    preventability_notes TEXT,
    preventability_determined_by_user_id UUID,
    preventability_determined_at TIMESTAMPTZ,

    -- Corrective actions
    corrective_actions TEXT,
    corrective_actions_completed BOOLEAN DEFAULT FALSE,
    corrective_actions_completed_at TIMESTAMPTZ,

    -- Regulatory reporting
    dot_reportable BOOLEAN DEFAULT FALSE,
    dot_reported BOOLEAN DEFAULT FALSE,
    dot_report_date DATE,
    osha_reportable BOOLEAN DEFAULT FALSE,
    osha_reported BOOLEAN DEFAULT FALSE,

    -- Audit fields
    reported_by_user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_accident_reports_tenant ON accident_reports(tenant_id, incident_date DESC);
CREATE INDEX idx_accident_reports_vehicle ON accident_reports(vehicle_id, incident_date DESC);
CREATE INDEX idx_accident_reports_driver ON accident_reports(driver_id, incident_date DESC);
CREATE INDEX idx_accident_reports_severity ON accident_reports(severity, incident_date DESC);
CREATE INDEX idx_accident_reports_investigation ON accident_reports(investigation_status, incident_date DESC);
CREATE INDEX idx_accident_reports_preventability ON accident_reports(preventability, incident_date DESC) WHERE preventability IS NOT NULL;
CREATE INDEX idx_accident_reports_geospatial ON accident_reports USING GIST (ll_to_earth(latitude, longitude)) WHERE latitude IS NOT NULL;

COMMENT ON TABLE accident_reports IS 'Comprehensive accident and incident reporting with investigation tracking';

-- ============================================================================
-- SAFETY INSPECTIONS - Vehicle Safety Inspection Records
-- ============================================================================
CREATE TABLE IF NOT EXISTS safety_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

    -- Inspection details
    inspection_type VARCHAR(100) NOT NULL CHECK (inspection_type IN (
        'DOT', 'pre_trip', 'post_trip', 'annual', 'quarterly',
        'monthly', 'level_1', 'level_2', 'level_3', 'other'
    )),
    inspection_number VARCHAR(100) UNIQUE,
    inspector_id UUID,  -- Driver or technician
    inspector_name VARCHAR(255),
    inspector_certification VARCHAR(100),

    -- Timing
    inspection_date TIMESTAMPTZ NOT NULL,
    inspection_location TEXT,
    odometer INTEGER,
    engine_hours INTEGER,

    -- Results
    inspection_status VARCHAR(20) NOT NULL CHECK (inspection_status IN (
        'passed', 'passed_with_defects', 'failed', 'conditional', 'aborted'
    )),
    overall_score DECIMAL(5, 2) CHECK (overall_score >= 0 AND overall_score <= 100),

    -- Checklist results
    checklist_results JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{item: 'Brakes', category: 'critical', status: 'pass|fail|na', notes: '', photo_url: ''}]

    -- Defects found
    defects_found JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{item: 'Left front brake', severity: 'critical|major|minor', description: '', action_required: 'immediate|schedule|monitor', estimated_cost: 0}]

    critical_defects_count INTEGER DEFAULT 0,
    major_defects_count INTEGER DEFAULT 0,
    minor_defects_count INTEGER DEFAULT 0,

    -- Work order creation
    requires_maintenance BOOLEAN DEFAULT FALSE,
    work_order_created_id UUID REFERENCES maintenanceRecords(id) ON DELETE SET NULL,
    work_order_created_at TIMESTAMPTZ,

    -- Vehicle clearance
    cleared_for_operation BOOLEAN DEFAULT TRUE,
    out_of_service BOOLEAN DEFAULT FALSE,
    out_of_service_reason TEXT,
    cleared_at TIMESTAMPTZ,
    cleared_by_user_id UUID,

    -- Next inspection
    next_inspection_due DATE,
    next_inspection_miles INTEGER,

    -- Certification (for DOT inspections)
    certification_number VARCHAR(100),
    certification_expiry DATE,
    certification_issued_by VARCHAR(255),

    -- Documentation
    inspector_signature TEXT,  -- Base64 encoded signature
    notes TEXT,
    photos TEXT[] DEFAULT '{}',
    inspection_report_document_id UUID,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_safety_inspections_vehicle ON safety_inspections(vehicle_id, inspection_date DESC);
CREATE INDEX idx_safety_inspections_tenant_type ON safety_inspections(tenant_id, inspection_type, inspection_date DESC);
CREATE INDEX idx_safety_inspections_status ON safety_inspections(inspection_status, inspection_date DESC);
CREATE INDEX idx_safety_inspections_next_due ON safety_inspections(vehicle_id, next_inspection_due)
    WHERE next_inspection_due IS NOT NULL;
CREATE INDEX idx_safety_inspections_out_of_service ON safety_inspections(vehicle_id, out_of_service)
    WHERE out_of_service = TRUE;

COMMENT ON TABLE safety_inspections IS 'Vehicle safety inspections including DOT, pre-trip, and annual inspections';

-- ============================================================================
-- DRIVER VIOLATIONS - Traffic Citations and Violations
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE RESTRICT,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,

    -- Violation details
    violation_type VARCHAR(100) NOT NULL,
    violation_code VARCHAR(50),
    violation_description TEXT NOT NULL,
    citation_number VARCHAR(100) UNIQUE,

    -- Location and timing
    violation_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Issuing authority
    issuing_agency VARCHAR(255),
    issuing_jurisdiction VARCHAR(100),
    officer_name VARCHAR(255),
    officer_badge VARCHAR(50),

    -- Financial impact
    fine_amount DECIMAL(8, 2) CHECK (fine_amount >= 0),
    court_costs DECIMAL(8, 2) DEFAULT 0,
    total_amount DECIMAL(8, 2) GENERATED ALWAYS AS (
        COALESCE(fine_amount, 0) + COALESCE(court_costs, 0)
    ) STORED,

    -- Points
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    points_state VARCHAR(50),

    -- Court information
    court_date DATE,
    court_location TEXT,
    court_docket_number VARCHAR(100),

    -- Plea and outcome
    plea VARCHAR(50) CHECK (plea IN ('not_guilty', 'guilty', 'no_contest', 'pending', NULL)),
    outcome VARCHAR(100) CHECK (outcome IN (
        'pending', 'dismissed', 'reduced', 'found_guilty', 'found_not_guilty',
        'deferred_adjudication', 'traffic_school', NULL
    )),
    outcome_date DATE,
    outcome_notes TEXT,

    -- Payment tracking
    fine_paid BOOLEAN DEFAULT FALSE,
    fine_paid_date DATE,
    fine_paid_by VARCHAR(50) CHECK (fine_paid_by IN ('driver', 'company', 'contested', NULL)),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),

    -- Insurance and company impact
    insurance_notified BOOLEAN DEFAULT FALSE,
    insurance_notification_date DATE,
    affects_insurance BOOLEAN DEFAULT FALSE,
    insurance_impact_amount DECIMAL(10, 2),

    points_added_to_record BOOLEAN DEFAULT FALSE,
    points_added_date DATE,

    -- Driver impact
    driver_license_suspended BOOLEAN DEFAULT FALSE,
    suspension_start_date DATE,
    suspension_end_date DATE,

    -- Company response
    corrective_action_taken TEXT,
    corrective_action_completed BOOLEAN DEFAULT FALSE,
    disciplinary_action TEXT,
    training_required BOOLEAN DEFAULT FALSE,
    training_completed BOOLEAN DEFAULT FALSE,

    -- Documentation
    attachments TEXT[] DEFAULT '{}',  -- Citation, court documents
    notes TEXT,

    -- Audit fields
    reported_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_driver_violations_driver ON driver_violations(driver_id, violation_date DESC);
CREATE INDEX idx_driver_violations_tenant ON driver_violations(tenant_id, violation_date DESC);
CREATE INDEX idx_driver_violations_vehicle ON driver_violations(vehicle_id, violation_date DESC) WHERE vehicle_id IS NOT NULL;
CREATE INDEX idx_driver_violations_fine_paid ON driver_violations(fine_paid, fine_paid_date)
    WHERE fine_paid = FALSE AND fine_amount > 0;
CREATE INDEX idx_driver_violations_court ON driver_violations(court_date) WHERE court_date IS NOT NULL;

COMMENT ON TABLE driver_violations IS 'Driver traffic violations, citations, and legal proceedings';

-- ============================================================================
-- COMPLIANCE DOCUMENTS - Regulatory Compliance Documentation
-- ============================================================================
CREATE TABLE IF NOT EXISTS compliance_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Document classification
    document_type VARCHAR(100) NOT NULL,
    document_category VARCHAR(50) CHECK (document_category IN (
        'license', 'permit', 'certification', 'insurance',
        'registration', 'inspection', 'report', 'other'
    )),

    -- Entity reference
    entity_type VARCHAR(50) CHECK (entity_type IN ('fleet', 'vehicle', 'driver', 'facility', NULL)),
    entity_id UUID,
    entity_name VARCHAR(255),

    -- Document details
    document_number VARCHAR(100),
    document_name VARCHAR(500) NOT NULL,
    issuing_authority VARCHAR(255),
    issuing_state VARCHAR(50),
    issuing_country VARCHAR(50) DEFAULT 'US',

    -- Dates
    issue_date DATE,
    effective_date DATE,
    expiration_date DATE,
    days_until_expiry INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN expiration_date IS NOT NULL THEN (expiration_date - CURRENT_DATE)
            ELSE NULL
        END
    ) STORED,

    -- Renewal
    renewal_required BOOLEAN DEFAULT TRUE,
    renewal_reminder_days INTEGER DEFAULT 30,
    renewal_initiated BOOLEAN DEFAULT FALSE,
    renewal_initiated_date DATE,

    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN (
        'active', 'expiring_soon', 'expired', 'renewed', 'cancelled', 'suspended'
    )),

    -- Compliance requirements
    compliance_requirements TEXT,
    regulatory_authority VARCHAR(255),

    -- Documentation
    document_url TEXT,
    document_file_id UUID,  -- Reference to documents table

    -- Verification
    verification_method VARCHAR(100),
    verified_by_user_id UUID,
    verified_at TIMESTAMPTZ,
    verification_notes TEXT,

    -- Notifications
    expiry_notifications_sent INTEGER DEFAULT 0,
    last_notification_sent_at TIMESTAMPTZ,

    -- Notes
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_documents_tenant ON compliance_documents(tenant_id, document_type, status);
CREATE INDEX idx_compliance_documents_entity ON compliance_documents(entity_type, entity_id, expiration_date)
    WHERE entity_type IS NOT NULL;
CREATE INDEX idx_compliance_documents_expiration ON compliance_documents(expiration_date, status)
    WHERE expiration_date IS NOT NULL;
CREATE INDEX idx_compliance_documents_expiring_soon ON compliance_documents(tenant_id, expiration_date)
    WHERE status = 'expiring_soon';

COMMENT ON TABLE compliance_documents IS 'Regulatory compliance documentation with expiration tracking';

-- ============================================================================
-- HOURS OF SERVICE LOGS - DOT HOS Compliance Tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS hours_of_service_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,

    -- Log date and duty status
    log_date DATE NOT NULL,
    duty_status VARCHAR(20) NOT NULL CHECK (duty_status IN (
        'off_duty', 'sleeper_berth', 'driving', 'on_duty_not_driving'
    )),

    -- Time period
    status_start_time TIMESTAMPTZ NOT NULL,
    status_end_time TIMESTAMPTZ,
    duration_minutes INTEGER,

    -- Location information
    location_start TEXT,
    location_end TEXT,
    latitude_start DECIMAL(10, 8),
    longitude_start DECIMAL(11, 8),
    latitude_end DECIMAL(10, 8),
    longitude_end DECIMAL(11, 8),

    -- Odometer
    odometer_start INTEGER,
    odometer_end INTEGER,
    miles_driven INTEGER GENERATED ALWAYS AS (
        CASE
            WHEN odometer_start IS NOT NULL AND odometer_end IS NOT NULL
            THEN odometer_end - odometer_start
            ELSE NULL
        END
    ) STORED,

    -- Remarks and annotations
    remarks TEXT,
    special_driving_category VARCHAR(50),  -- 'adverse_conditions', 'yard_moves', etc.

    -- Violations detected
    violations TEXT[] DEFAULT '{}',
    -- Examples: '11_hour_driving', '14_hour_window', '70_hour_8_day', '34_hour_restart'
    violation_details JSONB DEFAULT '{}'::jsonb,

    -- Certification
    is_certified BOOLEAN DEFAULT FALSE,
    certified_at TIMESTAMPTZ,
    certification_signature TEXT,

    -- ELD information
    eld_provider VARCHAR(100),
    eld_device_id VARCHAR(100),
    eld_event_sequence_id VARCHAR(255),
    eld_event_code VARCHAR(10),

    -- Edits and amendments
    is_edited BOOLEAN DEFAULT FALSE,
    original_status VARCHAR(20),
    edit_reason TEXT,
    edited_by_user_id UUID,
    edited_at TIMESTAMPTZ,

    -- Shipping documents (for CMV operators)
    shipping_document_number VARCHAR(100),
    shipper_name VARCHAR(255),
    commodity VARCHAR(255),

    -- Co-driver information
    co_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,

    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_from_eld_at TIMESTAMPTZ,

    CONSTRAINT valid_hos_times CHECK (
        (status_end_time IS NULL) OR (status_end_time >= status_start_time)
    )
);

CREATE INDEX idx_hos_logs_driver_date ON hours_of_service_logs(driver_id, log_date DESC);
CREATE INDEX idx_hos_logs_tenant_date ON hours_of_service_logs(tenant_id, log_date DESC);
CREATE INDEX idx_hos_logs_vehicle ON hours_of_service_logs(vehicle_id, log_date DESC) WHERE vehicle_id IS NOT NULL;
CREATE INDEX idx_hos_logs_violations ON hours_of_service_logs USING GIN (violations);
CREATE INDEX idx_hos_logs_uncertified ON hours_of_service_logs(driver_id, log_date)
    WHERE is_certified = FALSE;
CREATE INDEX idx_hos_logs_duty_status ON hours_of_service_logs(driver_id, duty_status, status_start_time);

COMMENT ON TABLE hours_of_service_logs IS 'DOT Hours of Service compliance logging for CDL drivers';

-- ============================================================================
-- DRIVER TRAINING RECORDS - Driver Training Completion Tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS driver_training_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,

    -- Training details
    training_type VARCHAR(100) NOT NULL,
    training_title VARCHAR(500) NOT NULL,
    training_description TEXT,
    training_category VARCHAR(100),

    -- Provider information
    training_provider VARCHAR(255),
    instructor_name VARCHAR(255),
    instructor_certification VARCHAR(100),

    -- Scheduling
    training_date DATE NOT NULL,
    training_start_time TIMESTAMPTZ,
    training_end_time TIMESTAMPTZ,
    training_hours DECIMAL(4, 1) CHECK (training_hours >= 0),
    training_location TEXT,
    training_method VARCHAR(50) CHECK (training_method IN (
        'classroom', 'online', 'hands_on', 'simulator', 'on_road', 'video', 'self_paced', NULL
    )),

    -- Completion and certification
    completion_date DATE,
    completion_status VARCHAR(20) DEFAULT 'pending' CHECK (completion_status IN (
        'pending', 'registered', 'in_progress', 'completed', 'failed', 'no_show', 'cancelled'
    )),

    -- Assessment
    requires_assessment BOOLEAN DEFAULT FALSE,
    assessment_type VARCHAR(50),
    score DECIMAL(5, 2) CHECK (score >= 0 AND score <= 100),
    passing_score DECIMAL(5, 2),
    passed BOOLEAN,

    -- Certification
    certification_issued BOOLEAN DEFAULT FALSE,
    certification_number VARCHAR(100),
    certification_expiry_date DATE,
    recertification_required BOOLEAN DEFAULT FALSE,
    recertification_interval_months INTEGER,

    -- Documentation
    certificate_url TEXT,
    training_materials_url TEXT,
    completion_certificate_document_id UUID,

    -- Cost tracking
    training_cost DECIMAL(10, 2),
    paid_by VARCHAR(50) CHECK (paid_by IN ('company', 'driver', 'grant', 'other', NULL)),

    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_completed BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,

    -- Notes
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Audit fields
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_driver_training_driver ON driver_training_records(driver_id, training_date DESC);
CREATE INDEX idx_driver_training_tenant_type ON driver_training_records(tenant_id, training_type, training_date DESC);
CREATE INDEX idx_driver_training_status ON driver_training_records(completion_status, training_date);
CREATE INDEX idx_driver_training_expiry ON driver_training_records(driver_id, certification_expiry_date)
    WHERE certification_expiry_date IS NOT NULL;
CREATE INDEX idx_driver_training_upcoming ON driver_training_records(training_date)
    WHERE completion_status IN ('pending', 'registered') AND training_date >= CURRENT_DATE;

COMMENT ON TABLE driver_training_records IS 'Comprehensive driver training and certification tracking';

-- ============================================================================
-- SAFETY MEETINGS - Safety Meeting Attendance and Topics
-- ============================================================================
CREATE TABLE IF NOT EXISTS safety_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Meeting details
    meeting_date TIMESTAMPTZ NOT NULL,
    meeting_type VARCHAR(100) CHECK (meeting_type IN (
        'toolbox_talk', 'monthly_safety', 'incident_review',
        'training', 'emergency_drill', 'regulatory_update', 'other'
    )),
    topic VARCHAR(500) NOT NULL,
    subtopics TEXT[],

    -- Facilitation
    facilitator_user_id UUID,
    facilitator_name VARCHAR(255),
    location TEXT,
    meeting_format VARCHAR(50) CHECK (meeting_format IN ('in_person', 'virtual', 'hybrid', NULL)),
    duration_minutes INTEGER CHECK (duration_minutes >= 0),

    -- Attendees
    attendees JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{driver_id: uuid, user_id: uuid, name: '', signed: true, signature_url: '', timestamp: ''}]
    required_attendees UUID[] DEFAULT '{}',
    attendance_count INTEGER DEFAULT 0,
    required_count INTEGER DEFAULT 0,

    -- Content
    agenda TEXT,
    minutes TEXT,
    key_points TEXT[],
    discussion_items TEXT,

    -- Materials
    presentation_url TEXT,
    handouts TEXT[] DEFAULT '{}',
    video_url TEXT,

    -- Comprehension check
    quiz_administered BOOLEAN DEFAULT FALSE,
    quiz_results JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{driver_id: uuid, score: 85, passed: true, completed_at: ''}]

    -- Action items
    action_items JSONB DEFAULT '[]'::jsonb,
    -- Structure: [{description: '', assigned_to: uuid, due_date: '', status: 'pending|completed', completed_at: ''}]

    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_completed BOOLEAN DEFAULT FALSE,

    -- Compliance
    regulatory_requirement VARCHAR(255),
    compliance_fulfilled BOOLEAN DEFAULT TRUE,

    -- Documentation
    photos TEXT[] DEFAULT '{}',
    attendance_sheet_document_id UUID,
    meeting_notes_document_id UUID,

    -- Notes
    notes TEXT,

    -- Audit fields
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_safety_meetings_tenant_date ON safety_meetings(tenant_id, meeting_date DESC);
CREATE INDEX idx_safety_meetings_type ON safety_meetings(meeting_type, meeting_date DESC);
CREATE INDEX idx_safety_meetings_upcoming ON safety_meetings(meeting_date)
    WHERE meeting_date >= NOW();

COMMENT ON TABLE safety_meetings IS 'Safety meeting attendance, topics, and action items';

-- ============================================================================
-- INSURANCE POLICIES - Fleet Insurance Policy Tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS insurance_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Policy identification
    policy_number VARCHAR(100) UNIQUE NOT NULL,
    policy_name VARCHAR(255),
    insurance_carrier VARCHAR(255) NOT NULL,
    carrier_contact_name VARCHAR(255),
    carrier_contact_phone VARCHAR(20),
    carrier_contact_email VARCHAR(255),

    -- Policy classification
    policy_type VARCHAR(100) NOT NULL CHECK (policy_type IN (
        'auto_liability', 'physical_damage', 'cargo', 'workers_comp',
        'general_liability', 'umbrella', 'garage_keepers', 'other'
    )),
    coverage_type VARCHAR(100),

    -- Dates
    policy_start_date DATE NOT NULL,
    policy_end_date DATE NOT NULL,
    days_until_expiry INTEGER GENERATED ALWAYS AS (policy_end_date - CURRENT_DATE) STORED,

    -- Financial
    premium_amount DECIMAL(12, 2) NOT NULL CHECK (premium_amount >= 0),
    premium_frequency VARCHAR(20) CHECK (premium_frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual')),
    deductible DECIMAL(12, 2),
    deductible_per VARCHAR(50),  -- 'occurrence', 'vehicle', 'person'

    -- Coverage limits
    coverage_limits JSONB NOT NULL,
    -- Structure: {bodily_injury_per_person: 1000000, bodily_injury_per_accident: 2000000, property_damage: 500000, uninsured_motorist: 1000000}

    -- Covered entities
    covered_vehicles UUID[] DEFAULT '{}',
    covered_drivers UUID[] DEFAULT '{}',
    all_vehicles_covered BOOLEAN DEFAULT FALSE,
    all_drivers_covered BOOLEAN DEFAULT FALSE,

    -- Agent information
    agent_name VARCHAR(255),
    agent_contact_phone VARCHAR(20),
    agent_contact_email VARCHAR(255),
    agency_name VARCHAR(255),

    -- Policy documents
    policy_document_url TEXT,
    policy_document_id UUID,
    certificate_of_insurance_url TEXT,

    -- Status
    renewal_status VARCHAR(20) DEFAULT 'current' CHECK (renewal_status IN (
        'current', 'expiring', 'expired', 'renewed', 'cancelled', 'pending'
    )),

    -- Renewal
    renewal_notice_date DATE,
    renewal_initiated BOOLEAN DEFAULT FALSE,
    renewal_policy_id UUID REFERENCES insurance_policies(id) ON DELETE SET NULL,

    -- Claims history
    claims_filed INTEGER DEFAULT 0,
    total_claims_paid DECIMAL(12, 2) DEFAULT 0,
    last_claim_date DATE,

    -- Notes
    notes TEXT,
    exclusions TEXT,
    special_conditions TEXT,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,

    -- Audit fields
    created_by_user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_policy_dates CHECK (policy_end_date > policy_start_date)
);

CREATE INDEX idx_insurance_policies_tenant ON insurance_policies(tenant_id, policy_type, is_active);
CREATE INDEX idx_insurance_policies_carrier ON insurance_policies(insurance_carrier, is_active);
CREATE INDEX idx_insurance_policies_expiration ON insurance_policies(policy_end_date, renewal_status);
CREATE INDEX idx_insurance_policies_expiring_soon ON insurance_policies(tenant_id, policy_end_date)
    WHERE renewal_status = 'expiring';

COMMENT ON TABLE insurance_policies IS 'Fleet insurance policy management and tracking';

-- ============================================================================
-- TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_safety_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accident_reports_updated_at BEFORE UPDATE ON accident_reports FOR EACH ROW EXECUTE FUNCTION update_safety_updated_at();
CREATE TRIGGER update_safety_inspections_updated_at BEFORE UPDATE ON safety_inspections FOR EACH ROW EXECUTE FUNCTION update_safety_updated_at();
CREATE TRIGGER update_driver_violations_updated_at BEFORE UPDATE ON driver_violations FOR EACH ROW EXECUTE FUNCTION update_safety_updated_at();
CREATE TRIGGER update_compliance_documents_updated_at BEFORE UPDATE ON compliance_documents FOR EACH ROW EXECUTE FUNCTION update_safety_updated_at();
CREATE TRIGGER update_driver_training_updated_at BEFORE UPDATE ON driver_training_records FOR EACH ROW EXECUTE FUNCTION update_safety_updated_at();
CREATE TRIGGER update_safety_meetings_updated_at BEFORE UPDATE ON safety_meetings FOR EACH ROW EXECUTE FUNCTION update_safety_updated_at();
CREATE TRIGGER update_insurance_policies_updated_at BEFORE UPDATE ON insurance_policies FOR EACH ROW EXECUTE FUNCTION update_safety_updated_at();

-- Auto-generate report numbers
CREATE SEQUENCE IF NOT EXISTS accident_report_seq;

CREATE OR REPLACE FUNCTION generate_accident_report_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.report_number IS NULL OR NEW.report_number = '' THEN
        NEW.report_number = 'ACC-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' ||
                           LPAD(nextval('accident_report_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_accident_report_number_trigger
    BEFORE INSERT ON accident_reports
    FOR EACH ROW EXECUTE FUNCTION generate_accident_report_number();

-- Update compliance document status based on expiration
CREATE OR REPLACE FUNCTION update_compliance_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expiration_date IS NOT NULL THEN
        IF NEW.expiration_date < CURRENT_DATE THEN
            NEW.status = 'expired';
        ELSIF NEW.expiration_date - CURRENT_DATE <= COALESCE(NEW.renewal_reminder_days, 30) THEN
            NEW.status = 'expiring_soon';
        ELSE
            NEW.status = 'active';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_compliance_status_trigger
    BEFORE INSERT OR UPDATE OF expiration_date, renewal_reminder_days ON compliance_documents
    FOR EACH ROW EXECUTE FUNCTION update_compliance_status();

-- Calculate HOS log duration
CREATE OR REPLACE FUNCTION calculate_hos_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status_start_time IS NOT NULL AND NEW.status_end_time IS NOT NULL THEN
        NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.status_end_time - NEW.status_start_time)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_hos_duration_trigger
    BEFORE INSERT OR UPDATE OF status_start_time, status_end_time ON hours_of_service_logs
    FOR EACH ROW EXECUTE FUNCTION calculate_hos_duration();

-- Update insurance policy renewal status
CREATE OR REPLACE FUNCTION update_insurance_renewal_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.policy_end_date < CURRENT_DATE THEN
        NEW.renewal_status = 'expired';
        NEW.is_active = FALSE;
    ELSIF NEW.policy_end_date - CURRENT_DATE <= 60 THEN
        NEW.renewal_status = 'expiring';
    ELSE
        NEW.renewal_status = 'current';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_insurance_renewal_status_trigger
    BEFORE INSERT OR UPDATE OF policy_end_date ON insurance_policies
    FOR EACH ROW EXECUTE FUNCTION update_insurance_renewal_status();
