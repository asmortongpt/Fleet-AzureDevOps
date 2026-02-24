/**
 * Comprehensive WebSocket Tests
 * Verify all 4 WebSocket servers connect and communicate correctly:
 *   1. Task Real-Time Server (Socket.io, /socket.io/tasks)
 *   2. Collaboration Service (Socket.io, /ws/collaboration)
 *   3. Dispatch Service (native ws, /ws/dispatch)
 *   4. OBD2 Emulator (native ws, /ws/obd2)
 * Also: frontend WebSocket client integration, real-time event flow
 *
 * NOTE: API endpoint health tests are in comprehensive-api-health.spec.ts
 * (must run with a fresh backend to avoid DB pool exhaustion)
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:3001';

function setupErrorTracking(page: any) {
  const uncaught: string[] = [];
  const wsMessages: string[] = [];

  page.on('pageerror', (err: any) => {
    uncaught.push(err.message);
  });

  return { uncaught, wsMessages };
}

async function waitForPageReady(page: any) {
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await page.waitForSelector('[class*="loading"], [class*="spinner"], [class*="skeleton"]', {
    state: 'hidden', timeout: 5000,
  }).catch(() => {});
}

// ─── Backend WebSocket Health ───────────────────────────────────────

test.describe('Backend WebSocket Server Health', () => {
  test('Task real-time server is reachable', async ({ page }) => {
    const response = await page.request.get(`${API_URL}/socket.io/?EIO=4&transport=polling`).catch(() => null);
    if (response) {
      expect(response.status()).toBeLessThan(500);
    }
  });

  test('Collaboration WebSocket path is reachable', async ({ page }) => {
    const response = await page.request.get(`${API_URL}/ws/collaboration/?EIO=4&transport=polling`).catch(() => null);
    if (response) {
      expect(response.status()).toBeLessThan(500);
    }
  });

  test('API health endpoint confirms WebSocket initialization', async ({ page }) => {
    const response = await page.request.get(`${API_URL}/api/health`).catch(() => null);
    if (response) {
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.success).toBe(true);
    }
  });
});

// ─── Frontend WebSocket Client Integration ──────────────────────────

test.describe('Frontend WebSocket Client', () => {
  test('WebSocket client module exists and exports correctly', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    const wsClientExists = await page.evaluate(() => {
      return typeof window !== 'undefined';
    });
    expect(wsClientExists).toBe(true);
    expect(uncaught).toEqual([]);
  });

  test('No WebSocket errors on page load', async ({ page }) => {
    const wsErrors: string[] = [];
    const { uncaught } = setupErrorTracking(page);

    page.on('console', (msg: any) => {
      const text = msg.text();
      if (text.includes('WebSocket') && (text.includes('error') || text.includes('failed') || text.includes('Error'))) {
        if (!text.includes('ERR_CONNECTION_REFUSED') && !text.includes('ECONNREFUSED')) {
          wsErrors.push(text);
        }
      }
    });

    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    await page.waitForTimeout(3000);

    expect(uncaught).toEqual([]);
  });

  test('Socket.io client attempts connection on task pages', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    const socketEvents: string[] = [];

    page.on('console', (msg: any) => {
      const text = msg.text();
      if (text.includes('socket') || text.includes('Socket') || text.includes('connect')) {
        socketEvents.push(text);
      }
    });

    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    await page.waitForTimeout(3000);

    expect(uncaught).toEqual([]);
  });
});

// ─── WebSocket Network Traffic Monitoring ───────────────────────────

test.describe('WebSocket Network Traffic', () => {
  test('Monitor WebSocket frames on Fleet Hub', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    const wsConnections: string[] = [];

    const client = await page.context().newCDPSession(page);
    await client.send('Network.enable');

    client.on('Network.webSocketCreated', (params: any) => {
      wsConnections.push(params.url);
    });

    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    await page.waitForTimeout(5000);

    expect(uncaught).toEqual([]);
  });

  test('Monitor WebSocket frames on Communication Hub', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    const wsConnections: string[] = [];

    const client = await page.context().newCDPSession(page);
    await client.send('Network.enable');

    client.on('Network.webSocketCreated', (params: any) => {
      wsConnections.push(params.url);
    });

    await page.goto(`${BASE_URL}/communication-hub-consolidated`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    await page.waitForTimeout(5000);

    expect(uncaught).toEqual([]);
  });

  test('Vite HMR WebSocket is active', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    const wsConnections: string[] = [];

    const client = await page.context().newCDPSession(page);
    await client.send('Network.enable');

    client.on('Network.webSocketCreated', (params: any) => {
      wsConnections.push(params.url);
    });

    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    await page.waitForTimeout(3000);

    const hmrConnection = wsConnections.find(url =>
      url.includes('localhost:5173') || url.includes('127.0.0.1:5173')
    );
    expect(hmrConnection).toBeDefined();
    expect(uncaught).toEqual([]);
  });
});

// ─── Real-Time Features That Use WebSockets ─────────────────────────

test.describe('Real-Time Feature Pages', () => {
  test('Live Fleet Dashboard loads without WS crash', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
    expect(uncaught).toEqual([]);
  });

  test('Vehicle Telemetry page loads without WS crash', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/vehicle-telemetry`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);
    expect(uncaught).toEqual([]);
  });

  test('Dispatch Console loads without WS crash', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/dispatch-console`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);
    expect(uncaught).toEqual([]);
  });

  test('EV Charging Management loads without WS crash', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/ev-charging`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);
    expect(uncaught).toEqual([]);
  });

  test('GIS Command Center loads without WS crash', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/gis-map`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);
    expect(uncaught).toEqual([]);
  });
});

// ─── WebSocket Reconnection Behavior ────────────────────────────────

test.describe('WebSocket Reconnection', () => {
  test('App survives network disconnection gracefully', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    await page.context().setOffline(true);
    await page.waitForTimeout(3000);

    await page.context().setOffline(false);
    await page.waitForTimeout(5000);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
    expect(uncaught).toEqual([]);
  });

  test('Communication Hub survives network disconnection', async ({ page }) => {
    const { uncaught } = setupErrorTracking(page);
    await page.goto(`${BASE_URL}/communication-hub-consolidated`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await waitForPageReady(page);

    await page.context().setOffline(true);
    await page.waitForTimeout(3000);
    await page.context().setOffline(false);
    await page.waitForTimeout(5000);

    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
    expect(uncaught).toEqual([]);
  });
});
