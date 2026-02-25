import { Router, Request, Response } from 'express';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { DashboardController } from '../validation/DashboardController';
import { DashboardService } from '../validation/DashboardService';
import { logger } from '../lib/logger';

/**
 * Validation Dashboard Routes
 * REST API endpoints for quality loop dashboard
 */

// Initialize service and controller
const dashboardService = new DashboardService();
const dashboardController = new DashboardController(dashboardService);

const router = Router();

/**
 * GET /api/validation/dashboard
 * Returns overall dashboard status and summary
 */
router.get('/', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response) => {
  try {
    await dashboardController.getDashboard(req, res);
  } catch (error) {
    logger.error('Dashboard route error', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/validation/issues
 * Returns list of issues with optional filtering
 */
router.get('/issues', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response) => {
  try {
    await dashboardController.getIssues(req, res);
  } catch (error) {
    logger.error('Get issues route error', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/validation/issues/:id
 * Returns detailed view of a specific issue
 */
router.get('/issues/:id', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response) => {
  try {
    await dashboardController.getIssueDetail(req, res);
  } catch (error) {
    logger.error('Get issue detail route error', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/validation/issues/:id/approve
 * Approve an issue
 */
router.post('/issues/:id/approve', async (req, res) => {
  try {
    await dashboardController.approveIssue(req, res);
  } catch (error) {
    logger.error('Approve issue route error', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/validation/issues/:id/dismiss
 * Dismiss an issue as false positive
 */
router.post('/issues/:id/dismiss', async (req, res) => {
  try {
    await dashboardController.dismissIssue(req, res);
  } catch (error) {
    logger.error('Dismiss issue route error', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/validation/issues/:id/update-stage
 * Update issue quality loop stage
 */
router.post('/issues/:id/update-stage', async (req, res) => {
  try {
    await dashboardController.updateIssueStage(req, res);
  } catch (error) {
    logger.error('Update issue stage route error', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/validation/dashboard/html
 * Returns HTML rendering of the dashboard
 */
router.get('/dashboard/html', async (req, res) => {
  try {
    await dashboardController.getHtmlDashboard(req, res);
  } catch (error) {
    logger.error('HTML dashboard route error', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
