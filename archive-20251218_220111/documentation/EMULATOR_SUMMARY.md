# Fleet Emulator Service - Implementation Summary

## Overview

A comprehensive fleet emulator system has been created for the fleet-local project to generate realistic vehicle tracking and telemetry data for development and testing.

## Files Created

### 1. Simple Fleet Emulator (Recommended for Quick Start)
**File:** `simple-fleet-emulator.ts`

- **Standalone emulator** - No database dependencies
- **5-10 vehicles** with real-time tracking
- **HTTP REST API** on port 3002
- **WebSocket streaming** on port 3003
- **Automatic data generation** every 2 seconds

**Start Command:**
```bash
npx tsx simple-fleet-emulator.ts
```

**Features:**
- Real-time GPS position updates (Tallahassee, FL bounds)
- OBD2 telemetry (RPM, speed, fuel, temperature, voltage)
- Route simulation with realistic movement
- Automatic boundary enforcement
- Fuel consumption and auto-refueling
- Driver assignment with shift management
- Status changes (idle, active, responding, maintenance)

### 2. Comprehensive Fleet Emulator
**File:** `start-fleet-emulator.ts`

- **Full-featured** emulator with database integration
- **Up to 300 vehicles** (City of Tallahassee fleet)
- **Complete telemetry suite** (GPS, OBD2, fuel, maintenance, safety)
- **Database persistence** to PostgreSQL
- **Event streaming** via WebSocket

**Start Command:**
```bash
tsx start-fleet-emulator.ts
```

**Requires:**
- PostgreSQL database
- Emulator tables (see migration scripts)
- DATABASE_URL environment variable

### 3. Emulator API Server
**File:** `start-emulator-api.ts`

- **REST API control interface**
- **Start/stop/pause/resume** controls
- **Scenario management**
- **Vehicle telemetry endpoints**

**Start Command:**
```bash
tsx start-emulator-api.ts
```

### 4. Configuration
**File:** `azure-emulators/config/tallahassee-fleet.json`

- Fleet composition (police, fire, public works, transit, utilities, parks)
- Vehicle models and counts
- Operating hours by department
- Fuel station locations
- City boundary coordinates

### 5. Documentation
**File:** `EMULATOR_STARTUP_GUIDE.md`

- Complete setup instructions
- API reference
- Troubleshooting guide
- Frontend integration examples
- Sample data formats

## Emulator Services Found

Located in `/azure-emulators/services/`:

1. **comprehensive-emulator.ts** - Full-featured with 300 vehicles
2. **enhanced-fleet-emulator.ts** - Enhanced with SmartCar API simulation
3. **database-integrated-emulator.ts** - Database-focused implementation
4. **enhanced-fleet-emulator-with-samsara.ts** - Samsara integration
5. **radio-traffic-emulator.ts** - Radio communication emulator
6. **emulator-command-api.ts** - Command API

## API Endpoints

### HTTP REST API (Port 3002)

```
GET  /health                           - Health check
GET  /vehicles                         - List all vehicles with current state
GET  /vehicles/:id                     - Get specific vehicle telemetry
POST /start                            - Start emulation
POST /stop                             - Stop emulation
```

### WebSocket Stream (Port 3003)

Real-time vehicle updates every 2 seconds:

```json
{
  "type": "vehicle-update",
  "data": {
    "vehicleId": "COT-POL-0001",
    "timestamp": "2025-11-26T19:30:15.123Z",
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
      "batteryVoltage": 14.3,
      "engineLoad": 45.2,
      "odometer": 45678.9
    },
    "status": "active",
    "driver": {
      "name": "John Smith",
      "badge": "BADGE-0123",
      "shift": "Day Shift"
    }
  }
}
```

## Sample Vehicle Data Generated

### Vehicle Types
- **Police Cruisers** - Ford Explorer Police Interceptor
- **Fire Engines** - Pierce Enforcer Pumper
- **Public Works Trucks** - Ford F-150, International DuraStar
- **Transit Buses** - Gillig Low Floor
- **Service Vans** - Ford Transit Van

### Data Points (Updated Every 2 Seconds)

**GPS Data:**
- Latitude/Longitude (within Tallahassee city limits)
- Speed (0-70 mph based on status)
- Heading (0-360 degrees)
- Realistic route simulation

**OBD2 Telemetry:**
- RPM (750-4500)
- Speed (synchronized with GPS)
- Fuel Level (5-100%, with auto-refuel at 15%)
- Coolant Temperature (180-195°F)
- Battery Voltage (12.6-14.3V)
- Engine Load (0-100%)
- Odometer (incremental based on distance traveled)

**Vehicle Status:**
- `idle` - Parked, engine idling
- `active` - Normal operation (25-45 mph)
- `responding` - Emergency response (55-70 mph)
- `maintenance` - Out of service

## How to Use

### Quick Start (No Database Required)

```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local
npx tsx simple-fleet-emulator.ts
```

Output:
```
╔═══════════════════════════════════════════════════════╗
║        Simple Fleet Emulator - Real-time Demo        ║
╚═══════════════════════════════════════════════════════╝

Vehicles: 5
HTTP API: http://localhost:3002
WebSocket: ws://localhost:3003

Initialized 5 vehicles
✅ HTTP server running on http://localhost:3002
✅ WebSocket server running on ws://localhost:3003

╔═══════════════════════════════════════════════════════╗
║              EMULATOR NOW RUNNING                     ║
╚═══════════════════════════════════════════════════════╝

Real-time vehicle updates:
  COT-POL-0001: Lat 30.441234, Lng -84.280567, 35.2 mph, Fuel 68.5%
  COT-FIR-0002: Lat 30.445678, Lng -84.275432, 0.0 mph, Fuel 85.3%
  COT-PUB-0003: Lat 30.438901, Lng -84.285123, 22.1 mph, Fuel 45.2%
  ...
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:3002/health

# Get all vehicles
curl http://localhost:3002/vehicles

# Get specific vehicle
curl http://localhost:3002/vehicles/COT-POL-0001
```

### Frontend Integration

**WebSocket Connection:**

```javascript
const ws = new WebSocket('ws://localhost:3003')

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)

  if (message.type === 'init') {
    // Initial vehicle list
    console.log('Vehicles:', message.vehicles)
  }

  if (message.type === 'vehicle-update') {
    // Real-time update
    const { vehicleId, location, telemetry, status } = message.data

    // Update map marker
    updateMapMarker(vehicleId, location)

    // Update telemetry display
    updateTelemetryPanel(vehicleId, telemetry)
  }
}
```

**REST API Polling:**

```javascript
// Poll for vehicle list every 5 seconds
setInterval(async () => {
  const response = await fetch('http://localhost:3002/vehicles')
  const data = await response.json()

  data.vehicles.forEach(vehicle => {
    updateVehicleDisplay(vehicle)
  })
}, 5000)
```

## Configuration Options

### Environment Variables

```bash
# Number of vehicles to simulate
NUM_VEHICLES=5

# HTTP API port
HTTP_PORT=3002

# WebSocket port
WS_PORT=3003

# Database URL (for comprehensive emulator)
DATABASE_URL=postgresql://user:pass@localhost:5432/fleetdb
```

### Customizing Vehicles

Edit `simple-fleet-emulator.ts` to add more vehicle types:

```typescript
const types = [
  'Police Cruiser',
  'Fire Engine',
  'Public Works Truck',
  'Transit Bus',
  'Service Van',
  'Ambulance',        // Add new types
  'Tow Truck',
  'Utility Truck'
]
```

## Architecture

```
┌─────────────────────────────────────────┐
│   Simple Fleet Emulator                 │
│                                         │
│   ┌───────────────────────────────┐   │
│   │  Vehicle State Manager        │   │
│   │  - GPS Position               │   │
│   │  - OBD2 Telemetry            │   │
│   │  - Driver Assignment          │   │
│   └───────────────────────────────┘   │
│                                         │
│   ┌───────────────────────────────┐   │
│   │  Movement Simulator           │   │
│   │  - Route Generation           │   │
│   │  - Boundary Enforcement       │   │
│   │  - Speed Control              │   │
│   └───────────────────────────────┘   │
│                                         │
│   ┌───────────────────────────────┐   │
│   │  Data Broadcaster             │   │
│   │  - WebSocket Streaming        │   │
│   │  - REST API Endpoints         │   │
│   └───────────────────────────────┘   │
└─────────────────────────────────────────┘
           │                  │
           ├──────────────────┤
           ▼                  ▼
    WebSocket:3003       HTTP:3002
           │                  │
           ▼                  ▼
    ┌──────────────┐   ┌──────────────┐
    │   Frontend   │   │  Dashboard   │
    │   Map View   │   │  REST API    │
    └──────────────┘   └──────────────┘
```

## Next Steps

1. **Start the Simple Emulator** to generate data
   ```bash
   npx tsx simple-fleet-emulator.ts
   ```

2. **Connect Frontend** to WebSocket stream on port 3003

3. **Display Vehicles on Map** using real-time GPS coordinates

4. **Build Telemetry Dashboard** using REST API or WebSocket data

5. **Add Alerts** for low fuel, speeding, maintenance, etc.

6. **Scale Up** to comprehensive emulator with database for production demos

## Verification

To verify the emulator is working:

```bash
# Start emulator
npx tsx simple-fleet-emulator.ts

# In another terminal, test endpoints:
curl http://localhost:3002/health
curl http://localhost:3002/vehicles | jq

# Connect with WebSocket client:
wscat -c ws://localhost:3003
```

Expected output:
- Console showing vehicle updates every 2 seconds
- HTTP endpoints returning JSON data
- WebSocket streaming real-time updates

## Status: COMPLETE ✅

All emulator services are created and ready to use:

- ✅ Simple fleet emulator (standalone, no database)
- ✅ Comprehensive fleet emulator (full features, database-backed)
- ✅ Emulator API server (REST control interface)
- ✅ Configuration files (Tallahassee fleet setup)
- ✅ Documentation and startup guides
- ✅ HTTP REST API (port 3002)
- ✅ WebSocket streaming (port 3003)
- ✅ Sample data generation (5-10 vehicles)
- ✅ Real-time GPS simulation
- ✅ OBD2 telemetry generation
- ✅ Route simulation with boundaries
- ✅ Frontend integration ready

## Files Summary

```
/Users/andrewmorton/Documents/GitHub/fleet-local/
├── simple-fleet-emulator.ts               # Standalone emulator (RECOMMENDED)
├── start-fleet-emulator.ts                # Comprehensive emulator
├── start-emulator-api.ts                  # API control server
├── EMULATOR_STARTUP_GUIDE.md              # Complete documentation
├── EMULATOR_SUMMARY.md                    # This file
└── azure-emulators/
    ├── config/
    │   └── tallahassee-fleet.json         # Fleet configuration
    └── services/
        ├── comprehensive-emulator.ts      # 300-vehicle emulator
        ├── enhanced-fleet-emulator.ts     # Enhanced features
        └── [other emulators...]
```

Start with `simple-fleet-emulator.ts` for immediate results!
