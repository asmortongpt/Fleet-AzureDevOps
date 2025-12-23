import express, { Express } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import { Server as WSServer } from 'ws';
import { Pool } from 'pg';
import { config as dotenvConfig } from 'dotenv';
import { AddressInfo } from 'net';

dotenvConfig();

const app: Express = express();
const server: HTTPServer = createServer(app);
const wss: WSServer = new WSServer({ noServer: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get('/route', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM table WHERE id = $1', [req.query.id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', (ws) => {
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