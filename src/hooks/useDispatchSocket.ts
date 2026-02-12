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

import type {
  EmergencyAlert,
  DispatchUnit
} from '@/types/radio';
import { useAuth } from '@/hooks/useAuth';
import logger from '@/utils/logger';

interface UseDispatchSocketOptions {
  channelId?: string;
  autoConnect?: boolean;
  onEmergencyAlert?: (alert: EmergencyAlert) => void;
  onUnitUpdate?: (unit: DispatchUnit) => void;
}

type DispatchChannel = {
  id: string
  name: string
  description?: string | null
  channel_type?: string
  is_active?: boolean
  priority_level?: number
  color_code?: string | null
}

type DispatchTransmission = {
  id: string
  channelId: string
  userId: string
  username: string
  isEmergency: boolean
  startedAt: string
  durationSeconds?: number
}

interface DispatchSocketState {
  isConnected: boolean;
  currentChannel: DispatchChannel | null;
  activeTransmission: DispatchTransmission | null;
  recentTransmissions: DispatchTransmission[];
  activeUnits: DispatchUnit[];
  emergencyAlerts: EmergencyAlert[];
}

export function useDispatchSocket(options: UseDispatchSocketOptions = {}) {
  const {
    channelId,
    autoConnect = true,
    onEmergencyAlert,
    onUnitUpdate
  } = options;

  const { user } = useAuth()
  const channelIdRef = useRef<string | undefined>(channelId)
  const userRef = useRef<{ id?: string; email?: string }>({ id: user?.id, email: user?.email })
  const onEmergencyAlertRef = useRef<typeof onEmergencyAlert>(onEmergencyAlert)
  const onUnitUpdateRef = useRef<typeof onUnitUpdate>(onUnitUpdate)

  useEffect(() => {
    channelIdRef.current = channelId
  }, [channelId])

  useEffect(() => {
    userRef.current = { id: user?.id, email: user?.email }
  }, [user?.email, user?.id])

  useEffect(() => {
    onEmergencyAlertRef.current = onEmergencyAlert
  }, [onEmergencyAlert])

  useEffect(() => {
    onUnitUpdateRef.current = onUnitUpdate
  }, [onUnitUpdate])

  const [state, setState] = useState<DispatchSocketState>({
    isConnected: false,
    currentChannel: null,
    activeTransmission: null,
    recentTransmissions: [],
    activeUnits: [],
    emergencyAlerts: []
  });

  const wsRef = useRef<WebSocket | null>(null);
  const manualCloseRef = useRef(false)
  const heartbeatIntervalRef = useRef<number | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 8;

  function buildWsUrl(): string {
    const configured = (import.meta.env.VITE_DISPATCH_WS_URL || import.meta.env.VITE_API_URL || '').toString()
    const origin =
      configured.startsWith('http')
        ? configured.replace(/\/api\/?$/, '').replace(/\/$/, '')
        : window.location.origin
    const wsOrigin = origin.replace(/^http/, 'ws')
    return `${wsOrigin}/api/dispatch/ws`
  }

  function safeSend(payload: any) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify(payload))
  }

  function clearHeartbeat() {
    if (heartbeatIntervalRef.current != null) {
      window.clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }

  function clearReconnectTimer() {
    if (reconnectTimerRef.current != null) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
  }

  function scheduleReconnect() {
    clearReconnectTimer()
    reconnectAttemptsRef.current += 1
    if (reconnectAttemptsRef.current > maxReconnectAttempts) return
    const delayMs = Math.min(30_000, 500 * Math.pow(2, reconnectAttemptsRef.current))
    reconnectTimerRef.current = window.setTimeout(() => {
      connect()
    }, delayMs)
  }

  // Initialize WebSocket connection (matches backend `/api/dispatch/ws` protocol in `api/src/services/dispatch.service.ts`)
  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    clearReconnectTimer()
    manualCloseRef.current = false
    const url = buildWsUrl()
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      logger.debug('[DispatchWS] Connected')
      reconnectAttemptsRef.current = 0
      setState((prev) => ({ ...prev, isConnected: true }))

      // Keep DB listener record fresh (server expects heartbeats).
      clearHeartbeat()
      heartbeatIntervalRef.current = window.setInterval(() => {
        safeSend({ type: 'heartbeat', timestamp: new Date().toISOString() })
      }, 15_000)

      const initialChannelId = channelIdRef.current
      const u = userRef.current
      if (initialChannelId) {
        safeSend({
          type: 'join_channel',
          channelId: initialChannelId,
          userId: u.id,
          username: u.email,
          deviceInfo: { type: 'web' },
        })
      }
    }

    ws.onclose = () => {
      clearHeartbeat()
      setState((prev) => ({ ...prev, isConnected: false, activeTransmission: null }))
      if (!manualCloseRef.current) scheduleReconnect()
    }

    ws.onerror = (event) => {
      logger.warn('[DispatchWS] Error', { event })
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(String(event.data ?? ''))
        const type = msg?.type
        if (!type) return

        if (type === 'channel_joined') {
          setState((prev) => ({ ...prev, currentChannel: msg.channel ?? null }))
          return
        }

        if (type === 'transmission_started') {
          const tx: DispatchTransmission = {
            id: String(msg.transmissionId ?? msg.transmission_id ?? ''),
            channelId: String(msg.channelId ?? msg.channel_id ?? channelId ?? ''),
            userId: String(msg.userId ?? msg.user_id ?? ''),
            username: String(msg.username ?? ''),
            isEmergency: Boolean(msg.isEmergency ?? msg.is_emergency ?? false),
            startedAt: String(msg.timestamp ?? new Date().toISOString()),
          }
          setState((prev) => ({ ...prev, activeTransmission: tx }))
          return
        }

        if (type === 'transmission_ended') {
          const tx: DispatchTransmission = {
            id: String(msg.transmissionId ?? msg.transmission_id ?? ''),
            channelId: String(msg.channelId ?? msg.channel_id ?? channelId ?? ''),
            userId: String(msg.userId ?? msg.user_id ?? ''),
            username: String(msg.username ?? ''),
            isEmergency: Boolean(msg.isEmergency ?? msg.is_emergency ?? false),
            startedAt: String(msg.timestamp ?? new Date().toISOString()),
            durationSeconds: Number(msg.duration ?? msg.durationSeconds ?? msg.duration_seconds ?? 0) || 0,
          }
          setState((prev) => ({
            ...prev,
            activeTransmission: null,
            recentTransmissions: [tx, ...prev.recentTransmissions].slice(0, 50),
          }))
          return
        }

        if (type === 'emergency_alert') {
          const alert = msg.alert ?? msg
          setState((prev) => ({ ...prev, emergencyAlerts: [alert, ...prev.emergencyAlerts] }))
          onEmergencyAlertRef.current?.(alert)
          return
        }

        if (type === 'unit_status_update' && msg.unit) {
          setState((prev) => ({
            ...prev,
            activeUnits: prev.activeUnits.map((u) => (u.id === msg.unit.id ? msg.unit : u)),
          }))
          onUnitUpdateRef.current?.(msg.unit)
          return
        }

        if (type === 'error') {
          logger.error('[DispatchWS] Server error', msg)
        }
      } catch (err) {
        logger.warn('[DispatchWS] Failed to parse message', { err })
      }
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    clearReconnectTimer()
    clearHeartbeat()
    if (wsRef.current) {
      try {
        manualCloseRef.current = true
        wsRef.current.close()
      } catch {
        // ignore
      }
      wsRef.current = null
    }
    setState((prev) => ({ ...prev, isConnected: false, currentChannel: null, activeTransmission: null }))
  }, []);

  // Subscribe to channel
  const subscribeToChannel = useCallback((newChannelId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      logger.warn('[DispatchSocket] Cannot subscribe - not connected');
      return;
    }

    // Leave previous channel if any, then join new.
    if (state.currentChannel?.id && state.currentChannel.id !== newChannelId) {
      safeSend({ type: 'leave_channel', channelId: state.currentChannel.id })
    }

    safeSend({
      type: 'join_channel',
      channelId: newChannelId,
      userId: userRef.current.id,
      username: userRef.current.email,
      deviceInfo: { type: 'web' },
    })
  }, [state.currentChannel?.id]);

  // Unsubscribe from channel
  const unsubscribeFromChannel = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !state.currentChannel) {
      return;
    }

    safeSend({ type: 'leave_channel', channelId: state.currentChannel.id });
    setState(prev => ({ ...prev, currentChannel: null }));
  }, [state.currentChannel]);

  // Send audio chunk
  const sendAudioChunk = useCallback((audioData: string, transmissionId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      logger.warn('[DispatchSocket] Cannot send audio - not connected');
      return;
    }

    safeSend({
      type: 'audio_chunk',
      transmissionId,
      channelId: state.currentChannel?.id,
      audioData
    });
  }, [state.currentChannel]);

  // Start transmission
  const startTransmission = useCallback((isEmergency = false) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !state.currentChannel) {
      logger.warn('[DispatchSocket] Cannot start transmission - not connected or no channel');
      return null;
    }

    safeSend({
      type: 'start_transmission',
      channelId: state.currentChannel.id,
      userId: userRef.current.id,
      username: userRef.current.email,
      isEmergency,
    });

    // Server will ack with a transmission ID; return a temporary client ID until then.
    return `pending_${Date.now()}`;
  }, [state.currentChannel]);

  // End transmission
  const endTransmission = useCallback((transmissionId: string, audioBlob?: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    safeSend({
      type: 'end_transmission',
      transmissionId,
      channelId: state.currentChannel?.id,
      audioBlob
    });
  }, [state.currentChannel]);

  // Acknowledge emergency alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    void alertId
  }, []);

  // Resolve emergency alert
  const resolveAlert = useCallback((alertId: string, notes?: string) => {
    void alertId
    void notes
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
