/**
 * ============================================================================
 * Teltonika Emulator Usage Examples
 * ============================================================================
 *
 * This file demonstrates how to use the TeltonikaEmulator class.
 * Run this file to see the emulator in action.
 *
 * Usage: npx ts-node TeltonikaEmulator.example.ts
 * ============================================================================
 */

import { TeltonikaEmulator } from './TeltonikaEmulator';

async function exampleBasicUsage() {
  console.log('\n=== Example 1: Basic GPS Tracking ===\n');

  const emulator = new TeltonikaEmulator({
    model: 'FM4200',
    updateFrequency: 2000, // 2 second updates
    startLocation: { latitude: 40.7589, longitude: -73.9851 }, // Times Square, NYC
  });

  // Listen for location updates
  emulator.on('location', (data) => {
    console.log(`[Location] Speed: ${data.speed.toFixed(1)} km/h, ` +
                `Coords: (${data.latitude.toFixed(6)}, ${data.longitude.toFixed(6)}), ` +
                `Satellites: ${data.satellites}, Ignition: ${data.ignition ? 'ON' : 'OFF'}`);
  });

  // Listen for IO data
  emulator.on('io:data', (data) => {
    console.log(`[IO Data] Fuel: ${data.canData.fuelLevel.toFixed(1)}%, ` +
                `RPM: ${data.canData.rpm.toFixed(0)}, ` +
                `Temp: ${data.canData.engineTemperature.toFixed(1)}°C, ` +
                `External V: ${data.voltage.external.toFixed(2)}V`);
  });

  await emulator.start();

  // Simulate turning on ignition after 3 seconds
  setTimeout(() => {
    console.log('\n>>> Turning ignition ON <<<\n');
    emulator.triggerIgnition(true);
  }, 3000);

  // Stop after 15 seconds
  setTimeout(async () => {
    console.log('\n>>> Stopping emulator <<<\n');
    await emulator.stop();
  }, 15000);
}

async function exampleRFIDAuthentication() {
  console.log('\n=== Example 2: RFID Driver Authentication ===\n');

  const emulator = new TeltonikaEmulator({
    model: 'FM5300',
    enableRFID: true,
  });

  // Listen for RFID authentication events
  emulator.on('rfid:auth', (data) => {
    if (data.authorized) {
      console.log(`✓ RFID AUTHORIZED: ${data.driverName} (${data.driverId})`);
      console.log(`  Tag: ${data.rfidTag}`);
      console.log(`  Location: (${data.location?.latitude.toFixed(6)}, ${data.location?.longitude.toFixed(6)})`);
    } else {
      console.log(`✗ RFID UNAUTHORIZED: ${data.rfidTag}`);
    }
  });

  emulator.on('rfid:cleared', (data) => {
    console.log(`RFID Cleared: ${data.previousTag}`);
  });

  await emulator.start();

  // Simulate RFID authentication attempts
  setTimeout(() => {
    console.log('\n>>> Attempting RFID authentication with authorized tag <<<\n');
    emulator.authenticateRFID('RFID001234'); // Authorized (John Smith)
  }, 2000);

  setTimeout(() => {
    console.log('\n>>> Attempting RFID authentication with unauthorized tag <<<\n');
    emulator.authenticateRFID('RFID999999'); // Unauthorized
  }, 4000);

  setTimeout(() => {
    console.log('\n>>> Registering new RFID tag <<<\n');
    emulator.registerRFIDTag('RFID555555', 'DRV004', 'Sarah Connor');
    emulator.authenticateRFID('RFID555555'); // Now authorized
  }, 6000);

  setTimeout(() => {
    console.log('\n>>> Clearing RFID <<<\n');
    emulator.clearRFID();
  }, 8000);

  setTimeout(async () => {
    await emulator.stop();
  }, 10000);
}

async function exampleStarterControl() {
  console.log('\n=== Example 3: Remote Starter Control ===\n');

  const emulator = new TeltonikaEmulator({
    model: 'FM4200',
    starterEnabled: true,
    updateFrequency: 1000,
  });

  // Listen for starter control events
  emulator.on('starter:disabled', (data) => {
    console.log(`🔒 STARTER DISABLED: ${data.reason} (initiated by: ${data.initiator})`);
  });

  emulator.on('starter:enabled', (data) => {
    console.log(`🔓 STARTER ENABLED: ${data.reason} (initiated by: ${data.initiator})`);
  });

  emulator.on('ignition:blocked', (data) => {
    console.log(`⛔ IGNITION BLOCKED: ${data.reason}`);
  });

  emulator.on('ignition:changed', (data) => {
    console.log(`🔑 Ignition: ${data.ignition ? 'ON' : 'OFF'}`);
  });

  await emulator.start();

  // Try to start vehicle normally
  setTimeout(() => {
    console.log('\n>>> Attempting to start vehicle (starter enabled) <<<\n');
    emulator.triggerIgnition(true);
  }, 2000);

  // Disable starter remotely
  setTimeout(() => {
    console.log('\n>>> Disabling starter remotely <<<\n');
    emulator.disableStarter('Vehicle reported stolen', 'remote');
  }, 5000);

  // Try to start vehicle with disabled starter
  setTimeout(() => {
    console.log('\n>>> Attempting to start vehicle (starter disabled) <<<\n');
    emulator.triggerIgnition(true);
  }, 7000);

  // Re-enable starter
  setTimeout(() => {
    console.log('\n>>> Re-enabling starter <<<\n');
    emulator.enableStarter('Vehicle recovered', 'remote');
  }, 9000);

  // Start vehicle again
  setTimeout(() => {
    console.log('\n>>> Attempting to start vehicle (starter re-enabled) <<<\n');
    emulator.triggerIgnition(true);
  }, 11000);

  setTimeout(async () => {
    await emulator.stop();
  }, 14000);
}

async function examplePanicButton() {
  console.log('\n=== Example 4: Panic Button & Alarms ===\n');

  const emulator = new TeltonikaEmulator({
    model: 'FM3200',
    startLocation: { latitude: 34.0522, longitude: -118.2437 }, // Los Angeles
  });

  emulator.on('panic:triggered', (data) => {
    console.log(`🚨 PANIC BUTTON TRIGGERED!`);
    console.log(`   Location: (${data.location.latitude.toFixed(6)}, ${data.location.longitude.toFixed(6)})`);
    console.log(`   Time: ${data.timestamp.toISOString()}`);
  });

  emulator.on('alarm:changed', (data) => {
    console.log(`🔔 Alarm: ${data.active ? 'ACTIVE' : 'INACTIVE'}`);
  });

  emulator.on('door:changed', (data) => {
    console.log(`🚪 Door: ${data.open ? 'OPEN' : 'CLOSED'}`);
  });

  await emulator.start();

  // Simulate door open
  setTimeout(() => {
    console.log('\n>>> Opening door <<<\n');
    emulator.setDoorState(true);
  }, 2000);

  // Trigger panic button
  setTimeout(() => {
    console.log('\n>>> PANIC BUTTON PRESSED <<<\n');
    emulator.triggerPanicButton();
  }, 4000);

  // Activate alarm
  setTimeout(() => {
    console.log('\n>>> Activating alarm <<<\n');
    emulator.setAlarm(true);
  }, 6000);

  // Deactivate alarm
  setTimeout(() => {
    console.log('\n>>> Deactivating alarm <<<\n');
    emulator.setAlarm(false);
  }, 8000);

  setTimeout(async () => {
    await emulator.stop();
  }, 10000);
}

async function exampleCANBusData() {
  console.log('\n=== Example 5: CAN Bus Data Monitoring ===\n');

  const emulator = new TeltonikaEmulator({
    model: 'FM5300',
    enableCANBus: true,
    updateFrequency: 2000,
  });

  let updateCount = 0;

  emulator.on('io:data', (data) => {
    updateCount++;
    console.log(`\n[Update ${updateCount}] CAN Bus Data:`);
    console.log(`  RPM: ${data.canData.rpm.toFixed(0)}`);
    console.log(`  Speed: ${data.canData.rpm > 0 ? 'Calculated from wheel speed' : 'GPS'}`);
    console.log(`  Fuel Level: ${data.canData.fuelLevel.toFixed(1)}%`);
    console.log(`  Fuel Used: ${data.canData.fuelUsed.toFixed(2)} L`);
    console.log(`  Odometer: ${data.canData.odometer.toFixed(2)} km`);
    console.log(`  Engine Temp: ${data.canData.engineTemperature.toFixed(1)}°C`);
    console.log(`  Throttle: ${data.canData.throttlePosition.toFixed(1)}%`);
    console.log(`  Engine Load: ${data.canData.engineLoad.toFixed(1)}%`);
  });

  emulator.on('fuel:low', (data) => {
    console.log(`\n⚠️  LOW FUEL WARNING: ${data.fuelLevel.toFixed(1)}%`);
  });

  await emulator.start();

  // Turn on ignition
  setTimeout(() => {
    console.log('\n>>> Starting vehicle <<<\n');
    emulator.triggerIgnition(true);
  }, 2000);

  // Simulate low fuel
  setTimeout(() => {
    console.log('\n>>> Simulating low fuel condition <<<\n');
    emulator.setFuelLevel(8);
  }, 8000);

  setTimeout(async () => {
    await emulator.stop();
  }, 12000);
}

async function exampleVoltageMonitoring() {
  console.log('\n=== Example 6: Voltage Monitoring ===\n');

  const emulator = new TeltonikaEmulator({
    model: 'FM1120',
  });

  emulator.on('voltage:low:external', (data) => {
    console.log(`⚠️  LOW EXTERNAL VOLTAGE: ${data.voltage.toFixed(2)}V (threshold: ${data.threshold}V)`);
  });

  emulator.on('voltage:low:internal', (data) => {
    console.log(`⚠️  LOW INTERNAL BATTERY: ${data.voltage.toFixed(2)}V (threshold: ${data.threshold}V)`);
  });

  emulator.on('io:data', (data) => {
    if (data.voltage.externalLow || data.voltage.internalLow) {
      console.log(`[Voltage] External: ${data.voltage.external.toFixed(2)}V, ` +
                  `Internal: ${data.voltage.internal.toFixed(2)}V`);
    }
  });

  await emulator.start();

  setTimeout(async () => {
    await emulator.stop();
  }, 10000);
}

// ============================================================================
// Run Examples
// ============================================================================

async function runAllExamples() {
  try {
    await exampleBasicUsage();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await exampleRFIDAuthentication();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await exampleStarterControl();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await examplePanicButton();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await exampleCANBusData();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await exampleVoltageMonitoring();

    console.log('\n✅ All examples completed!\n');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}

export {
  exampleBasicUsage,
  exampleRFIDAuthentication,
  exampleStarterControl,
  examplePanicButton,
  exampleCANBusData,
  exampleVoltageMonitoring,
};
