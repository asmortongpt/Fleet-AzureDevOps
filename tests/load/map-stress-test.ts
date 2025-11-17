/**
 * Map Component Load & Stress Testing
 *
 * Tests map components under extreme conditions:
 * - Massive datasets (100,000+ markers)
 * - Rapid user interactions
 * - Memory leak detection
 * - Concurrent user simulation
 * - Performance degradation tracking
 *
 * Run with: npm run test:load
 */

import { test, expect } from '@playwright/test';
import {
  generateVehicles,
  generateFacilities,
  generateCameras,
} from '../../benchmarks/utils/test-data-generator';
import {
  PerformanceMonitor,
  measureFPS,
  formatBytes,
  formatDuration,
} from '../../benchmarks/utils/performance-metrics';

// ============================================================================
// Configuration
// ============================================================================

const MASSIVE_DATASET_SIZE = 100000;
const STRESS_TEST_DURATION = 60000; // 1 minute
const MEMORY_LEAK_THRESHOLD = 50 * 1024 * 1024; // 50 MB
const FPS_THRESHOLD = 30; // Minimum acceptable FPS
const CONCURRENT_USERS = 10;

// ============================================================================
// Test Setup
// ============================================================================

test.describe('Map Load & Stress Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable performance monitoring in browser
    await page.addInitScript(() => {
      (window as any).performanceMonitor = {
        marks: [],
        measures: [],
        memory: [],
      };
    });

    // Navigate to map page
    await page.goto('/live-tracking');
    await page.waitForLoadState('networkidle');
  });

  // ============================================================================
  // Massive Dataset Tests
  // ============================================================================

  test('Load map with 100,000+ markers', async ({ page }) => {
    const startTime = Date.now();

    // Generate massive dataset
    console.log('Generating 100,000 vehicle markers...');
    const vehicles = generateVehicles(MASSIVE_DATASET_SIZE);

    // Inject data into page
    await page.evaluate((data) => {
      (window as any).massiveVehicleData = data;
    }, vehicles);

    // Measure initial render time
    const renderStart = performance.now();
    await page.evaluate(() => {
      const event = new CustomEvent('loadMassiveDataset', {
        detail: (window as any).massiveVehicleData,
      });
      window.dispatchEvent(event);
    });

    // Wait for map to be ready
    await page.waitForFunction(
      () => {
        const mapContainer = document.querySelector('[data-testid="map-container"]');
        return mapContainer && mapContainer.getAttribute('data-ready') === 'true';
      },
      { timeout: 120000 } // 2 minutes max
    );

    const renderEnd = performance.now();
    const renderTime = renderEnd - renderStart;

    console.log(`Render time for ${MASSIVE_DATASET_SIZE} markers: ${renderTime.toFixed(2)}ms`);

    // Performance assertions
    expect(renderTime).toBeLessThan(30000); // Should render within 30 seconds

    // Check if clustering is active
    const clusterInfo = await page.evaluate(() => {
      return (window as any).mapInstance?.getClusterInfo?.() || {};
    });

    console.log('Cluster info:', clusterInfo);
    expect(clusterInfo.clustersActive).toBe(true);
  });

  test('Memory usage with 100,000 markers remains stable', async ({ page }) => {
    const monitor = new PerformanceMonitor();

    // Generate large dataset
    const vehicles = generateVehicles(50000);
    await page.evaluate((data) => {
      (window as any).vehicleData = data;
    }, vehicles);

    // Start monitoring
    monitor.start(1000);

    // Take initial memory snapshot
    const initialMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    console.log(`Initial memory: ${formatBytes(initialMemory)}`);

    // Load markers
    await page.evaluate(() => {
      const event = new CustomEvent('loadMassiveDataset', {
        detail: (window as any).vehicleData,
      });
      window.dispatchEvent(event);
    });

    // Wait for stabilization
    await page.waitForTimeout(5000);

    // Take memory snapshot after load
    const loadedMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    console.log(`Memory after load: ${formatBytes(loadedMemory)}`);

    // Perform operations for 30 seconds
    for (let i = 0; i < 30; i++) {
      // Random zoom
      await page.evaluate(() => {
        (window as any).mapInstance?.setZoom?.(Math.random() * 10 + 8);
      });

      // Random pan
      await page.evaluate(() => {
        const center = (window as any).mapInstance?.getCenter?.();
        if (center) {
          (window as any).mapInstance?.setCenter?.([
            center[0] + (Math.random() - 0.5) * 0.1,
            center[1] + (Math.random() - 0.5) * 0.1,
          ]);
        }
      });

      await page.waitForTimeout(1000);
    }

    // Take final memory snapshot
    const finalMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    console.log(`Final memory: ${formatBytes(finalMemory)}`);

    monitor.stop();

    // Check for memory leaks
    const memoryGrowth = finalMemory - loadedMemory;
    console.log(`Memory growth during stress test: ${formatBytes(memoryGrowth)}`);

    // Assert memory growth is within acceptable limits
    expect(memoryGrowth).toBeLessThan(MEMORY_LEAK_THRESHOLD);
  });

  test('Clustered rendering performance with 50,000 markers', async ({ page }) => {
    const vehicles = generateVehicles(50000);

    await page.evaluate((data) => {
      (window as any).vehicleData = data;
    }, vehicles);

    const startTime = performance.now();

    // Enable clustering
    await page.evaluate(() => {
      (window as any).mapInstance?.enableClustering?.(true);
    });

    // Load data
    await page.evaluate(() => {
      const event = new CustomEvent('loadMassiveDataset', {
        detail: (window as any).vehicleData,
      });
      window.dispatchEvent(event);
    });

    await page.waitForFunction(
      () => {
        const mapContainer = document.querySelector('[data-testid="map-container"]');
        return mapContainer && mapContainer.getAttribute('data-ready') === 'true';
      },
      { timeout: 60000 }
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    console.log(`Clustered render time for 50,000 markers: ${renderTime.toFixed(2)}ms`);

    // Get cluster statistics
    const clusterStats = await page.evaluate(() => {
      return (window as any).mapInstance?.getClusterStats?.() || {};
    });

    console.log('Cluster statistics:', clusterStats);

    // Assertions
    expect(renderTime).toBeLessThan(20000); // Should render within 20 seconds
    expect(clusterStats.totalMarkers).toBe(50000);
    expect(clusterStats.visibleClusters).toBeLessThan(500); // Should reduce to manageable clusters
  });

  // ============================================================================
  // Rapid Interaction Tests
  // ============================================================================

  test('Rapid zoom operations maintain responsiveness', async ({ page }) => {
    // Load moderate dataset
    const vehicles = generateVehicles(1000);
    await page.evaluate((data) => {
      (window as any).vehicleData = data;
      const event = new CustomEvent('loadMassiveDataset', { detail: data });
      window.dispatchEvent(event);
    }, vehicles);

    await page.waitForTimeout(2000);

    // Perform rapid zoom operations
    const zoomOperations = 50;
    const startTime = performance.now();

    for (let i = 0; i < zoomOperations; i++) {
      const zoom = 8 + (i % 10);
      await page.evaluate((z) => {
        (window as any).mapInstance?.setZoom?.(z);
      }, zoom);

      // Don't wait between operations - stress test
      await page.waitForTimeout(50);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / zoomOperations;

    console.log(`Average zoom operation time: ${avgTime.toFixed(2)}ms`);

    // Should handle rapid zooming smoothly
    expect(avgTime).toBeLessThan(100); // Each zoom should take less than 100ms
  });

  test('Rapid pan operations maintain responsiveness', async ({ page }) => {
    // Load moderate dataset
    const vehicles = generateVehicles(1000);
    await page.evaluate((data) => {
      (window as any).vehicleData = data;
      const event = new CustomEvent('loadMassiveDataset', { detail: data });
      window.dispatchEvent(event);
    }, vehicles);

    await page.waitForTimeout(2000);

    // Perform rapid pan operations
    const panOperations = 100;
    const startTime = performance.now();

    for (let i = 0; i < panOperations; i++) {
      await page.evaluate(() => {
        const center = (window as any).mapInstance?.getCenter?.() || [30.4383, -84.2807];
        (window as any).mapInstance?.setCenter?.([
          center[0] + (Math.random() - 0.5) * 0.01,
          center[1] + (Math.random() - 0.5) * 0.01,
        ]);
      });

      await page.waitForTimeout(20);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / panOperations;

    console.log(`Average pan operation time: ${avgTime.toFixed(2)}ms`);

    // Should handle rapid panning smoothly
    expect(avgTime).toBeLessThan(50);
  });

  test('Rapid filter changes maintain responsiveness', async ({ page }) => {
    const vehicles = generateVehicles(5000);
    await page.evaluate((data) => {
      (window as any).vehicleData = data;
      const event = new CustomEvent('loadMassiveDataset', { detail: data });
      window.dispatchEvent(event);
    }, vehicles);

    await page.waitForTimeout(2000);

    const filters = ['active', 'idle', 'charging', 'service', 'all'];
    const iterations = 20;
    const startTime = performance.now();

    for (let i = 0; i < iterations; i++) {
      const filter = filters[i % filters.length];

      await page.evaluate((f) => {
        (window as any).mapInstance?.applyFilter?.('status', f);
      }, filter);

      await page.waitForTimeout(50);
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;

    console.log(`Average filter operation time: ${avgTime.toFixed(2)}ms`);

    expect(avgTime).toBeLessThan(200); // Each filter should apply within 200ms
  });

  test('Simultaneous operations stress test', async ({ page }) => {
    const vehicles = generateVehicles(2000);
    await page.evaluate((data) => {
      (window as any).vehicleData = data;
      const event = new CustomEvent('loadMassiveDataset', { detail: data });
      window.dispatchEvent(event);
    }, vehicles);

    await page.waitForTimeout(2000);

    // Perform multiple operations simultaneously
    const startTime = performance.now();

    await Promise.all([
      // Zoom change
      page.evaluate(() => {
        (window as any).mapInstance?.setZoom?.(12);
      }),
      // Pan
      page.evaluate(() => {
        (window as any).mapInstance?.setCenter?.([30.45, -84.25]);
      }),
      // Filter
      page.evaluate(() => {
        (window as any).mapInstance?.applyFilter?.('status', 'active');
      }),
      // Search
      page.evaluate(() => {
        (window as any).mapInstance?.search?.('vehicle-100');
      }),
    ]);

    const endTime = performance.now();
    const operationTime = endTime - startTime;

    console.log(`Simultaneous operations completed in: ${operationTime.toFixed(2)}ms`);

    // Should handle concurrent operations within reasonable time
    expect(operationTime).toBeLessThan(1000);
  });

  // ============================================================================
  // Memory Leak Detection Tests
  // ============================================================================

  test('No memory leaks during long session with marker updates', async ({ page }) => {
    const vehicles = generateVehicles(500);

    await page.evaluate((data) => {
      (window as any).vehicleData = data;
      const event = new CustomEvent('loadMassiveDataset', { detail: data });
      window.dispatchEvent(event);
    }, vehicles);

    await page.waitForTimeout(2000);

    // Take baseline memory
    const baselineMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    console.log(`Baseline memory: ${formatBytes(baselineMemory)}`);

    // Run updates for 60 seconds
    const updateDuration = 60000;
    const updateInterval = 1000;
    const updates = updateDuration / updateInterval;

    for (let i = 0; i < updates; i++) {
      // Update marker positions
      await page.evaluate(() => {
        const data = (window as any).vehicleData;
        if (data) {
          // Simulate position updates
          const updates = data.slice(0, 50).map((v: any) => ({
            ...v,
            location: {
              ...v.location,
              lat: v.location.lat + (Math.random() - 0.5) * 0.001,
              lng: v.location.lng + (Math.random() - 0.5) * 0.001,
            },
          }));

          const event = new CustomEvent('updateMarkers', { detail: updates });
          window.dispatchEvent(event);
        }
      });

      await page.waitForTimeout(updateInterval);

      // Check memory every 10 seconds
      if (i % 10 === 0) {
        const currentMemory = await page.evaluate(() => {
          return (performance as any).memory?.usedJSHeapSize || 0;
        });

        console.log(`Memory at ${i} seconds: ${formatBytes(currentMemory)}`);
      }
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    await page.waitForTimeout(2000);

    // Take final memory reading
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    console.log(`Final memory: ${formatBytes(finalMemory)}`);

    const memoryGrowth = finalMemory - baselineMemory;
    console.log(`Total memory growth: ${formatBytes(memoryGrowth)}`);

    // Memory growth should be minimal (less than 20MB for this test)
    expect(memoryGrowth).toBeLessThan(20 * 1024 * 1024);
  });

  test('No memory leaks when adding and removing markers repeatedly', async ({ page }) => {
    const baselineMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    // Perform 50 cycles of add/remove
    for (let cycle = 0; cycle < 50; cycle++) {
      // Add 100 markers
      const vehicles = generateVehicles(100);
      await page.evaluate((data) => {
        (window as any).tempVehicles = data;
        const event = new CustomEvent('addMarkers', { detail: data });
        window.dispatchEvent(event);
      }, vehicles);

      await page.waitForTimeout(100);

      // Remove all markers
      await page.evaluate(() => {
        const event = new CustomEvent('clearMarkers');
        window.dispatchEvent(event);
        delete (window as any).tempVehicles;
      });

      await page.waitForTimeout(100);

      // Check memory every 10 cycles
      if (cycle % 10 === 9) {
        const currentMemory = await page.evaluate(() => {
          return (performance as any).memory?.usedJSHeapSize || 0;
        });

        console.log(`Memory after ${cycle + 1} cycles: ${formatBytes(currentMemory)}`);
      }
    }

    // Force GC and wait
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    await page.waitForTimeout(2000);

    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });

    const memoryGrowth = finalMemory - baselineMemory;
    console.log(`Memory growth after 50 add/remove cycles: ${formatBytes(memoryGrowth)}`);

    // Should not leak significant memory
    expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024); // Less than 10MB growth
  });

  // ============================================================================
  // FPS and Rendering Performance Tests
  // ============================================================================

  test('Maintain acceptable FPS during animations', async ({ page }) => {
    const vehicles = generateVehicles(500);

    await page.evaluate((data) => {
      (window as any).vehicleData = data;
      const event = new CustomEvent('loadMassiveDataset', { detail: data });
      window.dispatchEvent(event);
    }, vehicles);

    await page.waitForTimeout(2000);

    // Start animation (simulate moving vehicles)
    await page.evaluate(() => {
      let frame = 0;
      (window as any).animationFrames = [];

      function animate() {
        const start = performance.now();
        const data = (window as any).vehicleData;

        if (data && frame < 300) {
          // 5 seconds at 60fps
          // Update positions
          data.forEach((v: any) => {
            v.location.lat += (Math.random() - 0.5) * 0.0001;
            v.location.lng += (Math.random() - 0.5) * 0.0001;
          });

          const event = new CustomEvent('updateMarkers', { detail: data.slice(0, 50) });
          window.dispatchEvent(event);

          const end = performance.now();
          (window as any).animationFrames.push(end - start);

          frame++;
          requestAnimationFrame(animate);
        }
      }

      animate();
    });

    // Wait for animation to complete
    await page.waitForTimeout(6000);

    // Get FPS data
    const fpsData = await page.evaluate(() => {
      const frames = (window as any).animationFrames || [];
      const avgFrameTime = frames.reduce((a: number, b: number) => a + b, 0) / frames.length;
      const fps = 1000 / avgFrameTime;

      return { fps, avgFrameTime, frameCount: frames.length };
    });

    console.log(`Average FPS: ${fpsData.fps.toFixed(2)}`);
    console.log(`Average frame time: ${fpsData.avgFrameTime.toFixed(2)}ms`);
    console.log(`Total frames: ${fpsData.frameCount}`);

    // Should maintain at least 30 FPS
    expect(fpsData.fps).toBeGreaterThanOrEqual(FPS_THRESHOLD);
  });

  // ============================================================================
  // Performance Degradation Tests
  // ============================================================================

  test('Performance degradation over extended session', async ({ page }) => {
    const performanceLog: any[] = [];

    // Load initial dataset
    const vehicles = generateVehicles(1000);
    await page.evaluate((data) => {
      (window as any).vehicleData = data;
      const event = new CustomEvent('loadMassiveDataset', { detail: data });
      window.dispatchEvent(event);
    }, vehicles);

    // Run operations every minute for 10 minutes
    const testDuration = 10; // minutes
    const intervalMs = 60000; // 1 minute

    for (let minute = 0; minute < testDuration; minute++) {
      const startTime = performance.now();

      // Perform standard operations
      await page.evaluate(() => {
        // Zoom
        (window as any).mapInstance?.setZoom?.(Math.random() * 10 + 8);
      });

      await page.waitForTimeout(100);

      await page.evaluate(() => {
        // Pan
        const center = (window as any).mapInstance?.getCenter?.() || [30.4383, -84.2807];
        (window as any).mapInstance?.setCenter?.([
          center[0] + (Math.random() - 0.5) * 0.1,
          center[1] + (Math.random() - 0.5) * 0.1,
        ]);
      });

      await page.waitForTimeout(100);

      await page.evaluate(() => {
        // Filter
        const statuses = ['active', 'idle', 'charging'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        (window as any).mapInstance?.applyFilter?.('status', status);
      });

      const endTime = performance.now();
      const operationTime = endTime - startTime;

      const memory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      performanceLog.push({
        minute,
        operationTime,
        memory,
      });

      console.log(
        `Minute ${minute}: ${operationTime.toFixed(2)}ms, Memory: ${formatBytes(memory)}`
      );

      // Wait until next minute
      await page.waitForTimeout(intervalMs - (endTime - startTime));
    }

    // Analyze degradation
    const initialPerf = performanceLog[0].operationTime;
    const finalPerf = performanceLog[performanceLog.length - 1].operationTime;
    const degradation = ((finalPerf - initialPerf) / initialPerf) * 100;

    console.log(`Performance degradation: ${degradation.toFixed(2)}%`);

    // Performance should not degrade more than 50% over 10 minutes
    expect(degradation).toBeLessThan(50);
  });
});
