// ============================================================================
// Fleet PTT - Main Client
// ============================================================================
// Full WebRTC + WebSocket PTT client for radio-fleet-dispatch integration
//
// ARCHITECTURE:
// - WebSocket signaling for floor control
// - WebRTC peer connections for audio streaming
// - Event-driven state machine
// - Automatic reconnection with exponential backoff
// - Cross-platform (web + React Native)

import { EventEmitter } from "events";
import type {
  UserId,
  ChannelId,
  DispatchClientEvent,
  DispatchServerEvent,
  PTTState,
  FloorState,
  PresenceUser,
  WebRTCConfig,
  AudioConfig,
  DEFAULT_AUDIO_CONFIG,
  PTTError,
  FloorDeniedError,
  ConnectionError,
  AuthenticationError,
} from "./dispatchTypes";

// Platform-specific WebRTC adapter (web or React Native)
import type { WebRTCAdapter } from "./webrtcAdapter";

// ============================================================================
// Client Configuration
// ============================================================================

export interface DispatchPTTConfig {
  signalingUrl: string;
  authToken: string;
  platform: "web" | "native";
  webrtcConfig?: Partial<WebRTCConfig>;
  audioConfig?: Partial<AudioConfig>;
  reconnect?: boolean;
  reconnectMaxRetries?: number;
  reconnectDelay?: number;
  floorTimeout?: number; // Max time to hold floor (ms)
  debug?: boolean;
}

const DEFAULT_CONFIG: Partial<DispatchPTTConfig> = {
  reconnect: true,
  reconnectMaxRetries: 5,
  reconnectDelay: 2000,
  floorTimeout: 30000, // 30 seconds max per transmission
  debug: false,
};

// ============================================================================
// DispatchPTTClient
// ============================================================================

export class DispatchPTTClient extends EventEmitter {
  private config: Required<DispatchPTTConfig>;
  private ws: WebSocket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private webrtcAdapter: WebRTCAdapter | null = null;

  private state: PTTState = {
    connected: false,
    authenticated: false,
    currentChannel: null,
    floorState: "idle",
    floorHolder: null,
    currentSpeaker: null,
    presenceUsers: [],
    isTransmitting: false,
    isReceiving: false,
  };

  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private floorTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(config: DispatchPTTConfig) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config } as Required<DispatchPTTConfig>;
    this.log("PTT Client initialized", { platform: this.config.platform });
  }

  // ==========================================================================
  // Connection Management
  // ==========================================================================

  /**
   * Connect to radio-fleet-dispatch signaling server
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.log("Already connected");
      return;
    }

    this.log("Connecting to signaling server", { url: this.config.signalingUrl });

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.signalingUrl);

        this.ws.onopen = () => {
          this.log("WebSocket connected");
          this.state.connected = true;
          this.emit("connected");

          // Send auth immediately
          this.sendAuth();

          // Start heartbeat
          this.startHeartbeat();

          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleServerMessage(event.data);
        };

        this.ws.onerror = (error) => {
          this.log("WebSocket error", error);
          this.emit("error", new ConnectionError("WebSocket connection failed"));
          reject(new ConnectionError("WebSocket connection failed"));
        };

        this.ws.onclose = () => {
          this.log("WebSocket closed");
          this.handleDisconnect();
        };
      } catch (error) {
        reject(new ConnectionError(`Failed to create WebSocket: ${error}`));
      }
    });
  }

  /**
   * Disconnect from signaling server
   */
  disconnect(): void {
    this.log("Disconnecting");

    // Stop timers
    this.stopHeartbeat();
    this.clearFloorTimer();
    this.clearReconnectTimer();

    // Leave current channel
    if (this.state.currentChannel) {
      this.leave();
    }

    // Close WebRTC
    this.closeWebRTC();

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Reset state
    this.state.connected = false;
    this.state.authenticated = false;
    this.emit("disconnected");
  }

  /**
   * Handle unexpected disconnection
   */
  private handleDisconnect(): void {
    this.state.connected = false;
    this.state.authenticated = false;
    this.stopHeartbeat();
    this.emit("disconnected");

    // Auto-reconnect if enabled
    if (this.config.reconnect && this.reconnectAttempts < this.config.reconnectMaxRetries) {
      this.reconnectAttempts++;
      const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

      this.reconnectTimer = setTimeout(() => {
        this.connect().catch((error) => {
          this.emit("error", error);
        });
      }, delay);
    } else {
      this.emit("error", new ConnectionError("Max reconnection attempts reached"));
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // ==========================================================================
  // Authentication
  // ==========================================================================

  private sendAuth(): void {
    this.send({ type: "auth", token: this.config.authToken });
  }

  // ==========================================================================
  // Channel Management
  // ==========================================================================

  /**
   * Join a dispatch channel
   */
  async join(channelId: ChannelId): Promise<void> {
    if (!this.state.connected || !this.state.authenticated) {
      throw new PTTError("Not connected or authenticated", "NOT_READY");
    }

    if (this.state.currentChannel === channelId) {
      this.log("Already in channel", { channelId });
      return;
    }

    // Leave current channel first
    if (this.state.currentChannel) {
      await this.leave();
    }

    this.log("Joining channel", { channelId });
    this.send({ type: "joinChannel", channelId });
    this.state.currentChannel = channelId;
    this.emit("channelJoined", channelId);

    // Initialize WebRTC for this channel
    await this.initWebRTC();
  }

  /**
   * Leave current channel
   */
  async leave(): Promise<void> {
    if (!this.state.currentChannel) {
      return;
    }

    const channelId = this.state.currentChannel;
    this.log("Leaving channel", { channelId });

    // Release floor if held
    if (this.state.floorState === "granted" || this.state.floorState === "transmitting") {
      await this.releaseFloor();
    }

    this.send({ type: "leaveChannel", channelId });
    this.state.currentChannel = null;
    this.state.presenceUsers = [];
    this.emit("channelLeft", channelId);

    // Close WebRTC
    this.closeWebRTC();
  }

  // ==========================================================================
  // Floor Control (The Heart of PTT)
  // ==========================================================================

  /**
   * Request floor (exclusive talk permission)
   */
  async requestFloor(): Promise<boolean> {
    if (!this.state.currentChannel) {
      throw new PTTError("Not in a channel", "NO_CHANNEL");
    }

    if (this.state.floorState === "granted" || this.state.floorState === "transmitting") {
      this.log("Floor already granted");
      return true;
    }

    if (this.state.floorState === "requesting") {
      this.log("Floor request already pending");
      return false;
    }

    this.log("Requesting floor", { channelId: this.state.currentChannel });
    this.state.floorState = "requesting";
    this.emit("floorStateChanged", "requesting");

    this.send({
      type: "requestFloor",
      channelId: this.state.currentChannel,
    });

    // Wait for floor grant or denial
    return new Promise((resolve) => {
      const onGranted = () => {
        cleanup();
        resolve(true);
      };

      const onDenied = () => {
        cleanup();
        resolve(false);
      };

      const timeout = setTimeout(() => {
        cleanup();
        this.log("Floor request timeout");
        this.state.floorState = "idle";
        this.emit("floorStateChanged", "idle");
        resolve(false);
      }, 5000);

      const cleanup = () => {
        this.off("floorGranted", onGranted);
        this.off("floorDenied", onDenied);
        clearTimeout(timeout);
      };

      this.once("floorGranted", onGranted);
      this.once("floorDenied", onDenied);
    });
  }

  /**
   * Start transmitting audio (must have floor)
   */
  async startTransmit(): Promise<void> {
    if (this.state.floorState !== "granted") {
      throw new PTTError("Floor not granted", "NO_FLOOR");
    }

    if (this.state.isTransmitting) {
      this.log("Already transmitting");
      return;
    }

    this.log("Starting transmission");
    this.state.floorState = "transmitting";
    this.state.isTransmitting = true;
    this.emit("floorStateChanged", "transmitting");

    // Notify server we're speaking
    if (this.state.currentChannel) {
      this.send({
        type: "speaking",
        channelId: this.state.currentChannel,
        on: true,
      });
    }

    // Start capturing and sending audio via WebRTC
    if (this.webrtcAdapter) {
      await this.webrtcAdapter.startCapture();
    }

    // Set floor timeout
    this.floorTimer = setTimeout(() => {
      this.log("Floor timeout - releasing automatically");
      this.stopTransmit();
      this.releaseFloor();
    }, this.config.floorTimeout);
  }

  /**
   * Stop transmitting audio (keep floor)
   */
  stopTransmit(): void {
    if (!this.state.isTransmitting) {
      return;
    }

    this.log("Stopping transmission");
    this.state.isTransmitting = false;
    this.state.floorState = "granted";
    this.emit("floorStateChanged", "granted");

    // Notify server we stopped speaking
    if (this.state.currentChannel) {
      this.send({
        type: "speaking",
        channelId: this.state.currentChannel,
        on: false,
      });
    }

    // Stop capturing audio
    if (this.webrtcAdapter) {
      this.webrtcAdapter.stopCapture();
    }

    this.clearFloorTimer();
  }

  /**
   * Release floor (give up talk permission)
   */
  async releaseFloor(): Promise<void> {
    if (this.state.floorState === "idle") {
      return;
    }

    this.log("Releasing floor");

    // Stop transmission first
    if (this.state.isTransmitting) {
      this.stopTransmit();
    }

    if (this.state.currentChannel) {
      this.send({
        type: "releaseFloor",
        channelId: this.state.currentChannel,
      });
    }

    this.state.floorState = "idle";
    this.state.floorHolder = null;
    this.emit("floorStateChanged", "idle");
    this.emit("floorReleased");
  }

  private clearFloorTimer(): void {
    if (this.floorTimer) {
      clearTimeout(this.floorTimer);
      this.floorTimer = null;
    }
  }

  // ==========================================================================
  // WebRTC Audio Streaming
  // ==========================================================================

  private async initWebRTC(): Promise<void> {
    this.log("Initializing WebRTC");

    // Create peer connection
    const rtcConfig: RTCConfiguration = {
      iceServers: this.config.webrtcConfig?.iceServers || [
        { urls: "stun:stun.l.google.com:19302" },
      ],
    };

    this.peerConnection = new RTCPeerConnection(rtcConfig);

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.log("ICE candidate", event.candidate);
        // Send ICE candidate to signaling server if needed
      }
    };

    // Handle incoming remote streams
    this.peerConnection.ontrack = (event) => {
      this.log("Received remote track", event.track.kind);
      if (event.streams && event.streams[0]) {
        this.handleRemoteStream(event.streams[0]);
      }
    };

    // Initialize platform-specific WebRTC adapter
    const audioConfig = { ...DEFAULT_AUDIO_CONFIG, ...this.config.audioConfig };

    if (this.config.platform === "web") {
      const { WebRTCAdapterWeb } = await import("./webrtcAdapter.web");
      this.webrtcAdapter = new WebRTCAdapterWeb(this.peerConnection, audioConfig);
    } else {
      const { WebRTCAdapterNative } = await import("./webrtcAdapter.native");
      this.webrtcAdapter = new WebRTCAdapterNative(this.peerConnection, audioConfig);
    }
  }

  private handleRemoteStream(stream: MediaStream): void {
    this.log("Playing remote stream");
    this.state.isReceiving = true;
    this.emit("remoteStreamStarted", stream);

    if (this.webrtcAdapter) {
      this.webrtcAdapter.playRemoteStream(stream);
    }
  }

  private closeWebRTC(): void {
    if (this.webrtcAdapter) {
      this.webrtcAdapter.cleanup();
      this.webrtcAdapter = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.state.isReceiving = false;
  }

  // ==========================================================================
  // Signaling Protocol (WebSocket Message Handling)
  // ==========================================================================

  private send(event: DispatchClientEvent): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.log("Cannot send - WebSocket not open", event);
      return;
    }

    this.ws.send(JSON.stringify(event));
    this.log("Sent", event);
  }

  private handleServerMessage(data: string): void {
    try {
      const event: DispatchServerEvent = JSON.parse(data);
      this.log("Received", event);

      switch (event.type) {
        case "authOk":
          this.handleAuthOk();
          break;

        case "authError":
          this.handleAuthError(event.message);
          break;

        case "floorGranted":
          this.handleFloorGranted(event.channelId, event.holderUserId, event.expiresAt);
          break;

        case "floorDenied":
          this.handleFloorDenied(event.channelId, event.reason);
          break;

        case "floorReleased":
          this.handleFloorReleased(event.channelId);
          break;

        case "speakerUpdate":
          this.handleSpeakerUpdate(event.channelId, event.userId, event.on);
          break;

        case "presenceUpdate":
          this.handlePresenceUpdate(event.channelId, event.users);
          break;

        case "error":
          this.handleError(event.message);
          break;

        default:
          this.log("Unknown server event", event);
      }
    } catch (error) {
      this.log("Failed to parse server message", error);
    }
  }

  private handleAuthOk(): void {
    this.log("Authentication successful");
    this.state.authenticated = true;
    this.reconnectAttempts = 0;
    this.emit("authenticated");
  }

  private handleAuthError(message: string): void {
    this.log("Authentication failed", message);
    this.emit("error", new AuthenticationError(message));
  }

  private handleFloorGranted(channelId: ChannelId, holderUserId: UserId, expiresAt: string): void {
    this.log("Floor granted", { channelId, holderUserId, expiresAt });
    this.state.floorState = "granted";
    this.state.floorHolder = holderUserId;
    this.emit("floorStateChanged", "granted");
    this.emit("floorGranted", { channelId, holderUserId, expiresAt });
  }

  private handleFloorDenied(channelId: ChannelId, reason: string): void {
    this.log("Floor denied", { channelId, reason });
    this.state.floorState = "idle";
    this.emit("floorStateChanged", "idle");
    this.emit("floorDenied", new FloorDeniedError(reason));
  }

  private handleFloorReleased(channelId: ChannelId): void {
    this.log("Floor released", { channelId });
    this.state.floorState = "idle";
    this.state.floorHolder = null;
    this.emit("floorStateChanged", "idle");
    this.emit("floorReleased");
  }

  private handleSpeakerUpdate(channelId: ChannelId, userId: UserId | null, on: boolean): void {
    this.log("Speaker update", { channelId, userId, on });
    this.state.currentSpeaker = on ? userId : null;
    this.emit("speakerChanged", userId, on);
  }

  private handlePresenceUpdate(channelId: ChannelId, users: PresenceUser[]): void {
    this.log("Presence update", { channelId, userCount: users.length });
    this.state.presenceUsers = users;
    this.emit("presenceUpdated", users);
  }

  private handleError(message: string): void {
    this.log("Server error", message);
    this.emit("error", new PTTError(message, "SERVER_ERROR"));
  }

  // ==========================================================================
  // Heartbeat (Keep Connection Alive)
  // ==========================================================================

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ==========================================================================
  // State Accessors
  // ==========================================================================

  getState(): Readonly<PTTState> {
    return { ...this.state };
  }

  isConnected(): boolean {
    return this.state.connected && this.state.authenticated;
  }

  hasFloor(): boolean {
    return this.state.floorState === "granted" || this.state.floorState === "transmitting";
  }

  isTransmitting(): boolean {
    return this.state.isTransmitting;
  }

  getCurrentChannel(): ChannelId | null {
    return this.state.currentChannel;
  }

  getPresenceUsers(): PresenceUser[] {
    return [...this.state.presenceUsers];
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[DispatchPTT] ${message}`, ...args);
    }
  }
}
