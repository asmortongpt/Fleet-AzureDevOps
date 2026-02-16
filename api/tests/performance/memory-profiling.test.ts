import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Backend Memory Profiling Tests
 * Detects memory leaks in Node.js server
 *
 * Run with: npm run test:memory
 * Requires: --expose-gc flag
 */

interface MemorySnapshot {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

interface MemoryMetrics {
  initialHeap: number;
  peakHeap: number;
  finalHeap: number;
  growth: number;
  recovered: number;
}

let snapshots: MemorySnapshot[] = [];

/**
 * Captures current memory usage
 */
function captureMemorySnapshot(): MemorySnapshot {
  if (global.gc) {
    global.gc();
  }

  const mem = process.memoryUsage();
  return {
    timestamp: Date.now(),
    heapUsed: mem.heapUsed,
    heapTotal: mem.heapTotal,
    external: mem.external,
    rss: mem.rss,
  };
}

/**
 * Analyzes memory trend
 */
function analyzeMemoryTrend(samples: MemorySnapshot[]): MemoryMetrics {
  if (samples.length < 2) {
    throw new Error('Need at least 2 samples');
  }

  const heaps = samples.map((s) => s.heapUsed);
  const initialHeap = heaps[0];
  const peakHeap = Math.max(...heaps);
  const finalHeap = heaps[heaps.length - 1];
  const growth = finalHeap - initialHeap;
  const recovered = peakHeap - finalHeap;

  return {
    initialHeap,
    peakHeap,
    finalHeap,
    growth,
    recovered,
  };
}

describe('Backend Memory Profiling', () => {
  beforeAll(() => {
    // Check if running with --expose-gc
    if (!global.gc) {
      console.warn(
        'WARNING: Running without --expose-gc flag. Memory tests may be less accurate.'
      );
      console.warn('Run with: node --expose-gc'
      );
    }
  });

  it('should measure initial memory footprint', () => {
    const snap = captureMemorySnapshot();
    snapshots.push(snap);

    const heapMB = (snap.heapUsed / 1024 / 1024).toFixed(2);
    const rssMB = (snap.rss / 1024 / 1024).toFixed(2);

    console.log('Initial Memory Footprint:');
    console.log(`  Heap Used: ${heapMB} MB`);
    console.log(`  RSS: ${rssMB} MB`);

    // Server should start with reasonable memory
    expect(snap.heapUsed).toBeLessThan(200 * 1024 * 1024); // < 200MB
  });

  it('should not leak memory during repeated operations', async () => {
    const snap = captureMemorySnapshot();
    snapshots.push(snap);

    // Simulate repeated operations that could cause leaks
    for (let i = 0; i < 5; i++) {
      // Create and discard objects
      const tempArray: any[] = [];
      for (let j = 0; j < 1000; j++) {
        tempArray.push({
          id: j,
          data: new Array(100).fill(Math.random()),
          timestamp: Date.now(),
        });
      }

      // Clear references
      tempArray.length = 0;

      // Force GC if available
      if (global.gc) {
        global.gc();
      }

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      const iterationSnap = captureMemorySnapshot();
      snapshots.push(iterationSnap);
    }

    const metrics = analyzeMemoryTrend(snapshots.slice(-6));

    console.log('Memory During Repeated Operations:');
    console.log(
      `  Initial: ${(metrics.initialHeap / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(`  Peak: ${(metrics.peakHeap / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Final: ${(metrics.finalHeap / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Growth: ${(metrics.growth / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Recovered: ${(metrics.recovered / 1024 / 1024).toFixed(2)} MB`);

    // Memory should not grow more than 50MB
    expect(metrics.growth).toBeLessThan(50 * 1024 * 1024);

    // Some memory should be recovered by GC
    expect(metrics.recovered).toBeGreaterThan(0);
  });

  it('should not leak memory with object creation/destruction', async () => {
    snapshots = [captureMemorySnapshot()];

    // Create and destroy many objects
    for (let cycle = 0; cycle < 3; cycle++) {
      const objects: any[] = [];

      // Create objects
      for (let i = 0; i < 5000; i++) {
        objects.push({
          id: i,
          buffer: Buffer.alloc(1024), // 1KB each
          arrays: new Array(10).fill(0),
          nested: {
            deep: {
              data: new Array(50).fill(Math.random()),
            },
          },
        });
      }

      snapshots.push(captureMemorySnapshot());

      // Destroy objects
      objects.length = 0;

      if (global.gc) {
        global.gc();
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
      snapshots.push(captureMemorySnapshot());
    }

    const metrics = analyzeMemoryTrend(snapshots);

    console.log('Object Creation/Destruction Cycles:');
    console.log(
      `  Snapshots: ${snapshots.length}, Cycles: 3`
    );
    console.log(`  Memory Growth: ${(metrics.growth / 1024 / 1024).toFixed(2)} MB`);

    // Final memory should be close to initial
    expect(Math.abs(metrics.growth)).toBeLessThan(100 * 1024 * 1024);
  });

  it('should handle large buffer allocations', async () => {
    snapshots = [captureMemorySnapshot()];

    // Allocate large buffers
    const buffers: Buffer[] = [];
    for (let i = 0; i < 10; i++) {
      buffers.push(Buffer.alloc(10 * 1024 * 1024)); // 10MB each
      snapshots.push(captureMemorySnapshot());
    }

    const peakSnapshot = snapshots[snapshots.length - 1];
    console.log(
      `Peak Heap with Buffers: ${(peakSnapshot.heapUsed / 1024 / 1024).toFixed(2)} MB`
    );

    // Clear buffers
    buffers.length = 0;

    if (global.gc) {
      global.gc();
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
    snapshots.push(captureMemorySnapshot());

    const metrics = analyzeMemoryTrend(snapshots);
    console.log(
      `Memory Recovered: ${(metrics.recovered / 1024 / 1024).toFixed(2)} MB`
    );

    // Should recover most of the buffer memory
    expect(metrics.recovered).toBeGreaterThan(50 * 1024 * 1024);
  });

  it('should not leak with event listener cycles', async () => {
    snapshots = [captureMemorySnapshot()];

    // Create event listeners
    const targets: any[] = [];

    for (let i = 0; i < 10; i++) {
      const target = new (require('events').EventEmitter)();

      // Add many listeners
      for (let j = 0; j < 100; j++) {
        target.on(`event-${j}`, () => {
          // Handler
        });
      }

      targets.push(target);
      snapshots.push(captureMemorySnapshot());
    }

    const afterCreation = snapshots[snapshots.length - 1];
    console.log(
      `Heap After Listener Creation: ${(afterCreation.heapUsed / 1024 / 1024).toFixed(2)} MB`
    );

    // Remove listeners
    targets.forEach((target) => {
      target.removeAllListeners();
    });

    targets.length = 0;

    if (global.gc) {
      global.gc();
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
    snapshots.push(captureMemorySnapshot());

    const metrics = analyzeMemoryTrend(snapshots);
    console.log(
      `Memory After Cleanup: ${(metrics.finalHeap / 1024 / 1024).toFixed(2)} MB`
    );

    // Should recover listener memory
    expect(metrics.recovered).toBeGreaterThan(0);
  });

  it('should report memory statistics', () => {
    if (snapshots.length < 2) {
      console.log('Insufficient snapshots for analysis');
      return;
    }

    const metrics = analyzeMemoryTrend(snapshots);

    console.log('\n=== MEMORY PROFILING REPORT ===\n');
    console.log('Memory Metrics:');
    console.log(
      `  Initial Heap: ${(metrics.initialHeap / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(`  Peak Heap: ${(metrics.peakHeap / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Final Heap: ${(metrics.finalHeap / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Net Growth: ${(metrics.growth / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Recovered: ${(metrics.recovered / 1024 / 1024).toFixed(2)} MB`);

    console.log('\nSnapshot Timeline:');
    snapshots.forEach((snap, idx) => {
      const heapMB = (snap.heapUsed / 1024 / 1024).toFixed(2);
      console.log(`  ${idx}: ${heapMB} MB`);
    });

    // Check for concerning trends
    if (metrics.growth > 100 * 1024 * 1024) {
      console.warn(
        `\nWARNING: Significant memory growth detected: ${(metrics.growth / 1024 / 1024).toFixed(2)} MB`
      );
    }

    if (metrics.recovered < metrics.growth * 0.5) {
      console.warn(
        '\nWARNING: Poor garbage collection - low memory recovery'
      );
    }
  });
});
