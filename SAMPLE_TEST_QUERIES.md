# Fleet Database - Sample Test Queries

Quick reference for testing various scenarios with the seeded data.

## Authentication / User Management

### Login Test (Any User)
```sql
-- Test login credentials
SELECT
  u.id, u.email, u.role, u.is_active, u.failed_login_attempts,
  t.name as tenant_name
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.email = 'admin0@enterprise-fleet.local';
-- Password: TestPassword123!
```

### Get All Active Drivers
```sql
SELECT
  u.email, u.first_name, u.last_name,
  d.license_number, d.cdl_class, d.status, d.safety_score
FROM users u
JOIN drivers d ON u.id = d.user_id
WHERE u.role = 'driver' AND u.is_active = true AND d.status = 'active';
```

### Users by Role
```sql
SELECT
  role,
  COUNT(*) as total,
  COUNT(CASE WHEN is_active THEN 1 END) as active,
  COUNT(CASE WHEN NOT is_active THEN 1 END) as inactive
FROM users
GROUP BY role
ORDER BY total DESC;
```

## Vehicle Queries

### Active Vehicles with GPS
```sql
SELECT
  v.id, v.make, v.model, v.year, v.license_plate,
  v.vehicle_type, v.fuel_type, v.status,
  v.odometer, v.gps_device_id,
  u.first_name || ' ' || u.last_name as assigned_driver
FROM vehicles v
LEFT JOIN users u ON v.assigned_driver_id = u.id
WHERE v.status = 'active' AND v.gps_device_id IS NOT NULL
LIMIT 20;
```

### Vehicles by Fuel Type
```sql
SELECT
  fuel_type,
  COUNT(*) as count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
  AVG(odometer)::int as avg_odometer
FROM vehicles
GROUP BY fuel_type
ORDER BY count DESC;
```

### High Mileage Vehicles
```sql
SELECT
  make, model, year, license_plate, odometer, status
FROM vehicles
WHERE odometer > 100000
ORDER BY odometer DESC
LIMIT 10;
```

### Electric Vehicles
```sql
SELECT
  v.id, v.make, v.model, v.year, v.license_plate,
  v.status, v.odometer,
  COUNT(cs.id) as charging_sessions,
  SUM(cs.energy_delivered_kwh)::numeric(10,2) as total_kwh_consumed
FROM vehicles v
LEFT JOIN charging_sessions cs ON v.id = cs.vehicle_id
WHERE v.fuel_type = 'Electric'
GROUP BY v.id, v.make, v.model, v.year, v.license_plate, v.status, v.odometer;
```

## Work Orders

### Open Work Orders by Priority
```sql
SELECT
  wo.work_order_number, wo.priority, wo.status, wo.description,
  v.make || ' ' || v.model as vehicle,
  v.license_plate,
  u.first_name || ' ' || u.last_name as technician,
  wo.scheduled_start
FROM work_orders wo
JOIN vehicles v ON wo.vehicle_id = v.id
LEFT JOIN users u ON wo.assigned_technician_id = u.id
WHERE wo.status = 'open'
ORDER BY
  CASE wo.priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END,
  wo.scheduled_start
LIMIT 20;
```

### Completed Work Orders with Costs
```sql
SELECT
  wo.work_order_number,
  v.make || ' ' || v.model || ' (' || v.license_plate || ')' as vehicle,
  wo.description,
  wo.labor_hours,
  wo.labor_cost,
  wo.parts_cost,
  (wo.labor_cost + wo.parts_cost) as total_cost,
  wo.actual_start,
  wo.actual_end
FROM work_orders wo
JOIN vehicles v ON wo.vehicle_id = v.id
WHERE wo.status = 'completed'
ORDER BY total_cost DESC
LIMIT 10;
```

### Overdue Work Orders
```sql
SELECT
  wo.work_order_number, wo.priority, wo.description,
  v.license_plate,
  wo.scheduled_start,
  EXTRACT(DAY FROM NOW() - wo.scheduled_start)::int as days_overdue
FROM work_orders wo
JOIN vehicles v ON wo.vehicle_id = v.id
WHERE wo.status IN ('open', 'in_progress')
  AND wo.scheduled_start < NOW()
ORDER BY days_overdue DESC;
```

## Routes

### Active Routes
```sql
SELECT
  r.route_name,
  r.start_location,
  r.end_location,
  r.status,
  v.make || ' ' || v.model as vehicle,
  u.first_name || ' ' || u.last_name as driver,
  r.planned_start_time,
  r.total_distance
FROM routes r
JOIN vehicles v ON r.vehicle_id = v.id
JOIN drivers d ON r.driver_id = d.id
JOIN users u ON d.user_id = u.id
WHERE r.status IN ('planned', 'in_progress')
ORDER BY r.planned_start_time;
```

### Route Performance (On-time vs Delayed)
```sql
SELECT
  r.route_name,
  r.total_distance,
  r.estimated_duration,
  r.actual_duration,
  (r.actual_duration - r.estimated_duration) as variance_minutes,
  CASE
    WHEN r.actual_duration <= r.estimated_duration THEN 'On Time'
    WHEN r.actual_duration <= r.estimated_duration + 30 THEN 'Slightly Delayed'
    ELSE 'Delayed'
  END as performance
FROM routes r
WHERE r.status = 'completed' AND r.actual_duration IS NOT NULL
ORDER BY variance_minutes DESC
LIMIT 20;
```

## Fuel Management

### Fuel Consumption by Vehicle
```sql
SELECT
  v.make || ' ' || v.model as vehicle,
  v.license_plate,
  v.fuel_type,
  COUNT(ft.id) as num_fillups,
  SUM(ft.gallons)::numeric(10,2) as total_gallons,
  AVG(ft.price_per_gallon)::numeric(10,2) as avg_price_per_gallon,
  SUM(ft.gallons * ft.price_per_gallon)::numeric(10,2) as total_fuel_cost
FROM vehicles v
JOIN fuel_transactions ft ON v.id = ft.vehicle_id
GROUP BY v.id, v.make, v.model, v.license_plate, v.fuel_type
ORDER BY total_fuel_cost DESC
LIMIT 10;
```

### Recent Fuel Transactions
```sql
SELECT
  ft.transaction_date,
  v.license_plate,
  v.make || ' ' || v.model as vehicle,
  ft.gallons,
  ft.price_per_gallon,
  (ft.gallons * ft.price_per_gallon)::numeric(10,2) as total_cost,
  ft.location,
  ft.fuel_card_number
FROM fuel_transactions ft
JOIN vehicles v ON ft.vehicle_id = v.id
ORDER BY ft.transaction_date DESC
LIMIT 20;
```

### Fuel Spend by Month
```sql
SELECT
  DATE_TRUNC('month', transaction_date) as month,
  COUNT(*) as transactions,
  SUM(gallons)::numeric(10,2) as total_gallons,
  SUM(gallons * price_per_gallon)::numeric(10,2) as total_cost,
  AVG(price_per_gallon)::numeric(10,2) as avg_price
FROM fuel_transactions
GROUP BY month
ORDER BY month DESC;
```

## Inspections & Safety

### Failed Inspections
```sql
SELECT
  i.inspection_date,
  i.inspection_type,
  v.license_plate,
  v.make || ' ' || v.model as vehicle,
  i.status,
  i.defects_found,
  u.first_name || ' ' || u.last_name as inspector
FROM inspections i
JOIN vehicles v ON i.vehicle_id = v.id
LEFT JOIN drivers d ON i.driver_id = d.id
LEFT JOIN users u ON d.user_id = u.id
WHERE i.status IN ('fail', 'needs_repair')
ORDER BY i.inspection_date DESC
LIMIT 20;
```

### Safety Incidents Report
```sql
SELECT
  si.incident_number,
  si.incident_date,
  si.incident_type,
  si.severity,
  v.license_plate,
  u.first_name || ' ' || u.last_name as driver,
  si.location,
  si.injuries_count,
  si.property_damage_cost,
  si.vehicle_damage_cost,
  si.at_fault,
  si.status
FROM safety_incidents si
JOIN vehicles v ON si.vehicle_id = v.id
LEFT JOIN drivers d ON si.driver_id = d.id
LEFT JOIN users u ON d.user_id = u.id
ORDER BY si.incident_date DESC;
```

### Driver Safety Scores
```sql
SELECT
  u.first_name || ' ' || u.last_name as driver,
  d.license_number,
  d.status,
  d.safety_score,
  d.incidents_count,
  d.violations_count,
  d.total_miles_driven::numeric(10,2),
  d.total_hours_driven::numeric(10,2),
  CASE
    WHEN d.safety_score >= 95 THEN 'Excellent'
    WHEN d.safety_score >= 85 THEN 'Good'
    WHEN d.safety_score >= 75 THEN 'Fair'
    ELSE 'Needs Improvement'
  END as rating
FROM drivers d
JOIN users u ON d.user_id = u.id
WHERE d.status = 'active'
ORDER BY d.safety_score DESC;
```

## Telemetry & GPS

### Recent Vehicle Locations
```sql
SELECT
  v.license_plate,
  v.make || ' ' || v.model as vehicle,
  t.timestamp,
  t.latitude,
  t.longitude,
  t.speed,
  t.heading,
  t.fuel_level
FROM telemetry_data t
JOIN vehicles v ON t.vehicle_id = v.id
WHERE t.timestamp >= NOW() - INTERVAL '24 hours'
ORDER BY t.timestamp DESC
LIMIT 50;
```

### Speeding Events
```sql
SELECT
  v.license_plate,
  v.make || ' ' || v.model as vehicle,
  u.first_name || ' ' || u.last_name as driver,
  t.timestamp,
  t.speed,
  t.latitude,
  t.longitude
FROM telemetry_data t
JOIN vehicles v ON t.vehicle_id = v.id
LEFT JOIN users u ON v.assigned_driver_id = u.id
WHERE t.speeding = true
ORDER BY t.speed DESC, t.timestamp DESC
LIMIT 20;
```

### Harsh Driving Events
```sql
SELECT
  v.license_plate,
  t.timestamp,
  CASE
    WHEN t.harsh_braking THEN 'Harsh Braking'
    WHEN t.harsh_acceleration THEN 'Harsh Acceleration'
  END as event_type,
  t.speed,
  t.latitude,
  t.longitude
FROM telemetry_data t
JOIN vehicles v ON t.vehicle_id = v.id
WHERE t.harsh_braking = true OR t.harsh_acceleration = true
ORDER BY t.timestamp DESC
LIMIT 20;
```

### Idle Time Analysis
```sql
SELECT
  v.license_plate,
  v.make || ' ' || v.model as vehicle,
  DATE(t.timestamp) as date,
  SUM(t.idle_time)::int as total_idle_seconds,
  (SUM(t.idle_time) / 60)::int as total_idle_minutes,
  COUNT(*) as data_points
FROM telemetry_data t
JOIN vehicles v ON t.vehicle_id = v.id
WHERE t.idle_time > 0
GROUP BY v.id, v.license_plate, v.make, v.model, DATE(t.timestamp)
ORDER BY total_idle_seconds DESC
LIMIT 20;
```

## Charging (EV)

### Charging Station Utilization
```sql
SELECT
  cs_station.station_name,
  cs_station.station_type,
  cs_station.location,
  COUNT(cs_session.id) as total_sessions,
  SUM(cs_session.energy_delivered_kwh)::numeric(10,2) as total_kwh,
  SUM(cs_session.cost)::numeric(10,2) as total_revenue,
  AVG(cs_session.session_duration)::int as avg_duration_minutes
FROM charging_stations cs_station
LEFT JOIN charging_sessions cs_session ON cs_station.id = cs_session.charging_station_id
GROUP BY cs_station.id, cs_station.station_name, cs_station.station_type, cs_station.location
ORDER BY total_sessions DESC;
```

### EV Charging History
```sql
SELECT
  cs.start_time,
  v.license_plate,
  v.make || ' ' || v.model as vehicle,
  cst.station_name,
  cs.energy_delivered_kwh,
  cs.cost,
  cs.start_battery_level,
  cs.end_battery_level,
  (cs.end_battery_level - cs.start_battery_level)::int as battery_gain,
  cs.session_duration
FROM charging_sessions cs
JOIN vehicles v ON cs.vehicle_id = v.id
JOIN charging_stations cst ON cs.charging_station_id = cst.id
ORDER BY cs.start_time DESC
LIMIT 20;
```

## Notifications

### Unread Notifications by User
```sql
SELECT
  u.email,
  u.role,
  COUNT(*) as unread_count,
  COUNT(CASE WHEN n.priority = 'urgent' THEN 1 END) as urgent,
  COUNT(CASE WHEN n.priority = 'high' THEN 1 END) as high,
  MIN(n.created_at) as oldest_unread
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.is_read = false
GROUP BY u.id, u.email, u.role
ORDER BY urgent DESC, high DESC, unread_count DESC;
```

### Recent Alerts
```sql
SELECT
  n.created_at,
  u.email,
  n.title,
  n.message,
  n.priority,
  n.is_read
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE n.notification_type = 'alert' AND n.created_at >= NOW() - INTERVAL '7 days'
ORDER BY n.created_at DESC
LIMIT 20;
```

## Vendor Management

### Vendor Spend Analysis
```sql
SELECT
  v.vendor_name,
  v.vendor_type,
  COUNT(po.id) as total_pos,
  SUM(po.subtotal + po.tax + po.shipping)::numeric(10,2) as total_spend,
  AVG(po.subtotal)::numeric(10,2) as avg_order_value,
  COUNT(CASE WHEN po.status = 'received' THEN 1 END) as completed_orders
FROM vendors v
LEFT JOIN purchase_orders po ON v.id = po.vendor_id
GROUP BY v.id, v.vendor_name, v.vendor_type
ORDER BY total_spend DESC;
```

### Pending Purchase Orders
```sql
SELECT
  po.po_number,
  po.order_date,
  v.vendor_name,
  po.status,
  (po.subtotal + po.tax + po.shipping)::numeric(10,2) as total,
  po.line_items
FROM purchase_orders po
JOIN vendors v ON po.vendor_id = v.id
WHERE po.status IN ('submitted', 'approved', 'ordered')
ORDER BY po.order_date;
```

## Dashboard Aggregates

### Fleet Summary
```sql
SELECT
  COUNT(*) as total_vehicles,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
  COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as in_maintenance,
  COUNT(CASE WHEN assigned_driver_id IS NOT NULL THEN 1 END) as assigned,
  AVG(odometer)::int as avg_odometer,
  SUM(CASE WHEN fuel_type = 'Electric' THEN 1 ELSE 0 END) as electric_count
FROM vehicles;
```

### Active Work Orders Summary
```sql
SELECT
  status,
  COUNT(*) as count,
  COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical,
  COUNT(CASE WHEN priority = 'high' THEN 1 END) as high
FROM work_orders
WHERE status IN ('open', 'in_progress')
GROUP BY status;
```

### Driver Availability
```sql
SELECT
  COUNT(*) as total_drivers,
  COUNT(CASE WHEN d.status = 'active' THEN 1 END) as available,
  COUNT(CASE WHEN d.status = 'on_leave' THEN 1 END) as on_leave,
  COUNT(CASE WHEN d.status = 'suspended' THEN 1 END) as suspended
FROM drivers d
JOIN users u ON d.user_id = u.id
WHERE u.is_active = true;
```

## Complex Joins / Business Logic

### Vehicles Needing Attention
```sql
-- Combines multiple conditions: overdue maintenance, low safety scores, pending inspections
SELECT DISTINCT
  v.license_plate,
  v.make || ' ' || v.model as vehicle,
  v.status,
  ARRAY_AGG(DISTINCT reason) as issues
FROM vehicles v
CROSS JOIN LATERAL (
  SELECT 'Overdue Work Order' as reason
  FROM work_orders wo
  WHERE wo.vehicle_id = v.id
    AND wo.status = 'open'
    AND wo.scheduled_start < NOW()

  UNION ALL

  SELECT 'Low Driver Safety Score' as reason
  FROM drivers d
  JOIN users u ON d.user_id = u.id
  WHERE v.assigned_driver_id = u.id
    AND d.safety_score < 75

  UNION ALL

  SELECT 'Failed Inspection' as reason
  FROM inspections i
  WHERE i.vehicle_id = v.id
    AND i.status IN ('fail', 'needs_repair')
    AND i.inspection_date >= NOW() - INTERVAL '30 days'
) issues
GROUP BY v.id, v.license_plate, v.make, v.model, v.status
ORDER BY array_length(ARRAY_AGG(DISTINCT reason), 1) DESC;
```

### Monthly Fleet Costs
```sql
SELECT
  DATE_TRUNC('month', month_date) as month,
  SUM(fuel_cost)::numeric(10,2) as fuel_cost,
  SUM(maintenance_cost)::numeric(10,2) as maintenance_cost,
  SUM(charging_cost)::numeric(10,2) as charging_cost,
  (SUM(fuel_cost) + SUM(maintenance_cost) + SUM(charging_cost))::numeric(10,2) as total_cost
FROM (
  -- Fuel costs
  SELECT
    DATE_TRUNC('month', transaction_date) as month_date,
    SUM(gallons * price_per_gallon) as fuel_cost,
    0 as maintenance_cost,
    0 as charging_cost
  FROM fuel_transactions
  GROUP BY month_date

  UNION ALL

  -- Maintenance costs
  SELECT
    DATE_TRUNC('month', actual_end) as month_date,
    0 as fuel_cost,
    SUM(labor_cost + parts_cost) as maintenance_cost,
    0 as charging_cost
  FROM work_orders
  WHERE status = 'completed' AND actual_end IS NOT NULL
  GROUP BY month_date

  UNION ALL

  -- Charging costs
  SELECT
    DATE_TRUNC('month', start_time) as month_date,
    0 as fuel_cost,
    0 as maintenance_cost,
    SUM(cost) as charging_cost
  FROM charging_sessions
  WHERE status = 'completed'
  GROUP BY month_date
) costs
GROUP BY month
ORDER BY month DESC;
```

---

## Quick Tips

### Connect to Database
```bash
PGPASSWORD='FleetPass2024!' psql -h localhost -p 15432 -U fleetadmin -d fleetdb
```

### Export Query Results to CSV
```sql
\copy (SELECT * FROM vehicles WHERE status = 'active') TO '/path/to/file.csv' CSV HEADER;
```

### Count All Records
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/api
npx tsx src/scripts/generate-coverage-report.ts
```

### Re-seed Database
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/api
npx tsx src/scripts/seed-ultra-fast.ts && npx tsx src/scripts/seed-supplemental.ts
```
