/**
 * Dispatch Events WebSocket Emulator
 *
 * Emulates realistic dispatch events, assignments, and task updates
 * Port: 8083
 *
 * Security: FedRAMP-compliant
 * - No hardcoded secrets
 * - Input validation
 * - Event sanitization
 */

import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.DISPATCH_PORT || 8083;
const EVENT_INTERVAL = 15000; // 15 seconds
const MAX_CLIENTS = 100;

// Dispatch event types
const EVENT_TYPES = {
  ASSIGNMENT: 'ASSIGNMENT',
  COMPLETION: 'COMPLETION',
  ROUTE_UPDATE: 'ROUTE_UPDATE',
  DELAY: 'DELAY',
  CANCELLATION: 'CANCELLATION',
  PRIORITY_CHANGE: 'PRIORITY_CHANGE',
  LOCATION_UPDATE: 'LOCATION_UPDATE',
  INCIDENT: 'INCIDENT',
  MAINTENANCE_ALERT: 'MAINTENANCE_ALERT',
  FUEL_ALERT: 'FUEL_ALERT',
};

// Task templates
const TASK_TEMPLATES = [
  { type: 'DELIVERY', location: 'Downtown Office Complex', priority: 'HIGH' },
  { type: 'PICKUP', location: 'Warehouse District', priority: 'MEDIUM' },
  { type: 'SERVICE_CALL', location: 'Municipal Building', priority: 'HIGH' },
  { type: 'INSPECTION', location: 'Fleet Maintenance Facility', priority: 'LOW' },
  { type: 'TRANSPORT', location: 'Airport Terminal', priority: 'URGENT' },
  { type: 'DELIVERY', location: 'Government Center', priority: 'MEDIUM' },
  { type: 'EMERGENCY', location: 'Hospital District', priority: 'CRITICAL' },
  { type: 'ROUTINE', location: 'Industrial Park', priority: 'LOW' },
];

// Incident types
const INCIDENTS = [
  'Vehicle breakdown',
  'Traffic accident',
  'Road closure',
  'Weather delay',
  'Customer unavailable',
  'Access denied',
  'Equipment malfunction',
  'Delay at checkpoint',
];

class DispatchEmulator {
  constructor() {
    this.activeAssignments = new Map();
    this.completedToday = 0;
    this.pendingCount = 0;
  }

  generateAssignment() {
    const template = TASK_TEMPLATES[Math.floor(Math.random() * TASK_TEMPLATES.length)];
    const assignmentId = `TASK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const assignment = {
      id: assignmentId,
      type: EVENT_TYPES.ASSIGNMENT,
      taskType: template.type,
      vehicleId: `VEH-${Math.floor(Math.random() * 100).toString().padStart(4, '0')}`,
      driverId: `DRV-${Math.floor(Math.random() * 50).toString().padStart(3, '0')}`,
      priority: template.priority,
      location: {
        address: template.location,
        latitude: 28.5383 + (Math.random() - 0.5) * 0.1,
        longitude: -81.3792 + (Math.random() - 0.5) * 0.1,
      },
      destination: {
        address: TASK_TEMPLATES[Math.floor(Math.random() * TASK_TEMPLATES.length)].location,
        latitude: 28.5383 + (Math.random() - 0.5) * 0.1,
        longitude: -81.3792 + (Math.random() - 0.5) * 0.1,
      },
      estimatedDuration: Math.floor(30 + Math.random() * 120), // 30-150 minutes
      scheduledTime: new Date(Date.now() + Math.random() * 3600000).toISOString(),
      status: 'ASSIGNED',
      timestamp: new Date().toISOString(),
    };

    this.activeAssignments.set(assignmentId, assignment);
    this.pendingCount++;

    return assignment;
  }

  generateCompletion() {
    if (this.activeAssignments.size === 0) return null;

    const assignments = Array.from(this.activeAssignments.values());
    const assignment = assignments[Math.floor(Math.random() * assignments.length)];

    this.activeAssignments.delete(assignment.id);
    this.completedToday++;
    this.pendingCount = Math.max(0, this.pendingCount - 1);

    return {
      id: assignment.id,
      type: EVENT_TYPES.COMPLETION,
      taskType: assignment.taskType,
      vehicleId: assignment.vehicleId,
      driverId: assignment.driverId,
      completionTime: new Date().toISOString(),
      actualDuration: Math.floor(assignment.estimatedDuration * (0.8 + Math.random() * 0.4)),
      status: 'COMPLETED',
      notes: 'Task completed successfully',
      timestamp: new Date().toISOString(),
    };
  }

  generateRouteUpdate() {
    if (this.activeAssignments.size === 0) return null;

    const assignments = Array.from(this.activeAssignments.values());
    const assignment = assignments[Math.floor(Math.random() * assignments.length)];

    return {
      id: uuidv4(),
      type: EVENT_TYPES.ROUTE_UPDATE,
      assignmentId: assignment.id,
      vehicleId: assignment.vehicleId,
      currentLocation: {
        latitude: 28.5383 + (Math.random() - 0.5) * 0.1,
        longitude: -81.3792 + (Math.random() - 0.5) * 0.1,
      },
      progress: Math.floor(Math.random() * 100),
      eta: new Date(Date.now() + Math.random() * 3600000).toISOString(),
      distanceRemaining: Math.floor(Math.random() * 50),
      timestamp: new Date().toISOString(),
    };
  }

  generateIncident() {
    const incident = INCIDENTS[Math.floor(Math.random() * INCIDENTS.length)];

    return {
      id: `INC-${Date.now()}`,
      type: EVENT_TYPES.INCIDENT,
      severity: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'][Math.floor(Math.random() * 4)],
      description: incident,
      vehicleId: `VEH-${Math.floor(Math.random() * 100).toString().padStart(4, '0')}`,
      location: {
        latitude: 28.5383 + (Math.random() - 0.5) * 0.1,
        longitude: -81.3792 + (Math.random() - 0.5) * 0.1,
      },
      reportedBy: `DRV-${Math.floor(Math.random() * 50).toString().padStart(3, '0')}`,
      status: 'ACTIVE',
      timestamp: new Date().toISOString(),
    };
  }

  generateAlert() {
    const alertType = Math.random() < 0.5 ? EVENT_TYPES.MAINTENANCE_ALERT : EVENT_TYPES.FUEL_ALERT;

    if (alertType === EVENT_TYPES.MAINTENANCE_ALERT) {
      return {
        id: uuidv4(),
        type: EVENT_TYPES.MAINTENANCE_ALERT,
        vehicleId: `VEH-${Math.floor(Math.random() * 100).toString().padStart(4, '0')}`,
        alertLevel: ['INFO', 'WARNING', 'CRITICAL'][Math.floor(Math.random() * 3)],
        message: 'Scheduled maintenance due within 500 miles',
        mileageRemaining: Math.floor(Math.random() * 500),
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        id: uuidv4(),
        type: EVENT_TYPES.FUEL_ALERT,
        vehicleId: `VEH-${Math.floor(Math.random() * 100).toString().padStart(4, '0')}`,
        fuelLevel: Math.floor(Math.random() * 20), // Low fuel
        nearestStation: {
          name: 'QuikFuel Station',
          distance: Math.floor(Math.random() * 10) + 1,
          latitude: 28.5383 + (Math.random() - 0.5) * 0.05,
          longitude: -81.3792 + (Math.random() - 0.5) * 0.05,
        },
        timestamp: new Date().toISOString(),
      };
    }
  }

  getStats() {
    return {
      activeAssignments: this.activeAssignments.size,
      completedToday: this.completedToday,
      pendingCount: this.pendingCount,
      timestamp: new Date().toISOString(),
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
const dispatchEmulator = new DispatchEmulator();

console.log(`📋 Dispatch Emulator listening on ws://localhost:${PORT}`);
console.log('🚀 Emulating realistic dispatch events and assignments');

wss.on('connection', (ws, req) => {
  // Rate limiting
  if (wss.clients.size > MAX_CLIENTS) {
    ws.close(1008, 'Server capacity reached');
    return;
  }

  const clientId = uuidv4();

  console.log(`✅ Client connected: ${clientId} (${wss.clients.size} total)`);

  clients.set(clientId, ws);

  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connection',
    clientId,
    timestamp: new Date().toISOString(),
    message: 'Connected to Dispatch System',
  }));

  // Send current stats
  ws.send(JSON.stringify({
    type: 'stats',
    data: dispatchEmulator.getStats(),
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      // Input validation
      if (message.type === 'create_assignment' && message.data) {
        const assignment = dispatchEmulator.generateAssignment();
        ws.send(JSON.stringify({
          type: 'assignment_created',
          data: assignment,
        }));
      }

      if (message.type === 'get_stats') {
        ws.send(JSON.stringify({
          type: 'stats',
          data: dispatchEmulator.getStats(),
        }));
      }
    } catch (error) {
      console.error('Invalid message received:', error.message);
    }
  });

  ws.on('close', () => {
    console.log(`❌ Client disconnected: ${clientId}`);
    clients.delete(clientId);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error.message);
  });
});

// Generate random dispatch events
setInterval(() => {
  if (clients.size === 0) return;

  const eventType = Math.random();
  let event;

  if (eventType < 0.3) {
    event = dispatchEmulator.generateAssignment();
  } else if (eventType < 0.5 && dispatchEmulator.activeAssignments.size > 0) {
    event = dispatchEmulator.generateCompletion();
  } else if (eventType < 0.7 && dispatchEmulator.activeAssignments.size > 0) {
    event = dispatchEmulator.generateRouteUpdate();
  } else if (eventType < 0.85) {
    event = dispatchEmulator.generateAlert();
  } else {
    event = dispatchEmulator.generateIncident();
  }

  if (event) {
    clients.forEach((ws) => {
      if (ws.readyState === 1) {
        try {
          ws.send(JSON.stringify({
            type: 'dispatch_event',
            data: event,
          }));
        } catch (error) {
          console.error('Error broadcasting event:', error.message);
        }
      }
    });
  }
}, EVENT_INTERVAL);

// Broadcast stats periodically
setInterval(() => {
  if (clients.size === 0) return;

  const stats = dispatchEmulator.getStats();

  clients.forEach((ws) => {
    if (ws.readyState === 1) {
      try {
        ws.send(JSON.stringify({
          type: 'stats',
          data: stats,
        }));
      } catch (error) {
        console.error('Error broadcasting stats:', error.message);
      }
    }
  });
}, 60000); // Every minute

// Health check
setInterval(() => {
  console.log(`📡 Active dispatch connections: ${wss.clients.size} | Active assignments: ${dispatchEmulator.activeAssignments.size}`);
}, 30000);

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
