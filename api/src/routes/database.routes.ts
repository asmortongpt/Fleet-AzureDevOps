/**
 * Database Health Check Routes
 * Provides database connectivity and health monitoring endpoints
 *
 * SECURITY:
 * - Public endpoint (no authentication required for health checks)
 * - Read-only operations
 * - No sensitive data exposed
 */

import { Router, Request, Response } from 'express';

import logger from '../config/logger';
import { pool } from '../db/connection';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

/**
 * GET /api/database/health
 * Returns database health status and connection information
 *
 * Response:
 * {
 *   status: 'healthy' | 'degraded' | 'unhealthy',
 *   timestamp: string,
 *   database: {
 *     connected: boolean,
 *     latency: string,
 *     poolStats: {
 *       totalCount: number,
 *       idleCount: number,
 *       waitingCount: number
 *     }
 *   }
 * }
 */
router.get('/health',
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
      logger.info('Database health check requested');

      // Test database connectivity with a simple query
      await pool.query('SELECT 1');
      const latency = Date.now() - startTime;

      // Get connection pool statistics
      const poolStats = {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      };

      // Get additional database statistics
      const dbStats = await pool.query(`
        SELECT
          (SELECT COUNT(*) FROM vehicles) as vehicle_count,
          (SELECT COUNT(*) FROM drivers) as driver_count,
          (SELECT COUNT(*) FROM maintenance_records) as maintenance_count,
          (SELECT pg_database_size(current_database())) as database_size
      `);

      const stats = dbStats.rows[0];

      // Determine health status based on latency and pool state
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (latency > 1000 || poolStats.waitingCount > 5) {
        status = 'degraded';
      }
      if (latency > 5000 || poolStats.waitingCount > 10) {
        status = 'unhealthy';
      }

      const response = {
        status,
        timestamp: new Date().toISOString(),
        database: {
          connected: true,
          latency: `${latency}ms`,
          poolStats,
          statistics: {
            vehicles: parseInt(stats.vehicle_count) || 0,
            drivers: parseInt(stats.driver_count) || 0,
            maintenanceRecords: parseInt(stats.maintenance_count) || 0,
            databaseSize: `${Math.round(parseInt(stats.database_size) / 1024 / 1024)}MB`
          }
        }
      };

      const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
      return res.status(statusCode).json(response);

    } catch (error: unknown) {
      logger.error('Database health check failed:', error);

      return res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: {
          connected: false,
          error: error instanceof Error ? error.message : 'Database connection failed'
        }
      });
    }
  })
);

/**
 * GET /api/database/ping
 * Simple database ping endpoint
 *
 * Response:
 * {
 *   status: 'ok' | 'error',
 *   timestamp: string,
 *   latency: string
 * }
 */
router.get('/ping',
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
      await pool.query('SELECT 1');
      const latency = Date.now() - startTime;

      return res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        latency: `${latency}ms`
      });
    } catch (error: unknown) {
      logger.error('Database ping failed:', error);

      return res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
    }
  })
);

export default router;
