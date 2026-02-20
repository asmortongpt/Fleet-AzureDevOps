-- ============================================================================
-- Fleet CTA Comprehensive Seed Data
-- ============================================================================
-- Populates all empty tables with realistic industry-standard fleet data.
-- All data targets dev tenant: 12345678-1234-1234-1234-123456789012
-- Idempotent: uses ON CONFLICT DO NOTHING where possible.
-- ============================================================================

-- ============================================================================
-- PART 1: Training Courses & Progress
-- ============================================================================
BEGIN;
SET app.current_tenant_id = '12345678-1234-1234-1234-123456789012';

-- Training Courses (10 industry-standard courses)
-- id is auto-increment integer; use explicit IDs starting at 100
INSERT INTO training_courses (id, tenant_id, course_name, description, category, duration_hours, required, provider, status, created_at, updated_at)
VALUES
  (100, '12345678-1234-1234-1234-123456789012', 'Defensive Driving Certification',
   'Comprehensive defensive driving course covering hazard recognition, space management, and collision avoidance techniques per NSC standards.',
   'Safety', 8.0, true, 'National Safety Council', 'active', NOW() - INTERVAL '180 days', NOW() - INTERVAL '10 days'),

  (101, '12345678-1234-1234-1234-123456789012', 'HAZMAT Awareness Training',
   'DOT-required hazardous materials awareness training covering identification, placarding, shipping papers, and emergency response per 49 CFR 172.704.',
   'Compliance', 4.0, true, 'J.J. Keller & Associates', 'active', NOW() - INTERVAL '180 days', NOW() - INTERVAL '15 days'),

  (102, '12345678-1234-1234-1234-123456789012', 'Hours of Service (HOS) Compliance',
   'Training on FMCSA Hours of Service regulations including 11-hour driving limit, 14-hour window, 30-minute break rule, and 60/70-hour limits.',
   'Compliance', 2.0, true, 'FMCSA Certified Trainer', 'active', NOW() - INTERVAL '160 days', NOW() - INTERVAL '5 days'),

  (103, '12345678-1234-1234-1234-123456789012', 'Pre-Trip/Post-Trip Inspection Procedures',
   'DVIR training covering all inspection points per 49 CFR 396.11 and 396.13 including engine, cab, coupling, and trailer inspection.',
   'Safety', 1.5, true, 'In-House Training Dept', 'active', NOW() - INTERVAL '150 days', NOW() - INTERVAL '20 days'),

  (104, '12345678-1234-1234-1234-123456789012', 'Workplace Safety & OSHA 10-Hour',
   'OSHA 10-Hour General Industry course covering hazard communication, PPE, fire safety, electrical safety, and ergonomics.',
   'Safety', 10.0, true, 'OSHA Training Institute', 'active', NOW() - INTERVAL '140 days', NOW() - INTERVAL '12 days'),

  (105, '12345678-1234-1234-1234-123456789012', 'Drug & Alcohol Awareness',
   'DOT-mandated drug and alcohol awareness training per 49 CFR Part 382 covering testing procedures, prohibited substances, and consequences.',
   'Compliance', 1.0, true, 'FMCSA Certified Trainer', 'active', NOW() - INTERVAL '180 days', NOW() - INTERVAL '8 days'),

  (106, '12345678-1234-1234-1234-123456789012', 'ELD Operation & Compliance',
   'Training on electronic logging device operation per FMCSA ELD mandate including data entry, malfunction reporting, and driver responsibilities.',
   'Operations', 2.0, true, 'Fleet Telematics Vendor', 'active', NOW() - INTERVAL '120 days', NOW() - INTERVAL '3 days'),

  (107, '12345678-1234-1234-1234-123456789012', 'Fleet Telematics Systems Training',
   'Comprehensive training on GPS tracking, route optimization, geofencing, and fleet management dashboard operation.',
   'Operations', 1.5, false, 'In-House Training Dept', 'active', NOW() - INTERVAL '100 days', NOW() - INTERVAL '7 days'),

  (108, '12345678-1234-1234-1234-123456789012', 'Preventive Maintenance Fundamentals',
   'Training on PM scheduling, fluid checks, tire inspection, brake inspection, and DVIR completion for maintenance technicians.',
   'Maintenance', 3.0, false, 'ASE Certified Instructor', 'active', NOW() - INTERVAL '90 days', NOW() - INTERVAL '14 days'),

  (109, '12345678-1234-1234-1234-123456789012', 'Accident Reporting & Response Procedures',
   'Step-by-step training on accident scene management, documentation, reporting to FMCSA per 49 CFR 390.15, and post-accident drug testing requirements.',
   'Safety', 1.0, true, 'In-House Training Dept', 'active', NOW() - INTERVAL '180 days', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Update the sequence to avoid future conflicts
SELECT setval(pg_get_serial_sequence('training_courses', 'id'), GREATEST(110, (SELECT MAX(id) FROM training_courses) + 1));

-- Training Progress (25 records across drivers and courses)
-- id is auto-increment integer; driver_id references drivers; course_id references training_courses
INSERT INTO training_progress (tenant_id, driver_id, course_id, status, progress_percent, started_at, completed_at, score)
VALUES
  -- Driver 1 (30000000-...-001): completed several courses
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000001', 100, 'completed', 100, NOW() - INTERVAL '90 days', NOW() - INTERVAL '82 days', 94),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000001', 102, 'completed', 100, NOW() - INTERVAL '85 days', NOW() - INTERVAL '84 days', 88),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000001', 103, 'completed', 100, NOW() - INTERVAL '80 days', NOW() - INTERVAL '80 days', 100),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000001', 105, 'completed', 100, NOW() - INTERVAL '75 days', NOW() - INTERVAL '75 days', 92),
  -- Driver 2: mix of completed and in-progress
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000002', 100, 'completed', 100, NOW() - INTERVAL '70 days', NOW() - INTERVAL '62 days', 87),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000002', 101, 'in_progress', 65, NOW() - INTERVAL '20 days', NULL, NULL),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000002', 104, 'in_progress', 40, NOW() - INTERVAL '15 days', NULL, NULL),
  -- Driver 3: completed all required
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000003', 100, 'completed', 100, NOW() - INTERVAL '120 days', NOW() - INTERVAL '112 days', 96),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000003', 102, 'completed', 100, NOW() - INTERVAL '115 days', NOW() - INTERVAL '114 days', 91),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000003', 105, 'completed', 100, NOW() - INTERVAL '110 days', NOW() - INTERVAL '110 days', 85),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000003', 106, 'completed', 100, NOW() - INTERVAL '100 days', NOW() - INTERVAL '99 days', 90),
  -- Driver 4: mostly not started
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000004', 100, 'in_progress', 25, NOW() - INTERVAL '10 days', NULL, NULL),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000004', 103, 'pending', 0, NULL, NULL, NULL),
  -- Driver 5: good progress
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000005', 100, 'completed', 100, NOW() - INTERVAL '60 days', NOW() - INTERVAL '52 days', 91),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000005', 101, 'completed', 100, NOW() - INTERVAL '55 days', NOW() - INTERVAL '53 days', 83),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000005', 102, 'completed', 100, NOW() - INTERVAL '50 days', NOW() - INTERVAL '49 days', 95),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000005', 109, 'in_progress', 80, NOW() - INTERVAL '5 days', NULL, NULL),
  -- Drivers 6-8: scattered
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000006', 100, 'completed', 100, NOW() - INTERVAL '45 days', NOW() - INTERVAL '37 days', 89),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000006', 105, 'completed', 100, NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days', 97),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000007', 100, 'in_progress', 55, NOW() - INTERVAL '12 days', NULL, NULL),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000007', 102, 'pending', 0, NULL, NULL, NULL),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000008', 100, 'completed', 100, NOW() - INTERVAL '30 days', NOW() - INTERVAL '22 days', 82),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000008', 103, 'completed', 100, NOW() - INTERVAL '28 days', NOW() - INTERVAL '28 days', 100),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000009', 104, 'in_progress', 70, NOW() - INTERVAL '18 days', NULL, NULL),
  ('12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000010', 100, 'completed', 100, NOW() - INTERVAL '95 days', NOW() - INTERVAL '87 days', 93);

COMMIT;

-- ============================================================================
-- PART 2: Policy Acknowledgments, Violations, Audits
-- ============================================================================
BEGIN;
SET app.current_tenant_id = '12345678-1234-1234-1234-123456789012';

-- Policy Acknowledgments (30 records)
-- policy_id references policy_templates; employee_number references drivers
INSERT INTO policy_acknowledgments (id, policy_id, employee_number, acknowledged_at, acknowledgment_method, test_taken, test_score, test_passed, training_completed, is_current, tenant_id)
VALUES
  -- Vehicle Safety Inspection (70100000-...-001) acknowledgments
  ('72100000-0000-0000-0000-000000000001', '70100000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', NOW() - INTERVAL '85 days', 'electronic', true, 94.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000002', '70100000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', NOW() - INTERVAL '80 days', 'electronic', true, 88.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000003', '70100000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', NOW() - INTERVAL '75 days', 'electronic', true, 91.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000004', '70100000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', NOW() - INTERVAL '70 days', 'electronic', true, 86.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000005', '70100000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', NOW() - INTERVAL '65 days', 'electronic', true, 92.0, true, true, true, '12345678-1234-1234-1234-123456789012'),

  -- Drug and Alcohol Testing (70100000-...-002)
  ('72100000-0000-0000-0000-000000000006', '70100000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', NOW() - INTERVAL '90 days', 'electronic', true, 100.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000007', '70100000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', NOW() - INTERVAL '88 days', 'electronic', true, 95.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000008', '70100000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', NOW() - INTERVAL '85 days', 'electronic', true, 100.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000009', '70100000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000005', NOW() - INTERVAL '82 days', 'electronic', true, 90.0, true, true, true, '12345678-1234-1234-1234-123456789012'),

  -- PPE Requirements (70100000-...-003)
  ('72100000-0000-0000-0000-000000000010', '70100000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', NOW() - INTERVAL '80 days', 'electronic', false, NULL, NULL, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000011', '70100000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', NOW() - INTERVAL '78 days', 'electronic', false, NULL, NULL, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000012', '70100000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000005', NOW() - INTERVAL '76 days', 'wet_signature', false, NULL, NULL, true, true, '12345678-1234-1234-1234-123456789012'),

  -- HOS Compliance (70100000-...-005)
  ('72100000-0000-0000-0000-000000000013', '70100000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', NOW() - INTERVAL '70 days', 'electronic', true, 88.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000014', '70100000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000003', NOW() - INTERVAL '68 days', 'electronic', true, 92.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000015', '70100000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', NOW() - INTERVAL '66 days', 'electronic', true, 85.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000016', '70100000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000006', NOW() - INTERVAL '64 days', 'electronic', true, 79.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000017', '70100000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000007', NOW() - INTERVAL '62 days', 'electronic', true, 90.0, true, true, true, '12345678-1234-1234-1234-123456789012'),

  -- Preventive Maintenance (70100000-...-006)
  ('72100000-0000-0000-0000-000000000018', '70100000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000001', NOW() - INTERVAL '60 days', 'electronic', false, NULL, NULL, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000019', '70100000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000002', NOW() - INTERVAL '58 days', 'electronic', false, NULL, NULL, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000020', '70100000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000003', NOW() - INTERVAL '56 days', 'electronic', false, NULL, NULL, true, true, '12345678-1234-1234-1234-123456789012'),

  -- Accident Response (70100000-...-007)
  ('72100000-0000-0000-0000-000000000021', '70100000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000001', NOW() - INTERVAL '50 days', 'electronic', true, 96.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000022', '70100000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000002', NOW() - INTERVAL '48 days', 'electronic', true, 88.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000023', '70100000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000005', NOW() - INTERVAL '46 days', 'electronic', true, 91.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000024', '70100000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000008', NOW() - INTERVAL '44 days', 'electronic', true, 84.0, true, true, true, '12345678-1234-1234-1234-123456789012'),

  -- Driver Qualification (70100000-...-004)
  ('72100000-0000-0000-0000-000000000025', '70100000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', NOW() - INTERVAL '40 days', 'electronic', true, 100.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000026', '70100000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000002', NOW() - INTERVAL '38 days', 'electronic', true, 95.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000027', '70100000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', NOW() - INTERVAL '36 days', 'electronic', true, 90.0, true, true, true, '12345678-1234-1234-1234-123456789012'),

  -- HAZMAT (70100000-...-008)
  ('72100000-0000-0000-0000-000000000028', '70100000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000001', NOW() - INTERVAL '30 days', 'electronic', true, 93.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000029', '70100000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000005', NOW() - INTERVAL '28 days', 'electronic', true, 87.0, true, true, true, '12345678-1234-1234-1234-123456789012'),
  ('72100000-0000-0000-0000-000000000030', '70100000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000003', NOW() - INTERVAL '26 days', 'electronic', true, 91.0, true, true, true, '12345678-1234-1234-1234-123456789012')
ON CONFLICT (id) DO NOTHING;

-- Policy Violations (8 records of varying severity)
INSERT INTO policy_violations (id, policy_id, employee_number, violation_date, violation_time, location, violation_description, severity, vehicle_id, investigation_notes, root_cause, disciplinary_action, action_description, action_date, case_status, is_repeat_offense, offense_count, training_required, training_completed, created_at, tenant_id)
VALUES
  ('72200000-0000-0000-0000-000000000001',
   '70100000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000004',
   CURRENT_DATE - 45, '14:30:00', 'I-95 Northbound, Mile Marker 142',
   'Driver exceeded 11-hour driving limit by 47 minutes. ELD data shows continuous driving from 04:00 to 15:47 without required break.',
   'serious', '40000000-0000-0000-0000-000000000012',
   'ELD logs confirmed. Driver stated traffic delays caused the overage.',
   'Poor trip planning and dispatcher communication gap',
   'written_warning', 'Written warning issued. Driver required to retake HOS compliance training.', CURRENT_DATE - 43,
   'closed', false, 1, true, false, NOW() - INTERVAL '45 days', '12345678-1234-1234-1234-123456789012'),

  ('72200000-0000-0000-0000-000000000002',
   '70100000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000007',
   CURRENT_DATE - 30, '06:15:00', 'Main Facility Yard',
   'Driver failed to complete pre-trip inspection. Missing DVIR for morning departure. Brake lights found non-functional during random check.',
   'moderate', '40000000-0000-0000-0000-000000000023',
   'Random safety check by supervisor revealed vehicle departed without DVIR.',
   'Negligence in completing required pre-trip inspection',
   'verbal_warning', 'Verbal warning and mandatory re-training on pre-trip inspection procedures.', CURRENT_DATE - 29,
   'closed', false, 1, true, true, NOW() - INTERVAL '30 days', '12345678-1234-1234-1234-123456789012'),

  ('72200000-0000-0000-0000-000000000003',
   '70100000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000009',
   CURRENT_DATE - 20, '08:00:00', 'Company Testing Facility',
   'Driver missed scheduled random drug test. Failed to report to testing facility within required 2-hour window after notification.',
   'critical', NULL,
   'Driver was notified at 07:45 via company app and phone call. Did not report to testing facility.',
   'Under investigation - checking phone records and app logs',
   NULL, NULL, NULL,
   'under_investigation', false, 1, false, false, NOW() - INTERVAL '20 days', '12345678-1234-1234-1234-123456789012'),

  ('72200000-0000-0000-0000-000000000004',
   '70100000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000010',
   CURRENT_DATE - 15, '11:00:00', 'Warehouse Loading Dock B',
   'Employee observed operating forklift without required steel-toe boots and high-visibility vest in loading dock area.',
   'minor', NULL,
   'Supervisor witnessed the violation during routine walkthrough.',
   'Employee chose convenience over safety protocol',
   'verbal_warning', 'Verbal coaching provided on site. Employee retrieved PPE immediately.', CURRENT_DATE - 15,
   'closed', false, 1, false, false, NOW() - INTERVAL '15 days', '12345678-1234-1234-1234-123456789012'),

  ('72200000-0000-0000-0000-000000000005',
   '70100000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000004',
   CURRENT_DATE - 10, '16:45:00', 'Distribution Center East',
   'Second HOS violation within 60 days. Driver exceeded 14-hour on-duty window by 32 minutes while completing delivery.',
   'critical', '40000000-0000-0000-0000-000000000012',
   'This is a repeat offense for the same driver. Previous violation was 35 days ago.',
   'Repeat offense - scheduling pressure and inadequate route planning',
   'suspension', '3-day suspension without pay. Mandatory meeting with safety director.', CURRENT_DATE - 9,
   'action_taken', true, 2, true, false, NOW() - INTERVAL '10 days', '12345678-1234-1234-1234-123456789012'),

  ('72200000-0000-0000-0000-000000000006',
   '70100000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000011',
   CURRENT_DATE - 8, '09:30:00', 'Maintenance Bay 3',
   'Technician failed to document oil change and filter replacement in maintenance log. PM checklist was left incomplete.',
   'minor', '40000000-0000-0000-0000-000000000035',
   'During PM audit, maintenance manager found incomplete documentation.',
   'Administrative oversight - technician was handling multiple vehicles simultaneously',
   'verbal_warning', 'Documentation training refresher scheduled.', CURRENT_DATE - 7,
   'closed', false, 1, false, false, NOW() - INTERVAL '8 days', '12345678-1234-1234-1234-123456789012'),

  ('72200000-0000-0000-0000-000000000007',
   '70100000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000006',
   CURRENT_DATE - 5, '13:20:00', 'Highway 301 & Oak Street',
   'Driver involved in minor fender-bender. Failed to immediately notify dispatch and waited 4 hours to file incident report.',
   'moderate', '40000000-0000-0000-0000-000000000018',
   'Damage was minor ($800 estimate) but delayed reporting violated 30-minute notification policy.',
   'Driver was embarrassed about the incident and tried to handle it independently',
   'written_warning', 'Written warning. Mandatory accident response procedure re-training.', CURRENT_DATE - 4,
   'action_taken', false, 1, true, false, NOW() - INTERVAL '5 days', '12345678-1234-1234-1234-123456789012'),

  ('72200000-0000-0000-0000-000000000008',
   '70100000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000012',
   CURRENT_DATE - 2, '07:00:00', 'Satellite Facility North',
   'Post-trip inspection form submitted with all items marked satisfactory, but next-day pre-trip found flat tire and cracked windshield.',
   'serious', '40000000-0000-0000-0000-000000000042',
   'Comparison of post-trip and next-day pre-trip indicates driver did not actually perform the post-trip inspection.',
   'Falsification of inspection report',
   NULL, NULL, NULL,
   'under_investigation', false, 1, true, false, NOW() - INTERVAL '2 days', '12345678-1234-1234-1234-123456789012')
ON CONFLICT (id) DO NOTHING;

-- Policy Compliance Audits (4 quarterly audits)
INSERT INTO policy_compliance_audits (id, policy_id, audit_date, auditor_name, audit_type, location, department, compliance_score, compliant_items, non_compliant_items, findings, corrective_actions_required, corrective_actions_due_date, follow_up_required, follow_up_date, created_at, created_by, tenant_id)
VALUES
  ('72300000-0000-0000-0000-000000000001',
   '70100000-0000-0000-0000-000000000001',
   CURRENT_DATE - 180, 'National Safety Auditors LLC', 'quarterly',
   'Main Facility', 'Operations', 78.5, 42, 12,
   '{"findings": [{"item": "DVIR completion rate below 90%", "severity": "high"}, {"item": "3 vehicles with expired fire extinguishers", "severity": "medium"}]}',
   true, CURRENT_DATE - 150, true, CURRENT_DATE - 120,
   NOW() - INTERVAL '180 days', '00000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012'),

  ('72300000-0000-0000-0000-000000000002',
   '70100000-0000-0000-0000-000000000005',
   CURRENT_DATE - 90, 'DOT Compliance Consultants', 'quarterly',
   'All Facilities', 'Operations', 85.2, 48, 8,
   '{"findings": [{"item": "2 drivers with multiple HOS violations", "severity": "high"}, {"item": "ELD malfunction reporting delays", "severity": "medium"}]}',
   true, CURRENT_DATE - 60, true, CURRENT_DATE - 30,
   NOW() - INTERVAL '90 days', '00000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012'),

  ('72300000-0000-0000-0000-000000000003',
   '70100000-0000-0000-0000-000000000002',
   CURRENT_DATE - 45, 'Workplace Health Solutions', 'semi_annual',
   'Main Facility', 'Human Resources', 92.0, 55, 5,
   '{"findings": [{"item": "Random testing rate on track at 52%", "severity": "info"}, {"item": "1 missed test requiring follow-up", "severity": "medium"}]}',
   false, NULL, false, NULL,
   NOW() - INTERVAL '45 days', '00000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012'),

  ('72300000-0000-0000-0000-000000000004',
   '70100000-0000-0000-0000-000000000006',
   CURRENT_DATE - 15, 'Fleet Maintenance Auditors', 'quarterly',
   'Maintenance Shop', 'Maintenance', 88.7, 52, 7,
   '{"findings": [{"item": "PM completion rate improved to 94%", "severity": "info"}, {"item": "2 vehicles overdue for brake inspection", "severity": "high"}]}',
   true, CURRENT_DATE + 15, false, NULL,
   NOW() - INTERVAL '15 days', '00000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================================================
-- PART 3: Policy Executions, OSHA Logs, Communication Logs
-- ============================================================================
BEGIN;
SET app.current_tenant_id = '12345678-1234-1234-1234-123456789012';

-- Policy Executions (8 records showing automated policy engine activity)
INSERT INTO policy_executions (id, tenant_id, policy_id, trigger_type, trigger_event, trigger_data, trigger_timestamp, conditions_met, conditions_evaluated, actions_executed, action_results, actions_successful, actions_failed, vehicle_id, driver_id, execution_status, started_at, completed_at, duration_ms, execution_mode, created_at)
VALUES
  ('72400000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012',
   '70100000-0000-0000-0000-000000000005', 'automated', 'eld_hours_exceeded',
   '{"driver_id": "30000000-0000-0000-0000-000000000004", "hours_driven": 11.78, "limit": 11.0}',
   NOW() - INTERVAL '45 days', true,
   '{"conditions": [{"rule": "driving_hours > 11", "result": true}]}',
   '{"actions": [{"type": "create_violation", "status": "completed"}, {"type": "notify_dispatcher", "status": "completed"}]}',
   '{"violation_id": "72200000-0000-0000-0000-000000000001"}',
   2, 0, '40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000004',
   'completed', NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days' + INTERVAL '2 seconds', 1850, 'automatic', NOW() - INTERVAL '45 days'),

  ('72400000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012',
   '70100000-0000-0000-0000-000000000006', 'scheduled', 'pm_schedule_check',
   '{"check_type": "daily_pm_review"}',
   NOW() - INTERVAL '30 days', true,
   '{"conditions": [{"rule": "vehicles_with_overdue_pm > 0", "result": true, "count": 3}]}',
   '{"actions": [{"type": "flag_vehicles", "status": "completed"}, {"type": "create_work_orders", "status": "completed"}]}',
   '{"vehicles_flagged": 3, "work_orders_created": 3}',
   2, 0, NULL, NULL,
   'completed', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days' + INTERVAL '5 seconds', 4200, 'automatic', NOW() - INTERVAL '30 days'),

  ('72400000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012',
   '70100000-0000-0000-0000-000000000001', 'automated', 'dvir_not_submitted',
   '{"vehicle_id": "40000000-0000-0000-0000-000000000023"}',
   NOW() - INTERVAL '30 days', true,
   '{"conditions": [{"rule": "departure_without_dvir", "result": true}]}',
   '{"actions": [{"type": "create_violation", "status": "completed"}, {"type": "notify_supervisor", "status": "completed"}]}',
   '{"violation_id": "72200000-0000-0000-0000-000000000002"}',
   2, 0, '40000000-0000-0000-0000-000000000023', '30000000-0000-0000-0000-000000000007',
   'completed', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days' + INTERVAL '1 second', 980, 'automatic', NOW() - INTERVAL '30 days'),

  ('72400000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012',
   '70100000-0000-0000-0000-000000000005', 'automated', 'eld_hours_exceeded',
   '{"driver_id": "30000000-0000-0000-0000-000000000004", "hours_on_duty": 14.53}',
   NOW() - INTERVAL '10 days', true,
   '{"conditions": [{"rule": "on_duty_hours > 14", "result": true}, {"rule": "repeat_offender", "result": true}]}',
   '{"actions": [{"type": "create_violation", "status": "completed"}, {"type": "escalate_to_safety_director", "status": "completed"}]}',
   '{"violation_id": "72200000-0000-0000-0000-000000000005", "escalated": true}',
   2, 0, '40000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000004',
   'completed', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '3 seconds', 2650, 'automatic', NOW() - INTERVAL '10 days'),

  ('72400000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012',
   '70100000-0000-0000-0000-000000000002', 'scheduled', 'random_test_selection',
   '{"selection_pool": 32, "selected_count": 4}',
   NOW() - INTERVAL '20 days', true,
   '{"conditions": [{"rule": "monthly_random_selection", "result": true}]}',
   '{"actions": [{"type": "select_random_drivers", "status": "completed"}, {"type": "notify_drivers", "status": "completed"}]}',
   '{"drivers_selected": 4}',
   2, 0, NULL, NULL,
   'completed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days' + INTERVAL '4 seconds', 3500, 'automatic', NOW() - INTERVAL '20 days'),

  ('72400000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012',
   '70100000-0000-0000-0000-000000000004', 'scheduled', 'license_expiration_check',
   '{"check_type": "weekly_license_review"}',
   NOW() - INTERVAL '7 days', true,
   '{"conditions": [{"rule": "licenses_expiring_within_30_days > 0", "result": true, "count": 2}]}',
   '{"actions": [{"type": "notify_drivers", "status": "completed"}, {"type": "notify_hr", "status": "completed"}]}',
   '{"drivers_notified": 2, "hr_notified": true}',
   2, 0, NULL, NULL,
   'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days' + INTERVAL '2 seconds', 1200, 'automatic', NOW() - INTERVAL '7 days'),

  ('72400000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012',
   '70100000-0000-0000-0000-000000000007', 'manual', 'incident_reported',
   '{"incident_type": "minor_collision"}',
   NOW() - INTERVAL '5 days', true,
   '{"conditions": [{"rule": "incident_severity >= minor", "result": true}]}',
   '{"actions": [{"type": "create_violation", "status": "completed"}, {"type": "notify_insurance", "status": "completed"}]}',
   '{"violation_id": "72200000-0000-0000-0000-000000000007"}',
   2, 0, '40000000-0000-0000-0000-000000000018', '30000000-0000-0000-0000-000000000006',
   'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '6 seconds', 5800, 'manual', NOW() - INTERVAL '5 days'),

  ('72400000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012',
   '70100000-0000-0000-0000-000000000006', 'scheduled', 'weekly_pm_compliance',
   '{"check_type": "weekly_pm_status"}',
   NOW() - INTERVAL '1 day', true,
   '{"conditions": [{"rule": "pm_compliance_rate < 95", "result": false, "actual": 96.2}]}',
   '{"actions": [{"type": "generate_pm_report", "status": "completed"}]}',
   '{"report_generated": true, "compliance_rate": 96.2}',
   1, 0, NULL, NULL,
   'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '1 second', 750, 'automatic', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- OSHA Logs (6 records)
-- employee_id and reported_by reference users table (NOT drivers)
INSERT INTO osha_logs (id, tenant_id, case_number, incident_date, employee_id, employee_name, job_title, incident_description, body_part_affected, injury_type, is_recordable, is_lost_time, days_away_from_work, days_restricted_duty, location, vehicle_id, reported_date, reported_by, status, created_at)
VALUES
  ('72500000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012',
   'OSHA-2025-001', CURRENT_DATE - 120,
   '00000000-0000-0000-0000-000000000005', 'Robert Garcia', 'Fleet Mechanic',
   'Employee slipped on oil spill in maintenance bay while carrying replacement brake rotor. Fell and struck left knee on concrete floor.',
   'Left Knee', 'Contusion/Bruise', true, true, 3, 5,
   'Maintenance Bay 2', NULL,
   CURRENT_DATE - 120, '00000000-0000-0000-0000-000000000006', 'closed', NOW() - INTERVAL '120 days'),

  ('72500000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012',
   'OSHA-2025-002', CURRENT_DATE - 85,
   '00000000-0000-0000-0000-000000000007', 'David Thompson', 'Fleet Mechanic',
   'While replacing air filter on truck, mechanic sustained laceration to right forearm from sharp metal edge on engine compartment cover.',
   'Right Forearm', 'Laceration', true, false, 0, 2,
   'Maintenance Bay 1', '40000000-0000-0000-0000-000000000008',
   CURRENT_DATE - 85, '00000000-0000-0000-0000-000000000005', 'closed', NOW() - INTERVAL '85 days'),

  ('72500000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012',
   'OSHA-2025-003', CURRENT_DATE - 55,
   '10000000-0000-0000-0000-000000000003', 'William Jones', 'CDL Driver',
   'Driver strained lower back while lifting 65-lb delivery package from truck bed. Did not use provided mechanical lift assist.',
   'Lower Back', 'Strain/Sprain', true, true, 5, 10,
   'Customer Site - 4521 Industrial Blvd', '40000000-0000-0000-0000-000000000015',
   CURRENT_DATE - 55, '00000000-0000-0000-0000-000000000004', 'closed', NOW() - INTERVAL '55 days'),

  ('72500000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012',
   'OSHA-2025-004', CURRENT_DATE - 25,
   '10000000-0000-0000-0000-000000000005', 'Michael Anderson', 'CDL Driver',
   'Driver experienced heat exhaustion while performing delivery route during high temperature day (102F). Required medical attention and IV fluids.',
   'Systemic', 'Heat Illness', true, true, 2, 0,
   'Route 7 - Downtown District', '40000000-0000-0000-0000-000000000020',
   CURRENT_DATE - 25, '00000000-0000-0000-0000-000000000004', 'open', NOW() - INTERVAL '25 days'),

  ('72500000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012',
   'OSHA-2025-005', CURRENT_DATE - 10,
   '00000000-0000-0000-0000-000000000005', 'Robert Garcia', 'Fleet Mechanic',
   'Chemical splash to right eye while draining coolant from radiator. Employee was not wearing required safety goggles.',
   'Right Eye', 'Chemical Burn', true, false, 0, 3,
   'Maintenance Bay 3', '40000000-0000-0000-0000-000000000032',
   CURRENT_DATE - 10, '00000000-0000-0000-0000-000000000006', 'under_review', NOW() - INTERVAL '10 days'),

  ('72500000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012',
   'OSHA-2025-006', CURRENT_DATE - 3,
   '10000000-0000-0000-0000-000000000001', 'James Brown', 'CDL Driver',
   'Near-miss incident: forklift operator nearly struck driver in loading dock area. No contact made but driver stumbled and scraped elbow.',
   'Right Elbow', 'Abrasion', false, false, 0, 0,
   'Warehouse Loading Dock A', NULL,
   CURRENT_DATE - 3, '00000000-0000-0000-0000-000000000006', 'open', NOW() - INTERVAL '3 days')
ON CONFLICT (id) DO NOTHING;

-- Communication Logs (15 records, id is auto-increment)
INSERT INTO communication_logs (tenant_id, communication_type, direction, subject, body, sender_id, sender_name, recipients, status, priority, channel, related_entity_type, related_entity_id, follow_up_required, metadata, created_at)
VALUES
  ('12345678-1234-1234-1234-123456789012', 'announcement', 'outbound',
   'New HOS Compliance Policy Effective March 1',
   'Attention all CDL drivers: Updated Hours of Service compliance procedures are now in effect. Please review and acknowledge the updated policy within 14 days.',
   '00000000-0000-0000-0000-000000000002', 'Sarah Johnson',
   '{"all_drivers": true}', 'sent', 'high', 'email',
   'policy', '70100000-0000-0000-0000-000000000005', true, '{"category": "policy_update"}', NOW() - INTERVAL '60 days'),

  ('12345678-1234-1234-1234-123456789012', 'notification', 'outbound',
   'Mandatory Drug Testing Scheduled - February Pool',
   'You have been randomly selected for drug testing per DOT 49 CFR Part 382. Report to the company testing facility within 2 hours.',
   '00000000-0000-0000-0000-000000000003', 'Marcus Williams',
   '[{"id": "30000000-0000-0000-0000-000000000009", "name": "Daniel White"}]', 'sent', 'urgent', 'sms',
   'policy', '70100000-0000-0000-0000-000000000002', true, '{"category": "compliance_action"}', NOW() - INTERVAL '20 days'),

  ('12345678-1234-1234-1234-123456789012', 'memo', 'outbound',
   'Q4 Safety Audit Results & Corrective Actions',
   'The Q4 safety audit has been completed. Overall compliance score: 85.2%. Two areas require immediate corrective action.',
   '00000000-0000-0000-0000-000000000002', 'Sarah Johnson',
   '{"roles": ["Manager", "Supervisor"]}', 'sent', 'high', 'email',
   'audit', '72300000-0000-0000-0000-000000000002', true, '{"category": "audit_results"}', NOW() - INTERVAL '45 days'),

  ('12345678-1234-1234-1234-123456789012', 'dispatch', 'outbound',
   'Route Change: Storm Advisory I-95 Corridor',
   'Due to severe weather advisory, all I-95 northbound routes are being rerouted via US-301. Updated route maps pushed to ELD.',
   '00000000-0000-0000-0000-000000000004', 'Lisa Chen',
   '{"route_drivers": true}', 'sent', 'urgent', 'push_notification',
   NULL, NULL, false, '{"category": "operations"}', NOW() - INTERVAL '12 days'),

  ('12345678-1234-1234-1234-123456789012', 'alert', 'outbound',
   'Vehicle Maintenance Alert: Unit 0012 Brake Warning',
   'Telematics system has detected abnormal brake temperature on Vehicle 0012. Please return to nearest facility for inspection.',
   '00000000-0000-0000-0000-000000000004', 'Lisa Chen',
   '[{"id": "30000000-0000-0000-0000-000000000004", "name": "Patricia Martinez"}]', 'sent', 'urgent', 'push_notification',
   'vehicle', '40000000-0000-0000-0000-000000000012', true, '{"category": "safety_alert"}', NOW() - INTERVAL '8 days'),

  ('12345678-1234-1234-1234-123456789012', 'report', 'inbound',
   'Incident Report: Parking Lot Collision - Highway 301',
   'Reporting minor collision in customer parking lot. No injuries. Other vehicle owner information collected.',
   '10000000-0000-0000-0000-000000000006', 'Linda Taylor',
   '[{"id": "00000000-0000-0000-0000-000000000004", "name": "Lisa Chen"}]', 'received', 'high', 'phone',
   'incident', 'a0000000-0000-0000-0000-000000000004', true, '{"category": "incident_report"}', NOW() - INTERVAL '5 days'),

  ('12345678-1234-1234-1234-123456789012', 'announcement', 'outbound',
   'Safety Training Deadline: March 15',
   'Reminder: All drivers must complete the annual Defensive Driving Certification by March 15.',
   '00000000-0000-0000-0000-000000000006', 'Jennifer Davis',
   '{"all_drivers": true}', 'sent', 'medium', 'email',
   'training', NULL, false, '{"category": "training_reminder"}', NOW() - INTERVAL '25 days'),

  ('12345678-1234-1234-1234-123456789012', 'notification', 'outbound',
   'PM Due: 5 Vehicles Approaching Service Interval',
   'The following vehicles are within 500 miles of their next scheduled PM: Units 0008, 0015, 0023, 0035, 0042.',
   '00000000-0000-0000-0000-000000000001', 'Dev User',
   '[{"id": "00000000-0000-0000-0000-000000000005", "name": "Robert Garcia"}]', 'sent', 'medium', 'email',
   'maintenance', NULL, true, '{"category": "maintenance_alert"}', NOW() - INTERVAL '3 days'),

  ('12345678-1234-1234-1234-123456789012', 'memo', 'outbound',
   'Updated PPE Requirements for Warehouse Operations',
   'Effective immediately: All personnel in loading dock areas must wear steel-toe boots, high-visibility vests, and hard hats.',
   '00000000-0000-0000-0000-000000000006', 'Jennifer Davis',
   '{"departments": ["Warehouse", "Maintenance", "Drivers"]}', 'sent', 'high', 'email',
   'policy', '70100000-0000-0000-0000-000000000003', false, '{"category": "policy_update"}', NOW() - INTERVAL '2 days'),

  ('12345678-1234-1234-1234-123456789012', 'request', 'inbound',
   'Request: Schedule Change for Medical Appointment',
   'Requesting schedule modification for next Tuesday. Have a DOT physical scheduled at 10:00 AM.',
   '10000000-0000-0000-0000-000000000002', 'Maria Rodriguez',
   '[{"id": "00000000-0000-0000-0000-000000000004", "name": "Lisa Chen"}]', 'received', 'medium', 'app',
   'driver', '30000000-0000-0000-0000-000000000002', true, '{"category": "schedule_request"}', NOW() - INTERVAL '1 day'),

  ('12345678-1234-1234-1234-123456789012', 'notification', 'outbound',
   'Compliance Certificate Expiring: CDL Medical Card',
   'Your DOT medical certificate expires in 28 days. Please schedule your physical examination.',
   '00000000-0000-0000-0000-000000000003', 'Marcus Williams',
   '[{"id": "30000000-0000-0000-0000-000000000008", "name": "Elizabeth Jackson"}]', 'sent', 'high', 'email',
   'compliance', 'c0000000-0000-0000-0000-000000000007', true, '{"category": "compliance_expiration"}', NOW() - INTERVAL '14 days'),

  ('12345678-1234-1234-1234-123456789012', 'alert', 'outbound',
   'Geofence Alert: Vehicle 0020 Outside Authorized Zone',
   'Vehicle 0020 has left the authorized operating zone. Last known position: 28.5383, -81.3792. Driver notified.',
   '00000000-0000-0000-0000-000000000004', 'Lisa Chen',
   '[{"id": "00000000-0000-0000-0000-000000000003", "name": "Marcus Williams"}]', 'sent', 'urgent', 'push_notification',
   'vehicle', '40000000-0000-0000-0000-000000000020', true, '{"category": "geofence_alert"}', NOW() - INTERVAL '6 days'),

  ('12345678-1234-1234-1234-123456789012', 'announcement', 'outbound',
   'Fleet Insurance Policy Renewal - Action Required',
   'Our fleet insurance policy renews on April 1. All accident reports must be filed and resolved by March 15.',
   '00000000-0000-0000-0000-000000000002', 'Sarah Johnson',
   '{"all_staff": true}', 'sent', 'medium', 'email',
   NULL, NULL, false, '{"category": "administrative"}', NOW() - INTERVAL '18 days'),

  ('12345678-1234-1234-1234-123456789012', 'dispatch', 'outbound',
   'Emergency Recall: Tire Defect Advisory',
   'URGENT: Vehicles equipped with BridgeStar RT450 tires must be immediately taken out of service for tire inspection per NHTSA recall.',
   '00000000-0000-0000-0000-000000000003', 'Marcus Williams',
   '{"maintenance_team": true}', 'sent', 'urgent', 'sms',
   NULL, NULL, true, '{"category": "safety_recall"}', NOW() - INTERVAL '4 days'),

  ('12345678-1234-1234-1234-123456789012', 'notification', 'outbound',
   'Weekly Fleet Performance Summary',
   'Fleet performance for the week: Fuel efficiency avg 7.2 MPG (+0.3), On-time delivery rate 94.1%, Safety score 88.7/100.',
   '00000000-0000-0000-0000-000000000001', 'Dev User',
   '{"roles": ["Admin", "Manager"]}', 'sent', 'low', 'email',
   NULL, NULL, false, '{"category": "performance_report"}', NOW() - INTERVAL '1 day');

COMMIT;

-- ============================================================================
-- PART 4: Documents (disable broken trigger first)
-- ============================================================================
BEGIN;
SET app.current_tenant_id = '12345678-1234-1234-1234-123456789012';

-- Disable the broken search vector trigger (tags is jsonb, trigger expects text[])
ALTER TABLE documents DISABLE TRIGGER documents_search_vector_trigger;
ALTER TABLE documents DISABLE TRIGGER trigger_update_document_search_vector;
ALTER TABLE documents DISABLE TRIGGER trigger_update_document_fulltext;
ALTER TABLE documents DISABLE TRIGGER trigger_document_audit;

-- Documents (20 records)
-- CHECK constraint: vehicle_id OR driver_id OR work_order_id must be NOT NULL
INSERT INTO documents (id, tenant_id, name, description, type, category, file_url, file_size, mime_type, version, vehicle_id, driver_id, work_order_id, uploaded_by, tags, status, created_at, updated_at)
VALUES
  ('73000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012',
   'Vehicle Registration - Unit 0001', 'Florida vehicle registration for fleet unit 0001',
   'compliance', 'Vehicle Registration', '/documents/registrations/unit-0001-registration.pdf',
   245000, 'application/pdf', '2025', '40000000-0000-0000-0000-000000000001', NULL, NULL,
   '00000000-0000-0000-0000-000000000002', '["registration", "compliance", "florida"]', 'active',
   NOW() - INTERVAL '180 days', NOW() - INTERVAL '180 days'),

  ('73000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012',
   'Vehicle Registration - Unit 0005', 'Florida vehicle registration for fleet unit 0005',
   'compliance', 'Vehicle Registration', '/documents/registrations/unit-0005-registration.pdf',
   248000, 'application/pdf', '2025', '40000000-0000-0000-0000-000000000005', NULL, NULL,
   '00000000-0000-0000-0000-000000000002', '["registration", "compliance"]', 'active',
   NOW() - INTERVAL '175 days', NOW() - INTERVAL '175 days'),

  ('73000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012',
   'Fleet Insurance Certificate 2025', 'Annual fleet liability insurance certificate',
   'certification', 'Insurance', '/documents/insurance/fleet-insurance-cert-2025.pdf',
   512000, 'application/pdf', '2025', '40000000-0000-0000-0000-000000000001', NULL, NULL,
   '00000000-0000-0000-0000-000000000002', '["insurance", "liability"]', 'active',
   NOW() - INTERVAL '160 days', NOW() - INTERVAL '160 days'),

  ('73000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012',
   'CDL Copy - James Brown', 'Commercial Drivers License copy for driver qualification file',
   'certification', 'Driver License', '/documents/drivers/cdl-james-brown.pdf',
   185000, 'application/pdf', '1.0', NULL, '30000000-0000-0000-0000-000000000001', NULL,
   '00000000-0000-0000-0000-000000000003', '["cdl", "license"]', 'active',
   NOW() - INTERVAL '150 days', NOW() - INTERVAL '150 days'),

  ('73000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012',
   'CDL Copy - Maria Rodriguez', 'Commercial Drivers License copy',
   'certification', 'Driver License', '/documents/drivers/cdl-maria-rodriguez.pdf',
   192000, 'application/pdf', '1.0', NULL, '30000000-0000-0000-0000-000000000002', NULL,
   '00000000-0000-0000-0000-000000000003', '["cdl", "license"]', 'active',
   NOW() - INTERVAL '148 days', NOW() - INTERVAL '148 days'),

  ('73000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012',
   'DOT Medical Certificate - James Brown', 'DOT physical examination medical certificate',
   'certification', 'Medical Certificate', '/documents/drivers/dot-medical-james-brown.pdf',
   98000, 'application/pdf', '2025', NULL, '30000000-0000-0000-0000-000000000001', NULL,
   '00000000-0000-0000-0000-000000000003', '["dot", "medical"]', 'active',
   NOW() - INTERVAL '140 days', NOW() - INTERVAL '140 days'),

  ('73000000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012',
   'DOT Medical Certificate - William Jones', 'DOT physical examination medical certificate',
   'certification', 'Medical Certificate', '/documents/drivers/dot-medical-william-jones.pdf',
   95000, 'application/pdf', '2025', NULL, '30000000-0000-0000-0000-000000000003', NULL,
   '00000000-0000-0000-0000-000000000003', '["dot", "medical"]', 'active',
   NOW() - INTERVAL '135 days', NOW() - INTERVAL '135 days'),

  ('73000000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012',
   'Defensive Driving Certificate - James Brown', 'NSC Defensive Driving course completion certificate',
   'training', 'Training Certificate', '/documents/training/defensive-driving-cert-brown.pdf',
   156000, 'application/pdf', '1.0', NULL, '30000000-0000-0000-0000-000000000001', NULL,
   '00000000-0000-0000-0000-000000000006', '["training", "defensive_driving"]', 'active',
   NOW() - INTERVAL '82 days', NOW() - INTERVAL '82 days'),

  ('73000000-0000-0000-0000-000000000009', '12345678-1234-1234-1234-123456789012',
   'HAZMAT Certificate - Michael Anderson', 'DOT HAZMAT Awareness completion certificate',
   'training', 'Training Certificate', '/documents/training/hazmat-cert-anderson.pdf',
   142000, 'application/pdf', '1.0', NULL, '30000000-0000-0000-0000-000000000005', NULL,
   '00000000-0000-0000-0000-000000000006', '["training", "hazmat"]', 'active',
   NOW() - INTERVAL '53 days', NOW() - INTERVAL '53 days'),

  ('73000000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012',
   'Annual DOT Inspection - Unit 0008', 'DOT annual safety inspection report',
   'safety', 'Inspection Report', '/documents/inspections/dot-annual-unit-0008.pdf',
   320000, 'application/pdf', '2025', '40000000-0000-0000-0000-000000000008', NULL, NULL,
   '00000000-0000-0000-0000-000000000005', '["dot", "inspection"]', 'active',
   NOW() - INTERVAL '90 days', NOW() - INTERVAL '90 days'),

  ('73000000-0000-0000-0000-000000000011', '12345678-1234-1234-1234-123456789012',
   'Annual DOT Inspection - Unit 0015', 'DOT annual safety inspection report',
   'safety', 'Inspection Report', '/documents/inspections/dot-annual-unit-0015.pdf',
   315000, 'application/pdf', '2025', '40000000-0000-0000-0000-000000000015', NULL, NULL,
   '00000000-0000-0000-0000-000000000005', '["dot", "inspection"]', 'active',
   NOW() - INTERVAL '75 days', NOW() - INTERVAL '75 days'),

  ('73000000-0000-0000-0000-000000000012', '12345678-1234-1234-1234-123456789012',
   'Fleet Safety Policy Manual 2025', 'Complete fleet safety policy manual covering FMCSA requirements',
   'policy', 'Policy Manual', '/documents/policies/fleet-safety-manual-2025.pdf',
   2048000, 'application/pdf', '3.1', '40000000-0000-0000-0000-000000000001', NULL, NULL,
   '00000000-0000-0000-0000-000000000002', '["policy", "safety", "manual"]', 'active',
   NOW() - INTERVAL '200 days', NOW() - INTERVAL '30 days'),

  ('73000000-0000-0000-0000-000000000013', '12345678-1234-1234-1234-123456789012',
   'Drug & Alcohol Testing Policy', 'DOT 49 CFR Part 382 testing program document',
   'policy', 'Compliance Policy', '/documents/policies/drug-alcohol-policy.pdf',
   890000, 'application/pdf', '2.0', '40000000-0000-0000-0000-000000000001', NULL, NULL,
   '00000000-0000-0000-0000-000000000002', '["policy", "drug_testing"]', 'active',
   NOW() - INTERVAL '195 days', NOW() - INTERVAL '60 days'),

  ('73000000-0000-0000-0000-000000000014', '12345678-1234-1234-1234-123456789012',
   'Brake Repair Invoice - Unit 0012', 'Parts and labor invoice for brake system repair',
   'invoice', 'Maintenance Invoice', '/documents/invoices/brake-repair-unit-0012.pdf',
   178000, 'application/pdf', '1.0', '40000000-0000-0000-0000-000000000012', NULL, '02773d4d-cb12-4653-9adc-6f256c0ef257',
   '00000000-0000-0000-0000-000000000005', '["invoice", "brakes"]', 'active',
   NOW() - INTERVAL '40 days', NOW() - INTERVAL '40 days'),

  ('73000000-0000-0000-0000-000000000015', '12345678-1234-1234-1234-123456789012',
   'Tire Replacement Receipt - Unit 0023', 'Receipt for 4x Michelin XDN2 tires',
   'receipt', 'Maintenance Receipt', '/documents/receipts/tires-unit-0023.pdf',
   95000, 'application/pdf', '1.0', '40000000-0000-0000-0000-000000000023', NULL, '056b2d1a-07f6-4c7c-bc48-2e154bf41691',
   '00000000-0000-0000-0000-000000000005', '["receipt", "tires"]', 'active',
   NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days'),

  ('73000000-0000-0000-0000-000000000016', '12345678-1234-1234-1234-123456789012',
   'DVIR - Unit 0001 - Feb 10', 'Driver Vehicle Inspection Report',
   'form', 'DVIR', '/documents/dvir/dvir-unit-0001-20250210.pdf',
   125000, 'application/pdf', '1.0', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', NULL,
   '10000000-0000-0000-0000-000000000001', '["dvir", "inspection"]', 'active',
   NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

  ('73000000-0000-0000-0000-000000000017', '12345678-1234-1234-1234-123456789012',
   'DVIR - Unit 0005 - Feb 10', 'Driver Vehicle Inspection Report',
   'form', 'DVIR', '/documents/dvir/dvir-unit-0005-20250210.pdf',
   118000, 'application/pdf', '1.0', '40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', NULL,
   '10000000-0000-0000-0000-000000000005', '["dvir", "inspection"]', 'active',
   NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

  ('73000000-0000-0000-0000-000000000018', '12345678-1234-1234-1234-123456789012',
   'Accident Report - Unit 0018 - Feb 15', 'Incident documentation for parking lot collision',
   'report', 'Accident Report', '/documents/incidents/accident-unit-0018-20250215.pdf',
   445000, 'application/pdf', '1.0', '40000000-0000-0000-0000-000000000018', '30000000-0000-0000-0000-000000000006', NULL,
   '00000000-0000-0000-0000-000000000006', '["accident", "incident"]', 'active',
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

  ('73000000-0000-0000-0000-000000000019', '12345678-1234-1234-1234-123456789012',
   'Q4 2024 Compliance Audit Report', 'Quarterly compliance audit findings and corrective actions',
   'report', 'Audit Report', '/documents/audits/q4-2024-compliance-audit.pdf',
   780000, 'application/pdf', '1.0', '40000000-0000-0000-0000-000000000001', NULL, NULL,
   '00000000-0000-0000-0000-000000000002', '["audit", "compliance"]', 'active',
   NOW() - INTERVAL '45 days', NOW() - INTERVAL '45 days'),

  ('73000000-0000-0000-0000-000000000020', '12345678-1234-1234-1234-123456789012',
   'Freightliner M2 106 Operators Manual', 'Vehicle operators manual for Freightliner M2 106',
   'manual', 'Vehicle Manual', '/documents/manuals/freightliner-m2-106-manual.pdf',
   4500000, 'application/pdf', '2024', '40000000-0000-0000-0000-000000000001', NULL, NULL,
   '00000000-0000-0000-0000-000000000001', '["manual", "freightliner"]', 'active',
   NOW() - INTERVAL '365 days', NOW() - INTERVAL '365 days')
ON CONFLICT (id) DO NOTHING;

-- Re-enable triggers
ALTER TABLE documents ENABLE TRIGGER documents_search_vector_trigger;
ALTER TABLE documents ENABLE TRIGGER trigger_update_document_search_vector;
ALTER TABLE documents ENABLE TRIGGER trigger_update_document_fulltext;
ALTER TABLE documents ENABLE TRIGGER trigger_document_audit;

COMMIT;

-- ============================================================================
-- PART 5: Compliance Records, Damage Reports, Trips
-- ============================================================================
BEGIN;
SET app.current_tenant_id = '12345678-1234-1234-1234-123456789012';

-- Additional Compliance Records (15 records)
INSERT INTO compliance_records (id, tenant_id, requirement_id, vehicle_id, driver_id, due_date, completion_date, completed_by, status, compliance_percentage, notes, next_due_date, created_at)
VALUES
  ('73100000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012',
   'c0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', NULL,
   CURRENT_DATE - 150, CURRENT_DATE - 155, '00000000-0000-0000-0000-000000000005',
   'compliant', 100, 'Annual inspection passed. All systems within spec.', CURRENT_DATE + 215, NOW() - INTERVAL '155 days'),

  ('73100000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012',
   'c0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000005', NULL,
   CURRENT_DATE - 120, CURRENT_DATE - 125, '00000000-0000-0000-0000-000000000005',
   'compliant', 100, 'Passed. Recommend tire replacement within 10K miles.', CURRENT_DATE + 245, NOW() - INTERVAL '125 days'),

  ('73100000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012',
   'c0000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000008', NULL,
   CURRENT_DATE - 90, CURRENT_DATE - 92, '00000000-0000-0000-0000-000000000007',
   'compliant', 100, 'All items satisfactory.', CURRENT_DATE + 275, NOW() - INTERVAL '92 days'),

  ('73100000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012',
   'c0000000-0000-0000-0000-000000000003', NULL, '30000000-0000-0000-0000-000000000001',
   CURRENT_DATE - 60, CURRENT_DATE - 65, '00000000-0000-0000-0000-000000000003',
   'compliant', 100, 'CDL renewed. New expiration: 2029.', CURRENT_DATE + 1400, NOW() - INTERVAL '65 days'),

  ('73100000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012',
   'c0000000-0000-0000-0000-000000000003', NULL, '30000000-0000-0000-0000-000000000003',
   CURRENT_DATE + 30, NULL, NULL,
   'pending', 0, 'CDL expires in 30 days. Renewal appointment scheduled.', NULL, NOW() - INTERVAL '5 days'),

  ('73100000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012',
   'c0000000-0000-0000-0000-000000000004', NULL, '30000000-0000-0000-0000-000000000002',
   CURRENT_DATE - 30, CURRENT_DATE - 30, '00000000-0000-0000-0000-000000000003',
   'compliant', 100, 'Random drug test - negative result.', CURRENT_DATE + 335, NOW() - INTERVAL '30 days'),

  ('73100000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012',
   'c0000000-0000-0000-0000-000000000004', NULL, '30000000-0000-0000-0000-000000000009',
   CURRENT_DATE - 20, NULL, NULL,
   'non_compliant', 0, 'Missed scheduled random test. Under investigation.', NULL, NOW() - INTERVAL '20 days'),

  ('73100000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012',
   'c0000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000012', NULL,
   CURRENT_DATE - 45, CURRENT_DATE - 50, '00000000-0000-0000-0000-000000000002',
   'compliant', 100, 'Registration renewed through Dec 2025.', CURRENT_DATE + 320, NOW() - INTERVAL '50 days'),

  ('73100000-0000-0000-0000-000000000009', '12345678-1234-1234-1234-123456789012',
   'c0000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000020', NULL,
   CURRENT_DATE + 15, NULL, NULL,
   'pending', 0, 'Registration expires in 15 days.', NULL, NOW() - INTERVAL '3 days'),

  ('73100000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012',
   'c0000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000001', NULL,
   CURRENT_DATE - 30, CURRENT_DATE - 32, '00000000-0000-0000-0000-000000000005',
   'compliant', 100, 'All safety equipment inspected and certified.', CURRENT_DATE + 335, NOW() - INTERVAL '32 days'),

  ('73100000-0000-0000-0000-000000000011', '12345678-1234-1234-1234-123456789012',
   'c0000000-0000-0000-0000-000000000007', NULL, '30000000-0000-0000-0000-000000000001',
   CURRENT_DATE - 140, CURRENT_DATE - 142, '00000000-0000-0000-0000-000000000003',
   'compliant', 100, 'DOT physical passed. Valid for 2 years.', CURRENT_DATE + 590, NOW() - INTERVAL '142 days'),

  ('73100000-0000-0000-0000-000000000012', '12345678-1234-1234-1234-123456789012',
   'c0000000-0000-0000-0000-000000000007', NULL, '30000000-0000-0000-0000-000000000005',
   CURRENT_DATE - 100, CURRENT_DATE - 105, '00000000-0000-0000-0000-000000000003',
   'compliant', 100, 'DOT physical passed with vision correction noted.', CURRENT_DATE + 625, NOW() - INTERVAL '105 days'),

  ('73100000-0000-0000-0000-000000000013', '12345678-1234-1234-1234-123456789012',
   'c0000000-0000-0000-0000-000000000007', NULL, '30000000-0000-0000-0000-000000000008',
   CURRENT_DATE + 28, NULL, NULL,
   'pending', 0, 'DOT medical certificate expiring. Physical scheduled.', NULL, NOW() - INTERVAL '14 days'),

  ('73100000-0000-0000-0000-000000000014', '12345678-1234-1234-1234-123456789012',
   'c0000000-0000-0000-0000-000000000008', NULL, '30000000-0000-0000-0000-000000000001',
   CURRENT_DATE - 80, CURRENT_DATE - 82, '00000000-0000-0000-0000-000000000006',
   'compliant', 100, 'Annual safety training completed. Score: 94%.', CURRENT_DATE + 285, NOW() - INTERVAL '82 days'),

  ('73100000-0000-0000-0000-000000000015', '12345678-1234-1234-1234-123456789012',
   'c0000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000035', NULL,
   CURRENT_DATE - 10, NULL, NULL,
   'overdue', 0, 'Emissions testing overdue. Vehicle restricted to yard operations.', NULL, NOW() - INTERVAL '10 days')
ON CONFLICT (id) DO NOTHING;

-- Damage Reports (8 records)
INSERT INTO damage_reports (id, tenant_id, report_number, vehicle_id, reported_by, driver_id, report_date, incident_date, location, damage_summary, damage_count, damage_records, photos, status, estimated_total_cost, created_at)
VALUES
  ('73200000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012',
   'DMG-2025-001', '40000000-0000-0000-0000-000000000018',
   '00000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006',
   NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days',
   'Highway 301 & Oak Street', 'Minor rear bumper damage from low-speed parking lot collision.',
   2, '[{"area": "Rear Bumper", "type": "Crack", "severity": "Minor"}, {"area": "Right Taillight", "type": "Housing Damage", "severity": "Minor"}]',
   '[{"url": "/photos/damage/dmg-2025-001-rear.jpg"}, {"url": "/photos/damage/dmg-2025-001-taillight.jpg"}]',
   'under_review', 850.00, NOW() - INTERVAL '5 days'),

  ('73200000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012',
   'DMG-2025-002', '40000000-0000-0000-0000-000000000023',
   '00000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000007',
   NOW() - INTERVAL '25 days', NOW() - INTERVAL '26 days',
   'Distribution Center - Loading Dock B', 'Side panel scrape from loading dock bollard during backing.',
   1, '[{"area": "Right Side Panel", "type": "Scrape/Dent", "severity": "Moderate"}]',
   '[{"url": "/photos/damage/dmg-2025-002-side.jpg"}]',
   'resolved', 1200.00, NOW() - INTERVAL '25 days'),

  ('73200000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012',
   'DMG-2025-003', '40000000-0000-0000-0000-000000000042',
   '00000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000012',
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days',
   'Satellite Facility North', 'Flat tire and cracked windshield discovered during pre-trip.',
   2, '[{"area": "Front Left Tire", "type": "Flat", "severity": "Moderate"}, {"area": "Windshield", "type": "Crack", "severity": "Serious"}]',
   '[{"url": "/photos/damage/dmg-2025-003-tire.jpg"}, {"url": "/photos/damage/dmg-2025-003-windshield.jpg"}]',
   'open', 2100.00, NOW() - INTERVAL '2 days'),

  ('73200000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012',
   'DMG-2025-004', '40000000-0000-0000-0000-000000000008',
   '00000000-0000-0000-0000-000000000005', NULL,
   NOW() - INTERVAL '45 days', NOW() - INTERVAL '46 days',
   'Main Facility - Maintenance Bay 2', 'Hood latch failure caused hood to fly open at low speed.',
   2, '[{"area": "Hood", "type": "Bent", "severity": "Serious"}, {"area": "Wiper Arms", "type": "Broken", "severity": "Minor"}]',
   '[{"url": "/photos/damage/dmg-2025-004-hood.jpg"}]',
   'resolved', 3500.00, NOW() - INTERVAL '45 days'),

  ('73200000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012',
   'DMG-2025-005', '40000000-0000-0000-0000-000000000015',
   '00000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000003',
   NOW() - INTERVAL '60 days', NOW() - INTERVAL '61 days',
   'I-95 Northbound - Mile Marker 98', 'Road debris damaged undercarriage and fuel tank skid plate.',
   2, '[{"area": "Undercarriage", "type": "Impact", "severity": "Serious"}, {"area": "Fuel Tank Skid Plate", "type": "Puncture", "severity": "Moderate"}]',
   '[{"url": "/photos/damage/dmg-2025-005-under.jpg"}]',
   'resolved', 4200.00, NOW() - INTERVAL '60 days'),

  ('73200000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012',
   'DMG-2025-006', '40000000-0000-0000-0000-000000000020',
   '00000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000005',
   NOW() - INTERVAL '35 days', NOW() - INTERVAL '35 days',
   '2847 Commerce Drive', 'Mirror strike from overhanging tree branch at customer site.',
   1, '[{"area": "Driver Side Mirror", "type": "Broken", "severity": "Minor"}]',
   '[{"url": "/photos/damage/dmg-2025-006-mirror.jpg"}]',
   'resolved', 350.00, NOW() - INTERVAL '35 days'),

  ('73200000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012',
   'DMG-2025-007', '40000000-0000-0000-0000-000000000032',
   '00000000-0000-0000-0000-000000000005', NULL,
   NOW() - INTERVAL '15 days', NOW() - INTERVAL '16 days',
   'Main Facility - Maintenance Bay 3', 'Coolant leak from radiator hose clamp failure during PM service.',
   1, '[{"area": "Engine Bay", "type": "Coolant Damage", "severity": "Moderate"}]',
   '[{"url": "/photos/damage/dmg-2025-007-coolant.jpg"}]',
   'under_review', 950.00, NOW() - INTERVAL '15 days'),

  ('73200000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012',
   'DMG-2025-008', '40000000-0000-0000-0000-000000000035',
   '00000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000010',
   NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days',
   'Warehouse Loading Dock B', 'Forklift scraped cargo box exterior while loading pallets.',
   1, '[{"area": "Cargo Box Right Side", "type": "Scrape", "severity": "Minor"}]',
   '[{"url": "/photos/damage/dmg-2025-008-cargo.jpg"}]',
   'open', 600.00, NOW() - INTERVAL '8 days')
ON CONFLICT (id) DO NOTHING;

-- Trips (12 records)
-- IMPORTANT: trips.driver_id references users table (NOT drivers table!)
INSERT INTO trips (id, tenant_id, vehicle_id, driver_id, status, start_time, end_time, duration_seconds, start_location, end_location, start_odometer_miles, end_odometer_miles, distance_miles, avg_speed_mph, max_speed_mph, idle_time_seconds, fuel_consumed_gallons, fuel_efficiency_mpg, driver_score, harsh_acceleration_count, harsh_braking_count, harsh_cornering_count, speeding_count, usage_type, business_purpose, created_at)
VALUES
  ('73300000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012',
   '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'completed', NOW() - INTERVAL '2 days 8 hours', NOW() - INTERVAL '2 days',
   28800, '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}', '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}',
   45230.5, 45392.8, 162.3, 42.5, 68.0, 3200, 22.5, 7.2,
   88, 1, 0, 1, 0, 'business', 'Multi-stop delivery - Downtown Orlando', NOW() - INTERVAL '2 days'),

  ('73300000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012',
   '40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002',
   'completed', NOW() - INTERVAL '2 days 10 hours', NOW() - INTERVAL '2 days 1 hour',
   32400, '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}', '{"lat": 28.0395, "lng": -81.9498, "address": "Lakeland DC"}',
   67890.2, 68145.7, 255.5, 48.2, 72.0, 4100, 35.5, 7.2,
   92, 0, 1, 0, 1, 'business', 'Long haul delivery to Lakeland', NOW() - INTERVAL '2 days'),

  ('73300000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012',
   '40000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003',
   'completed', NOW() - INTERVAL '1 day 6 hours', NOW() - INTERVAL '1 day',
   21600, '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}', '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}',
   82340.1, 82458.9, 118.8, 35.8, 55.0, 5400, 18.2, 6.5,
   85, 2, 1, 0, 0, 'business', 'Local delivery - East Orlando', NOW() - INTERVAL '1 day'),

  ('73300000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012',
   '40000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000004',
   'completed', NOW() - INTERVAL '1 day 9 hours', NOW() - INTERVAL '1 day 30 minutes',
   30600, '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}', '{"lat": 27.9506, "lng": -82.4572, "address": "Tampa Hub"}',
   34567.8, 34855.2, 287.4, 52.1, 75.0, 2800, 39.9, 7.2,
   90, 0, 0, 1, 2, 'business', 'Inter-city freight to Tampa', NOW() - INTERVAL '1 day'),

  ('73300000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012',
   '40000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000005',
   'completed', NOW() - INTERVAL '3 days 7 hours', NOW() - INTERVAL '3 days',
   25200, '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}', '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}',
   56789.0, 56932.5, 143.5, 38.9, 62.0, 4800, 20.8, 6.9,
   82, 3, 2, 1, 1, 'business', 'Suburban delivery - Kissimmee', NOW() - INTERVAL '3 days'),

  ('73300000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012',
   '40000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000006',
   'completed', NOW() - INTERVAL '3 days 11 hours', NOW() - INTERVAL '3 days 2 hours',
   32400, '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}', '{"lat": 30.3322, "lng": -81.6557, "address": "Jacksonville Depot"}',
   23456.3, 23795.8, 339.5, 55.8, 78.0, 3600, 48.5, 7.0,
   91, 0, 0, 0, 3, 'business', 'Long haul to Jacksonville', NOW() - INTERVAL '3 days'),

  ('73300000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012',
   '40000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000007',
   'completed', NOW() - INTERVAL '4 days 5 hours', NOW() - INTERVAL '4 days',
   18000, '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}', '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}',
   91234.6, 91322.1, 87.5, 32.5, 50.0, 3000, 14.2, 6.2,
   86, 1, 1, 2, 0, 'business', 'Local pickup - Winter Park', NOW() - INTERVAL '4 days'),

  ('73300000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012',
   '40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
   'completed', NOW() - INTERVAL '5 days 9 hours', NOW() - INTERVAL '5 days 1 hour',
   28800, '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}', '{"lat": 26.1224, "lng": -80.1373, "address": "Fort Lauderdale"}',
   45068.2, 45230.5, 162.3, 44.8, 70.0, 3800, 22.8, 7.1,
   89, 1, 0, 0, 1, 'business', 'South Florida freight', NOW() - INTERVAL '5 days'),

  ('73300000-0000-0000-0000-000000000009', '12345678-1234-1234-1234-123456789012',
   '40000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000003',
   'in_progress', NOW() - INTERVAL '3 hours', NULL,
   NULL, '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}', NULL,
   82458.9, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
   NULL, 0, 0, 0, 0, 'business', 'Morning delivery - Sanford area', NOW()),

  ('73300000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012',
   '40000000-0000-0000-0000-000000000035', '10000000-0000-0000-0000-000000000005',
   'completed', NOW() - INTERVAL '6 days 8 hours', NOW() - INTERVAL '6 days 30 minutes',
   27000, '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}', '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}',
   56600.5, 56789.0, 188.5, 45.2, 65.0, 4200, 27.0, 7.0,
   87, 1, 1, 0, 0, 'business', 'Multi-stop - Daytona Beach', NOW() - INTERVAL '6 days'),

  ('73300000-0000-0000-0000-000000000011', '12345678-1234-1234-1234-123456789012',
   '40000000-0000-0000-0000-000000000042', '10000000-0000-0000-0000-000000000004',
   'completed', NOW() - INTERVAL '7 days 6 hours', NOW() - INTERVAL '7 days',
   21600, '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}', '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}',
   12340.8, 12445.3, 104.5, 36.2, 58.0, 3500, 16.1, 6.5,
   84, 2, 2, 1, 0, 'business', 'Local delivery - Altamonte', NOW() - INTERVAL '7 days'),

  ('73300000-0000-0000-0000-000000000012', '12345678-1234-1234-1234-123456789012',
   '40000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002',
   'completed', NOW() - INTERVAL '4 days 10 hours', NOW() - INTERVAL '4 days 1 hour',
   32400, '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}', '{"lat": 28.5383, "lng": -81.3792, "address": "Main Facility"}',
   67634.7, 67890.2, 255.5, 49.1, 73.0, 3900, 36.5, 7.0,
   93, 0, 0, 0, 1, 'business', 'Round trip freight - Lakeland', NOW() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- ============================================================================
-- Verify counts
-- ============================================================================
SET app.current_tenant_id = '12345678-1234-1234-1234-123456789012';
SELECT 'training_courses' as table_name, count(*) as row_count FROM training_courses
UNION ALL SELECT 'training_progress', count(*) FROM training_progress
UNION ALL SELECT 'training_records', count(*) FROM training_records
UNION ALL SELECT 'policy_acknowledgments', count(*) FROM policy_acknowledgments
UNION ALL SELECT 'policy_violations', count(*) FROM policy_violations
UNION ALL SELECT 'policy_compliance_audits', count(*) FROM policy_compliance_audits
UNION ALL SELECT 'policy_executions', count(*) FROM policy_executions
UNION ALL SELECT 'osha_logs', count(*) FROM osha_logs
UNION ALL SELECT 'communication_logs', count(*) FROM communication_logs
UNION ALL SELECT 'documents', count(*) FROM documents
UNION ALL SELECT 'compliance_records', count(*) FROM compliance_records
UNION ALL SELECT 'damage_reports', count(*) FROM damage_reports
UNION ALL SELECT 'trips', count(*) FROM trips
ORDER BY table_name;
