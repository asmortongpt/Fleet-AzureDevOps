import { useEffect, useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import logger from '@/utils/logger';

/**
 * Real-time Operations WebSocket Hook
 *
 * Provides live updates for:
 * - Vehicle positions and heading
 * - Driver status changes
 * - Route progress updates
 * - Task/dispatch status changes
 * - Alert notifications
 *
 * Performance optimized with throttling and efficient state updates
 */

export interface VehiclePosition {
  vehicleId: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  timestamp: string;
  status: 'idle' | 'moving' | 'stopped';
}

export interface DriverStatus {
  driverId: string;
  status: 'available' | 'on-break' | 'driving' | 'offline';
  currentVehicleId?: string;
  currentTaskId?: string;
  lastUpdate: string;
}

export interface RouteProgress {
  routeId: string;
  vehicleId: string;
  driverId: string;
  progress: number;
  eta: string;
  delayMinutes: number;
  completedStops: number;
  totalStops: number;
}

export interface TaskUpdate {
  taskId: string;
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  assignedVehicleId?: string;
  assignedDriverId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: string;
}

export interface OperationsAlert {
  id: string;
  type: 'emergency' | 'warning' | 'info' | 'maintenance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  vehicleId?: string;
  driverId?: string;
  timestamp: string;
  acknowledged: boolean;
}

interface RealtimeOperationsState {
  vehiclePositions: Map<string, VehiclePosition>;
  driverStatuses: Map<string, DriverStatus>;
  routeProgress: Map<string, RouteProgress>;
  taskUpdates: Map<string, TaskUpdate>;
  alerts: OperationsAlert[];
  isConnected: boolean;
  lastUpdate: Date | null;
}

interface UseRealtimeOperationsOptions {
  autoConnect?: boolean;
  reconnectInterval?: number;
  updateThrottle?: number;
}

export function useRealtimeOperations(options: UseRealtimeOperationsOptions = {}) {
  const {
    autoConnect = true,
    reconnectInterval = 5000,
    updateThrottle = 100
  } = options;

  const [state, setState] = useState<RealtimeOperationsState>({
    vehiclePositions: new Map(),
    driverStatuses: new Map(),
    routeProgress: new Map(),
    taskUpdates: new Map(),
    alerts: [],
    isConnected: false,
    lastUpdate: null
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const updateThrottleRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const queryClient = useQueryClient();

  // Throttled update function to prevent UI jank
  const throttledUpdate = useCallback((key: string, updateFn: () => void) => {
    const existingTimeout = updateThrottleRef.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      updateFn();
      updateThrottleRef.current.delete(key);
    }, updateThrottle);

    updateThrottleRef.current.set(key, timeout);
  }, [updateThrottle]);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'vehicle_position':
          throttledUpdate(`vehicle_${message.data.vehicleId}`, () => {
            setState(prev => {
              const newPositions = new Map(prev.vehiclePositions);
              newPositions.set(message.data.vehicleId, message.data);
              return { ...prev, vehiclePositions: newPositions, lastUpdate: new Date() };
            });
          });
          break;

        case 'driver_status':
          setState(prev => {
            const newStatuses = new Map(prev.driverStatuses);
            newStatuses.set(message.data.driverId, message.data);
            return { ...prev, driverStatuses: newStatuses, lastUpdate: new Date() };
          });
          break;

        case 'route_progress':
          throttledUpdate(`route_${message.data.routeId}`, () => {
            setState(prev => {
              const newProgress = new Map(prev.routeProgress);
              newProgress.set(message.data.routeId, message.data);
              return { ...prev, routeProgress: newProgress, lastUpdate: new Date() };
            });
          });
          break;

        case 'task_update':
          setState(prev => {
            const newTasks = new Map(prev.taskUpdates);
            newTasks.set(message.data.taskId, message.data);
            // Invalidate work orders query when tasks update
            queryClient.invalidateQueries({ queryKey: ['workOrders'] });
            return { ...prev, taskUpdates: newTasks, lastUpdate: new Date() };
          });
          break;

        case 'alert':
          setState(prev => {
            const newAlerts = [message.data, ...prev.alerts].slice(0, 50); // Keep last 50 alerts
            return { ...prev, alerts: newAlerts, lastUpdate: new Date() };
          });
          // Play sound for critical alerts
          if (message.data.severity === 'critical') {
            playAlertSound();
          }
          break;

        case 'batch_update':
          // Handle batch updates for initial sync
          setState(prev => ({
            ...prev,
            vehiclePositions: new Map(message.data.vehicles?.map((v: VehiclePosition) => [v.vehicleId, v]) || []),
            driverStatuses: new Map(message.data.drivers?.map((d: DriverStatus) => [d.driverId, d]) || []),
            routeProgress: new Map(message.data.routes?.map((r: RouteProgress) => [r.routeId, r]) || []),
            lastUpdate: new Date()
          }));
          break;

        default:
          logger.debug('Unknown message type:', message.type);
      }
    } catch (error) {
      logger.error('Error parsing WebSocket message:', error instanceof Error ? error : new Error(String(error)));
    }
  }, [throttledUpdate, queryClient]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      logger.debug('WebSocket already connected');
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/operations`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        logger.info('Operations WebSocket connected');
        setState(prev => ({ ...prev, isConnected: true }));

        // Request initial data sync
        wsRef.current?.send(JSON.stringify({ type: 'sync_request' }));
      };

      wsRef.current.onmessage = handleMessage;

      wsRef.current.onerror = (error) => {
        logger.error('WebSocket error:', error instanceof Error ? error : new Error(String(error)));
      };

      wsRef.current.onclose = () => {
        logger.warn('Operations WebSocket disconnected');
        setState(prev => ({ ...prev, isConnected: false }));

        // Attempt reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          logger.debug('Attempting to reconnect...');
          connect();
        }, reconnectInterval);
      };
    } catch (error) {
      logger.error('Failed to create WebSocket connection:', error instanceof Error ? error : new Error(String(error)));
    }
  }, [handleMessage, reconnectInterval]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  // Acknowledge alert
  const acknowledgeAlert = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      alerts: prev.alerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    }));
  }, []);

  // Clear all alerts
  const clearAlerts = useCallback(() => {
    setState(prev => ({ ...prev, alerts: [] }));
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
      // Clear all throttle timeouts
      updateThrottleRef.current.forEach(timeout => clearTimeout(timeout));
      updateThrottleRef.current.clear();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    acknowledgeAlert,
    clearAlerts,
    // Helper methods for common queries
    getVehiclePosition: (vehicleId: string) => state.vehiclePositions.get(vehicleId),
    getDriverStatus: (driverId: string) => state.driverStatuses.get(driverId),
    getRouteProgress: (routeId: string) => state.routeProgress.get(routeId),
    getTaskUpdate: (taskId: string) => state.taskUpdates.get(taskId),
    getUnacknowledgedAlerts: () => state.alerts.filter(a => !a.acknowledged),
    getCriticalAlerts: () => state.alerts.filter(a => a.severity === 'critical' && !a.acknowledged)
  };
}

// Alert sound helper
function playAlertSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.3;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);
  } catch (error) {
    logger.debug('Audio playback not supported:', { error: error instanceof Error ? error.message : String(error) });
  }
}
