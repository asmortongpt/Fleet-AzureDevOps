-- Simple Comprehensive Seed Data for Fleet Management System
-- Generates 1000+ realistic records - Schema-aware version
-- Date: 2026-01-03

BEGIN;

-- Ensure we have a tenant first
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tenants LIMIT 1) THEN
        INSERT INTO tenants (name, slug, domain, is_active)
        VALUES ('Capital Transit Authority', 'cta-fleet', 'cta-fleet.ctafleet.com', true);
    END IF;
END $$;

-- Create 25 users
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, phone, is_active)
SELECT
    (SELECT id FROM tenants LIMIT 1),
    'user' || n || '@ctafleet.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eck/gHVMxDAq',
    (ARRAY['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Barbara',
           'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
           'Daniel', 'Nancy', 'Matthew', 'Lisa', 'Anthony'])[n],
    (ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
           'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
           'Lee', 'Perez', 'Thompson', 'White', 'Harris'])[n],
    (ARRAY['Admin', 'Manager', 'Mechanic', 'Dispatcher', 'Viewer'])[((n-1) % 5) + 1]::user_role,
    '850-' || LPAD((200 + n)::TEXT, 3, '0') || '-' || LPAD((1000 + n * 13)::TEXT, 4, '0'),
    true
FROM generate_series((SELECT id FROM tenants LIMIT 1), 25) AS n
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Create 150 drivers
INSERT INTO drivers (tenant_id, first_name, last_name, email, phone, license_number, license_state,
                     license_expiry_date, hire_date, status, emergency_contact_name, emergency_contact_phone)
SELECT
    (SELECT id FROM tenants LIMIT 1),
    (ARRAY['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Barbara',
           'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen',
           'Daniel', 'Nancy', 'Matthew', 'Lisa', 'Anthony', 'Mark', 'Donald', 'Betty', 'Steven', 'Dorothy'])[((n-1) % 30) + 1],
    (ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
           'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
           'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Hall'])[((n-1) % 30) + 1],
    'driver' || n || '@ctafleet.com',
    '850-' || LPAD((300 + n)::TEXT, 3, '0') || '-' || LPAD((2000 + n * 17)::TEXT, 4, '0'),
    'FL' || LPAD(n::TEXT, 10, '0'),
    'FL',
    (NOW() + (365 + (n * 17) % 730) * INTERVAL '1 day')::TIMESTAMP,
    (NOW() - ((1000 + n * 7) || ' days')::INTERVAL)::TIMESTAMP,
    (ARRAY['active', 'active', 'active', 'on_leave', 'inactive'])[((n-1) % 5) + 1]::driver_status,
    'Emergency Contact ' || n,
    '850-999-' || LPAD(n::TEXT, 4, '0')
FROM generate_series((SELECT id FROM tenants LIMIT 1), 150) AS n
ON CONFLICT (tenant_id, license_number) DO NOTHING;

-- Create 250 vehicles
INSERT INTO vehicles (tenant_id, vin, name, number, type, make, model, year, license_plate,
                      status, fuel_type, fuel_level, odometer)
SELECT
    (SELECT id FROM tenants LIMIT 1),
    '1HGBH41JXMN' || LPAD(n::TEXT, 6, '0'),
    (ARRAY['Ford', 'Chevrolet', 'RAM', 'GMC', 'Toyota'])[((n-1) % 5) + 1] || ' ' ||
    (ARRAY['F-150', 'Silverado', '1500', 'Sierra', 'Tacoma'])[((n-1) % 5) + 1] || ' #' || n,
    'UNIT-' || LPAD(n::TEXT, 4, '0'),
    (ARRAY['bus', 'truck', 'van', 'suv', 'sedan'])[((n-1) % 5) + 1]::vehicle_type,
    (ARRAY['Ford', 'Chevrolet', 'RAM', 'GMC', 'Toyota'])[((n-1) % 5) + 1],
    (ARRAY['F-150', 'Silverado 1500', '1500', 'Sierra 1500', 'Tacoma'])[((n-1) % 5) + 1],
    2015 + ((n-1) % 10),
    'FL' || LPAD((10000 + n)::TEXT, 5, '0'),
    (ARRAY['active', 'active', 'maintenance', 'service'])[((n-1) % 4) + 1]::vehicle_status,
    (ARRAY['gasoline', 'diesel', 'hybrid', 'electric'])[((n-1) % 4) + 1]::fuel_type,
    25 + (n * 7) % 75,
    25000 + (n * 1234) % 150000
FROM generate_series((SELECT id FROM tenants LIMIT 1), 250) AS n
ON CONFLICT (tenant_id, vin) DO NOTHING;

-- Create 500 work orders
INSERT INTO work_orders (tenant_id, vehicle_id, number, title, description, type, priority,
                         status, scheduled_start_date, created_at)
SELECT
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM vehicles ORDER BY RANDOM() LIMIT 1),
    'WO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(n::TEXT, 4, '0'),
    (ARRAY['Oil Change', 'Brake Inspection', 'Tire Rotation', 'Engine Diagnostics', 'Transmission Service'])[((n-1) % 5) + 1],
    'Standard fleet maintenance and inspection work order.',
    (ARRAY['preventive', 'corrective', 'inspection'])[((n-1) % 3) + 1]::maintenance_type,
    (ARRAY['low', 'medium', 'high'])[((n-1) % 3) + 1]::priority,
    (ARRAY['pending', 'in_progress', 'completed'])[((n-1) % 3) + 1]::status,
    NOW() + ((n % 30) || ' days')::INTERVAL,
    NOW() - ((n * 0.5) || ' days')::INTERVAL
FROM generate_series((SELECT id FROM tenants LIMIT 1), 500) AS n;

-- Create 300 inspections
INSERT INTO inspections (tenant_id, vehicle_id, inspector_id, type, status, started_at, notes, created_at)
SELECT
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM vehicles ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM drivers ORDER BY RANDOM() LIMIT 1),
    (ARRAY['pre_trip', 'post_trip', 'annual', 'dot'])[((n-1) % 4) + 1]::inspection_type,
    (ARRAY['pending', 'in_progress', 'completed'])[((n-1) % 3) + 1]::status,
    NOW() - ((n * 1.5) || ' days')::INTERVAL,
    'Inspection completed successfully.',
    NOW() - ((n * 1.5) || ' days')::INTERVAL
FROM generate_series((SELECT id FROM tenants LIMIT 1), 300) AS n;

-- Create 150 incidents
INSERT INTO incidents (tenant_id, vehicle_id, driver_id, number, type, severity, description,
                       incident_date, location, status)
SELECT
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM vehicles ORDER BY RANDOM() LIMIT 1),
    (SELECT id FROM drivers ORDER BY RANDOM() LIMIT 1),
    'INC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(n::TEXT, 4, '0'),
    'accident',
    (ARRAY['minor', 'moderate', 'major'])[((n-1) % 3) + 1]::incident_severity,
    'Incident report filed. Details documented.',
    NOW() - ((n * 2) || ' days')::INTERVAL,
    (ARRAY['Monroe St, Tallahassee, FL', 'Capital Circle, Tallahassee, FL', 'Apalachee Pkwy, Tallahassee, FL'])[((n-1) % 3) + 1],
    (ARRAY['pending', 'in_progress', 'completed'])[((n-1) % 3) + 1]::status
FROM generate_series((SELECT id FROM tenants LIMIT 1), 150) AS n;

-- Create 200 routes
INSERT INTO routes (tenant_id, name, description, estimated_distance, estimated_duration, status)
SELECT
    (SELECT id FROM tenants LIMIT 1),
    'Route ' || LPAD(n::TEXT, 3, '0'),
    'Standard transit route serving Tallahassee area.',
    (10 + (n * 2) % 40)::NUMERIC,
    30 + (n * 5) % 90,
    (ARRAY['pending', 'in_progress', 'completed'])[((n-1) % 3) + 1]::status
FROM generate_series((SELECT id FROM tenants LIMIT 1), 200) AS n;

-- Create 100 maintenance schedules
INSERT INTO maintenance_schedules (tenant_id, vehicle_id, name, description, type, interval_miles,
                                   interval_days, next_service_date, is_active)
SELECT
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM vehicles ORDER BY RANDOM() LIMIT 1),
    (ARRAY['Preventive Maintenance', 'Corrective Maintenance', 'Inspection', 'Recall Service', 'Upgrade'])[((n-1) % 5) + 1] || ' Schedule',
    'Scheduled maintenance for fleet vehicle.',
    (ARRAY['preventive', 'corrective', 'inspection', 'recall', 'upgrade'])[((n-1) % 5) + 1]::maintenance_type,
    CASE ((n-1) % 5)
        WHEN 0 THEN 3000
        WHEN 1 THEN 6000
        WHEN 2 THEN 12000
        WHEN 3 THEN 15000
        ELSE 30000
    END,
    CASE ((n-1) % 5)
        WHEN 0 THEN 90
        WHEN 1 THEN 180
        WHEN 2 THEN 365
        WHEN 3 THEN 365
        ELSE 730
    END,
    NOW() + ((30 + (n * 7) % 90) || ' days')::INTERVAL,
    true
FROM generate_series((SELECT id FROM tenants LIMIT 1), 100) AS n;

-- Create 50 notifications
INSERT INTO notifications (tenant_id, user_id, type, title, message, priority, is_read)
SELECT
    (SELECT id FROM tenants LIMIT 1),
    (SELECT id FROM users ORDER BY RANDOM() LIMIT 1),
    (ARRAY['info', 'warning', 'alert'])[((n-1) % 3) + 1]::notification_type,
    'Fleet Notification',
    'Important fleet management notification requiring attention.',
    (ARRAY['low', 'medium', 'high'])[((n-1) % 3) + 1]::priority,
    CASE WHEN n % 3 = 0 THEN true ELSE false END
FROM generate_series((SELECT id FROM tenants LIMIT 1), 50) AS n;

-- Summary
DO $$
DECLARE
    total_records INTEGER;
BEGIN
    SELECT
        (SELECT COUNT(*) FROM tenants) +
        (SELECT COUNT(*) FROM users) +
        (SELECT COUNT(*) FROM drivers) +
        (SELECT COUNT(*) FROM vehicles) +
        (SELECT COUNT(*) FROM work_orders) +
        (SELECT COUNT(*) FROM inspections) +
        (SELECT COUNT(*) FROM incidents) +
        (SELECT COUNT(*) FROM routes) +
        (SELECT COUNT(*) FROM maintenance_schedules) +
        (SELECT COUNT(*) FROM notifications)
    INTO total_records;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'SEED DATA SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tenants: %', (SELECT COUNT(*) FROM tenants);
    RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Drivers: %', (SELECT COUNT(*) FROM drivers);
    RAISE NOTICE 'Vehicles: %', (SELECT COUNT(*) FROM vehicles);
    RAISE NOTICE 'Work Orders: %', (SELECT COUNT(*) FROM work_orders);
    RAISE NOTICE 'Inspections: %', (SELECT COUNT(*) FROM inspections);
    RAISE NOTICE 'Incidents: %', (SELECT COUNT(*) FROM incidents);
    RAISE NOTICE 'Routes: %', (SELECT COUNT(*) FROM routes);
    RAISE NOTICE 'Maintenance Schedules: %', (SELECT COUNT(*) FROM maintenance_schedules);
    RAISE NOTICE 'Notifications: %', (SELECT COUNT(*) FROM notifications);
    RAISE NOTICE '----------------------------------------';
    RAISE NOTICE 'TOTAL RECORDS: %', total_records;
    RAISE NOTICE '========================================';
END $$;

COMMIT;
