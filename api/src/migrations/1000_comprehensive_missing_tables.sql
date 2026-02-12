-- ============================================================================
-- COMPREHENSIVE MISSING TABLES MIGRATION
-- ============================================================================
-- Created: 2026-01-29
-- Purpose: Add ALL missing tables for 100% endpoint functionality
-- Impact: Fixes remaining broken endpoints across all modules
-- ============================================================================

-- ============================================================================
-- ASSET MANAGEMENT TABLES
-- ============================================================================

-- Assets (general asset tracking beyond vehicles)
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Asset identification
    asset_number VARCHAR(100) NOT NULL,
    asset_name VARCHAR(255) NOT NULL,
    asset_type VARCHAR(50) NOT NULL, -- equipment, tool, trailer, container, etc.

    -- Details
    description TEXT,
    manufacturer VARCHAR(255),
    model VARCHAR(255),
    serial_number VARCHAR(255),

    -- Ownership
    ownership_type VARCHAR(50) DEFAULT 'owned', -- owned, leased, rented
    acquisition_date DATE,
    acquisition_cost DECIMAL(12,2),

    -- Location
    current_location VARCHAR(255),
    facility_id UUID REFERENCES facilities(id),
    gps_latitude DECIMAL(10,8),
    gps_longitude DECIMAL(11,8),

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, maintenance, disposed
    condition VARCHAR(50), -- excellent, good, fair, poor

    -- Assignment
    assigned_to UUID REFERENCES users(id),
    assigned_at TIMESTAMP,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),

    UNIQUE(tenant_id, asset_number)
);

CREATE INDEX IF NOT EXISTS idx_assets_tenant ON assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_assigned ON assets(assigned_to);

-- Asset Analytics
CREATE TABLE IF NOT EXISTS asset_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,

    -- Time period
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,

    -- Utilization metrics
    hours_used DECIMAL(10,2),
    utilization_percentage DECIMAL(5,2),
    downtime_hours DECIMAL(10,2),

    -- Cost metrics
    maintenance_cost DECIMAL(12,2) DEFAULT 0,
    operating_cost DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0,

    -- Performance
    incidents_count INTEGER DEFAULT 0,
    maintenance_count INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_analytics_tenant ON asset_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asset_analytics_asset ON asset_analytics(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_analytics_period ON asset_analytics(period_start, period_end);

-- Heavy Equipment
CREATE TABLE IF NOT EXISTS heavy_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,

    -- Equipment details
    equipment_type VARCHAR(100) NOT NULL, -- excavator, bulldozer, crane, loader, etc.
    model_year INTEGER,
    engine_hours DECIMAL(10,2),
    engine_type VARCHAR(50),

    -- Capacity
    weight_capacity_lbs DECIMAL(10,2),
    load_capacity DECIMAL(10,2),
    reach_distance_ft DECIMAL(10,2),

    -- Certifications
    inspection_required BOOLEAN DEFAULT true,
    last_inspection_date DATE,
    next_inspection_date DATE,
    certification_number VARCHAR(100),

    -- Operator requirements
    requires_certification BOOLEAN DEFAULT true,
    operator_license_type VARCHAR(50),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_heavy_equipment_tenant ON heavy_equipment(tenant_id);
CREATE INDEX IF NOT EXISTS idx_heavy_equipment_asset ON heavy_equipment(asset_id);
CREATE INDEX IF NOT EXISTS idx_heavy_equipment_type ON heavy_equipment(equipment_type);

-- Mobile Assets
CREATE TABLE IF NOT EXISTS mobile_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,

    -- Mobile device details
    device_type VARCHAR(50) NOT NULL, -- smartphone, tablet, laptop, radio
    device_make VARCHAR(100),
    device_model VARCHAR(100),

    -- Device identifiers
    imei VARCHAR(50),
    serial_number VARCHAR(100),
    phone_number VARCHAR(20),

    -- Carrier/Plan
    carrier VARCHAR(100),
    plan_type VARCHAR(100),
    monthly_cost DECIMAL(10,2),

    -- Assignment
    assigned_user_id UUID REFERENCES users(id),
    assigned_date DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, lost, damaged

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobile_assets_tenant ON mobile_assets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mobile_assets_user ON mobile_assets(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_assets_type ON mobile_assets(device_type);

-- ============================================================================
-- MAINTENANCE & INSPECTION TABLES
-- ============================================================================

-- Incidents
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Incident details
    incident_number VARCHAR(100) NOT NULL,
    incident_type VARCHAR(50) NOT NULL, -- accident, breakdown, vandalism, theft, damage
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical

    -- Vehicle/Asset involved
    vehicle_id UUID REFERENCES vehicles(id),
    asset_id UUID REFERENCES assets(id),
    driver_id UUID REFERENCES drivers(id),

    -- Location
    location VARCHAR(500),
    gps_latitude DECIMAL(10,8),
    gps_longitude DECIMAL(11,8),

    -- Timing
    incident_date TIMESTAMP NOT NULL,
    reported_date TIMESTAMP DEFAULT NOW(),

    -- Description
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cause TEXT,

    -- Impact
    injuries_count INTEGER DEFAULT 0,
    fatalities_count INTEGER DEFAULT 0,
    estimated_cost DECIMAL(12,2),
    downtime_hours DECIMAL(10,2),

    -- Response
    status VARCHAR(20) DEFAULT 'open', -- open, investigating, resolved, closed
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to UUID REFERENCES users(id),

    -- Documentation
    police_report_number VARCHAR(100),
    insurance_claim_number VARCHAR(100),
    photos JSONB DEFAULT '[]',
    documents JSONB DEFAULT '[]',

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),

    UNIQUE(tenant_id, incident_number)
);

CREATE INDEX IF NOT EXISTS idx_incidents_tenant ON incidents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_incidents_vehicle ON incidents(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_incidents_driver ON incidents(driver_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_date ON incidents(incident_date DESC);

-- Maintenance Requests
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Request details
    request_number VARCHAR(100) NOT NULL,
    request_type VARCHAR(50) NOT NULL, -- scheduled, unscheduled, repair, inspection
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent

    -- Vehicle/Asset
    vehicle_id UUID REFERENCES vehicles(id),
    asset_id UUID REFERENCES assets(id),

    -- Issue
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    issue_category VARCHAR(100),

    -- Requester
    requested_by UUID REFERENCES users(id),
    driver_id UUID REFERENCES drivers(id),

    -- Scheduling
    requested_date TIMESTAMP DEFAULT NOW(),
    scheduled_date TIMESTAMP,
    completed_date TIMESTAMP,

    -- Assignment
    assigned_to UUID REFERENCES users(id),
    facility_id UUID REFERENCES facilities(id),

    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, scheduled, in_progress, completed, cancelled

    -- Work performed
    work_performed TEXT,
    parts_used JSONB DEFAULT '[]',
    labor_hours DECIMAL(10,2),
    total_cost DECIMAL(12,2),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(tenant_id, request_number)
);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant ON maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_vehicle ON maintenance_requests(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_priority ON maintenance_requests(priority);

-- Predictive Maintenance
CREATE TABLE IF NOT EXISTS predictive_maintenance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Vehicle/Asset
    vehicle_id UUID REFERENCES vehicles(id),
    asset_id UUID REFERENCES assets(id),

    -- Prediction
    prediction_type VARCHAR(50) NOT NULL, -- component_failure, service_due, wear_threshold
    component VARCHAR(100),
    predicted_failure_date DATE,
    confidence_score DECIMAL(5,2), -- 0-100

    -- Current metrics
    current_value DECIMAL(10,2),
    threshold_value DECIMAL(10,2),
    unit_of_measure VARCHAR(50),

    -- Recommendation
    recommendation TEXT,
    recommended_action VARCHAR(100),
    estimated_cost DECIMAL(12,2),

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, acknowledged, scheduled, completed, dismissed
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP,

    -- Metadata
    model_version VARCHAR(50),
    data_sources JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_tenant ON predictive_maintenance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_vehicle ON predictive_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_status ON predictive_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_predictive_maintenance_date ON predictive_maintenance(predicted_failure_date);

-- ============================================================================
-- SCHEDULING & CALENDAR TABLES
-- ============================================================================

-- Schedules
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Schedule details
    schedule_name VARCHAR(255) NOT NULL,
    schedule_type VARCHAR(50) NOT NULL, -- maintenance, inspection, shift, route, reservation

    -- Entity
    entity_type VARCHAR(50), -- vehicle, driver, asset, facility
    entity_id UUID,

    -- Recurrence
    recurrence_pattern VARCHAR(20), -- once, daily, weekly, monthly, yearly
    recurrence_interval INTEGER DEFAULT 1,
    recurrence_days JSONB, -- [0,1,2,3,4,5,6] for days of week

    -- Start/End
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,

    -- Assignment
    assigned_to UUID REFERENCES users(id),
    team_id UUID REFERENCES teams(id),

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, paused, completed, cancelled
    is_active BOOLEAN DEFAULT true,

    -- Notifications
    notify_before_minutes INTEGER DEFAULT 60,
    notification_enabled BOOLEAN DEFAULT true,

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_schedules_tenant ON schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schedules_entity ON schedules(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_schedules_assigned ON schedules(assigned_to);
CREATE INDEX IF NOT EXISTS idx_schedules_dates ON schedules(start_date, end_date);

-- Calendar Events
CREATE TABLE IF NOT EXISTS calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Event details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL, -- meeting, maintenance, inspection, training, shift

    -- Timing
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    all_day BOOLEAN DEFAULT false,
    timezone VARCHAR(50) DEFAULT 'America/New_York',

    -- Location
    location VARCHAR(500),
    facility_id UUID REFERENCES facilities(id),

    -- Participants
    organizer_id UUID REFERENCES users(id),
    attendees JSONB DEFAULT '[]', -- [{user_id, response}]

    -- Related entities
    vehicle_id UUID REFERENCES vehicles(id),
    asset_id UUID REFERENCES assets(id),
    schedule_id UUID REFERENCES schedules(id),

    -- Reminders
    reminder_minutes INTEGER DEFAULT 15,
    reminder_sent BOOLEAN DEFAULT false,

    -- Status
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_tenant ON calendar_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_time ON calendar_events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_organizer ON calendar_events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);

-- On-Call Management
CREATE TABLE IF NOT EXISTS on_call_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Shift details
    shift_name VARCHAR(255) NOT NULL,
    shift_type VARCHAR(50) DEFAULT 'on_call', -- on_call, emergency, standby

    -- Assignment
    user_id UUID NOT NULL REFERENCES users(id),
    team_id UUID REFERENCES teams(id),
    role VARCHAR(50),

    -- Timing
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,

    -- Contact
    primary_phone VARCHAR(50),
    secondary_phone VARCHAR(50),
    is_primary BOOLEAN DEFAULT true,

    -- Status
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, active, completed, cancelled

    -- Coverage
    backup_user_id UUID REFERENCES users(id),

    -- Tracking
    calls_received INTEGER DEFAULT 0,
    incidents_responded INTEGER DEFAULT 0,

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_on_call_shifts_tenant ON on_call_shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_on_call_shifts_user ON on_call_shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_on_call_shifts_time ON on_call_shifts(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_on_call_shifts_status ON on_call_shifts(status);

-- ============================================================================
-- MOBILE INTEGRATION TABLES
-- ============================================================================

-- Mobile Assignments
CREATE TABLE IF NOT EXISTS mobile_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Assignment
    user_id UUID NOT NULL REFERENCES users(id),
    mobile_asset_id UUID REFERENCES mobile_assets(id),

    -- Assignment period
    assigned_date TIMESTAMP DEFAULT NOW(),
    return_date TIMESTAMP,

    -- Device details at assignment
    device_condition VARCHAR(50),
    accessories JSONB DEFAULT '[]',

    -- Agreement
    agreement_signed BOOLEAN DEFAULT false,
    agreement_date TIMESTAMP,

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, returned, lost, damaged

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobile_assignments_tenant ON mobile_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mobile_assignments_user ON mobile_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_assignments_status ON mobile_assignments(status);

-- Mobile Hardware
CREATE TABLE IF NOT EXISTS mobile_hardware (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Hardware details
    hardware_type VARCHAR(50) NOT NULL, -- tablet_mount, charger, case, screen_protector
    manufacturer VARCHAR(100),
    model VARCHAR(100),

    -- Inventory
    quantity_available INTEGER DEFAULT 0,
    quantity_total INTEGER DEFAULT 0,

    -- Cost
    unit_cost DECIMAL(10,2),

    -- Location
    storage_location VARCHAR(255),
    facility_id UUID REFERENCES facilities(id),

    -- Status
    status VARCHAR(20) DEFAULT 'available', -- available, assigned, depleted, discontinued

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobile_hardware_tenant ON mobile_hardware(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mobile_hardware_type ON mobile_hardware(hardware_type);
CREATE INDEX IF NOT EXISTS idx_mobile_hardware_status ON mobile_hardware(status);

-- Mobile Photos
CREATE TABLE IF NOT EXISTS mobile_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Photo metadata
    photo_type VARCHAR(50) NOT NULL, -- inspection, damage, delivery, odometer, fuel

    -- Uploaded by
    uploaded_by UUID REFERENCES users(id),
    driver_id UUID REFERENCES drivers(id),

    -- Related entities
    vehicle_id UUID REFERENCES vehicles(id),
    asset_id UUID REFERENCES assets(id),
    inspection_id UUID REFERENCES inspections(id),
    incident_id UUID REFERENCES incidents(id),

    -- File details
    file_url VARCHAR(1000) NOT NULL,
    file_path VARCHAR(500),
    file_size_bytes INTEGER,
    mime_type VARCHAR(100),

    -- Image metadata
    width INTEGER,
    height INTEGER,

    -- Location
    gps_latitude DECIMAL(10,8),
    gps_longitude DECIMAL(11,8),
    location_description VARCHAR(500),

    -- Timing
    captured_at TIMESTAMP DEFAULT NOW(),

    -- Processing
    processed BOOLEAN DEFAULT false,
    ai_analysis JSONB,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobile_photos_tenant ON mobile_photos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mobile_photos_vehicle ON mobile_photos(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_mobile_photos_type ON mobile_photos(photo_type);
CREATE INDEX IF NOT EXISTS idx_mobile_photos_captured ON mobile_photos(captured_at DESC);

-- Mobile Trips
CREATE TABLE IF NOT EXISTS mobile_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Trip details
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),

    -- Timing
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INTEGER,

    -- Location
    start_location VARCHAR(500),
    end_location VARCHAR(500),
    start_gps_latitude DECIMAL(10,8),
    start_gps_longitude DECIMAL(11,8),
    end_gps_latitude DECIMAL(10,8),
    end_gps_longitude DECIMAL(11,8),

    -- Odometer
    start_odometer DECIMAL(10,2),
    end_odometer DECIMAL(10,2),
    distance_miles DECIMAL(10,2),

    -- Purpose
    trip_purpose VARCHAR(255),
    trip_type VARCHAR(50), -- business, personal, commute

    -- Route
    route_polyline TEXT,
    waypoints JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, cancelled

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mobile_trips_tenant ON mobile_trips(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mobile_trips_vehicle ON mobile_trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_mobile_trips_driver ON mobile_trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_mobile_trips_start ON mobile_trips(start_time DESC);

-- Push Notification Subscriptions
CREATE TABLE IF NOT EXISTS push_notification_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- User
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Device
    device_token VARCHAR(500) NOT NULL,
    device_type VARCHAR(20) NOT NULL, -- ios, android, web
    device_id VARCHAR(255),

    -- Platform details
    platform_endpoint VARCHAR(1000),

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP,

    -- Preferences
    notification_preferences JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(user_id, device_token)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_tenant ON push_notification_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_notification_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_notification_subscriptions(is_active) WHERE is_active = true;

-- ============================================================================
-- VEHICLE MANAGEMENT TABLES
-- ============================================================================

-- Vehicle Assignments
CREATE TABLE IF NOT EXISTS vehicle_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Assignment
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),

    -- Assignment period
    assigned_date DATE NOT NULL,
    return_date DATE,

    -- Assignment type
    assignment_type VARCHAR(50) DEFAULT 'temporary', -- permanent, temporary, pool, shared

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, completed, cancelled
    is_primary_assignment BOOLEAN DEFAULT true,

    -- Usage limits
    max_personal_miles INTEGER,
    max_commute_days INTEGER,

    -- Agreement
    agreement_signed BOOLEAN DEFAULT false,
    agreement_date TIMESTAMP,

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_tenant ON vehicle_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_vehicle ON vehicle_assignments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_driver ON vehicle_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_assignments_status ON vehicle_assignments(status);

-- Vehicle History
CREATE TABLE IF NOT EXISTS vehicle_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Vehicle
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),

    -- Event details
    event_type VARCHAR(50) NOT NULL, -- assignment, maintenance, inspection, incident, fuel, odometer
    event_date TIMESTAMP NOT NULL,

    -- Description
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Related entities
    driver_id UUID REFERENCES drivers(id),
    user_id UUID REFERENCES users(id),

    -- Event data
    event_data JSONB DEFAULT '{}',

    -- Documents
    attachments JSONB DEFAULT '[]',

    created_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_history_tenant ON vehicle_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_history_vehicle ON vehicle_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_history_type ON vehicle_history(event_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_history_date ON vehicle_history(event_date DESC);

-- Vehicle 3D Models
CREATE TABLE IF NOT EXISTS vehicle_3d_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Vehicle
    vehicle_id UUID REFERENCES vehicles(id),

    -- Model details
    model_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(50), -- glb, gltf, obj, fbx

    -- File
    file_url VARCHAR(1000) NOT NULL,
    file_path VARCHAR(500),
    file_size_bytes INTEGER,

    -- Metadata
    thumbnail_url VARCHAR(1000),
    poly_count INTEGER,

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, archived, processing

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_3d_models_tenant ON vehicle_3d_models(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_3d_models_vehicle ON vehicle_3d_models(vehicle_id);

-- Damage Records
CREATE TABLE IF NOT EXISTS damage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Vehicle
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),

    -- Damage details
    damage_type VARCHAR(50) NOT NULL, -- scratch, dent, crack, broken, missing
    severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, severe

    -- Location on vehicle
    damage_location VARCHAR(100), -- front_bumper, driver_door, windshield, etc.
    damage_area JSONB, -- {x, y, width, height} for visual mapping

    -- Description
    description TEXT NOT NULL,

    -- Discovery
    discovered_by UUID REFERENCES users(id),
    driver_id UUID REFERENCES drivers(id),
    discovered_date TIMESTAMP DEFAULT NOW(),

    -- Related incident
    incident_id UUID REFERENCES incidents(id),

    -- Photos
    photos JSONB DEFAULT '[]',
    ai_damage_assessment JSONB,

    -- Repair
    repair_status VARCHAR(20) DEFAULT 'pending', -- pending, scheduled, in_progress, completed, deferred
    estimated_cost DECIMAL(12,2),
    actual_cost DECIMAL(12,2),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_damage_records_tenant ON damage_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_damage_records_vehicle ON damage_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_damage_records_status ON damage_records(repair_status);

-- Damage Reports
CREATE TABLE IF NOT EXISTS damage_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Report details
    report_number VARCHAR(100) NOT NULL,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),

    -- Reporter
    reported_by UUID REFERENCES users(id),
    driver_id UUID REFERENCES drivers(id),
    report_date TIMESTAMP DEFAULT NOW(),

    -- Incident details
    incident_date TIMESTAMP NOT NULL,
    location VARCHAR(500),

    -- Damage summary
    damage_summary TEXT NOT NULL,
    damage_count INTEGER DEFAULT 1,

    -- Related records
    damage_records JSONB DEFAULT '[]',
    incident_id UUID REFERENCES incidents(id),

    -- Photos
    photos JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(20) DEFAULT 'submitted', -- submitted, reviewed, approved, rejected
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,

    -- Cost
    estimated_total_cost DECIMAL(12,2),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(tenant_id, report_number)
);

CREATE INDEX IF NOT EXISTS idx_damage_reports_tenant ON damage_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_vehicle ON damage_reports(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_status ON damage_reports(status);

-- LiDAR Scans
CREATE TABLE IF NOT EXISTS lidar_scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Vehicle
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),

    -- Scan details
    scan_date TIMESTAMP DEFAULT NOW(),
    scan_type VARCHAR(50) DEFAULT 'damage_assessment', -- damage_assessment, inspection, baseline

    -- Files
    scan_file_url VARCHAR(1000) NOT NULL,
    scan_file_path VARCHAR(500),
    file_size_bytes INTEGER,

    -- Processing
    processed BOOLEAN DEFAULT false,
    processing_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed

    -- Results
    point_count INTEGER,
    scan_quality_score DECIMAL(5,2),
    detected_damages JSONB DEFAULT '[]',

    -- Analysis
    ai_analysis JSONB,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_lidar_scans_tenant ON lidar_scans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lidar_scans_vehicle ON lidar_scans(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_lidar_scans_date ON lidar_scans(scan_date DESC);

-- Trip Usage
CREATE TABLE IF NOT EXISTS trip_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Vehicle and driver
    vehicle_id UUID NOT NULL REFERENCES vehicles(id),
    driver_id UUID NOT NULL REFERENCES drivers(id),

    -- Trip summary
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Usage metrics
    total_trips INTEGER DEFAULT 0,
    total_miles DECIMAL(10,2) DEFAULT 0,
    total_hours DECIMAL(10,2) DEFAULT 0,

    -- Trip categorization
    business_miles DECIMAL(10,2) DEFAULT 0,
    personal_miles DECIMAL(10,2) DEFAULT 0,
    commute_miles DECIMAL(10,2) DEFAULT 0,

    -- Cost allocation
    fuel_cost DECIMAL(10,2) DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trip_usage_tenant ON trip_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trip_usage_vehicle ON trip_usage(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trip_usage_driver ON trip_usage(driver_id);
CREATE INDEX IF NOT EXISTS idx_trip_usage_period ON trip_usage(period_start, period_end);

-- ============================================================================
-- COMPLIANCE TABLES
-- ============================================================================

-- Annual Reauthorizations
CREATE TABLE IF NOT EXISTS annual_reauthorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Driver
    driver_id UUID NOT NULL REFERENCES drivers(id),

    -- Period
    authorization_year INTEGER NOT NULL,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,

    -- Requirements
    license_verified BOOLEAN DEFAULT false,
    mvr_reviewed BOOLEAN DEFAULT false,
    training_completed BOOLEAN DEFAULT false,
    medical_clearance BOOLEAN DEFAULT false,

    -- Documents
    documents JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, expired
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,

    -- Notes
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(tenant_id, driver_id, authorization_year)
);

CREATE INDEX IF NOT EXISTS idx_annual_reauth_tenant ON annual_reauthorizations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_annual_reauth_driver ON annual_reauthorizations(driver_id);
CREATE INDEX IF NOT EXISTS idx_annual_reauth_year ON annual_reauthorizations(authorization_year);

-- OSHA Logs
CREATE TABLE IF NOT EXISTS osha_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- OSHA case details
    case_number VARCHAR(100) NOT NULL,
    incident_date DATE NOT NULL,

    -- Employee
    employee_id UUID REFERENCES users(id),
    employee_name VARCHAR(255),
    job_title VARCHAR(255),

    -- Incident details
    incident_description TEXT NOT NULL,
    body_part_affected VARCHAR(100),
    injury_type VARCHAR(100),

    -- Classification
    is_recordable BOOLEAN DEFAULT true,
    is_lost_time BOOLEAN DEFAULT false,
    days_away_from_work INTEGER DEFAULT 0,
    days_restricted_duty INTEGER DEFAULT 0,

    -- Location
    location VARCHAR(500),

    -- Vehicle if applicable
    vehicle_id UUID REFERENCES vehicles(id),

    -- Reporting
    reported_date DATE DEFAULT CURRENT_DATE,
    reported_by UUID REFERENCES users(id),

    -- Status
    status VARCHAR(20) DEFAULT 'open', -- open, investigating, closed

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(tenant_id, case_number)
);

CREATE INDEX IF NOT EXISTS idx_osha_logs_tenant ON osha_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_osha_logs_employee ON osha_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_osha_logs_date ON osha_logs(incident_date DESC);

-- ============================================================================
-- POLICY TABLES
-- ============================================================================

-- Policy Templates
CREATE TABLE IF NOT EXISTS policy_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL for system templates

    -- Template details
    template_name VARCHAR(255) NOT NULL,
    template_category VARCHAR(100),
    description TEXT,

    -- Content
    policy_text TEXT NOT NULL,
    policy_version VARCHAR(50) DEFAULT '1.0',

    -- Applicability
    applies_to VARCHAR(50), -- drivers, all_employees, managers, etc.
    is_mandatory BOOLEAN DEFAULT true,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_system_template BOOLEAN DEFAULT false,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_policy_templates_tenant ON policy_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policy_templates_category ON policy_templates(template_category);
CREATE INDEX IF NOT EXISTS idx_policy_templates_active ON policy_templates(is_active) WHERE is_active = true;

-- Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Permission details
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    permission_code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,

    -- Category
    resource VARCHAR(100) NOT NULL, -- vehicles, drivers, maintenance, etc.
    action VARCHAR(50) NOT NULL, -- create, read, update, delete, approve, etc.

    -- Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);

-- Role Permissions (junction table)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,

    created_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

-- ============================================================================
-- AUTHENTICATION TABLES
-- ============================================================================

-- Break Glass Access
CREATE TABLE IF NOT EXISTS break_glass_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Access details
    user_id UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,

    -- Timing
    access_granted_at TIMESTAMP DEFAULT NOW(),
    access_expires_at TIMESTAMP NOT NULL,
    access_revoked_at TIMESTAMP,

    -- Authorization
    authorized_by UUID REFERENCES users(id),

    -- Access level
    elevated_permissions JSONB DEFAULT '[]',

    -- Audit trail
    actions_performed JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(20) DEFAULT 'active', -- active, expired, revoked

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_break_glass_tenant ON break_glass_access(tenant_id);
CREATE INDEX IF NOT EXISTS idx_break_glass_user ON break_glass_access(user_id);
CREATE INDEX IF NOT EXISTS idx_break_glass_status ON break_glass_access(status);

-- Auth Sessions (for session management)
CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- User
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Session details
    session_token VARCHAR(500) NOT NULL UNIQUE,
    device_id VARCHAR(255),
    device_type VARCHAR(50),

    -- IP and location
    ip_address VARCHAR(50),
    user_agent TEXT,

    -- Timing
    created_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,

    -- Status
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMP,
    revoked_by UUID REFERENCES users(id),

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_tenant ON auth_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_active ON auth_sessions(is_active) WHERE is_active = true;

-- ============================================================================
-- SEARCH TABLES
-- ============================================================================

-- Search Indexes
CREATE TABLE IF NOT EXISTS search_indexes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Entity being indexed
    entity_type VARCHAR(50) NOT NULL, -- vehicle, driver, document, maintenance, etc.
    entity_id UUID NOT NULL,

    -- Search content
    search_vector TSVECTOR,
    indexed_content TEXT,

    -- Metadata
    entity_data JSONB DEFAULT '{}',

    -- Indexing
    last_indexed_at TIMESTAMP DEFAULT NOW(),
    index_version INTEGER DEFAULT 1,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_indexes_tenant ON search_indexes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_search_indexes_entity ON search_indexes(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_search_indexes_vector ON search_indexes USING gin(search_vector);

-- ============================================================================
-- PRESENCE TABLES
-- ============================================================================

-- User Presence
CREATE TABLE IF NOT EXISTS user_presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- User
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Presence status
    status VARCHAR(20) DEFAULT 'offline', -- online, away, busy, offline
    custom_status VARCHAR(255),

    -- Last activity
    last_seen_at TIMESTAMP DEFAULT NOW(),
    last_activity_type VARCHAR(50),

    -- Current location (if mobile)
    current_latitude DECIMAL(10,8),
    current_longitude DECIMAL(11,8),
    location_updated_at TIMESTAMP,

    -- Device
    device_type VARCHAR(50),

    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_presence_tenant ON user_presence(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_user ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);

-- Presence Sessions
CREATE TABLE IF NOT EXISTS presence_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- User
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Session
    session_start TIMESTAMP DEFAULT NOW(),
    session_end TIMESTAMP,

    -- Duration
    duration_minutes INTEGER,

    -- Device
    device_type VARCHAR(50),
    device_id VARCHAR(255),

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presence_sessions_tenant ON presence_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_presence_sessions_user ON presence_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_presence_sessions_start ON presence_sessions(session_start DESC);

-- ============================================================================
-- STORAGE TABLES
-- ============================================================================

-- Storage Files
CREATE TABLE IF NOT EXISTS storage_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- File details
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL UNIQUE,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100),

    -- Storage location
    storage_provider VARCHAR(50) DEFAULT 'azure_blob', -- azure_blob, s3, local
    container_name VARCHAR(255),
    blob_name VARCHAR(1000),

    -- Uploaded by
    uploaded_by UUID REFERENCES users(id),

    -- Related entity
    entity_type VARCHAR(50),
    entity_id UUID,

    -- Access
    is_public BOOLEAN DEFAULT false,
    access_url VARCHAR(1000),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storage_files_tenant ON storage_files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_storage_files_entity ON storage_files(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_storage_files_uploaded ON storage_files(uploaded_by);

-- Storage Metadata
CREATE TABLE IF NOT EXISTS storage_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id UUID NOT NULL REFERENCES storage_files(id) ON DELETE CASCADE,

    -- Image metadata
    width INTEGER,
    height INTEGER,

    -- Document metadata
    page_count INTEGER,

    -- Video metadata
    duration_seconds INTEGER,

    -- Processing
    processed BOOLEAN DEFAULT false,
    processing_status VARCHAR(20),

    -- Thumbnails
    thumbnail_url VARCHAR(1000),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storage_metadata_file ON storage_metadata(file_id);

-- ============================================================================
-- INTEGRATION TABLES
-- ============================================================================

-- SmartCar Vehicles
CREATE TABLE IF NOT EXISTS smartcar_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Fleet vehicle
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,

    -- SmartCar details
    smartcar_vehicle_id VARCHAR(255) NOT NULL UNIQUE,

    -- OAuth
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,

    -- Vehicle info
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    vin VARCHAR(50),

    -- Connection status
    connected BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(tenant_id, vehicle_id)
);

CREATE INDEX IF NOT EXISTS idx_smartcar_vehicles_tenant ON smartcar_vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_smartcar_vehicles_vehicle ON smartcar_vehicles(vehicle_id);

-- ArcGIS Layers
CREATE TABLE IF NOT EXISTS arcgis_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Layer details
    layer_name VARCHAR(255) NOT NULL,
    layer_type VARCHAR(50) NOT NULL, -- traffic, cameras, incidents, routes

    -- ArcGIS info
    service_url VARCHAR(1000) NOT NULL,
    layer_id VARCHAR(100),

    -- Configuration
    refresh_interval_seconds INTEGER DEFAULT 60,
    is_enabled BOOLEAN DEFAULT true,

    -- Display
    display_order INTEGER DEFAULT 0,
    default_visible BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_arcgis_layers_tenant ON arcgis_layers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_arcgis_layers_type ON arcgis_layers(layer_type);
CREATE INDEX IF NOT EXISTS idx_arcgis_layers_enabled ON arcgis_layers(is_enabled) WHERE is_enabled = true;

-- Outlook Messages
CREATE TABLE IF NOT EXISTS outlook_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Message details
    message_id VARCHAR(500) NOT NULL UNIQUE,
    conversation_id VARCHAR(500),

    -- From/To
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    to_emails JSONB DEFAULT '[]',

    -- Subject/Body
    subject VARCHAR(1000),
    body_preview TEXT,
    body_content TEXT,

    -- Timing
    sent_at TIMESTAMP,
    received_at TIMESTAMP,

    -- Status
    is_read BOOLEAN DEFAULT false,
    is_flagged BOOLEAN DEFAULT false,
    importance VARCHAR(20),

    -- Related entities
    related_entity_type VARCHAR(50),
    related_entity_id UUID,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outlook_messages_tenant ON outlook_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_outlook_messages_message ON outlook_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_outlook_messages_entity ON outlook_messages(related_entity_type, related_entity_id);

-- ============================================================================
-- SYSTEM TABLES
-- ============================================================================

-- Deployment Logs
CREATE TABLE IF NOT EXISTS deployment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Deployment details
    deployment_id VARCHAR(100) NOT NULL,
    environment VARCHAR(50) NOT NULL, -- development, staging, production

    -- Version
    version VARCHAR(50) NOT NULL,
    git_commit VARCHAR(100),
    git_branch VARCHAR(100),

    -- Timing
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,

    -- Status
    status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, success, failed, rolled_back

    -- Deployed by
    deployed_by VARCHAR(255),

    -- Quality gates
    quality_gates_passed INTEGER DEFAULT 0,
    quality_gates_failed INTEGER DEFAULT 0,

    -- Logs
    deployment_log TEXT,
    error_log TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deployment_logs_id ON deployment_logs(deployment_id);
CREATE INDEX IF NOT EXISTS idx_deployment_logs_env ON deployment_logs(environment);
CREATE INDEX IF NOT EXISTS idx_deployment_logs_status ON deployment_logs(status);
CREATE INDEX IF NOT EXISTS idx_deployment_logs_started ON deployment_logs(started_at DESC);

-- Performance Metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Metric details
    metric_name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- api_latency, db_query, page_load, etc.

    -- Value
    value DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20), -- ms, seconds, count, percentage

    -- Context
    endpoint VARCHAR(500),
    operation VARCHAR(100),

    -- Timing
    recorded_at TIMESTAMP DEFAULT NOW(),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_tenant ON performance_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded ON performance_metrics(recorded_at DESC);

-- Queue Jobs
CREATE TABLE IF NOT EXISTS queue_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Job details
    job_type VARCHAR(100) NOT NULL,
    job_name VARCHAR(255),

    -- Payload
    payload JSONB DEFAULT '{}',

    -- Priority
    priority INTEGER DEFAULT 5, -- 1-10, lower = higher priority

    -- Timing
    created_at TIMESTAMP DEFAULT NOW(),
    scheduled_for TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    -- Attempts
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,

    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed, cancelled

    -- Result
    result JSONB,
    error_message TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_queue_jobs_tenant ON queue_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_type ON queue_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_status ON queue_jobs(status);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_scheduled ON queue_jobs(scheduled_for);

-- ============================================================================
-- REPORTING TABLES
-- ============================================================================

-- Executive Dashboard Data
CREATE TABLE IF NOT EXISTS executive_dashboard_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Time period
    period_date DATE NOT NULL,
    period_type VARCHAR(20) DEFAULT 'daily', -- daily, weekly, monthly

    -- Fleet metrics
    total_vehicles INTEGER DEFAULT 0,
    active_vehicles INTEGER DEFAULT 0,
    maintenance_count INTEGER DEFAULT 0,
    incidents_count INTEGER DEFAULT 0,

    -- Cost metrics
    fuel_cost DECIMAL(12,2) DEFAULT 0,
    maintenance_cost DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0,

    -- Utilization
    total_miles DECIMAL(12,2) DEFAULT 0,
    utilization_percentage DECIMAL(5,2),

    -- Compliance
    compliance_score DECIMAL(5,2),
    overdue_inspections INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(tenant_id, period_date, period_type)
);

CREATE INDEX IF NOT EXISTS idx_executive_dashboard_tenant ON executive_dashboard_data(tenant_id);
CREATE INDEX IF NOT EXISTS idx_executive_dashboard_date ON executive_dashboard_data(period_date DESC);

-- Assignment Reports
CREATE TABLE IF NOT EXISTS assignment_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Report details
    report_name VARCHAR(255) NOT NULL,
    report_date DATE NOT NULL,

    -- Vehicle assignments summary
    total_vehicles INTEGER DEFAULT 0,
    assigned_vehicles INTEGER DEFAULT 0,
    unassigned_vehicles INTEGER DEFAULT 0,

    -- Driver assignments summary
    total_drivers INTEGER DEFAULT 0,
    drivers_with_vehicles INTEGER DEFAULT 0,
    drivers_without_vehicles INTEGER DEFAULT 0,

    -- Assignment data
    assignments JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_reports_tenant ON assignment_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_assignment_reports_date ON assignment_reports(report_date DESC);

-- Driver Scorecards
CREATE TABLE IF NOT EXISTS driver_scorecards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Driver
    driver_id UUID NOT NULL REFERENCES drivers(id),

    -- Period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Safety metrics
    incidents_count INTEGER DEFAULT 0,
    violations_count INTEGER DEFAULT 0,
    safety_score DECIMAL(5,2),

    -- Driving metrics
    total_miles DECIMAL(10,2) DEFAULT 0,
    harsh_braking_count INTEGER DEFAULT 0,
    harsh_acceleration_count INTEGER DEFAULT 0,
    speeding_violations INTEGER DEFAULT 0,
    idling_hours DECIMAL(10,2) DEFAULT 0,

    -- Fuel efficiency
    fuel_consumption_gallons DECIMAL(10,2) DEFAULT 0,
    mpg_average DECIMAL(5,2),

    -- Compliance
    inspections_completed INTEGER DEFAULT 0,
    training_completed BOOLEAN DEFAULT false,

    -- Overall score
    overall_score DECIMAL(5,2),
    rank INTEGER,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(tenant_id, driver_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_driver_scorecards_tenant ON driver_scorecards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_driver_scorecards_driver ON driver_scorecards(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_scorecards_period ON driver_scorecards(period_start, period_end);

-- ============================================================================
-- FINANCIAL ANALYSIS TABLES
-- ============================================================================

-- Cost Benefit Analyses
CREATE TABLE IF NOT EXISTS cost_benefit_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Analysis details
    analysis_name VARCHAR(255) NOT NULL,
    analysis_type VARCHAR(50) NOT NULL, -- ev_conversion, vehicle_replacement, route_optimization

    -- Period
    analysis_date DATE DEFAULT CURRENT_DATE,
    evaluation_period_months INTEGER DEFAULT 60, -- 5 years

    -- Current state costs
    current_annual_cost DECIMAL(12,2),
    current_fuel_cost DECIMAL(12,2),
    current_maintenance_cost DECIMAL(12,2),

    -- Proposed state costs
    proposed_annual_cost DECIMAL(12,2),
    proposed_fuel_cost DECIMAL(12,2),
    proposed_maintenance_cost DECIMAL(12,2),
    proposed_upfront_cost DECIMAL(12,2),

    -- Savings
    annual_savings DECIMAL(12,2),
    total_savings DECIMAL(12,2),
    payback_period_months DECIMAL(6,2),

    -- ROI
    roi_percentage DECIMAL(7,2),
    npv DECIMAL(12,2),

    -- Status
    status VARCHAR(20) DEFAULT 'draft', -- draft, under_review, approved, rejected

    -- Metadata
    assumptions JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_cost_benefit_analyses_tenant ON cost_benefit_analyses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cost_benefit_analyses_type ON cost_benefit_analyses(analysis_type);
CREATE INDEX IF NOT EXISTS idx_cost_benefit_analyses_status ON cost_benefit_analyses(status);

-- ============================================================================
-- RESERVATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Vehicle/Asset
    vehicle_id UUID REFERENCES vehicles(id),
    asset_id UUID REFERENCES assets(id),

    -- Reserved by
    user_id UUID NOT NULL REFERENCES users(id),
    driver_id UUID REFERENCES drivers(id),

    -- Reservation period
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,

    -- Purpose
    purpose VARCHAR(500),
    destination VARCHAR(500),

    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, active, completed, cancelled
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,

    -- Check-in/out
    checked_out_at TIMESTAMP,
    checked_in_at TIMESTAMP,

    -- Odometer
    start_odometer DECIMAL(10,2),
    end_odometer DECIMAL(10,2),

    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_tenant ON reservations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_vehicle ON reservations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_time ON reservations(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

-- Create or replace the update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at columns
-- (Only create if doesn't exist - use CREATE TRIGGER IF NOT EXISTS in PostgreSQL 14+)

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE heavy_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictive_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE on_call_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_hardware ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE mobile_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notification_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_3d_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE lidar_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_reauthorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE osha_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE break_glass_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_indexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE smartcar_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE arcgis_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlook_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_dashboard_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_benefit_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policies (example - repeat for all tables)
-- Note: Actual app must set app.current_tenant_id before queries

CREATE POLICY assets_tenant_isolation ON assets
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY incidents_tenant_isolation ON incidents
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY maintenance_requests_tenant_isolation ON maintenance_requests
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- (Add remaining policies for all other tables...)

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant permissions to application role (adjust based on your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO webapp;

-- ============================================================================
-- END OF COMPREHENSIVE MIGRATION
-- ============================================================================

COMMENT ON SCHEMA public IS 'Fleet-CTA comprehensive database schema - all tables for 100% endpoint functionality';
