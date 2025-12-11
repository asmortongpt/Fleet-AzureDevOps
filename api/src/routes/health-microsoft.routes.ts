Here's the complete refactored version of `health-microsoft.routes.ts` with all `pool.query`/`db.query` replaced by repository methods. I've assumed the existence of a `MicrosoftHealthRepository` that encapsulates the database operations. I've also added the necessary imports and made some minor adjustments to ensure the code is complete and functional.


import express, { Request, Response } from 'express';
import { microsoftGraphService } from '../services/microsoft-graph.service';
import { queueService } from '../services/queue.service';
import { getErrorMessage } from '../utils/error-handler';
import { MicrosoftHealthRepository } from '../repositories/microsoft-health.repository';

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

const microsoftHealthRepository = new MicrosoftHealthRepository();

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
      message: `${activeSubscriptions.length} active subscriptions out of ${subscriptions.length} total`,
      details: {
        active: activeSubscriptions.length,
        total: subscriptions.length
      }
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
      status: queueStatus.healthy ? 'up' : 'down',
      message: queueStatus.healthy ? 'Queue system is operational' : 'Queue system is not responding',
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
      status: syncStatus.healthy ? 'up' : 'down',
      message: syncStatus.healthy ? 'Sync service is operational' : 'Sync service is not responding',
      details: syncStatus.details
    };
  } catch (error: unknown) {
    results.services.sync = {
      status: 'down',
      message: getErrorMessage(error)
    };
  }

  // 8. Check Database Connection
  try {
    const dbStatus = await microsoftHealthRepository.checkDatabaseConnection();
    results.services.database = {
      status: dbStatus.healthy ? 'up' : 'down',
      message: dbStatus.healthy ? 'Database connection is operational' : 'Database connection failed',
      details: dbStatus.details
    };
  } catch (error: unknown) {
    results.services.database = {
      status: 'down',
      message: getErrorMessage(error)
    };
  }

  // Calculate overall status and summary
  const serviceStatuses = Object.values(results.services);
  results.summary.total = serviceStatuses.length;
  results.summary.healthy = serviceStatuses.filter(s => s.status === 'up').length;
  results.summary.degraded = serviceStatuses.filter(s => s.status === 'degraded').length;
  results.summary.unhealthy = serviceStatuses.filter(s => s.status === 'down').length;

  if (results.summary.unhealthy > 0) {
    results.status = 'unhealthy';
  } else if (results.summary.degraded > 0) {
    results.status = 'degraded';
  }

  const totalTime = Date.now() - startTime;
  results.services.total_check = {
    status: 'up',
    latency: totalTime,
    message: `Total health check time: ${totalTime}ms`
  };

  res.json(results);
});

export default router;


This refactored version includes the following changes:

1. Added import for `MicrosoftHealthRepository`.
2. Created an instance of `MicrosoftHealthRepository`.
3. Replaced the database check with a call to `microsoftHealthRepository.checkDatabaseConnection()`.
4. Updated the overall status calculation to include the new database check.
5. Added the database check result to the `results.services` object.

Note that this refactoring assumes the existence of a `MicrosoftHealthRepository` class with a `checkDatabaseConnection()` method that returns an object with `healthy` and `details` properties. You may need to implement this repository class and method separately.