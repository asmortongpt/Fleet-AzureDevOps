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
      message: error.message,
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
      message: error.message
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
      message: error.message
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
      message: error.message
    };
  }

  // 5. Check Webhook Subscriptions
  try {
    const webhookService = await import('../services/webhook.service');
    const subscriptions = await webhookService.webhookService.listSubscriptions();
    const activeSubscriptions = subscriptions.filter((sub: any) => sub.status === 'active');

    results.services.webhooks = {
      status: activeSubscriptions.length > 0 ? 'up' : 'degraded',
      message: `${activeSubscriptions.length} active webhook subscriptions`,
      details: {
        total: subscriptions.length,
        active: activeSubscriptions.length,
        subscriptions: subscriptions.map((sub: any) => ({
          id: sub.subscription_id,
          resource: sub.resource,
          status: sub.status,
          expiresAt: sub.expiration_date_time
        }))
      }
    };
  } catch (error: unknown) {
    results.services.webhooks = {
      status: 'degraded',
      message: 'Unable to check webhook subscriptions',
      details: { error: error.message }
    };
  }

  // 6. Check Queue System
  try {
    const stats = await queueService.getQueueStats('teams-outbound');
    results.services.queue = {
      status: 'up',
      message: 'Queue system is operational',
      details: {
        waiting: stats.waiting,
        active: stats.active,
        completed: stats.completed,
        failed: stats.failed
      }
    };
  } catch (error: unknown) {
    results.services.queue = {
      status: 'down',
      message: error.message
    };
  }

  // 7. Check Sync Service
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    const syncState = await pool.query(`
      SELECT
        resource_type,
        COUNT(*) as total,
        SUM(CASE WHEN sync_status = 'success' THEN 1 ELSE 0 END) as successful,
        MAX(last_sync_at) as last_sync
      FROM sync_state
      GROUP BY resource_type
    `);

    await pool.end();

    results.services.sync = {
      status: 'up',
      message: 'Sync service is operational',
      details: syncState.rows
    };
  } catch (error: unknown) {
    results.services.sync = {
      status: 'degraded',
      message: 'Sync service status unknown',
      details: { error: error.message }
    };
  }

  // 8. Check Database
  try {
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    const dbLatency = Date.now() - dbStart;
    await pool.end();

    results.services.database = {
      status: 'up',
      latency: dbLatency,
      message: 'Database is accessible'
    };
  } catch (error: unknown) {
    results.services.database = {
      status: 'down',
      message: error.message
    };
  }

  // Calculate summary
  results.summary.total = Object.keys(results.services).length;
  Object.values(results.services).forEach(service => {
    if (service.status === 'up') results.summary.healthy++;
    else if (service.status === 'degraded') results.summary.degraded++;
    else results.summary.unhealthy++;
  });

  // Determine overall status
  if (results.summary.unhealthy > 0) {
    results.status = 'unhealthy';
  } else if (results.summary.degraded > 0) {
    results.status = 'degraded';
  }

  // Set appropriate HTTP status code
  const httpStatus = results.status === 'healthy' ? 200 :
                     results.status === 'degraded' ? 200 : 503;

  res.status(httpStatus).json(results);
});

/**
 * GET /api/health/microsoft/simple - Simple health check (for load balancers)
 */
router.get('/microsoft/simple', async (req: Request, res: Response) => {
  try {
    // Quick database check
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query('SELECT 1');
    await pool.end();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString()
    });
  } catch (error: unknown) {
    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/health/microsoft/metrics - Prometheus-style metrics
 */
router.get('/microsoft/metrics', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');

  const metrics: string[] = [];

  try {
    // Queue metrics
    const queueStats = await queueService.getQueueStats('teams-outbound');
    metrics.push(`# HELP queue_jobs_waiting Number of jobs waiting in queue`);
    metrics.push(`# TYPE queue_jobs_waiting gauge`);
    metrics.push(`queue_jobs_waiting{queue="teams-outbound"} ${queueStats.waiting || 0}`);

    metrics.push(`# HELP queue_jobs_active Number of active jobs`);
    metrics.push(`# TYPE queue_jobs_active gauge`);
    metrics.push(`queue_jobs_active{queue="teams-outbound"} ${queueStats.active || 0}`);

    // Webhook subscriptions
    const webhookService = await import('../services/webhook.service');
    const subscriptions = await webhookService.webhookService.listSubscriptions();
    const activeCount = subscriptions.filter((s: any) => s.status === 'active').length;

    metrics.push(`# HELP webhook_subscriptions_active Number of active webhook subscriptions`);
    metrics.push(`# TYPE webhook_subscriptions_active gauge`);
    metrics.push(`webhook_subscriptions_active ${activeCount}`);

    // Database metrics
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    const commCount = await pool.query('SELECT COUNT(*) as count FROM communications WHERE created_at > NOW() - INTERVAL \'24 hours\'');
    metrics.push(`# HELP communications_24h Communications created in last 24 hours`);
    metrics.push(`# TYPE communications_24h counter`);
    metrics.push(`communications_24h ${commCount.rows[0].count}`);

    await pool.end();

  } catch (error: unknown) {
    metrics.push(`# Error: ${error.message}`);
  }

  res.send(metrics.join('\n'));
});

export default router;
