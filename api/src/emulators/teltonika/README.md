# Teltonika GPS Tracker Emulator

A comprehensive emulator for Teltonika FM-series GPS trackers, designed for testing fleet management applications without requiring physical hardware.

## Supported Models

- **FM1120** - Basic GPS tracker with digital I/O
- **FM3200** - Advanced tracker with RFID support
- **FM4200** - Professional tracker with CAN bus integration
- **FM5300** - Premium tracker with full feature set

## Features

### Core Capabilities

1. **GPS Location Tracking**
   - Realistic movement simulation with configurable routes
   - Satellite count and HDOP simulation
   - Speed, heading, and altitude tracking
   - Movement detection (ignition-based)

2. **RFID Driver Authentication**
   - Driver identification via RFID tags
   - Authorized/unauthorized tag validation
   - Driver registry management
   - Authentication event logging

3. **Remote Starter Control**
   - Disable/enable vehicle starter remotely
   - Starter state monitoring (DOUT1)
   - Ignition blocking when starter is disabled
   - Multiple control initiators (remote, RFID, auto, manual)

4. **Digital Inputs (DIN1-DIN4)**
   - DIN1: Ignition detection
   - DIN2: Door sensor (open/closed)
   - DIN3: Panic button
   - DIN4: Auxiliary input

5. **Digital Outputs (DOUT1-DOUT2)**
   - DOUT1: Starter relay control (true = enabled, false = disabled)
   - DOUT2: Alarm/horn activation

6. **Analog Inputs (AIN1-AIN4)**
   - AIN1: Fuel level sensor (0-100%)
   - AIN2: Engine temperature sensor (-40 to 125°C)
   - AIN3: Ambient temperature sensor
   - AIN4: Custom voltage input (0-30V)

7. **Voltage Monitoring**
   - External power supply voltage (vehicle battery)
   - Internal backup battery voltage
   - Low voltage alerts (< 11V external, < 3.3V internal)

8. **CAN Bus Integration**
   - Engine RPM
   - Fuel level and consumption
   - Odometer reading
   - Engine temperature
   - Throttle position
   - Engine load percentage

9. **Device Telemetry**
   - GSM signal strength (0-5)
   - Internal device temperature
   - Connection status monitoring

## Installation

```bash
npm install
# or
yarn install
```

## Quick Start

```typescript
import { TeltonikaEmulator } from './TeltonikaEmulator';

// Create emulator instance
const emulator = new TeltonikaEmulator({
  model: 'FM4200',
  updateFrequency: 5000, // 5 second updates
  startLocation: { latitude: 40.7128, longitude: -74.0060 }, // NYC
  enableRFID: true,
  enableCANBus: true,
});

// Listen for events
emulator.on('location', (data) => {
  console.log(`Location: ${data.latitude}, ${data.longitude}`);
  console.log(`Speed: ${data.speed} km/h, Ignition: ${data.ignition}`);
});

emulator.on('rfid:auth', (data) => {
  if (data.authorized) {
    console.log(`Driver authenticated: ${data.driverName}`);
  }
});

emulator.on('starter:disabled', (data) => {
  console.log(`Starter disabled: ${data.reason}`);
});

// Start the emulator
await emulator.start();

// Control the vehicle
emulator.triggerIgnition(true);
emulator.authenticateRFID('RFID001234');
emulator.disableStarter('Vehicle reported stolen', 'remote');

// Stop the emulator
await emulator.stop();
```

## Configuration Options

```typescript
interface TeltonikaEmulatorConfig {
  imei?: string;                    // Device IMEI (auto-generated if not provided)
  model?: TeltonikaModel;           // FM1120, FM3200, FM4200, FM5300
  updateFrequency?: number;         // Update interval in milliseconds (default: 5000)
  enableRFID?: boolean;             // Enable RFID authentication (default: true)
  enableCANBus?: boolean;           // Enable CAN bus data (default: true)
  startLocation?: {                 // Initial GPS coordinates
    latitude: number;
    longitude: number;
  };
  authorizedRFIDTags?: Map<string, { // Pre-authorized RFID tags
    driverId: string;
    driverName: string;
  }>;
  starterEnabled?: boolean;         // Initial starter state (default: true)
}
```

## Event Reference

### Location Events

```typescript
emulator.on('location', (data: TeltonikaLocation) => {
  // data.imei, data.latitude, data.longitude, data.speed, data.heading
  // data.satellites, data.ignition, data.movement, data.timestamp
});
```

### RFID Events

```typescript
emulator.on('rfid:auth', (data: TeltonikaRFIDAuth) => {
  // data.rfidTag, data.authorized, data.driverId, data.driverName
});

emulator.on('rfid:cleared', (data) => {
  // data.previousTag
});
```

### Starter Control Events

```typescript
emulator.on('starter:disabled', (data: TeltonikaStarterControl) => {
  // data.reason, data.initiator
});

emulator.on('starter:enabled', (data: TeltonikaStarterControl) => {
  // data.reason, data.initiator
});

emulator.on('ignition:blocked', (data) => {
  // data.reason (e.g., "Starter disabled")
});
```

### IO Data Events

```typescript
emulator.on('io:data', (data: TeltonikaIOData) => {
  // data.digitalInputs, data.digitalOutputs, data.analogInputs
  // data.voltage, data.canData, data.gsmSignal, data.temperature
});
```

### Vehicle State Events

```typescript
emulator.on('ignition:changed', (data) => {
  // data.ignition (boolean)
});

emulator.on('door:changed', (data) => {
  // data.open (boolean)
});

emulator.on('panic:triggered', (data) => {
  // data.location
});

emulator.on('alarm:changed', (data) => {
  // data.active (boolean)
});
```

### Alert Events

```typescript
emulator.on('voltage:low:external', (data) => {
  // data.voltage, data.threshold
});

emulator.on('voltage:low:internal', (data) => {
  // data.voltage, data.threshold
});

emulator.on('fuel:low', (data) => {
  // data.fuelLevel
});
```

### Connection Events

```typescript
emulator.on('connected', (data) => {
  // data.imei, data.model, data.timestamp
});

emulator.on('disconnected', (data) => {
  // data.imei, data.timestamp
});

emulator.on('paused', (data) => {
  // data.imei
});

emulator.on('resumed', (data) => {
  // data.imei
});
```

## Public API Methods

### Lifecycle Control

```typescript
await emulator.start();              // Start the emulator
await emulator.stop();               // Stop the emulator
emulator.pause();                    // Pause updates
emulator.resume();                   // Resume updates
emulator.isRunning();                // Check if running
```

### RFID Management

```typescript
emulator.registerRFIDTag(rfidTag: string, driverId: string, driverName: string);
emulator.unregisterRFIDTag(rfidTag: string);
emulator.authenticateRFID(rfidTag: string);
emulator.clearRFID();
```

### Starter Control

```typescript
emulator.disableStarter(reason?: string, initiator?: 'remote' | 'rfid' | 'auto' | 'manual');
emulator.enableStarter(reason?: string, initiator?: 'remote' | 'rfid' | 'auto' | 'manual');
emulator.isStarterEnabled();         // Returns boolean
```

### Vehicle Control

```typescript
emulator.triggerIgnition(state: boolean);
emulator.setDoorState(open: boolean);
emulator.triggerPanicButton();
emulator.setAlarm(active: boolean);
emulator.setLocation(latitude: number, longitude: number, altitude?: number);
emulator.setSpeed(speed: number);
emulator.setFuelLevel(percent: number);
```

### Data Retrieval

```typescript
emulator.getLocationData();          // Returns TeltonikaLocation
emulator.getIOData();                // Returns TeltonikaIOData
emulator.getCurrentDriver();         // Returns driver info or null
emulator.getDeviceInfo();            // Returns device metadata
```

## Usage Examples

### Example 1: Basic GPS Tracking

```typescript
const emulator = new TeltonikaEmulator({
  model: 'FM4200',
  startLocation: { latitude: 40.7589, longitude: -73.9851 },
});

emulator.on('location', (data) => {
  console.log(`Speed: ${data.speed.toFixed(1)} km/h`);
  console.log(`Position: ${data.latitude}, ${data.longitude}`);
});

await emulator.start();
emulator.triggerIgnition(true); // Start driving
```

### Example 2: RFID Driver Authentication

```typescript
const emulator = new TeltonikaEmulator({ enableRFID: true });

emulator.on('rfid:auth', (data) => {
  if (data.authorized) {
    console.log(`Welcome, ${data.driverName}!`);
  } else {
    console.log(`Unauthorized tag: ${data.rfidTag}`);
  }
});

await emulator.start();
emulator.authenticateRFID('RFID001234'); // Authorized
emulator.authenticateRFID('RFID999999'); // Unauthorized
```

### Example 3: Remote Starter Disable (Anti-Theft)

```typescript
const emulator = new TeltonikaEmulator();

emulator.on('starter:disabled', (data) => {
  console.log(`Starter disabled: ${data.reason}`);
});

emulator.on('ignition:blocked', (data) => {
  console.log(`Cannot start vehicle: ${data.reason}`);
});

await emulator.start();

// Disable starter remotely
emulator.disableStarter('Vehicle reported stolen', 'remote');

// Attempt to start vehicle (will be blocked)
emulator.triggerIgnition(true);

// Re-enable starter
emulator.enableStarter('Vehicle recovered', 'remote');
```

### Example 4: CAN Bus Data Monitoring

```typescript
const emulator = new TeltonikaEmulator({
  enableCANBus: true,
});

emulator.on('io:data', (data) => {
  console.log(`RPM: ${data.canData.rpm.toFixed(0)}`);
  console.log(`Fuel: ${data.canData.fuelLevel.toFixed(1)}%`);
  console.log(`Odometer: ${data.canData.odometer.toFixed(2)} km`);
});

emulator.on('fuel:low', (data) => {
  console.log(`⚠️ Low fuel: ${data.fuelLevel}%`);
});

await emulator.start();
emulator.triggerIgnition(true);
```

### Example 5: Panic Button & Emergency Alerts

```typescript
const emulator = new TeltonikaEmulator();

emulator.on('panic:triggered', (data) => {
  console.log(`🚨 PANIC BUTTON PRESSED!`);
  console.log(`Location: ${data.location.latitude}, ${data.location.longitude}`);

  // Send emergency alert to dispatch
  sendEmergencyAlert(data);
});

await emulator.start();

// Driver presses panic button
emulator.triggerPanicButton();
```

## Testing

Run the example file to see all features in action:

```bash
npx ts-node TeltonikaEmulator.example.ts
```

## Integration with Fleet Management Systems

The emulator is designed to seamlessly integrate with fleet management platforms:

```typescript
// Real-time tracking integration
emulator.on('location', async (data) => {
  await updateVehiclePosition(data.imei, {
    latitude: data.latitude,
    longitude: data.longitude,
    speed: data.speed,
    heading: data.heading,
    timestamp: data.timestamp,
  });
});

// Driver management integration
emulator.on('rfid:auth', async (data) => {
  if (data.authorized) {
    await logDriverShiftStart(data.driverId, data.timestamp);
  }
});

// Security integration
emulator.on('starter:disabled', async (data) => {
  await sendAlertToSecurityTeam({
    imei: data.imei,
    reason: data.reason,
    timestamp: data.timestamp,
  });
});
```

## Architecture

The emulator follows the same architecture pattern as the SamsaraEmulator:

- Extends EventEmitter for asynchronous event handling
- Internal state management with realistic value simulation
- Configurable update frequency for performance tuning
- Lifecycle methods (start, stop, pause, resume)
- Comprehensive event emission for all state changes
- Public API for external control and data retrieval

## Technical Details

### GPS Simulation

- Realistic movement based on speed and heading
- Satellite count varies with conditions (8-14 satellites)
- HDOP values simulate GPS accuracy (0.6-1.4)
- Location updates based on calculated distance traveled

### Power Management

- External voltage simulation (12.4-13.8V)
- Internal battery simulation (3.7-3.9V)
- Voltage varies based on ignition state
- Low voltage alerts at critical thresholds

### CAN Bus Simulation

- RPM calculated from speed (800-5000 RPM range)
- Fuel consumption based on engine load
- Engine temperature simulation (gradual heating/cooling)
- Throttle position correlates with speed
- Realistic odometer tracking

### RFID Implementation

- Pre-configured authorized tags with driver mapping
- Authentication event logging
- Driver session management
- Tag registration/unregistration support

### Starter Control

- Digital output (DOUT1) controls starter relay
- Ignition blocking when starter is disabled
- Multi-initiator support (remote, RFID, auto, manual)
- Automatic ignition shutdown on starter disable

## Contributing

To extend the emulator with additional features:

1. Add new event types to the type definitions
2. Implement state management for new parameters
3. Add emission logic in the `update()` method
4. Create public API methods for external control
5. Update documentation with examples

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or feature requests, please contact the development team or open an issue in the repository.
