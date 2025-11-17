-- Enhanced Demo Data for Fleet Management System
-- This script inserts comprehensive demo data with all required fields

-- Insert Tenant
INSERT INTO tenants (name, subdomain, created_at, updated_at)
VALUES ('Capital Tech Alliance', 'cta', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (subdomain) DO NOTHING;

-- Get tenant ID and populate data
DO $$
DECLARE
    v_tenant_id INTEGER;
    v_vehicle_id INTEGER;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE subdomain = 'cta' LIMIT 1;

    -- Insert Admin User
    INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, phone, created_at, updated_at)
    VALUES (
        v_tenant_id,
        'admin@cta.com',
        '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m',
        'Admin', 'User', 'admin', '555-0100',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT (email) DO NOTHING;

    -- Insert Manager User
    INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, phone, created_at, updated_at)
    VALUES (
        v_tenant_id,
        'manager@cta.com',
        '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m',
        'Fleet', 'Manager', 'manager', '555-0101',
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT (email) DO NOTHING;

    -- Insert Driver Users
    INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, phone, created_at, updated_at)
    VALUES
    (v_tenant_id, 'john.smith@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'John', 'Smith', 'driver', '555-0200', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (v_tenant_id, 'jane.doe@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Jane', 'Doe', 'driver', '555-0201', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (v_tenant_id, 'mike.wilson@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Mike', 'Wilson', 'driver', '555-0202', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (v_tenant_id, 'sarah.johnson@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Sarah', 'Johnson', 'driver', '555-0203', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (v_tenant_id, 'david.brown@cta.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'David', 'Brown', 'driver', '555-0204', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (email) DO NOTHING;

    -- Insert Drivers
    INSERT INTO drivers (tenant_id, user_id, license_number, license_state, license_expiry, cdl_class, is_active, created_at, updated_at)
    SELECT
        v_tenant_id,
        u.id,
        'DL' || LPAD(ROW_NUMBER() OVER (ORDER BY u.id)::TEXT, 6, '0'),
        'FL',
        CURRENT_DATE + INTERVAL '2 years',
        'B',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM users u
    WHERE u.tenant_id = v_tenant_id AND u.role = 'driver'
    ON CONFLICT DO NOTHING;

    -- Insert Vehicles with ALL required fields
    INSERT INTO vehicles (
        tenant_id, vehicle_number, make, model, year, vin, license_plate, license_state,
        vehicle_type, fuel_type, status, current_mileage, assigned_driver_id,
        department, region, fuel_level, location_lat, location_lng,
        hours_used, ownership, last_service, next_service, tags,
        created_at, updated_at
    )
    SELECT
        v_tenant_id,
        'FL-' || LPAD(n::TEXT, 4, '0'),
        CASE (n % 8)
            WHEN 0 THEN 'Ford'
            WHEN 1 THEN 'Chevrolet'
            WHEN 2 THEN 'RAM'
            WHEN 3 THEN 'Toyota'
            WHEN 4 THEN 'Nissan'
            WHEN 5 THEN 'Tesla'
            WHEN 6 THEN 'Rivian'
            ELSE 'GMC'
        END,
        CASE (n % 8)
            WHEN 0 THEN 'F-150'
            WHEN 1 THEN 'Silverado'
            WHEN 2 THEN '1500'
            WHEN 3 THEN 'Tundra'
            WHEN 4 THEN 'Titan'
            WHEN 5 THEN 'Model 3'
            WHEN 6 THEN 'R1T'
            ELSE 'Sierra'
        END,
        2019 + (n % 5),
        '1FTFW1E' || LPAD((1000000 + n)::TEXT, 9, '0'),
        'FL' || LPAD((1000 + n)::TEXT, 5, '0'),
        'FL',
        CASE (n % 8)
            WHEN 0 THEN 'sedan'
            WHEN 1 THEN 'truck'
            WHEN 2 THEN 'suv'
            WHEN 3 THEN 'van'
            WHEN 4 THEN 'truck'
            WHEN 5 THEN 'sedan'
            WHEN 6 THEN 'truck'
            ELSE 'suv'
        END,
        CASE (n % 8)
            WHEN 5 THEN 'electric'
            WHEN 6 THEN 'electric'
            WHEN 7 THEN 'diesel'
            ELSE 'gasoline'
        END,
        CASE (n % 4)
            WHEN 0 THEN 'active'
            WHEN 1 THEN 'idle'
            WHEN 2 THEN 'service'
            ELSE 'active'
        END,
        (15000 + (n * 3500)),
        (SELECT id FROM drivers WHERE tenant_id = v_tenant_id ORDER BY id LIMIT 1 OFFSET (n % 5)),
        CASE (n % 5)
            WHEN 0 THEN 'Operations'
            WHEN 1 THEN 'Logistics'
            WHEN 2 THEN 'Maintenance'
            WHEN 3 THEN 'Emergency Services'
            ELSE 'Administration'
        END,
        CASE (n % 4)
            WHEN 0 THEN 'North'
            WHEN 1 THEN 'South'
            WHEN 2 THEN 'East'
            ELSE 'West'
        END,
        (50 + (n * 3) % 50),
        -- GPS coordinates around Tallahassee, FL
        30.4383 + (RANDOM() * 0.1 - 0.05),
        -84.2807 + (RANDOM() * 0.1 - 0.05),
        CASE WHEN (n % 8) IN (2, 4, 7) THEN (500 + n * 100) ELSE NULL END,
        CASE (n % 3)
            WHEN 0 THEN 'owned'
            WHEN 1 THEN 'leased'
            ELSE 'owned'
        END,
        CURRENT_DATE - INTERVAL '30 days' * (1 + n % 6),
        CURRENT_DATE + INTERVAL '30 days' * (3 + n % 4),
        CASE (n % 3)
            WHEN 0 THEN '["priority", "gps-enabled"]'::jsonb
            WHEN 1 THEN '["gps-enabled"]'::jsonb
            ELSE '[]'::jsonb
        END,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM generate_series(1, 30) AS n;

    -- Insert Vehicle Alerts
    FOR v_vehicle_id IN SELECT id FROM vehicles WHERE tenant_id = v_tenant_id LIMIT 10
    LOOP
        IF RANDOM() > 0.6 THEN
            INSERT INTO vehicle_alerts (vehicle_id, alert_type, message, severity, created_at, resolved)
            VALUES (
                v_vehicle_id,
                CASE (FLOOR(RANDOM() * 4)::INTEGER)
                    WHEN 0 THEN 'maintenance'
                    WHEN 1 THEN 'fuel-low'
                    WHEN 2 THEN 'inspection-due'
                    ELSE 'tire-pressure'
                END,
                CASE (FLOOR(RANDOM() * 4)::INTEGER)
                    WHEN 0 THEN 'Scheduled maintenance due soon'
                    WHEN 1 THEN 'Fuel level below 25%'
                    WHEN 2 THEN 'Annual inspection required'
                    ELSE 'Check tire pressure'
                END,
                CASE (FLOOR(RANDOM() * 3)::INTEGER)
                    WHEN 0 THEN 'info'
                    WHEN 1 THEN 'warning'
                    ELSE 'info'
                END,
                CURRENT_TIMESTAMP - INTERVAL '1 day' * (RANDOM() * 7)::INTEGER,
                RANDOM() > 0.5
            );
        END IF;
    END LOOP;

    -- Insert Vendors
    INSERT INTO vendors (tenant_id, vendor_name, vendor_type, contact_name, contact_email, contact_phone, address, city, state, zip, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'AutoZone Parts & Service', 'parts', 'Mike Parts', 'mike@autozone.com', '555-1000', '123 Parts St', 'Tallahassee', 'FL', '32301', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (v_tenant_id, 'Quick Lube Center', 'service', 'Sarah Service', 'sarah@quicklube.com', '555-1001', '456 Service Ave', 'Tallahassee', 'FL', '32302', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (v_tenant_id, 'Fleet Fuel Solutions', 'fuel', 'John Fuel', 'john@fleetfuel.com', '555-1002', '789 Fuel Rd', 'Tallahassee', 'FL', '32303', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (v_tenant_id, 'Tire & Service Center', 'service', 'Lisa Tire', 'lisa@tireservice.com', '555-1003', '321 Tire Blvd', 'Tallahassee', 'FL', '32304', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (v_tenant_id, 'Parts Plus Depot', 'parts', 'Tom Parts', 'tom@partsplus.com', '555-1004', '654 Depot Dr', 'Tallahassee', 'FL', '32305', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

END $$;
