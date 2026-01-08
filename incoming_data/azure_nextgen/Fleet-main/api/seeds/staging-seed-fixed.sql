-- ============================================
-- STAGING ENVIRONMENT SEED DATA (Fixed for actual schema)
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
    SELECT id INTO v_tenant_id FROM tenants WHERE subdomain = 'cta-staging' LIMIT 1;

    -- Create if doesn't exist
    IF v_tenant_id IS NULL THEN
        INSERT INTO tenants (name, subdomain, status, active, created_at, updated_at)
        VALUES ('Capital Tech Alliance - Staging', 'cta-staging', 'active', true, NOW(), NOW())
        RETURNING id INTO v_tenant_id;
    END IF;

    RAISE NOTICE 'Using tenant_id: %', v_tenant_id;

    -- Store in temporary table for use in subsequent queries
    CREATE TEMP TABLE IF NOT EXISTS temp_tenant (id INTEGER);
    DELETE FROM temp_tenant;
    INSERT INTO temp_tenant VALUES (v_tenant_id);
END $$;

-- ============================================
-- USERS & DRIVERS (20 drivers)
-- ============================================

-- Insert driver users
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, created_at, updated_at)
SELECT
    t.id,
    'john.smith.stg@cta.com',
    '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m',
    'John', 'Smith', '850-555-1001', 'driver', NOW(), NOW()
FROM temp_tenant t
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'john.smith.stg@cta.com')
UNION ALL
SELECT t.id, 'jane.doe.stg@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Jane', 'Doe', '850-555-1002', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'jane.doe.stg@cta.com')
UNION ALL
SELECT t.id, 'mike.wilson.stg@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Mike', 'Wilson', '850-555-1003', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'mike.wilson.stg@cta.com')
UNION ALL
SELECT t.id, 'sarah.johnson.stg@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Sarah', 'Johnson', '850-555-1004', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'sarah.johnson.stg@cta.com')
UNION ALL
SELECT t.id, 'david.brown.stg@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'David', 'Brown', '850-555-1005', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'david.brown.stg@cta.com')
UNION ALL
SELECT t.id, 'maria.garcia.stg@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Maria', 'Garcia', '850-555-1006', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'maria.garcia.stg@cta.com')
UNION ALL
SELECT t.id, 'robert.miller.stg@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Robert', 'Miller', '850-555-1007', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'robert.miller.stg@cta.com')
UNION ALL
SELECT t.id, 'jennifer.davis.stg@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Jennifer', 'Davis', '850-555-1008', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'jennifer.davis.stg@cta.com')
UNION ALL
SELECT t.id, 'william.martinez.stg@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'William', 'Martinez', '850-555-1009', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'william.martinez.stg@cta.com')
UNION ALL
SELECT t.id, 'patricia.anderson.stg@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Patricia', 'Anderson', '850-555-1010', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'patricia.anderson.stg@cta.com')
UNION ALL
SELECT t.id, 'james.taylor.stg@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'James', 'Taylor', '850-555-1011', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'james.taylor.stg@cta.com')
UNION ALL
SELECT t.id, 'linda.thomas.stg@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Linda', 'Thomas', '850-555-1012', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'linda.thomas.stg@cta.com')
UNION ALL
SELECT t.id, 'charles.jackson.stg@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Charles', 'Jackson', '850-555-1013', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'charles.jackson.stg@cta.com')
UNION ALL
SELECT t.id, 'barbara.white.stg@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Barbara', 'White', '850-555-1014', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'barbara.white.stg@cta.com')
UNION ALL
SELECT t.id, 'joseph.harris.stg@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Joseph', 'Harris', '850-555-1015', 'driver', NOW(), NOW()
FROM temp_tenant t WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'joseph.harris.stg@cta.com');

-- Insert driver records for the users
INSERT INTO drivers (tenant_id, user_id, license_number, license_state, license_expiry, cdl_class, is_active, created_at, updated_at)
SELECT
    u.tenant_id,
    u.id,
    'FL' || LPAD((100000 + ROW_NUMBER() OVER (ORDER BY u.id))::TEXT, 8, '0'),
    'FL',
    CURRENT_DATE + INTERVAL '2 years',
    CASE WHEN ROW_NUMBER() OVER (ORDER BY u.id) % 3 = 0 THEN 'B' ELSE 'C' END,
    TRUE,
    NOW(),
    NOW()
FROM users u
INNER JOIN temp_tenant t ON u.tenant_id = t.id
WHERE u.role = 'driver'
  AND NOT EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = u.id);

-- ============================================
-- VEHICLES (30 vehicles)
-- ============================================

INSERT INTO vehicles (
    tenant_id, vin, make, model, year, license_plate, license_state,
    vehicle_type, fuel_type, status, current_mileage, purchase_date, purchase_price,
    assigned_driver_id, department, location, created_at, updated_at
)
SELECT
    t.id,
    '1FTFW1E' || LPAD((1000000 + n)::TEXT, 10, '0'),
    CASE (n % 6)
        WHEN 0 THEN 'Ford'
        WHEN 1 THEN 'Chevrolet'
        WHEN 2 THEN 'RAM'
        WHEN 3 THEN 'Toyota'
        WHEN 4 THEN 'Tesla'
        ELSE 'Nissan'
    END,
    CASE (n % 6)
        WHEN 0 THEN 'F-150'
        WHEN 1 THEN 'Silverado 1500'
        WHEN 2 THEN 'RAM 1500'
        WHEN 3 THEN 'Tundra'
        WHEN 4 THEN 'Model 3'
        ELSE 'Titan XD'
    END,
    2020 + (n % 5),
    'FL-CTA-' || LPAD(n::TEXT, 4, '0'),
    'FL',
    CASE (n % 6)
        WHEN 4 THEN 'Sedan'
        ELSE 'Pickup Truck'
    END,
    CASE (n % 6)
        WHEN 4 THEN 'Electric'
        WHEN 5 THEN 'Diesel'
        ELSE 'Gasoline'
    END,
    CASE (n % 10)
        WHEN 0 THEN 'maintenance'
        WHEN 1 THEN 'out_of_service'
        ELSE 'active'
    END,
    (15000 + (n * 3000 + (RANDOM() * 5000)::INTEGER))::INTEGER,
    CURRENT_DATE - (365 * 3 + (RANDOM() * 700)::INTEGER),
    35000 + (RANDOM() * 25000)::NUMERIC(10,2),
    (SELECT id FROM drivers WHERE tenant_id = t.id ORDER BY RANDOM() LIMIT 1),
    'Fleet Operations',
    'Tallahassee, FL',
    NOW(),
    NOW()
FROM temp_tenant t
CROSS JOIN generate_series(1, 30) n
WHERE NOT EXISTS (SELECT 1 FROM vehicles WHERE vin = '1FTFW1E' || LPAD((1000000 + n)::TEXT, 10, '0'));

-- ============================================
-- FUEL TRANSACTIONS (100+ transactions)
-- ============================================

INSERT INTO fuel_transactions (
    tenant_id, vehicle_id, driver_id, transaction_date, gallons, price_per_gallon,
    odometer_reading, fuel_type, location, card_number, notes, created_at, updated_at
)
SELECT
    t.id,
    v.id,
    v.assigned_driver_id,
    NOW() - (RANDOM() * INTERVAL '90 days'),
    (10 + RANDOM() * 25)::NUMERIC(8,3),
    (3.20 + RANDOM() * 0.80)::NUMERIC(6,3),
    (v.current_mileage - (RANDOM() * 10000)::INTEGER)::INTEGER,
    v.fuel_type,
    ARRAY['Shell Station - Capital Circle', 'Sunoco - Mahan Drive', 'BP - Tennessee Street'][1 + floor(random() * 3)::int],
    'FC-' || LPAD(floor(random() * 10000)::TEXT, 6, '0'),
    'Regular fuel purchase',
    NOW(),
    NOW()
FROM temp_tenant t
CROSS JOIN vehicles v
CROSS JOIN generate_series(1, 4) gs
WHERE v.tenant_id = t.id
  AND v.fuel_type != 'Electric'
LIMIT 120;

-- ============================================
-- WORK ORDERS (50 work orders)
-- ============================================

INSERT INTO work_orders (
    tenant_id, vehicle_id, work_order_number, description, status, priority,
    scheduled_date, odometer, labor_cost, parts_cost, total_cost,
    assigned_to, notes, created_at, updated_at
)
SELECT
    t.id,
    v.id,
    'WO-STG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(n::TEXT, 5, '0'),
    ARRAY[
        'Oil change and filter replacement',
        'Tire rotation and balance',
        'Replace worn brake pads',
        'Fix coolant leak',
        'Replace battery',
        'Repair AC system',
        'DOT annual inspection',
        '30k mile service',
        'Brake inspection and fluid flush',
        'Transmission service'
    ][1 + (n % 10)],
    CASE (n % 6)
        WHEN 0 THEN 'open'
        WHEN 1 THEN 'in_progress'
        WHEN 2 THEN 'completed'
        WHEN 3 THEN 'completed'
        WHEN 4 THEN 'on_hold'
        ELSE 'completed'
    END,
    CASE (n % 4)
        WHEN 0 THEN 'low'
        WHEN 1 THEN 'medium'
        WHEN 2 THEN 'high'
        ELSE 'critical'
    END,
    CURRENT_DATE - (50 - n) + (RANDOM() * 10)::INTEGER,
    v.current_mileage,
    (2.0 + RANDOM() * 6.0) * 85.0,
    RANDOM() * 500,
    ((2.0 + RANDOM() * 6.0) * 85.0) + (RANDOM() * 500),
    (SELECT id FROM users WHERE tenant_id = t.id AND role = 'driver' ORDER BY RANDOM() LIMIT 1),
    'Work order ' || n,
    NOW() - ((50 - n) * INTERVAL '1 day'),
    NOW()
FROM temp_tenant t
CROSS JOIN generate_series(1, 50) n
CROSS JOIN LATERAL (
    SELECT id, current_mileage FROM vehicles WHERE tenant_id = t.id ORDER BY RANDOM() LIMIT 1
) v
WHERE NOT EXISTS (
    SELECT 1 FROM work_orders
    WHERE work_order_number = 'WO-STG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(n::TEXT, 5, '0')
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
    ARRAY['Oil Change', 'Tire Rotation', 'Brake Inspection', 'Transmission Service'][1 + (n % 4)],
    CURRENT_DATE - (n * 30),
    v.current_mileage - (n * 500),
    (100 + RANDOM() * 400)::NUMERIC(10,2),
    'AutoZone Commercial',
    'Scheduled maintenance completed',
    NOW(),
    NOW()
FROM temp_tenant t
CROSS JOIN vehicles v
CROSS JOIN generate_series(1, 3) n
WHERE v.tenant_id = t.id
LIMIT 90;

COMMIT;

-- ============================================
-- VERIFY DATA
-- ============================================
DO $$
DECLARE
    v_tenant_id INTEGER;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE subdomain = 'cta-staging';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'STAGING SEED DATA SUMMARY';
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
