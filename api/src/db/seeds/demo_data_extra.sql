-- Extra demo data to replace remaining UI mock data

DO $$
DECLARE
  tenant_id_var UUID;
  admin_user_var UUID;
  secondary_user_var UUID;
  driver_id_var UUID;
  vehicle_id_var UUID;
  facility_id_var UUID;
BEGIN
  SELECT id INTO tenant_id_var FROM tenants ORDER BY created_at LIMIT 1;
  IF tenant_id_var IS NULL THEN
    RAISE NOTICE 'No tenant found, skipping extra seed.';
    RETURN;
  END IF;

  SELECT id
  INTO admin_user_var
  FROM users
  WHERE tenant_id = tenant_id_var
    AND role IN ('SuperAdmin', 'Admin', 'Manager')
  ORDER BY
    CASE role
      WHEN 'SuperAdmin' THEN 1
      WHEN 'Admin' THEN 2
      WHEN 'Manager' THEN 3
      ELSE 4
    END,
    created_at
  LIMIT 1;

  SELECT id
  INTO secondary_user_var
  FROM users
  WHERE tenant_id = tenant_id_var
    AND id <> admin_user_var
  ORDER BY created_at
  LIMIT 1;

  IF secondary_user_var IS NULL THEN
    secondary_user_var := admin_user_var;
  END IF;
  SELECT id INTO driver_id_var FROM drivers WHERE tenant_id = tenant_id_var ORDER BY created_at LIMIT 1;
  SELECT id INTO vehicle_id_var FROM vehicles WHERE tenant_id = tenant_id_var ORDER BY created_at LIMIT 1;
  SELECT id INTO facility_id_var FROM facilities WHERE tenant_id = tenant_id_var ORDER BY created_at LIMIT 1;

  -- Alerts
  IF (SELECT COUNT(*) FROM alerts WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO alerts (tenant_id, alert_type, severity, title, description, vehicle_id, driver_id, status, created_at, metadata)
    SELECT tenant_id_var, 'recall', 'critical', 'Brake System Recall', 'Immediate inspection required due to manufacturer recall.', vehicle_id_var, driver_id_var, 'active', NOW() - INTERVAL '2 days', '{"category":"recall"}'::jsonb;

    INSERT INTO alerts (tenant_id, alert_type, severity, title, description, vehicle_id, driver_id, status, created_at, metadata)
    SELECT tenant_id_var, 'weather', 'warning', 'Severe Weather Advisory', 'Heavy rain expected in operational zones.', vehicle_id_var, driver_id_var, 'active', NOW() - INTERVAL '6 hours', '{"category":"weather"}'::jsonb;

    INSERT INTO alerts (tenant_id, alert_type, severity, title, description, vehicle_id, driver_id, status, created_at, metadata)
    SELECT tenant_id_var, 'maintenance', 'info', 'Routine Inspection Due', 'Vehicle due for 90-day inspection.', vehicle_id_var, driver_id_var, 'active', NOW() - INTERVAL '1 day', '{"category":"maintenance"}'::jsonb;
  END IF;

  -- Incidents (accidents)
  IF (SELECT COUNT(*) FROM incidents WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO incidents (tenant_id, number, vehicle_id, driver_id, type, severity, status, incident_date, location, latitude, longitude, description, reported_by_id)
    SELECT tenant_id_var, 'INC-1001', vehicle_id_var, driver_id_var, 'accident', 'moderate', 'completed', NOW() - INTERVAL '14 days', 'Downtown corridor', 30.4412, -84.2807, 'Minor collision during low-speed turn.', admin_user_var;

    INSERT INTO incidents (tenant_id, number, vehicle_id, driver_id, type, severity, status, incident_date, location, latitude, longitude, description, reported_by_id)
    SELECT tenant_id_var, 'INC-1002', vehicle_id_var, driver_id_var, 'accident', 'minor', 'completed', NOW() - INTERVAL '6 days', 'Warehouse approach', 30.4331, -84.2992, 'Near miss with loading dock barrier.', admin_user_var;
  END IF;

  -- Inspections
  IF (SELECT COUNT(*) FROM inspections WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO inspections (tenant_id, vehicle_id, driver_id, type, status, inspector_name, location, started_at, completed_at, defects_found, passed_inspection, notes)
    SELECT tenant_id_var, vehicle_id_var, driver_id_var, 'pre_trip', 'completed', 'Safety Supervisor', 'Main Depot', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '1 hour', 0, true, 'No defects found.';

    INSERT INTO inspections (tenant_id, vehicle_id, driver_id, type, status, inspector_name, location, started_at, completed_at, defects_found, passed_inspection, notes)
    SELECT tenant_id_var, vehicle_id_var, driver_id_var, 'annual', 'completed', 'Compliance Officer', 'Fleet Yard', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '2 hours', 2, false, 'Brake pad wear detected.';
  END IF;

  -- Maintenance Requests
  IF (SELECT COUNT(*) FROM maintenance_requests WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO maintenance_requests (tenant_id, request_number, request_type, priority, vehicle_id, title, description, issue_category, requested_by, driver_id, requested_date, scheduled_date, status, facility_id, assigned_to)
    SELECT tenant_id_var, 'MR-1001', 'inspection', 'high', vehicle_id_var, 'Brake inspection', 'Brake pads nearing threshold.', 'brakes', admin_user_var, driver_id_var, NOW() - INTERVAL '3 days', NOW() + INTERVAL '2 days', 'scheduled', facility_id_var, admin_user_var;

    INSERT INTO maintenance_requests (tenant_id, request_number, request_type, priority, vehicle_id, title, description, issue_category, requested_by, driver_id, requested_date, scheduled_date, status, facility_id, assigned_to)
    SELECT tenant_id_var, 'MR-1002', 'repair', 'medium', vehicle_id_var, 'Door latch repair', 'Rear door latch sticking intermittently.', 'body', admin_user_var, driver_id_var, NOW() - INTERVAL '5 days', NOW() + INTERVAL '5 days', 'pending', facility_id_var, admin_user_var;
  END IF;

  -- Dispatches
  IF (SELECT COUNT(*) FROM dispatches WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO dispatches (tenant_id, route_id, vehicle_id, driver_id, dispatcher_id, type, priority, status, origin, destination, origin_lat, origin_lng, destination_lat, destination_lng, dispatched_at, notes)
    SELECT tenant_id_var, (SELECT id FROM routes WHERE tenant_id = tenant_id_var LIMIT 1), vehicle_id_var, driver_id_var, admin_user_var, 'delivery', 'high', 'in_progress', 'Central Depot', 'City Hall', 30.4383, -84.2815, 30.4389, -84.2807, NOW() - INTERVAL '2 hours', 'Priority delivery to city hall.';
  END IF;

  -- Calendar Events
  IF (SELECT COUNT(*) FROM calendar_events WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO calendar_events (tenant_id, title, description, event_type, start_time, end_time, location, facility_id, organizer_id, created_by)
    SELECT tenant_id_var, 'Safety Review', 'Monthly safety review meeting.', 'meeting', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '1 hour', 'Operations Center', facility_id_var, admin_user_var, admin_user_var;

    INSERT INTO calendar_events (tenant_id, title, description, event_type, start_time, end_time, location, facility_id, organizer_id, created_by)
    SELECT tenant_id_var, 'Fleet Inspection Window', 'Quarterly fleet inspection.', 'inspection', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days' + INTERVAL '4 hours', 'Fleet Yard', facility_id_var, admin_user_var, admin_user_var;
  END IF;

  -- Charging Stations
  IF (SELECT COUNT(*) FROM charging_stations WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO charging_stations (tenant_id, name, station_id, type, facility_id, latitude, longitude, address, number_of_ports, available_ports, max_power_kw, cost_per_kwh, is_public, status)
    SELECT tenant_id_var, 'Depot Fast Charge', 'CS-1001', 'dc_fast', facility_id_var, 30.4385, -84.2820, 'Fleet Depot', 4, 3, 120, 0.22, false, 'active';
  END IF;

  -- Charging Sessions
  IF (SELECT COUNT(*) FROM charging_sessions WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO charging_sessions (tenant_id, vehicle_id, driver_id, station_id, start_time, end_time, duration_minutes, energy_delivered_kwh, start_soc_percent, end_soc_percent, cost, payment_method, status)
    SELECT tenant_id_var, vehicle_id_var, driver_id_var, (SELECT id FROM charging_stations WHERE tenant_id = tenant_id_var LIMIT 1), NOW() - INTERVAL '6 hours', NOW() - INTERVAL '5 hours', 60, 45.5, 20, 80, 10.01, 'fleet_account', 'completed';
  END IF;

  -- Predictive Maintenance
  IF (SELECT COUNT(*) FROM predictive_maintenance WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO predictive_maintenance (tenant_id, vehicle_id, prediction_type, component, predicted_failure_date, confidence_score, current_value, threshold_value, unit_of_measure, recommendation, recommended_action, estimated_cost, status)
    SELECT tenant_id_var, vehicle_id_var, 'vibration', 'Wheel Bearings', CURRENT_DATE + 45, 0.86, 5.2, 7.5, 'mm/s', 'Schedule bearing replacement before threshold.', 'schedule_service', 850.00, 'active';
  END IF;

  -- Performance Metrics
  IF (SELECT COUNT(*) FROM performance_metrics WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO performance_metrics (tenant_id, metric_name, metric_type, value, unit, endpoint, operation, recorded_at)
    SELECT tenant_id_var, 'api_response_time', 'latency', 185.4, 'ms', '/api/vehicles', 'GET', NOW() - INTERVAL '30 minutes';

    INSERT INTO performance_metrics (tenant_id, metric_name, metric_type, value, unit, endpoint, operation, recorded_at)
    SELECT tenant_id_var, 'page_load_time', 'latency', 1.8, 's', '/dashboard', 'GET', NOW() - INTERVAL '25 minutes';

    INSERT INTO performance_metrics (tenant_id, metric_name, metric_type, value, unit, endpoint, operation, recorded_at)
    SELECT tenant_id_var, 'memory_usage', 'system', 68.2, 'percent', NULL, NULL, NOW() - INTERVAL '20 minutes';

    INSERT INTO performance_metrics (tenant_id, metric_name, metric_type, value, unit, endpoint, operation, recorded_at)
    SELECT tenant_id_var, 'active_connections', 'system', 42, 'count', NULL, NULL, NOW() - INTERVAL '15 minutes';
  END IF;

  -- Auth Sessions
  IF (SELECT COUNT(*) FROM auth_sessions WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO auth_sessions (tenant_id, user_id, session_token, device_type, ip_address, user_agent, created_at, last_activity_at, expires_at, is_active)
    SELECT tenant_id_var, admin_user_var, encode(gen_random_bytes(32), 'hex'), 'desktop', '127.0.0.1', 'Demo Browser', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '10 minutes', NOW() + INTERVAL '6 hours', true;
  END IF;

  -- User Presence
  IF (SELECT COUNT(*) FROM user_presence WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO user_presence (tenant_id, user_id, status, last_seen_at, current_latitude, current_longitude, device_type)
    SELECT tenant_id_var, admin_user_var, 'online', NOW(), 30.4385, -84.2820, 'desktop';
  END IF;

  -- Outlook Messages (for communication drilldowns)
  IF (SELECT COUNT(*) FROM outlook_messages WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO outlook_messages (tenant_id, message_id, subject, from_email, from_name, received_at, body_preview, is_read)
    VALUES
      (tenant_id_var, 'msg-1001', 'Dispatch Update', 'dispatch@fleet.local', 'Dispatch', NOW() - INTERVAL '4 hours', 'Updated route assignment for Unit FL-1001.', false),
      (tenant_id_var, 'msg-1002', 'Maintenance Notification', 'maintenance@fleet.local', 'Maintenance', NOW() - INTERVAL '1 day', 'Brake inspection scheduled for next week.', true);
  END IF;

  -- Video Events
  IF (SELECT COUNT(*) FROM video_events WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO video_events (tenant_id, vehicle_id, driver_id, event_type, event_date, severity, latitude, longitude, address, speed_mph, duration, ai_confidence, reviewed, retained, retention_days)
    SELECT tenant_id_var, vehicle_id_var, driver_id_var, 'phone-use', NOW() - INTERVAL '3 hours', 'high', 30.4382, -84.2829, 'Downtown corridor', 42, 12, 0.94, false, true, 30;

    INSERT INTO video_events (tenant_id, vehicle_id, driver_id, event_type, event_date, severity, latitude, longitude, address, speed_mph, duration, ai_confidence, reviewed, retained, retention_days)
    SELECT tenant_id_var, vehicle_id_var, driver_id_var, 'harsh-braking', NOW() - INTERVAL '8 hours', 'medium', 30.4420, -84.2799, 'I-10 ramp', 61, 8, 0.89, true, true, 90;
  END IF;

  -- Communication log metadata (locations)
  UPDATE communication_logs
  SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{location}', jsonb_build_object('lat', 30.4385, 'lng', -84.2820))
  WHERE tenant_id = tenant_id_var
    AND (metadata->'location') IS NULL;

  -- Insert radio-style communication logs
  IF (SELECT COUNT(*) FROM communication_logs WHERE tenant_id = tenant_id_var AND communication_type = 'radio') = 0 THEN
    INSERT INTO communication_logs (tenant_id, communication_type, direction, from_user_id, to_user_id, subject, message_body, status, sent_at, metadata)
    VALUES
      (tenant_id_var, 'radio', 'outbound', admin_user_var, NULL, 'Dispatch', 'All units: Road closure on Highway 27', 'sent', NOW() - INTERVAL '8 minutes', '{"channel":"Operations","priority":"normal","emergency":false}'::jsonb),
      (tenant_id_var, 'radio', 'inbound', secondary_user_var, admin_user_var, 'Unit 247', 'En route to location B-12', 'sent', NOW() - INTERVAL '4 minutes', '{"channel":"Operations","priority":"normal","emergency":false}'::jsonb),
      (tenant_id_var, 'radio', 'inbound', secondary_user_var, admin_user_var, 'Unit 089', 'Requesting backup at current location', 'sent', NOW() - INTERVAL '12 minutes', '{"channel":"Emergency","priority":"high","emergency":true}'::jsonb);
  END IF;

  -- Policy Templates
  IF (SELECT COUNT(*) FROM policy_templates) = 0 THEN
    INSERT INTO policy_templates (
      tenant_id, template_name, template_category, description, policy_text,
      policy_version, applies_to, is_mandatory, is_active, metadata, created_by
    )
    VALUES
      (
        tenant_id_var,
        'Speed Limit Enforcement',
        'Safety',
        'Reduce speeding incidents and improve driver safety.',
        'Drivers must adhere to posted speed limits and internal thresholds. Automated alerts notify supervisors upon violations.',
        '1.0',
        'Driver',
        true,
        true,
        jsonb_build_object(
          'policy_code', 'FLT-SAF-001',
          'scope', 'All fleet vehicles in active service.',
          'procedures', 'Automated alerts notify drivers and supervisors upon violations.',
          'regulatory_references', ARRAY['FMCSA 49 CFR 392.2'],
          'industry_standards', ARRAY['ISO 39001'],
          'responsible_roles', ARRAY['Safety Manager'],
          'approval_required_from', ARRAY['Safety Manager'],
          'effective_date', (CURRENT_DATE - INTERVAL '120 days'),
          'review_cycle_months', 12,
          'requires_training', true
        ),
        admin_user_var
      ),
      (
        tenant_id_var,
        'Preventive Maintenance Compliance',
        'Maintenance',
        'Ensure vehicles receive scheduled maintenance.',
        'Scheduled maintenance must be completed within policy windows. Maintenance team reviews upcoming schedules weekly.',
        '1.0',
        'Mechanic',
        true,
        true,
        jsonb_build_object(
          'policy_code', 'FLT-MNT-002',
          'scope', 'All fleet vehicles with maintenance schedules.',
          'procedures', 'Maintenance team reviews upcoming schedules weekly.',
          'regulatory_references', ARRAY['OSHA 1910'],
          'industry_standards', ARRAY['ISO 9001'],
          'responsible_roles', ARRAY['Maintenance Manager'],
          'approval_required_from', ARRAY['Maintenance Manager'],
          'effective_date', (CURRENT_DATE - INTERVAL '90 days'),
          'review_cycle_months', 6,
          'requires_training', false
        ),
        admin_user_var
      );
  END IF;

  -- Inventory Items (target: 100 small/portable items)
  IF (SELECT COUNT(*) FROM inventory_items WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO inventory_items (
      tenant_id, sku, part_number, name, description, category, manufacturer,
      quantity_on_hand, reorder_point, reorder_quantity, unit_cost, list_price,
      warehouse_location, bin_location, primary_supplier_name, last_restocked
    )
    SELECT
      tenant_id_var,
      'CTA-' || LPAD(gs::text, 4, '0'),
      'CTA-' || LPAD(gs::text, 4, '0'),
      (ARRAY[
        'Portable Generator','Mobile Welder','Air Compressor','Hydraulic Jack','Cordless Drill',
        'Impact Wrench','Pressure Washer','Light Tower','Safety Barrier','Battery Charger'
      ])[((gs - 1) % 10) + 1] || ' ' || gs,
      'CTA inventory item for field operations',
      (ARRAY['equipment','tools','fluids','parts','safety','electrical'])[((gs - 1) % 6) + 1],
      (ARRAY['CTA Supply','Gulf Tooling','Panhandle Industrial','Tallahassee Equip','Capital Fleet Parts'])[((gs - 1) % 5) + 1],
      5 + (gs % 40),
      5 + (gs % 15),
      10 + (gs % 20),
      75 + (gs * 3 % 250),
      95 + (gs * 4 % 350),
      (ARRAY['WH-A','WH-B','WH-C','WH-D'])[((gs - 1) % 4) + 1],
      'BIN-' || LPAD((gs % 40)::text, 2, '0'),
      (ARRAY['CTA Supply','Gulf Tooling','Panhandle Industrial','Tallahassee Equip','Capital Fleet Parts'])[((gs - 1) % 5) + 1],
      NOW() - ((gs % 45) || ' days')::interval
    FROM generate_series(1, 100) AS gs;
  END IF;

  -- Warranty Records & Claims
  IF (SELECT COUNT(*) FROM warranty_records WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO warranty_records (
      tenant_id, inventory_item_id, part_number, part_name, vendor_name,
      warranty_type, warranty_start_date, warranty_end_date, coverage_details, terms, status
    )
    SELECT tenant_id_var, (SELECT id FROM inventory_items WHERE tenant_id = tenant_id_var LIMIT 1),
           'BRK-1001', 'Brake Pad Set', 'AutoParts Co', 'MANUFACTURER',
           CURRENT_DATE - INTERVAL '200 days', CURRENT_DATE + INTERVAL '165 days',
           'Replacement for manufacturing defects', '12-month coverage', 'ACTIVE';

    INSERT INTO warranty_claims (
      tenant_id, warranty_id, claim_number, date_submitted, issue_description, claim_type, status, resolution
    )
    SELECT tenant_id_var, (SELECT id FROM warranty_records WHERE tenant_id = tenant_id_var LIMIT 1),
           'CLM-2026-001', CURRENT_DATE - INTERVAL '15 days',
           'Premature wear on brake pads', 'DEFECT', 'APPROVED', 'Full replacement approved';
  END IF;

  -- Recall Notices & Actions
  IF (SELECT COUNT(*) FROM recall_notices WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO recall_notices (
      tenant_id, recall_number, title, description, severity, urgency, issued_by,
      date_issued, effective_date, compliance_deadline, affected_parts, remedy_description, vendor_contact, status
    )
    VALUES
      (tenant_id_var, 'RCL-2026-001', 'Brake Caliper Safety Recall', 'Potential bolt loosening under extreme load.',
       'SAFETY', 'URGENT', 'NHTSA', CURRENT_DATE - INTERVAL '20 days', CURRENT_DATE - INTERVAL '15 days',
       CURRENT_DATE + INTERVAL '60 days', '["BRK-1001"]'::jsonb, 'Replace mounting bolts', '{"name":"AutoParts Co","email":"support@autoparts.example"}'::jsonb, 'ACTIVE');

    INSERT INTO recall_actions (
      tenant_id, recall_id, inventory_item_id, location, action_required, compliance_status
    )
    SELECT tenant_id_var, (SELECT id FROM recall_notices WHERE tenant_id = tenant_id_var LIMIT 1),
           (SELECT id FROM inventory_items WHERE tenant_id = tenant_id_var LIMIT 1),
           'Main Depot', 'Inspect and replace bolt kit', 'IN_PROGRESS';
  END IF;

  -- FLAIR Expenses
  IF (SELECT COUNT(*) FROM flair_expenses WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO flair_expenses (
      tenant_id, employee_id, employee_name, department, expense_type, amount,
      transaction_date, description, account_codes, supporting_documents, travel_details,
      approval_status, approval_history
    )
    VALUES
      (tenant_id_var, admin_user_var, 'Fleet Admin', 'Operations', 'travel_mileage', 126.50,
       CURRENT_DATE - INTERVAL '4 days', 'Mileage reimbursement for site visit',
       '{"fundCode":"1000","appUnitCode":"50","objectCode":"400","locationCode":"01"}'::jsonb,
       '[]'::jsonb, '{"originAddress":"Depot","destinationAddress":"City Hall","mileage":92,"mileageRate":0.55,"purposeCode":"SITE"}'::jsonb,
       'pending', '[]'::jsonb),
      (tenant_id_var, admin_user_var, 'Fleet Admin', 'Maintenance', 'fuel', 89.40,
       CURRENT_DATE - INTERVAL '2 days', 'Fuel purchase for Unit FL-1001',
       '{"fundCode":"1000","appUnitCode":"50","objectCode":"401","locationCode":"01"}'::jsonb,
       '[]'::jsonb, '{}'::jsonb,
       'supervisor_approved', jsonb_build_array(jsonb_build_object('approverName','Supervisor','approvalLevel','supervisor','approvedAt', NOW())));
  END IF;

  -- Training Courses & Progress
  IF (SELECT COUNT(*) FROM training_courses WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO training_courses (
      tenant_id, title, description, category, level, duration_minutes, modules, prerequisites, certification, instructor, tags, rating
    )
    VALUES
      (tenant_id_var, 'Fleet Safety Fundamentals',
       'Safety training covering defensive driving and inspection.',
       'safety', 'beginner', 120,
       '[{"id":"mod-001","title":"Defensive Driving","type":"video","duration":30},{"id":"mod-002","title":"Pre-Trip Inspection","type":"interactive","duration":45}]'::jsonb,
       '[]'::jsonb,
       '{"name":"Fleet Safety Operator","validityPeriod":24,"renewalRequired":true,"accreditingBody":"DOT"}'::jsonb,
       '{"id":"inst-001","name":"Sarah Martinez","title":"Safety Instructor"}'::jsonb,
       ARRAY['safety','defensive-driving'],
       4.7),
      (tenant_id_var, 'EV Fleet Operations',
       'Charging, battery health, and EV safety protocols.',
       'operations', 'intermediate', 90,
       '[{"id":"mod-101","title":"Charging Safety","type":"video","duration":20},{"id":"mod-102","title":"Battery Health","type":"reading","duration":25}]'::jsonb,
       '[]'::jsonb,
       '{"name":"EV Operations Certificate","validityPeriod":12,"renewalRequired":true,"accreditingBody":"DOE"}'::jsonb,
       '{"id":"inst-002","name":"James Lee","title":"EV Specialist"}'::jsonb,
       ARRAY['ev','charging'],
       4.5);
  END IF;

  IF (SELECT COUNT(*) FROM training_progress WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO training_progress (
      tenant_id, course_id, driver_id, progress, completed_modules, last_accessed, time_spent_minutes, score
    )
    SELECT tenant_id_var, (SELECT id FROM training_courses WHERE tenant_id = tenant_id_var LIMIT 1),
           driver_id_var, 65, '["mod-001"]'::jsonb, NOW() - INTERVAL '1 day', 75, 92;
  END IF;

  -- Certifications
  IF (SELECT COUNT(*) FROM certifications WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO certifications (
      tenant_id, driver_id, type, number, issuing_authority, issued_date, expiry_date, status
    )
    SELECT tenant_id_var, driver_id_var, 'Defensive Driving', 'CERT-2026-001', 'DOT',
           CURRENT_DATE - INTERVAL '60 days', CURRENT_DATE + INTERVAL '670 days', 'active';
  END IF;

  -- Security Events
  IF (SELECT COUNT(*) FROM security_events WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO security_events (tenant_id, event_type, severity, message, metadata, created_at)
    VALUES
      (tenant_id_var, 'login', 'low', 'User login successful', '{"source":"web"}'::jsonb, NOW() - INTERVAL '2 hours'),
      (tenant_id_var, 'policy_change', 'medium', 'Policy configuration updated', '{"policy":"Speed Limit Enforcement"}'::jsonb, NOW() - INTERVAL '1 day'),
      (tenant_id_var, 'access_denied', 'high', 'Unauthorized access attempt blocked', '{"ip":"127.0.0.1"}'::jsonb, NOW() - INTERVAL '3 days');
  END IF;

  -- Telemetry Data
  IF (SELECT COUNT(*) FROM telemetry_data WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO telemetry_data (
      tenant_id, vehicle_id, timestamp, engine_rpm, engine_temperature, battery_voltage, fuel_consumption_rate, oil_pressure
    )
    VALUES
      (tenant_id_var, vehicle_id_var, NOW() - INTERVAL '15 minutes', 2100, 195, 12.6, 8.5, 45),
      (tenant_id_var, vehicle_id_var, NOW() - INTERVAL '45 minutes', 1800, 190, 12.5, 7.9, 42);
  END IF;

  -- GPS Tracks
  IF (SELECT COUNT(*) FROM gps_tracks WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO gps_tracks (
      tenant_id, vehicle_id, timestamp, latitude, longitude, speed, heading, odometer, fuel_level, engine_status, metadata
    )
    VALUES
      (tenant_id_var, vehicle_id_var, NOW() - INTERVAL '10 minutes', 30.4388, -84.2812, 42, 180, 45210, 68, 'running', '{"address":"I-10 & Monroe St"}'::jsonb),
      (tenant_id_var, vehicle_id_var, NOW() - INTERVAL '40 minutes', 30.4421, -84.2765, 18, 90, 45195, 71, 'running', '{"address":"Capital Circle"}'::jsonb);
  END IF;

  -- Report Templates / Schedules / History
  IF (SELECT COUNT(*) FROM report_templates WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO report_templates (
      tenant_id, title, domain, category, description, definition, is_core, popularity
    )
    VALUES
      (tenant_id_var, 'Maintenance Summary', 'maintenance', 'maintenance', 'Work order costs and trends',
       '{
          "id":"maintenance-summary",
          "title":"Maintenance Summary",
          "domain":"maintenance",
          "description":"Work order costs, volumes, and trends",
          "datasource":{"type":"sqlView","view":"work_orders"},
          "filters":[{"name":"dateRange","type":"dateRange","default":"last_12_months","required":true}],
          "visuals":[
            {"id":"kpis","type":"kpiTiles","title":"Summary KPIs","measures":[
              {"id":"total_cost","label":"Total Cost","format":"currency"},
              {"id":"work_order_count","label":"Work Orders","format":"integer"},
              {"id":"availability_pct","label":"Availability %","format":"percent"}
            ],"layout":{"x":0,"y":0,"w":12,"h":2}},
            {"id":"trend","type":"line","title":"Monthly Trend","encoding":{"x":{"field":"month"},"y":{"field":"amount"},"color":{"field":"category"}},"layout":{"x":0,"y":2,"w":12,"h":4}},
            {"id":"detail","type":"table","title":"Work Orders","columns":[
              {"id":"title","label":"Title","field":"title"},
              {"id":"category","label":"Type","field":"category"},
              {"id":"amount","label":"Cost","field":"amount"},
              {"id":"status","label":"Status","field":"status"}
            ],"layout":{"x":0,"y":6,"w":12,"h":4}}
          ],
          "drilldowns":[],
          "drillthrough":[],
          "exports":[{"format":"csv"}],
          "security":{"rowLevel":[]}
        }'::jsonb,
       true, 42),
      (tenant_id_var, 'Fuel Usage Summary', 'fuel', 'fuel', 'Fuel costs and vendor breakdown',
       '{
          "id":"fuel-summary",
          "title":"Fuel Usage Summary",
          "domain":"fuel",
          "description":"Fuel transaction costs and trends",
          "datasource":{"type":"sqlView","view":"fuel_transactions"},
          "filters":[{"name":"dateRange","type":"dateRange","default":"last_12_months","required":true}],
          "visuals":[
            {"id":"kpis","type":"kpiTiles","title":"Summary KPIs","measures":[
              {"id":"total_cost","label":"Total Cost","format":"currency"},
              {"id":"work_order_count","label":"Transactions","format":"integer"},
              {"id":"availability_pct","label":"Availability %","format":"percent"}
            ],"layout":{"x":0,"y":0,"w":12,"h":2}},
            {"id":"trend","type":"line","title":"Monthly Trend","encoding":{"x":{"field":"month"},"y":{"field":"amount"},"color":{"field":"category"}},"layout":{"x":0,"y":2,"w":12,"h":4}},
            {"id":"detail","type":"table","title":"Fuel Transactions","columns":[
              {"id":"title","label":"Location","field":"title"},
              {"id":"category","label":"Vendor","field":"category"},
              {"id":"amount","label":"Cost","field":"amount"},
              {"id":"status","label":"Fuel Type","field":"status"}
            ],"layout":{"x":0,"y":6,"w":12,"h":4}}
          ],
          "drilldowns":[],
          "drillthrough":[],
          "exports":[{"format":"csv"}],
          "security":{"rowLevel":[]}
        }'::jsonb,
       true, 36),
      (tenant_id_var, 'Safety Incidents Summary', 'safety', 'safety', 'Incident counts and severity trends',
       '{
          "id":"safety-summary",
          "title":"Safety Incidents Summary",
          "domain":"safety",
          "description":"Incidents by severity and trend",
          "datasource":{"type":"sqlView","view":"incidents"},
          "filters":[{"name":"dateRange","type":"dateRange","default":"last_12_months","required":true}],
          "visuals":[
            {"id":"kpis","type":"kpiTiles","title":"Summary KPIs","measures":[
              {"id":"total_cost","label":"Total Cost","format":"currency"},
              {"id":"work_order_count","label":"Incidents","format":"integer"},
              {"id":"availability_pct","label":"Availability %","format":"percent"}
            ],"layout":{"x":0,"y":0,"w":12,"h":2}},
            {"id":"trend","type":"line","title":"Monthly Trend","encoding":{"x":{"field":"month"},"y":{"field":"amount"},"color":{"field":"category"}},"layout":{"x":0,"y":2,"w":12,"h":4}},
            {"id":"detail","type":"table","title":"Incidents","columns":[
              {"id":"title","label":"Description","field":"title"},
              {"id":"category","label":"Severity","field":"category"},
              {"id":"amount","label":"Count","field":"amount"},
              {"id":"status","label":"Status","field":"status"}
            ],"layout":{"x":0,"y":6,"w":12,"h":4}}
          ],
          "drilldowns":[],
          "drillthrough":[],
          "exports":[{"format":"csv"}],
          "security":{"rowLevel":[]}
        }'::jsonb,
       true, 28);
  END IF;

  IF (SELECT COUNT(*) FROM report_schedules WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO report_schedules (
      tenant_id, template_id, schedule, recipients, format, status, next_run
    )
    SELECT tenant_id_var, (SELECT id FROM report_templates WHERE tenant_id = tenant_id_var LIMIT 1),
           'Every Monday 08:00', ARRAY['fleet@agency.gov'], 'pdf', 'active', NOW() + INTERVAL '2 days';
  END IF;

  IF (SELECT COUNT(*) FROM report_generations WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO report_generations (
      tenant_id, template_id, title, generated_at, generated_by, format, size_bytes, status, download_url
    )
    SELECT tenant_id_var, (SELECT id FROM report_templates WHERE tenant_id = tenant_id_var LIMIT 1),
           'Maintenance Summary', NOW() - INTERVAL '1 day', admin_user_var, 'pdf', 245678, 'completed',
           '/api/reports/download/maintenance-summary.pdf';
  END IF;

  -- Employees (staff directory, target 100)
  IF (SELECT COUNT(*) FROM employees WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO employees (
      tenant_id, user_id, first_name, last_name, email, phone, role, department,
      status, employee_type, hire_date, manager_id, performance_rating,
      certifications, last_review_date, next_review_date
    )
    SELECT
      tenant_id_var,
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      COALESCE(u.role, 'User'),
      (ARRAY['Operations','Maintenance','Dispatch','Safety','Administration','Logistics'])[((rn - 1) % 6) + 1],
      CASE WHEN rn % 12 = 0 THEN 'on_leave'
           WHEN rn % 25 = 0 THEN 'inactive'
           ELSE 'active'
      END,
      (ARRAY['full_time','full_time','full_time','part_time','contractor'])[((rn - 1) % 5) + 1],
      (CURRENT_DATE - ((rn * 13) % 2200) * INTERVAL '1 day')::date,
      admin_user_var,
      70 + ((rn * 3) % 30),
      ARRAY['OSHA-10','DOT-Compliance','Defensive Driving'],
      (CURRENT_DATE - ((rn * 7) % 360) * INTERVAL '1 day')::date,
      (CURRENT_DATE + ((rn * 11) % 360) * INTERVAL '1 day')::date
    FROM (
      SELECT u.*, ROW_NUMBER() OVER (ORDER BY u.created_at) AS rn
      FROM users u
      WHERE u.tenant_id = tenant_id_var
      ORDER BY u.created_at
      LIMIT 100
    ) u;
  END IF;

  -- Teams (organizational) + Members
  IF (SELECT COUNT(*) FROM teams WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO teams (
      tenant_id, name, description, team_type, team_lead_id, email, phone,
      location, facility_id, shift_start, shift_end, timezone, is_active
    )
    SELECT
      tenant_id_var,
      t.name,
      t.description,
      t.team_type,
      admin_user_var,
      t.email,
      t.phone,
      t.location,
      facility_id_var,
      t.shift_start,
      t.shift_end,
      'America/New_York',
      true
    FROM (
      VALUES
        ('Operations Dispatch', 'City-wide dispatch coordination', 'operations', 'dispatch@cta-fleet.local', '(850) 555-0301', 'Central Ops', '06:00'::time, '18:00'::time),
        ('Maintenance Crew A', 'Fleet preventive maintenance', 'maintenance', 'maintenance-a@cta-fleet.local', '(850) 555-0302', 'North Yard', '07:00'::time, '15:00'::time),
        ('Maintenance Crew B', 'Heavy equipment service', 'maintenance', 'maintenance-b@cta-fleet.local', '(850) 555-0303', 'South Yard', '12:00'::time, '20:00'::time),
        ('Safety & Compliance', 'Safety training and audits', 'safety', 'safety@cta-fleet.local', '(850) 555-0304', 'Operations Center', '08:00'::time, '16:00'::time),
        ('Logistics Planning', 'Route planning and resource allocation', 'logistics', 'logistics@cta-fleet.local', '(850) 555-0305', 'Operations Center', '06:00'::time, '14:00'::time),
        ('Fleet Admin', 'Admin & finance support', 'administration', 'admin@cta-fleet.local', '(850) 555-0306', 'HQ', '08:00'::time, '17:00'::time)
    ) AS t(name, description, team_type, email, phone, location, shift_start, shift_end);
  END IF;

  IF (SELECT COUNT(*) FROM team_members tm JOIN teams t ON t.id = tm.team_id WHERE t.tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO team_members (team_id, user_id, role, joined_at, is_active)
    SELECT
      t.id,
      u.id,
      CASE WHEN u.id = t.team_lead_id THEN 'lead' ELSE 'member' END,
      NOW() - ((row_number() OVER ()) % 180) * INTERVAL '1 day',
      true
    FROM teams t
    JOIN LATERAL (
      SELECT id
      FROM users
      WHERE tenant_id = tenant_id_var
      ORDER BY random()
      LIMIT 12
    ) u ON true
    WHERE t.tenant_id = tenant_id_var;
  END IF;

  -- Assets (heavy equipment + tools)
  IF (SELECT COUNT(*) FROM assets WHERE tenant_id = tenant_id_var AND type = 'equipment') = 0 THEN
    WITH new_assets AS (
      INSERT INTO assets (
        tenant_id, asset_number, name, description, type, category, manufacturer, model,
        serial_number, purchase_date, purchase_price, current_value, status, condition,
        assigned_facility_id, last_maintenance_date, next_maintenance_date, metadata
      )
      SELECT
        tenant_id_var,
        'EQP-' || LPAD(gs::text, 4, '0'),
        (ARRAY['Excavator','Bulldozer','Crane','Loader','Backhoe','Dump Truck','Forklift'])[((gs - 1) % 7) + 1] || ' ' || gs,
        'CTA heavy equipment asset',
        'equipment',
        'heavy',
        (ARRAY['Caterpillar','John Deere','Komatsu','Volvo','JCB'])[((gs - 1) % 5) + 1],
        'Series ' || ((gs - 1) % 5 + 1),
        'SN-EQP-' || LPAD(gs::text, 6, '0'),
        (CURRENT_DATE - ((gs * 37) % 2200) * INTERVAL '1 day')::date,
        75000 + (gs * 1200 % 110000),
        42000 + (gs * 900 % 80000),
        CASE WHEN gs % 12 = 0 THEN 'maintenance' ELSE 'active' END,
        (ARRAY['excellent','good','good','fair'])[((gs - 1) % 4) + 1],
        facility_id_var,
        (CURRENT_DATE - ((gs * 9) % 180) * INTERVAL '1 day')::date,
        (CURRENT_DATE + ((gs * 11) % 180) * INTERVAL '1 day')::date,
        jsonb_build_object('yard','Tallahassee','gps','enabled')
      FROM generate_series(1, 70) AS gs
      RETURNING id
    )
    INSERT INTO heavy_equipment (
      tenant_id, asset_id, equipment_type, model_year, engine_hours, engine_type,
      weight_capacity_lbs, load_capacity, reach_distance_ft, inspection_required,
      last_inspection_date, next_inspection_date, certification_number,
      requires_certification, operator_license_type, metadata, created_by
    )
    SELECT
      tenant_id_var,
      id,
      (ARRAY['excavator','bulldozer','crane','loader','backhoe','dump_truck','forklift'])[((ROW_NUMBER() OVER ()) - 1) % 7 + 1],
      2016 + ((ROW_NUMBER() OVER ()) % 8),
      1200 + ((ROW_NUMBER() OVER ()) * 37 % 2200),
      (ARRAY['diesel','diesel','hybrid'])[((ROW_NUMBER() OVER ()) - 1) % 3 + 1],
      12000 + ((ROW_NUMBER() OVER ()) * 200 % 16000),
      8000 + ((ROW_NUMBER() OVER ()) * 150 % 9000),
      18 + ((ROW_NUMBER() OVER ()) % 12),
      true,
      CURRENT_DATE - ((ROW_NUMBER() OVER ()) % 120) * INTERVAL '1 day',
      CURRENT_DATE + ((ROW_NUMBER() OVER ()) % 180) * INTERVAL '1 day',
      'CTA-CERT-' || LPAD((ROW_NUMBER() OVER ())::text, 4, '0'),
      true,
      'Class A',
      jsonb_build_object('inspector','CTA Safety'),
      admin_user_var
    FROM new_assets;
  END IF;

  IF (SELECT COUNT(*) FROM assets WHERE tenant_id = tenant_id_var AND type = 'tool') = 0 THEN
    INSERT INTO assets (
      tenant_id, asset_number, name, description, type, category, manufacturer, model,
      serial_number, purchase_date, purchase_price, current_value, status, condition,
      assigned_facility_id, last_maintenance_date, next_maintenance_date, metadata
    )
    SELECT
      tenant_id_var,
      'TOOL-' || LPAD(gs::text, 4, '0'),
      (ARRAY['Generator','Welder','Compressor','Light Tower','Pressure Washer','Hydraulic Jack','Saw','Pump'])[((gs - 1) % 8) + 1] || ' ' || gs,
      'CTA portable asset',
      'tool',
      'portable',
      (ARRAY['Milwaukee','DeWalt','Honda','Caterpillar','Makita'])[((gs - 1) % 5) + 1],
      'Model ' || ((gs - 1) % 6 + 1),
      'SN-TOOL-' || LPAD(gs::text, 6, '0'),
      (CURRENT_DATE - ((gs * 21) % 1400) * INTERVAL '1 day')::date,
      1200 + (gs * 35 % 5000),
      600 + (gs * 25 % 2800),
      CASE WHEN gs % 10 = 0 THEN 'maintenance' ELSE 'active' END,
      (ARRAY['excellent','good','good','fair'])[((gs - 1) % 4) + 1],
      facility_id_var,
      (CURRENT_DATE - ((gs * 5) % 180) * INTERVAL '1 day')::date,
      (CURRENT_DATE + ((gs * 7) % 180) * INTERVAL '1 day')::date,
      jsonb_build_object('portable',true)
    FROM generate_series(1, 100) AS gs;
  END IF;

  -- Performance Reviews
  IF (SELECT COUNT(*) FROM performance_reviews WHERE tenant_id = tenant_id_var) = 0 THEN
    INSERT INTO performance_reviews (
      tenant_id, employee_id, reviewer_id, rating, review_date, status, notes
    )
    SELECT
      tenant_id_var,
      e.id,
      e.manager_id,
      70 + ((ROW_NUMBER() OVER ()) * 3 % 30),
      (CURRENT_DATE - ((ROW_NUMBER() OVER ()) * 11 % 360) * INTERVAL '1 day')::date,
      CASE WHEN (ROW_NUMBER() OVER ()) % 12 = 0 THEN 'scheduled'
           WHEN (ROW_NUMBER() OVER ()) % 19 = 0 THEN 'overdue'
           ELSE 'completed'
      END,
      'Quarterly performance review'
    FROM employees e
    WHERE e.tenant_id = tenant_id_var
    ORDER BY e.created_at
    LIMIT 60;
  END IF;

  -- Performance Metrics (add CPU/requests for trend)
  INSERT INTO performance_metrics (tenant_id, metric_name, metric_type, value, unit, recorded_at)
  SELECT tenant_id_var, 'cpu_usage', 'system', 42.5, 'percent', NOW() - INTERVAL '3 hours'
  WHERE (SELECT COUNT(*) FROM performance_metrics WHERE tenant_id = tenant_id_var AND metric_name = 'cpu_usage') = 0;

  INSERT INTO performance_metrics (tenant_id, metric_name, metric_type, value, unit, recorded_at)
  SELECT tenant_id_var, 'requests_per_minute', 'system', 180, 'rpm', NOW() - INTERVAL '3 hours'
  WHERE (SELECT COUNT(*) FROM performance_metrics WHERE tenant_id = tenant_id_var AND metric_name = 'requests_per_minute') = 0;

END $$;
