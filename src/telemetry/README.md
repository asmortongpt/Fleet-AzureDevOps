# Telemetry System

> Privacy-first analytics and monitoring for the Fleet Management application

## Overview

This telemetry system provides comprehensive tracking of user interactions, map usage, performance metrics, and errors while maintaining strict privacy standards and GDPR compliance.

## Architecture

```
telemetry/
├── config/
│   └── telemetry.ts          # Environment-based configuration
├── services/
│   ├── analytics.ts          # Analytics service with multiple backends
│   └── errorReporting.ts     # Error tracking and reporting
├── hooks/
│   └── useTelemetry.ts       # React hooks for telemetry
├── components/
│   ├── TelemetryDashboard.tsx  # Dev dashboard
│   └── ConsentBanner.tsx       # GDPR consent UI
├── utils/
│   └── privacy.ts            # Privacy controls and PII scrubbing
└── types/
    └── telemetry.ts          # TypeScript type definitions
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
# .env
VITE_ANALYTICS_ENDPOINT=https://analytics.yourcompany.com/api
VITE_ANALYTICS_API_KEY=your_api_key
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx (optional)
```

### 3. Add to Your App

```tsx
import { ConsentBanner } from '@/components/ConsentBanner';
import { TelemetryDashboard } from '@/components/TelemetryDashboard';

function App() {
  return (
    <>
      {/* Your app */}
      <ConsentBanner />
      {import.meta.env.DEV && <TelemetryDashboard />}
    </>
  );
}
```

### 4. Track Events

```tsx
import { useTelemetry } from '@/hooks/useTelemetry';

function MyComponent() {
  const telemetry = useTelemetry({
    componentName: 'MyComponent'
  });

  const handleClick = () => {
    telemetry.track('button_clicked', { action: 'save' });
  };

  return <button onClick={handleClick}>Save</button>;
}
```

## Features

### ✅ Privacy-First Design
- Automatic PII scrubbing
- Data anonymization
- GDPR compliance
- User consent management
- Do Not Track support

### ✅ Comprehensive Tracking
- Page views and navigation
- User interactions
- Map interactions (zoom, pan, markers)
- Performance metrics
- Error tracking with context
- Custom events

### ✅ Multiple Backends
- Custom backend API
- Google Analytics
- Mixpanel
- Segment
- Console (development)

### ✅ Developer Tools
- Real-time dashboard (dev only)
- Event viewer and filtering
- Performance monitoring
- Error logs
- Export capabilities

### ✅ Production-Ready
- Environment-based config
- Event sampling
- Automatic batching
- Retry logic
- Error handling

## Key Components

### Configuration (`config/telemetry.ts`)

Environment-aware configuration with feature flags, sampling rates, and privacy settings.

```typescript
import { getTelemetryConfig } from '@/config/telemetry';

const config = getTelemetryConfig();
console.log(config.enabled, config.level, config.providers);
```

### Privacy Manager (`utils/privacy.ts`)

GDPR-compliant privacy controls, consent management, and data sanitization.

```typescript
import { PrivacyManager } from '@/utils/privacy';

// Grant consent
PrivacyManager.grantConsent();

// Revoke and delete data
await PrivacyManager.requestDataDeletion();

// Export user data
const data = PrivacyManager.exportUserData();
```

### Analytics Service (`services/analytics.ts`)

Multi-backend analytics service with automatic batching and retry.

```typescript
import { analytics } from '@/services/analytics';

// Track event
analytics.track('user_action', { action: 'click' });

// Identify user
analytics.identify({ userId: 'abc123', plan: 'pro' });

// Track performance
analytics.trackPerformance('api_call', 150, 'ms');
```

### Error Reporting (`services/errorReporting.ts`)

Sentry-compatible error tracking with breadcrumbs and context.

```typescript
import { captureException, addBreadcrumb } from '@/services/errorReporting';

// Add breadcrumb
addBreadcrumb({
  category: 'navigation',
  message: 'User navigated to dashboard',
  level: 'info'
});

// Capture error
captureException(error, {
  component: 'Dashboard',
  action: 'loadData'
});
```

### Telemetry Hooks (`hooks/useTelemetry.ts`)

React hooks for component-level tracking.

```typescript
import { useTelemetry, useMapTelemetry } from '@/hooks/useTelemetry';

// Basic telemetry
const telemetry = useTelemetry({ componentName: 'MyComponent' });
telemetry.track('event', { data: 'value' });

// Map-specific telemetry
const mapTelemetry = useMapTelemetry('mapbox');
mapTelemetry.trackZoom(15, 12);
mapTelemetry.trackMarkerClick('marker-1', 'vehicle');
```

## Map Events Tracked

- Map loaded (provider, load time)
- Provider selection/change
- Zoom level changes
- Pan/move interactions
- Marker clicks and hovers
- Popup open/close
- Layer toggles
- Search queries (length only, not content)
- Filter applications
- Route calculations
- Export/import operations
- Errors and failures

## Privacy & Compliance

### What We Track
- ✅ Anonymous usage patterns
- ✅ Performance metrics
- ✅ Error occurrences
- ✅ Feature usage

### What We DON'T Track
- ❌ Personal information (PII)
- ❌ Email addresses
- ❌ Passwords or tokens
- ❌ Search query content
- ❌ Form input values
- ❌ Precise locations

### User Rights (GDPR)
- ✅ Right to access data
- ✅ Right to be forgotten
- ✅ Right to data portability
- ✅ Right to opt-out

### Data Retention
- Events: 90 days
- Aggregated metrics: 1 year
- Local storage: 7-30 days

## Development

### View Telemetry Dashboard

In development mode, click the 📊 icon in the bottom-right corner to open the dashboard.

### Testing

Telemetry is automatically disabled in test environment:

```bash
NODE_ENV=test npm test
```

### Debugging

```typescript
import { analytics } from '@/services/analytics';

// View session data
console.log(analytics.getSessionData());

// Check configuration
import { getTelemetryConfig } from '@/config/telemetry';
console.log(getTelemetryConfig());
```

## Configuration Reference

### Telemetry Levels

- `NONE`: No tracking
- `ESSENTIAL`: Only critical errors
- `STANDARD`: Basic usage analytics (default prod)
- `DETAILED`: Comprehensive tracking (default dev)

### Environment Variables

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

### Sampling Rates (Production)

- Events: 10% (configurable)
- Errors: 100%
- Performance: 5%

## Documentation

- [Full Documentation](../../docs/TELEMETRY.md)
- [Integration Guide](../../docs/TELEMETRY_INTEGRATION.md)
- [Example Implementation](../examples/MapWithTelemetry.example.tsx)

## Support

For questions or issues:

1. Check documentation
2. Review examples
3. Check telemetry dashboard (dev mode)
4. Contact: privacy@yourcompany.com

## License

Same as parent project.

---

**Built with privacy in mind** 🔒
