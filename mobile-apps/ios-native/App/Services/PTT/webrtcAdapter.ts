// ============================================================================
// Fleet PTT - WebRTC Adapter Interface
// ============================================================================
// Platform-agnostic interface for audio capture and playback

import type { AudioConfig } from "./dispatchTypes";

export interface WebRTCAdapter {
  /**
   * Start capturing audio from microphone
   */
  startCapture(): Promise<MediaStream>;

  /**
   * Stop capturing audio
   */
  stopCapture(): void;

  /**
   * Play remote audio stream
   */
  playRemoteStream(stream: MediaStream): void;

  /**
   * Stop playing remote audio
   */
  stopRemoteStream(): void;

  /**
   * Clean up all resources
   */
  cleanup(): void;
}
