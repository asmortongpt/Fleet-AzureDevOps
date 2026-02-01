/**
 * Specialized WebSocket Subscription Hooks
 * Provides easy-to-use hooks for subscribing to real-time events
 */

import { useEffect, useState, useCallback, useRef } from 'react';

import { useWebSocketContext } from '@/contexts/WebSocketContext';
import {
  WSEventType,
  VehicleLocation,
  VehicleStatus,
  VehicleTelemetry,
  MaintenanceAlert,
  FleetStatus,
  DriverStatus,
  GeofenceBreach,
  FuelAlert,
  Notification,
  validateMessage,
} from '@/types/websocket';
import logger from '@/utils/logger';

/* ============================================================
   Connection Status Hook
   ============================================================ */

export function useWebSocketStatus() {
  const { isConnected, connectionStatus, stats } = useWebSocketContext();

  return {
    isConnected,
    connectionStatus,
    stats,
  };
}

/* ============================================================
   Generic Subscription Hook
   ============================================================ */

export function useWebSocketSubscription<T = any>(
  eventType: WSEventType | string,
  callback: (data: T) => void,
  options: {
    enabled?: boolean;
    validate?: boolean;
    deps?: any[];
  } = {}
) {
  const { enabled = true, validate = false, deps = [] } = options;
  const { subscribe, isConnected } = useWebSocketContext();
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || !isConnected) {
      return;
    }

    const unsubscribe = subscribe(eventType, (payload: any) => {
      try {
        // Validate if requested
        let validatedPayload = payload;
        if (validate && Object.values(WSEventType).includes(eventType as WSEventType)) {
          validatedPayload = validateMessage<T>(eventType as WSEventType, payload);
        }

        callbackRef.current(validatedPayload);
      } catch (error) {
        logger.error(`[useWebSocketSubscription] Validation error for ${eventType}:`, error);
      }
    });

    return unsubscribe;
  }, [eventType, enabled, validate, isConnected, subscribe, ...deps]);
}

/* ============================================================
   Vehicle Location Hook
   ============================================================ */

export function useVehicleLocation(vehicleId: string | null, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [location, setLocation] = useState<VehicleLocation | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useWebSocketSubscription<VehicleLocation>(
    WSEventType.VEHICLE_LOCATION,
    useCallback((data: VehicleLocation) => {
      if (vehicleId && data.vehicleId === vehicleId) {
        setLocation(data);
        setLastUpdate(new Date());
      }
    }, [vehicleId]),
    { enabled: enabled && !!vehicleId, validate: true }
  );

  return {
    location,
    lastUpdate,
  };
}

/* ============================================================
   All Vehicle Locations Hook
   ============================================================ */

export function useAllVehicleLocations(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [locations, setLocations] = useState<Map<string, VehicleLocation>>(new Map());

  useWebSocketSubscription<VehicleLocation>(
    WSEventType.VEHICLE_LOCATION,
    useCallback((data: VehicleLocation) => {
      setLocations(prev => {
        const next = new Map(prev);
        next.set(data.vehicleId, data);
        return next;
      });
    }, []),
    { enabled, validate: true }
  );

  return {
    locations,
    getLocation: useCallback((vehicleId: string) => locations.get(vehicleId), [locations]),
  };
}

/* ============================================================
   Vehicle Status Hook
   ============================================================ */

export function useVehicleStatus(vehicleId: string | null, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [status, setStatus] = useState<VehicleStatus | null>(null);

  useWebSocketSubscription<VehicleStatus>(
    WSEventType.VEHICLE_STATUS,
    useCallback((data: VehicleStatus) => {
      if (vehicleId && data.vehicleId === vehicleId) {
        setStatus(data);
      }
    }, [vehicleId]),
    { enabled: enabled && !!vehicleId, validate: true }
  );

  return status;
}

/* ============================================================
   Vehicle Telemetry Hook
   ============================================================ */

export function useVehicleTelemetry(vehicleId: string | null, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [telemetry, setTelemetry] = useState<VehicleTelemetry | null>(null);
  const [history, setHistory] = useState<VehicleTelemetry[]>([]);

  useWebSocketSubscription<VehicleTelemetry>(
    WSEventType.VEHICLE_TELEMETRY,
    useCallback((data: VehicleTelemetry) => {
      if (vehicleId && data.vehicleId === vehicleId) {
        setTelemetry(data);
        setHistory(prev => [...prev.slice(-99), data]); // Keep last 100 readings
      }
    }, [vehicleId]),
    { enabled: enabled && !!vehicleId, validate: true }
  );

  return {
    telemetry,
    history,
  };
}

/* ============================================================
   Maintenance Alerts Hook
   ============================================================ */

export function useMaintenanceAlerts(options: {
  enabled?: boolean;
  vehicleId?: string | null;
  maxAlerts?: number;
} = {}) {
  const { enabled = true, vehicleId = null, maxAlerts = 100 } = options;
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);

  useWebSocketSubscription<MaintenanceAlert>(
    WSEventType.MAINTENANCE_ALERT,
    useCallback((data: MaintenanceAlert) => {
      // Filter by vehicle if specified
      if (vehicleId && data.vehicleId !== vehicleId) {
        return;
      }

      setAlerts(prev => {
        // Add new alert to the beginning
        const next = [data, ...prev];
        // Keep only maxAlerts
        return next.slice(0, maxAlerts);
      });
    }, [vehicleId, maxAlerts]),
    { enabled, validate: true }
  );

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const removeAlert = useCallback((timestamp: string) => {
    setAlerts(prev => prev.filter(alert => alert.timestamp !== timestamp));
  }, []);

  return {
    alerts,
    clearAlerts,
    removeAlert,
  };
}

/* ============================================================
   Fleet Status Hook
   ============================================================ */

export function useFleetStatus(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [status, setStatus] = useState<FleetStatus | null>(null);
  const [history, setHistory] = useState<FleetStatus[]>([]);

  useWebSocketSubscription<FleetStatus>(
    WSEventType.FLEET_STATUS,
    useCallback((data: FleetStatus) => {
      setStatus(data);
      setHistory(prev => [...prev.slice(-99), data]); // Keep last 100 updates
    }, []),
    { enabled, validate: true }
  );

  return {
    status,
    history,
  };
}

/* ============================================================
   Driver Status Hook
   ============================================================ */

export function useDriverStatus(driverId: string | null, options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;
  const [status, setStatus] = useState<DriverStatus | null>(null);

  useWebSocketSubscription<DriverStatus>(
    WSEventType.DRIVER_STATUS,
    useCallback((data: DriverStatus) => {
      if (driverId && data.driverId === driverId) {
        setStatus(data);
      }
    }, [driverId]),
    { enabled: enabled && !!driverId, validate: true }
  );

  return status;
}

/* ============================================================
   Geofence Breach Hook
   ============================================================ */

export function useGeofenceBreaches(options: {
  enabled?: boolean;
  geofenceId?: string | null;
  vehicleId?: string | null;
  maxBreaches?: number;
} = {}) {
  const { enabled = true, geofenceId = null, vehicleId = null, maxBreaches = 100 } = options;
  const [breaches, setBreaches] = useState<GeofenceBreach[]>([]);

  useWebSocketSubscription<GeofenceBreach>(
    WSEventType.GEOFENCE_BREACH,
    useCallback((data: GeofenceBreach) => {
      // Filter by geofence and/or vehicle if specified
      if (geofenceId && data.geofenceId !== geofenceId) {
        return;
      }
      if (vehicleId && data.vehicleId !== vehicleId) {
        return;
      }

      setBreaches(prev => {
        const next = [data, ...prev];
        return next.slice(0, maxBreaches);
      });
    }, [geofenceId, vehicleId, maxBreaches]),
    { enabled, validate: true }
  );

  const clearBreaches = useCallback(() => {
    setBreaches([]);
  }, []);

  return {
    breaches,
    clearBreaches,
  };
}

/* ============================================================
   Fuel Alerts Hook
   ============================================================ */

export function useFuelAlerts(options: {
  enabled?: boolean;
  vehicleId?: string | null;
  maxAlerts?: number;
} = {}) {
  const { enabled = true, vehicleId = null, maxAlerts = 100 } = options;
  const [alerts, setAlerts] = useState<FuelAlert[]>([]);

  useWebSocketSubscription<FuelAlert>(
    WSEventType.FUEL_ALERT,
    useCallback((data: FuelAlert) => {
      if (vehicleId && data.vehicleId !== vehicleId) {
        return;
      }

      setAlerts(prev => {
        const next = [data, ...prev];
        return next.slice(0, maxAlerts);
      });
    }, [vehicleId, maxAlerts]),
    { enabled, validate: true }
  );

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    alerts,
    clearAlerts,
  };
}

/* ============================================================
   Notifications Hook
   ============================================================ */

export function useNotifications(options: {
  enabled?: boolean;
  maxNotifications?: number;
} = {}) {
  const { enabled = true, maxNotifications = 50 } = options;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useWebSocketSubscription<Notification>(
    WSEventType.NOTIFICATION,
    useCallback((data: Notification) => {
      setNotifications(prev => {
        const next = [data, ...prev];
        return next.slice(0, maxNotifications);
      });
      setUnreadCount(prev => prev + 1);
    }, [maxNotifications]),
    { enabled, validate: true }
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif => (notif.id === id ? { ...notif, read: true } : notif))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}

/* ============================================================
   Send Message Hook
   ============================================================ */

export function useSendMessage() {
  const { send } = useWebSocketContext();

  return useCallback(
    (type: WSEventType | string, payload: any) => {
      send(type, payload);
    },
    [send]
  );
}

/* ============================================================
   Reconnect Hook
   ============================================================ */

export function useReconnect() {
  const { reconnect } = useWebSocketContext();
  return reconnect;
}
