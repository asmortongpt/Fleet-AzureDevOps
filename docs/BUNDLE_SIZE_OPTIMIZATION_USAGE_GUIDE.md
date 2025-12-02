# Bundle Size Optimization - Complete Usage Guide

Comprehensive guide for analyzing, optimizing, and maintaining optimal bundle sizes in the Fleet Management System.

## Table of Contents

1. [Overview](#overview)
2. [Bundle Analysis Tools](#bundle-analysis-tools)
3. [Developer Workflows](#developer-workflows)
4. [Optimization Strategies](#optimization-strategies)
5. [Tree Shaking](#tree-shaking)
6. [Dynamic Imports](#dynamic-imports)
7. [CI/CD Integration](#cicd-integration)
8. [Production Monitoring](#production-monitoring)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Overview

Bundle size optimization is critical for:
- **Fast Initial Load:** Users see content in <3s on 4G
- **Improved SEO:** Google Core Web Vitals scoring
- **Reduced Bandwidth Costs:** Especially for mobile users
- **Better User Experience:** Perceived performance improvements

### Current Performance

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Initial Bundle (gzip)** | <500 KB | ~142 KB | ✅ Excellent |
| **Time to Interactive (4G)** | <3s | 2.7s | ✅ Good |
| **Lighthouse Performance** | >90 | 91 | ✅ Excellent |
| **Total Bundle (gzip)** | <2.5 MB | ~2.4 MB | ✅ Good |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Vite Build                           │
│                                                             │
│  ┌──────────────────┐      ┌──────────────────┐           │
│  │  Source Code     │─────▶│  Code Splitting  │           │
│  │  (src/)          │      │  (Rollup)        │           │
│  └──────────────────┘      └──────────────────┘           │
│                                     │                       │
│                                     ▼                       │
│  ┌────────────────────────────────────────────┐           │
│  │           Manual Chunks Strategy            │           │
│  │  • react-vendor (350 KB)                   │           │
│  │  • map-leaflet (289 KB, lazy)              │           │
│  │  • map-mapbox (498 KB, lazy)               │           │
│  │  • three-core (589 KB, lazy)               │           │
│  │  • ui-radix (445 KB, lazy)                 │           │
│  └────────────────────────────────────────────┘           │
│                                     │                       │
│                                     ▼                       │
│  ┌────────────────────────────────────────────┐           │
│  │       Minification & Compression            │           │
│  │  • esbuild minification                     │           │
│  │  • Terser for advanced optimizations        │           │
│  │  • Gzip/Brotli compression                  │           │
│  └────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## Bundle Analysis Tools

### 1. Interactive Visualizer

**Build and analyze bundle:**
```bash
npm run build:analyze
```

This automatically:
1. Runs production build
2. Generates `dist/stats.html`
3. Opens interactive treemap in browser

**Analyzing the Treemap:**
- **Box size** = File size (larger boxes = larger files)
- **Color** = File type/category
- **Hover** = Shows exact size and gzip size
- **Click** = Drills into nested modules

**What to look for:**
- Unexpectedly large dependencies
- Duplicate modules (same library multiple times)
- Heavy dependencies in initial bundle
- Opportunities for code splitting

### 2. Command-Line Bundle Checker

**Quick bundle check:**
```bash
npm run build:check
```

**Output example:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Bundle Size Analysis - Fleet Management System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Calculating bundle sizes...

┌─────────────────────────────────────────────────────────┐
│                    BUNDLE SIZES                         │
├─────────────────────────────────────────────────────────┤
│ Initial Bundle (main):                                  │
│   Uncompressed:    485 KB                              │
│   Gzipped:         142 KB                              │
├─────────────────────────────────────────────────────────┤
│ Total Bundle:                                           │
│   Uncompressed:   7800 KB                              │
│   Gzipped:        2400 KB                              │
└─────────────────────────────────────────────────────────┘

🎯 Performance Budget Check:

  ✓ Initial bundle: EXCELLENT (142KB ≤ 500KB baseline)
  ✓ Total bundle:   GOOD (2400KB ≤ 2500KB baseline)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   All bundle size checks passed! ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Thresholds configured in `scripts/check-bundle-size.sh`:**
- Initial Baseline: 500 KB (gzip)
- Initial Warning: 750 KB (gzip)
- Initial Error: 1000 KB (gzip)
- Total Baseline: 2.5 MB (gzip)
- Total Warning: 3.5 MB (gzip)
- Total Error: 5 MB (gzip)

### 3. Performance Budget JSON

**View all budgets:**
```bash
cat performance-budget.json
```

**Key budgets defined:**
- Core Web Vitals (LCP, FID, CLS, TTFB, INP)
- Map initialization times
- Marker rendering performance
- Interaction responsiveness
- Memory limits
- Bundle size limits
- Network transfer budgets

---

## Developer Workflows

### Workflow 1: Adding a New Heavy Library

**Scenario:** You need to add a charting library like Chart.js (200 KB)

**Step 1: Analyze Impact Before Installing**
```bash
# Check current bundle size
npm run build:check

# Note the current sizes
# Initial: 142 KB, Total: 2400 KB
```

**Step 2: Install and Build**
```bash
npm install chart.js
npm run build:analyze
```

**Step 3: Analyze in Treemap**
- Open `dist/stats.html`
- Find Chart.js in the treemap
- Note its size and which chunk it's in

**Step 4: Decide on Strategy**

**Option A: If <50 KB** → Keep in vendor chunk
```typescript
// No changes needed - Vite handles automatically
```

**Option B: If 50-200 KB** → Create separate chunk
```typescript
// vite.config.ts
manualChunks: (id) => {
  if (id.includes('node_modules/chart.js')) {
    return 'charts-chartjs'
  }
}
```

**Option C: If >200 KB** → Lazy load
```typescript
// src/components/MyChart.tsx
const ChartJS = lazy(() => import('chart.js').then(m => ({
  default: m.Chart
})))

function MyChart() {
  return (
    <Suspense fallback={<ChartLoadingSkeleton />}>
      <ChartJS data={data} />
    </Suspense>
  )
}
```

**Step 5: Verify and Commit**
```bash
npm run build:check

# Ensure budgets still pass:
# ✓ Initial bundle: EXCELLENT (145KB ≤ 500KB)
# ✓ Total bundle:   GOOD (2600KB ≤ 2500KB)

git add .
git commit -m "feat: add Chart.js with lazy loading

- Lazy load Chart.js to avoid initial bundle bloat
- Created separate chunk (charts-chartjs)
- Bundle impact: +3KB initial, +200KB lazy
- All performance budgets still passing"
```

### Workflow 2: Creating a New Module

**Scenario:** You're adding a new "Analytics Dashboard" module with heavy dependencies

**Step 1: Plan Code Splitting Strategy**
```typescript
// src/App.tsx

// ✅ CORRECT: Lazy load the entire module
const AnalyticsDashboard = lazy(() =>
  import('@/components/modules/AnalyticsDashboard').then(m => ({
    default: m.AnalyticsDashboard,
  }))
)

// Usage with suspense
<Suspense fallback={<ModuleLoadingSkeleton />}>
  <AnalyticsDashboard />
</Suspense>
```

**Step 2: Lazy Load Heavy Sub-Components**
```typescript
// src/components/modules/AnalyticsDashboard.tsx

// Lazy load heavy charting library
const AdvancedChart = lazy(() => import('@/components/AdvancedChart'))

// Lazy load heavy data tables
const DataGrid = lazy(() => import('@/components/DataGrid'))

export function AnalyticsDashboard() {
  return (
    <div>
      <h1>Analytics Dashboard</h1>

      {/* Only load when user views charts */}
      <Suspense fallback={<ChartSkeleton />}>
        <AdvancedChart data={chartData} />
      </Suspense>

      {/* Only load when user views data grid */}
      <Suspense fallback={<TableSkeleton />}>
        <DataGrid data={tableData} />
      </Suspense>
    </div>
  )
}
```

**Step 3: Test Performance Impact**
```bash
# Build and analyze
npm run build:analyze

# Check Lighthouse score
npx playwright test e2e/08-performance --project=chromium

# Verify bundle budgets
npm run build:check
```

**Step 4: Document in PR**
```markdown
## Bundle Size Impact

**Before:**
- Initial: 142 KB (gzip)
- Analytics Module: N/A

**After:**
- Initial: 145 KB (gzip) (+3 KB)
- Analytics Module: 450 KB (lazy loaded)

**Justification:**
- Initial bundle increase minimal (+2%)
- Heavy analytics code only loads when module is accessed
- Estimated 80% of users never access analytics
- Performance budgets still met: ✅

**Screenshots:**
- [Bundle Analysis Treemap](./bundle-analysis.png)
- [Lighthouse Report](./lighthouse.png)
```

### Workflow 3: Investigating Bundle Size Increase

**Scenario:** CI fails with "Bundle size increased by 15%"

**Step 1: Compare Builds**
```bash
# Checkout main branch
git checkout main
npm install
npm run build:analyze
# Note sizes: main-[hash].js = 142 KB

# Checkout your branch
git checkout feature/my-feature
npm install
npm run build:analyze
# Note sizes: main-[hash].js = 165 KB (+23 KB!)
```

**Step 2: Identify Culprit**
- Open `dist/stats.html` from both builds
- Use treemap to compare
- Look for new large dependencies

**Step 3: Find the Import**
```bash
# Search for the problematic import
grep -r "import.*large-library" src/
```

**Step 4: Fix Strategies**

**Strategy A: Remove Unnecessary Import**
```typescript
// ❌ BAD: Importing entire library
import _ from 'lodash'

// ✅ GOOD: Import only what you need
import debounce from 'lodash/debounce'
```

**Strategy B: Use Lighter Alternative**
```typescript
// ❌ BAD: Heavy library (500 KB)
import moment from 'moment'

// ✅ GOOD: Lighter alternative (50 KB)
import { format } from 'date-fns'
```

**Strategy C: Lazy Load**
```typescript
// ❌ BAD: Heavy import in main bundle
import ChartComponent from './HeavyChart'

// ✅ GOOD: Lazy load
const ChartComponent = lazy(() => import('./HeavyChart'))
```

**Step 5: Verify Fix**
```bash
npm run build:check

# Should see:
# ✓ Initial bundle: EXCELLENT (142KB ≤ 500KB baseline)
```

---

## Optimization Strategies

### 1. Dynamic Imports for Large Libraries

**When to Use:**
- Libraries >100 KB
- Features used by <50% of users
- Heavy visualization libraries (maps, 3D, charts)
- Rarely accessed admin tools

**Example: Map Libraries**
```typescript
// src/components/LeafletMap.tsx

let L: typeof import('leaflet') | null = null

async function ensureLeafletLoaded() {
  if (L) return L

  // Dynamic import - only loaded when map is rendered
  const leafletModule = await import('leaflet')
  L = leafletModule.default || leafletModule

  // Also load CSS dynamically
  await import('leaflet/dist/leaflet.css')

  return L
}

export function LeafletMap({ vehicles }: Props) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    ensureLeafletLoaded().then(() => {
      setIsLoading(false)
      // Initialize map with L...
    })
  }, [])

  if (isLoading) {
    return <MapLoadingSkeleton />
  }

  return <div id="map" />
}
```

**Benefits:**
- Leaflet (~147 KB) only loads when map component renders
- Users who don't use maps save 147 KB
- Faster initial page load

### 2. React.lazy() with Suspense

**When to Use:**
- Route components
- Module components
- Heavy UI components
- Dialogs and modals

**Example: Module Lazy Loading**
```typescript
// src/App.tsx

const FleetDashboard = lazy(() =>
  import('@/components/modules/FleetDashboard').then(m => ({
    default: m.FleetDashboard,
  }))
)

const VehicleManagement = lazy(() =>
  import('@/components/modules/VehicleManagement').then(m => ({
    default: m.VehicleManagement,
  }))
)

function App() {
  return (
    <Suspense fallback={<ModuleLoadingSkeleton />}>
      <Routes>
        <Route path="/dashboard" element={<FleetDashboard />} />
        <Route path="/vehicles" element={<VehicleManagement />} />
      </Routes>
    </Suspense>
  )
}
```

**Benefits:**
- Each module only loads when route is accessed
- Reduces initial bundle by 70-80%
- Better code organization

### 3. Manual Chunk Splitting

**When to Use:**
- Core dependencies that rarely change (React, React Router)
- Heavy UI libraries (Radix UI, Material-UI)
- Map providers (Leaflet, Mapbox, Google Maps)
- 3D libraries (Three.js, React Three Fiber)

**Configuration:**
```typescript
// vite.config.ts

build: {
  rollupOptions: {
    output: {
      manualChunks: (id) => {
        // Core React - changes rarely, cache indefinitely
        if (id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom')) {
          return 'react-vendor'
        }

        // Map libraries - lazy loaded
        if (id.includes('node_modules/leaflet')) {
          return 'map-leaflet'
        }
        if (id.includes('node_modules/mapbox-gl')) {
          return 'map-mapbox'
        }

        // 3D libraries - lazy loaded
        if (id.includes('node_modules/three')) {
          return 'three-core'
        }

        // UI components - used everywhere
        if (id.includes('node_modules/@radix-ui')) {
          return 'ui-radix'
        }

        // Charts - lazy loaded
        if (id.includes('node_modules/recharts')) {
          return 'charts-recharts'
        }

        // Other vendor code
        if (id.includes('node_modules')) {
          return 'vendor'
        }
      }
    }
  }
}
```

**Benefits:**
- React vendor chunk cached long-term (rarely changes)
- Parallel downloads for independent chunks
- Better cache invalidation (only changed chunks re-download)

### 4. Tree Shaking Optimization

**When to Use:**
- Always! Tree shaking removes unused code

**How to Enable:**

**Step 1: Use ES6 Imports (Not CommonJS)**
```typescript
// ❌ BAD: CommonJS (can't tree shake)
const lodash = require('lodash')

// ✅ GOOD: ES6 imports (tree shakeable)
import { debounce, throttle } from 'lodash-es'
```

**Step 2: Import Only What You Need**
```typescript
// ❌ BAD: Imports entire library
import * as d3 from 'd3'

// ✅ GOOD: Import specific modules
import { scaleLinear, axisBottom } from 'd3-scale'
import { select } from 'd3-selection'
```

**Step 3: Mark Side Effects in package.json**
```json
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "polyfills.ts"
  ]
}
```

**Step 4: Verify Tree Shaking**
```bash
npm run build:analyze

# In treemap, look for:
# - Unused exports (highlighted in red)
# - Full library imports when only partial needed
```

### 5. CSS Code Splitting

**When to Use:**
- Always enabled for route-based CSS

**Configuration:**
```typescript
// vite.config.ts

build: {
  cssCodeSplit: true,
}
```

**Benefits:**
- CSS only loads for components that are rendered
- Reduces initial CSS from 120 KB to 35 KB
- Critical CSS inlined automatically

**Example:**
```typescript
// Component-specific CSS is automatically split
import './VehicleManagement.css'  // Only loads on /vehicles route
```

### 6. Asset Optimization

**When to Use:**
- Images, fonts, icons

**Configuration:**
```typescript
// vite.config.ts

build: {
  rollupOptions: {
    output: {
      assetFileNames: (assetInfo) => {
        const ext = assetInfo.name?.split('.').pop()

        // Organize by type for better caching
        if (/png|jpe?g|svg|gif/i.test(ext)) {
          return `assets/images/[name]-[hash][extname]`
        }
        if (/woff2?|ttf|otf/i.test(ext)) {
          return `assets/fonts/[name]-[hash][extname]`
        }
        if (/css/i.test(ext)) {
          return `assets/css/[name]-[hash][extname]`
        }

        return `assets/[name]-[hash][extname]`
      }
    }
  },

  // Inline small assets (<4 KB) as base64
  assetsInlineLimit: 4096,
}
```

**Best Practices:**
- Use WebP/AVIF for images
- Subset fonts to only needed characters
- Use SVG icons instead of icon fonts
- Lazy load images below the fold

---

## Tree Shaking

### Understanding Tree Shaking

Tree shaking removes unused code during build. It works by:
1. Analyzing import/export relationships
2. Marking used code
3. Removing unmarked (dead) code
4. Optimizing with Terser/esbuild

### Ensuring Effective Tree Shaking

**1. Use Named Exports**
```typescript
// ❌ BAD: Default exports harder to tree shake
export default {
  functionA,
  functionB,
  functionC,
}

// ✅ GOOD: Named exports tree shake perfectly
export { functionA }
export { functionB }
export { functionC }
```

**2. Avoid Side Effect Imports**
```typescript
// ❌ BAD: Side effect imports always included
import 'some-polyfill'  // Always bundled

// ✅ GOOD: Conditional import
if (!('fetch' in window)) {
  import('whatwg-fetch')  // Only bundled if used
}
```

**3. Use sideEffects Flag**
```json
// package.json
{
  "sideEffects": false
}

// Or specify files with side effects:
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "./src/polyfills.ts"
  ]
}
```

**4. Import from Specific Paths**
```typescript
// ❌ BAD: Imports entire library
import { Button } from '@mui/material'

// ✅ GOOD: Direct import
import Button from '@mui/material/Button'
```

### Debugging Tree Shaking Issues

**Check what's being bundled:**
```bash
npm run build:analyze

# Look for:
# - Unused exports marked in red
# - Entire libraries when only small parts used
```

**Verify a module is tree shakeable:**
```bash
# Check if module uses ES6 exports
cat node_modules/some-lib/package.json | grep '"module"'

# Should output something like:
# "module": "dist/index.mjs"
```

**Force tree shaking for specific library:**
```typescript
// vite.config.ts

optimizeDeps: {
  include: ['problem-library'],  // Pre-bundle and tree shake
}
```

---

## Dynamic Imports

### When to Use Dynamic Imports

- ✅ Features used by <50% of users
- ✅ Large dependencies (>100 KB)
- ✅ Admin-only functionality
- ✅ Conditional features (A/B tests, feature flags)
- ✅ Heavy visualization (maps, charts, 3D)

### Pattern 1: Component Lazy Loading

**Basic Lazy Component:**
```typescript
import { lazy, Suspense } from 'react'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyComponent />
    </Suspense>
  )
}
```

**With Error Boundary:**
```typescript
import { lazy, Suspense } from 'react'
import { ErrorBoundary } from 'react-error-boundary'

const HeavyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <ErrorBoundary fallback={<ErrorMessage />}>
      <Suspense fallback={<Spinner />}>
        <HeavyComponent />
      </Suspense>
    </ErrorBoundary>
  )
}
```

**With Retry Logic:**
```typescript
const HeavyComponent = lazy(() =>
  import('./HeavyComponent').catch(() => {
    // Retry once if first import fails
    return import('./HeavyComponent')
  })
)
```

### Pattern 2: Conditional Dynamic Imports

**Load Based on Feature Flag:**
```typescript
async function loadFeature() {
  if (featureFlags.enableNewChart) {
    const { NewChart } = await import('./NewChart')
    return NewChart
  } else {
    const { OldChart } = await import('./OldChart')
    return OldChart
  }
}
```

**Load Based on User Role:**
```typescript
function AdminPanel() {
  const { role } = useAuth()

  if (role === 'admin') {
    const AdminTools = lazy(() => import('./AdminTools'))
    return (
      <Suspense fallback={<Spinner />}>
        <AdminTools />
      </Suspense>
    )
  }

  return null
}
```

### Pattern 3: Prefetching

**Prefetch on Hover:**
```typescript
function NavigationLink({ to, children }) {
  const prefetchModule = () => {
    // Prefetch module when user hovers over link
    import(`./pages/${to}`)
  }

  return (
    <Link to={to} onMouseEnter={prefetchModule}>
      {children}
    </Link>
  )
}
```

**Prefetch on Idle:**
```typescript
useEffect(() => {
  // Prefetch after initial render completes
  requestIdleCallback(() => {
    import('./HeavyModule')
  })
}, [])
```

### Pattern 4: Dynamic Library Loading

**Load External Library:**
```typescript
async function loadGoogleMaps() {
  if (window.google) return window.google

  // Load Google Maps SDK
  const script = document.createElement('script')
  script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`

  await new Promise((resolve, reject) => {
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })

  return window.google
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/bundle-size-check.yml`:

```yaml
name: Bundle Size Check

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  bundle-size:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for comparison

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build current branch
        run: npm run build

      - name: Check bundle size
        id: current-size
        run: |
          CURRENT_SIZE=$(find dist/assets/js -name "main-*.js" -exec du -k {} \; | cut -f1 | head -1)
          echo "size=$CURRENT_SIZE" >> $GITHUB_OUTPUT
          echo "Current bundle size: ${CURRENT_SIZE}KB"

      - name: Run bundle size check script
        id: budget-check
        run: |
          npm run build:check > bundle-report.txt
          echo "exitcode=$?" >> $GITHUB_OUTPUT
        continue-on-error: true

      - name: Compare with main branch
        if: github.event_name == 'pull_request'
        run: |
          # Checkout main branch
          git fetch origin main
          git checkout origin/main

          # Build main
          npm ci
          npm run build

          # Get main bundle size
          MAIN_SIZE=$(find dist/assets/js -name "main-*.js" -exec du -k {} \; | cut -f1 | head -1)

          # Compare
          CURRENT_SIZE=${{ steps.current-size.outputs.size }}
          DIFF=$((CURRENT_SIZE - MAIN_SIZE))
          PERCENT=$(awk "BEGIN {printf \"%.1f\", ($DIFF / $MAIN_SIZE) * 100}")

          echo "Main branch size: ${MAIN_SIZE}KB"
          echo "Current size: ${CURRENT_SIZE}KB"
          echo "Difference: ${DIFF}KB (${PERCENT}%)"

          # Fail if increase >10%
          if [ $(echo "$PERCENT > 10" | bc) -eq 1 ]; then
            echo "::error::Bundle size increased by ${PERCENT}% (>${THRESHOLD}%)"
            exit 1
          fi

      - name: Upload bundle analysis
        uses: actions/upload-artifact@v4
        with:
          name: bundle-stats
          path: dist/stats.html
          retention-days: 7

      - name: Comment on PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs')
            const report = fs.readFileSync('bundle-report.txt', 'utf8')

            await github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Bundle Size Report\n\n\`\`\`\n${report}\n\`\`\`\n\n[View detailed analysis](https://github.com/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId})`
            })

      - name: Fail if budget exceeded
        if: steps.budget-check.outputs.exitcode != '0'
        run: exit 1
```

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
bundle-size:
  stage: test
  image: node:20
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm run build
    - npm run build:check
  artifacts:
    paths:
      - dist/stats.html
    expire_in: 7 days
    reports:
      junit: test-results/bundle-size.xml
  only:
    - merge_requests
    - main
```

### Pre-commit Hook

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Only check on staged changes
if git diff --cached --name-only | grep -qE '\.(ts|tsx|js|jsx)$'; then
  echo "🔍 Checking bundle size impact..."

  npm run build:check

  if [ $? -ne 0 ]; then
    echo "❌ Bundle size check failed"
    echo "Run 'npm run build:analyze' to investigate"
    exit 1
  fi
fi
```

---

## Production Monitoring

### Real User Monitoring (RUM)

**Track bundle performance in production:**
```typescript
// src/lib/telemetry.ts

import { ApplicationInsights } from '@microsoft/applicationinsights-web'

const appInsights = new ApplicationInsights({
  config: {
    instrumentationKey: process.env.VITE_APP_INSIGHTS_KEY,
    enableAutoRouteTracking: true,
  }
})

appInsights.loadAppInsights()

// Track bundle load times
export function trackBundleLoad(chunkName: string, loadTime: number) {
  appInsights.trackMetric({
    name: 'BundleLoadTime',
    average: loadTime,
    properties: {
      chunkName,
      environment: process.env.NODE_ENV,
    }
  })
}

// Track when bundle size budget exceeded
export function trackBundleSizeExceeded(chunkName: string, size: number, budget: number) {
  appInsights.trackEvent({
    name: 'BundleSizeExceeded',
    properties: {
      chunkName,
      actualSize: size,
      budgetSize: budget,
      percentOver: ((size - budget) / budget) * 100,
    }
  })
}
```

**Monitor with Performance Observer:**
```typescript
// src/hooks/usePerformanceMonitoring.ts

import { useEffect } from 'react'
import { trackBundleLoad } from '@/lib/telemetry'

export function usePerformanceMonitoring() {
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource' && entry.name.endsWith('.js')) {
          const duration = entry.duration
          const size = (entry as PerformanceResourceTiming).transferSize
          const chunkName = entry.name.split('/').pop() || 'unknown'

          trackBundleLoad(chunkName, duration)

          // Alert if chunk >500KB
          if (size > 500 * 1024) {
            console.warn(`Large chunk loaded: ${chunkName} (${(size / 1024).toFixed(0)}KB)`)
          }
        }
      }
    })

    observer.observe({ entryTypes: ['resource'] })

    return () => observer.disconnect()
  }, [])
}
```

### Dashboard Metrics

**Key metrics to track:**

1. **Bundle Load Time (P50, P95, P99)**
   - Target: <500ms for initial bundle
   - Alert if P95 >1s

2. **Time to Interactive (TTI)**
   - Target: <3s on 4G
   - Alert if P95 >5s

3. **Bundle Size Over Time**
   - Track weekly growth
   - Alert if increases >5% week-over-week

4. **Lazy Load Success Rate**
   - Track % of successful dynamic imports
   - Alert if failure rate >1%

5. **Cache Hit Rate**
   - Track how often bundles served from cache
   - Target: >80% for return visitors

---

## Troubleshooting

### Issue: Bundle Size Suddenly Increased

**Symptoms:**
- CI fails with "Bundle size exceeded"
- `npm run build:check` shows warning/error
- Slow page load in production

**Diagnosis:**
```bash
# 1. Compare current build with previous
git checkout HEAD^  # Previous commit
npm install
npm run build:analyze
# Save stats.html as stats-old.html

git checkout -  # Return to current commit
npm install
npm run build:analyze
# Save stats.html as stats-new.html

# 2. Compare the two treemaps side by side
open stats-old.html stats-new.html
```

**Common Causes:**

**Cause 1: New Heavy Dependency**
```bash
# Find what was added
git diff HEAD^ package.json

# Solution: Remove, replace with lighter alternative, or lazy load
```

**Cause 2: Importing Entire Library**
```typescript
// ❌ BAD
import _ from 'lodash'

// ✅ GOOD
import debounce from 'lodash/debounce'
```

**Cause 3: Duplicate Dependencies**
```bash
# Check for duplicates
npm ls <package-name>

# If multiple versions, deduplicate
npm dedupe
```

### Issue: Chunk Failed to Load

**Symptoms:**
- Error: "Failed to fetch dynamically imported module"
- Blank page for users
- Console error in production

**Diagnosis:**
```typescript
// Add error boundary with retry
const HeavyComponent = lazy(() =>
  import('./HeavyComponent').catch((error) => {
    console.error('Failed to load component:', error)

    // Retry once
    return import('./HeavyComponent')
  })
)
```

**Common Causes:**

**Cause 1: Network Issue**
- Solution: Implement retry logic (shown above)

**Cause 2: CDN Cache Stale**
```bash
# Add cache busting
# vite.config.ts already includes content hashes
# Ensure CDN purged on deploy
```

**Cause 3: CORS Issue**
```typescript
// vite.config.ts
server: {
  cors: true,
}
```

### Issue: Tree Shaking Not Working

**Symptoms:**
- Large bundle despite small imports
- Entire library bundled when only using small part

**Diagnosis:**
```bash
npm run build:analyze

# In treemap, look for:
# - Full library imported (e.g., all of lodash)
# - Multiple copies of same library
```

**Solutions:**

**Solution 1: Use ES6 Imports**
```typescript
// ❌ BAD: CommonJS
const library = require('library')

// ✅ GOOD: ES6
import { feature } from 'library'
```

**Solution 2: Check Library Supports Tree Shaking**
```bash
# Check package.json
cat node_modules/library/package.json | grep '"module"'

# If no "module" field, library doesn't support tree shaking
# Consider alternative library
```

**Solution 3: Mark Side Effects**
```json
// Your package.json
{
  "sideEffects": false
}
```

### Issue: Slow Build Times

**Symptoms:**
- `npm run build` takes >2 minutes
- Dev server slow to start

**Diagnosis:**
```bash
# Profile build
npm run build -- --profile

# Check what's being pre-bundled
cat node_modules/.vite/deps/_metadata.json
```

**Solutions:**

**Solution 1: Exclude Heavy Dependencies from Pre-bundling**
```typescript
// vite.config.ts
optimizeDeps: {
  exclude: ['heavy-library']
}
```

**Solution 2: Increase Memory**
```bash
# In package.json
"build": "NODE_OPTIONS=--max-old-space-size=8192 vite build"
```

**Solution 3: Use esbuild Instead of Terser**
```typescript
// vite.config.ts
build: {
  minify: 'esbuild',  // Faster than terser
}
```

---

## Best Practices

### 1. Measure Before Optimizing

**Always establish baseline:**
```bash
npm run build:analyze
# Note current sizes before making changes
```

**Set performance budgets:**
```json
// performance-budget.json
{
  "budgets": {
    "initial": 500,   // KB
    "total": 2500,    // KB
    "route": 300      // KB per route
  }
}
```

### 2. Optimize Progressively

**Priority order:**
1. **Low-hanging fruit** (10-30 minutes)
   - Remove unused dependencies
   - Fix incorrect imports (import \* vs named imports)
   - Enable gzip compression

2. **Medium effort** (1-3 hours)
   - Implement lazy loading for routes
   - Create manual chunks for heavy libraries
   - Enable CSS code splitting

3. **High effort** (1-3 days)
   - Refactor to use lighter alternatives
   - Implement advanced code splitting
   - Set up monitoring and alerting

### 3. Monitor in Production

**Key metrics dashboard:**
- Bundle load times (P50, P95, P99)
- Cache hit rates
- Error rates for dynamic imports
- Weekly bundle size trend

**Set up alerts:**
```typescript
// Alert if bundle size increases >10%
if (currentSize > previousSize * 1.1) {
  sendAlert('Bundle size increased by >10%')
}

// Alert if TTI degrades
if (tti.p95 > 5000) {
  sendAlert('Time to Interactive >5s for 95th percentile')
}
```

### 4. Document Bundle Changes

**In every PR affecting bundle:**
```markdown
## Bundle Impact

**Before:**
- Initial: 142 KB
- Total: 2.4 MB

**After:**
- Initial: 145 KB (+3 KB, +2%)
- Total: 2.6 MB (+200 KB, +8%)

**Reason:**
Added Chart.js for analytics dashboard

**Mitigation:**
- Chart.js lazy loaded (only loads when analytics accessed)
- Estimated 80% of users don't access analytics
- All budgets still passing ✅
```

### 5. Regular Audits

**Monthly bundle audit:**
```bash
# Run full analysis
npm run build:analyze

# Check for:
# - Bundle size trend (should be stable or decreasing)
# - New dependencies that could be optimized
# - Opportunities for lazy loading
```

**Quarterly deep dive:**
- Review all dependencies for lighter alternatives
- Analyze real user monitoring data
- Update performance budgets based on data
- Identify and lazy load rarely-used features

### 6. Code Review Checklist

**For every PR that adds dependencies:**
- [ ] Dependency size checked (<100 KB ideal)
- [ ] Import strategy decided (eager vs lazy)
- [ ] Bundle impact documented
- [ ] CI bundle check passing
- [ ] Performance budgets met
- [ ] Tree shaking verified (if applicable)

### 7. Team Communication

**Share bundle insights:**
```markdown
# Weekly Bundle Report

**This Week:**
- Initial bundle: 142 KB (↓ 3 KB from last week)
- Total bundle: 2.4 MB (↔ no change)

**Changes:**
- ✅ Replaced moment.js with date-fns (-450 KB)
- ✅ Lazy loaded admin panel (-150 KB)
- ✅ Removed unused lodash functions (-80 KB)

**Next Week Focus:**
- Lazy load 3D viewer module
- Replace Recharts with lighter alternative
- Target: <130 KB initial bundle
```

---

## Resources

### Tools

- **Bundle Analyzer:** `npm run build:analyze`
- **Bundle Size Checker:** `npm run build:check`
- **Lighthouse:** Chrome DevTools (Ctrl+Shift+I → Lighthouse tab)
- **WebPageTest:** https://www.webpagetest.org/
- **Bundle Phobia:** https://bundlephobia.com/ (check npm package sizes)

### Documentation

- [Vite Build Optimizations](https://vitejs.dev/guide/build.html#build-optimizations)
- [React Code Splitting](https://react.dev/reference/react/lazy)
- [Rollup Manual Chunks](https://rollupjs.org/configuration-options/#output-manualchunks)
- [Web Performance Patterns](https://web.dev/patterns/web-vitals-patterns/)

### Performance Budgets

Defined in `performance-budget.json`:
- Core Web Vitals (LCP, FID, CLS, TTFB, INP)
- Bundle size limits (initial, total, per-route)
- Network transfer budgets
- Memory usage limits

### Monitoring

- **Application Insights:** Real user monitoring
- **Lighthouse CI:** Automated performance testing
- **GitHub Actions:** Bundle size checks on PR

---

## Appendix

### Quick Reference Commands

```bash
# Build and analyze bundle
npm run build:analyze

# Check bundle against budgets
npm run build:check

# Production build
npm run build

# Preview production build locally
npm run preview

# Run performance tests
npx playwright test e2e/08-performance
```

### Performance Budget Thresholds

| Category | Baseline | Warning | Error |
|----------|----------|---------|-------|
| **Initial Bundle (gzip)** | 500 KB | 750 KB | 1 MB |
| **Total Bundle (gzip)** | 2.5 MB | 3.5 MB | 5 MB |
| **Per Route (gzip)** | 300 KB | 450 KB | 600 KB |
| **CSS (gzip)** | 50 KB | 100 KB | 150 KB |

### Common Optimization Wins

| Optimization | Time | Savings | Difficulty |
|--------------|------|---------|------------|
| Remove unused dependencies | 10 min | 50-500 KB | Easy |
| Fix import * statements | 15 min | 20-100 KB | Easy |
| Lazy load routes | 30 min | 100-300 KB | Medium |
| Lazy load maps | 1 hour | 400-600 KB | Medium |
| Manual chunk splitting | 2 hours | 50-150 KB | Medium |
| Replace heavy libraries | 1 day | 200-500 KB | Hard |

---

**Document Maintained By:** Fleet Platform Team
**Last Review:** 2025-12-02
**Next Review:** 2026-03-02 (Quarterly)
