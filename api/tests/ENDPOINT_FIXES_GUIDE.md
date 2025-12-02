# Fixing 404 Endpoints - Implementation Guide

This guide provides specific fixes for the 6 endpoints that are returning 404 errors.

---

## Issue Summary

These endpoints are registered in `server.ts` but return 404 because their route files only define sub-routes without a base route handler:

1. `GET /api/damage` - 404
2. `GET /api/ev` - 404
3. `GET /api/dispatch` - 404
4. `GET /api/emulator` - 404
5. `GET /api/smartcar` - 404
6. `GET /api/mileage-reimbursement` - 404

---

## Fix 1: `/api/damage` Endpoint

**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/routes/damage.ts`

**Current Status:** Only has sub-routes like `/analyze-photo`, `/analyze-video`, etc.

**Fix:** Add a base route handler

```typescript
// Add this near the top of the file, after the helper functions

/**
 * GET /api/damage
 * Get available damage detection endpoints and service status
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    res.json({
      status: 'operational',
      message: 'Mobile Damage Detection API',
      endpoints: {
        analyzePhoto: 'POST /api/damage/analyze-photo',
        analyzeVideo: 'POST /api/damage/analyze-video',
        analyzeLidar: 'POST /api/damage/analyze-lidar',
        getDamageReport: 'GET /api/damage/reports/:id',
        listDamageReports: 'GET /api/damage/reports'
      },
      services: {
        openai_vision: visionService !== null,
        mobile_damage_service: mobileDamageService !== null
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Fix 2: `/api/ev` Endpoint

**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/routes/ev-management.routes.ts`

**Current Status:** Has routes like `/reservations`, `/smart-charging`, etc.

**Fix:** Add a base route handler

```typescript
// Add this after the router initialization and before the other routes

/**
 * GET /api/ev
 * Get EV management service status and available endpoints
 */
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Get basic stats
    const statsQuery = `
      SELECT
        COUNT(DISTINCT cs.id) as total_stations,
        COUNT(DISTINCT v.id) as total_ev_vehicles,
        COUNT(DISTINCT sess.id) as active_sessions
      FROM charging_stations cs
      LEFT JOIN vehicles v ON v.fuel_type = 'Electric'
      LEFT JOIN charging_sessions sess ON sess.status = 'active'
    `;

    const result = await pool.query(statsQuery);
    const stats = result.rows[0];

    res.json({
      status: 'operational',
      message: 'EV Management API',
      endpoints: {
        reservations: 'GET/POST /api/ev/reservations',
        smartCharging: 'GET /api/ev/smart-charging',
        carbonFootprint: 'GET /api/ev/carbon-footprint',
        esgReports: 'GET /api/ev/esg-reports',
        batteryHealth: 'GET /api/ev/battery-health',
        chargingStations: 'GET /api/ev/stations',
        chargingSessions: 'GET /api/ev/sessions'
      },
      statistics: {
        total_charging_stations: parseInt(stats.total_stations || 0),
        total_ev_vehicles: parseInt(stats.total_ev_vehicles || 0),
        active_charging_sessions: parseInt(stats.active_sessions || 0)
      },
      services: {
        ocpp_service: true,
        ev_charging_service: true
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Fix 3: `/api/dispatch` Endpoint

**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/routes/dispatch.routes.ts`

**Current Status:** Has routes like `/channels`, `/emergency`, etc.

**Fix:** Add a base route handler

```typescript
// Add this after the router initialization and before the other routes

/**
 * GET /api/dispatch
 * Get dispatch system status and available endpoints
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get basic stats
    const channelsQuery = 'SELECT COUNT(*) as total FROM dispatch_channels WHERE active = true';
    const channelsResult = await pool.query(channelsQuery);

    const emergencyQuery = `
      SELECT COUNT(*) as total
      FROM emergency_alerts
      WHERE status = 'active'
    `;
    const emergencyResult = await pool.query(emergencyQuery);

    res.json({
      status: 'operational',
      message: 'Fleet Dispatch Radio System',
      endpoints: {
        channels: 'GET /api/dispatch/channels',
        channelDetails: 'GET /api/dispatch/channels/:id',
        createChannel: 'POST /api/dispatch/channels',
        channelHistory: 'GET /api/dispatch/channels/:id/history',
        listeners: 'GET /api/dispatch/channels/:id/listeners',
        emergency: 'GET/POST /api/dispatch/emergency',
        acknowledgeAlert: 'PUT /api/dispatch/emergency/:id/acknowledge',
        resolveAlert: 'PUT /api/dispatch/emergency/:id/resolve',
        metrics: 'GET /api/dispatch/metrics',
        websocket: 'ws://[host]/api/dispatch/ws'
      },
      statistics: {
        active_channels: parseInt(channelsResult.rows[0]?.total || 0),
        active_emergencies: parseInt(emergencyResult.rows[0]?.total || 0)
      },
      services: {
        dispatch_service: true,
        webrtc_service: true,
        websocket_enabled: true
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Fix 4: `/api/emulator` Endpoint

**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/routes/emulator.routes.ts`

**Current Status:** Has routes like `/status`, `/vehicles`, etc.

**Fix:** Add a base route handler

```typescript
// Add this after the router initialization and before the other routes

/**
 * GET /api/emulator
 * Get emulator system overview and available endpoints
 */
router.get('/', (req: Request, res: Response) => {
  try {
    res.json({
      status: 'operational',
      message: 'Fleet Emulation System',
      description: 'Comprehensive REST API for controlling the fleet emulation system',
      endpoints: {
        systemStatus: 'GET /api/emulator/status',
        vehicles: 'GET /api/emulator/vehicles',
        vehicleDetails: 'GET /api/emulator/vehicles/:id',
        createVehicle: 'POST /api/emulator/vehicles',
        updateVehicle: 'PUT /api/emulator/vehicles/:id',
        deleteVehicle: 'DELETE /api/emulator/vehicles/:id',
        startVehicle: 'POST /api/emulator/vehicles/:id/start',
        stopVehicle: 'POST /api/emulator/vehicles/:id/stop',
        startAll: 'POST /api/emulator/start-all',
        stopAll: 'POST /api/emulator/stop-all',
        resetAll: 'POST /api/emulator/reset-all'
      },
      features: {
        gps_simulation: true,
        obd2_data: true,
        vehicle_telemetry: true,
        real_time_updates: true,
        batch_operations: true
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Fix 5: `/api/smartcar` Endpoint

**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/routes/smartcar.routes.ts`

**Current Status:** Has routes like `/connect`, `/callback`, `/vehicles`

**Fix:** Add a base route handler

```typescript
// Add this after the router initialization and before the other routes

/**
 * GET /api/smartcar
 * Get Smartcar integration status and available endpoints
 */
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    let connectedVehicles = 0;

    if (smartcarService) {
      const vehiclesQuery = `
        SELECT COUNT(*) as total
        FROM vehicles
        WHERE smartcar_vehicle_id IS NOT NULL
      `;
      const result = await pool.query(vehiclesQuery);
      connectedVehicles = parseInt(result.rows[0]?.total || 0);
    }

    res.json({
      status: smartcarService ? 'operational' : 'not_configured',
      message: 'Smartcar Connected Vehicle Integration',
      configured: smartcarService !== null,
      endpoints: {
        connect: 'GET /api/smartcar/connect',
        callback: 'GET /api/smartcar/callback',
        vehicles: 'GET /api/smartcar/vehicles',
        vehicleDetails: 'GET /api/smartcar/vehicles/:id',
        location: 'GET /api/smartcar/vehicles/:id/location',
        odometer: 'GET /api/smartcar/vehicles/:id/odometer',
        lock: 'POST /api/smartcar/vehicles/:id/lock',
        unlock: 'POST /api/smartcar/vehicles/:id/unlock',
        disconnect: 'DELETE /api/smartcar/vehicles/:id'
      },
      statistics: {
        connected_vehicles: connectedVehicles
      },
      configuration: {
        client_id_set: !!process.env.SMARTCAR_CLIENT_ID,
        client_secret_set: !!process.env.SMARTCAR_CLIENT_SECRET,
        redirect_uri: process.env.SMARTCAR_REDIRECT_URI || 'Not configured'
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Fix 6: `/api/mileage-reimbursement` Endpoint

**File:** `/Users/andrewmorton/Documents/GitHub/Fleet/api/src/routes/mileage-reimbursement.ts`

**Investigation Needed:** This endpoint should work since it's a standard CRUD route. Need to check:

1. Check if the route file exports the router properly
2. Verify database table exists
3. Check authentication middleware

**Temporary Fix:** Add a base route handler

```typescript
// If the file doesn't already have a GET / handler, add this:

router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT * FROM mileage_reimbursements
      ORDER BY created_at DESC
      LIMIT 100
    `;
    const result = await pool.query(query);

    res.json({
      status: 'success',
      count: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching mileage reimbursements:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## Testing the Fixes

After applying these fixes, test each endpoint:

```bash
# Test without authentication
curl http://68.220.148.2/api/damage
curl http://68.220.148.2/api/ev
curl http://68.220.148.2/api/dispatch
curl http://68.220.148.2/api/emulator
curl http://68.220.148.2/api/smartcar
curl http://68.220.148.2/api/mileage-reimbursement

# Expected: Should return JSON with endpoint information
# Not 404 errors
```

Or run the automated test suite:

```bash
cd /Users/andrewmorton/Documents/GitHub/Fleet/api
python3 tests/endpoint-verification.py
```

---

## Alternative Approach: API Documentation Fix

Instead of adding base route handlers, you could update the API documentation to reflect the actual endpoint structure:

### Option 1: Update OpenAPI Spec

Remove the base endpoints from the OpenAPI spec and only document the actual sub-routes.

### Option 2: Create an API Index Endpoint

Create a single `/api` endpoint that returns all available routes:

```typescript
// In server.ts, add this before other routes:

app.get('/api', (req, res) => {
  res.json({
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/api/health',
    categories: {
      system: ['/api/health', '/api/docs', '/api/openapi.json'],
      vehicles: ['/api/vehicles'],
      drivers: ['/api/drivers'],
      damage: [
        '/api/damage/analyze-photo',
        '/api/damage/analyze-video',
        '/api/damage/reports'
      ],
      ev: [
        '/api/ev/reservations',
        '/api/ev/smart-charging',
        '/api/ev/stations'
      ],
      dispatch: [
        '/api/dispatch/channels',
        '/api/dispatch/emergency',
        '/api/dispatch/metrics'
      ],
      // ... etc
    }
  });
});
```

---

## Recommended Approach

**Best Practice:** Add base route handlers (Fixes 1-6 above) because:

1. ✓ Provides discoverability - developers can explore the API
2. ✓ Returns helpful information about available endpoints
3. ✓ Shows service status and configuration
4. ✓ Includes statistics and metrics
5. ✓ Consistent with REST API best practices
6. ✓ Better developer experience

---

## Deployment Checklist

After applying fixes:

- [ ] Apply fixes to all 6 route files
- [ ] Test each endpoint locally
- [ ] Run full endpoint verification suite
- [ ] Update OpenAPI documentation
- [ ] Deploy to dev environment
- [ ] Test in dev
- [ ] Deploy to staging
- [ ] Test in staging
- [ ] Deploy to production
- [ ] Run final verification
- [ ] Update API documentation
- [ ] Notify API consumers of new endpoints

---

## Expected Results After Fixes

Running the test suite should show:

```
Total Tests:   44
Passed:        11 (up from 5)
Failed:        33 (authentication required - expected)
Success Rate:  25% (up from 11.4%)

All base endpoints should return 200 OK with helpful information
All protected endpoints should return 401 (as expected)
Zero endpoints should return 404
```
