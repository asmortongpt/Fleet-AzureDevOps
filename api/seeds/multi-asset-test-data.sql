-- ============================================
-- MULTI-ASSET TEST DATA SEED
-- Fleet Management System - Phase 5 Testing
-- Created: 2025-11-19
-- ============================================
-- This seed file creates test data for:
-- - 5 semi tractors
-- - 10 dry van trailers
-- - 3 excavators
-- - 2 bulldozers
-- - 2 forklifts
-- - 5 tractor-trailer combos (relationships)
-- ============================================

-- Get or create test tenant
DO $$
DECLARE
  v_tenant_id UUID;
  v_admin_user_id UUID;
  v_driver1_id UUID;
  v_driver2_id UUID;
  v_driver3_id UUID;
  v_facility_id UUID;

  -- Vehicle IDs
  v_tractor1_id UUID;
  v_tractor2_id UUID;
  v_tractor3_id UUID;
  v_tractor4_id UUID;
  v_tractor5_id UUID;

  v_trailer1_id UUID;
  v_trailer2_id UUID;
  v_trailer3_id UUID;
  v_trailer4_id UUID;
  v_trailer5_id UUID;
  v_trailer6_id UUID;
  v_trailer7_id UUID;
  v_trailer8_id UUID;
  v_trailer9_id UUID;
  v_trailer10_id UUID;

  v_excavator1_id UUID;
  v_excavator2_id UUID;
  v_excavator3_id UUID;

  v_bulldozer1_id UUID;
  v_bulldozer2_id UUID;

  v_forklift1_id UUID;
  v_forklift2_id UUID;

BEGIN
  -- ============================================
  -- 1. TENANT SETUP
  -- ============================================
  INSERT INTO tenants (name, domain, settings, is_active, created_at, updated_at)
  VALUES (
    'Multi-Asset Test Company',
    'multi-asset-test.local',
    '{"max_vehicles": 500, "max_drivers": 200, "features": ["gps", "maintenance", "fuel", "safety", "multi_asset", "equipment_tracking"]}'::jsonb,
    true,
    NOW() - INTERVAL '365 days',
    NOW()
  )
  ON CONFLICT (domain) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_tenant_id;

  RAISE NOTICE 'Created/Updated tenant: %', v_tenant_id;

  -- ============================================
  -- 2. USERS
  -- ============================================
  -- Admin user
  INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, created_at)
  VALUES (
    v_tenant_id,
    'admin@multi-asset-test.local',
    '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', -- password: "Test123!"
    'Test',
    'Administrator',
    '555-0100',
    'admin',
    true,
    NOW() - INTERVAL '365 days'
  )
  ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
  RETURNING id INTO v_admin_user_id;

  -- Driver users
  INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, created_at)
  VALUES
    (v_tenant_id, 'driver1@multi-asset-test.local', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'John', 'Driver', '555-0201', 'driver', true, NOW() - INTERVAL '180 days'),
    (v_tenant_id, 'driver2@multi-asset-test.local', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Jane', 'Smith', '555-0202', 'driver', true, NOW() - INTERVAL '180 days'),
    (v_tenant_id, 'driver3@multi-asset-test.local', '$2b$10$vI8aWBnW3fID.Z05SH4g/.c9LCvDvr2V8cQ6OwZULl7nj8HfQ4K0m', 'Mike', 'Johnson', '555-0203', 'driver', true, NOW() - INTERVAL '180 days')
  ON CONFLICT (email) DO UPDATE SET updated_at = NOW();

  SELECT id INTO v_driver1_id FROM users WHERE email = 'driver1@multi-asset-test.local';
  SELECT id INTO v_driver2_id FROM users WHERE email = 'driver2@multi-asset-test.local';
  SELECT id INTO v_driver3_id FROM users WHERE email = 'driver3@multi-asset-test.local';

  RAISE NOTICE 'Created users - Admin: %, Drivers: %, %, %', v_admin_user_id, v_driver1_id, v_driver2_id, v_driver3_id;

  -- ============================================
  -- 3. DRIVERS (Extended profiles)
  -- ============================================
  INSERT INTO drivers (tenant_id, user_id, license_number, license_state, license_expiration, cdl_class, cdl_endorsements, hire_date, status)
  VALUES
    (v_tenant_id, v_driver1_id, 'CDL-001-TEST', 'FL', NOW() + INTERVAL '2 years', 'A', ARRAY['H', 'N', 'T'], NOW() - INTERVAL '180 days', 'active'),
    (v_tenant_id, v_driver2_id, 'CDL-002-TEST', 'FL', NOW() + INTERVAL '2 years', 'A', ARRAY['H', 'N'], NOW() - INTERVAL '180 days', 'active'),
    (v_tenant_id, v_driver3_id, 'OPR-003-TEST', 'FL', NOW() + INTERVAL '2 years', 'B', ARRAY['P'], NOW() - INTERVAL '180 days', 'active')
  ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW();

  -- ============================================
  -- 4. FACILITY
  -- ============================================
  INSERT INTO facilities (tenant_id, name, type, address, city, state, zip, created_at)
  VALUES (
    v_tenant_id,
    'Main Depot',
    'depot',
    '1000 Fleet Drive',
    'Tampa',
    'FL',
    '33602',
    NOW() - INTERVAL '365 days'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_facility_id;

  IF v_facility_id IS NULL THEN
    SELECT id INTO v_facility_id FROM facilities WHERE tenant_id = v_tenant_id LIMIT 1;
  END IF;

  RAISE NOTICE 'Facility: %', v_facility_id;

  -- ============================================
  -- 5. SEMI TRACTORS (5 units)
  -- ============================================
  INSERT INTO vehicles (
    tenant_id, vin, make, model, year, status,
    asset_category, asset_type, power_type, primary_metric,
    odometer, engine_hours, fuel_type, license_plate,
    operational_status, requires_cdl, is_road_legal,
    location_id, assigned_driver_id, created_at
  ) VALUES
  (
    v_tenant_id, '1XKYD49X5RJ123456', 'Kenworth', 'T680', 2022, 'active',
    'TRACTOR', 'SEMI_TRACTOR', 'SELF_POWERED', 'ODOMETER',
    125000, 6200, 'diesel', 'TRC-001',
    'IN_USE', true, true,
    v_facility_id, v_driver1_id, NOW() - INTERVAL '300 days'
  ),
  (
    v_tenant_id, '1XKYD49X5RJ123457', 'Peterbilt', '579', 2021, 'active',
    'TRACTOR', 'SEMI_TRACTOR', 'SELF_POWERED', 'ODOMETER',
    145000, 7300, 'diesel', 'TRC-002',
    'IN_USE', true, true,
    v_facility_id, v_driver2_id, NOW() - INTERVAL '400 days'
  ),
  (
    v_tenant_id, '1XKYD49X5RJ123458', 'Freightliner', 'Cascadia', 2023, 'active',
    'TRACTOR', 'SLEEPER_CAB_TRACTOR', 'SELF_POWERED', 'ODOMETER',
    45000, 2200, 'diesel', 'TRC-003',
    'AVAILABLE', true, true,
    v_facility_id, NULL, NOW() - INTERVAL '100 days'
  ),
  (
    v_tenant_id, '1XKYD49X5RJ123459', 'Volvo', 'VNL 760', 2022, 'active',
    'TRACTOR', 'SLEEPER_CAB_TRACTOR', 'SELF_POWERED', 'ODOMETER',
    98000, 4900, 'diesel', 'TRC-004',
    'AVAILABLE', true, true,
    v_facility_id, NULL, NOW() - INTERVAL '250 days'
  ),
  (
    v_tenant_id, '1XKYD49X5RJ123460', 'Mack', 'Anthem', 2020, 'active',
    'TRACTOR', 'DAY_CAB_TRACTOR', 'SELF_POWERED', 'ODOMETER',
    210000, 10500, 'diesel', 'TRC-005',
    'MAINTENANCE', true, true,
    v_facility_id, NULL, NOW() - INTERVAL '500 days'
  )
  RETURNING id INTO v_tractor1_id, v_tractor2_id, v_tractor3_id, v_tractor4_id, v_tractor5_id;

  -- Get individual tractor IDs
  SELECT id INTO v_tractor1_id FROM vehicles WHERE vin = '1XKYD49X5RJ123456';
  SELECT id INTO v_tractor2_id FROM vehicles WHERE vin = '1XKYD49X5RJ123457';
  SELECT id INTO v_tractor3_id FROM vehicles WHERE vin = '1XKYD49X5RJ123458';
  SELECT id INTO v_tractor4_id FROM vehicles WHERE vin = '1XKYD49X5RJ123459';
  SELECT id INTO v_tractor5_id FROM vehicles WHERE vin = '1XKYD49X5RJ123460';

  RAISE NOTICE 'Created 5 semi tractors';

  -- ============================================
  -- 6. DRY VAN TRAILERS (10 units)
  -- ============================================
  INSERT INTO vehicles (
    tenant_id, vin, make, model, year, status,
    asset_category, asset_type, power_type, primary_metric,
    license_plate, operational_status, is_road_legal,
    axle_count, max_payload_kg, location_id, created_at
  ) VALUES
  (
    v_tenant_id, '1GRAA0621XB123001', 'Great Dane', 'Everest', 2021, 'active',
    'TRAILER', 'DRY_VAN_TRAILER', 'TOWED', 'CALENDAR',
    'TRL-001', 'IN_USE', true,
    2, 20000, v_facility_id, NOW() - INTERVAL '350 days'
  ),
  (
    v_tenant_id, '1GRAA0621XB123002', 'Great Dane', 'Everest', 2021, 'active',
    'TRAILER', 'DRY_VAN_TRAILER', 'TOWED', 'CALENDAR',
    'TRL-002', 'IN_USE', true,
    2, 20000, v_facility_id, NOW() - INTERVAL '350 days'
  ),
  (
    v_tenant_id, '1GRAA0621XB123003', 'Utility', '3000R', 2022, 'active',
    'TRAILER', 'DRY_VAN_TRAILER', 'TOWED', 'CALENDAR',
    'TRL-003', 'AVAILABLE', true,
    2, 20000, v_facility_id, NOW() - INTERVAL '200 days'
  ),
  (
    v_tenant_id, '1GRAA0621XB123004', 'Utility', '3000R', 2022, 'active',
    'TRAILER', 'DRY_VAN_TRAILER', 'TOWED', 'CALENDAR',
    'TRL-004', 'AVAILABLE', true,
    2, 20000, v_facility_id, NOW() - INTERVAL '200 days'
  ),
  (
    v_tenant_id, '1GRAA0621XB123005', 'Wabash', 'DuraPlate', 2023, 'active',
    'TRAILER', 'DRY_VAN_TRAILER', 'TOWED', 'CALENDAR',
    'TRL-005', 'AVAILABLE', true,
    2, 22000, v_facility_id, NOW() - INTERVAL '150 days'
  ),
  (
    v_tenant_id, '1GRAA0621XB123006', 'Wabash', 'DuraPlate', 2023, 'active',
    'TRAILER', 'DRY_VAN_TRAILER', 'TOWED', 'CALENDAR',
    'TRL-006', 'IN_USE', true,
    2, 22000, v_facility_id, NOW() - INTERVAL '150 days'
  ),
  (
    v_tenant_id, '1GRAA0621XB123007', 'Hyundai', 'Translead', 2020, 'active',
    'TRAILER', 'DRY_VAN_TRAILER', 'TOWED', 'CALENDAR',
    'TRL-007', 'IN_USE', true,
    2, 19000, v_facility_id, NOW() - INTERVAL '400 days'
  ),
  (
    v_tenant_id, '1GRAA0621XB123008', 'Hyundai', 'Translead', 2020, 'active',
    'TRAILER', 'DRY_VAN_TRAILER', 'TOWED', 'CALENDAR',
    'TRL-008', 'AVAILABLE', true,
    2, 19000, v_facility_id, NOW() - INTERVAL '400 days'
  ),
  (
    v_tenant_id, '1GRAA0621XB123009', 'Great Dane', 'Champion', 2019, 'active',
    'TRAILER', 'DRY_VAN_TRAILER', 'TOWED', 'CALENDAR',
    'TRL-009', 'AVAILABLE', true,
    2, 18500, v_facility_id, NOW() - INTERVAL '500 days'
  ),
  (
    v_tenant_id, '1GRAA0621XB123010', 'Great Dane', 'Champion', 2019, 'active',
    'TRAILER', 'DRY_VAN_TRAILER', 'TOWED', 'CALENDAR',
    'TRL-010', 'MAINTENANCE', true,
    2, 18500, v_facility_id, NOW() - INTERVAL '500 days'
  );

  -- Get trailer IDs
  SELECT id INTO v_trailer1_id FROM vehicles WHERE vin = '1GRAA0621XB123001';
  SELECT id INTO v_trailer2_id FROM vehicles WHERE vin = '1GRAA0621XB123002';
  SELECT id INTO v_trailer3_id FROM vehicles WHERE vin = '1GRAA0621XB123003';
  SELECT id INTO v_trailer4_id FROM vehicles WHERE vin = '1GRAA0621XB123004';
  SELECT id INTO v_trailer5_id FROM vehicles WHERE vin = '1GRAA0621XB123005';
  SELECT id INTO v_trailer6_id FROM vehicles WHERE vin = '1GRAA0621XB123006';
  SELECT id INTO v_trailer7_id FROM vehicles WHERE vin = '1GRAA0621XB123007';
  SELECT id INTO v_trailer8_id FROM vehicles WHERE vin = '1GRAA0621XB123008';
  SELECT id INTO v_trailer9_id FROM vehicles WHERE vin = '1GRAA0621XB123009';
  SELECT id INTO v_trailer10_id FROM vehicles WHERE vin = '1GRAA0621XB123010';

  RAISE NOTICE 'Created 10 dry van trailers';

  -- ============================================
  -- 7. EXCAVATORS (3 units)
  -- ============================================
  INSERT INTO vehicles (
    tenant_id, vin, make, model, year, status,
    asset_category, asset_type, power_type, primary_metric,
    engine_hours, pto_hours, aux_hours, fuel_type,
    operational_status, is_road_legal, is_off_road_only,
    capacity_tons, max_reach_feet, bucket_capacity_yards,
    operating_weight_lbs, has_pto, has_aux_power,
    location_id, last_metric_update, created_at
  ) VALUES
  (
    v_tenant_id, 'CAT320GC12345678', 'Caterpillar', '320 GC', 2021, 'active',
    'HEAVY_EQUIPMENT', 'EXCAVATOR', 'SELF_POWERED', 'ENGINE_HOURS',
    3245.5, 1823.2, 456.8, 'diesel',
    'IN_USE', false, true,
    20, 29.2, 1.3,
    44000, true, true,
    v_facility_id, NOW() - INTERVAL '2 days', NOW() - INTERVAL '300 days'
  ),
  (
    v_tenant_id, 'KOM220LC98765432', 'Komatsu', 'PC220LC-11', 2022, 'active',
    'HEAVY_EQUIPMENT', 'EXCAVATOR', 'SELF_POWERED', 'ENGINE_HOURS',
    1856.3, 978.5, 234.1, 'diesel',
    'AVAILABLE', false, true,
    22, 30.5, 1.4,
    48000, true, true,
    v_facility_id, NOW() - INTERVAL '1 day', NOW() - INTERVAL '200 days'
  ),
  (
    v_tenant_id, 'VOL240BL11223344', 'Volvo', 'EC240BL', 2020, 'active',
    'HEAVY_EQUIPMENT', 'EXCAVATOR', 'SELF_POWERED', 'ENGINE_HOURS',
    5678.9, 3421.6, 892.4, 'diesel',
    'MAINTENANCE', false, true,
    24, 31.8, 1.5,
    52000, true, true,
    v_facility_id, NOW() - INTERVAL '5 days', NOW() - INTERVAL '450 days'
  );

  -- Get excavator IDs
  SELECT id INTO v_excavator1_id FROM vehicles WHERE vin = 'CAT320GC12345678';
  SELECT id INTO v_excavator2_id FROM vehicles WHERE vin = 'KOM220LC98765432';
  SELECT id INTO v_excavator3_id FROM vehicles WHERE vin = 'VOL240BL11223344';

  RAISE NOTICE 'Created 3 excavators';

  -- ============================================
  -- 8. BULLDOZERS (2 units)
  -- ============================================
  INSERT INTO vehicles (
    tenant_id, vin, make, model, year, status,
    asset_category, asset_type, power_type, primary_metric,
    engine_hours, pto_hours, fuel_type,
    operational_status, is_road_legal, is_off_road_only,
    operating_weight_lbs, has_pto,
    location_id, last_metric_update, created_at
  ) VALUES
  (
    v_tenant_id, 'CATD6T55667788', 'Caterpillar', 'D6T', 2021, 'active',
    'HEAVY_EQUIPMENT', 'BULLDOZER', 'SELF_POWERED', 'ENGINE_HOURS',
    2134.7, 876.3, 'diesel',
    'IN_USE', false, true,
    42000, true,
    v_facility_id, NOW() - INTERVAL '3 days', NOW() - INTERVAL '280 days'
  ),
  (
    v_tenant_id, 'KOMD65PX99887766', 'Komatsu', 'D65PX-18', 2022, 'active',
    'HEAVY_EQUIPMENT', 'BULLDOZER', 'SELF_POWERED', 'ENGINE_HOURS',
    1423.2, 567.8, 'diesel',
    'AVAILABLE', false, true,
    45000, true,
    v_facility_id, NOW() - INTERVAL '1 day', NOW() - INTERVAL '180 days'
  );

  -- Get bulldozer IDs
  SELECT id INTO v_bulldozer1_id FROM vehicles WHERE vin = 'CATD6T55667788';
  SELECT id INTO v_bulldozer2_id FROM vehicles WHERE vin = 'KOMD65PX99887766';

  RAISE NOTICE 'Created 2 bulldozers';

  -- ============================================
  -- 9. FORKLIFTS (2 units)
  -- ============================================
  INSERT INTO vehicles (
    tenant_id, vin, make, model, year, status,
    asset_category, asset_type, power_type, primary_metric,
    engine_hours, cycle_count, fuel_type,
    operational_status, is_road_legal, max_speed_kph,
    capacity_tons, lift_height_feet, operating_weight_lbs,
    location_id, last_metric_update, created_at
  ) VALUES
  (
    v_tenant_id, 'TOYOTA8FGU25001', 'Toyota', '8FGU25', 2020, 'active',
    'HEAVY_EQUIPMENT', 'FORKLIFT', 'SELF_POWERED', 'ENGINE_HOURS',
    4567.8, 23456, 'propane',
    'IN_USE', false, 15,
    2.5, 15.5, 8000,
    v_facility_id, NOW() - INTERVAL '6 hours', NOW() - INTERVAL '400 days'
  ),
  (
    v_tenant_id, 'CROWN5KCSP002', 'Crown', 'RC 5500', 2022, 'active',
    'HEAVY_EQUIPMENT', 'FORKLIFT', 'SELF_POWERED', 'ENGINE_HOURS',
    1234.5, 8934, 'electric',
    'AVAILABLE', false, 12,
    2.0, 12.0, 6500,
    v_facility_id, NOW() - INTERVAL '12 hours', NOW() - INTERVAL '150 days'
  );

  -- Get forklift IDs
  SELECT id INTO v_forklift1_id FROM vehicles WHERE vin = 'TOYOTA8FGU25001';
  SELECT id INTO v_forklift2_id FROM vehicles WHERE vin = 'CROWN5KCSP002';

  RAISE NOTICE 'Created 2 forklifts';

  -- ============================================
  -- 10. ASSET RELATIONSHIPS (5 tractor-trailer combos)
  -- ============================================
  -- Combo 1: Tractor 1 + Trailer 1 (currently active)
  INSERT INTO asset_relationships (
    parent_asset_id, child_asset_id, relationship_type,
    effective_from, effective_to, is_primary, created_by, notes
  ) VALUES (
    v_tractor1_id, v_trailer1_id, 'TOWS',
    NOW() - INTERVAL '30 days', NULL, true, v_admin_user_id,
    'Long-haul dedicated combo for Route 101'
  );

  -- Combo 2: Tractor 2 + Trailer 2 (currently active)
  INSERT INTO asset_relationships (
    parent_asset_id, child_asset_id, relationship_type,
    effective_from, effective_to, is_primary, created_by, notes
  ) VALUES (
    v_tractor2_id, v_trailer2_id, 'TOWS',
    NOW() - INTERVAL '45 days', NULL, true, v_admin_user_id,
    'Regional delivery combo'
  );

  -- Combo 3: Tractor 2 + Trailer 6 (active, same tractor pulling second trailer at different time)
  INSERT INTO asset_relationships (
    parent_asset_id, child_asset_id, relationship_type,
    effective_from, effective_to, is_primary, created_by, notes
  ) VALUES (
    v_tractor2_id, v_trailer6_id, 'TOWS',
    NOW() - INTERVAL '10 days', NULL, false, v_admin_user_id,
    'Backup trailer for peak season'
  );

  -- Combo 4: Tractor 1 + Trailer 7 (historical - ended 20 days ago)
  INSERT INTO asset_relationships (
    parent_asset_id, child_asset_id, relationship_type,
    effective_from, effective_to, is_primary, created_by, notes
  ) VALUES (
    v_tractor1_id, v_trailer7_id, 'TOWS',
    NOW() - INTERVAL '60 days', NOW() - INTERVAL '20 days', true, v_admin_user_id,
    'Previous combo before switching to Trailer 1'
  );

  -- Combo 5: Tractor 3 + Trailer 3 (recently created, active)
  INSERT INTO asset_relationships (
    parent_asset_id, child_asset_id, relationship_type,
    effective_from, effective_to, is_primary, created_by, notes
  ) VALUES (
    v_tractor3_id, v_trailer3_id, 'TOWS',
    NOW() - INTERVAL '5 days', NULL, true, v_admin_user_id,
    'New combo for expansion routes'
  );

  RAISE NOTICE 'Created 5 tractor-trailer relationships (4 active, 1 historical)';

  -- ============================================
  -- 11. MAINTENANCE SCHEDULES (Multi-Metric)
  -- ============================================
  -- Engine hours-based maintenance for Excavator 1
  INSERT INTO maintenance_schedules (
    vehicle_id, service_type, trigger_metric, interval_type, interval_value,
    last_service_engine_hours, next_service_due_engine_hours,
    is_active, created_at
  ) VALUES (
    v_excavator1_id, 'Oil Change', 'ENGINE_HOURS', 'hours', 250,
    3000, 3250,
    true, NOW() - INTERVAL '100 days'
  );

  -- PTO hours-based maintenance for Excavator 1
  INSERT INTO maintenance_schedules (
    vehicle_id, service_type, trigger_metric, interval_type, interval_value,
    last_service_pto_hours, next_service_due_pto_hours,
    is_active, created_at
  ) VALUES (
    v_excavator1_id, 'Hydraulic Service', 'PTO_HOURS', 'hours', 500,
    1500, 2000,
    true, NOW() - INTERVAL '100 days'
  );

  -- Engine hours maintenance for Bulldozer 1
  INSERT INTO maintenance_schedules (
    vehicle_id, service_type, trigger_metric, interval_type, interval_value,
    last_service_engine_hours, next_service_due_engine_hours,
    is_active, created_at
  ) VALUES (
    v_bulldozer1_id, 'Filter Replacement', 'ENGINE_HOURS', 'hours', 500,
    2000, 2500,
    true, NOW() - INTERVAL '50 days'
  );

  -- Cycle-based maintenance for Forklift 1
  INSERT INTO maintenance_schedules (
    vehicle_id, service_type, trigger_metric, interval_type, interval_value,
    last_service_cycles, next_service_due_cycles,
    is_active, created_at
  ) VALUES (
    v_forklift1_id, 'Fork Inspection', 'CYCLES', 'cycles', 5000,
    20000, 25000,
    true, NOW() - INTERVAL '30 days'
  );

  -- Calendar-based maintenance for Trailer 1
  INSERT INTO maintenance_schedules (
    vehicle_id, service_type, trigger_metric, interval_type, interval_value,
    last_service_date, next_service_due_date,
    is_active, created_at
  ) VALUES (
    v_trailer1_id, 'Annual DOT Inspection', 'CALENDAR', 'days', 365,
    NOW() - INTERVAL '340 days', NOW() + INTERVAL '25 days',
    true, NOW() - INTERVAL '340 days'
  );

  -- Odometer-based maintenance for Tractor 1
  INSERT INTO maintenance_schedules (
    vehicle_id, service_type, trigger_metric, interval_type, interval_value,
    last_service_odometer, next_service_due_odometer,
    is_active, created_at
  ) VALUES (
    v_tractor1_id, 'Oil Change', 'ODOMETER', 'miles', 15000,
    120000, 135000,
    true, NOW() - INTERVAL '60 days'
  );

  RAISE NOTICE 'Created 6 maintenance schedules with different trigger metrics';

  -- ============================================
  -- 12. TELEMETRY DATA (Equipment)
  -- ============================================
  -- Recent telemetry for Excavator 1
  INSERT INTO telemetry_equipment_events (
    vehicle_id, event_time, engine_hours, pto_hours, aux_hours,
    hydraulic_pressure_bar, fuel_level_percent, coolant_temp_celsius,
    operator_id, job_site
  ) VALUES
  (v_excavator1_id, NOW() - INTERVAL '2 days', 3245.5, 1823.2, 456.8, 245, 67, 82, v_driver3_id, 'Highway 75 Expansion'),
  (v_excavator1_id, NOW() - INTERVAL '1 day', 3253.2, 1827.8, 458.3, 238, 45, 79, v_driver3_id, 'Highway 75 Expansion'),
  (v_excavator1_id, NOW() - INTERVAL '6 hours', 3258.7, 1830.4, 459.1, 242, 88, 81, v_driver3_id, 'Highway 75 Expansion');

  -- Recent telemetry for Bulldozer 1
  INSERT INTO telemetry_equipment_events (
    vehicle_id, event_time, engine_hours, pto_hours,
    fuel_level_percent, coolant_temp_celsius,
    operator_id, job_site
  ) VALUES
  (v_bulldozer1_id, NOW() - INTERVAL '3 days', 2134.7, 876.3, 72, 86, v_driver3_id, 'Site Clearing Project'),
  (v_bulldozer1_id, NOW() - INTERVAL '1 day', 2142.3, 879.8, 53, 84, v_driver3_id, 'Site Clearing Project');

  -- Recent telemetry for Forklift 1
  INSERT INTO telemetry_equipment_events (
    vehicle_id, event_time, engine_hours, cycle_count,
    fuel_level_percent, load_weight_kg
  ) VALUES
  (v_forklift1_id, NOW() - INTERVAL '6 hours', 4567.8, 23456, 45, 1800),
  (v_forklift1_id, NOW() - INTERVAL '3 hours', 4569.2, 23489, 38, 2100),
  (v_forklift1_id, NOW() - INTERVAL '1 hour', 4570.1, 23512, 32, 1650);

  RAISE NOTICE 'Created telemetry data for equipment';

  -- ============================================
  -- SUMMARY
  -- ============================================
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MULTI-ASSET TEST DATA SEED COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tenant ID: %', v_tenant_id;
  RAISE NOTICE 'Admin User: admin@multi-asset-test.local (password: Test123!)';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Assets Created:';
  RAISE NOTICE '  - 5 Semi Tractors (2 IN_USE, 2 AVAILABLE, 1 MAINTENANCE)';
  RAISE NOTICE '  - 10 Dry Van Trailers (4 IN_USE, 5 AVAILABLE, 1 MAINTENANCE)';
  RAISE NOTICE '  - 3 Excavators (1 IN_USE, 1 AVAILABLE, 1 MAINTENANCE)';
  RAISE NOTICE '  - 2 Bulldozers (1 IN_USE, 1 AVAILABLE)';
  RAISE NOTICE '  - 2 Forklifts (1 IN_USE, 1 AVAILABLE)';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Asset Relationships:';
  RAISE NOTICE '  - 5 tractor-trailer combos created';
  RAISE NOTICE '  - 4 currently active';
  RAISE NOTICE '  - 1 historical (ended)';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Maintenance Schedules:';
  RAISE NOTICE '  - 6 schedules with different trigger metrics:';
  RAISE NOTICE '    * ODOMETER (Tractor)';
  RAISE NOTICE '    * ENGINE_HOURS (Excavator, Bulldozer)';
  RAISE NOTICE '    * PTO_HOURS (Excavator)';
  RAISE NOTICE '    * CYCLES (Forklift)';
  RAISE NOTICE '    * CALENDAR (Trailer)';
  RAISE NOTICE '========================================';

END $$;
