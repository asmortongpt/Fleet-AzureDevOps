/**
 * Performance Regression Testing
 *
 * Automated performance regression detection with:
 * - Baseline performance metrics
 * - Statistical regression detection
 * - CI/CD integration
 * - Alert thresholds and notifications
 *
 * Run with: npm run bench:regression
 */

import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  runBenchmark,
  compareToBaseline,
  createBaseline,
  BenchmarkResult,
} from './utils/performance-metrics';
import {
  generateVehicles,
  generateFacilities,
  generateCameras,
} from './utils/test-data-generator';

// ============================================================================
// Configuration
// ============================================================================

const BASELINE_FILE = path.join(__dirname, 'reports', 'baseline.json');
const RESULTS_FILE = path.join(__dirname, 'reports', 'latest-results.json');
const REGRESSION_THRESHOLD = 10; // 10% degradation triggers alert
const CRITICAL_THRESHOLD = 25; // 25% degradation fails CI

interface BaselineData {
  version: string;
  timestamp: number;
  benchmarks: Record<string, number>;
  metadata: {
    nodeVersion: string;
    platform: string;
    cpus: number;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Loads baseline data from file
 */
function loadBaseline(): BaselineData | null {
  try {
    if (fs.existsSync(BASELINE_FILE)) {
      const data = fs.readFileSync(BASELINE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load baseline:', error);
  }
  return null;
}

/**
 * Saves baseline data to file
 */
function saveBaseline(data: BaselineData): void {
  try {
    const dir = path.dirname(BASELINE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(data, null, 2));
    console.log(`✅ Baseline saved to ${BASELINE_FILE}`);
  } catch (error) {
    console.error('Failed to save baseline:', error);
  }
}

/**
 * Saves benchmark results
 */
function saveResults(results: BenchmarkResult[]): void {
  try {
    const dir = path.dirname(RESULTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const data = {
      timestamp: Date.now(),
      results,
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        cpus: require('os').cpus().length,
      },
    };

    fs.writeFileSync(RESULTS_FILE, JSON.stringify(data, null, 2));
    console.log(`✅ Results saved to ${RESULTS_FILE}`);
  } catch (error) {
    console.error('Failed to save results:', error);
  }
}

/**
 * Gets system metadata
 */
function getSystemMetadata() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    cpus: require('os').cpus().length,
  };
}

// ============================================================================
// Regression Test Suite
// ============================================================================

describe('Performance Regression Tests', () => {
  let currentResults: BenchmarkResult[] = [];

  test('Baseline: Map initialization', async () => {
    const result = await runBenchmark(
      'map-initialization',
      () => {
        const config = {
          center: [30.4383, -84.2807] as [number, number],
          zoom: 13,
          provider: 'leaflet',
        };
        return config;
      },
      { iterations: 50, warmup: 10 }
    );

    currentResults.push(result);
    console.log(`Map initialization: ${result.medianTime.toFixed(2)}ms`);
  });

  test('Baseline: Render 100 markers', async () => {
    const vehicles = generateVehicles(100);

    const result = await runBenchmark(
      'render-100-markers',
      () => {
        const markers = vehicles.map((v) => ({
          id: v.id,
          position: [v.location.lat, v.location.lng],
          type: 'vehicle',
        }));
        return markers;
      },
      { iterations: 50, warmup: 10 }
    );

    currentResults.push(result);
    console.log(`Render 100 markers: ${result.medianTime.toFixed(2)}ms`);
  });

  test('Baseline: Render 1000 markers', async () => {
    const vehicles = generateVehicles(1000);

    const result = await runBenchmark(
      'render-1000-markers',
      () => {
        const markers = vehicles.map((v) => ({
          id: v.id,
          position: [v.location.lat, v.location.lng],
          type: 'vehicle',
        }));
        return markers;
      },
      { iterations: 30, warmup: 5 }
    );

    currentResults.push(result);
    console.log(`Render 1000 markers: ${result.medianTime.toFixed(2)}ms`);
  });

  test('Baseline: Clustering 10000 markers', async () => {
    const vehicles = generateVehicles(10000);

    const result = await runBenchmark(
      'cluster-10000-markers',
      () => {
        const clusters = new Map();
        const gridSize = 0.05;

        vehicles.forEach((v) => {
          const gridX = Math.floor(v.location.lat / gridSize);
          const gridY = Math.floor(v.location.lng / gridSize);
          const key = `${gridX}-${gridY}`;

          if (!clusters.has(key)) {
            clusters.set(key, []);
          }
          clusters.get(key).push(v);
        });

        return clusters.size;
      },
      { iterations: 20, warmup: 5 }
    );

    currentResults.push(result);
    console.log(`Cluster 10000 markers: ${result.medianTime.toFixed(2)}ms`);
  });

  test('Baseline: Filter 10000 markers by status', async () => {
    const vehicles = generateVehicles(10000);

    const result = await runBenchmark(
      'filter-10000-markers',
      () => {
        const filtered = vehicles.filter((v) => v.status === 'active');
        return filtered.length;
      },
      { iterations: 50, warmup: 10 }
    );

    currentResults.push(result);
    console.log(`Filter 10000 markers: ${result.medianTime.toFixed(2)}ms`);
  });

  test('Baseline: Search 10000 markers', async () => {
    const vehicles = generateVehicles(10000);

    const result = await runBenchmark(
      'search-10000-markers',
      () => {
        const query = 'vehicle-500';
        const found = vehicles.find((v) => v.id === query);
        return found !== undefined;
      },
      { iterations: 100, warmup: 10 }
    );

    currentResults.push(result);
    console.log(`Search 10000 markers: ${result.medianTime.toFixed(2)}ms`);
  });

  test('Baseline: Update 100 marker positions', async () => {
    const vehicles = generateVehicles(100);

    const result = await runBenchmark(
      'update-100-positions',
      () => {
        const updates = vehicles.map((v) => ({
          ...v,
          location: {
            ...v.location,
            lat: v.location.lat + Math.random() * 0.001,
            lng: v.location.lng + Math.random() * 0.001,
          },
        }));
        return updates.length;
      },
      { iterations: 100, warmup: 10 }
    );

    currentResults.push(result);
    console.log(`Update 100 positions: ${result.medianTime.toFixed(2)}ms`);
  });

  test('Baseline: Bounds calculation for 1000 markers', async () => {
    const vehicles = generateVehicles(1000);

    const result = await runBenchmark(
      'bounds-1000-markers',
      () => {
        let minLat = Infinity;
        let maxLat = -Infinity;
        let minLng = Infinity;
        let maxLng = -Infinity;

        vehicles.forEach((v) => {
          minLat = Math.min(minLat, v.location.lat);
          maxLat = Math.max(maxLat, v.location.lat);
          minLng = Math.min(minLng, v.location.lng);
          maxLng = Math.max(maxLng, v.location.lng);
        });

        return { minLat, maxLat, minLng, maxLng };
      },
      { iterations: 100, warmup: 10 }
    );

    currentResults.push(result);
    console.log(`Bounds calculation: ${result.medianTime.toFixed(2)}ms`);
  });

  test('Compare against baseline and detect regressions', () => {
    const baseline = loadBaseline();

    if (!baseline) {
      // No baseline exists - create one
      console.log('📊 No baseline found. Creating new baseline...');

      const baselineData: BaselineData = {
        version: '1.0.0',
        timestamp: Date.now(),
        benchmarks: createBaseline(currentResults),
        metadata: getSystemMetadata(),
      };

      saveBaseline(baselineData);
      saveResults(currentResults);

      console.log('\n✅ Baseline created successfully!');
      console.log('Run this test again to compare against baseline.\n');

      return;
    }

    // Compare against baseline
    console.log('\n📊 Comparing against baseline...\n');

    const comparison = compareToBaseline(currentResults, baseline.benchmarks);

    let hasRegression = false;
    let hasCriticalRegression = false;
    const regressions: any[] = [];

    console.log('┌─────────────────────────────────────┬──────────────┬──────────────┬────────────┐');
    console.log('│ Benchmark                           │ Current (ms) │ Baseline (ms)│ Change (%) │');
    console.log('├─────────────────────────────────────┼──────────────┼──────────────┼────────────┤');

    comparison.forEach((comp) => {
      const icon = comp.regression
        ? comp.changePercent > CRITICAL_THRESHOLD
          ? '🔴'
          : '⚠️'
        : comp.changePercent < -5
        ? '✅'
        : '  ';

      const changeStr = comp.changePercent > 0 ? `+${comp.changePercent.toFixed(1)}%` : `${comp.changePercent.toFixed(1)}%`;

      console.log(
        `│ ${icon} ${comp.benchmark.padEnd(32)} │ ${comp.current.toFixed(2).padStart(12)} │ ${comp.baseline.toFixed(2).padStart(12)} │ ${changeStr.padStart(10)} │`
      );

      if (comp.regression) {
        hasRegression = true;
        regressions.push(comp);

        if (comp.changePercent > CRITICAL_THRESHOLD) {
          hasCriticalRegression = true;
        }
      }
    });

    console.log('└─────────────────────────────────────┴──────────────┴──────────────┴────────────┘\n');

    // Save current results
    saveResults(currentResults);

    // Print summary
    if (hasCriticalRegression) {
      console.log('🔴 CRITICAL PERFORMANCE REGRESSION DETECTED!\n');
      console.log(`   ${regressions.length} benchmark(s) show regression > ${CRITICAL_THRESHOLD}%\n`);

      regressions.forEach((reg) => {
        if (reg.changePercent > CRITICAL_THRESHOLD) {
          console.log(`   - ${reg.benchmark}: ${reg.changePercent.toFixed(1)}% slower`);
        }
      });

      console.log('\n');
      expect(hasCriticalRegression).toBe(false); // Fail CI
    } else if (hasRegression) {
      console.log(`⚠️  Performance regression detected in ${regressions.length} benchmark(s):\n`);

      regressions.forEach((reg) => {
        console.log(`   - ${reg.benchmark}: ${reg.changePercent.toFixed(1)}% slower`);
      });

      console.log('\n   Consider investigating these regressions.\n');
      // Don't fail CI for minor regressions, just warn
    } else {
      console.log('✅ No performance regressions detected!\n');

      const improvements = comparison.filter((c) => c.changePercent < -5);
      if (improvements.length > 0) {
        console.log(`🎉 Performance improvements in ${improvements.length} benchmark(s):\n`);
        improvements.forEach((imp) => {
          console.log(`   - ${imp.benchmark}: ${Math.abs(imp.changePercent).toFixed(1)}% faster`);
        });
        console.log('\n');
      }
    }

    // Export comparison report
    const reportPath = path.join(__dirname, 'reports', 'regression-report.json');
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          timestamp: Date.now(),
          baselineVersion: baseline.version,
          baselineTimestamp: baseline.timestamp,
          comparison,
          hasRegression,
          hasCriticalRegression,
          regressions,
        },
        null,
        2
      )
    );

    console.log(`📄 Detailed report saved to ${reportPath}\n`);
  });
});

// ============================================================================
// CLI Support for Creating/Updating Baseline
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--create-baseline')) {
    console.log('Creating new baseline...\n');
    // This would run the benchmarks and create a baseline
    // In practice, this is handled by the test suite above
  } else if (args.includes('--help')) {
    console.log(`
Performance Regression Testing

Usage:
  npm run bench:regression              Run regression tests
  npm run bench:regression -- --help    Show this help

The first run will create a baseline.
Subsequent runs will compare against the baseline.

Thresholds:
  Warning:  ${REGRESSION_THRESHOLD}% degradation (logged but doesn't fail CI)
  Critical: ${CRITICAL_THRESHOLD}% degradation (fails CI)

Files:
  Baseline: ${BASELINE_FILE}
  Results:  ${RESULTS_FILE}
    `);
  }
}
