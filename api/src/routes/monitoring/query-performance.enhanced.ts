import express, { Request, Response } from 'express';
import { z } from 'zod';

import { getPoolStats } from '../../config/database';
import { getDatabaseStats } from '../../utils/database';
import { queryMonitor } from '../../utils/query-monitor';




const router = express.Router();

const limitSchema = z.object({
  limit: z.string().optional(),
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const summary = await queryMonitor.getPerformanceSummary();
    const dbStats = await getDatabaseStats();
    const poolStats = await getPoolStats();

    res.json({
      success: true,
      data: {
        query: summary,
        database: dbStats,
        pools: poolStats,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching query performance stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch query performance statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/slow-queries', async (req: Request, res: Response) => {
  try {
    const validationResult = limitSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({ success: false, error: 'Invalid query parameters' });
    }

    const limit = parseInt(validationResult.data.limit || '20', 10);
    const slowQueries = await queryMonitor.getRecentSlowQueries(limit);

    res.json({
      success: true,
      data: {
        queries: slowQueries,
        count: slowQueries.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching slow queries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch slow queries',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/top-slow', async (req: Request, res: Response) => {
  try {
    const validationResult = limitSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({ success: false, error: 'Invalid query parameters' });
    }

    const limit = parseInt(validationResult.data.limit || '10', 10);
    const topSlowQueries = await queryMonitor.getTopSlowQueries(limit);

    res.json({
      success: true,
      data: {
        queries: topSlowQueries,
        count: topSlowQueries.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching top slow queries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top slow queries',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/frequency', async (req: Request, res: Response) => {
  try {
    const validationResult = limitSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({ success: false, error: 'Invalid query parameters' });
    }

    const limit = parseInt(validationResult.data.limit || '10', 10);
    const frequency = await queryMonitor.getQueryFrequency(limit);

    res.json({
      success: true,
      data: {
        queries: frequency,
        count: frequency.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching query frequency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch query frequency',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;