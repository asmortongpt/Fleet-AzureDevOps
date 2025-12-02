# Dispatch Radio Emulator

## Overview

The **DispatchEmulator** provides realistic radio communication simulation for fleet management systems. It generates authentic dispatch transmissions including emergency calls, routine check-ins, incident reports, and status updates across multiple radio channels.

## Features

### 🎙️ Realistic Radio Transmissions
- **50+ message templates** covering all operational scenarios
- **Emergency calls** with proper protocol and codes
- **Routine communications** (check-ins, status updates, acknowledgments)
- **Incident reports** (accidents, breakdowns, hazards)
- **Multi-channel support** (Dispatch, Emergency, Maintenance, Operations)

### 📡 Channel Management
- **4 radio channels** with distinct frequencies and purposes
- **Dynamic channel switching** for vehicles
- **Emergency channel override** for critical situations
- **Active unit tracking** per channel

### 🔒 Enterprise Security
- Fortune 50 security standards compliance
- Secure transmission ID generation (crypto.randomBytes)
- Input validation on all vehicle registrations
- Parameterized database queries ready (in migration)
- No hardcoded secrets

### 🌐 Real-time Integration
- **WebSocket events** for live transmission streaming
- **Event-driven architecture** with EventEmitter
- **Automatic acknowledgment tracking**
- **Emergency broadcast system**

### 📊 Metadata & Quality Simulation
- Signal strength simulation (0-100)
- Battery level tracking
- Background noise levels
- Transmission quality (clear/static/weak/broken)
- Realistic transmission duration calculation

## Quick Start

### Basic Usage

```typescript
import { DispatchEmulator } from './emulators/DispatchEmulator';

// Initialize the emulator
const emulator = new DispatchEmulator({
  updateIntervalMs: 15000,      // Generate transmissions every 15 seconds
  transmissionProbability: 0.3,  // 30% chance per interval
  emergencyProbability: 0.05,    // 5% chance of emergency
  channels: ['dispatch', 'emergency', 'maintenance', 'operations'],
  maxActiveTransmissions: 50,
  realisticTiming: true
});

// Register vehicles
emulator.registerVehicle({
  id: 'vehicle-001',
  unitNumber: 'Unit-101',
  driverId: 'driver-123',
  currentLocation: {
    lat: 40.7128,
    lng: -74.0060,
    address: 'New York, NY'
  }
});

// Listen for transmissions
emulator.on('transmission', (transmission) => {
  console.log(`[${transmission.channel}] ${transmission.unitNumber}: ${transmission.message}`);
});

// Listen for emergency transmissions
emulator.on('emergency-transmission', (transmission) => {
  console.log(`🚨 EMERGENCY: ${transmission.message}`);
  // Trigger alerts, notifications, etc.
});

// Start emulating
emulator.start();

// Stop when done
emulator.stop();
```

### Integration with EmulatorOrchestrator

The DispatchEmulator is automatically initialized and managed by the EmulatorOrchestrator:

```typescript
// EmulatorOrchestrator handles:
// - Initialization on startup
// - Vehicle registration for all fleet vehicles
// - WebSocket broadcasting of transmissions
// - Event coordination with other emulators
// - Proper shutdown on system stop
```

## Database Schema

### Tables Created

The migration `023_dispatch_radio_system.sql` creates:

1. **dispatch_transmissions** - All radio transmissions
2. **dispatch_channels** - Radio channel definitions
3. **dispatch_channel_assignments** - Vehicle-to-channel mappings
4. **dispatch_incidents** - Incident tracking
5. **dispatch_transmission_acknowledgments** - Acknowledgment records

### Sample Queries

```sql
-- Get recent critical transmissions
SELECT * FROM dispatch_transmissions
WHERE priority = 'critical'
  AND acknowledged = false
ORDER BY timestamp DESC
LIMIT 10;

-- Get channel activity summary
SELECT * FROM get_channel_activity_summary('dispatch', 24);

-- Acknowledge a transmission
SELECT acknowledge_transmission(
  'transmission-uuid',
  'user-uuid',
  '10-4, proceeding as directed'
);

-- Get active incidents
SELECT * FROM v_active_dispatch_incidents;
```

## API Reference

### Constructor Options

```typescript
interface EmulatorConfig {
  updateIntervalMs?: number;        // Default: 15000
  transmissionProbability?: number; // Default: 0.3 (30%)
  emergencyProbability?: number;    // Default: 0.05 (5%)
  channels?: string[];              // Default: all 4 channels
  maxActiveTransmissions?: number;  // Default: 50
  realisticTiming?: boolean;        // Default: true
}
```

### Methods

#### `registerVehicle(vehicle)`
Register a vehicle for radio communications.

```typescript
emulator.registerVehicle({
  id: string;              // Required: Vehicle ID
  unitNumber: string;      // Required: Radio call sign
  driverId?: string;       // Optional: Current driver
  currentLocation?: {      // Optional: Current position
    lat: number;
    lng: number;
    address?: string;
  };
});
```

#### `start()`
Start transmission generation.

#### `stop()`
Stop transmission generation and cleanup.

#### `pause()`
Pause transmission generation (can be resumed).

#### `resume()`
Resume after pause.

#### `switchVehicleChannel(vehicleId, channel)`
Switch a vehicle to a different radio channel.

```typescript
const success = emulator.switchVehicleChannel('vehicle-001', 'emergency');
```

#### `acknowledgeTransmission(transmissionId)`
Mark a transmission as acknowledged.

```typescript
const success = emulator.acknowledgeTransmission('TX-abc123');
```

#### `getActiveTransmissions()`
Get all active transmissions.

#### `getTransmissionHistory(limit?)`
Get recent transmission history (default: last 50).

#### `getChannelStatus(channelId)`
Get status of a specific channel.

#### `getAllChannels()`
Get all available channels.

#### `getVehicleStatus(vehicleId)`
Get radio status for a specific vehicle.

#### `getCurrentState()`
Get complete emulator state.

### Events

```typescript
// Transmission generated
emulator.on('transmission', (transmission: DispatchTransmission) => {
  // Handle normal transmission
});

// Emergency transmission
emulator.on('emergency-transmission', (transmission: DispatchTransmission) => {
  // Handle emergency - trigger alerts
});

// Transmission acknowledged
emulator.on('transmission-acknowledged', (transmission: DispatchTransmission) => {
  // Update UI, close alerts, etc.
});

// Channel switch
emulator.on('channel-switch', (data: { vehicleId: string; channel: string }) => {
  // Update channel display
});

// Emulator started
emulator.on('started', () => {
  // System ready
});

// Emulator stopped
emulator.on('stopped', () => {
  // Cleanup
});
```

## Transmission Types

### Emergency
Critical situations requiring immediate response:
- Officer/driver needs assistance
- Vehicle pursuits
- Medical emergencies
- Vehicle fires
- Hazmat incidents

### Routine
Normal operational communications:
- Check-ins and status updates
- Arrival notifications
- Availability reports
- Route requests

### Incident
Non-emergency situations:
- Minor accidents
- Road hazards
- Equipment malfunctions
- Traffic issues

### Status
Informational updates:
- Location reports
- Fuel levels
- Maintenance alerts
- Passenger counts

### Acknowledgment
Confirmations:
- "10-4" responses
- Roger/copy confirmations
- Compliance acknowledgments

### Request
Operational requests:
- Backup requests
- Information queries
- Permission requests
- Resource needs

## Radio Channels

### Dispatch (154.280 MHz)
Primary coordination and routine operations.

### Emergency (155.475 MHz)
High-priority and emergency communications. Can override other channels.

### Maintenance (154.570 MHz)
Vehicle maintenance and support operations.

### Operations (155.160 MHz)
General field operations and logistics.

## Ten Codes

The emulator uses standard police/dispatch 10-codes:

- **10-4**: Acknowledgment, OK
- **10-7**: Out of service
- **10-8**: In service
- **10-20**: Location
- **10-23**: Stand by
- **10-33**: Emergency
- **10-34**: Riot/pursuit
- **10-39**: Emergency traffic only
- **10-50**: Accident
- **10-52**: Ambulance needed
- **10-97**: Arrived at scene

## Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test DispatchEmulator.test.ts

# Run with coverage
npm test -- --coverage DispatchEmulator.test.ts

# Run specific test
npm test -- -t "should generate realistic transmissions"
```

## Performance

- **Transmission Generation**: O(n) where n = number of registered vehicles
- **Memory Usage**: ~1KB per transmission, automatic cleanup after 1 hour
- **CPU Impact**: Minimal, only generates on interval
- **Database**: Indexed queries for fast retrieval
- **WebSocket**: Efficient JSON serialization, broadcasts only on events

## Security Considerations

### Input Validation
- All vehicle registration data is validated
- Required fields enforced
- Location coordinates validated

### Secure IDs
- Transmission IDs use crypto.randomBytes(8)
- Unpredictable and collision-resistant

### Database Security
- Parameterized queries only (no string concatenation)
- Row-level security ready
- Audit logging built-in

### WebSocket Security
- Event-based, no direct execution
- Data sanitization on broadcast
- Rate limiting compatible

## Integration Examples

### With WebSocket Server

```typescript
// In your WebSocket server
io.on('connection', (socket) => {
  emulator.on('transmission', (transmission) => {
    socket.emit('dispatch:transmission', transmission);
  });

  emulator.on('emergency-transmission', (transmission) => {
    // Broadcast to all connected clients
    io.emit('dispatch:emergency', transmission);
  });
});
```

### With Database Persistence

```typescript
emulator.on('transmission', async (transmission) => {
  await db.query(
    `INSERT INTO dispatch_transmissions (
      transmission_id, vehicle_id, channel, type, priority,
      message, timestamp, duration, location_lat, location_lng,
      unit_number, signal_strength, battery_level,
      background_noise, transmission_quality
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
    [
      transmission.id,
      transmission.vehicleId,
      transmission.channel,
      transmission.type,
      transmission.priority,
      transmission.message,
      transmission.timestamp,
      transmission.duration,
      transmission.location?.lat,
      transmission.location?.lng,
      transmission.unitNumber,
      transmission.metadata.signalStrength,
      transmission.metadata.batteryLevel,
      transmission.metadata.backgroundNoise,
      transmission.metadata.transmission_quality
    ]
  );
});
```

### With Alert System

```typescript
emulator.on('emergency-transmission', async (transmission) => {
  // Send push notifications
  await pushNotificationService.send({
    title: '🚨 Emergency Dispatch',
    body: transmission.message,
    priority: 'high',
    data: { transmissionId: transmission.id }
  });

  // Send SMS to supervisors
  await smsService.sendToSupervisors(
    `EMERGENCY: ${transmission.unitNumber} - ${transmission.message}`
  );

  // Log to security monitoring
  await securityLog.critical({
    event: 'emergency_transmission',
    vehicleId: transmission.vehicleId,
    message: transmission.message,
    location: transmission.location
  });
});
```

## Troubleshooting

### No Transmissions Generated
- Verify vehicles are registered: `emulator.getCurrentState().activeVehicles > 0`
- Check if emulator is running: `emulator.getCurrentState().isRunning === true`
- Verify transmissionProbability is > 0
- Check event listeners are attached before calling `start()`

### High Memory Usage
- Reduce `maxActiveTransmissions` setting
- Transmission history auto-cleans after 1 hour
- Active transmissions limited to last 100

### Missing Emergency Transmissions
- Increase `emergencyProbability` for testing
- Emergency sequences are random and infrequent by design
- Check emergency channel status: `emulator.getChannelStatus('emergency')`

## Roadmap

Future enhancements:
- [ ] Audio clip generation (actual radio static/voice)
- [ ] GPS integration for location-aware transmissions
- [ ] AI-generated contextual messages
- [ ] Multi-language support
- [ ] Custom message templates
- [ ] Historical playback mode
- [ ] Network latency simulation

## License

Proprietary - Capital Tech Alliance

## Support

For issues or questions:
- GitHub Issues: [fleet-local/issues]
- Email: support@capitaltechalliance.com
- Documentation: [wiki/dispatch-emulator]
