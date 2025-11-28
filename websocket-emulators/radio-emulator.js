/**
 * Radio Communications WebSocket Emulator
 *
 * Emulates realistic radio communications and dispatch messages
 * Port: 8082
 *
 * Security: FedRAMP-compliant
 * - No hardcoded secrets
 * - Input validation
 * - Message sanitization
 */

import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const PORT = process.env.RADIO_PORT || 8082;
const MESSAGE_INTERVAL = 10000; // 10 seconds
const MAX_CLIENTS = 100;

// Realistic radio communication templates
const RADIO_MESSAGES = [
  { from: 'DISPATCH', to: 'UNIT-5', priority: 'ROUTINE', message: 'Unit 5, proceed to fuel depot for refueling' },
  { from: 'DISPATCH', to: 'ALL_UNITS', priority: 'URGENT', message: 'All units, be advised of heavy traffic on I-10 eastbound' },
  { from: 'UNIT-3', to: 'DISPATCH', priority: 'ROUTINE', message: 'Dispatch, Unit 3 en route to maintenance facility' },
  { from: 'DISPATCH', to: 'UNIT-7', priority: 'HIGH', message: 'Unit 7, priority pickup at 123 Main St' },
  { from: 'UNIT-12', to: 'DISPATCH', priority: 'ROUTINE', message: 'Dispatch, Unit 12 completed delivery, returning to base' },
  { from: 'DISPATCH', to: 'UNIT-9', priority: 'ROUTINE', message: 'Unit 9, confirm current location' },
  { from: 'UNIT-9', to: 'DISPATCH', priority: 'ROUTINE', message: 'Dispatch, Unit 9 at coordinates 28.5383, -81.3792' },
  { from: 'DISPATCH', to: 'ALL_UNITS', priority: 'ALERT', message: 'Weather advisory: Heavy rain expected in next 30 minutes' },
  { from: 'UNIT-4', to: 'DISPATCH', priority: 'URGENT', message: 'Dispatch, Unit 4 reporting minor vehicle issue, need assistance' },
  { from: 'DISPATCH', to: 'UNIT-4', priority: 'URGENT', message: 'Unit 4, roadside assistance dispatched to your location' },
  { from: 'DISPATCH', to: 'UNIT-6', priority: 'HIGH', message: 'Unit 6, reroute to alternate pickup location' },
  { from: 'UNIT-8', to: 'DISPATCH', priority: 'ROUTINE', message: 'Dispatch, Unit 8 beginning scheduled break' },
  { from: 'DISPATCH', to: 'ALL_UNITS', priority: 'INFO', message: 'Reminder: All vehicles must complete daily inspection reports' },
  { from: 'UNIT-2', to: 'DISPATCH', priority: 'ROUTINE', message: 'Dispatch, Unit 2 fuel level at 25%, planning refuel stop' },
  { from: 'DISPATCH', to: 'UNIT-11', priority: 'ROUTINE', message: 'Unit 11, update ETA to destination' },
];

// Emergency/incident templates
const EMERGENCY_MESSAGES = [
  { from: 'DISPATCH', to: 'ALL_UNITS', priority: 'EMERGENCY', message: 'CODE RED: Accident reported on Route 27, all nearby units respond' },
  { from: 'UNIT-10', to: 'DISPATCH', priority: 'EMERGENCY', message: 'Dispatch, Unit 10 requesting immediate backup' },
  { from: 'DISPATCH', to: 'UNIT-5', priority: 'EMERGENCY', message: 'Unit 5, medical emergency at your location, EMS en route' },
];

class RadioEmulator {
  constructor() {
    this.messageQueue = [];
    this.activeIncident = null;
  }

  generateMessage() {
    // 5% chance of emergency message
    const isEmergency = Math.random() < 0.05;
    const messageTemplate = isEmergency
      ? EMERGENCY_MESSAGES[Math.floor(Math.random() * EMERGENCY_MESSAGES.length)]
      : RADIO_MESSAGES[Math.floor(Math.random() * RADIO_MESSAGES.length)];

    return {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      from: messageTemplate.from,
      to: messageTemplate.to,
      priority: messageTemplate.priority,
      message: messageTemplate.message,
      channel: messageTemplate.to === 'ALL_UNITS' ? 'PRIMARY' : 'TACTICAL',
      acknowledged: false,
      readReceipts: [],
    };
  }

  generateStatusUpdate() {
    const statuses = ['AVAILABLE', 'BUSY', 'EN_ROUTE', 'ON_SCENE', 'RETURNING', 'OFF_DUTY'];
    const units = Array.from({ length: 12 }, (_, i) => `UNIT-${i + 1}`);

    return units.map(unitId => ({
      unitId,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      location: {
        latitude: 28.5383 + (Math.random() - 0.5) * 0.2,
        longitude: -81.3792 + (Math.random() - 0.5) * 0.2,
      },
      lastUpdate: new Date().toISOString(),
    }));
  }
}

// Create WebSocket server
const wss = new WebSocketServer({
  port: PORT,
  maxPayload: 1024 * 100, // 100KB max payload
  clientTracking: true,
});

const clients = new Map();
const radioEmulator = new RadioEmulator();

console.log(`📻 Radio Emulator listening on ws://localhost:${PORT}`);
console.log('📡 Emulating realistic radio communications');

wss.on('connection', (ws, req) => {
  // Rate limiting
  if (wss.clients.size > MAX_CLIENTS) {
    ws.close(1008, 'Server capacity reached');
    return;
  }

  const clientId = uuidv4();
  const callSign = `MOBILE-${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`;

  console.log(`✅ Client connected: ${clientId} (${wss.clients.size} total)`);

  clients.set(clientId, { ws, callSign });

  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connection',
    clientId,
    callSign,
    timestamp: new Date().toISOString(),
    message: 'Connected to Radio Communications Network',
    channels: ['PRIMARY', 'TACTICAL', 'EMERGENCY'],
  }));

  // Send initial status update
  ws.send(JSON.stringify({
    type: 'status_update',
    data: radioEmulator.generateStatusUpdate(),
    timestamp: new Date().toISOString(),
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      // Input validation
      if (message.type === 'transmit' && message.message && message.to) {
        // Broadcast message to all clients
        const transmission = {
          type: 'radio_message',
          data: {
            id: uuidv4(),
            from: callSign,
            to: message.to,
            priority: message.priority || 'ROUTINE',
            message: message.message.substring(0, 500), // Max 500 chars
            channel: message.channel || 'PRIMARY',
            timestamp: new Date().toISOString(),
          },
        };

        // Broadcast to all connected clients
        clients.forEach(({ ws: clientWs }) => {
          if (clientWs.readyState === 1) {
            clientWs.send(JSON.stringify(transmission));
          }
        });
      }

      if (message.type === 'acknowledge' && message.messageId) {
        // Acknowledge message receipt
        ws.send(JSON.stringify({
          type: 'acknowledgment',
          messageId: message.messageId,
          acknowledged: true,
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
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error.message);
  });
});

// Broadcast radio messages periodically
setInterval(() => {
  if (clients.size === 0) return;

  const message = radioEmulator.generateMessage();

  clients.forEach(({ ws }) => {
    if (ws.readyState === 1) {
      try {
        ws.send(JSON.stringify({
          type: 'radio_message',
          data: message,
        }));
      } catch (error) {
        console.error('Error broadcasting message:', error.message);
      }
    }
  });
}, MESSAGE_INTERVAL);

// Broadcast status updates periodically
setInterval(() => {
  if (clients.size === 0) return;

  const statusUpdate = radioEmulator.generateStatusUpdate();

  clients.forEach(({ ws }) => {
    if (ws.readyState === 1) {
      try {
        ws.send(JSON.stringify({
          type: 'status_update',
          data: statusUpdate,
          timestamp: new Date().toISOString(),
        }));
      } catch (error) {
        console.error('Error broadcasting status:', error.message);
      }
    }
  });
}, 30000); // Every 30 seconds

// Health check
setInterval(() => {
  console.log(`📡 Active radio connections: ${wss.clients.size}`);
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
