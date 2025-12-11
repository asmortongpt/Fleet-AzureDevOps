Here's the refactored version of `health.routes.ts` with all `pool.query`/`db.query` replaced by repository methods. I've assumed the existence of a `HealthRepository` class with appropriate methods. I've also completed the file as requested.


/**
 * Microsoft Integration Health Check Dashboard
 *
 * Provides comprehensive health checks for all Microsoft integration components:
 * - Microsoft Graph API connectivity
 * - Teams service status
 * - Outlook service status
 * - Calendar service status
 * - Webhook subscriptions health
 * - Queue system health
 * - Sync service status
 * - Database connectivity
 */

import express, { Request, Response } from 'express';
import { microsoftGraphService } from '../services/microsoft-graph.service';
import { queueService } from '../services/queue.service';
import { getErrorMessage } from '../utils/error-handler';
import { HealthRepository } from '../repositories/health.repository';

const router = express.Router();

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    [key: string]: {
      status: 'up' | 'down' | 'degraded';
      latency?: number;
      message?: string;
      details?: Record<string, unknown>;
    };
  };
  summary: {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  };
}

const healthRepository = new HealthRepository();

/**
 * GET /api/health/microsoft - Comprehensive Microsoft integration health check
 */
router.get('/microsoft', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const results: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {},
    summary: { total: 0, healthy: 0, degraded: 0, unhealthy: 0 }
  };

  // 1. Check Microsoft Graph API
  try {
    const graphStart = Date.now();
    const isConfigured = await microsoftGraphService.checkConfiguration();
    const graphLatency = Date.now() - graphStart;

    results.services.microsoft_graph = {
      status: isConfigured ? 'up' : 'degraded',
      latency: graphLatency,
      message: isConfigured ? 'Microsoft Graph API is configured and accessible' : 'Microsoft Graph API is not fully configured',
      details: {
        hasClientId: !!process.env.MICROSOFT_CLIENT_ID,
        hasClientSecret: !!process.env.MICROSOFT_CLIENT_SECRET,
        hasTenantId: !!process.env.MICROSOFT_TENANT_ID
      }
    };
  } catch (error: unknown) {
    results.services.microsoft_graph = {
      status: 'down',
      message: getErrorMessage(error),
      details: { error: error.toString() }
    };
  }

  // 2. Check Teams Service
  try {
    // Import dynamically to avoid circular dependencies
    const teamsService = await import('../services/teams.service');
    results.services.teams = {
      status: 'up',
      message: 'Teams service is operational'
    };
  } catch (error: unknown) {
    results.services.teams = {
      status: 'down',
      message: getErrorMessage(error)
    };
  }

  // 3. Check Outlook Service
  try {
    const outlookService = await import('../services/outlook.service');
    results.services.outlook = {
      status: 'up',
      message: 'Outlook service is operational'
    };
  } catch (error: unknown) {
    results.services.outlook = {
      status: 'down',
      message: getErrorMessage(error)
    };
  }

  // 4. Check Calendar Service
  try {
    const calendarService = await import('../services/calendar.service');
    results.services.calendar = {
      status: 'up',
      message: 'Calendar service is operational'
    };
  } catch (error: unknown) {
    results.services.calendar = {
      status: 'down',
      message: getErrorMessage(error)
    };
  }

  // 5. Check Webhook Subscriptions
  try {
    const webhookService = await import('../services/webhook.service');
    const subscriptions = await webhookService.webhookService.listSubscriptions();
    const activeSubscriptions = subscriptions.filter((sub: any) => sub.status === 'active');

    results.services.webhooks = {
      status: activeSubscriptions.length > 0 ? 'up' : 'degraded',
      message: `${activeSubscriptions.length} active subscriptions out of ${subscriptions.length}`,
      details: { active: activeSubscriptions.length, total: subscriptions.length }
    };
  } catch (error: unknown) {
    results.services.webhooks = {
      status: 'down',
      message: getErrorMessage(error)
    };
  }

  // 6. Check Queue System
  try {
    const queueStatus = await queueService.checkHealth();
    results.services.queue = {
      status: queueStatus.isHealthy ? 'up' : 'degraded',
      message: queueStatus.isHealthy ? 'Queue system is operational' : 'Queue system is experiencing issues',
      details: queueStatus.details
    };
  } catch (error: unknown) {
    results.services.queue = {
      status: 'down',
      message: getErrorMessage(error)
    };
  }

  // 7. Check Sync Service
  try {
    const syncService = await import('../services/sync.service');
    const syncStatus = await syncService.syncService.checkHealth();
    results.services.sync = {
      status: syncStatus.isHealthy ? 'up' : 'degraded',
      message: syncStatus.isHealthy ? 'Sync service is operational' : 'Sync service is experiencing issues',
      details: syncStatus.details
    };
  } catch (error: unknown) {
    results.services.sync = {
      status: 'down',
      message: getErrorMessage(error)
    };
  }

  // 8. Check Database Connectivity
  try {
    const dbStatus = await healthRepository.checkDatabaseHealth();
    results.services.database = {
      status: dbStatus.isHealthy ? 'up' : 'degraded',
      message: dbStatus.isHealthy ? 'Database is accessible' : 'Database is experiencing issues',
      details: dbStatus.details
    };
  } catch (error: unknown) {
    results.services.database = {
      status: 'down',
      message: getErrorMessage(error)
    };
  }

  // Calculate summary
  const serviceStatuses = Object.values(results.services);
  results.summary.total = serviceStatuses.length;
  results.summary.healthy = serviceStatuses.filter(s => s.status === 'up').length;
  results.summary.degraded = serviceStatuses.filter(s => s.status === 'degraded').length;
  results.summary.unhealthy = serviceStatuses.filter(s => s.status === 'down').length;

  // Determine overall status
  if (results.summary.unhealthy > 0) {
    results.status = 'unhealthy';
  } else if (results.summary.degraded > 0) {
    results.status = 'degraded';
  }

  // Add total latency
  results.services.total_latency = {
    status: 'up',
    latency: Date.now() - startTime,
    message: 'Total time to perform health check'
  };

  res.json(results);
});

export default router;


In this refactored version:

1. I've added an import for `HealthRepository` at the top of the file.
2. I've created an instance of `HealthRepository` called `healthRepository`.
3. I've replaced the database check with a call to `healthRepository.checkDatabaseHealth()`.
4. I've assumed that `checkDatabaseHealth()` returns an object with `isHealthy` and `details` properties, similar to other service checks.
5. The rest of the file remains unchanged, as there were no other `pool.query`/`db.query` calls to replace.

Note that you'll need to implement the `HealthRepository` class with the `checkDatabaseHealth` method to complete the refactoring process.