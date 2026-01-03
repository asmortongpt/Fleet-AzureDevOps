# Caching and Performance Optimization System

Comprehensive caching and performance optimization implementation for the Fleet Management System.

## Overview

This system implements multiple layers of caching and performance optimization:

1. **Service Worker** - Offline support and asset caching
2. **IndexedDB Cache Manager** - Client-side data persistence with LRU eviction
3. **React Query Persistence** - Query cache persistence to IndexedDB
4. **Performance Monitoring** - Real-time performance metrics tracking
5. **Image Optimization** - Lazy loading, WebP support, responsive images
6. **Build Optimization** - Advanced bundling, compression, and minification

## Components

### 1. Service Worker (`public/sw.js`)

Enhanced service worker with:
- Multi-tier caching strategy (static, runtime, images, 3D models, API, fonts)
- Cache size limits with LRU eviction
- TTL-based cache freshness
- 3D model prefetching
- Background sync support
- Push notifications
- Offline fallback

**Cache Sizes:**
- Static: 50 MB
- Runtime: 100 MB
- Images: 200 MB
- 3D Models: 500 MB
- API: 50 MB
- Fonts: 10 MB

**Caching Strategies:**
- Static assets: Cache-first
- API requests: Network-first with TTL
- Images: Cache-first with background refresh
- 3D models: Aggressive cache-first (90-day TTL)
- Fonts: Cache-first (permanent)

### 2. IndexedDB Cache Manager (`src/services/cache.ts`)

Sophisticated client-side caching with:

```typescript
import { getCacheManager } from '@/services/cache';

const cache = getCacheManager();
await cache.init();

// Cache a 3D model
await cache.cacheModel('vehicle-model-123', arrayBuffer, { vehicleId: '123' });

// Retrieve cached model
const model = await cache.getModel('vehicle-model-123');

// Cache API response with custom TTL
await cache.cacheResponse('/api/vehicles', data, 1000 * 60 * 15); // 15 min

// Get cache statistics
const stats = await cache.getStats();
console.log(`Total cache size: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`);
```

**Features:**
- LRU eviction strategy
- Automatic size management
- TTL-based expiration
- Access count tracking
- Separate stores for models, API responses, vehicles, analytics, preferences

### 3. Performance Monitoring (`src/services/performance.ts`)

Real-time performance tracking:

```typescript
import { initPerformanceMonitoring, trackMetric } from '@/services/performance';

// Initialize monitoring
const monitor = initPerformanceMonitoring();

// Track custom metrics
trackMetric('CustomOperation', duration, 'ms', { component: 'VehicleList' });

// Track 3D model load
monitor.track3DModelLoad('https://example.com/model.glb', startTime);

// Get performance report
const report = monitor.getReport();
console.log(monitor.getSummary());

// Report to analytics
await monitor.reportToAnalytics();
```

**Tracked Metrics:**
- Web Vitals (LCP, FID, CLS, FCP)
- Page load time
- Time to Interactive
- 3D model load times
- FPS (frames per second)
- Memory usage
- Network requests
- Cache hit rate
- Long tasks (> 50ms)

### 4. React Query Persistence (`src/lib/queryClient.ts`)

Enhanced React Query with IndexedDB persistence:

```typescript
import { createQueryClient, queryKeys, optimisticUpdates } from '@/lib/queryClient';

// Query keys factory
const vehicleQuery = queryKeys.vehicles.detail('vehicle-123');

// Optimistic updates
optimisticUpdates.updateVehicle(queryClient, 'vehicle-123', { status: 'active' });

// Get cache stats
const stats = await getCacheStats();
```

**Features:**
- Automatic query persistence to IndexedDB
- Smart TTL based on query type
- Optimistic updates
- Query key factories
- Prefetching common queries

**Query TTLs:**
- Static data (models, categories): 24 hours
- User data: 1 hour
- Analytics: 30 minutes
- Fleet data: 15 minutes
- Real-time data: 2 minutes

### 5. Image Optimization (`src/utils/imageOptimization.ts`)

Advanced image optimization utilities:

```typescript
import imageOptimization from '@/utils/imageOptimization';

// Get optimized image props
const imgProps = imageOptimization.getOptimizedImageProps('/path/to/image.jpg', {
  lazy: true,
  webp: true,
  responsive: true,
  blur: true,
});

// Lazy load image
imageOptimization.lazyLoadImage(imgElement, '/path/to/image.jpg');

// Preload critical images
await imageOptimization.preloadImage('/hero.jpg', 'high');
```

**Features:**
- Lazy loading with Intersection Observer
- WebP format detection and conversion
- Responsive images (srcSet, sizes)
- Blur placeholders
- Image preloading
- Client-side compression

### 6. Build Optimization (`vite.config.ts`)

Advanced Vite configuration with:

**Compression:**
- Gzip compression (files > 10KB)
- Brotli compression (files > 10KB)

**Code Splitting:**
- React core (separate chunk)
- UI libraries (split by component type)
- 3D libraries (split by usage)
- Maps vendor (separate heavy libs)
- Azure SDKs (separate chunk)

**Minification:**
- Terser with aggressive settings
- Console/debugger removal in production
- 3 compression passes
- Top-level mangling
- Tree shaking

**Asset Organization:**
```
dist/
├── assets/
│   ├── js/        # JavaScript chunks
│   ├── css/       # Stylesheets
│   ├── images/    # Images
│   ├── fonts/     # Fonts
│   └── models/    # 3D models
```

## Usage

### Initialize Caching System

```typescript
// In your main app file (App.tsx or main.tsx)
import { getCacheManager } from '@/services/cache';
import { initPerformanceMonitoring } from '@/services/performance';

// Initialize cache
const cache = getCacheManager();
await cache.init();

// Initialize performance monitoring
const perfMonitor = initPerformanceMonitoring();

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then((reg) => console.log('Service Worker registered'))
    .catch((err) => console.error('Service Worker registration failed:', err));
}
```

### Cache 3D Models

```typescript
// When loading a 3D model
const startTime = performance.now();

try {
  // Check cache first
  let modelData = await cache.getModel(modelUrl);

  if (!modelData) {
    // Load from network
    const response = await fetch(modelUrl);
    modelData = await response.arrayBuffer();

    // Cache for future use
    await cache.cacheModel(modelUrl, modelData, {
      vehicleId,
      format: 'glb',
    });
  }

  // Track load time
  perfMonitor.track3DModelLoad(modelUrl, startTime);

  return modelData;
} catch (error) {
  console.error('Model load failed:', error);
}
```

### Use Optimized Images

```tsx
import { getImageProps } from '@/utils/imageOptimization';

function VehicleImage({ src, alt }: { src: string; alt: string }) {
  const imgProps = getImageProps({
    src,
    alt,
    lazy: true,
    webp: true,
    responsive: true,
    blur: true,
    priority: false,
  });

  return <img {...imgProps} className="vehicle-image" />;
}
```

### Monitor Performance

```typescript
// Get performance summary
const perfMonitor = getPerformanceMonitor();
if (perfMonitor) {
  console.log(perfMonitor.getSummary());

  // Get specific metrics
  const avgFPS = perfMonitor.getAverageFPS();
  const memory = perfMonitor.getCurrentMemory();
  const avg3DLoad = perfMonitor.getAverage3DLoadTime();

  console.log(`Average FPS: ${avgFPS}`);
  console.log(`Memory: ${memory.toFixed(2)}MB`);
  console.log(`3D Model Load: ${avg3DLoad.toFixed(0)}ms`);
}
```

## Performance Targets

### Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **FCP** (First Contentful Paint): < 1.8s
- **TTI** (Time to Interactive): < 3.8s

### Application Metrics
- **FPS**: ≥ 60 (during 3D rendering)
- **Memory**: < 500 MB
- **3D Model Load**: < 3s (for models < 10MB)
- **Cache Hit Rate**: ≥ 70%
- **Bundle Size**: < 500 KB (main chunk)

## Cache Management

### Clear All Caches

```typescript
// Clear IndexedDB cache
await cache.clearAll();

// Clear Service Worker caches
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
  navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
}

// Clear React Query cache
queryClient.clear();
```

### Get Cache Statistics

```typescript
const stats = await cache.getStats();

console.log(`Total Size: ${(stats.totalSize / 1024 / 1024).toFixed(2)}MB`);

stats.stores.forEach((store) => {
  console.log(`${store.name}: ${store.count} entries, ${(store.size / 1024 / 1024).toFixed(2)}MB`);
});
```

### Manual Cache Eviction

```typescript
// Clear expired entries
const cleared = await cache.clearExpired();
console.log(`Cleared ${cleared} expired entries`);

// Clear specific store
await cache.clearStore('models3d');
```

## Build Commands

```bash
# Build with bundle analysis
npm run build:analyze

# Build with size report
npm run build:report

# Build with size check
npm run build:check

# Type check before build
npm run build:strict
```

## Browser Support

- Chrome 90+ (full support)
- Firefox 88+ (full support)
- Safari 14+ (limited Service Worker support)
- Edge 90+ (full support)

**Features with fallbacks:**
- Service Worker (graceful degradation)
- IndexedDB (required - no fallback)
- WebP (fallback to JPEG/PNG)
- Intersection Observer (fallback to immediate load)

## Monitoring and Debugging

### View Bundle Analysis

After build, open `dist/stats.html` to see:
- Bundle composition
- Chunk sizes (raw, gzip, brotli)
- Module dependencies
- Tree map visualization

### Service Worker Debug

```javascript
// In browser console
navigator.serviceWorker.ready.then((registration) => {
  // Send message to service worker
  registration.active.postMessage({ type: 'GET_CACHE_SIZE' });

  // Listen for response
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('Cache size:', event.data.size);
  });
});
```

### Performance DevTools

```typescript
// Log performance report
const perfMonitor = getPerformanceMonitor();
perfMonitor?.reportToAnalytics();

// View in console
console.table(perfMonitor?.getReport());
```

## Best Practices

1. **Always check cache first** before network requests for static data
2. **Use appropriate TTLs** - shorter for dynamic data, longer for static
3. **Monitor cache size** - evict aggressively if hitting limits
4. **Lazy load heavy resources** - especially 3D models and large images
5. **Prefetch critical resources** - use `<link rel="prefetch">` or service worker
6. **Track performance metrics** - monitor and optimize based on data
7. **Test offline scenarios** - ensure graceful degradation

## Troubleshooting

### Cache not working
- Check Service Worker registration
- Verify IndexedDB permissions
- Check browser compatibility

### High memory usage
- Reduce cache size limits
- Clear expired entries more frequently
- Disable 3D model caching for low-memory devices

### Slow 3D model loading
- Check cache hit rate
- Verify compression is working
- Consider reducing model quality

### Build errors
- Verify all dependencies are installed
- Check Node.js version (≥18)
- Clear node_modules and reinstall

## Future Enhancements

- [ ] WebAssembly module caching
- [ ] Predictive prefetching based on usage patterns
- [ ] Cache warming strategies
- [ ] Advanced compression for 3D models
- [ ] CDN integration for global distribution
- [ ] Server-side rendering with cache hydration
- [ ] Progressive Web App (PWA) full implementation
- [ ] Background sync for offline operations

## References

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [React Query Persistence](https://tanstack.com/query/latest/docs/react/plugins/persistQueryClient)
- [Web Vitals](https://web.dev/vitals/)
- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
