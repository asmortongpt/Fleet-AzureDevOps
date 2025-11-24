-- Add Altech Construction Trucks and Samsara-Connected Vehicles (V2)
-- Corrected for actual schema with UUID ids and no license_state/department columns

-- =============================================================================
-- ALTECH CONSTRUCTION TRUCKS (Heavy-duty commercial vehicles)
-- =============================================================================

-- Insert Altech Trucks (Mix of dump trucks, concrete mixers, excavators, etc.)
INSERT INTO vehicles (
    vin, make, model, year, license_plate,
    vehicle_type, fuel_type, status, odometer, fuel_level,
    latitude, longitude, speed
) VALUES
-- Heavy Dump Trucks
('ALTECH001VIN0001', 'Altech', 'HD-40 Dump Truck', 2022, 'ALTECH-001', 'Heavy Truck', 'Diesel', 'active', 45000, 65.0, 30.4383, -84.2807, 0),
('ALTECH002VIN0002', 'Altech', 'HD-40 Dump Truck', 2023, 'ALTECH-002', 'Heavy Truck', 'Diesel', 'active', 32000, 72.0, 30.4383, -84.2807, 0),
('ALTECH003VIN0003', 'Altech', 'HD-40 Dump Truck', 2021, 'ALTECH-003', 'Heavy Truck', 'Diesel', 'active', 58000, 55.0, 30.4383, -84.2807, 0),
('ALTECH004VIN0004', 'Altech', 'HD-45 Dump Truck', 2023, 'ALTECH-004', 'Heavy Truck', 'Diesel', 'active', 28000, 80.0, 30.4383, -84.2807, 0),
('ALTECH005VIN0005', 'Altech', 'HD-45 Dump Truck', 2024, 'ALTECH-005', 'Heavy Truck', 'Diesel', 'active', 12000, 90.0, 30.4383, -84.2807, 0),

-- Concrete Mixers
('ALTECH006VIN0006', 'Altech', 'CM-3000 Mixer', 2022, 'ALTECH-006', 'Mixer Truck', 'Diesel', 'active', 42000, 68.0, 30.4383, -84.2807, 0),
('ALTECH007VIN0007', 'Altech', 'CM-3000 Mixer', 2023, 'ALTECH-007', 'Mixer Truck', 'Diesel', 'active', 35000, 75.0, 30.4383, -84.2807, 0),
('ALTECH008VIN0008', 'Altech', 'CM-3500 Mixer', 2024, 'ALTECH-008', 'Mixer Truck', 'Diesel', 'active', 15000, 85.0, 30.4383, -84.2807, 0),

-- Flatbed Haulers
('ALTECH009VIN0009', 'Altech', 'FH-250 Flatbed', 2022, 'ALTECH-009', 'Flatbed Truck', 'Diesel', 'active', 48000, 62.0, 30.4383, -84.2807, 0),
('ALTECH010VIN0010', 'Altech', 'FH-250 Flatbed', 2023, 'ALTECH-010', 'Flatbed Truck', 'Diesel', 'active', 38000, 70.0, 30.4383, -84.2807, 0),
('ALTECH011VIN0011', 'Altech', 'FH-300 Flatbed', 2023, 'ALTECH-011', 'Flatbed Truck', 'Diesel', 'active', 33000, 78.0, 30.4383, -84.2807, 0),
('ALTECH012VIN0012', 'Altech', 'FH-300 Flatbed', 2024, 'ALTECH-012', 'Flatbed Truck', 'Diesel', 'active', 18000, 82.0, 30.4383, -84.2807, 0),

-- Crane Trucks
('ALTECH013VIN0013', 'Altech', 'CT-500 Crane', 2021, 'ALTECH-013', 'Crane Truck', 'Diesel', 'active', 52000, 58.0, 30.4383, -84.2807, 0),
('ALTECH014VIN0014', 'Altech', 'CT-500 Crane', 2022, 'ALTECH-014', 'Crane Truck', 'Diesel', 'active', 44000, 66.0, 30.4383, -84.2807, 0),
('ALTECH015VIN0015', 'Altech', 'CT-600 Crane', 2023, 'ALTECH-015', 'Crane Truck', 'Diesel', 'active', 30000, 74.0, 30.4383, -84.2807, 0),

-- Excavator Transporters
('ALTECH016VIN0016', 'Altech', 'ET-400 Transporter', 2022, 'ALTECH-016', 'Heavy Hauler', 'Diesel', 'active', 46000, 64.0, 30.4383, -84.2807, 0),
('ALTECH017VIN0017', 'Altech', 'ET-400 Transporter', 2023, 'ALTECH-017', 'Heavy Hauler', 'Diesel', 'active', 36000, 71.0, 30.4383, -84.2807, 0),
('ALTECH018VIN0018', 'Altech', 'ET-450 Transporter', 2024, 'ALTECH-018', 'Heavy Hauler', 'Diesel', 'active', 20000, 88.0, 30.4383, -84.2807, 0),

-- Service Trucks
('ALTECH019VIN0019', 'Altech', 'ST-200 Service', 2022, 'ALTECH-019', 'Service Truck', 'Diesel', 'active', 50000, 60.0, 30.4383, -84.2807, 0),
('ALTECH020VIN0020', 'Altech', 'ST-200 Service', 2023, 'ALTECH-020', 'Service Truck', 'Diesel', 'active', 40000, 69.0, 30.4383, -84.2807, 0),

-- Articulated Haulers
('ALTECH021VIN0021', 'Altech', 'AH-350 Hauler', 2023, 'ALTECH-021', 'Articulated Hauler', 'Diesel', 'active', 34000, 76.0, 30.4383, -84.2807, 0),
('ALTECH022VIN0022', 'Altech', 'AH-350 Hauler', 2024, 'ALTECH-022', 'Articulated Hauler', 'Diesel', 'active', 16000, 84.0, 30.4383, -84.2807, 0),

-- Water Trucks
('ALTECH023VIN0023', 'Altech', 'WT-2000 Water', 2022, 'ALTECH-023', 'Water Truck', 'Diesel', 'active', 43000, 67.0, 30.4383, -84.2807, 0),
('ALTECH024VIN0024', 'Altech', 'WT-2000 Water', 2023, 'ALTECH-024', 'Water Truck', 'Diesel', 'active', 37000, 73.0, 30.4383, -84.2807, 0),

-- Fuel/Lube Trucks
('ALTECH025VIN0025', 'Altech', 'FL-1500 Fuel/Lube', 2023, 'ALTECH-025', 'Fuel Truck', 'Diesel', 'active', 31000, 79.0, 30.4383, -84.2807, 0);

-- =============================================================================
-- SAMSARA-CONNECTED VEHICLES (Mix of commercial vehicles from various makes)
-- =============================================================================

-- Create or ensure samsara_vehicles table exists (with correct UUID foreign key)
CREATE TABLE IF NOT EXISTS samsara_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    samsara_vehicle_id VARCHAR(100) UNIQUE NOT NULL,
    samsara_group_id VARCHAR(100),
    connection_status VARCHAR(50) DEFAULT 'connected',
    api_permission_level VARCHAR(50) DEFAULT 'full',
    last_data_update TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create samsara_telemetry table if not exists
CREATE TABLE IF NOT EXISTS samsara_telemetry (
    id SERIAL PRIMARY KEY,
    samsara_vehicle_id UUID REFERENCES samsara_vehicles(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT NOW(),
    odometer NUMERIC(10, 2),
    fuel_percent NUMERIC(5, 2),
    engine_hours NUMERIC(10, 2),
    engine_rpm INTEGER,
    engine_coolant_temp INTEGER,
    engine_oil_pressure INTEGER,
    battery_voltage NUMERIC(5, 2),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    speed NUMERIC(6, 2),
    heading INTEGER,
    gps_accuracy NUMERIC(6, 2),
    def_level_percent NUMERIC(5, 2), -- Diesel Exhaust Fluid
    ambient_air_temp INTEGER,
    barometric_pressure NUMERIC(6, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert Samsara-connected commercial vehicles
INSERT INTO vehicles (
    vin, make, model, year, license_plate,
    vehicle_type, fuel_type, status, odometer, fuel_level,
    latitude, longitude, speed
) VALUES
-- Freightliner Commercial Trucks
('SAMSARA001VIN001', 'Freightliner', 'Cascadia', 2023, 'SAMS-001', 'Semi Truck', 'Diesel', 'active', 85000, 70.0, 30.4383, -84.2807, 0),
('SAMSARA002VIN002', 'Freightliner', 'Cascadia', 2024, 'SAMS-002', 'Semi Truck', 'Diesel', 'active', 42000, 80.0, 30.4383, -84.2807, 0),
('SAMSARA003VIN003', 'Freightliner', 'M2 106', 2023, 'SAMS-003', 'Box Truck', 'Diesel', 'active', 68000, 65.0, 30.4383, -84.2807, 0),

-- International Commercial Vehicles
('SAMSARA004VIN004', 'International', 'LT Series', 2023, 'SAMS-004', 'Semi Truck', 'Diesel', 'active', 92000, 68.0, 30.4383, -84.2807, 0),
('SAMSARA005VIN005', 'International', 'HX Series', 2024, 'SAMS-005', 'Dump Truck', 'Diesel', 'active', 38000, 75.0, 30.4383, -84.2807, 0),

-- Kenworth Heavy Haulers
('SAMSARA006VIN006', 'Kenworth', 'T680', 2023, 'SAMS-006', 'Semi Truck', 'Diesel', 'active', 78000, 72.0, 30.4383, -84.2807, 0),
('SAMSARA007VIN007', 'Kenworth', 'T880', 2024, 'SAMS-007', 'Heavy Hauler', 'Diesel', 'active', 35000, 82.0, 30.4383, -84.2807, 0),

-- Peterbilt Trucks
('SAMSARA008VIN008', 'Peterbilt', '579', 2023, 'SAMS-008', 'Semi Truck', 'Diesel', 'active', 88000, 66.0, 30.4383, -84.2807, 0),
('SAMSARA009VIN009', 'Peterbilt', '389', 2024, 'SAMS-009', 'Semi Truck', 'Diesel', 'active', 45000, 78.0, 30.4383, -84.2807, 0),

-- Mack Trucks
('SAMSARA010VIN010', 'Mack', 'Anthem', 2023, 'SAMS-010', 'Semi Truck', 'Diesel', 'active', 82000, 69.0, 30.4383, -84.2807, 0),
('SAMSARA011VIN011', 'Mack', 'Granite', 2024, 'SAMS-011', 'Dump Truck', 'Diesel', 'active', 40000, 76.0, 30.4383, -84.2807, 0),

-- Volvo Commercial Trucks
('SAMSARA012VIN012', 'Volvo', 'VNL 760', 2023, 'SAMS-012', 'Semi Truck', 'Diesel', 'active', 75000, 73.0, 30.4383, -84.2807, 0),
('SAMSARA013VIN013', 'Volvo', 'VHD', 2024, 'SAMS-013', 'Dump Truck', 'Diesel', 'active', 36000, 81.0, 30.4383, -84.2807, 0),

-- Western Star Trucks
('SAMSARA014VIN014', 'Western Star', '5700XE', 2023, 'SAMS-014', 'Semi Truck', 'Diesel', 'active', 90000, 67.0, 30.4383, -84.2807, 0),
('SAMSARA015VIN015', 'Western Star', '4900', 2024, 'SAMS-015', 'Heavy Hauler', 'Diesel', 'active', 42000, 79.0, 30.4383, -84.2807, 0),

-- Ram Commercial Vehicles
('SAMSARA016VIN016', 'Ram', '5500 Chassis', 2023, 'SAMS-016', 'Service Truck', 'Diesel', 'active', 55000, 71.0, 30.4383, -84.2807, 0),
('SAMSARA017VIN017', 'Ram', '4500 Chassis', 2024, 'SAMS-017', 'Service Truck', 'Diesel', 'active', 32000, 83.0, 30.4383, -84.2807, 0),

-- Isuzu Commercial Trucks
('SAMSARA018VIN018', 'Isuzu', 'NPR-HD', 2023, 'SAMS-018', 'Box Truck', 'Diesel', 'active', 62000, 74.0, 30.4383, -84.2807, 0),
('SAMSARA019VIN019', 'Isuzu', 'FTR', 2024, 'SAMS-019', 'Box Truck', 'Diesel', 'active', 38000, 77.0, 30.4383, -84.2807, 0),

-- Hino Commercial Trucks
('SAMSARA020VIN020', 'Hino', '268A', 2023, 'SAMS-020', 'Box Truck', 'Diesel', 'active', 58000, 72.0, 30.4383, -84.2807, 0);

-- Link Samsara devices to vehicles
INSERT INTO samsara_vehicles (vehicle_id, samsara_vehicle_id, samsara_group_id, connection_status, api_permission_level, last_data_update)
SELECT
    v.id,
    'SAMS-VEH-' || v.license_plate,
    'GROUP-TALLAHASSEE-001',
    'connected',
    'full',
    NOW()
FROM vehicles v
WHERE v.license_plate LIKE 'SAMS-%'
ORDER BY v.license_plate;

-- Verify the insertions
SELECT
    'Altech Trucks' as category,
    COUNT(*) as count
FROM vehicles
WHERE make = 'Altech'
UNION ALL
SELECT
    'Samsara Vehicles' as category,
    COUNT(*) as count
FROM vehicles
WHERE license_plate LIKE 'SAMS-%'
UNION ALL
SELECT
    'Samsara Connections' as category,
    COUNT(*) as count
FROM samsara_vehicles;

-- Display sample of new vehicles
SELECT
    make,
    model,
    license_plate,
    vehicle_type,
    status
FROM vehicles
WHERE make IN ('Altech', 'Freightliner', 'International', 'Kenworth', 'Peterbilt', 'Mack', 'Volvo', 'Western Star', 'Ram', 'Isuzu', 'Hino')
ORDER BY make, model
LIMIT 30;
