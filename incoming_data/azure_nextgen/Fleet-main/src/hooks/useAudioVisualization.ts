/**
 * Audio Visualization Hook
 * Provides real-time audio visualization data for waveform and frequency displays
 *
 * Features:
 * - Frequency spectrum analysis
 * - Waveform time-domain data
 * - Peak and average level detection
 * - Optimized animation frame updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import type { AudioVisualizationData } from '@/types/radio';

interface UseAudioVisualizationOptions {
  fftSize?: number; // 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768
  smoothingTimeConstant?: number; // 0-1
  updateInterval?: number; // milliseconds, 0 for requestAnimationFrame
}

export function useAudioVisualization(
  analyser: AnalyserNode | null,
  options: UseAudioVisualizationOptions = {}
) {
  const {
    fftSize = 2048,
    smoothingTimeConstant = 0.8,
    updateInterval = 0 // Use requestAnimationFrame by default
  } = options;

  const [data, setData] = useState<AudioVisualizationData>({
    frequencyData: new Uint8Array(0),
    timeDomainData: new Uint8Array(0),
    averageLevel: 0,
    peakLevel: 0
  });

  const animationFrameRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Update visualization data
  const updateVisualization = useCallback(() => {
    if (!analyser) {
      setData({
        frequencyData: new Uint8Array(0),
        timeDomainData: new Uint8Array(0),
        averageLevel: 0,
        peakLevel: 0
      });
      return;
    }

    // Configure analyser if needed
    if (analyser.fftSize !== fftSize) {
      analyser.fftSize = fftSize;
    }
    if (analyser.smoothingTimeConstant !== smoothingTimeConstant) {
      analyser.smoothingTimeConstant = smoothingTimeConstant;
    }

    // Get frequency data
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(frequencyData);

    // Get time domain data (waveform)
    const timeDomainData = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(timeDomainData);

    // Calculate average level
    const sum = frequencyData.reduce((acc, value) => acc + value, 0);
    const averageLevel = sum / frequencyData.length / 255; // Normalize to 0-1

    // Calculate peak level
    const peakLevel = Math.max(...frequencyData) / 255; // Normalize to 0-1

    setData({
      frequencyData,
      timeDomainData,
      averageLevel,
      peakLevel
    });
  }, [analyser, fftSize, smoothingTimeConstant]);

  // Start visualization updates
  useEffect(() => {
    if (!analyser) {
      return;
    }

    if (updateInterval > 0) {
      // Use setInterval for updates
      intervalRef.current = window.setInterval(updateVisualization, updateInterval);
    } else {
      // Use requestAnimationFrame for smooth updates
      const animate = () => {
        updateVisualization();
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [analyser, updateInterval, updateVisualization]);

  return data;
}

/**
 * Hook for rendering frequency bars visualization
 */
export function useFrequencyBars(
  frequencyData: Uint8Array,
  barCount: number = 32
): number[] {
  const [bars, setBars] = useState<number[]>([]);

  useEffect(() => {
    if (!frequencyData || frequencyData.length === 0) {
      setBars([]);
      return;
    }

    // Group frequency data into bars
    const barWidth = Math.floor(frequencyData.length / barCount);
    const newBars: number[] = [];

    for (let i = 0; i < barCount; i++) {
      const start = i * barWidth;
      const end = start + barWidth;
      const slice = frequencyData.slice(start, end);
      const average = slice.reduce((sum, value) => sum + value, 0) / slice.length;
      newBars.push(average / 255); // Normalize to 0-1
    }

    setBars(newBars);
  }, [frequencyData, barCount]);

  return bars;
}

/**
 * Hook for rendering waveform visualization
 */
export function useWaveform(
  timeDomainData: Uint8Array,
  width: number,
  height: number
): string {
  const [path, setPath] = useState<string>('');

  useEffect(() => {
    if (!timeDomainData || timeDomainData.length === 0) {
      setPath('');
      return;
    }

    const sliceWidth = width / timeDomainData.length;
    let pathData = '';

    for (let i = 0; i < timeDomainData.length; i++) {
      const value = timeDomainData[i] / 128.0; // Normalize to 0-2
      const y = (value * height) / 2;
      const x = i * sliceWidth;

      if (i === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    }

    setPath(pathData);
  }, [timeDomainData, width, height]);

  return path;
}

/**
 * Hook for detecting audio activity (voice activity detection)
 */
export function useVoiceActivityDetection(
  averageLevel: number,
  threshold: number = 0.1,
  cooldown: number = 500 // milliseconds
): boolean {
  const [isActive, setIsActive] = useState(false);
  const cooldownRef = useRef<number | null>(null);

  useEffect(() => {
    if (averageLevel > threshold) {
      setIsActive(true);

      // Clear existing cooldown
      if (cooldownRef.current !== null) {
        clearTimeout(cooldownRef.current);
      }

      // Set new cooldown
      cooldownRef.current = window.setTimeout(() => {
        setIsActive(false);
        cooldownRef.current = null;
      }, cooldown);
    }

    return () => {
      if (cooldownRef.current !== null) {
        clearTimeout(cooldownRef.current);
      }
    };
  }, [averageLevel, threshold, cooldown]);

  return isActive;
}
