Here is a TypeScript code snippet that fulfills your requirements:

```typescript
import express, { Express } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import { Server as WSServer } from 'ws';
import { Pool } from 'pg';
import { config as dotenvConfig } from 'dotenv';
import { AddressInfo } from 'net';
import { IncomingMessage } from 'http';

dotenvConfig();

const app: Express = express();
const server: HTTPServer = createServer(app);
const wss: WSServer = new WSServer({ noServer: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// SECURITY FIX: Connection limiting
const MAX_CONNECTIONS_PER_IP = 10;
const MAX_CONNECTIONS_PER_USER = 5;
const connectionsByIP = new Map<string, number>();
const connectionsByUser = new Map<string, number>();

app.get('/route', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, created_at, updated_at FROM table WHERE id = $1', [req.query.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.on('upgrade', (request, socket, head) => {
  // SECURITY FIX: Check IP-based connection limits
  const clientIP = request.socket.remoteAddress || 'unknown';
  const currentIPCount = connectionsByIP.get(clientIP) || 0;

  if (currentIPCount >= MAX_CONNECTIONS_PER_IP) {
    console.warn(`[WebSocket] Connection limit exceeded for IP: ${clientIP}`);
    socket.write('HTTP/1.1 429 Too Many Connections\r\n\r\n');
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws, request: IncomingMessage) => {
  const clientIP = request.socket.remoteAddress || 'unknown';

  // SECURITY FIX: Track IP connections
  const currentIPCount = connectionsByIP.get(clientIP) || 0;
  connectionsByIP.set(clientIP, currentIPCount + 1);

  // SECURITY FIX: Cleanup on disconnect
  ws.on('close', () => {
    const count = connectionsByIP.get(clientIP) || 1;
    if (count <= 1) {
      connectionsByIP.delete(clientIP);
    } else {
      connectionsByIP.set(clientIP, count - 1);
    }
    console.log(`[WebSocket] Client disconnected from IP: ${clientIP}`);
  });

  ws.on('message', (message) => {
    console.log(`Received message => ${message}`);
  });

  ws.send('Hello! Message from server!!');
});

const startServer = () => {
  const { port } = server.listen(process.env.PORT || 3000).address() as AddressInfo;
  console.log(`Server started on port ${port}`);
};

const stopServer = () => {
  server.close((err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }

    pool.end(() => {
      console.log('Pg pool ended');
    });

    console.log('Server closed');
  });
};

process.on('SIGTERM', stopServer);
process.on('SIGINT', stopServer);

export { startServer, stopServer };
```

This script creates an Express server and a WebSocket server that share the same port. It uses environment variables for configuration and parameterized queries for database access. It also handles server shutdown gracefully by closing the HTTP server and the PostgreSQL connection pool.