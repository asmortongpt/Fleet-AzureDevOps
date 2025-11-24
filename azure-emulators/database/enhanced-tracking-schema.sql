-- Enhanced Fleet Tracking Schema
-- Adds maintenance, fuel, trips, alerts, and SmartCar emulation

BEGIN;

-- MAINTENANCE TRACKING
CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL, -- Oil Change, Tire Rotation, Inspection, etc.
    scheduled_date DATE NOT NULL,
    due_mileage INTEGER,
    estimated_cost NUMERIC(10,2),
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, completed, overdue, in_progress
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL,
    service_date DATE NOT NULL,
    odometer_reading INTEGER,
    cost NUMERIC(10,2),
    vendor VARCHAR(200),
    technician VARCHAR(200),
    parts_replaced TEXT[],
    labor_hours NUMERIC(5,2),
    notes TEXT,
    invoice_number VARCHAR(100),
    warranty_until DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- DRIVER ASSIGNMENTS
CREATE TABLE IF NOT EXISTS driver_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_until TIMESTAMP,
    assignment_type VARCHAR(50) DEFAULT 'permanent', -- permanent, temporary, pool
    status VARCHAR(50) DEFAULT 'active', -- active, ended, suspended
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- FUEL TRACKING
CREATE TABLE IF NOT EXISTS fuel_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id),
    transaction_date TIMESTAMP DEFAULT NOW(),
    fuel_type VARCHAR(50), -- Gasoline, Diesel, Electric, CNG
    quantity NUMERIC(10,3), -- Gallons or kWh
    unit_price NUMERIC(10,3),
    total_cost NUMERIC(10,2),
    odometer_reading INTEGER,
    location VARCHAR(500),
    latitude DECIMAL(10,7),
    longitude DECIMAL(11,8),
    fuel_card_number VARCHAR(50),
    vendor VARCHAR(200),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add fuel_level to vehicles if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='vehicles' AND column_name='fuel_level') THEN
        ALTER TABLE vehicles ADD COLUMN fuel_level NUMERIC(5,2) DEFAULT 100.0;
    END IF;
END $$;

-- TRIP HISTORY
CREATE TABLE IF NOT EXISTS trip_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id),
    trip_start TIMESTAMP NOT NULL,
    trip_end TIMESTAMP,
    start_latitude DECIMAL(10,7),
    start_longitude DECIMAL(11,8),
    end_latitude DECIMAL(10,7),
    end_longitude DECIMAL(11,8),
    start_odometer INTEGER,
    end_odometer INTEGER,
    distance_miles NUMERIC(10,2),
    duration_minutes INTEGER,
    avg_speed NUMERIC(5,2),
    max_speed NUMERIC(5,2),
    fuel_consumed NUMERIC(10,3),
    idle_time_minutes INTEGER,
    purpose VARCHAR(200), -- Patrol, Response, Maintenance, Administrative
    route_geojson JSONB, -- Store route path
    created_at TIMESTAMP DEFAULT NOW()
);

-- GPS BREADCRUMBS (for route replay)
CREATE TABLE IF NOT EXISTS gps_breadcrumbs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trip_history(id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    speed NUMERIC(5,2),
    heading NUMERIC(5,2),
    altitude NUMERIC(10,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for fast GPS lookups
CREATE INDEX IF NOT EXISTS idx_gps_breadcrumbs_vehicle_time
ON gps_breadcrumbs(vehicle_id, timestamp);

-- ALERTS SYSTEM
CREATE TABLE IF NOT EXISTS fleet_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL, -- maintenance_due, low_fuel, check_engine, inspection_due, etc.
    severity VARCHAR(20) DEFAULT 'info', -- info, warning, critical
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    triggered_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP,
    acknowledged_by UUID REFERENCES drivers(id),
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES drivers(id),
    status VARCHAR(50) DEFAULT 'active', -- active, acknowledged, resolved, dismissed
    metadata JSONB, -- Additional alert data
    created_at TIMESTAMP DEFAULT NOW()
);

-- SMARTCAR EMULATION DATA
CREATE TABLE IF NOT EXISTS smartcar_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    smartcar_id VARCHAR(100) UNIQUE NOT NULL, -- Simulated SmartCar vehicle ID
    access_token TEXT, -- Simulated access token
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    connection_status VARCHAR(50) DEFAULT 'connected', -- connected, disconnected, error
    last_data_update TIMESTAMP,
    supports_location BOOLEAN DEFAULT true,
    supports_odometer BOOLEAN DEFAULT true,
    supports_fuel BOOLEAN DEFAULT true,
    supports_battery BOOLEAN DEFAULT false,
    supports_tire_pressure BOOLEAN DEFAULT true,
    supports_engine_oil BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS smartcar_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    smartcar_vehicle_id UUID REFERENCES smartcar_vehicles(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT NOW(),
    odometer INTEGER, -- Miles
    fuel_percent NUMERIC(5,2), -- 0-100
    fuel_range_miles NUMERIC(10,2),
    battery_percent NUMERIC(5,2), -- For EVs
    battery_range_miles NUMERIC(10,2),
    tire_pressure_front_left NUMERIC(5,2), -- PSI
    tire_pressure_front_right NUMERIC(5,2),
    tire_pressure_rear_left NUMERIC(5,2),
    tire_pressure_rear_right NUMERIC(5,2),
    engine_oil_life_percent NUMERIC(5,2),
    latitude DECIMAL(10,7),
    longitude DECIMAL(11,8),
    speed NUMERIC(5,2),
    heading NUMERIC(5,2),
    is_charging BOOLEAN DEFAULT false,
    charge_state VARCHAR(50), -- NOT_CHARGING, CHARGING, FULLY_CHARGED
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add 10 SmartCar vehicles (diverse modern vehicles)
INSERT INTO vehicles (vin, make, model, year, license_plate, vehicle_type, fuel_type, status, latitude, longitude, fuel_level)
VALUES
    ('SMART001TESLA3X', 'Tesla', 'Model 3', 2024, 'SMART-001', 'Electric Sedan', 'Electric', 'active', 30.4383, -84.2807, 85.0),
    ('SMART002BMW330I', 'BMW', '330i', 2023, 'SMART-002', 'Sedan', 'Gasoline', 'active', 30.4500, -84.2700, 72.0),
    ('SMART003AUDIQ4E', 'Audi', 'Q4 e-tron', 2024, 'SMART-003', 'Electric SUV', 'Electric', 'active', 30.4200, -84.2900, 90.0),
    ('SMART004FORDMUST', 'Ford', 'Mustang Mach-E', 2024, 'SMART-004', 'Electric SUV', 'Electric', 'active', 30.4600, -84.2600, 65.0),
    ('SMART005CHEVYBOL', 'Chevrolet', 'Bolt EUV', 2023, 'SMART-005', 'Electric SUV', 'Electric', 'active', 30.4100, -84.3000, 78.0),
    ('SMART006HONDACR', 'Honda', 'CR-V Hybrid', 2024, 'SMART-006', 'Hybrid SUV', 'Hybrid', 'active', 30.4400, -84.2800, 88.0),
    ('SMART007TOYRAR4', 'Toyota', 'RAV4 Prime', 2024, 'SMART-007', 'Hybrid SUV', 'Hybrid', 'active', 30.4300, -84.2750, 95.0),
    ('SMART008VWID4X', 'Volkswagen', 'ID.4', 2023, 'SMART-008', 'Electric SUV', 'Electric', 'active', 30.4450, -84.2850, 55.0),
    ('SMART009HYUNDAI', 'Hyundai', 'Ioniq 5', 2024, 'SMART-009', 'Electric SUV', 'Electric', 'active', 30.4350, -84.2950, 82.0),
    ('SMART010RIVIANT', 'Rivian', 'R1T', 2024, 'SMART-010', 'Electric Pickup', 'Electric', 'active', 30.4550, -84.2650, 70.0)
RETURNING id;

-- Create SmartCar connections for these vehicles
INSERT INTO smartcar_vehicles (vehicle_id, smartcar_id, connection_status, supports_battery, last_data_update)
SELECT
    id,
    'sc_' || SUBSTRING(vin FROM 1 FOR 12),
    'connected',
    CASE WHEN fuel_type = 'Electric' THEN true ELSE false END,
    NOW()
FROM vehicles
WHERE license_plate LIKE 'SMART-%';

COMMIT;

-- Display what was created
SELECT 'Enhanced tracking schema created successfully!' as status;
SELECT COUNT(*) as smartcar_vehicles FROM vehicles WHERE license_plate LIKE 'SMART-%';
SELECT COUNT(*) as smartcar_connections FROM smartcar_vehicles;
