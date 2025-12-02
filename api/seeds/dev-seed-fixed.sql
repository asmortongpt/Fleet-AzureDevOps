-- ============================================
-- DEV ENVIRONMENT SEED DATA (Fixed for actual schema)
-- Fleet Management System
-- Generated: 2025-11-12
-- ============================================

-- Start transaction
BEGIN;

-- Get or create tenant
DO $$
DECLARE
    v_tenant_id INTEGER;
BEGIN
    -- Try to find existing tenant
    SELECT id INTO v_tenant_id FROM tenants WHERE subdomain = 'cta-dev' LIMIT 1;

    -- Create if doesn't exist
    IF v_tenant_id IS NULL THEN
        INSERT INTO tenants (name, subdomain, status, active, created_at, updated_at)
        VALUES ('Capital Tech Alliance - Development', 'cta-dev', 'active', true, NOW(), NOW())
        RETURNING id INTO v_tenant_id;
    END IF;

    RAISE NOTICE 'Using tenant_id: %', v_tenant_id;

    -- Store in temporary table for use in subsequent queries
    CREATE TEMP TABLE IF NOT EXISTS temp_tenant (id INTEGER);
    DELETE FROM temp_tenant;
    INSERT INTO temp_tenant VALUES (v_tenant_id);
END $$;

-- ============================================
-- USERS & DRIVERS (20 drivers with different names)
-- ============================================

-- Insert driver users
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, created_at, updated_at)
SELECT
    t.id,
    'andrew.adams.dev@cta.com',
    '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m',
    'Andrew', 'Adams', '850-555-5001', 'driver', NOW(), NOW()
FROM temp_tenant t
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'andrew.adams.dev@cta.com')
UNION ALL
SELECT t.id, 'betty.baker.dev@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Betty', 'Baker', '850-555-5002', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'betty.baker.dev@cta.com')
UNION ALL
SELECT t.id, 'carl.carter.dev@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Carl', 'Carter', '850-555-5003', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'carl.carter.dev@cta.com')
UNION ALL
SELECT t.id, 'diana.davis.dev@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Diana', 'Davis', '850-555-5004', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'diana.davis.dev@cta.com')
UNION ALL
SELECT t.id, 'edward.evans.dev@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Edward', 'Evans', '850-555-5005', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'edward.evans.dev@cta.com')
UNION ALL
SELECT t.id, 'fiona.fisher.dev@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Fiona', 'Fisher', '850-555-5006', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'fiona.fisher.dev@cta.com')
UNION ALL
SELECT t.id, 'george.garcia.dev@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'George', 'Garcia', '850-555-5007', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'george.garcia.dev@cta.com')
UNION ALL
SELECT t.id, 'helen.harris.dev@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Helen', 'Harris', '850-555-5008', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'helen.harris.dev@cta.com')
UNION ALL
SELECT t.id, 'ivan.irwin.dev@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Ivan', 'Irwin', '850-555-5009', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'ivan.irwin.dev@cta.com')
UNION ALL
SELECT t.id, 'julia.jones.dev@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Julia', 'Jones', '850-555-5010', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'julia.jones.dev@cta.com')
UNION ALL
SELECT t.id, 'kevin.kelly.dev@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Kevin', 'Kelly', '850-555-5011', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'kevin.kelly.dev@cta.com')
UNION ALL
SELECT t.id, 'laura.lopez.dev@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Laura', 'Lopez', '850-555-5012', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'laura.lopez.dev@cta.com')
UNION ALL
SELECT t.id, 'martin.murphy.dev@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Martin', 'Murphy', '850-555-5013', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'martin.murphy.dev@cta.com')
UNION ALL
SELECT t.id, 'nora.nelson.dev@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Nora', 'Nelson', '850-555-5014', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'nora.nelson.dev@cta.com')
UNION ALL
SELECT t.id, 'oscar.owens.dev@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Oscar', 'Owens', '850-555-5015', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'oscar.owens.dev@cta.com');

-- Insert driver records for the users
INSERT INTO drivers (tenant_id, user_id, license_number, license_state, license_expiry, cdl_class, is_active, created_at, updated_at)
SELECT
    u.tenant_id,
    u.id,
    'FL' || LPAD((200000 + ROW_NUMBER() OVER (ORDER BY u.id))::TEXT, 8, '0'),
    'FL',
    CURRENT_DATE + INTERVAL '3 years',
    CASE WHEN ROW_NUMBER() OVER (ORDER BY u.id) % 4 = 0 THEN 'A' WHEN ROW_NUMBER() OVER (ORDER BY u.id) % 4 = 1 THEN 'B' ELSE 'C' END,
    TRUE,
    NOW(),
    NOW()
FROM users u
INNER JOIN temp_tenant t ON u.tenant_id = t.id
WHERE u.role = 'driver'
  AND NOT EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = u.id);

-- ============================================
-- VEHICLES (25 vehicles - different from staging)
-- ============================================

INSERT INTO vehicles (
    tenant_id, vin, make, model, year, license_plate, license_state,
    vehicle_type, fuel_type, status, current_mileage, purchase_date, purchase_price,
    assigned_driver_id, department, location, created_at, updated_at
)
SELECT
    t.id,
    '2FTFW1E' || LPAD((2000000 + n)::TEXT, 10, '0'),
    CASE (n % 8)
        WHEN 0 THEN 'Ford'
        WHEN 1 THEN 'Chevrolet'
        WHEN 2 THEN 'RAM'
        WHEN 3 THEN 'Toyota'
        WHEN 4 THEN 'Tesla'
        WHEN 5 THEN 'Nissan'
        WHEN 6 THEN 'GMC'
        ELSE 'Honda'
    END,
    CASE (n % 8)
        WHEN 0 THEN 'F-250 Super Duty'
        WHEN 1 THEN 'Silverado 2500HD'
        WHEN 2 THEN 'RAM 2500'
        WHEN 3 THEN 'Tacoma'
        WHEN 4 THEN 'Model Y'
        WHEN 5 THEN 'Frontier'
        WHEN 6 THEN 'Sierra 1500'
        ELSE 'Ridgeline'
    END,
    2021 + (n % 4),
    'FL-DEV-' || LPAD(n::TEXT, 4, '0'),
    'FL',
    CASE (n % 8)
        WHEN 4 THEN 'SUV'
        ELSE 'Pickup Truck'
    END,
    CASE (n % 8)
        WHEN 4 THEN 'Electric'
        WHEN 1 THEN 'Diesel'
        WHEN 2 THEN 'Diesel'
        ELSE 'Gasoline'
    END,
    CASE (n % 8)
        WHEN 0 THEN 'maintenance'
        WHEN 7 THEN 'out_of_service'
        ELSE 'active'
    END,
    (20000 + (n * 2500 + (RANDOM() * 4000)::INTEGER))::INTEGER,
    CURRENT_DATE - (365 * 2 + (RANDOM() * 500)::INTEGER),
    40000 + (RANDOM() * 30000)::NUMERIC(10,2),
    (SELECT id FROM drivers WHERE tenant_id = t.id ORDER BY RANDOM() LIMIT 1),
    'Fleet Development',
    'Tallahassee, FL',
    NOW(),
    NOW()
FROM temp_tenant t
CROSS JOIN generate_series(1, 25) n
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE vin = '2FTFW1E' || LPAD((2000000 + n)::TEXT, 10, '0'));

-- ============================================
-- FUEL TRANSACTIONS (120+ transactions)
-- ============================================

INSERT INTO fuel_transactions (
    tenant_id, vehicle_id, driver_id, transaction_date, gallons, price_per_gallon,
    odometer_reading, fuel_type, location, card_number, notes, created_at, updated_at
)
SELECT
    t.id,
    v.id,
    v.assigned_driver_id,
    NOW() - (RANDOM() * INTERVAL '120 days'),
    (12 + RANDOM() * 30)::NUMERIC(8,3),
    (3.15 + RANDOM() * 0.95)::NUMERIC(6,3),
    (v.current_mileage - (RANDOM() * 15000)::INTEGER)::INTEGER,
    v.fuel_type,
    ARRAY['BP Station - Innovation', 'Marathon - Fleet Way', 'Shell - Tech Blvd'][1 + floor(random() * 3)::int],
    'DEV-FC-' || LPAD(floor(random() * 20000)::TEXT, 6, '0'),
    'Dev environment fuel transaction',
    NOW(),
    NOW()
FROM temp_tenant t
CROSS JOIN vehicles v
CROSS JOIN generate_series(1, 5) gs
WHERE v.tenant_id = t.id
  AND v.fuel_type != 'Electric'
LIMIT 125;

-- ============================================
-- WORK ORDERS (40 work orders)
-- ============================================

INSERT INTO work_orders (
    tenant_id, vehicle_id, work_order_number, description, status, priority,
    scheduled_date, odometer, labor_cost, parts_cost, total_cost,
    assigned_to, notes, created_at, updated_at
)
SELECT
    t.id,
    v.id,
    'WO-DEV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(n::TEXT, 5, '0'),
    ARRAY[
        '60k mile major service',
        'Oil and filter change',
        'Tire rotation service',
        'Complete brake system inspection',
        'Transmission fluid service',
        'Coolant system flush',
        'Replace front brake pads and rotors',
        'Repair coolant system leak',
        'Replace dead battery',
        'Diagnose and repair AC compressor'
    ][1 + (n % 10)],
    CASE (n % 7)
        WHEN 0 THEN 'open'
        WHEN 1 THEN 'in_progress'
        WHEN 2 THEN 'in_progress'
        WHEN 3 THEN 'completed'
        WHEN 4 THEN 'completed'
        WHEN 5 THEN 'on_hold'
        ELSE 'completed'
    END,
    CASE (n % 6)
        WHEN 0 THEN 'low'
        WHEN 1 THEN 'medium'
        WHEN 2 THEN 'medium'
        WHEN 3 THEN 'high'
        ELSE 'critical'
    END,
    CURRENT_DATE - (40 - n) + (RANDOM() * 8)::INTEGER,
    v.current_mileage,
    (1.5 + RANDOM() * 8.0) * 95.0,
    RANDOM() * 800,
    ((1.5 + RANDOM() * 8.0) * 95.0) + (RANDOM() * 800),
    (SELECT id FROM users WHERE tenant_id = t.id AND role = 'driver' ORDER BY RANDOM() LIMIT 1),
    'Dev work order ' || n,
    NOW() - ((40 - n) * INTERVAL '1 day'),
    NOW()
FROM temp_tenant t
CROSS JOIN generate_series(1, 40) n
CROSS JOIN LATERAL (
    SELECT id, current_mileage FROM vehicles WHERE tenant_id = t.id ORDER BY RANDOM() LIMIT 1
) v
WHERE NOT EXISTS (
    SELECT 1 FROM work_orders
    WHERE work_order_number = 'WO-DEV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(n::TEXT, 5, '0')
);

-- ============================================
-- MAINTENANCE RECORDS
-- ============================================

INSERT INTO maintenance_records (
    tenant_id, vehicle_id, service_type, service_date, odometer, cost,
    service_provider, notes, created_at, updated_at
)
SELECT
    t.id,
    v.id,
    ARRAY['Oil and Filter Change', 'Tire Rotation', 'Brake System Inspection', 'Transmission Fluid Service', 'Coolant System Flush'][1 + (n % 5)],
    CURRENT_DATE - (n * 25),
    v.current_mileage - (n * 600),
    (120 + RANDOM() * 500)::NUMERIC(10,2),
    'Fleet Parts Direct',
    'Automated schedule - completed',
    NOW(),
    NOW()
FROM temp_tenant t
CROSS JOIN vehicles v
CROSS JOIN generate_series(1, 3) n
WHERE v.tenant_id = t.id
LIMIT 75;

COMMIT;

-- ============================================
-- VERIFY DATA
-- ============================================
DO $$
DECLARE
    v_tenant_id INTEGER;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE subdomain = 'cta-dev';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'DEV SEED DATA SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tenant: % (ID: %)', (SELECT name FROM tenants WHERE id = v_tenant_id), v_tenant_id;
    RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM users WHERE tenant_id = v_tenant_id);
    RAISE NOTICE 'Drivers: %', (SELECT COUNT(*) FROM drivers WHERE tenant_id = v_tenant_id);
    RAISE NOTICE 'Vehicles: %', (SELECT COUNT(*) FROM vehicles WHERE tenant_id = v_tenant_id);
    RAISE NOTICE 'Fuel Transactions: %', (SELECT COUNT(*) FROM fuel_transactions WHERE tenant_id = v_tenant_id);
    RAISE NOTICE 'Work Orders: %', (SELECT COUNT(*) FROM work_orders WHERE tenant_id = v_tenant_id);
    RAISE NOTICE 'Maintenance Records: %', (SELECT COUNT(*) FROM maintenance_records WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '========================================';
END $$;
