# Backend Requirements

This application uses **ONLY real data sources** - no hardcoded demo data is generated within the frontend app.

## Required Backend Services

### 1. Fleet API Server (Port 3000)

The frontend proxies all `/api/*` requests to `http://localhost:3000` via Vite's dev server.

**Required Endpoints:**

```
GET  /api/vehicles              # List all vehicles
POST /api/vehicles              # Create vehicle
GET  /api/vehicles/:id          # Get vehicle details
PUT  /api/vehicles/:id          # Update vehicle
DELETE /api/vehicles/:id        # Delete vehicle

GET  /api/drivers               # List all drivers
POST /api/drivers               # Create driver
GET  /api/drivers/:id           # Get driver details
PUT  /api/drivers/:id           # Update driver
DELETE /api/drivers/:id         # Delete driver

GET  /api/work-orders           # List all work orders
POST /api/work-orders           # Create work order
PUT  /api/work-orders/:id       # Update work order
DELETE /api/work-orders/:id     # Delete work order

GET  /api/fuel-transactions     # List fuel transactions
POST /api/fuel-transactions     # Create fuel transaction
PUT  /api/fuel-transactions/:id # Update fuel transaction
DELETE /api/fuel-transactions/:id # Delete fuel transaction

GET  /api/facilities            # List all facilities
POST /api/facilities            # Create facility
PUT  /api/facilities/:id        # Update facility
DELETE /api/facilities/:id      # Delete facility

GET  /api/maintenance-schedules # List maintenance schedules
POST /api/maintenance-schedules # Create maintenance schedule
PUT  /api/maintenance-schedules/:id # Update maintenance schedule
DELETE /api/maintenance-schedules/:id # Delete maintenance schedule

GET  /api/routes                # List all routes
POST /api/routes                # Create route
PUT  /api/routes/:id            # Update route
DELETE /api/routes/:id          # Delete route
```

**Expected Response Format:**

All list endpoints should return:
```json
{
  "data": [...array of items...],
  "total": 123,
  "page": 1,
  "limit": 50
}
```

All create/update/delete operations should return the affected item:
```json
{
  "data": {...item...}
}
```

### 2. WebSocket Emulator (Port 3000)

**WebSocket URL:** `ws://localhost:3000/api/emulator/ws`

The real-time telemetry system connects to this WebSocket endpoint to receive live vehicle updates.

**Message Types:**

```typescript
// Vehicle telemetry updates
{
  type: 'vehicle:telemetry' | 'telemetry:update',
  vehicleId: string,
  timestamp: string,
  data: {
    gps?: { latitude: number, longitude: number, speed: number, heading: number, accuracy: number },
    obd?: { rpm: number, speed: number, fuelLevel: number, engineTemp: number, batteryVoltage: number, dtcCodes: string[] },
    driver?: { harshBraking: boolean, harshAcceleration: boolean, speeding: boolean, idling: boolean },
    fuel?: { level: number, consumption: number, efficiency: number }
  }
}

// GPS position updates
{
  type: 'vehicle:position' | 'gps:update',
  vehicleId: string,
  latitude: number,
  longitude: number,
  speed: number,
  heading: number
}

// Vehicle alerts
{
  type: 'vehicle:alert' | 'alert',
  vehicleId: string,
  alertType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  message: string
}

// Emulator statistics
{
  type: 'emulator:stats',
  stats: {
    totalVehicles: number,
    activeVehicles: number,
    totalEvents: number,
    eventsPerSecond: number,
    uptime: number
  }
}

// Emulator lifecycle
{
  type: 'emulator:started' | 'emulator:stopped'
}
```

## Starting the Backend

### Option 1: Using the Server Directory (if exists)

```bash
cd server
npm install
npm start
```

### Option 2: Using Docker Compose (if exists)

```bash
docker-compose up -d
```

### Option 3: Using Separate Microservices

If the backend is split into separate services:

```bash
# Terminal 1: Start the API server
cd api-server
npm start

# Terminal 2: Start the WebSocket emulator
cd emulator
npm start
```

## Data Sources

The application will display:

1. **API Data** - Vehicles, drivers, work orders, etc. from the REST API
2. **Emulator Data** - Real-time telemetry, GPS positions, alerts from WebSocket
3. **Database Test Data** - Any data manually entered via admin interface or database tools

**NO hardcoded/generated demo data** is used. If the backend is not running, the dashboard will show empty states (0 vehicles, 0 drivers, etc.).

## Verifying Backend Connection

When the frontend starts, check the browser console:

```
✅ Using production API/emulator data - no hardcoded demo data
```

If you see API proxy errors in the Vite terminal:

```
[vite] http proxy error: /api/vehicles
AggregateError [ECONNREFUSED]
```

This means the backend is not running. Start the backend services on port 3000.

## Environment Variables

The frontend uses these Vite proxy settings (configured in `vite.config.ts`):

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      secure: false
    }
  }
}
```

To change the backend URL, edit `vite.config.ts` and restart the dev server.

## Testing Without Backend

If you need to test the UI without a backend:

1. The application will show empty states
2. All CRUD operations will fail with errors
3. Real-time telemetry will not connect
4. Maps will render but show no vehicle markers

This is intentional - **no fake data is injected**.
