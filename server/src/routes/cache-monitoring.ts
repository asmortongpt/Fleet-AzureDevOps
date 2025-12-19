import { Router, Request, Response } from 'express';

import { cache } from '../services/cache';
import { logger } from '../services/logger';

const router = Router();

/**
 * GET /api/cache/stats
 *
 * Get cache performance statistics
 */
router.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = cache.getStats();
    const healthy = await cache.healthCheck();

    res.json({
      success: true,
      data: {
        ...stats,
        healthy,
        recommendations: generateRecommendations(stats),
      },
    });
  } catch (error) {
    logger.error('Failed to get cache stats', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cache statistics',
    });
  }
});

/**
 * GET /api/cache/health
 *
 * Cache health check
 */
router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  const healthy = await cache.healthCheck();

  if (healthy) {
    res.json({
      status: 'healthy',
      cache: 'connected',
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      cache: 'disconnected',
    });
  }
});

/**
 * POST /api/cache/invalidate
 *
 * Invalidate cache keys by pattern (admin only)
 */
router.post('/invalidate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { pattern } = req.body;

    if (!pattern) {
      res.status(400).json({
        success: false,
        error: 'Pattern is required',
      });
      return;
    }

    // Validate pattern to prevent dangerous wildcards
    if (pattern === '*') {
      res.status(400).json({
        success: false,
        error: 'Wildcard "*" not allowed. Use specific patterns like "vehicle:*"',
      });
      return;
    }

    await cache.invalidate(pattern);

    logger.info('Cache invalidated via API', {
      pattern,
      user: (req as any).user?.id,
    });

    res.json({
      success: true,
      message: `Cache invalidated for pattern: ${pattern}`,
    });
  } catch (error) {
    logger.error('Failed to invalidate cache', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      error: 'Failed to invalidate cache',
    });
  }
});

/**
 * POST /api/cache/reset-stats
 *
 * Reset cache statistics (admin only)
 */
router.post('/reset-stats', async (_req: Request, res: Response): Promise<void> => {
  cache.resetStats();
  logger.info('Cache stats reset');

  res.json({
    success: true,
    message: 'Cache statistics reset',
  });
});

/**
 * POST /api/cache/flush
 *
 * Flush all cache (DANGER - admin only)
 */
router.post('/flush', async (_req: Request, res: Response): Promise<void> => {
  try {
    await cache.flush();

    logger.warn('Cache flushed via API', {
      user: (req as any).user?.id,
    });

    res.json({
      success: true,
      message: 'Cache flushed - all keys deleted',
    });
  } catch (error) {
    logger.error('Failed to flush cache', { error: error instanceof Error ? error.message : error });
    res.status(500).json({
      success: false,
      error: 'Failed to flush cache',
    });
  }
});

/**
 * Generate performance recommendations based on cache stats
 */
function generateRecommendations(stats: {
  hits: number;
  misses: number;
  hitRate: number;
  isConnected: boolean;
}): string[] {
  const recommendations: string[] = [];

  if (!stats.isConnected) {
    recommendations.push('⚠️ Redis is disconnected. Check REDIS_URL configuration.');
  }

  if (stats.hitRate < 50) {
    recommendations.push(
      '⚠️ Cache hit rate is below 50%. Consider increasing TTL values or warming cache on startup.'
    );
  } else if (stats.hitRate >= 80) {
    recommendations.push('✅ Excellent cache hit rate (>80%). Cache is performing optimally.');
  }

  if (stats.hits + stats.misses > 10000 && stats.hitRate < 70) {
    recommendations.push(
      '⚠️ High traffic with low hit rate. Review cache invalidation strategy.'
    );
  }

  if (stats.isConnected && stats.hitRate >= 80) {
    recommendations.push('✅ Cache system is healthy and performing well.');
  }

  return recommendations;
}

export default router;
