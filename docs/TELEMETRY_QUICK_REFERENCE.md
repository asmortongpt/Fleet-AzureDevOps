# Telemetry Quick Reference Card

> Cheat sheet for common telemetry operations

## Quick Imports

```typescript
// Hooks
import { useTelemetry, useMapTelemetry, usePerformanceTelemetry } from '@/hooks/useTelemetry';

// Services
import { analytics, trackEvent, trackPageView } from '@/services/analytics';
import { captureException, addBreadcrumb } from '@/services/errorReporting';

// Privacy
import { PrivacyManager, PrivacyCategory } from '@/utils/privacy';

// Config
import { getTelemetryConfig } from '@/config/telemetry';

// Types
import { MapInteractionType, TelemetryLevel } from '@/types/telemetry';
```

## Common Patterns

### Track Component Usage

```typescript
function MyComponent() {
  const telemetry = useTelemetry({ componentName: 'MyComponent' });

  const handleAction = () => {
    telemetry.track('action_performed', { detail: 'value' });
  };
}
```

### Track Map Interaction

```typescript
function Map() {
  const telemetry = useMapTelemetry('mapbox');

  // Track zoom
  telemetry.trackZoom(15, 12);

  // Track marker click
  telemetry.trackMarkerClick('marker-1', 'vehicle');

  // Track map loaded
  telemetry.trackMapLoaded('mapbox', 1234, { markerCount: 50 });
}
```

### Track Performance

```typescript
function DataLoader() {
  const { measureAsync } = usePerformanceTelemetry('DataLoader');

  const loadData = () => measureAsync('fetch', () => fetch('/api/data'));
}
```

### Track Errors

```typescript
try {
  // risky operation
} catch (error) {
  captureException(error, {
    component: 'MyComponent',
    action: 'operation',
    extra: { context: 'value' }
  });
}
```

### Add Breadcrumbs

```typescript
addBreadcrumb({
  category: 'navigation',
  message: 'User navigated to page',
  level: 'info',
  timestamp: Date.now()
});
```

### Manage Consent

```typescript
// Grant all consent
PrivacyManager.grantConsent();

// Grant specific categories
PrivacyManager.grantConsent([
  PrivacyCategory.ESSENTIAL,
  PrivacyCategory.ANALYTICS
]);

// Deny consent
PrivacyManager.denyConsent();

// Check consent
if (PrivacyManager.hasConsent(PrivacyCategory.ANALYTICS)) {
  // Track analytics
}

// Delete all data
await PrivacyManager.requestDataDeletion();
```

## Map Events

| Event | Hook Method | Properties |
|-------|-------------|------------|
| Zoom | `trackZoom(newZoom, oldZoom)` | zoom, previousZoom, delta |
| Pan | `trackPan(center, prevCenter)` | center, previousCenter |
| Marker Click | `trackMarkerClick(id, type, meta)` | markerId, markerType, metadata |
| Provider Change | `trackProviderChange(new, old)` | newProvider, oldProvider |
| Search | `trackSearch(query, count, duration)` | queryLength, resultsCount, duration |
| Filter | `trackFilter(type, value, count)` | filterType, filterValue, resultsCount |
| Route | `trackRouteCalculation(waypoints, distance, duration)` | waypointCount, distance, duration |
| Export | `trackExport(format, count)` | format, itemCount |
| Import | `trackImport(format, count, success)` | format, itemCount, success |

## Error Severities

```typescript
import { ErrorSeverity } from '@/services/errorReporting';

ErrorSeverity.FATAL     // Application crash
ErrorSeverity.ERROR     // Standard error
ErrorSeverity.WARNING   // Warning
ErrorSeverity.INFO      // Informational
ErrorSeverity.DEBUG     // Debug message
```

## Configuration Levels

```typescript
import { TelemetryLevel } from '@/config/telemetry';

TelemetryLevel.NONE       // No tracking
TelemetryLevel.ESSENTIAL  // Only critical errors
TelemetryLevel.STANDARD   // Basic analytics (default prod)
TelemetryLevel.DETAILED   // Full tracking (default dev)
```

## Environment Variables

```bash
# Analytics
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com/api
VITE_ANALYTICS_API_KEY=your_key

# Error Reporting
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Mixpanel
VITE_MIXPANEL_TOKEN=your_token
```

## Privacy Checklist

- [ ] PII scrubbed automatically
- [ ] IP addresses anonymized
- [ ] User consent obtained
- [ ] Do Not Track respected
- [ ] Data export available
- [ ] Data deletion available
- [ ] Privacy policy updated
- [ ] GDPR compliance verified

## Best Practices

### ✅ DO
- Track meaningful events
- Add context to errors
- Use descriptive event names
- Respect user privacy
- Test in development first
- Monitor error rates

### ❌ DON'T
- Track every render
- Log PII (it's scrubbed, but still)
- Use generic event names
- Block app on telemetry errors
- Track in test environment
- Forget to flush on unload

## Testing

```typescript
// Check if telemetry is enabled
const { isEnabled } = useTelemetry({ componentName: 'Test' });

// Get config
const config = getTelemetryConfig();
console.log(config.enabled, config.level);

// Disable for tests
process.env.NODE_ENV = 'test'; // Auto-disables
```

## Debugging

```typescript
// View dashboard (dev only)
// Click 📊 icon in bottom-right

// Check session data
import { analytics } from '@/services/analytics';
console.log(analytics.getSessionData());

// Check consent
import { PrivacyManager } from '@/utils/privacy';
console.log(PrivacyManager.getConsentRecord());

// Export user data
const data = PrivacyManager.exportUserData();
console.log(data);
```

## Common Issues

**Events not showing?**
- Check `config.enabled`
- Check user consent
- Check Do Not Track
- Check sampling rate

**Dashboard not visible?**
- Only shows in development
- Check for 📊 icon
- Check console for errors

**Too many events?**
- Increase sampling in production
- Reduce tracking frequency
- Use STANDARD level instead of DETAILED

## Performance Tips

- Use sampling in production (default 10%)
- Batch events automatically (default 50 events)
- Flush on intervals (default 30s)
- Use async tracking
- Avoid tracking in hot paths

## Support

- [Full Documentation](/docs/TELEMETRY.md)
- [Integration Guide](/docs/TELEMETRY_INTEGRATION.md)
- [Example Code](/src/examples/MapWithTelemetry.example.tsx)
- Email: privacy@yourcompany.com

---

**Last Updated**: November 16, 2025
**Version**: 1.0.0
