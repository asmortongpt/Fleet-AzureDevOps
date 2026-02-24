-- ============================================================================
-- Operational Fleet Data — Supplemental Seed
-- Populates truly empty tables that power key UI features
-- Target: Dev tenant 12345678-1234-1234-1234-123456789012
-- Idempotent: ON CONFLICT (id) DO NOTHING on all inserts
-- ============================================================================

BEGIN;

SET app.current_tenant_id = '12345678-1234-1234-1234-123456789012';

-- ============================================================================
-- 1. VEHICLE ASSIGNMENTS (driver ↔ vehicle pairings)
-- Powers: Fleet Hub vehicle details, driver assignment views
-- ============================================================================

INSERT INTO vehicle_assignments (id, vehicle_id, driver_id, assignment_start, is_active, assignment_type, odometer_start, notes, assigned_by, tenant_id, status, is_primary_assignment)
VALUES
('80000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2025-06-01 08:00:00+00', true,  'primary', 45230, 'Primary fleet assignment', '00000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'active', true),
('80000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '2025-06-01 08:00:00+00', true,  'primary', 38100, 'Primary fleet assignment', '00000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'active', true),
('80000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '2025-06-01 08:00:00+00', true,  'primary', 52400, 'Primary fleet assignment', '00000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'active', true),
('80000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', '2025-06-01 08:00:00+00', true,  'primary', 61800, 'Primary fleet assignment', '00000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'active', true),
('80000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', '2025-06-01 08:00:00+00', true,  'primary', 29500, 'Primary fleet assignment', '00000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'active', true),
('80000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', '2025-06-01 08:00:00+00', true,  'primary', 73200, 'Primary fleet assignment', '00000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'active', true),
('80000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000007', '2025-06-01 08:00:00+00', true,  'primary', 41300, 'Primary fleet assignment', '00000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'active', true),
('80000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000008', '2025-06-01 08:00:00+00', true,  'primary', 55700, 'Primary fleet assignment', '00000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'active', true),
('80000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000009', '2025-07-15 08:00:00+00', true,  'primary', 18200, 'New hire vehicle assignment', '00000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'active', true),
('80000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000010', '2025-07-15 08:00:00+00', true,  'primary', 22400, 'New hire vehicle assignment', '00000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'active', true),
-- Previous assignments (historical)
('80000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000011', '2025-01-01 08:00:00+00', false, 'primary', 38200, 'Reassigned to driver 3', '00000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'completed', true),
('80000000-0000-0000-0000-000000000012', '40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000012', '2025-02-01 08:00:00+00', false, 'temporary', 24100, 'Temporary assignment during maintenance', '00000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'completed', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. DRIVER SCORECARDS (monthly performance snapshots)
-- Powers: Driver Scorecard page, Driver Performance leaderboard
-- ============================================================================

INSERT INTO driver_scorecards (id, tenant_id, driver_id, period_start, period_end, incidents_count, violations_count, safety_score, total_miles, harsh_braking_count, harsh_acceleration_count, speeding_violations, idling_hours, fuel_consumption_gallons, mpg_average, inspections_completed, training_completed, overall_score, rank, metadata)
VALUES
-- January 2026
('81000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000001', '2026-01-01', '2026-01-31', 0, 0, 96.5, 3240, 2, 1, 0, 4.2, 405.0, 8.0, 4, true, 95.8, 1, '{"badge": "Gold Star", "trend": "improving"}'),
('81000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000002', '2026-01-01', '2026-01-31', 0, 1, 91.2, 2890, 5, 3, 1, 6.1, 361.3, 8.0, 4, true, 90.5, 2, '{"badge": "Silver", "trend": "stable"}'),
('81000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000003', '2026-01-01', '2026-01-31', 1, 0, 88.7, 3100, 4, 2, 0, 5.5, 387.5, 8.0, 3, true, 87.9, 3, '{"badge": "Silver", "trend": "improving"}'),
('81000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000004', '2026-01-01', '2026-01-31', 0, 2, 84.3, 2650, 8, 5, 2, 7.3, 378.6, 7.0, 4, false, 82.1, 4, '{"badge": "Bronze", "trend": "declining"}'),
('81000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000005', '2026-01-01', '2026-01-31', 0, 0, 93.1, 3400, 3, 1, 0, 3.8, 425.0, 8.0, 4, true, 92.6, 5, '{"badge": "Gold Star", "trend": "stable"}'),
('81000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000006', '2026-01-01', '2026-01-31', 1, 1, 79.5, 2450, 12, 7, 3, 9.1, 350.0, 7.0, 3, false, 77.8, 6, '{"badge": "Needs Improvement", "trend": "declining"}'),
('81000000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000007', '2026-01-01', '2026-01-31', 0, 0, 94.8, 3050, 1, 2, 0, 4.0, 381.3, 8.0, 4, true, 94.2, 7, '{"badge": "Gold Star", "trend": "improving"}'),
('81000000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000008', '2026-01-01', '2026-01-31', 0, 1, 86.9, 2780, 6, 4, 1, 5.8, 397.1, 7.0, 4, true, 85.7, 8, '{"badge": "Silver", "trend": "stable"}'),
-- February 2026
('81000000-0000-0000-0000-000000000009', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000001', '2026-02-01', '2026-02-28', 0, 0, 97.2, 3100, 1, 0, 0, 3.5, 387.5, 8.0, 4, true, 96.8, 1, '{"badge": "Gold Star", "trend": "improving"}'),
('81000000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000002', '2026-02-01', '2026-02-28', 0, 0, 93.5, 2750, 3, 2, 0, 5.0, 343.8, 8.0, 4, true, 92.8, 2, '{"badge": "Gold Star", "trend": "improving"}'),
('81000000-0000-0000-0000-000000000011', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000003', '2026-02-01', '2026-02-28', 0, 0, 91.4, 2900, 3, 1, 0, 4.8, 362.5, 8.0, 4, true, 90.8, 3, '{"badge": "Silver", "trend": "improving"}'),
('81000000-0000-0000-0000-000000000012', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000004', '2026-02-01', '2026-02-28', 1, 1, 82.1, 2500, 9, 6, 2, 8.0, 357.1, 7.0, 3, false, 80.5, 4, '{"badge": "Needs Improvement", "trend": "declining"}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. DRIVER SCORES HISTORY (daily score snapshots for trending charts)
-- Powers: Driver Scorecard trend graphs, performance over time
-- FK: driver_id → users.id (not drivers.id!)
-- ============================================================================

INSERT INTO driver_scores_history (id, tenant_id, driver_id, date, overall_score, smooth_driving_score, speed_compliance_score, fuel_efficiency_score, safety_score, trips_count, miles_driven, harsh_events_count, speeding_events_count, rank_in_fleet, percentile)
VALUES
-- Driver 1 (user 00000000-...0002 = Sarah Johnson) - weekly snapshots
('81100000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', '00000000-0000-0000-0000-000000000002', '2026-02-01', 92, 95, 90, 88, 94, 12, 480, 2, 0, 1, 95),
('81100000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', '00000000-0000-0000-0000-000000000002', '2026-02-08', 93, 96, 91, 89, 95, 14, 520, 1, 0, 1, 96),
('81100000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', '00000000-0000-0000-0000-000000000002', '2026-02-15', 94, 96, 92, 90, 96, 13, 490, 1, 0, 1, 97),
-- Driver 2 (user 00000000-...0003 = Marcus Williams) - weekly snapshots
('81100000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', '00000000-0000-0000-0000-000000000003', '2026-02-01', 85, 82, 88, 84, 86, 11, 420, 5, 1, 3, 78),
('81100000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', '00000000-0000-0000-0000-000000000003', '2026-02-08', 86, 84, 88, 85, 87, 12, 450, 4, 1, 3, 80),
('81100000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', '00000000-0000-0000-0000-000000000003', '2026-02-15', 87, 86, 89, 85, 88, 13, 470, 3, 0, 2, 82),
-- Driver 3 (user 00000000-...0004 = Lisa Chen) - weekly snapshots
('81100000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', '00000000-0000-0000-0000-000000000004', '2026-02-01', 88, 90, 86, 87, 89, 10, 380, 3, 1, 2, 85),
('81100000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', '00000000-0000-0000-0000-000000000004', '2026-02-08', 89, 91, 87, 88, 90, 11, 410, 2, 0, 2, 87),
('81100000-0000-0000-0000-000000000009', '12345678-1234-1234-1234-123456789012', '00000000-0000-0000-0000-000000000004', '2026-02-15', 90, 92, 88, 89, 91, 12, 440, 2, 0, 2, 89),
-- Driver 4 (user 00000000-...0005 = Robert Garcia) - declining trend
('81100000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012', '00000000-0000-0000-0000-000000000005', '2026-02-01', 80, 78, 82, 79, 81, 9, 340, 7, 2, 5, 65),
('81100000-0000-0000-0000-000000000011', '12345678-1234-1234-1234-123456789012', '00000000-0000-0000-0000-000000000005', '2026-02-08', 78, 76, 80, 77, 79, 10, 360, 9, 3, 6, 60),
('81100000-0000-0000-0000-000000000012', '12345678-1234-1234-1234-123456789012', '00000000-0000-0000-0000-000000000005', '2026-02-15', 76, 74, 78, 76, 77, 8, 310, 10, 3, 7, 55)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. CERTIFICATIONS (driver licenses, endorsements, medical cards)
-- Powers: Compliance dashboard, driver detail panels
-- ============================================================================

INSERT INTO certifications (id, tenant_id, driver_id, type, number, issuing_authority, issued_date, expiry_date, status, notes, metadata, created_at, updated_at)
VALUES
('82000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000001', 'CDL-A', 'CDL-A-2024-001', 'Maryland MVA', '2024-06-15', '2028-06-15', 'active', 'Class A CDL with hazmat endorsement', '{"endorsements": ["H", "T", "N"], "restrictions": []}', NOW(), NOW()),
('82000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000001', 'DOT Medical', 'MC-2025-4421', 'DOT FMCSA', '2025-08-01', '2027-08-01', 'active', 'Biennial DOT physical exam passed', '{"examiner": "Dr. Smith", "clinic": "Fleet Health Services"}', NOW(), NOW()),
('82000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000002', 'CDL-A', 'CDL-A-2023-102', 'Virginia DMV', '2023-03-20', '2027-03-20', 'active', 'Class A CDL with tanker endorsement', '{"endorsements": ["T", "N"], "restrictions": []}', NOW(), NOW()),
('82000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000002', 'DOT Medical', 'MC-2025-4422', 'DOT FMCSA', '2025-09-15', '2027-09-15', 'active', 'Biennial DOT physical — glasses required', '{"examiner": "Dr. Johnson", "clinic": "Commercial Driver Health"}', NOW(), NOW()),
('82000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000003', 'CDL-B', 'CDL-B-2024-203', 'Maryland MVA', '2024-01-10', '2028-01-10', 'active', 'Class B CDL', '{"endorsements": ["P", "S"], "restrictions": []}', NOW(), NOW()),
('82000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000004', 'CDL-A', 'CDL-A-2022-304', 'DC DMV', '2022-11-05', '2026-11-05', 'active', 'Class A CDL — renewal due soon', '{"endorsements": ["H", "T"], "restrictions": []}', NOW(), NOW()),
('82000000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000004', 'DOT Medical', 'MC-2024-3310', 'DOT FMCSA', '2024-12-01', '2026-12-01', 'active', 'DOT physical — expiring soon', '{"examiner": "Dr. Patel", "clinic": "MedExpress"}', NOW(), NOW()),
('82000000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000005', 'Hazmat', 'HM-2025-501', 'TSA/FMCSA', '2025-04-01', '2030-04-01', 'active', 'Hazardous Materials endorsement with TSA background check', '{"tsa_clearance": true, "background_check_date": "2025-03-15"}', NOW(), NOW()),
('82000000-0000-0000-0000-000000000009', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000006', 'CDL-A', 'CDL-A-2021-605', 'Pennsylvania DOT', '2021-07-20', '2025-07-20', 'expired', 'EXPIRED — renewal overdue', '{"endorsements": ["T"], "restrictions": ["L"]}', NOW(), NOW()),
('82000000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000007', 'CDL-A', 'CDL-A-2024-707', 'Maryland MVA', '2024-09-01', '2028-09-01', 'active', 'Class A CDL', '{"endorsements": ["H", "T", "N", "P"], "restrictions": []}', NOW(), NOW()),
('82000000-0000-0000-0000-000000000011', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000008', 'DOT Medical', 'MC-2025-8801', 'DOT FMCSA', '2025-03-01', '2026-03-01', 'active', 'DOT physical — expires next month', '{"examiner": "Dr. Lee", "clinic": "Concentra"}', NOW(), NOW()),
('82000000-0000-0000-0000-000000000012', '12345678-1234-1234-1234-123456789012', '30000000-0000-0000-0000-000000000008', 'TWIC', 'TWIC-2025-880', 'TSA', '2025-01-15', '2030-01-15', 'active', 'Transportation Worker ID Credential for port access', '{"port_access": true}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. DRIVER HOS LOGS (Hours of Service daily log entries)
-- Powers: HOS compliance views, driver detail panels
-- ============================================================================

INSERT INTO driver_hos_logs (id, driver_id, log_date, duty_status, start_time, end_time, duration_minutes, latitude, longitude, address, odometer_miles, has_violations, violations, tenant_id)
VALUES
-- Driver 1 typical day
('83000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2026-02-20', 'off_duty',  '2026-02-20 00:00:00', '2026-02-20 06:00:00', 360, 39.2904, -76.6122, '1200 Fleet Way, Baltimore, MD', 45230, false, NULL, '12345678-1234-1234-1234-123456789012'),
('83000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '2026-02-20', 'on_duty',   '2026-02-20 06:00:00', '2026-02-20 06:30:00', 30,  39.2904, -76.6122, '1200 Fleet Way, Baltimore, MD', 45230, false, NULL, '12345678-1234-1234-1234-123456789012'),
('83000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', '2026-02-20', 'driving',   '2026-02-20 06:30:00', '2026-02-20 10:30:00', 240, 39.2904, -76.6122, 'I-95 NB Baltimore to Philadelphia', 45430, false, NULL, '12345678-1234-1234-1234-123456789012'),
('83000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', '2026-02-20', 'on_duty',   '2026-02-20 10:30:00', '2026-02-20 11:00:00', 30,  39.9526, -75.1652, 'Philadelphia Distribution Center', 45430, false, NULL, '12345678-1234-1234-1234-123456789012'),
('83000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000001', '2026-02-20', 'sleeper',   '2026-02-20 11:00:00', '2026-02-20 11:30:00', 30,  39.9526, -75.1652, 'Philadelphia Distribution Center', 45430, false, NULL, '12345678-1234-1234-1234-123456789012'),
('83000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000001', '2026-02-20', 'driving',   '2026-02-20 11:30:00', '2026-02-20 15:30:00', 240, 39.9526, -75.1652, 'I-95 SB Philadelphia to Baltimore', 45630, false, NULL, '12345678-1234-1234-1234-123456789012'),
('83000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000001', '2026-02-20', 'off_duty',  '2026-02-20 15:30:00', '2026-02-21 00:00:00', 510, 39.2904, -76.6122, '1200 Fleet Way, Baltimore, MD', 45630, false, NULL, '12345678-1234-1234-1234-123456789012'),
-- Driver 6 with HOS violation
('83000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000006', '2026-02-19', 'driving',   '2026-02-19 05:00:00', '2026-02-19 16:30:00', 690, 38.9072, -77.0369, 'I-66 WB DC to Front Royal, VA', 73400, true, '[{"type": "11_hour_driving", "description": "Exceeded 11-hour driving limit by 30 minutes"}]'::jsonb, '12345678-1234-1234-1234-123456789012'),
-- Driver 2 normal day
('83000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000002', '2026-02-20', 'driving',   '2026-02-20 07:00:00', '2026-02-20 12:00:00', 300, 39.2904, -76.6122, 'Baltimore to Richmond, VA', 38400, false, NULL, '12345678-1234-1234-1234-123456789012'),
('83000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000002', '2026-02-20', 'on_duty',   '2026-02-20 12:00:00', '2026-02-20 13:00:00', 60,  37.5407, -77.4360, 'Richmond Distribution Center', 38400, false, NULL, '12345678-1234-1234-1234-123456789012')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. VEHICLE HISTORY (maintenance events, title transfers, inspections)
-- Powers: Vehicle detail timeline, history view
-- ============================================================================

INSERT INTO vehicle_history (id, tenant_id, vehicle_id, event_type, event_date, title, description, driver_id, user_id, event_data, created_at)
VALUES
('84000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000001', 'acquisition', '2024-01-15 10:00:00', 'Vehicle Acquired', 'New 2024 Ford F-150 added to fleet. Purchase price $42,500.', NULL, '00000000-0000-0000-0000-000000000001', '{"purchase_price": 42500, "dealer": "AutoNation Ford", "vin": "1FTFW1E50NFA12345"}'::jsonb, NOW()),
('84000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000001', 'assignment', '2024-02-01 08:00:00', 'Driver Assigned', 'Vehicle assigned to primary driver for daily operations.', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"assignment_type": "primary"}'::jsonb, NOW()),
('84000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000001', 'maintenance', '2024-06-15 09:00:00', 'Oil Change & Tire Rotation', 'Scheduled maintenance at 15,000 miles. Synthetic oil change, tire rotation, multi-point inspection.', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"odometer": 15230, "cost": 185.50, "service_center": "Fleet Service Center"}'::jsonb, NOW()),
('84000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000001', 'inspection', '2024-09-01 08:30:00', 'Annual DOT Inspection', 'Passed annual DOT safety inspection. All systems within specification.', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"odometer": 28400, "result": "pass", "inspector": "DOT Inspector #4421"}'::jsonb, NOW()),
('84000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000001', 'maintenance', '2025-01-10 10:00:00', 'Brake Pad Replacement', 'Front brake pads replaced at 30,000 miles. Rotors resurfaced.', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"odometer": 30120, "cost": 425.00, "parts": ["brake_pads_front", "rotor_resurface"]}'::jsonb, NOW()),
('84000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000001', 'incident', '2025-07-22 14:30:00', 'Minor Fender Bender', 'Low-speed parking lot contact. Minor dent on rear bumper. No injuries.', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '{"odometer": 38500, "damage_estimate": 1200, "police_report": false, "at_fault": false}'::jsonb, NOW()),
('84000000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000002', 'acquisition', '2023-08-01 10:00:00', 'Vehicle Acquired', 'New 2023 Chevrolet Silverado 2500HD added to fleet.', NULL, '00000000-0000-0000-0000-000000000001', '{"purchase_price": 48900, "dealer": "Hendrick Chevrolet"}'::jsonb, NOW()),
('84000000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000002', 'recall', '2025-03-15 09:00:00', 'Safety Recall Completed', 'NHTSA recall #25V-123 for airbag sensor update. Software flashed successfully.', NULL, '00000000-0000-0000-0000-000000000001', '{"recall_number": "25V-123", "component": "airbag_sensor", "remedy": "software_update"}'::jsonb, NOW()),
('84000000-0000-0000-0000-000000000009', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000003', 'maintenance', '2026-01-20 11:00:00', 'Transmission Service', 'Transmission fluid flush and filter replacement at 50,000 miles.', '30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '{"odometer": 50100, "cost": 350.00, "service_center": "Fleet Service Center"}'::jsonb, NOW()),
('84000000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000004', 'registration', '2025-12-01 10:00:00', 'Registration Renewed', 'Annual vehicle registration renewed for 2026.', NULL, '00000000-0000-0000-0000-000000000001', '{"registration_number": "MD-2026-44401", "expiry": "2026-12-01", "cost": 285}'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. SCHEDULES (maintenance schedules, shift schedules)
-- Powers: Scheduling pages, calendar views
-- ============================================================================

INSERT INTO schedules (id, tenant_id, schedule_name, schedule_type, entity_type, entity_id, recurrence_pattern, recurrence_interval, start_date, end_date, start_time, end_time, assigned_to, status, is_active, notify_before_minutes, notification_enabled, notes, created_by)
VALUES
('85000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'Daily Pre-Trip Inspection', 'maintenance', 'vehicle', '40000000-0000-0000-0000-000000000001', 'daily', 1, '2026-01-01', '2026-12-31', '06:00', '06:30', '00000000-0000-0000-0000-000000000002', 'active', true, 30, true, 'Mandatory DVIR before first trip', '00000000-0000-0000-0000-000000000001'),
('85000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', 'Weekly Fleet Safety Meeting', 'meeting', 'team', NULL, 'weekly', 1, '2026-01-06', '2026-12-31', '08:00', '09:00', '00000000-0000-0000-0000-000000000002', 'active', true, 60, true, 'All drivers must attend weekly safety briefing', '00000000-0000-0000-0000-000000000001'),
('85000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', 'Monthly Oil Change — Vehicle 001', 'maintenance', 'vehicle', '40000000-0000-0000-0000-000000000001', 'monthly', 1, '2026-01-15', '2026-12-15', '09:00', '10:00', '00000000-0000-0000-0000-000000000003', 'active', true, 1440, true, 'Synthetic oil change every 5,000 miles or monthly', '00000000-0000-0000-0000-000000000001'),
('85000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', 'Quarterly Tire Rotation', 'maintenance', 'vehicle', '40000000-0000-0000-0000-000000000002', 'monthly', 3, '2026-03-01', '2026-12-31', '10:00', '11:00', '00000000-0000-0000-0000-000000000003', 'active', true, 4320, true, 'Rotate tires and check alignment', '00000000-0000-0000-0000-000000000001'),
('85000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', 'Annual DOT Inspection — Fleet Wide', 'inspection', 'fleet', NULL, 'yearly', 1, '2026-09-01', '2026-09-30', '08:00', '17:00', '00000000-0000-0000-0000-000000000002', 'active', true, 10080, true, 'Annual DOT safety inspection for all CMVs', '00000000-0000-0000-0000-000000000001'),
('85000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', 'Bi-Weekly Dispatcher Shift A', 'shift', 'user', '00000000-0000-0000-0000-000000000004', 'weekly', 2, '2026-01-01', '2026-06-30', '06:00', '14:00', '00000000-0000-0000-0000-000000000004', 'active', true, 30, true, 'Morning dispatcher shift', '00000000-0000-0000-0000-000000000001'),
('85000000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', 'Emergency Preparedness Drill', 'training', 'team', NULL, 'monthly', 6, '2026-03-15', '2026-09-15', '14:00', '16:00', '00000000-0000-0000-0000-000000000002', 'active', true, 10080, true, 'Semi-annual emergency response drill', '00000000-0000-0000-0000-000000000001'),
('85000000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', 'Driver DOT Physical Reminder — Q1', 'compliance', 'driver', '30000000-0000-0000-0000-000000000004', 'yearly', 1, '2026-03-01', '2026-03-31', '09:00', '12:00', '00000000-0000-0000-0000-000000000004', 'active', true, 20160, true, 'DOT medical exam due for renewal', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. COST ANALYSIS (monthly cost breakdowns per vehicle/fleet)
-- Powers: Cost Analysis page, financial reporting
-- ============================================================================

INSERT INTO cost_analysis (id, tenant_id, period_start, period_end, period_type, analysis_type, entity_id, entity_type, fuel_cost, maintenance_cost, parts_cost, labor_cost, insurance_cost, registration_cost, depreciation_cost, violation_cost, other_cost, miles_driven, budget_amount, notes, metadata, created_by)
VALUES
-- Fleet-wide monthly summaries
('86000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', '2025-12-01', '2025-12-31', 'monthly', 'fleet_summary', NULL, NULL, 18500.00, 8200.00, 3100.00, 4200.00, 6500.00, 450.00, 3200.00, 250.00, 1200.00, 78500, 50000.00, 'December 2025 fleet-wide cost analysis', '{"vehicle_count": 50, "driver_count": 32}'::jsonb, '00000000-0000-0000-0000-000000000001'),
('86000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', '2026-01-01', '2026-01-31', 'monthly', 'fleet_summary', NULL, NULL, 19200.00, 9500.00, 4200.00, 4800.00, 6500.00, 450.00, 3200.00, 150.00, 1100.00, 82000, 50000.00, 'January 2026 fleet-wide cost analysis — maintenance spike due to winter', '{"vehicle_count": 50, "driver_count": 32}'::jsonb, '00000000-0000-0000-0000-000000000001'),
('86000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', '2026-02-01', '2026-02-28', 'monthly', 'fleet_summary', NULL, NULL, 17800.00, 7100.00, 2800.00, 3900.00, 6500.00, 0.00, 3200.00, 0.00, 950.00, 75000, 50000.00, 'February 2026 fleet-wide — under budget, reduced maintenance', '{"vehicle_count": 50, "driver_count": 32}'::jsonb, '00000000-0000-0000-0000-000000000001'),
-- Per-vehicle monthly analysis
('86000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', '2026-01-01', '2026-01-31', 'monthly', 'vehicle', '40000000-0000-0000-0000-000000000001', 'vehicle', 520.00, 185.00, 45.00, 120.00, 130.00, 0.00, 300.00, 0.00, 25.00, 3240, 1500.00, 'Vehicle 001 — efficient month', NULL, '00000000-0000-0000-0000-000000000001'),
('86000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', '2026-01-01', '2026-01-31', 'monthly', 'vehicle', '40000000-0000-0000-0000-000000000002', 'vehicle', 480.00, 425.00, 180.00, 220.00, 130.00, 0.00, 310.00, 0.00, 30.00, 2890, 1500.00, 'Vehicle 002 — brake replacement increased costs', NULL, '00000000-0000-0000-0000-000000000001'),
('86000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', '2026-01-01', '2026-01-31', 'monthly', 'vehicle', '40000000-0000-0000-0000-000000000003', 'vehicle', 550.00, 120.00, 30.00, 90.00, 130.00, 0.00, 280.00, 0.00, 15.00, 3100, 1500.00, 'Vehicle 003 — minimal maintenance needed', NULL, '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 9. PREDICTIVE MAINTENANCE (AI-predicted failure forecasts)
-- Powers: Predictive Maintenance page, vehicle health alerts
-- ============================================================================

INSERT INTO predictive_maintenance (id, tenant_id, vehicle_id, component, predicted_failure_date, confidence_score, risk_level, status, recommendation, estimated_cost, data_sources, notes, created_at)
VALUES
('87000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000001', 'Brake System', '2026-04-15 00:00:00+00', 0.87, 'medium', 'active', 'Schedule brake pad replacement within 60 days. Current wear at 68%.', 425.00, '{"telemetry": true, "obd2": true, "maintenance_history": true}'::jsonb, 'Based on 12-month wear pattern analysis', NOW()),
('87000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000002', 'Battery', '2026-03-10 00:00:00+00', 0.92, 'high', 'active', 'Battery showing degraded CCA. Replace before cold weather. Risk of no-start condition.', 280.00, '{"telemetry": true, "obd2": true}'::jsonb, 'CCA dropped below 400A threshold', NOW()),
('87000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000003', 'Transmission', '2026-06-01 00:00:00+00', 0.74, 'medium', 'active', 'Transmission fluid showing metal particles. Schedule fluid analysis and possible rebuild.', 2800.00, '{"telemetry": true, "maintenance_history": true}'::jsonb, 'Fluid analysis detected elevated iron content', NOW()),
('87000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000004', 'Tires', '2026-03-20 00:00:00+00', 0.95, 'high', 'active', 'Front tires at 3/32" tread depth. Replace immediately for safety compliance.', 650.00, '{"inspection": true, "telemetry": true}'::jsonb, 'Below DOT minimum tread depth', NOW()),
('87000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000005', 'Engine Oil System', '2026-04-30 00:00:00+00', 0.68, 'low', 'active', 'Oil pressure sensor showing intermittent low readings. Monitor and schedule diagnostics.', 150.00, '{"obd2": true}'::jsonb, 'Possible sensor issue vs actual low pressure', NOW()),
('87000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000006', 'Alternator', '2026-03-05 00:00:00+00', 0.89, 'high', 'active', 'Alternator output voltage declining. Replace before complete failure.', 520.00, '{"obd2": true, "telemetry": true}'::jsonb, 'Output dropped from 14.2V to 13.1V over 3 months', NOW()),
('87000000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000007', 'Brake System', '2026-05-15 00:00:00+00', 0.71, 'low', 'active', 'Rear brake pads showing normal wear. Schedule replacement at next service interval.', 350.00, '{"inspection": true}'::jsonb, 'Wear at 45% — normal for mileage', NOW()),
('87000000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000008', 'Coolant System', '2026-04-01 00:00:00+00', 0.83, 'medium', 'active', 'Coolant temperature sensor showing higher-than-normal readings. Check thermostat and hoses.', 320.00, '{"obd2": true, "telemetry": true}'::jsonb, 'Avg temp increased 12°F over 60 days', NOW()),
-- Resolved predictions
('87000000-0000-0000-0000-000000000009', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000001', 'Battery', '2025-11-15 00:00:00+00', 0.91, 'high', 'resolved', 'Battery replaced per prediction. No downtime experienced.', 280.00, '{"obd2": true}'::jsonb, 'Prediction was accurate — battery failed CCA test at replacement', NOW()),
('87000000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000003', 'Brake System', '2025-12-01 00:00:00+00', 0.88, 'high', 'resolved', 'Brake pads replaced during scheduled maintenance.', 425.00, '{"inspection": true, "telemetry": true}'::jsonb, 'Replaced at 15% remaining — prediction was 2 weeks early', NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 10. RESERVATIONS (vehicle checkout/reservation system)
-- Powers: Reservations page, fleet utilization views
-- ============================================================================

INSERT INTO reservations (id, tenant_id, vehicle_id, user_id, driver_id, start_time, end_time, purpose, destination, status, approved_by, approved_at, start_odometer, notes, metadata, created_at)
VALUES
('88000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '2026-02-25 08:00:00', '2026-02-25 17:00:00', 'Client site visit — Baltimore Harbor project', 'Baltimore Inner Harbor, MD', 'confirmed', '00000000-0000-0000-0000-000000000001', '2026-02-20 14:00:00', 12500, 'Need pickup truck for equipment transport', '{"equipment": ["surveying gear", "laptop"]}'::jsonb, NOW()),
('88000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002', '2026-02-26 09:00:00', '2026-02-26 15:00:00', 'Training facility visit', 'CTA Training Center, Annapolis, MD', 'confirmed', '00000000-0000-0000-0000-000000000001', '2026-02-21 10:00:00', 8200, NULL, NULL, NOW()),
('88000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000003', '2026-03-01 07:00:00', '2026-03-01 18:00:00', 'Long-haul delivery — Philadelphia', 'Philadelphia Distribution Center', 'pending', NULL, NULL, NULL, 'Awaiting manager approval', NULL, NOW()),
('88000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000004', '2026-02-22 08:00:00', '2026-02-22 16:00:00', 'Vendor meeting and parts pickup', 'AutoZone Distribution, Richmond, VA', 'checked_out', '00000000-0000-0000-0000-000000000001', '2026-02-21 09:00:00', 45200, 'Parts pickup for WO-2026-015', NULL, NOW()),
('88000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000005', '2026-02-20 06:00:00', '2026-02-20 18:00:00', 'Multi-stop delivery route', 'DC Metro Area', 'completed', '00000000-0000-0000-0000-000000000001', '2026-02-19 15:00:00', 29500, 'Completed all 8 stops on time', '{"stops_completed": 8, "end_odometer": 29720}'::jsonb, NOW()),
('88000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000006', '2026-03-03 08:00:00', '2026-03-05 17:00:00', 'Multi-day conference attendance', 'National Harbor Convention Center, MD', 'pending', NULL, NULL, NULL, '3-day vehicle reservation for industry conference', NULL, NOW()),
('88000000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000016', '00000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000007', '2026-02-21 07:00:00', '2026-02-21 12:00:00', 'Morning delivery route', 'Northern Virginia', 'cancelled', NULL, NULL, NULL, 'Cancelled — vehicle in maintenance', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 11. EXECUTIVE DASHBOARD DATA (daily fleet KPI snapshots)
-- Powers: Executive Dashboard, fleet health overview
-- ============================================================================

INSERT INTO executive_dashboard_data (id, tenant_id, period_date, period_type, total_vehicles, active_vehicles, maintenance_count, incidents_count, fuel_cost, maintenance_cost, total_cost, total_miles, utilization_percentage, compliance_score, overdue_inspections, metadata, created_at)
VALUES
('89000000-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', '2026-02-15', 'daily', 50, 42, 3, 0, 620.00, 450.00, 1520.00, 2800, 84.0, 94.5, 1, '{"fleet_health": 88.2, "driver_compliance": 96.1, "on_time_delivery": 91.3}'::jsonb, NOW()),
('89000000-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', '2026-02-16', 'daily', 50, 44, 2, 0, 580.00, 280.00, 1310.00, 3100, 88.0, 95.0, 1, '{"fleet_health": 89.1, "driver_compliance": 96.5, "on_time_delivery": 92.0}'::jsonb, NOW()),
('89000000-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', '2026-02-17', 'daily', 50, 45, 1, 1, 610.00, 150.00, 1210.00, 3250, 90.0, 93.8, 0, '{"fleet_health": 87.5, "driver_compliance": 95.8, "on_time_delivery": 89.7}'::jsonb, NOW()),
('89000000-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', '2026-02-18', 'daily', 50, 43, 4, 0, 640.00, 520.00, 1610.00, 2950, 86.0, 94.2, 2, '{"fleet_health": 86.8, "driver_compliance": 96.3, "on_time_delivery": 90.5}'::jsonb, NOW()),
('89000000-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', '2026-02-19', 'daily', 50, 46, 2, 0, 590.00, 310.00, 1350.00, 3400, 92.0, 95.5, 0, '{"fleet_health": 90.3, "driver_compliance": 97.0, "on_time_delivery": 93.1}'::jsonb, NOW()),
('89000000-0000-0000-0000-000000000006', '12345678-1234-1234-1234-123456789012', '2026-02-20', 'daily', 50, 44, 3, 0, 600.00, 380.00, 1430.00, 3150, 88.0, 95.8, 1, '{"fleet_health": 89.7, "driver_compliance": 96.8, "on_time_delivery": 91.8}'::jsonb, NOW()),
('89000000-0000-0000-0000-000000000007', '12345678-1234-1234-1234-123456789012', '2026-02-21', 'daily', 50, 45, 2, 0, 570.00, 220.00, 1240.00, 3050, 90.0, 96.0, 0, '{"fleet_health": 91.0, "driver_compliance": 97.2, "on_time_delivery": 92.5}'::jsonb, NOW()),
-- Weekly summaries
('89000000-0000-0000-0000-000000000008', '12345678-1234-1234-1234-123456789012', '2026-02-09', 'weekly', 50, 44, 15, 2, 4200.00, 3100.00, 9800.00, 21500, 87.0, 94.0, 2, '{"fleet_health": 87.8, "driver_compliance": 95.5, "on_time_delivery": 90.2}'::jsonb, NOW()),
('89000000-0000-0000-0000-000000000009', '12345678-1234-1234-1234-123456789012', '2026-02-16', 'weekly', 50, 45, 12, 1, 4100.00, 2400.00, 8900.00, 22000, 89.0, 95.2, 1, '{"fleet_health": 89.5, "driver_compliance": 96.4, "on_time_delivery": 91.5}'::jsonb, NOW()),
-- Monthly summary
('89000000-0000-0000-0000-000000000010', '12345678-1234-1234-1234-123456789012', '2026-01-31', 'monthly', 50, 43, 48, 5, 19200.00, 9500.00, 49100.00, 82000, 86.0, 93.5, 3, '{"fleet_health": 86.5, "driver_compliance": 94.8, "on_time_delivery": 89.0}'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 12. DRIVER SAFETY EVENTS (telematics-detected safety events)
-- Powers: Safety dashboard, driver coaching
-- ============================================================================

INSERT INTO driver_safety_events (id, vehicle_id, driver_id, event_type, severity, latitude, longitude, address, speed_mph, g_force, duration_seconds, timestamp, tenant_id)
VALUES
('8A000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'harsh_braking', 'medium', 39.2904, -76.6122, 'I-695 WB near Exit 10, Baltimore, MD', 62, 0.65, 3, '2026-02-18 14:22:00', '12345678-1234-1234-1234-123456789012'),
('8A000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'speeding', 'high', 39.1735, -76.6683, 'MD-295 SB, Glen Burnie, MD', 78, NULL, 45, '2026-02-19 09:15:00', '12345678-1234-1234-1234-123456789012'),
('8A000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', 'harsh_acceleration', 'low', 38.9072, -77.0369, 'Constitution Ave, Washington DC', 35, 0.45, 4, '2026-02-19 11:30:00', '12345678-1234-1234-1234-123456789012'),
('8A000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', 'harsh_braking', 'high', 38.8951, -77.0364, 'I-395 NB, Arlington, VA', 55, 0.82, 2, '2026-02-19 16:45:00', '12345678-1234-1234-1234-123456789012'),
('8A000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', 'excessive_idling', 'low', 38.9072, -77.0369, 'Loading dock, 1400 I St NW, DC', 0, NULL, 1800, '2026-02-20 08:15:00', '12345678-1234-1234-1234-123456789012'),
('8A000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'harsh_cornering', 'medium', 39.2904, -76.6122, 'I-83 SB ramp to I-695, Baltimore, MD', 45, 0.55, 5, '2026-02-20 07:40:00', '12345678-1234-1234-1234-123456789012'),
('8A000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'harsh_braking', 'low', 39.9526, -75.1652, 'I-95 NB Exit 17, Philadelphia, PA', 48, 0.42, 2, '2026-02-20 09:55:00', '12345678-1234-1234-1234-123456789012'),
('8A000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'distracted_driving', 'high', 39.2904, -76.6122, 'US-40 EB, Baltimore, MD', 52, NULL, 8, '2026-02-21 10:20:00', '12345678-1234-1234-1234-123456789012'),
('8A000000-0000-0000-0000-000000000009', '40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', 'seatbelt_unfastened', 'medium', 39.2904, -76.6122, 'Fleet yard, 1200 Fleet Way, Baltimore', 5, NULL, 120, '2026-02-21 06:10:00', '12345678-1234-1234-1234-123456789012'),
('8A000000-0000-0000-0000-000000000010', '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'lane_departure', 'medium', 39.4015, -76.6019, 'I-95 NB near White Marsh, MD', 65, NULL, 3, '2026-02-20 15:30:00', '12345678-1234-1234-1234-123456789012')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 13. VEHICLE SAFETY INSPECTIONS (DVIR pre/post trip inspections)
-- Powers: Safety inspection pages, vehicle compliance views
-- ============================================================================

INSERT INTO vehicle_safety_inspections (id, vehicle_id, driver_id, inspection_date, inspection_time, inspection_type, odometer_reading, brakes_status, steering_status, lights_status, tires_status, horn_status, windshield_wipers_status, mirrors_status, seatbelts_status, emergency_equipment_status, fluid_leaks_status, body_damage_status, overall_status, defects_found, defects_corrected, vehicle_out_of_service, driver_signature, follow_up_required, tenant_id)
VALUES
-- Vehicle 1 recent inspections
('8B000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2026-02-21', '06:15', 'pre_trip', 45630, 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', false, false, false, 'J. Turner', false, '12345678-1234-1234-1234-123456789012'),
('8B000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2026-02-20', '06:10', 'pre_trip', 45430, 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', false, false, false, 'J. Turner', false, '12345678-1234-1234-1234-123456789012'),
('8B000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '2026-02-20', '15:45', 'post_trip', 45630, 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', false, false, false, 'J. Turner', false, '12345678-1234-1234-1234-123456789012'),
-- Vehicle 4 with defect found
('8B000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', '2026-02-21', '06:30', 'pre_trip', 61800, 'pass', 'pass', 'fail', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'fail', true, false, false, 'D. Jackson', true, '12345678-1234-1234-1234-123456789012'),
-- Vehicle 2
('8B000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '2026-02-21', '06:20', 'pre_trip', 38400, 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', false, false, false, 'M. Rodriguez', false, '12345678-1234-1234-1234-123456789012'),
('8B000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '2026-02-21', '06:25', 'pre_trip', 52400, 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', false, false, false, 'K. Williams', false, '12345678-1234-1234-1234-123456789012'),
('8B000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', '2026-02-21', '06:05', 'pre_trip', 29500, 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', false, false, false, 'S. Mitchell', false, '12345678-1234-1234-1234-123456789012'),
-- Vehicle 6 out of service
('8B000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', '2026-02-20', '06:45', 'pre_trip', 73200, 'fail', 'pass', 'pass', 'fail', 'pass', 'pass', 'pass', 'pass', 'pass', 'fail', 'pass', 'fail', true, false, true, 'A. Brown', true, '12345678-1234-1234-1234-123456789012')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 14. COMMUNICATIONS (internal messages, emails, calls)
-- Powers: Communication Hub, People & Communication pages
-- ============================================================================

INSERT INTO communications (id, communication_type, direction, subject, body, from_user_id, from_contact_name, to_contact_names, communication_datetime, status, manual_category, manual_priority, requires_follow_up, tenant_id)
VALUES
('8C000000-0000-0000-0000-000000000001', 'email', 'outbound', 'Weekly Fleet Safety Report — Feb 17-21', 'Attached is the weekly fleet safety report covering February 17-21, 2026. Key highlights: Zero preventable accidents this week. Three minor safety events addressed through coaching. Driver compliance rate at 96.8%.', '30000000-0000-0000-0000-000000000001', 'James Turner', ARRAY['All Drivers', 'Fleet Managers'], '2026-02-21 09:00:00', 'sent', 'safety', 'normal', false, '12345678-1234-1234-1234-123456789012'),
('8C000000-0000-0000-0000-000000000002', 'message', 'inbound', 'Vehicle 006 brake issue', 'Vehicle 006 failed pre-trip brake inspection this morning. Brakes are spongy and pulling to the right. Need maintenance ASAP — vehicle is currently out of service.', '30000000-0000-0000-0000-000000000006', 'Anthony Brown', ARRAY['Maintenance Team'], '2026-02-20 07:00:00', 'read', 'maintenance', 'urgent', true, '12345678-1234-1234-1234-123456789012'),
('8C000000-0000-0000-0000-000000000003', 'email', 'inbound', 'DOT Audit Notification — March 2026', 'This is to notify your fleet that a scheduled DOT compliance audit will be conducted during the week of March 10-14, 2026. Please ensure all driver qualification files, vehicle maintenance records, and HOS logs are current and accessible.', NULL, 'FMCSA Compliance Division', ARRAY['Fleet Manager', 'Compliance Officer'], '2026-02-19 14:30:00', 'read', 'compliance', 'high', true, '12345678-1234-1234-1234-123456789012'),
('8C000000-0000-0000-0000-000000000004', 'phone', 'inbound', 'Insurance claim follow-up', 'Called regarding claim #INS-2025-0722 for the parking lot incident. Adjuster confirmed the other party accepted fault. Estimated payout of $1,200 for bumper repair. Repair authorized to proceed at Fleet Service Center.', NULL, 'Progressive Insurance — Jane at ext 4421', ARRAY['Fleet Manager'], '2026-02-20 11:15:00', 'read', 'insurance', 'normal', false, '12345678-1234-1234-1234-123456789012'),
('8C000000-0000-0000-0000-000000000005', 'message', 'outbound', 'HOS violation coaching session scheduled', 'Driver A. Brown: You have been scheduled for a mandatory HOS compliance coaching session on Feb 24 at 10:00 AM. This follows the 11-hour driving limit violation recorded on Feb 19. Please confirm attendance.', '30000000-0000-0000-0000-000000000001', 'James Turner', ARRAY['Anthony Brown'], '2026-02-21 08:30:00', 'delivered', 'coaching', 'high', true, '12345678-1234-1234-1234-123456789012'),
('8C000000-0000-0000-0000-000000000006', 'email', 'outbound', 'Quarterly training schedule — Q1 2026', 'The Q1 2026 training schedule has been published. Mandatory courses include: Defensive Driving Refresher (all drivers), Hazmat Awareness Update (endorsed drivers), and Winter Operations Safety (all). See attached schedule for dates.', '30000000-0000-0000-0000-000000000001', 'James Turner', ARRAY['All Drivers'], '2026-02-18 10:00:00', 'sent', 'training', 'normal', false, '12345678-1234-1234-1234-123456789012'),
('8C000000-0000-0000-0000-000000000007', 'message', 'inbound', 'Parts order delayed', 'FYI the brake pad order for vehicles 004 and 006 is delayed 2 business days due to supplier backorder. New ETA is Feb 25. Vehicle 006 remains out of service until parts arrive.', NULL, 'AutoZone Commercial — Mike', ARRAY['Maintenance Manager'], '2026-02-21 13:45:00', 'unread', 'procurement', 'high', true, '12345678-1234-1234-1234-123456789012'),
('8C000000-0000-0000-0000-000000000008', 'email', 'inbound', 'CDL renewal reminder — Driver D. Jackson', 'Reminder: Driver DeShawn Jackson''s CDL-A (CDL-A-2022-304) expires November 5, 2026. Schedule renewal process to begin no later than September 2026 to avoid lapse in driving authorization.', NULL, 'DC DMV Notifications', ARRAY['Compliance Officer'], '2026-02-15 08:00:00', 'read', 'compliance', 'normal', true, '12345678-1234-1234-1234-123456789012')
ON CONFLICT (id) DO NOTHING;

COMMIT;
