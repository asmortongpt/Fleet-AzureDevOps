# Map Error Recovery System

Comprehensive documentation for the advanced error recovery and retry system for map components.

## Overview

The Map Error Recovery System provides production-ready error handling, automatic retry logic, circuit breaker patterns, health monitoring, and graceful degradation for all map services in the Fleet application.

## Features

### 1. Exponential Backoff Retry Logic
- **Configurable retry attempts** with exponential backoff (1s, 2s, 4s, 8s, ...)
- **Jitter** to prevent thundering herd problem in distributed systems
- **Timeout handling** with AbortController integration
- **Request deduplication** for in-flight requests
- **Smart error categorization** (network, API, timeout, rate limit, etc.)

### 2. Circuit Breaker Pattern
- **Three states**: CLOSED (normal), OPEN (failing), HALF_OPEN (testing recovery)
- **Automatic state transitions** based on failure thresholds
- **Configurable thresholds** and recovery timeouts
- **Prevents cascading failures** by stopping requests when service is down
- **Automatic recovery attempts** when service becomes available

### 3. Health Check System
- **Periodic health checks** for all map service providers
- **Response time monitoring** and averaging
- **Uptime tracking** and statistics
- **Rate limit detection** with automatic provider switching
- **Service availability dashboard** with real-time updates
- **Preemptive error detection** before users are affected

### 4. Advanced Error Boundaries
- **Error categorization** with user-friendly messages
- **Automatic retry** with visual feedback
- **Provider fallback** (Google Maps → OpenStreetMap)
- **Error reporting** to monitoring services (Sentry, LogRocket, etc.)
- **Actionable recovery steps** for users
- **Development mode details** for debugging

### 5. Graceful Degradation
- **Offline mode detection** and handling
- **Automatic provider switching** when service is unhealthy
- **Fallback strategies** for different error types
- **User notifications** with recovery status
- **Network information** tracking (connection type, speed, etc.)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  EnhancedUniversalMap                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              MapErrorBoundary                        │  │
│  │  ┌────────────────────────────────────────────────┐ │  │
│  │  │         UniversalMap                           │ │  │
│  │  │  ┌──────────────┐  ┌──────────────┐          │ │  │
│  │  │  │ GoogleMap    │  │ LeafletMap   │          │ │  │
│  │  │  └──────────────┘  └──────────────┘          │ │  │
│  │  └────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
  useErrorRecovery    MapHealthCheck        Retry Utils
  (Circuit Breaker)   (Health Monitor)  (Exponential Backoff)
```

## Components

### 1. Retry Utilities (`src/utils/retry.ts`)

Core retry logic with exponential backoff and jitter.

```typescript
import { withRetry, retryFetch, retryMapOperation } from '@/utils/retry'

// Basic retry with default config
const result = await withRetry(async () => {
  return await fetchMapData()
})

// Retry with custom config
const result = await withRetry(
  async () => fetchMapData(),
  {
    maxAttempts: 5,
    initialDelay: 2000,
    maxDelay: 30000,
    enableJitter: true,
    timeout: 10000,
    onRetry: (error, attempt, delay) => {
      console.log(`Retry attempt ${attempt} after ${delay}ms`)
    },
  }
)

// Retry fetch requests
const response = await retryFetch('https://api.example.com/data', {
  retryConfig: {
    maxAttempts: 3,
    initialDelay: 1000,
  }
})

// Retry map operations
const data = await retryMapOperation(async () => {
  return await loadMapTiles()
})
```

#### Error Categorization

Errors are automatically categorized for smart retry decisions:

- **NETWORK**: Network connectivity issues (always retry)
- **TIMEOUT**: Request timeouts (always retry)
- **RATE_LIMIT**: API rate limiting (retry with backoff)
- **API_ERROR**: Server errors 5xx (retry)
- **AUTHENTICATION**: Auth failures (don't retry)
- **VALIDATION**: Bad requests 4xx (don't retry)
- **RENDERING**: Map rendering errors (retry)
- **UNKNOWN**: Uncategorized errors (retry with caution)

### 2. Error Recovery Hook (`src/hooks/useErrorRecovery.ts`)

React hook implementing circuit breaker pattern.

```typescript
import { useErrorRecovery } from '@/hooks/useErrorRecovery'

function MyMapComponent() {
  const recovery = useErrorRecovery({
    failureThreshold: 5,
    recoveryTimeout: 60000,
    maxRecoveryAttempts: 3,
    enableNotifications: true,
    enableAutoRecovery: true,
    onError: (error) => {
      console.error('Map error:', error)
    },
    onRecovery: () => {
      console.log('Map recovered!')
    },
    fallback: async () => {
      // Switch to fallback provider
      setProvider('leaflet')
    },
  })

  const loadMap = async () => {
    const result = await recovery.execute(async () => {
      return await initializeMap()
    })
  }

  return (
    <div>
      {recovery.error && (
        <div>
          Error: {recovery.categorizedError?.category}
          <button onClick={recovery.recover}>Retry</button>
          <button onClick={recovery.reset}>Reset</button>
        </div>
      )}
      {/* Map component */}
    </div>
  )
}
```

#### Circuit Breaker States

- **CLOSED**: Normal operation, all requests allowed
- **OPEN**: Service failing, requests rejected immediately
- **HALF_OPEN**: Testing recovery, limited requests allowed

### 3. Map Error Boundary (`src/components/MapErrorBoundary.tsx`)

Advanced error boundary with automatic recovery.

```typescript
import { MapErrorBoundary } from '@/components/MapErrorBoundary'

<MapErrorBoundary
  provider="google"
  onError={(error, errorInfo) => {
    console.error('Error caught:', error)
  }}
  onFallbackProvider={(provider) => {
    setProvider(provider)
  }}
  enableAutoRetry={true}
  maxRetries={3}
  enableErrorReporting={true}
  enableProviderFallback={true}
>
  <UniversalMap {...mapProps} />
</MapErrorBoundary>
```

#### Error Actions

Based on error category, users get actionable recovery steps:

- **Network Errors**: Check connection, retry, use offline mode
- **Timeouts**: Retry, switch provider, reload page
- **Rate Limits**: Wait & retry, switch provider
- **Auth Errors**: Use free map, reload page
- **API Errors**: Retry, switch provider, report issue
- **Rendering Errors**: Retry, clear cache, switch provider

### 4. Health Check System (`src/utils/mapHealthCheck.ts`)

Monitors map service health in real-time.

```typescript
import { MapHealthCheckManager, useMapHealthCheck } from '@/utils/mapHealthCheck'

// Singleton manager
const manager = new MapHealthCheckManager({
  interval: 60000,
  enabled: true,
  onStatusChange: (provider, status) => {
    console.log(`${provider} is now ${status}`)
  },
  onRateLimitDetected: (provider, resetTime) => {
    console.warn(`Rate limit on ${provider}`)
  },
})

// Start monitoring
manager.startMonitoring('google')
manager.startMonitoring('leaflet')

// Check health
const result = await manager.checkHealth('google')

// Get statistics
const stats = manager.getStatistics('google')
console.log('Uptime:', stats.uptime)
console.log('Avg response:', stats.averageResponseTime)

// Get recommended provider
const best = manager.getRecommendedProvider()

// React hook
function MyComponent() {
  const health = useMapHealthCheck(['google', 'leaflet'], {
    interval: 60000,
  })

  return (
    <div>
      <div>Recommended: {health.recommendedProvider}</div>
      <div>Google status: {health.getStatus('google')}</div>
      <button onClick={() => health.checkHealth('google')}>
        Check Now
      </button>
    </div>
  )
}
```

#### Health Metrics

- **Response Time**: Average response time in milliseconds
- **Uptime**: Percentage of successful checks
- **Success Rate**: Ratio of successful to failed checks
- **Rate Limiting**: Detection of quota exhaustion
- **Recent History**: Last N health check results

### 5. Enhanced Universal Map (`src/components/EnhancedUniversalMap.tsx`)

Fully integrated map component with all recovery features.

```typescript
import { EnhancedUniversalMap } from '@/components/EnhancedUniversalMap'

<EnhancedUniversalMap
  // Map props
  vehicles={vehicles}
  facilities={facilities}
  cameras={cameras}
  center={[30.4383, -84.2807]}
  zoom={13}

  // Error recovery options
  enableErrorRecovery={true}
  enableHealthMonitoring={true}
  enableOfflineDetection={true}
  showHealthStatus={true}
  showRecoveryControls={true}

  // Callbacks
  onMapReady={(provider) => {
    console.log('Map ready:', provider)
  }}
  onMapError={(error, provider) => {
    console.error('Map error:', error)
  }}
  onRecoverySuccess={() => {
    console.log('Recovery successful!')
  }}
  onProviderSwitch={(from, to) => {
    console.log(`Switched: ${from} → ${to}`)
  }}
/>
```

### 6. Health Dashboard (`src/components/MapHealthDashboard.tsx`)

Visual dashboard for monitoring map service health.

```typescript
import { MapHealthDashboard } from '@/components/MapHealthDashboard'

<MapHealthDashboard
  providers={['google', 'leaflet', 'arcgis']}
  showDetails={true}
  enableManualCheck={true}
  onProviderSelect={(provider) => {
    console.log('Selected:', provider)
  }}
/>
```

## Usage Examples

### Basic Integration

Replace existing `UniversalMap` with `EnhancedUniversalMap`:

```typescript
// Before
<UniversalMap
  vehicles={vehicles}
  facilities={facilities}
  cameras={cameras}
/>

// After - with full error recovery
<EnhancedUniversalMap
  vehicles={vehicles}
  facilities={facilities}
  cameras={cameras}
  enableErrorRecovery={true}
  enableHealthMonitoring={true}
/>
```

### Advanced Configuration

Full configuration with all options:

```typescript
<EnhancedUniversalMap
  // Map configuration
  vehicles={fleetData.vehicles}
  facilities={fleetData.facilities}
  cameras={trafficCameras}
  center={[30.4383, -84.2807]}
  zoom={13}
  showVehicles={true}
  showFacilities={true}
  showCameras={true}
  enableClustering={true}

  // Error recovery
  enableErrorRecovery={true}
  enableHealthMonitoring={true}
  enableOfflineDetection={true}

  // UI options
  showHealthStatus={true}
  showRecoveryControls={true}

  // Callbacks
  onMapReady={(provider) => {
    analytics.track('map_ready', { provider })
  }}
  onMapError={(error, provider) => {
    Sentry.captureException(error, {
      tags: { provider, component: 'map' }
    })
  }}
  onRecoverySuccess={() => {
    analytics.track('map_recovered')
  }}
  onProviderSwitch={(from, to) => {
    analytics.track('provider_switch', { from, to })
  }}
/>
```

### Custom Error Handling

Implement custom error handling logic:

```typescript
function MyMapComponent() {
  const recovery = useErrorRecovery({
    failureThreshold: 3,
    onError: async (error) => {
      // Log to your monitoring service
      await Sentry.captureException(error)

      // Notify user
      toast.error(`Map error: ${error.message}`)

      // Custom recovery logic
      if (error.category === 'RATE_LIMIT') {
        // Switch to free provider immediately
        setProvider('leaflet')
      }
    },
    fallback: async () => {
      // Load cached map data
      const cached = await loadCachedMapData()
      setMapData(cached)
    },
  })

  return (
    <MapErrorBoundary
      onError={(error) => recovery.execute(() => handleError(error))}
    >
      <UniversalMap {...props} />
    </MapErrorBoundary>
  )
}
```

### Monitoring Integration

Integrate with monitoring dashboards:

```typescript
function MapMonitoringPage() {
  const health = useMapHealthCheck(['google', 'leaflet'], {
    onStatusChange: (provider, status) => {
      // Send to monitoring
      metrics.gauge('map_service_status', {
        provider,
        status,
      })
    },
    onRateLimitDetected: (provider) => {
      // Alert on rate limits
      alerts.send({
        title: 'Map Rate Limit',
        message: `${provider} rate limit exceeded`,
        severity: 'warning',
      })
    },
  })

  return (
    <div>
      <MapHealthDashboard
        providers={['google', 'leaflet']}
        showDetails={true}
      />

      {/* Your map */}
      <EnhancedUniversalMap {...props} />
    </div>
  )
}
```

## Best Practices

### 1. Always Use Error Boundaries

Wrap all map components in error boundaries:

```typescript
<MapErrorBoundary>
  <YourMapComponent />
</MapErrorBoundary>
```

### 2. Configure Appropriate Retry Limits

Don't retry indefinitely - set reasonable limits:

```typescript
// Good
retryConfig: {
  maxAttempts: 3,
  maxDelay: 10000,
}

// Bad - too many retries
retryConfig: {
  maxAttempts: 100,
  maxDelay: 600000,
}
```

### 3. Use Circuit Breaker for External Services

Protect your app from cascading failures:

```typescript
const recovery = useErrorRecovery({
  failureThreshold: 5,  // Open circuit after 5 failures
  recoveryTimeout: 60000,  // Wait 1 minute before testing
})
```

### 4. Monitor Health Proactively

Start health monitoring early:

```typescript
useEffect(() => {
  const manager = getHealthCheckManager()
  manager.startMonitoringAll()

  return () => manager.stopMonitoringAll()
}, [])
```

### 5. Provide Fallbacks

Always have a fallback strategy:

```typescript
fallback: async () => {
  // Option 1: Switch provider
  setProvider('leaflet')

  // Option 2: Load cached data
  const cached = await loadCache()
  setData(cached)

  // Option 3: Show static map
  setStaticMode(true)
}
```

### 6. Log and Report Errors

Integrate with monitoring services:

```typescript
onError: (error) => {
  // Development
  console.error(error)

  // Production
  Sentry.captureException(error)
  LogRocket.error(error)

  // Analytics
  analytics.track('map_error', {
    category: error.category,
    message: error.message,
  })
}
```

## Testing

### Simulate Errors

Use the example component to test error scenarios:

```typescript
import { MapErrorRecoveryExample } from '@/components/examples/MapErrorRecoveryExample'

// Renders interactive demo with error simulation controls
<MapErrorRecoveryExample />
```

### Unit Tests

Test retry logic:

```typescript
import { withRetry, categorizeError } from '@/utils/retry'

test('retries failed operations', async () => {
  let attempts = 0
  const result = await withRetry(async () => {
    attempts++
    if (attempts < 3) throw new Error('Network error')
    return 'success'
  })

  expect(attempts).toBe(3)
  expect(result.success).toBe(true)
})

test('categorizes errors correctly', () => {
  const error = new Error('Network error')
  const categorized = categorizeError(error)

  expect(categorized.category).toBe('NETWORK')
  expect(categorized.retryable).toBe(true)
})
```

### Integration Tests

Test error recovery flow:

```typescript
test('recovers from map errors', async () => {
  const { getByText, findByText } = render(
    <EnhancedUniversalMap {...props} />
  )

  // Simulate error
  simulateMapError()

  // Check error message appears
  expect(await findByText(/network error/i)).toBeInTheDocument()

  // Click retry
  fireEvent.click(getByText('Retry'))

  // Check recovery
  expect(await findByText(/map ready/i)).toBeInTheDocument()
})
```

## Performance Considerations

### 1. Request Deduplication

Prevent duplicate in-flight requests:

```typescript
import { withDeduplication } from '@/utils/retry'

// Multiple calls to same endpoint only execute once
const data1 = await withDeduplication('map-tiles', () => fetchTiles())
const data2 = await withDeduplication('map-tiles', () => fetchTiles())
// data1 and data2 share the same promise
```

### 2. Health Check Intervals

Balance monitoring frequency with performance:

```typescript
// Frequent checks (development)
interval: 10000  // 10 seconds

// Normal checks (production)
interval: 60000  // 1 minute

// Infrequent checks (low priority)
interval: 300000  // 5 minutes
```

### 3. Circuit Breaker Thresholds

Tune thresholds based on your needs:

```typescript
// Sensitive (quick to open, fast recovery)
failureThreshold: 3
recoveryTimeout: 30000

// Balanced (default)
failureThreshold: 5
recoveryTimeout: 60000

// Tolerant (slow to open, longer recovery)
failureThreshold: 10
recoveryTimeout: 120000
```

## Troubleshooting

### Map Not Loading

1. **Check health status**: Use MapHealthDashboard
2. **Check circuit state**: Look for OPEN state
3. **Check network**: Verify internet connection
4. **Check API keys**: Ensure valid credentials
5. **Check console**: Look for error messages

### Excessive Retries

1. **Reduce maxAttempts**: Lower retry count
2. **Increase timeout**: Give requests more time
3. **Check shouldRetry**: Verify retry logic
4. **Use circuit breaker**: Prevent retry storms

### Provider Not Switching

1. **Check onFallbackProvider**: Verify callback
2. **Check enableProviderFallback**: Ensure enabled
3. **Check error category**: Only certain errors trigger fallback
4. **Check available providers**: Verify API keys

### Health Checks Failing

1. **Check endpoints**: Verify URLs are accessible
2. **Check CORS**: Ensure proper headers
3. **Check timeouts**: May need longer timeout
4. **Check network**: Firewall or proxy issues

## Migration Guide

### From Basic UniversalMap

```typescript
// Step 1: Replace import
- import { UniversalMap } from '@/components/UniversalMap'
+ import { EnhancedUniversalMap } from '@/components/EnhancedUniversalMap'

// Step 2: Replace component
- <UniversalMap {...props} />
+ <EnhancedUniversalMap {...props} />

// Step 3: Add error handling (optional)
+ onMapError={(error) => handleError(error)}
+ onRecoverySuccess={() => showSuccessMessage()}
```

### Add Health Monitoring

```typescript
// Import dashboard
import { MapHealthDashboard } from '@/components/MapHealthDashboard'

// Add to your page
<MapHealthDashboard
  providers={['google', 'leaflet']}
  showDetails={true}
/>
```

## API Reference

See individual component files for detailed API documentation:

- [`src/utils/retry.ts`](../src/utils/retry.ts) - Retry utilities
- [`src/hooks/useErrorRecovery.ts`](../src/hooks/useErrorRecovery.ts) - Error recovery hook
- [`src/components/MapErrorBoundary.tsx`](../src/components/MapErrorBoundary.tsx) - Error boundary
- [`src/utils/mapHealthCheck.ts`](../src/utils/mapHealthCheck.ts) - Health check system
- [`src/components/EnhancedUniversalMap.tsx`](../src/components/EnhancedUniversalMap.tsx) - Enhanced map
- [`src/components/MapHealthDashboard.tsx`](../src/components/MapHealthDashboard.tsx) - Health dashboard

## Support

For issues, questions, or contributions:

1. Check this documentation
2. Review example component
3. Check console errors
4. Enable development mode
5. Report issues with detailed logs

## License

Part of the Fleet Management System - Internal Use Only
