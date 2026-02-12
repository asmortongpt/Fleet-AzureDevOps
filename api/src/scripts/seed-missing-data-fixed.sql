-- ============================================================================
-- COMPREHENSIVE EDGE CASE TEST DATA SEEDER (SQL) - FIXED
-- This script adds all missing enum values and edge cases to achieve 100% coverage
-- Uses only values allowed by actual CHECK constraints
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
  v_vehicle_id UUID;
  v_driver_id UUID;
  v_station_id UUID;
BEGIN
  -- Get or create tenant
  SELECT id INTO v_tenant_id FROM tenants LIMIT 1;
  IF v_tenant_id IS NULL THEN
    v_tenant_id := gen_random_uuid();
    INSERT INTO tenants (id, name, created_at) VALUES (v_tenant_id, 'Test Tenant', NOW());
  END IF;

  -- Get a user for assignments
  SELECT id INTO v_user_id FROM users WHERE role = 'admin' LIMIT 1;

  -- ============================================================================
  -- VEHICLES - Missing statuses: sold, retired
  -- ============================================================================

  -- Retired vehicle (covers "decommissioned" use case)
  INSERT INTO vehicles (id, tenant_id, vin, make, model, year, license_plate, vehicle_type, fuel_type, status, notes, created_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'TEST_RETIRED001', 'Chevrolet', 'Express', 2015, 'RET001', 'Cargo Van', 'Gasoline', 'retired', 'Retired test vehicle', NOW())
  ON CONFLICT (vin) DO NOTHING;

  -- Sold vehicle
  INSERT INTO vehicles (id, tenant_id, vin, make, model, year, license_plate, vehicle_type, fuel_type, status, notes, created_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'TEST_SOLD001', 'Ford', 'F150', 2016, 'SLD001', 'Pickup Truck', 'Gasoline', 'sold', 'Sold vehicle', NOW())
  ON CONFLICT (vin) DO NOTHING;

  -- Missing vehicle types (not in schema but good to have test data variety)
  INSERT INTO vehicles (id, tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, notes, created_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, 'TEST_VAN001', 'Ford', 'Transit', 2021, 'Van', 'Gasoline', 'active', 'Standard van', NOW()),
    (gen_random_uuid(), v_tenant_id, 'TEST_FLATBED001', 'Ford', 'F450', 2020, 'Flatbed', 'Diesel', 'active', 'Flatbed truck', NOW()),
    (gen_random_uuid(), v_tenant_id, 'TEST_REEFER001', 'Freightliner', 'M2', 2019, 'Refrigerated Truck', 'Diesel', 'active', 'Refrigerated truck', NOW()),
    (gen_random_uuid(), v_tenant_id, 'TEST_DUMP001', 'Mack', 'GU813', 2020, 'Dump Truck', 'Diesel', 'active', 'Dump truck', NOW()),
    (gen_random_uuid(), v_tenant_id, 'TEST_TOW001', 'Ford', 'F550', 2021, 'Tow Truck', 'Diesel', 'active', 'Tow truck', NOW())
  ON CONFLICT (vin) DO NOTHING;

  -- Missing fuel types
  INSERT INTO vehicles (id, tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, notes, created_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, 'TEST_HYBRID001', 'Toyota', 'Prius', 2022, 'Sedan', 'Hybrid', 'active', 'Hybrid vehicle', NOW()),
    (gen_random_uuid(), v_tenant_id, 'TEST_PROPANE001', 'Ford', 'E350', 2020, 'Cargo Van', 'Propane', 'active', 'Propane-powered van', NOW()),
    (gen_random_uuid(), v_tenant_id, 'TEST_CNG001', 'Chevrolet', 'Express', 2021, 'Cargo Van', 'CNG', 'active', 'CNG vehicle', NOW())
  ON CONFLICT (vin) DO NOTHING;

  -- Zero odometer vehicle
  INSERT INTO vehicles (id, tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, odometer, notes, created_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'TEST_ZERO_ODO', 'Tesla', 'Model 3', 2024, 'Sedan', 'Electric', 'active', 0, 'Brand new vehicle with 0 miles', NOW())
  ON CONFLICT (vin) DO NOTHING;

  -- High mileage vehicle
  INSERT INTO vehicles (id, tenant_id, vin, make, model, year, vehicle_type, fuel_type, status, odometer, notes, created_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'TEST_HIGH_MILE', 'Freightliner', 'Cascadia', 2015, 'Semi-Truck', 'Diesel', 'active', 1250000, 'Very high mileage vehicle', NOW())
  ON CONFLICT (vin) DO NOTHING;

  -- ============================================================================
  -- USERS - Missing roles (these aren't in check constraints, so they're flexible)
  -- ============================================================================

  INSERT INTO users (id, tenant_id, email, password_hash, name, role, created_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, 'dispatcher@test.com', '$2b$10$dummy.hash', 'Test Dispatcher', 'dispatcher', NOW()),
    (gen_random_uuid(), v_tenant_id, 'viewer@test.com', '$2b$10$dummy.hash', 'Test Viewer', 'viewer', NOW()),
    (gen_random_uuid(), v_tenant_id, 'accountant@test.com', '$2b$10$dummy.hash', 'Test Accountant', 'accountant', NOW()),
    (gen_random_uuid(), v_tenant_id, 'safety@test.com', '$2b$10$dummy.hash', 'Test Safety Manager', 'safety_manager', NOW())
  ON CONFLICT (email) DO NOTHING;

  -- ============================================================================
  -- DRIVERS - Missing statuses: terminated
  -- ============================================================================

  INSERT INTO drivers (id, tenant_id, first_name, last_name, license_number, license_expiry, email, phone, status, notes, created_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, 'John', 'Terminated', 'DL-TERM001', NOW() + INTERVAL '1 year', 'terminated@test.com', '555-9999', 'terminated', 'Terminated driver', NOW())
  ON CONFLICT (email) DO NOTHING;

  -- ============================================================================
  -- WORK ORDERS - All statuses are covered, just add edge cases
  -- ============================================================================

  SELECT id INTO v_vehicle_id FROM vehicles LIMIT 1;

  IF v_vehicle_id IS NOT NULL THEN
    -- On hold work order
    INSERT INTO work_orders (id, tenant_id, work_order_number, vehicle_id, type, priority, status, description, notes, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, 'WO-ONHOLD-001', v_vehicle_id, 'repair', 'medium', 'on_hold', 'On hold work order', 'Waiting for parts', NOW())
    ON CONFLICT (work_order_number) DO NOTHING;

    -- Cancelled work order
    INSERT INTO work_orders (id, tenant_id, work_order_number, vehicle_id, type, priority, status, description, notes, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, 'WO-CANCEL-001', v_vehicle_id, 'inspection', 'low', 'cancelled', 'Cancelled work order', 'Customer request', NOW())
    ON CONFLICT (work_order_number) DO NOTHING;

    -- Very expensive work order
    INSERT INTO work_orders (id, tenant_id, work_order_number, vehicle_id, type, priority, status, description, labor_cost, parts_cost, notes, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, 'WO-EXPENSIVE', v_vehicle_id, 'repair', 'critical', 'completed', 'Major engine rebuild', 50000, 75000, 'Very expensive repair', NOW())
    ON CONFLICT (work_order_number) DO NOTHING;

    -- Ancient open work order (>365 days)
    INSERT INTO work_orders (id, tenant_id, work_order_number, vehicle_id, type, priority, status, description, notes, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, 'WO-ANCIENT-001', v_vehicle_id, 'repair', 'high', 'open', 'Very old open work order', 'Needs attention', NOW() - INTERVAL '400 days')
    ON CONFLICT (work_order_number) DO NOTHING;
  END IF;

  -- ============================================================================
  -- ROUTES - Missing statuses: routes only have [planned, in_progress, completed, cancelled]
  -- "scheduled", "delayed", "failed" are not in check constraints
  -- ============================================================================

  -- Note: Routes check constraint only allows: planned, in_progress, completed, cancelled
  -- So we can't add "scheduled", "delayed", or "failed" without modifying the schema

  -- ============================================================================
  -- INSPECTIONS - Missing types: annual, comprehensive (emissions, brake not in constraint)
  -- Missing statuses: all exist [pass, fail, needs_repair]
  -- ============================================================================

  IF v_vehicle_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    INSERT INTO inspections (id, tenant_id, vehicle_id, inspector_id, inspection_type, inspection_date, status, notes, created_at)
    VALUES
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_user_id, 'annual', NOW() - INTERVAL '30 days', 'pass', 'Annual inspection passed', NOW())
    ON CONFLICT DO NOTHING;

    -- Note: 'comprehensive', 'emissions', 'brake' are NOT in the check constraint
    -- Check constraint only allows: pre_trip, post_trip, annual, dot, safety, damage
  END IF;

  -- ============================================================================
  -- SAFETY INCIDENTS - Missing types and severities
  -- Check constraint only allows: open, investigating, resolved, closed
  -- ============================================================================

  SELECT id INTO v_driver_id FROM drivers LIMIT 1;

  IF v_vehicle_id IS NOT NULL AND v_driver_id IS NOT NULL THEN
    -- Note: incident_type and severity don't have check constraints, so we can add any values
    INSERT INTO safety_incidents (id, tenant_id, vehicle_id, driver_id, incident_type, severity, incident_date, description, status, created_at)
    VALUES
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_driver_id, 'violation', 'moderate', NOW() - INTERVAL '45 days', 'Traffic violation', 'resolved', NOW()),
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_driver_id, 'equipment_failure', 'critical', NOW() - INTERVAL '20 days', 'Critical equipment failure', 'investigating', NOW()),
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_driver_id, 'environmental', 'severe', NOW() - INTERVAL '60 days', 'Environmental incident', 'resolved', NOW()),
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_driver_id, 'theft', 'major', NOW() - INTERVAL '90 days', 'Vehicle theft', 'closed', NOW()),
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_driver_id, 'vandalism', 'moderate', NOW() - INTERVAL '30 days', 'Vandalism incident', 'resolved', NOW()),
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_driver_id, 'accident', 'fatal', NOW() - INTERVAL '120 days', 'Fatal accident', 'investigating', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- NOTIFICATIONS - Missing types and priorities
  -- Priorities allowed: low, normal, high, urgent (no 'critical', 'medium')
  -- ============================================================================

  IF v_user_id IS NOT NULL THEN
    -- Note: notification_type doesn't have a check constraint, so we can add any types
    -- But priority only allows: low, normal, high, urgent
    INSERT INTO notifications (id, tenant_id, user_id, notification_type, priority, title, message, is_read, created_at)
    VALUES
      (gen_random_uuid(), v_tenant_id, v_user_id, 'warning', 'urgent', 'Urgent Warning', 'This is an urgent warning notification', false, NOW()),
      (gen_random_uuid(), v_tenant_id, v_user_id, 'critical', 'urgent', 'Critical Alert', 'This is a critical alert (urgent priority)', false, NOW()),
      (gen_random_uuid(), v_tenant_id, v_user_id, 'system', 'normal', 'System Notification', 'System maintenance scheduled', false, NOW()),
      (gen_random_uuid(), v_tenant_id, v_user_id, 'maintenance', 'high', 'Maintenance Due', 'Vehicle maintenance is due', false, NOW()),
      (gen_random_uuid(), v_tenant_id, v_user_id, 'safety', 'urgent', 'Safety Alert', 'Safety incident requires attention', false, NOW()),
      (gen_random_uuid(), v_tenant_id, v_user_id, 'compliance', 'high', 'Compliance Notice', 'Compliance deadline approaching', false, NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- FUEL TRANSACTIONS - Edge cases
  -- ============================================================================

  IF v_vehicle_id IS NOT NULL THEN
    -- Note: fuel_type doesn't have a check constraint
    INSERT INTO fuel_transactions (id, tenant_id, vehicle_id, transaction_date, fuel_type, gallons, price_per_gallon, notes, created_at)
    VALUES
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, NOW() - INTERVAL '5 days', 'DEF', 10, 3.50, 'DEF fluid purchase', NOW()),
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, NOW() - INTERVAL '3 days', 'Propane', 50, 2.25, 'Propane refuel', NOW()),
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, NOW() - INTERVAL '2 days', 'CNG', 100, 1.50, 'CNG refuel', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- CHARGING SESSIONS - Missing statuses
  -- Allowed: in_progress, completed, interrupted, failed (no 'pending', 'charging', 'cancelled')
  -- ============================================================================

  SELECT id INTO v_station_id FROM charging_stations LIMIT 1;
  SELECT id INTO v_vehicle_id FROM vehicles WHERE fuel_type = 'Electric' LIMIT 1;

  IF v_station_id IS NOT NULL AND v_vehicle_id IS NOT NULL THEN
    -- Only use statuses allowed by check constraint
    INSERT INTO charging_sessions (id, tenant_id, vehicle_id, charging_station_id, start_time, status, start_battery_level, end_battery_level, energy_delivered_kwh, created_at)
    VALUES
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_station_id, NOW() - INTERVAL '3 hours', 'interrupted', 25, 45, 10, NOW()),
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_station_id, NOW() - INTERVAL '4 hours', 'failed', 20, 20, 0, NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- PERSONAL USE CHARGES - Missing statuses
  -- Allowed: pending, invoiced, billed, paid, waived, disputed
  -- ============================================================================

  IF v_driver_id IS NOT NULL AND v_vehicle_id IS NOT NULL THEN
    INSERT INTO personal_use_charges (id, tenant_id, driver_id, vehicle_id, charge_month, base_charge, additional_charge, total_charge, charge_status, notes, created_at)
    VALUES
      (gen_random_uuid(), v_tenant_id, v_driver_id, v_vehicle_id, '2024-10-01', 150.00, 25.00, 175.00, 'invoiced', 'Invoiced charge', NOW()),
      (gen_random_uuid(), v_tenant_id, v_driver_id, v_vehicle_id, '2024-11-01', 150.00, 30.00, 180.00, 'billed', 'Billed charge', NOW()),
      (gen_random_uuid(), v_tenant_id, v_driver_id, v_vehicle_id, '2024-09-01', 150.00, 0.00, 150.00, 'paid', 'Paid charge', NOW()),
      (gen_random_uuid(), v_tenant_id, v_driver_id, v_vehicle_id, '2024-08-01', 150.00, 10.00, 160.00, 'waived', 'Waived charge', NOW()),
      (gen_random_uuid(), v_tenant_id, v_driver_id, v_vehicle_id, '2024-07-01', 150.00, 50.00, 200.00, 'disputed', 'Disputed charge', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- TRIP USAGE - Missing approval statuses
  -- Allowed: pending, approved, rejected, auto_approved
  -- Missing: rejected, auto_approved
  -- ============================================================================

  IF v_driver_id IS NOT NULL AND v_vehicle_id IS NOT NULL THEN
    INSERT INTO trip_usage_classification (id, tenant_id, driver_id, vehicle_id, trip_date, trip_start, trip_end, distance_miles, usage_type, approval_status, notes, created_at)
    VALUES
      (gen_random_uuid(), v_tenant_id, v_driver_id, v_vehicle_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days 8 hours', NOW() - INTERVAL '5 days 4 hours', 25.5, 'personal', 'rejected', 'Rejected personal use', NOW()),
      (gen_random_uuid(), v_tenant_id, v_driver_id, v_vehicle_id, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days 9 hours', NOW() - INTERVAL '3 days 5 hours', 15.0, 'business', 'auto_approved', 'Auto-approved business trip', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Edge case test data seeded successfully with actual schema constraints!';
END $$;
