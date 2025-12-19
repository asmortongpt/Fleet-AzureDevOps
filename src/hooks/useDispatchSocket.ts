/**
 * Enhanced Dispatch Socket Hook
 * Manages WebSocket connection for real-time dispatch radio communications
 *
 * Features:
 * - Auto-reconnection with exponential backoff
 * - Channel subscription management
 * - Real-time transmission updates
 * - Emergency alert notifications
 * - Unit status tracking
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

import type {
  Transmission,
  RadioChannel,
  EmergencyAlert,
  DispatchUnit
} from '@/types/radio';
import logger from '@/utils/logger';

interface UseDispatchSocketOptions {
  channelId?: string;
  autoConnect?: boolean;
  onTransmission?: (transmission: Transmission) => void;
  onEmergencyAlert?: (alert: EmergencyAlert) => void;
  onUnitUpdate?: (unit: DispatchUnit) => void;
}

interface DispatchSocketState {
  isConnected: boolean;
  currentChannel: RadioChannel | null;
  activeTransmission: Transmission | null;
  recentTransmissions: Transmission[];
  activeUnits: DispatchUnit[];
  emergencyAlerts: EmergencyAlert[];
}

export function useDispatchSocket(options: UseDispatchSocketOptions = {}) {
  const {
    channelId,
    autoConnect = true,
    onTransmission,
    onEmergencyAlert,
    onUnitUpdate
  } = options;

  const [state, setState] = useState<DispatchSocketState>({
    isConnected: false,
    currentChannel: null,
    activeTransmission: null,
    recentTransmissions: [],
    activeUnits: [],
    emergencyAlerts: []
  });

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize Socket.IO connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const SOCKET_URL = import.meta.env.VITE_DISPATCH_SOCKET_URL || 'http://localhost:8000';

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000 * Math.pow(2, reconnectAttemptsRef.current),
      reconnectionAttempts: maxReconnectAttempts,
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socket.on('connect', () => {
      logger.debug('[DispatchSocket] Connected');
      reconnectAttemptsRef.current = 0;
      setState(prev => ({ ...prev, isConnected: true }));

      // Auto-subscribe to channel if provided
      if (channelId) {
        socket.emit('subscribe_channel', { channelId });
      }
    });

    socket.on('disconnect', (reason) => {
      logger.debug('[DispatchSocket] Disconnected:', reason);
      setState(prev => ({
        ...prev,
        isConnected: false,
        activeTransmission: null
      }));

      if (reason === 'io server disconnect') {
        // Server disconnected, attempt manual reconnect
        reconnectAttemptsRef.current++;
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          setTimeout(() => socket.connect(), 1000 * Math.pow(2, reconnectAttemptsRef.current));
        }
      }
    });

    socket.on('connect_error', (error) => {
      logger.error('[DispatchSocket] Connection error:', error);
      reconnectAttemptsRef.current++;
    });

    socket.on('channel_joined', (data: { channel: RadioChannel }) => {
      logger.debug('[DispatchSocket] Joined channel:', data.channel.name);
      setState(prev => ({ ...prev, currentChannel: data.channel }));
    });

    socket.on('transmission_started', (data: { transmission: Transmission }) => {
      logger.debug('[DispatchSocket] Transmission started:', data.transmission.id);
      setState(prev => ({
        ...prev,
        activeTransmission: data.transmission
      }));
    });

    socket.on('transmission_update', (data: { transmission: Transmission }) => {
      setState(prev => ({
        ...prev,
        activeTransmission: data.transmission
      }));
      onTransmission?.(data.transmission);
    });

    socket.on('transmission_ended', (data: { transmission: Transmission }) => {
      logger.debug('[DispatchSocket] Transmission ended:', data.transmission.id);
      setState(prev => ({
        ...prev,
        activeTransmission: null,
        recentTransmissions: [data.transmission, ...prev.recentTransmissions].slice(0, 50)
      }));
      onTransmission?.(data.transmission);
    });

    socket.on('emergency_alert', (data: { alert: EmergencyAlert }) => {
      logger.debug('[DispatchSocket] Emergency alert:', data.alert.type);
      setState(prev => ({
        ...prev,
        emergencyAlerts: [data.alert, ...prev.emergencyAlerts]
      }));
      onEmergencyAlert?.(data.alert);

      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Emergency Alert', {
          body: `${data.alert.type}: ${data.alert.description}`,
          tag: data.alert.id,
          requireInteraction: true,
          icon: '/emergency-icon.png'
        });
      }
    });

    socket.on('unit_status_update', (data: { unit: DispatchUnit }) => {
      setState(prev => ({
        ...prev,
        activeUnits: prev.activeUnits.map(u =>
          u.id === data.unit.id ? data.unit : u
        )
      }));
      onUnitUpdate?.(data.unit);
    });

    socket.on('error', (data: { message: string; code?: string }) => {
      logger.error('[DispatchSocket] Error:', data.message, data.code);
    });

    socketRef.current = socket;
  }, [channelId, onTransmission, onEmergencyAlert, onUnitUpdate]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, []);

  // Subscribe to channel
  const subscribeToChannel = useCallback((newChannelId: string) => {
    if (!socketRef.current?.connected) {
      logger.warn('[DispatchSocket] Cannot subscribe - not connected');
      return;
    }

    socketRef.current.emit('subscribe_channel', { channelId: newChannelId });
  }, []);

  // Unsubscribe from channel
  const unsubscribeFromChannel = useCallback(() => {
    if (!socketRef.current?.connected || !state.currentChannel) {
      return;
    }

    socketRef.current.emit('unsubscribe_channel', { channelId: state.currentChannel.id });
    setState(prev => ({ ...prev, currentChannel: null }));
  }, [state.currentChannel]);

  // Send audio chunk
  const sendAudioChunk = useCallback((audioData: string, transmissionId: string) => {
    if (!socketRef.current?.connected) {
      logger.warn('[DispatchSocket] Cannot send audio - not connected');
      return;
    }

    socketRef.current.emit('audio_chunk', {
      transmissionId,
      channelId: state.currentChannel?.id,
      audioData
    });
  }, [state.currentChannel]);

  // Start transmission
  const startTransmission = useCallback((isEmergency = false) => {
    if (!socketRef.current?.connected || !state.currentChannel) {
      logger.warn('[DispatchSocket] Cannot start transmission - not connected or no channel');
      return null;
    }

    const transmissionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    socketRef.current.emit('start_transmission', {
      transmissionId,
      channelId: state.currentChannel.id,
      isEmergency
    });

    return transmissionId;
  }, [state.currentChannel]);

  // End transmission
  const endTransmission = useCallback((transmissionId: string, audioBlob?: string) => {
    if (!socketRef.current?.connected) {
      return;
    }

    socketRef.current.emit('end_transmission', {
      transmissionId,
      channelId: state.currentChannel?.id,
      audioBlob
    });
  }, [state.currentChannel]);

  // Acknowledge emergency alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    if (!socketRef.current?.connected) {
      return;
    }

    socketRef.current.emit('acknowledge_alert', { alertId });
  }, []);

  // Resolve emergency alert
  const resolveAlert = useCallback((alertId: string, notes?: string) => {
    if (!socketRef.current?.connected) {
      return;
    }

    socketRef.current.emit('resolve_alert', { alertId, notes });
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    subscribeToChannel,
    unsubscribeFromChannel,
    sendAudioChunk,
    startTransmission,
    endTransmission,
    acknowledgeAlert,
    resolveAlert
  };
}
