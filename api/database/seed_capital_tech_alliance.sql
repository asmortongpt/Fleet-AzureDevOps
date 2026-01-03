-- Capital Tech Alliance - Staging Database Seed Data
-- Tallahassee, Florida Fleet Management System
-- Generated: 2025-11-11
-- This script populates the staging database with realistic data for Capital Tech Alliance

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- Clean up existing data (staging environment only!)
-- ============================================
TRUNCATE TABLE notifications CASCADE;
TRUNCATE TABLE policy_violations CASCADE;
TRUNCATE TABLE policies CASCADE;
TRUNCATE TABLE communication_logs CASCADE;
TRUNCATE TABLE purchase_orders CASCADE;
TRUNCATE TABLE vendors CASCADE;
TRUNCATE TABLE charging_sessions CASCADE;
TRUNCATE TABLE charging_stations CASCADE;
TRUNCATE TABLE video_events CASCADE;
TRUNCATE TABLE safety_incidents CASCADE;
TRUNCATE TABLE damage_reports CASCADE;
TRUNCATE TABLE inspections CASCADE;
TRUNCATE TABLE inspection_forms CASCADE;
TRUNCATE TABLE telemetry_data CASCADE;
TRUNCATE TABLE geofence_events CASCADE;
TRUNCATE TABLE geofences CASCADE;
TRUNCATE TABLE routes CASCADE;
TRUNCATE TABLE fuel_transactions CASCADE;
TRUNCATE TABLE maintenance_schedules CASCADE;
TRUNCATE TABLE work_orders CASCADE;
TRUNCATE TABLE facilities CASCADE;
TRUNCATE TABLE drivers CASCADE;
TRUNCATE TABLE vehicles CASCADE;
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE tenants CASCADE;

-- ============================================
-- Tenant: Capital Tech Alliance
-- ============================================
INSERT INTO tenants (id, name, domain, settings, is_active, created_at)
VALUES (
    'a0000000-0000-0000-0000-000000000001'::UUID,
    'Capital Tech Alliance',
    'capitaltechalliance.com',
    '{
        "company": {
            "name": "Capital Tech Alliance",
            "address": "1500 Capital Circle SE",
            "city": "Tallahassee",
            "state": "FL",
            "zip": "32301",
            "phone": "(850) 555-0100",
            "industry": "Technology Services",
            "timezone": "America/New_York"
        },
        "fleet": {
            "size": 50,
            "types": ["trucks", "vans", "sedans", "suvs", "evs", "heavy_equipment"]
        }
    }'::JSONB,
    true,
    NOW() - INTERVAL '2 years'
);

-- ============================================
-- Users (Admin, Fleet Managers, Technicians, Drivers)
-- ============================================

-- Admin User
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, created_at)
VALUES
    ('a0000000-0000-0000-0001-000000000001'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'admin@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Sarah', 'Mitchell', '(850) 555-0101', 'admin', true, NOW() - INTERVAL '2 years'),

-- Fleet Managers
    ('a0000000-0000-0000-0001-000000000002'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'james.thompson@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'James', 'Thompson', '(850) 555-0102', 'fleet_manager', true, NOW() - INTERVAL '18 months'),

    ('a0000000-0000-0000-0001-000000000003'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'maria.rodriguez@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Maria', 'Rodriguez', '(850) 555-0103', 'fleet_manager', true, NOW() - INTERVAL '1 year'),

-- Technicians
    ('a0000000-0000-0000-0001-000000000004'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'david.chen@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'David', 'Chen', '(850) 555-0104', 'technician', true, NOW() - INTERVAL '14 months'),

    ('a0000000-0000-0000-0001-000000000005'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'michael.johnson@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Michael', 'Johnson', '(850) 555-0105', 'technician', true, NOW() - INTERVAL '10 months'),

    ('a0000000-0000-0000-0001-000000000006'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'robert.williams@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Robert', 'Williams', '(850) 555-0106', 'technician', true, NOW() - INTERVAL '8 months');

-- Driver Users (we'll create 30 drivers)
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, created_at)
VALUES
    ('a0000000-0000-0000-0002-000000000001'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'john.davis@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'John', 'Davis', '(850) 555-1001', 'driver', true, NOW() - INTERVAL '16 months'),

    ('a0000000-0000-0000-0002-000000000002'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'jennifer.wilson@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Jennifer', 'Wilson', '(850) 555-1002', 'driver', true, NOW() - INTERVAL '15 months'),

    ('a0000000-0000-0000-0002-000000000003'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'robert.brown@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Robert', 'Brown', '(850) 555-1003', 'driver', true, NOW() - INTERVAL '14 months'),

    ('a0000000-0000-0000-0002-000000000004'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'linda.martinez@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Linda', 'Martinez', '(850) 555-1004', 'driver', true, NOW() - INTERVAL '13 months'),

    ('a0000000-0000-0000-0002-000000000005'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'william.garcia@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'William', 'Garcia', '(850) 555-1005', 'driver', true, NOW() - INTERVAL '12 months'),

    ('a0000000-0000-0000-0002-000000000006'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'patricia.taylor@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Patricia', 'Taylor', '(850) 555-1006', 'driver', true, NOW() - INTERVAL '11 months'),

    ('a0000000-0000-0000-0002-000000000007'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'charles.anderson@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Charles', 'Anderson', '(850) 555-1007', 'driver', true, NOW() - INTERVAL '10 months'),

    ('a0000000-0000-0000-0002-000000000008'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'barbara.thomas@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Barbara', 'Thomas', '(850) 555-1008', 'driver', true, NOW() - INTERVAL '9 months'),

    ('a0000000-0000-0000-0002-000000000009'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'joseph.jackson@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Joseph', 'Jackson', '(850) 555-1009', 'driver', true, NOW() - INTERVAL '8 months'),

    ('a0000000-0000-0000-0002-000000000010'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'susan.white@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Susan', 'White', '(850) 555-1010', 'driver', true, NOW() - INTERVAL '8 months'),

    ('a0000000-0000-0000-0002-000000000011'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'thomas.harris@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Thomas', 'Harris', '(850) 555-1011', 'driver', true, NOW() - INTERVAL '7 months'),

    ('a0000000-0000-0000-0002-000000000012'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'jessica.martin@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Jessica', 'Martin', '(850) 555-1012', 'driver', true, NOW() - INTERVAL '7 months'),

    ('a0000000-0000-0000-0002-000000000013'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'daniel.thompson@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Daniel', 'Thompson', '(850) 555-1013', 'driver', true, NOW() - INTERVAL '6 months'),

    ('a0000000-0000-0000-0002-000000000014'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'sarah.moore@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Sarah', 'Moore', '(850) 555-1014', 'driver', true, NOW() - INTERVAL '6 months'),

    ('a0000000-0000-0000-0002-000000000015'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'christopher.lee@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Christopher', 'Lee', '(850) 555-1015', 'driver', true, NOW() - INTERVAL '5 months'),

    ('a0000000-0000-0000-0002-000000000016'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'nancy.walker@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Nancy', 'Walker', '(850) 555-1016', 'driver', true, NOW() - INTERVAL '5 months'),

    ('a0000000-0000-0000-0002-000000000017'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'matthew.hall@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Matthew', 'Hall', '(850) 555-1017', 'driver', true, NOW() - INTERVAL '4 months'),

    ('a0000000-0000-0000-0002-000000000018'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'betty.allen@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Betty', 'Allen', '(850) 555-1018', 'driver', true, NOW() - INTERVAL '4 months'),

    ('a0000000-0000-0000-0002-000000000019'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'anthony.young@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Anthony', 'Young', '(850) 555-1019', 'driver', true, NOW() - INTERVAL '3 months'),

    ('a0000000-0000-0000-0002-000000000020'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'sandra.king@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Sandra', 'King', '(850) 555-1020', 'driver', true, NOW() - INTERVAL '3 months'),

    ('a0000000-0000-0000-0002-000000000021'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'mark.wright@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Mark', 'Wright', '(850) 555-1021', 'driver', true, NOW() - INTERVAL '3 months'),

    ('a0000000-0000-0000-0002-000000000022'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'ashley.lopez@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Ashley', 'Lopez', '(850) 555-1022', 'driver', true, NOW() - INTERVAL '2 months'),

    ('a0000000-0000-0000-0002-000000000023'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'donald.hill@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Donald', 'Hill', '(850) 555-1023', 'driver', true, NOW() - INTERVAL '2 months'),

    ('a0000000-0000-0000-0002-000000000024'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'kimberly.green@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Kimberly', 'Green', '(850) 555-1024', 'driver', true, NOW() - INTERVAL '2 months'),

    ('a0000000-0000-0000-0002-000000000025'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'steven.adams@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Steven', 'Adams', '(850) 555-1025', 'driver', true, NOW() - INTERVAL '1 month'),

    ('a0000000-0000-0000-0002-000000000026'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'emily.baker@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Emily', 'Baker', '(850) 555-1026', 'driver', true, NOW() - INTERVAL '1 month'),

    ('a0000000-0000-0000-0002-000000000027'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'paul.nelson@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Paul', 'Nelson', '(850) 555-1027', 'driver', true, NOW() - INTERVAL '1 month'),

    ('a0000000-0000-0000-0002-000000000028'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'michelle.carter@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Michelle', 'Carter', '(850) 555-1028', 'driver', true, NOW() - INTERVAL '2 weeks'),

    ('a0000000-0000-0000-0002-000000000029'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'andrew.mitchell@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Andrew', 'Mitchell', '(850) 555-1029', 'driver', true, NOW() - INTERVAL '2 weeks'),

    ('a0000000-0000-0000-0002-000000000030'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'carol.perez@capitaltechalliance.com', '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
     'Carol', 'Perez', '(850) 555-1030', 'driver', true, NOW() - INTERVAL '1 week');

-- ============================================
-- Facilities in Tallahassee
-- ============================================
INSERT INTO facilities (id, tenant_id, name, facility_type, address, city, state, zip_code, latitude, longitude, location, phone, capacity, service_bays, is_active, created_at)
VALUES
    ('a0000000-0000-0000-0003-000000000001'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Capital Tech Alliance HQ Fleet Center', 'garage', '1500 Capital Circle SE', 'Tallahassee', 'FL', '32301',
     30.4383, -84.2807, ST_SetSRID(ST_MakePoint(-84.2807, 30.4383), 4326)::geography,
     '(850) 555-0200', 50, 10, true, NOW() - INTERVAL '2 years'),

    ('a0000000-0000-0000-0003-000000000002'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Northside Depot', 'depot', '3200 North Monroe Street', 'Tallahassee', 'FL', '32303',
     30.4850, -84.2807, ST_SetSRID(ST_MakePoint(-84.2807, 30.4850), 4326)::geography,
     '(850) 555-0201', 25, 5, true, NOW() - INTERVAL '1 year'),

    ('a0000000-0000-0000-0003-000000000003'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Southside Service Center', 'service_center', '4500 Woodville Highway', 'Tallahassee', 'FL', '32305',
     30.3916, -84.2807, ST_SetSRID(ST_MakePoint(-84.2807, 30.3916), 4326)::geography,
     '(850) 555-0202', 30, 8, true, NOW() - INTERVAL '6 months');

-- ============================================
-- Drivers (CDL and regular)
-- ============================================
INSERT INTO drivers (id, tenant_id, user_id, license_number, license_state, license_expiration, cdl_class, cdl_endorsements,
                     medical_card_expiration, hire_date, status, safety_score, created_at)
VALUES
    ('a0000000-0000-0000-0004-000000000001'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000001'::UUID, 'D12345678', 'FL', '2026-12-31', 'A', ARRAY['H', 'N', 'T'],
     '2026-06-30', '2023-07-01', 'active', 98.5, NOW() - INTERVAL '16 months'),

    ('a0000000-0000-0000-0004-000000000002'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000002'::UUID, 'D23456789', 'FL', '2027-01-15', NULL, NULL,
     NULL, '2023-08-15', 'active', 96.2, NOW() - INTERVAL '15 months'),

    ('a0000000-0000-0000-0004-000000000003'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000003'::UUID, 'D34567890', 'FL', '2026-11-20', 'B', ARRAY['H', 'N'],
     '2026-05-31', '2023-09-01', 'active', 99.1, NOW() - INTERVAL '14 months'),

    ('a0000000-0000-0000-0004-000000000004'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000004'::UUID, 'D45678901', 'FL', '2027-03-10', NULL, NULL,
     NULL, '2023-10-01', 'active', 95.8, NOW() - INTERVAL '13 months'),

    ('a0000000-0000-0000-0004-000000000005'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000005'::UUID, 'D56789012', 'FL', '2026-09-25', 'A', ARRAY['H', 'N', 'X'],
     '2026-04-30', '2023-11-15', 'active', 97.3, NOW() - INTERVAL '12 months'),

    ('a0000000-0000-0000-0004-000000000006'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000006'::UUID, 'D67890123', 'FL', '2027-02-14', NULL, NULL,
     NULL, '2023-12-01', 'active', 94.6, NOW() - INTERVAL '11 months'),

    ('a0000000-0000-0000-0004-000000000007'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000007'::UUID, 'D78901234', 'FL', '2026-08-30', 'B', ARRAY['N'],
     '2026-03-31', '2024-01-15', 'active', 98.9, NOW() - INTERVAL '10 months'),

    ('a0000000-0000-0000-0004-000000000008'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000008'::UUID, 'D89012345', 'FL', '2027-04-20', NULL, NULL,
     NULL, '2024-02-01', 'active', 93.5, NOW() - INTERVAL '9 months'),

    ('a0000000-0000-0000-0004-000000000009'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000009'::UUID, 'D90123456', 'FL', '2026-10-15', 'A', ARRAY['H', 'T'],
     '2026-07-31', '2024-03-01', 'active', 96.7, NOW() - INTERVAL '8 months'),

    ('a0000000-0000-0000-0004-000000000010'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000010'::UUID, 'D01234567', 'FL', '2027-05-22', NULL, NULL,
     NULL, '2024-03-15', 'active', 97.8, NOW() - INTERVAL '8 months'),

    ('a0000000-0000-0000-0004-000000000011'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000011'::UUID, 'D11223344', 'FL', '2026-07-18', NULL, NULL,
     NULL, '2024-04-01', 'active', 95.4, NOW() - INTERVAL '7 months'),

    ('a0000000-0000-0000-0004-000000000012'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000012'::UUID, 'D22334455', 'FL', '2027-06-12', NULL, NULL,
     NULL, '2024-04-15', 'active', 98.2, NOW() - INTERVAL '7 months'),

    ('a0000000-0000-0000-0004-000000000013'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000013'::UUID, 'D33445566', 'FL', '2026-12-08', NULL, NULL,
     NULL, '2024-05-01', 'active', 94.9, NOW() - INTERVAL '6 months'),

    ('a0000000-0000-0000-0004-000000000014'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000014'::UUID, 'D44556677', 'FL', '2027-01-25', NULL, NULL,
     NULL, '2024-05-15', 'active', 99.3, NOW() - INTERVAL '6 months'),

    ('a0000000-0000-0000-0004-000000000015'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000015'::UUID, 'D55667788', 'FL', '2026-11-30', NULL, NULL,
     NULL, '2024-06-01', 'active', 96.1, NOW() - INTERVAL '5 months'),

    ('a0000000-0000-0000-0004-000000000016'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000016'::UUID, 'D66778899', 'FL', '2027-02-28', NULL, NULL,
     NULL, '2024-06-15', 'active', 93.8, NOW() - INTERVAL '5 months'),

    ('a0000000-0000-0000-0004-000000000017'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000017'::UUID, 'D77889900', 'FL', '2026-10-10', NULL, NULL,
     NULL, '2024-07-01', 'active', 97.5, NOW() - INTERVAL '4 months'),

    ('a0000000-0000-0000-0004-000000000018'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000018'::UUID, 'D88990011', 'FL', '2027-03-15', NULL, NULL,
     NULL, '2024-07-15', 'active', 95.2, NOW() - INTERVAL '4 months'),

    ('a0000000-0000-0000-0004-000000000019'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000019'::UUID, 'D99001122', 'FL', '2026-09-20', NULL, NULL,
     NULL, '2024-08-01', 'active', 98.6, NOW() - INTERVAL '3 months'),

    ('a0000000-0000-0000-0004-000000000020'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000020'::UUID, 'D00112233', 'FL', '2027-04-10', NULL, NULL,
     NULL, '2024-08-15', 'active', 94.4, NOW() - INTERVAL '3 months'),

    ('a0000000-0000-0000-0004-000000000021'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000021'::UUID, 'D10112233', 'FL', '2026-08-25', NULL, NULL,
     NULL, '2024-08-20', 'active', 96.9, NOW() - INTERVAL '3 months'),

    ('a0000000-0000-0000-0004-000000000022'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000022'::UUID, 'D20112233', 'FL', '2027-05-05', NULL, NULL,
     NULL, '2024-09-01', 'active', 92.7, NOW() - INTERVAL '2 months'),

    ('a0000000-0000-0000-0004-000000000023'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000023'::UUID, 'D30112233', 'FL', '2026-07-30', NULL, NULL,
     NULL, '2024-09-10', 'active', 99.0, NOW() - INTERVAL '2 months'),

    ('a0000000-0000-0000-0004-000000000024'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000024'::UUID, 'D40112233', 'FL', '2027-06-18', NULL, NULL,
     NULL, '2024-09-15', 'active', 95.6, NOW() - INTERVAL '2 months'),

    ('a0000000-0000-0000-0004-000000000025'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000025'::UUID, 'D50112233', 'FL', '2026-12-12', NULL, NULL,
     NULL, '2024-10-01', 'active', 97.1, NOW() - INTERVAL '1 month'),

    ('a0000000-0000-0000-0004-000000000026'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000026'::UUID, 'D60112233', 'FL', '2027-01-20', NULL, NULL,
     NULL, '2024-10-05', 'active', 93.9, NOW() - INTERVAL '1 month'),

    ('a0000000-0000-0000-0004-000000000027'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000027'::UUID, 'D70112233', 'FL', '2026-11-08', NULL, NULL,
     NULL, '2024-10-10', 'active', 98.4, NOW() - INTERVAL '1 month'),

    ('a0000000-0000-0000-0004-000000000028'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000028'::UUID, 'D80112233', 'FL', '2027-02-22', NULL, NULL,
     NULL, '2024-10-20', 'active', 94.8, NOW() - INTERVAL '2 weeks'),

    ('a0000000-0000-0000-0004-000000000029'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000029'::UUID, 'D90112233', 'FL', '2026-10-05', NULL, NULL,
     NULL, '2024-10-25', 'active', 96.3, NOW() - INTERVAL '2 weeks'),

    ('a0000000-0000-0000-0004-000000000030'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0002-000000000030'::UUID, 'D00222333', 'FL', '2027-03-30', NULL, NULL,
     NULL, '2024-11-01', 'active', 92.5, NOW() - INTERVAL '1 week');

-- Continue in next part due to size...
