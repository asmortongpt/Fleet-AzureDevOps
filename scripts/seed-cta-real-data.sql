-- CTA Tallahassee realistic dataset (no mocks) - vehicles, staff, equipment, tools
-- Populates a single tenant and related records with real-looking data.

BEGIN;

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== Tenant =====
WITH tenant AS (
  INSERT INTO tenants (id, name, slug, domain, settings, billing_email, subscription_tier, is_active, created_at, updated_at)
  VALUES (
    'c3f8c2b2-9b4b-4c7f-b2b4-6d2f0b5a0f01'::uuid,
    'Capital Tech Alliance',
    'cta-tallahassee',
    'capitaltechalliance.com',
    jsonb_build_object(
      'company', jsonb_build_object(
        'name', 'Capital Tech Alliance',
        'address', '1500 Capital Circle SE',
        'city', 'Tallahassee',
        'state', 'FL',
        'zip', '32301',
        'phone', '(850) 555-0100',
        'timezone', 'America/New_York'
      ),
      'fleet', jsonb_build_object(
        'vehicles', 50,
        'large_equipment', 70,
        'small_items', 100
      )
    ),
    'billing@capitaltechalliance.com',
    'enterprise',
    true,
    now(),
    now()
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    domain = EXCLUDED.domain,
    settings = EXCLUDED.settings,
    billing_email = EXCLUDED.billing_email,
    subscription_tier = EXCLUDED.subscription_tier,
    is_active = EXCLUDED.is_active,
    updated_at = now()
  RETURNING id
),

-- ===== Facilities =====
facility_seed AS (
  SELECT * FROM (VALUES
    ('HQ', 'CTA-HQ', 'garage', '1500 Capital Circle SE', 30.4383, -84.2807, '(850) 555-0200', 'hq@capitaltechalliance.com'),
    ('North Depot', 'CTA-NORTH', 'depot', '3200 North Monroe Street', 30.4850, -84.2807, '(850) 555-0201', 'north@capitaltechalliance.com'),
    ('South Service Center', 'CTA-SOUTH', 'service_center', '4500 Woodville Highway', 30.3945, -84.2468, '(850) 555-0202', 'south@capitaltechalliance.com'),
    ('Airport Maintenance', 'CTA-AIR', 'maintenance', '3300 Capital Circle SW', 30.3965, -84.3503, '(850) 555-0203', 'airport@capitaltechalliance.com')
  ) AS t(name, code, type, address, lat, lng, phone, email)
),
facilities AS (
  INSERT INTO facilities (
    id, tenant_id, name, code, type, address, city, state, zip_code, country,
    latitude, longitude, capacity, current_occupancy, contact_name, contact_phone, contact_email,
    operating_hours, is_active, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    tenant.id,
    fs.name,
    fs.code,
    fs.type,
    fs.address,
    'Tallahassee',
    'FL',
    '32301',
    'US',
    fs.lat,
    fs.lng,
    75,
    0,
    'Operations Desk',
    fs.phone,
    fs.email,
    jsonb_build_object('mon','06:00-20:00','tue','06:00-20:00','wed','06:00-20:00','thu','06:00-20:00','fri','06:00-20:00'),
    true,
    now(),
    now()
  FROM facility_seed fs
  CROSS JOIN tenant
  ON CONFLICT (tenant_id, code) DO UPDATE SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    address = EXCLUDED.address,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    contact_phone = EXCLUDED.contact_phone,
    contact_email = EXCLUDED.contact_email,
    updated_at = now()
  RETURNING id, code, latitude, longitude
),

-- ===== Users (100 staff) =====
name_seed AS (
  SELECT
    ARRAY['James','Mary','Robert','Patricia','Michael','Jennifer','William','Linda','David','Elizabeth','Richard','Susan','Joseph','Jessica','Thomas','Sarah','Christopher','Karen','Daniel','Nancy','Matthew','Betty','Anthony','Lisa','Mark','Sandra','Paul','Ashley','Steven','Emily'] AS first_names,
    ARRAY['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson'] AS last_names
),
user_seed AS (
  SELECT
    gs AS seq,
    tenant.id AS tenant_id,
    (name_seed.first_names[(abs(hashtext(gs::text)) % array_length(name_seed.first_names, 1)) + 1]) AS first_name,
    (name_seed.last_names[(abs(hashtext((gs::text || 'x'))) % array_length(name_seed.last_names, 1)) + 1]) AS last_name,
    CASE
      WHEN gs <= 60 THEN 'Driver'
      WHEN gs <= 75 THEN 'Mechanic'
      WHEN gs <= 85 THEN 'Dispatcher'
      WHEN gs <= 95 THEN 'Supervisor'
      ELSE 'Manager'
    END AS role
  FROM generate_series(1, 100) gs
  CROSS JOIN tenant
  CROSS JOIN name_seed
),
inserted_users AS (
  INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, phone, role,
    is_active, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    tenant_id,
    lower(first_name || '.' || last_name || lpad(seq::text, 3, '0')) || '@capitaltechalliance.com' AS email,
    '$2b$10$rSyN0kzQvb9VqP1Ue3jV8.xQZYv4YvWxqJLjBzH6P8RqK2JZyK1Oa',
    first_name,
    last_name,
    format('(850) %s-%s', lpad((200 + (seq * 7 % 800))::text, 3, '0'), lpad((1000 + (seq * 37 % 9000))::text, 4, '0')),
    role::user_role,
    true,
    now(),
    now()
  FROM user_seed
  ON CONFLICT (tenant_id, email) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    is_active = true,
    updated_at = now()
  RETURNING id, tenant_id, first_name, last_name, email, phone, role
),

-- ===== Drivers (subset of users) =====
inserted_drivers AS (
  INSERT INTO drivers (
    id, tenant_id, user_id, first_name, last_name, email, phone, employee_number,
    license_number, license_state, license_expiry_date, cdl, cdl_class, status,
    hire_date, performance_score, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    tenant_id,
    id,
    first_name,
    last_name,
    email,
    phone,
    'CTA-D' || lpad(row_number() OVER (ORDER BY email)::text, 3, '0'),
    'F' || lpad((100000 + (row_number() OVER (ORDER BY email) * 31 % 800000))::text, 6, '0'),
    'FL',
    now() + interval '18 months',
    true,
    'B',
    'active',
    now() - interval '2 years' + (row_number() OVER (ORDER BY email) * interval '10 days'),
    80 + (row_number() OVER (ORDER BY email) % 20),
    now(),
    now()
  FROM inserted_users
  WHERE role = 'Driver'
  ON CONFLICT DO NOTHING
  RETURNING id, tenant_id, user_id
),

-- Convenience arrays
facility_ids AS (
  SELECT array_agg(id) AS ids FROM facilities
),
driver_ids AS (
  SELECT array_agg(user_id) AS ids FROM inserted_drivers
),

-- ===== Vehicles (50) =====
vehicle_make_model AS (
  SELECT *, row_number() OVER () AS rn FROM (VALUES
    ('Ford','F-150','truck','gasoline'),
    ('Ford','Transit','van','gasoline'),
    ('Chevrolet','Silverado 1500','truck','gasoline'),
    ('Ram','1500','truck','gasoline'),
    ('Toyota','Tacoma','truck','gasoline'),
    ('GMC','Sierra 1500','truck','gasoline'),
    ('Ford','Escape','suv','gasoline'),
    ('Chevrolet','Tahoe','suv','gasoline'),
    ('Tesla','Model Y','suv','electric'),
    ('Ford','F-150 Lightning','truck','electric')
  ) AS t(make, model, vtype, fuel)
),
inserted_vehicles AS (
  INSERT INTO vehicles (
    id, tenant_id, vin, name, number, type, make, model, year, license_plate,
    status, fuel_type, fuel_level, odometer, latitude, longitude, location_address,
    purchase_date, purchase_price, current_value, assigned_driver_id, assigned_facility_id,
    is_active, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    tenant.id,
    substring(upper(md5(random()::text)) for 17),
    (v.make || ' ' || v.model || ' ' || lpad(gs::text, 3, '0')),
    'CTA-VEH-' || lpad(gs::text, 3, '0'),
    v.vtype::vehicle_type,
    v.make,
    v.model,
    (2018 + (gs % 7))::int,
    'FL' || lpad((1000 + (gs * 73 % 9000))::text, 4, '0'),
    (CASE WHEN gs % 10 = 0 THEN 'maintenance' WHEN gs % 7 = 0 THEN 'idle' ELSE 'active' END)::vehicle_status,
    v.fuel::fuel_type,
    (40 + (gs % 60))::numeric,
    (12000 + (gs * 313 % 90000))::int,
    round((30.4383 + (random() - 0.5) * 0.12)::numeric, 7),
    round((-84.2807 + (random() - 0.5) * 0.12)::numeric, 7),
    'Tallahassee, FL 32301',
    (now() - interval '3 years')::timestamp,
    (30000 + (gs * 900 % 25000))::numeric,
    (20000 + (gs * 700 % 20000))::numeric,
    (SELECT ids[1 + (gs % array_length(ids,1))] FROM driver_ids),
    (SELECT ids[1 + (gs % array_length(ids,1))] FROM facility_ids),
    true,
    now(),
    now()
  FROM generate_series(1, 50) gs
  CROSS JOIN tenant
  CROSS JOIN LATERAL (
    SELECT make, model, vtype, fuel
    FROM vehicle_make_model
    WHERE rn = ((gs - 1) % 10) + 1
  ) v
  ON CONFLICT (tenant_id, number) DO UPDATE SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    odometer = EXCLUDED.odometer,
    updated_at = now()
  RETURNING id
),

-- ===== Assets: 70 large equipment =====
large_equipment_types AS (
  SELECT *, row_number() OVER () AS rn FROM (VALUES
    ('Excavator','Caterpillar'),('Bulldozer','Caterpillar'),('Backhoe','John Deere'),('Wheel Loader','Volvo'),
    ('Dump Truck','Komatsu'),('Skid Steer','Bobcat'),('Crane','Terex'),('Grader','Case')
  ) AS t(asset_type, manufacturer)
),
inserted_large_assets AS (
  INSERT INTO assets (
    id, tenant_id, asset_number, name, description, type, category, manufacturer, model, serial_number,
    purchase_date, purchase_price, current_value, status, assigned_to_id, assigned_facility_id, condition,
    warranty_expiry_date, last_maintenance_date, next_maintenance_date, metadata, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    tenant.id,
    'CTA-LE-' || lpad(gs::text, 3, '0'),
    le.asset_type || ' ' || lpad(gs::text, 3, '0'),
    'Large equipment used for field operations in Tallahassee',
    le.asset_type,
    'large_equipment',
    le.manufacturer,
    le.asset_type || '-' || (2018 + (gs % 6))::text,
    'LE' || lpad((100000 + gs)::text, 6, '0'),
    now() - interval '4 years' + (gs * interval '15 days'),
    (85000 + (gs * 1500 % 40000))::numeric,
    (60000 + (gs * 1200 % 30000))::numeric,
    'active',
    (SELECT ids[1 + (gs % array_length(ids,1))] FROM driver_ids),
    (SELECT ids[1 + (gs % array_length(ids,1))] FROM facility_ids),
    'good',
    now() + interval '18 months',
    now() - interval '3 months',
    now() + interval '3 months',
    jsonb_build_object('category','large_equipment','location','Tallahassee, FL'),
    now(),
    now()
  FROM generate_series(1, 70) gs
  CROSS JOIN tenant
  CROSS JOIN LATERAL (
    SELECT asset_type, manufacturer
    FROM large_equipment_types
    WHERE rn = ((gs - 1) % 8) + 1
  ) le
  ON CONFLICT (tenant_id, asset_number) DO UPDATE SET
    status = EXCLUDED.status,
    condition = EXCLUDED.condition,
    updated_at = now()
  RETURNING id
),

-- ===== Assets: 100 small items (generators, welders, etc) =====
small_item_types AS (
  SELECT *, row_number() OVER () AS rn FROM (VALUES
    ('Generator','Honda'),('Welder','Lincoln Electric'),('Pressure Washer','Simpson'),('Air Compressor','DeWalt'),
    ('Portable Light Tower','Wacker Neuson'),('Chain Saw','Stihl'),('Concrete Saw','Husqvarna'),('Water Pump','Goulds')
  ) AS t(asset_type, manufacturer)
),
inserted_small_assets AS (
  INSERT INTO assets (
    id, tenant_id, asset_number, name, description, type, category, manufacturer, model, serial_number,
    purchase_date, purchase_price, current_value, status, assigned_to_id, assigned_facility_id, condition,
    warranty_expiry_date, last_maintenance_date, next_maintenance_date, metadata, created_at, updated_at
  )
  SELECT
    gen_random_uuid(),
    tenant.id,
    'CTA-SM-' || lpad(gs::text, 3, '0'),
    si.asset_type || ' ' || lpad(gs::text, 3, '0'),
    'Small equipment and tools for field crews (CTA Tallahassee)',
    si.asset_type,
    'small_equipment',
    si.manufacturer,
    si.asset_type || '-' || (2020 + (gs % 4))::text,
    'SM' || lpad((200000 + gs)::text, 6, '0'),
    now() - interval '2 years' + (gs * interval '7 days'),
    (1200 + (gs * 35 % 800))::numeric,
    (800 + (gs * 25 % 600))::numeric,
    'active',
    (SELECT ids[1 + (gs % array_length(ids,1))] FROM driver_ids),
    (SELECT ids[1 + (gs % array_length(ids,1))] FROM facility_ids),
    'good',
    now() + interval '12 months',
    now() - interval '1 months',
    now() + interval '4 months',
    jsonb_build_object('category','small_equipment','location','Tallahassee, FL'),
    now(),
    now()
  FROM generate_series(1, 100) gs
  CROSS JOIN tenant
  CROSS JOIN LATERAL (
    SELECT asset_type, manufacturer
    FROM small_item_types
    WHERE rn = ((gs - 1) % 8) + 1
  ) si
  ON CONFLICT (tenant_id, asset_number) DO UPDATE SET
    status = EXCLUDED.status,
    condition = EXCLUDED.condition,
    updated_at = now()
  RETURNING id
)
SELECT 1;

COMMIT;
