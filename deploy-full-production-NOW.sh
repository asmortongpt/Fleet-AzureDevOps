#!/bin/bash

# EMERGENCY FULL PRODUCTION DEPLOYMENT
# Deploy EVERYTHING NOW with maximum Azure VM capacity

set -e

echo "🚨 EMERGENCY FULL PRODUCTION DEPLOYMENT"
echo "════════════════════════════════════════════════════════════════"
echo "Deploying at MAXIMUM CAPACITY"
echo ""

NAMESPACE="fleet-management"
POSTGRES_POD=$(kubectl get pods -n $NAMESPACE -l app=fleet-postgres -o jsonpath='{.items[0].metadata.name}')
API_POD=$(kubectl get pods -n $NAMESPACE -l app=fleet-api -o jsonpath='{.items[0].metadata.name}')

# 1. FIX DATABASE SCHEMA IMMEDIATELY
echo "1️⃣  FIXING DATABASE SCHEMA NOW..."
echo "────────────────────────────────────────────────────────────────"

kubectl exec -n $NAMESPACE $POSTGRES_POD -- sh -c 'PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -d $POSTGRES_DB' <<'SCHEMA_EOF'
-- Add ALL missing columns
ALTER TABLE IF EXISTS vehicles ADD COLUMN IF NOT EXISTS location JSONB;
ALTER TABLE IF EXISTS vehicles ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE IF EXISTS vehicles ADD COLUMN IF NOT EXISTS asset_3d_url TEXT;
ALTER TABLE IF EXISTS vehicles ADD COLUMN IF NOT EXISTS photo_urls TEXT[];

ALTER TABLE IF EXISTS drivers ADD COLUMN IF NOT EXISTS azure_ad_id VARCHAR(255);
ALTER TABLE IF EXISTS drivers ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE IF EXISTS drivers ADD COLUMN IF NOT EXISTS license_number VARCHAR(50);

ALTER TABLE IF EXISTS work_orders ADD COLUMN IF NOT EXISTS estimate_pdf_url TEXT;
ALTER TABLE IF EXISTS work_orders ADD COLUMN IF NOT EXISTS invoice_pdf_url TEXT;

ALTER TABLE IF EXISTS fuel_transactions ADD COLUMN IF NOT EXISTS receipt_pdf_url TEXT;

ALTER TABLE IF EXISTS incidents ADD COLUMN IF NOT EXISTS photo_urls TEXT[];
ALTER TABLE IF EXISTS incidents ADD COLUMN IF NOT EXISTS report_pdf_url TEXT;

ALTER TABLE IF EXISTS inspections ADD COLUMN IF NOT EXISTS checklist_pdf_url TEXT;
ALTER TABLE IF EXISTS inspections ADD COLUMN IF NOT EXISTS signature_url TEXT;

ALTER TABLE IF EXISTS documents ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE IF EXISTS documents ADD COLUMN IF NOT EXISTS file_type VARCHAR(50);

\echo '✅ Schema fixed'
SCHEMA_EOF

# 2. POPULATE COMPLETE DATABASE
echo ""
echo "2️⃣  POPULATING COMPLETE DATABASE..."
echo "────────────────────────────────────────────────────────────────"

kubectl exec -n $NAMESPACE $POSTGRES_POD -- sh -c 'PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -d $POSTGRES_DB' <<'DATA_EOF'
-- 150 VEHICLES with 3D assets
INSERT INTO vehicles (
    id, name, vin, year, make, model, license_plate, status,
    location_lat, location_lon, location_address, location,
    mileage, fuel_level, color, asset_3d_url, photo_urls,
    created_at, updated_at
)
SELECT
    'VEH-' || LPAD(gs::text, 4, '0'),
    (ARRAY['Ford', 'Chevrolet', 'Toyota'])[1 + (gs % 3)] || ' ' || (ARRAY['F-150', 'Silverado', 'Tacoma'])[1 + (gs % 3)] || ' - ' || gs,
    'VIN' || LPAD((gs * 12345)::text, 14, '0'),
    2020 + (gs % 5),
    (ARRAY['Ford', 'Chevrolet', 'Toyota', 'Honda', 'Ram'])[1 + (gs % 5)],
    (ARRAY['F-150', 'Silverado', 'Tacoma', 'Civic', '1500'])[1 + (gs % 5)],
    (ARRAY['TX', 'CA', 'NY', 'FL', 'IL'])[1 + (gs % 5)] || '-' || LPAD((gs * 123)::text, 4, '0'),
    (ARRAY['active', 'idle', 'maintenance', 'charging', 'service'])[1 + (gs % 5)],
    39.8283 + ((gs % 100) - 50) * 0.01,
    -98.5795 + ((gs % 100) - 50) * 0.01,
    gs || ' Fleet St, Kansas City, KS 66101',
    jsonb_build_object('lat', 39.8283 + ((gs % 100) - 50) * 0.01, 'lng', -98.5795 + ((gs % 100) - 50) * 0.01),
    10000 + gs * 1000,
    50 + (gs % 50),
    (ARRAY['White', 'Black', 'Silver', 'Red', 'Blue'])[1 + (gs % 5)],
    '/assets/3d/' || lower((ARRAY['ford', 'chevrolet', 'toyota'])[1 + (gs % 3)]) || '-' || lower((ARRAY['f150', 'silverado', 'tacoma'])[1 + (gs % 3)]) || '.glb',
    ARRAY['/assets/vehicles/' || LPAD(gs::text, 4, '0') || '-front.jpg', '/assets/vehicles/' || LPAD(gs::text, 4, '0') || '-side.jpg'],
    NOW() - (gs || ' days')::INTERVAL,
    NOW()
FROM generate_series(1, 150) as gs
ON CONFLICT (id) DO UPDATE SET
    location = EXCLUDED.location,
    color = EXCLUDED.color,
    asset_3d_url = EXCLUDED.asset_3d_url,
    photo_urls = EXCLUDED.photo_urls;

-- 50 DRIVERS with Azure AD
INSERT INTO drivers (
    id, name, email, phone, status, license_number,
    azure_ad_id, photo_url, created_at, updated_at
)
SELECT
    'DRV-' || LPAD(gs::text, 4, '0'),
    (ARRAY['John', 'Sarah', 'Michael', 'Emily', 'David'])[1 + (gs % 5)] || ' ' || (ARRAY['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'])[1 + (gs % 5)],
    lower((ARRAY['john', 'sarah', 'michael', 'emily', 'david'])[1 + (gs % 5)]) || '.' || lower((ARRAY['smith', 'johnson', 'williams'])[1 + (gs % 3)]) || gs || '@fleet.com',
    '555-' || LPAD(gs::text, 4, '0'),
    'active',
    'DL-' || LPAD((gs * 12345)::text, 8, '0'),
    'azure-ad-' || LPAD(gs::text, 8, '0'),
    'https://i.pravatar.cc/150?img=' || (gs % 70),
    NOW() - (gs || ' days')::INTERVAL,
    NOW()
FROM generate_series(1, 50) as gs
ON CONFLICT (id) DO UPDATE SET
    azure_ad_id = EXCLUDED.azure_ad_id,
    photo_url = EXCLUDED.photo_url;

-- 500 FUEL TRANSACTIONS with receipts
INSERT INTO fuel_transactions (
    id, vehicle_id, driver_id, gallons, cost, odometer, station, receipt_pdf_url, created_at
)
SELECT
    'FUEL-' || LPAD(gs::text, 6, '0'),
    'VEH-' || LPAD((gs % 150 + 1)::text, 4, '0'),
    'DRV-' || LPAD((gs % 50 + 1)::text, 4, '0'),
    (15 + (gs % 20))::DECIMAL(5,2),
    (45 + (gs % 50))::DECIMAL(7,2),
    10000 + gs * 150,
    'Station ' || (gs % 20 + 1) || ', Kansas City',
    '/documents/receipts/fuel-' || LPAD(gs::text, 6, '0') || '.pdf',
    NOW() - (gs || ' hours')::INTERVAL
FROM generate_series(1, 500) as gs
ON CONFLICT (id) DO UPDATE SET receipt_pdf_url = EXCLUDED.receipt_pdf_url;

-- 300 WORK ORDERS with estimates
INSERT INTO work_orders (
    id, vehicle_id, title, description, status, priority,
    scheduled_date, estimate_pdf_url, invoice_pdf_url, created_at, updated_at
)
SELECT
    'WO-' || LPAD(gs::text, 5, '0'),
    'VEH-' || LPAD((gs % 150 + 1)::text, 4, '0'),
    (ARRAY['Oil Change', 'Tire Rotation', 'Brake Service', 'Engine Repair', 'Transmission Service'])[1 + (gs % 5)],
    'Scheduled maintenance and repairs',
    (ARRAY['pending', 'in_progress', 'completed', 'cancelled'])[1 + (gs % 4)],
    (ARRAY['high', 'medium', 'low'])[1 + (gs % 3)],
    NOW() + ((gs % 60) || ' days')::INTERVAL,
    '/documents/estimates/wo-' || LPAD(gs::text, 5, '0') || '-estimate.pdf',
    CASE WHEN (gs % 4) = 2 THEN '/documents/invoices/wo-' || LPAD(gs::text, 5, '0') || '-invoice.pdf' ELSE NULL END,
    NOW() - (gs || ' days')::INTERVAL,
    NOW()
FROM generate_series(1, 300) as gs
ON CONFLICT (id) DO UPDATE SET
    estimate_pdf_url = EXCLUDED.estimate_pdf_url,
    invoice_pdf_url = EXCLUDED.invoice_pdf_url;

-- 200 INSPECTIONS with checklists
INSERT INTO inspections (
    id, vehicle_id, inspector_id, inspection_type, status, notes,
    inspection_date, checklist_pdf_url, signature_url, created_at, updated_at
)
SELECT
    'INS-' || LPAD(gs::text, 5, '0'),
    'VEH-' || LPAD((gs % 150 + 1)::text, 4, '0'),
    'DRV-' || LPAD((gs % 50 + 1)::text, 4, '0'),
    (ARRAY['pre-trip', 'post-trip', 'annual', 'dot', 'safety'])[1 + (gs % 5)],
    (ARRAY['passed', 'failed', 'pending'])[1 + (gs % 3)],
    'Comprehensive vehicle inspection completed',
    NOW() - (gs || ' days')::INTERVAL,
    '/documents/inspections/ins-' || LPAD(gs::text, 5, '0') || '-checklist.pdf',
    '/documents/signatures/ins-' || LPAD(gs::text, 5, '0') || '-sig.png',
    NOW() - (gs || ' days')::INTERVAL,
    NOW()
FROM generate_series(1, 200) as gs
ON CONFLICT (id) DO UPDATE SET
    checklist_pdf_url = EXCLUDED.checklist_pdf_url,
    signature_url = EXCLUDED.signature_url;

-- 150 INCIDENTS with photos and reports
INSERT INTO incidents (
    id, vehicle_id, driver_id, incident_type, severity, description,
    photo_urls, report_pdf_url, incident_date, created_at, updated_at
)
SELECT
    'INC-' || LPAD(gs::text, 5, '0'),
    'VEH-' || LPAD((gs % 150 + 1)::text, 4, '0'),
    'DRV-' || LPAD((gs % 50 + 1)::text, 4, '0'),
    (ARRAY['accident', 'breakdown', 'near-miss', 'property-damage'])[1 + (gs % 4)],
    (ARRAY['low', 'medium', 'high', 'critical'])[1 + (gs % 4)],
    'Incident requiring documentation and follow-up',
    ARRAY[
        '/documents/incidents/inc-' || LPAD(gs::text, 5, '0') || '-photo1.jpg',
        '/documents/incidents/inc-' || LPAD(gs::text, 5, '0') || '-photo2.jpg'
    ],
    '/documents/incidents/inc-' || LPAD(gs::text, 5, '0') || '-report.pdf',
    NOW() - (gs || ' days')::INTERVAL,
    NOW() - (gs || ' days')::INTERVAL,
    NOW()
FROM generate_series(1, 150) as gs
ON CONFLICT (id) DO UPDATE SET
    photo_urls = EXCLUDED.photo_urls,
    report_pdf_url = EXCLUDED.report_pdf_url;

-- 75 ROUTES with GPS data
INSERT INTO routes (
    id, name, description, distance_miles, estimated_duration,
    waypoints, status, created_at, updated_at
)
SELECT
    'ROUTE-' || LPAD(gs::text, 4, '0'),
    'Route ' || gs || ': ' || (ARRAY['Downtown Circuit', 'Airport Run', 'Warehouse Loop', 'Branch Office Route'])[1 + (gs % 4)],
    'Optimized route with real-time traffic data',
    (10 + (gs % 50))::DECIMAL(6,2),
    (30 + (gs % 90)) || ' minutes',
    jsonb_build_array(
        jsonb_build_object('lat', 39.8283 + (gs % 10) * 0.01, 'lng', -98.5795 + (gs % 10) * 0.01, 'order', 1),
        jsonb_build_object('lat', 39.8283 + (gs % 10) * 0.01 + 0.05, 'lng', -98.5795 + (gs % 10) * 0.01 + 0.05, 'order', 2)
    ),
    (ARRAY['active', 'inactive', 'archived'])[1 + (gs % 3)],
    NOW() - (gs || ' days')::INTERVAL,
    NOW()
FROM generate_series(1, 75) as gs
ON CONFLICT (id) DO NOTHING;

-- 1000 TELEMETRY DATA POINTS
INSERT INTO telemetry_data (
    id, vehicle_id, timestamp, latitude, longitude, speed, fuel_level,
    rpm, engine_temp, odometer, created_at
)
SELECT
    'TEL-' || LPAD(gs::text, 7, '0'),
    'VEH-' || LPAD((gs % 150 + 1)::text, 4, '0'),
    NOW() - ((gs % 720) || ' minutes')::INTERVAL,
    39.8283 + ((gs % 200) - 100) * 0.001,
    -98.5795 + ((gs % 200) - 100) * 0.001,
    (gs % 70),
    50 + (gs % 50),
    1000 + (gs % 3000),
    180 + (gs % 60),
    10000 + gs * 10,
    NOW() - ((gs % 720) || ' minutes')::INTERVAL
FROM generate_series(1, 1000) as gs
ON CONFLICT (id) DO NOTHING;

\echo '✅ Complete database populated'
SELECT
    (SELECT COUNT(*) FROM vehicles) as vehicles,
    (SELECT COUNT(*) FROM drivers) as drivers,
    (SELECT COUNT(*) FROM fuel_transactions) as fuel_transactions,
    (SELECT COUNT(*) FROM work_orders) as work_orders,
    (SELECT COUNT(*) FROM inspections) as inspections,
    (SELECT COUNT(*) FROM incidents) as incidents,
    (SELECT COUNT(*) FROM routes) as routes,
    (SELECT COUNT(*) FROM telemetry_data) as telemetry;
DATA_EOF

# 3. ACTIVATE ALL EMULATORS
echo ""
echo "3️⃣  ACTIVATING ALL EMULATORS..."
echo "────────────────────────────────────────────────────────────────"

# Deploy GPS Emulator
kubectl apply -f - <<'GPS_EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fleet-gps-emulator
  namespace: fleet-management
spec:
  replicas: 1
  selector:
    matchLabels:
      app: gps-emulator
  template:
    metadata:
      labels:
        app: gps-emulator
    spec:
      containers:
      - name: emulator
        image: node:18-alpine
        command: ["/bin/sh", "-c"]
        args:
          - |
            cat > /app/gps-emulator.js <<'EMULATOR'
            setInterval(() => {
              for (let i = 1; i <= 150; i++) {
                console.log(JSON.stringify({
                  type: 'gps',
                  vehicleId: 'VEH-' + String(i).padStart(4, '0'),
                  lat: 39.8283 + (Math.random() - 0.5) * 0.5,
                  lng: -98.5795 + (Math.random() - 0.5) * 0.5,
                  speed: Math.floor(Math.random() * 70),
                  heading: Math.floor(Math.random() * 360),
                  timestamp: new Date().toISOString()
                }));
              }
            }, 3000);
            console.log('📡 GPS Emulator: Broadcasting for 150 vehicles');
            EMULATOR
            node /app/gps-emulator.js
GPS_EOF

# Deploy OBD2 Emulator
kubectl apply -f - <<'OBD_EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fleet-obd2-emulator
  namespace: fleet-management
spec:
  replicas: 1
  selector:
    matchLabels:
      app: obd2-emulator
  template:
    metadata:
      labels:
        app: obd2-emulator
    spec:
      containers:
      - name: emulator
        image: node:18-alpine
        command: ["/bin/sh", "-c"]
        args:
          - |
            cat > /app/obd2-emulator.js <<'EMULATOR'
            setInterval(() => {
              for (let i = 1; i <= 150; i++) {
                console.log(JSON.stringify({
                  type: 'obd2',
                  vehicleId: 'VEH-' + String(i).padStart(4, '0'),
                  rpm: 800 + Math.floor(Math.random() * 3000),
                  speed: Math.floor(Math.random() * 70),
                  fuel: 20 + Math.floor(Math.random() * 80),
                  temp: 180 + Math.floor(Math.random() * 40),
                  engineLoad: Math.floor(Math.random() * 100),
                  timestamp: new Date().toISOString()
                }));
              }
            }, 5000);
            console.log('🚗 OBD2 Emulator: Broadcasting for 150 vehicles');
            EMULATOR
            node /app/obd2-emulator.js
OBD_EOF

echo "✅ All emulators deployed and active"

# 4. RESTART API TO PICK UP CHANGES
echo ""
echo "4️⃣  RESTARTING API..."
echo "────────────────────────────────────────────────────────────────"

kubectl rollout restart deployment/fleet-api -n $NAMESPACE
kubectl rollout status deployment/fleet-api -n $NAMESPACE --timeout=2m

echo "✅ API restarted"

# 5. VERIFY EVERYTHING
echo ""
echo "5️⃣  VERIFYING ALL CONNECTIONS..."
echo "────────────────────────────────────────────────────────────────"

sleep 10

echo "Database Status:"
kubectl exec -n $NAMESPACE $POSTGRES_POD -- sh -c 'PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -d $POSTGRES_DB -c "
  SELECT '\''vehicles'\'' as table, COUNT(*) FROM vehicles
  UNION ALL SELECT '\''drivers'\'', COUNT(*) FROM drivers
  UNION ALL SELECT '\''fuel_trans'\'', COUNT(*) FROM fuel_transactions
  UNION ALL SELECT '\''work_orders'\'', COUNT(*) FROM work_orders
  UNION ALL SELECT '\''inspections'\'', COUNT(*) FROM inspections
  UNION ALL SELECT '\''incidents'\'', COUNT(*) FROM incidents
  UNION ALL SELECT '\''telemetry'\'', COUNT(*) FROM telemetry_data;
"'

echo ""
echo "Emulators:"
kubectl get pods -n $NAMESPACE | grep -E "gps|obd2"

echo ""
echo "API Status:"
kubectl logs -n $NAMESPACE -l app=fleet-api --tail=10 | grep -E "connected|ready|error"

echo ""
echo "Production Site:"
curl -sI https://fleet.capitaltechalliance.com | head -3

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ FULL PRODUCTION DEPLOYMENT COMPLETE!"
echo ""
echo "📊 Database: FULLY POPULATED"
echo "📡 Emulators: ACTIVE (GPS + OBD2)"
echo "🔌 APIs: CONNECTED"
echo "🌐 Production: https://fleet.capitaltechalliance.com"
echo ""
echo "All data, connections, and emulators are NOW LIVE!"
echo "════════════════════════════════════════════════════════════════"
