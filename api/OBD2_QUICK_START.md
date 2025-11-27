# OBD2 Emulator Quick Start Guide

## Quick Test (No Server Required)

```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local/api
npx tsx test-obd2-standalone.ts
```

This will run all tests and show you sample data.

---

## Using with Full API Server

### 1. Start the Server

```bash
cd /Users/andrewmorton/Documents/GitHub/fleet-local/api
npm run dev
```

### 2. Start an Emulation Session

```bash
curl -X POST http://localhost:3000/api/obd2-emulator/start \
  -H 'Content-Type: application/json' \
  -d '{
    "vehicleId": 1,
    "profile": "sedan",
    "scenario": "city"
  }'
```

**Response:**
```json
{
  "success": true,
  "sessionId": "abc-123",
  "wsUrl": "/ws/obd2/abc-123"
}
```

### 3. Get Real-time Data

#### Option A: REST API (Polling)

```bash
curl http://localhost:3000/api/obd2-emulator/data/abc-123
```

#### Option B: WebSocket (Streaming)

```javascript
const ws = new WebSocket('ws://localhost:3000/ws/obd2/abc-123');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

### 4. Stop the Session

```bash
curl -X POST http://localhost:3000/api/obd2-emulator/stop/abc-123
```

---

## Available Profiles

- `sedan` - Standard gasoline sedan
- `truck` - Diesel work truck
- `electric` - Battery electric vehicle
- `diesel` - Diesel passenger vehicle
- `sports` - High-performance sports car

## Available Scenarios

- `idle` - Stationary vehicle
- `city` - Stop-and-go traffic
- `highway` - Steady cruising
- `aggressive` - Hard driving

---

## Example: Multiple Vehicles

```bash
# Start sedan in city traffic
curl -X POST http://localhost:3000/api/obd2-emulator/start \
  -d '{"vehicleId": 1, "profile": "sedan", "scenario": "city"}'

# Start truck on highway
curl -X POST http://localhost:3000/api/obd2-emulator/start \
  -d '{"vehicleId": 2, "profile": "truck", "scenario": "highway"}'

# List all active sessions
curl http://localhost:3000/api/obd2-emulator/sessions
```

---

## Data Structure

```typescript
{
  timestamp: Date
  sessionId: string
  vehicleId: number
  adapterId: number

  // Engine
  engineRpm: number
  vehicleSpeed: number
  throttlePosition: number
  engineLoad: number

  // Temperature
  engineCoolantTemp: number
  intakeAirTemp: number
  engineOilTemp: number

  // Fuel
  fuelLevel: number
  fuelPressure: number
  fuelConsumptionRate: number

  // Electrical
  batteryVoltage: number

  // Location
  location: {
    latitude: number
    longitude: number
    altitude: number
    speed: number
    heading: number
  }

  // Calculated
  estimatedMpg: number
  distanceTraveled: number
  tripTime: number
}
```

---

## Troubleshooting

### Server won't start

Check `.env` file exists:
```bash
ls -la /Users/andrewmorton/Documents/GitHub/fleet-local/api/.env
```

If missing, it was created with secure secrets at:
`/Users/andrewmorton/Documents/GitHub/fleet-local/api/.env`

### No data from session

Wait 1-2 seconds after starting session, then poll again.

### WebSocket not connecting

Ensure server is running and session exists:
```bash
curl http://localhost:3000/api/obd2-emulator/sessions
```

---

## Configuration

Edit `/api/.env`:

```env
ENABLE_OBD2_EMULATOR=true
OBD2_WS_PORT=3001
```

---

## Full API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/obd2-emulator/profiles` | GET | List vehicle profiles |
| `/api/obd2-emulator/scenarios` | GET | List scenarios |
| `/api/obd2-emulator/start` | POST | Start session |
| `/api/obd2-emulator/stop/:id` | POST | Stop session |
| `/api/obd2-emulator/data/:id` | GET | Get session data |
| `/api/obd2-emulator/sessions` | GET | List active sessions |
| `/api/obd2-emulator/sample-data` | GET | Get single sample |
| `/api/obd2-emulator/sample-dtcs` | GET | Get sample DTCs |
| `/ws/obd2/:sessionId` | WS | Real-time stream |

---

For detailed information, see: `OBD2_EMULATOR_STATUS.md`
