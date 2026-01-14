/**
 * Create Test Users for Role-Based Dashboard Testing
 *
 * Password for all test users: Test123!
 * Bcrypt hash (cost=12): $2b$12$7ybcjmhHpXg4YkWOUaqCQuXhytIINyUlOhM1Qwd1rCjqmJPFM45jS
 *
 * SECURITY NOTE: These are test accounts only - DO NOT use in production!
 * Production accounts should have unique, strong passwords.
 */

-- Insert test users with different roles
INSERT INTO users (email, password_hash, full_name, role, tenant_id, created_at, updated_at)
VALUES
  -- Fleet Manager (Level 7)
  ('fleet.manager@test.com', '$2b$12$7ybcjmhHpXg4YkWOUaqCQuXhytIINyUlOhM1Qwd1rCjqmJPFM45jS', 'John Fleet Manager', 'fleet_manager', 1, NOW(), NOW()),

  -- Driver (Level 2)
  ('driver@test.com', '$2b$12$7ybcjmhHpXg4YkWOUaqCQuXhytIINyUlOhM1Qwd1rCjqmJPFM45jS', 'Jane Driver', 'driver', 1, NOW(), NOW()),

  -- Dispatcher (Level 4)
  ('dispatcher@test.com', '$2b$12$7ybcjmhHpXg4YkWOUaqCQuXhytIINyUlOhM1Qwd1rCjqmJPFM45jS', 'Mike Dispatcher', 'Dispatcher', 1, NOW(), NOW()),

  -- Maintenance Manager (Level 4)
  ('mechanic@test.com', '$2b$12$7ybcjmhHpXg4YkWOUaqCQuXhytIINyUlOhM1Qwd1rCjqmJPFM45jS', 'Bob Mechanic', 'Mechanic', 1, NOW(), NOW()),

  -- Admin (Level 10)
  ('admin@test.com', '$2b$12$7ybcjmhHpXg4YkWOUaqCQuXhytIINyUlOhM1Qwd1rCjqmJPFM45jS', 'Sarah Admin', 'admin', 1, NOW(), NOW())
ON CONFLICT (email) DO UPDATE
SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Create corresponding driver records for driver and fleet manager users
INSERT INTO drivers (employee_id, name, email, phone, license_number, license_expiry, license_class, status, assigned_vehicle_id, rating, total_trips, total_miles, safety_score, hire_date, created_at, updated_at)
VALUES
  -- Driver user
  ('EMP001', 'Jane Driver', 'driver@test.com', '555-0001', 'DL123456', NOW() + INTERVAL '2 years', 'C', 'active', 1042, 4.85, 245, 12450, 98, NOW() - INTERVAL '2 years', NOW(), NOW()),

  -- Fleet Manager (also has driver profile for testing)
  ('EMP002', 'John Fleet Manager', 'fleet.manager@test.com', '555-0002', 'DL789012', NOW() + INTERVAL '3 years', 'C', 'active', NULL, 5.00, 50, 2500, 100, NOW() - INTERVAL '5 years', NOW(), NOW())
ON CONFLICT (email) DO UPDATE
SET
  name = EXCLUDED.name,
  assigned_vehicle_id = EXCLUDED.assigned_vehicle_id,
  updated_at = NOW();

-- Ensure vehicle 1042 exists for driver assignment
INSERT INTO vehicles (vehicle_number, make, model, year, vin, license_plate, status, mileage, fuel_type, location, assigned_driver_id, last_service_date, next_service_date, created_at, updated_at)
VALUES
  ('1042', 'Ford', 'F-150', 2022, '1FTFW1E89MFA12345', 'ABC1234', 'active', 45230, 'Gasoline', 'Tallahassee Depot',
   (SELECT id FROM drivers WHERE email = 'driver@test.com'),
   NOW() - INTERVAL '15 days',
   NOW() + INTERVAL '15 days',
   NOW(), NOW())
ON CONFLICT (vehicle_number) DO UPDATE
SET
  assigned_driver_id = (SELECT id FROM drivers WHERE email = 'driver@test.com'),
  status = 'active',
  updated_at = NOW();

-- Update driver assigned_vehicle_id to match vehicle assignment
UPDATE drivers
SET assigned_vehicle_id = (SELECT id FROM vehicles WHERE vehicle_number = '1042')
WHERE email = 'driver@test.com';

-- Create sample maintenance records for testing
INSERT INTO maintenance_records (vehicle_id, vehicle_number, service_type, service_date, next_due, mileage_at_service, next_due_mileage, priority, status, estimated_cost, created_at, updated_at)
VALUES
  -- Overdue maintenance
  ((SELECT id FROM vehicles WHERE vehicle_number = '1042'), '1042', 'Oil Change', NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days', 45000, 48000, 'high', 'scheduled', 89.99, NOW(), NOW()),
  ((SELECT id FROM vehicles WHERE vehicle_number = '1042'), '1042', 'Tire Rotation', NOW() - INTERVAL '15 days', NOW() - INTERVAL '3 days', 45100, 50000, 'medium', 'pending', 49.99, NOW(), NOW()),

  -- Upcoming maintenance
  ((SELECT id FROM vehicles WHERE vehicle_number = '1042'), '1042', 'Brake Inspection', NOW() - INTERVAL '30 days', NOW() + INTERVAL '2 days', 44500, 48000, 'high', 'scheduled', 150.00, NOW(), NOW()),
  ((SELECT id FROM vehicles WHERE vehicle_number = '1042'), '1042', 'Transmission Service', NOW() - INTERVAL '60 days', NOW() + INTERVAL '5 days', 43000, 48000, 'medium', 'scheduled', 250.00, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Create sample fuel transactions
INSERT INTO fuel_transactions (vehicle_id, driver_id, vehicle_number, date, station, gallons, price_per_gallon, total_cost, mpg, odometer_reading, payment_method, created_at)
SELECT
  v.id,
  d.id,
  '1042',
  NOW() - INTERVAL '3 days',
  'Shell Station',
  18.5,
  3.45,
  63.83,
  22.5,
  45200,
  'fleet_card',
  NOW()
FROM vehicles v
JOIN drivers d ON d.email = 'driver@test.com'
WHERE v.vehicle_number = '1042'
ON CONFLICT DO NOTHING;

-- Print success message
DO $$
BEGIN
  RAISE NOTICE '✅ Test users created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Login credentials (password for all users: Test123!):';
  RAISE NOTICE '  Fleet Manager: fleet.manager@test.com';
  RAISE NOTICE '  Driver: driver@test.com';
  RAISE NOTICE '  Dispatcher: dispatcher@test.com';
  RAISE NOTICE '  Mechanic: mechanic@test.com';
  RAISE NOTICE '  Admin: admin@test.com';
  RAISE NOTICE '';
  RAISE NOTICE 'Driver "Jane Driver" is assigned to Vehicle #1042';
END $$;
