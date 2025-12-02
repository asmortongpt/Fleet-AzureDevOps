# Telemetry Integration Guide

> Quick reference for integrating telemetry into your components

## Quick Start

### 1. Add Consent Banner to App

```tsx
// src/App.tsx
import { ConsentBanner } from './components/ConsentBanner';
import { TelemetryDashboard } from './components/TelemetryDashboard';

function App() {
  return (
    <>
      {/* Your app content */}
      <ConsentBanner position="bottom" />

      {/* Dev-only dashboard */}
      {import.meta.env.DEV && <TelemetryDashboard />}
    </>
  );
}
```

### 2. Track Component Usage

```tsx
// Basic component tracking
import { useTelemetry } from '@/hooks/useTelemetry';

function VehicleList() {
  const telemetry = useTelemetry({
    componentName: 'VehicleList',
    trackMount: true,
    trackUnmount: true,
    category: 'vehicles'
  });

  const handleVehicleClick = (vehicleId: string) => {
    telemetry.track('vehicle_clicked', {
      vehicleId,
      source: 'list'
    });
  };

  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

### 3. Track Map Interactions

```tsx
// Map component with telemetry
import { useMapTelemetry } from '@/hooks/useTelemetry';

function FleetMap({ provider = 'mapbox' }) {
  const telemetry = useMapTelemetry(provider);
  const [zoom, setZoom] = useState(10);

  useEffect(() => {
    const loadStart = Date.now();

    // Load map...

    const loadTime = Date.now() - loadStart;
    telemetry.trackMapLoaded(provider, loadTime, {
      markerCount: markers.length,
      layerCount: layers.length
    });
  }, []);

  const handleZoomChange = (newZoom: number) => {
    telemetry.trackZoom(newZoom, zoom);
    setZoom(newZoom);
  };

  const handleMarkerClick = (marker: Marker) => {
    telemetry.trackMarkerClick(marker.id, marker.type, {
      status: marker.status,
      hasAlerts: marker.alerts > 0
    });
  };

  return (
    <Map
      onZoomChange={handleZoomChange}
      onMarkerClick={handleMarkerClick}
    />
  );
}
```

### 4. Track Performance

```tsx
// Performance monitoring
import { usePerformanceTelemetry } from '@/hooks/useTelemetry';

function DataTable() {
  const { measureAsync, metrics } = usePerformanceTelemetry('DataTable');

  const loadData = async () => {
    const data = await measureAsync('fetch_data', async () => {
      const response = await fetch('/api/data');
      return response.json();
    });

    return data;
  };

  const processData = (data: any[]) => {
    return measureSync('process_data', () => {
      // Heavy processing
      return data.map(/* ... */);
    });
  };

  // metrics.fetch_data and metrics.process_data now available
}
```

### 5. Track Errors

```tsx
// Error tracking with context
import { captureException, addBreadcrumb } from '@/services/errorReporting';

function ApiService() {
  const fetchVehicles = async () => {
    try {
      addBreadcrumb({
        category: 'api',
        message: 'Fetching vehicles',
        level: 'info',
        timestamp: Date.now()
      });

      const response = await fetch('/api/vehicles');

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      captureException(error, {
        component: 'ApiService',
        action: 'fetchVehicles',
        tags: {
          endpoint: '/api/vehicles',
          method: 'GET'
        },
        extra: {
          statusCode: response?.status
        }
      });
      throw error;
    }
  };
}
```

### 6. Error Boundary

```tsx
// Wrap components with error boundary
import { withErrorBoundary } from '@/services/errorReporting';

const VehicleMap = () => {
  return <Map />;
};

export default withErrorBoundary(VehicleMap, {
  fallback: ({ error, resetError }) => (
    <div className="error-fallback">
      <h2>Map Failed to Load</h2>
      <p>{error.message}</p>
      <button onClick={resetError}>Reload Map</button>
    </div>
  ),
  onError: (error, errorInfo) => {
    console.error('Map error:', error, errorInfo);
  }
});
```

## Map-Specific Events

### Common Map Events

```tsx
import { MapInteractionType } from '@/hooks/useTelemetry';

// Zoom tracking
telemetry.trackMapInteraction(MapInteractionType.ZOOM, {
  zoom: 15,
  previousZoom: 12,
  zoomDelta: 3
});

// Pan tracking
telemetry.trackMapInteraction(MapInteractionType.PAN, {
  center: [-84.28, 30.44],
  previousCenter: [-84.29, 30.43]
});

// Marker interaction
telemetry.trackMapInteraction(MapInteractionType.MARKER_CLICK, {
  markerId: 'vehicle-123',
  markerType: 'vehicle',
  status: 'active'
});

// Search
telemetry.trackSearch('search query', resultsCount, durationMs);

// Filter
telemetry.trackFilter('status', 'active', resultsCount);

// Route calculation
telemetry.trackRouteCalculation(waypointCount, distanceKm, durationMs);

// Export
telemetry.trackExport('geojson', itemCount);

// Import
telemetry.trackImport('csv', itemCount, success);
```

### Provider Changes

```tsx
const handleProviderChange = (newProvider: string) => {
  telemetry.trackProviderChange(newProvider, currentProvider);
  setProvider(newProvider);
};
```

### Layer Management

```tsx
const handleLayerToggle = (layerId: string, visible: boolean) => {
  telemetry.trackMapInteraction(MapInteractionType.LAYER_TOGGLE, {
    layerId,
    visible,
    totalLayers: layers.length
  });
};
```

## Privacy Controls

### Check Consent

```tsx
import { PrivacyManager, PrivacyCategory } from '@/utils/privacy';

// Check if user has consented to analytics
if (PrivacyManager.hasConsent(PrivacyCategory.ANALYTICS)) {
  // Track analytics event
}

// Check if consent is required
if (PrivacyManager.requiresConsent()) {
  // Show consent banner
}
```

### Programmatic Consent Management

```tsx
import { PrivacyManager, PrivacyCategory } from '@/utils/privacy';

// Grant all consent
PrivacyManager.grantConsent();

// Grant specific categories
PrivacyManager.grantConsent([
  PrivacyCategory.ESSENTIAL,
  PrivacyCategory.ANALYTICS
]);

// Deny all
PrivacyManager.denyConsent();

// Revoke and delete data
await PrivacyManager.requestDataDeletion();

// Export user data
const data = PrivacyManager.exportUserData();
```

## Advanced Usage

### Custom Event Properties

```tsx
// Rich event properties
telemetry.track('route_optimized', {
  algorithm: 'dijkstra',
  vehicleCount: 5,
  stopCount: 20,
  optimizationTime: 1234,
  savingsPercent: 15.5,
  constraints: ['time_windows', 'capacity'],
  success: true
});
```

### Performance Timing

```tsx
// Manual timing
const timing = telemetry.startTiming('complex_calculation');

// ... perform operation ...

telemetry.endTiming(timing);

// Custom metrics
telemetry.trackMetric('memory_usage', memoryMB, 'MB');
telemetry.trackMetric('cache_hit_rate', 0.85, 'ratio');
```

### Breadcrumbs

```tsx
import { addBreadcrumb, ErrorSeverity } from '@/services/errorReporting';

// Add navigation breadcrumb
addBreadcrumb({
  category: 'navigation',
  message: 'User navigated to vehicles page',
  level: ErrorSeverity.INFO,
  timestamp: Date.now()
});

// Add user action breadcrumb
addBreadcrumb({
  category: 'user',
  message: 'User clicked export button',
  level: ErrorSeverity.INFO,
  timestamp: Date.now(),
  data: {
    format: 'csv',
    recordCount: 100
  }
});

// Add API breadcrumb
addBreadcrumb({
  category: 'api',
  message: 'API request started',
  level: ErrorSeverity.DEBUG,
  timestamp: Date.now(),
  data: {
    endpoint: '/api/vehicles',
    method: 'GET'
  }
});
```

### User Identification

```tsx
import { analytics, setUser } from '@/services/analytics';
import { setUser as setErrorUser } from '@/services/errorReporting';

// Identify user (use hashed/anonymized ID)
const userId = await hashUserId(user.email);

analytics.identify({
  userId,
  plan: 'enterprise',
  companySize: '100-500'
});

setErrorUser({
  id: userId,
  email: user.email // Will be sanitized
});
```

### Session Management

```tsx
import { analytics } from '@/services/analytics';

// Get current session
const sessionId = analytics.getSessionId();
const sessionData = analytics.getSessionData();

console.log('Session:', sessionId);
console.log('Page views:', sessionData.pageViews);
console.log('Events:', sessionData.events);
```

## Configuration

### Environment Variables

```bash
# .env.development
VITE_ANALYTICS_ENDPOINT=http://localhost:3001/api/analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# .env.production
VITE_ANALYTICS_ENDPOINT=https://analytics.yourcompany.com/api
VITE_ANALYTICS_API_KEY=your_api_key
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_GA_MEASUREMENT_ID=G-YYYYYYYYYY
```

### Runtime Configuration

```tsx
import { getTelemetryConfig } from '@/config/telemetry';

const config = getTelemetryConfig();

console.log('Telemetry enabled:', config.enabled);
console.log('Level:', config.level);
console.log('Providers:', config.providers);
console.log('Sampling rate:', config.eventSamplingRate);
```

## Testing

### Disable in Tests

```tsx
// jest.setup.js
process.env.NODE_ENV = 'test';

// Telemetry is automatically disabled in test environment
```

### Mock Telemetry

```tsx
// __mocks__/useTelemetry.ts
export const useTelemetry = () => ({
  track: jest.fn(),
  trackMapInteraction: jest.fn(),
  trackMapLoaded: jest.fn(),
  trackMapError: jest.fn(),
  startTiming: jest.fn(() => ({ start: 0 })),
  endTiming: jest.fn(),
  trackMetric: jest.fn(),
  trackError: jest.fn(),
  isEnabled: false,
  sessionId: 'test-session'
});
```

## Best Practices

### 1. Don't Over-Track

```tsx
// ❌ Bad: Track every render
useEffect(() => {
  telemetry.track('component_rendered');
});

// ✅ Good: Track meaningful events
const handleSave = () => {
  telemetry.track('vehicle_saved', {
    hasChanges: true,
    fieldCount: changedFields.length
  });
};
```

### 2. Add Context

```tsx
// ❌ Bad: No context
telemetry.track('error');

// ✅ Good: Rich context
telemetry.trackError(error, {
  component: 'VehicleForm',
  action: 'submitForm',
  formValid: isValid,
  fieldCount: fields.length
});
```

### 3. Use Meaningful Names

```tsx
// ❌ Bad: Generic names
telemetry.track('click');

// ✅ Good: Descriptive names
telemetry.track('vehicle_export_clicked', {
  format: 'csv',
  filterApplied: true
});
```

### 4. Respect Privacy

```tsx
// ❌ Bad: Log PII
telemetry.track('user_login', {
  email: user.email,
  password: user.password // Never!
});

// ✅ Good: Anonymize
telemetry.track('user_login', {
  userId: await hashUserId(user.email),
  loginMethod: 'email'
});
```

### 5. Handle Errors Gracefully

```tsx
// ❌ Bad: Let telemetry crash app
telemetry.track('event', complexObject);

// ✅ Good: Wrap in try-catch
try {
  telemetry.track('event', {
    safe: 'data'
  });
} catch (error) {
  console.error('Telemetry error:', error);
  // App continues
}
```

## Troubleshooting

### Events Not Showing

1. Check telemetry is enabled: `getTelemetryConfig().enabled`
2. Check consent: `PrivacyManager.hasConsent(PrivacyCategory.ANALYTICS)`
3. Check Do Not Track: Browser settings
4. Check sampling: Events may be sampled in production

### Dashboard Not Visible

- Only shows in development mode
- Check for 📊 icon in bottom-right corner
- Check browser console for errors

### High Event Volume

- Increase sampling rate in production
- Reduce tracking frequency
- Use performance tracking sparingly

---

For more information, see [TELEMETRY.md](./TELEMETRY.md)
