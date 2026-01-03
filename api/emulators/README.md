# Fleet Management Service Emulators

This directory contains mock service emulators for development and demonstration purposes. These emulators simulate external services and hardware devices to provide a fully functional fleet management system without requiring actual hardware or third-party API subscriptions.

## Available Emulators

### 1. OBD2 Device Emulator (`obd2-emulator/`)
Simulates OBD-II diagnostic data from vehicles including:
- Engine RPM, speed, coolant temperature
- Fuel level and consumption
- Diagnostic trouble codes (DTCs)
- Odometer readings
- Real-time data stream via WebSocket

**API Endpoints:**
- `GET /api/emulator/obd2/devices` - List all emulated devices
- `GET /api/emulator/obd2/device/:id/data` - Get latest data
- `WS /api/emulator/obd2/device/:id/stream` - Real-time data stream
- `POST /api/emulator/obd2/device/:id/inject-fault` - Inject fault code

###  2. GPS Tracker Emulator (`gps-emulator/`)
Simulates GPS tracking devices with:
- Realistic route generation (following roads)
- Speed and heading calculations
- Geofencing events
- Trip start/stop detection
- Battery level simulation

**API Endpoints:**
- `GET /api/emulator/gps/devices` - List all trackers
- `GET /api/emulator/gps/device/:id/location` - Current location
- `WS /api/emulator/gps/device/:id/stream` - Real-time location updates
- `POST /api/emulator/gps/device/:id/route` - Set custom route

### 3. Fuel Sensor Emulator (`fuel-emulator/`)
Simulates fuel level sensors with:
- Fuel consumption based on speed/load
- Fill-up event detection
- Fuel theft alerts
- Tank calibration curves

**API Endpoints:**
- `GET /api/emulator/fuel/devices` - List all sensors
- `GET /api/emulator/fuel/device/:id/level` - Current fuel level
- `POST /api/emulator/fuel/device/:id/fill` - Simulate fill-up

### 4. Temperature Sensor Emulator (`temperature-emulator/`)
Simulates temperature monitoring for refrigerated vehicles:
- Cargo area temperature
- Ambient temperature
- Door open/close events
- Alert thresholds

### 5. ELD (Electronic Logging Device) Emulator (`eld-emulator/`)
Simulates hours-of-service tracking:
- Driving time calculation
- Rest period tracking
- FMCSA compliance monitoring
- Driver violation alerts

### 6. Vendor API Emulator (`vendor-emulator/`)
Simulates parts vendor APIs:
- Real-time pricing
- Inventory availability
- Order placement
- Shipping tracking

### 7. Maps Service Emulator (`maps-emulator/`)
Simulates map tile services:
- OSM-compatible tile server
- Geocoding/reverse geocoding
- Route calculation
- Traffic simulation

## Architecture

All emulators follow a consistent pattern:

```
emulator-name/
├── server.ts          # Express server
├── emulator.ts        # Core emulation logic
├── models.ts          # Data models
├── routes.ts          # API routes
├── websocket.ts       # WebSocket handlers
├── Dockerfile         # Container image
└── k8s-deployment.yaml # Kubernetes manifests
```

## Configuration

Emulators are configured via environment variables:

```bash
# Enable/disable emulators
EMULATE_OBD2=true
EMULATE_GPS=true
EMULATE_FUEL=true
EMULATE_TEMPERATURE=true
EMULATE_ELD=true
EMULATE_VENDOR_API=true
EMULATE_MAPS=true

# Emulator endpoints
OBD2_EMULATOR_URL=http://obd2-emulator-service:3100
GPS_EMULATOR_URL=http://gps-emulator-service:3101
# ... etc
```

## Deployment

### Local Development
```bash
cd emulators/obd2-emulator
npm install
npm run dev
```

### Kubernetes Deployment
```bash
# Deploy all emulators
kubectl apply -f emulators/k8s/

# Deploy specific emulator
kubectl apply -f emulators/obd2-emulator/k8s-deployment.yaml
```

### Docker Compose
```bash
docker-compose -f emulators/docker-compose.yml up
```

## Testing

Each emulator includes a test suite:

```bash
cd emulators/obd2-emulator
npm test
```

## Integration with Main Application

The main Fleet Management API automatically detects and uses emulators when `NODE_ENV=development` or when emulator environment variables are set.

Example integration in main API:

```typescript
// src/services/obd2.service.ts
const OBD2_BASE_URL = process.env.EMULATE_OBD2
  ? process.env.OBD2_EMULATOR_URL
  : process.env.OBD2_PROVIDER_URL;
```

## Data Realism

Emulators generate realistic data based on:
- Vehicle make/model profiles
- Real-world patterns (rush hour traffic, typical routes)
- Environmental factors (weather, terrain)
- Driver behavior models

## Performance

Each emulator is designed to handle:
- 1000+ concurrent device connections
- 10Hz update rate per device
- <10ms response time
- Minimal CPU/memory footprint

## Monitoring

Emulators expose Prometheus metrics:
- Device count
- Data generation rate
- API response times
- Error rates

## Future Enhancements

- [ ] Machine learning-based data generation
- [ ] Historical data playback
- [ ] Multi-region deployment
- [ ] GraphQL API support
- [ ] Admin UI for emulator control
