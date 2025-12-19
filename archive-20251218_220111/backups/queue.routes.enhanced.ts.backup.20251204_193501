import express, { Request, Response, Router } from 'express';
import { queueService } from '../services/queue.service';
import { authenticateAdmin } from '../middleware/auth.middleware';
import { z } from 'zod';
import { QueueName, JobStatus } from '../types/queue.types';
import asyncHandler from '../utils/asyncHandler';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import csurf from 'csurf';

const router: Router = express.Router();

// Apply security middlewares globally
router.use(helmet());
router.use(csurf());
router.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
}));

// QueueName validation schema
const queueNameSchema = z.nativeEnum(QueueName);

/**
 * GET /api/queue/stats
 * Get statistics for all queues
 */
router.get('/stats', authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const queues = Object.values(QueueName).filter(q => q !== QueueName.DEAD_LETTER);
  const stats = await Promise.all(
    queues.map(queueName => queueService.getQueueStats(queueName))
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
}));

/**
 * GET /api/queue/health
 * Get overall queue system health
 */
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  const health = await queueService.getQueueHealth();

  res.json({
    success: true,
    data: health
  });
}));

/**
 * GET /api/queue/:queueName/jobs
 * List jobs in a specific queue
 */
router.get('/:queueName/jobs', authenticateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const { queueName } = req.params;
  const parsedQueueName = queueNameSchema.parse(queueName);
  const jobs = await queueService.listJobs(parsedQueueName);

  res.json({
    success: true,
    data: jobs
  });
}));

export default router;