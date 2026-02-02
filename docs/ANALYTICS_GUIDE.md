# Analytics Guide

## Overview

Fleet Management System uses PostHog for comprehensive analytics, event tracking, and feature flags.

## Setup

### 1. Environment Variables

Add to `.env`:
```bash
VITE_POSTHOG_API_KEY=your_posthog_api_key
VITE_POSTHOG_HOST=https://app.posthog.com  # Optional
VITE_APP_VERSION=1.0.0  # Optional
```

### 2. Initialization

Analytics are automatically initialized when the app starts. No manual initialization needed.

## Event Tracking

### Basic Event Tracking

```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const { trackEvent } = useAnalytics();

  const handleClick = () => {
    trackEvent('Button Clicked', {
      button_name: 'Submit',
      page: 'Dashboard',
    });
  };

  return <button onClick={handleClick}>Submit</button>;
}
```

### Pre-defined Event Trackers

```tsx
const {
  trackVehicleCreated,
  trackMaintenanceScheduled,
  trackReportGenerated,
  trackUserAction,
} = useAnalytics();

// Track vehicle creation
trackVehicleCreated('v-123', 'Toyota', 'Camry');

// Track maintenance
trackMaintenanceScheduled('v-123', 'Oil Change', '2025-12-31');

// Track report generation
trackReportGenerated('Vehicle Report', { dateRange: '30d' });

// Track generic user action
trackUserAction('click', 'export-button', { format: 'pdf' });
```

## User Identification

```tsx
import { analytics } from '@/lib/analytics/provider';

// Identify user on login
analytics.identify('user-123', {
  email: 'user@example.com',
  name: 'John Doe',
  role: 'Fleet Manager',
  company: 'ACME Corp',
});

// Reset on logout
analytics.reset();
```

## Feature Flags

### Simple Feature Flag

```tsx
import { usePostHogFeatureFlag } from '@/hooks/usePostHogFeatureFlag';

function Dashboard() {
  const newDashboardEnabled = usePostHogFeatureFlag('new-dashboard');

  if (newDashboardEnabled) {
    return <NewDashboard />;
  }

  return <OldDashboard />;
}
```

### Multivariate Feature Flags

```tsx
import { usePostHogFeatureFlagVariant } from '@/hooks/usePostHogFeatureFlag';

function PricingPage() {
  const variant = usePostHogFeatureFlagVariant('pricing-display');

  if (variant === 'premium') {
    return <PremiumPricing />;
  }
  if (variant === 'standard') {
    return <StandardPricing />;
  }
  return <DefaultPricing />;
}
```

### Multiple Flags

```tsx
import { usePostHogFeatureFlags } from '@/hooks/usePostHogFeatureFlag';

function Features() {
  const flags = usePostHogFeatureFlags([
    'new-dashboard',
    'dark-mode',
    'beta-features'
  ]);

  return (
    <div>
      {flags['new-dashboard'] && <NewDashboard />}
      {flags['dark-mode'] && <DarkModeToggle />}
      {flags['beta-features'] && <BetaFeatures />}
    </div>
  );
}
```

## A/B Testing

```tsx
import { useExperiment } from '@/hooks/usePostHogFeatureFlag';

function CheckoutPage() {
  const { variant, trackConversion } = useExperiment('checkout-flow');

  const handlePurchase = (amount: number) => {
    trackConversion('purchase_completed', { amount });
  };

  if (variant === 'one-page') {
    return <OnePageCheckout onComplete={handlePurchase} />;
  }
  return <MultiPageCheckout onComplete={handlePurchase} />;
}
```

## Automatic Tracking

### Page Views
Page views are automatically tracked on route changes. No manual tracking needed.

### Component Lifecycle

```tsx
import { useComponentTracking } from '@/hooks/useAnalytics';

function MyComponent() {
  useComponentTracking('MyComponent');

  return <div>Content</div>;
}
```

### Time Tracking

```tsx
import { useTimeTracking } from '@/hooks/useAnalytics';

function Dashboard() {
  useTimeTracking('Dashboard');

  return <div>Dashboard content</div>;
}
```

## Error Tracking

```tsx
const { trackError } = useAnalytics();

try {
  // risky operation
} catch (error) {
  trackError(error, {
    context: 'Vehicle Creation',
    vehicleId: 'v-123',
  });
}
```

## Performance Tracking

```tsx
const { trackApiCall } = useAnalytics();

const fetchData = async () => {
  const start = Date.now();

  try {
    const response = await fetch('/api/vehicles');
    const duration = Date.now() - start;

    trackApiCall(
      '/api/vehicles',
      'GET',
      duration,
      response.status,
      response.ok
    );

    return response.json();
  } catch (error) {
    const duration = Date.now() - start;
    trackApiCall('/api/vehicles', 'GET', duration, 0, false);
    throw error;
  }
};
```

## Pre-defined Events

| Event | Function | Parameters |
|-------|----------|------------|
| Vehicle Created | `trackVehicleCreated` | vehicleId, make, model |
| Vehicle Updated | `trackVehicleUpdated` | vehicleId, changes |
| Vehicle Deleted | `trackVehicleDeleted` | vehicleId |
| Driver Created | `trackDriverCreated` | driverId, name |
| Driver Assigned | `trackDriverAssigned` | driverId, vehicleId |
| Maintenance Scheduled | `trackMaintenanceScheduled` | vehicleId, serviceType, date |
| Maintenance Completed | `trackMaintenanceCompleted` | vehicleId, serviceType, cost |
| Fuel Added | `trackFuelAdded` | vehicleId, amount, cost |
| Report Generated | `trackReportGenerated` | reportType, filters |
| Report Exported | `trackReportExported` | reportType, format |
| Form Submitted | `trackFormSubmitted` | formName, success, errors |
| Search Performed | `trackSearch` | query, resultsCount |
| Filter Applied | `trackFilter` | filterType, filterValue |
| Feature Used | `trackFeatureUsed` | featureName, metadata |
| Notification Interaction | `trackNotification` | action, type |
| Setting Changed | `trackSettingChanged` | setting, oldValue, newValue |

## Session Recording

Session recording is enabled in production by default.

```tsx
import { analytics } from '@/lib/analytics/provider';

// Start recording
analytics.startRecording();

// Stop recording
analytics.stopRecording();
```

## Privacy & GDPR

### Opt Out

```tsx
import { analytics } from '@/lib/analytics/provider';

// Opt user out
analytics.optOut();

// Opt user in
analytics.optIn();

// Check opt-out status
const hasOptedOut = analytics.hasOptedOut();
```

### Data Sanitization

Sensitive data is automatically sanitized:
- Passwords
- SSNs
- Credit card numbers

All input fields are masked in session recordings.

## Best Practices

1. **Track meaningful events** - Don't track everything
2. **Use descriptive names** - "Vehicle Created" not "click"
3. **Include context** - Add relevant properties
4. **Respect user privacy** - Don't track PII
5. **Test feature flags** - In development before production
6. **Monitor performance** - Track slow API calls
7. **Track errors** - For debugging and monitoring

## Debugging

```tsx
import { analytics } from '@/lib/analytics/provider';

// Get session ID
const sessionId = analytics.getSessionId();

// Get distinct ID
const distinctId = analytics.getDistinctId();

// Get user ID
const userId = analytics.userId;
```

## PostHog Dashboard

Access your PostHog dashboard at: https://app.posthog.com

### Key Metrics to Monitor

1. **Active Users** - Daily/Weekly/Monthly
2. **Session Duration** - Average time spent
3. **Popular Features** - Most used features
4. **Conversion Funnel** - User journey
5. **Retention** - User retention over time
6. **Feature Adoption** - Feature flag usage
7. **Error Rate** - Errors per session
8. **Page Load Time** - Performance metrics

## Feature Flag Setup

1. Go to PostHog Dashboard
2. Navigate to Feature Flags
3. Create New Flag
4. Set rollout percentage
5. Define variants (for A/B testing)
6. Save and enable

## Troubleshooting

### Events not appearing
- Check VITE_POSTHOG_API_KEY is set
- Verify analytics.init() was called
- Check browser console for errors
- Ensure PostHog is not blocked by ad blockers

### Feature flags not working
- Check flag is enabled in PostHog dashboard
- Verify flag name matches exactly
- Call analytics.reloadFeatureFlags()
- Check network tab for API calls

### Session recording not working
- Enabled only in production
- Check VITE_NODE_ENV=production
- Verify PostHog project settings
- Check browser console for errors

## Resources

- [PostHog Documentation](https://posthog.com/docs)
- [PostHog React Integration](https://posthog.com/docs/libraries/react)
- [Feature Flags Guide](https://posthog.com/docs/feature-flags)
- [A/B Testing Guide](https://posthog.com/docs/experiments)
