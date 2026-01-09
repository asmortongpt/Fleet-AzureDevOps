// Real-Time WebSocket Service - Production Grade
// Features: Auto-reconnect, message queuing, heartbeat, subscription management
// Based on: FLEET_CRITICAL_GAP_ANALYSIS.md Implementation 1

import { EventEmitter } from 'events';

interface QueuedMessage {
  message: any;
  timestamp: number;
  attempts: number;
}

// WebSocketMessage interface (keeping for future use)
interface _WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  id: string;
}

export class FleetWebSocketService extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageQueue: QueuedMessage[] = [];
  private subscriptions = new Map<string, Set<string>>();

  private config = {
    url: import.meta.env.VITE_WS_URL || 'wss://fleet.capitaltechalliance.com/ws',
    reconnectDelay: 1000,
    maxReconnectDelay: 30000,
    heartbeatInterval: 30000,
    maxQueueSize: 1000,
  };

  constructor() {
    super();
    this.connect();
  }

  private connect(): void {
    try {
      console.log('[WebSocket] Connecting to', this.config.url);
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected');
        this.emit('connected');
        this.flushMessageQueue();
        this.startHeartbeat();
        this.resubscribe();
        // Reset reconnect delay on successful connection
        this.config.reconnectDelay = 1000;
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        this.handleDisconnect();
      };
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      this.handleDisconnect();
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // Handle pong (heartbeat response)
      if (message.type === 'pong') {
        return;
      }

      // Validate and emit
      this.emit(message.type, message.payload);
      this.emit('message', message);

      // Update metrics
      if (typeof window !== 'undefined' && (window as any).fleetMetrics) {
        (window as any).fleetMetrics.track('websocket.message', {
          type: message.type,
          size: data.length,
        });
      }
    } catch (error) {
      console.error('[WebSocket] Failed to handle message:', error);
    }
  }

  public subscribeToVehicle(vehicleId: string): void {
    this.subscribe('vehicle', vehicleId);
    this.send({
      type: 'subscription:add',
      payload: { entity: 'vehicle', id: vehicleId }
    });
  }

  public unsubscribeFromVehicle(vehicleId: string): void {
    this.unsubscribe('vehicle', vehicleId);
    this.send({
      type: 'subscription:remove',
      payload: { entity: 'vehicle', id: vehicleId }
    });
  }

  private subscribe(entity: string, id: string): void {
    if (!this.subscriptions.has(entity)) {
      this.subscriptions.set(entity, new Set());
    }
    const subscriptionSet = this.subscriptions.get(entity);
    if (subscriptionSet) {
      subscriptionSet.add(id);
    }
  }

  private unsubscribe(entity: string, id: string): void {
    this.subscriptions.get(entity)?.delete(id);
  }

  private resubscribe(): void {
    console.log('[WebSocket] Resubscribing to', this.subscriptions.size, 'entities');
    for (const [entity, ids] of this.subscriptions) {
      for (const id of ids) {
        this.send({
          type: 'subscription:add',
          payload: { entity, id }
        });
      }
    }
  }

  private send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.queueMessage(message);
    }
  }

  private queueMessage(message: any): void {
    if (this.messageQueue.length >= this.config.maxQueueSize) {
      this.messageQueue.shift(); // Remove oldest
    }
    this.messageQueue.push({
      message,
      timestamp: Date.now(),
      attempts: 0,
    });
  }

  private flushMessageQueue(): void {
    console.log('[WebSocket] Flushing', this.messageQueue.length, 'queued messages');
    while (this.messageQueue.length > 0) {
      const queued = this.messageQueue.shift();
      if (queued) {
        this.send(queued.message);
      }
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping', timestamp: Date.now() });
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private handleDisconnect(): void {
    console.log('[WebSocket] Disconnected');
    this.emit('disconnected');
    this.stopHeartbeat();
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    console.log('[WebSocket] Reconnecting in', this.config.reconnectDelay, 'ms');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.config.reconnectDelay);

    // Exponential backoff
    this.config.reconnectDelay = Math.min(
      this.config.reconnectDelay * 2,
      this.config.maxReconnectDelay
    );
  }

  public disconnect(): void {
    console.log('[WebSocket] Manually disconnecting');
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Export singleton instance
export const fleetWebSocket = new FleetWebSocketService();
