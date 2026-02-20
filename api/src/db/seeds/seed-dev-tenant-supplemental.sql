-- Supplemental Seed Data for Dev Tenant
-- Fills empty tables: vendors, inspections, announcements, documents, purchase_orders, charging_sessions
-- Tenant: 12345678-1234-1234-1234-123456789012
-- Must set RLS context for tenant_isolation policies

-- Set RLS tenant context
SET app.current_tenant_id = '12345678-1234-1234-1234-123456789012';

-- ============================================================
-- VENDORS (prerequisite for purchase_orders)
-- ============================================================
INSERT INTO vendors (id, tenant_id, name, code, type, contact_name, contact_email, contact_phone, address, city, state, zip_code, country, payment_terms, preferred_vendor, rating, is_active) VALUES
  ('a0000001-0000-0000-0000-000000000001', '12345678-1234-1234-1234-123456789012', 'AutoZone Commercial', 'AZ-001', 'parts', 'Mike Rodriguez', 'mike.r@autozone.com', '850-555-0101', '1420 W Tennessee St', 'Tallahassee', 'FL', '32304', 'US', 'NET30', true, 4.50, true),
  ('a0000001-0000-0000-0000-000000000002', '12345678-1234-1234-1234-123456789012', 'NAPA Auto Parts', 'NAPA-001', 'parts', 'Jennifer Lewis', 'jlewis@napaonline.com', '850-555-0102', '2760 Capital Cir NE', 'Tallahassee', 'FL', '32308', 'US', 'NET30', true, 4.70, true),
  ('a0000001-0000-0000-0000-000000000003', '12345678-1234-1234-1234-123456789012', 'Tallahassee Ford', 'TF-001', 'dealer', 'Robert Chen', 'rchen@tallford.com', '850-555-0103', '3505 W Tennessee St', 'Tallahassee', 'FL', '32304', 'US', 'NET45', false, 4.20, true),
  ('a0000001-0000-0000-0000-000000000004', '12345678-1234-1234-1234-123456789012', 'FleetPro Services', 'FPS-001', 'service', 'Amanda Torres', 'atorres@fleetpro.com', '850-555-0104', '890 Industrial Park Dr', 'Tallahassee', 'FL', '32310', 'US', 'NET15', true, 4.80, true),
  ('a0000001-0000-0000-0000-000000000005', '12345678-1234-1234-1234-123456789012', 'Michelin Fleet Solutions', 'MFS-001', 'tires', 'David Park', 'dpark@michelin.com', '800-555-0105', '1 Parkway South', 'Greenville', 'SC', '29615', 'US', 'NET60', true, 4.60, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- INSPECTIONS
-- Uses real vehicle IDs (40000000-...) and driver IDs (30000000-...)
-- inspection_type enum: pre_trip, post_trip, annual, dot, safety, emissions, special
-- status enum: pending, in_progress, completed, cancelled, on_hold, failed
-- ============================================================
INSERT INTO inspections (id, tenant_id, vehicle_id, driver_id, inspector_id, type, status, inspector_name, location, started_at, completed_at, defects_found, passed_inspection, notes) VALUES
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'pre_trip', 'completed', 'Robert Garcia', 'CTA Main Operations Center', now() - interval '2 hours', now() - interval '1 hour', 0, true, 'All systems functional. Tire pressure normal.'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'pre_trip', 'completed', 'Robert Garcia', 'CTA Main Operations Center', now() - interval '3 hours', now() - interval '2 hours 30 minutes', 1, true, 'Minor wiper streak noted - non-critical. Vehicle approved for service.'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005', 'post_trip', 'completed', 'Robert Garcia', 'North Fleet Maintenance Yard', now() - interval '5 hours', now() - interval '4 hours 30 minutes', 0, true, 'No issues. Odometer: 42,150 miles.'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000006', NULL, '00000000-0000-0000-0000-000000000006', 'annual', 'completed', 'Jennifer Davis', 'North Fleet Maintenance Yard', now() - interval '10 days', now() - interval '10 days' + interval '4 hours', 0, true, 'Annual fleet inspection passed. All DOT requirements met.'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000007', NULL, '00000000-0000-0000-0000-000000000006', 'safety', 'completed', 'Jennifer Davis', 'North Fleet Maintenance Yard', now() - interval '7 days', now() - interval '7 days' + interval '2 hours', 2, false, 'Failed: Brake pad wear below minimum threshold. Left rear turn signal intermittent.'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000005', 'pre_trip', 'completed', 'Robert Garcia', 'South Dispatch Hub', now() - interval '1 day', now() - interval '1 day' + interval '30 minutes', 0, true, 'Vehicle in good condition. Fuel at 75%.'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000015', NULL, '00000000-0000-0000-0000-000000000006', 'dot', 'completed', 'FHWA External Inspector', 'CTA Main Operations Center', now() - interval '14 days', now() - interval '14 days' + interval '6 hours', 0, true, 'DOT compliance inspection passed. All records in order.'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000020', '30000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000005', 'pre_trip', 'in_progress', 'Robert Garcia', 'East Side Vehicle Storage', now() - interval '30 minutes', NULL, 0, true, 'Inspection in progress.'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000025', NULL, '00000000-0000-0000-0000-000000000006', 'emissions', 'completed', 'Jennifer Davis', 'State Emissions Center', now() - interval '21 days', now() - interval '21 days' + interval '1 hour', 0, true, 'Passed emissions test. Certificate valid through 2027.'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000030', NULL, '00000000-0000-0000-0000-000000000006', 'safety', 'pending', 'TBD', 'North Fleet Maintenance Yard', now() + interval '3 days', NULL, 0, true, 'Scheduled safety inspection after odometer milestone.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ANNOUNCEMENTS
-- notification_type enum: info, warning, error, success, reminder, alert
-- priority enum: low, medium, high, critical, emergency
-- ============================================================
INSERT INTO announcements (id, tenant_id, title, message, type, priority, target_roles, published_at, expires_at, created_by_id, is_active) VALUES
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'System Maintenance Window - Feb 22', 'The fleet management system will undergo scheduled maintenance on Saturday, February 22 from 2:00 AM to 6:00 AM EST. All services will be temporarily unavailable.', 'warning', 'high', '["SuperAdmin","Admin","Manager","User"]', now() - interval '1 day', now() + interval '5 days', '00000000-0000-0000-0000-000000000001', true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'New Pre-Trip Inspection App Available', 'The mobile pre-trip inspection app has been updated with photo capture and voice-to-text notes. Download the latest version from your app store.', 'info', 'medium', '["User","Manager"]', now() - interval '3 days', now() + interval '30 days', '00000000-0000-0000-0000-000000000002', true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Fuel Card Policy Update', 'Effective March 1, 2026: All fuel card transactions exceeding $200 require supervisor approval within 24 hours. Review the updated fuel policy in the compliance module.', 'alert', 'high', '["SuperAdmin","Admin","Manager","User"]', now() - interval '5 days', now() + interval '60 days', '00000000-0000-0000-0000-000000000002', true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Q1 Fleet Performance Review', 'Q1 2026 fleet performance review meeting scheduled for March 15. All fleet managers should prepare utilization and cost reports.', 'reminder', 'medium', '["Admin","Manager"]', now() - interval '2 days', now() + interval '25 days', '00000000-0000-0000-0000-000000000001', true),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Welcome to CTA Fleet Management', 'Welcome to the CTA Fleet Management platform. Access training materials in the Help section.', 'success', 'low', '[]', now() - interval '30 days', NULL, '00000000-0000-0000-0000-000000000001', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Disable broken search_vector trigger on documents before inserting
-- ============================================================
ALTER TABLE documents DISABLE TRIGGER ALL;

-- ============================================================
-- DOCUMENTS
-- document_type enum (column 'type'): policy, manual, form, report, contract, invoice, receipt, certification, training, safety, compliance
-- document_type_enum (column 'document_type'): registration, insurance, inspection, maintenance, incident, other
-- file_url is NOT NULL
-- ============================================================
INSERT INTO documents (id, tenant_id, name, type, category, file_url, file_size, mime_type, version, is_public, uploaded_by_id, vehicle_id, title, file_name, document_type) VALUES
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'CTA-001 Registration', 'certification', 'registration', '/storage/documents/cta001-registration-2026.pdf', 245000, 'application/pdf', '1.0', false, '00000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Vehicle Registration - CTA-001', 'cta001-registration-2026.pdf', 'registration'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'CTA-001 Insurance', 'certification', 'insurance', '/storage/documents/cta001-insurance-2026.pdf', 189000, 'application/pdf', '1.0', false, '00000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'Insurance Certificate - CTA-001', 'cta001-insurance-2026.pdf', 'insurance'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Fleet Safety Manual', 'manual', 'safety', '/storage/documents/fleet-safety-manual-2026.pdf', 2450000, 'application/pdf', '3.2', true, '00000000-0000-0000-0000-000000000001', NULL, 'Fleet Safety Manual 2026', 'fleet-safety-manual-2026.pdf', 'other'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Onboarding Checklist', 'form', 'training', '/storage/documents/driver-onboarding-checklist.pdf', 156000, 'application/pdf', '2.0', true, '00000000-0000-0000-0000-000000000002', NULL, 'Driver Onboarding Checklist', 'driver-onboarding-checklist.pdf', 'other'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Maintenance SOP', 'policy', 'compliance', '/storage/documents/vehicle-maintenance-sop.pdf', 890000, 'application/pdf', '4.1', true, '00000000-0000-0000-0000-000000000001', NULL, 'Vehicle Maintenance SOP', 'vehicle-maintenance-sop.pdf', 'maintenance'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Jan 2026 Report', 'report', 'reports', '/storage/documents/fleet-report-jan-2026.pdf', 1250000, 'application/pdf', '1.0', false, '00000000-0000-0000-0000-000000000003', NULL, 'Monthly Fleet Report - January 2026', 'fleet-report-jan-2026.pdf', 'other'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'CTA-007 Incident Report', 'report', 'incident', '/storage/documents/cta007-accident-report.pdf', 567000, 'application/pdf', '1.0', false, '00000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000007', 'Accident Report - CTA-007', 'cta007-accident-report.pdf', 'incident'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'Fuel Card Agreement', 'contract', 'finance', '/storage/documents/fuel-card-agreement-template.docx', 78000, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '1.5', true, '00000000-0000-0000-0000-000000000002', NULL, 'Fuel Card Agreement Template', 'fuel-card-agreement-template.docx', 'other')
ON CONFLICT (id) DO NOTHING;

-- Re-enable triggers on documents
ALTER TABLE documents ENABLE TRIGGER ALL;

-- ============================================================
-- PURCHASE ORDERS
-- Requires vendor_id FK to vendors table
-- status enum: pending, in_progress, completed, cancelled, on_hold, failed
-- ============================================================
INSERT INTO purchase_orders (id, tenant_id, number, vendor_id, status, order_date, expected_delivery_date, subtotal, tax_amount, shipping_cost, total_amount, payment_status, requested_by_id, approved_by_id, approved_at, notes, line_items) VALUES
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'PO-2026-001', 'a0000001-0000-0000-0000-000000000001', 'completed', now() - interval '14 days', now() - interval '7 days', 459.90, 32.19, 0.00, 492.09, 'paid', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', now() - interval '14 days', 'Quarterly brake pad and oil filter restock', '[{"part_number":"BRK-PAD-001","description":"Brake Pads - Heavy Duty","quantity":10,"unit_price":45.99}]'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'PO-2026-002', 'a0000001-0000-0000-0000-000000000005', 'in_progress', now() - interval '5 days', now() + interval '10 days', 2279.88, 159.59, 89.99, 2529.46, 'unpaid', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', now() - interval '4 days', 'Tire replacement order for 12 vehicles due for rotation', '[{"part_number":"TIR-ALL-001","description":"All-Season Tire 245/65R17","quantity":12,"unit_price":189.99}]'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'PO-2026-003', 'a0000001-0000-0000-0000-000000000002', 'pending', now() - interval '1 day', now() + interval '14 days', 578.82, 40.52, 15.00, 634.34, 'unpaid', '00000000-0000-0000-0000-000000000006', NULL, NULL, 'Emergency brake repair parts for CTA-007', '[{"part_number":"BRK-ROT-001","description":"Brake Rotors","quantity":2,"unit_price":125.00},{"part_number":"BRK-PAD-001","description":"Brake Pads","quantity":4,"unit_price":45.99},{"part_number":"BRK-FLD-001","description":"Brake Fluid DOT4","quantity":6,"unit_price":12.99}]'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'PO-2026-004', 'a0000001-0000-0000-0000-000000000004', 'completed', now() - interval '30 days', now() - interval '20 days', 3200.00, 224.00, 0.00, 3424.00, 'paid', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', now() - interval '30 days', 'Fleet-wide 50-point inspection service', '[{"description":"50-Point Vehicle Inspection","quantity":20,"unit_price":160.00}]'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', 'PO-2026-005', 'a0000001-0000-0000-0000-000000000003', 'pending', now(), now() + interval '21 days', 1899.00, 132.93, 0.00, 2031.93, 'unpaid', '00000000-0000-0000-0000-000000000005', NULL, NULL, 'OEM Ford parts for scheduled service - 5 vehicles', '[{"description":"Ford OEM Oil Filter Kit","quantity":5,"unit_price":89.00},{"description":"Ford OEM Cabin Air Filter","quantity":5,"unit_price":45.00},{"description":"Ford Transmission Fluid","quantity":10,"unit_price":65.80}]')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CHARGING SESSIONS
-- Uses real charging_station IDs from subqueries
-- charging_sessions has tenant_id NOT NULL
-- ============================================================
INSERT INTO charging_sessions (id, tenant_id, vehicle_id, station_id, start_time, end_time, duration_minutes, start_soc_percent, end_soc_percent, energy_delivered_kwh, max_power_kw, avg_power_kw, energy_cost, total_cost, session_status) VALUES
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000015', (SELECT id FROM charging_stations WHERE name = 'HQ Charger Bay 1' LIMIT 1), now() - interval '4 hours', now() - interval '2 hours', 120, 25.00, 95.00, 52.500, 150.00, 85.00, 8.40, 8.40, 'Completed'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000016', (SELECT id FROM charging_stations WHERE name = 'HQ Charger Bay 2' LIMIT 1), now() - interval '6 hours', now() - interval '3 hours 30 minutes', 150, 15.00, 90.00, 58.000, 150.00, 78.00, 9.28, 9.28, 'Completed'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000017', (SELECT id FROM charging_stations WHERE name = 'HQ Level 2 - Slot A' LIMIT 1), now() - interval '10 hours', now() - interval '2 hours', 480, 30.00, 100.00, 45.000, 19.20, 12.50, 5.40, 5.40, 'Completed'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000018', (SELECT id FROM charging_stations WHERE name = 'HQ Level 2 - Slot B' LIMIT 1), now() - interval '8 hours', now() - interval '1 hour', 420, 40.00, 98.00, 38.000, 19.20, 11.80, 4.56, 4.56, 'Completed'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000015', (SELECT id FROM charging_stations WHERE name = 'Maintenance Yard DC Fast' LIMIT 1), now() - interval '1 day', now() - interval '1 day' + interval '45 minutes', 45, 10.00, 80.00, 55.000, 350.00, 120.00, 11.00, 11.00, 'Completed'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000020', (SELECT id FROM charging_stations WHERE name = 'Satellite Office Charger' LIMIT 1), now() - interval '5 hours', now() - interval '1 hour', 240, 35.00, 95.00, 42.000, 19.20, 14.00, 5.04, 5.04, 'Completed'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000045', (SELECT id FROM charging_stations WHERE name = 'HQ Charger Bay 1' LIMIT 1), now() - interval '2 days', now() - interval '2 days' + interval '90 minutes', 90, 20.00, 85.00, 48.000, 150.00, 90.00, 7.68, 7.68, 'Completed'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000016', (SELECT id FROM charging_stations WHERE name = 'HQ Charger Bay 1' LIMIT 1), now() - interval '30 minutes', NULL, NULL, 45.00, NULL, 12.500, 150.00, 95.00, 2.00, 2.00, 'Active'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000050', (SELECT id FROM charging_stations WHERE name = 'HQ Level 2 - Slot A' LIMIT 1), now() - interval '3 hours', NULL, NULL, 55.00, NULL, 18.000, 19.20, 15.00, 2.16, 2.16, 'Active'),
  (gen_random_uuid(), '12345678-1234-1234-1234-123456789012', '40000000-0000-0000-0000-000000000017', (SELECT id FROM charging_stations WHERE name = 'Maintenance Yard DC Fast' LIMIT 1), now() - interval '3 days', now() - interval '3 days' + interval '50 minutes', 50, 5.00, 75.00, 52.000, 350.00, 110.00, 10.40, 10.40, 'Completed')
ON CONFLICT (id) DO NOTHING;
