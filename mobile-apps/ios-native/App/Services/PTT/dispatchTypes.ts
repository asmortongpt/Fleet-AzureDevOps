// ============================================================================
// Fleet PTT - Protocol Types
// ============================================================================
// Push-To-Talk protocol definitions for radio-fleet-dispatch integration
// NOTE: Event names/payloads MUST match radio-fleet-dispatch WebSocket protocol

export type UserId = string;
export type ChannelId = string;

// ============================================================================
// Client → Server Events (Outbound)
// ============================================================================

export type DispatchClientEvent =
  | { type: "auth"; token: string }
  | { type: "joinChannel"; channelId: ChannelId }
  | { type: "leaveChannel"; channelId: ChannelId }
  | { type: "requestFloor"; channelId: ChannelId }
  | { type: "releaseFloor"; channelId: ChannelId }
  | { type: "speaking"; channelId: ChannelId; on: boolean };

// ============================================================================
// Server → Client Events (Inbound)
// ============================================================================

export type DispatchServerEvent =
  | { type: "authOk" }
  | { type: "authError"; message: string }
  | { type: "floorGranted"; channelId: ChannelId; holderUserId: UserId; expiresAt: string }
  | { type: "floorDenied"; channelId: ChannelId; reason: string }
  | { type: "floorReleased"; channelId: ChannelId }
  | { type: "speakerUpdate"; channelId: ChannelId; userId: UserId | null; on: boolean }
  | { type: "presenceUpdate"; channelId: ChannelId; users: PresenceUser[] }
  | { type: "error"; message: string };

// ============================================================================
// Data Models
// ============================================================================

export interface PresenceUser {
  userId: UserId;
  displayName: string;
  unit?: string;
  status: "online" | "offline" | "talking";
  joinedAt: string;
}

export interface Channel {
  id: ChannelId;
  name: string;
  description?: string;
  frequency?: string;
  type: "dispatch" | "tactical" | "emergency";
  userCount: number;
}

// ============================================================================
// PTT State
// ============================================================================

export type FloorState =
  | "idle"           // Not requesting floor
  | "requesting"     // Floor request sent, waiting for grant
  | "granted"        // Floor granted, can transmit
  | "denied"         // Floor denied
  | "transmitting"   // Actively transmitting audio
  | "listening";     // Receiving audio from another user

export interface PTTState {
  connected: boolean;
  authenticated: boolean;
  currentChannel: ChannelId | null;
  floorState: FloorState;
  floorHolder: UserId | null;
  currentSpeaker: UserId | null;
  presenceUsers: PresenceUser[];
  isTransmitting: boolean;
  isReceiving: boolean;
}

// ============================================================================
// WebRTC Configuration
// ============================================================================

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  sdpSemantics?: "unified-plan" | "plan-b";
  bundlePolicy?: RTCBundlePolicy;
  rtcpMuxPolicy?: RTCRtcpMuxPolicy;
}

// ============================================================================
// Audio Configuration
// ============================================================================

export interface AudioConfig {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  sampleRate?: number;
  channelCount?: number;
  latency?: number;
}

export const DEFAULT_AUDIO_CONFIG: AudioConfig = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000,
  channelCount: 1,
  latency: 0.01, // 10ms for low-latency PTT
};

// ============================================================================
// Error Types
// ============================================================================

export class PTTError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = "PTTError";
  }
}

export class FloorDeniedError extends PTTError {
  constructor(reason: string) {
    super(`Floor denied: ${reason}`, "FLOOR_DENIED", { reason });
  }
}

export class ConnectionError extends PTTError {
  constructor(message: string) {
    super(message, "CONNECTION_ERROR");
  }
}

export class AuthenticationError extends PTTError {
  constructor(message: string) {
    super(message, "AUTH_ERROR");
  }
}
