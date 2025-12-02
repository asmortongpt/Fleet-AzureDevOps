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

const wss = new WebSocket.Server({ port: Number(process.env.WS_PORT) });

wss.on('connection', (ws) => {
  ws.on('message', async (message: string) => {
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