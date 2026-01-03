-- Comprehensive Policy and Procedure Templates Library
-- Industry-standard templates for fleet management, safety, HR, and compliance

-- ============================================================================
-- Policy Templates Master Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS policy_templates (
    id SERIAL PRIMARY KEY,

    -- Template Identification
    policy_code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'FLT-SAF-001', 'HR-DRG-001'
    policy_name VARCHAR(255) NOT NULL,
    policy_category VARCHAR(100) NOT NULL, -- 'Safety', 'HR', 'Operations', 'Maintenance', 'Compliance', 'Environmental'
    sub_category VARCHAR(100),

    -- Content
    policy_objective TEXT NOT NULL,
    policy_scope TEXT NOT NULL,
    policy_content TEXT NOT NULL, -- Full policy text with Markdown support
    procedures TEXT, -- Step-by-step procedures

    -- Compliance & Standards
    regulatory_references TEXT[], -- e.g., 'OSHA 1910.134', 'FMCSA 49 CFR 391', 'EPA Clean Air Act'
    industry_standards TEXT[], -- e.g., 'ISO 9001', 'ANSI Z359', 'NFPA 70E'

    -- Responsibilities
    responsible_roles JSONB, -- {safety_manager: ['Review incidents', 'Approve procedures'], ...}
    approval_required_from VARCHAR(255)[], -- Job titles that must approve

    -- Version Control
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    effective_date DATE NOT NULL,
    review_cycle_months INTEGER DEFAULT 12,
    next_review_date DATE,
    expiration_date DATE,
    supersedes_policy_id INTEGER REFERENCES policy_templates(id),

    -- Status
    status VARCHAR(50) DEFAULT 'Draft', -- 'Draft', 'Pending Approval', 'Active', 'Archived', 'Superseded'
    is_mandatory BOOLEAN DEFAULT TRUE,

    -- Distribution
    applies_to_roles VARCHAR(100)[], -- Which roles must acknowledge this policy
    requires_training BOOLEAN DEFAULT FALSE,
    requires_test BOOLEAN DEFAULT FALSE,
    test_questions JSONB, -- Quiz questions for policy understanding

    -- Attachments & Forms
    related_forms INTEGER[], -- References to form templates
    attachments JSONB, -- {filename, url, description}

    -- Usage Tracking
    times_acknowledged INTEGER DEFAULT 0,
    last_acknowledged_at TIMESTAMP,

    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER,
    approved_at TIMESTAMP,
    approved_by INTEGER
);

-- ============================================================================
-- Employee Policy Acknowledgments
-- ============================================================================

CREATE TABLE IF NOT EXISTS policy_acknowledgments (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES policy_templates(id) NOT NULL,
    employee_id INTEGER REFERENCES drivers(id) NOT NULL,

    -- Acknowledgment Details
    acknowledged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledgment_method VARCHAR(50) DEFAULT 'Electronic', -- 'Electronic', 'Paper', 'In-Person'

    -- Digital Signature
    signature_data TEXT, -- Base64 encoded signature image
    ip_address VARCHAR(50),
    device_info VARCHAR(255),

    -- Understanding Verification
    test_taken BOOLEAN DEFAULT FALSE,
    test_score DECIMAL(5,2),
    test_passed BOOLEAN DEFAULT FALSE,

    -- Training Completion
    training_completed BOOLEAN DEFAULT FALSE,
    training_completed_at TIMESTAMP,
    training_duration_minutes INTEGER,

    -- Status
    is_current BOOLEAN DEFAULT TRUE, -- False when policy is updated
    superseded_by_acknowledgment_id INTEGER REFERENCES policy_acknowledgments(id),

    UNIQUE(policy_id, employee_id, acknowledged_at)
);

-- ============================================================================
-- Pre-Built Policy Templates - Safety
-- ============================================================================

CREATE TABLE IF NOT EXISTS prebuilt_safety_policies (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(255) NOT NULL UNIQUE,
    template_content TEXT NOT NULL,
    customization_fields JSONB, -- Placeholders that need org-specific values
    is_industry_standard BOOLEAN DEFAULT TRUE
);

-- Insert standard safety policies
INSERT INTO prebuilt_safety_policies (template_name, template_content, customization_fields) VALUES
('Vehicle Safety Inspection Policy',
'# Vehicle Safety Inspection Policy

## Purpose
To ensure all company vehicles are maintained in safe operating condition and comply with federal and state regulations.

## Scope
This policy applies to all drivers operating company vehicles and all fleet vehicles regardless of ownership.

## Policy Statement

### Daily Inspections
1. All drivers must complete a pre-trip inspection before operating any vehicle
2. Post-trip inspections must be completed at the end of each shift
3. Any defects must be reported immediately using the Vehicle Defect Report form

### Inspection Requirements
Drivers must inspect the following:
- Brakes (service and parking)
- Steering mechanism
- Lighting devices and reflectors
- Tires (including spare)
- Horn and audible warning devices
- Windshield wipers and washers
- Mirrors
- Seatbelts
- Emergency equipment (fire extinguisher, triangles, first aid kit)

### Reporting Defects
- All defects must be documented immediately
- Critical defects must be reported to dispatch immediately
- Vehicle must be taken out of service until repairs are completed
- No vehicle with critical safety defects may be operated

### Enforcement
- Failure to complete inspections: Written warning (1st), Suspension (2nd), Termination (3rd)
- Operating vehicle with known defects: Immediate suspension pending investigation

### References
- FMCSA 49 CFR 396.11 - Driver vehicle inspection report
- FMCSA 49 CFR 396.13 - Driver inspection

Effective Date: {EFFECTIVE_DATE}
Next Review: {REVIEW_DATE}
Policy Owner: {SAFETY_MANAGER_NAME}',
'{"EFFECTIVE_DATE": "2025-01-01", "REVIEW_DATE": "2026-01-01", "SAFETY_MANAGER_NAME": "Safety Manager", "COMPANY_NAME": "Company Name"}'
),

('Drug and Alcohol Testing Policy',
'# Drug and Alcohol Testing Policy

## Purpose
To maintain a drug and alcohol-free workplace and comply with DOT/FMCSA regulations.

## Scope
All safety-sensitive employees including drivers, mechanics, and dispatchers.

## Policy Statement

### Prohibited Conduct
1. Use, possession, or being under the influence of alcohol while on duty
2. Alcohol consumption within 4 hours of going on duty
3. Use, possession, or being under the influence of controlled substances
4. Refusal to submit to required testing

### Testing Requirements

#### Pre-Employment
All safety-sensitive positions require drug test before first duty assignment.

#### Random Testing
- Minimum 50% of average safety-sensitive employees tested annually for drugs
- Minimum 10% tested annually for alcohol
- Selection must be truly random using approved method

#### Post-Accident
Required after:
- Fatal accident
- Accident requiring towing
- Citation issued to driver

Testing must occur within:
- 2 hours for alcohol (up to 8 hours)
- 32 hours for drugs

#### Reasonable Suspicion
When supervisor trained in detection has reasonable belief employee is impaired.

#### Return-to-Duty
After policy violation, employee must:
- Be evaluated by Substance Abuse Professional (SAP)
- Complete recommended treatment
- Pass return-to-duty test
- Submit to minimum 6 follow-up tests over 12 months

### Consequences
- First violation: Removal from safety-sensitive duties, SAP evaluation required
- Refusal to test: Same as positive test
- Second violation: Termination

### References
- FMCSA 49 CFR Part 382 - Controlled Substances and Alcohol Use and Testing
- DOT 49 CFR Part 40 - Procedures for Transportation Workplace Drug and Alcohol Testing Programs

Effective Date: {EFFECTIVE_DATE}
Policy Owner: {HR_DIRECTOR_NAME}',
'{"EFFECTIVE_DATE": "2025-01-01", "HR_DIRECTOR_NAME": "HR Director", "COMPANY_NAME": "Company Name"}'
),

('Personal Protective Equipment (PPE) Policy',
'# Personal Protective Equipment Policy

## Purpose
To protect employees from workplace hazards through proper use of PPE.

## Scope
All employees exposed to workplace hazards requiring PPE.

## Policy Statement

### Employer Responsibilities
{COMPANY_NAME} will:
1. Perform hazard assessment to identify PPE needs
2. Provide appropriate PPE at no cost to employees
3. Provide training on proper use, maintenance, and limitations
4. Replace damaged or worn PPE

### Employee Responsibilities
Employees must:
1. Wear required PPE at all times in designated areas
2. Inspect PPE before each use
3. Report damaged or ill-fitting PPE immediately
4. Maintain PPE in clean and serviceable condition
5. Follow manufacturer instructions

### Required PPE by Task

#### Vehicle Maintenance
- Safety glasses with side shields
- Steel-toed safety shoes
- Gloves (chemical-resistant when handling fluids)
- Hearing protection (when noise exceeds 85 dB)

#### Hazardous Material Handling
- Chemical-resistant gloves
- Safety goggles or face shield
- Protective apron or coveralls
- Respiratory protection (when required)

#### Tire Service
- Safety glasses
- Steel-toed shoes
- Face shield (for tire inflation)
- Hearing protection

#### Battery Service
- Safety glasses
- Acid-resistant gloves
- Face shield
- Protective apron

### Training Requirements
- Initial training before job assignment
- Retraining when PPE types change
- Annual refresher training

### Enforcement
- Failure to wear required PPE: Progressive discipline
- First offense: Verbal warning
- Second offense: Written warning
- Third offense: Suspension
- Fourth offense: Termination

### References
- OSHA 29 CFR 1910.132 - General requirements for PPE
- OSHA 29 CFR 1910.133 - Eye and face protection
- OSHA 29 CFR 1910.135 - Head protection
- OSHA 29 CFR 1910.136 - Foot protection
- OSHA 29 CFR 1910.138 - Hand protection

Effective Date: {EFFECTIVE_DATE}
Policy Owner: {SAFETY_MANAGER_NAME}',
'{"EFFECTIVE_DATE": "2025-01-01", "SAFETY_MANAGER_NAME": "Safety Manager", "COMPANY_NAME": "Company Name"}'
);

-- ============================================================================
-- Policy Compliance Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS policy_compliance_audits (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES policy_templates(id) NOT NULL,

    -- Audit Details
    audit_date DATE NOT NULL,
    auditor_name VARCHAR(255) NOT NULL,
    audit_type VARCHAR(100) NOT NULL, -- 'Scheduled', 'Random', 'Incident-Triggered', 'Regulatory'

    -- Scope
    location VARCHAR(255),
    department VARCHAR(255),
    employees_audited INTEGER[],
    vehicles_audited INTEGER[],

    -- Findings
    compliance_score DECIMAL(5,2), -- 0-100%
    compliant_items INTEGER DEFAULT 0,
    non_compliant_items INTEGER DEFAULT 0,

    -- Non-Conformances
    findings JSONB, -- Array of {description, severity, responsible_party, corrective_action}

    -- Corrective Actions
    corrective_actions_required BOOLEAN DEFAULT FALSE,
    corrective_actions TEXT[],
    corrective_actions_completed BOOLEAN DEFAULT FALSE,
    corrective_actions_due_date DATE,

    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    follow_up_completed BOOLEAN DEFAULT FALSE,

    -- Attachments
    audit_report_url VARCHAR(500),
    photos_urls TEXT[],

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER
);

-- ============================================================================
-- Policy Violations & Disciplinary Actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS policy_violations (
    id SERIAL PRIMARY KEY,
    policy_id INTEGER REFERENCES policy_templates(id) NOT NULL,
    employee_id INTEGER REFERENCES drivers(id) NOT NULL,

    -- Violation Details
    violation_date DATE NOT NULL,
    violation_time TIME,
    location VARCHAR(255),

    -- Description
    violation_description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL, -- 'Minor', 'Moderate', 'Serious', 'Critical'

    -- Related Entities
    vehicle_id INTEGER REFERENCES vehicles(id),
    related_incident_id INTEGER,

    -- Witness Information
    witnesses VARCHAR(255)[],
    witness_statements TEXT[],

    -- Investigation
    investigation_notes TEXT,
    root_cause TEXT,

    -- Disciplinary Action
    disciplinary_action VARCHAR(100), -- 'Verbal Warning', 'Written Warning', 'Suspension', 'Termination', 'No Action'
    action_description TEXT,
    action_date DATE,
    action_taken_by VARCHAR(255),

    -- Progressive Discipline Tracking
    is_repeat_offense BOOLEAN DEFAULT FALSE,
    previous_violations INTEGER[], -- Array of previous violation IDs
    offense_count INTEGER DEFAULT 1,

    -- Corrective Training
    training_required BOOLEAN DEFAULT FALSE,
    training_completed BOOLEAN DEFAULT FALSE,
    training_completion_date DATE,

    -- Employee Response
    employee_statement TEXT,
    employee_acknowledged BOOLEAN DEFAULT FALSE,
    employee_acknowledged_date DATE,
    employee_signature TEXT, -- Base64 signature

    -- Appeal Process
    appeal_filed BOOLEAN DEFAULT FALSE,
    appeal_date DATE,
    appeal_reason TEXT,
    appeal_decision TEXT,
    appeal_decision_date DATE,

    -- Status
    case_status VARCHAR(50) DEFAULT 'Open', -- 'Open', 'Under Investigation', 'Action Taken', 'Closed', 'Under Appeal'

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_policies_category ON policy_templates(policy_category);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policy_templates(status);
CREATE INDEX IF NOT EXISTS idx_policies_effective_date ON policy_templates(effective_date);
CREATE INDEX IF NOT EXISTS idx_policies_review_date ON policy_templates(next_review_date);

CREATE INDEX IF NOT EXISTS idx_acknowledgments_policy ON policy_acknowledgments(policy_id);
CREATE INDEX IF NOT EXISTS idx_acknowledgments_employee ON policy_acknowledgments(employee_id);
CREATE INDEX IF NOT EXISTS idx_acknowledgments_current ON policy_acknowledgments(is_current);

CREATE INDEX IF NOT EXISTS idx_violations_policy ON policy_violations(policy_id);
CREATE INDEX IF NOT EXISTS idx_violations_employee ON policy_violations(employee_id);
CREATE INDEX IF NOT EXISTS idx_violations_date ON policy_violations(violation_date);
CREATE INDEX IF NOT EXISTS idx_violations_severity ON policy_violations(severity);

CREATE INDEX IF NOT EXISTS idx_audits_policy ON policy_compliance_audits(policy_id);
CREATE INDEX IF NOT EXISTS idx_audits_date ON policy_compliance_audits(audit_date);

-- ============================================================================
-- Views
-- ============================================================================

-- Policies Requiring Review
CREATE OR REPLACE VIEW v_policies_due_for_review AS
SELECT
    id,
    policy_code,
    policy_name,
    policy_category,
    version,
    effective_date,
    next_review_date,
    CASE
        WHEN next_review_date < CURRENT_DATE THEN 'Overdue'
        WHEN next_review_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Due Soon'
        ELSE 'Not Due'
    END AS review_status
FROM policy_templates
WHERE status = 'Active'
    AND next_review_date IS NOT NULL
ORDER BY next_review_date;

-- Employee Compliance Dashboard
CREATE OR REPLACE VIEW v_employee_compliance AS
SELECT
    d.id AS employee_id,
    d.first_name || ' ' || d.last_name AS employee_name,
    COUNT(DISTINCT pt.id) AS total_policies,
    COUNT(DISTINCT pa.policy_id) AS acknowledged_policies,
    COUNT(DISTINCT pt.id) - COUNT(DISTINCT pa.policy_id) AS pending_acknowledgments,
    COUNT(DISTINCT CASE WHEN pv.severity IN ('Serious', 'Critical') THEN pv.id END) AS serious_violations,
    MAX(pa.acknowledged_at) AS last_acknowledgment_date
FROM drivers d
CROSS JOIN policy_templates pt
LEFT JOIN policy_acknowledgments pa ON d.id = pa.employee_id AND pt.id = pa.policy_id AND pa.is_current = TRUE
LEFT JOIN policy_violations pv ON d.id = pv.employee_id
WHERE pt.status = 'Active'
    AND (pt.applies_to_roles IS NULL OR d.role = ANY(pt.applies_to_roles))
GROUP BY d.id, d.first_name, d.last_name;

COMMENT ON TABLE policy_templates IS 'Master library of company policies and procedures with version control';
COMMENT ON TABLE policy_acknowledgments IS 'Employee acknowledgments and training completion for policies';
COMMENT ON TABLE policy_violations IS 'Policy violation tracking and progressive discipline management';
COMMENT ON VIEW v_employee_compliance IS 'Per-employee policy compliance dashboard showing acknowledgments and violations';
