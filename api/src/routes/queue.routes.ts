/**
 * Queue Management Routes
 * API endpoints for queue monitoring, management, and administration
 */

import express, { Request, Response, Router } from 'express';
import { queueService } from '../services/queue.service';
import { pool } from '../config/database';
import { QueueName, JobStatus } from '../types/queue.types';
import { getErrorMessage } from '../utils/error-handler'

const router: Router = express.Router();

/**
 * Middleware to check admin authentication
 * TODO: Replace with actual authentication middleware
 */
const requireAdmin = (req: Request, res: Response, next: any) => {
  // TODO: Implement actual admin check
  // For now, check for admin header or token
  const isAdmin = req.headers['x-admin-key'] === process.env.ADMIN_KEY ||
                  req.headers.authorization?.includes('admin');

  if (!isAdmin && process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

/**
 * GET /api/queue/stats
 * Get statistics for all queues
 */
router.get('/stats', requireAdmin, async (req: Request, res: Response) => {
  try {
    const queues = Object.values(QueueName).filter(q => q !== QueueName.DEAD_LETTER);
    const stats = await Promise.all(
      queues.map(async (queueName) => {
        try {
          return await queueService.getQueueStats(queueName);
        } catch (error) {
          console.error(`Failed to get stats for ${queueName}:`, error);
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
    console.error('Error getting queue stats:', error);
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
    console.error('Error getting queue health:', error);
    res.status(500).json({ error: 'Failed to get queue health', message: getErrorMessage(error) });
  }
});

/**
 * GET /api/queue/:queueName/jobs
 * List jobs in a specific queue
 */
router.get('/:queueName/jobs', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT * FROM job_tracking
      WHERE queue_name = $1
    `;
    const params: any[] = [queueName];

    if (status) {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM job_tracking WHERE queue_name = $1${status ? ' AND status = $2' : ''}`,
      status ? [queueName, status] : [queueName]
    );

    res.json({
      success: true,
      data: {
        jobs: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      }
    });
  } catch (error: any) {
    console.error('Error getting jobs:', error);
    res.status(500).json({ error: 'Failed to get jobs', message: getErrorMessage(error) });
  }
});

/**
 * GET /api/queue/:queueName/failed
 * List failed jobs in a specific queue
 */
router.get('/:queueName/failed', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT * FROM job_tracking
       WHERE queue_name = $1 AND status = $2
       ORDER BY failed_at DESC
       LIMIT $3 OFFSET $4`,
      [queueName, JobStatus.FAILED, parseInt(limit as string), parseInt(offset as string)]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM job_tracking WHERE queue_name = $1 AND status = $2',
      [queueName, JobStatus.FAILED]
    );

    res.json({
      success: true,
      data: {
        jobs: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      }
    });
  } catch (error: any) {
    console.error('Error getting failed jobs:', error);
    res.status(500).json({ error: 'Failed to get failed jobs', message: getErrorMessage(error) });
  }
});

/**
 * GET /api/queue/dead-letter
 * List jobs in dead letter queue
 */
router.get('/dead-letter', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { reviewed, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM dead_letter_queue';
    const params: any[] = [];

    if (reviewed !== undefined) {
      query += ' WHERE reviewed = $1';
      params.push(reviewed === 'true');
    }

    query += ` ORDER BY moved_to_dlq_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const result = await pool.query(query, params);

    const countQuery = reviewed !== undefined
      ? 'SELECT COUNT(*) as total FROM dead_letter_queue WHERE reviewed = $1'
      : 'SELECT COUNT(*) as total FROM dead_letter_queue';
    const countParams = reviewed !== undefined ? [reviewed === 'true'] : [];
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        jobs: result.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      }
    });
  } catch (error: any) {
    console.error('Error getting dead letter jobs:', error);
    res.status(500).json({ error: 'Failed to get dead letter jobs', message: getErrorMessage(error) });
  }
});

/**
 * POST /api/queue/:queueName/retry/:jobId
 * Retry a failed job
 */
router.post('/:queueName/retry/:jobId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const newJobId = await queueService.retryFailedJob(jobId);

    res.json({
      success: true,
      data: {
        message: 'Job retry queued successfully',
        originalJobId: jobId,
        newJobId
      }
    });
  } catch (error: any) {
    console.error('Error retrying job:', error);
    res.status(500).json({ error: 'Failed to retry job', message: getErrorMessage(error) });
  }
});

/**
 * POST /api/queue/:queueName/pause
 * Pause queue processing
 */
router.post('/:queueName/pause', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params;

    await queueService.pauseQueue(queueName);

    res.json({
      success: true,
      data: {
        message: `Queue ${queueName} paused successfully`,
        queueName,
        pausedAt: new Date()
      }
    });
  } catch (error: any) {
    console.error('Error pausing queue:', error);
    res.status(500).json({ error: 'Failed to pause queue', message: getErrorMessage(error) });
  }
});

/**
 * POST /api/queue/:queueName/resume
 * Resume queue processing
 */
router.post('/:queueName/resume', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params;

    await queueService.resumeQueue(queueName);

    res.json({
      success: true,
      data: {
        message: `Queue ${queueName} resumed successfully`,
        queueName,
        resumedAt: new Date()
      }
    });
  } catch (error: any) {
    console.error('Error resuming queue:', error);
    res.status(500).json({ error: 'Failed to resume queue', message: getErrorMessage(error) });
  }
});

/**
 * DELETE /api/queue/:queueName/clear
 * Clear all jobs from a queue (admin only, dangerous operation)
 */
router.delete('/:queueName/clear', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { queueName } = req.params;
    const { confirm } = req.query;

    // Require explicit confirmation
    if (confirm !== 'yes') {
      return res.status(400).json({
        error: 'Confirmation required',
        message: 'Add ?confirm=yes to the URL to confirm this dangerous operation'
      });
    }

    await queueService.clearQueue(queueName);

    res.json({
      success: true,
      data: {
        message: `Queue ${queueName} cleared successfully`,
        queueName,
        clearedAt: new Date()
      }
    });
  } catch (error: any) {
    console.error('Error clearing queue:', error);
    res.status(500).json({ error: 'Failed to clear queue', message: getErrorMessage(error) });
  }
});

/**
 * POST /api/queue/dead-letter/:jobId/review
 * Mark a dead letter job as reviewed
 */
router.post('/dead-letter/:jobId/review', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const { reviewedBy, resolutionNotes } = req.body;

    await pool.query(
      `UPDATE dead_letter_queue
       SET reviewed = TRUE,
           reviewed_by = $1,
           reviewed_at = NOW(),
           resolution_notes = $2
       WHERE job_id = $3`,
      [reviewedBy || 'admin', resolutionNotes || '', jobId]
    );

    res.json({
      success: true,
      data: {
        message: 'Dead letter job marked as reviewed',
        jobId,
        reviewedBy,
        reviewedAt: new Date()
      }
    });
  } catch (error: any) {
    console.error('Error reviewing dead letter job:', error);
    res.status(500).json({ error: 'Failed to review job', message: getErrorMessage(error) });
  }
});

/**
 * GET /api/queue/metrics
 * Get detailed metrics for monitoring dashboards
 */
router.get('/metrics', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { timeRange = '24h' } = req.query;

    // Parse time range
    const timeRangeMap: Record<string, string> = {
      '1h': '1 hour',
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days'
    };

    const interval = timeRangeMap[timeRange as string] || '24 hours';

    // Get metrics from database
    const metricsResult = await pool.query(
      `SELECT
        queue_name,
        COUNT(*) as total_jobs,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_jobs,
        COUNT(*) FILTER (WHERE status = 'active') as active_jobs,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000)
          FILTER (WHERE completed_at IS NOT NULL) as avg_processing_time_ms,
        MAX(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000)
          FILTER (WHERE completed_at IS NOT NULL) as max_processing_time_ms,
        MIN(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000)
          FILTER (WHERE completed_at IS NOT NULL) as min_processing_time_ms
       FROM job_tracking
       WHERE created_at > NOW() - INTERVAL '${interval}'
       GROUP BY queue_name`,
      []
    );

    // Calculate success rates
    const metrics = metricsResult.rows.map(row => ({
      queueName: row.queue_name,
      totalJobs: parseInt(row.total_jobs),
      completedJobs: parseInt(row.completed_jobs),
      failedJobs: parseInt(row.failed_jobs),
      pendingJobs: parseInt(row.pending_jobs),
      activeJobs: parseInt(row.active_jobs),
      successRate: row.total_jobs > 0
        ? (row.completed_jobs / row.total_jobs * 100).toFixed(2) + '%'
        : '0%',
      failureRate: row.total_jobs > 0
        ? (row.failed_jobs / row.total_jobs * 100).toFixed(2) + '%'
        : '0%',
      avgProcessingTimeMs: parseFloat(row.avg_processing_time_ms) || 0,
      maxProcessingTimeMs: parseFloat(row.max_processing_time_ms) || 0,
      minProcessingTimeMs: parseFloat(row.min_processing_time_ms) || 0
    }));

    res.json({
      success: true,
      data: {
        timeRange,
        metrics,
        timestamp: new Date()
      }
    });
  } catch (error: any) {
    console.error('Error getting metrics:', error);
    res.status(500).json({ error: 'Failed to get metrics', message: getErrorMessage(error) });
  }
});

/**
 * GET /api/queue/:queueName/job/:jobId
 * Get details of a specific job
 */
router.get('/:queueName/job/:jobId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const result = await pool.query(
      'SELECT * FROM job_tracking WHERE job_id = $1',
      [jobId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error getting job:', error);
    res.status(500).json({ error: 'Failed to get job', message: getErrorMessage(error) });
  }
});

export default router;
