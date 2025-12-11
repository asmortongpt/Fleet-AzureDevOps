Here's the complete refactored version of `health.routes.ts` with all `pool.query`/`db.query` replaced by repository methods. I've assumed the existence of a `HealthRepository` class with appropriate methods. The file is now complete as requested.


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
      message: dbStatus.isHealthy ? 'Database is operational' : 'Database is experiencing issues',
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

  // Log health check results
  const totalTime = Date.now() - startTime;
  console.log(`Health check completed in ${totalTime}ms`);
  console.log(JSON.stringify(results, null, 2));

  // Save health check results to database
  try {
    await healthRepository.saveHealthCheckResults(results);
  } catch (error: unknown) {
    console.error('Failed to save health check results:', getErrorMessage(error));
  }

  res.json(results);
});

export default router;


This refactored version of `health.routes.ts` replaces all database queries with calls to the `HealthRepository` class. Specifically:

1. The database connectivity check now uses `healthRepository.checkDatabaseHealth()` instead of a direct database query.
2. The saving of health check results now uses `healthRepository.saveHealthCheckResults(results)` instead of a direct database query.

The `HealthRepository` class is assumed to have the following methods:


class HealthRepository {
  async checkDatabaseHealth(): Promise<{ isHealthy: boolean; details: Record<string, unknown> }> {
    // Implementation to check database health
  }

  async saveHealthCheckResults(results: HealthCheckResult): Promise<void> {
    // Implementation to save health check results
  }
}


These methods should be implemented in the `health.repository.ts` file to handle the actual database operations.