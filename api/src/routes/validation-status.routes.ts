/**
 * Validation Framework Status Routes
 * REST API endpoints for deployment verification, health checks, and monitoring
 */

import { Router, Request, Response } from 'express';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { FrameworkStatus } from '../validation/FrameworkStatus';
import { logger } from '../lib/logger';

// Initialize status service
const frameworkStatus = new FrameworkStatus();

const router = Router();

/**
 * GET /api/validation/status
 * Returns overall framework status and deployment information
 * Used by: Operations team, dashboards, monitoring systems
 */
router.get('/', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response) => {
  try {
    const status = await frameworkStatus.getOverallStatus();

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    logger.error('Failed to get overall status', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/validation/status/health
 * Kubernetes liveness probe
 * Returns 200 if healthy, 503 if unhealthy
 * NOTE: No authentication - Kubernetes probes cannot send auth headers
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await frameworkStatus.healthCheck();

    const statusCode = health.healthy ? 200 : 503;

    res.status(statusCode).json({
      success: health.healthy,
      data: health
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed'
    });
  }
});

/**
 * GET /api/validation/status/ready
 * Kubernetes readiness probe
 * Returns 200 if ready to accept traffic, 503 if not ready
 * NOTE: No authentication - Kubernetes probes cannot send auth headers
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const ready = await frameworkStatus.readinessCheck();

    const statusCode = ready.ready ? 200 : 503;

    res.status(statusCode).json({
      success: ready.ready,
      data: ready
    });
  } catch (error) {
    logger.error('Readiness check failed', { error });
    res.status(503).json({
      success: false,
      error: error instanceof Error ? error.message : 'Readiness check failed'
    });
  }
});

/**
 * GET /api/validation/status/agents
 * Returns status of all validation agents
 * Shows: operational status, last run time, issue counts, performance metrics
 */
router.get('/agents', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response) => {
  try {
    const agentStatus = await frameworkStatus.getAgentStatus();

    res.json({
      success: true,
      data: agentStatus
    });
  } catch (error) {
    logger.error('Failed to get agent status', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/validation/status/metrics
 * Returns framework metrics and performance indicators
 * Shows: issue detection rate, quality scores, validation runs, execution times
 */
router.get('/metrics', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response) => {
  try {
    const metrics = await frameworkStatus.getMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get metrics', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * GET /api/validation/status/performance
 * Returns performance baseline and resource utilization
 * Shows: agent execution times, memory usage, CPU usage, cache hit rates
 */
router.get('/performance', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response) => {
  try {
    const performance = await frameworkStatus.getPerformanceBaseline();

    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Failed to get performance baseline', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

export default router;
