/**
 * WebSocket Client Tests
 * Comprehensive test suite for WebSocket functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { WebSocketClient, WebSocketMessage } from '@/lib/websocket-client';

/* ============================================================
   Mock WebSocket
   ============================================================ */

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  protocols?: string | string[];

  onopen: ((this: WebSocket, ev: Event) => any) | null = null;
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  onerror: ((this: WebSocket, ev: Event) => any) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;

  sentMessages: string[] = [];

  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    this.protocols = protocols;

    // Simulate async connection
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    this.sentMessages.push(data);
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSING;
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED;
      const event = new CloseEvent('close', { code, reason });
      this.onclose?.(event);
    }, 10);
  }

  ping() {
    // Mock ping
  }

  // Helper methods for testing
  simulateMessage(data: any) {
    if (this.onmessage) {
      const event = new MessageEvent('message', {
        data: typeof data === 'string' ? data : JSON.stringify(data),
      });
      this.onmessage(event);
    }
  }

  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }

  simulateClose(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code, reason }));
    }
  }
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

/* ============================================================
   Helper Functions
   ============================================================ */

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* ============================================================
   Tests
   ============================================================ */

describe('WebSocketClient', () => {
  let client: WebSocketClient;
  let mockWs: MockWebSocket;

  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    client?.disconnect();
    vi.restoreAllMocks();
  });

  describe('Connection Management', () => {
    it('should connect successfully', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        debug: false,
      });

      const openHandler = vi.fn();
      client.onOpen(openHandler);

      client.connect();

      // Wait for connection
      await vi.advanceTimersByTimeAsync(20);

      expect(openHandler).toHaveBeenCalled();
      expect(client.isOpen()).toBe(true);
      expect(client.getConnectionState()).toBe('open');
    });

    it('should handle connection errors', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        debug: false,
      });

      const errorHandler = vi.fn();
      client.onError(errorHandler);

      client.connect();

      // Simulate error before connection opens
      const ws = (client as any).ws as MockWebSocket;
      ws.simulateError();

      expect(errorHandler).toHaveBeenCalled();
    });

    it('should disconnect cleanly', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        debug: false,
      });

      const closeHandler = vi.fn();
      client.onClose(closeHandler);

      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      client.disconnect();
      await vi.advanceTimersByTimeAsync(20);

      expect(closeHandler).toHaveBeenCalled();
      expect(client.isOpen()).toBe(false);
    });

    it('should not connect if already connected', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        debug: false,
      });

      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      const openHandler = vi.fn();
      client.onOpen(openHandler);

      // Try to connect again
      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      // Should not trigger open again
      expect(openHandler).not.toHaveBeenCalled();
    });
  });

  describe('Reconnection', () => {
    it('should reconnect with exponential backoff', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        reconnect: true,
        reconnectInterval: 1000,
        maxReconnectAttempts: 3,
        debug: false,
      });

      const openHandler = vi.fn();
      client.onOpen(openHandler);

      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      expect(openHandler).toHaveBeenCalledTimes(1);

      // Simulate disconnect
      const ws = (client as any).ws as MockWebSocket;
      ws.simulateClose();

      // First reconnect: 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(20);
      expect(openHandler).toHaveBeenCalledTimes(2);

      // Disconnect again
      const ws2 = (client as any).ws as MockWebSocket;
      ws2.simulateClose();

      // Second reconnect: 2000ms (exponential backoff)
      await vi.advanceTimersByTimeAsync(2000);
      await vi.advanceTimersByTimeAsync(20);
      expect(openHandler).toHaveBeenCalledTimes(3);
    });

    it('should stop reconnecting after max attempts', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        reconnect: true,
        reconnectInterval: 100,
        maxReconnectAttempts: 2,
        debug: false,
      });

      const openHandler = vi.fn();
      client.onOpen(openHandler);

      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      // Disconnect 3 times
      for (let i = 0; i < 3; i++) {
        const ws = (client as any).ws as MockWebSocket;
        ws.simulateClose();
        await vi.advanceTimersByTimeAsync(500);
        await vi.advanceTimersByTimeAsync(20);
      }

      // Should have connected initially + 2 reconnects
      expect(openHandler).toHaveBeenCalledTimes(3);
    });

    it('should reset reconnect attempts on successful connection', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        reconnect: true,
        reconnectInterval: 100,
        debug: false,
      });

      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      // Get internal reconnectAttempts
      const reconnectAttempts = (client as any).reconnectAttempts;
      expect(reconnectAttempts).toBe(0);
    });
  });

  describe('Heartbeat', () => {
    it('should send ping messages at intervals', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        heartbeatInterval: 1000,
        debug: false,
      });

      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      const ws = (client as any).ws as MockWebSocket;
      const initialMessageCount = ws.sentMessages.length;

      // Wait for heartbeat interval
      await vi.advanceTimersByTimeAsync(1000);

      // Should have sent ping
      expect(ws.sentMessages.length).toBeGreaterThan(initialMessageCount);

      const lastMessage = JSON.parse(ws.sentMessages[ws.sentMessages.length - 1]);
      expect(lastMessage.type).toBe('ping');
    });

    it('should stop heartbeat on disconnect', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        heartbeatInterval: 1000,
        debug: false,
      });

      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      client.disconnect();
      await vi.advanceTimersByTimeAsync(20);

      const ws = (client as any).ws as MockWebSocket;
      const messageCount = ws.sentMessages.length;

      // Wait for what would be a heartbeat
      await vi.advanceTimersByTimeAsync(1000);

      // Should not have sent more messages
      expect(ws.sentMessages.length).toBe(messageCount);
    });
  });

  describe('Message Handling', () => {
    it('should send messages when connected', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        debug: false,
      });

      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      const message: WebSocketMessage = {
        type: 'test',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
      };

      client.send(message);

      const ws = (client as any).ws as MockWebSocket;
      const sentMessage = JSON.parse(ws.sentMessages[ws.sentMessages.length - 1]);

      expect(sentMessage.type).toBe('test');
      expect(sentMessage.payload.data).toBe('test');
    });

    it('should queue messages when not connected', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        debug: false,
      });

      const message: WebSocketMessage = {
        type: 'test',
        payload: { data: 'queued' },
        timestamp: new Date().toISOString(),
      };

      // Send before connecting
      client.send(message);

      // Queue should have message
      const queue = (client as any).messageQueue;
      expect(queue.length).toBe(1);

      // Connect and wait
      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      // Queue should be flushed
      expect((client as any).messageQueue.length).toBe(0);

      const ws = (client as any).ws as MockWebSocket;
      const sentMessage = JSON.parse(ws.sentMessages[ws.sentMessages.length - 1]);
      expect(sentMessage.type).toBe('test');
    });

    it('should receive and route messages', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        debug: false,
      });

      const handler = vi.fn();
      client.subscribe('test', handler);

      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage({
        type: 'test',
        payload: { data: 'received' },
        timestamp: new Date().toISOString(),
      });

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].payload.data).toBe('received');
    });

    it('should handle pong messages', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        debug: false,
      });

      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage({
        type: 'pong',
        payload: null,
        timestamp: new Date().toISOString(),
      });

      // Should not crash and should be handled gracefully
      expect(client.isOpen()).toBe(true);
    });
  });

  describe('Subscriptions', () => {
    it('should subscribe to message types', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        debug: false,
      });

      const handler = vi.fn();
      const unsubscribe = client.subscribe('vehicle:location', handler);

      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage({
        type: 'vehicle:location',
        payload: { vehicleId: '123', lat: 30.0, lng: -84.0 },
        timestamp: new Date().toISOString(),
      });

      expect(handler).toHaveBeenCalled();

      // Unsubscribe
      unsubscribe();

      // Send another message
      ws.simulateMessage({
        type: 'vehicle:location',
        payload: { vehicleId: '456', lat: 31.0, lng: -85.0 },
        timestamp: new Date().toISOString(),
      });

      // Handler should only be called once
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support wildcard subscriptions', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        debug: false,
      });

      const handler = vi.fn();
      client.subscribe('*', handler);

      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      const ws = (client as any).ws as MockWebSocket;

      // Send different message types
      ws.simulateMessage({ type: 'type1', payload: {}, timestamp: new Date().toISOString() });
      ws.simulateMessage({ type: 'type2', payload: {}, timestamp: new Date().toISOString() });

      // Should receive both
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should support multiple subscribers for same type', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        debug: false,
      });

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      client.subscribe('test', handler1);
      client.subscribe('test', handler2);

      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      const ws = (client as any).ws as MockWebSocket;
      ws.simulateMessage({
        type: 'test',
        payload: {},
        timestamp: new Date().toISOString(),
      });

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should prevent memory leaks when unsubscribing', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        debug: false,
      });

      const handler = vi.fn();
      const unsubscribe = client.subscribe('test', handler);

      unsubscribe();

      const handlers = (client as any).messageHandlers;
      const testHandlers = handlers.get('test');

      // Handler set should be empty or deleted
      expect(!testHandlers || testHandlers.size === 0).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON messages', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        debug: false,
      });

      const handler = vi.fn();
      client.subscribe('test', handler);

      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      const ws = (client as any).ws as MockWebSocket;

      // Simulate malformed message
      if (ws.onmessage) {
        ws.onmessage(new MessageEvent('message', { data: 'invalid json {' }));
      }

      // Should not crash and handler should not be called
      expect(handler).not.toHaveBeenCalled();
      expect(client.isOpen()).toBe(true);
    });

    it('should call error handlers', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        debug: false,
      });

      const errorHandler = vi.fn();
      client.onError(errorHandler);

      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      const ws = (client as any).ws as MockWebSocket;
      ws.simulateError();

      expect(errorHandler).toHaveBeenCalled();
    });
  });

  describe('Connection State', () => {
    it('should report correct connection state', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        debug: false,
      });

      expect(client.getConnectionState()).toBe('closed');

      client.connect();
      expect(client.getConnectionState()).toBe('connecting');

      await vi.advanceTimersByTimeAsync(20);
      expect(client.getConnectionState()).toBe('open');

      client.disconnect();
      expect(client.getConnectionState()).toBe('closing');

      await vi.advanceTimersByTimeAsync(20);
      expect(client.getConnectionState()).toBe('closed');
    });

    it('should report isOpen correctly', async () => {
      client = new WebSocketClient({
        url: 'ws://localhost:3001',
        debug: false,
      });

      expect(client.isOpen()).toBe(false);

      client.connect();
      await vi.advanceTimersByTimeAsync(20);

      expect(client.isOpen()).toBe(true);

      client.disconnect();
      await vi.advanceTimersByTimeAsync(20);

      expect(client.isOpen()).toBe(false);
    });
  });
});
