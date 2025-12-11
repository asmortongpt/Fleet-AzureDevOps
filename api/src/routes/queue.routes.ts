Here's the refactored version of the file, replacing `pool.query` with a repository pattern. I've assumed the existence of a `JobRepository` class that encapsulates the database operations. I've also completed the file as requested.


/**
 * Queue Management Routes
 * API endpoints for queue monitoring, management, and administration
 */

import express, { Request, Response, Router } from 'express';
import { queueService } from '../services/queue.service';
import { QueueName, JobStatus } from '../types/queue.types';
import { getErrorMessage } from '../utils/error-handler';
import { csrfProtection } from '../middleware/csrf';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger'; // Wave 23: Add Winston logger
import { JobRepository } from '../repositories/job.repository'; // Assuming this exists

const router: Router = express.Router();

/**
 * Middleware to check admin authentication
 * Verifies admin API key or JWT with admin role
 */
const requireAdmin = (req: Request, res: Response, next: any) => {
  const adminKey = req.headers['x-admin-key'] as string;
  const expectedKey = process.env.ADMIN_KEY || process.env.ADMIN_API_KEY;

  // Check for API key
  if (adminKey && adminKey === expectedKey) {
    return next();
  }

  // Check for JWT with admin role
  const user = (req as any).user;
  if (user && (user.role === 'admin' || user.role === 'system_admin')) {
    return next();
  }

  // Production mode requires authentication
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Admin access required. Provide x-admin-key header or authenticate with admin role.'
    });
  }

  // Development mode allows through (with warning)
  console.warn('⚠️  Admin endpoint accessed without authentication in development mode');
  next();
};

/**
 * GET /api/queue/stats
 * Get statistics for all queues
 */
router.get(`/stats`, requireAdmin, async (req: Request, res: Response) => {
  try {
    const queues = Object.values(QueueName).filter(q => q !== QueueName.DEAD_LETTER);
    const stats = await Promise.all(
      queues.map(async (queueName) => {
        try {
          return await queueService.getQueueStats(queueName);
        } catch (error) {
          logger.error(`Failed to get stats for ${queueName}:`, error); // Wave 23: Winston logger
          return null;
        }
      })
    );

    const validStats = stats.filter(s => s !== null);

    res.json({
      success: true,
      data: {
        queues: validStats,
        summary: {
          totalPending: validStats.reduce((sum, s) => sum + s!.pending, 0),
          totalActive: validStats.reduce((sum, s) => sum + s!.active, 0),
          totalCompleted: validStats.reduce((sum, s) => sum + s!.completed, 0),
          totalFailed: validStats.reduce((sum, s) => sum + s!.failed, 0),
          avgProcessingTime: validStats.reduce((sum, s) => sum + s!.avgProcessingTimeMs, 0) / validStats.length || 0
        },
        timestamp: new Date()
      }
    });
  } catch (error: any) {
    logger.error(`Error getting queue stats:`, error); // Wave 23: Winston logger
    res.status(500).json({ error: 'Failed to get queue statistics', message: getErrorMessage(error) });
  }
});

/**
 * GET /api/queue/health
 * Get overall queue system health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await queueService.getQueueHealth();

    res.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    logger.error('Error getting queue health:', error); // Wave 23: Winston logger
    res.status(500).json({ error: 'Failed to get queue health', message: getErrorMessage(error) });
  }
});

/**
 * GET /api/queue/:queueName/jobs
 * List jobs in a specific queue
 */
router.get(`/:queueName/jobs`, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    const jobRepository = container.resolve(JobRepository);

    const jobs = await jobRepository.getJobsByQueue(queueName, status as JobStatus | undefined, parseInt(limit as string), parseInt(offset as string));
    const total = await jobRepository.getJobCountByQueue(queueName, status as JobStatus | undefined);

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      }
    });
  } catch (error: any) {
    logger.error('Error getting jobs:', error); // Wave 23: Winston logger
    res.status(500).json({ error: 'Failed to get jobs', message: getErrorMessage(error) });
  }
});

export default router;


In this refactored version:

1. I've replaced the `pool.query` calls with a `JobRepository` class, which is assumed to be injected via the `container`.
2. The `JobRepository` class is expected to have methods like `getJobsByQueue` and `getJobCountByQueue`.
3. I've completed the file by adding the missing closing brace for the last route handler and adding the `export default router;` statement at the end.
4. I've kept the existing structure and comments intact, only modifying the database interaction part.

Note that you'll need to implement the `JobRepository` class with the appropriate methods to match this refactored code. The `JobRepository` should encapsulate the database queries and return the results in the format expected by the route handlers.