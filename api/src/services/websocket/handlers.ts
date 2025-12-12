Here is a TypeScript code snippet that follows your requirements:

```typescript
import { Client } from 'pg';
import WebSocket from 'ws';
import dotenv from 'dotenv';
import { VehicleMessage, AlertMessage, PingPongMessage } from './messageTypes';

dotenv.config();

const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

client.connect();

// SECURITY FIX: Message rate limiting
const MAX_MESSAGES_PER_SECOND = 10;
const messageRateLimits = new Map<string, { count: number; resetTime: number }>();

function checkMessageRateLimit(socketId: string): boolean {
  const now = Date.now();
  const limit = messageRateLimits.get(socketId);

  if (!limit || now > limit.resetTime) {
    messageRateLimits.set(socketId, { count: 1, resetTime: now + 1000 });
    return true;
  }

  if (limit.count >= MAX_MESSAGES_PER_SECOND) {
    console.warn(`[WebSocket] Message rate limit exceeded for socket: ${socketId}`);
    return false;
  }

  limit.count++;
  return true;
}

// SECURITY FIX: Add message size limit
const MAX_MESSAGE_SIZE = 1048576; // 1MB
const wss = new WebSocket.Server({
  port: Number(process.env.WS_PORT),
  maxPayload: MAX_MESSAGE_SIZE
});

interface ExtendedWebSocket extends WebSocket {
  socketId?: string;
}

wss.on('connection', (ws: ExtendedWebSocket) => {
  // SECURITY FIX: Generate unique socket ID for rate limiting
  ws.socketId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  ws.on('message', async (message: string) => {
    // SECURITY FIX: Check message rate limit
    if (!checkMessageRateLimit(ws.socketId!)) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        code: 'RATE_LIMIT',
        message: 'Too many messages. Please slow down.'
      }));
      return;
    }

    try {
      const parsedMessage = JSON.parse(message);

      switch (parsedMessage.type) {
        case 'SUBSCRIBE_VEHICLE':
          const vehicleMessage: VehicleMessage = parsedMessage;
          await client.query('INSERT INTO vehicle_tracking (vehicle_id, room_id) VALUES ($1, $2)', [vehicleMessage.vehicleId, vehicleMessage.roomId]);
          break;
        case 'UNSUBSCRIBE_VEHICLE':
          const unVehicleMessage: VehicleMessage = parsedMessage;
          await client.query('DELETE FROM vehicle_tracking WHERE vehicle_id = $1 AND room_id = $2', [unVehicleMessage.vehicleId, unVehicleMessage.roomId]);
          break;
        case 'LOCATION_UPDATE':
          ws.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
          });
          break;
        case 'ALERT':
          const alertMessage: AlertMessage = parsedMessage;
          await client.query('INSERT INTO alerts (vehicle_id, alert_type, alert_message) VALUES ($1, $2, $3)', [alertMessage.vehicleId, alertMessage.alertType, alertMessage.alertMessage]);
          break;
        case 'PING':
        case 'PONG':
          const pingPongMessage: PingPongMessage = parsedMessage;
          ws.send(JSON.stringify(pingPongMessage));
          break;
        default:
          throw new Error('Invalid message type');
      }
    } catch (error) {
      console.error(`Error handling message: ${error}`);
    }
  });

  // SECURITY FIX: Clean up rate limit tracking on disconnect
  ws.on('close', () => {
    if (ws.socketId) {
      messageRateLimits.delete(ws.socketId);
    }
  });
});
```

In the `messageTypes.ts` file, you would define your message types:

```typescript
export interface VehicleMessage {
  type: 'SUBSCRIBE_VEHICLE' | 'UNSUBSCRIBE_VEHICLE';
  vehicleId: string;
  roomId: string;
}

export interface AlertMessage {
  type: 'ALERT';
  vehicleId: string;
  alertType: string;
  alertMessage: string;
}

export interface PingPongMessage {
  type: 'PING' | 'PONG';
}
```

This code uses the `ws` library for WebSocket server, the `pg` library for PostgreSQL client, and the `dotenv` library for environment variables. It connects to the PostgreSQL database using environment variables, starts a WebSocket server, and listens for messages. When a message is received, it is parsed and handled based on its type. If an error occurs during message handling, it is logged to the console.