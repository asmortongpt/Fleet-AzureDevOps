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

const wss = new WebSocket.Server({ port: Number(process.env.WS_PORT) || 3002 }); // Use 3002 to avoid conflict if 3001 is server? Or rely on env.

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
          wss.clients.forEach((client) => {
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