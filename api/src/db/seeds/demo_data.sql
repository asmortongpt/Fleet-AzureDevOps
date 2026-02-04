-- Demo Data Seed (DB-only, no mock placeholders)
-- Populates core tables used by UI hubs and dashboards.

BEGIN;

-- Ensure a default tenant exists
INSERT INTO tenants (name, slug, domain, billing_email, settings, subscription_tier, is_active)
VALUES (
  'Capital Transit Authority',
  'cta-fleet',
  'cta-fleet.local',
  'fleet-admin@capitaltechalliance.com',
  '{}'::jsonb,
  'enterprise',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Base users for notifications/communication
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
)
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, phone, is_active)
VALUES
  ((SELECT tenant_id FROM tenant), 'admin@capitaltechalliance.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eck/gHVMxDAq', 'Alex', 'Morgan', 'Admin', '(850) 555-0101', true),
  ((SELECT tenant_id FROM tenant), 'dispatcher@capitaltechalliance.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eck/gHVMxDAq', 'Jordan', 'Lee', 'Dispatcher', '(850) 555-0102', true),
  ((SELECT tenant_id FROM tenant), 'mechanic@capitaltechalliance.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eck/gHVMxDAq', 'Casey', 'Patel', 'Mechanic', '(850) 555-0103', true),
  ((SELECT tenant_id FROM tenant), 'safety@capitaltechalliance.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eck/gHVMxDAq', 'Riley', 'Nguyen', 'Manager', '(850) 555-0104', true),
  ((SELECT tenant_id FROM tenant), 'finance@capitaltechalliance.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5eck/gHVMxDAq', 'Taylor', 'Brooks', 'Manager', '(850) 555-0105', true)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Facilities (if none exist for tenant)
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
)
INSERT INTO facilities (tenant_id, name, code, type, address, city, state, zip_code, country, latitude, longitude, capacity, current_occupancy, contact_name, contact_phone, contact_email)
SELECT
  tenant.tenant_id,
  f.name,
  f.code,
  f.type,
  f.address,
  f.city,
  f.state,
  f.zip,
  'US',
  f.lat,
  f.lng,
  f.capacity,
  f.occupancy,
  f.contact_name,
  f.contact_phone,
  f.contact_email
FROM tenant,
  (VALUES
    ('Central Operations Center', 'FAC-001', 'operations', '1201 Fleet Ops Blvd', 'Tallahassee', 'FL', '32301', 30.4383, -84.2807, 120, 84, 'Avery Collins', '(850) 555-0111', 'ops@capitaltechalliance.com'),
    ('North Maintenance Yard', 'FAC-002', 'maintenance', '4200 Northside Dr', 'Tallahassee', 'FL', '32303', 30.4867, -84.2485, 80, 41, 'Morgan Hayes', '(850) 555-0112', 'maintenance@capitaltechalliance.com'),
    ('East Charging Depot', 'FAC-003', 'charging', '3100 Capital Cir NE', 'Tallahassee', 'FL', '32308', 30.4660, -84.2302, 60, 22, 'Jamie Rivera', '(850) 555-0113', 'ev@capitaltechalliance.com'),
    ('South Logistics Hub', 'FAC-004', 'logistics', '9500 Apalachee Pkwy', 'Tallahassee', 'FL', '32311', 30.3930, -84.2164, 150, 96, 'Quinn Parker', '(850) 555-0114', 'logistics@capitaltechalliance.com')
  ) AS f(name, code, type, address, city, state, zip, lat, lng, capacity, occupancy, contact_name, contact_phone, contact_email)
WHERE NOT EXISTS (
  SELECT 1 FROM facilities WHERE tenant_id = tenant.tenant_id
);

-- Drivers (if none exist for tenant)
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
)
INSERT INTO drivers (
  tenant_id, first_name, last_name, email, phone, license_number, license_state,
  license_expiry_date, hire_date, status, created_at
)
SELECT
  tenant.tenant_id,
  (ARRAY['Jordan','Morgan','Casey','Riley','Taylor','Avery','Quinn','Parker','Jamie','Skylar'])[gs],
  (ARRAY['Lee','Patel','Nguyen','Brooks','Collins','Reed','Hayes','Morales','Griffin','Young'])[gs],
  'driver' || gs || '@capitaltechalliance.com',
  '(850) 555-' || LPAD((1200 + gs)::text, 4, '0'),
  'FL-' || LPAD(gs::text, 8, '0'),
  'FL',
  (CURRENT_DATE + (365 + (gs * 9) % 730) * INTERVAL '1 day')::timestamp,
  NOW() - (gs * 30 || ' days')::interval,
  (ARRAY['active','active','active','training','on_leave'])[((gs - 1) % 5) + 1]::driver_status,
  NOW() - (gs * 15 || ' days')::interval
FROM tenant
CROSS JOIN generate_series(1, 10) AS gs
WHERE NOT EXISTS (
  SELECT 1 FROM drivers WHERE tenant_id = tenant.tenant_id
);

-- Vehicles (if none exist for tenant)
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
)
INSERT INTO vehicles (
  tenant_id, vin, name, number, type, make, model, year, license_plate,
  status, fuel_type, fuel_level, odometer, latitude, longitude, location_address,
  assigned_facility_id, created_at
)
SELECT
  tenant.tenant_id,
  '1HGBH41JXMN' || LPAD(gs::text, 6, '0'),
  'Fleet Vehicle ' || gs,
  'UNIT-' || LPAD(gs::text, 4, '0'),
  (ARRAY['truck','van','sedan','suv','bus'])[((gs - 1) % 5) + 1]::vehicle_type,
  (ARRAY['Ford','Chevrolet','RAM','GMC','Toyota'])[((gs - 1) % 5) + 1],
  (ARRAY['F-150','Express','ProMaster','Sierra','RAV4'])[((gs - 1) % 5) + 1],
  2017 + ((gs - 1) % 7),
  'FL-' || LPAD((10000 + gs)::text, 6, '0'),
  (ARRAY['active','active','service','maintenance','idle'])[((gs - 1) % 5) + 1]::vehicle_status,
  (ARRAY['gasoline','diesel','gasoline','hybrid','electric'])[((gs - 1) % 5) + 1]::fuel_type,
  35 + (gs * 3) % 60,
  15000 + (gs * 1750) % 120000,
  30.44 + (random() * 0.06),
  -84.30 + (random() * 0.06),
  'Tallahassee, FL',
  f.id,
  NOW() - (gs * 2 || ' days')::interval
FROM tenant
CROSS JOIN generate_series(1, 20) AS gs
CROSS JOIN LATERAL (
  SELECT id FROM facilities WHERE tenant_id = tenant.tenant_id ORDER BY random() LIMIT 1
) AS f
WHERE NOT EXISTS (
  SELECT 1 FROM vehicles WHERE tenant_id = tenant.tenant_id
);

-- Vendors
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
)
INSERT INTO vendors (
  tenant_id, name, code, type, contact_name, contact_email, contact_phone,
  address, city, state, zip_code, country, website, payment_terms,
  preferred_vendor, rating, metadata
)
SELECT
  tenant.tenant_id,
  v.name,
  v.code,
  v.type,
  v.contact_name,
  v.contact_email,
  v.contact_phone,
  v.address,
  v.city,
  v.state,
  v.zip_code,
  'US',
  v.website,
  v.payment_terms,
  v.preferred_vendor,
  v.rating,
  v.metadata
FROM tenant,
  (VALUES
    ('AutoParts Direct', 'VND-001', 'Parts', 'Dana Collins', 'orders@autopartsdirect.com', '(850) 555-0201', '200 Supply Chain Rd', 'Tallahassee', 'FL', '32301', 'https://autopartsdirect.com', 'Net 30', true, 4.8, '{"lat":30.4391,"lng":-84.2795}'::jsonb),
    ('Fleet Services Inc', 'VND-002', 'Maintenance', 'Sam Rhodes', 'support@fleetservices.com', '(850) 555-0202', '4100 Service Ln', 'Tallahassee', 'FL', '32303', 'https://fleetservices.com', 'Net 15', true, 4.6, '{"lat":30.4832,"lng":-84.2499}'::jsonb),
    ('Tire Warehouse USA', 'VND-003', 'Tires', 'Morgan Fields', 'sales@tirewarehouse.com', '(850) 555-0203', '3500 Rubber Ave', 'Tallahassee', 'FL', '32304', 'https://tirewarehouse.com', 'Net 45', false, 4.7, '{"lat":30.4605,"lng":-84.2904}'::jsonb),
    ('Fuel Depot Central', 'VND-004', 'Fuel', 'Jordan Ellis', 'fuel@fueldepot.com', '(850) 555-0204', '2800 Terminal Dr', 'Tallahassee', 'FL', '32310', 'https://fueldepot.com', 'Net 7', true, 4.5, '{"lat":30.4016,"lng":-84.2971}'::jsonb),
    ('Industrial Supplies Co', 'VND-005', 'Equipment', 'Riley Monroe', 'orders@industrialsupplies.com', '(850) 555-0205', '5100 Industrial Way', 'Tallahassee', 'FL', '32309', 'https://industrialsupplies.com', 'Net 30', false, 4.4, '{"lat":30.5122,"lng":-84.2107}'::jsonb)
  ) AS v(name, code, type, contact_name, contact_email, contact_phone, address, city, state, zip_code, website, payment_terms, preferred_vendor, rating, metadata)
WHERE NOT EXISTS (
  SELECT 1 FROM vendors
  WHERE tenant_id = tenant.tenant_id AND code = v.code
);

-- Parts Inventory
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
)
INSERT INTO parts_inventory (
  tenant_id, part_number, name, description, category, manufacturer,
  unit_cost, unit_of_measure, quantity_on_hand, reorder_point, reorder_quantity,
  location_in_warehouse, facility_id
)
SELECT
  tenant.tenant_id,
  'PART-' || LPAD(gs::text, 4, '0'),
  part.name,
  part.description,
  part.category,
  part.manufacturer,
  part.unit_cost,
  part.uom,
  part.qty,
  part.reorder_point,
  part.reorder_qty,
  part.location,
  f.id
FROM tenant
CROSS JOIN LATERAL (
  SELECT id FROM facilities WHERE tenant_id = tenant.tenant_id ORDER BY random() LIMIT 1
) AS f
CROSS JOIN (
  VALUES
    (1, 'Brake Pads', 'Ceramic brake pads for light-duty trucks', 'Brakes', 'Brembo', 42.50, 'set', 45, 20, 40, 'A-1'),
    (2, 'Oil Filter', 'Premium oil filter', 'Filters', 'Mobil', 8.75, 'each', 120, 40, 80, 'B-2'),
    (3, 'Air Filter', 'High-flow air filter', 'Filters', 'Bosch', 15.20, 'each', 65, 25, 50, 'B-3'),
    (4, 'Windshield Wipers', 'All-weather wiper blades', 'Accessories', 'RainX', 18.00, 'pair', 32, 15, 30, 'C-1'),
    (5, 'Brake Rotors', 'Front brake rotors', 'Brakes', 'ACDelco', 92.00, 'each', 20, 8, 16, 'A-4'),
    (6, 'Spark Plugs', 'Iridium spark plugs', 'Ignition', 'NGK', 6.50, 'each', 200, 60, 120, 'D-2'),
    (7, 'Transmission Fluid', 'Synthetic transmission fluid', 'Fluids', 'Valvoline', 28.00, 'quart', 85, 30, 60, 'E-1'),
    (8, 'Coolant', 'Extended life coolant', 'Fluids', 'Prestone', 19.00, 'gallon', 55, 20, 40, 'E-3')
  ) AS part(gs, name, description, category, manufacturer, unit_cost, uom, qty, reorder_point, reorder_qty, location)
ON CONFLICT (tenant_id, part_number) DO NOTHING;

-- Assets (non-vehicle equipment)
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
)
INSERT INTO assets (
  tenant_id, asset_number, name, description, type, category,
  manufacturer, model, serial_number, purchase_date, purchase_price,
  current_value, status, assigned_facility_id, condition, warranty_expiry_date,
  notes, metadata
)
SELECT
  tenant.tenant_id,
  'AST-' || LPAD(gs::text, 4, '0'),
  asset.name,
  asset.description,
  asset.type,
  asset.category,
  asset.manufacturer,
  asset.model,
  'SN' || LPAD(gs::text, 6, '0'),
  NOW() - (asset.age_days || ' days')::interval,
  asset.purchase_price,
  asset.current_value,
  asset.status,
  f.id,
  asset.condition,
  NOW() + (asset.warranty_days || ' days')::interval,
  asset.notes,
  '{}'::jsonb
FROM tenant
CROSS JOIN LATERAL (
  SELECT id FROM facilities WHERE tenant_id = tenant.tenant_id ORDER BY random() LIMIT 1
) AS f
CROSS JOIN (
  VALUES
    (1, 'Portable Generator', '20kW portable generator', 'equipment', 'power', 'Honda', 'EU2200', 540, 3200.00, 2500.00, 'active', 'good', 180, 'Used for backup power in field operations'),
    (2, 'Hydraulic Lift', 'Vehicle service lift', 'equipment', 'maintenance', 'BendPak', 'XPR-10A', 920, 12500.00, 9800.00, 'active', 'excellent', 365, 'Primary lift in maintenance bay'),
    (3, 'Forklift', 'Warehouse forklift', 'equipment', 'logistics', 'Toyota', '8FGCU25', 1400, 26000.00, 21500.00, 'active', 'good', 270, 'Used in South Logistics Hub'),
    (4, 'Diagnostic Scanner', 'OBD-II diagnostic scanner', 'tool', 'diagnostics', 'Snap-On', 'TRITON-D10', 210, 5400.00, 4700.00, 'active', 'excellent', 365, 'Assigned to mobile technicians'),
    (5, 'Air Compressor', '80-gallon air compressor', 'equipment', 'maintenance', 'Ingersoll Rand', 'SS5L8', 760, 3900.00, 3200.00, 'active', 'good', 365, 'Supports shop pneumatic tools')
  ) AS asset(gs, name, description, type, category, manufacturer, model, age_days, purchase_price, current_value, status, condition, warranty_days, notes)
ON CONFLICT (tenant_id, asset_number) DO NOTHING;

-- Asset Analytics (last 30 days)
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
)
INSERT INTO asset_analytics (
  tenant_id, asset_id, period_start, period_end, hours_used, utilization_percentage,
  downtime_hours, maintenance_cost, operating_cost, total_cost, incidents_count, maintenance_count
)
SELECT
  tenant.tenant_id,
  a.id,
  NOW() - INTERVAL '30 days',
  NOW(),
  (random() * 160)::numeric(10,2),
  (50 + random() * 45)::numeric(5,2),
  (random() * 20)::numeric(10,2),
  (random() * 1200)::numeric(12,2),
  (random() * 2800)::numeric(12,2),
  (random() * 4000)::numeric(12,2),
  (random() * 3)::int,
  (random() * 6)::int
FROM tenant
JOIN assets a ON a.tenant_id = tenant.tenant_id
WHERE NOT EXISTS (
  SELECT 1 FROM asset_analytics aa
  WHERE aa.asset_id = a.id
    AND aa.period_start = (NOW() - INTERVAL '30 days')
    AND aa.period_end = NOW()
);

-- Geofences for compliance/broadcast zones
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
),
facility AS (
  SELECT id, latitude, longitude FROM facilities WHERE tenant_id = (SELECT tenant_id FROM tenant) ORDER BY random() LIMIT 1
)
INSERT INTO geofences (
  tenant_id, name, description, type, facility_id, center_lat, center_lng, radius, color,
  notify_on_entry, notify_on_exit, metadata
)
SELECT
  tenant.tenant_id,
  zone.name,
  zone.description,
  zone.type,
  facility.id,
  facility.latitude + zone.lat_offset,
  facility.longitude + zone.lng_offset,
  zone.radius,
  zone.color,
  zone.notify_entry,
  zone.notify_exit,
  zone.metadata
FROM tenant, facility,
  (VALUES
    ('Annual Inspection Zone A', 'Vehicles due for annual inspection', 'inspection', 0.012, -0.008, 5000, '#f59e0b', true, false, '{"status":"warning","severity":"medium","dueDate":"2025-03-15","jurisdiction":"Leon County"}'::jsonb),
    ('Emissions Compliance Zone', 'Emissions certificates expiring soon', 'certification', -0.010, 0.006, 3500, '#ef4444', false, true, '{"status":"expired","severity":"high","dueDate":"2025-02-10","jurisdiction":"State of Florida"}'::jsonb),
    ('DOT Regulatory Zone', 'Federal DOT compliance monitoring', 'regulatory', 0.004, 0.004, 7500, '#22c55e', false, false, '{"status":"compliant","severity":"low","jurisdiction":"Federal DOT"}'::jsonb),
    ('Broadcast Zone Downtown', 'Downtown broadcast zone', 'broadcast', 0.006, -0.002, 4500, '#3b82f6', true, true, '{"status":"active","severity":"low"}'::jsonb)
  ) AS zone(name, description, type, lat_offset, lng_offset, radius, color, notify_entry, notify_exit, metadata)
WHERE NOT EXISTS (
  SELECT 1 FROM geofences g
  WHERE g.tenant_id = tenant.tenant_id AND g.name = zone.name
);

-- Notifications for dashboard/communication
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
),
recipient AS (
  SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM tenant) ORDER BY random() LIMIT 1
)
INSERT INTO notifications (
  tenant_id, user_id, title, message, type, priority, related_entity_type, related_entity_id, action_url, metadata
)
SELECT
  tenant.tenant_id,
  recipient.id,
  n.title,
  n.message,
  n.type::notification_type,
  n.priority::priority,
  n.entity_type,
  n.entity_id,
  n.action_url,
  n.metadata
FROM tenant, recipient,
  (VALUES
    ('Vehicle Inspection Due', 'Vehicle UNIT-0042 requires inspection within 10 days.', 'warning', 'high', 'vehicle', NULL::uuid, '/fleet/inspections', '{}'::jsonb),
    ('New Purchase Order', 'PO-2026-0045 approved and sent to vendor.', 'info', 'medium', 'purchase_order', NULL::uuid, '/procurement/orders', '{}'::jsonb),
    ('Safety Incident Reported', 'Incident INC-2026-0012 logged in district 3.', 'alert', 'high', 'incident', NULL::uuid, '/safety/incidents', '{}'::jsonb),
    ('Maintenance Scheduled', 'Work order WO-2026-0105 scheduled for tomorrow.', 'info', 'low', 'work_order', NULL::uuid, '/maintenance/schedule', '{}'::jsonb)
  ) AS n(title, message, type, priority, entity_type, entity_id, action_url, metadata);

-- Communication Logs (messages)
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
),
sender AS (
  SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM tenant) ORDER BY random() LIMIT 1
),
recipient AS (
  SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM tenant) ORDER BY random() LIMIT 1
)
INSERT INTO communication_logs (
  tenant_id, communication_type, direction, from_user_id, to_user_id,
  from_address, to_address, subject, message_body, status, sent_at, metadata
)
SELECT
  tenant.tenant_id,
  'message',
  'outbound',
  sender.id,
  recipient.id,
  'dispatch@capitaltechalliance.com',
  'driver@capitaltechalliance.com',
  msg.subject,
  msg.body,
  'sent',
  NOW() - (msg.minutes_ago || ' minutes')::interval,
  msg.metadata
FROM tenant, sender, recipient,
  (VALUES
    ('Route delay', 'Traffic on I-10, ETA +15 mins.', 12, '{}'::jsonb),
    ('Weather alert', 'Heavy rain expected in Zone 3.', 34, '{}'::jsonb),
    ('Service reminder', 'Vehicle UNIT-0098 due for service.', 55, '{}'::jsonb),
    ('Delivery confirmed', 'Package delivered successfully at Gate B.', 80, '{}'::jsonb)
  ) AS msg(subject, body, minutes_ago, metadata);

-- Training Records
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
),
driver AS (
  SELECT id FROM drivers WHERE tenant_id = (SELECT tenant_id FROM tenant) ORDER BY random() LIMIT 1
)
INSERT INTO training_records (
  tenant_id, driver_id, training_name, training_type, provider, instructor_name,
  start_date, end_date, completion_date, status, passed, score, certificate_number,
  certificate_url, expiry_date, hours_completed, cost, notes
)
SELECT
  tenant.tenant_id,
  driver.id,
  t.training_name,
  t.training_type,
  t.provider,
  t.instructor,
  NOW() - (t.days_ago || ' days')::interval,
  NOW() - (t.days_ago || ' days')::interval + INTERVAL '4 hours',
  NOW() - (t.days_ago || ' days')::interval + INTERVAL '4 hours',
  'completed',
  true,
  (85 + (random() * 14))::numeric(5,2),
  'CERT-' || LPAD((1000 + t.seq)::text, 6, '0'),
  '/documents/training-' || t.seq || '.txt',
  NOW() + INTERVAL '365 days',
  4.0,
  (150 + random() * 50)::numeric(10,2),
  'Annual compliance training.'
FROM tenant, driver,
  (VALUES
    (1, 'Defensive Driving', 'Safety', 'Fleet Training Academy', 'Morgan Fields', 10),
    (2, 'OSHA Compliance', 'Compliance', 'Safety Institute', 'Jordan Ellis', 30),
    (3, 'EV Safety Protocols', 'Safety', 'EV Certification Board', 'Taylor Brooks', 45)
  ) AS t(seq, training_name, training_type, provider, instructor, days_ago)
WHERE NOT EXISTS (
  SELECT 1 FROM training_records WHERE tenant_id = tenant.tenant_id
);

-- Documents (static file URLs served from /public/documents)
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
)
INSERT INTO documents (
  tenant_id, name, description, type, category, file_url, file_size, mime_type,
  document_type, title, file_name, storage_path, uploaded_by, uploaded_at
)
SELECT
  tenant.tenant_id,
  d.name,
  d.description,
  d.type::document_type,
  d.category,
  d.file_url,
  d.file_size,
  d.mime_type,
  d.document_type::document_type_enum,
  d.title,
  d.file_name,
  d.storage_path,
  u.id,
  NOW() - (d.days_ago || ' days')::interval
FROM tenant
JOIN users u ON u.tenant_id = tenant.tenant_id
CROSS JOIN (
  VALUES
    ('Annual Safety Policy', 'Fleet-wide safety policy', 'policy', 'Policy', '/documents/safety-policy.txt', 2048, 'text/plain', 'other', 'Annual Safety Policy', 'safety-policy.txt', 'public/documents/safety-policy.txt', 12),
    ('Inspection Checklist', 'Standard vehicle inspection checklist', 'form', 'Inspection', '/documents/inspection-checklist.txt', 1024, 'text/plain', 'inspection', 'Inspection Checklist', 'inspection-checklist.txt', 'public/documents/inspection-checklist.txt', 8),
    ('Sample Invoice', 'Vendor invoice for parts order', 'invoice', 'Finance', '/documents/invoice-sample.txt', 1024, 'text/plain', 'other', 'Sample Invoice', 'invoice-sample.txt', 'public/documents/invoice-sample.txt', 3)
  ) AS d(name, description, type, category, file_url, file_size, mime_type, document_type, title, file_name, storage_path, days_ago)
WHERE NOT EXISTS (
  SELECT 1 FROM documents doc
  WHERE doc.tenant_id = tenant.tenant_id AND doc.file_name = d.file_name
);

-- Purchase Orders
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
)
INSERT INTO purchase_orders (
  tenant_id, number, vendor_id, order_date, expected_delivery_date,
  subtotal, tax_amount, shipping_cost, total_amount, payment_status,
  line_items, status, shipping_address, notes
)
SELECT
  tenant.tenant_id,
  'PO-2026-' || LPAD(gs::text, 4, '0'),
  v.id,
  NOW() - (gs || ' days')::interval,
  NOW() + (gs % 7 || ' days')::interval,
  2500 + (gs * 37),
  150 + (gs * 4),
  85,
  2500 + (gs * 37) + 150 + 85,
  'unpaid',
  jsonb_build_array(
    jsonb_build_object('part', 'Brake Pads', 'qty', 10, 'unitCost', 42.5),
    jsonb_build_object('part', 'Oil Filter', 'qty', 20, 'unitCost', 8.75)
  ),
  CASE WHEN gs % 3 = 0 THEN 'completed' WHEN gs % 3 = 1 THEN 'in_progress' ELSE 'pending' END::status,
  '1201 Fleet Ops Blvd, Tallahassee, FL 32301',
  'Auto-generated for demo data'
FROM tenant
CROSS JOIN generate_series(1, 8) AS gs
JOIN LATERAL (
  SELECT id FROM vendors WHERE tenant_id = tenant.tenant_id ORDER BY random() LIMIT 1
) AS v ON true
ON CONFLICT (tenant_id, number) DO NOTHING;

-- Invoices
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
)
INSERT INTO invoices (
  tenant_id, number, type, vendor_id, purchase_order_id, status,
  invoice_date, due_date, subtotal, tax_amount, total_amount,
  paid_amount, balance_due, payment_method, line_items, document_url
)
SELECT
  tenant.tenant_id,
  'INV-2026-' || LPAD(gs::text, 4, '0'),
  'vendor',
  v.id,
  po.id,
  CASE WHEN gs % 2 = 0 THEN 'approved' ELSE 'pending' END,
  NOW() - (gs || ' days')::interval,
  NOW() + INTERVAL '15 days',
  1800 + (gs * 25),
  120 + (gs * 3),
  1920 + (gs * 28),
  CASE WHEN gs % 2 = 0 THEN 1920 + (gs * 28) ELSE 0 END,
  CASE WHEN gs % 2 = 0 THEN 0 ELSE 1920 + (gs * 28) END,
  'ACH',
  jsonb_build_array(
    jsonb_build_object('item', 'Maintenance Parts', 'qty', 1, 'amount', 900),
    jsonb_build_object('item', 'Labor', 'qty', 1, 'amount', 900)
  ),
  '/documents/invoice-sample.txt'
FROM tenant
CROSS JOIN generate_series(1, 6) AS gs
JOIN LATERAL (
  SELECT id FROM vendors WHERE tenant_id = tenant.tenant_id ORDER BY random() LIMIT 1
) AS v ON true
JOIN LATERAL (
  SELECT id FROM purchase_orders WHERE tenant_id = tenant.tenant_id ORDER BY random() LIMIT 1
) AS po ON true
ON CONFLICT (tenant_id, number) DO NOTHING;

-- On-call shifts for drilldown
WITH tenant AS (
  SELECT id AS tenant_id FROM tenants WHERE slug = 'cta-fleet' LIMIT 1
),
u AS (
  SELECT id FROM users WHERE tenant_id = (SELECT tenant_id FROM tenant) ORDER BY random() LIMIT 1
)
INSERT INTO on_call_shifts (
  tenant_id, shift_name, shift_type, user_id, role, start_time, end_time, primary_phone,
  status, calls_received, incidents_responded, notes, created_by
)
SELECT
  tenant.tenant_id,
  'Operations Shift ' || gs,
  'on_call',
  u.id,
  'Operations',
  NOW() - INTERVAL '2 hours',
  NOW() + INTERVAL '6 hours',
  '(850) 555-0101',
  'scheduled',
  (random() * 4)::int,
  (random() * 2)::int,
  'Primary response shift',
  u.id
FROM tenant, u, generate_series(1, 3) AS gs;

COMMIT;
