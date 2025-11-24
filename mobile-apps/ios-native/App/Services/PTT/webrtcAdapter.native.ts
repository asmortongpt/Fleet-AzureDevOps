// ============================================================================
// Fleet PTT - React Native WebRTC Adapter
// ============================================================================
// React Native audio capture and playback using react-native-webrtc
//
// REQUIRES: npm install react-native-webrtc
// iOS: Update Podfile and run pod install
// Android: Update build.gradle

import type { WebRTCAdapter } from "./webrtcAdapter";
import type { AudioConfig } from "./dispatchTypes";

// Import react-native-webrtc
// NOTE: This assumes react-native-webrtc is installed
// If not installed, this file will cause build errors
let mediaDevices: any;
let RTCView: any;

try {
  const webrtc = require("react-native-webrtc");
  mediaDevices = webrtc.mediaDevices;
  RTCView = webrtc.RTCView;
} catch (error) {
  console.error("[WebRTCAdapterNative] react-native-webrtc not installed", error);
}

export class WebRTCAdapterNative implements WebRTCAdapter {
  private peerConnection: RTCPeerConnection;
  private audioConfig: AudioConfig;
  private localStream: any | null = null;
  private remoteStream: any | null = null;

  constructor(peerConnection: RTCPeerConnection, audioConfig: AudioConfig) {
    this.peerConnection = peerConnection;
    this.audioConfig = audioConfig;
  }

  /**
   * Start capturing audio from microphone using React Native WebRTC
   */
  async startCapture(): Promise<any> {
    console.log("[WebRTCAdapterNative] Starting audio capture");

    if (!mediaDevices) {
      throw new Error("react-native-webrtc not installed");
    }

    try {
      this.localStream = await mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.audioConfig.echoCancellation,
          noiseSuppression: this.audioConfig.noiseSuppression,
          autoGainControl: this.audioConfig.autoGainControl,
        },
        video: false,
      });

      // Add audio tracks to peer connection
      this.localStream.getTracks().forEach((track: any) => {
        console.log("[WebRTCAdapterNative] Adding track to peer connection", track.kind);
        this.peerConnection.addTrack(track, this.localStream);
      });

      console.log("[WebRTCAdapterNative] Audio capture started successfully");
      return this.localStream;
    } catch (error) {
      console.error("[WebRTCAdapterNative] Failed to start audio capture", error);
      throw new Error(`Microphone access denied: ${error}`);
    }
  }

  /**
   * Stop capturing audio
   */
  stopCapture(): void {
    console.log("[WebRTCAdapterNative] Stopping audio capture");

    if (this.localStream) {
      this.localStream.getTracks().forEach((track: any) => {
        track.stop();
        console.log("[WebRTCAdapterNative] Stopped track", track.kind);
      });

      // Remove tracks from peer connection
      this.peerConnection.getSenders().forEach((sender) => {
        if (sender.track && this.localStream?.getTracks().includes(sender.track)) {
          this.peerConnection.removeTrack(sender);
        }
      });

      this.localStream.release();
      this.localStream = null;
    }
  }

  /**
   * Play remote audio stream
   * On React Native, audio plays automatically through AudioSession
   * No explicit playback needed unlike web
   */
  playRemoteStream(stream: any): void {
    console.log("[WebRTCAdapterNative] Playing remote audio stream");
    this.remoteStream = stream;

    // On React Native, audio plays automatically
    // Just store the stream reference for cleanup
    console.log("[WebRTCAdapterNative] Remote audio will play through device speakers");
  }

  /**
   * Stop playing remote audio
   */
  stopRemoteStream(): void {
    console.log("[WebRTCAdapterNative] Stopping remote audio");

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track: any) => {
        track.stop();
      });
      this.remoteStream.release();
      this.remoteStream = null;
    }
  }

  /**
   * Clean up all resources
   */
  cleanup(): void {
    console.log("[WebRTCAdapterNative] Cleaning up");

    this.stopCapture();
    this.stopRemoteStream();
  }
}

/**
 * Configure iOS Audio Session for PTT
 * Call this in AppDelegate.m before using PTT
 */
export function configureIOSAudioSession(): void {
  // This would be implemented in native Swift/Objective-C
  // See: mobile-apps/ios/DispatchPTT.swift for native implementation
  console.log("[WebRTCAdapterNative] Configure iOS Audio Session in native code");
}

/**
 * Configure Android Audio for PTT
 * Call this in MainActivity.java before using PTT
 */
export function configureAndroidAudio(): void {
  // This would be implemented in native Java/Kotlin
  // See: mobile-apps/android/DispatchPTT.kt for native implementation
  console.log("[WebRTCAdapterNative] Configure Android Audio in native code");
}
