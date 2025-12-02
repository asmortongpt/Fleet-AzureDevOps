-- ============================================
-- DEV ENVIRONMENT SEED DATA
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
  'Capital Tech Alliance - Development',
  'cta-dev.fleetmanagement.local',
  '{"max_vehicles": 200, "max_drivers": 100, "features": ["gps", "maintenance", "fuel", "safety", "video_telematics", "ev_charging", "advanced_analytics"]}'::jsonb,
  true,
  NOW() - INTERVAL '200 days',
  NOW()
) RETURNING id AS tenant_id
\gset

-- ============================================
-- 2. USERS & ROLES
-- ============================================

-- Admin Users
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, mfa_enabled, last_login_at, created_at)
VALUES
  (:tenant_id, 'admin@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Development', 'Admin', '850-555-9000', 'admin', true, false, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '200 days'),
  (:tenant_id, 'manager@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Fleet', 'Manager', '850-555-9001', 'fleet_manager', true, false, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '180 days'),
  (:tenant_id, 'supervisor@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Operations', 'Supervisor', '850-555-9002', 'fleet_manager', true, false, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '160 days');

-- Technicians
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, last_login_at, created_at)
VALUES
  (:tenant_id, 'mechanic1@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Alex', 'Turner', '850-555-9100', 'technician', true, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '140 days'),
  (:tenant_id, 'mechanic2@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Chris', 'Patterson', '850-555-9101', 'technician', true, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '120 days'),
  (:tenant_id, 'mechanic3@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Sam', 'Hughes', '850-555-9102', 'technician', true, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '100 days');

-- Driver Users (20 drivers with different names than staging)
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, last_login_at, created_at)
VALUES
  (:tenant_id, 'driver.adams@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Andrew', 'Adams', '850-555-5001', 'driver', true, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '400 days'),
  (:tenant_id, 'driver.baker@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Betty', 'Baker', '850-555-5002', 'driver', true, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '380 days'),
  (:tenant_id, 'driver.carter@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Carl', 'Carter', '850-555-5003', 'driver', true, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '360 days'),
  (:tenant_id, 'driver.davis@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Diana', 'Davis', '850-555-5004', 'driver', true, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '340 days'),
  (:tenant_id, 'driver.evans@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Edward', 'Evans', '850-555-5005', 'driver', true, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '320 days'),
  (:tenant_id, 'driver.fisher@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Fiona', 'Fisher', '850-555-5006', 'driver', true, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '300 days'),
  (:tenant_id, 'driver.garcia@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'George', 'Garcia', '850-555-5007', 'driver', true, NOW() - INTERVAL '7 hours', NOW() - INTERVAL '280 days'),
  (:tenant_id, 'driver.harris@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Helen', 'Harris', '850-555-5008', 'driver', true, NOW() - INTERVAL '8 hours', NOW() - INTERVAL '260 days'),
  (:tenant_id, 'driver.irwin@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Ivan', 'Irwin', '850-555-5009', 'driver', true, NOW() - INTERVAL '9 hours', NOW() - INTERVAL '240 days'),
  (:tenant_id, 'driver.jones@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Julia', 'Jones', '850-555-5010', 'driver', true, NOW() - INTERVAL '10 hours', NOW() - INTERVAL '220 days'),
  (:tenant_id, 'driver.kelly@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Kevin', 'Kelly', '850-555-5011', 'driver', true, NOW() - INTERVAL '11 hours', NOW() - INTERVAL '200 days'),
  (:tenant_id, 'driver.lopez@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Laura', 'Lopez', '850-555-5012', 'driver', true, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '190 days'),
  (:tenant_id, 'driver.murphy@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Martin', 'Murphy', '850-555-5013', 'driver', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '180 days'),
  (:tenant_id, 'driver.nelson@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Nora', 'Nelson', '850-555-5014', 'driver', true, NOW() - INTERVAL '14 hours', NOW() - INTERVAL '170 days'),
  (:tenant_id, 'driver.owens@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Oscar', 'Owens', '850-555-5015', 'driver', true, NOW() - INTERVAL '15 hours', NOW() - INTERVAL '160 days'),
  (:tenant_id, 'driver.powell@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Paula', 'Powell', '850-555-5016', 'driver', true, NOW() - INTERVAL '16 hours', NOW() - INTERVAL '150 days'),
  (:tenant_id, 'driver.quinn@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Quincy', 'Quinn', '850-555-5017', 'driver', true, NOW() - INTERVAL '17 hours', NOW() - INTERVAL '140 days'),
  (:tenant_id, 'driver.rivera@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Rita', 'Rivera', '850-555-5018', 'driver', true, NOW() - INTERVAL '18 hours', NOW() - INTERVAL '130 days'),
  (:tenant_id, 'driver.scott@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Steve', 'Scott', '850-555-5019', 'driver', true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '120 days'),
  (:tenant_id, 'driver.taylor@cta-dev.com', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Tina', 'Taylor', '850-555-5020', 'driver', true, NOW() - INTERVAL '20 hours', NOW() - INTERVAL '110 days');

-- ============================================
-- 3. DRIVERS (Extended profiles for driver users)
-- ============================================
INSERT INTO drivers (tenant_id, user_id, license_number, license_state, license_expiration, cdl_class, cdl_endorsements, medical_card_expiration, hire_date, status, safety_score, emergency_contact_name, emergency_contact_phone)
SELECT
  :tenant_id,
  id,
  'FL' || LPAD((200000 + ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 8, '0'),
  'FL',
  CURRENT_DATE + INTERVAL '3 years' + (RANDOM() * INTERVAL '200 days'),
  CASE
    WHEN ROW_NUMBER() OVER (ORDER BY created_at) % 5 = 0 THEN 'A'
    WHEN ROW_NUMBER() OVER (ORDER BY created_at) % 5 = 1 THEN 'B'
    WHEN ROW_NUMBER() OVER (ORDER BY created_at) % 5 = 2 THEN 'C'
    ELSE NULL
  END,
  CASE
    WHEN ROW_NUMBER() OVER (ORDER BY created_at) % 3 = 0 THEN ARRAY['H', 'N', 'P']::VARCHAR[]
    WHEN ROW_NUMBER() OVER (ORDER BY created_at) % 3 = 1 THEN ARRAY['H']::VARCHAR[]
    ELSE ARRAY[]::VARCHAR[]
  END,
  CURRENT_DATE + INTERVAL '18 months' + (RANDOM() * INTERVAL '120 days'),
  created_at::DATE,
  'active',
  82.0 + (RANDOM() * 18.0),
  'Emergency ' || first_name,
  '850-555-' || LPAD((6000 + ROW_NUMBER() OVER (ORDER BY created_at))::TEXT, 4, '0')
FROM users
WHERE tenant_id = :tenant_id AND role = 'driver';

-- ============================================
-- 4. FACILITIES
-- ============================================
INSERT INTO facilities (tenant_id, name, facility_type, address, city, state, zip_code, latitude, longitude, location, phone, capacity, service_bays, is_active, notes)
VALUES
  (:tenant_id, 'Central Fleet Hub', 'depot', '100 Fleet Management Way', 'Tallahassee', 'FL', '32301', 30.4500, -84.2700, ST_SetSRID(ST_MakePoint(-84.2700, 30.4500), 4326), '850-555-7000', 75, 0, true, 'Main central depot for development testing'),
  (:tenant_id, 'Advanced Service Facility', 'service_center', '500 Innovation Blvd', 'Tallahassee', 'FL', '32303', 30.4800, -84.2600, ST_SetSRID(ST_MakePoint(-84.2600, 30.4800), 4326), '850-555-7001', 30, 12, true, 'State-of-the-art maintenance with 12 bays'),
  (:tenant_id, 'Express Service Center', 'service_center', '250 Quick Lane', 'Tallahassee', 'FL', '32304', 30.4200, -84.2900, ST_SetSRID(ST_MakePoint(-84.2900, 30.4200), 4326), '850-555-7002', 20, 6, true, 'Fast turnaround maintenance'),
  (:tenant_id, 'West Side Garage', 'garage', '1800 West End Ave', 'Tallahassee', 'FL', '32310', 30.4600, -84.3200, ST_SetSRID(ST_MakePoint(-84.3200, 30.4600), 4326), '850-555-7003', 40, 3, true, 'Western region support facility');

-- ============================================
-- 5. VEHICLES (25 vehicles - diverse fleet)
-- ============================================
WITH vehicle_data AS (
  SELECT
    n,
    CASE (n % 8)
      WHEN 0 THEN 'Ford'
      WHEN 1 THEN 'Chevrolet'
      WHEN 2 THEN 'RAM'
      WHEN 3 THEN 'Toyota'
      WHEN 4 THEN 'Tesla'
      WHEN 5 THEN 'Nissan'
      WHEN 6 THEN 'GMC'
      ELSE 'Honda'
    END as make,
    CASE (n % 8)
      WHEN 0 THEN 'F-250 Super Duty'
      WHEN 1 THEN 'Silverado 2500HD'
      WHEN 2 THEN 'RAM 2500'
      WHEN 3 THEN 'Tacoma'
      WHEN 4 THEN 'Model Y'
      WHEN 5 THEN 'Frontier'
      WHEN 6 THEN 'Sierra 1500'
      ELSE 'Ridgeline'
    END as model,
    CASE (n % 8)
      WHEN 4 THEN 'SUV'
      WHEN 7 THEN 'Pickup Truck'
      ELSE 'Pickup Truck'
    END as vehicle_type,
    CASE (n % 8)
      WHEN 4 THEN 'Electric'
      WHEN 1 THEN 'Diesel'
      WHEN 2 THEN 'Diesel'
      ELSE 'Gasoline'
    END as fuel_type,
    2021 + (n % 4) as year,
    CASE (n % 8)
      WHEN 0 THEN 'maintenance'
      WHEN 7 THEN 'out_of_service'
      ELSE 'active'
    END as status,
    20000 + (n * 2500 + RANDOM() * 4000) as odometer,
    RANDOM() * 400 + 150 as engine_hours
  FROM generate_series(1, 25) n
)
INSERT INTO vehicles (
  tenant_id, vin, make, model, year, license_plate, vehicle_type, fuel_type,
  status, odometer, engine_hours, purchase_date, purchase_price, current_value,
  gps_device_id, last_gps_update, latitude, longitude, location, speed, heading,
  assigned_driver_id, assigned_facility_id, photos, notes, created_at
)
SELECT
  :tenant_id,
  '2FT' || UPPER(MD5(RANDOM()::TEXT))::VARCHAR(14),
  vd.make,
  vd.model,
  vd.year,
  'FL-DEV-' || LPAD(n::TEXT, 4, '0'),
  vd.vehicle_type,
  vd.fuel_type,
  vd.status,
  vd.odometer,
  vd.engine_hours,
  CURRENT_DATE - INTERVAL '2 years' + (RANDOM() * INTERVAL '500 days'),
  40000 + (RANDOM() * 30000),
  30000 + (RANDOM() * 25000),
  'DEV-GPS-' || LPAD(n::TEXT, 6, '0'),
  NOW() - (RANDOM() * INTERVAL '4 hours'),
  30.4500 + (RANDOM() * 0.15 - 0.075),
  -84.2700 + (RANDOM() * 0.15 - 0.075),
  ST_SetSRID(ST_MakePoint(-84.2700 + (RANDOM() * 0.15 - 0.075), 30.4500 + (RANDOM() * 0.15 - 0.075)), 4326),
  CASE WHEN vd.status = 'active' THEN RANDOM() * 70 ELSE 0 END,
  RANDOM() * 360,
  (SELECT id FROM drivers WHERE tenant_id = :tenant_id ORDER BY RANDOM() LIMIT 1),
  (SELECT id FROM facilities WHERE tenant_id = :tenant_id ORDER BY RANDOM() LIMIT 1),
  ARRAY[
    'https://images.dev.fleet.cta/vehicles/dev-unit-' || n || '-front.jpg',
    'https://images.dev.fleet.cta/vehicles/dev-unit-' || n || '-rear.jpg',
    'https://images.dev.fleet.cta/vehicles/dev-unit-' || n || '-interior.jpg'
  ],
  'Dev Unit ' || n || ' - ' || vd.make || ' ' || vd.model || ' (Testing)',
  NOW() - INTERVAL '60 days' + (RANDOM() * INTERVAL '40 days')
FROM vehicle_data vd;

-- ============================================
-- 6. VENDORS
-- ============================================
INSERT INTO vendors (tenant_id, vendor_name, vendor_type, contact_name, contact_email, contact_phone, address, city, state, zip_code, is_active, notes)
VALUES
  (:tenant_id, 'Fleet Parts Direct', 'parts_supplier', 'John Mitchell', 'jmitchell@fleetparts.com', '850-555-8001', '100 Parts Plaza', 'Tallahassee', 'FL', '32301', true, 'Online parts ordering - 20% dev discount'),
  (:tenant_id, 'Express Oil Change Plus', 'service_provider', 'Amanda Lewis', 'alewis@expressoil.com', '850-555-8002', '200 Service St', 'Tallahassee', 'FL', '32304', true, 'Quick lube and preventive maintenance'),
  (:tenant_id, 'Goodyear Fleet Solutions', 'service_provider', 'Brian Cooper', 'bcooper@goodyear.com', '850-555-8003', '300 Tire Way', 'Tallahassee', 'FL', '32303', true, 'Fleet tire program with warranty'),
  (:tenant_id, 'BP Fleet Fuel Card', 'fuel_provider', 'Catherine Reed', 'creed@bp.com', '850-555-8004', '400 Fuel Lane', 'Tallahassee', 'FL', '32308', true, 'Primary fuel card - volume pricing'),
  (:tenant_id, 'Advance Auto Commercial', 'parts_supplier', 'Daniel Foster', 'dfoster@advanceauto.com', '850-555-8005', '500 Auto Blvd', 'Tallahassee', 'FL', '32308', true, 'Same-day delivery on most parts'),
  (:tenant_id, 'Precision Brake & Alignment', 'service_provider', 'Emily Barnes', 'ebarnes@precisionbrake.com', '850-555-8006', '600 Precision Dr', 'Tallahassee', 'FL', '32304', true, 'Certified brake and alignment specialist'),
  (:tenant_id, 'CarQuest Fleet Services', 'parts_supplier', 'Frank Russell', 'frussell@carquest.com', '850-555-8007', '700 Parts Pkwy', 'Tallahassee', 'FL', '32301', true, 'Wide parts inventory for all vehicle types'),
  (:tenant_id, 'Marathon Petroleum Fleet', 'fuel_provider', 'Grace Coleman', 'gcoleman@marathon.com', '850-555-8008', '800 Energy Way', 'Tallahassee', 'FL', '32308', true, 'Secondary fuel provider'),
  (:tenant_id, 'EV Charging Solutions', 'service_provider', 'Henry Watson', 'hwatson@evcharging.com', '850-555-8009', '900 Electric Ave', 'Tallahassee', 'FL', '32303', true, 'EV infrastructure and support'),
  (:tenant_id, 'Fleet Diagnostic Systems', 'service_provider', 'Isabel Morgan', 'imorgan@fleetdiag.com', '850-555-8010', '1000 Tech Blvd', 'Tallahassee', 'FL', '32310', true, 'Advanced diagnostics and telematics');

-- ============================================
-- 7. WORK ORDERS (40 work orders)
-- ============================================
WITH wo_data AS (
  SELECT
    n,
    (SELECT id FROM vehicles WHERE tenant_id = :tenant_id ORDER BY RANDOM() LIMIT 1) as vehicle_id,
    (SELECT id FROM facilities WHERE tenant_id = :tenant_id AND service_bays > 0 ORDER BY RANDOM() LIMIT 1) as facility_id,
    (SELECT id FROM users WHERE tenant_id = :tenant_id AND role = 'technician' ORDER BY RANDOM() LIMIT 1) as tech_id,
    CASE (n % 5)
      WHEN 0 THEN 'preventive'
      WHEN 1 THEN 'corrective'
      WHEN 2 THEN 'inspection'
      WHEN 3 THEN 'corrective'
      ELSE 'preventive'
    END as wo_type,
    CASE (n % 6)
      WHEN 0 THEN 'low'
      WHEN 1 THEN 'medium'
      WHEN 2 THEN 'medium'
      WHEN 3 THEN 'high'
      WHEN 4 THEN 'critical'
      ELSE 'medium'
    END as priority,
    CASE (n % 7)
      WHEN 0 THEN 'open'
      WHEN 1 THEN 'in_progress'
      WHEN 2 THEN 'in_progress'
      WHEN 3 THEN 'completed'
      WHEN 4 THEN 'completed'
      WHEN 5 THEN 'on_hold'
      ELSE 'completed'
    END as wo_status
  FROM generate_series(1, 40) n
)
INSERT INTO work_orders (
  tenant_id, work_order_number, vehicle_id, facility_id, assigned_technician_id,
  type, priority, status, description, odometer_reading, engine_hours_reading,
  scheduled_start, scheduled_end, actual_start, actual_end,
  labor_hours, labor_cost, parts_cost, notes, created_by, created_at
)
SELECT
  :tenant_id,
  'WO-DEV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(n::TEXT, 5, '0'),
  wd.vehicle_id,
  wd.facility_id,
  wd.tech_id,
  wd.wo_type,
  wd.priority,
  wd.wo_status,
  CASE wd.wo_type
    WHEN 'preventive' THEN ARRAY['60k mile major service', 'Oil and filter change', 'Tire rotation service', 'Complete brake system inspection', 'Transmission fluid service', 'Coolant system flush'][1 + floor(random() * 6)::int]
    WHEN 'corrective' THEN ARRAY['Replace front brake pads and rotors', 'Repair coolant system leak', 'Replace dead battery', 'Diagnose and repair AC compressor', 'Replace timing belt', 'Repair transmission issue', 'Fix electrical problem'][1 + floor(random() * 7)::int]
    WHEN 'inspection' THEN ARRAY['Annual DOT safety inspection', 'Pre-purchase inspection', 'State emissions test', 'Comprehensive fleet audit'][1 + floor(random() * 4)::int]
  END,
  (SELECT odometer FROM vehicles WHERE id = wd.vehicle_id),
  (SELECT engine_hours FROM vehicles WHERE id = wd.vehicle_id),
  CURRENT_DATE - (40 - n) + (RANDOM() * INTERVAL '8 days'),
  CURRENT_DATE - (40 - n) + INTERVAL '2 days' + (RANDOM() * INTERVAL '8 days'),
  CASE WHEN wd.wo_status IN ('in_progress', 'completed') THEN CURRENT_TIMESTAMP - ((40 - n) * INTERVAL '1 day') ELSE NULL END,
  CASE WHEN wd.wo_status = 'completed' THEN CURRENT_TIMESTAMP - ((38 - n) * INTERVAL '1 day') ELSE NULL END,
  CASE WHEN wd.wo_status = 'completed' THEN 1.5 + (RANDOM() * 8.0) ELSE 0 END,
  CASE WHEN wd.wo_status = 'completed' THEN (1.5 + RANDOM() * 8.0) * 95.0 ELSE 0 END,
  CASE WHEN wd.wo_status = 'completed' THEN RANDOM() * 800 ELSE 0 END,
  'Development work order ' || n || ' - ' || wd.wo_type || ' maintenance',
  (SELECT id FROM users WHERE tenant_id = :tenant_id AND role = 'fleet_manager' LIMIT 1),
  NOW() - ((40 - n) * INTERVAL '1 day')
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
  CURRENT_DATE + ((st.interval_value - RANDOM() * st.interval_value * 0.4) || ' ' || st.interval_type)::INTERVAL,
  v.odometer + (st.interval_value - RANDOM() * st.interval_value * 0.4),
  true,
  'Automated schedule - ' || st.service_type
FROM vehicles v
CROSS JOIN (
  VALUES
    ('Oil and Filter Change', 'miles', 5000),
    ('Tire Rotation', 'miles', 7500),
    ('Annual DOT Inspection', 'days', 365),
    ('Brake System Inspection', 'miles', 15000),
    ('Transmission Fluid Service', 'miles', 30000),
    ('Coolant System Flush', 'miles', 50000),
    ('Air Filter Replacement', 'miles', 15000),
    ('Fuel Filter Replacement', 'miles', 20000)
) AS st(service_type, interval_type, interval_value)
WHERE v.tenant_id = :tenant_id;

-- ============================================
-- 9. FUEL TRANSACTIONS (120+ transactions)
-- ============================================
INSERT INTO fuel_transactions (
  tenant_id, vehicle_id, driver_id, transaction_date, gallons, price_per_gallon,
  odometer_reading, fuel_type, location, latitude, longitude, fuel_card_number, notes
)
SELECT
  :tenant_id,
  v.id,
  d.id,
  NOW() - (RANDOM() * INTERVAL '120 days'),
  12 + (RANDOM() * 30),
  3.15 + (RANDOM() * 0.95),
  v.odometer - (RANDOM() * 15000),
  v.fuel_type,
  ARRAY[
    'BP Station - Innovation Blvd',
    'Marathon - Fleet Way',
    'Shell - Tech Boulevard',
    'Chevron - Service Street',
    'Exxon - West End Ave',
    'Sunoco - Auto Blvd'
  ][1 + floor(random() * 6)::int],
  30.4500 + (RANDOM() * 0.12 - 0.06),
  -84.2700 + (RANDOM() * 0.12 - 0.06),
  'DEV-FC-' || LPAD(floor(random() * 20000)::TEXT, 6, '0'),
  'Dev environment fuel transaction'
FROM vehicles v
CROSS JOIN generate_series(1, 5) gs
LEFT JOIN drivers d ON v.assigned_driver_id = d.user_id
WHERE v.tenant_id = :tenant_id
  AND v.fuel_type != 'Electric';

-- ============================================
-- 10. ROUTES (12 routes)
-- ============================================
INSERT INTO routes (
  tenant_id, route_name, vehicle_id, driver_id, status,
  start_location, end_location, planned_start_time, planned_end_time,
  actual_start_time, actual_end_time, total_distance, estimated_duration, actual_duration,
  waypoints, notes
)
SELECT
  :tenant_id,
  'DEV-Route-' || LPAD(n::TEXT, 3, '0') || ' - ' ||
    ARRAY['Central Circuit', 'Northern Path', 'Southern Run', 'Eastern Corridor', 'Western Loop', 'Express Route'][1 + (n % 6)],
  (SELECT id FROM vehicles WHERE tenant_id = :tenant_id AND status = 'active' ORDER BY RANDOM() LIMIT 1),
  (SELECT id FROM drivers WHERE tenant_id = :tenant_id ORDER BY RANDOM() LIMIT 1),
  CASE (n % 5)
    WHEN 0 THEN 'planned'
    WHEN 1 THEN 'in_progress'
    WHEN 2 THEN 'completed'
    WHEN 3 THEN 'completed'
    ELSE 'completed'
  END,
  'Central Fleet Hub - 100 Fleet Management Way',
  'Return to Hub',
  NOW() + ((n - 12) * INTERVAL '1 day') + INTERVAL '7 hours',
  NOW() + ((n - 12) * INTERVAL '1 day') + INTERVAL '17 hours',
  CASE WHEN n <= 10 THEN NOW() + ((n - 12) * INTERVAL '1 day') + INTERVAL '7 hours' + (RANDOM() * INTERVAL '45 minutes') ELSE NULL END,
  CASE WHEN n <= 8 THEN NOW() + ((n - 12) * INTERVAL '1 day') + INTERVAL '17 hours' + (RANDOM() * INTERVAL '90 minutes') ELSE NULL END,
  42.5 + (RANDOM() * 65),
  300 + (RANDOM() * 240)::INTEGER,
  CASE WHEN n <= 8 THEN (300 + (RANDOM() * 260))::INTEGER ELSE NULL END,
  jsonb_build_array(
    jsonb_build_object('lat', 30.4500, 'lng', -84.2700, 'address', 'Central Hub', 'order', 0),
    jsonb_build_object('lat', 30.4800, 'lng', -84.2600, 'address', 'Checkpoint A', 'order', 1),
    jsonb_build_object('lat', 30.4200, 'lng', -84.2900, 'address', 'Checkpoint B', 'order', 2),
    jsonb_build_object('lat', 30.4600, 'lng', -84.3200, 'address', 'Checkpoint C', 'order', 3),
    jsonb_build_object('lat', 30.4500, 'lng', -84.2700, 'address', 'Return to Hub', 'order', 4)
  ),
  'Dev testing route #' || n
FROM generate_series(1, 12) n;

-- ============================================
-- 11. GEOFENCES
-- ============================================
INSERT INTO geofences (
  tenant_id, name, geofence_type, center_latitude, center_longitude, radius,
  geometry, alert_on_entry, alert_on_exit, alert_recipients, is_active, notes
)
VALUES
  (:tenant_id, 'Central Hub Zone', 'circular', 30.4500, -84.2700, 600,
   ST_Buffer(ST_SetSRID(ST_MakePoint(-84.2700, 30.4500), 4326)::geography, 600)::geometry,
   true, true, ARRAY['manager@cta-dev.com'], true, 'Main hub monitoring zone'),

  (:tenant_id, 'Advanced Service Perimeter', 'circular', 30.4800, -84.2600, 400,
   ST_Buffer(ST_SetSRID(ST_MakePoint(-84.2600, 30.4800), 4326)::geography, 400)::geometry,
   true, false, ARRAY['manager@cta-dev.com'], true, 'Service center zone'),

  (:tenant_id, 'City Center Coverage', 'circular', 30.4400, -84.2800, 3000,
   ST_Buffer(ST_SetSRID(ST_MakePoint(-84.2800, 30.4400), 4326)::geography, 3000)::geometry,
   false, false, ARRAY[], true, 'Downtown operational area'),

  (:tenant_id, 'Western Operations Zone', 'circular', 30.4600, -84.3200, 4000,
   ST_Buffer(ST_SetSRID(ST_MakePoint(-84.3200, 30.4600), 4326)::geography, 4000)::geometry,
   false, false, ARRAY[], true, 'Western region coverage'),

  (:tenant_id, 'High Security Area', 'circular', 30.4350, -84.2500, 800,
   ST_Buffer(ST_SetSRID(ST_MakePoint(-84.2500, 30.4350), 4326)::geography, 800)::geometry,
   true, true, ARRAY['admin@cta-dev.com', 'manager@cta-dev.com'], true, 'Restricted access zone - immediate alerts');

-- ============================================
-- 12. SAFETY INCIDENTS (7 incidents)
-- ============================================
INSERT INTO safety_incidents (
  tenant_id, incident_number, vehicle_id, driver_id, incident_date, incident_type,
  severity, location, latitude, longitude, description, injuries_count, fatalities_count,
  property_damage_cost, vehicle_damage_cost, at_fault, reported_to_osha,
  root_cause, corrective_actions, status, reported_by
)
SELECT
  :tenant_id,
  'INC-DEV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(n::TEXT, 4, '0'),
  (SELECT id FROM vehicles WHERE tenant_id = :tenant_id ORDER BY RANDOM() LIMIT 1),
  (SELECT id FROM drivers WHERE tenant_id = :tenant_id ORDER BY RANDOM() LIMIT 1),
  NOW() - ((25 - n) * INTERVAL '4 days'),
  ARRAY['near_miss', 'property_damage', 'accident', 'near_miss'][1 + (n % 4)],
  ARRAY['minor', 'minor', 'moderate', 'minor'][1 + (n % 4)],
  ARRAY['Fleet Way & Innovation', 'Service St & Tech Blvd', 'West End Ave', 'Auto Boulevard'][1 + (n % 4)],
  30.4500 + (RANDOM() * 0.12 - 0.06),
  -84.2700 + (RANDOM() * 0.12 - 0.06),
  ARRAY[
    'Close call with merging vehicle',
    'Scraped mirror on narrow gate',
    'Low-speed parking lot contact',
    'Near miss with cyclist',
    'Minor contact during reverse',
    'Bumped loading dock',
    'Scrape on tight turn'
  ][1 + (n % 7)],
  0,
  0,
  CASE WHEN n % 4 = 0 THEN RANDOM() * 1500 ELSE 0 END,
  RANDOM() * 2500,
  n % 2 = 0,
  false,
  ARRAY[
    'Visibility limitation',
    'Misjudged vehicle clearance',
    'Parking sensor malfunction',
    'Driver unfamiliarity',
    'Environmental factors'
  ][1 + (n % 5)],
  ARRAY[
    'Refresher training completed',
    'Vehicle sensor calibrated',
    'Safety review conducted',
    'Additional monitoring implemented',
    'Equipment upgrade scheduled'
  ][1 + (n % 5)],
  CASE WHEN n <= 5 THEN 'closed' WHEN n = 6 THEN 'resolved' ELSE 'investigating' END,
  (SELECT id FROM users WHERE tenant_id = :tenant_id AND role IN ('fleet_manager', 'admin') LIMIT 1)
FROM generate_series(1, 7) n;

-- ============================================
-- 13. DAMAGE REPORTS (6 reports)
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
    'Minor paint scratch on passenger door',
    'Small dent on rear quarter panel',
    'Scratches on front bumper',
    'Cracked driver side mirror housing',
    'Dent on tailgate',
    'Scrape along bed rail'
  ][1 + (n % 6)],
  ARRAY['minor', 'moderate', 'minor'][1 + (n % 3)],
  ARRAY['Passenger Door', 'Rear Panel', 'Front Bumper', 'Mirror', 'Tailgate', 'Bed Rail'][1 + (n % 6)],
  ARRAY[
    'https://images.dev.fleet.cta/damage/dev-' || v.vin || '-dmg-' || n || '-1.jpg',
    'https://images.dev.fleet.cta/damage/dev-' || v.vin || '-dmg-' || n || '-2.jpg'
  ],
  CASE (n % 4)
    WHEN 0 THEN 'completed'
    WHEN 1 THEN 'processing'
    WHEN 2 THEN 'pending'
    ELSE 'completed'
  END,
  (SELECT id FROM work_orders WHERE vehicle_id = v.id AND tenant_id = :tenant_id ORDER BY RANDOM() LIMIT 1)
FROM vehicles v
CROSS JOIN generate_series(1, 1) n
WHERE v.tenant_id = :tenant_id
LIMIT 6;

-- ============================================
-- 14. INSPECTION FORMS
-- ============================================
INSERT INTO inspection_forms (tenant_id, form_name, form_type, form_template, is_active)
VALUES
  (:tenant_id, 'Standard Pre-Trip Check', 'pre_trip',
   '{"fields": [
     {"name": "tire_condition", "type": "checkbox", "required": true, "label": "Tires - Pressure and tread"},
     {"name": "all_lights", "type": "checkbox", "required": true, "label": "All lights operational"},
     {"name": "brake_test", "type": "checkbox", "required": true, "label": "Brakes tested and responsive"},
     {"name": "fluid_check", "type": "checkbox", "required": true, "label": "All fluid levels checked"},
     {"name": "mirror_adjustment", "type": "checkbox", "required": true, "label": "Mirrors adjusted properly"},
     {"name": "windshield_condition", "type": "checkbox", "required": true, "label": "Windshield clear"},
     {"name": "horn_test", "type": "checkbox", "required": true, "label": "Horn tested"},
     {"name": "seatbelt_check", "type": "checkbox", "required": true, "label": "Seatbelts working"},
     {"name": "additional_notes", "type": "text", "required": false, "label": "Notes"}
   ]}'::jsonb,
   true),

  (:tenant_id, 'Post-Trip Vehicle Check', 'post_trip',
   '{"fields": [
     {"name": "damage_check", "type": "checkbox", "required": true, "label": "No new damage observed"},
     {"name": "interior_clean", "type": "checkbox", "required": true, "label": "Interior condition acceptable"},
     {"name": "fuel_percent", "type": "number", "required": true, "label": "Remaining fuel percentage"},
     {"name": "dash_warnings", "type": "checkbox", "required": true, "label": "No dashboard warnings"},
     {"name": "issues", "type": "text", "required": false, "label": "Report any issues"}
   ]}'::jsonb,
   true);

-- ============================================
-- 15. INSPECTIONS (40+ inspections)
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
  NOW() - ((n % 25) * INTERVAL '1 day') - (RANDOM() * INTERVAL '18 hours'),
  'pre_trip',
  v.odometer - (RANDOM() * 3000),
  CASE WHEN n % 12 = 0 THEN 'needs_repair' ELSE 'pass' END,
  '{"tire_condition": true, "all_lights": true, "brake_test": true, "fluid_check": true, "mirror_adjustment": true, "windshield_condition": true, "horn_test": true, "seatbelt_check": true, "additional_notes": "Normal condition"}'::jsonb,
  CASE WHEN n % 12 = 0 THEN 'Minor issue - work order created' ELSE 'All checks passed' END
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
  (:tenant_id, 'Central Hub - Level 2', 'level_2', '100 Fleet Management Way',
   30.4500, -84.2700, ST_SetSRID(ST_MakePoint(-84.2700, 30.4500), 4326),
   6, 7.7, 0.11, false, true),

  (:tenant_id, 'Advanced Service - DC Fast', 'dc_fast_charge', '500 Innovation Blvd',
   30.4800, -84.2600, ST_SetSRID(ST_MakePoint(-84.2600, 30.4800), 4326),
   4, 175.0, 0.33, false, true),

  (:tenant_id, 'Public Supercharger Network', 'dc_fast_charge', '700 Electric Ave',
   30.4350, -84.2500, ST_SetSRID(ST_MakePoint(-84.2500, 30.4350), 4326),
   12, 250.0, 0.42, true, true);

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
  NOW() - ((n % 15) * INTERVAL '1 day') - INTERVAL '4 hours',
  NOW() - ((n % 15) * INTERVAL '1 day') - INTERVAL '1 hour',
  35.0 + (RANDOM() * 50.0),
  (35.0 + RANDOM() * 50.0) * 0.28,
  15.0 + (RANDOM() * 35.0),
  85.0 + (RANDOM() * 15.0),
  180,
  'completed'
FROM vehicles v
CROSS JOIN generate_series(1, 4) n
LEFT JOIN drivers d ON v.assigned_driver_id = d.user_id
WHERE v.tenant_id = :tenant_id AND v.fuel_type = 'Electric';

-- ============================================
-- 18. POLICIES
-- ============================================
INSERT INTO policies (tenant_id, policy_name, policy_type, description, rules, is_active, priority, created_by)
VALUES
  (:tenant_id, 'Speed Monitoring Policy', 'speed_limit',
   'Monitor and alert on speed limit violations',
   '{"conditions": [{"field": "speed", "operator": "exceeds", "value": "speed_limit", "tolerance": 7}], "actions": [{"type": "alert", "severity": "high"}]}'::jsonb,
   true, 1,
   (SELECT id FROM users WHERE tenant_id = :tenant_id AND role = 'admin' LIMIT 1)),

  (:tenant_id, 'Idle Time Management', 'idle_time',
   'Alert when vehicle idles excessively',
   '{"conditions": [{"field": "idle_time", "operator": "greater_than", "value": 900}], "actions": [{"type": "alert", "severity": "medium"}]}'::jsonb,
   true, 2,
   (SELECT id FROM users WHERE tenant_id = :tenant_id AND role = 'admin' LIMIT 1)),

  (:tenant_id, 'Preventive Maintenance Alert', 'maintenance',
   'Alert when maintenance is approaching',
   '{"conditions": [{"field": "miles_to_service", "operator": "less_than", "value": 750}], "actions": [{"type": "notification", "severity": "high"}]}'::jsonb,
   true, 3,
   (SELECT id FROM users WHERE tenant_id = :tenant_id AND role = 'fleet_manager' LIMIT 1));

-- ============================================
-- 19. NOTIFICATIONS
-- ============================================
INSERT INTO notifications (tenant_id, user_id, notification_type, title, message, link, is_read, priority)
SELECT
  :tenant_id,
  u.id,
  ARRAY['alert', 'reminder', 'info'][1 + floor(random() * 3)::int],
  ARRAY[
    'Scheduled Maintenance Alert',
    'Work Order Update',
    'Safety Compliance Notice',
    'Route Assignment',
    'Fuel Transaction Alert',
    'Inspection Reminder',
    'Vehicle Status Change'
  ][1 + floor(random() * 7)::int],
  ARRAY[
    'Vehicle maintenance is due soon',
    'Your assigned work order status changed',
    'New safety incident requires attention',
    'You have been assigned to a new route',
    'Recent fuel transaction recorded',
    'Pre-trip inspection required',
    'Vehicle status updated'
  ][1 + floor(random() * 7)::int],
  '/fleet/dashboard',
  random() > 0.4,
  ARRAY['normal', 'high', 'normal', 'low', 'normal'][1 + floor(random() * 5)::int]
FROM users u
CROSS JOIN generate_series(1, 4) n
WHERE u.tenant_id = :tenant_id
LIMIT 40;

-- ============================================
-- 20. TELEMETRY DATA
-- ============================================
INSERT INTO telemetry_data (
  tenant_id, vehicle_id, timestamp, latitude, longitude, speed, heading,
  odometer, engine_hours, fuel_level, engine_rpm, coolant_temp, oil_pressure,
  battery_voltage, harsh_braking, harsh_acceleration, speeding
)
SELECT
  :tenant_id,
  v.id,
  NOW() - (n * INTERVAL '10 minutes'),
  v.latitude + (RANDOM() * 0.015 - 0.0075),
  v.longitude + (RANDOM() * 0.015 - 0.0075),
  CASE WHEN v.status = 'active' THEN RANDOM() * 70 ELSE 0 END,
  RANDOM() * 360,
  v.odometer + (n * 0.8),
  v.engine_hours + (n * 0.015),
  45 + (RANDOM() * 55),
  CASE WHEN v.status = 'active' THEN 1400 + (RANDOM() * 2800)::INTEGER ELSE 0 END,
  175 + (RANDOM() * 35),
  28 + (RANDOM() * 25),
  12.3 + (RANDOM() * 2.2),
  random() > 0.93,
  random() > 0.95,
  random() > 0.88
FROM vehicles v
CROSS JOIN generate_series(1, 15) n
WHERE v.tenant_id = :tenant_id AND v.status = 'active'
LIMIT 300;

-- ============================================
-- SEED DATA SUMMARY
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '===================================';
  RAISE NOTICE 'DEV SEED DATA LOADED';
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
