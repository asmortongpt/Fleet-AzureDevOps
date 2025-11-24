// ============================================================================
// Fleet PTT - Web WebRTC Adapter
// ============================================================================
// Web platform audio capture and playback using browser APIs

import type { WebRTCAdapter } from "./webrtcAdapter";
import type { AudioConfig } from "./dispatchTypes";

export class WebRTCAdapterWeb implements WebRTCAdapter {
  private peerConnection: RTCPeerConnection;
  private audioConfig: AudioConfig;
  private localStream: MediaStream | null = null;
  private remoteAudioElement: HTMLAudioElement | null = null;

  constructor(peerConnection: RTCPeerConnection, audioConfig: AudioConfig) {
    this.peerConnection = peerConnection;
    this.audioConfig = audioConfig;
  }

  /**
   * Start capturing audio from microphone using Web Audio API
   */
  async startCapture(): Promise<MediaStream> {
    console.log("[WebRTCAdapterWeb] Starting audio capture");

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.audioConfig.echoCancellation,
          noiseSuppression: this.audioConfig.noiseSuppression,
          autoGainControl: this.audioConfig.autoGainControl,
          sampleRate: this.audioConfig.sampleRate,
          channelCount: this.audioConfig.channelCount,
        },
        video: false,
      });

      // Add audio tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        console.log("[WebRTCAdapterWeb] Adding track to peer connection", track.kind);
        this.peerConnection.addTrack(track, this.localStream!);
      });

      console.log("[WebRTCAdapterWeb] Audio capture started successfully");
      return this.localStream;
    } catch (error) {
      console.error("[WebRTCAdapterWeb] Failed to start audio capture", error);
      throw new Error(`Microphone access denied: ${error}`);
    }
  }

  /**
   * Stop capturing audio
   */
  stopCapture(): void {
    console.log("[WebRTCAdapterWeb] Stopping audio capture");

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
        console.log("[WebRTCAdapterWeb] Stopped track", track.kind);
      });

      // Remove tracks from peer connection
      this.peerConnection.getSenders().forEach((sender) => {
        if (sender.track && this.localStream?.getTracks().includes(sender.track)) {
          this.peerConnection.removeTrack(sender);
        }
      });

      this.localStream = null;
    }
  }

  /**
   * Play remote audio stream through speakers
   */
  playRemoteStream(stream: MediaStream): void {
    console.log("[WebRTCAdapterWeb] Playing remote audio stream");

    if (!this.remoteAudioElement) {
      this.remoteAudioElement = document.createElement("audio");
      this.remoteAudioElement.autoplay = true;
      this.remoteAudioElement.style.display = "none";
      document.body.appendChild(this.remoteAudioElement);
    }

    this.remoteAudioElement.srcObject = stream;
    this.remoteAudioElement.play().catch((error) => {
      console.error("[WebRTCAdapterWeb] Failed to play remote audio", error);
    });
  }

  /**
   * Stop playing remote audio
   */
  stopRemoteStream(): void {
    console.log("[WebRTCAdapterWeb] Stopping remote audio");

    if (this.remoteAudioElement) {
      this.remoteAudioElement.pause();
      this.remoteAudioElement.srcObject = null;
    }
  }

  /**
   * Clean up all resources
   */
  cleanup(): void {
    console.log("[WebRTCAdapterWeb] Cleaning up");

    this.stopCapture();
    this.stopRemoteStream();

    if (this.remoteAudioElement) {
      this.remoteAudioElement.remove();
      this.remoteAudioElement = null;
    }
  }
}
