-- ============================================================================
-- COMPREHENSIVE EDGE CASE TEST DATA SEEDER (SQL)
-- This script adds all missing enum values and edge cases to achieve 100% coverage
-- ============================================================================

-- Get tenant ID (assuming single tenant for now)
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
  -- VEHICLES - Missing statuses and types
  -- ============================================================================

  -- Inactive vehicle
  INSERT INTO vehicles (id, tenant_id, vin, make, model, year, license_plate, vehicle_type, fuel_type, status, notes, created_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'TEST_INACTIVE001', 'Ford', 'Sedan', 2020, 'TST001', 'Sedan', 'Gasoline', 'inactive', 'Inactive test vehicle', NOW())
  ON CONFLICT (vin) DO NOTHING;

  -- Decommissioned vehicle
  INSERT INTO vehicles (id, tenant_id, vin, make, model, year, license_plate, vehicle_type, fuel_type, status, notes, created_at)
  VALUES (gen_random_uuid(), v_tenant_id, 'TEST_DECOMM002', 'Chevrolet', 'SUV', 2015, 'TST002', 'SUV', 'Gasoline', 'retired', 'Decommissioned test vehicle', NOW())
  ON CONFLICT (vin) DO NOTHING;

  -- Missing vehicle types
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
    (gen_random_uuid(), v_tenant_id, 'TEST_PROPANE001', 'Ford', 'E350', 2020, 'Van', 'Propane', 'active', 'Propane-powered van', NOW()),
    (gen_random_uuid(), v_tenant_id, 'TEST_CNG001', 'Chevrolet', 'Express', 2021, 'Van', 'CNG', 'active', 'CNG vehicle', NOW())
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
  -- USERS - Missing roles and statuses
  -- ============================================================================

  INSERT INTO users (id, tenant_id, email, password_hash, name, role, created_at)
  VALUES
    (gen_random_uuid(), v_tenant_id, 'dispatcher@test.com', '$2b$10$dummy.hash', 'Test Dispatcher', 'dispatcher', NOW()),
    (gen_random_uuid(), v_tenant_id, 'viewer@test.com', '$2b$10$dummy.hash', 'Test Viewer', 'viewer', NOW()),
    (gen_random_uuid(), v_tenant_id, 'accountant@test.com', '$2b$10$dummy.hash', 'Test Accountant', 'accountant', NOW()),
    (gen_random_uuid(), v_tenant_id, 'safety@test.com', '$2b$10$dummy.hash', 'Test Safety Manager', 'safety_manager', NOW())
  ON CONFLICT (email) DO NOTHING;

  -- ============================================================================
  -- WORK ORDERS - Missing statuses and types
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
  -- ROUTES - Missing statuses
  -- ============================================================================

  SELECT id INTO v_driver_id FROM users WHERE role = 'driver' LIMIT 1;

  IF v_vehicle_id IS NOT NULL AND v_driver_id IS NOT NULL THEN
    -- Scheduled route
    INSERT INTO routes (id, tenant_id, vehicle_id, driver_id, route_name, status, start_location, end_location, start_time, notes, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_driver_id, 'Future Scheduled Route', 'scheduled', 'Warehouse A', 'Customer B', NOW() + INTERVAL '2 days', 'Scheduled for future', NOW())
    ON CONFLICT DO NOTHING;

    -- Delayed route
    INSERT INTO routes (id, tenant_id, vehicle_id, driver_id, route_name, status, start_location, end_location, start_time, notes, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_driver_id, 'Delayed Route', 'delayed', 'Warehouse A', 'Customer B', NOW() - INTERVAL '2 hours', 'Traffic delay', NOW())
    ON CONFLICT DO NOTHING;

    -- Failed route
    INSERT INTO routes (id, tenant_id, vehicle_id, driver_id, route_name, status, start_location, end_location, start_time, notes, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_driver_id, 'Failed Route', 'failed', 'Warehouse A', 'Customer B', NOW() - INTERVAL '1 day', 'Vehicle breakdown', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- INSPECTIONS - Missing types and statuses
  -- ============================================================================

  IF v_vehicle_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    INSERT INTO inspections (id, tenant_id, vehicle_id, inspector_id, inspection_type, inspection_date, status, notes, created_at)
    VALUES
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_user_id, 'annual', NOW() - INTERVAL '30 days', 'pass', 'Annual inspection passed', NOW()),
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_user_id, 'emissions', NOW() - INTERVAL '60 days', 'pass', 'Emissions test passed', NOW()),
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_user_id, 'brake', NOW() - INTERVAL '15 days', 'fail', 'Brake inspection failed', NOW()),
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_user_id, 'comprehensive', NOW() - INTERVAL '90 days', 'pass', 'Comprehensive inspection passed', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- SAFETY INCIDENTS - Missing types and severities
  -- ============================================================================

  IF v_vehicle_id IS NOT NULL AND v_driver_id IS NOT NULL THEN
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
  -- ============================================================================

  IF v_user_id IS NOT NULL THEN
    INSERT INTO notifications (id, tenant_id, user_id, notification_type, priority, title, message, is_read, created_at)
    VALUES
      (gen_random_uuid(), v_tenant_id, v_user_id, 'warning', 'urgent', 'Urgent Warning', 'This is an urgent warning notification', false, NOW()),
      (gen_random_uuid(), v_tenant_id, v_user_id, 'critical', 'critical', 'Critical Alert', 'This is a critical alert', false, NOW()),
      (gen_random_uuid(), v_tenant_id, v_user_id, 'system', 'normal', 'System Notification', 'System maintenance scheduled', false, NOW()),
      (gen_random_uuid(), v_tenant_id, v_user_id, 'maintenance', 'high', 'Maintenance Due', 'Vehicle maintenance is due', false, NOW()),
      (gen_random_uuid(), v_tenant_id, v_user_id, 'safety', 'critical', 'Safety Alert', 'Safety incident requires attention', false, NOW()),
      (gen_random_uuid(), v_tenant_id, v_user_id, 'compliance', 'high', 'Compliance Notice', 'Compliance deadline approaching', false, NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- FUEL TRANSACTIONS - Edge cases
  -- ============================================================================

  IF v_vehicle_id IS NOT NULL THEN
    -- $0 test transaction
    INSERT INTO fuel_transactions (id, tenant_id, vehicle_id, transaction_date, fuel_type, gallons, price_per_gallon, notes, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_vehicle_id, NOW() - INTERVAL '10 days', 'Diesel', 0, 0, 'Test transaction - $0', NOW())
    ON CONFLICT DO NOTHING;

    -- Bulk purchase >$5000
    INSERT INTO fuel_transactions (id, tenant_id, vehicle_id, transaction_date, fuel_type, gallons, price_per_gallon, notes, created_at)
    VALUES (gen_random_uuid(), v_tenant_id, v_vehicle_id, NOW() - INTERVAL '5 days', 'Diesel', 1500, 4.00, 'Bulk diesel purchase', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  -- ============================================================================
  -- CHARGING SESSIONS - Missing statuses
  -- ============================================================================

  SELECT id INTO v_station_id FROM charging_stations LIMIT 1;
  SELECT id INTO v_vehicle_id FROM vehicles WHERE fuel_type = 'Electric' LIMIT 1;

  IF v_station_id IS NOT NULL AND v_vehicle_id IS NOT NULL THEN
    INSERT INTO charging_sessions (id, tenant_id, vehicle_id, charging_station_id, start_time, status, start_battery_level, end_battery_level, energy_delivered_kwh, created_at)
    VALUES
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_station_id, NOW() - INTERVAL '2 hours', 'pending', 30, 30, 0, NOW()),
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_station_id, NOW() - INTERVAL '1 hour', 'charging', 40, 65, 15, NOW()),
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_station_id, NOW() - INTERVAL '3 hours', 'interrupted', 25, 45, 10, NOW()),
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_station_id, NOW() - INTERVAL '4 hours', 'failed', 20, 20, 0, NOW()),
      (gen_random_uuid(), v_tenant_id, v_vehicle_id, v_station_id, NOW() - INTERVAL '5 hours', 'cancelled', 35, 35, 0, NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'Edge case test data seeded successfully!';
END $$;
