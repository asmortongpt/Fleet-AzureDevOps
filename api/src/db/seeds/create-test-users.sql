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
INSERT INTO users (email, password_hash, first_name, last_name, role, tenant_id, created_at, updated_at)
VALUES
  -- Fleet Manager (Level 7)
  ('fleet.manager@test.com', '$2b$12$7ybcjmhHpXg4YkWOUaqCQuXhytIINyUlOhM1Qwd1rCjqmJPFM45jS', 'John', 'Fleet Manager', 'fleet_manager', '00000000-0000-0000-0000-000000000001'::uuid, NOW(), NOW()),

  -- Driver (Level 2)
  ('driver@test.com', '$2b$12$7ybcjmhHpXg4YkWOUaqCQuXhytIINyUlOhM1Qwd1rCjqmJPFM45jS', 'Jane', 'Driver', 'driver', '00000000-0000-0000-0000-000000000001'::uuid, NOW(), NOW()),

  -- Admin (Level 10)
  ('admin@test.com', '$2b$12$7ybcjmhHpXg4YkWOUaqCQuXhytIINyUlOhM1Qwd1rCjqmJPFM45jS', 'Sarah', 'Admin', 'admin', '00000000-0000-0000-0000-000000000001'::uuid, NOW(), NOW()),

  -- Technician
  ('mechanic@test.com', '$2b$12$7ybcjmhHpXg4YkWOUaqCQuXhytIINyUlOhM1Qwd1rCjqmJPFM45jS', 'Bob', 'Mechanic', 'technician', '00000000-0000-0000-0000-000000000001'::uuid, NOW(), NOW()),

  -- Viewer
  ('viewer@test.com', '$2b$12$7ybcjmhHpXg4YkWOUaqCQuXhytIINyUlOhM1Qwd1rCjqmJPFM45jS', 'Mike', 'Viewer', 'viewer', '00000000-0000-0000-0000-000000000001'::uuid, NOW(), NOW())
ON CONFLICT (email) DO UPDATE
SET
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  updated_at = NOW();

-- Create corresponding driver records for driver and fleet manager users
INSERT INTO drivers (
  tenant_id,
  user_id,
  employee_number,
  first_name,
  last_name,
  email,
  phone,
  license_number,
  license_state,
  license_expiration,
  cdl_class,
  status,
  safety_score,
  total_miles_driven,
  hire_date,
  created_at,
  updated_at
)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  u.id,
  'EMP001',
  'Jane',
  'Driver',
  'driver@test.com',
  '555-0001',
  'DL123456',
  'FL',
  (NOW() + INTERVAL '2 years')::date,
  'C',
  'active',
  98.00,
  12450.00,
  (NOW() - INTERVAL '2 years')::date,
  NOW(),
  NOW()
FROM users u WHERE u.email = 'driver@test.com'
ON CONFLICT (license_number) DO UPDATE
SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- Fleet Manager driver profile
INSERT INTO drivers (
  tenant_id,
  user_id,
  employee_number,
  first_name,
  last_name,
  email,
  phone,
  license_number,
  license_state,
  license_expiration,
  cdl_class,
  status,
  safety_score,
  total_miles_driven,
  hire_date,
  created_at,
  updated_at
)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  u.id,
  'EMP002',
  'John',
  'Fleet Manager',
  'fleet.manager@test.com',
  '555-0002',
  'DL789012',
  'FL',
  (NOW() + INTERVAL '3 years')::date,
  'C',
  'active',
  100.00,
  2500.00,
  (NOW() - INTERVAL '5 years')::date,
  NOW(),
  NOW()
FROM users u WHERE u.email = 'fleet.manager@test.com'
ON CONFLICT (license_number) DO UPDATE
SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- Ensure vehicle 1042 exists for driver assignment
INSERT INTO vehicles (
  tenant_id,
  number,
  make,
  model,
  year,
  vin,
  license_plate,
  status,
  odometer,
  fuel_type,
  location_address,
  assigned_driver_id,
  last_service_date,
  next_service_date,
  created_at,
  updated_at
)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  '1042',
  'Ford',
  'F-150',
  2022,
  '1FTFW1E89MFA12345',
  'ABC1234',
  'active',
  45230.00,
  'Gasoline',
  'Tallahassee Depot',
  u.id,
  (NOW() - INTERVAL '15 days')::date,
  (NOW() + INTERVAL '15 days')::date,
  NOW(),
  NOW()
FROM users u WHERE u.email = 'driver@test.com'
ON CONFLICT (vin) DO UPDATE
SET
  assigned_driver_id = (SELECT id FROM users WHERE email = 'driver@test.com'),
  status = 'active',
  updated_at = NOW();

-- Create sample work orders for testing
INSERT INTO work_orders (
  tenant_id,
  work_order_number,
  number,
  vehicle_id,
  assigned_technician_id,
  type,
  priority,
  status,
  description,
  odometer_reading,
  scheduled_start,
  scheduled_end,
  estimated_cost,
  created_at,
  updated_at
)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  'WO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
  'WO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-001',
  v.id,
  u.id,
  'preventive',
  'high',
  'open',
  'Oil Change - Overdue',
  45000.00,
  (NOW() - INTERVAL '5 days')::date,
  (NOW() + INTERVAL '2 days')::date,
  89.99,
  NOW(),
  NOW()
FROM vehicles v
CROSS JOIN users u
WHERE v.vin = '1FTFW1E89MFA12345'
  AND u.email = 'mechanic@test.com'
ON CONFLICT (work_order_number) DO NOTHING;

-- Create sample fuel transactions
INSERT INTO fuel_transactions (
  tenant_id,
  vehicle_id,
  driver_id,
  transaction_date,
  fuel_type,
  gallons,
  price_per_gallon,
  odometer_reading,
  location,
  created_at
)
SELECT
  '00000000-0000-0000-0000-000000000001'::uuid,
  v.id,
  d.id,
  NOW() - INTERVAL '3 days',
  'Gasoline',
  18.5,
  3.45,
  45200.00,
  'Shell Station - Tallahassee',
  NOW()
FROM vehicles v
JOIN drivers d ON d.email = 'driver@test.com'
WHERE v.vin = '1FTFW1E89MFA12345'
ON CONFLICT DO NOTHING;

-- Print success message
DO $$
BEGIN
  RAISE NOTICE '✅ Test users created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Login credentials (password for all users: Test123!):';
  RAISE NOTICE '  Admin: admin@test.com';
  RAISE NOTICE '  Fleet Manager: fleet.manager@test.com';
  RAISE NOTICE '  Driver: driver@test.com';
  RAISE NOTICE '  Technician: mechanic@test.com';
  RAISE NOTICE '  Viewer: viewer@test.com';
  RAISE NOTICE '';
  RAISE NOTICE 'Driver "Jane Driver" is assigned to Vehicle #1042';
END $$;
