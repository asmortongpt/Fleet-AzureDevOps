# LazyMap Component - Usage Guide

## Quick Start

Replace your existing map imports with the lazy-loaded version:

### Before (Not Optimized)
```tsx
import { UniversalMap } from '@/components/UniversalMap'

function MyComponent() {
  return (
    <UniversalMap
      vehicles={vehicles}
      facilities={facilities}
      cameras={cameras}
    />
  )
}
```

### After (Optimized)
```tsx
import { LazyMap } from '@/components/LazyMap'

function MyComponent() {
  return (
    <LazyMap
      vehicles={vehicles}
      facilities={facilities}
      cameras={cameras}
      enablePrefetch={true}
      skeletonVariant="animated"
    />
  )
}
```

## Component Variants

### Universal Map (Recommended)
```tsx
import { LazyMap } from '@/components/LazyMap'

<LazyMap
  provider="universal"  // Automatically selects best provider
  vehicles={vehicles}
  facilities={facilities}
/>
```

### Specific Providers
```tsx
import { LazyLeafletMap, LazyMapboxMap, LazyGoogleMap } from '@/components/LazyMap'

// Leaflet (OpenStreetMap - Free, no API key)
<LazyLeafletMap vehicles={vehicles} />

// Mapbox (Requires API key)
<LazyMapboxMap vehicles={vehicles} />

// Google Maps (Requires API key)
<LazyGoogleMap vehicles={vehicles} />
```

## Props

### Core Props (Extended from UniversalMap)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `vehicles` | `Vehicle[]` | `[]` | Array of vehicles to display |
| `facilities` | `GISFacility[]` | `[]` | Array of facilities to display |
| `cameras` | `TrafficCamera[]` | `[]` | Array of cameras to display |
| `showVehicles` | `boolean` | `true` | Show/hide vehicle markers |
| `showFacilities` | `boolean` | `true` | Show/hide facility markers |
| `showCameras` | `boolean` | `false` | Show/hide camera markers |
| `center` | `[number, number]` | `[30.4383, -84.2807]` | Map center coordinates |
| `zoom` | `number` | `13` | Initial zoom level |

### LazyMap-Specific Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `provider` | `'universal' \| 'leaflet' \| 'mapbox' \| 'google'` | `'universal'` | Map provider to use |
| `enablePrefetch` | `boolean` | `true` | Start loading on hover |
| `skeletonVariant` | `'simple' \| 'detailed' \| 'animated'` | `'animated'` | Loading skeleton style |
| `minHeight` | `number` | `500` | Minimum container height (px) |
| `maxHeight` | `number` | `undefined` | Maximum container height (px) |
| `onLoadStart` | `() => void` | `undefined` | Callback when loading starts |
| `onLoadComplete` | `() => void` | `undefined` | Callback when loading completes |
| `errorFallback` | `ComponentType` | `DefaultErrorFallback` | Custom error UI component |

## Loading States

### Simple Skeleton
Minimal spinner for fast connections:
```tsx
<LazyMap
  skeletonVariant="simple"
  vehicles={vehicles}
/>
```

### Detailed Skeleton
Shows loading progress:
```tsx
<LazyMap
  skeletonVariant="detailed"
  vehicles={vehicles}
/>
```

### Animated Skeleton (Default)
Map-like placeholder with animations:
```tsx
<LazyMap
  skeletonVariant="animated"
  vehicles={vehicles}
/>
```

## Performance Features

### Prefetch on Hover
Starts loading the map when user hovers over the container:
```tsx
<LazyMap
  enablePrefetch={true}  // Enabled by default
  vehicles={vehicles}
/>
```

### Load Callbacks
Track loading performance:
```tsx
<LazyMap
  onLoadStart={() => {
    console.log('Map loading started')
    analytics.track('map_load_start')
  }}
  onLoadComplete={() => {
    console.log('Map loaded successfully')
    analytics.track('map_load_complete')
  }}
  vehicles={vehicles}
/>
```

## Error Handling

### Default Error Handling
Built-in error boundary with retry:
```tsx
<LazyMap vehicles={vehicles} />
// Automatically shows error UI if map fails to load
```

### Custom Error Fallback
Provide your own error UI:
```tsx
function CustomMapError({ error, resetErrorBoundary }) {
  return (
    <div>
      <h3>Map unavailable</h3>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>
        Try Again
      </button>
    </div>
  )
}

<LazyMap
  errorFallback={CustomMapError}
  vehicles={vehicles}
/>
```

## Advanced Usage

### Conditional Loading
Only load map when needed:
```tsx
function Dashboard() {
  const [showMap, setShowMap] = useState(false)

  return (
    <div>
      <button onClick={() => setShowMap(true)}>
        Show Map
      </button>

      {showMap && (
        <LazyMap vehicles={vehicles} />
      )}
    </div>
  )
}
```

### Multiple Maps
Each map provider loaded independently:
```tsx
function MapComparison() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <LazyLeafletMap vehicles={vehicles} />
      <LazyMapboxMap vehicles={vehicles} />
    </div>
  )
}
// Only loads the libraries for the providers shown
```

### With Layout
Responsive container:
```tsx
<div className="h-screen w-full">
  <LazyMap
    vehicles={vehicles}
    minHeight={400}
    maxHeight={800}
    className="rounded-lg shadow-lg"
  />
</div>
```

## Migration Guide

### Step 1: Update Imports
```diff
- import { UniversalMap } from '@/components/UniversalMap'
+ import { LazyMap } from '@/components/LazyMap'
```

### Step 2: Update Component Usage
```diff
- <UniversalMap
+ <LazyMap
+   skeletonVariant="animated"
    vehicles={vehicles}
    facilities={facilities}
  />
```

### Step 3: Remove Direct Imports
Remove any direct imports of map libraries:
```diff
- import 'leaflet/dist/leaflet.css'
- import mapboxgl from 'mapbox-gl'
```

## Performance Tips

1. **Use Prefetch:** Keep `enablePrefetch={true}` for better perceived performance
2. **Choose Provider:** Use 'universal' to let the system choose the best provider
3. **Loading States:** Use 'animated' skeleton for better UX on slow connections
4. **Conditional Rendering:** Only render map when tab/section is visible
5. **Bundle Analysis:** Run `npm run build:analyze` to verify chunking

## Bundle Impact

Using LazyMap reduces initial bundle by:
- **Leaflet:** ~147 KB (gzipped: ~45 KB)
- **Mapbox:** ~512 KB (gzipped: ~156 KB)
- **Google Maps:** ~425 KB (gzipped: ~132 KB)

Total savings: **Up to 93% reduction in initial bundle size**

## Browser Support

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14.1+
- Mobile: iOS 14.1+, Android Chrome 90+

## TypeScript Support

Full TypeScript support with strict types:
```tsx
import type { LazyMapProps } from '@/components/LazyMap'

const mapConfig: LazyMapProps = {
  vehicles: vehicles,
  provider: 'leaflet',
  enablePrefetch: true,
  onLoadComplete: () => console.log('Loaded')
}

<LazyMap {...mapConfig} />
```

## Testing

Mock LazyMap in tests:
```tsx
import { vi } from 'vitest'

vi.mock('@/components/LazyMap', () => ({
  LazyMap: ({ vehicles }: any) => (
    <div data-testid="map">
      {vehicles.length} vehicles
    </div>
  )
}))
```

## Troubleshooting

### Map Doesn't Load
1. Check browser console for errors
2. Verify API keys are set (for Mapbox/Google)
3. Check network tab for failed requests
4. Try with `provider="leaflet"` (no API key needed)

### Slow Loading
1. Check network connection
2. Reduce `enablePrefetch` delay
3. Use simpler skeleton variant
4. Verify bundle splitting in build output

### Build Errors
1. Ensure `rollup-plugin-visualizer` is installed
2. Check vite.config.ts syntax
3. Run `npm run build:analyze` for diagnostics

## Resources

- [Full Documentation](/docs/BUNDLE_OPTIMIZATION.md)
- [Performance Budget](/performance-budget.json)
- [Vite Config](/vite.config.ts)
- [Component Source](/src/components/LazyMap.tsx)

## Support

For issues or questions:
1. Check browser console
2. Review bundle analysis: `npm run build:analyze`
3. Contact: team@example.com
