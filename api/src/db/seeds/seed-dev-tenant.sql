-- Comprehensive Dev Tenant Seed Data
-- Tenant: 12345678-1234-1234-1234-123456789012
-- Location: Tallahassee, FL (CTA Fleet Operations)

BEGIN;

-- ============================================================
-- 1. TENANT
-- ============================================================
INSERT INTO tenants (id, name, slug, domain, settings, billing_email, subscription_tier, is_active, max_vehicles, max_users)
VALUES (
  '12345678-1234-1234-1234-123456789012',
  'Capital Technology Alliance',
  'cta-fleet',
  'fleet.capitaltechnologyalliance.com',
  '{"timeZone":"America/New_York","location":"Tallahassee, FL","industry":"Government Fleet Management","region":"North Florida"}',
  'fleet@capitaltechnologyalliance.com',
  'enterprise',
  true,
  200,
  100
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, settings = EXCLUDED.settings, updated_at = now();

-- ============================================================
-- 2. USERS (Admin + Staff)
-- ============================================================
INSERT INTO users (id, tenant_id, email, first_name, last_name, role, is_active, last_login_at) VALUES
  ('00000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'andrew.morton@cta.gov', 'Andrew', 'Morton', 'SuperAdmin', true, now()),
  ('00000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', 'sarah.johnson@cta.gov', 'Sarah', 'Johnson', 'Admin', true, now() - interval '2 hours'),
  ('00000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', 'marcus.williams@cta.gov', 'Marcus', 'Williams', 'Manager', true, now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', 'lisa.chen@cta.gov', 'Lisa', 'Chen', 'Dispatcher', true, now() - interval '3 hours'),
  ('00000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', 'robert.garcia@cta.gov', 'Robert', 'Garcia', 'Mechanic', true, now() - interval '5 hours'),
  ('00000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', 'jennifer.davis@cta.gov', 'Jennifer', 'Davis', 'Supervisor', true, now() - interval '1 day'),
  ('00000000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', 'david.thompson@cta.gov', 'David', 'Thompson', 'Mechanic', true, now() - interval '6 hours'),
  ('00000000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', 'amanda.wilson@cta.gov', 'Amanda', 'Wilson', 'Viewer', true, now() - interval '2 days')
ON CONFLICT (id) DO NOTHING;

-- Driver-role users
INSERT INTO users (id, tenant_id, email, first_name, last_name, role, is_active, last_login_at) VALUES
  ('10000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'james.brown@cta.gov', 'James', 'Brown', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', 'maria.rodriguez@cta.gov', 'Maria', 'Rodriguez', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', 'william.jones@cta.gov', 'William', 'Jones', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', 'patricia.martinez@cta.gov', 'Patricia', 'Martinez', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', 'michael.anderson@cta.gov', 'Michael', 'Anderson', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', 'linda.taylor@cta.gov', 'Linda', 'Taylor', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', 'charles.thomas@cta.gov', 'Charles', 'Thomas', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', 'elizabeth.jackson@cta.gov', 'Elizabeth', 'Jackson', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000009', '12345678-1234-1234-1234-123456789012', 'daniel.white@cta.gov', 'Daniel', 'White', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012', 'barbara.harris@cta.gov', 'Barbara', 'Harris', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000011', '12345678-1234-1234-1234-123456789012', 'joseph.martin@cta.gov', 'Joseph', 'Martin', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000012', '12345678-1234-1234-1234-123456789012', 'susan.garcia@cta.gov', 'Susan', 'Garcia', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000013', '12345678-1234-1234-1234-123456789012', 'thomas.clark@cta.gov', 'Thomas', 'Clark', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000014', '12345678-1234-1234-1234-123456789012', 'jessica.lewis@cta.gov', 'Jessica', 'Lewis', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000015', '12345678-1234-1234-1234-123456789012', 'christopher.robinson@cta.gov', 'Christopher', 'Robinson', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000016', '12345678-1234-1234-1234-123456789012', 'karen.walker@cta.gov', 'Karen', 'Walker', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000017', '12345678-1234-1234-1234-123456789012', 'steven.hall@cta.gov', 'Steven', 'Hall', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000018', '12345678-1234-1234-1234-123456789012', 'nancy.allen@cta.gov', 'Nancy', 'Allen', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000019', '12345678-1234-1234-1234-123456789012', 'kevin.young@cta.gov', 'Kevin', 'Young', 'Driver', true, now()),
  ('10000000-0000-0000-0000-000000000020', '12345678-1234-1234-1234-123456789012', 'donna.king@cta.gov', 'Donna', 'King', 'Driver', true, now())
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. FACILITIES (Tallahassee area)
-- ============================================================
INSERT INTO facilities (id, tenant_id, name, code, type, address, city, state, zip_code, latitude, longitude, capacity, contact_name, contact_phone, is_active) VALUES
  ('20000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'CTA Main Operations Center', 'MOC-001', 'headquarters', '315 S Calhoun St', 'Tallahassee', 'FL', '32301', 30.4383, -84.2807, 80, 'Andrew Morton', '(850) 555-0100', true),
  ('20000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', 'North Fleet Maintenance Yard', 'MNT-001', 'maintenance', '1400 N Monroe St', 'Tallahassee', 'FL', '32303', 30.4583, -84.2780, 40, 'Robert Garcia', '(850) 555-0201', true),
  ('20000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', 'South Dispatch Hub', 'DSP-001', 'dispatch', '2600 S Adams St', 'Tallahassee', 'FL', '32301', 30.4183, -84.2770, 30, 'Lisa Chen', '(850) 555-0301', true),
  ('20000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', 'Capital Circle Fuel Depot', 'FUE-001', 'fuel_station', '3200 Capital Circle SE', 'Tallahassee', 'FL', '32311', 30.4250, -84.2500, 20, 'Marcus Williams', '(850) 555-0401', true),
  ('20000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', 'East Side Vehicle Storage', 'STR-001', 'parking', '4500 Apalachee Pkwy', 'Tallahassee', 'FL', '32311', 30.4400, -84.2300, 60, 'Jennifer Davis', '(850) 555-0501', true),
  ('20000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', 'Thomasville Rd Satellite Office', 'SAT-001', 'satellite', '1800 Thomasville Rd', 'Tallahassee', 'FL', '32303', 30.4700, -84.2650, 15, 'Sarah Johnson', '(850) 555-0601', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. DRIVERS
-- ============================================================
INSERT INTO drivers (id, tenant_id, user_id, first_name, last_name, email, phone, employee_number, license_number, license_state, license_expiry_date, cdl, cdl_class, status, hire_date, performance_score, department, safety_score, hos_status, hours_available, cycle_hours_used) VALUES
  ('30000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000001', 'James', 'Brown', 'james.brown@cta.gov', '(850) 555-1001', 'EMP-001', 'FL-B1234567', 'FL', now() + interval '18 months', true, 'A', 'active', '2020-03-15', 94.5, 'Operations', 96.2, 'on_duty', 8.5, 45.5),
  ('30000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000002', 'Maria', 'Rodriguez', 'maria.rodriguez@cta.gov', '(850) 555-1002', 'EMP-002', 'FL-R2345678', 'FL', now() + interval '12 months', true, 'B', 'active', '2019-07-22', 97.2, 'Operations', 98.1, 'on_duty', 7.0, 52.0),
  ('30000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000003', 'William', 'Jones', 'william.jones@cta.gov', '(850) 555-1003', 'EMP-003', 'FL-J3456789', 'FL', now() + interval '24 months', true, 'A', 'active', '2018-01-10', 88.0, 'Logistics', 91.5, 'driving', 5.5, 58.5),
  ('30000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000004', 'Patricia', 'Martinez', 'patricia.martinez@cta.gov', '(850) 555-1004', 'EMP-004', 'FL-M4567890', 'FL', now() + interval '6 months', false, NULL, 'active', '2021-05-03', 92.8, 'Operations', 94.0, 'on_duty', 9.0, 41.0),
  ('30000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000005', 'Michael', 'Anderson', 'michael.anderson@cta.gov', '(850) 555-1005', 'EMP-005', 'FL-A5678901', 'FL', now() + interval '20 months', true, 'A', 'active', '2017-11-28', 91.5, 'Heavy Equipment', 89.3, 'off_duty', 11.0, 36.0),
  ('30000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000006', 'Linda', 'Taylor', 'linda.taylor@cta.gov', '(850) 555-1006', 'EMP-006', 'FL-T6789012', 'FL', now() + interval '15 months', false, NULL, 'active', '2022-02-14', 95.0, 'Operations', 97.5, 'on_duty', 6.5, 53.5),
  ('30000000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000007', 'Charles', 'Thomas', 'charles.thomas@cta.gov', '(850) 555-1007', 'EMP-007', 'FL-T7890123', 'FL', now() + interval '10 months', true, 'B', 'active', '2019-09-01', 87.3, 'Logistics', 85.8, 'sleeper', 0, 65.0),
  ('30000000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000008', 'Elizabeth', 'Jackson', 'elizabeth.jackson@cta.gov', '(850) 555-1008', 'EMP-008', 'FL-J8901234', 'FL', now() + interval '22 months', false, NULL, 'active', '2020-06-17', 96.8, 'Operations', 98.5, 'on_duty', 7.5, 48.5),
  ('30000000-0000-0000-0000-000000000009', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000009', 'Daniel', 'White', 'daniel.white@cta.gov', '(850) 555-1009', 'EMP-009', 'FL-W9012345', 'FL', now() + interval '8 months', true, 'A', 'active', '2018-04-25', 89.5, 'Heavy Equipment', 90.2, 'driving', 4.0, 62.0),
  ('30000000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000010', 'Barbara', 'Harris', 'barbara.harris@cta.gov', '(850) 555-1010', 'EMP-010', 'FL-H0123456', 'FL', now() + interval '14 months', false, NULL, 'active', '2021-08-09', 93.0, 'Operations', 95.0, 'on_duty', 8.0, 46.0),
  ('30000000-0000-0000-0000-000000000011', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000011', 'Joseph', 'Martin', 'joseph.martin@cta.gov', '(850) 555-1011', 'EMP-011', 'FL-M1234560', 'FL', now() + interval '16 months', true, 'B', 'on_leave', '2019-12-03', 86.0, 'Logistics', 88.5, 'off_duty', 11.0, 30.0),
  ('30000000-0000-0000-0000-000000000012', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000012', 'Susan', 'Garcia', 'susan.garcia@cta.gov', '(850) 555-1012', 'EMP-012', 'FL-G2345670', 'FL', now() + interval '11 months', false, NULL, 'active', '2022-01-20', 94.2, 'Operations', 96.8, 'on_duty', 7.0, 50.0),
  ('30000000-0000-0000-0000-000000000013', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000013', 'Thomas', 'Clark', 'thomas.clark@cta.gov', '(850) 555-1013', 'EMP-013', 'FL-C3456780', 'FL', now() + interval '19 months', true, 'A', 'active', '2017-06-15', 90.1, 'Heavy Equipment', 87.0, 'driving', 3.5, 64.5),
  ('30000000-0000-0000-0000-000000000014', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000014', 'Jessica', 'Lewis', 'jessica.lewis@cta.gov', '(850) 555-1014', 'EMP-014', 'FL-L4567890', 'FL', now() + interval '13 months', false, NULL, 'active', '2021-03-08', 97.5, 'Operations', 99.0, 'on_duty', 9.5, 38.5),
  ('30000000-0000-0000-0000-000000000015', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000015', 'Christopher', 'Robinson', 'christopher.robinson@cta.gov', '(850) 555-1015', 'EMP-015', 'FL-R5678900', 'FL', now() + interval '17 months', true, 'A', 'active', '2018-10-12', 85.8, 'Logistics', 83.5, 'on_duty', 6.0, 55.0),
  ('30000000-0000-0000-0000-000000000016', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000016', 'Karen', 'Walker', 'karen.walker@cta.gov', '(850) 555-1016', 'EMP-016', 'FL-W6789010', 'FL', now() + interval '9 months', false, NULL, 'suspended', '2020-09-21', 72.0, 'Operations', 68.5, 'off_duty', 11.0, 0),
  ('30000000-0000-0000-0000-000000000017', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000017', 'Steven', 'Hall', 'steven.hall@cta.gov', '(850) 555-1017', 'EMP-017', 'FL-H7890120', 'FL', now() + interval '21 months', true, 'B', 'active', '2019-04-30', 91.0, 'Heavy Equipment', 92.5, 'on_duty', 8.5, 43.5),
  ('30000000-0000-0000-0000-000000000018', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000018', 'Nancy', 'Allen', 'nancy.allen@cta.gov', '(850) 555-1018', 'EMP-018', 'FL-A8901230', 'FL', now() + interval '7 months', false, NULL, 'training', '2024-11-01', 80.0, 'Operations', 85.0, 'off_duty', 11.0, 15.0),
  ('30000000-0000-0000-0000-000000000019', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000019', 'Kevin', 'Young', 'kevin.young@cta.gov', '(850) 555-1019', 'EMP-019', 'FL-Y9012340', 'FL', now() + interval '23 months', true, 'A', 'active', '2017-02-18', 93.5, 'Logistics', 94.8, 'driving', 5.0, 59.0),
  ('30000000-0000-0000-0000-000000000020', '12345678-1234-1234-1234-123456789012', '10000000-0000-0000-0000-000000000020', 'Donna', 'King', 'donna.king@cta.gov', '(850) 555-1020', 'EMP-020', 'FL-K0123450', 'FL', now() + interval '15 months', false, NULL, 'active', '2022-07-06', 95.5, 'Operations', 97.0, 'on_duty', 7.5, 47.5)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. VEHICLES (50 vehicles - mixed fleet)
-- ============================================================
INSERT INTO vehicles (id, tenant_id, name, number, vin, make, model, year, type, fuel_type, status, license_plate, odometer, latitude, longitude, fuel_level, assigned_driver_id, assigned_facility_id, metadata) VALUES
  -- Sedans (Government fleet cars)
  ('40000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', '2024 Ford Explorer', 'CTA-001', '1FMSK8DH0RGA00001', 'Ford', 'Explorer', 2024, 'suv', 'gasoline', 'active', 'FL-CTA-001', 12450, 30.4383, -84.2807, 78.50, '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '{"color":"White","gps_device":"Geotab-001"}'),
  ('40000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', '2024 Ford Explorer', 'CTA-002', '1FMSK8DH0RGA00002', 'Ford', 'Explorer', 2024, 'suv', 'gasoline', 'active', 'FL-CTA-002', 8920, 30.4450, -84.2900, 65.00, '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '{"color":"White","gps_device":"Geotab-002"}'),
  ('40000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', '2023 Toyota Camry', 'CTA-003', '4T1BZ1HK0PU000003', 'Toyota', 'Camry', 2023, 'sedan', 'gasoline', 'active', 'FL-CTA-003', 21300, 30.4550, -84.2650, 42.30, '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '{"color":"Silver","gps_device":"Geotab-003"}'),
  ('40000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', '2024 Chevrolet Malibu', 'CTA-004', '1G1ZD5ST0RF000004', 'Chevrolet', 'Malibu', 2024, 'sedan', 'gasoline', 'idle', 'FL-CTA-004', 5670, 30.4383, -84.2807, 91.00, '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', '{"color":"Black","gps_device":"Geotab-004"}'),
  ('40000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', '2023 Honda Accord', 'CTA-005', '1HGCV1F3XPA000005', 'Honda', 'Accord', 2023, 'sedan', 'hybrid', 'active', 'FL-CTA-005', 18750, 30.4200, -84.2550, 55.80, '30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', '{"color":"Blue","gps_device":"Geotab-005"}'),

  -- Trucks (Utility / Heavy)
  ('40000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', '2024 Ford F-250', 'CTA-006', '1FT7W2BT0RED00006', 'Ford', 'F-250', 2024, 'truck', 'diesel', 'active', 'FL-CTA-006', 34200, 30.4700, -84.2800, 60.20, '30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', '{"color":"White","gps_device":"Geotab-006","towing_capacity":"14000 lbs"}'),
  ('40000000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', '2023 Chevrolet Silverado 3500', 'CTA-007', '1GC4YVEY0PF000007', 'Chevrolet', 'Silverado 3500', 2023, 'truck', 'diesel', 'active', 'FL-CTA-007', 45600, 30.4600, -84.3000, 35.50, '30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002', '{"color":"Red","gps_device":"Geotab-007","towing_capacity":"23500 lbs"}'),
  ('40000000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', '2024 RAM 2500', 'CTA-008', '3C6UR5DL0RG000008', 'RAM', '2500', 2024, 'truck', 'diesel', 'maintenance', 'FL-CTA-008', 28900, 30.4583, -84.2780, 80.00, NULL, '20000000-0000-0000-0000-000000000002', '{"color":"White","gps_device":"Geotab-008","in_shop":"brake_replacement"}'),
  ('40000000-0000-0000-0000-000000000009', '12345678-1234-1234-1234-123456789012', '2023 Ford F-350', 'CTA-009', '1FT8W3BT0PED00009', 'Ford', 'F-350', 2023, 'truck', 'diesel', 'active', 'FL-CTA-009', 52100, 30.4300, -84.2400, 48.70, '30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000004', '{"color":"Blue","gps_device":"Geotab-009"}'),
  ('40000000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012', '2024 International CV', 'CTA-010', '3HAMMAAR0RL000010', 'International', 'CV', 2024, 'truck', 'diesel', 'active', 'FL-CTA-010', 15800, 30.4150, -84.2700, 72.30, '30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000003', '{"color":"White","gps_device":"Geotab-010","body_type":"Utility"}'),

  -- Vans (Transit / Cargo)
  ('40000000-0000-0000-0000-000000000011', '12345678-1234-1234-1234-123456789012', '2024 Ford Transit 350', 'CTA-011', '1FTBW2XG0RKA00011', 'Ford', 'Transit 350', 2024, 'van', 'gasoline', 'active', 'FL-CTA-011', 22400, 30.4500, -84.2600, 55.00, '30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000001', '{"color":"White","gps_device":"Geotab-011","passenger_capacity":15}'),
  ('40000000-0000-0000-0000-000000000012', '12345678-1234-1234-1234-123456789012', '2023 Mercedes Sprinter', 'CTA-012', 'W1Y4ECHY0PT000012', 'Mercedes-Benz', 'Sprinter', 2023, 'van', 'diesel', 'active', 'FL-CTA-012', 31200, 30.4250, -84.2900, 40.80, '30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000003', '{"color":"White","gps_device":"Geotab-012","cargo_volume":"487 cu ft"}'),
  ('40000000-0000-0000-0000-000000000013', '12345678-1234-1234-1234-123456789012', '2024 RAM ProMaster', 'CTA-013', '3C6LRVDG0RE000013', 'RAM', 'ProMaster 2500', 2024, 'van', 'gasoline', 'idle', 'FL-CTA-013', 9800, 30.4383, -84.2807, 88.50, NULL, '20000000-0000-0000-0000-000000000001', '{"color":"White","gps_device":"Geotab-013"}'),
  ('40000000-0000-0000-0000-000000000014', '12345678-1234-1234-1234-123456789012', '2023 Chevrolet Express', 'CTA-014', '1GCWGAFP0P1000014', 'Chevrolet', 'Express 3500', 2023, 'van', 'gasoline', 'active', 'FL-CTA-014', 41500, 30.4650, -84.2550, 28.90, '30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000005', '{"color":"White","gps_device":"Geotab-014","passenger_capacity":12}'),

  -- Electric Vehicles
  ('40000000-0000-0000-0000-000000000015', '12345678-1234-1234-1234-123456789012', '2024 Tesla Model Y', 'CTA-015', '5YJYGDEE0RF000015', 'Tesla', 'Model Y', 2024, 'suv', 'electric', 'active', 'FL-CTA-015', 6200, 30.4400, -84.2750, 82.00, '30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000001', '{"color":"White","gps_device":"Geotab-015","battery_capacity":"75 kWh","range_miles":310}'),
  ('40000000-0000-0000-0000-000000000016', '12345678-1234-1234-1234-123456789012', '2024 Ford Mustang Mach-E', 'CTA-016', '3FMTK3SS0RMA00016', 'Ford', 'Mustang Mach-E', 2024, 'suv', 'electric', 'charging', 'FL-CTA-016', 4800, 30.4383, -84.2807, 35.00, NULL, '20000000-0000-0000-0000-000000000001', '{"color":"Blue","gps_device":"Geotab-016","battery_capacity":"91 kWh","range_miles":312}'),
  ('40000000-0000-0000-0000-000000000017', '12345678-1234-1234-1234-123456789012', '2024 Chevrolet Bolt EUV', 'CTA-017', '1G1FY6S07R4000017', 'Chevrolet', 'Bolt EUV', 2024, 'sedan', 'electric', 'active', 'FL-CTA-017', 11300, 30.4520, -84.2680, 68.00, '30000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000006', '{"color":"Silver","gps_device":"Geotab-017","battery_capacity":"65 kWh","range_miles":247}'),
  ('40000000-0000-0000-0000-000000000018', '12345678-1234-1234-1234-123456789012', '2024 Ford Lightning', 'CTA-018', '1FTFW1E5XRFA00018', 'Ford', 'F-150 Lightning', 2024, 'truck', 'electric', 'active', 'FL-CTA-018', 8700, 30.4350, -84.2850, 71.50, '30000000-0000-0000-0000-000000000019', '20000000-0000-0000-0000-000000000002', '{"color":"White","gps_device":"Geotab-018","battery_capacity":"131 kWh","range_miles":320}'),

  -- Buses
  ('40000000-0000-0000-0000-000000000019', '12345678-1234-1234-1234-123456789012', '2023 Blue Bird Vision', 'CTA-019', '1BAKBCEA0PF000019', 'Blue Bird', 'Vision', 2023, 'bus', 'diesel', 'active', 'FL-CTA-019', 67800, 30.4280, -84.2950, 52.00, '30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000003', '{"color":"Yellow","gps_device":"Geotab-019","passenger_capacity":72}'),
  ('40000000-0000-0000-0000-000000000020', '12345678-1234-1234-1234-123456789012', '2024 Ford E-Transit', 'CTA-020', '1FTRS4EG0RWA00020', 'Ford', 'E-Transit', 2024, 'bus', 'electric', 'active', 'FL-CTA-020', 14200, 30.4480, -84.2720, 60.50, '30000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000001', '{"color":"White","gps_device":"Geotab-020","passenger_capacity":15,"battery_capacity":"89 kWh"}'),

  -- More trucks & utility
  ('40000000-0000-0000-0000-000000000021', '12345678-1234-1234-1234-123456789012', '2024 Ford F-150', 'CTA-021', '1FTEW1EP0RFA00021', 'Ford', 'F-150', 2024, 'truck', 'gasoline', 'active', 'FL-CTA-021', 19500, 30.4320, -84.2620, 45.00, '30000000-0000-0000-0000-000000000011', '20000000-0000-0000-0000-000000000004', '{"color":"Red","gps_device":"Geotab-021"}'),
  ('40000000-0000-0000-0000-000000000022', '12345678-1234-1234-1234-123456789012', '2023 Toyota Tacoma', 'CTA-022', '3TMCZ5AN0PM000022', 'Toyota', 'Tacoma', 2023, 'truck', 'gasoline', 'active', 'FL-CTA-022', 27800, 30.4180, -84.3050, 58.20, NULL, '20000000-0000-0000-0000-000000000005', '{"color":"Gray","gps_device":"Geotab-022"}'),
  ('40000000-0000-0000-0000-000000000023', '12345678-1234-1234-1234-123456789012', '2024 Chevrolet Colorado', 'CTA-023', '1GCGTDEN0R1000023', 'Chevrolet', 'Colorado', 2024, 'truck', 'gasoline', 'service', 'FL-CTA-023', 3200, 30.4583, -84.2780, 95.00, NULL, '20000000-0000-0000-0000-000000000002', '{"color":"White","gps_device":"Geotab-023","in_shop":"initial_inspection"}'),
  ('40000000-0000-0000-0000-000000000024', '12345678-1234-1234-1234-123456789012', '2023 GMC Sierra 2500HD', 'CTA-024', '1GT49VEY0PF000024', 'GMC', 'Sierra 2500HD', 2023, 'truck', 'diesel', 'active', 'FL-CTA-024', 38400, 30.4420, -84.2480, 30.10, '30000000-0000-0000-0000-000000000018', '20000000-0000-0000-0000-000000000002', '{"color":"Black","gps_device":"Geotab-024"}'),
  ('40000000-0000-0000-0000-000000000025', '12345678-1234-1234-1234-123456789012', '2024 Ford Ranger', 'CTA-025', '1FTER4FH0RLA00025', 'Ford', 'Ranger', 2024, 'truck', 'gasoline', 'active', 'FL-CTA-025', 7600, 30.4560, -84.2580, 70.40, '30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', '{"color":"Blue","gps_device":"Geotab-025"}'),

  -- SUVs
  ('40000000-0000-0000-0000-000000000026', '12345678-1234-1234-1234-123456789012', '2024 Chevrolet Tahoe', 'CTA-026', '1GNSKBKD0RR000026', 'Chevrolet', 'Tahoe', 2024, 'suv', 'gasoline', 'active', 'FL-CTA-026', 16200, 30.4350, -84.2750, 62.00, '30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', '{"color":"Black","gps_device":"Geotab-026"}'),
  ('40000000-0000-0000-0000-000000000027', '12345678-1234-1234-1234-123456789012', '2023 Toyota 4Runner', 'CTA-027', 'JTERU5JR0P6000027', 'Toyota', '4Runner', 2023, 'suv', 'gasoline', 'active', 'FL-CTA-027', 24500, 30.4620, -84.2820, 50.50, '30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000006', '{"color":"Green","gps_device":"Geotab-027"}'),
  ('40000000-0000-0000-0000-000000000028', '12345678-1234-1234-1234-123456789012', '2024 Jeep Grand Cherokee', 'CTA-028', '1C4RJKBG0R8000028', 'Jeep', 'Grand Cherokee', 2024, 'suv', 'gasoline', 'idle', 'FL-CTA-028', 11800, 30.4383, -84.2807, 85.30, NULL, '20000000-0000-0000-0000-000000000001', '{"color":"White","gps_device":"Geotab-028"}'),
  ('40000000-0000-0000-0000-000000000029', '12345678-1234-1234-1234-123456789012', '2023 Ford Bronco', 'CTA-029', '1FMDE5BH0PLA00029', 'Ford', 'Bronco', 2023, 'suv', 'gasoline', 'active', 'FL-CTA-029', 19200, 30.4480, -84.2680, 38.70, '30000000-0000-0000-0000-000000000014', '20000000-0000-0000-0000-000000000005', '{"color":"Orange","gps_device":"Geotab-029"}'),
  ('40000000-0000-0000-0000-000000000030', '12345678-1234-1234-1234-123456789012', '2024 Hyundai Tucson', 'CTA-030', 'KM8J3CAL0RU000030', 'Hyundai', 'Tucson', 2024, 'suv', 'hybrid', 'active', 'FL-CTA-030', 8400, 30.4250, -84.2950, 75.00, '30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000003', '{"color":"White","gps_device":"Geotab-030"}'),

  -- Emergency vehicles
  ('40000000-0000-0000-0000-000000000031', '12345678-1234-1234-1234-123456789012', '2024 Ford Explorer Interceptor', 'CTA-E01', '1FM5K8AB0RGA00031', 'Ford', 'Explorer Interceptor', 2024, 'emergency', 'gasoline', 'active', 'FL-CTA-E01', 42300, 30.4300, -84.2800, 55.00, '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '{"color":"Black/White","gps_device":"Geotab-031","emergency_lights":true}'),
  ('40000000-0000-0000-0000-000000000032', '12345678-1234-1234-1234-123456789012', '2023 Chevrolet Tahoe PPV', 'CTA-E02', '1GNSCKKD0PR000032', 'Chevrolet', 'Tahoe PPV', 2023, 'emergency', 'gasoline', 'active', 'FL-CTA-E02', 38900, 30.4520, -84.2720, 48.20, '30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000001', '{"color":"White","gps_device":"Geotab-032","emergency_lights":true}'),

  -- Construction / Specialty
  ('40000000-0000-0000-0000-000000000033', '12345678-1234-1234-1234-123456789012', '2022 CAT 320 Excavator', 'CTA-C01', 'CAT0320GC0A200033', 'Caterpillar', '320 GC', 2022, 'construction', 'diesel', 'active', 'FL-CTA-C01', 2800, 30.4150, -84.2500, 60.00, '30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000005', '{"color":"Yellow","gps_device":"Geotab-033","operating_weight":"50700 lbs"}'),
  ('40000000-0000-0000-0000-000000000034', '12345678-1234-1234-1234-123456789012', '2023 John Deere 310SL', 'CTA-C02', 'JD0310SL0P1000034', 'John Deere', '310SL Backhoe', 2023, 'construction', 'diesel', 'idle', 'FL-CTA-C02', 1500, 30.4200, -84.2450, 85.00, NULL, '20000000-0000-0000-0000-000000000005', '{"color":"Green/Yellow","gps_device":"Geotab-034"}'),
  ('40000000-0000-0000-0000-000000000035', '12345678-1234-1234-1234-123456789012', '2024 Bobcat S770', 'CTA-C03', 'BOB0S770H4B000035', 'Bobcat', 'S770', 2024, 'construction', 'diesel', 'active', 'FL-CTA-C03', 950, 30.4100, -84.2550, 72.00, '30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000005', '{"color":"White","gps_device":"Geotab-035"}'),

  -- Specialty vehicles
  ('40000000-0000-0000-0000-000000000036', '12345678-1234-1234-1234-123456789012', '2023 Altec AT40G Bucket Truck', 'CTA-S01', 'ALT0AT40G0P000036', 'Altec', 'AT40G', 2023, 'specialty', 'diesel', 'active', 'FL-CTA-S01', 18600, 30.4450, -84.3100, 45.00, '30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000002', '{"color":"White","gps_device":"Geotab-036","reach_height":"45 ft"}'),
  ('40000000-0000-0000-0000-000000000037', '12345678-1234-1234-1234-123456789012', '2024 Vermeer BC1800XL Chipper', 'CTA-S02', 'VER0BC18X0R000037', 'Vermeer', 'BC1800XL', 2024, 'specialty', 'diesel', 'active', 'FL-CTA-S02', 3200, 30.4380, -84.2600, 68.00, '30000000-0000-0000-0000-000000000017', '20000000-0000-0000-0000-000000000005', '{"color":"Yellow/Black","gps_device":"Geotab-037"}'),
  ('40000000-0000-0000-0000-000000000038', '12345678-1234-1234-1234-123456789012', '2023 Elgin Pelican Sweeper', 'CTA-S03', 'ELG0PELC0P3000038', 'Elgin', 'Pelican', 2023, 'specialty', 'diesel', 'maintenance', 'FL-CTA-S03', 8900, 30.4583, -84.2780, 50.00, NULL, '20000000-0000-0000-0000-000000000002', '{"color":"White/Orange","gps_device":"Geotab-038","in_shop":"hydraulic_repair"}'),

  -- More sedans/SUVs
  ('40000000-0000-0000-0000-000000000039', '12345678-1234-1234-1234-123456789012', '2024 Nissan Altima', 'CTA-039', '1N4BL4DV0RN000039', 'Nissan', 'Altima', 2024, 'sedan', 'gasoline', 'active', 'FL-CTA-039', 5100, 30.4320, -84.2880, 82.00, '30000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000006', '{"color":"Gray","gps_device":"Geotab-039"}'),
  ('40000000-0000-0000-0000-000000000040', '12345678-1234-1234-1234-123456789012', '2023 Kia K5', 'CTA-040', 'KNAGT4LA0P5000040', 'Kia', 'K5', 2023, 'sedan', 'gasoline', 'active', 'FL-CTA-040', 14700, 30.4550, -84.2950, 52.40, '30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '{"color":"White","gps_device":"Geotab-040"}'),
  ('40000000-0000-0000-0000-000000000041', '12345678-1234-1234-1234-123456789012', '2024 Toyota RAV4 Hybrid', 'CTA-041', '2T3P6RFV0RW000041', 'Toyota', 'RAV4 Hybrid', 2024, 'suv', 'hybrid', 'active', 'FL-CTA-041', 9200, 30.4280, -84.2700, 70.00, '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '{"color":"Blue","gps_device":"Geotab-041"}'),
  ('40000000-0000-0000-0000-000000000042', '12345678-1234-1234-1234-123456789012', '2023 Honda CR-V', 'CTA-042', '7FARS6H07PE000042', 'Honda', 'CR-V', 2023, 'suv', 'hybrid', 'idle', 'FL-CTA-042', 16800, 30.4400, -84.2650, 63.50, NULL, '20000000-0000-0000-0000-000000000001', '{"color":"Silver","gps_device":"Geotab-042"}'),
  ('40000000-0000-0000-0000-000000000043', '12345678-1234-1234-1234-123456789012', '2024 Ford Escape', 'CTA-043', '1FMCU9DZ0RUA00043', 'Ford', 'Escape', 2024, 'suv', 'gasoline', 'active', 'FL-CTA-043', 7300, 30.4620, -84.2780, 77.80, '30000000-0000-0000-0000-000000000016', '20000000-0000-0000-0000-000000000006', '{"color":"Red","gps_device":"Geotab-043"}'),
  ('40000000-0000-0000-0000-000000000044', '12345678-1234-1234-1234-123456789012', '2023 Subaru Outback', 'CTA-044', '4S4BTAPC0P3000044', 'Subaru', 'Outback', 2023, 'suv', 'gasoline', 'offline', 'FL-CTA-044', 32100, 30.4383, -84.2807, 0, NULL, '20000000-0000-0000-0000-000000000001', '{"color":"Green","gps_device":"Geotab-044","offline_reason":"GPS device malfunction"}'),
  ('40000000-0000-0000-0000-000000000045', '12345678-1234-1234-1234-123456789012', '2024 Volkswagen ID.4', 'CTA-045', 'WVGDMPE20RP000045', 'Volkswagen', 'ID.4', 2024, 'suv', 'electric', 'active', 'FL-CTA-045', 4500, 30.4500, -84.2850, 88.00, '30000000-0000-0000-0000-000000000015', '20000000-0000-0000-0000-000000000001', '{"color":"White","gps_device":"Geotab-045","battery_capacity":"82 kWh","range_miles":275}'),

  -- More vans/trucks
  ('40000000-0000-0000-0000-000000000046', '12345678-1234-1234-1234-123456789012', '2024 Ford Transit Connect', 'CTA-046', '1FTBR1C87RKA00046', 'Ford', 'Transit Connect', 2024, 'van', 'gasoline', 'active', 'FL-CTA-046', 13500, 30.4350, -84.2550, 60.00, '30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000003', '{"color":"White","gps_device":"Geotab-046"}'),
  ('40000000-0000-0000-0000-000000000047', '12345678-1234-1234-1234-123456789012', '2023 Nissan NV200', 'CTA-047', '3N6CM0KN0PK000047', 'Nissan', 'NV200', 2023, 'van', 'gasoline', 'active', 'FL-CTA-047', 21800, 30.4220, -84.2920, 44.30, '30000000-0000-0000-0000-000000000019', '20000000-0000-0000-0000-000000000004', '{"color":"White","gps_device":"Geotab-047"}'),
  ('40000000-0000-0000-0000-000000000048', '12345678-1234-1234-1234-123456789012', '2024 Isuzu NPR', 'CTA-048', 'JALC4W167R7000048', 'Isuzu', 'NPR-HD', 2024, 'truck', 'diesel', 'active', 'FL-CTA-048', 10200, 30.4580, -84.2500, 55.80, '30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000002', '{"color":"White","gps_device":"Geotab-048","body_type":"Box Truck"}'),
  ('40000000-0000-0000-0000-000000000049', '12345678-1234-1234-1234-123456789012', '2023 Hino L6', 'CTA-049', 'JHBHE1AA0PK000049', 'Hino', 'L6', 2023, 'truck', 'diesel', 'retired', 'FL-CTA-049', 198000, 30.4383, -84.2807, 0, NULL, '20000000-0000-0000-0000-000000000002', '{"color":"White","gps_device":"Geotab-049","retired_reason":"End of service life"}'),
  ('40000000-0000-0000-0000-000000000050', '12345678-1234-1234-1234-123456789012', '2024 Chevrolet Equinox EV', 'CTA-050', '3GNKXKED0RS000050', 'Chevrolet', 'Equinox EV', 2024, 'suv', 'electric', 'active', 'FL-CTA-050', 2100, 30.4460, -84.2730, 92.00, '30000000-0000-0000-0000-000000000010', '20000000-0000-0000-0000-000000000001', '{"color":"Silver","gps_device":"Geotab-050","battery_capacity":"85 kWh","range_miles":319}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. GEOFENCES (Tallahassee area)
-- ============================================================
INSERT INTO geofences (id, tenant_id, name, description, type, center_lat, center_lng, radius, color, is_active, notify_on_entry, notify_on_exit) VALUES
  ('50000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'CTA HQ Zone', 'Main operations center perimeter', 'circle', 30.4383, -84.2807, 500, '#3b82f6', true, true, true),
  ('50000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', 'Maintenance Yard', 'North fleet maintenance facility', 'circle', 30.4583, -84.2780, 300, '#ef4444', true, true, false),
  ('50000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', 'Downtown Tallahassee', 'City center restricted zone', 'circle', 30.4383, -84.2810, 1500, '#f59e0b', true, false, false),
  ('50000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', 'FSU Campus Area', 'Florida State University zone', 'circle', 30.4419, -84.2985, 800, '#8b5cf6', true, true, true),
  ('50000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', 'Airport Zone', 'Tallahassee International Airport', 'circle', 30.3965, -84.3503, 1200, '#06b6d4', true, true, true),
  ('50000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', 'Capital Circle Corridor', 'Major highway corridor', 'circle', 30.4300, -84.2500, 2000, '#10b981', true, false, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. WORK ORDERS
-- ============================================================
INSERT INTO work_orders (id, tenant_id, vehicle_id, number, title, description, type, priority, status, assigned_to_id, scheduled_start_date, scheduled_end_date, actual_start_date, actual_end_date, estimated_cost, actual_cost, notes) VALUES
  ('60000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000008', 'WO-2026-001', 'Brake System Replacement', 'Complete front and rear brake pad and rotor replacement', 'corrective', 'high', 'in_progress', '00000000-0000-0000-0000-000000000005', now() - interval '2 days', now() + interval '1 day', now() - interval '2 days', NULL, 1850.00, NULL, 'Detected during routine inspection. Pads at 10% remaining.'),
  ('60000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000023', 'WO-2026-002', 'New Vehicle Inspection', 'Initial pre-service inspection for new Colorado', 'inspection', 'medium', 'in_progress', '00000000-0000-0000-0000-000000000007', now() - interval '1 day', now() + interval '2 days', now() - interval '1 day', NULL, 250.00, NULL, 'Standard new vehicle intake inspection'),
  ('60000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000038', 'WO-2026-003', 'Hydraulic System Repair', 'Repair hydraulic pump and replace seals on sweeper', 'corrective', 'critical', 'in_progress', '00000000-0000-0000-0000-000000000005', now() - interval '3 days', now(), now() - interval '3 days', NULL, 3200.00, NULL, 'Sweeper losing hydraulic pressure during operation'),
  ('60000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000001', 'WO-2026-004', 'Oil Change & Tire Rotation', 'Scheduled 15K mile service', 'preventive', 'low', 'pending', '00000000-0000-0000-0000-000000000005', now() + interval '5 days', now() + interval '5 days', NULL, NULL, 180.00, NULL, 'Due at 15,000 miles'),
  ('60000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000007', 'WO-2026-005', 'Transmission Service', 'Flush and replace transmission fluid', 'preventive', 'medium', 'pending', '00000000-0000-0000-0000-000000000007', now() + interval '7 days', now() + interval '8 days', NULL, NULL, 450.00, NULL, 'Scheduled 50K maintenance'),
  ('60000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000015', 'WO-2026-006', 'Battery Health Check', 'EV battery diagnostic and calibration', 'inspection', 'medium', 'completed', '00000000-0000-0000-0000-000000000005', now() - interval '10 days', now() - interval '9 days', now() - interval '10 days', now() - interval '9 days', 150.00, 150.00, 'Battery health at 97%. All cells balanced.'),
  ('60000000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000019', 'WO-2026-007', 'Annual DOT Inspection', 'Comprehensive annual safety inspection for bus', 'inspection', 'high', 'pending', '00000000-0000-0000-0000-000000000007', now() + interval '3 days', now() + interval '4 days', NULL, NULL, 500.00, NULL, 'Annual DOT compliance inspection required'),
  ('60000000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000033', 'WO-2026-008', 'Track Tension Adjustment', 'Adjust track tension and inspect undercarriage', 'preventive', 'medium', 'completed', '00000000-0000-0000-0000-000000000005', now() - interval '14 days', now() - interval '13 days', now() - interval '14 days', now() - interval '13 days', 800.00, 720.00, 'Completed under budget. Tracks in good condition.'),
  ('60000000-0000-0000-0000-000000000009', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000044', 'WO-2026-009', 'GPS Device Replacement', 'Replace malfunctioning Geotab GPS tracker', 'corrective', 'high', 'pending', '00000000-0000-0000-0000-000000000007', now() + interval '1 day', now() + interval '1 day', NULL, NULL, 350.00, NULL, 'Vehicle offline due to GPS failure'),
  ('60000000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000006', 'WO-2026-010', 'Recall: Fuel Injector Update', 'Ford recall TSB-2026-0042 for fuel injector software', 'recall', 'high', 'pending', NULL, now() + interval '10 days', now() + interval '10 days', NULL, NULL, 0, NULL, 'Covered under manufacturer warranty'),
  ('60000000-0000-0000-0000-000000000011', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000003', 'WO-2026-011', 'A/C System Recharge', 'Recharge A/C system and check for leaks', 'corrective', 'medium', 'completed', '00000000-0000-0000-0000-000000000005', now() - interval '7 days', now() - interval '6 days', now() - interval '7 days', now() - interval '6 days', 280.00, 310.00, 'Found small leak in condenser. Repaired and recharged.'),
  ('60000000-0000-0000-0000-000000000012', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000016', 'WO-2026-012', 'Charging Port Cleaning', 'Clean and inspect EV charging port contacts', 'preventive', 'low', 'completed', '00000000-0000-0000-0000-000000000007', now() - interval '5 days', now() - interval '5 days', now() - interval '5 days', now() - interval '5 days', 75.00, 75.00, 'Routine EV maintenance. All contacts clean.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. FUEL TRANSACTIONS (last 90 days)
-- ============================================================
INSERT INTO fuel_transactions (id, tenant_id, vehicle_id, driver_id, transaction_date, fuel_type, gallons, cost_per_gallon, total_cost, odometer, location, vendor_name, payment_method, card_last4) VALUES
  ('70000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', now() - interval '3 days', 'gasoline', 18.5, 3.259, 60.29, 12200, 'Shell - 1800 N Monroe St, Tallahassee', 'Shell', 'fleet_card', '4521'),
  ('70000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', now() - interval '2 days', 'diesel', 32.7, 3.849, 125.86, 33800, 'Loves - I-10 & Capital Circle', 'Loves Travel Stop', 'fleet_card', '4521'),
  ('70000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', now() - interval '5 days', 'gasoline', 14.2, 3.199, 45.43, 21000, 'BP - 2200 Apalachee Pkwy, Tallahassee', 'BP', 'fleet_card', '8832'),
  ('70000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000007', now() - interval '1 day', 'diesel', 28.9, 3.799, 109.79, 45200, 'Pilot - 2810 N Monroe St', 'Pilot', 'fleet_card', '4521'),
  ('70000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000012', now() - interval '4 days', 'gasoline', 22.3, 3.299, 73.57, 22100, 'RaceTrac - 3500 Thomasville Rd', 'RaceTrac', 'fleet_card', '8832'),
  ('70000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000009', now() - interval '6 days', 'diesel', 35.1, 3.879, 136.16, 51800, 'CTA Fuel Depot - Capital Circle SE', 'CTA Internal', 'internal', '0000'),
  ('70000000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000019', '30000000-0000-0000-0000-000000000008', now() - interval '7 days', 'diesel', 45.8, 3.829, 175.37, 67200, 'CTA Fuel Depot - Capital Circle SE', 'CTA Internal', 'internal', '0000'),
  ('70000000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', now() - interval '8 days', 'gasoline', 16.8, 3.289, 55.25, 8500, 'Wawa - 1500 S Monroe St', 'Wawa', 'fleet_card', '4521'),
  ('70000000-0000-0000-0000-000000000009', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000026', '30000000-0000-0000-0000-000000000006', now() - interval '3 days', 'gasoline', 24.1, 3.249, 78.30, 15900, 'Shell - 3200 Capital Circle NE', 'Shell', 'fleet_card', '8832'),
  ('70000000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000031', '30000000-0000-0000-0000-000000000003', now() - interval '1 day', 'gasoline', 21.5, 3.279, 70.50, 42100, 'Marathon - 1200 W Tennessee St', 'Marathon', 'fleet_card', '4521'),
  ('70000000-0000-0000-0000-000000000011', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000013', now() - interval '10 days', 'diesel', 26.4, 3.859, 101.88, 30800, 'Loves - I-10 & Capital Circle', 'Loves Travel Stop', 'fleet_card', '4521'),
  ('70000000-0000-0000-0000-000000000012', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000024', '30000000-0000-0000-0000-000000000018', now() - interval '4 days', 'diesel', 30.2, 3.839, 115.94, 38100, 'CTA Fuel Depot - Capital Circle SE', 'CTA Internal', 'internal', '0000'),
  ('70000000-0000-0000-0000-000000000013', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000011', now() - interval '2 days', 'gasoline', 19.8, 3.269, 64.73, 19200, 'RaceTrac - 2100 N Monroe St', 'RaceTrac', 'fleet_card', '8832'),
  ('70000000-0000-0000-0000-000000000014', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000033', '30000000-0000-0000-0000-000000000005', now() - interval '9 days', 'diesel', 52.3, 3.899, 203.92, 2600, 'CTA Fuel Depot - Capital Circle SE', 'CTA Internal', 'internal', '0000'),
  ('70000000-0000-0000-0000-000000000015', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000036', '30000000-0000-0000-0000-000000000007', now() - interval '5 days', 'diesel', 38.7, 3.869, 149.73, 18300, 'Pilot - 2810 N Monroe St', 'Pilot', 'fleet_card', '4521'),
  -- Older transactions
  ('70000000-0000-0000-0000-000000000016', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', now() - interval '18 days', 'gasoline', 17.2, 3.219, 55.37, 11800, 'Wawa - 1500 S Monroe St', 'Wawa', 'fleet_card', '4521'),
  ('70000000-0000-0000-0000-000000000017', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', now() - interval '22 days', 'gasoline', 15.9, 3.179, 50.55, 8100, 'Shell - 1800 N Monroe St', 'Shell', 'fleet_card', '8832'),
  ('70000000-0000-0000-0000-000000000018', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', now() - interval '16 days', 'diesel', 31.5, 3.819, 120.30, 33200, 'CTA Fuel Depot - Capital Circle SE', 'CTA Internal', 'internal', '0000'),
  ('70000000-0000-0000-0000-000000000019', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000048', '30000000-0000-0000-0000-000000000013', now() - interval '11 days', 'diesel', 22.8, 3.849, 87.76, 9800, 'Pilot - 2810 N Monroe St', 'Pilot', 'fleet_card', '4521'),
  ('70000000-0000-0000-0000-000000000020', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000014', now() - interval '6 days', 'gasoline', 20.1, 3.309, 66.51, 41200, 'Marathon - 3800 W Pensacola St', 'Marathon', 'fleet_card', '8832')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. ROUTES
-- ============================================================
INSERT INTO routes (id, tenant_id, name, number, type, status, assigned_vehicle_id, assigned_driver_id, start_facility_id, end_facility_id, scheduled_start_time, scheduled_end_time, estimated_distance, estimated_duration) VALUES
  ('80000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'Downtown-Capitol Loop', 'RT-001', 'delivery', 'in_progress', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', now(), now() + interval '4 hours', 28.5, 180),
  ('80000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', 'North Monroe Corridor', 'RT-002', 'pickup', 'in_progress', '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000006', now() - interval '1 hour', now() + interval '3 hours', 15.2, 120),
  ('80000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', 'Capital Circle Express', 'RT-003', 'delivery', 'pending', '40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000004', now() + interval '2 hours', now() + interval '6 hours', 42.8, 240),
  ('80000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', 'Airport Shuttle Run', 'RT-004', 'shuttle', 'in_progress', '40000000-0000-0000-0000-000000000020', '30000000-0000-0000-0000-000000000020', '20000000-0000-0000-0000-000000000001', NULL, now() - interval '30 minutes', now() + interval '2 hours', 18.3, 90),
  ('80000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', 'East Side Equipment Transport', 'RT-005', 'delivery', 'completed', '40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000009', '20000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000002', now() - interval '6 hours', now() - interval '2 hours', 22.1, 150),
  ('80000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', 'Thomasville Rd Supply Run', 'RT-006', 'pickup', 'pending', '40000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000012', '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000006', now() + interval '4 hours', now() + interval '7 hours', 12.5, 90),
  ('80000000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', 'Weekly Fuel Depot Circuit', 'RT-007', 'delivery', 'pending', '40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', now() + interval '1 day', now() + interval '1 day 4 hours', 35.0, 210),
  ('80000000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', 'Construction Site Delivery', 'RT-008', 'delivery', 'in_progress', '40000000-0000-0000-0000-000000000035', '30000000-0000-0000-0000-000000000013', '20000000-0000-0000-0000-000000000005', NULL, now() - interval '2 hours', now() + interval '3 hours', 8.7, 60)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. DISPATCHES
-- ============================================================
INSERT INTO dispatches (id, tenant_id, route_id, vehicle_id, driver_id, dispatcher_id, type, priority, status, origin, destination, origin_lat, origin_lng, destination_lat, destination_lng, dispatched_at, notes) VALUES
  ('90000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', '80000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'delivery', 'medium', 'in_progress', 'CTA Main Operations Center', 'South Dispatch Hub', 30.4383, -84.2807, 30.4183, -84.2770, now() - interval '30 minutes', 'Regular delivery run'),
  ('90000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', '80000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000020', '30000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000004', 'shuttle', 'high', 'in_progress', 'CTA Main Operations Center', 'Tallahassee International Airport', 30.4383, -84.2807, 30.3965, -84.3503, now() - interval '30 minutes', 'VIP airport shuttle'),
  ('90000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', NULL, '40000000-0000-0000-0000-000000000031', '30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 'emergency', 'critical', 'in_progress', 'CTA Main Operations Center', 'Downtown Tallahassee', 30.4383, -84.2807, 30.4380, -84.2810, now() - interval '15 minutes', 'Emergency response - traffic incident'),
  ('90000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', '80000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000004', 'delivery', 'medium', 'pending', 'North Fleet Maintenance Yard', 'Capital Circle Fuel Depot', 30.4583, -84.2780, 30.4250, -84.2500, now() + interval '2 hours', 'Equipment delivery scheduled for afternoon'),
  ('90000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', '80000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004', 'delivery', 'low', 'completed', 'East Side Vehicle Storage', 'North Fleet Maintenance Yard', 30.4400, -84.2300, 30.4583, -84.2780, now() - interval '6 hours', 'Equipment transfer completed')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 11. DISPATCH CHANNELS
-- ============================================================
INSERT INTO dispatch_channels (id, name, description, channel_type, channel_id, is_active, priority_level, color_code, frequency, status, is_encrypted) VALUES
  (gen_random_uuid(), 'Operations Primary', 'Main operations dispatch channel', 'operations', 'OPS-1', true, 1, '#3b82f6', '462.5625 MHz', 'active', false),
  (gen_random_uuid(), 'Maintenance', 'Fleet maintenance coordination', 'maintenance', 'MNT-1', true, 3, '#ef4444', '462.5875 MHz', 'active', false),
  (gen_random_uuid(), 'Emergency', 'Emergency response channel', 'emergency', 'EMR-1', true, 1, '#dc2626', '462.6125 MHz', 'active', true),
  (gen_random_uuid(), 'Logistics', 'Supply chain and logistics coordination', 'logistics', 'LOG-1', true, 5, '#10b981', '462.6375 MHz', 'active', false),
  (gen_random_uuid(), 'Admin', 'Administrative communications', 'general', 'ADM-1', true, 7, '#8b5cf6', '462.6625 MHz', 'active', false),
  (gen_random_uuid(), 'Heavy Equipment', 'Construction and heavy equipment ops', 'operations', 'HVY-1', true, 4, '#f59e0b', '462.6875 MHz', 'active', false)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 12. INCIDENTS
-- ============================================================
INSERT INTO incidents (id, tenant_id, number, vehicle_id, driver_id, type, severity, status, incident_date, location, latitude, longitude, description, injuries_reported, fatalities_reported, estimated_cost) VALUES
  ('A0000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'INC-2026-001', '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'collision', 'minor', 'completed', now() - interval '45 days', '1200 W Tennessee St, Tallahassee FL', 30.4410, -84.2950, 'Minor fender bender in parking lot. No injuries. Other party at fault.', false, false, 2500.00),
  ('A0000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', 'INC-2026-002', '40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000007', 'mechanical_failure', 'moderate', 'in_progress', now() - interval '12 days', 'Capital Circle SE at Apalachee Pkwy', 30.4250, -84.2500, 'Brake fade incident on downhill grade. Driver safely pulled over. Vehicle towed.', false, false, 4800.00),
  ('A0000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', 'INC-2026-003', '40000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000011', 'property_damage', 'minor', 'completed', now() - interval '30 days', 'CTA Main Operations Center', 30.4383, -84.2807, 'Backed into loading dock post. Minor tailgate damage.', false, false, 1200.00),
  ('A0000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', 'INC-2026-004', NULL, '30000000-0000-0000-0000-000000000016', 'policy_violation', 'moderate', 'in_progress', now() - interval '8 days', 'N Monroe St at I-10 Ramp', 30.4600, -84.2800, 'Speed camera captured driver exceeding limit by 22mph. Driver suspended pending review.', false, false, 0),
  ('A0000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', 'INC-2026-005', '40000000-0000-0000-0000-000000000032', '30000000-0000-0000-0000-000000000009', 'near_miss', 'minor', 'completed', now() - interval '20 days', 'Thomasville Rd at 7th Ave', 30.4550, -84.2680, 'Near-miss with pedestrian at crosswalk. Dashcam reviewed. Driver counseled.', false, false, 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 13. TASKS
-- ============================================================
INSERT INTO tasks (id, tenant_id, title, description, type, priority, status, assigned_to_id, created_by_id, due_date) VALUES
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Complete DOT annual inspection - Bus CTA-019', 'Schedule and complete DOT annual safety inspection for Blue Bird Vision bus', 'inspection', 'high', 'pending', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', now() + interval '7 days'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Review Q1 fuel efficiency report', 'Analyze fleet-wide fuel consumption data and prepare quarterly report', 'report', 'medium', 'in_progress', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', now() + interval '5 days'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'EV charging station expansion proposal', 'Prepare proposal for 4 additional Level 2 chargers at HQ', 'planning', 'medium', 'pending', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', now() + interval '14 days'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Driver safety training - March session', 'Organize monthly driver safety refresher course', 'training', 'high', 'pending', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', now() + interval '10 days'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'GPS tracker replacement for CTA-044', 'Order and install new Geotab tracker for offline Subaru Outback', 'maintenance', 'high', 'in_progress', '00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000005', now() + interval '2 days'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Update fleet insurance policies', 'Annual insurance renewal for 50 vehicles - deadline approaching', 'administrative', 'critical', 'pending', '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', now() + interval '21 days'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Investigate incident INC-2026-002', 'Complete root cause analysis for brake fade incident on Silverado', 'investigation', 'high', 'in_progress', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000006', now() + interval '3 days'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'New hire driver orientation - Nancy Allen', 'Complete onboarding checklist and assign training vehicle', 'onboarding', 'medium', 'in_progress', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', now() + interval '7 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 14. MAINTENANCE SCHEDULES
-- ============================================================
INSERT INTO maintenance_schedules (id, tenant_id, vehicle_id, type, name, description, next_service_date, last_service_date, last_service_mileage, estimated_cost, is_active) VALUES
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000001', 'preventive', 'Oil Change', '15K mile oil change and filter', now() + interval '30 days', now() - interval '60 days', 9500, 85.00, true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000001', 'preventive', 'Tire Rotation', 'Rotate tires every 7,500 miles', now() + interval '45 days', now() - interval '30 days', 10000, 50.00, true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000006', 'preventive', 'Diesel Service', 'DEF fluid and fuel filter replacement', now() + interval '15 days', now() - interval '45 days', 30000, 220.00, true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000015', 'inspection', 'EV Battery Check', 'Quarterly EV battery health and range assessment', now() + interval '60 days', now() - interval '30 days', 4500, 150.00, true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000019', 'inspection', 'DOT Annual Inspection', 'Federal DOT annual safety inspection for bus', now() + interval '7 days', now() - interval '358 days', 55000, 500.00, true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000033', 'preventive', 'Track Maintenance', 'Track tension and undercarriage inspection', now() + interval '90 days', now() - interval '14 days', 2600, 800.00, true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000007', 'preventive', 'Transmission Service', '50K mile transmission fluid replacement', now() + interval '7 days', now() - interval '180 days', 25000, 450.00, true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000003', 'preventive', 'Brake Inspection', 'Routine brake pad and rotor inspection', now() + interval '20 days', now() - interval '90 days', 18000, 120.00, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 15. CHARGING STATIONS
-- ============================================================
INSERT INTO charging_stations (id, tenant_id, name, type, latitude, longitude, address, number_of_ports, available_ports, max_power_kw, cost_per_kwh, status, manufacturer, metadata) VALUES
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'HQ Charger Bay 1', 'DC Fast', 30.4383, -84.2807, '315 S Calhoun St - Bay 1', 2, 2, 150.00, 0.28, 'active', 'ChargePoint', '{"model":"Express 250","connector":"CCS"}'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'HQ Charger Bay 2', 'DC Fast', 30.4384, -84.2808, '315 S Calhoun St - Bay 2', 2, 1, 150.00, 0.28, 'active', 'ChargePoint', '{"model":"Express 250","connector":"CCS","current_vehicle":"CTA-016"}'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'HQ Level 2 - Slot A', 'Level 2', 30.4382, -84.2806, '315 S Calhoun St - Parking A', 1, 1, 19.20, 0.15, 'active', 'JuiceBox', '{"model":"Pro 48","connector":"J1772"}'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'HQ Level 2 - Slot B', 'Level 2', 30.4382, -84.2805, '315 S Calhoun St - Parking B', 1, 1, 19.20, 0.15, 'active', 'JuiceBox', '{"model":"Pro 48","connector":"J1772"}'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Satellite Office Charger', 'Level 2', 30.4700, -84.2650, '1800 Thomasville Rd', 1, 1, 19.20, 0.15, 'active', 'ClipperCreek', '{"model":"HCS-60","connector":"J1772"}'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Maintenance Yard DC Fast', 'DC Fast', 30.4583, -84.2780, '1400 N Monroe St', 2, 0, 350.00, 0.32, 'maintenance', 'ABB', '{"model":"Terra 360","connector":"CCS","maintenance_note":"Firmware update in progress"}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 16. COMPLIANCE REQUIREMENTS + RECORDS
-- ============================================================
INSERT INTO compliance_requirements (id, tenant_id, requirement_code, requirement_name, regulatory_body, category, description, frequency, applies_to, is_active) VALUES
  ('C0000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'DOT-ANNUAL', 'DOT Annual Safety Inspection', 'FMCSA', 'safety', 'Annual Department of Transportation safety inspection', 'annual', 'vehicle', true),
  ('C0000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', 'EMISSIONS-FL', 'Florida Emissions Testing', 'FL DEP', 'environmental', 'Annual vehicle emissions compliance testing', 'annual', 'vehicle', true),
  ('C0000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', 'CDL-RENEWAL', 'CDL License Renewal', 'FMCSA', 'licensing', 'Commercial driver license renewal requirement', 'as_needed', 'driver', true),
  ('C0000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', 'DRUG-TEST', 'Drug & Alcohol Testing', 'FMCSA', 'safety', 'Required pre-employment and random drug/alcohol screening', 'random', 'driver', true),
  ('C0000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', 'VEH-REG', 'Vehicle Registration', 'FL DMV', 'licensing', 'Annual state vehicle registration', 'annual', 'vehicle', true),
  ('C0000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', 'OSHA-EQUIP', 'OSHA Equipment Inspection', 'OSHA', 'safety', 'OSHA heavy equipment safety inspection', 'annual', 'vehicle', true),
  ('C0000000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', 'MED-CERT', 'DOT Medical Certificate', 'FMCSA', 'medical', 'DOT physical and medical certificate requirement', 'biennial', 'driver', true),
  ('C0000000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', 'SAFETY-TRAIN', 'Safety Training', 'OSHA', 'training', 'Annual safety refresher training', 'annual', 'driver', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO compliance_records (id, tenant_id, requirement_id, vehicle_id, driver_id, due_date, completion_date, status, notes) VALUES
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'C0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000019', NULL, (now() + interval '7 days')::date, NULL, 'pending', 'Annual DOT inspection for bus - scheduled with state inspector'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'C0000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', NULL, (now() + interval '180 days')::date, (now() - interval '180 days')::date, 'compliant', 'Passed emissions test'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'C0000000-0000-0000-0000-000000000003', NULL, '30000000-0000-0000-0000-000000000001', (now() + interval '18 months')::date, NULL, 'compliant', 'CDL Class A valid'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'C0000000-0000-0000-0000-000000000008', NULL, '30000000-0000-0000-0000-000000000018', (now() + interval '14 days')::date, NULL, 'pending', 'New driver defensive driving course - onboarding'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'C0000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000006', NULL, (now() + interval '120 days')::date, (now() - interval '245 days')::date, 'compliant', 'Registration renewed for 2026'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'C0000000-0000-0000-0000-000000000004', NULL, '30000000-0000-0000-0000-000000000016', (now() + interval '3 days')::date, NULL, 'pending', 'Post-incident drug screening required'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'C0000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000033', NULL, (now() + interval '90 days')::date, (now() - interval '275 days')::date, 'compliant', 'All safety guards and systems operational'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'C0000000-0000-0000-0000-000000000007', NULL, '30000000-0000-0000-0000-000000000005', (now() + interval '30 days')::date, NULL, 'expiring_soon', 'Medical cert appointment scheduled')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 17. PARTS INVENTORY
-- ============================================================
INSERT INTO parts_inventory (id, tenant_id, part_number, name, description, category, manufacturer, quantity_on_hand, reorder_point, reorder_quantity, unit_cost, location_in_warehouse, facility_id, is_active) VALUES
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'BRK-PAD-001', 'Brake Pads - Heavy Duty', 'Ceramic brake pads for trucks and SUVs', 'brakes', 'NAPA', 24, 10, 20, 45.99, 'Shelf A1', '20000000-0000-0000-0000-000000000002', true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'OIL-5W30-001', 'Motor Oil 5W-30 (5Qt)', 'Full synthetic motor oil', 'fluids', 'Mobil 1', 48, 20, 40, 28.99, 'Shelf B2', '20000000-0000-0000-0000-000000000002', true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'FLT-OIL-001', 'Oil Filter - Universal', 'Fits Ford/Chevy/Toyota sedans and SUVs', 'filters', 'WIX', 36, 15, 30, 8.99, 'Shelf B1', '20000000-0000-0000-0000-000000000002', true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'FLT-AIR-001', 'Air Filter - Standard', 'Engine air filter for gasoline vehicles', 'filters', 'K&N', 20, 10, 20, 14.99, 'Shelf B1', '20000000-0000-0000-0000-000000000002', true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'TIR-ALL-001', 'All-Season Tire 245/65R17', 'All-season tire for SUVs', 'tires', 'Michelin', 12, 8, 16, 189.99, 'Tire Rack', '20000000-0000-0000-0000-000000000002', true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'BAT-STD-001', 'Battery - Group 65', '12V automotive battery - 750 CCA', 'electrical', 'Interstate', 8, 4, 8, 149.99, 'Shelf C1', '20000000-0000-0000-0000-000000000002', true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'WPR-BLD-001', 'Wiper Blades 24"', 'All-weather wiper blades', 'exterior', 'Bosch', 30, 15, 30, 12.99, 'Shelf A3', '20000000-0000-0000-0000-000000000002', true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'DEF-FLD-001', 'DEF Fluid (2.5 Gal)', 'Diesel exhaust fluid for emissions systems', 'fluids', 'BlueDEF', 16, 8, 16, 18.99, 'Shelf B3', '20000000-0000-0000-0000-000000000002', true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'HYD-FLD-001', 'Hydraulic Fluid (1 Gal)', 'AW 46 hydraulic fluid for heavy equipment', 'fluids', 'Shell Tellus', 10, 6, 12, 32.99, 'Shelf B4', '20000000-0000-0000-0000-000000000002', true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'GPS-TRK-001', 'Geotab GO9 GPS Tracker', 'GPS/OBD2 vehicle tracking device', 'telematics', 'Geotab', 5, 3, 6, 189.00, 'Cabinet D1', '20000000-0000-0000-0000-000000000001', true)
ON CONFLICT (id) DO NOTHING;

-- NOTE: Documents table skipped due to trigger incompatibility with search_vector

COMMIT;
