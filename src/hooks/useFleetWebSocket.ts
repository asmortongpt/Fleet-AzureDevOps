import { useState, useEffect, useRef, useCallback } from 'react';

import { FleetWebSocketService } from '@/services/realtime/FleetWebSocketService';

export function useFleetWebSocket() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const wsRef = useRef<FleetWebSocketService | null>(null);

  useEffect(() => {
    wsRef.current = new FleetWebSocketService();

    wsRef.current.on('connected', () => setConnected(true));
    wsRef.current.on('disconnected', () => setConnected(false));
    wsRef.current.on('message', (msg) => {
      setMessages(prev => [...prev.slice(-99), msg]);
    });

    return () => {
      wsRef.current?.disconnect();
    };
  }, []);

  const subscribeToVehicle = useCallback((vehicleId: string) => {
    wsRef.current?.subscribeToVehicle(vehicleId);
  }, []);

  const unsubscribeFromVehicle = useCallback((vehicleId: string) => {
    wsRef.current?.unsubscribeFromVehicle(vehicleId);
  }, []);

  return {
    connected,
    messages,
    subscribeToVehicle,
    unsubscribeFromVehicle,
    ws: wsRef.current,
  };
}
