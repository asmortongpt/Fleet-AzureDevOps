/**
 * Performance Metrics Utilities
 *
 * Utilities for measuring and tracking performance metrics
 * in map component benchmarks.
 */

/**
 * Performance metric result
 */
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

/**
 * Benchmark result
 */
export interface BenchmarkResult {
  name: string;
  duration: number;
  iterations: number;
  opsPerSecond: number;
  meanTime: number;
  medianTime: number;
  minTime: number;
  maxTime: number;
  stdDev: number;
  samples: number[];
  metadata?: Record<string, any>;
}

/**
 * Memory usage snapshot
 */
export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * FPS measurement result
 */
export interface FPSMeasurement {
  fps: number;
  frameCount: number;
  duration: number;
  droppedFrames: number;
}

/**
 * Measures execution time of a function
 */
export async function measureTime<T>(
  fn: () => T | Promise<T>,
  warmupRuns: number = 0
): Promise<{ result: T; duration: number }> {
  // Warmup runs
  for (let i = 0; i < warmupRuns; i++) {
    await fn();
  }

  // Clear any microtask queue
  await new Promise((resolve) => setTimeout(resolve, 0));

  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  return {
    result,
    duration: end - start,
  };
}

/**
 * Runs a benchmark multiple times and collects statistics
 */
export async function runBenchmark(
  name: string,
  fn: () => void | Promise<void>,
  options: {
    iterations?: number;
    warmup?: number;
    minTime?: number;
    metadata?: Record<string, any>;
  } = {}
): Promise<BenchmarkResult> {
  const {
    iterations = 100,
    warmup = 5,
    minTime = 1000,
    metadata = {},
  } = options;

  const samples: number[] = [];

  // Warmup
  for (let i = 0; i < warmup; i++) {
    await fn();
  }

  // Benchmark
  const startTime = performance.now();
  let actualIterations = 0;

  while (actualIterations < iterations || performance.now() - startTime < minTime) {
    const { duration } = await measureTime(fn);
    samples.push(duration);
    actualIterations++;

    if (actualIterations >= iterations && performance.now() - startTime >= minTime) {
      break;
    }
  }

  const totalDuration = performance.now() - startTime;

  // Calculate statistics
  const sortedSamples = [...samples].sort((a, b) => a - b);
  const meanTime = samples.reduce((a, b) => a + b, 0) / samples.length;
  const medianTime = sortedSamples[Math.floor(sortedSamples.length / 2)];
  const minTime_result = Math.min(...samples);
  const maxTime = Math.max(...samples);

  // Calculate standard deviation
  const variance =
    samples.reduce((acc, val) => acc + Math.pow(val - meanTime, 2), 0) / samples.length;
  const stdDev = Math.sqrt(variance);

  const opsPerSecond = (actualIterations / totalDuration) * 1000;

  return {
    name,
    duration: totalDuration,
    iterations: actualIterations,
    opsPerSecond,
    meanTime,
    medianTime,
    minTime: minTime_result,
    maxTime,
    stdDev,
    samples,
    metadata,
  };
}

/**
 * Takes a memory snapshot
 */
export function takeMemorySnapshot(): MemorySnapshot | null {
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    const memory = (performance as any).memory;
    return {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return null;
}

/**
 * Measures memory usage of a function
 */
export async function measureMemory<T>(
  fn: () => T | Promise<T>
): Promise<{
  result: T;
  memoryDelta: number;
  before: MemorySnapshot | null;
  after: MemorySnapshot | null;
}> {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }

  await new Promise((resolve) => setTimeout(resolve, 100));

  const before = takeMemorySnapshot();
  const result = await fn();
  const after = takeMemorySnapshot();

  const memoryDelta =
    before && after ? after.usedJSHeapSize - before.usedJSHeapSize : 0;

  return {
    result,
    memoryDelta,
    before,
    after,
  };
}

/**
 * Measures FPS over a duration
 */
export async function measureFPS(durationMs: number): Promise<FPSMeasurement> {
  return new Promise((resolve) => {
    let frameCount = 0;
    let lastTime = performance.now();
    const startTime = lastTime;
    let droppedFrames = 0;

    function countFrame() {
      const currentTime = performance.now();
      const delta = currentTime - lastTime;

      // Detect dropped frames (assuming 60 FPS target)
      const expectedFrames = Math.floor(delta / (1000 / 60));
      if (expectedFrames > 1) {
        droppedFrames += expectedFrames - 1;
      }

      frameCount++;
      lastTime = currentTime;

      if (currentTime - startTime < durationMs) {
        requestAnimationFrame(countFrame);
      } else {
        const totalDuration = currentTime - startTime;
        const fps = (frameCount / totalDuration) * 1000;

        resolve({
          fps,
          frameCount,
          duration: totalDuration,
          droppedFrames,
        });
      }
    }

    requestAnimationFrame(countFrame);
  });
}

/**
 * Monitors performance over time
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private memorySnapshots: MemorySnapshot[] = [];
  private intervalId: number | null = null;

  /**
   * Starts monitoring
   */
  start(intervalMs: number = 1000): void {
    this.stop();

    this.intervalId = window.setInterval(() => {
      const snapshot = takeMemorySnapshot();
      if (snapshot) {
        this.memorySnapshots.push(snapshot);
      }
    }, intervalMs);
  }

  /**
   * Stops monitoring
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Records a metric
   */
  recordMetric(name: string, value: number, unit: string = 'ms'): void {
    this.metrics.push({
      name,
      value,
      unit,
      timestamp: Date.now(),
    });
  }

  /**
   * Gets all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Gets memory snapshots
   */
  getMemorySnapshots(): MemorySnapshot[] {
    return [...this.memorySnapshots];
  }

  /**
   * Calculates memory statistics
   */
  getMemoryStats(): {
    min: number;
    max: number;
    mean: number;
    growth: number;
  } | null {
    if (this.memorySnapshots.length === 0) {
      return null;
    }

    const heapSizes = this.memorySnapshots.map((s) => s.usedJSHeapSize);
    const min = Math.min(...heapSizes);
    const max = Math.max(...heapSizes);
    const mean = heapSizes.reduce((a, b) => a + b, 0) / heapSizes.length;
    const growth = heapSizes[heapSizes.length - 1] - heapSizes[0];

    return { min, max, mean, growth };
  }

  /**
   * Clears all data
   */
  clear(): void {
    this.metrics = [];
    this.memorySnapshots = [];
  }

  /**
   * Exports data as JSON
   */
  export(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        memorySnapshots: this.memorySnapshots,
        memoryStats: this.getMemoryStats(),
      },
      null,
      2
    );
  }
}

/**
 * Formats bytes to human-readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Formats duration to human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(2)} μs`;
  if (ms < 1000) return `${ms.toFixed(2)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Calculates percentile from sorted array
 */
export function percentile(sortedArray: number[], p: number): number {
  const index = (p / 100) * (sortedArray.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (lower === upper) {
    return sortedArray[lower];
  }

  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}

/**
 * Creates a performance baseline from benchmark results
 */
export function createBaseline(results: BenchmarkResult[]): Record<string, number> {
  const baseline: Record<string, number> = {};

  for (const result of results) {
    baseline[result.name] = result.medianTime;
  }

  return baseline;
}

/**
 * Compares benchmark results against baseline
 */
export function compareToBaseline(
  current: BenchmarkResult[],
  baseline: Record<string, number>
): {
  benchmark: string;
  current: number;
  baseline: number;
  change: number;
  changePercent: number;
  regression: boolean;
}[] {
  const threshold = 0.1; // 10% threshold

  return current.map((result) => {
    const baselineValue = baseline[result.name] || 0;
    const change = result.medianTime - baselineValue;
    const changePercent = baselineValue > 0 ? (change / baselineValue) * 100 : 0;
    const regression = changePercent > threshold * 100;

    return {
      benchmark: result.name,
      current: result.medianTime,
      baseline: baselineValue,
      change,
      changePercent,
      regression,
    };
  });
}
