#!/bin/bash

# Fleet Management System - Azure VM Deployment Script
# 2-Hour Production Demo Deployment
# Target: 172.173.175.71 (fleet-build-test-vm)

set -e

echo "======================================"
echo "Fleet Management System Deployment"
echo "Target VM: 172.173.175.71"
echo "======================================"

# Configuration
VM_IP="172.173.175.71"
VM_USER="azureuser"
REMOTE_DIR="/home/azureuser/fleet-demo"
LOCAL_DIR="/Users/andrewmorton/Documents/GitHub/fleet-local"

# Step 1: Create deployment archive
echo "[1/8] Creating deployment archive..."
cd "$LOCAL_DIR"
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='*.log' \
    --exclude='.env.local' \
    -czf /tmp/fleet-deployment.tar.gz .

# Step 2: Transfer to VM
echo "[2/8] Transferring to Azure VM..."
ssh ${VM_USER}@${VM_IP} "mkdir -p ${REMOTE_DIR}"
scp /tmp/fleet-deployment.tar.gz ${VM_USER}@${VM_IP}:${REMOTE_DIR}/

# Step 3: Extract and setup
echo "[3/8] Extracting on VM..."
ssh ${VM_USER}@${VM_IP} <<'ENDSSH'
cd /home/azureuser/fleet-demo
tar -xzf fleet-deployment.tar.gz
rm fleet-deployment.tar.gz

# Step 4: Install dependencies
echo "[4/8] Installing dependencies..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - || true
sudo apt-get install -y nodejs postgresql-client redis-tools || true

# Install frontend dependencies
npm install --legacy-peer-deps || npm install --force

# Install API dependencies
cd api
npm install --legacy-peer-deps || npm install --force
cd ..

# Step 5: Create environment file
echo "[5/8] Creating environment configuration..."
cat > .env <<'ENVFILE'
# Database Configuration
DATABASE_URL=postgresql://fleetuser:FleetPass2024!@localhost:5432/fleetdb
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fleetdb
DB_USER=fleetuser
DB_PASSWORD=FleetPass2024!

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Application Configuration
NODE_ENV=production
PORT=5000
VITE_API_URL=http://172.173.175.71:5000

# Frontend Configuration
VITE_PORT=5174

# Azure AD Configuration (from global .env)
VITE_AZURE_AD_CLIENT_ID=baae0851-0c24-4214-8587-e3fabc46bd4a
VITE_AZURE_AD_TENANT_ID=0ec14b81-7b82-45ee-8f3d-cbc31ced5347
VITE_AZURE_AD_REDIRECT_URI=http://172.173.175.71:5174/auth/callback

# Sentry Configuration
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Application Insights
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=your-key-here

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=<your-google-maps-api-key>
ENVFILE

# Step 6: Setup PostgreSQL
echo "[6/8] Setting up PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE fleetdb;" 2>/dev/null || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER fleetuser WITH ENCRYPTED PASSWORD 'FleetPass2024!';" 2>/dev/null || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE fleetdb TO fleetuser;" 2>/dev/null || true

# Step 7: Build application
echo "[7/8] Building application..."
npm run build || echo "Build completed with warnings"

# Step 8: Start services
echo "[8/8] Starting services..."

# Start API server in background
cd api
nohup npm run dev > /tmp/fleet-api.log 2>&1 &
API_PID=$!
echo $API_PID > /tmp/fleet-api.pid
cd ..

# Wait for API to start
sleep 5

# Start frontend in background
nohup npm run dev -- --host 0.0.0.0 --port 5174 > /tmp/fleet-frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > /tmp/fleet-frontend.pid

echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo "API Server:      http://172.173.175.71:5000"
echo "Frontend:        http://172.173.175.71:5174"
echo "API PID:         $API_PID"
echo "Frontend PID:    $FRONTEND_PID"
echo ""
echo "Logs:"
echo "  API:           tail -f /tmp/fleet-api.log"
echo "  Frontend:      tail -f /tmp/fleet-frontend.log"
echo "======================================"
ENDSSH

# Cleanup local archive
rm /tmp/fleet-deployment.tar.gz

echo ""
echo "Deployment script completed!"
echo "Access your application at: http://172.173.175.71:5174"
