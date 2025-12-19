// TypeScript strict mode enabled
// Comprehensive error handling and JSDoc documentation

import { getMemoryUsage } from './memoryAPI'; // Assume this is a utility function to get memory usage
import logger from './logger';

export interface MemoryLeakReport {
  detected: boolean;
  memoryIncrease: number; // Changed from 'increase' to 'memoryIncrease' for consistency
  increase?: number; // Keep for backward compatibility
  threshold: number;
  timestamp: Date;
}

type LeakCallback = (report: MemoryLeakReport) => void;

// FPS Data interface
export interface FPSData {
  current: number;
  average: number;
  min: number;
  max: number;
}

// Web Vital interface
export interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

interface MemoryLeakDetectorOptions {
  sampleRate?: number; // in milliseconds
  windowSize?: number; // number of samples
  memoryLeakThreshold?: number; // in MB
}

export class MemoryLeakDetector {
  private sampleRate: number;
  private windowSize: number;
  private memoryLeakThreshold: number;
  private memorySnapshots: number[] = [];
  private intervalId: NodeJS.Timeout | null = null;
  private callback: LeakCallback;

  /**
   * @param callback - Function to call when a memory leak is detected
   * @param options - Configuration options for the detector
   */
  constructor(callback: LeakCallback, options: MemoryLeakDetectorOptions = {}) {
    this.sampleRate = options.sampleRate ?? 5000;
    this.windowSize = options.windowSize ?? 10;
    this.memoryLeakThreshold = options.memoryLeakThreshold ?? 50;
    this.callback = callback;
  }

  /**
   * Starts the memory leak detection process.
   */
  public start(): void {
    if (typeof getMemoryUsage !== 'function') {
      logger.warn('Memory API is not supported in this environment.');
      return;
    }

    this.intervalId = setInterval(() => {
      try {
        const memoryUsage = getMemoryUsage();
        this.memorySnapshots.push(memoryUsage);

        if (this.memorySnapshots.length > this.windowSize) {
          this.memorySnapshots.shift();
        }

        this.detectLeak();
      } catch (error) {
        logger.error('Error during memory sampling:', error);
      }
    }, this.sampleRate);
  }

  /**
   * Stops the memory leak detection process and cleans up resources.
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.memorySnapshots = [];
  }

  /**
   * Analyzes memory snapshots to detect potential leaks.
   */
  private detectLeak(): void {
    if (this.memorySnapshots.length < this.windowSize) {
      return;
    }

    const increase = this.memorySnapshots[this.memorySnapshots.length - 1] - this.memorySnapshots[0];
    if (increase > this.memoryLeakThreshold) {
      this.callback({
        detected: true,
        memoryIncrease: increase,
        increase, // Keep for backward compatibility
        threshold: this.memoryLeakThreshold,
        timestamp: new Date(),
      });
    }
  }
}
// ============================================================================
// FPS Monitor
// ============================================================================

export class FPSMonitor {
  private callback: (data: FPSData) => void;
  private rafId: number | null = null;
  private lastTime: number = 0;
  private frames: number[] = [];
  private frameCount: number = 0;

  constructor(callback: (data: FPSData) => void) {
    this.callback = callback;
  }

  start(): void {
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.frames = [];
    this.measure();
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private measure = (): void => {
    const now = performance.now();
    const delta = now - this.lastTime;

    if (delta > 0) {
      const fps = Math.round(1000 / delta);
      this.frames.push(fps);

      // Keep only last 60 frames
      if (this.frames.length > 60) {
        this.frames.shift();
      }

      // Update callback every 30 frames
      this.frameCount++;
      if (this.frameCount >= 30) {
        const current = fps;
        const average = Math.round(this.frames.reduce((a, b) => a + b, 0) / this.frames.length);
        const min = Math.min(...this.frames);
        const max = Math.max(...this.frames);

        this.callback({ current, average, min, max });
        this.frameCount = 0;
      }
    }

    this.lastTime = now;
    this.rafId = requestAnimationFrame(this.measure);
  };

  getFPS(): number {
    if (this.frames.length === 0) return 60;
    return Math.round(this.frames.reduce((a, b) => a + b, 0) / this.frames.length);
  }
}

// ============================================================================
// Web Vitals Tracking
// ============================================================================

export function trackWebVitals(callback: (vital: WebVital) => void): () => void {
  // Use web-vitals library if available, otherwise provide mock data
  try {
    // This is a simplified implementation
    // In production, you would use the 'web-vitals' npm package

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          callback({
            name: 'LCP',
            value: entry.startTime,
            rating: entry.startTime < 2500 ? 'good' : entry.startTime < 4000 ? 'needs-improvement' : 'poor',
          });
        }
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });

    return () => observer.disconnect();
  } catch (error) {
    logger.warn('Web Vitals tracking not available:', error);
    return () => {};
  }
}

// ============================================================================
// FPS Thresholds
// ============================================================================

export const FPS_THRESHOLDS = {
  GOOD: 60,
  FAIR: 30,
  POOR: 15,
};

// ============================================================================
// Marker Optimization Suggestions
// ============================================================================

export function getMarkerOptimizationSuggestions(markerCount?: number): string[] {
  const suggestions: string[] = [];

  if (!markerCount) return suggestions;

  if (markerCount > 1000) {
    suggestions.push('Consider implementing marker clustering for better performance');
    suggestions.push('Use viewport-based filtering to only render visible markers');
  }

  if (markerCount > 500) {
    suggestions.push('Enable marker virtualization');
    suggestions.push('Implement lazy loading for marker details');
  }

  if (markerCount > 100) {
    suggestions.push('Consider using canvas-based rendering instead of DOM markers');
  }

  return suggestions;
}
