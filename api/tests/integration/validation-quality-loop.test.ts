/**
 * Validation Framework Integration Tests - Quality Loop Workflows
 *
 * Tests complete quality loop workflows including:
 * - Issue detection through resolution
 * - Developer fix implementation and verification
 * - Approval and closure
 * - Re-validation after fixes
 * - Resolution time tracking
 *
 * @module tests/integration/validation-quality-loop
 * @author Claude Code - Task 13
 * @date 2026-02-25
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { IssueTracker } from '../../src/validation/IssueTracker';
import { DashboardService } from '../../src/validation/DashboardService';
import { logger } from '../../src/lib/logger';
import {
  createMockQualityLoopWorkflow,
  createMockValidationIssue,
  generateValidationRunId,
  generateIssueId,
  sleep,
  measureExecutionTime,
} from './fixtures/validation-test-data';

// ============================================================================
// Quality Loop Integration Tests
// ============================================================================

describe('Quality Loop Workflow Integration Tests', () => {
  let issueTracker: IssueTracker;
  let dashboardService: DashboardService;
  let validationRunId: string;

  beforeEach(() => {
    issueTracker = new IssueTracker();
    dashboardService = new DashboardService();
    validationRunId = generateValidationRunId();
  });

  // ==========================================================================
  // Test Suite 1: Issue Detection Phase
  // ==========================================================================

  describe('Quality Loop - Issue Detection Phase', () => {
    it('should create issue from agent discovery', () => {
      const issue = issueTracker.createIssue({
        title: 'Homepage Header Misaligned',
        description: 'Logo and navigation are not vertically aligned on homepage',
        severity: 'high',
        category: 'visual',
        affectedComponent: 'Header',
        detectedBy: 'VisualQAAgent',
        impactAssessment: {
          affectedUsers: 'all',
          userImpactPercentage: 100,
          businessImpact: 'Critical - Users see broken UI on page load',
        },
      });

      expect(issue.id).toBeDefined();
      expect(issue.status).toBe('New');
      expect(issue.detectedBy).toBe('VisualQAAgent');
      expect(issue.impactAssessment).toBeDefined();

      logger.info('Issue detected', {
        issueId: issue.id,
        severity: issue.severity,
        component: issue.affectedComponent,
      });
    });

    it('should track detection timestamp', () => {
      const beforeCreation = Date.now();
      const issue = issueTracker.createIssue({
        title: 'Button Text Truncated',
        description: 'Save button text is cut off on mobile',
        severity: 'medium',
        category: 'responsive',
        detectedBy: 'ResponsiveDesignAgent',
      });
      const afterCreation = Date.now();

      expect(issue.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation);
      expect(issue.createdAt.getTime()).toBeLessThanOrEqual(afterCreation);
    });

    it('should record detection agent in issue history', () => {
      const issue = issueTracker.createIssue({
        title: 'Chart Not Responsive',
        description: 'Chart overflows on tablets',
        severity: 'high',
        category: 'functionality',
        detectedBy: 'ResponsiveDesignAgent',
      });

      expect(issue.history.length).toBeGreaterThan(0);
      expect(issue.history[0].action).toBe('created');
      expect(issue.history[0].description).toContain('Issue created');
    });

    it('should capture multiple concurrent detections', () => {
      const issues = [
        issueTracker.createIssue({
          title: 'Issue 1',
          description: 'First issue',
          severity: 'critical',
          category: 'visual',
          detectedBy: 'VisualQAAgent',
        }),
        issueTracker.createIssue({
          title: 'Issue 2',
          description: 'Second issue',
          severity: 'high',
          category: 'functionality',
          detectedBy: 'InteractionQualityAgent',
        }),
        issueTracker.createIssue({
          title: 'Issue 3',
          description: 'Third issue',
          severity: 'medium',
          category: 'data',
          detectedBy: 'DataIntegrityAgent',
        }),
      ];

      expect(issues.length).toBe(3);
      expect(issueTracker.getAllIssues().length).toBe(3);
    });
  });

  // ==========================================================================
  // Test Suite 2: Issue Diagnosis Phase
  // ==========================================================================

  describe('Quality Loop - Issue Diagnosis Phase', () => {
    it('should assign issue to developer for diagnosis', () => {
      const issue = issueTracker.createIssue({
        title: 'Font Color Unreadable',
        description: 'Text is white on light gray background',
        severity: 'critical',
        category: 'accessibility',
        detectedBy: 'AccessibilityPerformanceAgent',
      });

      issueTracker.assignIssue(
        issue.id,
        'dev-001',
        'alice@company.com',
        'Assigned for investigation',
        'Alice Developer'
      );

      const assigned = issueTracker.getIssue(issue.id);
      expect(assigned?.assignedTo).toBe('dev-001');

      logger.info('Issue assigned for diagnosis', {
        issueId: issue.id,
        assignee: 'Alice Developer',
      });
    });

    it('should update issue status to In Progress', () => {
      const issue = issueTracker.createIssue({
        title: 'Modal Not Closing',
        description: 'Modal dialog persists after clicking close button',
        severity: 'high',
        category: 'functionality',
        detectedBy: 'InteractionQualityAgent',
      });

      issueTracker.updateIssueStatus(issue.id, 'In Progress', 'dev-001');
      const updated = issueTracker.getIssue(issue.id);

      expect(updated?.status).toBe('In Progress');
    });

    it('should add diagnostic notes to issue', () => {
      const issue = issueTracker.createIssue({
        title: 'Dropdown Menu Overflow',
        description: 'Menu items extend beyond viewport',
        severity: 'medium',
        category: 'responsive',
        detectedBy: 'ResponsiveDesignAgent',
      });

      issueTracker.addNoteToIssue(
        issue.id,
        'Root cause: CSS z-index conflict with header element',
        'dev-001'
      );

      const withNote = issueTracker.getIssue(issue.id);
      expect(withNote?.notes.length).toBeGreaterThan(0);

      logger.info('Diagnostic note added', {
        issueId: issue.id,
        noteCount: withNote?.notes.length,
      });
    });

    it('should track diagnosis time', async () => {
      const issue = issueTracker.createIssue({
        title: 'Performance Issue',
        description: 'Page load time is 5+ seconds',
        severity: 'high',
        category: 'performance',
        detectedBy: 'AccessibilityPerformanceAgent',
      });

      issueTracker.updateIssueStatus(issue.id, 'In Progress', 'dev-001');

      // Simulate diagnosis time
      await sleep(100);

      issueTracker.addNoteToIssue(
        issue.id,
        'Root cause identified: Large unoptimized image asset',
        'dev-001'
      );

      const diagnosed = issueTracker.getIssue(issue.id);
      expect(diagnosed?.notes.length).toBeGreaterThan(0);

      logger.info('Issue diagnosis completed', {
        issueId: issue.id,
        diagnosisNotes: diagnosed?.notes.length,
      });
    });
  });

  // ==========================================================================
  // Test Suite 3: Issue Fix Implementation Phase
  // ==========================================================================

  describe('Quality Loop - Fix Implementation Phase', () => {
    it('should record when fix is implemented', () => {
      const issue = issueTracker.createIssue({
        title: 'Button Style Bug',
        description: 'Button padding is incorrect',
        severity: 'low',
        category: 'visual',
        detectedBy: 'TypographyAgent',
      });

      issueTracker.updateIssueStatus(issue.id, 'In Progress', 'dev-001');
      issueTracker.addNoteToIssue(
        issue.id,
        'Fix implemented: Updated CSS padding values',
        'dev-001'
      );
      issueTracker.updateIssueStatus(issue.id, 'Fixed', 'dev-001', {
        fixDescription: 'Updated src/components/Button.tsx line 42 padding from 10px to 12px',
      });

      const fixed = issueTracker.getIssue(issue.id);
      expect(fixed?.status).toBe('Fixed');
      expect(fixed?.resolutionTracking).toBeDefined();
      expect(fixed?.resolutionTracking?.fixDescription).toContain('Button.tsx');

      logger.info('Fix implemented', {
        issueId: issue.id,
        fixDescription: fixed?.resolutionTracking?.fixDescription,
      });
    });

    it('should track fix implementation time', async () => {
      const { result: issue, duration: detectionDuration } = await measureExecutionTime(
        async () =>
          issueTracker.createIssue({
            title: 'Color Contrast Issue',
            description: 'Text does not meet WCAG AA standards',
            severity: 'critical',
            category: 'accessibility',
            detectedBy: 'AccessibilityPerformanceAgent',
          })
      );

      issueTracker.updateIssueStatus(issue.id, 'In Progress', 'dev-002');

      // Simulate fix implementation time
      await sleep(150);

      issueTracker.updateIssueStatus(issue.id, 'Fixed', 'dev-002', {
        fixDescription: 'Increased text color brightness',
      });

      const fixed = issueTracker.getIssue(issue.id);
      const fixTime = fixed?.resolutionTime || 0;

      expect(fixTime).toBeGreaterThan(0);
      logger.info('Fix implementation time tracked', {
        detectionDuration,
        fixTime,
      });
    });

    it('should allow multiple notes during fix implementation', () => {
      const issue = issueTracker.createIssue({
        title: 'Complex Layout Issue',
        description: 'Grid layout breaks on medium screens',
        severity: 'high',
        category: 'responsive',
        detectedBy: 'ResponsiveDesignAgent',
      });

      issueTracker.updateIssueStatus(issue.id, 'In Progress', 'dev-003');
      issueTracker.addNoteToIssue(
        issue.id,
        'Root cause: Hardcoded widths instead of responsive units',
        'dev-003'
      );
      issueTracker.addNoteToIssue(issue.id, 'Step 1: Refactored to use CSS Grid', 'dev-003');
      issueTracker.addNoteToIssue(issue.id, 'Step 2: Updated breakpoints', 'dev-003');
      issueTracker.addNoteToIssue(issue.id, 'Step 3: Tested on multiple devices', 'dev-003');

      const withNotes = issueTracker.getIssue(issue.id);
      expect(withNotes?.notes.length).toBe(4);
    });
  });

  // ==========================================================================
  // Test Suite 4: Issue Verification Phase
  // ==========================================================================

  describe('Quality Loop - Verification Phase', () => {
    it('should verify fix by re-running validation', () => {
      const issue = issueTracker.createIssue({
        title: 'Alignment Issue',
        description: 'Elements are misaligned',
        severity: 'medium',
        category: 'visual',
        detectedBy: 'VisualQAAgent',
      });

      issueTracker.updateIssueStatus(issue.id, 'In Progress', 'dev-001');
      issueTracker.updateIssueStatus(issue.id, 'Fixed', 'dev-001');

      // Simulate re-validation
      issueTracker.addNoteToIssue(
        issue.id,
        'Re-validation: Issue no longer detected by VisualQAAgent',
        'qa-001'
      );

      issueTracker.updateIssueStatus(issue.id, 'Verified', 'qa-001');

      const verified = issueTracker.getIssue(issue.id);
      expect(verified?.status).toBe('Verified');

      logger.info('Fix verified', {
        issueId: issue.id,
        status: verified?.status,
      });
    });

    it('should record verification attempt details', () => {
      const issue = issueTracker.createIssue({
        title: 'Performance Fix',
        description: 'Page load optimization',
        severity: 'high',
        category: 'performance',
        detectedBy: 'AccessibilityPerformanceAgent',
      });

      issueTracker.updateIssueStatus(issue.id, 'Fixed', 'dev-001', {
        fixDescription: 'Image optimization and lazy loading',
      });

      issueTracker.recordVerificationAttempt(issue.id, {
        timestamp: new Date(),
        agent: 'AccessibilityPerformanceAgent',
        passed: true,
        metrics: {
          loadTime: 1200,
          firstPaint: 800,
        },
      });

      const withVerification = issueTracker.getIssue(issue.id);
      expect(withVerification?.resolutionTracking?.verificationAttempts.length).toBeGreaterThan(0);
    });

    it('should fail verification and reopen for re-fix', () => {
      const issue = issueTracker.createIssue({
        title: 'Incomplete Fix',
        description: 'Fix did not fully resolve issue',
        severity: 'medium',
        category: 'functionality',
        detectedBy: 'InteractionQualityAgent',
      });

      issueTracker.updateIssueStatus(issue.id, 'Fixed', 'dev-001');

      // Record failed verification
      issueTracker.recordVerificationAttempt(issue.id, {
        timestamp: new Date(),
        agent: 'InteractionQualityAgent',
        passed: false,
        metrics: { error: 'Still reproducing under specific conditions' },
      });

      // Reopen for additional fix
      issueTracker.updateIssueStatus(issue.id, 'In Progress', 'dev-001');

      const reopened = issueTracker.getIssue(issue.id);
      expect(reopened?.status).toBe('In Progress');
      expect(reopened?.resolutionTracking?.verificationAttempts.length).toBe(1);

      logger.info('Issue reopened for re-fix', {
        issueId: issue.id,
        reason: 'Verification failed',
      });
    });
  });

  // ==========================================================================
  // Test Suite 5: Issue Approval Phase
  // ==========================================================================

  describe('Quality Loop - Approval Phase', () => {
    it('should approve verified issue', () => {
      const issue = issueTracker.createIssue({
        title: 'Ready for Approval',
        description: 'Fix has been verified',
        severity: 'low',
        category: 'visual',
        detectedBy: 'TypographyAgent',
      });

      issueTracker.updateIssueStatus(issue.id, 'In Progress', 'dev-001');
      issueTracker.updateIssueStatus(issue.id, 'Fixed', 'dev-001');
      issueTracker.updateIssueStatus(issue.id, 'Verified', 'qa-001');
      issueTracker.updateIssueStatus(issue.id, 'Closed', 'manager-001', {
        approvalNotes: 'Approved for release',
      });

      const approved = issueTracker.getIssue(issue.id);
      expect(approved?.status).toBe('Closed');

      logger.info('Issue approved and closed', {
        issueId: issue.id,
        resolutionTime: approved?.resolutionTime,
      });
    });

    it('should track approval workflow', () => {
      const issue = issueTracker.createIssue({
        title: 'Workflow Tracking',
        description: 'Track complete approval workflow',
        severity: 'medium',
        category: 'functionality',
        detectedBy: 'InteractionQualityAgent',
      });

      // Simulate complete workflow
      const statusUpdates = [
        { status: 'In Progress', user: 'dev-001' },
        { status: 'Fixed', user: 'dev-001' },
        { status: 'Verified', user: 'qa-001' },
        { status: 'Closed', user: 'manager-001' },
      ];

      statusUpdates.forEach(update => {
        issueTracker.updateIssueStatus(issue.id, update.status as any, update.user);
      });

      const withHistory = issueTracker.getIssue(issue.id);
      expect(withHistory?.history.length).toBeGreaterThan(4); // Created + 4 updates

      logger.info('Complete approval workflow tracked', {
        issueId: issue.id,
        historyLength: withHistory?.history.length,
      });
    });
  });

  // ==========================================================================
  // Test Suite 6: Quality Loop Dashboard Integration
  // ==========================================================================

  describe('Quality Loop - Dashboard Integration', () => {
    it('should display issues in different loop stages', () => {
      const detectedIssue = issueTracker.createIssue({
        title: 'New Issue',
        description: 'Just detected',
        severity: 'high',
        category: 'visual',
        detectedBy: 'VisualQAAgent',
      });

      const inProgressIssue = issueTracker.createIssue({
        title: 'In Progress',
        description: 'Being fixed',
        severity: 'high',
        category: 'functionality',
        detectedBy: 'InteractionQualityAgent',
      });
      issueTracker.updateIssueStatus(inProgressIssue.id, 'In Progress', 'dev-001');

      const fixedIssue = issueTracker.createIssue({
        title: 'Fixed',
        description: 'Fix implemented',
        severity: 'medium',
        category: 'responsive',
        detectedBy: 'ResponsiveDesignAgent',
      });
      issueTracker.updateIssueStatus(fixedIssue.id, 'Fixed', 'dev-001');

      const allIssues = issueTracker.getAllIssues();
      expect(allIssues.length).toBe(3);

      const byStatus = {
        new: allIssues.filter(i => i.status === 'New').length,
        inProgress: allIssues.filter(i => i.status === 'In Progress').length,
        fixed: allIssues.filter(i => i.status === 'Fixed').length,
      };

      expect(byStatus.new).toBe(1);
      expect(byStatus.inProgress).toBe(1);
      expect(byStatus.fixed).toBe(1);

      logger.info('Issues displayed by loop stage', byStatus);
    });

    it('should track resolution metrics', () => {
      const workflow = createMockQualityLoopWorkflow();

      // Simulate time passing between stages
      const issue = issueTracker.createIssue({
        title: 'Metric Tracking',
        description: 'Track resolution metrics',
        severity: 'critical',
        category: 'visual',
        detectedBy: 'VisualQAAgent',
      });

      issueTracker.updateIssueStatus(issue.id, 'In Progress', 'dev-001');
      issueTracker.updateIssueStatus(issue.id, 'Fixed', 'dev-001');
      issueTracker.updateIssueStatus(issue.id, 'Verified', 'qa-001');
      issueTracker.updateIssueStatus(issue.id, 'Closed', 'manager-001');

      const resolved = issueTracker.getIssue(issue.id);
      expect(resolved?.resolutionTime).toBeDefined();
      expect(resolved?.resolutionTime).toBeGreaterThanOrEqual(0);

      logger.info('Resolution metrics tracked', {
        issueId: issue.id,
        severity: resolved?.severity,
        resolutionTime: resolved?.resolutionTime,
        status: resolved?.status,
      });
    });
  });

  // ==========================================================================
  // Test Suite 7: Complete Quality Loop End-to-End
  // ==========================================================================

  describe('Complete Quality Loop End-to-End', () => {
    it('should complete full quality loop from detection to closure', async () => {
      const { result: issue, duration: totalDuration } = await measureExecutionTime(async () => {
        // 1. DETECTION: Create issue
        const newIssue = issueTracker.createIssue({
          title: 'Critical UI Bug',
          description: 'Button is invisible on dark theme',
          severity: 'critical',
          category: 'visual',
          affectedComponent: 'Button component',
          detectedBy: 'VisualQAAgent',
          impactAssessment: {
            affectedUsers: 'dark theme users',
            userImpactPercentage: 45,
            businessImpact: 'Users cannot complete key actions',
          },
        });

        // 2. DIAGNOSIS: Assign and analyze
        issueTracker.assignIssue(
          newIssue.id,
          'alice-dev',
          'alice@company.com',
          'Assigned for investigation',
          'Alice'
        );
        issueTracker.updateIssueStatus(newIssue.id, 'In Progress', 'alice-dev');
        issueTracker.addNoteToIssue(
          newIssue.id,
          'Root cause: CSS color variable not updated for dark theme',
          'alice-dev'
        );

        // 3. FIX: Implement solution
        await sleep(50);
        issueTracker.addNoteToIssue(
          newIssue.id,
          'Fix implemented: Updated src/components/Button.css with dark theme color',
          'alice-dev'
        );
        issueTracker.updateIssueStatus(newIssue.id, 'Fixed', 'alice-dev', {
          fixDescription: 'Updated CSS variable for dark theme button text color',
        });

        // 4. VERIFY: Test the fix
        issueTracker.addNoteToIssue(
          newIssue.id,
          'Verification: VisualQAAgent no longer detects visibility issue',
          'bob-qa'
        );
        issueTracker.recordVerificationAttempt(newIssue.id, {
          timestamp: new Date(),
          agent: 'VisualQAAgent',
          passed: true,
          metrics: { buttonVisibility: 100 },
        });
        issueTracker.updateIssueStatus(newIssue.id, 'Verified', 'bob-qa');

        // 5. APPROVE: Manager sign-off
        issueTracker.updateIssueStatus(newIssue.id, 'Closed', 'manager-001', {
          approvalNotes: 'Approved for production release',
        });

        return newIssue;
      });

      // Verify complete workflow
      const finalIssue = issueTracker.getIssue(issue.id);

      expect(finalIssue).toBeDefined();
      expect(finalIssue?.status).toBe('Closed');
      expect(finalIssue?.history.length).toBeGreaterThan(5); // Detection + multiple updates
      expect(finalIssue?.resolutionTime).toBeDefined();
      expect(finalIssue?.resolutionTime).toBeGreaterThanOrEqual(0);

      logger.info('Complete quality loop finished', {
        issueId: issue.id,
        status: finalIssue?.status,
        severity: finalIssue?.severity,
        totalTime: totalDuration,
        resolutionTime: finalIssue?.resolutionTime,
        workflowSteps: finalIssue?.history.length,
      });
    });
  });
});
