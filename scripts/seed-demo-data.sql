-- Seed demo data for scheduling, communications, and admin views.
-- Safe to run multiple times (inserts only when data is missing).

-- Resolve a primary tenant/user (prefers admin@fleet.local)
WITH admin AS (
  SELECT id AS user_id, tenant_id
  FROM users
  ORDER BY (email = 'admin@fleet.local') DESC, created_at
  LIMIT 1
)
-- Facilities (only if none exist for tenant)
INSERT INTO facilities (
  tenant_id, name, code, type, address, city, state, zip_code,
  latitude, longitude, capacity, current_occupancy,
  contact_name, contact_phone, contact_email, operating_hours
)
SELECT
  admin.tenant_id,
  f.name, f.code, f.type, f.address, f.city, f.state, f.zip_code,
  f.latitude, f.longitude, f.capacity, 0,
  f.contact_name, f.contact_phone, f.contact_email,
  f.operating_hours::jsonb
FROM admin
CROSS JOIN (
  VALUES
    ('Central Operations Center','OPS-001','operations','1317 Winewood Blvd','Tallahassee','FL','32399',30.4383, -84.2807, 120, 'Rachel Moreno','(850) 555-0142','ops@capitaltechalliance.com','{"mon":"07:00-19:00","tue":"07:00-19:00","wed":"07:00-19:00","thu":"07:00-19:00","fri":"07:00-19:00"}'),
    ('North Maintenance Yard','MNT-002','maintenance','2555 Shumard Oak Blvd','Tallahassee','FL','32399',30.4689, -84.3299, 80, 'Darius Price','(850) 555-0188','maintenance@capitaltechalliance.com','{"mon":"06:00-18:00","tue":"06:00-18:00","wed":"06:00-18:00","thu":"06:00-18:00","fri":"06:00-18:00"}'),
    ('East Charging Depot','EV-003','ev','925 Lake Bradford Rd','Tallahassee','FL','32304',30.4291, -84.3154, 40, 'Maya Patel','(850) 555-0129','ev@capitaltechalliance.com','{"mon":"06:00-22:00","tue":"06:00-22:00","wed":"06:00-22:00","thu":"06:00-22:00","fri":"06:00-22:00"}')
) AS f(name, code, type, address, city, state, zip_code, latitude, longitude, capacity, contact_name, contact_phone, contact_email, operating_hours)
WHERE NOT EXISTS (
  SELECT 1 FROM facilities WHERE tenant_id = admin.tenant_id
);

-- Appointment Types
WITH admin AS (
  SELECT id AS user_id, tenant_id
  FROM users
  ORDER BY (email = 'admin@fleet.local') DESC, created_at
  LIMIT 1
)
INSERT INTO appointment_types (
  tenant_id, name, description, duration_minutes, color, is_active
)
SELECT
  admin.tenant_id, t.name, t.description, t.duration_minutes, t.color, true
FROM admin
CROSS JOIN (
  VALUES
    ('Preventive Maintenance', 'Scheduled preventative service', 120, '#0ea5e9'),
    ('Inspection', 'DOT/compliance inspection', 60, '#22c55e'),
    ('Repair', 'Corrective repair appointment', 180, '#f97316'),
    ('Detailing', 'Interior/exterior detailing', 90, '#6366f1'),
    ('Tire Service', 'Rotation and pressure calibration', 75, '#ef4444')
) AS t(name, description, duration_minutes, color)
WHERE NOT EXISTS (
  SELECT 1 FROM appointment_types WHERE tenant_id = admin.tenant_id
);

-- Service Bays (3 per facility)
WITH admin AS (
  SELECT id AS user_id, tenant_id
  FROM users
  ORDER BY (email = 'admin@fleet.local') DESC, created_at
  LIMIT 1
),
tenant_facilities AS (
  SELECT id, tenant_id FROM facilities WHERE tenant_id = (SELECT tenant_id FROM admin)
)
INSERT INTO service_bays (
  tenant_id, facility_id, bay_name, bay_number, bay_type, is_active
)
SELECT
  f.tenant_id,
  f.id,
  'Bay ' || gs AS bay_name,
  gs AS bay_number,
  CASE WHEN gs = 1 THEN 'heavy' WHEN gs = 2 THEN 'standard' ELSE 'ev' END AS bay_type,
  true
FROM tenant_facilities f
CROSS JOIN generate_series(1, 3) gs
WHERE NOT EXISTS (
  SELECT 1 FROM service_bays sb
  WHERE sb.tenant_id = f.tenant_id AND sb.facility_id = f.id AND sb.bay_number = gs
);

-- Vehicle Reservations (seed only if none exist for tenant)
WITH admin AS (
  SELECT id AS user_id, tenant_id
  FROM users
  ORDER BY (email = 'admin@fleet.local') DESC, created_at
  LIMIT 1
)
INSERT INTO vehicle_reservations (
  tenant_id, vehicle_id, reserved_by, driver_id, reservation_type,
  start_time, end_time, pickup_location, dropoff_location,
  estimated_miles, purpose, notes, status, approval_status, approved_by, approved_at
)
SELECT
  admin.tenant_id,
  (SELECT id FROM vehicles WHERE tenant_id = admin.tenant_id ORDER BY random() LIMIT 1),
  admin.user_id,
  (SELECT id FROM drivers WHERE tenant_id = admin.tenant_id ORDER BY random() LIMIT 1),
  CASE WHEN g % 4 = 0 THEN 'delivery'
       WHEN g % 4 = 1 THEN 'service'
       WHEN g % 4 = 2 THEN 'personal'
       ELSE 'general' END,
  CASE WHEN g <= 10
       THEN date_trunc('hour', NOW()) + (g || ' days')::interval + interval '8 hours'
       ELSE date_trunc('hour', NOW()) - ((g - 10) || ' days')::interval + interval '9 hours'
  END AS start_time,
  CASE WHEN g <= 10
       THEN date_trunc('hour', NOW()) + (g || ' days')::interval + interval '12 hours'
       ELSE date_trunc('hour', NOW()) - ((g - 10) || ' days')::interval + interval '13 hours'
  END AS end_time,
  'Central Ops' AS pickup_location,
  'Field Site ' || g AS dropoff_location,
  (40 + (g * 3))::numeric AS estimated_miles,
  'Operational assignment #' || g,
  'Auto-seeded reservation for demo',
  CASE WHEN g <= 10 AND g % 3 = 0 THEN 'pending'
       WHEN g <= 10 THEN 'confirmed'
       ELSE 'completed' END,
  CASE WHEN g <= 10 AND g % 3 = 0 THEN 'pending' ELSE 'approved' END,
  CASE WHEN g <= 10 AND g % 3 = 0 THEN NULL ELSE admin.user_id END,
  CASE WHEN g <= 10 AND g % 3 = 0 THEN NULL ELSE NOW() - interval '1 day' END
FROM admin, generate_series(1, 20) g
WHERE NOT EXISTS (
  SELECT 1 FROM vehicle_reservations WHERE tenant_id = admin.tenant_id
);

-- Service Bay Schedules (seed only if none exist for tenant)
WITH admin AS (
  SELECT id AS user_id, tenant_id
  FROM users
  ORDER BY (email = 'admin@fleet.local') DESC, created_at
  LIMIT 1
)
INSERT INTO service_bay_schedules (
  tenant_id, vehicle_id, service_bay_id, appointment_type_id,
  assigned_technician_id, work_order_id, priority, notes, status,
  scheduled_start, scheduled_end
)
SELECT
  admin.tenant_id,
  (SELECT id FROM vehicles WHERE tenant_id = admin.tenant_id ORDER BY random() LIMIT 1),
  (SELECT id FROM service_bays WHERE tenant_id = admin.tenant_id ORDER BY random() LIMIT 1),
  (SELECT id FROM appointment_types WHERE tenant_id = admin.tenant_id ORDER BY random() LIMIT 1),
  (SELECT id FROM users WHERE tenant_id = admin.tenant_id ORDER BY random() LIMIT 1),
  (SELECT id FROM work_orders WHERE tenant_id = admin.tenant_id ORDER BY random() LIMIT 1),
  CASE WHEN g % 3 = 0 THEN 'high' WHEN g % 3 = 1 THEN 'medium' ELSE 'low' END,
  'Scheduled maintenance appointment',
  CASE WHEN g <= 6 THEN 'scheduled' ELSE 'completed' END,
  CASE WHEN g <= 6
       THEN date_trunc('hour', NOW()) + (g || ' days')::interval + interval '7 hours'
       ELSE date_trunc('hour', NOW()) - ((g - 6) || ' days')::interval + interval '7 hours'
  END,
  CASE WHEN g <= 6
       THEN date_trunc('hour', NOW()) + (g || ' days')::interval + interval '10 hours'
       ELSE date_trunc('hour', NOW()) - ((g - 6) || ' days')::interval + interval '10 hours'
  END
FROM admin, generate_series(1, 12) g
WHERE NOT EXISTS (
  SELECT 1 FROM service_bay_schedules WHERE tenant_id = admin.tenant_id
);

-- Calendar Integrations (seed for admin user if none exist)
WITH admin AS (
  SELECT id AS user_id, tenant_id
  FROM users
  ORDER BY (email = 'admin@fleet.local') DESC, created_at
  LIMIT 1
)
INSERT INTO calendar_integrations (
  tenant_id, user_id, provider, calendar_id, calendar_name, calendar_type,
  is_primary, is_enabled, is_synced, sync_direction,
  sync_vehicle_reservations, sync_maintenance_appointments, sync_work_orders,
  sync_status, settings
)
SELECT
  admin.tenant_id,
  admin.user_id,
  i.provider,
  'primary',
  i.calendar_name,
  'personal',
  i.is_primary,
  false,
  false,
  'bidirectional',
  true,
  true,
  true,
  'not_configured',
  '{}'::jsonb
FROM admin
CROSS JOIN (
  VALUES
    ('microsoft', 'Microsoft Outlook', true),
    ('google', 'Google Calendar', false)
) AS i(provider, calendar_name, is_primary)
WHERE NOT EXISTS (
  SELECT 1 FROM calendar_integrations WHERE user_id = admin.user_id
);

-- Announcements (seed only if none exist for tenant)
WITH admin AS (
  SELECT id AS user_id, tenant_id
  FROM users
  ORDER BY (email = 'admin@fleet.local') DESC, created_at
  LIMIT 1
)
INSERT INTO announcements (
  tenant_id, title, message, type, priority, target_roles,
  published_at, expires_at, created_by_id, metadata
)
SELECT
  admin.tenant_id,
  a.title,
  a.message,
  a.type::notification_type,
  a.priority::priority,
  a.target_roles::jsonb,
  NOW() - interval '1 day',
  NOW() + interval '30 days',
  admin.user_id,
  a.metadata::jsonb
FROM admin
CROSS JOIN (
  VALUES
    ('Winter Weather Protocol Update','Updated route guidance and shelter locations for severe weather.','info','medium','["Dispatcher","Driver"]','{"views":120,"acknowledgedBy":85,"totalRecipients":140,"author":"Operations"}'),
    ('Fleet Safety Standup','Mandatory safety standup Friday 9 AM in Teams.','info','high','["Driver","Manager"]','{"views":96,"acknowledgedBy":70,"totalRecipients":110,"author":"Safety"}'),
    ('Maintenance Window','Planned maintenance window for telematics backend Saturday 02:00-04:00.','warning','medium','["Admin","Manager"]','{"views":40,"acknowledgedBy":18,"totalRecipients":24,"author":"IT"}'),
    ('Fuel Card Policy Refresh','Updated rules for after-hours fuel purchases.','info','low','["Driver","Manager"]','{"views":78,"acknowledgedBy":44,"totalRecipients":95,"author":"Finance"}'),
    ('Incident Reporting Reminder','Use the mobile app for incident reports within 30 minutes.','warning','high','["Driver"]','{"views":130,"acknowledgedBy":90,"totalRecipients":150,"author":"Compliance"}')
) AS a(title, message, type, priority, target_roles, metadata)
WHERE NOT EXISTS (
  SELECT 1 FROM announcements WHERE tenant_id = admin.tenant_id
);

-- Communication Logs (seed additional types if limited volume)
WITH admin AS (
  SELECT id AS user_id, tenant_id
  FROM users
  ORDER BY (email = 'admin@fleet.local') DESC, created_at
  LIMIT 1
)
INSERT INTO communication_logs (
  tenant_id, communication_type, direction, from_user_id, to_user_id,
  from_address, to_address, subject, message_body, status, sent_at, metadata
)
SELECT
  admin.tenant_id,
  c.communication_type,
  c.direction,
  admin.user_id,
  NULL,
  c.from_address,
  c.to_address,
  c.subject,
  c.message_body,
  c.status,
  NOW() - (c.offset_days || ' days')::interval,
  c.metadata::jsonb
FROM admin
CROSS JOIN (
  VALUES
    ('teams','outbound','dispatch@capitaltechalliance.com','ops-team@capitaltechalliance.com','Shift Coverage Update','Coverage updated for North sector.','sent',1,'{"channel":"#dispatch","priority":"high"}'),
    ('sms','outbound','dispatch@capitaltechalliance.com','driver1@capitaltechalliance.com','Route Change','Detour added due to construction.','delivered',0,'{"channel":"#routes","priority":"normal"}'),
    ('email','outbound','fleet@capitaltechalliance.com','vendor@capitaltechalliance.com','Purchase Order Update','Updated PO for tire replacements.','sent',2,'{"channel":"#procurement","priority":"normal"}'),
    ('in_app','outbound','system@capitaltechalliance.com','all@capitaltechalliance.com','Training Reminder','Complete safety training by EOD Friday.','sent',3,'{"channel":"#training","priority":"high"}'),
    ('teams','outbound','dispatch@capitaltechalliance.com','maintenance@capitaltechalliance.com','Service Bay Ready','Bay 2 is ready for Unit 14.','sent',1,'{"channel":"#maintenance","priority":"normal"}'),
    ('sms','outbound','dispatch@capitaltechalliance.com','driver2@capitaltechalliance.com','Weather Alert','High winds expected after 4 PM.','delivered',1,'{"channel":"#safety","priority":"high"}')
) AS c(communication_type, direction, from_address, to_address, subject, message_body, status, offset_days, metadata)
WHERE (
  SELECT COUNT(*) FROM communication_logs WHERE tenant_id = admin.tenant_id
) < 25;

-- Outlook Messages (seed if limited)
WITH admin AS (
  SELECT id AS user_id, tenant_id
  FROM users
  ORDER BY (email = 'admin@fleet.local') DESC, created_at
  LIMIT 1
)
INSERT INTO outlook_messages (
  tenant_id, message_id, conversation_id, from_email, from_name,
  to_emails, subject, body_preview, sent_at, received_at, is_read,
  importance, metadata
)
SELECT
  admin.tenant_id,
  'local-' || gen_random_uuid(),
  'conv-' || g::text,
  'vendor' || g || '@capitaltechalliance.com',
  'Vendor ' || g,
  jsonb_build_array('fleet@capitaltechalliance.com'),
  'Service Update #' || g,
  'Service update for vehicle batch #' || g || ' and parts status.',
  NOW() - (g || ' days')::interval,
  NOW() - (g || ' days')::interval,
  (g % 2 = 0),
  CASE WHEN g % 3 = 0 THEN 'high' ELSE 'normal' END,
  jsonb_build_object('labels', jsonb_build_array('service','vendor'), 'priority', CASE WHEN g % 3 = 0 THEN 'high' ELSE 'normal' END)
FROM admin, generate_series(1, 10) g
WHERE (
  SELECT COUNT(*) FROM outlook_messages WHERE tenant_id = admin.tenant_id
) < 10;

-- AI Chat Sessions and Messages (seed if none for tenant)
WITH admin AS (
  SELECT id AS user_id, tenant_id
  FROM users
  ORDER BY (email = 'admin@fleet.local') DESC, created_at
  LIMIT 1
),
session_insert AS (
  INSERT INTO chat_sessions (tenant_id, user_id, title, description, message_count, total_tokens_used, total_cost_usd)
  SELECT admin.tenant_id, admin.user_id, s.title, s.description, s.message_count, s.total_tokens_used, s.total_cost_usd
  FROM admin
  CROSS JOIN (
    VALUES
      ('Maintenance Backlog Review','Discussed backlog prioritization',6,1200,0.48),
      ('Weather Contingency Plan','Evaluated dispatch contingencies',5,980,0.39),
      ('Fuel Spend Analysis','Identified high-spend vehicles',7,1450,0.58)
  ) AS s(title, description, message_count, total_tokens_used, total_cost_usd)
  WHERE NOT EXISTS (
    SELECT 1 FROM chat_sessions WHERE tenant_id = admin.tenant_id AND user_id = admin.user_id
  )
  RETURNING id AS session_id
)
INSERT INTO chat_messages (session_id, role, content, tokens_used, created_at)
SELECT
  session_id,
  CASE WHEN (row_number() OVER ()) % 2 = 0 THEN 'assistant' ELSE 'user' END,
  CASE WHEN (row_number() OVER ()) % 2 = 0
       THEN 'Here are the top priorities and recommended next steps.'
       ELSE 'Please summarize the latest status and risks.'
  END,
  120,
  NOW()
FROM session_insert
WHERE NOT EXISTS (
  SELECT 1 FROM chat_messages
);

-- Geofences (seed only if none exist for tenant)
WITH admin AS (
  SELECT id AS user_id, tenant_id
  FROM users
  ORDER BY (email = 'admin@fleet.local') DESC, created_at
  LIMIT 1
)
INSERT INTO geofences (
  tenant_id,
  name,
  description,
  type,
  center_lat,
  center_lng,
  radius,
  color,
  is_active,
  notify_on_entry,
  notify_on_exit,
  metadata
)
SELECT
  admin.tenant_id,
  g.name,
  g.description,
  g.type,
  g.center_lat,
  g.center_lng,
  g.radius,
  g.color,
  true,
  true,
  true,
  g.metadata::jsonb
FROM admin
CROSS JOIN (
  VALUES
    ('Central Ops HQ', 'Primary operations geofence', 'circle', 30.4383, -84.2807, 1000, '#3B82F6',
     '{"triggers":{"onEnter":true,"onExit":true,"onDwell":false},"notifyUsers":[],"notifyRoles":["dispatcher"],"alertPriority":"medium"}'),
    ('North Yard', 'Maintenance yard perimeter', 'circle', 30.4689, -84.3299, 750, '#22C55E',
     '{"triggers":{"onEnter":true,"onExit":true,"onDwell":false},"notifyUsers":[],"notifyRoles":["maintenance"],"alertPriority":"low"}')
) AS g(name, description, type, center_lat, center_lng, radius, color, metadata)
WHERE NOT EXISTS (
  SELECT 1 FROM geofences WHERE tenant_id = admin.tenant_id
);
