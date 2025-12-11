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
import { TenantRepository } from '../repositories/tenant.repository';

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
const tenantRepository = new TenantRepository();

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
    const teamsStatus = await healthRepository.checkTeamsService();
    results.services.teams = {
      status: teamsStatus.isHealthy ? 'up' : 'degraded',
      message: teamsStatus.isHealthy ? 'Teams service is operational' : 'Teams service is experiencing issues',
      details: teamsStatus.details
    };
  } catch (error: unknown) {
    results.services.teams = {
      status: 'down',
      message: getErrorMessage(error)
    };
  }

  // 3. Check Outlook Service
  try {
    const outlookStatus = await healthRepository.checkOutlookService();
    results.services.outlook = {
      status: outlookStatus.isHealthy ? 'up' : 'degraded',
      message: outlookStatus.isHealthy ? 'Outlook service is operational' : 'Outlook service is experiencing issues',
      details: outlookStatus.details
    };
  } catch (error: unknown) {
    results.services.outlook = {
      status: 'down',
      message: getErrorMessage(error)
    };
  }

  // 4. Check Calendar Service
  try {
    const calendarStatus = await healthRepository.checkCalendarService();
    results.services.calendar = {
      status: calendarStatus.isHealthy ? 'up' : 'degraded',
      message: calendarStatus.isHealthy ? 'Calendar service is operational' : 'Calendar service is experiencing issues',
      details: calendarStatus.details
    };
  } catch (error: unknown) {
    results.services.calendar = {
      status: 'down',
      message: getErrorMessage(error)
    };
  }

  // 5. Check Webhook Subscriptions
  try {
    const webhookStatus = await healthRepository.checkWebhookSubscriptions();
    results.services.webhooks = {
      status: webhookStatus.isHealthy ? 'up' : 'degraded',
      message: webhookStatus.message,
      details: webhookStatus.details
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
    const syncStatus = await healthRepository.checkSyncService();
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
    const dbStatus = await healthRepository.checkDatabaseConnectivity();
    results.services.database = {
      status: dbStatus.isHealthy ? 'up' : 'degraded',
      message: dbStatus.isHealthy ? 'Database is accessible' : 'Database connectivity issues',
      details: dbStatus.details
    };
  } catch (error: unknown) {
    results.services.database = {
      status: 'down',
      message: getErrorMessage(error)
    };
  }

  // Calculate overall status and summary
  const serviceStatuses = Object.values(results.services).map(service => service.status);
  const totalServices = serviceStatuses.length;
  const healthyServices = serviceStatuses.filter(status => status === 'up').length;
  const degradedServices = serviceStatuses.filter(status => status === 'degraded').length;
  const unhealthyServices = serviceStatuses.filter(status => status === 'down').length;

  results.summary = {
    total: totalServices,
    healthy: healthyServices,
    degraded: degradedServices,
    unhealthy: unhealthyServices
  };

  if (unhealthyServices > 0) {
    results.status = 'unhealthy';
  } else if (degradedServices > 0) {
    results.status = 'degraded';
  }

  // Add tenant_id filtering
  const tenantId = req.headers['x-tenant-id'] as string;
  if (tenantId) {
    const tenant = await tenantRepository.getTenantById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
  } else {
    return res.status(400).json({ error: 'Tenant ID is required' });
  }

  res.json(results);
});

export default router;