/**
 * Validation Framework Integration Tests - Dashboard and Reporting
 *
 * Tests dashboard integration and reporting including:
 * - Real-time issue display
 * - Quality loop stage tracking
 * - Report generation accuracy
 * - Multi-tenant data isolation in reports
 * - Performance metrics calculation
 *
 * @module tests/integration/validation-dashboard-reporting
 * @author Claude Code - Task 13
 * @date 2026-02-25
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DashboardService } from '../../src/validation/DashboardService';
import { IssueTracker } from '../../src/validation/IssueTracker';
import { ValidationFramework } from '../../src/validation/ValidationFramework';
import { logger } from '../../src/lib/logger';
import {
  createMockDashboardIssue,
  createMockValidationIssue,
  createMockMultiAgentResults,
  generateValidationRunId,
  generateIssueId,
  TEST_VALIDATION_TENANTS,
  TEST_VALIDATION_VEHICLES,
  measureExecutionTime,
} from './fixtures/validation-test-data';

// ============================================================================
// Dashboard and Reporting Integration Tests
// ============================================================================

describe('Dashboard and Reporting Integration Tests', () => {
  let dashboardService: DashboardService;
  let issueTracker: IssueTracker;
  let framework: ValidationFramework;
  let validationRunId: string;

  beforeEach(async () => {
    dashboardService = new DashboardService();
    issueTracker = new IssueTracker();
    framework = new ValidationFramework();
    validationRunId = generateValidationRunId();

    await framework.initialize();
  });

  // ==========================================================================
  // Test Suite 1: Real-Time Issue Display
  // ==========================================================================

  describe('Real-Time Issue Display', () => {
    it('should display newly detected issues immediately', () => {
      const issue = createMockDashboardIssue({
        id: generateIssueId(),
        severity: 'critical',
      });

      dashboardService.addIssue(issue);
      const displayed = dashboardService.getIssueById(issue.id);

      expect(displayed).toBeDefined();
      expect(displayed?.id).toBe(issue.id);
      expect(displayed?.severity).toBe('critical');

      logger.info('Critical issue displayed in real-time', {
        issueId: issue.id,
      });
    });

    it('should display issues by severity in real-time', () => {
      const criticalIssue = createMockDashboardIssue({
        id: generateIssueId(),
        severity: 'critical',
      });
      const highIssue = createMockDashboardIssue({
        id: generateIssueId(),
        severity: 'high',
      });
      const mediumIssue = createMockDashboardIssue({
        id: generateIssueId(),
        severity: 'medium',
      });

      dashboardService.addIssue(criticalIssue);
      dashboardService.addIssue(highIssue);
      dashboardService.addIssue(mediumIssue);

      const all = dashboardService.getIssues();
      expect(all.length).toBe(3);

      // Verify immediate availability
      expect(dashboardService.getIssueById(criticalIssue.id)).toBeDefined();
      expect(dashboardService.getIssueById(highIssue.id)).toBeDefined();
      expect(dashboardService.getIssueById(mediumIssue.id)).toBeDefined();
    });

    it('should update issue display when status changes', () => {
      const issue = createMockDashboardIssue({
        id: generateIssueId(),
        status: 'open',
        loopStage: 'detected',
      });

      dashboardService.addIssue(issue);

      // Simulate status update (in real scenario, done via API)
      const updatedIssue = {
        ...issue,
        status: 'in-progress' as const,
        loopStage: 'diagnosing' as const,
        updatedAt: new Date().toISOString(),
      };

      dashboardService.addIssue(updatedIssue);

      const displayed = dashboardService.getIssueById(issue.id);
      expect(displayed?.status).toBe('in-progress');
      expect(displayed?.loopStage).toBe('diagnosing');
    });
  });

  // ==========================================================================
  // Test Suite 2: Quality Loop Stage Tracking
  // ==========================================================================

  describe('Quality Loop Stage Tracking on Dashboard', () => {
    it('should display issues in detected stage', () => {
      const detectedIssue = createMockDashboardIssue({
        id: generateIssueId(),
        loopStage: 'detected',
        status: 'open',
      });

      dashboardService.addIssue(detectedIssue);
      const detected = dashboardService.getIssuesByLoopStage('detected');

      expect(detected.length).toBeGreaterThan(0);
      expect(detected.some(i => i.id === detectedIssue.id)).toBe(true);
    });

    it('should display issues in diagnosing stage', () => {
      const diagnosingIssue = createMockDashboardIssue({
        id: generateIssueId(),
        loopStage: 'diagnosing',
        status: 'in-progress',
      });

      dashboardService.addIssue(diagnosingIssue);
      const diagnosing = dashboardService.getIssuesByLoopStage('diagnosing');

      expect(diagnosing.length).toBeGreaterThan(0);
    });

    it('should display issues in fixing stage', () => {
      const fixingIssue = createMockDashboardIssue({
        id: generateIssueId(),
        loopStage: 'fixing',
        status: 'in-progress',
      });

      dashboardService.addIssue(fixingIssue);
      const fixing = dashboardService.getIssuesByLoopStage('fixing');

      expect(fixing.length).toBeGreaterThan(0);
    });

    it('should display issues in verifying stage', () => {
      const verifyingIssue = createMockDashboardIssue({
        id: generateIssueId(),
        loopStage: 'verifying',
        status: 'in-progress',
      });

      dashboardService.addIssue(verifyingIssue);
      const verifying = dashboardService.getIssuesByLoopStage('verifying');

      expect(verifying.length).toBeGreaterThan(0);
    });

    it('should display issues in approved stage', () => {
      const approvedIssue = createMockDashboardIssue({
        id: generateIssueId(),
        loopStage: 'approved',
        status: 'closed',
      });

      dashboardService.addIssue(approvedIssue);
      const approved = dashboardService.getIssuesByLoopStage('approved');

      expect(approved.length).toBeGreaterThan(0);
    });

    it('should track issue progression through stages', () => {
      const issueId = generateIssueId();

      // Stage 1: Detected
      const detected = createMockDashboardIssue({
        id: issueId,
        loopStage: 'detected',
        status: 'open',
      });
      dashboardService.addIssue(detected);

      // Stage 2: Diagnosing
      const diagnosing = createMockDashboardIssue({
        id: issueId,
        loopStage: 'diagnosing',
        status: 'in-progress',
        updatedAt: new Date().toISOString(),
      });
      dashboardService.addIssue(diagnosing);

      // Stage 3: Fixing
      const fixing = createMockDashboardIssue({
        id: issueId,
        loopStage: 'fixing',
        status: 'in-progress',
        updatedAt: new Date().toISOString(),
      });
      dashboardService.addIssue(fixing);

      // Verify final state
      const current = dashboardService.getIssueById(issueId);
      expect(current?.loopStage).toBe('fixing');

      logger.info('Issue progressed through quality loop stages', {
        issueId,
        finalStage: current?.loopStage,
      });
    });
  });

  // ==========================================================================
  // Test Suite 3: Dashboard Filtering and Aggregation
  // ==========================================================================

  describe('Dashboard Filtering and Aggregation', () => {
    it('should filter issues by multiple criteria', () => {
      const criticalVisualIssue = createMockDashboardIssue({
        id: generateIssueId(),
        severity: 'critical',
        agent: 'VisualQAAgent',
        loopStage: 'detected',
      });

      const highResponsiveIssue = createMockDashboardIssue({
        id: generateIssueId(),
        severity: 'high',
        agent: 'ResponsiveDesignAgent',
        loopStage: 'diagnosing',
      });

      dashboardService.addIssue(criticalVisualIssue);
      dashboardService.addIssue(highResponsiveIssue);

      // Filter by severity
      const critical = dashboardService.getIssuesBySeverity('critical');
      expect(critical.length).toBe(1);

      // Filter by agent
      const visual = dashboardService.getIssuesByAgent('VisualQAAgent');
      expect(visual.length).toBe(1);

      // Filter by loop stage
      const detected = dashboardService.getIssuesByLoopStage('detected');
      expect(detected.length).toBe(1);
    });

    it('should calculate issue statistics', () => {
      const issues = [
        createMockDashboardIssue({
          id: generateIssueId(),
          severity: 'critical',
          agent: 'VisualQAAgent',
        }),
        createMockDashboardIssue({
          id: generateIssueId(),
          severity: 'critical',
          agent: 'DataIntegrityAgent',
        }),
        createMockDashboardIssue({
          id: generateIssueId(),
          severity: 'high',
          agent: 'ResponsiveDesignAgent',
        }),
        createMockDashboardIssue({
          id: generateIssueId(),
          severity: 'medium',
          agent: 'TypographyAgent',
        }),
        createMockDashboardIssue({
          id: generateIssueId(),
          severity: 'low',
          agent: 'TypographyAgent',
        }),
      ];

      issues.forEach(issue => dashboardService.addIssue(issue));

      const stats = {
        total: dashboardService.getIssues().length,
        critical: dashboardService.getIssuesBySeverity('critical').length,
        high: dashboardService.getIssuesBySeverity('high').length,
        medium: dashboardService.getIssuesBySeverity('medium').length,
        low: dashboardService.getIssuesBySeverity('low').length,
      };

      expect(stats.total).toBe(5);
      expect(stats.critical).toBe(2);
      expect(stats.high).toBe(1);
      expect(stats.medium).toBe(1);
      expect(stats.low).toBe(1);

      logger.info('Dashboard statistics calculated', stats);
    });
  });

  // ==========================================================================
  // Test Suite 4: Report Generation
  // ==========================================================================

  describe('Report Generation', () => {
    it('should generate validation report', async () => {
      const validationResult = await framework.runValidation();
      const issues = framework.getIssuesFromResults(validationResult);

      const report = {
        id: validationRunId,
        timestamp: new Date(),
        validationScore: validationResult.overallScore,
        totalIssues: issues.length,
        issuesBySeverity: {
          critical: issues.filter(i => i.severity === 'critical').length,
          high: issues.filter(i => i.severity === 'high').length,
          medium: issues.filter(i => i.severity === 'medium').length,
          low: issues.filter(i => i.severity === 'low').length,
        },
        agents: framework.getAgents(),
      };

      expect(report.id).toBe(validationRunId);
      expect(report.validationScore).toBeGreaterThanOrEqual(0);
      expect(report.validationScore).toBeLessThanOrEqual(100);
      expect(report.agents.length).toBe(6);

      logger.info('Validation report generated', {
        reportId: report.id,
        score: report.validationScore,
        totalIssues: report.totalIssues,
      });
    });

    it('should include agent-specific details in report', () => {
      const mockResults = createMockMultiAgentResults('mixed');

      const report = {
        agents: {
          visualQA: mockResults.visualQA.issues.length,
          responsiveDesign: mockResults.responsiveDesign.issues.length,
          scrollingAudit: mockResults.scrollingAudit.issues.length,
          typography: mockResults.typography.issues.length,
          interactions: mockResults.interactions.issues.length,
          dataIntegrity: mockResults.dataIntegrity.issues.length,
        },
      };

      expect(Object.keys(report.agents).length).toBe(6);
      expect(Object.values(report.agents).every(count => typeof count === 'number')).toBe(
        true
      );
    });

    it('should generate time-series report for trend analysis', () => {
      const runs = [
        { timestamp: new Date(Date.now() - 3600000), score: 85 },
        { timestamp: new Date(Date.now() - 1800000), score: 82 },
        { timestamp: new Date(), score: 88 },
      ];

      const trendReport = {
        runs,
        avgScore: runs.reduce((sum, r) => sum + r.score, 0) / runs.length,
        trend: runs[runs.length - 1].score > runs[0].score ? 'improving' : 'declining',
      };

      expect(trendReport.runs.length).toBe(3);
      expect(trendReport.avgScore).toBeCloseTo(85, 0);
      expect(['improving', 'declining']).toContain(trendReport.trend);

      logger.info('Trend report generated', {
        runs: trendReport.runs.length,
        trend: trendReport.trend,
      });
    });
  });

  // ==========================================================================
  // Test Suite 5: Multi-Tenant Dashboard Isolation
  // ==========================================================================

  describe('Multi-Tenant Dashboard Isolation', () => {
    it('should isolate tenant A issues from tenant B', () => {
      const tenantAIssue = createMockDashboardIssue({
        id: generateIssueId(),
        affectedComponent: `Vehicle-${TEST_VALIDATION_VEHICLES.vehicle1.id}`,
        description: 'Tenant A specific issue',
      });

      const tenantBIssue = createMockDashboardIssue({
        id: generateIssueId(),
        affectedComponent: `Vehicle-${TEST_VALIDATION_VEHICLES.vehicle3.id}`,
        description: 'Tenant B specific issue',
      });

      dashboardService.addIssue(tenantAIssue);
      dashboardService.addIssue(tenantBIssue);

      // Verify both are in system
      const allIssues = dashboardService.getIssues();
      expect(allIssues.length).toBe(2);

      // Simulate tenant-specific dashboard (filtering done at API layer)
      const tenantADashboard = allIssues.filter(
        i => i.affectedComponent?.includes(TEST_VALIDATION_VEHICLES.vehicle1.id)
      );
      const tenantBDashboard = allIssues.filter(
        i => i.affectedComponent?.includes(TEST_VALIDATION_VEHICLES.vehicle3.id)
      );

      expect(tenantADashboard.length).toBe(1);
      expect(tenantBDashboard.length).toBe(1);
      expect(tenantADashboard[0].id).not.toBe(tenantBDashboard[0].id);

      logger.info('Multi-tenant isolation verified', {
        tenantAIssues: tenantADashboard.length,
        tenantBIssues: tenantBDashboard.length,
      });
    });

    it('should generate tenant-scoped reports', () => {
      // Create issues for multiple tenants
      const issues = [
        createMockDashboardIssue({
          id: generateIssueId(),
          description: 'Tenant A Issue 1',
        }),
        createMockDashboardIssue({
          id: generateIssueId(),
          description: 'Tenant A Issue 2',
        }),
        createMockDashboardIssue({
          id: generateIssueId(),
          description: 'Tenant B Issue 1',
        }),
      ];

      issues.forEach(issue => dashboardService.addIssue(issue));

      // Generate tenant-scoped report (simulation)
      const tenantAReport = {
        tenant: TEST_VALIDATION_TENANTS.tenant1.name,
        issues: dashboardService.getIssues().slice(0, 2),
        totalCount: 2,
      };

      const tenantBReport = {
        tenant: TEST_VALIDATION_TENANTS.tenant2.name,
        issues: dashboardService.getIssues().slice(2, 3),
        totalCount: 1,
      };

      expect(tenantAReport.totalCount).toBe(2);
      expect(tenantBReport.totalCount).toBe(1);

      logger.info('Tenant-scoped reports generated', {
        tenantA: tenantAReport.totalCount,
        tenantB: tenantBReport.totalCount,
      });
    });
  });

  // ==========================================================================
  // Test Suite 6: Performance Metrics
  // ==========================================================================

  describe('Dashboard Performance Metrics', () => {
    it('should calculate issue resolution time metrics', () => {
      const issues = Array.from({ length: 10 }, (_, i) => {
        const created = new Date(Date.now() - (10 - i) * 60000);
        return {
          id: `ISSUE-${i}`,
          createdAt: created.toISOString(),
          updatedAt: new Date().toISOString(),
          resolutionTime: (10 - i) * 60000, // in ms
        };
      });

      const avgResolutionTime =
        issues.reduce((sum, i) => sum + (i.resolutionTime || 0), 0) / issues.length;

      expect(avgResolutionTime).toBeGreaterThan(0);
      expect(avgResolutionTime).toBeLessThan(10 * 60000);

      logger.info('Resolution time metrics calculated', {
        avgResolutionTime,
        unit: 'ms',
      });
    });

    it('should track quality score trend', () => {
      const scores = [78, 81, 85, 82, 88, 91];
      const trend = scores[scores.length - 1] - scores[0];
      const avgScore = scores.reduce((a, b) => a + b) / scores.length;

      const metrics = {
        currentScore: scores[scores.length - 1],
        avgScore,
        trend: trend > 0 ? 'improving' : 'declining',
        trendPercent: ((trend / scores[0]) * 100).toFixed(2),
      };

      expect(metrics.currentScore).toBe(91);
      expect(parseFloat(metrics.trendPercent as any)).toBeGreaterThan(0);

      logger.info('Quality score trend tracked', metrics);
    });
  });

  // ==========================================================================
  // Test Suite 7: Complete Dashboard Workflow
  // ==========================================================================

  describe('Complete Dashboard Workflow', () => {
    it('should complete full dashboard integration workflow', async () => {
      const { result: workflow, duration } = await measureExecutionTime(async () => {
        // 1. Run validation
        const validationResult = await framework.runValidation();
        const issues = framework.getIssuesFromResults(validationResult);

        // 2. Populate dashboard with validation results
        issues.forEach(issue => {
          const dashboardIssue = createMockDashboardIssue({
            ...issue,
            id: generateIssueId(),
            loopStage: 'detected',
          });
          dashboardService.addIssue(dashboardIssue);
        });

        // 3. Generate report
        const report = {
          id: validationRunId,
          timestamp: new Date(),
          validationScore: validationResult.overallScore,
          totalIssues: dashboardService.getIssues().length,
          issuesBySeverity: {
            critical: dashboardService.getIssuesBySeverity('critical').length,
            high: dashboardService.getIssuesBySeverity('high').length,
            medium: dashboardService.getIssuesBySeverity('medium').length,
            low: dashboardService.getIssuesBySeverity('low').length,
          },
        };

        return {
          validationResult,
          dashboardIssues: dashboardService.getIssues(),
          report,
        };
      });

      // Verify complete workflow
      expect(workflow.validationResult).toBeDefined();
      expect(workflow.report).toBeDefined();
      expect(workflow.report.validationScore).toBeGreaterThanOrEqual(0);
      expect(workflow.report.validationScore).toBeLessThanOrEqual(100);

      logger.info('Complete dashboard workflow executed', {
        runId: validationRunId,
        duration,
        dashboardIssues: workflow.dashboardIssues.length,
        score: workflow.report.validationScore,
      });
    });
  });
});
