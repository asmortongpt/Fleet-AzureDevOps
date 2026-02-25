import { describe, it, expect, beforeEach } from 'vitest';
import { DashboardService } from '../DashboardService';
import { DashboardController } from '../DashboardController';
import { Request, Response } from 'express';

/**
 * Mock Request/Response objects for testing
 */
function createMockRequest(body: any = {}, params: any = {}, query: any = {}): Partial<Request> {
  return {
    body,
    params,
    query
  };
}

function createMockResponse(): { res: Partial<Response>; json: any[]; status: number | null } {
  const jsonCalls: any[] = [];
  let statusCode: number | null = null;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: any) {
      jsonCalls.push(data);
      return this;
    }
  } as Partial<Response>;

  return { res, json: jsonCalls, status: statusCode };
}

/**
 * Sample validation issues for testing
 */
const SAMPLE_ISSUES = [
  {
    id: '1',
    agent: 'VisualQAAgent',
    severity: 'critical' as const,
    description: 'Text overflow in dashboard header',
    screenshot: 'data:image/png;base64,iVBORw0KGgo=',
    affectedComponent: 'DashboardHeader',
    diagnosticInfo: 'Font size 24px with max-width 300px',
    suggestedFix: 'Use truncate or reduce font size',
    status: 'Detected' as const,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
    annotatedScreenshot: 'data:image/png;base64,annotated',
    loopStage: 'Detected' as const
  },
  {
    id: '2',
    agent: 'ResponsiveDesignAgent',
    severity: 'high' as const,
    description: 'Layout broken at 375px viewport',
    screenshot: 'data:image/png;base64,iVBORw0KGgo=',
    affectedComponent: 'FleetOperationsHub',
    diagnosticInfo: 'Grid columns overlap on mobile',
    suggestedFix: 'Add mobile breakpoint for grid',
    status: 'Detected' as const,
    createdAt: new Date('2024-01-02').toISOString(),
    updatedAt: new Date('2024-01-02').toISOString(),
    annotatedScreenshot: 'data:image/png;base64,annotated',
    loopStage: 'Detected' as const
  },
  {
    id: '3',
    agent: 'TypographyAgent',
    severity: 'medium' as const,
    description: 'Inconsistent line height in paragraphs',
    screenshot: 'data:image/png;base64,iVBORw0KGgo=',
    affectedComponent: 'ReportView',
    diagnosticInfo: 'Line height varies between 1.4 and 1.8',
    suggestedFix: 'Standardize on 1.6 line height',
    status: 'Detected' as const,
    createdAt: new Date('2024-01-03').toISOString(),
    updatedAt: new Date('2024-01-03').toISOString(),
    annotatedScreenshot: 'data:image/png;base64,annotated',
    loopStage: 'Detected' as const
  },
  {
    id: '4',
    agent: 'InteractionQualityAgent',
    severity: 'low' as const,
    description: 'Button hover state missing',
    screenshot: 'data:image/png;base64,iVBORw0KGgo=',
    affectedComponent: 'PrimaryButton',
    diagnosticInfo: 'No :hover CSS rule defined',
    suggestedFix: 'Add hover state with opacity or background change',
    status: 'Detected' as const,
    createdAt: new Date('2024-01-04').toISOString(),
    updatedAt: new Date('2024-01-04').toISOString(),
    annotatedScreenshot: 'data:image/png;base64,annotated',
    loopStage: 'Detected' as const
  },
  {
    id: '5',
    agent: 'ScrollingAuditAgent',
    severity: 'critical' as const,
    description: 'Horizontal scroll on mobile',
    screenshot: 'data:image/png;base64,iVBORw0KGgo=',
    affectedComponent: 'DataTable',
    diagnosticInfo: 'Content exceeds viewport width by 120px',
    suggestedFix: 'Make table scrollable or stack columns',
    status: 'Diagnosed' as const,
    createdAt: new Date('2024-01-05').toISOString(),
    updatedAt: new Date('2024-01-05').toISOString(),
    annotatedScreenshot: 'data:image/png;base64,annotated',
    loopStage: 'Diagnosed' as const
  }
];

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    service = new DashboardService();
  });

  describe('Quality Loop Tracking', () => {
    it('should initialize with empty issues', () => {
      const issues = service.getIssues();
      expect(Array.isArray(issues)).toBe(true);
      expect(issues.length).toBe(0);
    });

    it('should add issues to dashboard', () => {
      SAMPLE_ISSUES.slice(0, 2).forEach(issue => {
        service.addIssue(issue);
      });

      const issues = service.getIssues();
      expect(issues.length).toBe(2);
      expect(issues[0].id).toBe('1');
    });

    it('should transition issue through quality loop stages', () => {
      service.addIssue(SAMPLE_ISSUES[0]);

      expect(service.getIssueById('1')?.loopStage).toBe('Detected');

      service.updateIssueStatus('1', 'Diagnosed');
      expect(service.getIssueById('1')?.loopStage).toBe('Diagnosed');

      service.updateIssueStatus('1', 'Fixed');
      expect(service.getIssueById('1')?.loopStage).toBe('Fixed');

      service.updateIssueStatus('1', 'Verified');
      expect(service.getIssueById('1')?.loopStage).toBe('Verified');

      service.updateIssueStatus('1', 'Approved');
      expect(service.getIssueById('1')?.loopStage).toBe('Approved');
    });

    it('should approve issues', () => {
      service.addIssue(SAMPLE_ISSUES[0]);

      let issue = service.getIssueById('1');
      expect(issue?.status).toBe('Detected');

      service.approveIssue('1');
      issue = service.getIssueById('1');
      expect(issue?.status).toBe('Approved');
    });

    it('should dismiss false positive issues', () => {
      service.addIssue(SAMPLE_ISSUES[0]);

      let issue = service.getIssueById('1');
      expect(issue?.status).toBe('Detected');

      service.dismissIssue('1', 'False positive - font size is intentional');
      issue = service.getIssueById('1');
      expect(issue?.status).toBe('Dismissed');
    });
  });

  describe('Score Calculation', () => {
    it('should calculate 100 for no issues', () => {
      const score = service.calculateQualityScore();
      expect(score).toBe(100);
    });

    it('should calculate score with severity weights', () => {
      // critical=25pts, high=10pts, medium=5pts, low=1pt
      // 1 critical = 100 - 25 = 75
      service.addIssue(SAMPLE_ISSUES[0]); // critical
      expect(service.calculateQualityScore()).toBe(75);
    });

    it('should apply multiple penalties', () => {
      // 1 critical (25) + 1 high (10) + 1 medium (5) = 40 points
      // 100 - 40 = 60
      service.addIssue(SAMPLE_ISSUES[0]); // critical
      service.addIssue(SAMPLE_ISSUES[1]); // high
      service.addIssue(SAMPLE_ISSUES[2]); // medium
      expect(service.calculateQualityScore()).toBe(60);
    });

    it('should not go below 0', () => {
      // Add many issues to exceed max penalty
      for (let i = 0; i < 10; i++) {
        service.addIssue({
          ...SAMPLE_ISSUES[0],
          id: String(i)
        });
      }
      const score = service.calculateQualityScore();
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should exclude approved issues from score', () => {
      service.addIssue(SAMPLE_ISSUES[0]); // critical
      service.addIssue(SAMPLE_ISSUES[1]); // high

      expect(service.calculateQualityScore()).toBe(65); // 100 - 25 - 10

      service.approveIssue('1');
      expect(service.calculateQualityScore()).toBe(90); // 100 - 10 (only high remains)
    });
  });

  describe('Dashboard Summary', () => {
    it('should return dashboard summary', () => {
      SAMPLE_ISSUES.forEach(issue => {
        service.addIssue(issue);
      });

      const summary = service.getDashboardSummary();
      expect(summary).toHaveProperty('totalIssues', 5);
      expect(summary).toHaveProperty('qualityScore');
      expect(summary).toHaveProperty('issuesBySeverity');
      expect(summary).toHaveProperty('issuesByAgent');
      expect(summary).toHaveProperty('issuesByLoopStage');
    });

    it('should count issues by severity', () => {
      SAMPLE_ISSUES.forEach(issue => {
        service.addIssue(issue);
      });

      const summary = service.getDashboardSummary();
      expect(summary.issuesBySeverity).toEqual({
        critical: 2,
        high: 1,
        medium: 1,
        low: 1
      });
    });

    it('should count issues by agent', () => {
      SAMPLE_ISSUES.forEach(issue => {
        service.addIssue(issue);
      });

      const summary = service.getDashboardSummary();
      expect(summary.issuesByAgent.VisualQAAgent).toBe(1);
      expect(summary.issuesByAgent.ResponsiveDesignAgent).toBe(1);
      expect(summary.issuesByAgent.ScrollingAuditAgent).toBe(1);
      expect(summary.issuesByAgent.TypographyAgent).toBe(1);
      expect(summary.issuesByAgent.InteractionQualityAgent).toBe(1);
    });

    it('should count issues by loop stage', () => {
      SAMPLE_ISSUES.forEach(issue => {
        service.addIssue(issue);
      });

      const summary = service.getDashboardSummary();
      expect(summary.issuesByLoopStage).toHaveProperty('Detected');
      expect(summary.issuesByLoopStage).toHaveProperty('Diagnosed');
      expect(summary.issuesByLoopStage.Detected).toBe(4);
      expect(summary.issuesByLoopStage.Diagnosed).toBe(1);
    });
  });

  describe('Issue Filtering', () => {
    beforeEach(() => {
      SAMPLE_ISSUES.forEach(issue => {
        service.addIssue(issue);
      });
    });

    it('should filter issues by severity', () => {
      const critical = service.getIssuesBySeverity('critical');
      expect(critical.length).toBe(2);
      expect(critical.every(i => i.severity === 'critical')).toBe(true);
    });

    it('should filter issues by agent', () => {
      const visualQA = service.getIssuesByAgent('VisualQAAgent');
      expect(visualQA.length).toBe(1);
      expect(visualQA[0].agent).toBe('VisualQAAgent');
    });

    it('should filter issues by loop stage', () => {
      const detected = service.getIssuesByLoopStage('Detected');
      expect(detected.length).toBe(4);
      expect(detected.every(i => i.loopStage === 'Detected')).toBe(true);
    });

    it('should return all issues without filter', () => {
      const all = service.getIssues();
      expect(all.length).toBe(5);
    });
  });

  describe('HTML Rendering', () => {
    beforeEach(() => {
      SAMPLE_ISSUES.forEach(issue => {
        service.addIssue(issue);
      });
    });

    it('should generate HTML dashboard', () => {
      const html = service.generateHtmlDashboard();
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
      expect(html).toContain('<html');
      expect(html).toContain('Dashboard');
    });

    it('should include issues in HTML', () => {
      const html = service.generateHtmlDashboard();
      expect(html).toContain('Text overflow in dashboard header');
      expect(html).toContain('Layout broken at 375px viewport');
    });

    it('should include severity badges in HTML', () => {
      const html = service.generateHtmlDashboard();
      expect(html).toContain('critical');
      expect(html).toContain('high');
      expect(html).toContain('medium');
    });

    it('should organize issues by agent in HTML', () => {
      const html = service.generateHtmlDashboard();
      expect(html).toContain('VisualQAAgent');
      expect(html).toContain('ResponsiveDesignAgent');
      expect(html).toContain('TypographyAgent');
    });

    it('should include annotated screenshots in HTML', () => {
      const html = service.generateHtmlDashboard();
      expect(html).toContain('data:image/png;base64');
    });
  });
});

describe('DashboardController', () => {
  let controller: DashboardController;
  let service: DashboardService;

  beforeEach(() => {
    service = new DashboardService();
    controller = new DashboardController(service);
    SAMPLE_ISSUES.forEach(issue => {
      service.addIssue(issue);
    });
  });

  describe('GET /api/validation/dashboard', () => {
    it('should return dashboard summary', async () => {
      const req = createMockRequest();
      const { res, json } = createMockResponse();

      await controller.getDashboard(req as Request, res as Response);

      expect(json.length).toBeGreaterThan(0);
      const response = json[0];
      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('data');
      expect(response.data).toHaveProperty('totalIssues');
      expect(response.data).toHaveProperty('qualityScore');
    });
  });

  describe('GET /api/validation/issues', () => {
    it('should return all issues', async () => {
      const req = createMockRequest();
      const { res, json } = createMockResponse();

      await controller.getIssues(req as Request, res as Response);

      const response = json[0];
      expect(response).toHaveProperty('success', true);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBe(5);
    });

    it('should filter issues by severity', async () => {
      const req = createMockRequest({}, {}, { severity: 'critical' }) as any;
      const { res, json } = createMockResponse();

      await controller.getIssues(req as Request, res as Response);

      const response = json[0];
      expect(response.data.length).toBe(2);
      expect(response.data.every((i: any) => i.severity === 'critical')).toBe(true);
    });

    it('should filter issues by agent', async () => {
      const req = createMockRequest({}, {}, { agent: 'VisualQAAgent' }) as any;
      const { res, json } = createMockResponse();

      await controller.getIssues(req as Request, res as Response);

      const response = json[0];
      expect(response.data.length).toBe(1);
      expect(response.data[0].agent).toBe('VisualQAAgent');
    });
  });

  describe('GET /api/validation/issues/:id', () => {
    it('should return issue detail', async () => {
      const req = createMockRequest({}, { id: '1' });
      const { res, json } = createMockResponse();

      await controller.getIssueDetail(req as Request, res as Response);

      const response = json[0];
      expect(response).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('id', '1');
      expect(response.data).toHaveProperty('annotatedScreenshot');
    });

    it('should return 404 for non-existent issue', async () => {
      const req = createMockRequest({}, { id: 'non-existent' });
      const { res, json, status } = createMockResponse();

      await controller.getIssueDetail(req as Request, res as Response);

      const response = json[0];
      expect(response).toHaveProperty('success', false);
    });
  });

  describe('POST /api/validation/issues/:id/approve', () => {
    it('should approve issue', async () => {
      const req = createMockRequest({}, { id: '1' });
      const { res, json } = createMockResponse();

      await controller.approveIssue(req as Request, res as Response);

      const response = json[0];
      expect(response).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('status', 'Approved');
    });

    it('should handle non-existent issue', async () => {
      const req = createMockRequest({}, { id: 'non-existent' });
      const { res, json } = createMockResponse();

      await controller.approveIssue(req as Request, res as Response);

      const response = json[0];
      expect(response).toHaveProperty('success', false);
    });
  });

  describe('POST /api/validation/issues/:id/dismiss', () => {
    it('should dismiss issue', async () => {
      const req = createMockRequest(
        { reason: 'False positive' },
        { id: '1' }
      );
      const { res, json } = createMockResponse();

      await controller.dismissIssue(req as Request, res as Response);

      const response = json[0];
      expect(response).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('status', 'Dismissed');
    });

    it('should require reason when dismissing', async () => {
      const req = createMockRequest({}, { id: '1' });
      const { res, json } = createMockResponse();

      await controller.dismissIssue(req as Request, res as Response);

      const response = json[0];
      expect(response).toHaveProperty('success', false);
    });
  });

  describe('GET /api/validation/dashboard/html', () => {
    it('should return HTML dashboard', async () => {
      const req = createMockRequest();
      const { res } = createMockResponse();

      // Mock res.send for HTML endpoint
      let htmlSent = '';
      res.send = (html: string) => {
        htmlSent = html;
        return res as Response;
      };
      res.set = () => res as Response;

      await controller.getHtmlDashboard(req as Request, res as Response);

      expect(typeof htmlSent).toBe('string');
      expect(htmlSent).toContain('<html');
      expect(htmlSent).toContain('Dashboard');
    });
  });
});
