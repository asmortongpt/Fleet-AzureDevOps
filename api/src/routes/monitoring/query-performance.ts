/**
 * Query Performance Monitoring API
 *
 * Provides endpoints to monitor database query performance, slow queries,
 * and performance metrics
 */

import { Router, Request, Response } from 'express';
import { queryMonitor } from '../../utils/query-monitor';
import { getDatabaseStats } from '../../utils/database';
import { getPoolStats, getDatabaseHealth } from '../../config/database';

const router = Router();

/**
 * GET /api/monitoring/query-performance/stats
 * Get overall query performance statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const summary = queryMonitor.getPerformanceSummary();
    const dbStats = await getDatabaseStats();
    const poolStats = getPoolStats();

    res.json({
      success: true,
      data: {
        query: summary,
        database: dbStats,
        pools: poolStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching query performance stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch query performance statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/monitoring/query-performance/slow-queries
 * Get recent slow queries
 */
router.get('/slow-queries', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const slowQueries = queryMonitor.getRecentSlowQueries(limit);

    res.json({
      success: true,
      data: {
        queries: slowQueries,
        count: slowQueries.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching slow queries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch slow queries',
      message: error.message
    });
  }
});

/**
 * GET /api/monitoring/query-performance/top-slow
 * Get top slowest queries by average duration
 */
router.get('/top-slow', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const topSlowQueries = queryMonitor.getTopSlowQueries(limit);

    res.json({
      success: true,
      data: {
        queries: topSlowQueries,
        count: topSlowQueries.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching top slow queries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top slow queries',
      message: error.message
    });
  }
});

/**
 * GET /api/monitoring/query-performance/frequency
 * Get most frequently executed queries
 */
router.get('/frequency', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const frequency = queryMonitor.getQueryFrequency(limit);

    res.json({
      success: true,
      data: {
        queries: frequency,
        count: frequency.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching query frequency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch query frequency',
      message: error.message
    });
  }
});

/**
 * GET /api/monitoring/query-performance/errors
 * Get queries with errors
 */
router.get('/errors', async (req: Request, res: Response) => {
  try {
    const errorRate = queryMonitor.getErrorRate();

    res.json({
      success: true,
      data: {
        queries: errorRate,
        count: errorRate.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching query errors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch query errors',
      message: error.message
    });
  }
});

/**
 * GET /api/monitoring/query-performance/health
 * Get database health status
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await getDatabaseHealth();

    res.json({
      success: true,
      data: {
        health,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching database health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch database health',
      message: error.message
    });
  }
});

/**
 * GET /api/monitoring/query-performance/detailed-stats
 * Get detailed statistics for all queries
 */
router.get('/detailed-stats', async (req: Request, res: Response) => {
  try {
    const stats = queryMonitor.getStats();
    const statsArray = Array.from(stats.entries()).map(([query, stats]) => ({
      query,
      ...stats
    }));

    // Sort by total queries descending
    statsArray.sort((a, b) => b.totalQueries - a.totalQueries);

    res.json({
      success: true,
      data: {
        queries: statsArray,
        count: statsArray.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching detailed stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch detailed statistics',
      message: error.message
    });
  }
});

/**
 * POST /api/monitoring/query-performance/reset
 * Reset query performance statistics
 */
router.post('/reset', async (req: Request, res: Response) => {
  try {
    queryMonitor.resetStats();

    res.json({
      success: true,
      message: 'Query performance statistics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error resetting query stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset query statistics',
      message: error.message
    });
  }
});

/**
 * GET /api/monitoring/query-performance/summary
 * Get comprehensive performance summary
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const summary = queryMonitor.getPerformanceSummary();
    const topSlow = queryMonitor.getTopSlowQueries(5);
    const topFrequent = queryMonitor.getQueryFrequency(5);
    const errorRate = queryMonitor.getErrorRate();
    const dbStats = await getDatabaseStats();
    const poolStats = getPoolStats();

    res.json({
      success: true,
      data: {
        overview: summary,
        topSlowQueries: topSlow,
        topFrequentQueries: topFrequent,
        queriesWithErrors: errorRate,
        database: dbStats,
        pools: poolStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching performance summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance summary',
      message: error.message
    });
  }
});

export default router;
