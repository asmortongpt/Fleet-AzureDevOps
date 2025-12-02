# Fleet Management Emulator System

## Overview

The Fleet Management Emulator System is a production-grade, comprehensive emulation platform that generates realistic, time-series simulation data for vehicle fleets. It replaces mock data with sophisticated, correlated telemetry streams that accurately model real-world fleet operations.

## Architecture

### Core Components

1. **EmulatorOrchestrator** - Central control system coordinating all emulators
2. **GPS Emulator** - Realistic vehicle movement and location tracking
3. **OBD-II Emulator** - Engine diagnostics and sensor data
4. **Fuel Emulator** - Fuel transactions and efficiency tracking
5. **Maintenance Emulator** - Scheduled and unscheduled maintenance events
6. **Driver Behavior Emulator** - Driving patterns and safety scoring
7. **Route Emulator** - Pre-planned routes with traffic simulation
8. **Cost Emulator** - Comprehensive cost tracking and invoicing
9. **IoT Emulator** - Sensor data (temperature, pressure, connectivity)

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                  EmulatorOrchestrator                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  WebSocket Server (Real-time Streaming)             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Event Broadcasting System                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │   GPS   │    │  OBD-II │    │  Fuel   │
    │Emulator │    │Emulator │    │Emulator │
    └─────────┘    └─────────┘    └─────────┘
         │               │               │
    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐
    │  Maint. │    │ Driver  │    │  Route  │
    │Emulator │    │Emulator │    │Emulator │
    └─────────┘    └─────────┘    └─────────┘
         │               │               │
    ┌────▼────┐    ┌────▼────┐
    │  Cost   │    │   IoT   │
    │Emulator │    │Emulator │
    └─────────┘    └─────────┘
```

## Features

### 1. Realistic Data Generation

- **GPS Telemetry**: Accurate vehicle movement along predefined routes with realistic speed variations
- **OBD-II Diagnostics**: Correlated engine parameters (RPM, coolant temp, fuel level, battery voltage)
- **Fuel Transactions**: Location-based fuel purchases with price variations
- **Maintenance Events**: Scheduled and unscheduled maintenance with parts and labor costs
- **Driver Behavior**: Event-based scoring with speeding, braking, and safety violations
- **IoT Sensors**: Temperature, tire pressure, door status, and connectivity data

### 2. Time Compression

Configure time compression to simulate hours or days of operation in minutes:

```json
{
  "timeCompression": {
    "enabled": true,
    "ratio": 60
  }
}
```

This setting makes 1 real second = 60 simulated seconds (1 real minute = 1 simulated hour).

### 3. Scenario-Based Testing

Pre-configured scenarios for different operational conditions:

- **normal_operations**: Standard daily operations
- **rush_hour**: Heavy traffic conditions
- **night_shift**: Overnight operations with minimal traffic
- **weekend**: Reduced operations
- **emergency_response**: Priority routing and emergency deployment
- **adverse_weather**: Operations during rain/snow
- **maintenance_due**: Multiple vehicles reaching maintenance intervals
- **high_utilization**: All vehicles active with heavy usage
- **mixed_conditions**: Comprehensive test with varying conditions
- **stress_test**: Maximum load test (100+ vehicles)

### 4. Real-Time Streaming

WebSocket server for real-time data streaming to dashboards and monitoring systems:

```javascript
const ws = new WebSocket('ws://localhost:3001/emulator/stream')

ws.on('message', (data) => {
  const event = JSON.parse(data)
  console.log('Received:', event.type, event.data)
})
```

### 5. Data Persistence

All emulated data is persisted to PostgreSQL for historical analysis:

- Session tracking
- Complete telemetry history
- Event logs
- Performance metrics

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for real-time state management)

### Setup

1. Install dependencies:

```bash
cd api
npm install
```

2. Run database migrations:

```bash
psql -U your_user -d your_database -f src/migrations/014_create_emulator_tables.sql
```

3. Configure environment:

```bash
# In .env file
DATABASE_URL=postgresql://user:password@localhost:5432/fleet
REDIS_URL=redis://localhost:6379
```

## Quick Start

### Using the API

#### 1. Start Emulation

Start all vehicles:

```bash
curl -X POST http://localhost:3000/api/emulator/start
```

Start specific vehicles:

```bash
curl -X POST http://localhost:3000/api/emulator/start \
  -H "Content-Type: application/json" \
  -d '{"vehicleIds": ["VEH-001", "VEH-002"]}'
```

#### 2. Run a Scenario

```bash
curl -X POST http://localhost:3000/api/emulator/scenario/rush_hour
```

#### 3. Get Status

```bash
curl http://localhost:3000/api/emulator/status
```

#### 4. Get Vehicle Telemetry

```bash
curl http://localhost:3000/api/emulator/vehicles/VEH-001/telemetry
```

#### 5. Stop Emulation

```bash
curl -X POST http://localhost:3000/api/emulator/stop
```

### Using the Orchestrator Directly

```typescript
import { EmulatorOrchestrator } from './emulators/EmulatorOrchestrator'

// Create orchestrator
const orchestrator = new EmulatorOrchestrator()

// Listen to events
orchestrator.on('gps', (event) => {
  console.log('GPS Update:', event.data)
})

orchestrator.on('obd2', (event) => {
  console.log('OBD-II Data:', event.data)
})

// Start emulation
await orchestrator.start(['VEH-001', 'VEH-002'])

// Or run a scenario
await orchestrator.runScenario('normal_operations')

// Get status
const status = orchestrator.getStatus()
console.log('Status:', status)

// Stop emulation
await orchestrator.stop()
```

## API Reference

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/emulator/status` | Get emulator system status |
| POST | `/api/emulator/start` | Start emulators |
| POST | `/api/emulator/stop` | Stop all emulators |
| POST | `/api/emulator/pause` | Pause all emulators |
| POST | `/api/emulator/resume` | Resume paused emulators |
| POST | `/api/emulator/scenario/:id` | Run a scenario |
| GET | `/api/emulator/vehicles/:id/telemetry` | Get vehicle telemetry |
| GET | `/api/emulator/scenarios` | List available scenarios |
| GET | `/api/emulator/vehicles` | List available vehicles |
| GET | `/api/emulator/routes` | List available routes |

### WebSocket Events

| Event Type | Description | Data Schema |
|------------|-------------|-------------|
| `connection` | Initial connection | System configuration |
| `status` | Status updates | Current system status |
| `stats` | Performance statistics | Events/sec, uptime, memory |
| `event` | Emulator event | Type-specific event data |
| `gps` | GPS telemetry | Location, speed, heading |
| `obd2` | OBD-II diagnostics | RPM, temp, fuel, voltage |
| `fuel` | Fuel transaction | Station, gallons, cost |
| `maintenance` | Maintenance event | Type, parts, labor, cost |
| `driver` | Driver behavior | Event type, severity, score |
| `iot` | IoT sensor data | Sensor readings |

## Configuration

### Default Configuration

Location: `api/src/emulators/config/default.json`

Key settings:

```json
{
  "timeCompression": {
    "enabled": true,
    "ratio": 60
  },
  "performance": {
    "maxVehicles": 100,
    "updateInterval": 1000
  },
  "gps": {
    "updateFrequency": 5000,
    "accuracy": { "min": 5, "max": 50 }
  },
  "obd2": {
    "updateFrequency": 2000
  }
}
```

### Vehicle Configuration

Location: `api/src/emulators/config/vehicles.json`

Defines the fleet of vehicles available for emulation. Each vehicle includes:

- Make, model, year
- VIN and license plate
- Tank size and fuel efficiency
- Starting location
- Driver behavior profile
- Available features (gps, obd2, iot, camera, etc.)

### Route Configuration

Location: `api/src/emulators/config/routes.json`

Defines routes and geofences:

- Route waypoints with lat/lng coordinates
- Stop durations at each waypoint
- Road types (city, highway, residential)
- Traffic patterns by time of day
- Geofence boundaries with alert triggers

### Scenario Configuration

Location: `api/src/emulators/config/scenarios.json`

Defines operational scenarios with:

- Active vehicle count
- Traffic levels
- Weather conditions
- Event frequencies
- Scenario-specific modifiers

## Emulator Details

### GPS Emulator

**Purpose**: Simulates realistic vehicle movement

**Features**:
- Haversine formula for accurate distance calculations
- Bearing/heading calculations
- Route following with waypoint navigation
- Stop duration handling
- GPS accuracy simulation (±5-50m)
- Geofence violation detection
- Speed variation by road type

**Update Frequency**: 5 seconds (configurable)

**Output Example**:
```json
{
  "vehicleId": "VEH-001",
  "timestamp": "2025-01-15T10:30:00Z",
  "location": {
    "lat": 38.8951,
    "lng": -77.0364,
    "accuracy": 12.5
  },
  "speed": 35.2,
  "heading": 145.8,
  "odometer": 12345.6,
  "satelliteCount": 8
}
```

### OBD-II Emulator

**Purpose**: Simulates engine diagnostics and vehicle health

**Features**:
- RPM correlated with speed
- Coolant temperature (cold start to operating temp)
- Fuel level decreasing with distance
- Battery voltage variations
- Engine load and throttle position
- MAF (Mass Air Flow) sensor
- O2 sensor (lambda) readings
- DTC (Diagnostic Trouble Code) generation
- Check Engine Light triggers

**Update Frequency**: 2 seconds (configurable)

**Output Example**:
```json
{
  "vehicleId": "VEH-001",
  "timestamp": "2025-01-15T10:30:00Z",
  "rpm": 2100,
  "speed": 35,
  "coolantTemp": 92,
  "fuelLevel": 68,
  "batteryVoltage": 13.8,
  "engineLoad": 45,
  "throttlePosition": 32,
  "maf": 25.6,
  "o2Sensor": 0.48,
  "dtcCodes": [],
  "checkEngineLight": false
}
```

### Fuel Emulator

**Purpose**: Simulates fuel purchases and efficiency

**Features**:
- Realistic fuel purchase timing
- Station selection based on location
- Price variation by region and time
- Fuel type (regular, premium, diesel, electric)
- Payment method simulation
- Receipt generation
- Fuel efficiency tracking

**Output Example**:
```json
{
  "vehicleId": "VEH-001",
  "timestamp": "2025-01-15T10:30:00Z",
  "stationId": "STATION-456",
  "stationName": "Shell",
  "location": { "lat": 38.8950, "lng": -77.0365 },
  "gallons": 18.5,
  "pricePerGallon": 3.89,
  "totalCost": 71.97,
  "fuelType": "regular",
  "paymentMethod": "fleet_card",
  "odometer": 12345.6,
  "receiptNumber": "RCP-1705323000-1234"
}
```

### Maintenance Emulator

**Purpose**: Simulates scheduled and unscheduled maintenance

**Features**:
- Interval-based maintenance (oil change, tire rotation, inspection, brakes)
- Random unscheduled repairs
- Parts and labor cost calculation
- Vendor assignment
- Warranty tracking
- Next due odometer calculation

**Output Example**:
```json
{
  "vehicleId": "VEH-001",
  "timestamp": "2025-01-15T10:30:00Z",
  "type": "scheduled",
  "category": "oilChange",
  "description": "Oil Change",
  "parts": [
    {
      "name": "Oil Filter",
      "partNumber": "PN-12345",
      "quantity": 1,
      "cost": 15.99
    }
  ],
  "laborHours": 0.5,
  "laborCost": 47.50,
  "totalCost": 63.49,
  "vendorId": "VENDOR-23",
  "vendorName": "Jiffy Lube",
  "warranty": true,
  "nextDueOdometer": 17345.6
}
```

### Driver Behavior Emulator

**Purpose**: Simulates driving patterns and safety events

**Features**:
- Behavior profiles (aggressive, normal, cautious)
- Speeding detection
- Hard braking/acceleration events
- Idling time tracking
- Seatbelt violation detection
- Distraction events
- Driver scoring algorithm

**Output Example**:
```json
{
  "vehicleId": "VEH-001",
  "timestamp": "2025-01-15T10:30:00Z",
  "eventType": "speeding",
  "severity": "medium",
  "location": { "lat": 38.8951, "lng": -77.0364 },
  "speed": 75,
  "speedLimit": 60,
  "score": -10
}
```

### IoT Emulator

**Purpose**: Simulates IoT sensor data

**Features**:
- Temperature sensors (engine, cargo, cabin)
- Tire pressure monitoring (all 4 tires)
- Door status (driver, passenger, cargo)
- Ignition status
- Accelerometer data (3-axis)
- Gyroscope data (3-axis)
- Connectivity status and signal strength

**Output Example**:
```json
{
  "vehicleId": "VEH-001",
  "timestamp": "2025-01-15T10:30:00Z",
  "sensors": {
    "engineTemp": 95.3,
    "cabinTemp": 72.1,
    "tirePressure": {
      "frontLeft": 32.1,
      "frontRight": 32.3,
      "rearLeft": 31.9,
      "rearRight": 32.0
    },
    "doorStatus": {
      "driver": false,
      "passenger": false,
      "cargo": false
    },
    "ignitionStatus": true,
    "connectivity": {
      "type": "4G",
      "signalStrength": -75,
      "connected": true
    }
  }
}
```

## Performance

### Benchmarks

- **Maximum Vehicles**: 100+ simultaneous vehicles
- **Update Frequency**: 1-30 seconds per emulator
- **Events/Second**: 500+ events/second sustained
- **Memory Usage**: ~2GB for 100 vehicles
- **CPU Usage**: ~30-40% single core for 100 vehicles

### Optimization Tips

1. **Adjust Update Frequencies**: Increase intervals for less critical data
2. **Use Time Compression**: Simulate more time in less real time
3. **Selective Emulators**: Only enable needed emulators per vehicle
4. **Database Batching**: Batch insert emulated data for better performance
5. **Redis Caching**: Use Redis for real-time state to reduce DB load

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
npm run test:integration
```

### Performance Benchmarks

```bash
npm run benchmark
```

## Troubleshooting

### Common Issues

**Issue**: Emulators not starting
- Check that PostgreSQL is running
- Verify database connection string in .env
- Check that migration has been applied

**Issue**: High memory usage
- Reduce `maxVehicles` in configuration
- Increase update intervals
- Enable data pruning in configuration

**Issue**: WebSocket connection fails
- Check that port 3001 is not in use
- Verify firewall settings
- Check WebSocket server logs

## Production Deployment

### Recommended Setup

1. **Database**: PostgreSQL with connection pooling
2. **Cache**: Redis for real-time state
3. **Monitoring**: Application Insights or similar
4. **Scaling**: Multiple instances with load balancer
5. **Storage**: Time-series database for long-term telemetry

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### Kubernetes Deployment

See `kubernetes/emulator-deployment.yaml` for full configuration.

## Support

For issues, questions, or feature requests:

- GitHub Issues: [Create an issue](https://github.com/your-org/fleet/issues)
- Documentation: [Full docs](https://docs.fleet.example.com)
- Email: support@fleet.example.com

## License

Copyright © 2025 Capital Tech Alliance. All rights reserved.
