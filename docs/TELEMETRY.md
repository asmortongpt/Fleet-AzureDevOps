# Telemetry & Analytics Documentation

> Privacy-first telemetry system for tracking usage, performance, and errors

## Table of Contents

- [Overview](#overview)
- [What Data is Collected](#what-data-is-collected)
- [Why We Collect Data](#why-we-collect-data)
- [Privacy & Compliance](#privacy--compliance)
- [How to Opt-Out](#how-to-opt-out)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Development](#development)
- [Data Retention](#data-retention)
- [FAQ](#faq)

## Overview

Our telemetry system is designed with **privacy as the foundation**. We collect only the minimum data necessary to improve the application, fix bugs, and understand how features are used.

### Key Principles

1. **Privacy First**: All data is anonymized and sanitized
2. **User Control**: Easy opt-out at any time
3. **Transparency**: Clear documentation of what we collect
4. **GDPR Compliant**: Full compliance with privacy regulations
5. **Secure**: Data encrypted in transit and at rest

## What Data is Collected

### Essential Data (Always Collected)

These metrics are critical for application functionality and error reporting:

- **Critical Errors**: Application crashes and fatal errors
- **Performance Issues**: Severe performance degradation
- **Security Events**: Failed authentication attempts, suspicious activity

**Note**: Essential data collection respects Do Not Track and can be disabled via opt-out.

### Standard Analytics (Default)

When analytics is enabled at the "Standard" level:

#### Usage Metrics
- Page views and navigation patterns
- Feature usage (which features are used, how often)
- Map provider selection (Mapbox, Google Maps, etc.)
- Session duration and frequency
- Click patterns on major UI elements

#### Map Interactions
- Map loaded events (provider, load time)
- Zoom level changes
- Marker clicks (type, count)
- Search queries (query length only, not content)
- Filter applications (type, not values)
- Route calculations (waypoint count, distance)

#### Performance Metrics
- Component render times
- API response times
- Map loading performance
- Bundle load times
- Memory usage patterns

#### Error Tracking
- Non-critical errors and warnings
- Error context (component, action taken)
- Error frequency and patterns
- User actions leading to errors (breadcrumbs)

### Detailed Analytics (Opt-in)

Additional data collected when "Detailed" level is enabled:

- Scroll depth and patterns
- Hover interactions
- Input field usage (not content)
- Detailed render counts
- Mouse movement patterns
- Detailed performance traces

### What We DON'T Collect

We **never** collect:

- ❌ Personal Identifiable Information (PII)
- ❌ Email addresses or names (unless explicitly provided for support)
- ❌ Passwords or authentication tokens
- ❌ Search query content (only query length)
- ❌ Form input values
- ❌ GPS coordinates or precise locations
- ❌ IP addresses (anonymized if needed for geo-location)
- ❌ Browser fingerprints for tracking
- ❌ Cross-site tracking data

## Why We Collect Data

### Product Improvement
- Understand which features are most valuable
- Identify unused or confusing features
- Prioritize development based on actual usage

### Bug Detection & Fixing
- Identify errors before they impact more users
- Understand error context and reproduction steps
- Track bug fix effectiveness

### Performance Optimization
- Detect slow components or operations
- Optimize based on real-world usage patterns
- Monitor performance regressions

### User Experience
- Improve navigation and workflows
- Reduce friction in common tasks
- Validate design decisions with data

## Privacy & Compliance

### GDPR Compliance

We are fully compliant with GDPR requirements:

- ✅ **Right to Access**: Export all your data via the dashboard
- ✅ **Right to be Forgotten**: Complete data deletion on request
- ✅ **Right to Data Portability**: Export data in JSON format
- ✅ **Consent Management**: Clear consent requests and controls
- ✅ **Data Minimization**: Collect only necessary data
- ✅ **Purpose Limitation**: Use data only for stated purposes

### Data Anonymization

All data is automatically sanitized:

```typescript
// Email addresses
"user@example.com" → "[EMAIL_REDACTED]"

// Phone numbers
"555-123-4567" → "[PHONE_REDACTED]"

// IP addresses
"192.168.1.100" → "192.168.1.0"

// Sensitive fields
{ password: "secret123" } → { password: "[REDACTED]" }
```

### Do Not Track

We respect the Do Not Track (DNT) browser setting. If DNT is enabled, all telemetry is automatically disabled.

### Cookie Usage

We use only essential cookies:
- Session management
- User preferences
- Consent status

No third-party tracking cookies are used.

## How to Opt-Out

### Complete Opt-Out

To completely disable telemetry:

1. **Via UI**: Settings → Privacy → Disable Telemetry
2. **Via Browser**: Enable "Do Not Track" in browser settings
3. **Via Code**:
   ```typescript
   import { PrivacyManager } from '@/utils/privacy';
   PrivacyManager.denyConsent();
   ```

### Granular Control

Choose specific categories to opt out:

```typescript
import { PrivacyManager, PrivacyCategory } from '@/utils/privacy';

// Opt out of performance tracking only
PrivacyManager.grantConsent([
  PrivacyCategory.ESSENTIAL,
  PrivacyCategory.ANALYTICS
]);
```

### Request Data Deletion

To delete all collected data:

```typescript
import { PrivacyManager } from '@/utils/privacy';

// Request complete data deletion
await PrivacyManager.requestDataDeletion();
```

Or contact privacy@yourcompany.com with your request.

## Configuration

### Environment-Based Configuration

Telemetry is configured based on environment:

#### Development
```typescript
{
  enabled: true,
  level: 'detailed',
  providers: ['console'],
  requireConsent: false,
  eventSamplingRate: 1.0
}
```

#### Production
```typescript
{
  enabled: true,
  level: 'standard',
  providers: ['custom'],
  requireConsent: true,
  eventSamplingRate: 0.1  // Sample 10% of events
}
```

### Environment Variables

Configure via `.env`:

```bash
# Analytics endpoint
VITE_ANALYTICS_ENDPOINT=https://analytics.yourcompany.com/api

# Analytics API key
VITE_ANALYTICS_API_KEY=your_api_key

# Sentry DSN (for error reporting)
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Mixpanel
VITE_MIXPANEL_TOKEN=your_token
```

### Feature Flags

Toggle specific features:

```typescript
{
  features: {
    trackPageViews: true,
    trackClicks: true,
    trackErrors: true,
    trackPerformance: true,
    trackUserProperties: true,
    trackSessionReplay: false
  }
}
```

## Usage Guide

### Basic Event Tracking

```typescript
import { useTelemetry } from '@/hooks/useTelemetry';

function MyComponent() {
  const telemetry = useTelemetry({
    componentName: 'MyComponent',
    trackMount: true,
    trackUnmount: true
  });

  const handleClick = () => {
    telemetry.track('button_clicked', {
      buttonName: 'submit',
      formComplete: true
    });
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

### Map Telemetry

```typescript
import { useMapTelemetry } from '@/hooks/useTelemetry';

function MapComponent({ provider }) {
  const telemetry = useMapTelemetry(provider);

  const handleZoom = (newZoom, oldZoom) => {
    telemetry.trackZoom(newZoom, oldZoom);
  };

  const handleMarkerClick = (markerId) => {
    telemetry.trackMarkerClick(markerId, 'vehicle');
  };

  const handleMapLoad = (loadTime) => {
    telemetry.trackMapLoaded(provider, loadTime, {
      markerCount: 50,
      layerCount: 3
    });
  };

  // ... rest of component
}
```

### Performance Tracking

```typescript
import { usePerformanceTelemetry } from '@/hooks/useTelemetry';

function DataLoader() {
  const { measureAsync } = usePerformanceTelemetry('DataLoader');

  const loadData = async () => {
    const data = await measureAsync('fetch_vehicles', async () => {
      const response = await fetch('/api/vehicles');
      return response.json();
    });
    return data;
  };

  // ... rest of component
}
```

### Error Tracking

```typescript
import { captureException, addBreadcrumb } from '@/services/errorReporting';

function DataProcessor() {
  try {
    // Add breadcrumb for context
    addBreadcrumb({
      category: 'data',
      message: 'Starting data processing',
      level: 'info'
    });

    processData();
  } catch (error) {
    captureException(error, {
      component: 'DataProcessor',
      action: 'processData',
      extra: { recordCount: data.length }
    });
  }
}
```

### Error Boundary

```typescript
import { withErrorBoundary } from '@/services/errorReporting';

const MyComponent = () => {
  return <div>Content</div>;
};

export default withErrorBoundary(MyComponent, {
  fallback: ({ error, resetError }) => (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={resetError}>Try again</button>
    </div>
  )
});
```

## Development

### Telemetry Dashboard

In development mode, access the telemetry dashboard:

1. Click the 📊 icon in the bottom-right corner
2. View real-time events, metrics, and errors
3. Filter and export telemetry data
4. Monitor performance trends

### Testing Telemetry

```typescript
import { analytics } from '@/services/analytics';

// Track test event
analytics.track('test_event', {
  testProperty: 'value'
});

// View in console (development mode)
console.log(analytics.getSessionData());
```

### Disable During Tests

```bash
# Set NODE_ENV to test
NODE_ENV=test npm test
```

Telemetry is automatically disabled in test environment.

## Data Retention

### Local Storage
- **Development**: 7 days
- **Production**: 30 days
- Events are automatically cleaned up after retention period

### Backend Storage
- **Event data**: 90 days
- **Aggregated metrics**: 1 year
- **Error logs**: 90 days
- **Performance data**: 30 days

### Session Duration
- Sessions expire after 30 minutes of inactivity
- New session created on return

## Analytics Providers

### Supported Backends

#### Custom Backend (Default)
Our own privacy-focused analytics backend.

#### Google Analytics
Industry-standard analytics with anonymization.

#### Mixpanel
Product analytics with advanced segmentation.

#### Segment
Data pipeline supporting multiple destinations.

### Provider Configuration

```typescript
import { AnalyticsProvider } from '@/config/telemetry';

const config = {
  providers: [
    AnalyticsProvider.CUSTOM,
    AnalyticsProvider.GOOGLE_ANALYTICS
  ],
  googleAnalytics: {
    measurementId: 'G-XXXXXXXXXX',
    debug: false
  }
};
```

## API Reference

### useTelemetry Hook

```typescript
interface TelemetryHook {
  // Event tracking
  track(eventName: string, properties?: object): void;

  // Map interactions
  trackMapInteraction(type: MapInteractionType, data?: object): void;
  trackMapLoaded(provider: string, loadTime: number): void;
  trackMapError(error: Error, context?: object): void;

  // Performance
  startTiming(name?: string): PerformanceTiming;
  endTiming(timing: PerformanceTiming): void;
  trackMetric(name: string, value: number, unit?: string): void;

  // Error tracking
  trackError(error: Error, context?: object): void;

  // State
  isEnabled: boolean;
  sessionId: string;
}
```

### PrivacyManager

```typescript
class PrivacyManager {
  static grantConsent(categories?: PrivacyCategory[]): void;
  static denyConsent(): void;
  static revokeConsent(): void;
  static hasConsent(category: PrivacyCategory): boolean;
  static exportUserData(): Record<string, any>;
  static async requestDataDeletion(): Promise<void>;
}
```

### Error Reporting

```typescript
// Capture exception
captureException(error: Error, context?: ErrorContext): string;

// Capture message
captureMessage(message: string, level?: ErrorSeverity): string;

// Add breadcrumb
addBreadcrumb(breadcrumb: Breadcrumb): void;

// Set user context
setUser(user: { id?: string; email?: string }): void;

// Set tags
setTag(key: string, value: string): void;
```

## FAQ

### Q: Is my data sold to third parties?
**A**: No. We never sell, rent, or share your data with third parties for their marketing purposes.

### Q: Can I see what data you have about me?
**A**: Yes. Use `PrivacyManager.exportUserData()` or contact privacy@yourcompany.com.

### Q: How do I delete my data?
**A**: Use `PrivacyManager.requestDataDeletion()` or contact privacy@yourcompany.com.

### Q: Does telemetry slow down the app?
**A**: No. Telemetry is asynchronous and sampled (only 10% of events in production). Impact is negligible.

### Q: What happens if I enable Do Not Track?
**A**: All telemetry is automatically disabled. We respect DNT completely.

### Q: Can I use the app without telemetry?
**A**: Yes. The app works perfectly with telemetry disabled. Opt-out anytime.

### Q: Where is my data stored?
**A**: Data is stored on secure servers in [your region]. All data is encrypted.

### Q: How long until my data is deleted after opt-out?
**A**: Immediately from local storage. Backend data within 30 days.

### Q: Do you track me across different websites?
**A**: No. We only track usage within this application.

### Q: Is telemetry required for the app to work?
**A**: No. All features work with telemetry disabled.

## Support

For privacy-related questions or concerns:

- **Email**: privacy@yourcompany.com
- **Documentation**: https://docs.yourcompany.com/privacy
- **Support Portal**: https://support.yourcompany.com

## Updates to This Policy

This documentation was last updated: **November 16, 2025**

We will notify users of significant changes to our telemetry practices via:
- In-app notifications
- Email (if provided)
- Version updates in this document

## Legal

For our full Privacy Policy, see: [Privacy Policy](https://yourcompany.com/privacy)

For Terms of Service, see: [Terms of Service](https://yourcompany.com/terms)

---

**Summary**: We collect minimal, anonymized data to improve the app. You have complete control and can opt-out anytime. Your privacy is our priority.
