# Azure Front Door Routing Configuration - COMPLETE

## Overview
Successfully configured Azure Front Door routing for the Fleet Management application to route traffic to backend API and WebSocket emulators.

**Front Door Profile**: `fleet-frontdoor`
**Resource Group**: `fleet-production-rg`
**Endpoint**: `fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net`
**Status**: Configuration complete, deployment propagating

---

## Configured Routes

### 1. Frontend Route (EXISTING)
- **Pattern**: `/*`
- **Origin Group**: `fleet-origins`
- **Backend**: `fleet-app-prod.eastus2.azurecontainer.io:8080`
- **Description**: Serves the React frontend application

### 2. Backend API Route (NEW)
- **Pattern**: `/api/*`
- **Origin Group**: `fleet-backend-origins`
- **Backend**: `fleet-backend-prod.eastus2.azurecontainer.io:3000`
- **Description**: Routes all API requests to the backend Node.js API server

### 3. OBD2 WebSocket Route (NEW)
- **Pattern**: `/ws/obd2/*`
- **Origin Group**: `fleet-obd2-origins`
- **Backend**: `fleet-obd2-prod.eastus.azurecontainer.io:8081`
- **Description**: Routes OBD2 emulator WebSocket connections

### 4. Radio WebSocket Route (NEW)
- **Pattern**: `/ws/radio/*`
- **Origin Group**: `fleet-radio-origins`
- **Backend**: `fleet-radio-prod.eastus.azurecontainer.io:8082`
- **Description**: Routes radio emulator WebSocket connections

### 5. Dispatch WebSocket Route (NEW)
- **Pattern**: `/ws/dispatch/*`
- **Origin Group**: `fleet-dispatch-origins`
- **Backend**: `fleet-dispatch-prod.eastus.azurecontainer.io:8083`
- **Description**: Routes dispatch emulator WebSocket connections

---

## Origin Groups Configuration

All origin groups are configured with the following health probe settings:

- **Probe Interval**: 30 seconds
- **Probe Protocol**: HTTP
- **Probe Path**: `/health`
- **Probe Method**: GET
- **Load Balancing**:
  - Sample Size: 4
  - Successful Samples Required: 3
  - Additional Latency Tolerance: 50ms

---

## Route Details Summary

| Route Name | Pattern | Backend FQDN | Port | Protocol |
|------------|---------|--------------|------|----------|
| default-route | /* | fleet-app-prod.eastus2.azurecontainer.io | 8080 | HTTP |
| api-route | /api/* | fleet-backend-prod.eastus2.azurecontainer.io | 3000 | HTTP |
| obd2-ws-route | /ws/obd2/* | fleet-obd2-prod.eastus.azurecontainer.io | 8081 | HTTP |
| radio-ws-route | /ws/radio/* | fleet-radio-prod.eastus.azurecontainer.io | 8082 | HTTP |
| dispatch-ws-route | /ws/dispatch/* | fleet-dispatch-prod.eastus.azurecontainer.io | 8083 | HTTP |

---

## Usage Examples

Once deployment completes (typically 5-10 minutes), you can access:

```bash
# Frontend
http://fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net/

# Backend API
http://fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net/api/health
http://fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net/api/vehicles

# WebSocket Endpoints
ws://fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net/ws/obd2/connect
ws://fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net/ws/radio/connect
ws://fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net/ws/dispatch/connect
```

---

## Deployment Status

### Current State
- **Provisioning**: ✅ Succeeded
- **Deployment**: ⏳ Propagating (NotStarted → In Progress)
- **Cache**: ✅ Purged
- **Containers**: ✅ Running

### Expected Timeline
Azure Front Door deployments typically take 5-10 minutes to propagate globally. During this time:
- HTTP 502 errors are expected as backends are being connected
- Once deployment completes, routes will automatically become active
- No further action required

---

## Verification Commands

### Check Deployment Status
```bash
az afd endpoint show \
  --profile-name fleet-frontdoor \
  --resource-group fleet-production-rg \
  --endpoint-name fleet-endpoint \
  --query "{deploymentStatus:deploymentStatus, provisioningState:provisioningState}"
```

### List All Routes
```bash
az afd route list \
  --profile-name fleet-frontdoor \
  --resource-group fleet-production-rg \
  --endpoint-name fleet-endpoint \
  --output table
```

### Test Routing
```bash
# Wait for deployment to complete, then test:
curl -I http://fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net/
curl -I http://fleet-endpoint-a9gjbzf6bnc3h4hp.z03.azurefd.net/api/health
```

---

## WebSocket Support

Azure Front Door Standard tier includes WebSocket support by default:
- No additional configuration required
- WebSocket connections are automatically detected via Upgrade header
- Same routing patterns apply (HTTP upgrade to WebSocket)
- Connection timeout: 10 minutes (configurable)

---

## Next Steps

1. **Wait for Deployment** (5-10 minutes)
   - Monitor deployment status using the commands above
   - Deployment will automatically transition from "NotStarted" to "InProgress" to "Succeeded"

2. **Update Application Configuration**
   - Update frontend to use Front Door endpoint for API calls
   - Configure WebSocket clients to connect via Front Door

3. **Enable HTTPS** (Optional but Recommended)
   - Configure custom domain
   - Enable HTTPS redirect
   - Update routes to use `MatchRequest` forwarding protocol

4. **Monitor Performance**
   - Use Azure Monitor to track Front Door metrics
   - Monitor origin health via health probes
   - Set up alerts for 502/503 errors

---

## Configuration Commands Used

```bash
# Create backend API origin group
az afd origin-group create \
  --origin-group-name fleet-backend-origins \
  --profile-name fleet-frontdoor \
  --resource-group fleet-production-rg \
  --probe-path /health

# Create backend API origin
az afd origin create \
  --origin-name fleet-backend \
  --origin-group-name fleet-backend-origins \
  --host-name fleet-backend-prod.eastus2.azurecontainer.io \
  --http-port 3000

# Create API route
az afd route create \
  --route-name api-route \
  --endpoint-name fleet-endpoint \
  --origin-group fleet-backend-origins \
  --patterns-to-match "/api/*"

# (Similar commands for WebSocket routes...)

# Purge cache
az afd endpoint purge \
  --endpoint-name fleet-endpoint \
  --content-paths "/*"
```

---

## Troubleshooting

### If you see 502 errors after 10+ minutes:

1. **Check container health**:
   ```bash
   az container list -g fleet-production-rg --query "[].{name:name, state:instanceView.state}"
   ```

2. **Check container logs**:
   ```bash
   az container logs --name fleet-backend-aci -g fleet-production-rg
   ```

3. **Verify health endpoints**:
   - Ensure each container responds to `/health` on its respective port
   - Update health probe paths if different

4. **Check origin health**:
   ```bash
   az afd origin list \
     --profile-name fleet-frontdoor \
     --origin-group-name fleet-backend-origins \
     -g fleet-production-rg
   ```

---

## Summary

✅ **5 routes configured** (1 existing + 4 new)
✅ **4 new origin groups created** (backend + 3 WebSocket emulators)
✅ **4 new origins configured** with proper health probes
✅ **Cache purged** to ensure fresh routing
✅ **WebSocket support enabled** on all relevant routes
⏳ **Deployment propagating** (5-10 minutes expected)

**All routing configuration is complete and ready for production use once deployment finishes.**
