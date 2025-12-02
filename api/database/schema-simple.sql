-- Fleet Management System - Simplified Database Schema (No PostGIS)
-- Drop existing views first
DROP VIEW IF EXISTS v_overdue_maintenance CASCADE;
DROP VIEW IF EXISTS v_active_vehicles CASCADE;

-- Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS schema_version CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS policy_violations CASCADE;
DROP TABLE IF EXISTS policies CASCADE;
DROP TABLE IF EXISTS communication_logs CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS charging_sessions CASCADE;
DROP TABLE IF EXISTS charging_stations CASCADE;
DROP TABLE IF EXISTS video_events CASCADE;
DROP TABLE IF EXISTS safety_incidents CASCADE;
DROP TABLE IF EXISTS inspections CASCADE;
DROP TABLE IF EXISTS inspection_forms CASCADE;
DROP TABLE IF EXISTS telemetry_data CASCADE;
DROP TABLE IF EXISTS geofence_events CASCADE;
DROP TABLE IF EXISTS geofences CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS fuel_transactions CASCADE;
DROP TABLE IF EXISTS maintenance_schedules CASCADE;
DROP TABLE IF EXISTS work_orders CASCADE;
DROP TABLE IF EXISTS facilities CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For full-text search

-- Tenants
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'fleet_manager', 'driver', 'technician', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    failed_login_attempts INTEGER DEFAULT 0,
    account_locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('success', 'failure')),
    error_message TEXT,
    hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Vehicles
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vin VARCHAR(17) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    license_plate VARCHAR(20),
    vehicle_type VARCHAR(50),
    fuel_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'out_of_service', 'sold', 'retired')),
    odometer DECIMAL(10,2) DEFAULT 0,
    engine_hours DECIMAL(10,2) DEFAULT 0,
    purchase_date DATE,
    purchase_price DECIMAL(10,2),
    current_value DECIMAL(10,2),
    gps_device_id VARCHAR(100),
    last_gps_update TIMESTAMP WITH TIME ZONE,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    speed DECIMAL(5,2),
    heading DECIMAL(5,2),
    assigned_driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assigned_facility_id UUID,
    telematics_data JSONB DEFAULT '{}',
    photos TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vehicles_tenant ON vehicles(tenant_id);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_assigned_driver ON vehicles(assigned_driver_id);

-- Drivers
CREATE TABLE drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_state VARCHAR(2),
    license_expiration DATE,
    cdl_class VARCHAR(10),
    cdl_endorsements VARCHAR(50)[],
    medical_card_expiration DATE,
    hire_date DATE,
    termination_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'suspended', 'terminated')),
    safety_score DECIMAL(5,2) DEFAULT 100.0,
    total_miles_driven DECIMAL(10,2) DEFAULT 0,
    total_hours_driven DECIMAL(10,2) DEFAULT 0,
    incidents_count INTEGER DEFAULT 0,
    violations_count INTEGER DEFAULT 0,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_drivers_tenant ON drivers(tenant_id);
CREATE INDEX idx_drivers_user ON drivers(user_id);
CREATE INDEX idx_drivers_license ON drivers(license_number);

-- Facilities
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    phone VARCHAR(20),
    capacity INTEGER,
    service_bays INTEGER,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_facilities_tenant ON facilities(tenant_id);

-- Work Orders
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    work_order_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES facilities(id),
    assigned_technician_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'on_hold', 'completed', 'cancelled')),
    description TEXT NOT NULL,
    odometer_reading DECIMAL(10,2),
    engine_hours_reading DECIMAL(10,2),
    scheduled_start DATE,
    scheduled_end DATE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    labor_hours DECIMAL(5,2) DEFAULT 0,
    labor_cost DECIMAL(10,2) DEFAULT 0,
    parts_cost DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (labor_cost + parts_cost) STORED,
    photos TEXT[],
    attachments TEXT[],
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_work_orders_tenant ON work_orders(tenant_id);
CREATE INDEX idx_work_orders_vehicle ON work_orders(vehicle_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_technician ON work_orders(assigned_technician_id);

-- Maintenance Schedules
CREATE TABLE maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL,
    interval_type VARCHAR(20) NOT NULL CHECK (interval_type IN ('miles', 'hours', 'days')),
    interval_value INTEGER NOT NULL,
    last_service_date DATE,
    last_service_odometer DECIMAL(10,2),
    last_service_engine_hours DECIMAL(10,2),
    next_service_due_date DATE,
    next_service_due_odometer DECIMAL(10,2),
    next_service_due_engine_hours DECIMAL(10,2),
    is_overdue BOOLEAN GENERATED ALWAYS AS (
        CASE
            WHEN interval_type = 'days' AND next_service_due_date < CURRENT_DATE THEN true
            ELSE false
        END
    ) STORED,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_maintenance_schedules_tenant ON maintenance_schedules(tenant_id);
CREATE INDEX idx_maintenance_schedules_vehicle ON maintenance_schedules(vehicle_id);
CREATE INDEX idx_maintenance_schedules_due_date ON maintenance_schedules(next_service_due_date);

-- Fuel Transactions
CREATE TABLE fuel_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    gallons DECIMAL(8,3) NOT NULL,
    price_per_gallon DECIMAL(6,3) NOT NULL,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (gallons * price_per_gallon) STORED,
    odometer_reading DECIMAL(10,2),
    fuel_type VARCHAR(50),
    location VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    fuel_card_number VARCHAR(50),
    receipt_photo TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_fuel_transactions_tenant ON fuel_transactions(tenant_id);
CREATE INDEX idx_fuel_transactions_vehicle ON fuel_transactions(vehicle_id);
CREATE INDEX idx_fuel_transactions_driver ON fuel_transactions(driver_id);
CREATE INDEX idx_fuel_transactions_date ON fuel_transactions(transaction_date DESC);

-- Routes
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    route_name VARCHAR(255) NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    start_location VARCHAR(255),
    end_location VARCHAR(255),
    planned_start_time TIMESTAMP WITH TIME ZONE,
    planned_end_time TIMESTAMP WITH TIME ZONE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    total_distance DECIMAL(10,2),
    estimated_duration INTEGER,
    actual_duration INTEGER,
    waypoints JSONB DEFAULT '[]',
    optimized_waypoints JSONB DEFAULT '[]',
    route_geometry JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_routes_tenant ON routes(tenant_id);
CREATE INDEX idx_routes_vehicle ON routes(vehicle_id);
CREATE INDEX idx_routes_driver ON routes(driver_id);
CREATE INDEX idx_routes_status ON routes(status);

-- Geofences
CREATE TABLE geofences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    geofence_type VARCHAR(50),
    center_latitude DECIMAL(10,8),
    center_longitude DECIMAL(11,8),
    radius DECIMAL(10,2),
    polygon_coordinates JSONB,
    alert_on_entry BOOLEAN DEFAULT false,
    alert_on_exit BOOLEAN DEFAULT false,
    alert_recipients TEXT[],
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_geofences_tenant ON geofences(tenant_id);

CREATE TABLE geofence_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    geofence_id UUID REFERENCES geofences(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    event_type VARCHAR(20) CHECK (event_type IN ('entry', 'exit')),
    event_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    speed DECIMAL(5,2),
    alert_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_geofence_events_tenant ON geofence_events(tenant_id);
CREATE INDEX idx_geofence_events_geofence ON geofence_events(geofence_id);
CREATE INDEX idx_geofence_events_vehicle ON geofence_events(vehicle_id);
CREATE INDEX idx_geofence_events_time ON geofence_events(event_time DESC);

-- Telemetry Data
CREATE TABLE telemetry_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    speed DECIMAL(5,2),
    heading DECIMAL(5,2),
    odometer DECIMAL(10,2),
    engine_hours DECIMAL(10,2),
    fuel_level DECIMAL(5,2),
    engine_rpm INTEGER,
    coolant_temp DECIMAL(5,2),
    oil_pressure DECIMAL(5,2),
    battery_voltage DECIMAL(4,2),
    dtc_codes VARCHAR(10)[],
    harsh_braking BOOLEAN DEFAULT false,
    harsh_acceleration BOOLEAN DEFAULT false,
    sharp_turn BOOLEAN DEFAULT false,
    speeding BOOLEAN DEFAULT false,
    speed_limit INTEGER,
    idle_time INTEGER,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_telemetry_data_tenant ON telemetry_data(tenant_id);
CREATE INDEX idx_telemetry_data_vehicle ON telemetry_data(vehicle_id);
CREATE INDEX idx_telemetry_data_timestamp ON telemetry_data(timestamp DESC);

-- Inspections
CREATE TABLE inspection_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    form_name VARCHAR(255) NOT NULL,
    form_type VARCHAR(50),
    form_template JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    inspection_form_id UUID REFERENCES inspection_forms(id),
    inspection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    inspection_type VARCHAR(50),
    odometer_reading DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'pass' CHECK (status IN ('pass', 'fail', 'needs_repair')),
    form_data JSONB NOT NULL,
    defects_found TEXT,
    signature_data TEXT,
    photos TEXT[],
    location VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_inspections_tenant ON inspections(tenant_id);
CREATE INDEX idx_inspections_vehicle ON inspections(vehicle_id);
CREATE INDEX idx_inspections_driver ON inspections(driver_id);
CREATE INDEX idx_inspections_date ON inspections(inspection_date DESC);

-- Safety Incidents
CREATE TABLE safety_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    incident_number VARCHAR(50) UNIQUE NOT NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
    incident_type VARCHAR(100),
    severity VARCHAR(20) CHECK (severity IN ('minor', 'moderate', 'severe', 'fatal')),
    location VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    description TEXT NOT NULL,
    injuries_count INTEGER DEFAULT 0,
    fatalities_count INTEGER DEFAULT 0,
    property_damage_cost DECIMAL(10,2),
    vehicle_damage_cost DECIMAL(10,2),
    at_fault BOOLEAN,
    reported_to_osha BOOLEAN DEFAULT false,
    osha_case_number VARCHAR(50),
    police_report_number VARCHAR(50),
    insurance_claim_number VARCHAR(50),
    root_cause TEXT,
    corrective_actions TEXT,
    photos TEXT[],
    documents TEXT[],
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    reported_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_safety_incidents_tenant ON safety_incidents(tenant_id);
CREATE INDEX idx_safety_incidents_vehicle ON safety_incidents(vehicle_id);
CREATE INDEX idx_safety_incidents_driver ON safety_incidents(driver_id);
CREATE INDEX idx_safety_incidents_date ON safety_incidents(incident_date DESC);

-- Video Events
CREATE TABLE video_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    event_type VARCHAR(50),
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    video_url TEXT,
    thumbnail_url TEXT,
    duration INTEGER,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    speed DECIMAL(5,2),
    g_force DECIMAL(5,2),
    reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_video_events_tenant ON video_events(tenant_id);
CREATE INDEX idx_video_events_vehicle ON video_events(vehicle_id);
CREATE INDEX idx_video_events_driver ON video_events(driver_id);
CREATE INDEX idx_video_events_time ON video_events(event_time DESC);

-- Charging Stations
CREATE TABLE charging_stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    station_name VARCHAR(255) NOT NULL,
    station_type VARCHAR(50),
    location VARCHAR(255),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    number_of_ports INTEGER DEFAULT 1,
    power_output_kw DECIMAL(6,2),
    cost_per_kwh DECIMAL(6,4),
    is_public BOOLEAN DEFAULT false,
    is_operational BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE charging_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    charging_station_id UUID REFERENCES charging_stations(id),
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    energy_delivered_kwh DECIMAL(8,2),
    cost DECIMAL(10,2),
    start_battery_level DECIMAL(5,2),
    end_battery_level DECIMAL(5,2),
    session_duration INTEGER,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'interrupted', 'failed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_charging_sessions_tenant ON charging_sessions(tenant_id);
CREATE INDEX idx_charging_sessions_vehicle ON charging_sessions(vehicle_id);
CREATE INDEX idx_charging_sessions_station ON charging_sessions(charging_station_id);
CREATE INDEX idx_charging_sessions_start_time ON charging_sessions(start_time DESC);

-- Vendors & Purchase Orders
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    vendor_name VARCHAR(255) NOT NULL,
    vendor_type VARCHAR(50),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    vendor_id UUID REFERENCES vendors(id),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'ordered', 'received', 'cancelled')),
    subtotal DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    shipping DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) GENERATED ALWAYS AS (subtotal + tax + shipping) STORED,
    line_items JSONB DEFAULT '[]',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_tenant ON purchase_orders(tenant_id);
CREATE INDEX idx_purchase_orders_vendor ON purchase_orders(vendor_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);

-- Communication Logs
CREATE TABLE communication_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    communication_type VARCHAR(50),
    direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
    from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    subject VARCHAR(255),
    body TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attachments TEXT[],
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_communication_logs_tenant ON communication_logs(tenant_id);
CREATE INDEX idx_communication_logs_vehicle ON communication_logs(vehicle_id);
CREATE INDEX idx_communication_logs_timestamp ON communication_logs(timestamp DESC);

-- Policies
CREATE TABLE policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    policy_name VARCHAR(255) NOT NULL,
    policy_type VARCHAR(50),
    description TEXT,
    rules JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE policy_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    policy_id UUID REFERENCES policies(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    violation_time TIMESTAMP WITH TIME ZONE NOT NULL,
    violation_data JSONB,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES users(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_policy_violations_tenant ON policy_violations(tenant_id);
CREATE INDEX idx_policy_violations_policy ON policy_violations(policy_id);
CREATE INDEX idx_policy_violations_vehicle ON policy_violations(vehicle_id);
CREATE INDEX idx_policy_violations_driver ON policy_violations(driver_id);
CREATE INDEX idx_policy_violations_time ON policy_violations(violation_time DESC);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_facilities_updated_at BEFORE UPDATE ON facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_maintenance_schedules_updated_at BEFORE UPDATE ON maintenance_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fuel_transactions_updated_at BEFORE UPDATE ON fuel_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_geofences_updated_at BEFORE UPDATE ON geofences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inspection_forms_updated_at BEFORE UPDATE ON inspection_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_safety_incidents_updated_at BEFORE UPDATE ON safety_incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_events_updated_at BEFORE UPDATE ON video_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_charging_stations_updated_at BEFORE UPDATE ON charging_stations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_charging_sessions_updated_at BEFORE UPDATE ON charging_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit log function
CREATE OR REPLACE FUNCTION create_audit_log(
    p_tenant_id UUID,
    p_user_id UUID,
    p_action VARCHAR,
    p_resource_type VARCHAR,
    p_resource_id UUID,
    p_details JSONB,
    p_outcome VARCHAR,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
    v_hash VARCHAR(64);
BEGIN
    v_hash := md5(concat(p_tenant_id, p_user_id, p_action, p_resource_type, p_resource_id, NOW()));

    INSERT INTO audit_logs (
        tenant_id, user_id, action, resource_type, resource_id,
        details, outcome, ip_address, user_agent, hash
    ) VALUES (
        p_tenant_id, p_user_id, p_action, p_resource_type, p_resource_id,
        p_details, p_outcome, p_ip_address, p_user_agent, v_hash
    ) RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Seed data
INSERT INTO tenants (id, name, domain, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'Default Tenant',
    'default.fleetmanagement.com',
    true
) ON CONFLICT DO NOTHING;

INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000002'::UUID,
    '00000000-0000-0000-0000-000000000001'::UUID,
    'admin@fleetmanagement.com',
    '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
    'System',
    'Administrator',
    'admin',
    true
) ON CONFLICT DO NOTHING;

-- Views
CREATE OR REPLACE VIEW v_active_vehicles AS
SELECT
    v.*,
    d.license_number as driver_license,
    u.first_name || ' ' || u.last_name as driver_name,
    f.name as facility_name
FROM vehicles v
LEFT JOIN drivers d ON v.assigned_driver_id = d.id
LEFT JOIN users u ON d.user_id = u.id
LEFT JOIN facilities f ON v.assigned_facility_id = f.id
WHERE v.status = 'active';

CREATE OR REPLACE VIEW v_overdue_maintenance AS
SELECT
    v.vin,
    v.make,
    v.model,
    m.service_type,
    m.next_service_due_date,
    m.next_service_due_odometer,
    v.odometer
FROM maintenance_schedules m
JOIN vehicles v ON m.vehicle_id = v.id
WHERE m.is_active = true
AND (
    (m.interval_type = 'days' AND m.next_service_due_date < CURRENT_DATE)
    OR (m.interval_type = 'miles' AND v.odometer > m.next_service_due_odometer)
);

-- Schema version
CREATE TABLE schema_version (
    version INTEGER PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO schema_version (version, description) VALUES (1, 'Initial simplified schema without PostGIS');

ANALYZE;
