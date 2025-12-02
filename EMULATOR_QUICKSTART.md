# Fleet Emulator Quick Start Guide

This guide will get you up and running with the Fleet Emulator System in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL running
- API server running on port 3000

## Step 1: Apply Database Migration

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet

# Apply the migration
psql -U your_username -d your_database -f api/src/migrations/014_create_emulator_tables.sql
```

## Step 2: Install Dependencies (if not already done)

```bash
cd api
npm install
```

## Step 3: Start the API Server

```bash
cd api
npm run dev
```

The server should start on `http://localhost:3000`

## Step 4: Test the Emulator API

### Check Available Vehicles

```bash
curl http://localhost:3000/api/emulator/vehicles | jq
```

You should see 10 vehicles configured (VEH-001 through VEH-010).

### Check Available Scenarios

```bash
curl http://localhost:3000/api/emulator/scenarios | jq
```

You should see scenarios like:
- `normal_operations`
- `rush_hour`
- `night_shift`
- `emergency_response`
- `stress_test`

### Start Emulation (2 vehicles)

```bash
curl -X POST http://localhost:3000/api/emulator/start \
  -H "Content-Type: application/json" \
  -d '{"vehicleIds": ["VEH-001", "VEH-002"]}' \
  | jq
```

### Check Status

```bash
curl http://localhost:3000/api/emulator/status | jq
```

You should see:
- `isRunning: true`
- `activeVehicles: 2`
- Stats showing events generated

### Get Vehicle Telemetry

```bash
curl http://localhost:3000/api/emulator/vehicles/VEH-001/telemetry | jq
```

You'll see real-time data for:
- GPS location, speed, heading
- OBD-II data (RPM, fuel level, temperature)
- IoT sensor readings
- Driver behavior metrics

### Stop Emulation

```bash
curl -X POST http://localhost:3000/api/emulator/stop | jq
```

## Step 5: Run a Scenario

Try the "rush hour" scenario with heavy traffic:

```bash
curl -X POST http://localhost:3000/api/emulator/scenario/rush_hour | jq
```

This will:
1. Start emulation for 15 vehicles
2. Apply heavy traffic modifiers
3. Increase fuel consumption
4. Generate realistic rush hour events

Check the status periodically:

```bash
watch -n 5 'curl -s http://localhost:3000/api/emulator/status | jq ".data.stats"'
```

## Step 6: Monitor Real-Time Events (WebSocket)

Create a simple WebSocket client to watch events in real-time:

```javascript
// save as test-websocket.js
const WebSocket = require('ws')

const ws = new WebSocket('ws://localhost:3001/emulator/stream')

ws.on('open', () => {
  console.log('Connected to emulator stream')
})

ws.on('message', (data) => {
  const event = JSON.parse(data)
  console.log(`[${event.type}]`, JSON.stringify(event.data, null, 2))
})

ws.on('error', (error) => {
  console.error('WebSocket error:', error.message)
})
```

Run it:

```bash
node test-websocket.js
```

## Complete Testing Script

Save this as `test-emulator.sh`:

```bash
#!/bin/bash

API_URL="http://localhost:3000/api/emulator"

echo "=== Fleet Emulator Test Script ==="
echo

echo "1. Checking available vehicles..."
curl -s $API_URL/vehicles | jq '.data | length'
echo

echo "2. Starting emulation for 3 vehicles..."
curl -s -X POST $API_URL/start \
  -H "Content-Type: application/json" \
  -d '{"vehicleIds": ["VEH-001", "VEH-002", "VEH-003"]}' \
  | jq '.message'
echo

echo "3. Waiting 10 seconds for data generation..."
sleep 10

echo "4. Checking status..."
curl -s $API_URL/status | jq '.data.stats'
echo

echo "5. Getting telemetry for VEH-001..."
curl -s $API_URL/vehicles/VEH-001/telemetry | jq '.data'
echo

echo "6. Pausing emulation..."
curl -s -X POST $API_URL/pause | jq '.message'
echo

echo "7. Waiting 5 seconds..."
sleep 5

echo "8. Resuming emulation..."
curl -s -X POST $API_URL/resume | jq '.message'
echo

echo "9. Waiting 5 seconds..."
sleep 5

echo "10. Stopping emulation..."
curl -s -X POST $API_URL/stop | jq '.message'
echo

echo "=== Test Complete ==="
```

Make it executable and run:

```bash
chmod +x test-emulator.sh
./test-emulator.sh
```

## Query Emulated Data from Database

After running the emulator, query the persisted data:

```sql
-- Count GPS telemetry records
SELECT COUNT(*) FROM emulator_gps_telemetry;

-- Get latest GPS positions for each vehicle
SELECT DISTINCT ON (vehicle_id)
  vehicle_id,
  latitude,
  longitude,
  speed,
  timestamp
FROM emulator_gps_telemetry
ORDER BY vehicle_id, timestamp DESC;

-- Get OBD-II diagnostics
SELECT
  vehicle_id,
  rpm,
  speed,
  fuel_level,
  coolant_temp,
  timestamp
FROM emulator_obd2_data
ORDER BY timestamp DESC
LIMIT 20;

-- Get fuel transactions
SELECT
  vehicle_id,
  station_name,
  gallons,
  total_cost,
  timestamp
FROM emulator_fuel_transactions
ORDER BY timestamp DESC;

-- Get maintenance events
SELECT
  vehicle_id,
  category,
  description,
  total_cost,
  timestamp
FROM emulator_maintenance_events
ORDER BY timestamp DESC;

-- Get driver behavior events
SELECT
  vehicle_id,
  event_type,
  severity,
  score,
  timestamp
FROM emulator_driver_behavior
ORDER BY timestamp DESC;

-- Calculate total events per vehicle
SELECT
  vehicle_id,
  COUNT(*) as event_count
FROM emulator_events
GROUP BY vehicle_id
ORDER BY event_count DESC;

-- Get session statistics
SELECT
  id,
  scenario_id,
  status,
  started_at,
  stopped_at,
  (stopped_at - started_at) as duration,
  stats
FROM emulator_sessions
ORDER BY started_at DESC;
```

## Stress Test (100 Vehicles)

To test system performance:

```bash
# Run stress test scenario
curl -X POST http://localhost:3000/api/emulator/scenario/stress_test | jq

# Monitor system resources
htop  # or Activity Monitor on Mac

# Check event throughput
watch -n 1 'curl -s http://localhost:3000/api/emulator/status | jq ".data.stats.eventsPerSecond"'

# Let it run for 5 minutes, then stop
sleep 300
curl -X POST http://localhost:3000/api/emulator/stop | jq
```

## Troubleshooting

### Port 3001 already in use (WebSocket)

```bash
# Find and kill the process
lsof -ti:3001 | xargs kill -9
```

### Database connection errors

Check your .env file has correct DATABASE_URL:

```bash
# In /Users/andrewmorton/Documents/GitHub/Fleet/api/.env
DATABASE_URL=postgresql://username:password@localhost:5432/fleet
```

### High memory usage

Reduce the number of active vehicles or increase update intervals:

Edit `api/src/emulators/config/default.json`:

```json
{
  "performance": {
    "maxVehicles": 50,
    "updateInterval": 2000
  }
}
```

## Next Steps

1. **Integrate with Frontend**: Use the WebSocket stream to update a live map
2. **Create Custom Scenarios**: Edit `config/scenarios.json` to add your own
3. **Extend Emulators**: Add new sensors or event types
4. **Export Data**: Create reports from the emulated data
5. **Load Testing**: Use the emulator to stress-test your application

## Advanced Usage

### Custom Route Assignment

```bash
# Get available routes
curl http://localhost:3000/api/emulator/routes | jq '.data.routes[].id'

# Assign specific route to vehicle (TODO: implement in RouteEmulator)
```

### Time Compression

To simulate 24 hours in 24 minutes, edit `config/default.json`:

```json
{
  "timeCompression": {
    "enabled": true,
    "ratio": 60
  }
}
```

This makes 1 real second = 60 simulated seconds.

### Data Export

```bash
# Export last hour of GPS data to CSV
psql -U username -d fleet -c "COPY (
  SELECT vehicle_id, latitude, longitude, speed, timestamp
  FROM emulator_gps_telemetry
  WHERE timestamp > NOW() - INTERVAL '1 hour'
  ORDER BY timestamp
) TO STDOUT WITH CSV HEADER" > gps_data.csv
```

## Support

- Full Documentation: `/Users/andrewmorton/Documents/GitHub/Fleet/EMULATOR_SYSTEM.md`
- API Documentation: `http://localhost:3000/api/docs`
- Issues: Create a GitHub issue

## Summary

You now have:

✅ 10 vehicles configured and ready
✅ 10 pre-configured scenarios
✅ 9 emulator types running (GPS, OBD-II, Fuel, Maintenance, Driver, Route, Cost, IoT)
✅ Real-time WebSocket streaming
✅ Database persistence for all events
✅ REST API for control
✅ Production-ready architecture

Start building amazing fleet management features with realistic data!
