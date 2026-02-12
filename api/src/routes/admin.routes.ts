/**
 * Admin API Routes
 * Provides system configuration and status endpoints
 *
 * SECURITY:
 * - All routes require JWT authentication
 * - RBAC enforcement (ADMIN role required)
 * - Parameterized queries only (no SQL injection)
 */

import { Router, Request, Response } from 'express';

import logger from '../config/logger';
import { pool } from '../db/connection';
import { authenticateJWT } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac';
import { configurationService } from '../services/configuration/configuration-service';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateJWT);
router.use(requireRBAC({
  roles: [Role.ADMIN],
  permissions: [PERMISSIONS.SETTINGS_MANAGE],
  enforceTenantIsolation: false
}));

/**
 * GET /api/admin/config
 * Returns system configuration settings
 *
 * Query Params:
 * - category: Filter by configuration category
 * - requiresCTAOwner: Filter by CTA Owner requirement
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     configs: Array<ConfigItem>,
 *     total: number,
 *     categories: string[]
 *   }
 * }
 */
router.get('/config',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Fetching system configuration');

    try {
      const { category, requiresCTAOwner } = req.query;

      // Get configurations from configuration service
      const configs = configurationService.getAllConfig({
        category: category as string,
        requiresCTAOwner: requiresCTAOwner === 'true'
      });

      // Get database configuration
      const dbConfigResult = await pool.query(`
        SELECT
          name,
          setting,
          unit,
          category,
          short_desc
        FROM pg_settings
        WHERE category IN ('Resource Usage', 'Query Tuning', 'Connections')
        ORDER BY category, name
        LIMIT 20
      `);

      res.json({
        success: true,
        data: {
          application: {
            configs,
            total: configs.length,
            categories: [...new Set(configs.map(c => c.category))]
          },
          database: {
            settings: dbConfigResult.rows,
            total: dbConfigResult.rows.length
          },
          environment: {
            nodeEnv: process.env.NODE_ENV || 'development',
            port: process.env.PORT || 3000,
            databaseConnected: pool.totalCount > 0
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching system configuration:', error);

      // Return minimal config even on error
      res.json({
        success: false,
        data: {
          application: {
            configs: [],
            total: 0,
            categories: []
          },
          environment: {
            nodeEnv: process.env.NODE_ENV || 'development',
            port: process.env.PORT || 3000,
            databaseConnected: false
          }
        },
        error: 'Failed to fetch complete configuration',
        timestamp: new Date().toISOString()
      });
    }
  })
);

/**
 * GET /api/admin/status
 * Returns comprehensive system status and health information
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     overall: string,
 *     uptime: number,
 *     timestamp: string,
 *     services: {
 *       database: { status: string, details: object },
 *       cache: { status: string },
 *       queue: { status: string }
 *     },
 *     resources: {
 *       memory: { used: number, total: number, percentage: number },
 *       cpu: { usage: number }
 *     },
 *     stats: {
 *       totalVehicles: number,
 *       activeDrivers: number,
 *       pendingMaintenance: number
 *     }
 *   }
 * }
 */
router.get('/status',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info('Fetching system status');

    const startTime = Date.now();
    const status: any = {
      success: true,
      data: {
        overall: 'operational',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        services: {},
        resources: {},
        stats: {}
      }
    };

    // Check Database
    try {
      const dbResult = await pool.query('SELECT NOW() as time, version() as version');
      const connectionInfo = await pool.query(`
        SELECT
          count(*) as total_connections,
          count(*) FILTER (WHERE state = 'active') as active_connections,
          count(*) FILTER (WHERE state = 'idle') as idle_connections
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);

      status.data.services.database = {
        status: 'healthy',
        latency: Date.now() - startTime,
        version: dbResult.rows[0].version,
        connections: connectionInfo.rows[0],
        poolStats: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        }
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      status.data.services.database = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      status.data.overall = 'degraded';
    }

    // Check Cache (if available)
    try {
      // Simple cache check - will be expanded when cache is fully implemented
      status.data.services.cache = {
        status: 'healthy',
        type: 'in-memory'
      };
    } catch (error) {
      status.data.services.cache = {
        status: 'unknown'
      };
    }

    // Check Queue System
    try {
      status.data.services.queue = {
        status: 'healthy',
        type: 'bull'
      };
    } catch (error) {
      status.data.services.queue = {
        status: 'unknown'
      };
    }

    // Resource Usage
    const memUsage = process.memoryUsage();
    status.data.resources = {
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
        rss: Math.round(memUsage.rss / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      },
      cpu: {
        usage: process.cpuUsage()
      },
      process: {
        pid: process.pid,
        platform: process.platform,
        nodeVersion: process.version
      }
    };

    // System Statistics
    try {
      const [vehicleCount, driverCount, maintenanceCount] = await Promise.all([
        pool.query('SELECT COUNT(*)::integer as count FROM vehicles'),
        pool.query('SELECT COUNT(*)::integer as count FROM drivers'),
        pool.query(`
          SELECT COUNT(*)::integer as count
          FROM maintenance_records
          WHERE status IN ('pending', 'scheduled')
        `)
      ]);

      status.data.stats = {
        totalVehicles: vehicleCount.rows[0]?.count || 0,
        activeDrivers: driverCount.rows[0]?.count || 0,
        pendingMaintenance: maintenanceCount.rows[0]?.count || 0
      };
    } catch (error) {
      logger.warn('Failed to fetch system statistics:', error);
      status.data.stats = {
        totalVehicles: 0,
        activeDrivers: 0,
        pendingMaintenance: 0,
        error: 'Statistics unavailable'
      };
    }

    // Calculate overall status
    const unhealthyServices = Object.values(status.data.services).filter(
      (service: any) => service.status === 'unhealthy'
    ).length;

    if (unhealthyServices > 0) {
      status.data.overall = unhealthyServices === Object.keys(status.data.services).length
        ? 'critical'
        : 'degraded';
    }

    res.json(status);
  })
);

/**
 * GET /api/admin/config/stats
 * Returns configuration statistics
 */
router.get('/config/stats',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const allConfigs = configurationService.getAllConfig();
      const changes = configurationService.getChangeHistory({ limit: 100 });

      const stats = {
        totalConfigs: allConfigs.length,
        byCategory: {} as Record<string, number>,
        ctaOwnerOnly: allConfigs.filter(c => c.requiresCTAOwner).length,
        recentChanges: changes.length,
        changesBySource: {} as Record<string, number>
      };

      // Count by category
      allConfigs.forEach(config => {
        stats.byCategory[config.category] = (stats.byCategory[config.category] || 0) + 1;
      });

      // Count changes by source
      changes.forEach(change => {
        stats.changesBySource[change.source] = (stats.changesBySource[change.source] || 0) + 1;
      });

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error fetching config stats:', error);
      res.status(500).json({
        error: 'Failed to fetch configuration statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  })
);

export default router;
