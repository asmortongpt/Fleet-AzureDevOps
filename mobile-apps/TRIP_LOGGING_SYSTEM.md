# Automated Trip Logging System with OBD2 Integration

## Overview

The Fleet mobile app includes a comprehensive automated trip logging system that automatically detects, tracks, and logs vehicle trips with full OBD2 integration. The system provides real-time tracking, driver scoring, fuel efficiency monitoring, and harsh event detection.

## Architecture

### System Components

1. **TripLogger Service** (`/mobile/src/services/TripLogger.ts`)
   - Core trip detection and logging engine
   - OBD2 communication and data collection
   - GPS tracking with background location
   - Event detection (harsh acceleration, braking, cornering, speeding)
   - Trip classification (business/personal/mixed)

2. **TripMapView Component** (`/mobile/src/components/TripMapView.tsx`)
   - Visual trip route display on interactive map
   - Speed-colored path visualization
   - Event markers with severity indicators
   - Playback mode with timeline controls
   - Start/end location markers

3. **TripSummary Component** (`/mobile/src/components/TripSummary.tsx`)
   - Comprehensive trip statistics
   - Driver score calculation and breakdown
   - Fuel efficiency metrics
   - Event listing and analysis
   - Trip classification interface
   - Export options (PDF, CSV)

4. **API Endpoints** (`/api/src/routes/mobile-trips.routes.ts`)
   - POST `/api/mobile/trips/start` - Start trip tracking
   - POST `/api/mobile/trips/:id/end` - End trip
   - POST `/api/mobile/trips/:id/metrics` - Save trip metrics
   - GET `/api/mobile/trips/:id` - Get trip details
   - PATCH `/api/mobile/trips/:id/classify` - Update classification

5. **Database Schema** (`/api/src/migrations/031_automated_trip_logging.sql`)
   - `trips` - Main trip records
   - `trip_gps_breadcrumbs` - GPS location history
   - `trip_obd2_metrics` - OBD2 data (10-second intervals)
   - `trip_events` - Driving events
   - `trip_segments` - Multi-stop trip segments
   - `driver_scores_history` - Historical driver scores

## Trip Detection Algorithm

### Auto-Start Detection

The system automatically detects when a trip starts using the following algorithm:

```typescript
// Monitoring interval: Every 10 seconds
const THRESHOLDS = {
  ENGINE_RPM_THRESHOLD: 500,        // RPM - engine is running
  MIN_SPEED_FOR_MOVEMENT: 3,        // mph - vehicle is moving
  MIN_MOVEMENT_DURATION: 10,        // seconds - sustained movement
};

// Detection Logic:
1. Check if engine is running (RPM > 500)
2. Check if vehicle is moving (Speed > 3 mph)
3. Verify sustained movement for 10+ seconds
4. If all conditions met → START TRIP
```

#### Start Detection Flow:

```
┌─────────────────────────────────────────────┐
│ OBD2 Monitoring (every 10 seconds)         │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Engine RPM > 500? │
         └────────┬───────────┘
                  │ Yes
                  ▼
         ┌────────────────┐
         │ Speed > 3 mph?  │
         └────────┬───────────┘
                  │ Yes
                  ▼
         ┌────────────────────┐
         │ Movement sustained  │
         │  for 10+ seconds?   │
         └────────┬────────────┘
                  │ Yes
                  ▼
         ┌────────────────┐
         │  START TRIP     │
         │  - Read start   │
         │    odometer     │
         │  - Capture GPS  │
         │  - Begin logging│
         └─────────────────┘
```

### Auto-End Detection

The system automatically detects when a trip ends using multiple conditions:

```typescript
const THRESHOLDS = {
  MAX_SPEED_FOR_STOPPED: 1,         // mph - vehicle is stopped
  STOP_DURATION_FOR_TRIP_END: 300,  // seconds (5 min) - parked
  ENGINE_OFF_TRIP_END: 60,          // seconds - engine off delay
};

// Detection Logic:
1. Engine Off Detection:
   - If engine RPM < 500 for 60 seconds → END TRIP

2. Parked Detection:
   - If speed < 1 mph for 5 minutes → END TRIP
```

#### End Detection Flow:

```
┌─────────────────────────────────────────────┐
│ OBD2 Monitoring (trip in progress)         │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Engine OFF?     │
         └────────┬───────────┘
                  │ Yes
                  ▼
         ┌────────────────────┐
         │ Wait 60 seconds    │
         │ Engine still off?  │
         └────────┬────────────┘
                  │ Yes
                  ├────────────────┐
                  │                │
                  ▼                ▼
         ┌────────────────┐    ┌────────────────┐
         │ Speed < 1 mph?  │    │ END TRIP       │
         └────────┬───────────┘ │ - Read end     │
                  │ Yes          │   odometer     │
                  │              │ - Capture GPS  │
                  ▼              │ - Calculate    │
         ┌────────────────────┐ │   statistics   │
         │ Stopped for 5 min? │ │ - Save to DB   │
         └────────┬────────────┘ └─────────────────┘
                  │ Yes
                  │
                  └──────────────►
```

## Data Collection

### GPS Breadcrumbs (Every 15 seconds)

```typescript
{
  timestamp: Date,
  latitude: number,
  longitude: number,
  speed_mph: number,
  heading_degrees: number,
  accuracy_meters: number,
  altitude_meters: number,
  // OBD2 data at this point:
  engine_rpm: number,
  fuel_level_percent: number,
  coolant_temp_f: number,
  throttle_position_percent: number
}
```

### OBD2 Metrics (Every 10 seconds)

```typescript
{
  timestamp: Date,
  // Engine Data
  engine_rpm: number,
  engine_load_percent: number,
  engine_coolant_temp_f: number,
  oil_temp_f: number,
  // Fuel Data
  fuel_level_percent: number,
  fuel_flow_rate_gph: number,      // Gallons per hour
  fuel_pressure_psi: number,
  // Performance
  speed_mph: number,
  throttle_position_percent: number,
  accelerator_pedal_position_percent: number,
  // Transmission
  transmission_gear: number,
  transmission_temp_f: number,
  // Electrical
  battery_voltage: number,
  alternator_voltage: number,
  // Air & Intake
  intake_air_temp_f: number,
  mass_air_flow_gps: number,       // Grams per second
  manifold_pressure_psi: number,
  // Odometer
  odometer_miles: number,
  // Diagnostics
  dtc_count: number,                // Diagnostic Trouble Codes
  mil_status: boolean               // Check Engine Light
}
```

## Event Detection

### Harsh Acceleration

```typescript
const HARSH_ACCELERATION_G = 0.35; // g-force threshold

// Detection:
if (acceleration > 0.35g) {
  recordEvent({
    type: 'harsh_acceleration',
    severity: calculateSeverity(acceleration),
    g_force: acceleration,
    speed_mph: currentSpeed
  });
}
```

### Harsh Braking

```typescript
const HARSH_BRAKING_G = -0.40; // g-force threshold (negative)

// Detection:
if (acceleration < -0.40g) {
  recordEvent({
    type: 'harsh_braking',
    severity: calculateSeverity(Math.abs(acceleration)),
    g_force: acceleration,
    speed_mph: currentSpeed
  });
}
```

### Harsh Cornering

```typescript
const HARSH_CORNERING_G = 0.50; // lateral g-force threshold

// Detection:
const lateralG = Math.sqrt(acceleration_y² + acceleration_z²);
if (lateralG > 0.50g) {
  recordEvent({
    type: 'harsh_cornering',
    severity: calculateSeverity(lateralG),
    g_force: lateralG,
    speed_mph: currentSpeed
  });
}
```

### Speeding

```typescript
const SPEEDING_THRESHOLD = 10; // mph over speed limit

// Detection (requires speed limit data):
if (currentSpeed > (speedLimit + 10)) {
  recordEvent({
    type: 'speeding',
    severity: calculateSeverity(currentSpeed - speedLimit),
    speed_mph: currentSpeed,
    speed_limit_mph: speedLimit
  });
}
```

### Event Severity Calculation

```typescript
function calculateEventSeverity(value: number, threshold: number): Severity {
  const ratio = value / threshold;

  if (ratio >= 2.0) return 'critical';  // 2x threshold
  if (ratio >= 1.5) return 'high';      // 1.5x threshold
  if (ratio >= 1.2) return 'medium';    // 1.2x threshold
  return 'low';                         // Just above threshold
}
```

## Driver Score Calculation

### Scoring Algorithm

```typescript
function calculateDriverScore(trip: Trip): number {
  let score = 100; // Start with perfect score

  // Deduct points for harsh events (normalized by distance)
  const distance = trip.distance_miles || 1;
  const eventsPerMile = (
    trip.harsh_acceleration_count +
    trip.harsh_braking_count +
    trip.harsh_cornering_count +
    trip.speeding_count
  ) / distance;

  // Deduct up to 50 points for harsh events
  score -= Math.min(50, eventsPerMile * 100);

  // Deduct 5 points per speeding event
  score -= trip.speeding_count * 5;

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Score Rating:
// 90-100: Excellent (Green)
// 80-89:  Good (Blue)
// 70-79:  Fair (Orange)
// 0-69:   Needs Improvement (Red)
```

### Driver Score Components

1. **Smooth Driving Score** (40%)
   - Harsh acceleration events
   - Harsh braking events
   - Harsh cornering events

2. **Speed Compliance Score** (30%)
   - Speeding events
   - Speed limit violations

3. **Fuel Efficiency Score** (20%)
   - MPG vs vehicle average
   - Excessive idling time

4. **Safety Score** (10%)
   - Critical events
   - Engine warnings
   - Rapid lane changes

## Trip Statistics

### Calculated Metrics

```typescript
interface TripStatistics {
  // Distance & Duration
  distance_miles: number,           // From odometer delta
  duration_seconds: number,         // Time elapsed
  avg_speed_mph: number,           // Average from breadcrumbs
  max_speed_mph: number,           // Maximum from breadcrumbs
  idle_time_seconds: number,       // Time with RPM > 500 and speed < 1

  // Fuel Consumption
  fuel_consumed_gallons: number,   // From fuel level delta
  fuel_efficiency_mpg: number,     // distance / fuel consumed
  fuel_cost: number,               // fuel consumed * price per gallon

  // Driver Performance
  driver_score: number,            // 0-100
  harsh_acceleration_count: number,
  harsh_braking_count: number,
  harsh_cornering_count: number,
  speeding_count: number
}
```

### Calculation Examples

**Fuel Efficiency (MPG):**
```typescript
// Using fuel level percentage
const fuelLevelStart = 75%; // 75% of 15 gallon tank = 11.25 gal
const fuelLevelEnd = 65%;   // 65% of 15 gallon tank = 9.75 gal
const fuelConsumed = 11.25 - 9.75 = 1.5 gallons

const distance = 45.2 miles;
const mpg = distance / fuelConsumed = 30.1 MPG

// Alternative: Using OBD2 fuel flow rate
const totalFuelFlow = sum(all fuel_flow_rate measurements);
const avgFuelFlowGPH = totalFuelFlow / measurementCount;
const tripHours = duration_seconds / 3600;
const fuelConsumed = avgFuelFlowGPH * tripHours;
```

**Average Speed:**
```typescript
// From GPS breadcrumbs
const speeds = breadcrumbs.map(b => b.speed_mph).filter(s => s > 0);
const avgSpeed = speeds.reduce((a, b) => a + b) / speeds.length;
```

**Idle Time:**
```typescript
// From OBD2 metrics
const idleMetrics = metrics.filter(m =>
  m.engine_rpm > 500 &&  // Engine running
  m.speed_mph < 1         // Vehicle not moving
);
const idleSeconds = idleMetrics.length * 10; // 10-second intervals
```

## Trip Classification

### Classification Types

1. **Business Trip**
   - Requires business purpose
   - 100% deductible for tax purposes
   - Examples: Client meetings, deliveries, site visits

2. **Personal Trip**
   - Non-business use
   - May incur personal use charges
   - Examples: Commuting, errands, personal travel

3. **Mixed Trip**
   - Part business, part personal
   - Requires percentage breakdown
   - Example: Business meeting followed by personal errand

### Classification Workflow

```typescript
// Classify trip
await tripLogger.classifyTrip('business', 'Client meeting at downtown office');

// API call
POST /api/mobile/trips/:id/classify
{
  usage_type: 'business',
  business_purpose: 'Client meeting at downtown office'
}

// Creates entry in trip_usage_classification table
// Triggers approval workflow if personal/mixed
```

## Map Visualization

### Speed-Coded Path

The trip route is color-coded based on speed:

```typescript
// Speed color mapping
const speedColors = {
  '70+ mph':   '#EF4444',  // Red - High speed
  '50-70 mph': '#F59E0B',  // Orange - Medium speed
  '30-50 mph': '#FCD34D',  // Yellow - Moderate speed
  '10-30 mph': '#10B981',  // Green - Low speed
  '0-10 mph':  '#6B7280'   // Gray - Very low/stopped
};
```

### Event Markers

Events are displayed as color-coded markers on the map:

```typescript
const eventColors = {
  low:      '#10B981',  // Green
  medium:   '#F59E0B',  // Orange
  high:     '#EF4444',  // Red
  critical: '#7C3AED'   // Purple
};

const eventIcons = {
  harsh_acceleration:  'rocket-launch',
  harsh_braking:       'car-brake-alert',
  harsh_cornering:     'car-turbocharger',
  speeding:            'speedometer',
  idling_excessive:    'engine',
  engine_warning:      'alert-circle',
  low_fuel:            'gas-station'
};
```

### Playback Mode

The map includes a playback mode to visualize the trip over time:

```typescript
// Playback controls
- Play/Pause: Animate through trip
- Timeline slider: Scrub through trip
- Speed: 1x, 2x, 5x playback speed
- Current position marker: Shows vehicle location
- Time display: Shows timestamp and speed at current position
```

## OBD2 Integration

### Supported Adapters

- **ELM327** (Bluetooth/WiFi)
  - Most common and affordable
  - Standard OBD2 protocol support
  - AT command set

- **OBDLink MX+** (Bluetooth)
  - Professional-grade
  - Extended PID support
  - Faster data rates

- **Vgate iCar Pro** (WiFi)
  - iOS/Android compatible
  - Real-time streaming
  - Multiple simultaneous connections

### Connection Flow

```
1. Scan for Bluetooth devices
2. Identify OBD2 adapter (by name: "OBD", "ELM327", etc.)
3. Connect to adapter
4. Initialize with AT commands:
   - ATZ (Reset)
   - ATE0 (Echo off)
   - ATSP0 (Auto protocol)
   - ATH0 (Headers off)
5. Begin data collection
```

### PID Requests

```typescript
// Example: Read Engine RPM
Command: '010C'  // Mode 01, PID 0C
Response: '41 0C 1A F8'
// Parse: (0x1A << 8 | 0xF8) / 4 = 1726 RPM

// Example: Read Speed
Command: '010D'  // Mode 01, PID 0D
Response: '41 0D 3C'
// Parse: 0x3C = 60 km/h = 37.3 mph
```

### Error Handling

```typescript
// Connection errors
- Device not found → Retry scan
- Connection timeout → Check device power
- No data → Check vehicle ignition

// Data errors
- Invalid response → Skip reading
- Checksum error → Retry request
- NO DATA response → PID not supported

// Recovery
- Automatic reconnection on disconnect
- Fallback to GPS-only mode if OBD2 fails
- Queue data for sync when connection restored
```

## Background Tracking

### iOS Configuration

```xml
<!-- Info.plist -->
<key>UIBackgroundModes</key>
<array>
  <string>location</string>
  <string>bluetooth-central</string>
</array>

<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to track trips and provide route information</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need your location in the background to automatically track trips</string>

<key>NSBluetoothAlwaysUsageDescription</key>
<string>We need Bluetooth to connect to your vehicle's OBD2 adapter</string>
```

### Android Configuration

```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />

<service
    android:name="com.transistorsoft.locationmanager.service.TrackingService"
    android:enabled="true"
    android:foregroundServiceType="location" />
```

## Data Synchronization

### Sync Strategy

```typescript
// Real-time sync (during trip)
- Save breadcrumb every 15 seconds
- Batch OBD2 metrics every 10 readings (100 seconds)
- Send events immediately (high priority)

// Post-trip sync
- Complete trip data on end
- Upload remaining breadcrumbs
- Upload final metrics
- Calculate and sync statistics

// Offline support
- Queue all data locally (AsyncStorage)
- Retry failed uploads
- Sync when connection restored
```

### Conflict Resolution

```typescript
// Server-side conflict handling
if (clientTimestamp > serverTimestamp) {
  // Client is newer - update server
  updateServerData(clientData);
} else if (serverTimestamp > clientTimestamp) {
  // Server is newer - send to client
  sendUpdateToClient(serverData);
} else {
  // Manual resolution required
  createConflictRecord();
}
```

## Performance Optimization

### Battery Optimization

```typescript
// Dynamic GPS accuracy
- High accuracy during active driving (5s interval)
- Lower accuracy when stopped (30s interval)
- Pause GPS during extended stops (>5 min)

// Bluetooth power management
- Request low-power connection
- Batch OBD2 requests
- Sleep between readings

// Background processing
- Use WorkManager (Android)
- Use Background Tasks (iOS)
- Minimize CPU usage
```

### Data Optimization

```typescript
// Breadcrumb compression
- Store only changed values
- Delta encoding for coordinates
- Reduce precision (6 decimal places)

// Metric batching
- Group 10-20 metrics per upload
- Compress with gzip
- Use efficient binary format

// Database optimization
- Index on trip_id, timestamp
- Partition by date
- Archive old trips
```

## Testing

### Unit Tests

```typescript
// Trip detection
test('should start trip when movement detected', async () => {
  const tripLogger = new TripLogger();
  await tripLogger.connectOBD2();

  // Simulate engine on + movement
  mockOBD2Data({ rpm: 800, speed: 5 });
  await wait(11000); // Wait for sustained movement

  expect(tripLogger.getCurrentTrip()).toBeDefined();
});

// Driver score
test('should calculate correct driver score', () => {
  const trip = {
    distance_miles: 10,
    harsh_acceleration_count: 2,
    harsh_braking_count: 1,
    harsh_cornering_count: 1,
    speeding_count: 0
  };

  const score = calculateDriverScore(trip);
  expect(score).toBeLessThan(100);
  expect(score).toBeGreaterThan(60);
});
```

### Integration Tests

```typescript
// End-to-end trip flow
test('should complete full trip cycle', async () => {
  // Start trip
  const trip = await tripLogger.startTrip(vehicleId, driverId);
  expect(trip.status).toBe('in_progress');

  // Collect data
  await collectDataFor(60); // 1 minute

  // End trip
  const completedTrip = await tripLogger.endTrip();
  expect(completedTrip.status).toBe('completed');
  expect(completedTrip.distance_miles).toBeGreaterThan(0);
  expect(completedTrip.driver_score).toBeDefined();
});
```

## Installation

### Dependencies

```bash
# Core dependencies
npm install react-native-maps
npm install @react-native-community/geolocation
npm install react-native-background-geolocation
npm install react-native-bluetooth-classic
npm install @react-native-async-storage/async-storage
npm install @react-native-community/slider
npm install react-native-vector-icons
npm install date-fns

# Native linking (React Native < 0.60)
react-native link react-native-maps
react-native link @react-native-community/geolocation
```

### Setup

```bash
# iOS
cd ios && pod install

# Android
# Already linked via autolinking
```

## Usage Examples

### Starting a Trip

```typescript
import TripLogger from './services/TripLogger';

// Configure
await TripLogger.configure(
  'https://api.fleet.example.com',
  authToken
);

// Connect OBD2
await TripLogger.connectOBD2();

// Trip starts automatically when movement detected
// Or manually:
const trip = await TripLogger.startTrip(vehicleId, driverId);
```

### Displaying Trip Map

```tsx
import TripMapView from './components/TripMapView';

<TripMapView
  tripId={trip.id}
  startLocation={trip.start_location}
  endLocation={trip.end_location}
  breadcrumbs={trip.breadcrumbs}
  events={trip.events}
  showPlayback={true}
  showSpeedColors={true}
  showEvents={true}
  onEventPress={(event) => console.log('Event:', event)}
/>
```

### Showing Trip Summary

```tsx
import TripSummary from './components/TripSummary';

<TripSummary
  trip={trip}
  events={trip.events}
  onClassify={async (usageType, businessPurpose) => {
    await tripLogger.classifyTrip(usageType, businessPurpose);
  }}
  onExport={async (format) => {
    await exportTrip(trip.id, format);
  }}
  onViewMap={() => {
    navigation.navigate('TripMap', { tripId: trip.id });
  }}
/>
```

## Database Queries

### Get Recent Trips

```sql
SELECT
  t.*,
  v.name as vehicle_name,
  u.name as driver_name,
  (SELECT COUNT(*) FROM trip_events te
   WHERE te.trip_id = t.id
   AND te.severity IN ('high', 'critical')) as critical_events
FROM trips t
LEFT JOIN vehicles v ON t.vehicle_id = v.id
LEFT JOIN users u ON t.driver_id = u.id
WHERE t.tenant_id = $1
  AND t.status = 'completed'
ORDER BY t.start_time DESC
LIMIT 50;
```

### Get Driver Safety Ranking

```sql
SELECT
  driver_id,
  u.name as driver_name,
  COUNT(*) as trips_count,
  SUM(distance_miles) as total_miles,
  AVG(driver_score) as avg_driver_score,
  SUM(harsh_acceleration_count + harsh_braking_count +
      harsh_cornering_count + speeding_count) as total_events,
  RANK() OVER (ORDER BY AVG(driver_score) DESC) as safety_rank
FROM trips t
JOIN users u ON t.driver_id = u.id
WHERE t.tenant_id = $1
  AND t.status = 'completed'
  AND t.end_time >= NOW() - INTERVAL '30 days'
GROUP BY driver_id, u.name
HAVING COUNT(*) >= 5
ORDER BY avg_driver_score DESC;
```

### Get Trip with Full Data

```sql
-- Main trip
SELECT * FROM trips WHERE id = $1;

-- GPS breadcrumbs
SELECT * FROM trip_gps_breadcrumbs
WHERE trip_id = $1
ORDER BY timestamp ASC;

-- OBD2 metrics
SELECT * FROM trip_obd2_metrics
WHERE trip_id = $1
ORDER BY timestamp ASC;

-- Events
SELECT * FROM trip_events
WHERE trip_id = $1
ORDER BY timestamp ASC;
```

## Future Enhancements

### Planned Features

1. **Advanced Analytics**
   - Predictive maintenance alerts
   - Fuel consumption predictions
   - Route optimization suggestions
   - Driver coaching recommendations

2. **Integration Expansions**
   - Apple CarPlay / Android Auto
   - Fleet management platforms
   - Insurance telematics programs
   - Fuel card integration

3. **AI/ML Features**
   - Automatic speed limit detection
   - Route pattern recognition
   - Anomaly detection
   - Personalized driver coaching

4. **Enhanced Mapping**
   - Traffic overlay
   - Weather conditions
   - Road hazard warnings
   - Alternative route suggestions

## Support

For issues or questions:
- GitHub: https://github.com/asmortongpt/Fleet
- Documentation: https://docs.fleet.example.com
- Support: support@fleet.example.com

## License

Copyright © 2025 Fleet Management System. All rights reserved.
