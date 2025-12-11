Here is a TypeScript code snippet that follows your requirements:

```typescript
import { Drizzle } from 'drizzle-orm';
import { Server } from 'ws';
import { config } from 'dotenv';
import { VehicleLocation, WebSocketMessage } from './types';

config();

const drizzle = new Drizzle({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const wss = new Server({ port: Number(process.env.WS_PORT) });

let lastPollTime = Date.now();

setInterval(async () => {
  try {
    const newPollTime = Date.now();
    const vehicleLocations: VehicleLocation[] = await drizzle.sql(
      `SELECT id, name, created_at, updated_at, tenant_id FROM vehicle_locations WHERE timestamp > $1 AND timestamp <= $2`,
      [lastPollTime, newPollTime]
    );

    const batchedUpdates = vehicleLocations.reduce((acc, location) => {
      if (!acc[location.vehicleId]) {
        acc[location.vehicleId] = [];
      }
      acc[location.vehicleId].push(location);
      return acc;
    }, {} as Record<string, VehicleLocation[]>);

    wss.clients.forEach((client) => {
      if (client.readyState === client.OPEN) {
        Object.entries(batchedUpdates).forEach(([vehicleId, locations]) => {
          const message: WebSocketMessage = {
            vehicleId,
            locations,
          };
          client.send(JSON.stringify(message));
        });
      }
    });

    lastPollTime = newPollTime;
  } catch (error) {
    console.error('Error polling vehicle locations:', error);
  }
}, 5000);
```

This script uses the `ws` library to create a WebSocket server and the `drizzle-orm` library to interact with the database. It polls the database every 5 seconds for new vehicle locations and broadcasts these updates to all connected WebSocket clients.

The `dotenv` library is used to load configuration from environment variables. The database connection details and the WebSocket server port are all configured this way.

The `VehicleLocation` and `WebSocketMessage` types are assumed to be defined in a separate `types.ts` file. The `VehicleLocation` type should include `vehicleId`, `timestamp`, `speed`, `heading`, and `address` properties. The `WebSocketMessage` type should include `vehicleId` and `locations` properties.

The script also includes error handling for the database polling operation. If an error occurs, it is logged to the console and the script continues to the next polling interval.