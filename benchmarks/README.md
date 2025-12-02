# Map Components Performance Benchmarks

> Comprehensive performance testing suite for Fleet Management map components

## Overview

This directory contains performance benchmarks, load tests, and monitoring tools for map components. The suite provides automated testing, regression detection, and actionable insights to maintain optimal performance.

## Quick Start

```bash
# Run all benchmarks
npm run bench

# Run benchmarks with live updates
npm run bench:watch

# Run regression tests (compares against baseline)
npm run bench:regression

# Generate HTML report
npm run bench:report

# Check performance budget
npm run bench:budget

# Run complete suite (benchmarks + regression + report + budget check)
npm run bench:all

# Run load/stress tests
npm run test:load:maps
```

## Directory Structure

```
benchmarks/
├── map-components.bench.ts       # Main benchmark suite
├── regression-test.ts             # Performance regression detection
├── check-budget.ts                # Performance budget validation
├── utils/
│   ├── test-data-generator.ts    # Test data generation utilities
│   ├── performance-metrics.ts     # Performance measurement tools
│   └── report-generator.ts        # HTML report generation
└── reports/                       # Generated reports (gitignored)
    ├── baseline.json              # Performance baseline
    ├── latest-results.json        # Latest benchmark results
    ├── regression-report.json     # Regression analysis
    ├── budget-report.json         # Budget validation report
    └── *.html                     # HTML reports
```

## Benchmark Categories

### 1. Map Initialization
Tests map initialization time with various configurations:
- Empty map
- Map with 10, 100, 1000 markers
- With/without clustering
- Different providers (Leaflet, Google, Mapbox)

### 2. Marker Rendering
Benchmarks marker rendering performance:
- 10, 100, 1,000, 10,000 markers
- Position updates
- Mixed marker types (vehicles, facilities, cameras)

### 3. Map Provider Switching
Measures overhead of switching between providers:
- Leaflet → Google Maps
- Google Maps → Mapbox
- Marker preservation during switch

### 4. Tile Loading
Tests tile loading and caching:
- Visible tile calculation
- Tile cache lookup
- Adjacent tile preloading

### 5. Clustering Performance
Benchmarks clustering algorithms:
- Grid-based clustering (100, 1000, 10000 markers)
- Dynamic cluster splitting
- Incremental updates

### 6. Filter Operations
Tests filter performance:
- Single criterion filter
- Multiple criteria filter
- Location-based filter
- Visibility toggling

### 7. Search Operations
Measures search performance:
- Linear search
- Indexed search
- Fuzzy search
- Spatial search with sorting

## Performance Baselines

Benchmark results are compared against baselines to detect regressions:

```bash
# First run creates baseline
npm run bench:regression

# Subsequent runs compare against baseline
npm run bench:regression
```

### Baseline Management

```bash
# Create new baseline (overwrites existing)
rm benchmarks/reports/baseline.json
npm run bench:regression

# Baseline is automatically updated on main branch via CI/CD
```

### Regression Thresholds

- **Warning:** 10% performance degradation
- **Critical:** 25% performance degradation (fails CI)

## Performance Budget

Performance budgets define acceptable limits for various metrics:

```bash
# Check if benchmarks meet performance budget
npm run bench:budget
```

Budget configuration: [`performance-budget.json`](../performance-budget.json)

### Budget Categories

1. **Web Vitals:** LCP, FID, CLS, TTFB, INP
2. **Map Initialization:** Empty map, 100/1000/10000 markers
3. **Marker Rendering:** 10/100/1000/10000 markers
4. **Interactions:** Zoom, pan, filter, search
5. **Clustering:** Various dataset sizes
6. **Memory:** Heap size, memory leaks
7. **Rendering:** FPS, frame time
8. **Bundle Size:** Total JS, map components, vendor
9. **Network:** Tile loading, requests, transfer size

## Load & Stress Tests

Comprehensive load testing using Playwright:

```bash
npm run test:load:maps
```

### Test Scenarios

1. **Massive Datasets**
   - 100,000+ markers
   - Clustered rendering
   - Memory usage monitoring

2. **Rapid Interactions**
   - Rapid zoom/pan operations
   - Rapid filter changes
   - Simultaneous operations

3. **Memory Leak Detection**
   - Long session monitoring
   - Repeated add/remove operations
   - Memory growth analysis

4. **Rendering Performance**
   - FPS during animations
   - Frame time measurement
   - Dropped frame detection

5. **Performance Degradation**
   - Extended session testing
   - Performance over time

## Real User Monitoring (RUM)

Track actual user performance in production:

```typescript
import { initRUM } from '@/utils/rum';

// Initialize RUM
const rum = initRUM({
  endpoint: '/api/rum',
  userId: currentUser.id,
});

// Track map operations
rum.trackMapInit(duration, 'mapbox');
rum.trackMarkerRender(count, duration, clustered);
rum.trackMapInteraction('zoom', duration);
```

### Monitored Metrics

- **Core Web Vitals:** LCP, FID, CLS, TTFB, INP
- **Map Metrics:** Init time, render time, interaction time
- **User Context:** Device, browser, location, connection
- **Custom Events:** Map provider, marker count, clustering state

See: [`src/utils/rum.ts`](../src/utils/rum.ts)

## HTML Reports

Generate beautiful HTML reports with charts:

```bash
npm run bench:report
```

Reports include:
- Performance summary
- Interactive charts (median times, comparisons, trends)
- Detailed results table
- Before/after comparisons
- Historical trends

View latest report: `benchmarks/reports/latest.html`

## CI/CD Integration

Benchmarks run automatically on every PR:

### GitHub Actions Workflow

- Runs on PR to `main` or `develop`
- Compares against baseline
- Posts results as PR comment
- Fails CI on critical regressions
- Generates and uploads reports

Configuration: [`.github/workflows/performance-benchmarks.yml`](../.github/workflows/performance-benchmarks.yml)

### PR Comments

Automated PR comments include:
- Regression summary
- Top 5 performance changes
- All benchmark results (expandable)
- Links to detailed reports

### Baseline Updates

Baselines are automatically updated when merging to `main`:
- Prevents baseline drift
- Ensures consistent comparisons
- Tracks performance over time

## Writing Custom Benchmarks

### Basic Benchmark

```typescript
import { bench, describe } from 'vitest';

describe('Custom Benchmark', () => {
  bench('my operation', () => {
    // Code to benchmark
    const result = performOperation();
    return result;
  });
});
```

### Advanced Benchmark with Metrics

```typescript
import { runBenchmark } from './utils/performance-metrics';

const result = await runBenchmark(
  'operation-name',
  () => {
    // Operation to benchmark
  },
  {
    iterations: 100,
    warmup: 10,
    minTime: 1000,
    metadata: { markerCount: 1000 },
  }
);

console.log(`Median: ${result.medianTime}ms`);
console.log(`Ops/sec: ${result.opsPerSecond}`);
```

### Memory Measurement

```typescript
import { measureMemory } from './utils/performance-metrics';

const { result, memoryDelta, before, after } = await measureMemory(() => {
  // Memory-intensive operation
  const markers = createManyMarkers();
  return markers;
});

console.log(`Memory used: ${memoryDelta / 1024 / 1024}MB`);
```

## Test Data Generation

Generate realistic test data for benchmarks:

```typescript
import {
  generateVehicles,
  generateFacilities,
  generateCameras,
  generateDataset,
  BENCHMARK_DATASETS,
} from './utils/test-data-generator';

// Generate specific data
const vehicles = generateVehicles(1000);
const facilities = generateFacilities(50);

// Use predefined datasets
const { vehicles, facilities, cameras } = BENCHMARK_DATASETS.large;

// Generate custom dataset
const dataset = generateDataset({
  vehicles: 5000,
  facilities: 100,
  cameras: 200,
});
```

## Optimization Guide

See comprehensive optimization guide: [docs/PERFORMANCE_OPTIMIZATION.md](../docs/PERFORMANCE_OPTIMIZATION.md)

Key topics:
- Common bottlenecks
- Clustering strategies
- Lazy loading techniques
- Memory optimization
- Rendering performance
- Network optimization
- Best practices checklist

## Performance Targets

### Marker Count Recommendations

| Markers | Init Time | Memory | FPS | Clustering |
|---------|-----------|--------|-----|------------|
| < 100   | < 500ms   | < 50MB | 60  | Optional   |
| 100-500 | < 2s      | < 100MB| 45+ | Yes        |
| 500-5K  | < 5s      | < 200MB| 30+ | Required   |
| 5K+     | < 15s     | < 500MB| 30+ | Required   |

### Core Web Vitals Targets

- **LCP:** < 2.5s (good), < 4s (needs improvement)
- **FID:** < 100ms (good), < 300ms (needs improvement)
- **CLS:** < 0.1 (good), < 0.25 (needs improvement)
- **TTFB:** < 800ms (good), < 1800ms (needs improvement)
- **INP:** < 200ms (good), < 500ms (needs improvement)

## Troubleshooting

### Benchmarks Running Slowly

```bash
# Reduce iterations for faster development feedback
vitest bench --run --reporter=verbose
```

### Inconsistent Results

- Close other applications
- Run on dedicated hardware
- Use `--isolate` flag
- Increase warmup iterations

### Memory Profiling

```bash
# Run with Node.js garbage collection exposed
node --expose-gc node_modules/.bin/vitest bench
```

### Debugging Failing Tests

```bash
# Run specific benchmark file
vitest bench benchmarks/map-components.bench.ts

# Run with verbose output
vitest bench --reporter=verbose

# Run in watch mode for development
npm run bench:watch
```

## Best Practices

1. **Warm Up:** Always include warmup iterations
2. **Iterations:** Run enough iterations for statistical significance (100+ for fast ops)
3. **Isolation:** Avoid side effects between benchmark runs
4. **Cleanup:** Properly cleanup resources (event listeners, DOM elements)
5. **Realistic Data:** Use realistic test data from generators
6. **Context:** Include metadata about test conditions
7. **Baselines:** Establish baselines before optimization work
8. **Regression:** Run regression tests before merging
9. **Budget:** Check budget compliance in CI/CD
10. **Monitor:** Track real user metrics in production

## Contributing

When adding new benchmarks:

1. Add benchmark to appropriate category in `map-components.bench.ts`
2. Update performance budget if needed
3. Run full suite to ensure no regressions
4. Update documentation

## Resources

- [Vitest Benchmarking](https://vitest.dev/guide/features.html#benchmarking)
- [Performance Budget](../performance-budget.json)
- [Optimization Guide](../docs/PERFORMANCE_OPTIMIZATION.md)
- [RUM Implementation](../src/utils/rum.ts)
- [CI/CD Workflow](../.github/workflows/performance-benchmarks.yml)

## Support

For questions or issues:
- **Email:** performance@fleetmanagement.com
- **Slack:** #performance-optimization
- **Documentation:** [Performance Wiki](https://wiki.fleetmanagement.com/performance)

---

**Last Updated:** November 16, 2025
**Maintainer:** Fleet Management Performance Team
