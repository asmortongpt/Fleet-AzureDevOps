/**
 * System Health Routes - Comprehensive system health monitoring
 * Provides detailed health checks for all system components
 */

import { Router } from 'express';

import { connectionHealthService } from '../services/ConnectionHealthService';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/system-health
 * Get comprehensive system health status
 */
router.get('/', async (req, res) => {
  try {
    const health = await connectionHealthService.performHealthCheck();

    res.json({
      success: true,
      data: health,
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('[SystemHealth] Error getting health:', error);
    res.status(503).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    });
  }
});

/**
 * GET /api/system-health/connections
 * Get connection status for all external services
 */
router.get('/connections', async (req, res) => {
  try {
    const health = connectionHealthService.getHealth();

    if (!health) {
      return res.status(503).json({
        success: false,
        error: 'Health service not initialized',
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      data: {
        connections: health.connections,
        overall: health.overall,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('[SystemHealth] Error getting connections:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/system-health/memory
 * Get memory usage statistics
 */
router.get('/memory', async (req, res) => {
  try {
    const memUsage = process.memoryUsage();

    res.json({
      success: true,
      data: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('[SystemHealth] Error getting memory:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/system-health/uptime
 * Get system uptime
 */
router.get('/uptime', async (req, res) => {
  try {
    const uptime = process.uptime();

    res.json({
      success: true,
      data: {
        uptime: uptime,
        uptimeFormatted: formatUptime(uptime),
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('[SystemHealth] Error getting uptime:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/system-health/metrics
 * Get comprehensive system metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    const health = connectionHealthService.getHealth();
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    res.json({
      success: true,
      data: {
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
        },
        cpu: {
          user: Math.round(cpuUsage.user / 1000), // microseconds to milliseconds
          system: Math.round(cpuUsage.system / 1000),
        },
        uptime: process.uptime(),
        emulators: health?.emulators || {},
        connections: health?.connections.length || 0,
        overall: health?.overall || 'unknown',
      },
      timestamp: new Date(),
    });
  } catch (error) {
    logger.error('[SystemHealth] Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Helper function to format uptime
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

export default router;
