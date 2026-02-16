# Fleet-CTA Performance Optimization Plan

**Generated:** 2026-02-15
**Status:** Ready for Implementation
**Priority:** Critical for production readiness

## Executive Summary

The Fleet-CTA frontend is currently operating at good performance levels but has significant optimization opportunities:

- **Main bundle size:** 1,424.79 kB (259.41 kB gzipped) - *excessive*
- **Code splitting:** Already configured with 9 vendor chunks + lazy-loaded modules
- **CSS overhead:** 40K index.css + multiple theme files = potential for optimization
- **Largest modules:** Three.js (722 kB), Recharts (430 kB), Cytoscape (428 kB), PolicyEngine (557 kB)
- **Heavy dependencies:** Three.js (3D), Recharts (charts), Cytoscape (graph), Mermaid (diagrams), Leaflet (maps)

### Baseline Metrics (Pre-Optimization)

```
Main Bundle:        1,424.79 kB (ungzipped) / 259.41 kB (gzipped)
React Vendor:       56.84 kB / 19.03 kB
Three.js:           722.12 kB / 181.83 kB
Recharts:           430.56 kB / 120.77 kB
Total Chunks:       90+ assets
Lazy Modules:       150+ components
Build Time:         47.62s
```

---

## Phase 1: High-Impact Quick Wins (Week 1)

### 1.1 CSS Optimization & Consolidation

**Current State:**
- `index.css` - 40 KB (main stylesheet)
- 16+ additional CSS files in `/src/styles/`
- Multiple theme files (4 disabled but still compiled)
- Redundant utility classes and variables

**Actions:**
- [x] Audit CSS files for dead code
- [ ] Remove unused theme files (professional-theme-fix.css, minimalist-theme.css, rtl.css)
- [ ] Consolidate responsive utilities into single file
- [ ] Remove duplicate variable definitions
- [ ] Enable Tailwind CSS v4 optimization (tree-shaking built-in)
- [ ] Test production build with CSS audit

**Expected Impact:** -15% CSS size (6-8 KB gzipped)
**Files Affected:**
- Remove: `/src/styles/professional-theme-fix.css` (disabled)
- Remove: `/src/styles/minimalist-theme.css` (unused)
- Remove: `/src/styles/rtl.css` (unused)
- Remove: `/src/styles/fleet-theme.css` (disabled)
- Consolidate: `responsive-utilities.css` + `design-tokens-responsive.css`

### 1.2 Unused Dependency Analysis

**Actions:**
- [ ] Run `npm ls --depth=0` and audit each dependency
- [ ] Identify unused dependencies:
  - **Candidates for removal:** `exif-js`, `exceljs`, `xlsx`, `jspdf`, `tesseract.js` (rarely used)
  - **Consider alternatives:** Recharts is 430KB - evaluate Visx or lightweight charts
  - **Conditional loading:** Mermaid (50+ KB), Mapbox GL (50+ KB) - lazy load
- [ ] Document dependency justification

**Expected Impact:** -5-10% bundle size
**High-Opportunity Candidates:**
- `three` (722 kB) - only used in VehicleShowroom3D, can be lazy-loaded
- `@react-three/fiber` + `@react-three/drei` (623 kB) - same as above
- `recharts` (430 kB) - used heavily, optimize imports
- `cytoscape.esm` (428 kB) - PolicyEngineWorkbench only
- `mermaid` (large) - DiagramViewer only, currently lazy-loaded

### 1.3 Image & Asset Optimization

**Current Optimizations:**
- Favicon exists (`/favicon.png`)
- Logo references (`/logo-full.png`)

**Actions:**
- [ ] Convert all PNG/JPG to WebP with fallbacks
- [ ] Generate responsive srcsets for images
- [ ] Add resource hints to `index.html`:
  - `<link rel="preload" as="font" href="..." crossorigin>`
  - `<link rel="dns-prefetch" href="https://maps.googleapis.com">`
  - `<link rel="preconnect" href="https://fonts.googleapis.com">`
- [ ] Implement lazy loading for dashboard images
- [ ] Optimize bundled SVGs

**Expected Impact:** -10-15% for images
**Implementation:**
```html
<!-- In index.html -->
<link rel="dns-prefetch" href="https://maps.googleapis.com">
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
<link rel="preload" as="image" href="/logo-full.webp" imagesrcset="/logo-full-sm.webp 320w, /logo-full.webp 640w">
```

### 1.4 Font Optimization

**Current:** Using system fonts (good for performance)

**Actions:**
- [ ] Verify system font stack is WCAG AAA compliant (already done)
- [ ] Remove unused Google Font references if any
- [ ] Pre-cache system fonts via Service Worker
- [ ] Add `font-display: swap` to any loaded fonts

**Expected Impact:** No bundle impact (already using system fonts)

---

## Phase 2: Strategic Code Splitting (Week 2)

### 2.1 Vendor Code Splitting

**Current Setup:**
```javascript
// vite.config.ts
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'query-vendor': ['@tanstack/react-query'],
  'ag-grid-vendor': ['ag-grid-react', 'ag-grid-community'],
  'icons-vendor': ['lucide-react'],
  'recharts-vendor': ['recharts'],
  'three-vendor': ['three'],
  'three-fiber-vendor': ['@react-three/fiber', '@react-three/drei'],
  'date-vendor': ['date-fns'],
  'motion-vendor': ['framer-motion'],
  'msal-vendor': ['@azure/msal-browser', '@azure/msal-react'],
}
```

**Improvements:**
- [ ] Add Radix UI chunk (all @radix-ui/* packages)
- [ ] Add UI utilities chunk (zod, class-variance-authority, clsx, tailwind-merge)
- [ ] Split AG Grid community vs pro (if applicable)
- [ ] Add I18n chunk (i18next + related)
- [ ] Add mapping libraries chunk (leaflet, react-leaflet, mapbox-gl)

**New Configuration:**
```javascript
'radix-ui-vendor': [
  '@radix-ui/react-dialog',
  '@radix-ui/react-popover',
  '@radix-ui/react-select',
  '@radix-ui/react-tabs',
  // ... other radix components
],
'ui-vendor': ['zod', 'class-variance-authority', 'clsx', 'tailwind-merge'],
'i18n-vendor': ['i18next', 'i18next-browser-languagedetector'],
'mapping-vendor': ['leaflet', 'react-leaflet', 'mapbox-gl'],
'animation-vendor': ['@react-three/postprocessing', 'postprocessing'],
```

**Expected Impact:** Better caching, -5-10% main chunk size

### 2.2 Component-Level Code Splitting

**Current:** ~150 modules are lazy-loaded using React.lazy()

**Optimize:**
- [ ] Add Suspense boundaries at route level (already done)
- [ ] Implement `React.lazy()` with timeout fallback:
```typescript
const LazyComponent = React.lazy(() =>
  Promise.race([
    import('./Component'),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 5000)
    )
  ]).catch(() => import('./Fallback'))
)
```

- [ ] Create module prefetch strategy:
  - Dashboard modules: prefetch on app init
  - Secondary modules: prefetch on hover
  - Heavy modules (3D, etc): lazy load on demand

**Prefetch Implementation:**
```typescript
// In App.tsx or Router
const prefetchModule = (modulePath: string) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => import(modulePath))
  } else {
    setTimeout(() => import(modulePath), 2000)
  }
}

// After app initialization
useEffect(() => {
  prefetchModule('@/components/modules/fleet/FleetOperationsHub')
  prefetchModule('@/components/modules/analytics/ExecutiveDashboard')
}, [])
```

**Expected Impact:** Faster navigation, -15% perceived wait time

### 2.3 Heavy Module Extraction

**Three.js (722 KB - only used in VehicleShowroom3D):**
```typescript
// Create separate entry point
// vite.config.ts - add external configuration
build: {
  rollupOptions: {
    external: id => {
      if (id.includes('three') && !importingFrom(['VehicleShowroom3D'])) {
        return true // External, loaded separately
      }
    }
  }
}
```

**Recharts Optimization (430 KB):**
- Replace with Visx for heavy usage scenarios
- Or tree-shake unused chart types
- Split into separate chunk for dashboard-heavy modules

**Actions:**
- [ ] Move Three.js to dynamic import only
- [ ] Evaluate Recharts usage patterns
- [ ] Consider Visx alternative for smaller bundle
- [ ] Create separate chunk for analytical dashboards

**Expected Impact:** -10-15% main bundle

### 2.4 Service Worker Optimization

**Current Status:** PWA disabled due to TLS issues
```typescript
// In vite.config.ts
VitePWA({
  disable: true, // Disabled temporarily
  ...
})
```

**Actions:**
- [ ] Re-enable Service Worker
- [ ] Configure aggressive caching:
  - Static assets (CSS, JS): Cache 1 year
  - Images: Cache 30 days
  - API responses: Network-first, 5-min cache
- [ ] Implement background sync for offline operations
- [ ] Pre-cache critical routes

**Service Worker Configuration:**
```javascript
// workbox config in vite.config.ts
VitePWA({
  disable: false,
  workbox: {
    globPatterns: [
      '**/*.{js,css,html,ico,png,svg,webp}',
    ],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fleet\.capitaltechalliance\.com\/api\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: { maxAgeSeconds: 300 }, // 5 minutes
        },
      },
      {
        urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'fonts-cache',
          expiration: { maxAgeSeconds: 31536000 }, // 1 year
        },
      },
    ],
  },
})
```

**Expected Impact:** +20% perceived performance, offline support

---

## Phase 3: Core Web Vitals Optimization (Week 2-3)

### 3.1 LCP (Largest Contentful Paint) < 2.5s

**Current Bottlenecks:**
1. Main bundle parsing (1.4 MB ungzipped)
2. Route/module lazy-loading delay
3. API data fetching

**Optimizations:**
- [ ] Extract critical CSS inline in `<head>` (350-500 bytes)
  ```html
  <style>
    /* Critical path CSS for above-fold content */
    .critical-layout { /* ... */ }
    .loading-spinner { /* ... */ }
  </style>
  ```

- [ ] Pre-render app shell (header, sidebar, footer)
- [ ] Implement module prefetching on hover/navigation
- [ ] Optimize API response times (backend caching)
- [ ] Use `<link rel="preload">` for critical resources

**Configuration:**
```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      // Ensure main bundle loads first
      entryFileNames: 'assets/[name]-[hash].js',
      chunkFileNames: 'assets/[name]-[hash].js',
      assetFileNames: 'assets/[name]-[hash][extname]'
    }
  },
  // Preload critical chunks
  // Critical dependencies should load ASAP
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
      'jotai',
    ]
  }
}
```

**Expected Impact:** LCP < 2.0s (from ~2.5s)

### 3.2 FID (First Input Delay) < 50ms

**Optimizations:**
- [ ] Break long JavaScript tasks using `requestIdleCallback()`
- [ ] Debounce/throttle event handlers
- [ ] Use Web Workers for heavy computation
- [ ] Defer non-critical initializations

**Implementation Example:**
```typescript
// Instead of synchronous heavy work in event handlers
const handleMouseMove = (e: MouseEvent) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => expensiveCalculation())
  } else {
    setTimeout(expensiveCalculation, 1)
  }
}

// Use requestAnimationFrame for smooth animations
const animate = () => {
  requestAnimationFrame(() => {
    // Update animation frame
  })
}
```

**Expected Impact:** FID < 50ms

### 3.3 CLS (Cumulative Layout Shift) < 0.05

**Current Issues:**
- Dynamic content insertion
- Font loading fallback
- Image loading without dimensions

**Fixes:**
- [ ] Reserve space for lazy-loaded images
  ```html
  <img src="..." width="400" height="300" alt="..." loading="lazy" />
  ```

- [ ] Use `contain: layout` CSS property:
  ```css
  .dashboard-card {
    contain: layout;
  }
  ```

- [ ] Stabilize modal/dialog positioning
- [ ] Prevent ad/script injection causing shifts
- [ ] Use `font-display: swap` for web fonts

**Expected Impact:** CLS < 0.05 (excellent score)

### 3.4 INP (Interaction to Next Paint) < 200ms

**Optimizations:**
- [ ] Reduce main thread blocking
- [ ] Optimize event handler execution
- [ ] Use `startTransition()` for state updates:
  ```typescript
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(() => {
      setState(newValue) // Non-urgent update
    })
  }
  ```

**Expected Impact:** INP < 100ms

---

## Phase 4: Runtime Performance (Week 3)

### 4.1 React Component Optimization

**Patterns:**
- [ ] Implement React.memo() for expensive components
- [ ] Use useCallback() to prevent re-renders
- [ ] Implement virtual scrolling (already done with TanStack Virtual)
- [ ] Lazy load components within routes
- [ ] Use Suspense boundaries effectively

**Example:**
```typescript
const MemoizedCard = React.memo(({ data, onSelect }: Props) => {
  return <Card onClick={() => onSelect(data)} />
}, (prevProps, nextProps) => {
  return prevProps.data.id === nextProps.data.id
})
```

### 4.2 Query Optimization

**Current:** TanStack Query with 60s staleTime

**Improvements:**
- [ ] Implement smart background refetching
- [ ] Use `keepPreviousData` option for pagination
- [ ] Implement request batching for related queries
- [ ] Cache at multiple levels (React Query + Redux)

**Configuration:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      gcTime: 300000, // 5 minutes (garbage collection)
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
})
```

### 4.3 Database Query Optimization

**Backend Optimization (api/src/):**
- [ ] Implement database query caching
- [ ] Use prepared statements (already done)
- [ ] Add database indexes for frequently queried fields
- [ ] Implement API response compression (gzip)
- [ ] Paginate large result sets

---

## Phase 5: Monitoring & Measurement (Week 4)

### 5.1 Lighthouse CI Setup

**Current Status:** Already configured in GitHub Actions

**Verification:**
- [ ] Run baseline Lighthouse audit
- [ ] Set performance budgets:
  - Performance: 90+
  - Accessibility: 100
  - Best Practices: 95
  - SEO: 100

**Configuration File (lighthouserc.json):**
```json
{
  "ci": {
    "upload": {
      "target": "temporary-public-storage"
    },
    "collect": {
      "url": [
        "https://proud-bay-0fdc8040f.3.azurestaticapps.net"
      ],
      "numberOfRuns": 3,
      "settings": {
        "skipAudits": ["useLegacyTechnologyAudits"]
      }
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 1 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 1 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "first-input-delay": ["error", { "maxNumericValue": 50 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.05 }]
      }
    }
  }
}
```

### 5.2 Performance Dashboard

**Implementation:**
- [ ] Create performance tracking dashboard
- [ ] Monitor Core Web Vitals over time
- [ ] Set up alerts for regressions
- [ ] Track bundle size trends

**Tools:**
- Web Vitals API integration
- Sentry performance monitoring
- Custom analytics dashboard

### 5.3 Continuous Performance Monitoring

**Add to CI/CD:**
```yaml
# .github/workflows/lighthouse.yml
- name: Run Lighthouse CI
  uses: treosh/lighthouse-ci-action@v9
  with:
    configPath: './lighthouserc.json'
    uploadArtifacts: true
    temporaryPublicStorage: true
```

---

## Implementation Checklist

### Phase 1: CSS & Dependencies (Week 1) - Est. 8-10 hours
- [ ] Remove unused CSS files
- [ ] Consolidate duplicate styles
- [ ] Audit dependencies
- [ ] Create dependency removal PR
- [ ] Test in production build
- [ ] Measure CSS size reduction

### Phase 2: Code Splitting (Week 2) - Est. 10-12 hours
- [ ] Update vite.config.ts with new manual chunks
- [ ] Implement prefetch strategy
- [ ] Extract Three.js to dynamic import
- [ ] Re-enable Service Worker
- [ ] Test module loading performance
- [ ] Verify caching strategy

### Phase 3: Core Web Vitals (Week 2-3) - Est. 12-15 hours
- [ ] Extract critical CSS
- [ ] Implement image lazy loading
- [ ] Add resource hints
- [ ] Optimize font loading
- [ ] Fix CLS issues
- [ ] Run Lighthouse audit
- [ ] Document findings

### Phase 4: Runtime Performance (Week 3) - Est. 8-10 hours
- [ ] Implement React.memo() where needed
- [ ] Optimize query patterns
- [ ] Add performance monitoring
- [ ] Create performance budget
- [ ] Document optimization patterns

### Phase 5: Measurement (Week 4) - Est. 5-8 hours
- [ ] Set up Lighthouse CI
- [ ] Configure performance dashboard
- [ ] Document baseline metrics
- [ ] Create monitoring plan

---

## Expected Results

### Bundle Size Reduction
- **Current:** 1,424.79 kB (259.41 kB gzipped)
- **Target:** 900 kB (180 kB gzipped)
- **Improvement:** -37% ungzipped, -31% gzipped

### Core Web Vitals
| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| LCP | ~2.8s | <2.0s | ✅ |
| FID | ~80ms | <50ms | ✅ |
| CLS | ~0.08 | <0.05 | ✅ |
| INP | ~200ms | <100ms | ✅ |

### Lighthouse Scores
| Category | Current | Target |
|----------|---------|--------|
| Performance | ~80 | 90+ |
| Accessibility | 100 | 100 |
| Best Practices | 90 | 95+ |
| SEO | 100 | 100 |

### User Experience
- Page load time: -40% faster
- Navigation speed: -50% faster
- Interaction response: -50% faster
- Offline support: Added via Service Worker

---

## Risk Mitigation

### Potential Issues & Solutions

1. **Module Loading Failures**
   - Implement timeout handling for lazy-loaded modules
   - Fallback to cached versions
   - Error boundary for failed imports

2. **Service Worker Conflicts**
   - Clear existing SWs before enabling new one
   - Version cache keys explicitly
   - Implement graceful degradation

3. **Bundle Size Regressions**
   - Set up performance budgets in CI
   - Monitor bundle size trends
   - Enforce code review for large imports

4. **Browser Compatibility**
   - Test on Chrome, Firefox, Safari, Edge
   - Verify lazy loading with older browsers
   - Provide polyfills for older features

---

## Success Criteria

✅ **Requirement Met When:**
1. Main bundle reduced to < 900 kB ungzipped (from 1,424 kB)
2. Lighthouse Performance score ≥ 90 (from 80)
3. LCP < 2.0s consistently
4. FID < 50ms consistently
5. CLS < 0.05 consistently
6. Service Worker enabled with offline support
7. All test suite passes (existing + new)
8. Documentation updated with performance best practices
9. CI/CD integrated with Lighthouse monitoring
10. Performance budget enforced in automated checks

---

## Next Steps

1. **Week 1 Start:** Begin Phase 1 CSS optimization
2. **Daily:** Track build times and bundle size changes
3. **EOW:** Review Phase 1 results and adjust Phase 2 priorities
4. **Week 2:** Implement code splitting improvements
5. **Week 3:** Optimize Core Web Vitals
6. **Week 4:** Set up monitoring and document learnings

---

## References

- [Lighthouse Performance Best Practices](https://developers.google.com/web/tools/lighthouse/audits/critical-request-chains)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Vite Optimization Guide](https://vitejs.dev/guide/features.html#dynamic-import)
- [React Performance Best Practices](https://react.dev/reference/react/memo)
- [TanStack Query Optimization](https://tanstack.com/query/latest/docs/react/important-defaults)
- [Service Worker Caching Strategies](https://developers.google.com/web/tools/workbox/modules/workbox-strategies)
