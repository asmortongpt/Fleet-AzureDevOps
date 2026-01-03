import { vi } from 'vitest';
import { WebSocket, WebSocketServer } from 'ws';

/**
 * Mock WebSocket Server for Testing
 * Provides a lightweight WebSocket server that runs during tests
 * to prevent ECONNREFUSED errors
 */

let wss: WebSocketServer | null = null;
const TEST_WS_PORT = 8080;

export function startMockWebSocketServer() {
  if (wss) {
    return wss;
  }

  wss = new WebSocketServer({ port: TEST_WS_PORT });

  wss.on('connection', (ws: WebSocket) => {
    // Send a welcome message
    ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));

    // Echo messages back
    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        ws.send(JSON.stringify({ type: 'echo', data: message }));
      } catch (e) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      }
    });

    ws.on('error', () => {
      // Silently handle errors during tests
    });
  });

  return wss;
}

export function stopMockWebSocketServer() {
  return new Promise<void>((resolve) => {
    if (!wss) {
      resolve();
      return;
    }

    wss.close(() => {
      wss = null;
      resolve();
    });
  });
}

export function getMockWebSocketServer() {
  return wss;
}

export const TEST_WEBSOCKET_URL = `ws://localhost:${TEST_WS_PORT}`;
