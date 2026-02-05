-- ============================================================================
-- CTA Demo Ops Seed (Tallahassee) - Routes / Work Orders / Incidents / Inspections
-- ============================================================================
-- Purpose:
--   Populate the CTA demo tenant with operational records so every major UI
--   drilldown has real DB-backed data (no frontend mocks).
--
-- Idempotency:
--   Each section inserts only when the corresponding table is empty for the CTA tenant.
--
-- Notes:
--   - Password hash used elsewhere corresponds to `TestPassword123!` (bcrypt, cost=12).
--   - Uses existing CTA vehicles/drivers/facilities/users inserted by the full CTA seed.
-- ============================================================================

-- Ensure a dedicated CTA Admin user exists for demos.
WITH cta AS (
  SELECT id AS tenant_id
  FROM tenants
  WHERE slug = 'cta-fleet'
  LIMIT 1
)
INSERT INTO users (
  tenant_id,
  email,
  password_hash,
  first_name,
  last_name,
  phone,
  role,
  is_active,
  provider
)
SELECT
  (SELECT tenant_id FROM cta),
  'cta.admin@cta-fleet.local',
  '$2b$12$.N3w8k/dGtbbLVChW.xX7OH7f3dZ8.v34QqKaDGkzSEj6I8pWZhEO',
  'CTA',
  'Admin',
  '850-555-0100',
  'Admin'::user_role,
  true,
  'local'
WHERE NOT EXISTS (
  SELECT 1
  FROM users u
  WHERE u.tenant_id = (SELECT tenant_id FROM cta)
    AND lower(u.email) = 'cta.admin@cta-fleet.local'
);

-- Seed ROUTES (12) if none exist.
WITH cta AS (
  SELECT id AS tenant_id FROM tenants WHERE slug='cta-fleet' LIMIT 1
),
v AS (
  SELECT id, number, latitude::float8 AS lat, longitude::float8 AS lng
  FROM vehicles
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY number
),
d AS (
  SELECT id
  FROM drivers
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY created_at, id
),
f AS (
  SELECT id, name, latitude::float8 AS lat, longitude::float8 AS lng
  FROM facilities
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY name
),
seed AS (
  SELECT
    gs.i,
    (SELECT tenant_id FROM cta) AS tenant_id,
    (SELECT id FROM v OFFSET (gs.i-1) LIMIT 1) AS vehicle_id,
    (SELECT id FROM d OFFSET ((gs.i-1) % GREATEST((SELECT COUNT(*) FROM d), 1)) LIMIT 1) AS driver_id,
    (SELECT id FROM f OFFSET ((gs.i-1) % GREATEST((SELECT COUNT(*) FROM f), 1)) LIMIT 1) AS start_facility_id,
    (SELECT id FROM f OFFSET ((gs.i) % GREATEST((SELECT COUNT(*) FROM f), 1)) LIMIT 1) AS end_facility_id
  FROM generate_series(1, 12) AS gs(i)
)
INSERT INTO routes (
  id,
  tenant_id,
  name,
  number,
  description,
  type,
  status,
  assigned_vehicle_id,
  assigned_driver_id,
  start_facility_id,
  end_facility_id,
  scheduled_start_time,
  scheduled_end_time,
  estimated_distance,
  estimated_duration,
  waypoints,
  metadata,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  s.tenant_id,
  'CTA Delivery Route ' || lpad(s.i::text, 2, '0'),
  'RTE-' || lpad(s.i::text, 4, '0'),
  'Local Tallahassee service route for CTA operations',
  CASE WHEN (s.i % 3) = 0 THEN 'service' WHEN (s.i % 3) = 1 THEN 'delivery' ELSE 'pickup' END,
  CASE WHEN s.i <= 3 THEN 'in_progress'::status WHEN s.i <= 8 THEN 'pending'::status ELSE 'completed'::status END,
  s.vehicle_id,
  s.driver_id,
  s.start_facility_id,
  s.end_facility_id,
  date_trunc('day', now()) + ((7 + (s.i % 6))::text || ' hours')::interval,
  date_trunc('day', now()) + ((8 + (s.i % 6))::text || ' hours')::interval,
  (5 + (s.i % 12))::numeric,
  (35 + (s.i % 50))::int,
  jsonb_build_array(
    jsonb_build_object('address', 'Tallahassee, FL', 'priority', 1, 'status', 'pending'),
    jsonb_build_object('address', 'Tallahassee, FL', 'priority', 2, 'status', 'pending'),
    jsonb_build_object('address', 'Tallahassee, FL', 'priority', 3, 'status', 'pending')
  ),
  jsonb_build_object('demo', true, 'region', 'Tallahassee'),
  now(),
  now()
FROM seed s
WHERE NOT EXISTS (
  SELECT 1 FROM routes r WHERE r.tenant_id = (SELECT tenant_id FROM cta) LIMIT 1
);

-- Seed WORK ORDERS (20) if none exist.
WITH cta AS (
  SELECT id AS tenant_id FROM tenants WHERE slug='cta-fleet' LIMIT 1
),
v AS (
  SELECT id, number
  FROM vehicles
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY number
),
f AS (
  SELECT id
  FROM facilities
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY name
),
u_mech AS (
  SELECT id
  FROM users
  WHERE tenant_id = (SELECT tenant_id FROM cta)
    AND lower(role::text) IN ('mechanic','manager','supervisor')
  ORDER BY created_at, id
),
u_req AS (
  SELECT id
  FROM users
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY created_at, id
),
seed AS (
  SELECT
    gs.i,
    (SELECT tenant_id FROM cta) AS tenant_id,
    (SELECT id FROM v OFFSET ((gs.i-1) % GREATEST((SELECT COUNT(*) FROM v), 1)) LIMIT 1) AS vehicle_id,
    (SELECT id FROM f OFFSET ((gs.i-1) % GREATEST((SELECT COUNT(*) FROM f), 1)) LIMIT 1) AS facility_id,
    (SELECT id FROM u_mech OFFSET ((gs.i-1) % GREATEST((SELECT COUNT(*) FROM u_mech), 1)) LIMIT 1) AS assigned_to_id,
    (SELECT id FROM u_req OFFSET ((gs.i-1) % GREATEST((SELECT COUNT(*) FROM u_req), 1)) LIMIT 1) AS requested_by_id
  FROM generate_series(1, 20) AS gs(i)
)
INSERT INTO work_orders (
  id,
  tenant_id,
  vehicle_id,
  number,
  title,
  description,
  type,
  priority,
  status,
  assigned_to_id,
  requested_by_id,
  scheduled_start_date,
  scheduled_end_date,
  estimated_cost,
  labor_hours,
  notes,
  metadata,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  s.tenant_id,
  s.vehicle_id,
  'WO-' || to_char(now(), 'YYMMDD') || '-' || lpad(s.i::text, 3, '0'),
  CASE WHEN (s.i % 4) = 0 THEN 'Preventive Maintenance' WHEN (s.i % 4) = 1 THEN 'Repair Request' WHEN (s.i % 4) = 2 THEN 'Inspection Follow-up' ELSE 'Tire / Brake Service' END,
  'CTA demo work order created for operational drilldowns (Tallahassee).',
  CASE WHEN (s.i % 3) = 0 THEN 'preventive'::maintenance_type WHEN (s.i % 3) = 1 THEN 'corrective'::maintenance_type ELSE 'inspection'::maintenance_type END,
  CASE WHEN (s.i % 5) = 0 THEN 'critical'::priority WHEN (s.i % 5) = 1 THEN 'high'::priority WHEN (s.i % 5) = 2 THEN 'medium'::priority ELSE 'low'::priority END,
  CASE WHEN s.i <= 6 THEN 'pending'::status WHEN s.i <= 12 THEN 'in_progress'::status WHEN s.i <= 16 THEN 'on_hold'::status ELSE 'completed'::status END,
  s.assigned_to_id,
  s.requested_by_id,
  now() - ((s.i % 7)::text || ' days')::interval,
  now() + ((s.i % 5)::text || ' days')::interval,
  (150 + (s.i * 25))::numeric,
  (1 + (s.i % 6))::numeric,
  'Notes: demo record for CTA Tallahassee.',
  jsonb_build_object('demo', true, 'source', 'cta_seed'),
  now(),
  now()
FROM seed s
WHERE NOT EXISTS (
  SELECT 1 FROM work_orders w WHERE w.tenant_id = (SELECT tenant_id FROM cta) LIMIT 1
);

-- Seed INCIDENTS (6) if none exist.
WITH cta AS (
  SELECT id AS tenant_id FROM tenants WHERE slug='cta-fleet' LIMIT 1
),
v AS (
  SELECT id, number, latitude::float8 AS lat, longitude::float8 AS lng
  FROM vehicles
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY number
),
d AS (
  SELECT id
  FROM drivers
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY created_at, id
),
u AS (
  SELECT id
  FROM users
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY created_at, id
),
seed AS (
  SELECT
    gs.i,
    (SELECT tenant_id FROM cta) AS tenant_id,
    (SELECT id FROM v OFFSET ((gs.i-1) % GREATEST((SELECT COUNT(*) FROM v), 1)) LIMIT 1) AS vehicle_id,
    (SELECT id FROM d OFFSET ((gs.i-1) % GREATEST((SELECT COUNT(*) FROM d), 1)) LIMIT 1) AS driver_id,
    (SELECT id FROM u OFFSET ((gs.i-1) % GREATEST((SELECT COUNT(*) FROM u), 1)) LIMIT 1) AS reported_by_id,
    (SELECT lat FROM v OFFSET ((gs.i-1) % GREATEST((SELECT COUNT(*) FROM v), 1)) LIMIT 1) AS lat,
    (SELECT lng FROM v OFFSET ((gs.i-1) % GREATEST((SELECT COUNT(*) FROM v), 1)) LIMIT 1) AS lng
  FROM generate_series(1, 6) AS gs(i)
)
INSERT INTO incidents (
  id,
  tenant_id,
  number,
  vehicle_id,
  driver_id,
  type,
  severity,
  status,
  incident_date,
  location,
  latitude,
  longitude,
  description,
  injuries_reported,
  fatalities_reported,
  estimated_cost,
  reported_by_id,
  reported_at,
  metadata,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  s.tenant_id,
  'INC-' || to_char(now(), 'YYMMDD') || '-' || lpad(s.i::text, 2, '0'),
  s.vehicle_id,
  s.driver_id,
  CASE WHEN (s.i % 3) = 0 THEN 'near_miss' WHEN (s.i % 3) = 1 THEN 'property_damage' ELSE 'safety' END,
  CASE WHEN (s.i % 4) = 0 THEN 'critical'::incident_severity WHEN (s.i % 4) = 1 THEN 'major'::incident_severity WHEN (s.i % 4) = 2 THEN 'moderate'::incident_severity ELSE 'minor'::incident_severity END,
  CASE WHEN s.i <= 4 THEN 'pending'::status ELSE 'completed'::status END,
  now() - ((s.i * 3)::text || ' days')::interval,
  'Tallahassee, FL',
  COALESCE(s.lat, 30.4383)::numeric,
  COALESCE(s.lng, -84.2807)::numeric,
  'CTA demo incident record for safety and investigations drilldowns.',
  false,
  false,
  (250 + (s.i * 120))::numeric,
  s.reported_by_id,
  now() - ((s.i * 3)::text || ' days')::interval,
  jsonb_build_object('demo', true, 'region', 'Tallahassee'),
  now(),
  now()
FROM seed s
WHERE NOT EXISTS (
  SELECT 1 FROM incidents i WHERE i.tenant_id = (SELECT tenant_id FROM cta) LIMIT 1
);

-- Seed INSPECTIONS (24) if none exist.
WITH cta AS (
  SELECT id AS tenant_id FROM tenants WHERE slug='cta-fleet' LIMIT 1
),
v AS (
  SELECT id, number
  FROM vehicles
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY number
),
d AS (
  SELECT id
  FROM drivers
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY created_at, id
),
u AS (
  SELECT id, first_name, last_name
  FROM users
  WHERE tenant_id = (SELECT tenant_id FROM cta)
  ORDER BY created_at, id
),
seed AS (
  SELECT
    gs.i,
    (SELECT tenant_id FROM cta) AS tenant_id,
    (SELECT id FROM v OFFSET ((gs.i-1) % GREATEST((SELECT COUNT(*) FROM v), 1)) LIMIT 1) AS vehicle_id,
    (SELECT id FROM d OFFSET ((gs.i-1) % GREATEST((SELECT COUNT(*) FROM d), 1)) LIMIT 1) AS driver_id,
    (SELECT id FROM u OFFSET ((gs.i-1) % GREATEST((SELECT COUNT(*) FROM u), 1)) LIMIT 1) AS inspector_id,
    (SELECT (first_name || ' ' || last_name) FROM u OFFSET ((gs.i-1) % GREATEST((SELECT COUNT(*) FROM u), 1)) LIMIT 1) AS inspector_name
  FROM generate_series(1, 24) AS gs(i)
)
INSERT INTO inspections (
  id,
  tenant_id,
  vehicle_id,
  driver_id,
  inspector_id,
  type,
  status,
  inspector_name,
  location,
  started_at,
  completed_at,
  defects_found,
  passed_inspection,
  notes,
  checklist_data,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  s.tenant_id,
  s.vehicle_id,
  s.driver_id,
  s.inspector_id,
  CASE WHEN (s.i % 3) = 0 THEN 'pre_trip'::inspection_type WHEN (s.i % 3) = 1 THEN 'post_trip'::inspection_type ELSE 'safety'::inspection_type END,
  CASE WHEN (s.i % 5) = 0 THEN 'failed'::status WHEN (s.i % 5) = 1 THEN 'in_progress'::status ELSE 'completed'::status END,
  COALESCE(s.inspector_name, 'CTA Inspector'),
  'Tallahassee, FL',
  now() - ((s.i * 2)::text || ' days')::interval,
  now() - ((s.i * 2 - 1)::text || ' days')::interval,
  CASE WHEN (s.i % 5) = 0 THEN 2 WHEN (s.i % 5) = 1 THEN 1 ELSE 0 END,
  CASE WHEN (s.i % 5) = 0 THEN false ELSE true END,
  'CTA demo inspection record for compliance drilldowns.',
  jsonb_build_object('demo', true, 'items', jsonb_build_array('lights', 'tires', 'brakes')),
  now(),
  now()
FROM seed s
WHERE NOT EXISTS (
  SELECT 1 FROM inspections i WHERE i.tenant_id = (SELECT tenant_id FROM cta) LIMIT 1
);

