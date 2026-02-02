-- ============================================
-- STAGING ENVIRONMENT SEED DATA
-- Fleet Management System
-- Generated: 2025-11-12
-- ============================================

-- Clean existing data (in reverse order of dependencies)
TRUNCATE TABLE
  geofence_events,
  policy_violations,
  notifications,
  communication_logs,
  purchase_orders,
  charging_sessions,
  charging_stations,
  video_events,
  safety_incidents,
  damage_reports,
  inspections,
  inspection_forms,
  telemetry_data,
  fuel_transactions,
  maintenance_schedules,
  work_orders,
  routes,
  geofences,
  vendors,
  facilities,
  vehicles,
  drivers,
  policies,
  users,
  tenants
CASCADE;

-- ============================================
-- 1. TENANT
-- ============================================
INSERT INTO tenants (name, domain, settings, is_active, created_at, updated_at)
VALUES (
  'Capital Tech Alliance',
  'cta-staging.fleetmanagement.com',
  '{"max_vehicles": 100, "max_drivers": 50, "features": ["gps", "maintenance", "fuel", "safety", "video_telematics"]}'::jsonb,
  true,
  NOW() - INTERVAL '180 days',
  NOW()
) RETURNING id AS tenant_id
\gset

-- ============================================
-- 2. USERS & ROLES
-- ============================================

-- Admin Users
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, mfa_enabled, last_login_at, created_at)
VALUES
  (:tenant_id, 'admin@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'System', 'Administrator', '850-555-0100', 'admin', true, true, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '180 days'),
  (:tenant_id, 'fleet.manager@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Sarah', 'Williams', '850-555-0101', 'fleet_manager', true, true, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '150 days');

-- Technicians
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, last_login_at, created_at)
VALUES
  (:tenant_id, 'tech1@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Marcus', 'Johnson', '850-555-0200', 'technician', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '120 days'),
  (:tenant_id, 'tech2@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Elena', 'Rodriguez', '850-555-0201', 'technician', true, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '90 days');

-- Driver Users (20 drivers)
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, last_login_at, created_at)
VALUES
  (:tenant_id, 'john.smith@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'John', 'Smith', '850-555-1001', 'driver', true, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '365 days'),
  (:tenant_id, 'jane.doe@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Jane', 'Doe', '850-555-1002', 'driver', true, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '330 days'),
  (:tenant_id, 'mike.wilson@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Michael', 'Wilson', '850-555-1003', 'driver', true, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '300 days'),
  (:tenant_id, 'sarah.johnson@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Sarah', 'Johnson', '850-555-1004', 'driver', true, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '280 days'),
  (:tenant_id, 'david.brown@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'David', 'Brown', '850-555-1005', 'driver', true, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '250 days'),
  (:tenant_id, 'maria.garcia@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Maria', 'Garcia', '850-555-1006', 'driver', true, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '240 days'),
  (:tenant_id, 'robert.miller@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Robert', 'Miller', '850-555-1007', 'driver', true, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '220 days'),
  (:tenant_id, 'jennifer.davis@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Jennifer', 'Davis', '850-555-1008', 'driver', true, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '200 days'),
  (:tenant_id, 'william.martinez@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'William', 'Martinez', '850-555-1009', 'driver', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '190 days'),
  (:tenant_id, 'patricia.anderson@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Patricia', 'Anderson', '850-555-1010', 'driver', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '180 days'),
  (:tenant_id, 'james.taylor@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'James', 'Taylor', '850-555-1011', 'driver', true, NOW() - INTERVAL '10 hours', NOW() - INTERVAL '170 days'),
  (:tenant_id, 'linda.thomas@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Linda', 'Thomas', '850-555-1012', 'driver', true, NOW() - INTERVAL '15 hours', NOW() - INTERVAL '160 days'),
  (:tenant_id, 'charles.jackson@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Charles', 'Jackson', '850-555-1013', 'driver', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '150 days'),
  (:tenant_id, 'barbara.white@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Barbara', 'White', '850-555-1014', 'driver', true, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '140 days'),
  (:tenant_id, 'joseph.harris@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Joseph', 'Harris', '850-555-1015', 'driver', true, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '130 days'),
  (:tenant_id, 'susan.martin@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Susan', 'Martin', '850-555-1016', 'driver', true, NOW() - INTERVAL '7 hours', NOW() - INTERVAL '120 days'),
  (:tenant_id, 'thomas.thompson@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Thomas', 'Thompson', '850-555-1017', 'driver', true, NOW() - INTERVAL '9 hours', NOW() - INTERVAL '110 days'),
  (:tenant_id, 'karen.moore@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Karen', 'Moore', '850-555-1018', 'driver', true, NOW() - INTERVAL '11 hours', NOW() - INTERVAL '100 days'),
  (:tenant_id, 'daniel.lee@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Daniel', 'Lee', '850-555-1019', 'driver', true, NOW() - INTERVAL '13 hours', NOW() - INTERVAL '90 days'),
  (:tenant_id, 'nancy.walker@cta-staging.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Nancy', 'Walker', '850-555-1020', 'driver', true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '80 days');

-- ============================================
-- 3. DRIVERS (Extended profiles for driver users)
-- ============================================
INSERT INTO drivers (tenant_id, user_id, license_number, license_state, license_expiration, cdl_class, cdl_endorsements, medical_card_expiration, hire_date, status, safety_score, emergency_contact_name, emergency_contact_phone)
SELECT
  :tenant_id,
  id,
  'FL' || LPAD((100000 + ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 8, '0'),
  'FL',
  CURRENT_DATE + INTERVAL '2 years' + (RANDOM() * INTERVAL '365 days'),
  CASE
    WHEN ROW_NUMBER() OVER (ORDER BY created_at) % 4 = 0 THEN 'A'
    WHEN ROW_NUMBER() OVER (ORDER BY created_at) % 4 = 1 THEN 'B'
    ELSE 'C'
  END,
  ARRAY['H', 'N']::VARCHAR[],
  CURRENT_DATE + INTERVAL '1 year' + (RANDOM() * INTERVAL '180 days'),
  created_at::DATE,
  'active',
  85.0 + (RANDOM() * 15.0),
  'Emergency Contact ' || first_name,
  '850-555-' || LPAD((2000 + ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 4, '0')
FROM users
WHERE tenant_id = :tenant_id AND role = 'driver';

-- ============================================
-- 4. FACILITIES
-- ============================================
INSERT INTO facilities (tenant_id, name, facility_type, address, city, state, zip_code, latitude, longitude, location, phone, capacity, service_bays, is_active, notes)
VALUES
  (:tenant_id, 'Main Depot - Tallahassee', 'depot', '1500 Capital Circle SE', 'Tallahassee', 'FL', '32301', 30.4383, -84.2807, ST_SetSRID(ST_MakePoint(-84.2807, 30.4383), 4326), '850-555-3000', 50, 0, true, 'Primary vehicle storage and dispatch location'),
  (:tenant_id, 'North Service Center', 'service_center', '2200 North Monroe St', 'Tallahassee', 'FL', '32303', 30.4697, -84.2831, ST_SetSRID(ST_MakePoint(-84.2831, 30.4697), 4326), '850-555-3001', 20, 8, true, 'Full maintenance facility with 8 service bays'),
  (:tenant_id, 'South Garage', 'garage', '800 Woodville Hwy', 'Tallahassee', 'FL', '32304', 30.4133, -84.2696, ST_SetSRID(ST_MakePoint(-84.2696, 30.4133), 4326), '850-555-3002', 30, 4, true, 'Backup facility with limited maintenance'),
  (:tenant_id, 'East Staging Area', 'depot', '4500 Mahan Drive', 'Tallahassee', 'FL', '32308', 30.4515, -84.2234, ST_SetSRID(ST_MakePoint(-84.2234, 30.4515), 4326), '850-555-3003', 25, 2, true, 'Temporary staging for special projects');

-- ============================================
-- 5. VEHICLES (30 vehicles - mix of types)
-- ============================================
WITH vehicle_data AS (
  SELECT
    n,
    CASE (n % 6)
      WHEN 0 THEN 'Ford'
      WHEN 1 THEN 'Chevrolet'
      WHEN 2 THEN 'RAM'
      WHEN 3 THEN 'Toyota'
      WHEN 4 THEN 'Tesla'
      ELSE 'Nissan'
    END as make,
    CASE (n % 6)
      WHEN 0 THEN 'F-150'
      WHEN 1 THEN 'Silverado 1500'
      WHEN 2 THEN 'RAM 1500'
      WHEN 3 THEN 'Tundra'
      WHEN 4 THEN 'Model 3'
      ELSE 'Titan XD'
    END as model,
    CASE (n % 6)
      WHEN 0 THEN 'Pickup Truck'
      WHEN 1 THEN 'Pickup Truck'
      WHEN 2 THEN 'Pickup Truck'
      WHEN 3 THEN 'Pickup Truck'
      WHEN 4 THEN 'Sedan'
      ELSE 'Pickup Truck'
    END as vehicle_type,
    CASE (n % 6)
      WHEN 4 THEN 'Electric'
      WHEN 5 THEN 'Diesel'
      ELSE 'Gasoline'
    END as fuel_type,
    2020 + (n % 5) as year,
    CASE (n % 10)
      WHEN 0 THEN 'maintenance'
      WHEN 1 THEN 'out_of_service'
      ELSE 'active'
    END as status,
    15000 + (n * 3000 + RANDOM() * 5000) as odometer,
    RANDOM() * 500 + 100 as engine_hours
  FROM generate_series(1, 30) n
)
INSERT INTO vehicles (
  tenant_id, vin, make, model, year, license_plate, vehicle_type, fuel_type,
  status, odometer, engine_hours, purchase_date, purchase_price, current_value,
  gps_device_id, last_gps_update, latitude, longitude, location, speed, heading,
  assigned_driver_id, assigned_facility_id, photos, notes, created_at
)
SELECT
  :tenant_id,
  '1FT' || UPPER(MD5(RANDOM()::TEXT))::VARCHAR(14),
  vd.make,
  vd.model,
  vd.year,
  'FL-CTA-' || LPAD(n::TEXT, 4, '0'),
  vd.vehicle_type,
  vd.fuel_type,
  vd.status,
  vd.odometer,
  vd.engine_hours,
  CURRENT_DATE - INTERVAL '3 years' + (RANDOM() * INTERVAL '700 days'),
  35000 + (RANDOM() * 25000),
  25000 + (RANDOM() * 20000),
  'GPS-' || LPAD(n::TEXT, 6, '0'),
  NOW() - (RANDOM() * INTERVAL '6 hours'),
  30.4383 + (RANDOM() * 0.1 - 0.05), -- Around Tallahassee
  -84.2807 + (RANDOM() * 0.1 - 0.05),
  ST_SetSRID(ST_MakePoint(-84.2807 + (RANDOM() * 0.1 - 0.05), 30.4383 + (RANDOM() * 0.1 - 0.05)), 4326),
  CASE WHEN vd.status = 'active' THEN RANDOM() * 60 ELSE 0 END,
  RANDOM() * 360,
  (SELECT id FROM drivers WHERE tenant_id = :tenant_id ORDER BY RANDOM() LIMIT 1),
  (SELECT id FROM facilities WHERE tenant_id = :tenant_id ORDER BY RANDOM() LIMIT 1),
  ARRAY[
    'https://images.fleet.cta/vehicles/unit-' || n || '-front.jpg',
    'https://images.fleet.cta/vehicles/unit-' || n || '-side.jpg'
  ],
  'Unit ' || n || ' - ' || vd.make || ' ' || vd.model,
  NOW() - INTERVAL '90 days' + (RANDOM() * INTERVAL '60 days')
FROM vehicle_data vd;

-- ============================================
-- 6. VENDORS
-- ============================================
INSERT INTO vendors (tenant_id, vendor_name, vendor_type, contact_name, contact_email, contact_phone, address, city, state, zip_code, is_active, notes)
VALUES
  (:tenant_id, 'AutoZone Commercial', 'parts_supplier', 'Mike Patterson', 'mike.p@autozone.com', '850-555-4001', '2500 Apalachee Pkwy', 'Tallahassee', 'FL', '32301', true, 'Primary parts supplier - 15% fleet discount'),
  (:tenant_id, 'Jiffy Lube Fleet Services', 'service_provider', 'Sarah Chen', 'sarah@jiffylube.com', '850-555-4002', '1800 W Tennessee St', 'Tallahassee', 'FL', '32304', true, 'Oil changes and basic maintenance'),
  (:tenant_id, 'Tire Kingdom Fleet', 'service_provider', 'Robert Wilson', 'rwilson@tirekingdom.com', '850-555-4003', '3200 N Monroe St', 'Tallahassee', 'FL', '32303', true, 'Tire services and alignment'),
  (:tenant_id, 'Shell Fleet Fuel Network', 'fuel_provider', 'Jennifer Hayes', 'j.hayes@shell.com', '850-555-4004', '1500 Capital Circle NE', 'Tallahassee', 'FL', '32308', true, 'Primary fuel card provider'),
  (:tenant_id, 'O''Reilly Auto Parts', 'parts_supplier', 'David Martinez', 'dmartinez@oreillyauto.com', '850-555-4005', '2800 Thomasville Rd', 'Tallahassee', 'FL', '32308', true, 'Secondary parts supplier'),
  (:tenant_id, 'Brake Masters', 'service_provider', 'Lisa Thompson', 'lthompson@brakemasters.com', '850-555-4006', '4100 W Tennessee St', 'Tallahassee', 'FL', '32304', true, 'Brake and suspension specialists'),
  (:tenant_id, 'NAPA Auto Parts Fleet Division', 'parts_supplier', 'Tom Anderson', 'tanderson@napaonline.com', '850-555-4007', '1200 S Adams St', 'Tallahassee', 'FL', '32301', true, 'Heavy-duty parts and fleet supplies'),
  (:tenant_id, 'Sunoco Fleet Fueling', 'fuel_provider', 'Maria Garcia', 'mgarcia@sunoco.com', '850-555-4008', '5500 Mahan Drive', 'Tallahassee', 'FL', '32308', true, 'Backup fuel provider'),
  (:tenant_id, 'Tesla Service Center', 'service_provider', 'Kevin Zhang', 'kzhang@tesla.com', '850-555-4009', '3800 Capital Circle NW', 'Tallahassee', 'FL', '32303', true, 'EV maintenance and charging'),
  (:tenant_id, 'Mobile Fleet Diagnostics', 'service_provider', 'Patricia Moore', 'pmoore@mobilefleet.com', '850-555-4010', '900 Railroad Ave', 'Tallahassee', 'FL', '32310', true, 'On-site diagnostic services');

-- ============================================
-- 7. WORK ORDERS (50 work orders - various statuses)
-- ============================================
WITH wo_data AS (
  SELECT
    n,
    (SELECT id FROM vehicles WHERE tenant_id = :tenant_id ORDER BY RANDOM() LIMIT 1) as vehicle_id,
    (SELECT id FROM facilities WHERE tenant_id = :tenant_id AND service_bays > 0 ORDER BY RANDOM() LIMIT 1) as facility_id,
    (SELECT id FROM users WHERE tenant_id = :tenant_id AND role = 'technician' ORDER BY RANDOM() LIMIT 1) as tech_id,
    CASE (n % 4)
      WHEN 0 THEN 'preventive'
      WHEN 1 THEN 'corrective'
      WHEN 2 THEN 'inspection'
      ELSE 'corrective'
    END as wo_type,
    CASE (n % 5)
      WHEN 0 THEN 'low'
      WHEN 1 THEN 'medium'
      WHEN 2 THEN 'high'
      WHEN 3 THEN 'critical'
      ELSE 'medium'
    END as priority,
    CASE (n % 6)
      WHEN 0 THEN 'open'
      WHEN 1 THEN 'in_progress'
      WHEN 2 THEN 'completed'
      WHEN 3 THEN 'completed'
      WHEN 4 THEN 'on_hold'
      ELSE 'completed'
    END as wo_status
  FROM generate_series(1, 50) n
)
INSERT INTO work_orders (
  tenant_id, work_order_number, vehicle_id, facility_id, assigned_technician_id,
  type, priority, status, description, odometer_reading, engine_hours_reading,
  scheduled_start, scheduled_end, actual_start, actual_end,
  labor_hours, labor_cost, parts_cost, notes, created_by, created_at
)
SELECT
  :tenant_id,
  'WO-STG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(n::TEXT, 5, '0'),
  wd.vehicle_id,
  wd.facility_id,
  wd.tech_id,
  wd.wo_type,
  wd.priority,
  wd.wo_status,
  CASE wd.wo_type
    WHEN 'preventive' THEN ARRAY['Oil change and filter replacement', 'Tire rotation and balance', '30k mile service', 'Brake inspection and fluid flush', 'Transmission service'][1 + floor(random() * 5)::int]
    WHEN 'corrective' THEN ARRAY['Replace worn brake pads', 'Fix coolant leak', 'Replace battery', 'Repair AC system', 'Replace serpentine belt', 'Fix check engine light'][1 + floor(random() * 6)::int]
    WHEN 'inspection' THEN ARRAY['DOT annual inspection', 'Pre-trip safety inspection', 'Emissions testing', 'Fleet compliance check'][1 + floor(random() * 4)::int]
  END,
  (SELECT odometer FROM vehicles WHERE id = wd.vehicle_id),
  (SELECT engine_hours FROM vehicles WHERE id = wd.vehicle_id),
  CURRENT_DATE - (50 - n) + (RANDOM() * INTERVAL '10 days'),
  CURRENT_DATE - (50 - n) + INTERVAL '1 day' + (RANDOM() * INTERVAL '10 days'),
  CASE WHEN wd.wo_status IN ('in_progress', 'completed') THEN CURRENT_TIMESTAMP - ((50 - n) * INTERVAL '1 day') ELSE NULL END,
  CASE WHEN wd.wo_status = 'completed' THEN CURRENT_TIMESTAMP - ((48 - n) * INTERVAL '1 day') ELSE NULL END,
  CASE WHEN wd.wo_status = 'completed' THEN 2.0 + (RANDOM() * 6.0) ELSE 0 END,
  CASE WHEN wd.wo_status = 'completed' THEN (2.0 + RANDOM() * 6.0) * 85.0 ELSE 0 END,
  CASE WHEN wd.wo_status = 'completed' THEN RANDOM() * 500 ELSE 0 END,
  'Work order ' || n || ' - ' || wd.wo_type,
  (SELECT id FROM users WHERE tenant_id = :tenant_id AND role = 'fleet_manager' LIMIT 1),
  NOW() - ((50 - n) * INTERVAL '1 day')
FROM wo_data wd;

-- ============================================
-- 8. MAINTENANCE SCHEDULES
-- ============================================
INSERT INTO maintenance_schedules (
  tenant_id, vehicle_id, service_type, interval_type, interval_value,
  last_service_date, last_service_odometer, next_service_due_date, next_service_due_odometer,
  is_active, notes
)
SELECT
  :tenant_id,
  v.id,
  st.service_type,
  st.interval_type,
  st.interval_value,
  CURRENT_DATE - (RANDOM() * st.interval_value || ' ' || st.interval_type)::INTERVAL,
  v.odometer - (RANDOM() * st.interval_value),
  CURRENT_DATE + ((st.interval_value - RANDOM() * st.interval_value * 0.3) || ' ' || st.interval_type)::INTERVAL,
  v.odometer + (st.interval_value - RANDOM() * st.interval_value * 0.3),
  true,
  'Auto-scheduled ' || st.service_type
FROM vehicles v
CROSS JOIN (
  VALUES
    ('Oil Change', 'miles', 5000),
    ('Tire Rotation', 'miles', 7500),
    ('Annual DOT Inspection', 'days', 365),
    ('Brake Inspection', 'miles', 15000),
    ('Transmission Service', 'miles', 30000),
    ('Coolant Flush', 'miles', 50000)
) AS st(service_type, interval_type, interval_value)
WHERE v.tenant_id = :tenant_id
  AND v.status IN ('active', 'maintenance');

-- ============================================
-- 9. FUEL TRANSACTIONS (100+ transactions)
-- ============================================
INSERT INTO fuel_transactions (
  tenant_id, vehicle_id, driver_id, transaction_date, gallons, price_per_gallon,
  odometer_reading, fuel_type, location, latitude, longitude, fuel_card_number, notes
)
SELECT
  :tenant_id,
  v.id,
  d.id,
  NOW() - (RANDOM() * INTERVAL '90 days'),
  10 + (RANDOM() * 25), -- 10-35 gallons
  3.20 + (RANDOM() * 0.80), -- $3.20-$4.00 per gallon
  v.odometer - (RANDOM() * 10000),
  v.fuel_type,
  ARRAY['Shell Station - Capital Circle', 'Sunoco - Mahan Drive', 'BP - Tennessee Street', 'Chevron - Monroe Street', 'Exxon - Thomasville Road'][1 + floor(random() * 5)::int],
  30.4383 + (RANDOM() * 0.1 - 0.05),
  -84.2807 + (RANDOM() * 0.1 - 0.05),
  'FC-' || LPAD(floor(random() * 10000)::TEXT, 6, '0'),
  'Regular fuel purchase'
FROM vehicles v
CROSS JOIN generate_series(1, 4) gs -- 4 transactions per vehicle
LEFT JOIN drivers d ON v.assigned_driver_id = d.user_id
WHERE v.tenant_id = :tenant_id
  AND v.fuel_type != 'Electric';

-- ============================================
-- 10. ROUTES (15 routes)
-- ============================================
INSERT INTO routes (
  tenant_id, route_name, vehicle_id, driver_id, status,
  start_location, end_location, planned_start_time, planned_end_time,
  actual_start_time, actual_end_time, total_distance, estimated_duration, actual_duration,
  waypoints, notes
)
SELECT
  :tenant_id,
  'Route-STG-' || LPAD(n::TEXT, 3, '0') || ' - ' ||
    ARRAY['Downtown Loop', 'North Zone', 'South Corridor', 'East District', 'West Region'][1 + (n % 5)],
  (SELECT id FROM vehicles WHERE tenant_id = :tenant_id AND status = 'active' ORDER BY RANDOM() LIMIT 1),
  (SELECT id FROM drivers WHERE tenant_id = :tenant_id ORDER BY RANDOM() LIMIT 1),
  CASE (n % 4)
    WHEN 0 THEN 'planned'
    WHEN 1 THEN 'in_progress'
    WHEN 2 THEN 'completed'
    ELSE 'completed'
  END,
  'Main Depot - 1500 Capital Circle SE',
  'Return to Depot',
  NOW() + ((n - 15) * INTERVAL '1 day') + INTERVAL '8 hours',
  NOW() + ((n - 15) * INTERVAL '1 day') + INTERVAL '16 hours',
  CASE WHEN n <= 12 THEN NOW() + ((n - 15) * INTERVAL '1 day') + INTERVAL '8 hours' + (RANDOM() * INTERVAL '30 minutes') ELSE NULL END,
  CASE WHEN n <= 10 THEN NOW() + ((n - 15) * INTERVAL '1 day') + INTERVAL '16 hours' + (RANDOM() * INTERVAL '1 hour') ELSE NULL END,
  35.5 + (RANDOM() * 50),
  240 + (RANDOM() * 180)::INTEGER,
  CASE WHEN n <= 10 THEN (240 + (RANDOM() * 200))::INTEGER ELSE NULL END,
  jsonb_build_array(
    jsonb_build_object('lat', 30.4383, 'lng', -84.2807, 'address', 'Main Depot', 'order', 0),
    jsonb_build_object('lat', 30.4697, 'lng', -84.2831, 'address', 'Stop 1 - North Monroe', 'order', 1),
    jsonb_build_object('lat', 30.4133, 'lng', -84.2696, 'address', 'Stop 2 - Woodville Hwy', 'order', 2),
    jsonb_build_object('lat', 30.4515, 'lng', -84.2234, 'address', 'Stop 3 - Mahan Drive', 'order', 3),
    jsonb_build_object('lat', 30.4383, 'lng', -84.2807, 'address', 'Return to Depot', 'order', 4)
  ),
  'Daily service route'
FROM generate_series(1, 15) n;

-- ============================================
-- 11. GEOFENCES
-- ============================================
INSERT INTO geofences (
  tenant_id, name, geofence_type, center_latitude, center_longitude, radius,
  geometry, alert_on_entry, alert_on_exit, alert_recipients, is_active, notes
)
VALUES
  (:tenant_id, 'Main Depot Zone', 'circular', 30.4383, -84.2807, 500,
   ST_Buffer(ST_SetSRID(ST_MakePoint(-84.2807, 30.4383), 4326)::geography, 500)::geometry,
   true, true, ARRAY['fleet.manager@cta-staging.com'], true, 'Main facility geofence'),

  (:tenant_id, 'North Service Area', 'circular', 30.4697, -84.2831, 300,
   ST_Buffer(ST_SetSRID(ST_MakePoint(-84.2831, 30.4697), 4326)::geography, 300)::geometry,
   true, false, ARRAY['fleet.manager@cta-staging.com'], true, 'North facility zone'),

  (:tenant_id, 'Downtown Tallahassee', 'circular', 30.4398, -84.2803, 2000,
   ST_Buffer(ST_SetSRID(ST_MakePoint(-84.2803, 30.4398), 4326)::geography, 2000)::geometry,
   false, false, ARRAY[], true, 'Downtown coverage area'),

  (:tenant_id, 'Restricted Area - Airport', 'circular', 30.3965, -84.3503, 1000,
   ST_Buffer(ST_SetSRID(ST_MakePoint(-84.3503, 30.3965), 4326)::geography, 1000)::geometry,
   true, true, ARRAY['admin@cta-staging.com', 'fleet.manager@cta-staging.com'], true, 'Airport restricted zone'),

  (:tenant_id, 'East Service Region', 'circular', 30.4515, -84.2234, 5000,
   ST_Buffer(ST_SetSRID(ST_MakePoint(-84.2234, 30.4515), 4326)::geography, 5000)::geometry,
   false, false, ARRAY[], true, 'Eastern coverage zone');

-- ============================================
-- 12. SAFETY INCIDENTS (10 incidents)
-- ============================================
INSERT INTO safety_incidents (
  tenant_id, incident_number, vehicle_id, driver_id, incident_date, incident_type,
  severity, location, latitude, longitude, description, injuries_count, fatalities_count,
  property_damage_cost, vehicle_damage_cost, at_fault, reported_to_osha,
  root_cause, corrective_actions, status, reported_by
)
SELECT
  :tenant_id,
  'INC-STG-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(n::TEXT, 4, '0'),
  (SELECT id FROM vehicles WHERE tenant_id = :tenant_id ORDER BY RANDOM() LIMIT 1),
  (SELECT id FROM drivers WHERE tenant_id = :tenant_id ORDER BY RANDOM() LIMIT 1),
  NOW() - ((30 - n) * INTERVAL '3 days'),
  ARRAY['accident', 'near_miss', 'property_damage', 'injury'][1 + (n % 4)],
  ARRAY['minor', 'minor', 'moderate', 'minor', 'minor'][1 + (n % 5)],
  ARRAY['Capital Circle & Apalachee', 'Monroe St & Tennessee', 'Mahan Drive', 'Thomasville Road'][1 + (n % 4)],
  30.4383 + (RANDOM() * 0.1 - 0.05),
  -84.2807 + (RANDOM() * 0.1 - 0.05),
  ARRAY[
    'Minor fender bender in parking lot',
    'Near miss with pedestrian at crosswalk',
    'Backed into light pole',
    'Side-swiped parked vehicle',
    'Minor slip and fall while entering vehicle',
    'Hit curb during parking maneuver'
  ][1 + (n % 6)],
  CASE WHEN n % 7 = 0 THEN 1 ELSE 0 END,
  0,
  CASE WHEN n % 3 = 0 THEN RANDOM() * 2000 ELSE 0 END,
  RANDOM() * 3000,
  n % 3 != 0,
  false,
  ARRAY[
    'Driver distraction',
    'Following too closely',
    'Misjudged clearance',
    'Poor visibility',
    'Weather conditions',
    'Inexperience with vehicle size'
  ][1 + (n % 6)],
  ARRAY[
    'Additional driver training scheduled',
    'Vehicle inspection completed',
    'Safety briefing conducted',
    'Coaching session with driver',
    'Review of safety procedures'
  ][1 + (n % 5)],
  CASE WHEN n <= 7 THEN 'closed' WHEN n <= 9 THEN 'resolved' ELSE 'investigating' END,
  (SELECT id FROM users WHERE tenant_id = :tenant_id AND role = 'fleet_manager' LIMIT 1)
FROM generate_series(1, 10) n;

-- ============================================
-- 13. DAMAGE REPORTS (8 reports)
-- ============================================
INSERT INTO damage_reports (
  tenant_id, vehicle_id, reported_by, damage_description, damage_severity,
  damage_location, photos, triposr_status, linked_work_order_id
)
SELECT
  :tenant_id,
  v.id,
  (SELECT id FROM drivers WHERE tenant_id = :tenant_id ORDER BY RANDOM() LIMIT 1),
  ARRAY[
    'Dent on driver side door',
    'Scratch on rear bumper',
    'Cracked side mirror',
    'Scratches on hood',
    'Dent on front fender',
    'Damage to tailgate'
  ][1 + (n % 6)],
  ARRAY['minor', 'minor', 'moderate', 'minor', 'moderate', 'minor'][1 + (n % 6)],
  ARRAY['Driver Door', 'Rear Bumper', 'Side Mirror', 'Hood', 'Front Fender', 'Tailgate'][1 + (n % 6)],
  ARRAY[
    'https://images.fleet.cta/damage/' || v.vin || '-damage-' || n || '.jpg'
  ],
  CASE (n % 3)
    WHEN 0 THEN 'completed'
    WHEN 1 THEN 'processing'
    ELSE 'pending'
  END,
  (SELECT id FROM work_orders WHERE vehicle_id = v.id AND tenant_id = :tenant_id ORDER BY RANDOM() LIMIT 1)
FROM vehicles v
CROSS JOIN generate_series(1, 2) n
WHERE v.tenant_id = :tenant_id
LIMIT 8;

-- ============================================
-- 14. INSPECTION FORMS
-- ============================================
INSERT INTO inspection_forms (tenant_id, form_name, form_type, form_template, is_active)
VALUES
  (:tenant_id, 'Standard Pre-Trip Inspection', 'pre_trip',
   '{"fields": [
     {"name": "tires", "type": "checkbox", "required": true, "label": "Tires - Proper pressure and condition"},
     {"name": "lights", "type": "checkbox", "required": true, "label": "All lights functioning"},
     {"name": "brakes", "type": "checkbox", "required": true, "label": "Brakes responsive"},
     {"name": "fluids", "type": "checkbox", "required": true, "label": "Fluid levels acceptable"},
     {"name": "mirrors", "type": "checkbox", "required": true, "label": "Mirrors clean and adjusted"},
     {"name": "windshield", "type": "checkbox", "required": true, "label": "Windshield clear"},
     {"name": "horn", "type": "checkbox", "required": true, "label": "Horn operational"},
     {"name": "belts", "type": "checkbox", "required": true, "label": "Seat belts functional"},
     {"name": "notes", "type": "text", "required": false, "label": "Additional Notes"}
   ]}'::jsonb,
   true),

  (:tenant_id, 'Post-Trip Safety Check', 'post_trip',
   '{"fields": [
     {"name": "exterior_damage", "type": "checkbox", "required": true, "label": "No new exterior damage"},
     {"name": "interior_condition", "type": "checkbox", "required": true, "label": "Interior clean and undamaged"},
     {"name": "fuel_level", "type": "number", "required": true, "label": "Fuel level percentage"},
     {"name": "warning_lights", "type": "checkbox", "required": true, "label": "No warning lights active"},
     {"name": "notes", "type": "text", "required": false, "label": "Issues to report"}
   ]}'::jsonb,
   true),

  (:tenant_id, 'DOT Annual Inspection', 'safety',
   '{"fields": [
     {"name": "brake_system", "type": "select", "required": true, "options": ["Pass", "Fail"], "label": "Brake System"},
     {"name": "lighting", "type": "select", "required": true, "options": ["Pass", "Fail"], "label": "Lighting Devices"},
     {"name": "steering", "type": "select", "required": true, "options": ["Pass", "Fail"], "label": "Steering Mechanism"},
     {"name": "tires", "type": "select", "required": true, "options": ["Pass", "Fail"], "label": "Tires"},
     {"name": "wheels", "type": "select", "required": true, "options": ["Pass", "Fail"], "label": "Wheels and Rims"},
     {"name": "windshield", "type": "select", "required": true, "options": ["Pass", "Fail"], "label": "Windshield"},
     {"name": "wipers", "type": "select", "required": true, "options": ["Pass", "Fail"], "label": "Windshield Wipers"},
     {"name": "inspector_name", "type": "text", "required": true, "label": "Inspector Name"},
     {"name": "inspector_cert", "type": "text", "required": true, "label": "Inspector Certification Number"}
   ]}'::jsonb,
   true);

-- ============================================
-- 15. INSPECTIONS (50+ inspections)
-- ============================================
INSERT INTO inspections (
  tenant_id, vehicle_id, driver_id, inspection_form_id, inspection_date,
  inspection_type, odometer_reading, status, form_data, notes
)
SELECT
  :tenant_id,
  v.id,
  d.id,
  (SELECT id FROM inspection_forms WHERE tenant_id = :tenant_id AND form_type = 'pre_trip' LIMIT 1),
  NOW() - ((n % 30) * INTERVAL '1 day') - (RANDOM() * INTERVAL '12 hours'),
  'pre_trip',
  v.odometer - (RANDOM() * 5000),
  CASE WHEN n % 15 = 0 THEN 'needs_repair' ELSE 'pass' END,
  '{"tires": true, "lights": true, "brakes": true, "fluids": true, "mirrors": true, "windshield": true, "horn": true, "belts": true, "notes": "All systems normal"}'::jsonb,
  CASE WHEN n % 15 = 0 THEN 'Minor issue noted - see work order' ELSE 'No issues' END
FROM vehicles v
CROSS JOIN generate_series(1, 2) n
LEFT JOIN drivers d ON v.assigned_driver_id = d.user_id
WHERE v.tenant_id = :tenant_id;

-- ============================================
-- 16. CHARGING STATIONS (For EV vehicles)
-- ============================================
INSERT INTO charging_stations (
  tenant_id, station_name, station_type, location, latitude, longitude, location_point,
  number_of_ports, power_output_kw, cost_per_kwh, is_public, is_operational
)
VALUES
  (:tenant_id, 'Main Depot - Level 2 Chargers', 'level_2', '1500 Capital Circle SE',
   30.4383, -84.2807, ST_SetSRID(ST_MakePoint(-84.2807, 30.4383), 4326),
   4, 7.2, 0.12, false, true),

  (:tenant_id, 'North Service Center - DC Fast', 'dc_fast_charge', '2200 North Monroe St',
   30.4697, -84.2831, ST_SetSRID(ST_MakePoint(-84.2831, 30.4697), 4326),
   2, 150.0, 0.35, false, true),

  (:tenant_id, 'Tesla Supercharger - Mahan Drive', 'dc_fast_charge', '4500 Mahan Drive',
   30.4515, -84.2234, ST_SetSRID(ST_MakePoint(-84.2234, 30.4515), 4326),
   8, 250.0, 0.40, true, true);

-- ============================================
-- 17. CHARGING SESSIONS (For EV vehicles)
-- ============================================
INSERT INTO charging_sessions (
  tenant_id, vehicle_id, charging_station_id, driver_id, start_time, end_time,
  energy_delivered_kwh, cost, start_battery_level, end_battery_level, session_duration, status
)
SELECT
  :tenant_id,
  v.id,
  (SELECT id FROM charging_stations WHERE tenant_id = :tenant_id ORDER BY RANDOM() LIMIT 1),
  d.id,
  NOW() - ((n % 20) * INTERVAL '1 day') - INTERVAL '3 hours',
  NOW() - ((n % 20) * INTERVAL '1 day') - INTERVAL '45 minutes',
  30.0 + (RANDOM() * 40.0),
  (30.0 + RANDOM() * 40.0) * 0.25,
  20.0 + (RANDOM() * 30.0),
  80.0 + (RANDOM() * 20.0),
  135,
  'completed'
FROM vehicles v
CROSS JOIN generate_series(1, 3) n
LEFT JOIN drivers d ON v.assigned_driver_id = d.user_id
WHERE v.tenant_id = :tenant_id AND v.fuel_type = 'Electric';

-- ============================================
-- 18. POLICIES
-- ============================================
INSERT INTO policies (tenant_id, policy_name, policy_type, description, rules, is_active, priority, created_by)
VALUES
  (:tenant_id, 'Speed Limit Enforcement', 'speed_limit',
   'Alert when vehicles exceed posted speed limits',
   '{"conditions": [{"field": "speed", "operator": "exceeds", "value": "speed_limit", "tolerance": 5}], "actions": [{"type": "alert", "severity": "medium"}]}'::jsonb,
   true, 1,
   (SELECT id FROM users WHERE tenant_id = :tenant_id AND role = 'admin' LIMIT 1)),

  (:tenant_id, 'Excessive Idle Time', 'idle_time',
   'Alert when vehicle idles for more than 10 minutes',
   '{"conditions": [{"field": "idle_time", "operator": "greater_than", "value": 600}], "actions": [{"type": "alert", "severity": "low"}, {"type": "email", "recipients": ["driver", "manager"]}]}'::jsonb,
   true, 2,
   (SELECT id FROM users WHERE tenant_id = :tenant_id AND role = 'admin' LIMIT 1)),

  (:tenant_id, 'Maintenance Due Alert', 'maintenance',
   'Notify when preventive maintenance is due within 500 miles',
   '{"conditions": [{"field": "miles_to_service", "operator": "less_than", "value": 500}], "actions": [{"type": "notification", "severity": "high"}]}'::jsonb,
   true, 3,
   (SELECT id FROM users WHERE tenant_id = :tenant_id AND role = 'fleet_manager' LIMIT 1)),

  (:tenant_id, 'After Hours Usage', 'usage',
   'Alert for vehicle usage outside normal business hours',
   '{"conditions": [{"field": "time", "operator": "outside", "value": "08:00-18:00"}], "actions": [{"type": "alert", "severity": "medium"}]}'::jsonb,
   true, 2,
   (SELECT id FROM users WHERE tenant_id = :tenant_id AND role = 'fleet_manager' LIMIT 1));

-- ============================================
-- 19. NOTIFICATIONS (Recent notifications)
-- ============================================
INSERT INTO notifications (tenant_id, user_id, notification_type, title, message, link, is_read, priority)
SELECT
  :tenant_id,
  u.id,
  ARRAY['alert', 'reminder', 'info'][1 + floor(random() * 3)::int],
  ARRAY[
    'Maintenance Due',
    'Work Order Completed',
    'Safety Alert',
    'Route Completed',
    'Fuel Purchase Recorded',
    'Inspection Required'
  ][1 + floor(random() * 6)::int],
  ARRAY[
    'Vehicle requires scheduled maintenance',
    'Work order has been completed',
    'New safety incident reported',
    'Driver has completed assigned route',
    'Fuel transaction processed',
    'Vehicle inspection is due'
  ][1 + floor(random() * 6)::int],
  '/fleet/vehicles',
  random() > 0.3,
  ARRAY['normal', 'high', 'normal', 'low'][1 + floor(random() * 4)::int]
FROM users u
CROSS JOIN generate_series(1, 5) n
WHERE u.tenant_id = :tenant_id
LIMIT 50;

-- ============================================
-- 20. TELEMETRY DATA (Recent vehicle data)
-- ============================================
INSERT INTO telemetry_data (
  tenant_id, vehicle_id, timestamp, latitude, longitude, speed, heading,
  odometer, engine_hours, fuel_level, engine_rpm, coolant_temp, oil_pressure,
  battery_voltage, harsh_braking, harsh_acceleration, speeding
)
SELECT
  :tenant_id,
  v.id,
  NOW() - (n * INTERVAL '5 minutes'),
  v.latitude + (RANDOM() * 0.01 - 0.005),
  v.longitude + (RANDOM() * 0.01 - 0.005),
  CASE WHEN v.status = 'active' THEN RANDOM() * 65 ELSE 0 END,
  RANDOM() * 360,
  v.odometer + (n * 0.5),
  v.engine_hours + (n * 0.01),
  50 + (RANDOM() * 50),
  CASE WHEN v.status = 'active' THEN 1500 + (RANDOM() * 2500)::INTEGER ELSE 0 END,
  180 + (RANDOM() * 30),
  30 + (RANDOM() * 20),
  12.5 + (RANDOM() * 2.0),
  random() > 0.95,
  random() > 0.97,
  random() > 0.90
FROM vehicles v
CROSS JOIN generate_series(1, 12) n -- 12 data points per vehicle (last hour)
WHERE v.tenant_id = :tenant_id AND v.status = 'active'
LIMIT 360; -- Cap at 360 records

-- ============================================
-- SEED DATA SUMMARY
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'STAGING SEED DATA LOADED';
  RAISE NOTICE '===================================';
  RAISE NOTICE 'Tenants: %', (SELECT COUNT(*) FROM tenants WHERE id = :tenant_id);
  RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM users WHERE tenant_id = :tenant_id);
  RAISE NOTICE 'Drivers: %', (SELECT COUNT(*) FROM drivers WHERE tenant_id = :tenant_id);
  RAISE NOTICE 'Vehicles: %', (SELECT COUNT(*) FROM vehicles WHERE tenant_id = :tenant_id);
  RAISE NOTICE 'Facilities: %', (SELECT COUNT(*) FROM facilities WHERE tenant_id = :tenant_id);
  RAISE NOTICE 'Work Orders: %', (SELECT COUNT(*) FROM work_orders WHERE tenant_id = :tenant_id);
  RAISE NOTICE 'Maintenance Schedules: %', (SELECT COUNT(*) FROM maintenance_schedules WHERE tenant_id = :tenant_id);
  RAISE NOTICE 'Fuel Transactions: %', (SELECT COUNT(*) FROM fuel_transactions WHERE tenant_id = :tenant_id);
  RAISE NOTICE 'Routes: %', (SELECT COUNT(*) FROM routes WHERE tenant_id = :tenant_id);
  RAISE NOTICE 'Geofences: %', (SELECT COUNT(*) FROM geofences WHERE tenant_id = :tenant_id);
  RAISE NOTICE 'Safety Incidents: %', (SELECT COUNT(*) FROM safety_incidents WHERE tenant_id = :tenant_id);
  RAISE NOTICE 'Damage Reports: %', (SELECT COUNT(*) FROM damage_reports WHERE tenant_id = :tenant_id);
  RAISE NOTICE 'Inspections: %', (SELECT COUNT(*) FROM inspections WHERE tenant_id = :tenant_id);
  RAISE NOTICE 'Vendors: %', (SELECT COUNT(*) FROM vendors WHERE tenant_id = :tenant_id);
  RAISE NOTICE 'Charging Stations: %', (SELECT COUNT(*) FROM charging_stations WHERE tenant_id = :tenant_id);
  RAISE NOTICE 'Notifications: %', (SELECT COUNT(*) FROM notifications WHERE tenant_id = :tenant_id);
  RAISE NOTICE 'Telemetry Records: %', (SELECT COUNT(*) FROM telemetry_data WHERE tenant_id = :tenant_id);
  RAISE NOTICE '===================================';
END $$;
