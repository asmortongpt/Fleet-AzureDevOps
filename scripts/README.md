# Fleet Management Scripts

Automation and monitoring tools for Fleet-Clean production deployment with emulators.

---

## 📁 Available Scripts

### 🚀 Deployment Scripts

#### `deploy-fleet-clean.sh`
**Full production deployment** - Deploys frontend, backend, and activates all emulators

```bash
# Full deployment
./scripts/deploy-fleet-clean.sh

# Skip build (use existing build)
./scripts/deploy-fleet-clean.sh --skip-build

# Start emulators only
./scripts/deploy-fleet-clean.sh --emulators-only

# Show help
./scripts/deploy-fleet-clean.sh --help
```

**Environment Variables:**
- `AZURE_STATIC_WEB_APPS_API_TOKEN` - Deployment token (required)
- `VEHICLE_COUNT` - Number of vehicles to emulate (default: 50)
- `GOOGLE_MAPS_API_KEY` - Google Maps API key
- `RESOURCE_GROUP` - Azure resource group name
- `API_BASE_URL` - Production API URL

#### `deploy-production-emulators.sh`
**Emulator activation only** - Starts emulators in already-deployed environment

```bash
# Set environment
export API_BASE_URL="https://proud-bay-0fdc8040f.3.azurestaticapps.net/api"
export VEHICLE_COUNT=50

# Run script
./scripts/deploy-production-emulators.sh
```

**Features:**
- ✅ API health check with retries
- ✅ Emulator activation
- ✅ Status verification
- ✅ Comprehensive reporting
- ✅ Color-coded output

---

### 📊 Monitoring Scripts

#### `monitor-emulators.sh`
**Real-time monitoring dashboard** - Live view of emulator system status

```bash
# Monitor with defaults
./scripts/monitor-emulators.sh

# Custom API URL
./scripts/monitor-emulators.sh -u https://custom-api.com/api

# Custom refresh interval (10 seconds)
./scripts/monitor-emulators.sh -i 10

# Show help
./scripts/monitor-emulators.sh --help
```

**Features:**
- ✅ Real-time system status
- ✅ Live statistics (vehicles, events, memory)
- ✅ Active vehicle count
- ✅ Emulator types display
- ✅ Auto-refresh every 5 seconds
- ✅ Color-coded status indicators

**Screenshot:**
```
╔════════════════════════════════════════════════════════════════╗
║        Fleet Emulator Monitoring Dashboard                     ║
╠════════════════════════════════════════════════════════════════╣
║ API: https://proud-bay-0fdc8040f.3.azurestaticapps.net/api
║ Updated: 2026-01-17 10:30:00
╚════════════════════════════════════════════════════════════════╝

═══ System Status ═══
Status: ● RUNNING

═══ Statistics ═══
Total Vehicles:    50
Active Vehicles:   50
Total Events:      152,340
Events/Second:     125.5
Memory Usage:      342.5 MB
Uptime:            7200s

═══ Vehicles (50) ═══
  vehicle-1    │ Toyota Camry      │ sedan
  vehicle-2    │ Honda Accord      │ sedan
  ...
```

---

### 🧪 Testing Scripts

#### `test-emulator-api.sh`
**Comprehensive API test suite** - Tests all emulator endpoints

```bash
# Run all tests
./scripts/test-emulator-api.sh

# Test custom API
./scripts/test-emulator-api.sh -u https://custom-api.com/api

# Show help
./scripts/test-emulator-api.sh --help
```

**Tests Included:**
- ✅ API health check
- ✅ Emulator status
- ✅ Vehicle list and details
- ✅ Real-time telemetry
- ✅ Telemetry history (GPS, OBD2)
- ✅ Fleet overview
- ✅ Fleet positions
- ✅ Routes and geofences
- ✅ Video emulator
- ✅ Radio channels
- ✅ Inventory

**Output Example:**
```
╔════════════════════════════════════════════════════════════════╗
║           Fleet Emulator API Test Suite                       ║
╠════════════════════════════════════════════════════════════════╣
║ API: https://proud-bay-0fdc8040f.3.azurestaticapps.net/api
╚════════════════════════════════════════════════════════════════╝

[TEST] API Health Check
[PASS] API Health Check (HTTP 200)
{
  "status": "healthy",
  "timestamp": "2026-01-17T10:30:00Z"
}

[TEST] Emulator Status
[PASS] Emulator Status (HTTP 200)
{
  "isRunning": true,
  "stats": {
    "totalVehicles": 50,
    "activeVehicles": 50
  }
}

╔════════════════════════════════════════════════════════════════╗
║                     Test Summary                               ║
╠════════════════════════════════════════════════════════════════╣
║ Total Tests:   20
║ Passed:        20
║ Failed:        0
╚════════════════════════════════════════════════════════════════╝

✅ All tests passed!
```

---

## 🛠️ Prerequisites

All scripts require:

```bash
# jq (JSON processor)
brew install jq              # macOS
sudo apt-get install jq      # Ubuntu/Debian

# curl (HTTP client)
# Usually pre-installed

# Azure CLI (for deployment scripts)
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Node.js (for deployment scripts)
# v20+ required
```

---

## 📖 Quick Start Guide

### 1. Deploy to Production

```bash
# Set required environment variables
export AZURE_STATIC_WEB_APPS_API_TOKEN="<your-token>"
export VEHICLE_COUNT=50

# Deploy
./scripts/deploy-fleet-clean.sh
```

### 2. Monitor Emulators

```bash
# Start monitoring dashboard
./scripts/monitor-emulators.sh
```

### 3. Run Tests

```bash
# Test all endpoints
./scripts/test-emulator-api.sh
```

### 4. Activate Emulators (if needed)

```bash
# Start emulators manually
export API_BASE_URL="https://proud-bay-0fdc8040f.3.azurestaticapps.net/api"
./scripts/deploy-production-emulators.sh
```

---

## 🔧 Troubleshooting

### Script Permissions

If you get "Permission denied":
```bash
chmod +x scripts/*.sh
```

### jq Not Found

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install jq

# Windows (via Chocolatey)
choco install jq
```

### API Connection Issues

```bash
# Test API connectivity
curl https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/health

# Check emulator status
curl https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/status
```

---

## 📚 Additional Resources

- **Deployment Guide:** `../PRODUCTION_DEPLOYMENT_GUIDE.md`
- **API Examples:** `../EMULATOR_API_EXAMPLES.md`
- **Summary:** `../DEPLOYMENT_SUMMARY.md`
- **Azure Pipeline:** `../azure-pipelines-emulator-production.yml`

---

## 🎯 Common Workflows

### Daily Monitoring

```bash
# Start monitoring dashboard in one terminal
./scripts/monitor-emulators.sh

# In another terminal, run periodic tests
watch -n 300 ./scripts/test-emulator-api.sh
```

### After Deployment

```bash
# 1. Wait for deployment to complete (~30 minutes)
# 2. Test API
./scripts/test-emulator-api.sh

# 3. Start monitoring
./scripts/monitor-emulators.sh
```

### Troubleshooting Deployment

```bash
# 1. Check API health
curl $API_BASE_URL/health

# 2. Run diagnostic tests
./scripts/test-emulator-api.sh

# 3. Manually restart emulators
./scripts/deploy-production-emulators.sh
```

---

**Last Updated:** January 17, 2026
**Maintainer:** andrew.m@capitaltechalliance.com
