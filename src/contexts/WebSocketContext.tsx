/**
 * WebSocket Context Provider
 * Provides app-wide WebSocket connection management
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

import { WebSocketClient } from '@/lib/websocket-client';
import { ConnectionStatus, WebSocketStats, WSEventType } from '@/types/websocket';
import logger from '@/utils/logger';

/* ============================================================
   Context Type
   ============================================================ */

interface WebSocketContextValue {
  client: WebSocketClient | null;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  stats: WebSocketStats;
  reconnect: () => void;
  disconnect: () => void;
  send: (type: WSEventType | string, payload: any) => void;
  subscribe: (type: WSEventType | string, handler: (payload: any) => void) => () => void;
}

/* ============================================================
   Context
   ============================================================ */

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

/* ============================================================
   Provider Props
   ============================================================ */

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
  autoConnect?: boolean;
  debug?: boolean;
}

/* ============================================================
   Provider Component
   ============================================================ */

export function WebSocketProvider({
  children,
  url = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`,
  autoConnect = true,
  debug = import.meta.env.DEV,
}: WebSocketProviderProps) {
  const clientRef = useRef<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [stats, setStats] = useState<WebSocketStats>({
    messagesSent: 0,
    messagesReceived: 0,
    reconnects: 0,
    errors: 0,
    lastConnectedAt: null,
    lastDisconnectedAt: null,
    uptime: 0,
    latency: null,
  });

  // Initialize WebSocket client
  useEffect(() => {
    logger.info('[WebSocketContext] Initializing WebSocket client', { url, autoConnect, debug });

    clientRef.current = new WebSocketClient({
      url,
      debug,
      reconnect: true,
      reconnectInterval: parseInt(import.meta.env.VITE_WS_RECONNECT_INTERVAL || '1000'),
      maxReconnectAttempts: parseInt(import.meta.env.VITE_WS_MAX_RECONNECT_ATTEMPTS || '10'),
      heartbeatInterval: parseInt(import.meta.env.VITE_WS_HEARTBEAT_INTERVAL || '30000'),
      queueOfflineMessages: true,
      maxQueueSize: 100,
    });

    const client = clientRef.current;

    // Setup event listeners
    const unsubOpen = client.onOpen(() => {
      logger.info('[WebSocketContext] Connected');
      setIsConnected(true);
      setConnectionStatus('connected');
      setStats(prev => ({
        ...prev,
        lastConnectedAt: new Date(),
        reconnects: prev.lastConnectedAt ? prev.reconnects + 1 : prev.reconnects,
      }));
    });

    const unsubClose = client.onClose(() => {
      logger.info('[WebSocketContext] Disconnected');
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setStats(prev => ({
        ...prev,
        lastDisconnectedAt: new Date(),
      }));
    });

    const unsubError = client.onError((error) => {
      logger.error('[WebSocketContext] Error:', error);
      setConnectionStatus('error');
      setStats(prev => ({
        ...prev,
        errors: prev.errors + 1,
      }));
    });

    // Track message stats
    const unsubMessages = client.subscribe('*', () => {
      setStats(prev => ({
        ...prev,
        messagesReceived: prev.messagesReceived + 1,
      }));
    });

    // Auto-connect if enabled
    if (autoConnect) {
      client.connect();
    }

    // Cleanup on unmount
    return () => {
      logger.info('[WebSocketContext] Cleaning up');
      unsubOpen();
      unsubClose();
      unsubError();
      unsubMessages();
      client.disconnect();
    };
  }, [url, autoConnect, debug]);

  // Update uptime every second
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected && stats.lastConnectedAt) {
        const uptime = Math.floor((Date.now() - stats.lastConnectedAt.getTime()) / 1000);
        setStats(prev => ({ ...prev, uptime }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, stats.lastConnectedAt]);

  // Reconnect function
  const reconnect = useCallback(() => {
    logger.info('[WebSocketContext] Manual reconnect triggered');
    if (clientRef.current) {
      clientRef.current.disconnect();
      setTimeout(() => {
        clientRef.current?.connect();
      }, 100);
    }
  }, []);

  // Disconnect function
  const disconnect = useCallback(() => {
    logger.info('[WebSocketContext] Manual disconnect triggered');
    clientRef.current?.disconnect();
  }, []);

  // Send function
  const send = useCallback((type: WSEventType | string, payload: any) => {
    if (!clientRef.current) {
      logger.warn('[WebSocketContext] Cannot send message - client not initialized');
      return;
    }

    clientRef.current.send({
      type,
      payload,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    });

    setStats(prev => ({
      ...prev,
      messagesSent: prev.messagesSent + 1,
    }));
  }, []);

  // Subscribe function
  const subscribe = useCallback((type: WSEventType | string, handler: (payload: any) => void) => {
    if (!clientRef.current) {
      logger.warn('[WebSocketContext] Cannot subscribe - client not initialized');
      return () => { };
    }

    return clientRef.current.subscribe(type, (message) => {
      handler(message.payload);
    });
  }, []);

  const value: WebSocketContextValue = {
    client: clientRef.current,
    isConnected,
    connectionStatus,
    stats,
    reconnect,
    disconnect,
    send,
    subscribe,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

/* ============================================================
   Hook
   ============================================================ */

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error('useWebSocketContext must be used within WebSocketProvider');
  }

  return context;
}

/* ============================================================
   Export
   ============================================================ */

export default WebSocketContext;
