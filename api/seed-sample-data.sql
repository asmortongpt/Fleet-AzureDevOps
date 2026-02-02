-- Fleet Management Sample Data for Map and Drilldowns
-- Tallahassee, FL area coordinates for realistic testing

-- Insert sample facilities
INSERT INTO facilities (name, code, type, address, city, state, zip_code, latitude, longitude, capacity, contact_name, contact_phone, contact_email) VALUES
('Main Depot', 'MAIN-01', 'depot', '123 Capital Circle NE', 'Tallahassee', 'FL', '32301', 30.4583, -84.2807, 50, 'John Manager', '850-555-0100', 'depot@fleet.com'),
('North Service Center', 'NORTH-01', 'service_center', '456 Thomasville Rd', 'Tallahassee', 'FL', '32303', 30.4965, -84.2566, 25, 'Sarah Tech', '850-555-0101', 'north@fleet.com'),
('South Station', 'SOUTH-01', 'station', '789 Apalachee Pkwy', 'Tallahassee', 'FL', '32301', 30.4323, -84.2543, 30, 'Mike Station', '850-555-0102', 'south@fleet.com');

-- Insert sample drivers
INSERT INTO drivers (first_name, last_name, email, phone, employee_number, license_number, license_state, cdl, status, hire_date) VALUES
('James', 'Wilson', 'jwilson@fleet.com', '850-555-1001', 'EMP001', 'FL1234567', 'FL', true, 'active', '2020-01-15'),
('Maria', 'Garcia', 'mgarcia@fleet.com', '850-555-1002', 'EMP002', 'FL2345678', 'FL', true, 'active', '2019-06-20'),
('Robert', 'Johnson', 'rjohnson@fleet.com', '850-555-1003', 'EMP003', 'FL3456789', 'FL', false, 'active', '2021-03-10'),
('Jennifer', 'Brown', 'jbrown@fleet.com', '850-555-1004', 'EMP004', 'FL4567890', 'FL', true, 'active', '2018-11-05'),
('Michael', 'Davis', 'mdavis@fleet.com', '850-555-1005', 'EMP005', 'FL5678901', 'FL', false, 'active', '2022-02-14');

-- Insert sample vehicles with realistic GPS locations around Tallahassee
INSERT INTO vehicles (vin, name, number, type, make, model, year, license_plate, status, fuel_type, fuel_level, odometer, latitude, longitude, location_address, assigned_driver_id) VALUES
('1HGBH41JXMN109186', 'Truck 101', 'V-101', 'truck', 'Ford', 'F-150', 2022, 'ABC1234', 'active', 'diesel', 75.5, 25420.5, 30.4588, -84.2833, 'Downtown Tallahassee', (SELECT id FROM drivers WHERE email='jwilson@fleet.com')),
('2C3CDXHG8JH123456', 'Van 202', 'V-202', 'van', 'Dodge', 'Grand Caravan', 2021, 'DEF5678', 'active', 'gasoline', 62.3, 18230.2, 30.4952, -84.2575, 'North Tallahassee', (SELECT id FROM drivers WHERE email='mgarcia@fleet.com')),
('5TDBZRFH3JS123456', 'SUV 303', 'V-303', 'suv', 'Toyota', 'Highlander', 2023, 'GHI9012', 'in_service', 'hybrid', 45.0, 12350.8, 30.4315, -84.2550, 'South Tallahassee', (SELECT id FROM drivers WHERE email='rjohnson@fleet.com')),
('1FTFW1ET9DFC12345', 'Truck 104', 'V-104', 'truck', 'Ford', 'F-250', 2020, 'JKL3456', 'active', 'diesel', 88.2, 45678.3, 30.4720, -84.2980, 'FSU Campus Area', (SELECT id FROM drivers WHERE email='jbrown@fleet.com')),
('1G1ZE5ST7JF123456', 'Sedan 505', 'V-505', 'sedan', 'Chevrolet', 'Malibu', 2022, 'MNO7890', 'active', 'gasoline', 52.0, 8920.5, 30.4410, -84.2810, 'Midtown Tallahassee', (SELECT id FROM drivers WHERE email='mdavis@fleet.com')),
('WBAPH7C58BE123456', 'Sedan 506', 'V-506', 'sedan', 'BMW', '3 Series', 2021, 'PQR1234', 'active', 'gasoline', 35.8, 22145.7, 30.4635, -84.2705, 'Capitol Complex', NULL),
('1HGCV1F39JA123456', 'Sedan 507', 'V-507', 'sedan', 'Honda', 'Accord', 2023, 'STU5678', 'maintenance', 'gasoline', 15.2, 5234.9, 30.4580, -84.2808, 'Main Depot', NULL);

-- Insert sample work orders
INSERT INTO work_orders (vehicle_id, number, title, description, type, priority, status, scheduled_start_date, estimated_cost, labor_hours) VALUES
((SELECT id FROM vehicles WHERE number='V-101'), 'WO-1001', 'Oil Change', 'Regular maintenance - oil and filter change', 'maintenance', 'low', 'completed', CURRENT_TIMESTAMP - INTERVAL '2 days', 75.00, 1.0),
((SELECT id FROM vehicles WHERE number='V-202'), 'WO-1002', 'Brake Inspection', 'Inspect brake pads and rotors', 'inspection', 'medium', 'in_progress', CURRENT_TIMESTAMP, 150.00, 2.0),
((SELECT id FROM vehicles WHERE number='V-303'), 'WO-1003', 'Transmission Repair', 'Transmission slipping - needs diagnosis', 'repair', 'high', 'pending', CURRENT_TIMESTAMP + INTERVAL '1 day', 1200.00, 8.0),
((SELECT id FROM vehicles WHERE number='V-507'), 'WO-1004', 'Tire Replacement', 'Replace all four tires', 'maintenance', 'medium', 'in_progress', CURRENT_TIMESTAMP, 650.00, 3.0);

-- Insert sample fuel transactions
INSERT INTO fuel_transactions (vehicle_id, driver_id, fuel_type, gallons, cost_per_gallon, total_cost, odometer, location, latitude, longitude, vendor_name, transaction_date) VALUES
((SELECT id FROM vehicles WHERE number='V-101'), (SELECT id FROM drivers WHERE email='jwilson@fleet.com'), 'diesel', 18.5, 3.45, 63.83, 25400.0, 'Shell Station - Capital Circle', 30.4585, -84.2825, 'Shell', CURRENT_TIMESTAMP - INTERVAL '1 day'),
((SELECT id FROM vehicles WHERE number='V-202'), (SELECT id FROM drivers WHERE email='mgarcia@fleet.com'), 'gasoline', 12.3, 3.15, 38.75, 18215.0, 'BP - Thomasville Rd', 30.4960, -84.2570, 'BP', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
((SELECT id FROM vehicles WHERE number='V-505'), (SELECT id FROM drivers WHERE email='mdavis@fleet.com'), 'gasoline', 10.8, 3.20, 34.56, 8900.0, 'Chevron - Monroe St', 30.4415, -84.2815, 'Chevron', CURRENT_TIMESTAMP - INTERVAL '5 hours');

-- Insert sample routes
INSERT INTO routes (name, number, type, status, assigned_vehicle_id, assigned_driver_id, scheduled_start_time, estimated_distance, waypoints) VALUES
('Downtown Circuit', 'RT-001', 'delivery', 'in_progress', (SELECT id FROM vehicles WHERE number='V-101'), (SELECT id FROM drivers WHERE email='jwilson@fleet.com'), CURRENT_TIMESTAMP - INTERVAL '2 hours', 25.5, '[{"lat":30.4588,"lng":-84.2833},{"lat":30.4520,"lng":-84.2750},{"lat":30.4615,"lng":-84.2705}]'),
('North Loop', 'RT-002', 'service', 'planned', (SELECT id FROM vehicles WHERE number='V-202'), (SELECT id FROM drivers WHERE email='mgarcia@fleet.com'), CURRENT_TIMESTAMP + INTERVAL '1 hour', 18.2, '[{"lat":30.4952,"lng":-84.2575},{"lat":30.5100,"lng":-84.2450},{"lat":30.5050,"lng":-84.2600}]');

-- Insert sample inspections
INSERT INTO inspections (vehicle_id, inspector_id, inspection_type, odometer, passed, notes) VALUES
((SELECT id FROM vehicles WHERE number='V-101'), (SELECT id FROM drivers WHERE email='jbrown@fleet.com'), 'safety', 25420.5, true, 'All safety systems operational'),
((SELECT id FROM vehicles WHERE number='V-202'), (SELECT id FROM drivers WHERE email='jbrown@fleet.com'), 'annual', 18230.2, true, 'Passed annual inspection');

-- Insert sample incidents
INSERT INTO incidents (vehicle_id, driver_id, incident_type, severity, location, latitude, longitude, description, insurance_claim_number, status) VALUES
((SELECT id FROM vehicles WHERE number='V-303'), (SELECT id FROM drivers WHERE email='rjohnson@fleet.com'), 'accident', 'minor', 'Apalachee Parkway & Monroe', 30.4320, -84.2545, 'Minor fender bender in parking lot', 'CLM-2024-001', 'closed'),
((SELECT id FROM vehicles WHERE number='V-505'), (SELECT id FROM drivers WHERE email='mdavis@fleet.com'), 'mechanical', 'low', 'Midtown area', 30.4410, -84.2810, 'Flat tire - roadside assistance called', NULL, 'resolved');

-- Insert sample GPS tracks (recent activity)
INSERT INTO gps_tracks (vehicle_id, timestamp, latitude, longitude, speed, heading) VALUES
-- Truck 101 moving downtown
((SELECT id FROM vehicles WHERE number='V-101'), CURRENT_TIMESTAMP - INTERVAL '5 minutes', 30.4588, -84.2833, 35.5, 180.0),
((SELECT id FROM vehicles WHERE number='V-101'), CURRENT_TIMESTAMP - INTERVAL '4 minutes', 30.4575, -84.2828, 38.2, 185.5),
((SELECT id FROM vehicles WHERE number='V-101'), CURRENT_TIMESTAMP - INTERVAL '3 minutes', 30.4562, -84.2823, 40.1, 190.0),
-- Van 202 near north location
((SELECT id FROM vehicles WHERE number='V-202'), CURRENT_TIMESTAMP - INTERVAL '2 minutes', 30.4952, -84.2575, 25.0, 90.0),
((SELECT id FROM vehicles WHERE number='V-202'), CURRENT_TIMESTAMP - INTERVAL '1 minute', 30.4955, -84.2570, 28.5, 92.5),
-- Sedan 505 in midtown
((SELECT id FROM vehicles WHERE number='V-505'), CURRENT_TIMESTAMP - INTERVAL '10 minutes', 30.4410, -84.2810, 0.0, 0.0),
((SELECT id FROM vehicles WHERE number='V-505'), CURRENT_TIMESTAMP - INTERVAL '5 minutes', 30.4412, -84.2808, 15.5, 45.0);
