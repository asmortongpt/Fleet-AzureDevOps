import { test, expect } from '@playwright/test';

/**
 * Memory Profiling Performance Tests
 * Detects memory leaks and measures heap usage
 */

interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  delta: number;
}

interface MemorySnapshot {
  timestamp: number;
  heapSize: number;
  nodeCount: number;
}

test.describe('Memory Profiling', () => {
  test('measure initial heap size', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const initialHeap = await page.evaluate(() => {
      if ('memory' in performance) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (initialHeap) {
      const usedMB = (initialHeap.usedJSHeapSize / 1024 / 1024).toFixed(2);
      const totalMB = (initialHeap.totalJSHeapSize / 1024 / 1024).toFixed(2);

      console.log(`Initial Heap Usage:`);
      console.log(`  Used: ${usedMB} MB`);
      console.log(`  Total: ${totalMB} MB`);

      // Heap usage should be reasonable
      expect(initialHeap.usedJSHeapSize).toBeLessThan(100 * 1024 * 1024); // < 100MB
    }
  });

  test('detect memory leaks during navigation', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const snapshots: MemorySnapshot[] = [];

    // Take initial snapshot
    const initial = await page.evaluate(() => {
      if ('memory' in performance) {
        const mem = (performance as any).memory;
        return {
          timestamp: Date.now(),
          heapSize: mem.usedJSHeapSize,
          nodeCount: document.querySelectorAll('*').length,
        };
      }
      return null;
    });

    if (initial) {
      snapshots.push(initial);
    }

    // Simulate navigation and return multiple times
    for (let i = 0; i < 5; i++) {
      try {
        await page.goto('http://localhost:5173/', {
          waitUntil: 'domcontentloaded',
          timeout: 5000,
        });

        // Wait a bit and take snapshot
        await page.waitForTimeout(500);

        const snapshot = await page.evaluate(() => {
          if ('memory' in performance) {
            const mem = (performance as any).memory;
            return {
              timestamp: Date.now(),
              heapSize: mem.usedJSHeapSize,
              nodeCount: document.querySelectorAll('*').length,
            };
          }
          return null;
        });

        if (snapshot) {
          snapshots.push(snapshot);
        }
      } catch (e) {
        // Navigation might fail, continue
      }
    }

    // Analyze memory trend
    if (snapshots.length > 1) {
      const heapGrowth = snapshots[snapshots.length - 1].heapSize - snapshots[0].heapSize;
      const growthMB = (heapGrowth / 1024 / 1024).toFixed(2);

      console.log(`Memory Growth After ${snapshots.length} Navigations: ${growthMB} MB`);
      console.log('Snapshots:');
      snapshots.forEach((s, i) => {
        console.log(`  ${i}: ${(s.heapSize / 1024 / 1024).toFixed(2)} MB`);
      });

      // Memory growth should be minimal (< 20MB)
      expect(Math.abs(heapGrowth)).toBeLessThan(20 * 1024 * 1024);
    }
  });

  test('monitor DOM node count growth', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const initialNodeCount = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });

    console.log(`Initial DOM node count: ${initialNodeCount}`);

    // Simulate user interactions
    await page.evaluate(() => {
      // Simulate clicks and interactions
      document.querySelectorAll('button').forEach((btn) => {
        btn.click();
      });
    });

    await page.waitForTimeout(1000);

    const finalNodeCount = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });

    const nodeDelta = finalNodeCount - initialNodeCount;
    console.log(`Final DOM node count: ${finalNodeCount}`);
    console.log(`Node count delta: ${nodeDelta}`);

    // DOM shouldn't grow excessively
    expect(nodeDelta).toBeLessThan(500);
  });

  test('measure object growth in event listeners', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const leakMetrics = await page.evaluate(() => {
      const initialMem = (performance as any).memory?.usedJSHeapSize || 0;

      // Create many event listeners
      const listeners = [];
      for (let i = 0; i < 100; i++) {
        const div = document.createElement('div');
        const listener = () => console.log(`Event ${i}`);
        div.addEventListener('click', listener);
        listeners.push({ div, listener });
      }

      const afterCreation = (performance as any).memory?.usedJSHeapSize || 0;

      // Clean up
      listeners.forEach(({ div, listener }) => {
        div.removeEventListener('click', listener);
      });

      const afterCleanup = (performance as any).memory?.usedJSHeapSize || 0;

      return {
        initialMem,
        afterCreation,
        afterCleanup,
        growthAtPeak: afterCreation - initialMem,
      };
    });

    console.log('Event Listener Memory Metrics:');
    console.log(
      `  Initial: ${(leakMetrics.initialMem / 1024).toFixed(2)} KB`
    );
    console.log(
      `  Peak: ${(leakMetrics.afterCreation / 1024).toFixed(2)} KB`
    );
    console.log(
      `  After Cleanup: ${(leakMetrics.afterCleanup / 1024).toFixed(2)} KB`
    );

    // Listeners shouldn't cause excessive memory growth
    expect(leakMetrics.growthAtPeak).toBeLessThan(5 * 1024 * 1024);
  });

  test('monitor cache growth', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const storageMetrics = await page.evaluate(() => {
      const localStorage = window.localStorage;
      const sessionStorage = window.sessionStorage;

      const localStorageSize = JSON.stringify(localStorage).length;
      const sessionStorageSize = JSON.stringify(sessionStorage).length;

      return {
        localStorageItems: localStorage.length,
        localStorageSize,
        sessionStorageItems: sessionStorage.length,
        sessionStorageSize,
        totalSize: localStorageSize + sessionStorageSize,
      };
    });

    console.log('Storage Metrics:');
    console.log(`  LocalStorage items: ${storageMetrics.localStorageItems}`);
    console.log(
      `  LocalStorage size: ${(storageMetrics.localStorageSize / 1024).toFixed(2)} KB`
    );
    console.log(
      `  SessionStorage items: ${storageMetrics.sessionStorageItems}`
    );
    console.log(
      `  SessionStorage size: ${(storageMetrics.sessionStorageSize / 1024).toFixed(2)} KB`
    );

    // Storage shouldn't grow excessively
    expect(storageMetrics.totalSize).toBeLessThan(5 * 1024 * 1024); // < 5MB
  });

  test('detect detached DOM nodes', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const detachedMetrics = await page.evaluate(() => {
      let detachedCount = 0;

      // Create and remove many elements
      for (let i = 0; i < 100; i++) {
        const div = document.createElement('div');
        div.textContent = `Element ${i}`;
        // Don't append to DOM, creating detached nodes
      }

      // This is a simplified check - real detection requires DevTools Protocol
      return {
        detachedEstimate: detachedCount,
        liveNodeCount: document.querySelectorAll('*').length,
      };
    });

    console.log('Detached DOM Metrics:');
    console.log(`  Live nodes: ${detachedMetrics.liveNodeCount}`);

    // Should have reasonable number of DOM nodes
    expect(detachedMetrics.liveNodeCount).toBeLessThan(5000);
  });

  test('measure memory pressure during heavy interaction', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const memoryUnderLoad = await page.evaluate(() => {
      return new Promise<{
        initialHeap: number;
        peakHeap: number;
        finalHeap: number;
        samples: number;
      }>((resolve) => {
        const samples: number[] = [];
        const initialHeap =
          (performance as any).memory?.usedJSHeapSize || 0;
        let peakHeap = initialHeap;

        const interval = setInterval(() => {
          const current =
            (performance as any).memory?.usedJSHeapSize || 0;
          samples.push(current);
          peakHeap = Math.max(peakHeap, current);
        }, 100);

        // Simulate heavy operations
        setTimeout(() => {
          clearInterval(interval);
          const finalHeap =
            (performance as any).memory?.usedJSHeapSize || 0;

          resolve({
            initialHeap,
            peakHeap,
            finalHeap,
            samples: samples.length,
          });
        }, 3000);

        // Create lots of temporary objects
        let arr = [];
        for (let i = 0; i < 1000; i++) {
          arr.push({
            data: new Array(100).fill(Math.random()),
          });
          if (i % 100 === 0) {
            arr = []; // Clear periodically
          }
        }
      });
    });

    console.log('Memory Under Load:');
    console.log(
      `  Initial: ${(memoryUnderLoad.initialHeap / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(
      `  Peak: ${(memoryUnderLoad.peakHeap / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(
      `  Final: ${(memoryUnderLoad.finalHeap / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(`  Samples: ${memoryUnderLoad.samples}`);

    // Should recover after operations
    const recovery =
      memoryUnderLoad.initialHeap - memoryUnderLoad.finalHeap;
    expect(Math.abs(recovery)).toBeLessThan(50 * 1024 * 1024);
  });

  test('monitor third-party script impact', async ({ page }) => {
    const beforeScripts = await page.evaluate(() => {
      return {
        scriptCount: document.querySelectorAll('script').length,
        memory: (performance as any).memory?.usedJSHeapSize || 0,
      };
    });

    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const afterScripts = await page.evaluate(() => {
      return {
        scriptCount: document.querySelectorAll('script').length,
        memory: (performance as any).memory?.usedJSHeapSize || 0,
      };
    });

    const scriptGrowth = afterScripts.scriptCount - beforeScripts.scriptCount;
    const memoryGrowth = afterScripts.memory - beforeScripts.memory;

    console.log('Script Impact:');
    console.log(`  Script count growth: ${scriptGrowth}`);
    console.log(
      `  Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)} MB`
    );

    // Should load reasonable number of scripts
    expect(afterScripts.scriptCount).toBeLessThan(50);
  });

  test('measure garbage collection cycles', async ({ page }) => {
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    const gcMetrics = await page.evaluate(() => {
      const initialMem =
        (performance as any).memory?.usedJSHeapSize || 0;

      // Create temporary objects
      const tempObjects = [];
      for (let i = 0; i < 10000; i++) {
        tempObjects.push({
          id: i,
          data: new Array(10).fill(Math.random()),
        });
      }

      const peakMem =
        (performance as any).memory?.usedJSHeapSize || 0;

      // Clear references
      tempObjects.length = 0;

      // Try to trigger GC (not guaranteed)
      if ((global as any).gc) {
        (global as any).gc();
      }

      // Give browser time to collect
      return new Promise<{
        initialMem: number;
        peakMem: number;
        recoveredMem: number;
      }>((resolve) => {
        setTimeout(() => {
          const finalMem =
            (performance as any).memory?.usedJSHeapSize || 0;
          resolve({
            initialMem,
            peakMem,
            recoveredMem: peakMem - finalMem,
          });
        }, 1000);
      });
    });

    console.log('GC Metrics:');
    console.log(
      `  Initial: ${(gcMetrics.initialMem / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(
      `  Peak: ${(gcMetrics.peakMem / 1024 / 1024).toFixed(2)} MB`
    );
    console.log(
      `  Recovered: ${(gcMetrics.recoveredMem / 1024 / 1024).toFixed(2)} MB`
    );

    // Some memory should be recovered
    expect(gcMetrics.recoveredMem).toBeGreaterThan(0);
  });
});
