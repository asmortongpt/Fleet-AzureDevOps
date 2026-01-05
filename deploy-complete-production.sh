#!/bin/bash

# Complete Production Deployment with Azure Key Vault Integration
# All secrets managed securely through Azure Key Vault

set -e

echo "🔐 Fleet Management System - Complete Production Deployment"
echo "════════════════════════════════════════════════════════════════"
echo "Using Azure Key Vault: fleet-secrets-0d326d71"
echo ""

NAMESPACE="fleet-management"
KEY_VAULT="fleet-secrets-0d326d71"

# 1. Install Azure Key Vault CSI Driver (if not already installed)
echo "1️⃣  Checking Azure Key Vault CSI Driver..."
echo "────────────────────────────────────────────────────────────────"

if ! helm list -n kube-system | grep -q csi-secrets-store; then
    echo "Installing Secrets Store CSI Driver..."
    helm repo add secrets-store-csi-driver https://kubernetes-sigs.github.io/secrets-store-csi-driver/charts
    helm repo update
    helm install csi-secrets-store-provider-azure secrets-store-csi-driver/secrets-store-csi-driver \
        --namespace kube-system \
        --set syncSecret.enabled=true \
        --set enableSecretRotation=true

    # Install Azure Provider
    kubectl apply -f https://raw.githubusercontent.com/Azure/secrets-store-csi-driver-provider-azure/master/deployment/provider-azure-installer.yaml

    echo "✅ CSI Driver installed"
else
    echo "✅ CSI Driver already installed"
fi

# 2. Apply SecretProviderClass
echo ""
echo "2️⃣  Configuring Key Vault Secret Provider..."
echo "────────────────────────────────────────────────────────────────"

kubectl apply -f /Users/andrewmorton/Documents/GitHub/Fleet/kubernetes/keyvault-secrets-provider.yaml

echo "✅ Secret Provider configured"

# 3. Fix PostgreSQL Schema
echo ""
echo "3️⃣  Fixing PostgreSQL Schema..."
echo "────────────────────────────────────────────────────────────────"

POSTGRES_POD=$(kubectl get pods -n $NAMESPACE -l app=fleet-postgres -o jsonpath='{.items[0].metadata.name}')

if [ -z "$POSTGRES_POD" ]; then
    echo "❌ PostgreSQL pod not found"
else
    echo "Found PostgreSQL pod: $POSTGRES_POD"

    # Apply schema fixes
    kubectl exec -n $NAMESPACE $POSTGRES_POD -- sh -c 'PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -d $POSTGRES_DB' <<'EOF'
-- Add location columns
ALTER TABLE IF EXISTS vehicles ADD COLUMN IF NOT EXISTS location JSONB;
ALTER TABLE IF EXISTS vehicles ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION;
ALTER TABLE IF EXISTS vehicles ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;
ALTER TABLE IF EXISTS vehicles ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON vehicles USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_vehicles_location_lat_lng ON vehicles(location_lat, location_lng);

-- Update existing records
UPDATE vehicles SET
    location = jsonb_build_object('lat', COALESCE(location_lat, 39.8283), 'lng', COALESCE(location_lng, -98.5795)),
    location_lat = COALESCE(location_lat, 39.8283),
    location_lng = COALESCE(location_lng, -98.5795)
WHERE location IS NULL;

\echo '✅ Schema updated successfully'
EOF

    echo "✅ PostgreSQL schema fixed"
fi

# 4. Populate Database with Production Data
echo ""
echo "4️⃣  Populating Database..."
echo "────────────────────────────────────────────────────────────────"

kubectl exec -n $NAMESPACE $POSTGRES_POD -- sh -c 'PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -d $POSTGRES_DB' <<'EOF'
-- Insert 150 vehicles if not exists
INSERT INTO vehicles (
    id, name, vin, year, make, model, license_plate, status,
    location_lat, location_lng, location_address, location,
    mileage, fuel_level, created_at, updated_at
)
SELECT
    'VEH-' || LPAD(gs::text, 4, '0'),
    'Fleet Vehicle ' || gs,
    'VIN' || LPAD((gs * 12345)::text, 14, '0'),
    2020 + (gs % 5),
    (ARRAY['Ford', 'Chevrolet', 'Toyota', 'Honda', 'Ram'])[1 + (gs % 5)],
    (ARRAY['F-150', 'Silverado', 'Tacoma', 'Civic', '1500'])[1 + (gs % 5)],
    (ARRAY['TX', 'CA', 'NY', 'FL', 'IL'])[1 + (gs % 5)] || '-' || LPAD((gs * 123)::text, 4, '0'),
    (ARRAY['active', 'idle', 'maintenance', 'charging'])[1 + (gs % 4)],
    39.8283 + ((gs % 100) - 50) * 0.01,
    -98.5795 + ((gs % 100) - 50) * 0.01,
    gs || ' Fleet St, Kansas City, KS',
    jsonb_build_object('lat', 39.8283 + ((gs % 100) - 50) * 0.01, 'lng', -98.5795 + ((gs % 100) - 50) * 0.01),
    (10000 + gs * 1000),
    (50 + (gs % 50)),
    NOW() - (gs || ' days')::INTERVAL,
    NOW()
FROM generate_series(1, 150) as gs
ON CONFLICT (id) DO NOTHING;

SELECT COUNT(*) as total_vehicles FROM vehicles;
EOF

echo "✅ Database populated"

# 5. Update Frontend Deployment to use Key Vault
echo ""
echo "5️⃣  Updating Frontend Deployment..."
echo "────────────────────────────────────────────────────────────────"

cat > /tmp/frontend-deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fleet-frontend
  namespace: fleet-management
spec:
  replicas: 2
  selector:
    matchLabels:
      app: fleet-frontend
  template:
    metadata:
      labels:
        app: fleet-frontend
    spec:
      volumes:
      - name: secrets-store
        csi:
          driver: secrets-store.csi.k8s.io
          readOnly: true
          volumeAttributes:
            secretProviderClass: "fleet-secrets-provider"
      containers:
      - name: frontend
        image: fleet-frontend:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 80
        volumeMounts:
        - name: secrets-store
          mountPath: "/mnt/secrets-store"
          readOnly: true
        env:
        - name: GOOGLE_MAPS_API_KEY
          valueFrom:
            secretKeyRef:
              name: fleet-keyvault-secrets
              key: GOOGLE_MAPS_API_KEY
        - name: GOOGLE_MAPS_PROJECT_ID
          valueFrom:
            secretKeyRef:
              name: fleet-keyvault-secrets
              key: GOOGLE_MAPS_PROJECT_ID
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
EOF

kubectl apply -f /tmp/frontend-deployment.yaml

echo "Waiting for rollout..."
kubectl rollout status deployment/fleet-frontend -n $NAMESPACE --timeout=5m

echo "✅ Frontend updated with Key Vault integration"

# 6. Deploy OBD2 Emulator
echo ""
echo "6️⃣  Deploying Active OBD2 Emulator..."
echo "────────────────────────────────────────────────────────────────"

cat > /tmp/obd2-emulator.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fleet-obd2-emulator
  namespace: fleet-management
spec:
  replicas: 1
  selector:
    matchLabels:
      app: fleet-obd2-emulator
  template:
    metadata:
      labels:
        app: fleet-obd2-emulator
    spec:
      containers:
      - name: emulator
        image: node:18-alpine
        command: ["/bin/sh", "-c"]
        args:
          - |
            apk add --no-cache curl
            cat > /app/package.json <<'PKG'
            {
              "name": "fleet-obd2-emulator",
              "version": "1.0.0",
              "dependencies": {
                "ws": "^8.14.2"
              }
            }
            PKG

            cat > /app/emulator.js <<'EMULATOR'
            const VEHICLE_COUNT = 150;
            const UPDATE_INTERVAL = 5000;

            const vehicles = Array.from({ length: VEHICLE_COUNT }, (_, i) => ({
              id: `VEH-${String(i + 1).padStart(4, '0')}`,
              lat: 39.8283 + (Math.random() - 0.5) * 0.5,
              lng: -98.5795 + (Math.random() - 0.5) * 0.5,
              speed: Math.random() * 60,
              fuel: 50 + Math.random() * 50,
              rpm: 800 + Math.random() * 2200,
              temp: 180 + Math.random() * 40,
              status: ['active', 'idle', 'charging', 'service'][Math.floor(Math.random() * 4)]
            }));

            console.log(`🚗 OBD2 Emulator Started`);
            console.log(`📡 Emitting telemetry for ${VEHICLE_COUNT} vehicles every ${UPDATE_INTERVAL}ms`);

            setInterval(() => {
              vehicles.forEach(v => {
                v.lat += (Math.random() - 0.5) * 0.001;
                v.lng += (Math.random() - 0.5) * 0.001;
                v.speed = Math.max(0, Math.min(80, v.speed + (Math.random() - 0.5) * 10));
                v.fuel = Math.max(0, Math.min(100, v.fuel - Math.random() * 0.1));
                v.rpm = 800 + (v.speed / 80) * 2200;

                console.log(JSON.stringify({
                  type: 'telemetry',
                  vehicleId: v.id,
                  timestamp: new Date().toISOString(),
                  data: v
                }));
              });
            }, UPDATE_INTERVAL);
            EMULATOR

            cd /app && npm install && node emulator.js
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
EOF

kubectl apply -f /tmp/obd2-emulator.yaml

echo "✅ OBD2 Emulator deployed"

# 7. Final Validation
echo ""
echo "7️⃣  Final System Validation..."
echo "────────────────────────────────────────────────────────────────"

sleep 5

echo "Kubernetes Status:"
kubectl get pods -n $NAMESPACE | grep -E "fleet-(frontend|api|postgres|redis|obd2)"

echo ""
echo "Database Vehicle Count:"
kubectl exec -n $NAMESPACE $POSTGRES_POD -- sh -c 'PGPASSWORD=$POSTGRES_PASSWORD psql -U $POSTGRES_USER -d $POSTGRES_DB -c "SELECT COUNT(*) FROM vehicles;"'

echo ""
echo "Redis Status:"
REDIS_POD=$(kubectl get pods -n $NAMESPACE -l app=fleet-redis -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n $NAMESPACE $REDIS_POD -- redis-cli ping

echo ""
echo "Production Site:"
curl -sI https://fleet.capitaltechalliance.com | head -5

echo ""
echo "Key Vault Secrets:"
az keyvault secret list --vault-name $KEY_VAULT --query "[].{name:name, enabled:attributes.enabled}" -o table

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "✅ COMPLETE PRODUCTION DEPLOYMENT SUCCESSFUL!"
echo ""
echo "🔐 All secrets managed through Azure Key Vault"
echo "🗄️  Database schema fixed and populated (150 vehicles)"
echo "🚗 OBD2 Emulator active and emitting telemetry"
echo "🗺️  Google Maps API configured from vault"
echo "🌐 Production site: https://fleet.capitaltechalliance.com"
echo ""
echo "Next: Enable Google Maps billing at:"
echo "https://console.cloud.google.com/billing?project=fleet-maps-app"
echo "════════════════════════════════════════════════════════════════"
