// ============================================================================
// Fleet PTT - React Hook
// ============================================================================
// React hook for managing PTT state and interactions

import { useState, useEffect, useCallback, useRef } from "react";
import { DispatchPTTClient } from "../Services/PTT/DispatchPTTClient";
import type {
  ChannelId,
  PTTState,
  FloorState,
  PresenceUser,
} from "../Services/PTT/dispatchTypes";

export interface UseDispatchPTTOptions {
  signalingUrl: string;
  token: string;
  platform: "web" | "native";
  defaultChannelId?: ChannelId;
  autoConnect?: boolean;
  debug?: boolean;
}

export interface UseDispatchPTTReturn {
  // Connection state
  connected: boolean;
  authenticated: boolean;

  // Channel state
  currentChannel: ChannelId | null;
  presenceUsers: PresenceUser[];

  // Floor state
  floorState: FloorState;
  hasFloor: boolean;
  isTransmitting: boolean;
  isReceiving: boolean;
  currentSpeaker: string | null;

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  joinChannel: (channelId: ChannelId) => Promise<void>;
  leaveChannel: () => Promise<void>;
  requestFloor: () => Promise<boolean>;
  startTransmit: () => Promise<void>;
  stopTransmit: () => void;
  releaseFloor: () => Promise<void>;

  // Error
  error: string | null;
}

export function useDispatchPTT(options: UseDispatchPTTOptions): UseDispatchPTTReturn {
  const clientRef = useRef<DispatchPTTClient | null>(null);

  // State
  const [connected, setConnected] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<ChannelId | null>(null);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [floorState, setFloorState] = useState<FloorState>("idle");
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isReceiving, setIsReceiving] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize client
  useEffect(() => {
    const client = new DispatchPTTClient({
      signalingUrl: options.signalingUrl,
      authToken: options.token,
      platform: options.platform,
      debug: options.debug || false,
    });

    // Event listeners
    client.on("connected", () => {
      setConnected(true);
      setError(null);
    });

    client.on("disconnected", () => {
      setConnected(false);
      setAuthenticated(false);
    });

    client.on("authenticated", () => {
      setAuthenticated(true);
    });

    client.on("channelJoined", (channelId: ChannelId) => {
      setCurrentChannel(channelId);
    });

    client.on("channelLeft", () => {
      setCurrentChannel(null);
      setPresenceUsers([]);
    });

    client.on("floorStateChanged", (state: FloorState) => {
      setFloorState(state);
      setIsTransmitting(state === "transmitting");
    });

    client.on("presenceUpdated", (users: PresenceUser[]) => {
      setPresenceUsers(users);
    });

    client.on("speakerChanged", (userId: string | null, on: boolean) => {
      setCurrentSpeaker(on ? userId : null);
    });

    client.on("remoteStreamStarted", () => {
      setIsReceiving(true);
    });

    client.on("error", (err: Error) => {
      setError(err.message);
      console.error("[useDispatchPTT] Error:", err);
    });

    clientRef.current = client;

    // Auto-connect if enabled
    if (options.autoConnect !== false) {
      client.connect().catch((err) => {
        setError(err.message);
      });
    }

    // Cleanup on unmount
    return () => {
      client.disconnect();
    };
  }, [options.signalingUrl, options.token, options.platform, options.debug, options.autoConnect]);

  // Auto-join default channel when authenticated
  useEffect(() => {
    if (authenticated && options.defaultChannelId && !currentChannel) {
      clientRef.current?.join(options.defaultChannelId).catch((err) => {
        setError(err.message);
      });
    }
  }, [authenticated, options.defaultChannelId, currentChannel]);

  // Actions
  const connect = useCallback(async () => {
    if (!clientRef.current) return;
    try {
      await clientRef.current.connect();
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (!clientRef.current) return;
    clientRef.current.disconnect();
  }, []);

  const joinChannel = useCallback(async (channelId: ChannelId) => {
    if (!clientRef.current) return;
    try {
      await clientRef.current.join(channelId);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const leaveChannel = useCallback(async () => {
    if (!clientRef.current) return;
    try {
      await clientRef.current.leave();
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const requestFloor = useCallback(async (): Promise<boolean> => {
    if (!clientRef.current) return false;
    try {
      const granted = await clientRef.current.requestFloor();
      setError(null);
      return granted;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, []);

  const startTransmit = useCallback(async () => {
    if (!clientRef.current) return;
    try {
      await clientRef.current.startTransmit();
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const stopTransmit = useCallback(() => {
    if (!clientRef.current) return;
    clientRef.current.stopTransmit();
  }, []);

  const releaseFloor = useCallback(async () => {
    if (!clientRef.current) return;
    try {
      await clientRef.current.releaseFloor();
      setError(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, []);

  const hasFloor = floorState === "granted" || floorState === "transmitting";

  return {
    // State
    connected,
    authenticated,
    currentChannel,
    presenceUsers,
    floorState,
    hasFloor,
    isTransmitting,
    isReceiving,
    currentSpeaker,

    // Actions
    connect,
    disconnect,
    joinChannel,
    leaveChannel,
    requestFloor,
    startTransmit,
    stopTransmit,
    releaseFloor,

    // Error
    error,
  };
}
