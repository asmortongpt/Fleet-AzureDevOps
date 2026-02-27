import { Router, Request, Response } from 'express';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { logger } from '../lib/logger';
import { getIssueTracker } from '../validation/ServiceRegistry';
import { ReportGenerator } from '../validation/ReportGenerator';
import {
  CreateIssueRequest,
  UpdateIssueRequest,
  AssignIssueRequest,
  VerifyFixRequest,
  ReportFormat
} from '../validation/models/IssueModels';

/**
 * Validation Issues Routes
 * REST API for issue tracking, reporting, and management
 * Uses shared service instances from ServiceRegistry for consistent state
 */

const router = Router();

// Get shared instances
const issueTracker = getIssueTracker();
const reportGenerator = new ReportGenerator(issueTracker);

/**
 * POST /api/validation/issues
 * Create a new issue
 */
router.post('/', authenticateJWT, requirePermission('validation:edit'), async (req: AuthRequest, res: Response) => {
  try {
    const request: CreateIssueRequest = req.body;

    // Validate required fields
    if (!request.title || !request.severity || !request.category || !request.affectedComponent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, severity, category, affectedComponent'
      });
    }

    const issue = issueTracker.createIssue(request);

    logger.info('Issue created', { issueId: issue.id, severity: issue.severity });

    res.status(201).json({
      success: true,
      data: issue
    });
  } catch (error) {
    logger.error('Error creating issue', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/validation/issues
 * Get all issues with optional filtering
 */
router.get('/', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response) => {
  try {
    const { severity, status, category, text, assignedTo } = req.query;

    const criteria: any = {};
    if (severity) criteria.severity = severity;
    if (status) criteria.status = status;
    if (category) criteria.category = category;
    if (text) criteria.text = text;
    if (assignedTo) criteria.assignedTo = assignedTo;

    const issues = issueTracker.searchIssues(criteria);

    res.json({
      success: true,
      data: issues,
      meta: {
        total: issues.length,
        count: issues.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error retrieving issues', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/validation/reports/summary
 * Get summary metrics
 */
router.get('/reports/summary', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response) => {
  try {
    const summary = reportGenerator.generateSummary();

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error generating report summary', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/validation/reports/metrics
 * Get detailed metrics
 */
router.get('/reports/metrics', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response) => {
  try {
    const metrics = issueTracker.getIssueMetrics();

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Error retrieving metrics', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/validation/reports/trending
 * Get trending metrics
 */
router.get('/reports/trending', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response) => {
  try {
    const trending = issueTracker.getTrendingMetrics();

    res.json({
      success: true,
      data: trending
    });
  } catch (error) {
    logger.error('Error retrieving trending metrics', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/validation/reports/export
 * Export issues in specified format (json, csv, html, pdf)
 */
router.get('/reports/export', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response) => {
  try {
    const { format = 'json' } = req.query;

    const validFormats = ['json', 'csv', 'html', 'pdf'];
    if (!validFormats.includes(format as string)) {
      return res.status(400).json({
        success: false,
        error: `Invalid format. Supported formats: ${validFormats.join(', ')}`
      });
    }

    const reportFormat = format as ReportFormat;

    if (reportFormat === 'pdf') {
      // PDF export not yet implemented
      return res.status(501).json({
        success: false,
        error: 'PDF export is not yet implemented. Please use HTML or CSV format instead.'
      });
    } else {
      // For other formats, generate synchronously
      const report = reportGenerator.generateReport(reportFormat);

      if (reportFormat === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="issues-report.csv"');
      } else if (reportFormat === 'html') {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', 'inline; filename="issues-report.html"');
      } else {
        res.setHeader('Content-Type', 'application/json');
      }

      res.send(report);
    }

    logger.info('Report exported', { format });
  } catch (error) {
    logger.error('Error exporting report', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/validation/issues/:id
 * Get specific issue with history
 */
router.get('/:id', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const issue = issueTracker.getIssue(id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
    }

    res.json({
      success: true,
      data: issue
    });
  } catch (error) {
    logger.error('Error retrieving issue', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PATCH /api/validation/issues/:id
 * Update issue details
 */
router.patch('/:id', authenticateJWT, requirePermission('validation:edit'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const request: UpdateIssueRequest = req.body;

    const issue = issueTracker.getIssue(id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found'
      });
    }

    // Update fields if provided
    if (request.title) issue.title = request.title;
    if (request.description) issue.description = request.description;
    if (request.severity) issue.severity = request.severity;
    if (request.status) {
      issueTracker.updateIssueStatus(id, request.status, req.body.userId || null);
    }
    if (request.notes) {
      issueTracker.addNote(id, req.body.userId || 'system', request.notes);
    }

    issue.updatedAt = new Date();

    res.json({
      success: true,
      data: issue
    });
  } catch (error) {
    logger.error('Error updating issue', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/validation/issues/:id/history
 * Get complete change history for an issue
 */
router.get('/:id/history', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const history = issueTracker.getIssueHistory(id);
    if (history.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found or no history available'
      });
    }

    res.json({
      success: true,
      data: history,
      meta: {
        total: history.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error retrieving issue history', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/validation/issues/:id/assign
 * Assign issue to team member
 */
router.post('/:id/assign', authenticateJWT, requirePermission('validation:edit'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const request: AssignIssueRequest = req.body;

    // Validate required fields
    if (!request.assignedTo || !request.assignedToEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: assignedTo, assignedToEmail'
      });
    }

    issueTracker.assignIssue(
      id,
      request.assignedTo,
      request.assignedToEmail,
      request.reason,
      request.assignedToName
    );

    const issue = issueTracker.getIssue(id);

    res.json({
      success: true,
      data: issue
    });
  } catch (error) {
    logger.error('Error assigning issue', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/validation/issues/:id/verify-fix
 * Record fix verification attempt
 */
router.post('/:id/verify-fix', authenticateJWT, requirePermission('validation:edit'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const request: VerifyFixRequest = req.body;

    // Validate required fields
    if (typeof request.verified !== 'boolean' || !request.verifiedBy || !request.notes) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: verified (boolean), verifiedBy, notes'
      });
    }

    issueTracker.verifyFix(id, request.verified, request.verifiedBy, request.notes);

    const issue = issueTracker.getIssue(id);

    res.json({
      success: true,
      data: issue
    });
  } catch (error) {
    logger.error('Error verifying fix', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/validation/issues/:id/reopen
 * Reopen a closed or dismissed issue
 */
router.post('/:id/reopen', authenticateJWT, requirePermission('validation:edit'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, reason } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: userId'
      });
    }

    issueTracker.reopenIssue(id, userId, reason);

    const issue = issueTracker.getIssue(id);

    res.json({
      success: true,
      data: issue
    });
  } catch (error) {
    logger.error('Error reopening issue', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/validation/issues/:id/add-note
 * Add a note to an issue
 */
router.post('/:id/add-note', authenticateJWT, requirePermission('validation:edit'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, note } = req.body;

    if (!userId || !note) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, note'
      });
    }

    issueTracker.addNote(id, userId, note);

    const issue = issueTracker.getIssue(id);

    res.json({
      success: true,
      data: issue
    });
  } catch (error) {
    logger.error('Error adding note', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
