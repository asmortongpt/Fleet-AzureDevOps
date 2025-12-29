# Feature Flags Guide

## Overview

The Fleet Management System uses a sophisticated feature flag system for controlled rollouts, A/B testing, and feature gating based on user plans and permissions.

## Quick Start

### Using Feature Flags in Components

```typescript
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';

function MyComponent() {
  const { isEnabled } = useFeatureFlags();

  return (
    <div>
      {isEnabled('advanced-analytics') && (
        <AdvancedAnalyticsDashboard />
      )}

      {isEnabled('export-pdf') && (
        <Button onClick={exportToPDF}>Export PDF</Button>
      )}
    </div>
  );
}
```

### TypeScript Autocomplete

All feature flags are typed in `src/types/feature-flags.ts`:

```typescript
import type { FeatureFlagKey } from '@/types/feature-flags';

// TypeScript will autocomplete and validate flag keys
const flag: FeatureFlagKey = 'real-time-telemetry'; // ✅ Valid
const invalidFlag: FeatureFlagKey = 'invalid-flag'; // ❌ Type error
```

## Architecture

### Multi-Layer Flag Evaluation

Feature flags are evaluated in this priority order:

1. **SuperAdmin Bypass**: SuperAdmins always get all features
2. **Database/Tenant Settings**: Per-tenant feature overrides
3. **Environment Variables**: Global feature overrides
4. **Plan Requirements**: Check if user's plan meets minimum requirement
5. **Permission Requirements**: Check if user has required permissions
6. **Default State**: Use flag's default enabled/disabled state

### Flag Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| `core` | Essential product features | Real-time telemetry, analytics |
| `integration` | Third-party integrations | Azure Maps, Google Maps |
| `advanced` | Power user features | Custom reports, bulk operations |
| `beta` | Beta testing features | Mobile app, driver app |
| `experimental` | Experimental/unstable | AR viewer, voice commands |
| `ui` | UI enhancements | Dark mode, compact view |

## Configuration

### Environment Variables

Override flags globally using environment variables:

```bash
# .env.production
VITE_FEATURE_REAL_TIME_TELEMETRY=true
VITE_FEATURE_ADVANCED_ANALYTICS=false
VITE_FEATURE_BETA_MOBILE_APP=true
```

### Database Configuration (Server-Side)

Flags are stored in the `feature_flags` table:

```sql
CREATE TABLE feature_flags (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0,
  tenant_whitelist INTEGER[] DEFAULT '{}',
  user_whitelist INTEGER[] DEFAULT '{}',
  value JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Gradual Rollouts

Enable features for a percentage of users:

```javascript
// Server-side: Enable for 25% of users
await featureFlags.updateFlag('new-dashboard', {
  enabled: true,
  rollout_percentage: 25
});
```

The system uses deterministic hashing to ensure consistent experience per user.

### Tenant Whitelisting

Enable features for specific tenants:

```javascript
// Enable for tenants 1, 5, 10
await featureFlags.updateFlag('premium-analytics', {
  enabled: true,
  tenant_whitelist: [1, 5, 10]
});
```

### User Whitelisting

Enable features for specific users (e.g., beta testers):

```javascript
await featureFlags.updateFlag('beta-feature', {
  enabled: true,
  user_whitelist: [42, 123, 456]
});
```

## Plan-Based Feature Gating

Features can require minimum plan levels:

```typescript
{
  key: 'predictive-maintenance',
  name: 'Predictive Maintenance',
  minimumPlan: 'enterprise', // Only enterprise plan and above
  defaultEnabled: false
}
```

Plan hierarchy: `free` < `basic` < `professional` < `enterprise`

## Permission-Based Gating

Features can require specific permissions:

```typescript
{
  key: 'bulk-operations',
  name: 'Bulk Operations',
  requiresPermission: 'admin:write',
  defaultEnabled: true
}
```

## Available Feature Flags

### Core Features

- `real-time-telemetry` - Live GPS tracking and vehicle status
- `advanced-analytics` - Advanced reporting dashboards
- `vehicle-3d-viewer` - Interactive 3D vehicle inspection
- `route-optimization` - AI-powered route planning
- `predictive-maintenance` - AI maintenance predictions

### Integrations

- `azure-maps-integration` - Microsoft Azure Maps
- `google-maps-integration` - Google Maps Platform
- `mapbox-integration` - Mapbox mapping
- `obd2-integration` - On-Board Diagnostics devices
- `telematics-integration` - Third-party telematics

### Advanced Features

- `ai-driver-scoring` - AI driver performance scoring
- `automated-workflows` - Automated scheduling workflows
- `custom-reports` - Custom report builder
- `export-excel` - Excel export functionality
- `export-pdf` - PDF export functionality
- `bulk-operations` - Bulk updates and operations

### Beta Features

- `beta-mobile-app` - Native mobile app (iOS/Android)
- `beta-driver-app` - Dedicated driver mobile app
- `beta-inspector-tools` - Advanced inspection tools
- `beta-fuel-predictions` - AI fuel cost forecasting

### Experimental Features

- `experimental-ar-viewer` - Augmented reality inspection
- `experimental-voice-commands` - Voice-activated controls
- `experimental-offline-mode` - Offline mode with sync

### UI Enhancements

- `dark-mode` - Dark color scheme
- `compact-view` - Denser UI layout
- `advanced-filters` - Advanced filtering capabilities
- `drag-drop-scheduling` - Drag-and-drop scheduling
- `multi-tab-interface` - Multi-tab module interface

## API Reference

### React Hook

```typescript
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';

function MyComponent() {
  const { isEnabled, getAllFlags } = useFeatureFlags();

  // Check single flag
  if (isEnabled('dark-mode')) {
    // Enable dark mode
  }

  // Get all flags at once
  const flags = getAllFlags();
  console.log(flags); // { 'dark-mode': true, 'beta-mobile-app': false, ... }
}
```

### Server-Side API

```javascript
import { featureFlags } from '@/lib/feature-flags';

// Check if enabled
const enabled = await featureFlags.isEnabled('premium-feature', tenantId, userId);

// Get flag value (not just boolean)
const value = await featureFlags.getFlagValue('config-flag', tenantId, userId, { defaultTimeout: 30 });

// Update flag (admin only)
await featureFlags.updateFlag('new-feature', {
  enabled: true,
  rollout_percentage: 50,
  tenant_whitelist: [1, 2, 3]
});
```

## Best Practices

### 1. Always Use TypeScript Types

```typescript
// ✅ Good: Type-safe
import type { FeatureFlagKey } from '@/types/feature-flags';
const flag: FeatureFlagKey = 'dark-mode';

// ❌ Bad: Untyped
const flag = 'dark-mode';
```

### 2. Provide Fallback UI

```typescript
// ✅ Good: Fallback for disabled feature
{isEnabled('custom-reports') ? (
  <CustomReportBuilder />
) : (
  <UpgradePlanBanner feature="Custom Reports" />
)}

// ❌ Bad: No fallback, confusing UX
{isEnabled('custom-reports') && <CustomReportBuilder />}
```

### 3. Document New Flags

When adding a new flag to `src/types/feature-flags.ts`, include:
- Clear name and description
- Appropriate category
- Default enabled state
- Plan/permission requirements (if any)

### 4. Test Both States

```typescript
// Test with flag enabled and disabled
describe('AdvancedAnalytics', () => {
  it('shows analytics when flag enabled', () => {
    mockFeatureFlag('advanced-analytics', true);
    // Test enabled state
  });

  it('shows upgrade prompt when flag disabled', () => {
    mockFeatureFlag('advanced-analytics', false);
    // Test disabled state
  });
});
```

### 5. Clean Up Old Flags

Remove flags after 100% rollout:

```typescript
// Before (with flag)
{isEnabled('new-dashboard') && <NewDashboard />}

// After (100% rollout, flag removed)
<NewDashboard />
```

## Monitoring

Track feature flag usage in Application Insights:

```typescript
import telemetryService from '@/lib/telemetry';

const { isEnabled } = useFeatureFlags();

useEffect(() => {
  const flags = getAllFlags();
  telemetryService.trackEvent('FeatureFlagsEvaluated', {
    flags: JSON.stringify(flags),
    userId: user?.id,
    tenantId: tenant?.id
  });
}, []);
```

## Troubleshooting

### Flag Not Working

1. Check flag exists in `src/types/feature-flags.ts`
2. Verify user's plan meets minimum requirement
3. Check environment variable overrides
4. Verify database configuration (server-side)
5. Clear cache: `await cache.del('feature_flag:*')`

### TypeScript Errors

```typescript
// ❌ Error: Type '"invalid"' is not assignable to type 'FeatureFlagKey'
isEnabled('invalid');

// ✅ Solution: Use valid flag key
isEnabled('dark-mode');

// ✅ Or add to feature-flags.ts if it's a new flag
```

---

**Last Updated**: 2025-12-28
**Version**: 1.0.0
**Owner**: Fleet Engineering Team
