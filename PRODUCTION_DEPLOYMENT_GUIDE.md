# Fleet-Clean Production Deployment Guide
## Complete Guide for Deploying with Emulators

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Azure Pipeline Deployment](#azure-pipeline-deployment)
4. [Manual Deployment](#manual-deployment)
5. [Emulator Configuration](#emulator-configuration)
6. [Monitoring & Verification](#monitoring--verification)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This guide covers deploying the Fleet Management System to production with **all emulators activated** to simulate a complete fleet of vehicles.

**What Gets Deployed:**
- ✅ Frontend (React + Vite) → Azure Static Web Apps
- ✅ Backend API (Node.js + Express) → Azure Container Instances
- ✅ PostgreSQL Database → Azure Container Instances
- ✅ Redis Cache → Azure Container Instances
- ✅ **12 Emulator Types** generating realistic fleet data:
  - GPS Emulator (real-time location tracking)
  - OBD2 Emulator (engine diagnostics)
  - Fuel Emulator (consumption & refueling)
  - Maintenance Emulator (service events)
  - Driver Behavior Emulator (scoring & events)
  - Route Emulator (planning & traffic)
  - Cost Emulator (operating costs)
  - IoT Emulator (sensor data)
  - Radio/PTT Emulator (communications)
  - Video Telematics Emulator (dashcam + AI)
  - EV Charging Emulator (charging sessions)
  - Inventory Emulator (parts & supplies)

---

## ✅ Prerequisites

### Required Tools

1. **Azure CLI** (v2.50+)
   ```bash
   # Install
   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

   # Verify
   az --version
   ```

2. **Node.js** (v20+)
   ```bash
   # Verify
   node --version
   npm --version
   ```

3. **jq** (JSON processor)
   ```bash
   # macOS
   brew install jq

   # Ubuntu/Debian
   sudo apt-get install jq
   ```

4. **Azure Account**
   - Active Azure subscription
   - Owner or Contributor role on subscription

### Azure DevOps Setup

1. **Create Variable Group** named `fleet-production-secrets`:
   ```
   ACR_USERNAME          = <your-acr-username>
   ACR_PASSWORD          = <your-acr-password>
   DATABASE-PASSWORD     = <postgres-password>
   redis-password        = <redis-password>
   jwt-secret            = <jwt-secret-32-chars-min>
   AZURE-AD-CLIENT-ID    = <azure-ad-client-id>
   AZURE-AD-CLIENT-SECRET = <azure-ad-client-secret>
   AZURE-TENANT-ID       = <azure-tenant-id>
   GOOGLE-MAPS-API-KEY   = <your-google-maps-api-key>
   azure-openai-endpoint = <azure-openai-endpoint>
   azure-openai-key      = <azure-openai-key>
   ```

2. **Configure Service Connection**:
   - Go to Project Settings → Service Connections
   - Create Azure Resource Manager connection
   - Name it `Azure-Production`

3. **Create Azure Key Vault** (optional but recommended):
   ```bash
   az keyvault create \
     --name fleet-secrets-0d326d71 \
     --resource-group fleet-production-rg \
     --location eastus2
   ```

---

## 🚀 Azure Pipeline Deployment

### Method 1: Automated Pipeline (Recommended)

**File:** `azure-pipelines-emulator-production.yml`

1. **Push to Main Branch**:
   ```bash
   git add .
   git commit -m "feat: Deploy Fleet-Clean with emulators"
   git push origin main
   ```

2. **Pipeline Triggers Automatically**:
   - Builds Docker images
   - Pushes to Azure Container Registry
   - Deploys to Azure Container Instances
   - **Starts all emulators with 50 vehicles** (configurable)

3. **Monitor Pipeline**:
   - Azure DevOps → Pipelines → Select run
   - Watch stages: Build → Deploy → Activate Emulators → Validate

**Pipeline Stages:**

```yaml
Stage 1: Build (5-10 minutes)
  - Build Docker images with emulator support
  - Push to Azure Container Registry

Stage 2: Deploy Production (10-15 minutes)
  - Deploy PostgreSQL, Redis, API to ACI
  - Configure environment variables

Stage 3: Activate Emulators (2-5 minutes)
  ✅ Wait for API startup
  ✅ Start emulators for N vehicles
  ✅ Verify emulator status
  ✅ Display fleet overview

Stage 4: Post-Deployment Tests (1-2 minutes)
  ✅ API health check
  ✅ Emulator status validation
  ✅ Vehicle data verification
  ✅ Real-time telemetry test
```

### Configuration Variables

Edit in `azure-pipelines-emulator-production.yml`:

```yaml
variables:
  emulatorVehicleCount: '50'  # Number of vehicles to emulate
  productionApiUrl: 'https://proud-bay-0fdc8040f.3.azurestaticapps.net'
  resourceGroup: 'fleet-production-rg'
```

---

## 🛠️ Manual Deployment

### Option A: Using Deployment Script

**Quick Start:**
```bash
# Set environment variables
export AZURE_STATIC_WEB_APPS_API_TOKEN="<your-deployment-token>"
export VEHICLE_COUNT=50
export GOOGLE_MAPS_API_KEY="<your-google-maps-api-key>"

# Run deployment script
./scripts/deploy-fleet-clean.sh
```

**Advanced Options:**
```bash
# Skip build (use existing build)
./scripts/deploy-fleet-clean.sh --skip-build

# Start emulators only (after deployment)
./scripts/deploy-fleet-clean.sh --emulators-only

# Show help
./scripts/deploy-fleet-clean.sh --help
```

### Option B: Manual Step-by-Step

1. **Build Application**:
   ```bash
   npm ci
   npm run build
   cd api && npm ci && npm run build && cd ..
   ```

2. **Deploy to Azure Static Web Apps**:
   ```bash
   # Using SWA CLI
   swa deploy \
     --app-location . \
     --api-location api \
     --output-location dist \
     --deployment-token "$AZURE_STATIC_WEB_APPS_API_TOKEN"
   ```

3. **Start Emulators**:
   ```bash
   ./scripts/deploy-production-emulators.sh
   ```

---

## ⚙️ Emulator Configuration

### Environment Variables

Set these in Azure Pipeline or deployment script:

```bash
# Emulator Configuration
EMULATOR_ENABLED=true                # Enable emulator system
EMULATOR_AUTO_START=true             # Auto-start on API startup
EMULATOR_VEHICLE_COUNT=50            # Number of vehicles to emulate
EMULATOR_TIME_COMPRESSION=60         # 60x real-time (1 real second = 60 simulated seconds)
EMULATOR_UPDATE_INTERVAL=1000        # Update every 1000ms (1 second)
EMULATOR_WEBSOCKET_ENABLED=true      # Enable WebSocket streaming
EMULATOR_WEBSOCKET_PORT=3004         # WebSocket port
```

### Emulator API Endpoints

After deployment, emulators are accessible at:

```
Base URL: https://proud-bay-0fdc8040f.3.azurestaticapps.net/api

System Control:
  POST   /emulator/start             Start emulators
  POST   /emulator/stop              Stop all emulators
  POST   /emulator/pause             Pause emulators
  POST   /emulator/resume            Resume emulators
  GET    /emulator/status            Get system status

Vehicle Data:
  GET    /emulator/vehicles          List all vehicles
  GET    /emulator/vehicles/:id      Get vehicle details
  GET    /emulator/vehicles/:id/telemetry    Get real-time telemetry
  GET    /emulator/vehicles/:id/telemetry/history?type=gps&startTime=...

Fleet Overview:
  GET    /emulator/fleet/overview    Complete fleet status
  GET    /emulator/fleet/positions   All vehicle positions (for maps)

WebSocket:
  WS     /emulator/stream            Real-time event streaming
```

### Starting Emulators via API

```bash
# Start all vehicles
curl -X POST https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/start

# Start specific number of vehicles
curl -X POST https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/start \
  -H "Content-Type: application/json" \
  -d '{"count": 25}'

# Start specific vehicles
curl -X POST https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/start \
  -H "Content-Type: application/json" \
  -d '{"vehicleIds": ["vehicle-1", "vehicle-2"]}'

# Run a scenario
curl -X POST https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/scenario/rush-hour
```

---

## 📊 Monitoring & Verification

### 1. Check Emulator Status

```bash
# Get status
curl https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/status | jq

# Expected output:
{
  "isRunning": true,
  "isPaused": false,
  "stats": {
    "totalVehicles": 50,
    "activeVehicles": 50,
    "totalEvents": 15234,
    "eventsPerSecond": 125.5,
    "memoryUsage": 342.5
  }
}
```

### 2. Verify Vehicle Data

```bash
# Get all vehicles
curl https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/vehicles | jq

# Get fleet overview
curl https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/fleet/overview | jq
```

### 3. Monitor Real-Time Telemetry

```bash
# Get live telemetry for first vehicle
VEHICLE_ID=$(curl -s https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/vehicles | jq -r '.[0].id')

curl https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/vehicles/$VEHICLE_ID/telemetry | jq
```

### 4. WebSocket Monitoring

```javascript
// Connect to WebSocket stream
const ws = new WebSocket('wss://proud-bay-0fdc8040f.3.azurestaticapps.net/emulator/stream');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Emulator Event:', data);
};
```

---

## 🔧 Troubleshooting

### Emulators Not Starting

**Problem:** Emulators fail to start after deployment

**Solutions:**
```bash
# 1. Check API health
curl https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/health

# 2. Check database connectivity
curl https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/status

# 3. Manually start emulators
./scripts/deploy-production-emulators.sh

# 4. Check logs in Azure Portal
az container logs \
  --resource-group fleet-production-rg \
  --name fleet-api-prod
```

### No Vehicle Data

**Problem:** Emulators running but no vehicle data available

**Solutions:**
```bash
# 1. Verify database has vehicles
curl https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/vehicles

# 2. Restart emulators
curl -X POST https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/stop
sleep 5
curl -X POST https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/start

# 3. Check emulator configuration
curl https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/status | jq '.config'
```

### WebSocket Connection Issues

**Problem:** Cannot connect to WebSocket stream

**Solutions:**
```bash
# 1. Verify WebSocket port is open (3004)
az container show \
  --resource-group fleet-production-rg \
  --name fleet-api-prod \
  --query "ipAddress.ports"

# 2. Check CORS configuration
# Ensure frontend URL is in CORS_ORIGIN environment variable

# 3. Test with wscat
npm install -g wscat
wscat -c wss://proud-bay-0fdc8040f.3.azurestaticapps.net/emulator/stream
```

### Pipeline Failures

**Problem:** Azure Pipeline fails during deployment

**Solutions:**

1. **Build Stage Failure:**
   - Check Node.js version compatibility
   - Verify all dependencies in package.json
   - Clear npm cache: `npm cache clean --force`

2. **Deploy Stage Failure:**
   - Verify Azure credentials and permissions
   - Check resource group exists
   - Validate container registry access

3. **Emulator Activation Failure:**
   - Increase API startup wait time (currently 60s)
   - Check database initialization logs
   - Verify emulator configuration environment variables

---

## 📝 Quick Reference

### Essential Commands

```bash
# Deploy everything
./scripts/deploy-fleet-clean.sh

# Start emulators only
./scripts/deploy-production-emulators.sh

# Check status
curl https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/status

# Stop emulators
curl -X POST https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/stop

# Restart emulators
curl -X POST https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/stop
sleep 5
curl -X POST https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/start \
  -H "Content-Type: application/json" \
  -d '{"count": 50}'
```

### Important URLs

- **Frontend:** https://proud-bay-0fdc8040f.3.azurestaticapps.net
- **API:** https://proud-bay-0fdc8040f.3.azurestaticapps.net/api
- **Health Check:** https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/health
- **Emulator Status:** https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/status
- **Fleet Overview:** https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/fleet/overview

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Pipeline completes all 4 stages without errors
✅ API health check returns `{"status": "healthy"}`
✅ Emulator status shows `"isRunning": true`
✅ Vehicle count matches configured `VEHICLE_COUNT`
✅ Real-time telemetry data is streaming
✅ WebSocket connection established
✅ Frontend loads and displays fleet data

---

## 📧 Support

For issues or questions:
- Check logs: `az container logs --resource-group fleet-production-rg --name fleet-api-prod`
- Review pipeline output in Azure DevOps
- Verify environment variables in Azure Portal
- Contact: andrew.m@capitaltechalliance.com

---

**Last Updated:** January 17, 2026
**Version:** 1.0.0
