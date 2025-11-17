-- Capital Tech Alliance - Part 3: Vendors, Work Orders, Maintenance, Operations
-- Continuation of seed data script

-- ============================================
-- Vendors
-- ============================================
INSERT INTO vendors (id, tenant_id, vendor_name, vendor_type, contact_name, contact_email, contact_phone, address, city, state, zip_code, is_active, created_at)
VALUES
    ('a0000000-0000-0000-0006-000000000001'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Tallahassee Auto Parts Supply', 'parts_supplier', 'Mark Johnson', 'mark@taparts.com', '(850) 555-3001',
     '2150 Apalachee Parkway', 'Tallahassee', 'FL', '32301', true, NOW() - INTERVAL '2 years'),

    ('a0000000-0000-0000-0006-000000000002'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Capital Tire & Service', 'service_provider', 'Lisa Martinez', 'lisa@capitaltire.com', '(850) 555-3002',
     '3500 North Monroe Street', 'Tallahassee', 'FL', '32303', true, NOW() - INTERVAL '2 years'),

    ('a0000000-0000-0000-0006-000000000003'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Gulf Coast Fuel Services', 'fuel_provider', 'Robert Williams', 'robert@gulfcoastfuel.com', '(850) 555-3003',
     '1200 Industrial Boulevard', 'Tallahassee', 'FL', '32304', true, NOW() - INTERVAL '2 years'),

    ('a0000000-0000-0000-0006-000000000004'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Precision Diesel Repair', 'service_provider', 'James Thompson', 'james@precisiondiesel.com', '(850) 555-3004',
     '4800 Capital Circle SW', 'Tallahassee', 'FL', '32310', true, NOW() - INTERVAL '18 months'),

    ('a0000000-0000-0000-0006-000000000005'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Florida Fleet Equipment', 'parts_supplier', 'Patricia Davis', 'patricia@flfleetequip.com', '(850) 555-3005',
     '5200 West Tennessee Street', 'Tallahassee', 'FL', '32304', true, NOW() - INTERVAL '1 year'),

    ('a0000000-0000-0000-0006-000000000006'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'TLH Collision Center', 'service_provider', 'Michael Chen', 'michael@tlhcollision.com', '(850) 555-3006',
     '2800 South Monroe Street', 'Tallahassee', 'FL', '32301', true, NOW() - INTERVAL '1 year'),

    ('a0000000-0000-0000-0006-000000000007'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Electric Vehicle Charging Network', 'service_provider', 'Sarah Lee', 'sarah@evcharge.com', '(850) 555-3007',
     '3200 Capital Circle NE', 'Tallahassee', 'FL', '32308', true, NOW() - INTERVAL '6 months'),

    ('a0000000-0000-0000-0006-000000000008'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Heavy Equipment Maintenance LLC', 'service_provider', 'David Anderson', 'david@hemaintenance.com', '(850) 555-3008',
     '6100 Mahan Drive', 'Tallahassee', 'FL', '32308', true, NOW() - INTERVAL '3 years');

-- ============================================
-- Work Orders (Sample - 20 work orders covering various vehicles and types)
-- ============================================
INSERT INTO work_orders (id, tenant_id, work_order_number, vehicle_id, facility_id, assigned_technician_id,
                         type, priority, status, description, odometer_reading, engine_hours_reading,
                         scheduled_start, scheduled_end, actual_start, actual_end, labor_hours, labor_cost, parts_cost,
                         created_by, created_at)
VALUES
    ('a0000000-0000-0000-0007-000000000001'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'WO-2024-001', 'a0000000-0000-0000-0005-000000000001'::UUID, 'a0000000-0000-0000-0003-000000000001'::UUID,
     'a0000000-0000-0000-0001-000000000004'::UUID, 'preventive', 'medium', 'completed',
     'Regular maintenance - oil change, tire rotation, brake inspection', 12000.0, 0,
     '2024-10-15', '2024-10-15', NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '3 weeks' + INTERVAL '2 hours',
     2.0, 120.00, 85.50, 'a0000000-0000-0000-0001-000000000002'::UUID, NOW() - INTERVAL '4 weeks'),

    ('a0000000-0000-0000-0007-000000000002'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'WO-2024-002', 'a0000000-0000-0000-0005-000000000016'::UUID, 'a0000000-0000-0000-0003-000000000001'::UUID,
     'a0000000-0000-0000-0001-000000000005'::UUID, 'corrective', 'high', 'completed',
     'Check engine light - replace O2 sensor', 7100.0, 0,
     '2024-10-18', '2024-10-18', NOW() - INTERVAL '2.5 weeks', NOW() - INTERVAL '2.5 weeks' + INTERVAL '3 hours',
     3.0, 180.00, 245.00, 'a0000000-0000-0000-0001-000000000002'::UUID, NOW() - INTERVAL '3 weeks'),

    ('a0000000-0000-0000-0007-000000000003'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'WO-2024-003', 'a0000000-0000-0000-0005-000000000046'::UUID, 'a0000000-0000-0000-0003-000000000001'::UUID,
     'a0000000-0000-0000-0001-000000000004'::UUID, 'preventive', 'high', 'completed',
     'Heavy equipment - 500 hour service, hydraulic fluid change, filter replacements', 1200.0, 3200.0,
     '2024-10-20', '2024-10-21', NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '2 weeks' + INTERVAL '6 hours',
     6.0, 360.00, 685.00, 'a0000000-0000-0000-0001-000000000002'::UUID, NOW() - INTERVAL '3 weeks'),

    ('a0000000-0000-0000-0007-000000000004'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'WO-2024-004', 'a0000000-0000-0000-0005-000000000030'::UUID, 'a0000000-0000-0000-0003-000000000003'::UUID,
     'a0000000-0000-0000-0001-000000000006'::UUID, 'inspection', 'low', 'completed',
     'Annual safety inspection - Tesla Model 3', 12200.0, 0,
     '2024-10-22', '2024-10-22', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '1 hour',
     1.0, 60.00, 0.00, 'a0000000-0000-0000-0001-000000000003'::UUID, NOW() - INTERVAL '12 days'),

    ('a0000000-0000-0000-0007-000000000005'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'WO-2024-005', 'a0000000-0000-0000-0005-000000000005'::UUID, 'a0000000-0000-0000-0003-000000000002'::UUID,
     'a0000000-0000-0000-0001-000000000005'::UUID, 'corrective', 'critical', 'completed',
     'Brake system repair - replace front brake pads and rotors', 28800.0, 0,
     '2024-10-25', '2024-10-25', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days' + INTERVAL '4 hours',
     4.0, 240.00, 450.00, 'a0000000-0000-0000-0001-000000000002'::UUID, NOW() - INTERVAL '9 days'),

    ('a0000000-0000-0000-0007-000000000006'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'WO-2024-006', 'a0000000-0000-0000-0005-000000000048'::UUID, 'a0000000-0000-0000-0003-000000000003'::UUID,
     'a0000000-0000-0000-0001-000000000004'::UUID, 'corrective', 'critical', 'in_progress',
     'Hydraulic system leak - replace seals and hoses', 2340.0, 4560.0,
     '2024-11-08', '2024-11-10', NOW() - INTERVAL '2 days', NULL,
     0, 0.00, 0.00, 'a0000000-0000-0000-0001-000000000002'::UUID, NOW() - INTERVAL '5 days'),

    ('a0000000-0000-0000-0007-000000000007'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'WO-2024-007', 'a0000000-0000-0000-0005-000000000002'::UUID, 'a0000000-0000-0000-0003-000000000002'::UUID,
     'a0000000-0000-0000-0001-000000000005'::UUID, 'preventive', 'medium', 'scheduled',
     'Regular maintenance - oil change, fluid top-off, tire rotation', 8200.0, 0,
     '2024-11-12', '2024-11-12', NULL, NULL,
     0, 0.00, 0.00, 'a0000000-0000-0000-0001-000000000002'::UUID, NOW() - INTERVAL '3 days'),

    ('a0000000-0000-0000-0007-000000000008'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'WO-2024-008', 'a0000000-0000-0000-0005-000000000014'::UUID, 'a0000000-0000-0000-0003-000000000002'::UUID,
     'a0000000-0000-0000-0001-000000000006'::UUID, 'corrective', 'low', 'open',
     'Check charging system - software update needed', 8560.0, 0,
     '2024-11-14', '2024-11-14', NULL, NULL,
     0, 0.00, 0.00, 'a0000000-0000-0000-0001-000000000003'::UUID, NOW() - INTERVAL '1 day'),

    ('a0000000-0000-0000-0007-000000000009'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'WO-2024-009', 'a0000000-0000-0000-0005-000000000020'::UUID, 'a0000000-0000-0000-0003-000000000003'::UUID,
     'a0000000-0000-0000-0001-000000000004'::UUID, 'preventive', 'medium', 'completed',
     'Transmission service - fluid change and filter replacement', 26700.0, 0,
     '2024-10-28', '2024-10-28', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days' + INTERVAL '2.5 hours',
     2.5, 150.00, 175.00, 'a0000000-0000-0000-0001-000000000002'::UUID, NOW() - INTERVAL '8 days'),

    ('a0000000-0000-0000-0007-000000000010'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'WO-2024-010', 'a0000000-0000-0000-0005-000000000037'::UUID, 'a0000000-0000-0000-0003-000000000001'::UUID,
     'a0000000-0000-0000-0001-000000000005'::UUID, 'inspection', 'low', 'completed',
     'Pre-trip safety inspection', 29400.0, 0,
     '2024-11-01', '2024-11-01', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '45 minutes',
     0.75, 45.00, 0.00, 'a0000000-0000-0000-0001-000000000003'::UUID, NOW() - INTERVAL '6 days');

-- ============================================
-- Maintenance Schedules (Preventive Maintenance for all vehicles)
-- ============================================

-- Oil Change Schedules (Sample for first 10 vehicles)
INSERT INTO maintenance_schedules (id, tenant_id, vehicle_id, service_type, interval_type, interval_value,
                                   last_service_date, last_service_odometer, next_service_due_date, next_service_due_odometer,
                                   is_active, created_at)
VALUES
    ('a0000000-0000-0000-0008-000000000001'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000001'::UUID, 'Oil Change', 'miles', 5000,
     '2024-10-15', 12000.0, '2024-12-15', 17000.0, true, NOW() - INTERVAL '6 months'),

    ('a0000000-0000-0000-0008-000000000002'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000002'::UUID, 'Oil Change', 'miles', 5000,
     '2024-09-20', 8000.0, '2024-11-20', 13000.0, true, NOW() - INTERVAL '6 months'),

    ('a0000000-0000-0000-0008-000000000003'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000003'::UUID, 'Oil Change', 'miles', 5000,
     '2024-08-15', 15000.0, '2024-10-15', 20000.0, true, NOW() - INTERVAL '6 months'),

    ('a0000000-0000-0000-0008-000000000004'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000004'::UUID, 'Oil Change', 'miles', 5000,
     '2024-10-10', 6500.0, '2024-12-10', 11500.0, true, NOW() - INTERVAL '6 months'),

    ('a0000000-0000-0000-0008-000000000005'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000005'::UUID, 'Oil Change', 'miles', 7500,
     '2024-07-20', 28000.0, '2024-09-20', 35500.0, true, NOW() - INTERVAL '6 months'),

    ('a0000000-0000-0000-0008-000000000006'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000006'::UUID, 'Oil Change', 'miles', 7500,
     '2024-06-15', 32000.0, '2024-08-15', 39500.0, true, NOW() - INTERVAL '6 months');

-- Tire Rotation Schedules (Sample)
INSERT INTO maintenance_schedules (id, tenant_id, vehicle_id, service_type, interval_type, interval_value,
                                   last_service_date, last_service_odometer, next_service_due_date, next_service_due_odometer,
                                   is_active, created_at)
VALUES
    ('a0000000-0000-0000-0008-000000000007'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000001'::UUID, 'Tire Rotation', 'miles', 7500,
     '2024-10-15', 12000.0, '2024-12-30', 19500.0, true, NOW() - INTERVAL '6 months'),

    ('a0000000-0000-0000-0008-000000000008'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000002'::UUID, 'Tire Rotation', 'miles', 7500,
     '2024-09-20', 8000.0, '2024-12-05', 15500.0, true, NOW() - INTERVAL '6 months');

-- Heavy Equipment Maintenance (Sample)
INSERT INTO maintenance_schedules (id, tenant_id, vehicle_id, service_type, interval_type, interval_value,
                                   last_service_date, last_service_engine_hours, next_service_due_engine_hours,
                                   is_active, created_at)
VALUES
    ('a0000000-0000-0000-0008-000000000009'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000046'::UUID, 'Hydraulic System Service', 'hours', 500,
     '2024-10-20', 3200.0, 3700.0, true, NOW() - INTERVAL '6 months'),

    ('a0000000-0000-0000-0008-000000000010'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000046'::UUID, 'Engine Oil Service', 'hours', 250,
     '2024-09-15', 3100.0, 3350.0, true, NOW() - INTERVAL '6 months');

-- ============================================
-- Fuel Transactions (Sample - last 30 days)
-- ============================================

-- Generate fuel transactions for various vehicles
INSERT INTO fuel_transactions (id, tenant_id, vehicle_id, driver_id, transaction_date, gallons, price_per_gallon,
                               odometer_reading, fuel_type, location, latitude, longitude, fuel_card_number, created_at)
VALUES
    ('a0000000-0000-0000-0009-000000000001'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000001'::UUID, 'a0000000-0000-0000-0004-000000000001'::UUID,
     NOW() - INTERVAL '2 days', 18.5, 3.45, 12453.5, 'gasoline',
     'Shell Station - Capital Circle SE', 30.4383, -84.2807, 'FC-001234', NOW() - INTERVAL '2 days'),

    ('a0000000-0000-0000-0009-000000000002'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000002'::UUID, 'a0000000-0000-0000-0004-000000000003'::UUID,
     NOW() - INTERVAL '3 days', 19.2, 3.48, 8234.2, 'gasoline',
     'BP Station - North Monroe Street', 30.4850, -84.2807, 'FC-001235', NOW() - INTERVAL '3 days'),

    ('a0000000-0000-0000-0009-000000000003'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000005'::UUID, 'a0000000-0000-0000-0004-000000000009'::UUID,
     NOW() - INTERVAL '5 days', 24.8, 3.89, 28934.7, 'diesel',
     'Gulf Coast Fuel - Industrial Blvd', 30.4200, -84.2950, 'FC-001236', NOW() - INTERVAL '5 days'),

    ('a0000000-0000-0000-0009-000000000004'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000016'::UUID, 'a0000000-0000-0000-0004-000000000002'::UUID,
     NOW() - INTERVAL '4 days', 22.3, 3.92, 7234.5, 'diesel',
     'Gulf Coast Fuel - Industrial Blvd', 30.4200, -84.2950, 'FC-001237', NOW() - INTERVAL '4 days'),

    ('a0000000-0000-0000-0009-000000000005'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000026'::UUID, 'a0000000-0000-0000-0004-000000000022'::UUID,
     NOW() - INTERVAL '1 day', 12.4, 3.42, 32456.7, 'gasoline',
     'Chevron Station - Tennessee Street', 30.4450, -84.3000, 'FC-001238', NOW() - INTERVAL '1 day'),

    ('a0000000-0000-0000-0009-000000000006'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000003'::UUID, 'a0000000-0000-0000-0004-000000000005'::UUID,
     NOW() - INTERVAL '7 days', 20.5, 3.46, 15678.9, 'gasoline',
     'Shell Station - Capital Circle SE', 30.4383, -84.2807, 'FC-001239', NOW() - INTERVAL '7 days'),

    ('a0000000-0000-0000-0009-000000000007'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000017'::UUID, 'a0000000-0000-0000-0004-000000000004'::UUID,
     NOW() - INTERVAL '6 days', 19.8, 3.43, 16789.3, 'gasoline',
     'BP Station - North Monroe Street', 30.4850, -84.2807, 'FC-001240', NOW() - INTERVAL '6 days'),

    ('a0000000-0000-0000-0009-000000000008'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000004'::UUID, 'a0000000-0000-0000-0004-000000000007'::UUID,
     NOW() - INTERVAL '8 days', 21.2, 3.50, 6543.1, 'gasoline',
     'Chevron Station - Tennessee Street', 30.4450, -84.3000, 'FC-001241', NOW() - INTERVAL '8 days');

-- ============================================
-- Routes (Sample planned and completed routes)
-- ============================================
INSERT INTO routes (id, tenant_id, route_name, vehicle_id, driver_id, status, start_location, end_location,
                    planned_start_time, planned_end_time, actual_start_time, actual_end_time,
                    total_distance, estimated_duration, actual_duration, created_at)
VALUES
    ('a0000000-0000-0000-000a-000000000001'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Daily Route A - Northside', 'a0000000-0000-0000-0005-000000000001'::UUID, 'a0000000-0000-0000-0004-000000000001'::UUID,
     'completed', 'HQ Fleet Center', 'Northside Depot',
     NOW() - INTERVAL '2 days' + INTERVAL '8 hours', NOW() - INTERVAL '2 days' + INTERVAL '16 hours',
     NOW() - INTERVAL '2 days' + INTERVAL '8 hours', NOW() - INTERVAL '2 days' + INTERVAL '15 hours 45 minutes',
     85.5, 480, 465, NOW() - INTERVAL '3 days'),

    ('a0000000-0000-0000-000a-000000000002'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Daily Route B - Southside', 'a0000000-0000-0000-0005-000000000002'::UUID, 'a0000000-0000-0000-0004-000000000003'::UUID,
     'completed', 'HQ Fleet Center', 'Southside Service Center',
     NOW() - INTERVAL '2 days' + INTERVAL '8 hours', NOW() - INTERVAL '2 days' + INTERVAL '17 hours',
     NOW() - INTERVAL '2 days' + INTERVAL '8 hours', NOW() - INTERVAL '2 days' + INTERVAL '17 hours 10 minutes',
     92.3, 540, 550, NOW() - INTERVAL '3 days'),

    ('a0000000-0000-0000-000a-000000000003'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Delivery Route - West Tallahassee', 'a0000000-0000-0000-0005-000000000016'::UUID, 'a0000000-0000-0000-0004-000000000002'::UUID,
     'in_progress', 'HQ Fleet Center', 'West Tallahassee',
     NOW() + INTERVAL '8 hours', NOW() + INTERVAL '14 hours',
     NOW() + INTERVAL '8 hours', NULL,
     65.0, 360, NULL, NOW() - INTERVAL '1 day'),

    ('a0000000-0000-0000-000a-000000000004'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Equipment Transport - Construction Site', 'a0000000-0000-0000-0005-000000000046'::UUID, 'a0000000-0000-0000-0004-000000000001'::UUID,
     'planned', 'HQ Fleet Center', 'Construction Site - Centerville Road',
     NOW() + INTERVAL '1 day' + INTERVAL '7 hours', NOW() + INTERVAL '1 day' + INTERVAL '9 hours',
     NULL, NULL,
     28.5, 120, NULL, NOW());

-- ============================================
-- Geofences (Facilities and service areas)
-- ============================================
INSERT INTO geofences (id, tenant_id, name, geofence_type, center_latitude, center_longitude, radius,
                       alert_on_entry, alert_on_exit, is_active, created_at)
VALUES
    ('a0000000-0000-0000-000b-000000000001'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'HQ Fleet Center Zone', 'circular', 30.4383, -84.2807, 500.0,
     false, true, true, NOW() - INTERVAL '2 years'),

    ('a0000000-0000-0000-000b-000000000002'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Northside Depot Zone', 'circular', 30.4850, -84.2807, 400.0,
     false, true, true, NOW() - INTERVAL '1 year'),

    ('a0000000-0000-0000-000b-000000000003'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Southside Service Center Zone', 'circular', 30.3916, -84.2807, 450.0,
     false, true, true, NOW() - INTERVAL '6 months'),

    ('a0000000-0000-0000-000b-000000000004'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Tallahassee Service Area', 'circular', 30.4383, -84.2807, 15000.0,
     false, true, true, NOW() - INTERVAL '2 years');

-- ============================================
-- Charging Stations (for EVs)
-- ============================================
INSERT INTO charging_stations (id, tenant_id, station_name, station_type, location, latitude, longitude, location_point,
                                number_of_ports, power_output_kw, cost_per_kwh, is_public, is_operational, created_at)
VALUES
    ('a0000000-0000-0000-000c-000000000001'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'HQ Fleet Center - Charging Station 1', 'dc_fast_charge', '1500 Capital Circle SE, Tallahassee, FL',
     30.4383, -84.2807, ST_SetSRID(ST_MakePoint(-84.2807, 30.4383), 4326)::geography,
     4, 150.0, 0.15, false, true, NOW() - INTERVAL '1 year'),

    ('a0000000-0000-0000-000c-000000000002'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'HQ Fleet Center - Charging Station 2', 'level_2', '1500 Capital Circle SE, Tallahassee, FL',
     30.4383, -84.2807, ST_SetSRID(ST_MakePoint(-84.2807, 30.4383), 4326)::geography,
     8, 7.2, 0.12, false, true, NOW() - INTERVAL '1 year'),

    ('a0000000-0000-0000-000c-000000000003'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Northside Depot - Charging Station', 'level_2', '3200 North Monroe Street, Tallahassee, FL',
     30.4850, -84.2807, ST_SetSRID(ST_MakePoint(-84.2807, 30.4850), 4326)::geography,
     4, 7.2, 0.12, false, true, NOW() - INTERVAL '6 months');

-- ============================================
-- Charging Sessions (Sample EV charging history)
-- ============================================
INSERT INTO charging_sessions (id, tenant_id, vehicle_id, charging_station_id, driver_id, start_time, end_time,
                                energy_delivered_kwh, cost, start_battery_level, end_battery_level, session_duration, status, created_at)
VALUES
    ('a0000000-0000-0000-000d-000000000001'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000030'::UUID, 'a0000000-0000-0000-000c-000000000001'::UUID,
     'a0000000-0000-0000-0004-000000000030'::UUID, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '45 minutes',
     52.5, 7.88, 25.0, 95.0, 45, 'completed', NOW() - INTERVAL '3 days'),

    ('a0000000-0000-0000-000d-000000000002'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000014'::UUID, 'a0000000-0000-0000-000c-000000000001'::UUID,
     'a0000000-0000-0000-0004-000000000027'::UUID, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '38 minutes',
     85.3, 12.80, 15.0, 90.0, 38, 'completed', NOW() - INTERVAL '1 day'),

    ('a0000000-0000-0000-000d-000000000003'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000034'::UUID, 'a0000000-0000-0000-000c-000000000001'::UUID,
     NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '55 minutes',
     72.4, 10.86, 18.0, 92.0, 55, 'completed', NOW() - INTERVAL '5 days'),

    ('a0000000-0000-0000-000d-000000000004'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'a0000000-0000-0000-0005-000000000045'::UUID, 'a0000000-0000-0000-000c-000000000001'::UUID,
     NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '62 minutes',
     95.8, 14.37, 12.0, 88.0, 62, 'completed', NOW() - INTERVAL '2 days');

-- ============================================
-- Inspection Forms
-- ============================================
INSERT INTO inspection_forms (id, tenant_id, form_name, form_type, form_template, is_active, created_at)
VALUES
    ('a0000000-0000-0000-000e-000000000001'::UUID, 'a0000000-0000-0000-0000-000000000001'::UUID,
     'Standard Pre-Trip Inspection', 'pre_trip', '{
         "fields": [
             {"name": "tires", "type": "checkbox", "required": true, "label": "Tires - Condition & Pressure"},
             {"name": "brakes", "type": "checkbox", "required": true, "label": "Brakes - Function & Wear"},
             {"name": "lights", "type": "checkbox", "required": true, "label": "Lights - All Working"},
             {"name": "fluid_levels", "type": "checkbox", "required": true, "label": "Fluid Levels - Oil, Coolant, Washer"},
             {"name": "mirrors", "type": "checkbox", "required": true, "label": "Mirrors - Clean & Adjusted"},
             {"name": "windshield", "type": "checkbox", "required": true, "label": "Windshield - Clean, No Cracks"},
             {"name": "horn", "type": "checkbox", "required": true, "label": "Horn - Working"},
             {"name": "seatbelts", "type": "checkbox", "required": true, "label": "Seatbelts - Working"},
             {"name": "defects", "type": "textarea", "required": false, "label": "Any Defects Found"}
         ]
     }'::JSONB, true, NOW() - INTERVAL '2 years');

-- ============================================
-- Summary Stats
-- ============================================
-- This completes the seed data for Capital Tech Alliance staging database
--
-- Summary:
-- - 1 Tenant (Capital Tech Alliance)
-- - 36 Users (1 admin, 2 fleet managers, 3 technicians, 30 drivers)
-- - 3 Facilities (HQ Fleet Center, Northside Depot, Southside Service Center)
-- - 30 Drivers
-- - 50 Vehicles (15 trucks, 10 vans, 10 sedans, 10 SUVs, 5 heavy equipment)
-- - 8 Vendors
-- - 10 Work Orders (various statuses)
-- - 10 Maintenance Schedules
-- - 8 Fuel Transactions
-- - 4 Routes
-- - 4 Geofences
-- - 3 Charging Stations
-- - 4 Charging Sessions
-- - 1 Inspection Form
--
-- All data is realistic and tailored for Capital Tech Alliance in Tallahassee, Florida
