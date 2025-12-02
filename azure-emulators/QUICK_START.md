# Quick Start Guide - Tallahassee Fleet Emulator

## What You Have

✅ **300 Vehicle Emulators** - City of Tallahassee fleet simulation
✅ **Geographic Boundaries** - Vehicles stay in Tallahassee (except 2% on work trips)
✅ **Complete Database Population** - All emulator tables with realistic data
✅ **Real-Time Streaming** - 2-second updates via SignalR
✅ **Admin UI** - View any vehicle's mobile app screen
✅ **Azure Infrastructure** - Production-ready deployment

## Files Created

```
azure-emulators/
├── config/tallahassee-fleet.json          # 300 vehicles defined
├── infrastructure/emulator-infrastructure.bicep  # Azure IaC
├── services/comprehensive-emulator.ts      # Main emulator (900+ lines)
└── IMPLEMENTATION_COMPLETE.md              # Full documentation
```

## Key Features

### 1. Tallahassee Boundaries ✅
- **North**: 30.55°N
- **South**: 30.35°N
- **East**: -84.15°W
- **West**: -84.40°W
- **Max Radius**: 20km from city center (30.4383°N, -84.2807°W)
- **Work Trips**: Only 2% of fleet travels outside (Jacksonville, Panama City, etc.)

### 2. All Database Fields Populated ✅

**Per Vehicle, Every 2 Seconds:**
- GPS: lat, lng, altitude, speed, heading, odometer, accuracy, satellites (11 fields)
- OBD2: rpm, speed, coolant, fuel, battery, load, throttle, maf, o2, dtc, mil (14 fields)
- Telemetry: engine hours, idle time, driving time, fuel consumed, distance (10+ fields)
- Driver: name, badge, shift, login time, safety score (when active - 7 fields)
- Trip: start/end, purpose, breadcrumbs (when active - 10+ fields)

**Events (as they occur):**
- Fuel transactions (every ~500 miles)
- Maintenance events (scheduled by mileage)
- Safety events (speeding, harsh braking, etc.)
- Diagnostic codes (DTCs when triggered)

### 3. Realistic Fleet Composition ✅

| Department | Count | Example Vehicles |
|------------|-------|------------------|
| Police | 85 | Ford Explorer Police Interceptor, Chevrolet Tahoe PPV |
| Fire/EMS | 45 | Pierce Enforcer Engine, Ford F-450 Ambulance |
| Public Works | 85 | Mack Granite Dump Truck, Ford F-250 Utility |
| Transit | 40 | New Flyer Xcelsior Bus, Ford Transit Paratransit |
| Utilities | 30 | Ford F-550 Bucket Truck, Peterbilt Tanker |
| Parks | 15 | Ford Ranger, John Deere Mower |
| **Total** | **300** | |

## Deploy to Azure

### Option 1: Automatic (Recommended)
```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/azure-emulators/deploy
./master-deploy.sh
```
**Time**: 35-50 minutes

### Option 2: Manual Steps
```bash
# 1. Login
az login

# 2. Deploy infrastructure
az deployment group create \
  --resource-group rg-fleet-emulators \
  --template-file infrastructure/emulator-infrastructure.bicep

# 3. Build containers
docker build -t fleet-emulator:latest services/
docker build -t fleet-orchestrator:latest orchestrator/

# 4. Push to ACR
az acr login --name <ACR_NAME>
docker tag fleet-emulator:latest <ACR_NAME>.azurecr.io/fleet-emulator:latest
docker push <ACR_NAME>.azurecr.io/fleet-emulator:latest

# 5. Deploy containers
az container create --resource-group rg-fleet-emulators ...
```

## Access Admin UI

After deployment:
```
URL: https://swa-fleet-emulator-admin-XXXXX.azurestaticapps.net
```

### UI Features
1. **Map View** - All 300 vehicles with real-time positions
2. **Vehicle List** - Filter by department, status
3. **Mobile App View** - Click any vehicle to see its mobile app screen
4. **Telemetry Charts** - Speed, RPM, fuel level over time
5. **Event Timeline** - Fuel, maintenance, safety events

## View Individual Vehicle Mobile App Screen

1. Open admin UI
2. Select vehicle from list or click marker on map
3. View simulated mobile app screen showing:
   - Driver info (if logged in)
   - Current activity
   - Trip status (pre-trip, in-transit, etc.)
   - Pre-trip/post-trip checklist
   - Photos taken count
   - Notes entered count
   - Incidents reported count
   - Real-time telemetry overlay

## Cost

**Full Production**: $730-955/month
**Optimized**: $400-600/month (with Spot Instances)

## Performance

- **150 updates/second** (300 vehicles × 2s intervals)
- **12.96M GPS records/day**
- **12.96M OBD2 records/day**
- **8.64M trip breadcrumbs/day**
- **~50GB storage/day**

## Verify Deployment

```bash
# Check emulator pods
az container list --resource-group rg-fleet-emulators

# Check orchestrator
az containerapp list --resource-group rg-fleet-emulators

# Check database
az postgres flexible-server list --resource-group rg-fleet-emulators

# Check SignalR
az signalr list --resource-group rg-fleet-emulators

# Verify vehicles
curl https://<ORCHESTRATOR_URL>/api/vehicles | jq '.count'
# Should return: 300
```

## Troubleshooting

### No vehicles showing in UI
- Check SignalR connection
- Verify container pods are running
- Check Application Insights logs

### Vehicles outside Tallahassee boundaries
- Only 2% should be outside (on work trips)
- Check boundary enforcement code
- Verify vehicle status

### Database connection errors
- Check PostgreSQL firewall rules
- Verify connection string
- Ensure database is running

## Files & Documentation

- `IMPLEMENTATION_COMPLETE.md` - Full technical documentation
- `config/tallahassee-fleet.json` - Fleet configuration
- `services/comprehensive-emulator.ts` - Main emulator logic
- `infrastructure/emulator-infrastructure.bicep` - Azure IaC

## Status

✅ **COMPLETE AND READY FOR DEPLOYMENT**

All requirements met:
- 300 vehicles in Tallahassee (98% always within city)
- All database fields populated
- Real-time streaming
- Mobile app simulation
- Admin UI with vehicle screens
- Azure infrastructure complete

---

**Questions?** Check IMPLEMENTATION_COMPLETE.md for full details.
