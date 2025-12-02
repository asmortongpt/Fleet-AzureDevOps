/**
 * Emulator Orchestrator API Server
 * Manages 300 vehicle emulators and provides real-time updates via WebSocket
 */

const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3002;
const WS_PORT = process.env.WS_PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'fleet-postgres-service',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'fleetdb',
  user: process.env.DB_USER || 'fleetadmin',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  connectionTimeoutMillis: 10000,
});

// In-memory vehicle state (will be populated from emulator pods)
const vehicles = new Map();
const emulatorPods = [];

// Initialize 300 vehicles with realistic data
function initializeVehicles() {
  console.log('[Orchestrator] Initializing 300 vehicles...');

  const departments = [
    { name: 'police', count: 85, models: ['Ford Explorer Police Interceptor', 'Chevrolet Tahoe PPV', 'Harley-Davidson Police'] },
    { name: 'fire', count: 45, models: ['Pierce Enforcer Pumper', 'Pierce Ascendant Ladder', 'Ford F-450 Ambulance'] },
    { name: 'publicWorks', count: 85, models: ['Mack Granite Dump Truck', 'Ford F-250 Utility', 'Elgin Pelican Sweeper'] },
    { name: 'transit', count: 40, models: ['New Flyer Xcelsior Bus', 'Ford Transit Paratransit'] },
    { name: 'utilities', count: 30, models: ['Ford F-550 Bucket Truck', 'Peterbilt 567 Tanker'] },
    { name: 'parks', count: 15, models: ['Ford Ranger', 'John Deere Z997R Mower'] }
  ];

  const statuses = ['active', 'idle', 'responding', 'maintenance'];
  const activities = {
    police: ['Patrol', 'Traffic Stop', 'Report Writing', 'Emergency Response'],
    fire: ['Station Standby', 'Training', 'Emergency Response', 'Equipment Check'],
    publicWorks: ['Street Maintenance', 'Waste Collection', 'Pothole Repair', 'Street Sweeping'],
    transit: ['Route Service', 'Break/Layover', 'Transfer Point', 'Passenger Boarding'],
    utilities: ['Service Call', 'Meter Reading', 'Emergency Repair', 'Scheduled Maintenance'],
    parks: ['Grounds Maintenance', 'Equipment Setup', 'Facility Inspection', 'Landscaping']
  };

  let vehicleNumber = 1;

  departments.forEach(dept => {
    for (let i = 0; i < dept.count; i++) {
      const vehicleId = `COT-${dept.name.toUpperCase()}-${String(vehicleNumber).padStart(4, '0')}`;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const isActive = status === 'active' || status === 'responding';
      const hasDriver = Math.random() > 0.2 && isActive;

      // Tallahassee coordinates (30.4383, -84.2807) with random offset
      const lat = 30.4383 + (Math.random() - 0.5) * 0.2;
      const lng = -84.2807 + (Math.random() - 0.5) * 0.2;

      vehicles.set(vehicleId, {
        vehicleId,
        vehicleNumber,
        department: dept.name,
        vehicleType: dept.models[Math.floor(Math.random() * dept.models.length)].split(' ')[0].toLowerCase(),
        status,
        vehicle: {
          model: dept.models[Math.floor(Math.random() * dept.models.length)],
          year: 2018 + Math.floor(Math.random() * 6),
          vin: generateVIN(),
          licensePlate: `FL-${Math.random().toString(36).substr(2, 4).toUpperCase()}${Math.floor(Math.random() * 999)}`
        },
        location: {
          latitude: lat,
          longitude: lng,
          altitude: 50 + Math.random() * 30,
          speed: isActive ? Math.floor(Math.random() * 50) : 0,
          heading: Math.random() * 360,
          timestamp: new Date().toISOString()
        },
        obd2: {
          timestamp: new Date().toISOString(),
          speed: isActive ? Math.floor(Math.random() * 50) : 0,
          rpm: isActive ? 2000 + Math.floor(Math.random() * 2000) : 750,
          coolantTemp: 180 + Math.floor(Math.random() * 20),
          fuelLevel: 30 + Math.floor(Math.random() * 60),
          batteryVoltage: 12.6 + Math.random() * 1.6,
          engineLoad: isActive ? 40 + Math.floor(Math.random() * 40) : 0,
          throttlePosition: isActive ? 20 + Math.floor(Math.random() * 40) : 0,
          checkEngineLight: Math.random() > 0.95,
          mil: Math.random() > 0.95
        },
        mobileAppState: {
          isDriverLoggedIn: hasDriver,
          driverName: hasDriver ? generateDriverName() : null,
          currentActivity: activities[dept.name][Math.floor(Math.random() * activities[dept.name].length)],
          lastActivityTime: new Date().toISOString(),
          tripStatus: isActive ? 'in-transit' : null,
          preTripComplete: hasDriver,
          postTripComplete: false,
          photosTaken: Math.floor(Math.random() * 5),
          notesEntered: Math.floor(Math.random() * 3),
          incidentsReported: Math.random() > 0.95 ? 1 : 0
        },
        lastUpdate: new Date().toISOString()
      });

      vehicleNumber++;
    }
  });

  console.log(`[Orchestrator] Initialized ${vehicles.size} vehicles`);
}

function generateVIN() {
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  return Array.from({ length: 17 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function generateDriverName() {
  const firstNames = ['John', 'Sarah', 'Michael', 'Jennifer', 'David', 'Lisa', 'James', 'Mary', 'Robert', 'Patricia'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    vehicles: vehicles.size,
    uptime: process.uptime()
  });
});

// Get all vehicles
app.get('/api/vehicles', (req, res) => {
  const { department, status } = req.query;

  let filteredVehicles = Array.from(vehicles.values());

  if (department) {
    filteredVehicles = filteredVehicles.filter(v => v.department === department);
  }

  if (status) {
    filteredVehicles = filteredVehicles.filter(v => v.status === status);
  }

  res.json({
    success: true,
    count: filteredVehicles.length,
    total: vehicles.size,
    vehicles: filteredVehicles
  });
});

// Get single vehicle
app.get('/api/vehicles/:vehicleId', (req, res) => {
  const vehicle = vehicles.get(req.params.vehicleId);

  if (!vehicle) {
    return res.status(404).json({
      success: false,
      error: 'Vehicle not found'
    });
  }

  res.json({
    success: true,
    vehicle
  });
});

// Get vehicle stats
app.get('/api/stats', (req, res) => {
  const stats = {
    total: vehicles.size,
    byDepartment: {},
    byStatus: {},
    active: 0,
    idle: 0,
    responding: 0,
    maintenance: 0,
    driversLoggedIn: 0
  };

  vehicles.forEach(vehicle => {
    // By department
    stats.byDepartment[vehicle.department] = (stats.byDepartment[vehicle.department] || 0) + 1;

    // By status
    stats.byStatus[vehicle.status] = (stats.byStatus[vehicle.status] || 0) + 1;
    stats[vehicle.status] = (stats[vehicle.status] || 0) + 1;

    // Drivers logged in
    if (vehicle.mobileAppState.isDriverLoggedIn) {
      stats.driversLoggedIn++;
    }
  });

  res.json({
    success: true,
    stats
  });
});

// WebSocket Server for real-time updates
const wss = new WebSocketServer({ port: WS_PORT });

const clients = new Set();

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected. Total clients:', clients.size + 1);
  clients.add(ws);

  // Send initial vehicle data
  ws.send(JSON.stringify({
    type: 'init',
    vehicles: Array.from(vehicles.values())
  }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log('[WebSocket] Client disconnected. Total clients:', clients.size);
  });

  ws.on('error', (error) => {
    console.error('[WebSocket] Error:', error.message);
    clients.delete(ws);
  });
});

// Broadcast updates to all connected clients
function broadcastUpdate(vehicleId, updates) {
  const message = JSON.stringify({
    type: 'vehicleUpdate',
    vehicleId,
    updates,
    timestamp: new Date().toISOString()
  });

  clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}

// Simulate real-time updates for demo purposes
function simulateRealTimeUpdates() {
  setInterval(() => {
    vehicles.forEach((vehicle, vehicleId) => {
      if (vehicle.status === 'active' || vehicle.status === 'responding') {
        // Update speed and position
        const speedChange = (Math.random() - 0.5) * 10;
        vehicle.obd2.speed = Math.max(0, Math.min(70, vehicle.obd2.speed + speedChange));
        vehicle.obd2.rpm = 750 + vehicle.obd2.speed * 60;
        vehicle.location.speed = vehicle.obd2.speed;

        // Update position (small movement within Tallahassee)
        const distanceKm = (vehicle.obd2.speed * 1.60934 / 3600) * 2; // 2-second interval
        const distanceDegrees = distanceKm / 111.32;
        const headingRad = vehicle.location.heading * Math.PI / 180;

        let newLat = vehicle.location.latitude + distanceDegrees * Math.cos(headingRad);
        let newLng = vehicle.location.longitude + distanceDegrees * Math.sin(headingRad) / Math.cos(vehicle.location.latitude * Math.PI / 180);

        // Keep within Tallahassee bounds
        const BOUNDS = {
          north: 30.5500,
          south: 30.3500,
          east: -84.1500,
          west: -84.4000
        };

        if (newLat > BOUNDS.north || newLat < BOUNDS.south) {
          vehicle.location.heading = (vehicle.location.heading + 180) % 360;
          newLat = vehicle.location.latitude;
        }

        if (newLng < BOUNDS.west || newLng > BOUNDS.east) {
          vehicle.location.heading = (vehicle.location.heading + 180) % 360;
          newLng = vehicle.location.longitude;
        }

        vehicle.location.latitude = newLat;
        vehicle.location.longitude = newLng;
        vehicle.location.timestamp = new Date().toISOString();

        // Update fuel
        vehicle.obd2.fuelLevel = Math.max(10, vehicle.obd2.fuelLevel - 0.001);

        vehicle.lastUpdate = new Date().toISOString();

        // Broadcast update
        broadcastUpdate(vehicleId, {
          location: vehicle.location,
          obd2: vehicle.obd2
        });
      }
    });
  }, 2000); // Update every 2 seconds
}

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚗 City of Tallahassee Fleet Emulator Orchestrator');
  console.log('===================================================');
  console.log('');
  console.log(`✅ API Server:       http://localhost:${PORT}`);
  console.log(`✅ WebSocket Server: ws://localhost:${WS_PORT}`);
  console.log('');
  console.log('Endpoints:');
  console.log(`  GET  /health                    - Health check`);
  console.log(`  GET  /api/vehicles              - Get all vehicles`);
  console.log(`  GET  /api/vehicles/:vehicleId   - Get single vehicle`);
  console.log(`  GET  /api/stats                 - Get fleet statistics`);
  console.log('');
  console.log('Real-time Updates:');
  console.log(`  Connect to ws://localhost:${WS_PORT} for live vehicle updates`);
  console.log('');

  // Initialize vehicles
  initializeVehicles();

  // Start real-time simulation
  simulateRealTimeUpdates();

  console.log(`🎯 ${vehicles.size} vehicles initialized and broadcasting updates`);
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  pool.end();
  process.exit(0);
});
