import { Request, Response } from 'express';
import { logger } from '../lib/logger';
import { DashboardService } from './DashboardService';
import {
  ApiResponse,
  ValidationIssue,
  DashboardSummary,
  IssueFilterCriteria,
  IssueSeverity,
  QualityLoopStage
} from './models/DashboardModels';

/**
 * Dashboard Controller
 * REST API endpoints for quality loop dashboard
 */
export class DashboardController {
  constructor(private service: DashboardService) {}

  /**
   * GET /api/validation/dashboard
   * Returns overall dashboard status and summary
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const summary = this.service.getDashboardSummary();

      const response: ApiResponse<DashboardSummary> = {
        success: true,
        data: summary,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.json(response);
      logger.debug('Dashboard retrieved', { qualityScore: summary.qualityScore });
    } catch (error) {
      logger.error('Failed to get dashboard', { error });
      res.status(500).json({
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get dashboard'
      });
    }
  }

  /**
   * GET /api/validation/issues
   * Returns list of issues with optional filtering
   * Query params:
   *   - severity: 'critical' | 'high' | 'medium' | 'low'
   *   - agent: agent name
   *   - loopStage: quality loop stage
   *   - status: issue status
   */
  async getIssues(req: Request, res: Response): Promise<void> {
    try {
      const criteria: IssueFilterCriteria = {};

      if (req.query.severity) {
        criteria.severity = req.query.severity as IssueSeverity;
      }

      if (req.query.agent) {
        criteria.agent = req.query.agent as any;
      }

      if (req.query.loopStage) {
        criteria.loopStage = req.query.loopStage as QualityLoopStage;
      }

      if (req.query.status) {
        criteria.status = req.query.status as any;
      }

      if (req.query.affectedComponent) {
        criteria.affectedComponent = req.query.affectedComponent as string;
      }

      const issues = this.service.getIssues(criteria);

      const response: ApiResponse<ValidationIssue[]> = {
        success: true,
        data: issues,
        meta: {
          count: issues.length,
          filters: criteria,
          timestamp: new Date().toISOString()
        }
      };

      res.json(response);
      logger.debug('Issues retrieved', { count: issues.length, filters: criteria });
    } catch (error) {
      logger.error('Failed to get issues', { error });
      res.status(500).json({
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get issues'
      });
    }
  }

  /**
   * GET /api/validation/issues/:id
   * Returns detailed view of a specific issue with annotated screenshot
   */
  async getIssueDetail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          data: null,
          error: 'Issue ID is required'
        });
        return;
      }

      const issue = this.service.getIssueById(id);

      if (!issue) {
        res.status(404).json({
          success: false,
          data: null,
          error: `Issue not found: ${id}`
        });
        return;
      }

      const response: ApiResponse<ValidationIssue> = {
        success: true,
        data: issue,
        meta: {
          timestamp: new Date().toISOString()
        }
      };

      res.json(response);
      logger.debug('Issue detail retrieved', { issueId: id });
    } catch (error) {
      logger.error('Failed to get issue detail', { error, issueId: req.params.id });
      res.status(500).json({
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to get issue detail'
      });
    }
  }

  /**
   * POST /api/validation/issues/:id/approve
   * Approve an issue and transition it to Approved stage
   */
  async approveIssue(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          data: null,
          error: 'Issue ID is required'
        });
        return;
      }

      const issue = this.service.getIssueById(id);

      if (!issue) {
        res.status(404).json({
          success: false,
          data: null,
          error: `Issue not found: ${id}`
        });
        return;
      }

      this.service.approveIssue(id);
      const updatedIssue = this.service.getIssueById(id)!;

      const response: ApiResponse<ValidationIssue> = {
        success: true,
        data: updatedIssue,
        meta: {
          action: 'approved',
          timestamp: new Date().toISOString()
        }
      };

      res.json(response);
      logger.debug('Issue approved', { issueId: id });
    } catch (error) {
      logger.error('Failed to approve issue', { error, issueId: req.params.id });
      res.status(500).json({
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to approve issue'
      });
    }
  }

  /**
   * POST /api/validation/issues/:id/dismiss
   * Dismiss an issue as false positive
   * Body:
   *   - reason: string (required) - reason for dismissal
   */
  async dismissIssue(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          data: null,
          error: 'Issue ID is required'
        });
        return;
      }

      if (!reason) {
        res.status(400).json({
          success: false,
          data: null,
          error: 'Dismissal reason is required'
        });
        return;
      }

      const issue = this.service.getIssueById(id);

      if (!issue) {
        res.status(404).json({
          success: false,
          data: null,
          error: `Issue not found: ${id}`
        });
        return;
      }

      this.service.dismissIssue(id, reason);
      const updatedIssue = this.service.getIssueById(id)!;

      const response: ApiResponse<ValidationIssue> = {
        success: true,
        data: updatedIssue,
        meta: {
          action: 'dismissed',
          reason,
          timestamp: new Date().toISOString()
        }
      };

      res.json(response);
      logger.debug('Issue dismissed', { issueId: id, reason });
    } catch (error) {
      logger.error('Failed to dismiss issue', { error, issueId: req.params.id });
      res.status(500).json({
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to dismiss issue'
      });
    }
  }

  /**
   * GET /api/validation/dashboard/html
   * Returns HTML rendering of the dashboard
   * Query params:
   *   - theme: 'light' | 'dark' (default: 'dark')
   *   - groupByAgent: boolean (default: true)
   *   - sortBySeverity: boolean (default: true)
   *   - includeAnnotations: boolean (default: true)
   *   - includeDiagnostics: boolean (default: true)
   *   - includeFixes: boolean (default: true)
   */
  async getHtmlDashboard(req: Request, res: Response): Promise<void> {
    try {
      const theme = (req.query.theme as string) || 'dark';
      const groupByAgent = req.query.groupByAgent !== 'false';
      const sortBySeverity = req.query.sortBySeverity !== 'false';
      const includeAnnotations = req.query.includeAnnotations !== 'false';
      const includeDiagnostics = req.query.includeDiagnostics !== 'false';
      const includeFixes = req.query.includeFixes !== 'false';

      const html = this.service.generateHtmlDashboard({
        theme: theme as 'light' | 'dark',
        groupByAgent,
        sortBySeverity,
        includeAnnotations,
        includeDiagnostics,
        includeFixes,
        cssInline: true
      });

      res.set('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
      logger.debug('HTML dashboard generated', { theme });
    } catch (error) {
      logger.error('Failed to generate HTML dashboard', { error });
      res.status(500).json({
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to generate HTML dashboard'
      });
    }
  }

  /**
   * POST /api/validation/issues/:id/update-stage
   * Update issue quality loop stage
   * Body:
   *   - stage: QualityLoopStage (required) - new stage
   */
  async updateIssueStage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { stage } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          data: null,
          error: 'Issue ID is required'
        });
        return;
      }

      if (!stage) {
        res.status(400).json({
          success: false,
          data: null,
          error: 'Stage is required'
        });
        return;
      }

      const issue = this.service.getIssueById(id);

      if (!issue) {
        res.status(404).json({
          success: false,
          data: null,
          error: `Issue not found: ${id}`
        });
        return;
      }

      this.service.updateIssueStatus(id, stage as QualityLoopStage);
      const updatedIssue = this.service.getIssueById(id)!;

      const response: ApiResponse<ValidationIssue> = {
        success: true,
        data: updatedIssue,
        meta: {
          action: 'stage-updated',
          stage,
          timestamp: new Date().toISOString()
        }
      };

      res.json(response);
      logger.debug('Issue stage updated', { issueId: id, stage });
    } catch (error) {
      logger.error('Failed to update issue stage', { error, issueId: req.params.id });
      res.status(500).json({
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to update issue stage'
      });
    }
  }
}
