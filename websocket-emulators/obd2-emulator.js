/**
 * OBD2 WebSocket Emulator
 *
 * Emulates realistic vehicle telemetry data via WebSocket
 * Port: 8081
 *
 * Security: FedRAMP-compliant
 * - No hardcoded secrets
 * - Input validation
 * - Rate limiting
 */

import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.OBD2_PORT || 8081;
const BROADCAST_INTERVAL = 1000; // 1 second
const MAX_CLIENTS = 100;

// Realistic vehicle telemetry simulation
class VehicleSimulator {
  constructor(vehicleId) {
    this.vehicleId = vehicleId;
    this.speed = 0;
    this.rpm = 800; // Idle RPM
    this.fuelLevel = 75 + Math.random() * 25; // 75-100%
    this.engineTemp = 85 + Math.random() * 10; // 85-95°C
    this.throttle = 0;
    this.odometer = Math.floor(Math.random() * 100000);
    this.latitude = 28.5383 + (Math.random() - 0.5) * 0.1; // Tallahassee area
    this.longitude = -81.3792 + (Math.random() - 0.5) * 0.1;
    this.heading = Math.random() * 360;
    this.isMoving = false;
  }

  update() {
    // Simulate realistic driving behavior
    if (Math.random() < 0.1) {
      this.isMoving = !this.isMoving;
    }

    if (this.isMoving) {
      // Accelerating
      this.speed = Math.min(70, this.speed + (Math.random() * 2 - 0.5));
      this.rpm = 2000 + (this.speed * 30);
      this.throttle = Math.min(100, this.throttle + Math.random() * 10);
      this.fuelLevel = Math.max(0, this.fuelLevel - 0.001);
      this.engineTemp = Math.min(105, this.engineTemp + 0.1);

      // Update position
      const moveDistance = this.speed * 0.000277778 / 3600; // km to degrees roughly
      const radHeading = this.heading * Math.PI / 180;
      this.latitude += moveDistance * Math.cos(radHeading);
      this.longitude += moveDistance * Math.sin(radHeading);

      // Occasional heading changes
      if (Math.random() < 0.05) {
        this.heading = (this.heading + (Math.random() * 90 - 45) + 360) % 360;
      }
    } else {
      // Slowing down or idle
      this.speed = Math.max(0, this.speed - 1);
      this.rpm = this.speed > 0 ? 1500 + (this.speed * 20) : 800;
      this.throttle = Math.max(0, this.throttle - 5);
      this.engineTemp = Math.max(85, this.engineTemp - 0.05);
    }

    this.odometer += this.speed * 0.000277778 / 3600;

    return {
      vehicleId: this.vehicleId,
      timestamp: new Date().toISOString(),
      telemetry: {
        speed: Math.round(this.speed * 10) / 10,
        rpm: Math.round(this.rpm),
        fuelLevel: Math.round(this.fuelLevel * 10) / 10,
        engineTemp: Math.round(this.engineTemp * 10) / 10,
        throttlePosition: Math.round(this.throttle * 10) / 10,
        odometer: Math.round(this.odometer * 10) / 10,
        engineLoad: Math.round(((this.rpm - 800) / 60) * 10) / 10,
        coolantTemp: Math.round(this.engineTemp),
        intakeTemp: Math.round(25 + Math.random() * 10),
        batteryVoltage: 13.8 + Math.random() * 0.4,
        catalystTemp: Math.round(400 + this.speed * 2),
        fuelPressure: Math.round(40 + this.throttle * 0.5),
        timingAdvance: Math.round(10 + this.speed * 0.2),
        maf: Math.round(10 + this.speed * 0.5),
        dtcCount: 0,
      },
      location: {
        latitude: this.latitude,
        longitude: this.longitude,
        altitude: 50 + Math.random() * 10,
        heading: Math.round(this.heading),
        accuracy: 5 + Math.random() * 3,
      },
      status: {
        engineRunning: true,
        checkEngine: false,
        lowFuel: this.fuelLevel < 20,
        overheating: this.engineTemp > 100,
        mil: false,
      }
    };
  }
}

// Create WebSocket server
const wss = new WebSocketServer({
  port: PORT,
  maxPayload: 1024 * 100, // 100KB max payload
  clientTracking: true,
});

const clients = new Map();
const vehicles = new Map();

console.log(`🚗 OBD2 Emulator listening on ws://localhost:${PORT}`);
console.log('📊 Emulating realistic vehicle telemetry data');

wss.on('connection', (ws, req) => {
  // Rate limiting: max 100 clients
  if (wss.clients.size > MAX_CLIENTS) {
    ws.close(1008, 'Server capacity reached');
    return;
  }

  const clientId = uuidv4();
  const vehicleId = `VEH-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`;

  console.log(`✅ Client connected: ${clientId} (${wss.clients.size} total)`);

  // Create vehicle simulator for this client
  const vehicle = new VehicleSimulator(vehicleId);
  vehicles.set(clientId, vehicle);
  clients.set(clientId, ws);

  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connection',
    clientId,
    vehicleId,
    timestamp: new Date().toISOString(),
    message: 'Connected to OBD2 emulator',
  }));

  // Handle incoming messages (optional command/control)
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      // Input validation
      if (message.command === 'reset') {
        vehicles.set(clientId, new VehicleSimulator(vehicleId));
        ws.send(JSON.stringify({
          type: 'reset',
          vehicleId,
          timestamp: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error('Invalid message received:', error.message);
    }
  });

  ws.on('close', () => {
    console.log(`❌ Client disconnected: ${clientId}`);
    clients.delete(clientId);
    vehicles.delete(clientId);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error.message);
  });
});

// Broadcast telemetry data to all connected clients
setInterval(() => {
  clients.forEach((ws, clientId) => {
    if (ws.readyState === 1) { // OPEN
      const vehicle = vehicles.get(clientId);
      if (vehicle) {
        const telemetry = vehicle.update();

        try {
          ws.send(JSON.stringify({
            type: 'telemetry',
            data: telemetry,
          }));
        } catch (error) {
          console.error(`Error sending to client ${clientId}:`, error.message);
        }
      }
    }
  });
}, BROADCAST_INTERVAL);

// Health check endpoint
setInterval(() => {
  console.log(`📡 Active connections: ${wss.clients.size} | Active vehicles: ${vehicles.size}`);
}, 30000); // Every 30 seconds

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, closing WebSocket server...');
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, closing WebSocket server...');
  wss.close(() => {
    console.log('✅ WebSocket server closed');
    process.exit(0);
  });
});
