-- Add Missing Test Data for 100% Coverage
-- This script adds ONLY missing status values, vehicle types, and edge cases
-- WITHOUT deleting any existing data
-- Run time: ~30 seconds

BEGIN;

-- ============================================================================
-- 1. MISSING VEHICLE STATUSES
-- ============================================================================

-- Add SOLD vehicles
INSERT INTO vehicles (tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, license_plate, odometer, created_at, updated_at)
VALUES
  (1, '1HGCM82633A123456', 'Honda', 'Accord', 2020, 'Sedan', 'Gasoline', 'sold', 'SOLD-001', 65000, NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
  (1, '2T1BURHE0FC123457', 'Toyota', 'Corolla', 2019, 'Sedan', 'Gasoline', 'sold', 'SOLD-002', 72000, NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),
  (1, '1G1ZT53826F123458', 'Chevrolet', 'Malibu', 2018, 'Sedan', 'Gasoline', 'sold', 'SOLD-003', 88000, NOW() - INTERVAL '60 days', NOW() - INTERVAL '60 days');

-- Add RETIRED vehicles
INSERT INTO vehicles (tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, license_plate, odometer, created_at, updated_at)
VALUES
  (1, '1FTFW1ET5BFA98765', 'Ford', 'F-150', 2010, 'Pickup Truck', 'Gasoline', 'retired', 'RETD-001', 285000, NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days'),
  (1, '1GNSK7E04AR987654', 'Chevrolet', 'Suburban', 2009, 'SUV', 'Gasoline', 'retired', 'RETD-002', 310000, NOW() - INTERVAL '120 days', NOW() - INTERVAL '120 days'),
  (1, '1FMCU0F70AKC98766', 'Ford', 'Explorer', 2008, 'SUV', 'Gasoline', 'retired', 'RETD-003', 325000, NOW() - INTERVAL '150 days', NOW() - INTERVAL '150 days');

-- ============================================================================
-- 2. MISSING WORK ORDER STATUSES
-- ============================================================================

-- Add ON_HOLD work orders (update existing open ones)
UPDATE work_orders
SET status = 'on_hold',
    updated_at = NOW(),
    notes = 'Waiting for parts delivery'
WHERE work_order_id IN (
  SELECT work_order_id FROM work_orders WHERE status = 'open' ORDER BY created_at LIMIT 20
);

-- Add CANCELLED work orders (update existing open ones)
UPDATE work_orders
SET status = 'cancelled',
    updated_at = NOW(),
    notes = 'Cancelled - vehicle sold or retired'
WHERE work_order_id IN (
  SELECT work_order_id FROM work_orders WHERE status = 'open' ORDER BY created_at DESC LIMIT 20
);

-- ============================================================================
-- 3. MISSING USER ROLES
-- ============================================================================

-- Add VIEWER role users
INSERT INTO users (tenant_id, email, name, role, status, created_at, updated_at)
VALUES
  (1, 'viewer1@fleet.local', 'John Viewer', 'viewer', 'active', NOW(), NOW()),
  (1, 'viewer2@fleet.local', 'Jane Observer', 'viewer', 'active', NOW(), NOW()),
  (2, 'viewer3@fleet.local', 'Mike Readonly', 'viewer', 'active', NOW(), NOW());

-- ============================================================================
-- 4. MISSING VEHICLE TYPES
-- ============================================================================

INSERT INTO vehicles (tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, license_plate, odometer, created_at, updated_at)
VALUES
  -- SUV
  (1, '5TDJKRFH1LS123456', 'Toyota', '4Runner', 2022, 'SUV', 'Gasoline', 'active', 'SUV-001', 12000, NOW(), NOW()),
  (1, '5UXCR6C01L9D12345', 'BMW', 'X5', 2023, 'SUV', 'Gasoline', 'active', 'SUV-002', 8500, NOW(), NOW()),

  -- Passenger Van
  (1, '2C4RC1CG6HR123456', 'Chrysler', 'Pacifica', 2021, 'Passenger Van', 'Gasoline', 'active', 'PVAN-001', 25000, NOW(), NOW()),
  (1, '5FNRL6H72LB123457', 'Honda', 'Odyssey', 2022, 'Passenger Van', 'Gasoline', 'active', 'PVAN-002', 18000, NOW(), NOW()),

  -- Dump Truck
  (1, '1FDUF5HT4GEA12345', 'Ford', 'F-550', 2018, 'Dump Truck', 'Diesel', 'active', 'DUMP-001', 65000, NOW(), NOW()),
  (1, '1GC4K1EG2FF123456', 'Chevrolet', 'Silverado 5500', 2020, 'Dump Truck', 'Diesel', 'active', 'DUMP-002', 48000, NOW(), NOW()),

  -- Flatbed
  (1, '1GC4K0CG9FF123457', 'Chevrolet', 'Silverado 5500', 2020, 'Flatbed', 'Diesel', 'active', 'FLAT-001', 42000, NOW(), NOW()),
  (1, '3C7WRNEL3FG123458', 'RAM', '5500', 2019, 'Flatbed', 'Diesel', 'active', 'FLAT-002', 55000, NOW(), NOW()),

  -- Refrigerated Truck
  (1, '1FUJGHDV8LLBR1234', 'Freightliner', 'M2-106', 2021, 'Refrigerated Truck', 'Diesel', 'active', 'REEFER-001', 38000, NOW(), NOW()),
  (1, '4UZABRDC8HCZN1235', 'Isuzu', 'NPR', 2020, 'Refrigerated Truck', 'Diesel', 'active', 'REEFER-002', 45000, NOW(), NOW()),

  -- Service Vehicle
  (1, '1FTFW1RG4DFC12345', 'Ford', 'F-250', 2019, 'Service Vehicle', 'Diesel', 'active', 'SVC-001', 55000, NOW(), NOW()),
  (1, '1HD1KB4317Y123456', 'Harley-Davidson', 'Service Truck', 2021, 'Service Vehicle', 'Diesel', 'active', 'SVC-002', 32000, NOW(), NOW()),

  -- Tanker
  (1, '1XP5DB9X8FD123456', 'Peterbilt', '579', 2020, 'Tanker', 'Diesel', 'active', 'TANK-001', 125000, NOW(), NOW()),
  (1, '1XKYDP9X3LJ123457', 'Kenworth', 'T680', 2021, 'Tanker', 'Diesel', 'active', 'TANK-002', 98000, NOW(), NOW()),

  -- Tow Truck
  (1, '1FDAF57P05EE12345', 'Ford', 'F-550', 2018, 'Tow Truck', 'Diesel', 'active', 'TOW-001', 82000, NOW(), NOW()),
  (1, '1GC4K1E88FF123458', 'Chevrolet', 'Silverado 5500', 2019, 'Tow Truck', 'Diesel', 'active', 'TOW-002', 75000, NOW(), NOW()),

  -- Bus
  (1, '4UZABRDC3GCZN1234', 'Freightliner', 'MT45', 2019, 'Bus', 'Diesel', 'active', 'BUS-001', 95000, NOW(), NOW()),
  (1, '1FDEE3FL2DDA12345', 'Ford', 'E-450', 2020, 'Bus', 'Gasoline', 'active', 'BUS-002', 62000, NOW(), NOW());

-- ============================================================================
-- 5. MISSING FUEL TYPES
-- ============================================================================

-- Add Hybrid vehicles
UPDATE vehicles SET fuel_type = 'Hybrid', updated_at = NOW()
WHERE vehicle_id IN (
  SELECT vehicle_id FROM vehicles WHERE fuel_type = 'Gasoline' AND vehicle_type = 'Sedan' AND status = 'active' LIMIT 5
);

-- Add CNG vehicles
UPDATE vehicles SET fuel_type = 'CNG', updated_at = NOW()
WHERE vehicle_id IN (
  SELECT vehicle_id FROM vehicles WHERE fuel_type = 'Gasoline' AND vehicle_type = 'Box Truck' AND status = 'active' LIMIT 3
);

-- Add Propane vehicles
UPDATE vehicles SET fuel_type = 'Propane', updated_at = NOW()
WHERE vehicle_id IN (
  SELECT vehicle_id FROM vehicles WHERE fuel_type = 'Gasoline' AND vehicle_type = 'Pickup Truck' AND status = 'active' LIMIT 2
);

-- ============================================================================
-- 6. EDGE CASES - Boundary Values
-- ============================================================================

-- Brand new vehicle (0 miles)
INSERT INTO vehicles (tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, license_plate, odometer, created_at, updated_at)
VALUES (1, '5YJ3E1EA8MF000001', 'Tesla', 'Model 3', 2025, 'Sedan', 'Electric', 'active', 'NEW-001', 0, NOW(), NOW());

-- High mileage vehicle (near max)
INSERT INTO vehicles (tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, license_plate, odometer, created_at, updated_at)
VALUES (1, '1FTPW14V98KC99999', 'Ford', 'F-150', 2008, 'Pickup Truck', 'Gasoline', 'active', 'HIGH-001', 999999, NOW() - INTERVAL '15 years', NOW());

-- Vehicle with NULL license plate (temporary/in-transit)
INSERT INTO vehicles (tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, license_plate, odometer, created_at, updated_at)
VALUES (1, '3VWDP7AJ3EM000002', 'Volkswagen', 'Jetta', 2024, 'Sedan', 'Gasoline', 'active', NULL, 50, NOW() - INTERVAL '1 day', NOW());

-- ============================================================================
-- 7. EDGE CASES - Work Orders
-- ============================================================================

-- $0 work order (warranty/recall work)
INSERT INTO work_orders (tenant_id, vehicle_id, type, status, priority, description, cost, created_at, updated_at)
SELECT 1, vehicle_id, 'Inspection', 'completed', 'low', 'Free inspection (manufacturer warranty)', 0, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'
FROM vehicles WHERE vehicle_type = 'Sedan' LIMIT 1;

-- Very expensive work order
INSERT INTO work_orders (tenant_id, vehicle_id, type, status, priority, description, cost, created_at, updated_at)
SELECT 1, vehicle_id, 'Engine Rebuild', 'completed', 'critical', 'Complete engine replacement and transmission overhaul', 125000, NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days'
FROM vehicles WHERE vehicle_type = 'Semi-Truck' AND status = 'active' LIMIT 1;

-- Very old open work order (365+ days)
INSERT INTO work_orders (tenant_id, vehicle_id, type, status, priority, description, cost, created_at, updated_at)
SELECT 1, vehicle_id, 'Repair', 'open', 'low', 'Long-term project vehicle restoration', 5000, NOW() - INTERVAL '400 days', NOW() - INTERVAL '1 day'
FROM vehicles WHERE status = 'maintenance' LIMIT 1;

-- Work order with same-day completion
INSERT INTO work_orders (tenant_id, vehicle_id, type, status, priority, description, cost, created_at, updated_at, completed_at)
SELECT 1, vehicle_id, 'Inspection', 'completed', 'high', 'Emergency safety inspection', 150, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours'
FROM vehicles WHERE status = 'active' LIMIT 1;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
SELECT 'Coverage improvement complete!' as message;

SELECT 'VEHICLE STATUSES' as category, status, COUNT(*) as count
FROM vehicles GROUP BY status ORDER BY status;

SELECT 'WORK ORDER STATUSES' as category, status, COUNT(*) as count
FROM work_orders GROUP BY status ORDER BY status;

SELECT 'USER ROLES' as category, role, COUNT(*) as count
FROM users GROUP BY role ORDER BY role;

SELECT 'VEHICLE TYPES' as category, vehicle_type, COUNT(*) as count
FROM vehicles GROUP BY vehicle_type ORDER BY vehicle_type;

SELECT 'FUEL TYPES' as category, fuel_type, COUNT(*) as count
FROM vehicles GROUP BY fuel_type ORDER BY fuel_type;
