# Configuration Management Service

The **ConfigurationManagementService** is the SINGLE SOURCE OF TRUTH for all application configuration in the Fleet Management System. It provides enterprise-grade configuration management with versioning, rollback, approval workflows, and feature flags.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## Features

- **Typed Configuration**: Zod schema validation for type safety
- **Hierarchical Scopes**: Global → Organization → Team → User inheritance
- **Git-like Versioning**: Complete change history with diffs
- **Point-in-Time Recovery**: Rollback to any previous version
- **Approval Workflow**: Multi-approver workflow for critical changes
- **Feature Flags**: Gradual rollout with condition-based targeting
- **Real-time Updates**: SSE/WebSocket notifications for config changes
- **Impact Analysis**: Analyze change impact before applying
- **Encryption**: AES-256-GCM for sensitive configuration values
- **Complete Audit Trail**: All operations logged with user, timestamp, and metadata
- **Redis Caching**: 5-minute TTL for hot configurations
- **Export/Import**: Backup and restore configurations

## Installation

### 1. Run Database Migration

```bash
cd api
psql $DATABASE_URL -f database/migrations/002_configuration_management.sql
```

### 2. Install Dependencies

```bash
npm install zod ioredis
```

### 3. Set Environment Variables

```bash
# Optional: Custom encryption key (auto-generated if not provided)
export CONFIG_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Optional: Redis for caching
export REDIS_URL="redis://localhost:6379"
```

## Quick Start

### Initialize the Service

```typescript
import { createConfigurationService } from './services/config/ConfigurationManagementService';
import { getWritePool } from './config/database';
import Redis from 'ioredis';

// With Redis caching
const redis = new Redis(process.env.REDIS_URL);
const configService = createConfigurationService(getWritePool(), {
  redis,
  cacheEnabled: true,
  cacheTtl: 300 // 5 minutes
});

// Without Redis (still works, just no caching)
const configService = createConfigurationService(getWritePool());
```

### Basic Usage

```typescript
import { ConfigScope } from './services/config/ConfigurationManagementService';

// Get configuration
const branding = await configService.get('branding', {
  scope: ConfigScope.ORGANIZATION,
  scopeId: 'org-123'
});

// Set configuration
await configService.set(
  'branding',
  {
    logo: 'https://example.com/logo.png',
    primaryColor: '#FF6B00',
    secondaryColor: '#003366',
    companyName: 'Acme Corp'
  },
  { scope: ConfigScope.ORGANIZATION, scopeId: 'org-123' },
  'user-456',
  'Updated brand colors for Q1 2026'
);

// Rollback to previous version
await configService.rollback(
  'branding',
  'abc123def456', // version hash
  'user-456',
  'Reverting to old colors due to accessibility issues'
);
```

## Core Concepts

### Configuration Scopes

Configurations follow a hierarchical scope model with inheritance:

```
USER (highest priority)
  ↓
TEAM
  ↓
ORGANIZATION
  ↓
GLOBAL (lowest priority)
```

**Example:**
```typescript
// Global default: 5000 miles
await configService.set('pm_intervals', { lightDuty: 5000 },
  { scope: ConfigScope.GLOBAL }, 'admin');

// Org override: 7500 miles
await configService.set('pm_intervals', { lightDuty: 7500 },
  { scope: ConfigScope.ORGANIZATION, scopeId: 'org-123' }, 'admin');

// Team override: 10000 miles
await configService.set('pm_intervals', { lightDuty: 10000 },
  { scope: ConfigScope.TEAM, scopeId: 'team-456' }, 'admin');

// User gets team value: 10000 miles
const config = await configService.get('pm_intervals',
  { scope: ConfigScope.TEAM, scopeId: 'team-456' });
// → { lightDuty: 10000 }
```

### Impact Levels

Every configuration change is assigned an impact level:

- **NONE**: No impact (e.g., user preferences)
- **LOW**: Minor UI changes (e.g., branding colors)
- **MEDIUM**: Feature behavior changes (e.g., notification settings)
- **HIGH**: Critical system behavior (e.g., PM intervals)
- **CRITICAL**: Requires downtime or approval (e.g., approval thresholds)

Impact levels determine:
- Whether approval is required
- Who can approve the change
- Testing requirements
- Rollback priority

### Versioning

Every configuration change creates a new version:

```typescript
const version = await configService.set('branding', newValue, scope, userId);
console.log(version.version); // "a1b2c3d4e5f6g7h8"

// Get history
const history = await configService.getHistory('branding', 10);
for (const v of history) {
  console.log(`${v.changedAt}: ${v.comment} (by ${v.changedBy})`);
}

// View specific version
const oldVersion = await configService.getVersion('branding', 'a1b2c3d4e5f6g7h8');

// Compare versions
const diff = await configService.getDiff('branding', 'version1', 'version2');
```

## Usage Examples

### 1. Basic Get/Set Operations

```typescript
// Get with scope inheritance
const systemSettings = await configService.get<SystemSettings>('system_settings');

// Get multiple configs in one query
const configs = await configService.getBatch(
  ['branding', 'pm_intervals', 'approval_thresholds'],
  { scope: ConfigScope.ORGANIZATION, scopeId: 'org-123' }
);

console.log(configs.get('branding'));
console.log(configs.get('pm_intervals'));

// Get all configs for a scope
const allConfigs = await configService.getAll({
  scope: ConfigScope.ORGANIZATION,
  scopeId: 'org-123'
});
```

### 2. Hierarchical Configuration Inheritance

```typescript
// Set global defaults
await configService.set(
  'email_notifications',
  {
    maintenanceDue: true,
    inspectionDue: true,
    documentExpiring: false,
    workOrderAssigned: true,
    dailyDigest: false
  },
  { scope: ConfigScope.GLOBAL },
  'admin-user',
  'Global notification defaults'
);

// Override for specific user
await configService.set(
  'email_notifications',
  {
    dailyDigest: true  // User wants daily digest
  },
  { scope: ConfigScope.USER, scopeId: 'user-789' },
  'user-789',
  'Enable daily digest for me'
);

// User gets merged config (user overrides + global defaults)
const userNotifications = await configService.get('email_notifications', {
  scope: ConfigScope.USER,
  scopeId: 'user-789'
});
// Result: { maintenanceDue: true, inspectionDue: true, ..., dailyDigest: true }
```

### 3. Version History and Rollback

```typescript
// Get full history
const history = await configService.getHistory('pm_intervals', 20);

console.log('Version history:');
for (const version of history) {
  console.log(`
    Version: ${version.version}
    Changed: ${version.changedAt}
    By: ${version.changedBy}
    Comment: ${version.comment}
    Impact: ${version.impactLevel}
    Rollback: ${version.isRollback}
  `);
}

// View diff between versions
const diff = await configService.getDiff(
  'pm_intervals',
  history[1].version,
  history[0].version
);

for (const change of diff) {
  console.log(`${change.operation} ${change.path}:`);
  if (change.oldValue) console.log(`  Old: ${JSON.stringify(change.oldValue)}`);
  if (change.newValue) console.log(`  New: ${JSON.stringify(change.newValue)}`);
}

// Rollback to stable version
const stableVersion = history.find(v => v.tags.includes('stable-v1.0'));
if (stableVersion) {
  await configService.rollback(
    'pm_intervals',
    stableVersion.version,
    'admin-user',
    'Reverting to last stable release due to production issues'
  );
}

// Tag current version as stable
await configService.createTag(
  'stable-v2.0',
  history[0].version,
  'Stable release Q1 2026'
);
```

### 4. Approval Workflow for Critical Changes

```typescript
// Try to change approval thresholds (requires approval)
try {
  await configService.set(
    'approval_thresholds',
    {
      maintenanceApproval: 50000,  // Increase from 10000
      procurementApproval: 100000,
      budgetVariance: 20
    },
    { scope: ConfigScope.GLOBAL },
    'manager-user',
    'Increase thresholds to reduce bottlenecks'
  );
} catch (error) {
  console.log(error.message);
  // "This change requires approval. Change request created: req-123"
}

// Approver reviews pending changes
const pending = await configService.getPendingChanges('approver-user');

for (const request of pending) {
  console.log(`
    Request: ${request.id}
    Key: ${request.key}
    Impact: ${request.impactLevel}
    Requested by: ${request.requestedBy}
    Justification: ${request.justification}
    Current: ${JSON.stringify(request.currentValue)}
    Proposed: ${JSON.stringify(request.proposedValue)}
    Approvals: ${request.approvals.length}/${request.minimumApprovals}
  `);

  // Analyze impact
  const impact = await configService.analyzeImpact(
    request.key,
    request.proposedValue
  );

  console.log('Impact Analysis:');
  console.log('  Affected services:', impact.affectedServices);
  console.log('  Affected users:', impact.affectedUsers);
  console.log('  Testing recommendations:', impact.testingRecommendations);

  // Approve the change
  await configService.approveChange(
    request.id,
    'approver-user',
    'Approved after reviewing impact analysis'
  );
}

// Alternatively, reject
await configService.rejectChange(
  'req-123',
  'approver-user',
  'Impact too high for current quarter, revisit in Q2'
);
```

### 5. Feature Flags with Gradual Rollout

```typescript
// Create a new feature flag
await configService.set(
  'feature_flags',
  {
    name: 'ai-maintenance-predictions',
    enabled: true,
    rolloutPercentage: 0,
    description: 'AI-powered predictive maintenance'
  },
  { scope: ConfigScope.GLOBAL },
  'admin'
);

// Start gradual rollout: 10% of users
await configService.setFlagRollout('ai-maintenance-predictions', 10);

// Check if feature is enabled for user
const isEnabled = await configService.evaluateFlag('ai-maintenance-predictions', {
  userId: 'user-123',
  organizationId: 'org-456',
  attributes: { role: 'FleetManager', tier: 'enterprise' }
});

if (isEnabled) {
  // Show AI predictions
  console.log('Showing AI maintenance predictions');
}

// Monitor metrics, then increase rollout
await configService.setFlagRollout('ai-maintenance-predictions', 50);  // 50%
await configService.setFlagRollout('ai-maintenance-predictions', 100); // 100%

// List all flags
const flags = await configService.listFlags();
for (const flag of flags) {
  console.log(`${flag.name}: ${flag.enabled ? 'ON' : 'OFF'} (${flag.rolloutPercentage}%)`);
}
```

### 6. Feature Flags with Conditions

```typescript
// Enable feature only for specific roles
const advancedAnalyticsFlag = {
  name: 'advanced-analytics',
  enabled: true,
  rolloutPercentage: 100,
  conditions: [
    {
      attribute: 'attributes.role',
      operator: 'in' as const,
      values: ['Admin', 'Analyst', 'FleetManager']
    },
    {
      attribute: 'attributes.tier',
      operator: 'equals' as const,
      value: 'enterprise'
    }
  ],
  description: 'Advanced analytics dashboard'
};

// Evaluate for user
const enabled = await configService.evaluateFlag('advanced-analytics', {
  userId: 'user-123',
  organizationId: 'org-456',
  attributes: {
    role: 'Analyst',
    tier: 'enterprise'
  }
});
// → true (matches conditions)

const enabledForBasic = await configService.evaluateFlag('advanced-analytics', {
  userId: 'user-789',
  organizationId: 'org-999',
  attributes: {
    role: 'Driver',
    tier: 'basic'
  }
});
// → false (doesn't match conditions)
```

### 7. Real-time Configuration Updates

```typescript
// Subscribe to configuration changes
const unwatch = await configService.watchConfig(
  ['branding', 'pm_intervals', 'approval_thresholds'],
  (changes) => {
    for (const change of changes) {
      console.log(`Configuration changed: ${change.key}`);
      console.log(`  Old value:`, change.oldValue);
      console.log(`  New value:`, change.newValue);
      console.log(`  Changed by: ${change.changedBy}`);
      console.log(`  Version: ${change.version}`);

      // Update UI, reload config, notify users, etc.
      if (change.key === 'branding') {
        updateUIBranding(change.newValue);
      }
    }
  }
);

// Later: stop watching
unwatch();
```

### 8. Impact Analysis Before Changes

```typescript
// Analyze impact before changing PM intervals
const impact = await configService.analyzeImpact('pm_intervals', {
  lightDuty: 15000,   // Increasing from 5000
  mediumDuty: 25000,  // Increasing from 10000
  heavyDuty: 50000    // No change
});

console.log('Impact Analysis Report:');
console.log('======================');
console.log('Impact Level:', impact.impactLevel);
console.log('Requires Approval:', impact.requiresApproval);
console.log('Required Approvers:', impact.requiredApprovers);
console.log('Affected Services:', impact.affectedServices);
console.log('Affected Users:', impact.affectedUsers);
console.log('Estimated Downtime:', impact.estimatedDowntime || 'None');
console.log('\nRollback Plan:');
console.log(impact.rollbackPlan);
console.log('\nTesting Recommendations:');
impact.testingRecommendations.forEach((rec, i) => {
  console.log(`  ${i + 1}. ${rec}`);
});
console.log('\nDependencies:', impact.dependencies);

// Only proceed if impact is acceptable
if (impact.impactLevel === 'critical') {
  console.log('STOP: This change is critical. Create approval request instead.');
} else {
  // Apply change
  await configService.set('pm_intervals', newValue, scope, userId);
}
```

### 9. Export/Import for Disaster Recovery

```typescript
// Export all organization configs
const backupJson = await configService.exportConfig(
  { scope: ConfigScope.ORGANIZATION, scopeId: 'org-123' },
  'json'
);

await fs.writeFile('config-backup-org123-2026-01-05.json', backupJson);

// Later: restore from backup
const backupData = await fs.readFile('config-backup-org123-2026-01-05.json', 'utf8');
const result = await configService.importConfig(
  backupData,
  'json',
  'admin-user',
  { scope: ConfigScope.ORGANIZATION, scopeId: 'org-123' }
);

console.log(`Imported: ${result.imported}`);
console.log(`Failed: ${result.failed}`);

if (result.errors.length > 0) {
  console.log('Errors:');
  result.errors.forEach(err => {
    console.log(`  ${err.key}: ${err.error}`);
  });
}
```

### 10. Schema Validation

```typescript
import { z } from 'zod';

// Define custom schema
const vehicleSettingsSchema = z.object({
  maxSpeed: z.number().min(0).max(200),
  fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid']),
  maintenanceInterval: z.number().min(1000).max(50000),
  warrantyExpiration: z.string().datetime().optional()
});

// Register schema
await configService.registerSchema('vehicle_settings', vehicleSettingsSchema);

// Valid configuration passes
await configService.set(
  'vehicle_settings',
  {
    maxSpeed: 120,
    fuelType: 'electric',
    maintenanceInterval: 10000
  },
  { scope: ConfigScope.ORGANIZATION, scopeId: 'org-123' },
  'admin'
);

// Invalid configuration throws error
try {
  await configService.set(
    'vehicle_settings',
    {
      maxSpeed: 300,  // Exceeds max of 200
      fuelType: 'nuclear',  // Invalid enum value
      maintenanceInterval: 100  // Below minimum of 1000
    },
    { scope: ConfigScope.ORGANIZATION, scopeId: 'org-123' },
    'admin'
  );
} catch (error) {
  console.error(error.message);
  // "Validation failed: maxSpeed must be at most 200, ..."
}

// Validate before setting
const validationResult = await configService.validateConfig('vehicle_settings', {
  maxSpeed: 150,
  fuelType: 'hybrid',
  maintenanceInterval: 15000
});

if (validationResult.valid) {
  console.log('Configuration is valid');
} else {
  console.log('Validation errors:', validationResult.errors);
}
```

### 11. Cache Management

```typescript
// Preload hot configs on startup
await configService.preloadHotConfigs();

// Invalidate specific config cache
await configService.invalidateCache('branding');

// Invalidate all PM-related configs
await configService.invalidateCache('pm_*');

// Invalidate entire cache
await configService.invalidateCache();
```

### 12. Complete Example: Organization Onboarding

```typescript
async function onboardOrganization(orgId: string, adminUserId: string) {
  // 1. Set organization branding
  await configService.set(
    'branding',
    {
      logo: 'https://cdn.example.com/orgs/123/logo.png',
      primaryColor: '#FF6B00',
      secondaryColor: '#003366',
      companyName: 'Acme Fleet Services',
      tagline: 'Moving America Forward'
    },
    { scope: ConfigScope.ORGANIZATION, scopeId: orgId },
    adminUserId,
    'Initial organization setup'
  );

  // 2. Set PM intervals
  await configService.set(
    'pm_intervals',
    {
      lightDuty: 5000,
      mediumDuty: 10000,
      heavyDuty: 25000
    },
    { scope: ConfigScope.ORGANIZATION, scopeId: orgId },
    adminUserId,
    'Standard PM intervals for fleet'
  );

  // 3. Set approval thresholds
  await configService.set(
    'approval_thresholds',
    {
      maintenanceApproval: 5000,
      procurementApproval: 10000,
      budgetVariance: 10
    },
    { scope: ConfigScope.ORGANIZATION, scopeId: orgId },
    adminUserId,
    'Initial approval thresholds'
  );

  // 4. Enable features for organization
  await configService.set(
    'email_notifications',
    {
      maintenanceDue: true,
      inspectionDue: true,
      documentExpiring: true,
      workOrderAssigned: true,
      dailyDigest: false
    },
    { scope: ConfigScope.ORGANIZATION, scopeId: orgId },
    adminUserId,
    'Default notification settings'
  );

  // 5. Export initial configuration as baseline
  const baseline = await configService.exportConfig(
    { scope: ConfigScope.ORGANIZATION, scopeId: orgId },
    'json'
  );

  await fs.writeFile(
    `config-baseline-${orgId}.json`,
    baseline
  );

  console.log(`Organization ${orgId} onboarded successfully`);
}
```

## API Reference

See the [ConfigurationManagementService.ts](./ConfigurationManagementService.ts) file for complete JSDoc documentation of all methods.

### Core Methods

- `get<T>(key, scope?)` - Get configuration with scope inheritance
- `getBatch(keys, scope?)` - Get multiple configurations in one query
- `getAll(scope?)` - Get all configurations for a scope
- `set<T>(key, value, scope, userId, comment?)` - Set configuration with versioning
- `delete(key, scope, userId, comment?)` - Delete configuration (soft delete)

### Versioning Methods

- `getVersion(key, version)` - Get specific version
- `getHistory(key, limit?)` - Get version history
- `getDiff(key, versionA, versionB)` - Compare two versions
- `rollback(key, toVersion, userId, reason)` - Rollback to previous version
- `createTag(tagName, version, description)` - Tag a version

### Validation Methods

- `validateConfig(key, value)` - Validate against schema
- `registerSchema(key, schema)` - Register Zod schema
- `getSchema(key)` - Get schema for key

### Approval Workflow Methods

- `requestChange(request)` - Create change request
- `approveChange(requestId, approverId, comment?)` - Approve request
- `rejectChange(requestId, approverId, reason)` - Reject request
- `getPendingChanges(approverId?)` - Get pending requests

### Feature Flag Methods

- `evaluateFlag(flagName, context)` - Evaluate flag for context
- `setFlagRollout(flagName, percentage)` - Set rollout percentage
- `listFlags()` - List all feature flags

### Real-time Methods

- `watchConfig(keys, callback)` - Subscribe to changes
- `broadcastChange(...)` - Broadcast change (internal)

### Impact Analysis Methods

- `analyzeImpact(key, newValue)` - Analyze change impact
- `getDependencies(key)` - Get configuration dependencies

### Export/Import Methods

- `exportConfig(scope, format)` - Export configurations
- `importConfig(data, format, userId, scope?)` - Import configurations

### Cache Methods

- `invalidateCache(pattern?)` - Invalidate cache
- `preloadHotConfigs()` - Preload frequently used configs

## Best Practices

### 1. Always Use Scope Inheritance

```typescript
// ❌ Bad: Setting everything at user level
await configService.set('branding', value, { scope: ConfigScope.USER, scopeId: 'user-123' }, userId);

// ✅ Good: Set at appropriate level
await configService.set('branding', value, { scope: ConfigScope.ORGANIZATION, scopeId: 'org-123' }, userId);
```

### 2. Provide Meaningful Comments

```typescript
// ❌ Bad: No context
await configService.set('pm_intervals', value, scope, userId);

// ✅ Good: Clear rationale
await configService.set(
  'pm_intervals',
  value,
  scope,
  userId,
  'Increased intervals based on 6-month fleet analysis showing 20% reduction in unscheduled maintenance'
);
```

### 3. Analyze Impact Before Critical Changes

```typescript
// ❌ Bad: Change without analysis
await configService.set('approval_thresholds', newValue, scope, userId);

// ✅ Good: Analyze first
const impact = await configService.analyzeImpact('approval_thresholds', newValue);
if (impact.impactLevel === ImpactLevel.CRITICAL) {
  // Create approval request instead
  await configService.requestChange({ ... });
} else {
  await configService.set('approval_thresholds', newValue, scope, userId);
}
```

### 4. Tag Stable Versions

```typescript
// After successful deployment
const version = await configService.set('pm_intervals', value, scope, userId);
await configService.createTag('stable-q1-2026', version.version, 'Production stable release');
```

### 5. Use Feature Flags for Gradual Rollout

```typescript
// ❌ Bad: Enable new feature for everyone immediately
if (true) {
  showNewFeature();
}

// ✅ Good: Gradual rollout with monitoring
const enabled = await configService.evaluateFlag('new-feature', { userId, organizationId });
if (enabled) {
  showNewFeature();
}
```

### 6. Export Configs Before Major Changes

```typescript
// Before major system upgrade
const backup = await configService.exportConfig({ scope: ConfigScope.GLOBAL }, 'json');
await fs.writeFile(`backup-${Date.now()}.json`, backup);

// Perform upgrade
await performUpgrade();

// If issues: restore
await configService.importConfig(backup, 'json', 'admin');
```

## Security

### Sensitive Configuration Encryption

Configurations with sensitive data are automatically encrypted:

```typescript
// These keys are automatically encrypted at rest
const sensitiveKeys = [
  'api_keys',
  'secrets',
  'credentials',
  'tokens',
  'passwords'
];

// Set sensitive config (automatically encrypted)
await configService.set(
  'api_keys',
  { stripe: 'sk_live_xxx', twilio: 'xxx' },
  scope,
  userId
);

// Get sensitive config (automatically decrypted)
const keys = await configService.get('api_keys');
// Decrypted in memory, encrypted at rest
```

### Audit Trail

All operations are logged:

```sql
SELECT
  operation,
  config_key,
  user_id,
  success,
  metadata,
  created_at
FROM configuration_audit_log
WHERE user_id = 'user-123'
ORDER BY created_at DESC;
```

### Access Control Integration

Integrate with your authorization service:

```typescript
// Before setting configuration
const hasPermission = await authService.checkPermission(
  userId,
  'configuration:write',
  { resource: 'approval_thresholds', scope: 'global' }
);

if (!hasPermission) {
  throw new Error('Insufficient permissions');
}

await configService.set('approval_thresholds', value, scope, userId);
```

## Troubleshooting

### Configuration Not Found

```typescript
const value = await configService.get('my_config', { scope: ConfigScope.ORGANIZATION, scopeId: 'org-123' });
if (!value) {
  console.log('Config not found, using default');
  // Fall back to default
}
```

### Validation Errors

```typescript
try {
  await configService.set('pm_intervals', { lightDuty: 50 }, scope, userId);
} catch (error) {
  if (error.message.includes('Validation failed')) {
    console.error('Invalid configuration:', error.message);
    // Show validation errors to user
  }
}
```

### Approval Required

```typescript
try {
  await configService.set('approval_thresholds', newValue, scope, userId);
} catch (error) {
  if (error.message.includes('requires approval')) {
    const requestId = error.message.match(/request created: (.+)/)[1];
    console.log(`Change request created: ${requestId}`);
    console.log('Waiting for approval from administrators');
  }
}
```

### Cache Inconsistency

```typescript
// If you suspect cache is stale, invalidate it
await configService.invalidateCache('branding');

// Then fetch fresh from database
const freshValue = await configService.get('branding');
```

## Performance Tips

1. **Use getBatch for multiple configs**
   ```typescript
   // ❌ Bad: Multiple queries
   const branding = await configService.get('branding');
   const intervals = await configService.get('pm_intervals');
   const thresholds = await configService.get('approval_thresholds');

   // ✅ Good: Single query
   const configs = await configService.getBatch(['branding', 'pm_intervals', 'approval_thresholds']);
   ```

2. **Preload hot configs on startup**
   ```typescript
   await configService.preloadHotConfigs();
   ```

3. **Use Redis for production**
   ```typescript
   const redis = new Redis(process.env.REDIS_URL);
   const configService = createConfigurationService(pool, { redis });
   ```

4. **Watch only necessary keys**
   ```typescript
   // ❌ Bad: Watch everything
   await configService.watchConfig(['*'], callback);

   // ✅ Good: Watch only what you need
   await configService.watchConfig(['branding', 'system_settings'], callback);
   ```

## Migration Guide

If you're currently using environment variables or config files:

```typescript
// Before (old approach)
const pmInterval = parseInt(process.env.PM_INTERVAL_LIGHT_DUTY || '5000');

// After (new approach)
const pmIntervals = await configService.get('pm_intervals');
const pmInterval = pmIntervals.lightDuty;

// Migration script
async function migrateEnvToConfigService() {
  await configService.set(
    'pm_intervals',
    {
      lightDuty: parseInt(process.env.PM_INTERVAL_LIGHT_DUTY || '5000'),
      mediumDuty: parseInt(process.env.PM_INTERVAL_MEDIUM_DUTY || '10000'),
      heavyDuty: parseInt(process.env.PM_INTERVAL_HEAVY_DUTY || '25000')
    },
    { scope: ConfigScope.GLOBAL },
    'migration-script',
    'Migrated from environment variables'
  );
}
```

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [API Reference](#api-reference)
3. Check audit logs: `SELECT * FROM configuration_audit_log WHERE config_key = 'your_key'`
4. Contact the platform team

---

**Built with ❤️ for the Fleet Management System**
