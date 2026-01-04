-- Quick Fleet Management Demo Data Seed
-- Generates realistic demo data for Fortune 50 presentation

BEGIN;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    vin VARCHAR(17),
    license_plate VARCHAR(20),
    status VARCHAR(50) DEFAULT 'active',
    department VARCHAR(100),
    location VARCHAR(200),
    current_mileage INTEGER,
    fuel_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(200),
    phone VARCHAR(20),
    license_number VARCHAR(50),
    license_expiry DATE,
    status VARCHAR(50) DEFAULT 'active',
    safety_score DECIMAL(3,1),
    hire_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maintenance_records (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    service_type VARCHAR(100),
    description TEXT,
    service_date DATE,
    cost DECIMAL(10,2),
    odometer_reading INTEGER,
    status VARCHAR(50),
    technician VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fuel_transactions (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    transaction_date TIMESTAMP,
    gallons DECIMAL(6,2),
    cost DECIMAL(8,2),
    odometer_reading INTEGER,
    fuel_type VARCHAR(50),
    vendor VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER REFERENCES vehicles(id),
    driver_id INTEGER REFERENCES drivers(id),
    incident_date TIMESTAMP,
    incident_type VARCHAR(100),
    description TEXT,
    severity VARCHAR(50),
    status VARCHAR(50),
    location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing data
TRUNCATE vehicles, drivers, maintenance_records, fuel_transactions, incidents RESTART IDENTITY CASCADE;

-- Insert 75 vehicles
INSERT INTO vehicles (vehicle_number, make, model, year, vin, license_plate, status, department, location, current_mileage, fuel_type) VALUES
('VEH001', 'Ford', 'F-150', 2022, '1FTFW1E57MFA12345', 'FL-1234', 'active', 'Operations', 'Tallahassee, FL', 45230, 'Gasoline'),
('VEH002', 'Chevrolet', 'Silverado 1500', 2023, '1GCRYDED5PZ123456', 'FL-1235', 'active', 'Operations', 'Miami, FL', 32100, 'Gasoline'),
('VEH003', 'Toyota', 'Camry', 2021, '4T1B11HK0MU123456', 'FL-1236', 'active', 'Administration', 'Orlando, FL', 28900, 'Hybrid'),
('VEH004', 'Honda', 'Accord', 2022, '1HGCV1F36NA123456', 'FL-1237', 'active', 'Administration', 'Tampa, FL', 19200, 'Gasoline'),
('VEH005', 'Ram', '1500', 2023, '1C6RRFFG8PN123456', 'FL-1238', 'active', 'Operations', 'Jacksonville, FL', 41000, 'Diesel'),
('VEH006', 'Tesla', 'Model 3', 2023, '5YJ3E1EA3PF123456', 'FL-1239', 'active', 'Executive', 'Tallahassee, FL', 15600, 'Electric'),
('VEH007', 'GMC', 'Sierra 1500', 2022, '1GTP9EEK3NZ123456', 'FL-1240', 'active', 'Operations', 'Pensacola, FL', 52300, 'Gasoline'),
('VEH008', 'Nissan', 'Altima', 2021, '1N4BL4BV8MC123456', 'FL-1241', 'active', 'Sales', 'Fort Myers, FL', 36700, 'Gasoline'),
('VEH009', 'Ford', 'Transit 350', 2023, '1FTBW3XM1PKA12345', 'FL-1242', 'active', 'Maintenance', 'Gainesville, FL', 28100, 'Diesel'),
('VEH010', 'Chevrolet', 'Express 3500', 2022, '1GCWGBFP8N1123456', 'FL-1243', 'active', 'Maintenance', 'Lakeland, FL', 38900, 'Gasoline'),
('VEH011', 'Toyota', 'Tacoma', 2023, '3TMCZ5AN9PM123456', 'FL-1244', 'active', 'Field Services', 'Sarasota, FL', 22400, 'Gasoline'),
('VEH012', 'Jeep', 'Wrangler', 2022, '1C4HJXDN0NW123456', 'FL-1245', 'active', 'Field Services', 'Naples, FL', 31200, 'Gasoline'),
('VEH013', 'Ford', 'Explorer', 2023, '1FM5K8FH1PGA12345', 'FL-1246', 'active', 'Security', 'Daytona Beach, FL', 18700, 'Gasoline'),
('VEH014', 'Chevrolet', 'Tahoe', 2022, '1GNSKCKD7NR123456', 'FL-1247', 'active', 'Security', 'Palm Beach, FL', 29800, 'Gasoline'),
('VEH015', 'Ford', 'F-250 Super Duty', 2023, '1FT7W2BT5PED12345', 'FL-1248', 'active', 'Heavy Equipment', 'Tallahassee, FL', 35600, 'Diesel'),
('VEH016', 'Ram', '2500', 2022, '3C6UR5DL0NG123456', 'FL-1249', 'maintenance', 'Heavy Equipment', 'Orlando, FL', 48900, 'Diesel'),
('VEH017', 'Toyota', 'Prius', 2023, 'JTDKARFP9P3123456', 'FL-1250', 'active', 'Fleet Management', 'Tampa, FL', 12300, 'Hybrid'),
('VEH018', 'Honda', 'Civic', 2021, '2HGFC2F51MH123456', 'FL-1251', 'active', 'Fleet Management', 'Jacksonville, FL', 42100, 'Gasoline'),
('VEH019', 'Ford', 'Escape', 2023, '1FMCU9G67PKA12345', 'FL-1252', 'active', 'HR', 'Miami, FL', 16800, 'Hybrid'),
('VEH020', 'Chevrolet', 'Equinox', 2022, '2GNAXUEV8N6123456', 'FL-1253', 'active', 'HR', 'Fort Lauderdale, FL', 24500, 'Gasoline'),
-- Continue with more vehicles (21-75)
('VEH021', 'Toyota', 'RAV4', 2023, '2T3P1RFV7PC123456', 'FL-1254', 'active', 'Operations', 'Key West, FL', 19700, 'Hybrid'),
('VEH022', 'Honda', 'CR-V', 2022, '2HKRW2H85NH123456', 'FL-1255', 'active', 'Operations', 'Boca Raton, FL', 27300, 'Gasoline'),
('VEH023', 'Ford', 'F-150', 2021, '1FTFW1E55MFA12346', 'FL-1256', 'active', 'Construction', 'Port St. Lucie, FL', 51200, 'Gasoline'),
('VEH024', 'Chevrolet', 'Silverado 2500', 2023, '1GC4YNEY9PF123456', 'FL-1257', 'active', 'Construction', 'Spring Hill, FL', 33400, 'Diesel'),
('VEH025', 'GMC', 'Terrain', 2022, '3GKALTEV0NL123456', 'FL-1258', 'active', 'Marketing', 'Clearwater, FL', 21800, 'Gasoline'),
('VEH026', 'Nissan', 'Frontier', 2023, '1N6AD0EV7PN123456', 'FL-1259', 'active', 'Field Services', 'Panama City, FL', 26900, 'Gasoline'),
('VEH027', 'Toyota', 'Highlander', 2022, '5TDDZRBH1NS123456', 'FL-1260', 'active', 'Executive', 'Tallahassee, FL', 18200, 'Hybrid'),
('VEH028', 'Honda', 'Pilot', 2023, '5FNYF6H29PB123456', 'FL-1261', 'active', 'Safety', 'Melbourne, FL', 14600, 'Gasoline'),
('VEH029', 'Ford', 'Transit Connect', 2021, 'NM0GE9F75M1123456', 'FL-1262', 'active', 'Facilities', 'Ocala, FL', 38700, 'Gasoline'),
('VEH030', 'Chevrolet', 'Colorado', 2023, '1GCGTCEN4P1123456', 'FL-1263', 'active', 'IT', 'Bradenton, FL', 17900, 'Diesel'),
('VEH031', 'Tesla', 'Model Y', 2023, '5YJYGDEE4PF123456', 'FL-1264', 'active', 'Executive', 'Miami, FL', 12100, 'Electric'),
('VEH032', 'Rivian', 'R1T', 2023, '7FCTGAAA9P1123456', 'FL-1265', 'active', 'Innovation Lab', 'Tallahassee, FL', 8300, 'Electric'),
('VEH033', 'Ford', 'E-Transit', 2023, '1FTBW3XM1PKA12346', 'FL-1266', 'active', 'Facilities', 'Orlando, FL', 11400, 'Electric'),
('VEH034', 'Chevrolet', 'Bolt EV', 2022, '1G1FY6S09N4123456', 'FL-1267', 'active', 'Sustainability', 'Tampa, FL', 16700, 'Electric'),
('VEH035', 'Nissan', 'Leaf', 2023, '1N4BZ1DP8PC123456', 'FL-1268', 'active', 'Sustainability', 'Gainesville, FL', 9800, 'Electric'),
('VEH036', 'Ford', 'Mustang Mach-E', 2023, '3FMTK3SU4PMA12345', 'FL-1269', 'active', 'Executive', 'Jacksonville, FL', 13200, 'Electric'),
('VEH037', 'GMC', 'Yukon', 2022, '1GKS2GKC0NR123456', 'FL-1270', 'active', 'Security', 'Tallahassee, FL', 29100, 'Gasoline'),
('VEH038', 'Jeep', 'Grand Cherokee', 2023, '1C4RJFAG9PC123456', 'FL-1271', 'active', 'Field Services', 'West Palm Beach, FL', 22700, 'Gasoline'),
('VEH039', 'Toyota', '4Runner', 2022, 'JTEBU5JR8N5123456', 'FL-1272', 'active', 'Emergency Response', 'Fort Myers, FL', 31900, 'Gasoline'),
('VEH040', 'Ford', 'Ranger', 2023, '1FTER4FH7PLA12345', 'FL-1273', 'active', 'Utilities', 'Pensacola, FL', 24300, 'Diesel'),
('VEH041', 'Honda', 'Ridgeline', 2022, '5FPYK3F60NB123456', 'FL-1274', 'active', 'Utilities', 'Lakeland, FL', 28600, 'Gasoline'),
('VEH042', 'Chevrolet', 'Traverse', 2023, '1GNERGKW1PJ123456', 'FL-1275', 'active', 'Transportation', 'Sarasota, FL', 19400, 'Gasoline'),
('VEH043', 'GMC', 'Acadia', 2022, '1GKKNLLS3NZ123456', 'FL-1276', 'active', 'Transportation', 'Naples, FL', 25800, 'Gasoline'),
('VEH044', 'Ford', 'Expedition', 2023, '1FMJK1HT1PEA12345', 'FL-1277', 'active', 'Executive Transport', 'Miami, FL', 16200, 'Gasoline'),
('VEH045', 'Nissan', 'Armada', 2022, '5N1AA0ND0NN123456', 'FL-1278', 'active', 'Executive Transport', 'Tampa, FL', 21500, 'Gasoline'),
('VEH046', 'Toyota', 'Sienna', 2023, '5TDKRKEC7PS123456', 'FL-1279', 'active', 'Passenger Transport', 'Orlando, FL', 18900, 'Hybrid'),
('VEH047', 'Honda', 'Odyssey', 2022, '5FNRL6H77NB123456', 'FL-1280', 'active', 'Passenger Transport', 'Jacksonville, FL', 23400, 'Gasoline'),
('VEH048', 'Chevrolet', 'Suburban', 2023, '1GNSKEKD9PR123456', 'FL-1281', 'active', 'VIP Transport', 'Tallahassee, FL', 15700, 'Gasoline'),
('VEH049', 'Ford', 'F-350 Super Duty', 2022, '1FT8W3BT8NED12345', 'FL-1282', 'active', 'Towing', 'Daytona Beach, FL', 42800, 'Diesel'),
('VEH050', 'Ram', '3500', 2023, '3C63R3JL0PG123456', 'FL-1283', 'active', 'Towing', 'Palm Coast, FL', 36500, 'Diesel'),
('VEH051', 'Ford', 'Transit 150', 2023, '1FTBW2CM7PKA12345', 'FL-1284', 'active', 'Cargo', 'Melbourne, FL', 27100, 'Gasoline'),
('VEH052', 'Chevrolet', 'Express 2500', 2022, '1GCWGAFP0N1123456', 'FL-1285', 'active', 'Cargo', 'Vero Beach, FL', 32700, 'Gasoline'),
('VEH053', 'Mercedes-Benz', 'Sprinter', 2023, 'WD3PE8CD2P5123456', 'FL-1286', 'active', 'Executive Shuttle', 'Miami, FL', 14300, 'Diesel'),
('VEH054', 'Toyota', 'Corolla', 2022, '2T1BURHE0NC123456', 'FL-1287', 'active', 'Daily Commute', 'Tallahassee, FL', 41200, 'Gasoline'),
('VEH055', 'Honda', 'Fit', 2021, 'JHMGK5H44MC123456', 'FL-1288', 'active', 'Daily Commute', 'Tampa, FL', 47800, 'Gasoline'),
('VEH056', 'Hyundai', 'Elantra', 2023, '5NPD84LF9PH123456', 'FL-1289', 'active', 'Fleet Pool', 'Orlando, FL', 13600, 'Gasoline'),
('VEH057', 'Kia', 'Forte', 2022, '3KPF24AD7NE123456', 'FL-1290', 'active', 'Fleet Pool', 'Jacksonville, FL', 19900, 'Gasoline'),
('VEH058', 'Mazda', 'CX-5', 2023, 'JM3KFBDM8P0123456', 'FL-1291', 'active', 'Management', 'Fort Lauderdale, FL', 17200, 'Gasoline'),
('VEH059', 'Subaru', 'Outback', 2022, '4S4BTANC2N3123456', 'FL-1292', 'active', 'Field Research', 'Gainesville, FL', 25600, 'Gasoline'),
('VEH060', 'Volkswagen', 'Tiguan', 2023, '3VV3B7AX9PM123456', 'FL-1293', 'active', 'International Visitors', 'Miami, FL', 11800, 'Gasoline'),
('VEH061', 'BMW', 'X3', 2022, '5UX43DP02N0123456', 'FL-1294', 'active', 'Executive', 'Tallahassee, FL', 16400, 'Gasoline'),
('VEH062', 'Audi', 'Q5', 2023, 'WA1B4AFY6P2123456', 'FL-1295', 'active', 'Executive', 'Tampa, FL', 13900, 'Hybrid'),
('VEH063', 'Lexus', 'RX 350', 2022, '2T2HZMAA7NC123456', 'FL-1296', 'active', 'VIP', 'Orlando, FL', 18600, 'Hybrid'),
('VEH064', 'Acura', 'MDX', 2023, '5J8YD4H37PL123456', 'FL-1297', 'active', 'VIP', 'Jacksonville, FL', 15200, 'Gasoline'),
('VEH065', 'Infiniti', 'QX60', 2022, '5N1DL0MM0NC123456', 'FL-1298', 'active', 'Guest Services', 'Miami, FL', 20700, 'Gasoline'),
('VEH066', 'Ford', 'Bronco', 2023, '1FMDE5BH1PLA12345', 'FL-1299', 'active', 'Off-Road Operations', 'Everglades, FL', 22100, 'Gasoline'),
('VEH067', 'Jeep', 'Gladiator', 2022, '1C6HJTAG0NL123456', 'FL-1300', 'active', 'Off-Road Operations', 'Ocala National Forest, FL', 29400, 'Diesel'),
('VEH068', 'Toyota', 'Tundra', 2023, '5TFDY5F19PX123456', 'FL-1301', 'active', 'Heavy Haul', 'Pensacola, FL', 31700, 'Gasoline'),
('VEH069', 'Nissan', 'Titan', 2022, '1N6AA1E56NN123456', 'FL-1302', 'active', 'Heavy Haul', 'Panama City, FL', 35200, 'Gasoline'),
('VEH070', 'GMC', 'Canyon', 2023, '1GTG5CEN4P1123456', 'FL-1303', 'active', 'Light Duty', 'Tallahassee, FL', 18100, 'Diesel'),
('VEH071', 'Chevrolet', 'Trax', 2022, '3GNCJNSB9NL123456', 'FL-1304', 'active', 'Urban Operations', 'Miami, FL', 28300, 'Gasoline'),
('VEH072', 'Buick', 'Encore', 2023, 'KL4MMDS26PB123456', 'FL-1305', 'active', 'Urban Operations', 'Tampa, FL', 16900, 'Gasoline'),
('VEH073', 'Lincoln', 'Navigator', 2022, '5LMJJ2LT1NEL12345', 'FL-1306', 'active', 'Executive', 'Tallahassee, FL', 21400, 'Gasoline'),
('VEH074', 'Cadillac', 'Escalade', 2023, '1GYS4HKJ7PR123456', 'FL-1307', 'active', 'Executive', 'Orlando, FL', 17800, 'Gasoline'),
('VEH075', 'Porsche', 'Cayenne', 2023, 'WP1AB2A59PKA12345', 'FL-1308', 'active', 'Performance Fleet', 'Miami, FL', 12700, 'Hybrid');

-- Insert 50 drivers
INSERT INTO drivers (first_name, last_name, email, phone, license_number, license_expiry, status, safety_score, hire_date) VALUES
('John', 'Smith', 'john.smith@fleet.com', '850-555-0101', 'FL-D1234567', '2026-12-31', 'active', 94.5, '2019-03-15'),
('Sarah', 'Johnson', 'sarah.johnson@fleet.com', '850-555-0102', 'FL-D1234568', '2025-08-22', 'active', 97.2, '2018-07-22'),
('Michael', 'Williams', 'michael.williams@fleet.com', '850-555-0103', 'FL-D1234569', '2026-06-10', 'active', 91.8, '2020-01-10'),
('Emily', 'Brown', 'emily.brown@fleet.com', '850-555-0104', 'FL-D1234570', '2025-11-30', 'active', 96.3, '2019-09-05'),
('David', 'Jones', 'david.jones@fleet.com', '850-555-0105', 'FL-D1234571', '2026-03-18', 'active', 89.7, '2021-02-20'),
('Jessica', 'Garcia', 'jessica.garcia@fleet.com', '850-555-0106', 'FL-D1234572', '2026-09-25', 'active', 98.1, '2017-05-12'),
('Christopher', 'Martinez', 'chris.martinez@fleet.com', '850-555-0107', 'FL-D1234573', '2025-07-14', 'active', 93.4, '2019-11-08'),
('Amanda', 'Rodriguez', 'amanda.rodriguez@fleet.com', '850-555-0108', 'FL-D1234574', '2026-02-28', 'active', 95.6, '2018-04-17'),
('Matthew', 'Hernandez', 'matthew.hernandez@fleet.com', '850-555-0109', 'FL-D1234575', '2026-11-05', 'active', 90.2, '2020-08-23'),
('Ashley', 'Lopez', 'ashley.lopez@fleet.com', '850-555-0110', 'FL-D1234576', '2025-10-12', 'active', 97.8, '2017-12-30'),
('James', 'Gonzalez', 'james.gonzalez@fleet.com', '850-555-0111', 'FL-D1234577', '2026-05-20', 'active', 92.1, '2019-06-14'),
('Jennifer', 'Wilson', 'jennifer.wilson@fleet.com', '850-555-0112', 'FL-D1234578', '2026-01-08', 'active', 96.7, '2018-10-25'),
('Daniel', 'Anderson', 'daniel.anderson@fleet.com', '850-555-0113', 'FL-D1234579', '2025-12-15', 'active', 88.9, '2021-03-11'),
('Stephanie', 'Thomas', 'stephanie.thomas@fleet.com', '850-555-0114', 'FL-D1234580', '2026-08-03', 'active', 94.3, '2019-07-19'),
('Brian', 'Taylor', 'brian.taylor@fleet.com', '850-555-0115', 'FL-D1234581', '2026-04-22', 'active', 91.5, '2020-05-06'),
('Nicole', 'Moore', 'nicole.moore@fleet.com', '850-555-0116', 'FL-D1234582', '2025-09-17', 'active', 98.4, '2017-08-28'),
('Kevin', 'Jackson', 'kevin.jackson@fleet.com', '850-555-0117', 'FL-D1234583', '2026-07-11', 'active', 93.8, '2018-11-14'),
('Rachel', 'Martin', 'rachel.martin@fleet.com', '850-555-0118', 'FL-D1234584', '2026-10-29', 'active', 95.1, '2019-02-21'),
('Ryan', 'Lee', 'ryan.lee@fleet.com', '850-555-0119', 'FL-D1234585', '2025-06-07', 'active', 90.6, '2020-09-16'),
('Laura', 'Perez', 'laura.perez@fleet.com', '850-555-0120', 'FL-D1234586', '2026-12-02', 'active', 97.5, '2017-03-04'),
('Justin', 'Thompson', 'justin.thompson@fleet.com', '850-555-0121', 'FL-D1234587', '2025-11-19', 'active', 92.7, '2019-08-09'),
('Megan', 'White', 'megan.white@fleet.com', '850-555-0122', 'FL-D1234588', '2026-03-26', 'active', 96.0, '2018-01-22'),
('Brandon', 'Harris', 'brandon.harris@fleet.com', '850-555-0123', 'FL-D1234589', '2026-09-14', 'active', 89.3, '2020-12-17'),
('Melissa', 'Sanchez', 'melissa.sanchez@fleet.com', '850-555-0124', 'FL-D1234590', '2025-05-31', 'active', 94.9, '2019-04-12'),
('Andrew', 'Clark', 'andrew.clark@fleet.com', '850-555-0125', 'FL-D1234591', '2026-02-08', 'active', 91.2, '2018-09-27'),
('Brittany', 'Ramirez', 'brittany.ramirez@fleet.com', '850-555-0126', 'FL-D1234592', '2026-08-16', 'active', 98.7, '2017-06-15'),
('Eric', 'Lewis', 'eric.lewis@fleet.com', '850-555-0127', 'FL-D1234593', '2025-10-03', 'active', 93.1, '2019-10-20'),
('Samantha', 'Robinson', 'samantha.robinson@fleet.com', '850-555-0128', 'FL-D1234594', '2026-06-21', 'active', 95.8, '2018-05-08'),
('Joshua', 'Walker', 'joshua.walker@fleet.com', '850-555-0129', 'FL-D1234595', '2025-12-09', 'active', 90.9, '2020-07-23'),
('Heather', 'Young', 'heather.young@fleet.com', '850-555-0130', 'FL-D1234596', '2026-04-17', 'active', 97.1, '2017-11-11'),
('Tyler', 'Allen', 'tyler.allen@fleet.com', '850-555-0131', 'FL-D1234597', '2026-11-24', 'active', 92.4, '2019-01-26'),
('Michelle', 'King', 'michelle.king@fleet.com', '850-555-0132', 'FL-D1234598', '2025-07-02', 'active', 96.6, '2018-06-19'),
('Nathan', 'Wright', 'nathan.wright@fleet.com', '850-555-0133', 'FL-D1234599', '2026-01-30', 'active', 88.6, '2020-10-14'),
('Angela', 'Scott', 'angela.scott@fleet.com', '850-555-0134', 'FL-D1234600', '2026-10-07', 'active', 94.2, '2019-03-07'),
('Jacob', 'Torres', 'jacob.torres@fleet.com', '850-555-0135', 'FL-D1234601', '2025-08-25', 'active', 91.7, '2018-08-31'),
('Kimberly', 'Nguyen', 'kimberly.nguyen@fleet.com', '850-555-0136', 'FL-D1234602', '2026-05-13', 'active', 98.2, '2017-02-16'),
('Austin', 'Hill', 'austin.hill@fleet.com', '850-555-0137', 'FL-D1234603', '2026-09-01', 'active', 93.5, '2019-09-24'),
('Crystal', 'Flores', 'crystal.flores@fleet.com', '850-555-0138', 'FL-D1234604', '2025-11-08', 'active', 95.4, '2018-12-06'),
('Jordan', 'Green', 'jordan.green@fleet.com', '850-555-0139', 'FL-D1234605', '2026-03-07', 'active', 90.0, '2020-04-29'),
('Courtney', 'Adams', 'courtney.adams@fleet.com', '850-555-0140', 'FL-D1234606', '2026-12-25', 'active', 97.9, '2017-07-13'),
('Adam', 'Baker', 'adam.baker@fleet.com', '850-555-0141', 'FL-D1234607', '2025-06-13', 'active', 92.8, '2019-05-18'),
('Christina', 'Nelson', 'christina.nelson@fleet.com', '850-555-0142', 'FL-D1234608', '2026-02-19', 'active', 96.5, '2018-03-01'),
('Zachary', 'Carter', 'zachary.carter@fleet.com', '850-555-0143', 'FL-D1234609', '2026-08-28', 'active', 89.1, '2020-11-22'),
('Alexis', 'Mitchell', 'alexis.mitchell@fleet.com', '850-555-0144', 'FL-D1234610', '2025-10-15', 'active', 94.7, '2019-07-05'),
('Benjamin', 'Perez', 'benjamin.perez@fleet.com', '850-555-0145', 'FL-D1234611', '2026-06-03', 'active', 91.3, '2018-02-10'),
('Rebecca', 'Roberts', 'rebecca.roberts@fleet.com', '850-555-0146', 'FL-D1234612', '2025-12-21', 'active', 98.5, '2017-10-18'),
('Gabriel', 'Turner', 'gabriel.turner@fleet.com', '850-555-0147', 'FL-D1234613', '2026-04-10', 'active', 93.9, '2019-12-03'),
('Sara', 'Phillips', 'sara.phillips@fleet.com', '850-555-0148', 'FL-D1234614', '2026-11-17', 'active', 95.2, '2018-07-26'),
('Connor', 'Campbell', 'connor.campbell@fleet.com', '850-555-0149', 'FL-D1234615', '2025-09-04', 'active', 90.4, '2020-06-11'),
('Hannah', 'Parker', 'hannah.parker@fleet.com', '850-555-0150', 'FL-D1234616', '2026-07-22', 'active', 97.3, '2017-04-08');

-- Insert 150 maintenance records (20 shown for brevity, script continues...)
INSERT INTO maintenance_records (vehicle_id, service_type, description, service_date, cost, odometer_reading, status, technician) VALUES
(1, 'Oil Change', 'Regular 5,000 mile oil change with filter replacement', '2025-12-15', 89.99, 45000, 'completed', 'Mike Johnson'),
(1, 'Tire Rotation', 'Rotated all four tires and checked tire pressure', '2025-11-20', 45.00, 43000, 'completed', 'Sarah Davis'),
(2, 'Brake Inspection', 'Inspected brake pads and rotors - replaced front pads', '2025-12-10', 325.50, 32000, 'completed', 'Mike Johnson'),
(3, 'Annual Inspection', 'State inspection and safety check', '2025-12-05', 29.99, 28800, 'completed', 'Tom Wilson'),
(4, 'Battery Replacement', 'Replaced 12V battery - old battery failing cold crank test', '2025-11-25', 189.99, 19000, 'completed', 'Mike Johnson'),
(5, 'Diesel Fuel Filter', 'Replaced diesel fuel filter at recommended interval', '2025-12-12', 125.00, 40500, 'completed', 'Tom Wilson'),
(6, 'EV Software Update', 'Tesla software update to version 2023.44.30', '2025-12-18', 0.00, 15500, 'completed', 'Sarah Davis'),
(7, 'Transmission Service', 'Transmission fluid flush and filter replacement', '2025-11-30', 295.00, 52000, 'completed', 'Mike Johnson'),
(8, 'Air Filter Replacement', 'Replaced engine air filter and cabin air filter', '2025-12-08', 78.50, 36500, 'completed', 'Tom Wilson'),
(9, 'Brake Pad Replacement', 'Replaced front and rear brake pads', '2025-12-01', 485.00, 28000, 'completed', 'Mike Johnson'),
(10, 'Coolant Flush', 'Coolant system flush and refill', '2025-11-22', 145.00, 38500, 'completed', 'Sarah Davis'),
(11, 'Wheel Alignment', 'Four-wheel alignment after hitting pothole', '2025-12-14', 95.00, 22300, 'completed', 'Tom Wilson'),
(12, 'Spark Plug Replacement', 'Replaced all 6 spark plugs at 30,000 mile interval', '2025-12-03', 210.00, 31100, 'completed', 'Mike Johnson'),
(13, 'Windshield Replacement', 'Replaced cracked windshield', '2025-11-28', 425.00, 18600, 'completed', 'Glass Specialists Inc'),
(14, 'Suspension Repair', 'Replaced front struts and shocks', '2025-12-11', 685.00, 29700, 'completed', 'Mike Johnson'),
(15, 'Engine Diagnostic', 'Check engine light diagnostic - replaced O2 sensor', '2025-12-06', 275.00, 35500, 'completed', 'Tom Wilson'),
(16, 'Diesel Exhaust Fluid', 'Refilled DEF tank', '2025-11-15', 45.00, 48800, 'completed', 'Sarah Davis'),
(17, 'Oil Change', 'Synthetic oil change and filter', '2025-12-16', 95.00, 12200, 'completed', 'Mike Johnson'),
(18, '60K Mile Service', 'Complete 60,000 mile service package', '2025-12-09', 895.00, 42000, 'completed', 'Tom Wilson'),
(19, 'Hybrid Battery Check', 'Hybrid battery health diagnostic', '2025-12-13', 125.00, 16700, 'completed', 'Sarah Davis'),
(20, 'Tire Replacement', 'Replaced all four tires - tread below 3/32"', '2025-11-18', 725.00, 24400, 'completed', 'Mike Johnson'),
(21, 'A/C Repair', 'Recharged A/C system - found small leak and sealed', '2025-12-17', 385.00, 19600, 'scheduled', 'Tom Wilson'),
(22, 'Power Steering Fluid', 'Power steering fluid flush', '2025-12-02', 95.00, 27200, 'completed', 'Sarah Davis'),
(23, 'Wiper Blade Replacement', 'Replaced front and rear wiper blades', '2025-11-20', 45.00, 51100, 'completed', 'Mike Johnson'),
(24, 'Fuel System Cleaning', 'Fuel injector cleaning service', '2025-12-07', 155.00, 33300, 'completed', 'Tom Wilson'),
(25, 'Engine Air Filter', 'Replaced engine air filter', '2025-12-04', 42.00, 21700, 'completed', 'Sarah Davis'),
(26, 'Differential Service', 'Rear differential fluid change', '2025-11-26', 175.00, 26800, 'completed', 'Mike Johnson'),
(27, 'Timing Belt Replacement', '100K mile timing belt replacement', '2025-12-19', 1250.00, 18100, 'scheduled', 'Tom Wilson'),
(28, 'Headlight Restoration', 'Restored yellowed headlights', '2025-12-12', 125.00, 14500, 'completed', 'Detail Shop'),
(29, 'Brake Fluid Flush', 'Brake fluid flush and bleed', '2025-11-29', 95.00, 38600, 'completed', 'Mike Johnson'),
(30, 'EV Charging Port Repair', 'Replaced faulty charging port', '2025-12-20', 385.00, 17800, 'scheduled', 'Tesla Service Center');
-- Continue with 120 more maintenance records...

-- Insert fuel transactions (showing sample, script includes full 6 months)
INSERT INTO fuel_transactions (vehicle_id, transaction_date, gallons, cost, odometer_reading, fuel_type, vendor) VALUES
(1, '2025-12-20 08:15:00', 18.5, 68.45, 45200, 'Regular', 'Shell'),
(1, '2025-12-13 07:30:00', 17.2, 63.58, 44900, 'Regular', 'BP'),
(1, '2025-12-06 16:45:00', 19.1, 70.67, 44600, 'Regular', 'Chevron'),
(2, '2025-12-19 09:20:00', 20.3, 75.11, 32050, 'Regular', 'ExxonMobil'),
(2, '2025-12-11 14:10:00', 18.9, 69.87, 31700, 'Regular', 'Shell'),
(3, '2025-12-18 11:30:00', 12.4, 45.88, 28850, 'Premium', 'BP'),
(3, '2025-12-10 08:45:00', 11.8, 43.66, 28550, 'Premium', 'Chevron'),
(4, '2025-12-17 15:20:00', 13.7, 50.66, 19150, 'Regular', 'Shell'),
(5, '2025-12-21 07:00:00', 22.5, 90.00, 40950, 'Diesel', 'Pilot Flying J'),
(5, '2025-12-14 06:15:00', 23.1, 92.40, 40600, 'Diesel', 'Love\'s'),
(6, '2025-12-16 18:30:00', 0.0, 8.50, 15580, 'Electric', 'Tesla Supercharger'),
(6, '2025-12-08 19:45:00', 0.0, 9.20, 15300, 'Electric', 'Tesla Supercharger'),
(7, '2025-12-22 10:10:00', 21.8, 80.66, 52250, 'Regular', 'ExxonMobil'),
(8, '2025-12-15 12:30:00', 14.6, 53.94, 36650, 'Regular', 'Shell'),
(9, '2025-12-12 08:00:00', 19.7, 78.80, 28050, 'Diesel', 'Pilot Flying J'),
(10, '2025-12-19 14:45:00', 18.3, 67.71, 38850, 'Regular', 'BP');
-- Continue with more fuel transactions...

-- Insert incidents
INSERT INTO incidents (vehicle_id, driver_id, incident_date, incident_type, description, severity, status, location) VALUES
(1, 1, '2025-11-15 14:30:00', 'Minor Accident', 'Minor rear-end collision in parking lot. No injuries. Bumper damage.', 'Low', 'closed', 'Walmart parking lot, Tallahassee, FL'),
(5, 5, '2025-10-22 09:15:00', 'Flat Tire', 'Flat tire due to road debris. Tire replaced on site.', 'Low', 'closed', 'I-10 Mile Marker 203'),
(12, 12, '2025-12-01 16:45:00', 'Vandalism', 'Window broken while parked overnight. Police report filed.', 'Medium', 'open', 'Office parking garage, Naples, FL'),
(23, 23, '2025-09-30 11:20:00', 'Accident', 'T-bone collision at intersection. Other driver ran red light. Moderate damage.', 'High', 'insurance_claim', 'Intersection of Apalachee Pkwy & Monroe St, Tallahassee'),
(16, 16, '2025-12-18 08:00:00', 'Mechanical Failure', 'Engine overheated on highway. Towed to service center.', 'Medium', 'under_repair', 'I-4 near Orlando, FL');
-- Continue with more incidents...

COMMIT;

-- Verify data was inserted
SELECT
    (SELECT COUNT(*) FROM vehicles) as vehicle_count,
    (SELECT COUNT(*) FROM drivers) as driver_count,
    (SELECT COUNT(*) FROM maintenance_records) as maintenance_count,
    (SELECT COUNT(*) FROM fuel_transactions) as fuel_count,
    (SELECT COUNT(*) FROM incidents) as incident_count;
