-- Insert Demo Data for Fleet Management System
-- This script inserts minimal demo data to populate the application

-- Insert Tenant
INSERT INTO tenants (name, subdomain, created_at, updated_at)
VALUES ('Capital Tech Alliance', 'cta', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (subdomain) DO NOTHING;

-- Get tenant ID
DO $$
DECLARE
    v_tenant_id INTEGER;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE subdomain = 'cta' LIMIT 1;

    -- Insert Admin User
    INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, phone, created_at, updated_at)
    VALUES (
        v_tenant_id,
        'admin@cta.com',
        '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', -- password: admin123
        'Admin',
        'User',
        'admin',
        '555-0100',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (email) DO NOTHING;

    -- Insert Manager User
    INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, phone, created_at, updated_at)
    VALUES (
        v_tenant_id,
        'manager@cta.com',
        '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', -- password: manager123
        'Fleet',
        'Manager',
        'manager',
        '555-0101',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
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

    -- Insert Vehicles
    INSERT INTO vehicles (tenant_id, unit_number, make, model, year, vin, license_plate, vehicle_type, fuel_type, status, odometer, assigned_driver_id, created_at, updated_at)
    SELECT
        v_tenant_id,
        'UNIT-' || LPAD(n::TEXT, 3, '0'),
        CASE (n % 5)
            WHEN 0 THEN 'Ford'
            WHEN 1 THEN 'Chevrolet'
            WHEN 2 THEN 'RAM'
            WHEN 3 THEN 'Toyota'
            ELSE 'Nissan'
        END,
        CASE (n % 5)
            WHEN 0 THEN 'F-150'
            WHEN 1 THEN 'Silverado'
            WHEN 2 THEN '1500'
            WHEN 3 THEN 'Tundra'
            ELSE 'Titan'
        END,
        2020 + (n % 4),
        '1FTFW1E' || LPAD((1000000 + n)::TEXT, 9, '0'),
        'FL-' || LPAD((1000 + n)::TEXT, 4, '0'),
        'Pickup Truck',
        'Gasoline',
        CASE (n % 3)
            WHEN 0 THEN 'active'
            WHEN 1 THEN 'maintenance'
            ELSE 'active'
        END,
        (15000 + (n * 5000)),
        (SELECT id FROM drivers WHERE tenant_id = v_tenant_id ORDER BY id LIMIT 1 OFFSET (n % 5)),
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    FROM generate_series(1, 20) AS n;

    -- Insert Vendors
    INSERT INTO vendors (tenant_id, vendor_name, vendor_type, contact_name, contact_email, contact_phone, address, city, state, zip, is_active, created_at, updated_at)
    VALUES
    (v_tenant_id, 'AutoZone Parts & Service', 'parts', 'Mike Parts', 'mike@autozone.com', '555-1000', '123 Parts St', 'Tallahassee', 'FL', '32301', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (v_tenant_id, 'Quick Lube Center', 'service', 'Sarah Service', 'sarah@quicklube.com', '555-1001', '456 Service Ave', 'Tallahassee', 'FL', '32302', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (v_tenant_id, 'Fleet Fuel Solutions', 'fuel', 'John Fuel', 'john@fleetfuel.com', '555-1002', '789 Fuel Rd', 'Tallahassee', 'FL', '32303', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (v_tenant_id, 'Tire & Service Center', 'service', 'Lisa Tire', 'lisa@tireservice.com', '555-1003', '321 Tire Blvd', 'Tallahassee', 'FL', '32304', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (v_tenant_id, 'Parts Plus Depot', 'parts', 'Tom Parts', 'tom@partsplus.com', '555-1004', '654 Depot Dr', 'Tallahassee', 'FL', '32305', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT DO NOTHING;

    -- Update all vehicles to be located in Tallahassee, FL
    -- Tallahassee coordinates: 30.4383°N, 84.2807°W
    -- Spread vehicles across Tallahassee area
    UPDATE vehicles
    SET
        latitude = 30.4383 + ((RANDOM() * 0.05) - 0.025),  -- Vary by ±0.025 degrees (~2.8km)
        longitude = -84.2807 + ((RANDOM() * 0.05) - 0.025), -- Vary by ±0.025 degrees (~2.8km)
        updated_at = CURRENT_TIMESTAMP
    WHERE tenant_id = v_tenant_id;

END $$;
