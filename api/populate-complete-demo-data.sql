-- Complete Realistic Demo Data for Fleet Management System
-- Populates all tables with production-ready demo data

-- Get tenant ID
DO $$
DECLARE
    v_tenant_id INTEGER;
    v_admin_id INTEGER;
    v_manager_id INTEGER;
    v_driver1_id INTEGER;
    v_driver2_id INTEGER;
    v_driver3_id INTEGER;
    v_vehicle1_id INTEGER;
    v_vehicle2_id INTEGER;
    v_vehicle3_id INTEGER;
BEGIN
    SELECT id INTO v_tenant_id FROM tenants WHERE subdomain = 'cta' LIMIT 1;
    SELECT id INTO v_admin_id FROM users WHERE email = 'admin@cta.com' LIMIT 1;
    SELECT id INTO v_manager_id FROM users WHERE email = 'manager@cta.com' LIMIT 1;
    SELECT id INTO v_driver1_id FROM users WHERE email = 'john.smith@cta.com' LIMIT 1;
    SELECT id INTO v_driver2_id FROM users WHERE email = 'jane.doe@cta.com' LIMIT 1;
    SELECT id INTO v_driver3_id FROM users WHERE email = 'mike.wilson@cta.com' LIMIT 1;

    -- Get vehicle IDs
    SELECT id INTO v_vehicle1_id FROM vehicles WHERE tenant_id = v_tenant_id ORDER BY id LIMIT 1 OFFSET 0;
    SELECT id INTO v_vehicle2_id FROM vehicles WHERE tenant_id = v_tenant_id ORDER BY id LIMIT 1 OFFSET 1;
    SELECT id INTO v_vehicle3_id FROM vehicles WHERE tenant_id = v_tenant_id ORDER BY id LIMIT 1 OFFSET 2;

    -- ============================================
    -- SAFETY POLICIES
    -- ============================================
    INSERT INTO safety_policies (tenant_id, policy_number, policy_name, policy_category, description, effective_date, review_date, status, created_by, approved_by, approval_date, version)
    VALUES
    (v_tenant_id, 'POL-001', 'Distracted Driving Prevention', 'driver_safety', 'Prohibits use of mobile devices while operating company vehicles. Drivers must pull over safely before using phones.', '2024-01-01', '2024-12-31', 'active', v_admin_id, v_admin_id, '2023-12-15', '2.1'),
    (v_tenant_id, 'POL-002', 'Hours of Service Compliance', 'compliance', 'Ensures all drivers comply with FMCSA hours of service regulations. Maximum 11 hours driving after 10 consecutive hours off duty.', '2024-01-01', '2024-12-31', 'active', v_admin_id, v_admin_id, '2023-12-15', '3.0'),
    (v_tenant_id, 'POL-003', 'Pre-Trip Vehicle Inspection', 'vehicle_maintenance', 'Drivers must complete comprehensive pre-trip inspection checklist before operating vehicle. Report all defects immediately.', '2024-01-01', '2024-12-31', 'active', v_admin_id, v_admin_id, '2023-12-15', '1.5'),
    (v_tenant_id, 'POL-004', 'Defensive Driving Standards', 'driver_safety', 'Maintain 3-second following distance, anticipate hazards, avoid aggressive driving. Speed limit compliance mandatory.', '2024-01-01', '2024-12-31', 'active', v_admin_id, v_admin_id, '2023-12-15', '2.0'),
    (v_tenant_id, 'POL-005', 'Environmental Compliance', 'environmental', 'Proper disposal of vehicle fluids, minimize idling, fuel efficiency practices. Report all spills immediately.', '2024-01-01', '2024-12-31', 'active', v_admin_id, v_admin_id, '2023-12-15', '1.0'),
    (v_tenant_id, 'POL-006', 'Accident Reporting Protocol', 'driver_safety', 'All accidents must be reported within 1 hour. Complete incident report form, photos of damage, witness statements required.', '2024-01-01', '2024-12-31', 'active', v_admin_id, v_admin_id, '2023-12-15', '2.2')
    ON CONFLICT (tenant_id, policy_number) DO NOTHING;

    -- ============================================
    -- STANDARD OPERATING PROCEDURES
    -- ============================================
    INSERT INTO procedures (tenant_id, procedure_code, procedure_name, procedure_type, description, steps, frequency, estimated_duration_minutes, requires_certification, status, version)
    VALUES
    (v_tenant_id, 'SOP-001', 'Daily Vehicle Pre-Trip Inspection', 'safety_inspection', 'Comprehensive 15-point vehicle safety inspection to be performed before every shift.',
    '[{"step": 1, "title": "Check tire pressure and tread depth", "details": "All tires must be within 5 PSI of specification"},
      {"step": 2, "title": "Inspect lights and signals", "details": "Test headlights, brake lights, turn signals"},
      {"step": 3, "title": "Check fluid levels", "details": "Oil, coolant, brake fluid, windshield washer"},
      {"step": 4, "title": "Test brakes", "details": "Check brake pedal feel and parking brake"},
      {"step": 5, "title": "Inspect mirrors and windshield", "details": "Clean and properly adjusted"}]'::jsonb,
    'daily', 15, FALSE, 'active', '1.3'),

    (v_tenant_id, 'SOP-002', 'Accident Response Protocol', 'incident_response', 'Step-by-step procedure for handling vehicle accidents and reporting.',
    '[{"step": 1, "title": "Ensure safety", "details": "Check for injuries, move to safe location if possible"},
      {"step": 2, "title": "Call emergency services", "details": "911 for injuries or major damage"},
      {"step": 3, "title": "Notify fleet manager", "details": "Call dispatch immediately"},
      {"step": 4, "title": "Document scene", "details": "Photos, witness info, police report number"},
      {"step": 5, "title": "Complete incident report", "details": "Fill out company accident form within 2 hours"}]'::jsonb,
    'as_needed', 30, FALSE, 'active', '2.0'),

    (v_tenant_id, 'SOP-003', 'Monthly Vehicle Deep Clean', 'maintenance', 'Thorough interior and exterior vehicle cleaning and sanitization.',
    '[{"step": 1, "title": "Exterior wash", "details": "Pressure wash body, wheels, undercarriage"},
      {"step": 2, "title": "Interior vacuum", "details": "Seats, floor mats, cargo area"},
      {"step": 3, "title": "Sanitize touchpoints", "details": "Steering wheel, door handles, gear shift"},
      {"step": 4, "title": "Window cleaning", "details": "Interior and exterior glass"},
      {"step": 5, "title": "Air freshener", "details": "Replace cabin air freshener"}]'::jsonb,
    'monthly', 45, FALSE, 'active', '1.0'),

    (v_tenant_id, 'SOP-004', 'Driver Fatigue Assessment', 'safety_inspection', 'Mandatory fatigue self-assessment before starting shift.',
    '[{"step": 1, "title": "Hours of sleep", "details": "Minimum 7 hours required in last 24 hours"},
      {"step": 2, "title": "Alertness check", "details": "Self-rate alertness 1-10, must be 7+"},
      {"step": 3, "title": "Medication review", "details": "No drowsy medications in last 12 hours"},
      {"step": 4, "title": "Manager approval", "details": "If score below 7, requires manager clearance"}]'::jsonb,
    'daily', 5, FALSE, 'active', '1.1')
    ON CONFLICT (tenant_id, procedure_code) DO NOTHING;

    -- ============================================
    -- COMPLIANCE REQUIREMENTS
    -- ============================================
    INSERT INTO compliance_requirements (tenant_id, requirement_code, requirement_name, regulatory_body, category, description, frequency, applies_to, is_active, effective_date)
    VALUES
    (v_tenant_id, 'COMP-001', 'Annual Vehicle Safety Inspection', 'DOT', 'vehicle_inspection', 'All commercial vehicles must pass comprehensive safety inspection annually per DOT regulations.', 'annual', 'vehicles', TRUE, '2024-01-01'),
    (v_tenant_id, 'COMP-002', 'Driver License Verification', 'FMCSA', 'driver_qualification', 'Verify all drivers hold valid commercial drivers license. Check MVR quarterly for violations.', 'quarterly', 'drivers', TRUE, '2024-01-01'),
    (v_tenant_id, 'COMP-003', 'Hours of Service Logging', 'FMCSA', 'hours_of_service', 'Electronic logging device (ELD) required for all drivers. Daily log review mandatory.', 'daily', 'drivers', TRUE, '2024-01-01'),
    (v_tenant_id, 'COMP-004', 'Drug and Alcohol Testing', 'FMCSA', 'driver_qualification', 'Random drug testing for 50% of drivers annually. Post-accident testing required.', 'annual', 'drivers', TRUE, '2024-01-01'),
    (v_tenant_id, 'COMP-005', 'Emissions Testing', 'EPA', 'environmental', 'Annual emissions testing for all vehicles in accordance with Clean Air Act requirements.', 'annual', 'vehicles', TRUE, '2024-01-01')
    ON CONFLICT (tenant_id, requirement_code) DO NOTHING;

    -- ============================================
    -- TRAINING PROGRAMS
    -- ============================================
    INSERT INTO training_programs (tenant_id, program_code, program_name, program_type, description, duration_hours, certification_valid_years, is_required, required_for_roles, cost_per_person, is_active)
    VALUES
    (v_tenant_id, 'TRN-001', 'Defensive Driving Certification', 'defensive_driving', 'Comprehensive defensive driving techniques, hazard recognition, and collision avoidance training.', 8, 3, TRUE, ARRAY['driver'], 150.00, TRUE),
    (v_tenant_id, 'TRN-002', 'HAZMAT Handling', 'hazmat', 'Proper handling, storage, and transportation of hazardous materials. DOT compliance training.', 16, 2, FALSE, ARRAY['driver'], 350.00, TRUE),
    (v_tenant_id, 'TRN-003', 'First Aid and CPR', 'safety', 'Basic first aid, CPR, and AED certification. Emergency response procedures.', 6, 2, TRUE, ARRAY['driver', 'manager'], 75.00, TRUE),
    (v_tenant_id, 'TRN-004', 'Vehicle Maintenance Basics', 'equipment_operation', 'Basic vehicle maintenance, troubleshooting, and preventive care training.', 4, 5, FALSE, ARRAY['driver'], 100.00, TRUE),
    (v_tenant_id, 'TRN-005', 'Winter Driving Safety', 'safety', 'Safe driving techniques for ice, snow, and adverse weather conditions.', 3, 1, TRUE, ARRAY['driver'], 50.00, TRUE)
    ON CONFLICT (tenant_id, program_code) DO NOTHING;

    -- Training completions for drivers
    INSERT INTO training_completions (tenant_id, program_id, user_id, completion_date, expiration_date, score, certification_number, instructor_name, status)
    SELECT
        v_tenant_id,
        tp.id,
        v_driver1_id,
        CURRENT_DATE - INTERVAL '6 months',
        CURRENT_DATE + (tp.certification_valid_years || ' years')::INTERVAL - INTERVAL '6 months',
        92.5,
        'CERT-' || tp.program_code || '-' || v_driver1_id,
        'Sarah Training',
        'current'
    FROM training_programs tp WHERE tp.tenant_id = v_tenant_id
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- TRACKING DEVICES INVENTORY
    -- ============================================
    INSERT INTO tracking_devices (tenant_id, device_type, manufacturer, model_number, serial_number, hardware_version, firmware_version, purchase_date, unit_cost, status)
    VALUES
    (v_tenant_id, 'obd2', 'Geotab', 'GO9', 'GEO-OBD-001', 'v2.1', '8.0.2', '2023-06-15', 199.99, 'installed'),
    (v_tenant_id, 'obd2', 'Geotab', 'GO9', 'GEO-OBD-002', 'v2.1', '8.0.2', '2023-06-15', 199.99, 'installed'),
    (v_tenant_id, 'obd2', 'Geotab', 'GO9', 'GEO-OBD-003', 'v2.1', '8.0.2', '2023-06-15', 199.99, 'installed'),
    (v_tenant_id, 'gps_tracker', 'Verizon Connect', 'Reveal', 'VER-GPS-001', 'v3.0', '2.1.5', '2023-07-01', 299.99, 'installed'),
    (v_tenant_id, 'gps_tracker', 'Verizon Connect', 'Reveal', 'VER-GPS-002', 'v3.0', '2.1.5', '2023-07-01', 299.99, 'installed'),
    (v_tenant_id, 'dashcam', 'Samsara', 'CM32', 'SAM-CAM-001', 'v1.5', '4.2.1', '2023-08-10', 499.99, 'installed'),
    (v_tenant_id, 'dashcam', 'Samsara', 'CM32', 'SAM-CAM-002', 'v1.5', '4.2.1', '2023-08-10', 499.99, 'installed'),
    (v_tenant_id, 'dashcam', 'Samsara', 'CM32', 'SAM-CAM-003', 'v1.5', '4.2.1', '2023-08-10', 499.99, 'installed'),
    (v_tenant_id, 'eld', 'KeepTruckin', 'TK-300', 'KT-ELD-001', 'v2.0', '5.1.3', '2023-05-20', 350.00, 'installed'),
    (v_tenant_id, 'eld', 'KeepTruckin', 'TK-300', 'KT-ELD-002', 'v2.0', '5.1.3', '2023-05-20', 350.00, 'installed'),
    (v_tenant_id, 'fuel_sensor', 'FuelTech', 'FS-200', 'FT-FUEL-001', 'v1.0', '1.2.0', '2023-09-05', 150.00, 'installed'),
    (v_tenant_id, 'fuel_sensor', 'FuelTech', 'FS-200', 'FT-FUEL-002', 'v1.0', '1.2.0', '2023-09-05', 150.00, 'installed'),
    (v_tenant_id, 'temperature_sensor', 'TempMonitor', 'TM-150', 'TM-TEMP-001', 'v1.2', '2.0.1', '2023-09-10', 175.00, 'in_stock'),
    (v_tenant_id, 'tire_pressure', 'PressurePro', 'PP-8', 'PP-TIRE-001', 'v2.0', '3.1.0', '2023-10-01', 125.00, 'in_stock')
    ON CONFLICT (serial_number) DO NOTHING;

    -- Assign devices to vehicles
    INSERT INTO vehicle_devices (tenant_id, vehicle_id, device_id, installation_date, installed_by, installation_location, device_identifier, is_active, last_communication, device_status)
    SELECT
        v_tenant_id,
        v_vehicle1_id,
        id,
        CURRENT_DATE - INTERVAL '3 months',
        v_admin_id,
        CASE device_type
            WHEN 'obd2' THEN 'OBD-II port'
            WHEN 'gps_tracker' THEN 'under_dashboard'
            WHEN 'dashcam' THEN 'windshield'
            WHEN 'eld' THEN 'dashboard_mount'
            WHEN 'fuel_sensor' THEN 'fuel_tank'
        END,
        'DEV-' || id || '-VEH1',
        TRUE,
        CURRENT_TIMESTAMP - INTERVAL '5 minutes',
        'operational'
    FROM tracking_devices
    WHERE serial_number IN ('GEO-OBD-001', 'VER-GPS-001', 'SAM-CAM-001', 'KT-ELD-001', 'FT-FUEL-001')
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- EV CHARGING STATIONS
    -- ============================================
    INSERT INTO ev_charging_stations (tenant_id, station_name, station_type, power_rating_kw, connector_type, location, address, latitude, longitude, status, is_public, cost_per_kwh, installed_by, installation_date, last_maintenance_date)
    VALUES
    (v_tenant_id, 'Main Depot - Station 1', 'Level 2 (240V)', 7.2, 'J1772', 'Main Fleet Depot', '123 Fleet St, Tallahassee, FL 32301', 30.4383, -84.2807, 'online', FALSE, 0.28, v_admin_id, '2023-03-15', '2024-10-01'),
    (v_tenant_id, 'Main Depot - Station 2', 'DC Fast Charge', 50.0, 'CCS', 'Main Fleet Depot', '123 Fleet St, Tallahassee, FL 32301', 30.4383, -84.2807, 'online', FALSE, 0.35, v_admin_id, '2023-03-15', '2024-10-01'),
    (v_tenant_id, 'North Branch - Station 1', 'Level 2 (240V)', 7.2, 'J1772', 'North Branch Office', '456 North Ave, Tallahassee, FL 32308', 30.5008, -84.2633, 'offline', FALSE, 0.28, v_admin_id, '2023-06-20', '2024-09-15'),
    (v_tenant_id, 'South Depot - Station 1', 'DC Fast Charge', 150.0, 'CCS', 'South Service Center', '789 South Blvd, Tallahassee, FL 32304', 30.4165, -84.2809, 'maintenance', FALSE, 0.38, v_admin_id, '2023-09-10', '2024-11-01')
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- EV CHARGING SESSIONS
    -- ============================================
    -- Active charging session
    INSERT INTO ev_charging_sessions (tenant_id, vehicle_id, station_id, driver_id, start_time, energy_delivered_kwh, cost, status, connector_type, peak_power_kw)
    SELECT
        v_tenant_id,
        v_vehicle1_id,
        cs.id,
        v_driver1_id,
        CURRENT_TIMESTAMP - INTERVAL '30 minutes',
        25.5,
        8.92,
        'active',
        'CCS',
        48.5
    FROM ev_charging_stations cs
    WHERE cs.tenant_id = v_tenant_id AND cs.station_name = 'Main Depot - Station 2'
    LIMIT 1
    ON CONFLICT DO NOTHING;

    -- Completed charging session
    INSERT INTO ev_charging_sessions (tenant_id, vehicle_id, station_id, driver_id, start_time, end_time, energy_delivered_kwh, cost, status, connector_type, peak_power_kw, carbon_offset_kg)
    SELECT
        v_tenant_id,
        v_vehicle2_id,
        cs.id,
        v_driver2_id,
        CURRENT_TIMESTAMP - INTERVAL '25 hours',
        CURRENT_TIMESTAMP - INTERVAL '24 hours',
        45.3,
        12.85,
        'completed',
        'J1772',
        7.1,
        22.3
    FROM ev_charging_stations cs
    WHERE cs.tenant_id = v_tenant_id AND cs.station_name = 'Main Depot - Station 1'
    LIMIT 1
    ON CONFLICT DO NOTHING;

    -- ============================================
    -- VIDEO TELEMATICS EVENTS
    -- ============================================
    INSERT INTO video_events (tenant_id, vehicle_id, driver_id, event_type, severity, timestamp, latitude, longitude, speed_mph, gforce, confidence_score, video_url, thumbnail_url, coaching_status, reviewed_by, review_notes)
    VALUES
    (v_tenant_id, v_vehicle1_id, v_driver1_id, 'Phone Use', 'high', CURRENT_TIMESTAMP - INTERVAL '2 hours', 30.4383, -84.2807, 45, 0.2, 94, 'https://storage.example.com/video/event-001.mp4', 'https://storage.example.com/thumbs/event-001.jpg', 'not_assigned', NULL, NULL),
    (v_tenant_id, v_vehicle2_id, v_driver2_id, 'Harsh Braking', 'medium', CURRENT_TIMESTAMP - INTERVAL '5 hours', 30.4500, -84.2900, 52, 0.8, 89, 'https://storage.example.com/video/event-002.mp4', 'https://storage.example.com/thumbs/event-002.jpg', 'in-progress', v_manager_id, 'Driver reported deer in road, braking justified'),
    (v_tenant_id, v_vehicle3_id, v_driver3_id, 'Speeding', 'medium', CURRENT_TIMESTAMP - INTERVAL '27 hours', 30.4200, -84.3000, 68, 0.3, 98, 'https://storage.example.com/video/event-003.mp4', 'https://storage.example.com/thumbs/event-003.jpg', 'completed', v_manager_id, 'Coaching session completed, driver acknowledged'),
    (v_tenant_id, v_vehicle1_id, v_driver1_id, 'Following Too Close', 'low', CURRENT_TIMESTAMP - INTERVAL '50 hours', 30.4600, -84.2700, 55, 0.1, 78, 'https://storage.example.com/video/event-004.mp4', 'https://storage.example.com/thumbs/event-004.jpg', 'dismissed', v_manager_id, 'False positive - sufficient distance maintained')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Demo data population complete!';
    RAISE NOTICE '   - % Safety Policies', (SELECT COUNT(*) FROM safety_policies WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '   - % Procedures (SOPs)', (SELECT COUNT(*) FROM procedures WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '   - % Compliance Requirements', (SELECT COUNT(*) FROM compliance_requirements WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '   - % Training Programs', (SELECT COUNT(*) FROM training_programs WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '   - % Tracking Devices', (SELECT COUNT(*) FROM tracking_devices WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '   - % EV Charging Stations', (SELECT COUNT(*) FROM ev_charging_stations WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '   - % EV Charging Sessions', (SELECT COUNT(*) FROM ev_charging_sessions WHERE tenant_id = v_tenant_id);
    RAISE NOTICE '   - % Video Events', (SELECT COUNT(*) FROM video_events WHERE tenant_id = v_tenant_id);

END $$;
