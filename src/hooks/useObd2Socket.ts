/**
 * OBD2 Emulator Socket Hook
 * Connects to the backend OBD2 emulator via WebSocket for real-time telemetry.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import logger from '@/utils/logger';

export interface Obd2Data {
    timestamp: string;
    sessionId: string;
    vehicleId: number;
    adapterId: number;
    engineRpm: number;
    vehicleSpeed: number;
    throttlePosition: number;
    engineLoad: number;
    engineCoolantTemp: number;
    fuelLevel: number;
    batteryVoltage: number;
    estimatedMpg: number;
    distanceTraveled: number;
    location?: {
        latitude: number;
        longitude: number;
        heading: number;
        speed: number;
    };
    // Add other fields as needed from EmulatedOBD2Data
}

interface UseObd2SocketOptions {
    onData?: (data: Obd2Data) => void;
    onError?: (error: string) => void;
}

export function useObd2Socket(options: UseObd2SocketOptions = {}) {
    const { onData, onError } = options;
    const [isConnected, setIsConnected] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [currentData, setCurrentData] = useState<Obd2Data | null>(null);
    const socketRef = useRef<WebSocket | null>(null);

    // Determine WebSocket URL
    const getWsUrl = (sid: string) => {
        // In dev, usually ws://localhost:3001/ws/obd2/SID
        // In prod, wss://api.domain.com/ws/obd2/SID
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // If we are served from port 3000, API might be on 3001
        // But VITE_API_URL might be http://localhost:3001
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
        const host = apiUrl.replace(/^http(s)?:\/\//, '');
        return `${protocol}//${host}/ws/obd2/${sid}`;
    };

    const connect = useCallback((sid: string) => {
        if (socketRef.current) {
            socketRef.current.close();
        }

        const url = getWsUrl(sid);
        logger.debug('[OBD2] Connecting to', url);

        try {
            const ws = new WebSocket(url);

            ws.onopen = () => {
                logger.info('[OBD2] Connected');
                setIsConnected(true);
                setSessionId(sid);
            };

            ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    if (message.type === 'obd2_data') {
                        const data = message.data as Obd2Data;
                        setCurrentData(data);
                        onData?.(data);
                    } else if (message.type === 'connected') {
                        logger.debug('[OBD2] Handshake success');
                    } else if (message.type === 'error') {
                        logger.error('[OBD2] Error message:', message.message);
                        onError?.(message.message);
                    }
                } catch (err) {
                    logger.error('[OBD2] Failed to parse message', err);
                }
            };

            ws.onclose = () => {
                logger.info('[OBD2] Disconnected');
                setIsConnected(false);
                setSessionId(null);
            };

            ws.onerror = (err) => {
                logger.error('[OBD2] Socket error', err);
                setIsConnected(false);
                onError?.('Connection error');
            };

            socketRef.current = ws;
        } catch (err) {
            logger.error('[OBD2] Failed to create socket', err);
            onError?.('Failed to create socket');
        }
    }, [onData, onError]);

    const disconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.close();
            socketRef.current = null;
        }
        setIsConnected(false);
        setSessionId(null);
        setCurrentData(null);
    }, []);

    const startEmulation = useCallback(async (profile: string = 'sedan', scenario: string = 'city') => {
        try {
            // Call REST API to start session
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            const res = await fetch(`${apiUrl}/api/obd2-emulator/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Ensure we send auth if needed (though emulator might be public)
                },
                body: JSON.stringify({ profile, scenario })
            });

            const data = await res.json();
            if (data.success && data.sessionId) {
                connect(data.sessionId);
                return data.sessionId;
            } else {
                throw new Error(data.error || 'Failed to start session');
            }
        } catch (err: any) {
            logger.error('[OBD2] Failed to start emulation', err);
            onError?.(err.message);
            return null;
        }
    }, [connect, onError]);

    const stopEmulation = useCallback(async () => {
        if (!sessionId) return;

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
            await fetch(`${apiUrl}/api/obd2-emulator/stop/${sessionId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            disconnect();
        } catch (err) {
            logger.error('[OBD2] Failed to stop emulation', err);
        }
    }, [sessionId, disconnect]);

    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    return {
        isConnected,
        sessionId,
        data: currentData,
        startEmulation,
        stopEmulation,
        disconnect
    };
}
