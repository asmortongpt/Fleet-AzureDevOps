/**
 * Configuration Management Service - Integration Examples
 *
 * This file demonstrates how to integrate the ConfigurationManagementService
 * into various parts of the Fleet Management System.
 */

import { Router, Request, Response } from 'express';
import Redis from 'ioredis';
import { Pool } from 'pg';

import {
  ConfigurationManagementService,
  createConfigurationService,
  ConfigScope
} from './ConfigurationManagementService';

// ============================================================================
// Example 1: Express API Routes
// ============================================================================

export function createConfigRouter(configService: ConfigurationManagementService): Router {
  const router = Router();

  /**
   * GET /api/config/:key
   * Get a configuration value with optional scope
   */
  router.get('/:key', async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { scope, scopeId } = req.query;

      const value = await configService.get(key, {
        scope: (scope as ConfigScope) || ConfigScope.GLOBAL,
        scopeId: scopeId as string
      });

      if (value === null) {
        return res.status(404).json({
          error: 'Configuration not found',
          key
        });
      }

      res.json({
        key,
        value,
        scope: scope || 'global',
        scopeId: scopeId || null
      });
    } catch (error) {
      console.error('[Config API] Get error:', error);
      res.status(500).json({
        error: 'Failed to get configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/config/:key
   * Set a configuration value
   */
  router.post('/:key', async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { value, scope, scopeId, comment } = req.body;
      const userId = req.user?.id; // From auth middleware

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const version = await configService.set(
        key,
        value,
        {
          scope: scope || ConfigScope.GLOBAL,
          scopeId
        },
        userId,
        comment
      );

      res.json({
        success: true,
        version: version.version,
        impactLevel: version.impactLevel,
        message: 'Configuration updated successfully'
      });
    } catch (error) {
      console.error('[Config API] Set error:', error);

      // Check if approval is required
      if (error instanceof Error && error.message.includes('requires approval')) {
        const requestId = error.message.match(/request created: (.+)/)?.[1];
        return res.status(202).json({
          requiresApproval: true,
          requestId,
          message: 'Change request created and pending approval'
        });
      }

      res.status(500).json({
        error: 'Failed to set configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/config/:key/history
   * Get version history for a configuration key
   */
  router.get('/:key/history', async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;

      const history = await configService.getHistory(key, limit);

      res.json({
        key,
        versions: history,
        count: history.length
      });
    } catch (error) {
      console.error('[Config API] History error:', error);
      res.status(500).json({
        error: 'Failed to get configuration history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/config/:key/rollback
   * Rollback to a previous version
   */
  router.post('/:key/rollback', async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { toVersion, reason } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const version = await configService.rollback(key, toVersion, userId, reason);

      res.json({
        success: true,
        version: version.version,
        message: 'Configuration rolled back successfully'
      });
    } catch (error) {
      console.error('[Config API] Rollback error:', error);
      res.status(500).json({
        error: 'Failed to rollback configuration',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/config/:key/diff
   * Get diff between two versions
   */
  router.get('/:key/diff', async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const { versionA, versionB } = req.query;

      if (!versionA || !versionB) {
        return res.status(400).json({
          error: 'Both versionA and versionB are required'
        });
      }

      const diff = await configService.getDiff(
        key,
        versionA as string,
        versionB as string
      );

      res.json({
        key,
        versionA,
        versionB,
        changes: diff
      });
    } catch (error) {
      console.error('[Config API] Diff error:', error);
      res.status(500).json({
        error: 'Failed to get configuration diff',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/config/changes/pending
   * Get pending change requests
   */
  router.get('/changes/pending', async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const pending = await configService.getPendingChanges(userId);

      res.json({
        requests: pending,
        count: pending.length
      });
    } catch (error) {
      console.error('[Config API] Pending changes error:', error);
      res.status(500).json({
        error: 'Failed to get pending changes',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/config/changes/:requestId/approve
   * Approve a change request
   */
  router.post('/changes/:requestId/approve', async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const { comment } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await configService.approveChange(requestId, userId, comment);

      res.json({
        success: true,
        message: 'Change request approved'
      });
    } catch (error) {
      console.error('[Config API] Approve error:', error);
      res.status(500).json({
        error: 'Failed to approve change request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/config/changes/:requestId/reject
   * Reject a change request
   */
  router.post('/changes/:requestId/reject', async (req: Request, res: Response) => {
    try {
      const { requestId } = req.params;
      const { reason } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!reason) {
        return res.status(400).json({
          error: 'Rejection reason is required'
        });
      }

      await configService.rejectChange(requestId, userId, reason);

      res.json({
        success: true,
        message: 'Change request rejected'
      });
    } catch (error) {
      console.error('[Config API] Reject error:', error);
      res.status(500).json({
        error: 'Failed to reject change request',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * GET /api/config/flags
   * List all feature flags
   */
  router.get('/flags/list', async (req: Request, res: Response) => {
    try {
      const flags = await configService.listFlags();

      res.json({
        flags,
        count: flags.length
      });
    } catch (error) {
      console.error('[Config API] List flags error:', error);
      res.status(500).json({
        error: 'Failed to list feature flags',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/config/flags/:flagName/evaluate
   * Evaluate a feature flag for the current user
   */
  router.post('/flags/:flagName/evaluate', async (req: Request, res: Response) => {
    try {
      const { flagName } = req.params;
      const userId = req.user?.id;
      const organizationId = req.user?.organizationId;
      const { attributes } = req.body;

      const enabled = await configService.evaluateFlag(flagName, {
        userId,
        organizationId,
        attributes
      });

      res.json({
        flagName,
        enabled
      });
    } catch (error) {
      console.error('[Config API] Evaluate flag error:', error);
      res.status(500).json({
        error: 'Failed to evaluate feature flag',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  /**
   * POST /api/config/flags/:flagName/rollout
   * Set rollout percentage for a feature flag
   */
  router.post('/flags/:flagName/rollout', async (req: Request, res: Response) => {
    try {
      const { flagName } = req.params;
      const { percentage } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
        return res.status(400).json({
          error: 'Percentage must be a number between 0 and 100'
        });
      }

      await configService.setFlagRollout(flagName, percentage);

      res.json({
        success: true,
        flagName,
        percentage,
        message: 'Feature flag rollout updated'
      });
    } catch (error) {
      console.error('[Config API] Set rollout error:', error);
      res.status(500).json({
        error: 'Failed to set feature flag rollout',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  return router;
}

// ============================================================================
// Example 2: Service Initialization in Express App
// ============================================================================

export async function initializeConfigServiceForApp(pool: Pool): Promise<ConfigurationManagementService> {
  // Initialize Redis if available
  let redis: Redis | undefined;

  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });

    redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });
  }

  // Create service
  const configService = createConfigurationService(pool, {
    redis,
    cacheEnabled: process.env.NODE_ENV === 'production',
    cacheTtl: 300
  });

  // Preload hot configs on startup
  try {
    await configService.preloadHotConfigs();
    console.log('[ConfigService] Hot configs preloaded');
  } catch (error) {
    console.error('[ConfigService] Failed to preload configs:', error);
  }

  return configService;
}

// ============================================================================
// Example 3: React Frontend Integration
// ============================================================================

/**
 * Frontend hook for using configuration
 */
export const frontendExample = `
import { useState, useEffect } from 'react';

interface ConfigHookResult<T> {
  config: T | null;
  loading: boolean;
  error: Error | null;
  reload: () => Promise<void>;
}

export function useConfig<T = any>(
  key: string,
  scope: { scope: string; scopeId?: string } = { scope: 'global' }
): ConfigHookResult<T> {
  const [config, setConfig] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        \`/api/config/\${key}?scope=\${scope.scope}&scopeId=\${scope.scopeId || ''}\`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch configuration');
      }

      const data = await response.json();
      setConfig(data.value);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();

    // Subscribe to real-time updates via SSE
    const eventSource = new EventSource(\`/api/config/\${key}/watch\`);

    eventSource.onmessage = (event) => {
      const change = JSON.parse(event.data);
      if (change.key === key) {
        setConfig(change.newValue);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [key, scope.scope, scope.scopeId]);

  return { config, loading, error, reload: fetchConfig };
}

// Usage in component
function BrandingComponent() {
  const { config: branding, loading } = useConfig('branding', {
    scope: 'org',
    scopeId: 'org-123'
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ color: branding.primaryColor }}>
      <img src={branding.logo} alt={branding.companyName} />
      <h1>{branding.companyName}</h1>
      <p>{branding.tagline}</p>
    </div>
  );
}

// Feature flag usage
function AdvancedAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    fetch('/api/config/flags/advanced-analytics/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attributes: {
          role: 'Analyst',
          tier: 'enterprise'
        }
      })
    })
      .then(res => res.json())
      .then(data => setEnabled(data.enabled));
  }, []);

  if (!enabled) {
    return <div>Basic Analytics</div>;
  }

  return <div>Advanced Analytics Dashboard</div>;
}
`;

// ============================================================================
// Example 4: Background Job Integration
// ============================================================================

export async function exampleBackgroundJob(configService: ConfigurationManagementService) {
  /**
   * Expire old change requests (run daily)
   */
  async function expireOldChangeRequests() {
    const pending = await configService.getPendingChanges();

    for (const request of pending) {
      if (request.expiresAt && new Date(request.expiresAt) < new Date()) {
        console.log(`Expiring change request ${request.id} (expired at ${request.expiresAt})`);

        await configService.rejectChange(
          request.id,
          'system',
          'Automatically rejected: Request expired'
        );
      }
    }
  }

  /**
   * Export daily configuration backup
   */
  async function exportDailyBackup() {
    const backup = await configService.exportConfig(
      { scope: ConfigScope.GLOBAL },
      'json'
    );

    // Save to backup storage (S3, Azure Blob, etc.)
    const filename = `config-backup-${new Date().toISOString()}.json`;
    console.log(`Exported configuration backup: ${filename}`);

    // In production, upload to cloud storage
    // await uploadToS3(filename, backup);
  }

  /**
   * Monitor configuration changes and send alerts
   */
  async function monitorConfigChanges() {
    await configService.watchConfig(['approval_thresholds', 'pm_intervals'], async (changes) => {
      for (const change of changes) {
        // Send alert to administrators
        console.log(`ALERT: Critical config changed: ${change.key}`);
        console.log(`  Changed by: ${change.changedBy}`);
        console.log(`  Old value: ${JSON.stringify(change.oldValue)}`);
        console.log(`  New value: ${JSON.stringify(change.newValue)}`);

        // In production, send email/Slack notification
        // await sendNotification({
        //   to: 'admins@example.com',
        //   subject: 'Critical Configuration Changed',
        //   body: ...
        // });
      }
    });
  }

  // Schedule jobs
  // setInterval(expireOldChangeRequests, 24 * 60 * 60 * 1000); // Daily
  // setInterval(exportDailyBackup, 24 * 60 * 60 * 1000); // Daily
  // monitorConfigChanges(); // Start monitoring
}

// ============================================================================
// Example 5: Maintenance Service Integration
// ============================================================================

export class MaintenanceService {
  constructor(private configService: ConfigurationManagementService) { }

  /**
   * Get PM interval for a vehicle based on its class
   */
  async getPMInterval(vehicleClass: 'light' | 'medium' | 'heavy', orgId: string): Promise<number> {
    const pmIntervals = await this.configService.get<{
      lightDuty: number;
      mediumDuty: number;
      heavyDuty: number;
    }>('pm_intervals', {
      scope: ConfigScope.ORGANIZATION,
      scopeId: orgId
    });

    if (!pmIntervals) {
      // Fallback to defaults
      return vehicleClass === 'light' ? 5000 : vehicleClass === 'medium' ? 10000 : 25000;
    }

    switch (vehicleClass) {
      case 'light':
        return pmIntervals.lightDuty;
      case 'medium':
        return pmIntervals.mediumDuty;
      case 'heavy':
        return pmIntervals.heavyDuty;
    }
  }

  /**
   * Check if maintenance requires approval based on cost
   */
  async requiresApproval(cost: number, orgId: string): Promise<boolean> {
    const thresholds = await this.configService.get<{
      maintenanceApproval: number;
    }>('approval_thresholds', {
      scope: ConfigScope.ORGANIZATION,
      scopeId: orgId
    });

    if (!thresholds) {
      return cost > 5000; // Default threshold
    }

    return cost > thresholds.maintenanceApproval;
  }
}

// ============================================================================
// Example 6: Testing Configuration Service
// ============================================================================

export const testingExample = `
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Pool } from 'pg';
import { ConfigurationManagementService, ConfigScope } from './ConfigurationManagementService';

describe('ConfigurationManagementService', () => {
  let pool: Pool;
  let configService: ConfigurationManagementService;

  beforeAll(async () => {
    pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    configService = new ConfigurationManagementService(pool, {
      cacheEnabled: false // Disable cache for tests
    });
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should set and get configuration', async () => {
    await configService.set(
      'test_config',
      { value: 'test' },
      { scope: ConfigScope.GLOBAL },
      'test-user'
    );

    const value = await configService.get('test_config');
    expect(value).toEqual({ value: 'test' });
  });

  it('should maintain version history', async () => {
    await configService.set('test_config', { value: 'v1' }, { scope: ConfigScope.GLOBAL }, 'user');
    await configService.set('test_config', { value: 'v2' }, { scope: ConfigScope.GLOBAL }, 'user');

    const history = await configService.getHistory('test_config');
    expect(history).toHaveLength(2);
    expect(history[0].value).toEqual({ value: 'v2' });
    expect(history[1].value).toEqual({ value: 'v1' });
  });

  it('should rollback to previous version', async () => {
    const v1 = await configService.set('test_config', { value: 'v1' }, { scope: ConfigScope.GLOBAL }, 'user');
    await configService.set('test_config', { value: 'v2' }, { scope: ConfigScope.GLOBAL }, 'user');

    await configService.rollback('test_config', v1.version, 'user', 'Testing rollback');

    const value = await configService.get('test_config');
    expect(value).toEqual({ value: 'v1' });
  });

  it('should evaluate feature flags correctly', async () => {
    await configService.setFlagRollout('test-flag', 50);

    const enabled = await configService.evaluateFlag('test-flag', {
      userId: 'user-123'
    });

    expect(typeof enabled).toBe('boolean');
  });
});
`;

// ============================================================================
// Example 7: Complete App.ts Integration
// ============================================================================

export const appIntegrationExample = `
import express from 'express';
import { Pool } from 'pg';
import { initializeConfigServiceForApp, createConfigRouter } from './services/config/examples';

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize configuration service
let configService: ConfigurationManagementService;

async function startServer() {
  // Initialize config service
  configService = await initializeConfigServiceForApp(pool);

  // Make config service available to all routes
  app.locals.configService = configService;

  // Mount config routes
  app.use('/api/config', createConfigRouter(configService));

  // Use in other routes
  app.get('/api/branding', async (req, res) => {
    const orgId = req.user?.organizationId;
    const branding = await configService.get('branding', {
      scope: ConfigScope.ORGANIZATION,
      scopeId: orgId
    });

    res.json(branding);
  });

  // Start server
  app.listen(3000, () => {
    console.log('Server started on port 3000');
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await pool.end();
    process.exit(0);
  });
}

startServer().catch(console.error);
`;

// ============================================================================
// Example 8: Middleware for Feature Flags
// ============================================================================

export function createFeatureFlagMiddleware(configService: ConfigurationManagementService) {
  return (flagName: string) => {
    return async (req: Request, res: Response, next: Function) => {
      const userId = req.user?.id;
      const organizationId = req.user?.organizationId;

      const enabled = await configService.evaluateFlag(flagName, {
        userId,
        organizationId,
        attributes: {
          role: req.user?.role,
          tier: req.user?.tier
        }
      });

      if (!enabled) {
        return res.status(403).json({
          error: 'Feature not available',
          message: `The feature '${flagName}' is not enabled for your account`
        });
      }

      next();
    };
  };
}

// Usage:
// app.get('/api/advanced-analytics',
//   createFeatureFlagMiddleware(configService)('advanced-analytics'),
//   advancedAnalyticsController
// );
