# Fleet Emulator API - Usage Examples

Complete guide with code examples for interacting with the Fleet Emulator API.

---

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [System Control](#system-control)
- [Vehicle Data](#vehicle-data)
- [Real-Time Telemetry](#real-time-telemetry)
- [Fleet Management](#fleet-management)
- [WebSocket Streaming](#websocket-streaming)
- [Advanced Examples](#advanced-examples)

---

## 🚀 Quick Start

### Base URL

```bash
API_BASE_URL="https://proud-bay-0fdc8040f.3.azurestaticapps.net/api"
```

### Health Check

```bash
curl $API_BASE_URL/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-17T10:30:00Z",
  "uptime": 3600
}
```

---

## 🎮 System Control

### Start Emulators

**Start All Vehicles:**
```bash
curl -X POST $API_BASE_URL/emulator/start
```

**Start Specific Number:**
```bash
curl -X POST $API_BASE_URL/emulator/start \
  -H "Content-Type: application/json" \
  -d '{"count": 25}'
```

**Start Specific Vehicles:**
```bash
curl -X POST $API_BASE_URL/emulator/start \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleIds": [
      "vehicle-1",
      "vehicle-2",
      "vehicle-3"
    ]
  }'
```

**Response:**
```json
{
  "message": "Emulators started successfully",
  "vehiclesStarted": 25,
  "timestamp": "2026-01-17T10:30:00Z"
}
```

### Control Operations

**Pause:**
```bash
curl -X POST $API_BASE_URL/emulator/pause
```

**Resume:**
```bash
curl -X POST $API_BASE_URL/emulator/resume
```

**Stop:**
```bash
curl -X POST $API_BASE_URL/emulator/stop
```

### Run Scenarios

```bash
# Rush hour traffic
curl -X POST $API_BASE_URL/emulator/scenario/rush-hour

# Emergency scenario
curl -X POST $API_BASE_URL/emulator/scenario/emergency

# Night shift
curl -X POST $API_BASE_URL/emulator/scenario/night-shift
```

---

## 📊 System Status

### Get Emulator Status

```bash
curl $API_BASE_URL/emulator/status | jq
```

**Response:**
```json
{
  "isRunning": true,
  "isPaused": false,
  "currentScenario": null,
  "stats": {
    "totalVehicles": 50,
    "activeVehicles": 50,
    "totalEvents": 152340,
    "eventsPerSecond": 125.5,
    "uptime": 7200,
    "memoryUsage": 342.5
  },
  "startTime": "2026-01-17T08:30:00Z"
}
```

---

## 🚗 Vehicle Data

### List All Vehicles

```bash
curl $API_BASE_URL/emulator/vehicles | jq
```

**Response:**
```json
[
  {
    "id": "vehicle-1",
    "make": "Toyota",
    "model": "Camry",
    "year": 2023,
    "type": "sedan",
    "vin": "1HGBH41JXMN109186",
    "licensePlate": "ABC-1234",
    "startingLocation": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "address": "New York, NY"
    }
  }
]
```

### Get Single Vehicle

```bash
VEHICLE_ID="vehicle-1"
curl $API_BASE_URL/emulator/vehicles/$VEHICLE_ID | jq
```

### Filter Vehicles

```bash
# Get all sedans
curl $API_BASE_URL/emulator/vehicles | jq '[.[] | select(.type == "sedan")]'

# Get vehicles by make
curl $API_BASE_URL/emulator/vehicles | jq '[.[] | select(.make == "Toyota")]'
```

---

## 📡 Real-Time Telemetry

### Get Current Telemetry

```bash
VEHICLE_ID="vehicle-1"
curl $API_BASE_URL/emulator/vehicles/$VEHICLE_ID/telemetry | jq
```

**Response:**
```json
{
  "gps": {
    "latitude": 40.7580,
    "longitude": -73.9855,
    "speed": 45.5,
    "heading": 270,
    "altitude": 10,
    "accuracy": 5,
    "timestamp": "2026-01-17T10:30:00Z"
  },
  "obd2": {
    "rpm": 2500,
    "speed": 45,
    "fuelLevel": 75.5,
    "coolantTemp": 90,
    "engineLoad": 45,
    "throttlePosition": 30,
    "voltage": 13.8,
    "timestamp": "2026-01-17T10:30:00Z"
  },
  "iot": {
    "temperature": 22.5,
    "tirePressure": [32, 32, 32, 32],
    "cargoWeight": 500,
    "timestamp": "2026-01-17T10:30:00Z"
  }
}
```

### Get Telemetry History

**GPS History:**
```bash
curl "$API_BASE_URL/emulator/vehicles/$VEHICLE_ID/telemetry/history?type=gps&limit=10" | jq
```

**OBD2 History:**
```bash
curl "$API_BASE_URL/emulator/vehicles/$VEHICLE_ID/telemetry/history?type=obd2&limit=10" | jq
```

**Time Range Query:**
```bash
START_TIME="2026-01-17T08:00:00Z"
END_TIME="2026-01-17T09:00:00Z"

curl "$API_BASE_URL/emulator/vehicles/$VEHICLE_ID/telemetry/history?type=gps&startTime=$START_TIME&endTime=$END_TIME" | jq
```

---

## 🗺️ Fleet Management

### Fleet Overview

```bash
curl $API_BASE_URL/emulator/fleet/overview | jq
```

**Response:**
```json
{
  "summary": {
    "totalVehicles": 50,
    "activeVehicles": 48,
    "idleVehicles": 2,
    "averageSpeed": 42.3,
    "averageFuelLevel": 68.5
  },
  "vehicles": [
    {
      "id": "vehicle-1",
      "make": "Toyota",
      "model": "Camry",
      "currentLocation": {
        "latitude": 40.7580,
        "longitude": -73.9855
      },
      "speed": 45.5,
      "fuelLevel": 75.5,
      "status": "active"
    }
  ]
}
```

### Fleet Positions (Optimized for Maps)

```bash
curl $API_BASE_URL/emulator/fleet/positions | jq
```

**Response:**
```json
{
  "vehicles": [
    {
      "id": "vehicle-1",
      "lat": 40.7580,
      "lng": -73.9855,
      "heading": 270,
      "speed": 45.5,
      "status": "moving"
    }
  ],
  "timestamp": "2026-01-17T10:30:00Z"
}
```

### Routes and Geofences

**Get Routes:**
```bash
curl $API_BASE_URL/emulator/routes | jq
```

**Get Specific Route:**
```bash
ROUTE_ID="route-downtown"
curl $API_BASE_URL/emulator/routes/$ROUTE_ID | jq
```

**Get Geofences:**
```bash
curl $API_BASE_URL/emulator/geofences | jq
```

---

## 🎥 Video Telemaics

### Video Library

```bash
curl $API_BASE_URL/emulator/video/library | jq
```

### Start Video Stream

```bash
VEHICLE_ID="vehicle-1"
CAMERA_ANGLE="front"  # front, rear, left, right, interior

curl -X POST $API_BASE_URL/emulator/video/stream/$VEHICLE_ID/$CAMERA_ANGLE/start
```

### Stop Video Stream

```bash
curl -X POST $API_BASE_URL/emulator/video/stream/$VEHICLE_ID/$CAMERA_ANGLE/stop
```

### Get Active Streams

```bash
curl $API_BASE_URL/emulator/video/streams | jq
```

---

## 📻 Radio/PTT

### Get Radio Channels

```bash
curl $API_BASE_URL/emulator/channels | jq
```

---

## 📦 Inventory

### Get Inventory

```bash
curl $API_BASE_URL/emulator/inventory | jq
```

### Search by Category

```bash
CATEGORY="oil-filters"
curl $API_BASE_URL/emulator/inventory/category/$CATEGORY | jq
```

### Search by SKU

```bash
SKU="OF-123"
curl "$API_BASE_URL/emulator/inventory/search?sku=$SKU" | jq
```

---

## 🔄 WebSocket Streaming

### JavaScript Example

```javascript
// Connect to WebSocket
const ws = new WebSocket('wss://proud-bay-0fdc8040f.3.azurestaticapps.net/emulator/stream');

// Handle connection open
ws.onopen = () => {
  console.log('Connected to emulator stream');

  // Subscribe to specific vehicle
  ws.send(JSON.stringify({
    type: 'subscription:add',
    payload: {
      entity: 'vehicle',
      id: 'vehicle-1'
    }
  }));
};

// Handle incoming messages
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch(data.type) {
    case 'gps':
      console.log('GPS Update:', data.data);
      break;
    case 'obd2':
      console.log('OBD2 Update:', data.data);
      break;
    case 'fuel':
      console.log('Fuel Event:', data.data);
      break;
    default:
      console.log('Event:', data);
  }
};

// Handle errors
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// Handle connection close
ws.onclose = () => {
  console.log('Disconnected from emulator stream');
};
```

### Python Example

```python
import websocket
import json

def on_message(ws, message):
    data = json.loads(message)
    print(f"Received: {data}")

def on_error(ws, error):
    print(f"Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("Connection closed")

def on_open(ws):
    print("Connected to emulator stream")

    # Subscribe to vehicle updates
    ws.send(json.dumps({
        "type": "subscription:add",
        "payload": {
            "entity": "vehicle",
            "id": "vehicle-1"
        }
    }))

# Create WebSocket connection
ws = websocket.WebSocketApp(
    "wss://proud-bay-0fdc8040f.3.azurestaticapps.net/emulator/stream",
    on_open=on_open,
    on_message=on_message,
    on_error=on_error,
    on_close=on_close
)

# Run forever
ws.run_forever()
```

---

## 🔧 Advanced Examples

### Batch Operations

**Get Multiple Vehicles:**
```bash
#!/bin/bash
VEHICLE_IDS=("vehicle-1" "vehicle-2" "vehicle-3")

for VEHICLE_ID in "${VEHICLE_IDS[@]}"; do
  echo "=== $VEHICLE_ID ==="
  curl -s $API_BASE_URL/emulator/vehicles/$VEHICLE_ID/telemetry | jq '.gps'
  echo ""
done
```

### Monitor Fleet in Real-Time

```bash
#!/bin/bash
while true; do
  clear
  echo "Fleet Status - $(date)"
  echo "================================"

  curl -s $API_BASE_URL/emulator/fleet/overview | jq '{
    total: .summary.totalVehicles,
    active: .summary.activeVehicles,
    avgSpeed: .summary.averageSpeed,
    avgFuel: .summary.averageFuelLevel
  }'

  sleep 5
done
```

### Track Vehicle Journey

```bash
#!/bin/bash
VEHICLE_ID="vehicle-1"
LOG_FILE="vehicle-journey.log"

while true; do
  TELEMETRY=$(curl -s $API_BASE_URL/emulator/vehicles/$VEHICLE_ID/telemetry)

  LAT=$(echo "$TELEMETRY" | jq -r '.gps.latitude')
  LNG=$(echo "$TELEMETRY" | jq -r '.gps.longitude')
  SPEED=$(echo "$TELEMETRY" | jq -r '.gps.speed')
  TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  echo "$TIMESTAMP,$LAT,$LNG,$SPEED" >> $LOG_FILE
  echo "Logged: $TIMESTAMP - Lat: $LAT, Lng: $LNG, Speed: $SPEED"

  sleep 5
done
```

### React Component Example

```tsx
import { useEffect, useState } from 'react';

interface FleetStatus {
  totalVehicles: number;
  activeVehicles: number;
  averageSpeed: number;
}

export function FleetDashboard() {
  const [status, setStatus] = useState<FleetStatus | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const response = await fetch(
        'https://proud-bay-0fdc8040f.3.azurestaticapps.net/api/emulator/fleet/overview'
      );
      const data = await response.json();
      setStatus(data.summary);
    };

    // Fetch immediately
    fetchStatus();

    // Update every 5 seconds
    const interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!status) return <div>Loading...</div>;

  return (
    <div className="fleet-dashboard">
      <h2>Fleet Status</h2>
      <div className="stats">
        <div>Total Vehicles: {status.totalVehicles}</div>
        <div>Active: {status.activeVehicles}</div>
        <div>Avg Speed: {status.averageSpeed.toFixed(1)} mph</div>
      </div>
    </div>
  );
}
```

---

## 📚 Additional Resources

- **Full API Documentation:** `/api/src/routes/emulator.routes.ts`
- **Deployment Guide:** `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Monitoring Script:** `scripts/monitor-emulators.sh`
- **Test Suite:** `scripts/test-emulator-api.sh`

---

**Last Updated:** January 17, 2026
