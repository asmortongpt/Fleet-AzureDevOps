-- Migration: Policies, Procedures, and Tracking Devices
-- Purpose: Add comprehensive policy management, SOP tracking, and vehicle device management

-- ============================================
-- POLICIES & PROCEDURES
-- ============================================

-- Safety Policies
CREATE TABLE IF NOT EXISTS safety_policies (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    policy_number VARCHAR(50) NOT NULL,
    policy_name VARCHAR(255) NOT NULL,
    policy_category VARCHAR(100), -- 'driver_safety', 'vehicle_maintenance', 'environmental', 'compliance'
    description TEXT,
    effective_date DATE NOT NULL,
    review_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'under_review', 'archived'
    document_url TEXT,
    created_by INTEGER REFERENCES users(id),
    approved_by INTEGER REFERENCES users(id),
    approval_date TIMESTAMP,
    version VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, policy_number)
);

-- Standard Operating Procedures (SOPs)
CREATE TABLE IF NOT EXISTS procedures (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    procedure_code VARCHAR(50) NOT NULL,
    procedure_name VARCHAR(255) NOT NULL,
    procedure_type VARCHAR(100), -- 'maintenance', 'safety_inspection', 'incident_response', 'driver_training'
    description TEXT,
    steps JSONB, -- Array of procedure steps with details
    related_policy_id INTEGER REFERENCES safety_policies(id),
    frequency VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'annual', 'as_needed'
    estimated_duration_minutes INTEGER,
    requires_certification BOOLEAN DEFAULT FALSE,
    document_url TEXT,
    status VARCHAR(50) DEFAULT 'active',
    version VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, procedure_code)
);

-- Procedure Compliance Tracking
CREATE TABLE IF NOT EXISTS procedure_completions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    procedure_id INTEGER NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    completed_by INTEGER NOT NULL REFERENCES users(id),
    completion_date TIMESTAMP NOT NULL,
    duration_minutes INTEGER,
    notes TEXT,
    verification_signature TEXT,
    attachments JSONB, -- Array of document URLs
    status VARCHAR(50) DEFAULT 'completed', -- 'completed', 'incomplete', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- VEHICLE TRACKING DEVICES
-- ============================================

-- Device Types and Inventory
CREATE TABLE IF NOT EXISTS tracking_devices (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    device_type VARCHAR(100) NOT NULL, -- 'obd2', 'gps_tracker', 'dashcam', 'eld', 'temperature_sensor', 'fuel_sensor', 'tire_pressure'
    manufacturer VARCHAR(100),
    model_number VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    hardware_version VARCHAR(50),
    firmware_version VARCHAR(50),
    purchase_date DATE,
    warranty_expiry_date DATE,
    unit_cost DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'in_stock', -- 'in_stock', 'installed', 'maintenance', 'defective', 'retired'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicle-Device Assignments
CREATE TABLE IF NOT EXISTS vehicle_devices (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    device_id INTEGER NOT NULL REFERENCES tracking_devices(id) ON DELETE CASCADE,
    installation_date TIMESTAMP NOT NULL,
    installed_by INTEGER REFERENCES users(id),
    installation_location VARCHAR(255), -- 'OBD-II port', 'dashboard', 'under_seat', 'rear_window'
    device_identifier VARCHAR(100), -- IMEI, Device ID, MAC address
    sim_card_number VARCHAR(50),
    data_plan_provider VARCHAR(100),
    monthly_cost DECIMAL(10, 2),
    removal_date TIMESTAMP,
    removed_by INTEGER REFERENCES users(id),
    removal_reason TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_communication TIMESTAMP,
    signal_strength INTEGER, -- 0-100
    battery_level INTEGER, -- 0-100 for battery-powered devices
    device_status VARCHAR(50) DEFAULT 'operational', -- 'operational', 'offline', 'malfunction', 'low_battery'
    configuration JSONB, -- Device-specific settings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device Data/Telemetry
CREATE TABLE IF NOT EXISTS device_telemetry (
    id BIGSERIAL PRIMARY KEY,
    vehicle_device_id INTEGER NOT NULL REFERENCES vehicle_devices(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    data_type VARCHAR(100), -- 'location', 'diagnostics', 'fuel', 'temperature', 'tire_pressure'
    raw_data JSONB NOT NULL,
    processed_data JSONB,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    speed INTEGER, -- mph
    heading INTEGER, -- 0-359 degrees
    odometer INTEGER,
    fuel_level DECIMAL(5, 2),
    engine_hours DECIMAL(10, 2),
    diagnostic_codes TEXT[], -- Array of OBD-II codes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for telemetry queries
CREATE INDEX IF NOT EXISTS idx_device_telemetry_vehicle_timestamp
    ON device_telemetry(vehicle_device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_device_telemetry_location
    ON device_telemetry(latitude, longitude) WHERE latitude IS NOT NULL;

-- ============================================
-- COMPLIANCE TRACKING
-- ============================================

-- Compliance Requirements
CREATE TABLE IF NOT EXISTS compliance_requirements (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    requirement_code VARCHAR(100) NOT NULL,
    requirement_name VARCHAR(255) NOT NULL,
    regulatory_body VARCHAR(255), -- 'FMCSA', 'DOT', 'EPA', 'OSHA', 'State DMV'
    category VARCHAR(100), -- 'vehicle_inspection', 'driver_qualification', 'hours_of_service', 'environmental'
    description TEXT,
    frequency VARCHAR(50), -- 'daily', 'weekly', 'monthly', 'quarterly', 'annual'
    applies_to VARCHAR(50), -- 'vehicles', 'drivers', 'both'
    penalty_for_non_compliance TEXT,
    document_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, requirement_code)
);

-- Compliance Status Tracking
CREATE TABLE IF NOT EXISTS compliance_records (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    requirement_id INTEGER NOT NULL REFERENCES compliance_requirements(id) ON DELETE CASCADE,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    completion_date DATE,
    completed_by INTEGER REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'overdue', 'waived'
    compliance_percentage INTEGER, -- 0-100
    notes TEXT,
    attachments JSONB,
    next_due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TRAINING & CERTIFICATIONS
-- ============================================

-- Training Programs
CREATE TABLE IF NOT EXISTS training_programs (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    program_code VARCHAR(100) NOT NULL,
    program_name VARCHAR(255) NOT NULL,
    program_type VARCHAR(100), -- 'safety', 'defensive_driving', 'hazmat', 'equipment_operation'
    description TEXT,
    duration_hours DECIMAL(5, 2),
    certification_valid_years INTEGER,
    is_required BOOLEAN DEFAULT FALSE,
    required_for_roles TEXT[], -- Array of roles: ['driver', 'mechanic']
    training_provider VARCHAR(255),
    cost_per_person DECIMAL(10, 2),
    online_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, program_code)
);

-- Training Completions
CREATE TABLE IF NOT EXISTS training_completions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    program_id INTEGER NOT NULL REFERENCES training_programs(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    driver_id INTEGER REFERENCES drivers(id),
    completion_date DATE NOT NULL,
    expiration_date DATE,
    score DECIMAL(5, 2), -- Percentage score if applicable
    certification_number VARCHAR(100),
    instructor_name VARCHAR(255),
    training_location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'current', -- 'current', 'expired', 'pending_renewal'
    certificate_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_safety_policies_tenant ON safety_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_safety_policies_status ON safety_policies(status);
CREATE INDEX IF NOT EXISTS idx_procedures_tenant ON procedures(tenant_id);
CREATE INDEX IF NOT EXISTS idx_procedure_completions_vehicle ON procedure_completions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_procedure_completions_driver ON procedure_completions(driver_id);
CREATE INDEX IF NOT EXISTS idx_tracking_devices_tenant ON tracking_devices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tracking_devices_status ON tracking_devices(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_devices_vehicle ON vehicle_devices(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_devices_active ON vehicle_devices(is_active);
CREATE INDEX IF NOT EXISTS idx_compliance_records_vehicle ON compliance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_driver ON compliance_records(driver_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_status ON compliance_records(status);
CREATE INDEX IF NOT EXISTS idx_training_completions_user ON training_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_completions_driver ON training_completions(driver_id);

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Active Vehicle Devices View
CREATE OR REPLACE VIEW v_active_vehicle_devices AS
SELECT
    vd.id,
    vd.tenant_id,
    v.unit_number,
    v.make,
    v.model,
    td.device_type,
    td.manufacturer,
    td.model_number,
    vd.device_identifier,
    vd.installation_date,
    vd.last_communication,
    vd.device_status,
    vd.battery_level,
    vd.signal_strength,
    EXTRACT(DAY FROM CURRENT_TIMESTAMP - vd.last_communication) as days_since_last_comm
FROM vehicle_devices vd
JOIN vehicles v ON vd.vehicle_id = v.id
JOIN tracking_devices td ON vd.device_id = td.id
WHERE vd.is_active = TRUE;

-- Compliance Dashboard View
CREATE OR REPLACE VIEW v_compliance_dashboard AS
SELECT
    cr.tenant_id,
    req.requirement_name,
    req.regulatory_body,
    req.category,
    COUNT(*) as total_items,
    COUNT(CASE WHEN cr.status = 'completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN cr.status = 'overdue' THEN 1 END) as overdue_count,
    COUNT(CASE WHEN cr.status = 'pending' THEN 1 END) as pending_count,
    ROUND(AVG(cr.compliance_percentage), 2) as avg_compliance_percentage
FROM compliance_records cr
JOIN compliance_requirements req ON cr.requirement_id = req.id
WHERE req.is_active = TRUE
GROUP BY cr.tenant_id, req.requirement_name, req.regulatory_body, req.category;

-- Training Status View
CREATE OR REPLACE VIEW v_training_status AS
SELECT
    tc.tenant_id,
    u.first_name || ' ' || u.last_name as employee_name,
    u.role,
    tp.program_name,
    tc.completion_date,
    tc.expiration_date,
    tc.status,
    CASE
        WHEN tc.expiration_date < CURRENT_DATE THEN 'Expired'
        WHEN tc.expiration_date < CURRENT_DATE + INTERVAL '30 days' THEN 'Expiring Soon'
        ELSE 'Current'
    END as expiration_status
FROM training_completions tc
JOIN users u ON tc.user_id = u.id
JOIN training_programs tp ON tc.program_id = tp.id
WHERE tp.is_active = TRUE;

COMMENT ON TABLE safety_policies IS 'Fleet safety policies and regulations';
COMMENT ON TABLE procedures IS 'Standard operating procedures (SOPs) for fleet operations';
COMMENT ON TABLE procedure_completions IS 'Tracking of procedure execution and compliance';
COMMENT ON TABLE tracking_devices IS 'Inventory of OBD2, GPS, and other tracking devices';
COMMENT ON TABLE vehicle_devices IS 'Assignment of tracking devices to vehicles';
COMMENT ON TABLE device_telemetry IS 'Telemetry data from vehicle devices';
COMMENT ON TABLE compliance_requirements IS 'Regulatory compliance requirements';
COMMENT ON TABLE compliance_records IS 'Tracking of compliance status';
COMMENT ON TABLE training_programs IS 'Available training and certification programs';
COMMENT ON TABLE training_completions IS 'Employee training completion records';
