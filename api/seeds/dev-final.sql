-- =========================================================================
-- DEV ENVIRONMENT SEED DATA - Final Version
-- Compatible with actual database schema
-- =========================================================================

BEGIN;

-- Get or create tenant
DO $$
DECLARE v_tenant_id INTEGER;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE subdomain = 'cta-dev' LIMIT 1;
    IF v_tenant_id IS NULL THEN
        INSERT INTO tenants (name, subdomain, status, active) VALUES ('CTA Development', 'cta-dev', 'active', true) RETURNING id INTO v_tenant_id;
    END IF;
    CREATE TEMP TABLE IF NOT EXISTS temp_tenant (id INTEGER);
    DELETE FROM temp_tenant;
    INSERT INTO temp_tenant VALUES (v_tenant_id);
END $$;

-- 20 Driver Users
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status)
SELECT t.id, 'driver' || n || '.dev@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m',
    'Dev-Driver', 'User' || n, 'driver', 'active'
FROM temp_tenant t CROSS JOIN generate_series(1, 20) n
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'driver' || n || '.dev@cta.com');

-- Driver Records
INSERT INTO drivers (tenant_id, user_id, license_number, license_state, license_expiry, hire_date, status)
SELECT u.tenant_id, u.id, 'FL' || LPAD((200000 + u.id)::TEXT, 8, '0'), 'FL', CURRENT_DATE + INTERVAL '3 years', CURRENT_DATE - INTERVAL '18 months', 'active'
FROM users u INNER JOIN temp_tenant t ON u.tenant_id = t.id
WHERE u.role = 'driver' AND NOT EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = u.id);

-- 25 Vehicles
INSERT INTO vehicles (tenant_id, vin, make, model, year, license_plate, license_state, vehicle_type, fuel_type, status, current_mileage, purchase_date, purchase_price, assigned_driver_id, department, location)
SELECT t.id, '2FT' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 14)),
    CASE (n % 6) WHEN 0 THEN 'Ford' WHEN 1 THEN 'Chevrolet' WHEN 2 THEN 'RAM' WHEN 3 THEN 'Toyota' WHEN 4 THEN 'Tesla' ELSE 'GMC' END,
    CASE (n % 6) WHEN 0 THEN 'F-250' WHEN 1 THEN 'Silverado 2500' WHEN 2 THEN '2500' WHEN 3 THEN 'Tacoma' WHEN 4 THEN 'Model Y' ELSE 'Sierra' END,
    2021 + (n % 4), 'FL-DEV-' || LPAD(n::TEXT, 4, '0'), 'FL',
    CASE (n % 6) WHEN 4 THEN 'SUV' ELSE 'Pickup Truck' END,
    CASE (n % 6) WHEN 4 THEN 'Electric' WHEN 1 THEN 'Diesel' WHEN 2 THEN 'Diesel' ELSE 'Gasoline' END,
    CASE (n % 8) WHEN 0 THEN 'maintenance' WHEN 7 THEN 'out_of_service' ELSE 'active' END,
    20000 + (n * 2500), CURRENT_DATE - (730 + n * 15), 40000 + (n * 1200),
    (SELECT id FROM drivers WHERE tenant_id = t.id ORDER BY RANDOM() LIMIT 1), 'Fleet Development', 'Tallahassee, FL'
FROM temp_tenant t CROSS JOIN generate_series(1, 25) n;

-- 120 Fuel Transactions
INSERT INTO fuel_transactions (tenant_id, vehicle_id, driver_id, transaction_date, gallons, cost, price_per_gallon, mileage, location, fuel_type, card_number)
SELECT t.id, v.id, v.assigned_driver_id, NOW() - (n * INTERVAL '1 day'), (12 + RANDOM() * 25)::NUMERIC(10,2),
    ((12 + RANDOM() * 25) * 3.65)::NUMERIC(10,2), 3.65::NUMERIC(10,4), v.current_mileage - (n * 80),
    CASE (n % 4) WHEN 0 THEN 'Shell - Innovation Blvd' WHEN 1 THEN 'BP - Fleet Way' WHEN 2 THEN 'Marathon - Tech Blvd' ELSE 'Chevron - Dev Center' END,
    v.fuel_type, 'FC-DEV' || LPAD(n::TEXT, 6, '0')
FROM temp_tenant t, vehicles v, generate_series(1, 5) n WHERE v.tenant_id = t.id AND v.fuel_type != 'Electric' LIMIT 120;

-- 40 Work Orders
INSERT INTO work_orders (tenant_id, vehicle_id, title, description, priority, status, assigned_to, due_date, cost)
SELECT t.id, v.id,
    CASE (n % 12) WHEN 0 THEN 'Oil and Filter Change' WHEN 1 THEN 'Tire Rotation Service' WHEN 2 THEN 'Complete Brake Inspection'
        WHEN 3 THEN 'Battery Replacement' WHEN 4 THEN 'AC System Repair' WHEN 5 THEN 'Coolant System Flush'
        WHEN 6 THEN 'Transmission Service' WHEN 7 THEN 'DOT Safety Inspection' WHEN 8 THEN 'Brake Pad Replacement'
        WHEN 9 THEN 'Engine Diagnostic' WHEN 10 THEN 'Suspension Check' ELSE 'Preventive Maintenance' END,
    'Development environment maintenance task', CASE (n % 5) WHEN 0 THEN 'low' WHEN 1 THEN 'medium' WHEN 2 THEN 'medium' WHEN 3 THEN 'high' ELSE 'critical' END,
    CASE (n % 7) WHEN 0 THEN 'open' WHEN 1 THEN 'in_progress' WHEN 2 THEN 'in_progress' WHEN 3 THEN 'completed'
        WHEN 4 THEN 'completed' WHEN 5 THEN 'on_hold' ELSE 'completed' END,
    (SELECT id FROM users WHERE tenant_id = t.id AND role = 'driver' ORDER BY RANDOM() LIMIT 1),
    CURRENT_DATE + (n % 40), (250 + RANDOM() * 750)::NUMERIC(10,2)
FROM temp_tenant t, (SELECT id, current_mileage, tenant_id FROM vehicles ORDER BY RANDOM()) v, generate_series(1, 40) n
WHERE v.tenant_id = t.id LIMIT 40;

-- 60 Maintenance Records
INSERT INTO maintenance_records (tenant_id, vehicle_id, service_type, service_date, odometer, cost, service_provider, notes)
SELECT t.id, v.id,
    CASE (n % 5) WHEN 0 THEN 'Oil Change' WHEN 1 THEN 'Tire Rotation' WHEN 2 THEN 'Brake Service' WHEN 3 THEN 'Transmission' ELSE 'Safety Inspection' END,
    CURRENT_DATE - (n * 20), v.current_mileage - (n * 400), (180 + RANDOM() * 420)::NUMERIC(10,2),
    'Development Service Center', 'Dev environment scheduled service'
FROM temp_tenant t, vehicles v, generate_series(1, 3) n WHERE v.tenant_id = t.id LIMIT 60;

COMMIT;

-- Summary Report
DO $$
DECLARE v_tenant_id INTEGER;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE subdomain = 'cta-dev';
    RAISE NOTICE '================================================';
    RAISE NOTICE '    DEV SEED DATA - INSERTION COMPLETE';
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
