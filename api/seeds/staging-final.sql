-- =========================================================================
-- STAGING ENVIRONMENT SEED DATA - Final Version
-- Compatible with actual database schema
-- =========================================================================

BEGIN;

-- Get or create tenant
DO $$
DECLARE v_tenant_id INTEGER;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE subdomain = 'cta-staging' LIMIT 1;
    IF v_tenant_id IS NULL THEN
        INSERT INTO tenants (name, subdomain, status, active) VALUES ('CTA Staging', 'cta-staging', 'active', true) RETURNING id INTO v_tenant_id;
    END IF;
    CREATE TEMP TABLE IF NOT EXISTS temp_tenant (id INTEGER);
    DELETE FROM temp_tenant;
    INSERT INTO temp_tenant VALUES (v_tenant_id);
END $$;

-- 15 Driver Users
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status)
SELECT t.id, 'driver' || n || '.staging@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m',
    'Driver', 'Staging' || n, 'driver', 'active'
FROM temp_tenant t CROSS JOIN generate_series(1, 15) n
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'driver' || n || '.staging@cta.com');

-- Driver Records
INSERT INTO drivers (tenant_id, user_id, license_number, license_state, license_expiry, hire_date, status)
SELECT u.tenant_id, u.id, 'FL' || LPAD((100000 + u.id)::TEXT, 8, '0'), 'FL', CURRENT_DATE + INTERVAL '2 years', CURRENT_DATE - INTERVAL '1 year', 'active'
FROM users u INNER JOIN temp_tenant t ON u.tenant_id = t.id
WHERE u.role = 'driver' AND NOT EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = u.id);

-- 30 Vehicles
INSERT INTO vehicles (tenant_id, vin, make, model, year, license_plate, license_state, vehicle_type, fuel_type, status, current_mileage, purchase_date, purchase_price, assigned_driver_id, department, location)
SELECT t.id, '1FT' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 14)),
    CASE (n % 5) WHEN 0 THEN 'Ford' WHEN 1 THEN 'Chevrolet' WHEN 2 THEN 'RAM' WHEN 3 THEN 'Toyota' ELSE 'Nissan' END,
    CASE (n % 5) WHEN 0 THEN 'F-150' WHEN 1 THEN 'Silverado' WHEN 2 THEN '1500' WHEN 3 THEN 'Tundra' ELSE 'Titan' END,
    2020 + (n % 5), 'FL-STG-' || LPAD(n::TEXT, 4, '0'), 'FL', 'Pickup Truck',
    CASE (n % 10) WHEN 9 THEN 'Electric' WHEN 8 THEN 'Diesel' ELSE 'Gasoline' END,
    CASE (n % 10) WHEN 0 THEN 'maintenance' WHEN 1 THEN 'out_of_service' ELSE 'active' END,
    15000 + (n * 3000), CURRENT_DATE - (1095 + n * 10), 35000 + (n * 1000),
    (SELECT id FROM drivers WHERE tenant_id = t.id ORDER BY RANDOM() LIMIT 1), 'Fleet Operations', 'Tallahassee, FL'
FROM temp_tenant t CROSS JOIN generate_series(1, 30) n;

-- 100 Fuel Transactions
INSERT INTO fuel_transactions (tenant_id, vehicle_id, driver_id, transaction_date, gallons, cost, price_per_gallon, mileage, location, fuel_type, card_number)
SELECT t.id, v.id, v.assigned_driver_id, NOW() - (n * INTERVAL '1 day'), (15 + RANDOM() * 20)::NUMERIC(10,2),
    ((15 + RANDOM() * 20) * 3.50)::NUMERIC(10,2), 3.50::NUMERIC(10,4), v.current_mileage - (n * 100),
    CASE (n % 3) WHEN 0 THEN 'Shell Station - Tallahassee' WHEN 1 THEN 'BP Station - Capital Circle' ELSE 'Sunoco - Mahan Drive' END,
    v.fuel_type, 'FC-STG' || LPAD(n::TEXT, 6, '0')
FROM temp_tenant t, vehicles v, generate_series(1, 4) n WHERE v.tenant_id = t.id AND v.fuel_type != 'Electric' LIMIT 100;

-- 50 Work Orders
INSERT INTO work_orders (tenant_id, vehicle_id, title, description, priority, status, assigned_to, due_date, cost)
SELECT t.id, v.id,
    CASE (n % 10) WHEN 0 THEN 'Oil Change' WHEN 1 THEN 'Tire Rotation' WHEN 2 THEN 'Brake Inspection'
        WHEN 3 THEN 'Replace Battery' WHEN 4 THEN 'AC Repair' WHEN 5 THEN 'Coolant Flush'
        WHEN 6 THEN 'Transmission Service' WHEN 7 THEN 'DOT Inspection' WHEN 8 THEN 'Replace Brakes'
        ELSE 'General Maintenance' END,
    'Scheduled maintenance service for staging', CASE (n % 4) WHEN 0 THEN 'low' WHEN 1 THEN 'medium' WHEN 2 THEN 'high' ELSE 'critical' END,
    CASE (n % 6) WHEN 0 THEN 'open' WHEN 1 THEN 'in_progress' WHEN 2 THEN 'completed' WHEN 3 THEN 'completed' WHEN 4 THEN 'on_hold' ELSE 'completed' END,
    (SELECT id FROM users WHERE tenant_id = t.id AND role = 'driver' ORDER BY RANDOM() LIMIT 1),
    CURRENT_DATE + (n % 30), (200 + RANDOM() * 800)::NUMERIC(10,2)
FROM temp_tenant t, (SELECT id, current_mileage, tenant_id FROM vehicles ORDER BY RANDOM()) v, generate_series(1, 50) n
WHERE v.tenant_id = t.id LIMIT 50;

-- 75 Maintenance Records
INSERT INTO maintenance_records (tenant_id, vehicle_id, service_type, service_date, odometer, cost, service_provider, notes)
SELECT t.id, v.id,
    CASE (n % 4) WHEN 0 THEN 'Oil Change' WHEN 1 THEN 'Tire Rotation' WHEN 2 THEN 'Brake Service' ELSE 'Inspection' END,
    CURRENT_DATE - (n * 15), v.current_mileage - (n * 500), (150 + RANDOM() * 350)::NUMERIC(10,2),
    'Staging Service Center', 'Completed scheduled maintenance'
FROM temp_tenant t, vehicles v, generate_series(1, 3) n WHERE v.tenant_id = t.id LIMIT 75;

COMMIT;

-- Summary Report
DO $$
DECLARE v_tenant_id INTEGER;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE subdomain = 'cta-staging';
    RAISE NOTICE '================================================';
    RAISE NOTICE '    STAGING SEED DATA - INSERTION COMPLETE';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Tenant: % (ID: %)', (SELECT name FROM tenants WHERE id = v_tenant_id), v_tenant_id;
    RAISE NOTICE '';
    RAISE NOTICE 'Users (Drivers): %', (SELECT COUNT(*) FROM users WHERE tenant_id = v_tenant_id AND role = 'driver');
    RAISE NOTICE 'Driver Records: %', (SELECT COUNT(*) FROM drivers WHERE tenant_id = v_tenant_id);
    RAISE NOTICE 'Vehicles: %', (SELECT COUNT(*) FROM vehicles WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '  - Active: %', (SELECT COUNT(*) FROM vehicles WHERE tenant_id = v_tenant_id AND status = 'active');
    RAISE NOTICE '  - Maintenance: %', (SELECT COUNT(*) FROM vehicles WHERE tenant_id = v_tenant_id AND status = 'maintenance');
    RAISE NOTICE '  - Out of Service: %', (SELECT COUNT(*) FROM vehicles WHERE tenant_id = v_tenant_id AND status = 'out_of_service');
    RAISE NOTICE 'Fuel Transactions: %', (SELECT COUNT(*) FROM fuel_transactions WHERE tenant_id = v_tenant_id);
    RAISE NOTICE 'Work Orders: %', (SELECT COUNT(*) FROM work_orders WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '  - Open: %', (SELECT COUNT(*) FROM work_orders WHERE tenant_id = v_tenant_id AND status = 'open');
    RAISE NOTICE '  - In Progress: %', (SELECT COUNT(*) FROM work_orders WHERE tenant_id = v_tenant_id AND status = 'in_progress');
    RAISE NOTICE '  - Completed: %', (SELECT COUNT(*) FROM work_orders WHERE tenant_id = v_tenant_id AND status = 'completed');
    RAISE NOTICE 'Maintenance Records: %', (SELECT COUNT(*) FROM maintenance_records WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '================================================';
END $$;
