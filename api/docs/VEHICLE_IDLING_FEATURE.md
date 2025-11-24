# Vehicle Idling Detection & Tracking

## Overview

The Vehicle Idling Detection system monitors and tracks vehicle idling time to help reduce fuel costs and emissions. The system provides real-time detection, historical analytics, cost calculations, and configurable alerts.

## Key Features

### 1. Real-Time Idling Detection
- Automatic detection when vehicle is:
  - Engine ON
  - Speed < 3 mph (to account for GPS drift)
  - RPM > 500 (engine actually running)
- Event lifecycle management (start/update/end)
- Location tracking with reverse geocoding

### 2. Cost & Environmental Impact
- **Fuel Waste Calculation**: ~0.25 gallons/hour (configurable per vehicle type)
- **Cost Estimation**: Based on local fuel prices (default $3.50/gallon)
- **CO2 Emissions**: 8.89 kg per gallon (EPA standard)

### 3. Alert System
- **Warning**: 5 minutes (default)
- **Alert**: 10 minutes (default)
- **Critical**: 30 minutes (default)
- Configurable per vehicle or vehicle type
- Multi-channel notifications (email, SMS, push, dashboard)

### 4. Analytics & Reporting
- Real-time active idling dashboard
- Historical event tracking
- Vehicle performance rankings (top offenders)
- Driver performance metrics
- Monthly cost reports
- Fleet-wide statistics

## Database Schema

### Tables Created

#### `vehicle_idling_events`
Main event log storing individual idling occurrences.

**Key Fields**:
- `start_time`, `end_time`, `duration_seconds`
- `latitude`, `longitude`, `location_name`
- `engine_rpm`, `speed_mph`, `fuel_level_percent`
- `estimated_fuel_wasted_gallons`, `estimated_fuel_cost_usd`, `estimated_co2_kg`
- `idle_type`: traffic, loading_unloading, warmup, cooldown, break, unauthorized, unknown
- `alert_triggered`, `alert_sent_at`

#### `vehicle_idling_thresholds`
Customizable thresholds per vehicle or vehicle type.

**Default Thresholds**:
| Vehicle Type | Fuel Consumption (gph) | Warning | Alert | Critical |
|--------------|------------------------|---------|-------|----------|
| Sedan        | 0.16                   | 5 min   | 10 min| 30 min   |
| Truck        | 0.30                   | 5 min   | 10 min| 30 min   |
| Van          | 0.22                   | 5 min   | 10 min| 30 min   |
| SUV          | 0.20                   | 5 min   | 10 min| 30 min   |
| Electric     | 0.00                   | 5 min   | 10 min| 30 min   |
| Hybrid       | 0.10                   | 5 min   | 10 min| 30 min   |

#### `vehicle_idling_daily_summary`
Pre-aggregated daily statistics for faster reporting.

#### `vehicle_idling_alerts`
Alert log with acknowledgment tracking.

### Views

#### `active_idling_events`
Real-time view of currently idling vehicles with severity levels.

#### `top_idling_vehicles_30d`
Ranking of vehicles by total idling time (last 30 days).

#### `driver_idling_performance_30d`
Driver scoreboard showing idling metrics.

#### `fleet_idling_costs_monthly`
Monthly cost breakdown for the entire fleet.

## API Endpoints

### Base URL: `/api/v1/idling`

### Active Monitoring

#### `GET /active`
Get all currently idling vehicles
```json
{
  "success": true,
  "count": 3,
  "events": [
    {
      "id": 1,
      "vehicle_id": 42,
      "vehicle_name": "Truck-101",
      "current_duration_minutes": 12.5,
      "severity_level": "alert",
      "latitude": 30.2672,
      "longitude": -97.7431,
      "location_name": "Austin, TX"
    }
  ]
}
```

#### `GET /active/:vehicleId`
Get active idling event for specific vehicle

### Historical Data

#### `GET /vehicle/:vehicleId`
Get idling history for a vehicle
**Query Params**:
- `days` (default: 30) - Days to look back
- `limit` (default: 100) - Max events to return
- `offset` (default: 0) - Pagination offset

#### `GET /vehicle/:vehicleId/stats`
Get aggregated statistics for a vehicle
```json
{
  "success": true,
  "vehicleId": 42,
  "days": 30,
  "stats": {
    "total_events": 45,
    "total_idle_hours": 18.5,
    "total_fuel_wasted_gallons": 4.625,
    "total_fuel_cost_usd": 16.19,
    "total_co2_kg": 41.1,
    "avg_duration_minutes": 24.7
  }
}
```

### Fleet Analytics

#### `GET /fleet/stats`
Fleet-wide idling statistics

#### `GET /top-offenders`
Get vehicles with most idling time
**Query Params**:
- `limit` (default: 10) - Number of vehicles to return
- `days` (default: 30) - Days to analyze

### Driver Performance

#### `GET /driver/:driverId/performance`
Get driver idling performance metrics

#### `GET /driver/:driverId/history`
Get driver's idling event history

### Manual Reporting

#### `POST /manual`
Manually report an idling event (for offline data or corrections)
```json
{
  "vehicleId": 42,
  "driverId": 15,
  "startTime": "2025-01-24T10:00:00Z",
  "endTime": "2025-01-24T10:15:00Z",
  "latitude": 30.2672,
  "longitude": -97.7431,
  "idleType": "loading_unloading",
  "driverNotes": "Waiting for shipment delivery"
}
```

### Configuration

#### `GET /thresholds/:vehicleId`
Get idling thresholds for a vehicle

#### `PUT /thresholds/:vehicleId`
Update idling thresholds
```json
{
  "warningThresholdSeconds": 300,
  "alertThresholdSeconds": 600,
  "criticalThresholdSeconds": 1800,
  "fuelConsumptionRateGph": 0.25,
  "avgFuelPricePerGallon": 3.75,
  "sendDriverAlert": true,
  "sendManagerAlert": true
}
```

### Alerts

#### `GET /alerts`
Get recent idling alerts
**Query Params**:
- `limit` (default: 50)
- `unacknowledged` (boolean) - Only show unacknowledged alerts

#### `POST /alerts/:alertId/acknowledge`
Acknowledge an alert

### Reports

#### `GET /reports/monthly`
Get monthly idling cost reports
**Query Params**:
- `months` (default: 12) - Number of months to include

## Integration with Telemetry

### Real-Time Integration

The idling service processes vehicle state updates from telemetry sources:

```typescript
// From GPS/Telematics/OBD2
const vehicleState = {
  vehicle_id: 42,
  driver_id: 15,
  engine_on: true,
  speed_mph: 0.5,
  engine_rpm: 750,
  latitude: 30.2672,
  longitude: -97.7431,
  timestamp: new Date()
};

await idlingService.processVehicleStateUpdate(vehicleState);
```

### Event Emissions

The service emits real-time events for WebSocket broadcasting:

- `idling:started` - New idling event detected
- `idling:ended` - Idling event concluded
- `idling:alert` - Threshold exceeded

## Usage Examples

### Starting the Service

```typescript
import { VehicleIdlingService } from './services/vehicle-idling.service';
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

const idlingService = new VehicleIdlingService(pool);

// Start monitoring (checks every 30 seconds)
idlingService.startMonitoring(30000);

// Listen for events
idlingService.on('idling:alert', (data) => {
  console.log(`Alert: Vehicle ${data.vehicleId} idling for ${data.duration} seconds`);
  // Send notifications
});
```

### Processing Telemetry Data

```typescript
// In your telemetry processing pipeline
app.post('/api/v1/telemetry', async (req, res) => {
  const telemetryData = req.body;

  // Process idling detection
  await idlingService.processVehicleStateUpdate({
    vehicle_id: telemetryData.vehicleId,
    driver_id: telemetryData.driverId,
    engine_on: telemetryData.engineOn,
    speed_mph: telemetryData.speed,
    engine_rpm: telemetryData.rpm,
    latitude: telemetryData.lat,
    longitude: telemetryData.lng,
    timestamp: new Date(telemetryData.timestamp)
  });

  res.json({ success: true });
});
```

## Mobile App Integration

### Display Active Idling Status

```swift
// In your vehicle dashboard view
struct VehicleDashboard: View {
    @State private var activeIdling: IdlingEvent?

    var body: some View {
        if let idling = activeIdling {
            IdlingAlertBanner(
                duration: idling.currentDurationMinutes,
                severity: idling.severityLevel,
                estimatedCost: idling.estimatedCost
            )
        }
    }

    func loadIdlingStatus() {
        APIClient.get("/api/v1/idling/active/\\(vehicleId)") { result in
            activeIdling = result.event
        }
    }
}
```

### Show Idling Statistics

Add to vehicle detail screen or driver performance dashboard.

## Performance Considerations

### Indexes Created

- `idx_idling_vehicle_time` - Fast vehicle history queries
- `idx_idling_driver_time` - Fast driver performance lookups
- `idx_idling_duration` - Quick sorting by duration
- `idx_idling_location` - Geospatial queries
- `idx_idling_date` - Daily/monthly aggregations
- `idx_idling_alerts` - Unacknowledged alert filtering

### Optimization Strategies

1. **Use Views for Reporting**: Pre-built views optimize common queries
2. **Daily Summaries**: Avoid scanning raw events for date-range queries
3. **Pagination**: Always use `limit` and `offset` for large datasets
4. **Caching**: Cache threshold lookups (rarely change)

## Security

- All endpoints require authentication (`authenticate` middleware)
- Input validation via `express-validator`
- Parameterized queries prevent SQL injection ($1, $2, $3)
- Rate limiting applied via global limiters

## Monitoring & Logging

The service logs:
- Idling event start/end
- Alert triggers
- Threshold updates
- Manual event reports

Log Format:
```
[IdlingService] Idling started: vehicle 42, event 1234
[IdlingService] Alert triggered: vehicle 42, severity warning, duration 305s
[IdlingService] Idling ended: vehicle 42, duration 15.5min, cost $1.94
```

## Next Steps

1. **Run Migration**:
   ```bash
   psql -h localhost -U fleet_user -d fleet_management -f api/src/migrations/20250124_vehicle_idling_tracking.sql
   ```

2. **Connect Telemetry Sources**:
   - GPS providers (Samsara, Geotab, etc.)
   - OBD2 devices
   - Smartcar API
   - Custom telemetry endpoints

3. **Configure Thresholds**:
   - Set vehicle-specific thresholds
   - Adjust fuel consumption rates
   - Update local fuel prices

4. **Build Frontend Dashboard**:
   - Active idling map view
   - Top offenders leaderboard
   - Cost trend charts
   - Driver performance scoreboard

5. **Enable Notifications**:
   - Configure email/SMS services
   - Set up push notification tokens
   - Define escalation rules

## Troubleshooting

### Idling Not Detected

**Check**:
- Is `processVehicleStateUpdate` being called?
- Is `engine_on` true?
- Is `speed_mph` < 3?
- Is `engine_rpm` > 500?

**Debug**:
```typescript
idlingService.on('idling:started', (data) => {
  console.log('Idling detected:', data);
});
```

### Costs Not Calculating

**Check**:
- Are thresholds configured for vehicle/type?
- Does event have `duration_seconds` set?
- Is auto-trigger working? (check for trigger execution)

### Alerts Not Firing

**Check**:
- Is monitoring started? (`startMonitoring()`)
- Are thresholds exceeded?
- Is `send_driver_alert`/`send_manager_alert` enabled?

## Cost Savings Example

**Fleet of 50 Vehicles**:
- Average 15 minutes idle/day per vehicle
- 0.25 gal/hour consumption = 0.0625 gal/day per vehicle
- $3.50/gallon fuel price

**Daily**: 50 × 0.0625 × $3.50 = **$10.94/day**
**Monthly**: $10.94 × 30 = **$328.13/month**
**Annual**: $328.13 × 12 = **$3,937.50/year**

**With 20% reduction through awareness**: **$787.50/year savings**

## Support

For issues or questions:
- Check logs: `/api/logs/idling-service.log`
- Verify database connection
- Ensure telemetry data is flowing
- Review threshold configuration
