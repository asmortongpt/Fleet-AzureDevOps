-- Fleet Management System Database Seed Script
-- This script populates the database with realistic test data
-- Can be configured for different environments (dev: 50 vehicles, staging: 100 vehicles)

-- Variables for configuration (set before running)
-- \set num_vehicles 50  -- For dev
-- \set num_vehicles 100 -- For staging

-- Create tables if they don't exist (migration)
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    user_id INTEGER REFERENCES users(id),
    license_number VARCHAR(50) NOT NULL,
    license_state VARCHAR(2),
    license_expiry DATE,
    hire_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    phone VARCHAR(20),
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    vin VARCHAR(17) NOT NULL UNIQUE,
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    license_plate VARCHAR(20),
    license_state VARCHAR(2),
    vehicle_type VARCHAR(50),
    fuel_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    current_mileage INTEGER DEFAULT 0,
    purchase_date DATE,
    purchase_price DECIMAL(10, 2),
    assigned_driver_id INTEGER REFERENCES drivers(id),
    department VARCHAR(100),
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maintenance_records (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    service_type VARCHAR(100),
    service_date DATE,
    mileage INTEGER,
    cost DECIMAL(10, 2),
    vendor VARCHAR(255),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS work_orders (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    assigned_to INTEGER REFERENCES users(id),
    due_date DATE,
    completed_date DATE,
    cost DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fuel_transactions (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    driver_id INTEGER REFERENCES drivers(id),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    gallons DECIMAL(10, 2),
    cost DECIMAL(10, 2),
    price_per_gallon DECIMAL(10, 4),
    mileage INTEGER,
    location VARCHAR(255),
    fuel_type VARCHAR(50),
    card_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing data (for clean seed)
TRUNCATE TABLE fuel_transactions, work_orders, maintenance_records, vehicles, drivers, users, tenants RESTART IDENTITY CASCADE;

-- Seed Tenants
INSERT INTO tenants (name, subdomain, status) VALUES
('Acme Corporation', 'acme', 'active'),
('Global Logistics Inc', 'globallogistics', 'active'),
('City Public Works', 'citypublicworks', 'active'),
('Regional Transport', 'regionaltransport', 'active');

-- Seed Users (passwords are hashed 'password123')
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status) VALUES
-- Acme Corporation Users
(1, 'admin@acme.com', '$2b$10$xQX9Y8z9G7F6E5D4C3B2A1', 'John', 'Smith', 'admin', 'active'),
(1, 'fleet@acme.com', '$2b$10$xQX9Y8z9G7F6E5D4C3B2A1', 'Sarah', 'Johnson', 'fleet_manager', 'active'),
(1, 'driver1@acme.com', '$2b$10$xQX9Y8z9G7F6E5D4C3B2A1', 'Mike', 'Davis', 'driver', 'active'),
(1, 'driver2@acme.com', '$2b$10$xQX9Y8z9G7F6E5D4C3B2A1', 'Emily', 'Wilson', 'driver', 'active'),
(1, 'mechanic@acme.com', '$2b$10$xQX9Y8z9G7F6E5D4C3B2A1', 'Tom', 'Anderson', 'mechanic', 'active'),
-- Global Logistics Users
(2, 'admin@globallogistics.com', '$2b$10$xQX9Y8z9G7F6E5D4C3B2A1', 'Lisa', 'Martinez', 'admin', 'active'),
(2, 'fleet@globallogistics.com', '$2b$10$xQX9Y8z9G7F6E5D4C3B2A1', 'David', 'Brown', 'fleet_manager', 'active'),
-- City Public Works Users
(3, 'admin@citypublicworks.com', '$2b$10$xQX9Y8z9G7F6E5D4C3B2A1', 'Robert', 'Taylor', 'admin', 'active'),
(3, 'fleet@citypublicworks.com', '$2b$10$xQX9Y8z9G7F6E5D4C3B2A1', 'Jennifer', 'White', 'fleet_manager', 'active'),
-- Regional Transport Users
(4, 'admin@regionaltransport.com', '$2b$10$xQX9Y8z9G7F6E5D4C3B2A1', 'James', 'Moore', 'admin', 'active');

-- Seed Drivers
INSERT INTO drivers (tenant_id, user_id, license_number, license_state, license_expiry, hire_date, status, phone, emergency_contact, emergency_phone) VALUES
(1, 3, 'D1234567', 'CA', '2026-12-31', '2020-01-15', 'active', '555-0101', 'Jane Davis', '555-0102'),
(1, 4, 'D1234568', 'CA', '2025-08-20', '2021-03-20', 'active', '555-0103', 'Bob Wilson', '555-0104'),
(2, NULL, 'D9876543', 'TX', '2027-05-15', '2019-06-10', 'active', '555-0201', 'Mary Jones', '555-0202'),
(2, NULL, 'D9876544', 'TX', '2026-11-30', '2020-09-05', 'active', '555-0203', 'Steve Miller', '555-0204'),
(3, NULL, 'D5555555', 'NY', '2025-12-31', '2018-04-12', 'active', '555-0301', 'Alice Green', '555-0302'),
(4, NULL, 'D7777777', 'FL', '2026-06-30', '2021-01-08', 'active', '555-0401', 'Charlie Black', '555-0402');

-- Function to generate realistic vehicle data
CREATE OR REPLACE FUNCTION generate_vehicles(num_vehicles INTEGER) RETURNS VOID AS $$
DECLARE
    i INTEGER;
    tenant_id INTEGER;
    makes TEXT[] := ARRAY['Ford', 'Chevrolet', 'Toyota', 'Honda', 'Nissan', 'Ram', 'GMC', 'Dodge', 'Jeep', 'Hyundai'];
    models TEXT[] := ARRAY['F-150', 'Silverado', 'Camry', 'Accord', 'Altima', '1500', 'Sierra', 'Durango', 'Wrangler', 'Sonata'];
    vehicle_types TEXT[] := ARRAY['Sedan', 'SUV', 'Truck', 'Van', 'Pickup'];
    fuel_types TEXT[] := ARRAY['Gasoline', 'Diesel', 'Electric', 'Hybrid'];
    departments TEXT[] := ARRAY['Operations', 'Sales', 'Maintenance', 'Delivery', 'Field Service'];
    locations TEXT[] := ARRAY['Main Office', 'Warehouse 1', 'Warehouse 2', 'Field Site A', 'Field Site B'];
BEGIN
    FOR i IN 1..num_vehicles LOOP
        tenant_id := (i % 4) + 1;  -- Distribute across tenants

        INSERT INTO vehicles (
            tenant_id, vin, make, model, year, license_plate, license_state,
            vehicle_type, fuel_type, status, current_mileage, purchase_date,
            purchase_price, assigned_driver_id, department, location
        ) VALUES (
            tenant_id,
            'VIN' || LPAD(i::TEXT, 14, '0'),
            makes[1 + (i % array_length(makes, 1))],
            models[1 + (i % array_length(models, 1))],
            2018 + (i % 7),  -- Years 2018-2024
            'ABC' || LPAD(i::TEXT, 4, '0'),
            CASE tenant_id
                WHEN 1 THEN 'CA'
                WHEN 2 THEN 'TX'
                WHEN 3 THEN 'NY'
                WHEN 4 THEN 'FL'
            END,
            vehicle_types[1 + (i % array_length(vehicle_types, 1))],
            fuel_types[1 + (i % array_length(fuel_types, 1))],
            CASE WHEN i % 20 = 0 THEN 'maintenance' ELSE 'active' END,
            5000 + (i * 1000) + (random() * 50000)::INTEGER,
            CURRENT_DATE - (i * 30 || ' days')::INTERVAL,
            25000 + (random() * 40000)::NUMERIC(10,2),
            CASE WHEN i % 8 < 6 THEN (i % 6) + 1 ELSE NULL END,  -- Some vehicles assigned to drivers
            departments[1 + (i % array_length(departments, 1))],
            locations[1 + (i % array_length(locations, 1))]
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate maintenance records
CREATE OR REPLACE FUNCTION generate_maintenance_records(num_records INTEGER) RETURNS VOID AS $$
DECLARE
    i INTEGER;
    vehicle_count INTEGER;
    service_types TEXT[] := ARRAY['Oil Change', 'Tire Rotation', 'Brake Service', 'Transmission Service', 'Engine Tune-up', 'Battery Replacement', 'Air Filter Replacement'];
    vendors TEXT[] := ARRAY['Quick Lube', 'Auto Service Plus', 'Fleet Maintenance Co', 'Vehicle Care Center', 'Express Service'];
BEGIN
    SELECT COUNT(*) INTO vehicle_count FROM vehicles;

    FOR i IN 1..num_records LOOP
        INSERT INTO maintenance_records (
            tenant_id, vehicle_id, service_type, service_date, mileage,
            cost, vendor, notes, status
        ) VALUES (
            (SELECT tenant_id FROM vehicles WHERE id = ((i % vehicle_count) + 1)),
            (i % vehicle_count) + 1,
            service_types[1 + (i % array_length(service_types, 1))],
            CURRENT_DATE - (i * 15 || ' days')::INTERVAL,
            10000 + (i * 5000),
            50 + (random() * 500)::NUMERIC(10,2),
            vendors[1 + (i % array_length(vendors, 1))],
            'Routine maintenance performed',
            'completed'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate work orders
CREATE OR REPLACE FUNCTION generate_work_orders(num_orders INTEGER) RETURNS VOID AS $$
DECLARE
    i INTEGER;
    vehicle_count INTEGER;
    priorities TEXT[] := ARRAY['low', 'medium', 'high', 'urgent'];
    statuses TEXT[] := ARRAY['pending', 'in_progress', 'completed', 'cancelled'];
BEGIN
    SELECT COUNT(*) INTO vehicle_count FROM vehicles;

    FOR i IN 1..num_orders LOOP
        INSERT INTO work_orders (
            tenant_id, vehicle_id, title, description, priority, status,
            assigned_to, due_date, completed_date, cost
        ) VALUES (
            (SELECT tenant_id FROM vehicles WHERE id = ((i % vehicle_count) + 1)),
            (i % vehicle_count) + 1,
            'Work Order #' || i,
            'Service required for vehicle maintenance',
            priorities[1 + (i % array_length(priorities, 1))],
            statuses[1 + (i % array_length(statuses, 1))],
            (i % 10) + 1,
            CURRENT_DATE + (i * 2 || ' days')::INTERVAL,
            CASE WHEN (i % 4) = 3 THEN CURRENT_DATE - (random() * 30)::INTEGER ELSE NULL END,
            100 + (random() * 900)::NUMERIC(10,2)
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate fuel transactions
CREATE OR REPLACE FUNCTION generate_fuel_transactions(num_transactions INTEGER) RETURNS VOID AS $$
DECLARE
    i INTEGER;
    vehicle_count INTEGER;
    driver_count INTEGER;
    fuel_types TEXT[] := ARRAY['Regular', 'Premium', 'Diesel'];
    locations TEXT[] := ARRAY['Shell Station Main St', 'BP Downtown', 'Exxon Highway 101', 'Chevron Airport Rd', 'Mobil Industrial Park'];
BEGIN
    SELECT COUNT(*) INTO vehicle_count FROM vehicles;
    SELECT COUNT(*) INTO driver_count FROM drivers;

    FOR i IN 1..num_transactions LOOP
        INSERT INTO fuel_transactions (
            tenant_id, vehicle_id, driver_id, transaction_date, gallons,
            cost, price_per_gallon, mileage, location, fuel_type, card_number
        ) VALUES (
            (SELECT tenant_id FROM vehicles WHERE id = ((i % vehicle_count) + 1)),
            (i % vehicle_count) + 1,
            (i % driver_count) + 1,
            CURRENT_TIMESTAMP - (i * 12 || ' hours')::INTERVAL,
            8 + (random() * 20)::NUMERIC(10,2),
            30 + (random() * 100)::NUMERIC(10,2),
            3.50 + (random() * 1.5)::NUMERIC(10,4),
            10000 + (i * 1000),
            locations[1 + (i % array_length(locations, 1))],
            fuel_types[1 + (i % array_length(fuel_types, 1))],
            '**** **** **** ' || LPAD((i % 9999)::TEXT, 4, '0')
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute seeding functions
-- Adjust the parameters based on environment:
-- Dev: 50 vehicles, 100 maintenance records, 50 work orders, 200 fuel transactions
-- Staging: 100 vehicles, 300 maintenance records, 150 work orders, 500 fuel transactions

-- For dev environment:
-- SELECT generate_vehicles(50);
-- SELECT generate_maintenance_records(100);
-- SELECT generate_work_orders(50);
-- SELECT generate_fuel_transactions(200);

-- For staging environment:
-- SELECT generate_vehicles(100);
-- SELECT generate_maintenance_records(300);
-- SELECT generate_work_orders(150);
-- SELECT generate_fuel_transactions(500);

-- Clean up functions (commented out - functions needed by seed-dev.sh and seed-staging.sh)
-- DROP FUNCTION IF EXISTS generate_vehicles(INTEGER);
-- DROP FUNCTION IF EXISTS generate_maintenance_records(INTEGER);
-- DROP FUNCTION IF EXISTS generate_work_orders(INTEGER);
-- DROP FUNCTION IF EXISTS generate_fuel_transactions(INTEGER);

-- Display summary
SELECT 'Database seeded successfully!' AS status;
SELECT 'Tenants: ' || COUNT(*) FROM tenants;
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Drivers: ' || COUNT(*) FROM drivers;
SELECT 'Vehicles: ' || COUNT(*) FROM vehicles;
SELECT 'Maintenance Records: ' || COUNT(*) FROM maintenance_records;
SELECT 'Work Orders: ' || COUNT(*) FROM work_orders;
SELECT 'Fuel Transactions: ' || COUNT(*) FROM fuel_transactions;
