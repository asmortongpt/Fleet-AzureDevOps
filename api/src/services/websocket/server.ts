import url from 'url';

import { config } from 'dotenv';
import jwt from 'jsonwebtoken';
import { Pool, PoolClient } from 'pg';
import WebSocket from 'ws';

config();

interface ExtendedWebSocket extends WebSocket {
  isAlive?: boolean;
  vehicleId?: string;
}

interface VehicleLocation {
  vehicleId: string;
  latitude: number;
  longitude: number;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const wss = new WebSocket.Server({ port: 3001 });

wss.on('connection', (ws: ExtendedWebSocket, req) => {
  const parameters = url.parse(req.url!, true).query;
  const token: string = parameters.token as string;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    ws.vehicleId = (decoded as any).vehicleId;
  } catch (err) {
    ws.terminate();
    return;
  }

  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', async (message: string) => {
    const location: VehicleLocation = JSON.parse(message);
    const client: PoolClient = await pool.connect();
    try {
      await client.query('INSERT INTO vehicle_locations(vehicle_id, latitude, longitude) VALUES($1, $2, $3)', [location.vehicleId, location.latitude, location.longitude]);
      wss.clients.forEach((client: ExtendedWebSocket) => {
        if (client.vehicleId === location.vehicleId && client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      client.release();
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected: ${ws.vehicleId}`);
  });

  ws.on('error', (err) => {
    console.error(`Client error: ${err}`);
  });
});

setInterval(() => {
  wss.clients.forEach((ws: ExtendedWebSocket) => {
    if (!ws.isAlive) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);