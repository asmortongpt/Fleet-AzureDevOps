# Fleet Emulator Deployment Summary

All three emulators have been successfully built and deployed to Azure Container Instances.

## Deployment Details

### 1. OBD2 Emulator

**Container Name:** `fleet-obd2-aci`
**Image:** `fleetacr.azurecr.io/fleet-obd2:latest`
**Port:** 8081
**Status:** Running ✅

**Endpoints:**
- **FQDN:** `fleet-obd2-prod.eastus.azurecontainer.io`
- **IP Address:** `20.124.153.213`
- **WebSocket URL:** `ws://fleet-obd2-prod.eastus.azurecontainer.io:8081`
- **HTTP URL:** `http://fleet-obd2-prod.eastus.azurecontainer.io:8081`

**Features:**
- Emits realistic vehicle telemetry every 1 second
- Data includes: speed, RPM, fuel level, engine temp, odometer, battery voltage, engine load, throttle position, coolant temp, air intake temp, MAF, fuel trim
- Uses Socket.IO for real-time communication

---

### 2. Radio Emulator

**Container Name:** `fleet-radio-aci`
**Image:** `fleetacr.azurecr.io/fleet-radio:latest`
**Port:** 8082
**Status:** Running ✅

**Endpoints:**
- **FQDN:** `fleet-radio-prod.eastus.azurecontainer.io`
- **IP Address:** `20.241.223.28`
- **WebSocket URL:** `ws://fleet-radio-prod.eastus.azurecontainer.io:8082`
- **HTTP URL:** `http://fleet-radio-prod.eastus.azurecontainer.io:8082`

**Features:**
- Emits radio transmissions every 5 seconds
- Supports multiple channels: Channel 1, Channel 2, Channel 3, Emergency
- Call signs: Alpha-1, Bravo-2, Charlie-3, Delta-4, Echo-5
- Push-to-talk (PTT) event handling
- Channel change event handling
- Uses Socket.IO for real-time communication

---

### 3. Dispatch Emulator

**Container Name:** `fleet-dispatch-aci`
**Image:** `fleetacr.azurecr.io/fleet-dispatch:latest`
**Port:** 8083
**Status:** Running ✅

**Endpoints:**
- **FQDN:** `fleet-dispatch-prod.eastus.azurecontainer.io`
- **IP Address:** `57.152.94.177`
- **WebSocket URL:** `ws://fleet-dispatch-prod.eastus.azurecontainer.io:8083`
- **HTTP URL:** `http://fleet-dispatch-prod.eastus.azurecontainer.io:8083`

**Features:**
- Emits dispatch events every 10 seconds
- Event types: call, assignment, status_update, alert, clear, enroute
- Priority levels: low, normal, high, critical
- Location data with latitude, longitude, and addresses
- Event acknowledgment handling
- Status update broadcasting
- Uses Socket.IO for real-time communication

---

## Azure Resources

**Resource Group:** `fleet-production-rg`
**Location:** `eastus`
**Container Registry:** `fleetacr.azurecr.io`

**Container Configuration:**
- **CPU:** 1 core per container
- **Memory:** 1 GB per container
- **OS Type:** Linux (Alpine-based Node.js 20)
- **Restart Policy:** Always
- **Network:** Public IP with DNS labels

---

## Production Dockerfiles

Created optimized production Dockerfiles:
- `server/emulators/Dockerfile.obd2.prod`
- `server/emulators/Dockerfile.radio.prod`
- `server/emulators/Dockerfile.dispatch.prod`

**Optimizations:**
- Lightweight Node.js 20 Alpine base image
- Minimal dependencies (only socket.io@4.8.1)
- Non-root user execution for security
- No Python/build tools required

---

## Connection Instructions

### For JavaScript/Node.js Clients

```javascript
const io = require('socket.io-client');

// Connect to OBD2 Emulator
const obd2Socket = io('http://fleet-obd2-prod.eastus.azurecontainer.io:8081');
obd2Socket.on('telemetry', (data) => {
  console.log('Vehicle telemetry:', data);
});

// Connect to Radio Emulator
const radioSocket = io('http://fleet-radio-prod.eastus.azurecontainer.io:8082');
radioSocket.on('transmission', (data) => {
  console.log('Radio transmission:', data);
});

// Connect to Dispatch Emulator
const dispatchSocket = io('http://fleet-dispatch-prod.eastus.azurecontainer.io:8083');
dispatchSocket.on('event', (data) => {
  console.log('Dispatch event:', data);
});
```

### For Browser-Based Clients

```html
<script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
<script>
  // Connect to OBD2 Emulator
  const obd2Socket = io('http://fleet-obd2-prod.eastus.azurecontainer.io:8081');

  // Connect to Radio Emulator
  const radioSocket = io('http://fleet-radio-prod.eastus.azurecontainer.io:8082');

  // Connect to Dispatch Emulator
  const dispatchSocket = io('http://fleet-dispatch-prod.eastus.azurecontainer.io:8083');
</script>
```

---

## Management Commands

### View Container Status
```bash
az container show --resource-group fleet-production-rg --name fleet-obd2-aci
az container show --resource-group fleet-production-rg --name fleet-radio-aci
az container show --resource-group fleet-production-rg --name fleet-dispatch-aci
```

### View Container Logs
```bash
az container logs --resource-group fleet-production-rg --name fleet-obd2-aci
az container logs --resource-group fleet-production-rg --name fleet-radio-aci
az container logs --resource-group fleet-production-rg --name fleet-dispatch-aci
```

### Restart Containers
```bash
az container restart --resource-group fleet-production-rg --name fleet-obd2-aci
az container restart --resource-group fleet-production-rg --name fleet-radio-aci
az container restart --resource-group fleet-production-rg --name fleet-dispatch-aci
```

### Stop Containers
```bash
az container stop --resource-group fleet-production-rg --name fleet-obd2-aci
az container stop --resource-group fleet-production-rg --name fleet-radio-aci
az container stop --resource-group fleet-production-rg --name fleet-dispatch-aci
```

### Delete Containers
```bash
az container delete --resource-group fleet-production-rg --name fleet-obd2-aci --yes
az container delete --resource-group fleet-production-rg --name fleet-radio-aci --yes
az container delete --resource-group fleet-production-rg --name fleet-dispatch-aci --yes
```

---

## Rebuild and Redeploy

### Rebuild Images
```bash
cd /path/to/fleet-local/server/emulators

az acr build --registry fleetacr --image fleet-obd2:latest --file Dockerfile.obd2.prod .
az acr build --registry fleetacr --image fleet-radio:latest --file Dockerfile.radio.prod .
az acr build --registry fleetacr --image fleet-dispatch:latest --file Dockerfile.dispatch.prod .
```

### Redeploy Containers
After rebuilding, restart the containers to pull the latest images:
```bash
az container restart --resource-group fleet-production-rg --name fleet-obd2-aci
az container restart --resource-group fleet-production-rg --name fleet-radio-aci
az container restart --resource-group fleet-production-rg --name fleet-dispatch-aci
```

---

## Cost Estimation

**Per Container:**
- 1 vCPU, 1 GB RAM
- Estimated cost: ~$35-45/month per container
- Total for all 3 emulators: ~$105-135/month

**Note:** Actual costs may vary based on:
- Network egress (data transfer out)
- Running time (billed per second)
- Azure region pricing

---

## Security Considerations

1. **Public Access:** All emulators are publicly accessible via HTTP/WebSocket
2. **No Authentication:** Current implementation has no authentication layer
3. **CORS:** Configured to allow all origins (`*`)

**Recommendations for Production:**
- Implement authentication/authorization
- Use Azure Virtual Network for private networking
- Add TLS/SSL certificates for secure connections
- Implement rate limiting to prevent abuse
- Use Azure Front Door or Application Gateway for additional security

---

## Next Steps

1. ✅ Build and deploy all three emulators - **COMPLETED**
2. ✅ Verify emulator functionality - **COMPLETED**
3. ✅ Document endpoints and usage - **COMPLETED**
4. Configure frontend application to connect to emulators
5. Implement authentication layer for production use
6. Set up monitoring and alerting in Azure Monitor
7. Configure auto-scaling if needed

---

**Deployment Date:** 2025-12-30
**Deployed By:** Claude Code AI Assistant
**Status:** All emulators operational and ready for integration
