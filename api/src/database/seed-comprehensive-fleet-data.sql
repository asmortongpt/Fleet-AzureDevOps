-- ============================================================================
-- Comprehensive Fleet Management Database Seeder
-- Populates realistic test data aligned with OBD2 Emulator and 3D Models
-- ============================================================================

-- Clear existing data (in correct order to respect foreign keys)
DELETE FROM maintenance_records;
DELETE FROM fuel_transactions;
DELETE FROM trip_logs;
DELETE FROM driver_assignments;
DELETE FROM vehicles;
DELETE FROM drivers;
DELETE FROM departments;

-- Reset sequences
ALTER SEQUENCE IF EXISTS departments_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS drivers_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS vehicles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS trip_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS fuel_transactions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS maintenance_records_id_seq RESTART WITH 1;

-- ============================================================================
-- DEPARTMENTS
-- ============================================================================

INSERT INTO departments (name, budget, manager_name, created_at) VALUES
('Fleet Operations', 2500000.00, 'Sarah Johnson', NOW()),
('Emergency Services', 1800000.00, 'Michael Chen', NOW()),
('Public Works', 3200000.00, 'Robert Martinez', NOW()),
('Parks & Recreation', 950000.00, 'Jennifer Williams', NOW()),
('Administration', 450000.00, 'David Brown', NOW()),
('Transportation', 2100000.00, 'Amanda Davis', NOW());

-- ============================================================================
-- DRIVERS
-- ============================================================================

INSERT INTO drivers (name, license_number, license_class, email, phone, hire_date, status, created_at) VALUES
-- Fleet Operations
('John Anderson', 'FL-D123456789', 'C', 'j.anderson@fleetops.gov', '850-555-0101', '2018-03-15', 'active', NOW()),
('Maria Garcia', 'FL-D234567890', 'B', 'm.garcia@fleetops.gov', '850-555-0102', '2019-06-22', 'active', NOW()),
('Kevin Lee', 'FL-D345678901', 'C', 'k.lee@fleetops.gov', '850-555-0103', '2020-01-10', 'active', NOW()),
('Lisa Thompson', 'FL-D456789012', 'C', 'l.thompson@fleetops.gov', '850-555-0104', '2017-11-05', 'active', NOW()),

-- Emergency Services
('Officer James Wilson', 'FL-D567890123', 'C', 'j.wilson@police.gov', '850-555-0201', '2015-08-20', 'active', NOW()),
('Officer Sarah Davis', 'FL-D678901234', 'C', 's.davis@police.gov', '850-555-0202', '2016-04-12', 'active', NOW()),
('Paramedic Tom Martinez', 'FL-D789012345', 'C', 't.martinez@ems.gov', '850-555-0203', '2014-09-30', 'active', NOW()),
('Paramedic Emily Chen', 'FL-D890123456', 'C', 'e.chen@ems.gov', '850-555-0204', '2018-07-15', 'active', NOW()),
('Firefighter David Brown', 'FL-D901234567', 'B', 'd.brown@fire.gov', '850-555-0205', '2013-05-22', 'active', NOW()),
('Firefighter Jessica White', 'FL-D012345678', 'B', 'j.white@fire.gov', '850-555-0206', '2019-02-18', 'active', NOW()),

-- Public Works
('Supervisor Mike Johnson', 'FL-D123450789', 'A', 'm.johnson@publicworks.gov', '850-555-0301', '2012-10-08', 'active', NOW()),
('Crew Lead Carlos Rodriguez', 'FL-D234560890', 'B', 'c.rodriguez@publicworks.gov', '850-555-0302', '2016-12-01', 'active', NOW()),
('Operator Frank Miller', 'FL-D345670901', 'A', 'f.miller@publicworks.gov', '850-555-0303', '2015-03-25', 'active', NOW()),

-- Parks & Recreation
('Ranger Amy Taylor', 'FL-D456780012', 'C', 'a.taylor@parks.gov', '850-555-0401', '2018-06-10', 'active', NOW()),
('Maintenance Tech Bob Wilson', 'FL-D567890023', 'C', 'b.wilson@parks.gov', '850-555-0402', '2019-09-14', 'active', NOW());

-- ============================================================================
-- VEHICLES - Aligned with 3D Models from Sketchfab
-- ============================================================================

-- SEDANS (Department: Fleet Operations & Administration)
INSERT INTO vehicles (
  vin, license_plate, make, model, year, type, department_id,
  mileage, fuel_type, fuel_capacity, status, acquisition_cost,
  model_3d_path, last_service_date, next_service_due, insurance_expiry, created_at
) VALUES
-- Tesla Model 3 (Sketchfab: https://sketchfab.com/3d-models/tesla-model-3-2018-...)
('5YJ3E1EA4LF000001', 'FL-GOV-1001', 'Tesla', 'Model 3', 2020, 'sedan', 1,
 45230, 'electric', 75.0, 'available', 49990.00,
 '/models/vehicles/sedans/tesla_model_3.glb', '2024-10-15', '2025-01-15', '2025-03-31', NOW()),

-- Honda Accord (Sketchfab: https://sketchfab.com/3d-models/honda-accord-2018-...)
('1HGCV1F36JA000002', 'FL-GOV-1002', 'Honda', 'Accord', 2018, 'sedan', 1,
 67890, 'gasoline', 14.8, 'in_use', 27450.00,
 '/models/vehicles/sedans/honda_accord.glb', '2024-09-20', '2024-12-20', '2025-06-30', NOW()),

-- Toyota Camry (Sketchfab: https://sketchfab.com/3d-models/toyota-camry-2019-...)
('4T1B11HK2KU000003', 'FL-GOV-1003', 'Toyota', 'Camry', 2019, 'sedan', 5,
 52100, 'gasoline', 15.8, 'available', 29800.00,
 '/models/vehicles/sedans/toyota_camry.glb', '2024-11-01', '2025-02-01', '2025-04-30', NOW()),

-- BMW 3 Series (Sketchfab: https://sketchfab.com/3d-models/bmw-3-series-...)
('WBA8E1G50JNU00004', 'FL-GOV-1004', 'BMW', '3 Series', 2018, 'sedan', 5,
 38900, 'gasoline', 15.6, 'available', 42500.00,
 '/models/vehicles/sedans/bmw_3series.glb', '2024-10-25', '2025-01-25', '2025-05-31', NOW()),

-- SUVS (Department: Fleet Operations)
-- Ford Explorer (Sketchfab: https://sketchfab.com/3d-models/ford-explorer-...)
('1FM5K8D87LG000005', 'FL-GOV-2001', 'Ford', 'Explorer', 2020, 'suv', 1,
 34500, 'gasoline', 18.6, 'in_use', 36000.00,
 '/models/vehicles/suvs/ford_explorer.glb', '2024-11-10', '2025-02-10', '2025-06-30', NOW()),

-- Jeep Wrangler (Sketchfab: https://sketchfab.com/3d-models/jeep-wrangler-...)
('1C4HJXEN0LW000006', 'FL-GOV-2002', 'Jeep', 'Wrangler Rubicon', 2021, 'suv', 4,
 28700, 'gasoline', 21.5, 'available', 42500.00,
 '/models/vehicles/suvs/jeep_wrangler.glb', '2024-09-15', '2024-12-15', '2025-03-31', NOW()),

-- Toyota RAV4 (Sketchfab: https://sketchfab.com/3d-models/toyota-rav4-...)
('2T3P1RFV8LC000007', 'FL-GOV-2003', 'Toyota', 'RAV4', 2020, 'suv', 4,
 41200, 'gasoline', 14.5, 'available', 28450.00,
 '/models/vehicles/suvs/toyota_rav4.glb', '2024-10-30', '2025-01-30', '2025-04-30', NOW()),

-- Chevrolet Tahoe (Sketchfab: https://sketchfab.com/3d-models/chevrolet-tahoe-...)
('1GNSKCKD0LR000008', 'FL-GOV-2004', 'Chevrolet', 'Tahoe', 2020, 'suv', 1,
 56800, 'gasoline', 24.0, 'in_use', 52000.00,
 '/models/vehicles/suvs/chevy_tahoe.glb', '2024-11-05', '2025-02-05', '2025-05-31', NOW()),

-- TRUCKS (Department: Public Works)
-- Ford F-150 (Sketchfab: https://sketchfab.com/3d-models/ford-f150-...)
('1FTFW1E85MF000009', 'FL-GOV-3001', 'Ford', 'F-150', 2021, 'truck', 3,
 32400, 'gasoline', 26.0, 'available', 38900.00,
 '/models/vehicles/trucks/ford_f150.glb', '2024-09-25', '2024-12-25', '2025-06-30', NOW()),

-- Chevrolet Silverado (Sketchfab: https://sketchfab.com/3d-models/chevrolet-silverado-...)
('1GC4YRCY3MF000010', 'FL-GOV-3002', 'Chevrolet', 'Silverado 1500', 2021, 'truck', 3,
 29100, 'gasoline', 24.0, 'in_use', 35800.00,
 '/models/vehicles/trucks/chevy_silverado.glb', '2024-10-18', '2025-01-18', '2025-04-30', NOW()),

-- RAM 1500 (Sketchfab: https://sketchfab.com/3d-models/ram-1500-...)
('1C6SRFFT2MN000011', 'FL-GOV-3003', 'RAM', '1500', 2021, 'truck', 3,
 35700, 'gasoline', 26.0, 'available', 39500.00,
 '/models/vehicles/trucks/ram_1500.glb', '2024-11-12', '2025-02-12', '2025-05-31', NOW()),

-- VANS (Department: Transportation & Public Works)
-- Ford Transit (Sketchfab: https://sketchfab.com/3d-models/ford-transit-...)
('NM0GE9F7XL1000012', 'FL-GOV-4001', 'Ford', 'Transit 350', 2020, 'van', 6,
 48900, 'gasoline', 25.0, 'in_use', 36500.00,
 '/models/vehicles/vans/ford_transit.glb', '2024-10-20', '2025-01-20', '2025-03-31', NOW()),

-- Mercedes Sprinter (Sketchfab: https://sketchfab.com/3d-models/mercedes-sprinter-...)
('WD3PE8CC5L5000013', 'FL-GOV-4002', 'Mercedes-Benz', 'Sprinter 2500', 2020, 'van', 6,
 52300, 'diesel', 24.5, 'available', 45900.00,
 '/models/vehicles/vans/mercedes_sprinter.glb', '2024-09-28', '2024-12-28', '2025-06-30', NOW()),

-- Chevrolet Express (Sketchfab: https://sketchfab.com/3d-models/chevrolet-express-...)
('1GCWGAFG7K1000014', 'FL-GOV-4003', 'Chevrolet', 'Express 3500', 2019, 'van', 3,
 61200, 'gasoline', 31.0, 'available', 32800.00,
 '/models/vehicles/vans/chevy_express.glb', '2024-11-08', '2025-02-08', '2025-04-30', NOW()),

-- EMERGENCY VEHICLES
-- Police Cars (Sketchfab: https://sketchfab.com/3d-models/police-car-...)
('2C3CDXBG3LH000015', 'POLICE-001', 'Dodge', 'Charger Pursuit', 2020, 'emergency_police', 2,
 42100, 'gasoline', 18.5, 'in_use', 38500.00,
 '/models/vehicles/emergency/police_car.glb', '2024-10-12', '2025-01-12', '2025-03-31', NOW()),

('2C3CDXBG4LH000016', 'POLICE-002', 'Dodge', 'Charger Pursuit', 2020, 'emergency_police', 2,
 38700, 'gasoline', 18.5, 'available', 38500.00,
 '/models/vehicles/emergency/police_car.glb', '2024-11-01', '2025-02-01', '2025-03-31', NOW()),

-- Ambulances (Sketchfab: https://sketchfab.com/3d-models/ambulance-...)
('4UZAANDW7LC000017', 'MEDIC-001', 'Ford', 'F-450 Ambulance', 2019, 'emergency_ems', 2,
 55300, 'diesel', 40.0, 'in_use', 185000.00,
 '/models/vehicles/emergency/ambulance.glb', '2024-09-30', '2024-12-30', '2025-06-30', NOW()),

('4UZAANDW8LC000018', 'MEDIC-002', 'Ford', 'F-450 Ambulance', 2020, 'emergency_ems', 2,
 48900, 'diesel', 40.0, 'available', 185000.00,
 '/models/vehicles/emergency/ambulance.glb', '2024-10-22', '2025-01-22', '2025-06-30', NOW()),

-- Fire Trucks (Sketchfab: https://sketchfab.com/3d-models/fire-truck-...)
('4M1FL56P8LJ000019', 'FIRE-001', 'Pierce', 'Enforcer Pumper', 2018, 'emergency_fire', 2,
 32100, 'diesel', 50.0, 'available', 550000.00,
 '/models/vehicles/emergency/fire_truck.glb', '2024-11-15', '2025-02-15', '2025-05-31', NOW()),

('4M1FL56P9LJ000020', 'FIRE-002', 'Pierce', 'Arrow XT Ladder', 2019, 'emergency_fire', 2,
 28400, 'diesel', 50.0, 'available', 750000.00,
 '/models/vehicles/emergency/fire_truck.glb', '2024-10-08', '2025-01-08', '2025-04-30', NOW()),

-- CONSTRUCTION & HEAVY EQUIPMENT
-- Excavator (Sketchfab: https://sketchfab.com/3d-models/excavator-...)
('CAT336FL00000021', 'PW-EXCAVATOR-01', 'Caterpillar', '336F L Hydraulic Excavator', 2020, 'construction_excavator', 3,
 1850, 'diesel', 150.0, 'available', 325000.00,
 '/models/vehicles/construction/excavator.glb', '2024-09-18', '2024-12-18', '2025-06-30', NOW()),

-- Dump Truck (Sketchfab: https://sketchfab.com/3d-models/dump-truck-...)
('1FVAG4CY4LH000022', 'PW-DUMP-01', 'Freightliner', '114SD Dump Truck', 2020, 'construction_dump_truck', 3,
 45600, 'diesel', 100.0, 'in_use', 145000.00,
 '/models/vehicles/construction/dump_truck.glb', '2024-10-05', '2025-01-05', '2025-03-31', NOW()),

-- Bulldozer (Sketchfab: https://sketchfab.com/3d-models/bulldozer-...)
('CAT D8T00000023', 'PW-DOZER-01', 'Caterpillar', 'D8T Dozer', 2019, 'construction_bulldozer', 3,
 2340, 'diesel', 210.0, 'available', 480000.00,
 '/models/vehicles/construction/bulldozer.glb', '2024-11-20', '2025-02-20', '2025-05-31', NOW());

-- ============================================================================
-- DRIVER ASSIGNMENTS (Current)
-- ============================================================================

INSERT INTO driver_assignments (driver_id, vehicle_id, assigned_date, status, created_at) VALUES
-- Fleet Operations
(1, 2, '2024-01-15', 'active', NOW()),  -- John Anderson -> Honda Accord
(2, 5, '2024-02-01', 'active', NOW()),  -- Maria Garcia -> Ford Explorer
(3, 8, '2024-03-10', 'active', NOW()),  -- Kevin Lee -> Chevy Tahoe
(4, 10, '2024-04-05', 'active', NOW()), -- Lisa Thompson -> Chevy Silverado

-- Emergency Services
(5, 15, '2024-01-20', 'active', NOW()), -- Officer Wilson -> Police Car 1
(6, 16, '2024-01-20', 'active', NOW()), -- Officer Davis -> Police Car 2
(7, 17, '2024-02-15', 'active', NOW()), -- Paramedic Martinez -> Ambulance 1
(8, 18, '2024-02-15', 'active', NOW()), -- Paramedic Chen -> Ambulance 2

-- Public Works
(11, 22, '2024-03-01', 'active', NOW()), -- Mike Johnson -> Dump Truck
(12, 12, '2024-04-01', 'active', NOW()); -- Carlos Rodriguez -> Ford Transit

-- ============================================================================
-- TRIP LOGS (Recent trips with realistic GPS data - Tallahassee, FL area)
-- ============================================================================

-- Tesla Model 3 - Recent commute
INSERT INTO trip_logs (vehicle_id, driver_id, start_time, end_time, start_location, end_location,
  start_lat, start_lng, end_lat, end_lng, distance_miles, duration_minutes, purpose, created_at) VALUES
(1, 1, '2024-11-26 08:00:00', '2024-11-26 08:25:00',
 'City Hall, Tallahassee', 'Leon County Courthouse',
 30.4383, -84.2807, 30.4415, -84.2793,
 12.5, 25, 'Official Business', NOW()),
(1, 1, '2024-11-25 14:30:00', '2024-11-25 15:10:00',
 'Leon County Courthouse', 'Florida State Capitol',
 30.4415, -84.2793, 30.4383, -84.2807,
 15.2, 40, 'Meeting', NOW());

-- Honda Accord - Fleet inspection route
INSERT INTO trip_logs (vehicle_id, driver_id, start_time, end_time, start_location, end_location,
  start_lat, start_lng, end_lat, end_lng, distance_miles, duration_minutes, purpose, created_at) VALUES
(2, 1, '2024-11-26 09:00:00', '2024-11-26 11:30:00',
 'Fleet Maintenance Depot', 'Regional Service Center',
 30.4250, -84.2950, 30.5100, -84.1850,
 45.8, 150, 'Vehicle Inspection', NOW());

-- Police Patrol - Emergency response
INSERT INTO trip_logs (vehicle_id, driver_id, start_time, end_time, start_location, end_location,
  start_lat, start_lng, end_lat, end_lng, distance_miles, duration_minutes, purpose, created_at) VALUES
(15, 5, '2024-11-26 10:15:00', '2024-11-26 11:45:00',
 'Police Station', 'Incident Location - Apalachee Parkway',
 30.4520, -84.2450, 30.4680, -84.2120,
 28.4, 90, 'Emergency Response', NOW());

-- Ambulance - EMS Call
INSERT INTO trip_logs (vehicle_id, driver_id, start_time, end_time, start_location, end_location,
  start_lat, start_lng, end_lat, end_lng, distance_miles, duration_minutes, purpose, created_at) VALUES
(17, 7, '2024-11-26 11:20:00', '2024-11-26 12:05:00',
 'EMS Station 1', 'Tallahassee Memorial HealthCare',
 30.4390, -84.2650, 30.4527, -84.2492,
 18.6, 45, 'Patient Transport', NOW());

-- Dump Truck - Public Works
INSERT INTO trip_logs (vehicle_id, driver_id, start_time, end_time, start_location, end_location,
  start_lat, start_lng, end_lat, end_lng, distance_miles, duration_minutes, purpose, created_at) VALUES
(22, 11, '2024-11-26 07:00:00', '2024-11-26 16:30:00',
 'Public Works Yard', 'Construction Site - Mahan Drive',
 30.4220, -84.3100, 30.4850, -84.2050,
 92.3, 570, 'Material Delivery', NOW());

-- ============================================================================
-- FUEL TRANSACTIONS (Recent refueling)
-- ============================================================================

INSERT INTO fuel_transactions (vehicle_id, driver_id, transaction_date, fuel_type,
  gallons, price_per_gallon, total_cost, odometer_reading, location, vendor, created_at) VALUES
-- Tesla Model 3 - Charging
(1, 1, '2024-11-25 18:30:00', 'electric', 60.0, 0.12, 7.20, 45200,
 'Tesla Supercharger - Tallahassee', 'Tesla', NOW()),

-- Honda Accord
(2, 1, '2024-11-24 16:00:00', 'gasoline', 12.4, 3.15, 39.06, 67850,
 'Circle K - N Monroe St', 'Circle K', NOW()),

-- Ford Explorer
(5, 2, '2024-11-23 14:20:00', 'gasoline', 16.8, 3.18, 53.42, 34450,
 'Shell - Capital Circle NE', 'Shell', NOW()),

-- Police Car
(15, 5, '2024-11-26 06:00:00', 'gasoline', 14.2, 3.12, 44.30, 42050,
 'City Fleet Fuel Station', 'City Fleet', NOW()),

-- Ambulance - Diesel
(17, 7, '2024-11-25 07:30:00', 'diesel', 28.5, 3.45, 98.33, 55250,
 'BP - Apalachee Parkway', 'BP', NOW()),

-- Dump Truck - Diesel
(22, 11, '2024-11-24 15:00:00', 'diesel', 65.0, 3.42, 222.30, 45550,
 'City Fleet Fuel Station', 'City Fleet', NOW());

-- ============================================================================
-- MAINTENANCE RECORDS (Recent service history)
-- ============================================================================

INSERT INTO maintenance_records (vehicle_id, service_date, service_type, description,
  cost, mileage, technician, next_service_due, created_at) VALUES
-- Tesla Model 3 - Routine Service
(1, '2024-10-15', 'routine', 'Software update, tire rotation, brake inspection, fluid top-offs',
 125.00, 45000, 'Tesla Service Center', '2025-01-15', NOW()),

-- Honda Accord - Oil Change
(2, '2024-09-20', 'oil_change', 'Full synthetic oil change, oil filter, 21-point inspection',
 65.00, 67500, 'Mike Anderson, ASE Certified', '2024-12-20', NOW()),

-- Police Car - Preventive Maintenance
(15, '2024-10-12', 'preventive', 'Transmission service, brake flush, coolant flush, spark plugs',
 485.00, 42000, 'Fleet Maintenance Dept', '2025-01-12', NOW()),

-- Ambulance - Safety Inspection
(17, '2024-09-30', 'inspection', 'DOT safety inspection, emergency equipment check, fluid analysis',
 275.00, 55200, 'Emergency Vehicle Services', '2024-12-30', NOW()),

-- Fire Truck - Annual Service
(19, '2024-11-15', 'major_service', 'Pump service, ladder inspection, emergency systems check, engine diagnostics',
 1850.00, 32000, 'Pierce Fire Apparatus Service', '2025-02-15', NOW()),

-- Dump Truck - Repair
(22, '2024-10-05', 'repair', 'Hydraulic pump replacement, PTO service, brake adjustment',
 950.00, 45500, 'Heavy Equipment Repair Inc', '2025-01-05', NOW()),

-- Excavator - Scheduled Maintenance
(21, '2024-09-18', 'preventive', 'Hydraulic system service, track tension adjustment, engine oil change',
 1250.00, 1800, 'Caterpillar Service', '2024-12-18', NOW());

-- ============================================================================
-- Summary
-- ============================================================================

-- Show counts
DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Database seeding complete!';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Departments: %', (SELECT COUNT(*) FROM departments);
  RAISE NOTICE 'Drivers: %', (SELECT COUNT(*) FROM drivers);
  RAISE NOTICE 'Vehicles: %', (SELECT COUNT(*) FROM vehicles);
  RAISE NOTICE '  - Sedans: %', (SELECT COUNT(*) FROM vehicles WHERE type = 'sedan');
  RAISE NOTICE '  - SUVs: %', (SELECT COUNT(*) FROM vehicles WHERE type = 'suv');
  RAISE NOTICE '  - Trucks: %', (SELECT COUNT(*) FROM vehicles WHERE type = 'truck');
  RAISE NOTICE '  - Vans: %', (SELECT COUNT(*) FROM vehicles WHERE type = 'van');
  RAISE NOTICE '  - Emergency Vehicles: %', (SELECT COUNT(*) FROM vehicles WHERE type LIKE 'emergency_%');
  RAISE NOTICE '  - Construction Equipment: %', (SELECT COUNT(*) FROM vehicles WHERE type LIKE 'construction_%');
  RAISE NOTICE 'Driver Assignments: %', (SELECT COUNT(*) FROM driver_assignments);
  RAISE NOTICE 'Trip Logs: %', (SELECT COUNT(*) FROM trip_logs);
  RAISE NOTICE 'Fuel Transactions: %', (SELECT COUNT(*) FROM fuel_transactions);
  RAISE NOTICE 'Maintenance Records: %', (SELECT COUNT(*) FROM maintenance_records);
  RAISE NOTICE '============================================';
  RAISE NOTICE 'All vehicles are linked to 3D models from Sketchfab';
  RAISE NOTICE 'OBD2 emulator can now generate realistic data';
  RAISE NOTICE '============================================';
END $$;
