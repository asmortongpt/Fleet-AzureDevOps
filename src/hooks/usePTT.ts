/**
 * Push-to-Talk (PTT) Hook
 * Manages microphone access, audio recording, and PTT functionality
 *
 * Features:
 * - Hold-to-talk and click-to-talk modes
 * - Keyboard shortcuts (Space bar)
 * - Audio level monitoring
 * - WebRTC audio streaming
 * - Error handling and permission management
 */

import { useState, useCallback, useRef, useEffect } from 'react';

import type { PTTState } from '@/types/radio';
import logger from '@/utils/logger';

interface UsePTTOptions {
  onAudioChunk?: (audioData: string) => void;
  onTransmissionStart?: (transmissionId: string) => void;
  onTransmissionEnd?: (audioBlob: Blob) => void;
  chunkInterval?: number; // milliseconds
  enableKeyboardShortcut?: boolean;
}

export function usePTT(options: UsePTTOptions = {}) {
  const {
    onAudioChunk,
    onTransmissionStart,
    onTransmissionEnd,
    chunkInterval = 100,
    enableKeyboardShortcut = true
  } = options;

  const [state, setState] = useState<PTTState>({
    isTransmitting: false,
    isPTTActive: false,
    audioLevel: 0,
    error: null
  });

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const currentTransmissionIdRef = useRef<string | null>(null);

  // Initialize audio context and analyzer
  const initializeAudioAnalysis = useCallback((stream: MediaStream) => {
    try {
      // Close existing context if any
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      return true;
    } catch (error) {
      logger.error('[usePTT] Failed to initialize audio analysis:', error);
      return false;
    }
  }, []);

  // Monitor audio levels
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current || !state.isTransmitting) {
      setState(prev => ({ ...prev, audioLevel: 0 }));
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average level
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
    const normalizedLevel = Math.min(average / 128, 1); // Normalize to 0-1

    setState(prev => ({ ...prev, audioLevel: normalizedLevel }));

    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, [state.isTransmitting]);

  // Start audio level monitoring
  useEffect(() => {
    if (state.isTransmitting) {
      updateAudioLevel();
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [state.isTransmitting, updateAudioLevel]);

  // Start PTT transmission
  const startPTT = useCallback(async () => {
    if (state.isTransmitting) return;

    try {
      setState(prev => ({ ...prev, isPTTActive: true, error: null }));

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });

      mediaStreamRef.current = stream;

      // Initialize audio analysis
      if (!initializeAudioAnalysis(stream)) {
        throw new Error('Failed to initialize audio analysis');
      }

      // Create media recorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Generate transmission ID
      const transmissionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      currentTransmissionIdRef.current = transmissionId;

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);

          // Send audio chunk if callback provided
          if (onAudioChunk) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              const base64Audio = result.split(',')[1] || '';
              onAudioChunk(base64Audio);
            };
            reader.readAsDataURL(event.data);
          }
        }
      };

      // Start recording
      mediaRecorder.start(chunkInterval);
      setState(prev => ({ ...prev, isTransmitting: true }));

      // Notify transmission start
      onTransmissionStart?.(transmissionId);

      logger.debug('[usePTT] Transmission started:', transmissionId);
    } catch (error) {
      logger.error('[usePTT] Failed to start PTT:', error);
      setState(prev => ({
        ...prev,
        isPTTActive: false,
        error: error instanceof Error ? error.message : 'Failed to access microphone'
      }));

      // Clean up on error
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    }
  }, [state.isTransmitting, chunkInterval, onAudioChunk, onTransmissionStart, initializeAudioAnalysis]);

  // Stop PTT transmission
  const stopPTT = useCallback(async () => {
    if (!state.isTransmitting) return;

    try {
      logger.debug('[usePTT] Stopping transmission');

      setState(prev => ({ ...prev, isPTTActive: false }));

      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Stop audio tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      // Close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Create complete audio blob
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || 'audio/webm'
      });

      // Notify transmission end
      onTransmissionEnd?.(audioBlob);

      setState(prev => ({ ...prev, isTransmitting: false, audioLevel: 0 }));

      logger.debug('[usePTT] Transmission ended');
    } catch (error) {
      logger.error('[usePTT] Error stopping PTT:', error);
      setState(prev => ({
        ...prev,
        isTransmitting: false,
        isPTTActive: false,
        audioLevel: 0,
        error: error instanceof Error ? error.message : 'Failed to stop transmission'
      }));
    } finally {
      currentTransmissionIdRef.current = null;
      audioChunksRef.current = [];
    }
  }, [state.isTransmitting, onTransmissionEnd]);

  // Toggle PTT (for click-to-talk mode)
  const togglePTT = useCallback(() => {
    if (state.isTransmitting) {
      stopPTT();
    } else {
      startPTT();
    }
  }, [state.isTransmitting, startPTT, stopPTT]);

  // Keyboard shortcut handler
  useEffect(() => {
    if (!enableKeyboardShortcut) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Space bar to start PTT
      if (event.code === 'Space' && !state.isTransmitting && event.target === document.body) {
        event.preventDefault();
        startPTT();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Release space bar to stop PTT
      if (event.code === 'Space' && state.isTransmitting) {
        event.preventDefault();
        stopPTT();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [enableKeyboardShortcut, state.isTransmitting, startPTT, stopPTT]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isTransmitting) {
        stopPTT();
      }
    };
  }, [state.isTransmitting, stopPTT]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 5000);

      return () => clearTimeout(timer);
    }
    return () => {};
  }, [state.error]);

  return {
    ...state,
    startPTT,
    stopPTT,
    togglePTT,
    currentTransmissionId: currentTransmissionIdRef.current
  };
}