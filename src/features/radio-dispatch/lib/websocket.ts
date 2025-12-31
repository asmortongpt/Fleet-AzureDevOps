'use client';

import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001';

export type WebSocketEvent =
  | 'transmission_received'
  | 'incident_created'
  | 'incident_updated'
  | 'task_created'
  | 'task_updated'
  | 'asset_location_updated'
  | 'crew_status_changed';

interface WebSocketConfig {
  organizationId: string;
  channels?: string[];
  accessToken?: string;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(config: WebSocketConfig): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(WS_URL, {
      auth: {
        token: config.accessToken,
        organization_id: config.organizationId,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventHandlers();

    // Join organization room and channels
    this.socket.emit('join_organization', config.organizationId);
    if (config.channels && Array.isArray(config.channels)) {
      config.channels.forEach((channel) => {
        this.socket?.emit('join_channel', channel);
      });
    }

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  on(event: WebSocketEvent, handler: (data: any) => void): void {
    if (!this.socket) {
      console.warn('WebSocket not connected. Call connect() first.');
      return;
    }
    this.socket.on(event, handler);
  }

  off(event: WebSocketEvent, handler?: (data: any) => void): void {
    if (!this.socket) return;
    if (handler) {
      this.socket.off(event, handler);
    } else {
      this.socket.off(event);
    }
  }

  emit(event: string, data?: any): void {
    if (!this.socket) {
      console.warn('WebSocket not connected. Call connect() first.');
      return;
    }
    this.socket.emit(event, data);
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();

// React hook for WebSocket
import { useEffect, useRef } from 'react';

interface UseWebSocketOptions extends WebSocketConfig {
  enabled?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const { enabled = true, ...config } = options;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled) return;

    socketRef.current = wsClient.connect(config);

    return () => {
      wsClient.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, config.organizationId, config.accessToken]);

  const subscribe = (event: WebSocketEvent, handler: (data: any) => void) => {
    wsClient.on(event, handler);
    return () => wsClient.off(event, handler);
  };

  const emit = (event: string, data?: any) => {
    wsClient.emit(event, data);
  };

  return {
    subscribe,
    emit,
    isConnected: wsClient.isConnected(),
    socket: socketRef.current,
  };
}
