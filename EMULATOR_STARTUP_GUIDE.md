# Fleet Emulator Startup Guide

## Overview

The Fleet Emulator system provides realistic vehicle tracking and telemetry data for development and demonstration purposes.

## Files Found

### Emulator Services
Located in `/azure-emulators/services/`:

1. **comprehensive-emulator.ts** - Main comprehensive emulator
   - 300 vehicles (Tallahassee fleet)
   - Full database population
   - GPS, OBD2, fuel, maintenance, driver behavior
   - Realistic route simulation within city bounds

2. **enhanced-fleet-emulator.ts** - Enhanced emulator
   - Fuel tracking with auto-refuel
   - Trip management with GPS breadcrumbs
   - SmartCar API simulation
   - Alert generation (low fuel, etc.)

3. **database-integrated-emulator.ts** - Database-focused emulator
4. **enhanced-fleet-emulator-with-samsara.ts** - Samsara integration
5. **radio-traffic-emulator.ts** - Radio communication emulator
6. **emulator-command-api.ts** - Command API for control

### API Integration
Located in `/api/src/`:

1. **routes/emulator.routes.ts** - REST API endpoints
2. **emulators/EmulatorOrchestrator.ts** - Central orchestration system

## Quick Start

### Option 1: Direct Emulator (Standalone)

```bash
# Start the comprehensive emulator directly
tsx start-fleet-emulator.ts
```

This will:
- Initialize 10 vehicles (configurable)
- Start real-time GPS tracking
- Generate OBD2 data (speed, RPM, fuel)
- Simulate routes in Tallahassee, FL
- Write to PostgreSQL database
- Stream updates via WebSocket

### Option 2: API-Controlled Emulator

```bash
# Start the emulator API server
tsx start-emulator-api.ts
```

Then control via REST API:

```bash
# Check status
curl http://localhost:3002/api/emulator/status

# Start emulation
curl -X POST http://localhost:3002/api/emulator/start

# Get vehicle telemetry
curl http://localhost:3002/api/emulator/vehicles/COT-POLICE-0001/telemetry

# Stop emulation
curl -X POST http://localhost:3002/api/emulator/stop
```

### Option 3: Full Stack with API Backend

```bash
# In one terminal - Start API backend
cd api
npm run dev

# In another terminal - Start emulator via API
curl -X POST http://localhost:3001/api/emulator/start
```

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://fleetadmin:fleetpassword@localhost:5432/fleetdb

# Emulator settings
EMULATOR_PORT=3002              # REST API port
EMULATOR_WS_PORT=3003           # WebSocket port
EMULATOR_VEHICLES=10            # Number of vehicles to simulate
EMULATOR_UPDATE_INTERVAL=2000   # Update interval in ms
```

### Vehicle Configuration

Edit the number of vehicles and offset in `start-fleet-emulator.ts`:

```typescript
const CONFIG = {
  vehicleIdOffset: 0,
  vehiclesPerPod: 10,  // Change this to simulate more vehicles
  updateIntervalMs: 2000,
}
```

## Data Generated

### Vehicle Telemetry
Every 2 seconds per vehicle:

- **GPS Data**
  - Latitude/Longitude (Tallahassee, FL bounds)
  - Altitude
  - Speed (mph)
  - Heading
  - Accuracy
  - Satellite count
  - Odometer

- **OBD2 Data**
  - RPM
  - Speed
  - Coolant temperature
  - Fuel level (%)
  - Battery voltage
  - Engine load
  - Throttle position
  - MAF (Mass Air Flow)
  - O2 sensor reading
  - Check engine light status

- **Vehicle Status**
  - Status: idle, active, responding, maintenance
  - Current trip information
  - Driver assignment
  - Mobile app state

### Events Generated

- **Fuel Transactions** - When fuel < 20%
- **Maintenance Events** - Random (oil change, tire rotation, etc.)
- **Safety Events** - Driver behavior (harsh braking, speeding, etc.)
- **Diagnostic Codes** - Random DTCs when issues occur

## Database Tables

Data is written to these PostgreSQL tables:

```sql
emulator_sessions           -- Session tracking
emulator_vehicles           -- Vehicle registry
emulator_gps_telemetry      -- GPS positions
emulator_obd2_data          -- OBD2 telemetry
emulator_fuel_transactions  -- Fuel purchases
emulator_maintenance_events -- Maintenance records
emulator_safety_events      -- Safety incidents
emulator_diagnostic_codes   -- DTC codes
```

## Frontend Integration

### WebSocket Connection

```javascript
const ws = new WebSocket('ws://localhost:3003')

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)

  if (data.type === 'vehicle-update') {
    // Update map marker position
    updateVehiclePosition(data.vehicleId, data.location)

    // Update telemetry display
    updateTelemetry(data.vehicleId, data.telemetry)
  }
}
```

### REST API Polling

```javascript
// Poll for vehicle updates every 5 seconds
setInterval(async () => {
  const response = await fetch('http://localhost:3002/api/emulator/vehicles/COT-POLICE-0001/telemetry')
  const data = await response.json()

  updateDashboard(data)
}, 5000)
```

## Sample Vehicle Data

Example output from a running emulator:

```json
{
  "vehicleId": "COT-POLICE-0001",
  "location": {
    "latitude": 30.441234,
    "longitude": -84.280567,
    "speed": 35.2,
    "heading": 145.8
  },
  "telemetry": {
    "rpm": 2850,
    "speed": 35.2,
    "fuelLevel": 68.5,
    "coolantTemp": 195,
    "batteryVoltage": 14.3
  },
  "status": "active",
  "driver": {
    "name": "John Smith",
    "badgeNumber": "BADGE-0123",
    "safetyScore": 92
  },
  "mobileAppState": {
    "isDriverLoggedIn": true,
    "currentActivity": "Patrol",
    "tripStatus": "in-transit"
  }
}
```

## Monitoring

### Real-time Console Output

```
[2025-11-26T19:15:32.123Z] COT-POLICE-0001: Lat: 30.441234, Lng: -84.280567, Speed: 35.2 mph, Fuel: 68.5%, Status: active
[2025-11-26T19:15:32.125Z] COT-FIRE-0001: Lat: 30.445678, Lng: -84.275432, Speed: 0.0 mph, Fuel: 85.3%, Status: idle
[2025-11-26T19:15:32.127Z] COT-PUBLIC-0001: Lat: 30.438901, Lng: -84.285123, Speed: 22.1 mph, Fuel: 45.2%, Status: active
```

### Dashboard Metrics

Check emulator status:

```bash
curl http://localhost:3002/api/emulator/status
```

Response:
```json
{
  "isRunning": true,
  "isPaused": false,
  "stats": {
    "totalVehicles": 10,
    "activeVehicles": 10,
    "totalEvents": 15234,
    "eventsPerSecond": 12.5,
    "uptime": 3600000,
    "memoryUsage": 156.7
  }
}
```

## Scenarios

Pre-configured scenarios can be run:

```bash
# Run a specific scenario
curl -X POST http://localhost:3002/api/emulator/scenario/rush-hour

# Available scenarios:
# - normal-operations
# - rush-hour
# - emergency-response
# - maintenance-day
# - low-fuel-crisis
```

## Troubleshooting

### Emulator won't start

1. Check database connection:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

2. Verify tables exist:
   ```bash
   psql $DATABASE_URL -c "\dt emulator_*"
   ```

3. Check for port conflicts:
   ```bash
   lsof -i :3002
   lsof -i :3003
   ```

### No data appearing

1. Check emulator is running:
   ```bash
   curl http://localhost:3002/api/emulator/status
   ```

2. Verify database writes:
   ```sql
   SELECT COUNT(*) FROM emulator_gps_telemetry;
   SELECT MAX(timestamp) FROM emulator_gps_telemetry;
   ```

3. Check WebSocket connection:
   ```bash
   wscat -c ws://localhost:3003
   ```

### Performance issues

1. Reduce update interval:
   ```typescript
   updateIntervalMs: 5000  // Slower updates
   ```

2. Reduce number of vehicles:
   ```typescript
   vehiclesPerPod: 5  // Fewer vehicles
   ```

3. Check database performance:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM emulator_gps_telemetry ORDER BY timestamp DESC LIMIT 100;
   ```

## Next Steps

1. **Frontend Integration** - Connect your React dashboard to WebSocket stream
2. **Map Visualization** - Display vehicles on Google Maps / Azure Maps
3. **Alerting** - Set up alerts for low fuel, maintenance, safety events
4. **Analytics** - Build dashboards from emulator data
5. **Testing** - Use emulator for load testing and demos

## API Reference

See `api/src/routes/emulator.routes.ts` for complete API documentation.

## Support

For issues or questions, check:
- Database logs: `journalctl -u postgresql`
- Application logs: Console output from tsx process
- Network: `netstat -an | grep LISTEN`
