/**
 * Hook for real-time radio dispatch Socket.IO connection
 */

import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Transmission {
  id: string;
  channel_id: string;
  started_at: string;
  transcript?: string;
  priority: string;
  intent?: string;
  entities?: Record<string, any>;
  processing_status: string;
}

interface PendingApproval {
  id: string;
  policy_id: string;
  transmission_id: string;
  conditions_matched: Record<string, any>;
  actions_executed: any[];
  execution_status: string;
  created_at: string;
}

export function useRadioSocket(channelId: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);

  // Initialize Socket.IO connection
  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_RADIO_SOCKET_URL || 'http://localhost:8000';

    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Handle connection events
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log('Radio socket connected');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Radio socket disconnected');
      setIsConnected(false);
    };

    const handleConnectionEstablished = (data: { sid: string }) => {
      console.log('Connection established', data);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connection_established', handleConnectionEstablished);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connection_established', handleConnectionEstablished);
    };
  }, [socket]);

  // Subscribe/unsubscribe to channel
  useEffect(() => {
    if (!socket || !isConnected || !channelId) return;

    console.log('Subscribing to channel', channelId);
    socket.emit('subscribe_channel', { channel_id: channelId });

    const handleSubscribed = (data: { channel_id: string }) => {
      console.log('Subscribed to channel', data);
    };

    socket.on('subscribed', handleSubscribed);

    return () => {
      socket.emit('unsubscribe_channel', { channel_id: channelId });
      socket.off('subscribed', handleSubscribed);
    };
  }, [socket, isConnected, channelId]);

  // Handle real-time transmission events
  useEffect(() => {
    if (!socket) return;

    const handleNewTransmission = (data: Transmission) => {
      console.log('New transmission', data);
      setTransmissions((prev) => [data, ...prev].slice(0, 100)); // Keep last 100
    };

    const handleTranscriptUpdate = (data: { transmission_id: string; transcript: string; confidence: number }) => {
      console.log('Transcript updated', data);
      setTransmissions((prev) =>
        prev.map((t) =>
          t.id === data.transmission_id
            ? { ...t, transcript: data.transcript, processing_status: 'complete' }
            : t
        )
      );
    };

    const handlePolicyTriggered = (data: PendingApproval) => {
      console.log('Policy triggered', data);
      if (data.execution_status === 'pending_approval') {
        setPendingApprovals((prev) => [data, ...prev]);
      }
    };

    socket.on('new_transmission', handleNewTransmission);
    socket.on('transcript_updated', handleTranscriptUpdate);
    socket.on('policy_triggered', handlePolicyTriggered);

    return () => {
      socket.off('new_transmission', handleNewTransmission);
      socket.off('transcript_updated', handleTranscriptUpdate);
      socket.off('policy_triggered', handlePolicyTriggered);
    };
  }, [socket]);

  // Approve pending policy execution
  const approveExecution = useCallback(
    async (executionId: string, notes?: string) => {
      try {
        const response = await fetch(`/api/v1/policies/executions/${executionId}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes }),
        });

        if (response.ok) {
          setPendingApprovals((prev) => prev.filter((p) => p.id !== executionId));
        }
      } catch (error) {
        console.error('Failed to approve execution', error);
      }
    },
    []
  );

  // Reject pending policy execution
  const rejectExecution = useCallback(
    async (executionId: string, reason?: string) => {
      try {
        const response = await fetch(`/api/v1/policies/executions/${executionId}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        });

        if (response.ok) {
          setPendingApprovals((prev) => prev.filter((p) => p.id !== executionId));
        }
      } catch (error) {
        console.error('Failed to reject execution', error);
      }
    },
    []
  );

  return {
    isConnected,
    transmissions,
    pendingApprovals,
    approveExecution,
    rejectExecution,
  };
}
