# Map Components Performance Optimization Guide

> Comprehensive guide for optimizing map component performance in the Fleet Management System

**Last Updated:** November 16, 2025
**Version:** 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Performance Baselines](#performance-baselines)
3. [Common Bottlenecks](#common-bottlenecks)
4. [Optimization Strategies](#optimization-strategies)
5. [Marker Count Recommendations](#marker-count-recommendations)
6. [Clustering Strategies](#clustering-strategies)
7. [Lazy Loading Techniques](#lazy-loading-techniques)
8. [Memory Optimization](#memory-optimization)
9. [Rendering Performance](#rendering-performance)
10. [Network Optimization](#network-optimization)
11. [Monitoring and Profiling](#monitoring-and-profiling)
12. [Best Practices Checklist](#best-practices-checklist)

---

## Overview

Map components are among the most resource-intensive parts of the Fleet Management application. This guide provides actionable strategies to ensure optimal performance across all devices and network conditions.

### Key Performance Goals

- **Initialization:** < 1s for typical datasets (100 markers)
- **FPS:** Maintain 60 FPS during interactions
- **Memory:** < 100MB heap for 1000 markers
- **Responsiveness:** < 100ms response to user interactions
- **Core Web Vitals:** Pass all Google LCP, FID, and CLS thresholds

---

## Performance Baselines

### Acceptable Performance Ranges

| Marker Count | Init Time | Memory Usage | FPS Target | Clustering |
|--------------|-----------|--------------|------------|------------|
| 10           | < 100ms   | < 20MB       | 60 FPS     | No         |
| 100          | < 500ms   | < 50MB       | 60 FPS     | Optional   |
| 1,000        | < 2s      | < 100MB      | 45+ FPS    | Yes        |
| 10,000       | < 5s      | < 200MB      | 30+ FPS    | Required   |
| 100,000+     | < 15s     | < 500MB      | 30+ FPS    | Required   |

### Browser Compatibility

Performance targets are based on:
- **Desktop:** Chrome 120+, Firefox 120+, Safari 17+, Edge 120+
- **Mobile:** iOS Safari 17+, Chrome Android 120+
- **Minimum Hardware:** 4GB RAM, 2-core CPU

---

## Common Bottlenecks

### 1. Excessive DOM Manipulation

**Problem:** Creating hundreds or thousands of DOM elements for markers causes rendering delays.

**Symptoms:**
- Slow initial render
- Janky scrolling/panning
- High CPU usage

**Solutions:**
- Implement clustering for > 100 markers
- Use virtual DOM rendering
- Batch DOM updates
- Reuse marker elements where possible

### 2. Inefficient Marker Updates

**Problem:** Re-rendering all markers when only a few change.

**Symptoms:**
- Slow filter operations
- Laggy real-time updates
- High frame times

**Solutions:**
- Implement incremental updates
- Use React.memo or similar memoization
- Debounce rapid updates
- Only update visible markers

### 3. Memory Leaks

**Problem:** References to removed markers not being garbage collected.

**Symptoms:**
- Increasing memory usage over time
- Browser tabs becoming unresponsive
- Crashes on long sessions

**Solutions:**
- Properly cleanup event listeners
- Remove marker references when clearing
- Use WeakMap for marker storage
- Call .remove() on Mapbox/Leaflet markers

### 4. Synchronous Data Processing

**Problem:** Large dataset processing blocks the main thread.

**Symptoms:**
- Frozen UI during data load
- Unresponsive interactions
- Poor user experience

**Solutions:**
- Use Web Workers for data processing
- Implement progressive loading
- Break work into chunks with requestIdleCallback
- Show loading states

### 5. Unoptimized Image Assets

**Problem:** Large marker icons and popup images slow rendering.

**Symptoms:**
- Slow marker rendering
- High network usage
- Poor performance on slow connections

**Solutions:**
- Use SVG icons instead of PNG
- Lazy load popup images
- Implement image sprites
- Use WebP format with fallbacks

---

## Optimization Strategies

### 1. Marker Clustering

**When to Use:**
- > 100 markers on screen
- Dense geographic distribution
- Mobile devices
- Limited screen space

**Implementation:**

```typescript
import { MarkerClusterer } from '@react-google-maps/api';

// For Google Maps
<MarkerClusterer
  options={{
    imagePath: '/cluster-icons/',
    gridSize: 60,
    maxZoom: 15,
    minimumClusterSize: 2,
  }}
>
  {markers}
</MarkerClusterer>

// For Leaflet
import L from 'leaflet';
import 'leaflet.markercluster';

const markers = L.markerClusterGroup({
  maxClusterRadius: 80,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
});
```

**Performance Impact:**
- 10,000 markers: 90% faster rendering
- 50,000 markers: 95% faster rendering
- Memory: 60% reduction

### 2. Virtualization

**When to Use:**
- Marker lists in sidebars
- Large datasets with filters
- Search results

**Implementation:**

```typescript
import { FixedSizeList } from 'react-window';

function MarkerList({ markers }) {
  return (
    <FixedSizeList
      height={600}
      itemCount={markers.length}
      itemSize={80}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <MarkerItem marker={markers[index]} />
        </div>
      )}
    </FixedSizeList>
  );
}
```

**Performance Impact:**
- Renders only visible items
- Constant memory usage regardless of list size
- Smooth scrolling even with 100,000+ items

### 3. Debouncing and Throttling

**When to Use:**
- Map pan/zoom events
- Search input
- Filter changes
- Real-time updates

**Implementation:**

```typescript
import { debounce } from 'lodash-es';
import { throttle } from 'lodash-es';

// Debounce search (wait for user to stop typing)
const handleSearch = debounce((query: string) => {
  performSearch(query);
}, 300);

// Throttle map pan (limit update frequency)
const handleMapMove = throttle(() => {
  updateVisibleMarkers();
}, 100);
```

**Performance Impact:**
- 70% reduction in unnecessary operations
- Smoother user experience
- Lower CPU usage

### 4. Progressive Loading

**When to Use:**
- Large initial datasets
- Slow network connections
- Mobile devices

**Implementation:**

```typescript
async function loadMarkersProgressively(allMarkers: Vehicle[]) {
  const chunkSize = 100;

  for (let i = 0; i < allMarkers.length; i += chunkSize) {
    const chunk = allMarkers.slice(i, i + chunkSize);

    // Add chunk to map
    addMarkersToMap(chunk);

    // Yield to browser for rendering
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

**Performance Impact:**
- Faster perceived load time
- No UI freezing
- Better user experience

---

## Marker Count Recommendations

### Production Guidelines

| Dataset Size | Strategy | Clustering | Virtualization | Expected Performance |
|--------------|----------|------------|----------------|---------------------|
| < 100        | Direct render | No | No | Excellent (< 500ms) |
| 100-500      | Direct render + optimization | Optional | No | Good (< 2s) |
| 500-5,000    | Clustering required | Yes | Yes (for lists) | Acceptable (< 5s) |
| 5,000-50,000 | Advanced clustering | Yes | Yes | Fair (< 15s) |
| 50,000+      | Server-side clustering | Yes | Yes | Depends on server |

### Cluster Configuration by Scale

```typescript
// Small datasets (100-500)
const smallClusterConfig = {
  maxClusterRadius: 40,
  maxZoom: 16,
  minimumClusterSize: 3,
};

// Medium datasets (500-5,000)
const mediumClusterConfig = {
  maxClusterRadius: 60,
  maxZoom: 14,
  minimumClusterSize: 5,
};

// Large datasets (5,000+)
const largeClusterConfig = {
  maxClusterRadius: 80,
  maxZoom: 12,
  minimumClusterSize: 10,
};
```

---

## Clustering Strategies

### Algorithm Comparison

| Algorithm | Best For | Performance | Memory | Pros | Cons |
|-----------|----------|-------------|--------|------|------|
| Grid-based | Very large datasets | Excellent | Low | Fast, predictable | Less visually pleasing |
| K-means | Medium datasets | Good | Medium | Natural clusters | Slower, inconsistent |
| Hierarchical | All sizes | Good | Medium | Zoom-adaptive | Complex implementation |
| Supercluster | Mapbox/Leaflet | Excellent | Low | Battle-tested | Library dependency |

### Recommended: Supercluster

```typescript
import Supercluster from 'supercluster';

const index = new Supercluster({
  radius: 60,
  maxZoom: 16,
  minZoom: 0,
  extent: 512,
  nodeSize: 64,
});

// Index points
index.load(geoJsonPoints);

// Get clusters for current viewport
const clusters = index.getClusters(bbox, zoom);

// Get cluster children
const children = index.getChildren(clusterId);
```

### Dynamic Clustering

```typescript
function getDynamicClusterConfig(markerCount: number) {
  if (markerCount < 100) {
    return { enabled: false };
  } else if (markerCount < 1000) {
    return { radius: 40, maxZoom: 16 };
  } else if (markerCount < 10000) {
    return { radius: 60, maxZoom: 14 };
  } else {
    return { radius: 80, maxZoom: 12 };
  }
}
```

---

## Lazy Loading Techniques

### 1. Lazy Load Marker Popups

```typescript
function LazyPopup({ marker }: { marker: Vehicle }) {
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    // Only load detailed data when popup opens
    if (marker.popupOpen) {
      fetchMarkerDetails(marker.id).then(setContent);
    }
  }, [marker.popupOpen]);

  return content ? <PopupContent>{content}</PopupContent> : <Spinner />;
}
```

### 2. Lazy Load Map Provider

```typescript
const MapComponent = lazy(() =>
  import('./MapboxMap').then(module => ({ default: module.MapboxMap }))
);

function App() {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <MapComponent />
    </Suspense>
  );
}
```

### 3. Lazy Load Tile Layers

```typescript
const layers = {
  base: 'mapbox://styles/mapbox/streets-v12',
  satellite: lazy(() => import('./satellite-layer')),
  traffic: lazy(() => import('./traffic-layer')),
};

// Load only when user enables
function toggleLayer(layerName: string) {
  if (!loadedLayers.has(layerName)) {
    loadLayer(layers[layerName]);
  }
}
```

---

## Memory Optimization

### 1. Proper Cleanup

```typescript
useEffect(() => {
  const markers = createMarkers(vehicles);

  return () => {
    // CRITICAL: Clean up all markers
    markers.forEach(marker => {
      marker.remove(); // Remove from map
      marker.off(); // Remove event listeners
    });
    markers.length = 0; // Clear array
  };
}, [vehicles]);
```

### 2. WeakMap for Marker References

```typescript
// Use WeakMap to allow garbage collection
const markerCache = new WeakMap<Vehicle, mapboxgl.Marker>();

function getMarker(vehicle: Vehicle) {
  if (!markerCache.has(vehicle)) {
    const marker = createMarker(vehicle);
    markerCache.set(vehicle, marker);
  }
  return markerCache.get(vehicle)!;
}
```

### 3. Limit Data in Memory

```typescript
// Only keep essential data for markers
const markerData = vehicles.map(v => ({
  id: v.id,
  position: [v.location.lat, v.location.lng],
  status: v.status,
  // Don't include large objects like history, images, etc.
}));

// Load details on-demand
async function loadVehicleDetails(id: string) {
  return fetch(`/api/vehicles/${id}`);
}
```

### 4. Monitor Memory Usage

```typescript
function logMemoryUsage() {
  if (performance.memory) {
    const used = performance.memory.usedJSHeapSize / 1048576;
    const total = performance.memory.totalJSHeapSize / 1048576;
    console.log(`Memory: ${used.toFixed(2)}MB / ${total.toFixed(2)}MB`);
  }
}

// Monitor every 30 seconds
setInterval(logMemoryUsage, 30000);
```

---

## Rendering Performance

### 1. RequestAnimationFrame for Updates

```typescript
let rafId: number;
const pendingUpdates: Vehicle[] = [];

function updateMarker(vehicle: Vehicle) {
  pendingUpdates.push(vehicle);

  if (!rafId) {
    rafId = requestAnimationFrame(() => {
      // Batch all updates in single frame
      pendingUpdates.forEach(v => applyMarkerUpdate(v));
      pendingUpdates.length = 0;
      rafId = 0;
    });
  }
}
```

### 2. CSS Transforms for Animations

```typescript
// Use CSS transforms (GPU-accelerated)
markerElement.style.transform = `translate(${x}px, ${y}px)`;

// Avoid
markerElement.style.left = `${x}px`; // Forces layout
markerElement.style.top = `${y}px`;
```

### 3. Limit Popup Complexity

```typescript
// Bad: Complex popup with many components
<Popup>
  <FullVehicleDetails vehicle={vehicle} />
</Popup>

// Good: Simplified popup
<Popup>
  <h3>{vehicle.name}</h3>
  <p>Status: {vehicle.status}</p>
  <button onClick={() => showDetailModal(vehicle)}>
    View Details
  </button>
</Popup>
```

---

## Network Optimization

### 1. Tile Caching

```typescript
// Configure tile caching
const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  // Enable browser caching
  crossOrigin: true,
  // Preload adjacent tiles
  keepBuffer: 2,
});
```

### 2. Reduce API Calls

```typescript
// Bad: Fetch each vehicle separately
vehicles.forEach(v => fetch(`/api/vehicles/${v.id}`));

// Good: Batch request
const ids = vehicles.map(v => v.id);
fetch(`/api/vehicles?ids=${ids.join(',')}`);

// Better: Use GraphQL or similar
const query = gql`
  query GetVehicles($ids: [ID!]!) {
    vehicles(ids: $ids) {
      id location status
    }
  }
`;
```

### 3. Compression

```typescript
// Enable gzip/brotli compression on server
// Nginx example:
// gzip on;
// gzip_types application/json application/javascript;
// gzip_min_length 1000;

// Use smaller data format
// Bad: Full ISO dates
{ timestamp: "2025-11-16T12:00:00.000Z" }

// Good: Unix timestamps
{ timestamp: 1700136000 }
```

---

## Monitoring and Profiling

### 1. Performance Monitoring

```typescript
import { initRUM } from '@/utils/rum';

// Initialize RUM tracking
const rum = initRUM({
  endpoint: '/api/rum',
  userId: currentUser.id,
});

// Track map operations
rum.trackMapInit(initDuration, 'mapbox');
rum.trackMarkerRender(count, duration, clustered);
rum.trackMapInteraction('zoom', duration);
```

### 2. Chrome DevTools

Key metrics to monitor:
- **Performance tab:** FPS, frame timing, long tasks
- **Memory tab:** Heap snapshots, allocation timeline
- **Network tab:** Request count, transfer size
- **Lighthouse:** Core Web Vitals, performance score

### 3. Production Monitoring

```typescript
// Log slow operations
function trackPerformance(name: string, duration: number) {
  if (duration > THRESHOLD) {
    analytics.track('slow_operation', {
      operation: name,
      duration,
      userAgent: navigator.userAgent,
      markerCount: currentMarkerCount,
    });
  }
}
```

---

## Best Practices Checklist

### Development

- [ ] Enable clustering for > 100 markers
- [ ] Use virtualization for lists
- [ ] Implement progressive loading for large datasets
- [ ] Debounce/throttle frequent events
- [ ] Lazy load non-critical features
- [ ] Use React.memo for expensive components
- [ ] Batch DOM updates
- [ ] Clean up event listeners and markers

### Testing

- [ ] Test with 10, 100, 1,000, and 10,000 markers
- [ ] Test on slow devices (throttled CPU)
- [ ] Test on slow networks (3G)
- [ ] Run memory profiling for leaks
- [ ] Measure Core Web Vitals
- [ ] Test mobile devices
- [ ] Run load tests

### Deployment

- [ ] Enable production optimizations
- [ ] Configure CDN for map tiles
- [ ] Enable gzip/brotli compression
- [ ] Set up performance monitoring
- [ ] Configure error tracking
- [ ] Document performance baseline
- [ ] Set up automated regression tests

### Monitoring

- [ ] Track Core Web Vitals
- [ ] Monitor memory usage
- [ ] Track API response times
- [ ] Monitor error rates
- [ ] Set up alerts for regressions
- [ ] Review performance weekly

---

## Additional Resources

- [Performance Budget](../performance-budget.json)
- [Benchmark Suite](../benchmarks/map-components.bench.ts)
- [Load Tests](../tests/load/map-stress-test.ts)
- [RUM Implementation](../src/utils/rum.ts)
- [Google Maps Performance Guide](https://developers.google.com/maps/documentation/javascript/performance)
- [Mapbox Performance Tips](https://docs.mapbox.com/mapbox-gl-js/guides/performance/)
- [Web.dev Performance Guide](https://web.dev/performance/)

---

## Support

For questions or issues related to map performance:
- **Email:** performance@fleetmanagement.com
- **Slack:** #performance-optimization
- **Documentation:** [Performance Wiki](https://wiki.fleetmanagement.com/performance)

---

**Version History:**
- 1.0.0 (2025-11-16): Initial release
