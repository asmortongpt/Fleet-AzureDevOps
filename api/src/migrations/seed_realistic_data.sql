-- Comprehensive Seed Data for Fleet Management System
-- Generates 1000+ realistic records across all tables
-- Date: 2026-01-03

BEGIN;

-- ============================================================================
-- Helper function to generate random dates
-- ============================================================================
CREATE OR REPLACE FUNCTION random_date(start_date DATE, end_date DATE)
RETURNS DATE AS $$
BEGIN
    RETURN start_date + (random() * (end_date - start_date))::INTEGER;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION random_timestamp(start_date DATE, end_date DATE)
RETURNS TIMESTAMP AS $$
BEGIN
    RETURN (start_date + (random() * (end_date - start_date))::INTEGER)::TIMESTAMP +
           (random() * INTERVAL '23 hours 59 minutes');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. TENANTS (1 default tenant)
-- ============================================================================
INSERT INTO tenants (id, name, slug, domain, is_active, created_at)
VALUES
    (gen_random_uuid(), 'Capital Transit Authority', 'cta-fleet', 'cta-fleet.ctafleet.com', true, NOW())
ON CONFLICT (slug) DO NOTHING;

-- Get tenant ID for use in other inserts
DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
    PERFORM set_config('app.tenant_id', v_tenant_id::TEXT, false);
END $$;

-- ============================================================================
-- 2. USERS (25 users with various roles)
-- ============================================================================
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, phone, is_active, created_at)
SELECT
    gen_random_uuid(),
    (SELECT id FROM tenants LIMIT 1),
    'user' || n || '@ctafleet.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eck/gHVMxDAq', -- password: "fleet123"
    (ARRAY['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Barbara',
           'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
           'Daniel', 'Nancy', 'Matthew', 'Lisa', 'Anthony'])[n],
    (ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
           'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
           'Lee', 'Perez', 'Thompson', 'White', 'Harris'])[n],
    (ARRAY['Admin', 'Manager', 'Mechanic', 'Dispatcher', 'Viewer'])[((n-1) % 5) + 1]::user_role,
    '(' || (200 + n) || ') ' || LPAD((1000000 + (n * 12345) % 1000000)::TEXT, 7, '0'),
    true,
    NOW() - (n || ' days')::INTERVAL
FROM generate_series(1, 25) AS n
ON CONFLICT (tenant_id, email) DO NOTHING;

-- ============================================================================
-- 3. DRIVERS (150 drivers)
-- ============================================================================
INSERT INTO drivers (id, tenant_id, first_name, last_name, email, phone, license_number, license_state,
                     license_expiry_date, hire_date, status, created_at)
SELECT
    gen_random_uuid(),
    (SELECT id FROM tenants LIMIT 1),
    (ARRAY['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Barbara',
           'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
           'Daniel', 'Nancy', 'Matthew', 'Lisa', 'Anthony', 'Mark', 'Donald', 'Betty', 'Steven', 'Dorothy'])[((n-1) % 30) + 1],
    (ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
           'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
           'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Hall'])[((n-1) % 30) + 1],
    'driver' || n || '@ctafleet.com',
    '(850) ' || LPAD((2000000 + (n * 7531) % 1000000)::TEXT, 7, '0'),
    'FL-' || LPAD(n::TEXT, 8, '0'),
    'FL',
    (CURRENT_DATE + (365 + (n * 17) % 730) * INTERVAL '1 day')::TIMESTAMP,
    random_timestamp('2015-01-01'::DATE, '2024-12-31'::DATE),
    (ARRAY['active', 'active', 'active', 'active', 'on_leave', 'inactive'])[((n-1) % 6) + 1]::driver_status,
    NOW() - (n * 3 || ' days')::INTERVAL
FROM generate_series(1, 150) AS n
ON CONFLICT (tenant_id, license_number) DO NOTHING;

-- ============================================================================
-- 4. VEHICLES (250 vehicles - various makes and models)
-- ============================================================================
INSERT INTO vehicles (id, tenant_id, number, type, name, make, model, year, vin, license_plate,
                      status, odometer, fuel_level, fuel_type, created_at)
SELECT
    gen_random_uuid(),
    (SELECT id FROM tenants LIMIT 1),
    'UNIT-' || LPAD(n::TEXT, 4, '0'), (ARRAY['truck', 'truck', 'van', 'van', 'sedan', 'truck', 'sedan', 'van'])[((n-1) % 8) + 1]::vehicle_type,
    'Vehicle ' || n,
    (ARRAY['Ford', 'Chevrolet', 'RAM', 'GMC', 'Toyota', 'Ford', 'Chevrolet', 'GMC'])[((n-1) % 8) + 1],
    CASE ((n-1) % 8) + 1
        WHEN 1 THEN (ARRAY['F-150', 'F-250', 'F-350', 'Transit', 'E-Series'])[((n-1) % 5) + 1]
        WHEN 2 THEN (ARRAY['Silverado 1500', 'Silverado 2500', 'Express', 'Colorado'])[((n-1) % 4) + 1]
        WHEN 3 THEN (ARRAY['1500', '2500', '3500', 'ProMaster'])[((n-1) % 4) + 1]
        WHEN 4 THEN (ARRAY['Sierra 1500', 'Sierra 2500', 'Savana', 'Canyon'])[((n-1) % 4) + 1]
        WHEN 5 THEN (ARRAY['Tacoma', 'Tundra', 'Sienna', 'RAV4'])[((n-1) % 4) + 1]
        WHEN 6 THEN (ARRAY['Ranger', 'Explorer', 'Expedition', 'Escape'])[((n-1) % 4) + 1]
        WHEN 7 THEN (ARRAY['Tahoe', 'Suburban', 'Equinox', 'Traverse'])[((n-1) % 4) + 1]
        ELSE (ARRAY['Terrain', 'Acadia', 'Yukon', 'Yukon XL'])[((n-1) % 4) + 1]
    END,
    2015 + ((n-1) % 10),
    '1HGBH41JXMN' || LPAD(n::TEXT, 6, '0'),
    'FL-' || LPAD((10000 + n)::TEXT, 6, '0'),
    (ARRAY['active', 'active', 'active', 'preventive', 'retired'])[((n-1) % 5) + 1]::vehicle_status,
    25000 + (n * 1234) % 150000,
    25 + (n * 7) % 75,
    (ARRAY['gasoline', 'diesel', 'gasoline', 'diesel', 'electric'])[((n-1) % 5) + 1]::fuel_type,
    NOW() - (n * 2 || ' days')::INTERVAL
FROM generate_series(1, 250) AS n
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. WORK ORDERS (500 work orders)
-- ============================================================================
INSERT INTO work_orders (id, tenant_id, vehicle_id, number, title, description, type, priority,
                         status, actual_cost, assigned_to_id, scheduled_start_date,
                         actual_end_date, created_at)
SELECT
    gen_random_uuid(),
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM vehicles ORDER BY RANDOM() LIMIT 1),
    'WO-' || TO_CHAR(NOW() - (n || ' days')::INTERVAL, 'YYYYMMDD') || '-' || LPAD(n::TEXT, 4, '0'),
    (ARRAY['Oil Change', 'Brake Inspection', 'Tire Rotation', 'Engine Diagnostics', 'Transmission Service',
           'Coolant Flush', 'Air Filter Replacement', 'Battery Replacement', 'Alignment', 'Suspension Repair',
           'A/C Service', 'Electrical Repair', 'Exhaust Repair', 'Fuel System Service', 'Preventive Maintenance'])[((n-1) % 15) + 1],
    'Routine maintenance and inspection for fleet vehicle. ' ||
    CASE ((n-1) % 5)
        WHEN 0 THEN 'Standard service interval.'
        WHEN 1 THEN 'Driver reported issue.'
        WHEN 2 THEN 'Scheduled preventive maintenance.'
        WHEN 3 THEN 'Follow-up from previous inspection.'
        ELSE 'Safety compliance requirement.'
    END,
    (ARRAY['preventive', 'corrective', 'inspection', 'corrective', 'preventive'])[((n-1) % 5) + 1]::maintenance_type,
    (ARRAY['low', 'normal', 'high', 'critical'])[((n-1) % 4) + 1]::priority,
    CASE
        WHEN n % 3 = 0 THEN 'completed'
        WHEN n % 3 = 1 THEN 'in_progress'
        ELSE 'pending'
    END::status,
    CASE WHEN n % 3 = 0 THEN 115.00 + (n * 19.7) % 450 ELSE NULL END,
    (SELECT id FROM users WHERE role = 'Mechanic' ORDER BY RANDOM() LIMIT 1),
    random_timestamp('2024-01-01'::DATE, CURRENT_DATE + 30),
    CASE WHEN n % 3 = 0 THEN random_timestamp('2024-01-01'::DATE, CURRENT_DATE) ELSE NULL END,
    NOW() - (n * 1.5 || ' days')::INTERVAL
FROM generate_series(1, 500) AS n
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 6. INSPECTIONS (300 inspections)
-- ============================================================================
INSERT INTO inspections (id, tenant_id, vehicle_id, inspector_id, type, date,
                         status, result, created_at)
SELECT
    gen_random_uuid(),
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM vehicles ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM drivers ORDER BY RANDOM() LIMIT 1),
    (ARRAY['pre_trip', 'post_trip', 'annual', 'dot', 'safety'])[((n-1) % 5) + 1]::inspection_type,
    random_timestamp('2024-01-01'::DATE, CURRENT_DATE),
    'completed'::status,
    (ARRAY['pass', 'pass', 'pass', 'pass', 'fail', 'conditional'])[((n-1) % 6) + 1]::inspection_result,
    'Inspection completed. ' ||
    CASE ((n-1) % 4)
        WHEN 0 THEN 'All systems functioning normally.'
        WHEN 1 THEN 'Minor issues noted for follow-up.'
        WHEN 2 THEN 'Requires immediate attention.'
        ELSE 'Passed with flying colors.'
    END,
    NOW() - (n * 2 || ' days')::INTERVAL
FROM generate_series(1, 300) AS n
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. INCIDENTS (150 incidents)
-- ============================================================================
INSERT INTO incidents (id, tenant_id, vehicle_id, driver_id, type, date, location,
                       severity, description, status, created_at)
SELECT
    gen_random_uuid(),
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM vehicles ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM drivers ORDER BY RANDOM() LIMIT 1),
    (ARRAY['accident', 'near_miss', 'property_damage', 'injury', 'vehicle_damage', 'theft'])[((n-1) % 6) + 1]::incident_type,
    random_timestamp('2024-01-01'::DATE, CURRENT_DATE),
    (ARRAY['Monroe St & Adams St', 'Tennessee St & Gaines St', 'Capital Circle NE', 'Apalachee Pkwy',
           'Thomasville Rd', 'Mahan Dr', 'Miccosukee Rd', 'Centerville Rd'])[((n-1) % 8) + 1] || ', Tallahassee, FL',
    (ARRAY['minor', 'moderate', 'major', 'critical'])[((n-1) % 4) + 1]::severity,
    CASE ((n-1) % 6)
        WHEN 0 THEN 'Vehicle was involved in a minor fender bender at intersection. No injuries reported.'
        WHEN 1 THEN 'Near collision event. Driver took evasive action successfully.'
        WHEN 2 THEN 'Minor property damage to fleet vehicle. Repair estimate obtained.'
        WHEN 3 THEN 'Driver reported minor injury. Medical attention provided.'
        WHEN 4 THEN 'Vehicle sustained damage to front bumper in parking lot incident.'
        ELSE 'Suspicious activity reported. Item(s) reported missing from vehicle.'
    END,
    (ARRAY['reported', 'under_investigation', 'resolved', 'closed'])[((n-1) % 4) + 1]::status,
    NOW() - (n * 1.7 || ' days')::INTERVAL
FROM generate_series(1, 150) AS n
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. ROUTES (200 routes)
-- ============================================================================
INSERT INTO routes (id, tenant_id, name, description, distance_miles,
                    status, created_at)
SELECT
    gen_random_uuid(),
    (SELECT id FROM tenants LIMIT 1),
    'Route ' || LPAD(n::TEXT, 3, '0') || ' - ' ||
    (ARRAY['North Loop', 'South Corridor', 'East Side', 'West End', 'Downtown Circuit',
           'University Line', 'Airport Express', 'Medical Center'])[((n-1) % 8) + 1],
    'Standard transit route serving ' ||
    (ARRAY['residential areas', 'commercial districts', 'educational facilities', 'medical centers',
           'government buildings', 'shopping centers', 'transportation hubs'])[((n-1) % 7) + 1],
    5.0 + (n * 1.3) % 25,
    (ARRAY['active', 'active', 'active', 'inactive', 'seasonal'])[((n-1) % 5) + 1]::status,
    NOW() - (n * 3 || ' days')::INTERVAL
FROM generate_series(1, 200) AS n
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. FUEL TRANSACTIONS (400 transactions)
-- ============================================================================
INSERT INTO fuel_transactions (id, tenant_id, vehicle_id, driver_id, transaction_date, gallons,
                                cost_per_gallon, total_cost, odometer, fuel_type, vendor_name, location_address, created_at)
SELECT
    gen_random_uuid(),
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM vehicles ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM drivers ORDER BY RANDOM() LIMIT 1),
    random_timestamp('2024-01-01'::DATE, CURRENT_DATE),
    10.0 + (n * 2.3) % 30,
    2.50 + (n * 0.07) % 1.5,
    (10.0 + (n * 2.3) % 30) * (2.50 + (n * 0.07) % 1.5),
    25000 + (n * 1547) % 120000,
    (ARRAY['gasoline', 'diesel', 'gasoline', 'diesel'])[((n-1) % 4) + 1]::fuel_type,
    (ARRAY['Shell', 'BP', 'Chevron', 'Exxon', 'Mobil', 'Circle K', 'RaceTrac', '7-Eleven'])[((n-1) % 8) + 1],
    (ARRAY['1234 N Monroe St', '567 Capital Circle', '890 Apalachee Pkwy', '432 Thomasville Rd',
           '765 Mahan Dr', '321 Tennessee St', '654 Centerville Rd'])[((n-1) % 7) + 1] || ', Tallahassee, FL',
    NOW() - (n * 0.8 || ' days')::INTERVAL
FROM generate_series(1, 400) AS n
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. MAINTENANCE SCHEDULES (100 schedules)
-- ============================================================================
INSERT INTO maintenance_schedules (id, tenant_id, vehicle_id, name, description, type, interval_miles,
                                   interval_days, last_service_date, next_service_date, estimated_cost, is_active, created_at)
SELECT
    gen_random_uuid(),
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM vehicles ORDER BY RANDOM() LIMIT 1),
    (ARRAY['Oil Change', 'Tire Rotation', 'Brake Inspection', 'Air Filter', 'Transmission Service',
           'Coolant Flush', 'Spark Plugs', 'Battery Check', 'Alignment', 'Belt Replacement'])[((n-1) % 10) + 1] || ' Schedule',
    'Scheduled maintenance interval for ' ||
    (ARRAY['engine oil', 'tires', 'brakes', 'air filtration', 'transmission', 'cooling system',
           'ignition system', 'electrical system', 'suspension', 'drive belt'])[((n-1) % 10) + 1],
    (ARRAY['oil_change', 'tire_rotation', 'inspection', 'fluid_service', 'component_replacement'])[((n-1) % 5) + 1],
    CASE ((n-1) % 10)
        WHEN 0 THEN 3000  -- Oil change
        WHEN 1 THEN 6000  -- Tire rotation
        WHEN 2 THEN 12000 -- Brake inspection
        WHEN 3 THEN 15000 -- Air filter
        WHEN 4 THEN 30000 -- Transmission
        WHEN 5 THEN 30000 -- Coolant
        WHEN 6 THEN 60000 -- Spark plugs
        WHEN 7 THEN 6000  -- Battery check
        WHEN 8 THEN 12000 -- Alignment
        ELSE 50000        -- Belt replacement
    END,
    CASE ((n-1) % 10)
        WHEN 0 THEN 90   -- Oil change
        WHEN 1 THEN 180  -- Tire rotation
        WHEN 2 THEN 365  -- Brake inspection
        WHEN 3 THEN 365  -- Air filter
        WHEN 4 THEN 730  -- Transmission
        WHEN 5 THEN 730  -- Coolant
        WHEN 6 THEN 1095 -- Spark plugs
        WHEN 7 THEN 180  -- Battery check
        WHEN 8 THEN 365  -- Alignment
        ELSE 1095        -- Belt replacement
    END,
    random_timestamp('2024-06-01'::DATE, CURRENT_DATE),
    CURRENT_DATE + ((30 + (n * 7) % 90) || ' days')::INTERVAL,
    CASE ((n-1) % 10)
        WHEN 0 THEN 45.00
        WHEN 1 THEN 60.00
        WHEN 2 THEN 125.00
        WHEN 3 THEN 35.00
        WHEN 4 THEN 250.00
        WHEN 5 THEN 85.00
        WHEN 6 THEN 150.00
        WHEN 7 THEN 25.00
        WHEN 8 THEN 95.00
        ELSE 175.00
    END,
    true,
    NOW() - (n * 4 || ' days')::INTERVAL
FROM generate_series(1, 100) AS n
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. PARTS INVENTORY (80 common parts)
-- ============================================================================
INSERT INTO parts_inventory (id, tenant_id, part_number, name, description, category, quantity_on_hand,
                              minimum_quantity, unit_cost, created_at)
SELECT
    gen_random_uuid(),
    (SELECT id FROM tenants LIMIT 1),
    'PART-' || LPAD(n::TEXT, 5, '0'),
    (ARRAY['Engine Oil Filter', 'Air Filter', 'Cabin Filter', 'Fuel Filter', 'Brake Pads', 'Brake Rotors',
           'Spark Plugs', 'Battery', 'Wiper Blades', 'Headlight Bulb', 'Tail Light Bulb', 'Turn Signal Bulb',
           'Oil 5W-30', 'Coolant', 'Brake Fluid', 'Power Steering Fluid', 'Transmission Fluid', 'Washer Fluid',
           'Serpentine Belt', 'Timing Belt', 'Alternator Belt', 'V-Belt', 'Tire 225/65R17', 'Tire 265/70R17',
           'Wheel Bearing', 'Ball Joint', 'Tie Rod End', 'Control Arm', 'Shock Absorber', 'Strut Assembly'])[((n-1) % 30) + 1],
    'Standard replacement part for fleet vehicles',
    (ARRAY['filters', 'brakes', 'electrical', 'fluids', 'belts', 'tires', 'suspension'])[((n-1) % 7) + 1],
    10 + (n * 3) % 50,
    5 + (n % 10),
    8.50 + (n * 2.75) % 150,
    (ARRAY['Shelf A1', 'Shelf A2', 'Shelf B1', 'Shelf B2', 'Shelf C1', 'Shelf C2', 'Bay 1', 'Bay 2'])[((n-1) % 8) + 1],
    NOW() - (n * 5 || ' days')::INTERVAL
FROM generate_series(1, 80) AS n
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 12. NOTIFICATIONS (50 recent notifications)
-- ============================================================================
INSERT INTO notifications (id, tenant_id, user_id, type, title, message, priority, is_read, created_at)
SELECT
    gen_random_uuid(),
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (ARRAY['maintenance_due', 'inspection_overdue', 'license_expiring', 'work_order_completed',
           'vehicle_alert', 'driver_alert', 'fuel_threshold', 'mileage_milestone'])[((n-1) % 8) + 1],
    CASE ((n-1) % 8)
        WHEN 0 THEN 'Maintenance Due'
        WHEN 1 THEN 'Inspection Overdue'
        WHEN 2 THEN 'License Expiring Soon'
        WHEN 3 THEN 'Work Order Completed'
        WHEN 4 THEN 'Vehicle Alert'
        WHEN 5 THEN 'Driver Alert'
        WHEN 6 THEN 'Low Fuel Alert'
        ELSE 'Mileage Milestone'
    END,
    CASE ((n-1) % 8)
        WHEN 0 THEN 'Vehicle UNIT-' || LPAD((n % 250)::TEXT, 4, '0') || ' is due for scheduled maintenance.'
        WHEN 1 THEN 'Annual inspection is overdue for vehicle UNIT-' || LPAD((n % 250)::TEXT, 4, '0') || '.'
        WHEN 2 THEN 'Driver license expiring in 30 days. Please renew promptly.'
        WHEN 3 THEN 'Work order WO-' || LPAD(n::TEXT, 6, '0') || ' has been completed.'
        WHEN 4 THEN 'Check engine light reported on vehicle UNIT-' || LPAD((n % 250)::TEXT, 4, '0') || '.'
        WHEN 5 THEN 'Driver certification expires soon. Schedule renewal training.'
        WHEN 6 THEN 'Vehicle UNIT-' || LPAD((n % 250)::TEXT, 4, '0') || ' fuel level below 25%.'
        ELSE 'Vehicle UNIT-' || LPAD((n % 250)::TEXT, 4, '0') || ' has reached 100,000 miles.'
    END,
    (ARRAY['low', 'normal', 'high', 'critical'])[((n-1) % 4) + 1],
    CASE WHEN n % 3 = 0 THEN true ELSE false END,
    NOW() - (n * 0.5 || ' days')::INTERVAL
FROM generate_series(1, 50) AS n
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Update Statistics
-- ============================================================================
DO $$
DECLARE
    tenant_count INTEGER;
    user_count INTEGER;
    driver_count INTEGER;
    vehicle_count INTEGER;
    work_order_count INTEGER;
    inspection_count INTEGER;
    incident_count INTEGER;
    route_count INTEGER;
    fuel_count INTEGER;
    schedule_count INTEGER;
    parts_count INTEGER;
    notification_count INTEGER;
    total_records INTEGER;
BEGIN
    SELECT COUNT(*) INTO tenant_count FROM tenants;
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO driver_count FROM drivers;
    SELECT COUNT(*) INTO vehicle_count FROM vehicles;
    SELECT COUNT(*) INTO work_order_count FROM work_orders;
    SELECT COUNT(*) INTO inspection_count FROM inspections;
    SELECT COUNT(*) INTO incident_count FROM incidents;
    SELECT COUNT(*) INTO route_count FROM routes;
    SELECT COUNT(*) INTO fuel_count FROM fuel_transactions;
    SELECT COUNT(*) INTO schedule_count FROM maintenance_schedules;
    SELECT COUNT(*) INTO parts_count FROM parts_inventory;
    SELECT COUNT(*) INTO notification_count FROM notifications;

    total_records := user_count + driver_count + vehicle_count + work_order_count +
                     inspection_count + incident_count + route_count + fuel_count +
                     schedule_count + parts_count + notification_count;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'SEED DATA SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tenants: %', tenant_count;
    RAISE NOTICE 'Users: %', user_count;
    RAISE NOTICE 'Drivers: %', driver_count;
    RAISE NOTICE 'Vehicles: %', vehicle_count;
    RAISE NOTICE 'Work Orders: %', work_order_count;
    RAISE NOTICE 'Inspections: %', inspection_count;
    RAISE NOTICE 'Incidents: %', incident_count;
    RAISE NOTICE 'Routes: %', route_count;
    RAISE NOTICE 'Fuel Transactions: %', fuel_count;
    RAISE NOTICE 'Maintenance Schedules: %', schedule_count;
    RAISE NOTICE 'Parts Inventory: %', parts_count;
    RAISE NOTICE 'Notifications: %', notification_count;
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'TOTAL RECORDS: %', total_records;
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- Cleanup helper functions
DROP FUNCTION IF EXISTS random_date(DATE, DATE);
DROP FUNCTION IF EXISTS random_timestamp(DATE, DATE);
