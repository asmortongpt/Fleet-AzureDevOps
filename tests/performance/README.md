# Frontend Performance Testing Suite

Comprehensive frontend performance testing using Playwright and Web Vitals.

## Quick Start

```bash
# Run all frontend performance tests
npm run test:performance

# Run specific test suites
npm run test:performance -- tests/performance/web-vitals.spec.ts
npm run test:performance -- tests/performance/component-rendering.spec.ts
npm run test:performance -- tests/performance/memory-profiling.spec.ts

# Watch mode for development
npm run test:watch -- tests/performance/

# With coverage
npm run test:coverage -- tests/performance/
```

## Test Suites

### 1. Web Vitals Testing (`web-vitals.spec.ts`)

Measures Google's Core Web Vitals and related performance metrics.

**Metrics Measured:**
- **LCP** (Largest Contentful Paint): Time when main content becomes visible
  - Target: < 2.5 seconds
  - Warning: 2.5-4s
  - Poor: > 4s

- **FID** (First Input Delay): Responsiveness to first user interaction
  - Target: < 100ms
  - Warning: 100-300ms
  - Poor: > 300ms

- **CLS** (Cumulative Layout Shift): Visual stability of page
  - Target: < 0.1
  - Warning: 0.1-0.25
  - Poor: > 0.25

- **FCP** (First Contentful Paint): Time of first pixels visible
  - Target: < 1.8 seconds
  - Warning: 1.8-3s
  - Poor: > 3s

- **TTFB** (Time to First Byte): Server response time
  - Target: < 600ms
  - Warning: 600-1000ms
  - Poor: > 1000ms

**Tests Included:**
- LCP measurement with PerformanceObserver
- FCP timing from navigation
- CLS tracking with LayoutShift entries
- TTFB from navigation timing
- Full navigation timing breakdown (DNS, TCP, request, response)
- Resource timing analysis (top 10 slowest resources)
- Initial page load performance
- Paint timing measurements
- Long task detection (> 50ms)

**Sample Output:**
```
Web Vitals Performance
  ✓ measure LCP (Largest Contentful Paint)
    LCP: 1240.50ms
  ✓ measure FCP (First Contentful Paint)
    FCP: 850.30ms
  ✓ measure CLS (Cumulative Layout Shift)
    CLS: 0.045
  ✓ measure TTFB (Time to First Byte)
  ✓ measure navigation timing metrics
  ✓ measure resource timing
  ✓ measure initial page load performance
  ✓ measure paint timing
  ✓ monitor long tasks
```

### 2. Component Rendering Tests (`component-rendering.spec.ts`)

Tests React component rendering performance and interactivity.

**Metrics Measured:**
- **TTI** (Time to Interactive): When page can respond to user input
  - Target: < 8 seconds

- **Initial Render**: First component render time
  - Target: < 5 seconds

- **Table Rendering**: Large table with 1000 rows
  - Target: < 2 seconds
  - Measures: DOM creation and rendering performance

- **Re-render Latency**: Time for component to update
  - Target: < 1 second
  - Simulates: Data change updates

- **Interaction Responsiveness**: Click event response time
  - Target: < 100ms
  - Measures: Event handler execution

- **Dropdown Speed**: Time to open select menu
  - Target: < 200ms
  - Tests: 100-item dropdown

- **Modal Opening**: Dialog/modal display time
  - Target: < 300ms

- **Animation FPS**: Frame rate during animations
  - Target: > 30 FPS (minimum), > 50 FPS (good)
  - Detects: Dropped frames

- **Form Input Latency**: Response to keyboard input
  - Target: < 100ms

- **Page Navigation**: Time to navigate between pages
  - Target: < 5 seconds

- **Scroll Jank**: Jank events during scrolling
  - Target: < 5 jank events in test period

**Tests Included:**
- TTI measurement
- Dashboard render time
- 1000-row table rendering
- List re-renders on data change
- Button click responsiveness
- Select dropdown opening
- Modal dialog opening
- Animation frame rate and dropped frame detection
- Form input responsiveness
- Page navigation timing
- Scroll jank detection

### 3. Memory Profiling (`memory-profiling.spec.ts`)

Detects memory leaks and tracks memory usage patterns.

**Metrics Measured:**
- **Heap Usage**: JavaScript memory consumption
  - Baseline: 20-30 MB initial
  - Target: < 100 MB

- **Memory Growth**: Growth during operations
  - Target: < 20 MB per 5 navigations
  - Tests for leaks

- **DOM Node Count**: Total DOM elements
  - Baseline: 1000-2000 initially
  - Target: < 5000 (no unbounded growth)

- **Event Listener Impact**: Memory from listeners
  - 100 listeners test
  - Target: < 5 MB growth

- **Cache Growth**: LocalStorage and SessionStorage
  - Target: < 5 MB total

- **Detached DOM Nodes**: Nodes not in tree
  - Target: < 100

- **Memory Under Load**: Heap usage during heavy ops
  - Measures: Peak vs baseline
  - Recovery: Memory reclaimed by GC

- **GC Cycles**: Garbage collection effectiveness
  - Measures: Memory before/after GC
  - Target: > 50% recovery

**Tests Included:**
- Initial heap measurement
- Navigation cycle memory tracking
- DOM node growth monitoring
- Event listener memory impact
- Storage size tracking
- Detached DOM detection
- Heavy operation memory pressure
- Third-party script impact
- GC cycle effectiveness
- Memory statistics report

**Memory Baselines:**
```
Initial Heap: 20-30 MB
After Navigation (5x): < 10 MB growth
DOM Nodes: 1000-2000
Storage Usage: < 1 MB
Detached Nodes: 0
```

## Configuration

### Test Server

Tests require the Vite dev server running:

```bash
# Terminal 1 - Start dev server
npm run dev

# Terminal 2 - Run tests
npm run test:performance
```

The server runs on `http://localhost:5173` by default.

### Environment Variables

```bash
# Set API URL for tests
VITE_API_URL=http://localhost:3001

# Set headless mode
PLAYWRIGHT_HEADLESS=true

# Set browser type
PLAYWRIGHT_BROWSER=chromium

# Debugging
DEBUG=pw:api
```

### Playwright Configuration

Tests use Playwright's webKit, firefox, and chromium browsers by default in headed mode for observation.

Configure in `playwright.config.ts`:

```typescript
{
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
  },
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
}
```

## Running Tests

### Development Mode

```bash
# Run with headed browser (see what's happening)
npm run test:performance

# Watch mode (re-runs on file change)
npm run test:watch -- tests/performance/
```

### CI Mode

```bash
# Headless mode for CI/CD
PLAYWRIGHT_HEADLESS=true npm run test:performance

# With artifacts
npm run test:performance -- --reporter=html
```

### Single Test Suite

```bash
npm run test:performance -- tests/performance/web-vitals.spec.ts
npm run test:performance -- tests/performance/component-rendering.spec.ts
npm run test:performance -- tests/performance/memory-profiling.spec.ts
```

### Single Test

```bash
npm run test:performance -- -t "measure LCP"
npm run test:performance -- -t "should handle 1000 rows"
npm run test:performance -- -t "should not leak memory"
```

## Performance Targets

### Web Vitals (Recommended by Google)

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | < 2.5s | 2.5-4s | > 4s |
| FID | < 100ms | 100-300ms | > 300ms |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |
| FCP | < 1.8s | 1.8-3s | > 3s |
| TTFB | < 600ms | 600-1000ms | > 1000ms |

### Component Performance

| Component | Good | Acceptable | Poor |
|-----------|------|-----------|------|
| Initial Render | < 2s | 2-5s | > 5s |
| Re-render | < 100ms | 100-500ms | > 500ms |
| Table (1000 rows) | < 500ms | 500-1000ms | > 1000ms |
| Animation FPS | > 50 | 30-50 | < 30 |

### Memory Performance

| Metric | Good | Acceptable | Poor |
|--------|------|-----------|------|
| Initial Heap | < 30 MB | 30-100 MB | > 100 MB |
| Memory Growth (nav) | < 5 MB | 5-20 MB | > 20 MB |
| DOM Nodes | < 2000 | 2000-5000 | > 5000 |

## Debugging Performance Issues

### Using DevTools

```bash
# Run with inspector enabled
PLAYWRIGHT_DEBUG=1 npm run test:performance

# Slow motion for observation
PLAYWRIGHT_SLOWMO=3000 npm run test:performance
```

### Collecting Performance Traces

Tests can be modified to collect Chrome DevTools performance traces:

```typescript
await page.startTracing({ path: 'trace.zip' });
// ... test code ...
await page.stopTracing();
```

View trace in Chrome DevTools > More Tools > Performance > Load trace.

### Heap Snapshots

Heap snapshots can be captured:

```typescript
const snapshot = await page.evaluate(() => {
  return {
    heap: performance.memory.usedJSHeapSize,
    nodes: document.querySelectorAll('*').length,
  };
});
```

### Browser Console Logs

```typescript
page.on('console', (msg) => {
  console.log(`[${msg.type()}] ${msg.text()}`);
});
```

## Common Issues

### Tests Timing Out

**Problem:** Tests take too long or timeout

**Solutions:**
```bash
# Increase timeout
npm run test:performance -- --testTimeout=60000

# Run single test to debug
npm run test:performance -- -t "specific test name"

# Use slow motion
PLAYWRIGHT_SLOWMO=1000 npm run test:performance
```

### High Memory Usage

**Problem:** Memory metrics are unexpectedly high

**Solutions:**
- Check if other tabs/applications are running
- Ensure dev server is not heavily loaded
- Run in isolation: `npm run test:performance -- -t "memory"`
- Check browser DevTools for memory leaks

### Unreliable Results

**Problem:** Metrics vary widely between runs

**Solutions:**
- Close other applications
- Run multiple times and average results
- Check system CPU/disk usage
- Run on consistent hardware

### Navigation Tests Failing

**Problem:** Some routes don't exist or have different paths

**Solutions:**
```typescript
// Catch navigation errors gracefully
try {
  await page.goto('http://localhost:5173/dashboard', { timeout: 10000 });
} catch (e) {
  // Route might not exist, skip test
  console.log('Route not found, skipping');
}
```

## Performance Optimization Tips

### For Developers

1. **Code Splitting**
   ```typescript
   const Component = lazy(() => import('./Component'));
   ```

2. **Memoization**
   ```typescript
   export const MyComponent = memo(function MyComponent() {
     // ...
   });
   ```

3. **Image Optimization**
   ```typescript
   <img loading="lazy" src={url} />
   ```

4. **Virtual Scrolling**
   - Use react-window for large lists
   - Renders only visible items

### For DevOps

1. Enable gzip compression
2. Configure CDN caching
3. Minimize database queries
4. Use Redis for caching
5. Optimize images and assets

## Integration with CI/CD

### GitHub Actions

```yaml
name: Performance Tests

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - run: npm ci

      - run: npm run test:performance
        timeout-minutes: 15

      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: performance-reports
          path: test-results/
```

### Continuous Monitoring

Set up performance monitoring:

```bash
# Run nightly
0 0 * * * cd /path/to/fleet-cta && npm run test:performance > /var/log/performance-test.log 2>&1
```

## References

- **Web Vitals**: https://web.dev/vitals/
- **Lighthouse**: https://developers.google.com/web/tools/lighthouse
- **Playwright Documentation**: https://playwright.dev/
- **React Performance**: https://react.dev/reference/react/useMemo
- **Performance API**: https://developer.mozilla.org/en-US/docs/Web/API/Performance
