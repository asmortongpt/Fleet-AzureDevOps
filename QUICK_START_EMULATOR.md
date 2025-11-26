# Quick Start: Fleet Emulator

## Start Emulator (One Command)

```bash
npx tsx simple-fleet-emulator.ts
```

That's it! The emulator is now generating real-time vehicle data.

## What You'll See

```
╔═══════════════════════════════════════════════════════╗
║        Simple Fleet Emulator - Real-time Demo        ║
╚═══════════════════════════════════════════════════════╝

Vehicles: 5
HTTP API: http://localhost:3002
WebSocket: ws://localhost:3003

✅ HTTP server running on http://localhost:3002
✅ WebSocket server running on ws://localhost:3003

Real-time vehicle updates:
  COT-POL-0001: Lat 30.441234, Lng -84.280567, 35.2 mph, Fuel 68.5%
  COT-FIR-0002: Lat 30.445678, Lng -84.275432, 0.0 mph, Fuel 85.3%
  COT-PUB-0003: Lat 30.438901, Lng -84.285123, 22.1 mph, Fuel 45.2%
```

## Test API (In Another Terminal)

```bash
# Get all vehicles
curl http://localhost:3002/vehicles

# Get specific vehicle
curl http://localhost:3002/vehicles/COT-POL-0001
```

## Connect Frontend

### React Component Example

```tsx
import { useEffect, useState } from 'react'

interface Vehicle {
  id: string
  name: string
  location: { latitude: number; longitude: number; speed: number }
  telemetry: { rpm: number; fuelLevel: number }
  status: string
}

export function LiveVehicleTracker() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3003')

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (message.type === 'init') {
        setVehicles(message.vehicles)
      }

      if (message.type === 'vehicle-update') {
        setVehicles(prev =>
          prev.map(v =>
            v.id === message.data.vehicleId
              ? { ...v, ...message.data }
              : v
          )
        )
      }
    }

    return () => ws.close()
  }, [])

  return (
    <div>
      <h2>Live Fleet ({vehicles.length} vehicles)</h2>
      {vehicles.map(vehicle => (
        <div key={vehicle.id}>
          <strong>{vehicle.name}</strong>
          <div>Speed: {vehicle.location.speed.toFixed(1)} mph</div>
          <div>Fuel: {vehicle.telemetry.fuelLevel.toFixed(1)}%</div>
          <div>Status: {vehicle.status}</div>
        </div>
      ))}
    </div>
  )
}
```

## Customize

### Change Number of Vehicles

```bash
NUM_VEHICLES=10 npx tsx simple-fleet-emulator.ts
```

### Change Ports

```bash
HTTP_PORT=4000 WS_PORT=4001 npx tsx simple-fleet-emulator.ts
```

## What Data Is Generated?

Every 2 seconds for each vehicle:

- **GPS:** Latitude, Longitude, Speed, Heading
- **OBD2:** RPM, Fuel Level, Temperature, Battery Voltage
- **Status:** idle, active, responding, maintenance
- **Driver:** Name, Badge, Shift

## Stop Emulator

Press `Ctrl+C` in the terminal

## Next Steps

1. Display vehicles on a map (Google Maps, Leaflet, etc.)
2. Build a telemetry dashboard
3. Add alerts for low fuel, speeding, etc.
4. Create reports from the data

See `EMULATOR_STARTUP_GUIDE.md` for complete documentation.
