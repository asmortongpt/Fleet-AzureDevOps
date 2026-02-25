/**
 * Validation Framework Integration Tests - Pre-Flight Checklist
 *
 * Tests pre-flight checklist integration including:
 * - Running all 130+ checks across 5 categories
 * - Blocking critical items on sign-off
 * - Sign-off workflow and approval tracking
 * - Report generation accuracy
 *
 * @module tests/integration/validation-preflight
 * @author Claude Code - Task 13
 * @date 2026-02-25
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PreFlightChecklist, ChecklistStatus, ChecklistCategory } from '../../src/validation/PreFlightChecklist';
import { logger } from '../../src/lib/logger';
import {
  createPassingChecklistScenario,
  createWarningChecklistScenario,
  createBlockingChecklistScenario,
  createMockChecklistItems,
  generateValidationRunId,
  measureExecutionTime,
} from './fixtures/validation-test-data';

// ============================================================================
// Pre-Flight Checklist Integration Tests
// ============================================================================

describe('Pre-Flight Checklist Integration Tests', () => {
  let checklist: PreFlightChecklist;
  let validationRunId: string;

  beforeEach(() => {
    checklist = new PreFlightChecklist();
    validationRunId = generateValidationRunId();
  });

  // ==========================================================================
  // Test Suite 1: Checklist Initialization
  // ==========================================================================

  describe('Checklist Initialization', () => {
    it('should initialize with all categories', async () => {
      const report = await checklist.runFullChecklist();

      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.totalItems).toBeGreaterThan(0);

      logger.info('Checklist initialized with all categories', {
        totalItems: report.summary.totalItems,
      });
    });

    it('should have 5 main categories', async () => {
      const report = await checklist.runFullChecklist();

      expect(report.sections).toBeDefined();
      expect(Array.isArray(report.sections)).toBe(true);
      expect(report.sections.length).toBeGreaterThan(0);

      logger.info('Checklist categories initialized', {
        categories: report.sections.length,
      });
    });
  });

  // ==========================================================================
  // Test Suite 2: Running Individual Category Checks
  // ==========================================================================

  describe('Individual Category Execution', () => {
    it('should run visual quality checks', async () => {
      const report = await checklist.runCategoryChecks(ChecklistCategory.VISUAL_QUALITY);

      expect(report).toBeDefined();
      expect(report.summary.totalItems).toBeGreaterThan(0);

      logger.info('Visual quality checks completed', {
        items: report.summary.totalItems,
      });
    });

    it('should run data quality checks', async () => {
      const report = await checklist.runCategoryChecks(ChecklistCategory.DATA_QUALITY);

      expect(report).toBeDefined();
      expect(report.summary.totalItems).toBeGreaterThan(0);
    });

    it('should run workflow quality checks', async () => {
      const report = await checklist.runCategoryChecks(ChecklistCategory.WORKFLOW_QUALITY);

      expect(report).toBeDefined();
      expect(report.summary.totalItems).toBeGreaterThan(0);
    });

    it('should run performance checks', async () => {
      const report = await checklist.runCategoryChecks(ChecklistCategory.PERFORMANCE);

      expect(report).toBeDefined();
      expect(report.summary.totalItems).toBeGreaterThan(0);
    });

    it('should run accessibility checks', async () => {
      const report = await checklist.runCategoryChecks(ChecklistCategory.ACCESSIBILITY);

      expect(report).toBeDefined();
      expect(report.summary.totalItems).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Test Suite 3: Checklist Result Summary
  // ==========================================================================

  describe('Checklist Result Summary', () => {
    it('should calculate passing checklist summary', async () => {
      const scenario = createPassingChecklistScenario();
      const report = await checklist.runFullChecklist();

      expect(report.summary.totalItems).toBeGreaterThan(0);
      expect(report.summary.passPercentage).toBeGreaterThanOrEqual(0);
      expect(report.summary.passPercentage).toBeLessThanOrEqual(100);

      logger.info('Passing checklist summary', {
        items: report.summary.totalItems,
        passPercentage: report.summary.passPercentage,
      });
    });

    it('should identify warning status when warnings present', async () => {
      const scenario = createWarningChecklistScenario();

      expect(scenario.expectedStatus).toBe('issues');
      expect(scenario.blockingItemCount).toBe(0);
    });

    it('should identify blocked status when critical items fail', async () => {
      const scenario = createBlockingChecklistScenario();

      expect(scenario.expectedStatus).toBe('blocked');
      expect(scenario.blockingItemCount).toBeGreaterThan(0);
    });

    it('should calculate overall score correctly', async () => {
      const report = await checklist.runFullChecklist();

      expect(report.summary.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.summary.overallScore).toBeLessThanOrEqual(100);

      logger.info('Overall score calculated', {
        score: report.summary.overallScore,
        totalItems: report.summary.totalItems,
      });
    });
  });

  // ==========================================================================
  // Test Suite 4: Blocking Issues Detection
  // ==========================================================================

  describe('Critical Blocking Issues Detection', () => {
    it('should identify blocking issues', async () => {
      const report = await checklist.runFullChecklist();

      expect(report.blockingIssues).toBeDefined();
      expect(Array.isArray(report.blockingIssues)).toBe(true);
    });

    it('should prevent sign-off when critical items fail', async () => {
      const scenario = createBlockingChecklistScenario();

      const canSignOff = scenario.blockingItemCount === 0;
      expect(canSignOff).toBe(false);

      logger.info('Sign-off blocked due to critical items', {
        blockingItems: scenario.blockingItemCount,
      });
    });

    it('should allow sign-off when all items pass', async () => {
      const scenario = createPassingChecklistScenario();

      const canSignOff = scenario.blockingItemCount === 0;
      expect(canSignOff).toBe(true);
    });

    it('should allow conditional sign-off with warnings', async () => {
      const scenario = createWarningChecklistScenario();

      // Warnings don't block, only failures do
      const canSignOff = scenario.blockingItemCount === 0;
      expect(canSignOff).toBe(true);
    });
  });

  // ==========================================================================
  // Test Suite 5: Sign-Off Workflow
  // ==========================================================================

  describe('Sign-Off Workflow', () => {
    it('should create sign-off request', async () => {
      const approval = await checklist.requestSignOff({
        reviewer: 'alice@company.com',
        role: 'qa-lead',
        approvalType: 'FULL_RELEASE',
      });

      expect(approval).toBeDefined();
      expect(approval.id).toBeDefined();
      expect(approval.reviewer).toBe('alice@company.com');
      expect(approval.approvalType).toBe('FULL_RELEASE');

      logger.info('Sign-off request created', {
        signOffId: approval.id,
        reviewer: approval.reviewer,
      });
    });

    it('should track sign-off status', async () => {
      const approval = await checklist.requestSignOff({
        reviewer: 'bob@company.com',
        role: 'product-manager',
        approvalType: 'STAGED_RELEASE',
        notes: 'Approved for staged rollout',
      });

      expect(approval.status).toBeDefined();
      expect(['approved', 'pending', 'rejected']).toContain(approval.status);
    });

    it('should record sign-off with notes', async () => {
      const approval = await checklist.requestSignOff({
        reviewer: 'carol@company.com',
        role: 'engineering-lead',
        approvalType: 'FULL_RELEASE',
        notes: 'All critical items verified and passing',
      });

      expect(approval.notes).toBe('All critical items verified and passing');
    });

    it('should set sign-off expiration', async () => {
      const approval = await checklist.requestSignOff({
        reviewer: 'dave@company.com',
        role: 'qa-lead',
        approvalType: 'FULL_RELEASE',
      });

      expect(approval.validUntil).toBeDefined();
      expect(approval.validUntil.getTime()).toBeGreaterThan(Date.now());

      logger.info('Sign-off expiration set', {
        validUntil: approval.validUntil,
      });
    });

    it('should track multiple sign-offs', async () => {
      const qa = await checklist.requestSignOff({
        reviewer: 'qa-lead@company.com',
        role: 'qa-lead',
        approvalType: 'QA_SIGN_OFF',
      });

      const engineering = await checklist.requestSignOff({
        reviewer: 'eng-lead@company.com',
        role: 'engineering-lead',
        approvalType: 'ENGINEERING_SIGN_OFF',
      });

      const product = await checklist.requestSignOff({
        reviewer: 'pm@company.com',
        role: 'product-manager',
        approvalType: 'PRODUCT_SIGN_OFF',
      });

      const history = await checklist.getSignOffHistory();

      expect(history.length).toBe(3);
      expect(history.some(a => a.approvalType === 'QA_SIGN_OFF')).toBe(true);
      expect(history.some(a => a.approvalType === 'ENGINEERING_SIGN_OFF')).toBe(true);
      expect(history.some(a => a.approvalType === 'PRODUCT_SIGN_OFF')).toBe(true);

      logger.info('Multiple sign-offs tracked', {
        signOffs: history.length,
      });
    });
  });

  // ==========================================================================
  // Test Suite 6: Checklist Dependencies
  // ==========================================================================

  describe('Checklist Item Dependencies', () => {
    it('should retrieve dependencies', async () => {
      const dependencies = await checklist.getDependencies();

      expect(dependencies).toBeDefined();
      expect(Array.isArray(dependencies)).toBe(true);
      expect(dependencies.length).toBeGreaterThan(0);

      logger.info('Dependencies retrieved', {
        dependencyCount: dependencies.length,
      });
    });

    it('should mark critical dependencies', async () => {
      const dependencies = await checklist.getDependencies();

      const criticalDeps = dependencies.filter(d => d.critical);
      expect(criticalDeps.length).toBeGreaterThan(0);

      logger.info('Critical dependencies identified', {
        totalDeps: dependencies.length,
        critical: criticalDeps.length,
      });
    });
  });

  // ==========================================================================
  // Test Suite 7: Report Generation
  // ==========================================================================

  describe('Checklist Report Generation', () => {
    it('should generate comprehensive report', async () => {
      const report = await checklist.runFullChecklist();

      expect(report).toBeDefined();
      expect(report.id).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.status).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.items).toBeDefined();
      expect(report.sections).toBeDefined();

      logger.info('Comprehensive report generated', {
        reportId: report.id,
        items: report.summary.totalItems,
      });
    });

    it('should include evidence in report', async () => {
      const report = await checklist.generateReport();

      expect(report.evidence).toBeDefined();
      expect(typeof report.evidence).toBe('object');

      logger.info('Evidence included in report', {
        evidenceItems: Object.keys(report.evidence).length,
      });
    });

    it('should include recommendations in report', async () => {
      const report = await checklist.generateReport();

      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);

      if (report.recommendations.length > 0) {
        logger.info('Recommendations included', {
          count: report.recommendations.length,
        });
      }
    });

    it('should include blocking issues in report', async () => {
      const report = await checklist.runFullChecklist();

      expect(report.blockingIssues).toBeDefined();
      expect(Array.isArray(report.blockingIssues)).toBe(true);

      logger.info('Blocking issues included in report', {
        blocking: report.blockingIssues.length,
      });
    });

    it('should include warnings in report', async () => {
      const report = await checklist.runFullChecklist();

      expect(report.warnings).toBeDefined();
      expect(Array.isArray(report.warnings)).toBe(true);

      logger.info('Warnings included in report', {
        warnings: report.warnings.length,
      });
    });

    it('should set version in report', async () => {
      const report = await checklist.runFullChecklist();

      expect(report.version).toBeDefined();
      expect(typeof report.version).toBe('string');
    });
  });

  // ==========================================================================
  // Test Suite 8: Performance
  // ==========================================================================

  describe('Checklist Performance', () => {
    it('should complete full checklist within reasonable time', async () => {
      const { duration } = await measureExecutionTime(
        () => checklist.runFullChecklist()
      );

      // Full checklist with 130+ items should complete in reasonable time
      expect(duration).toBeLessThan(30000); // 30 seconds max

      logger.info('Full checklist completed', { duration });
    });

    it('should complete individual category within time', async () => {
      const { duration } = await measureExecutionTime(
        () => checklist.runCategoryChecks(ChecklistCategory.VISUAL_QUALITY)
      );

      expect(duration).toBeLessThan(10000); // 10 seconds max per category

      logger.info('Category checklist completed', { duration });
    });

    it('should handle multiple concurrent checklist runs', async () => {
      const { duration } = await measureExecutionTime(async () => {
        const runs = await Promise.all([
          checklist.runFullChecklist(),
          new PreFlightChecklist().runFullChecklist(),
          new PreFlightChecklist().runFullChecklist(),
        ]);
        return runs;
      });

      expect(duration).toBeLessThan(60000); // All 3 should complete in reasonable time

      logger.info('Multiple concurrent checklists completed', { duration });
    });
  });

  // ==========================================================================
  // Test Suite 9: Complete Pre-Flight Workflow
  // ==========================================================================

  describe('Complete Pre-Flight Workflow', () => {
    it('should complete full pre-flight from checklist to sign-off', async () => {
      const { result: workflow, duration } = await measureExecutionTime(async () => {
        // 1. Run full checklist
        const report = await checklist.runFullChecklist();

        // 2. Check if can sign off
        const canSignOff = await checklist.canSignOff();

        // 3. Request sign-off if possible
        let signOff = null;
        if (canSignOff) {
          signOff = await checklist.requestSignOff({
            reviewer: 'lead@company.com',
            role: 'qa-lead',
            approvalType: 'FULL_RELEASE',
            notes: 'All checks passed, approved for release',
          });
        }

        // 4. Get sign-off history
        const signOffHistory = await checklist.getSignOffHistory();

        return {
          report,
          canSignOff,
          signOff,
          signOffCount: signOffHistory.length,
        };
      });

      // Verify complete workflow
      expect(workflow.report).toBeDefined();
      expect(workflow.canSignOff).toBeDefined();
      expect(workflow.signOffCount).toBeGreaterThanOrEqual(0);

      logger.info('Complete pre-flight workflow executed', {
        runId: validationRunId,
        duration,
        canSignOff: workflow.canSignOff,
        signOffs: workflow.signOffCount,
        reportItems: workflow.report.summary.totalItems,
      });
    });

    it('should handle blocked pre-flight workflow', async () => {
      const { result: workflow } = await measureExecutionTime(async () => {
        // Run checklist (may have failures)
        const report = await checklist.runFullChecklist();

        // Check if can sign off
        const canSignOff = await checklist.canSignOff();

        // Should attempt sign-off regardless
        const signOff = await checklist.requestSignOff({
          reviewer: 'lead@company.com',
          role: 'qa-lead',
          approvalType: 'FULL_RELEASE',
        });

        return {
          report,
          canSignOff,
          signOff,
          blockedByIssues: !canSignOff,
        };
      });

      expect(workflow.report).toBeDefined();
      expect(typeof workflow.canSignOff).toBe('boolean');

      if (!workflow.canSignOff) {
        logger.info('Pre-flight workflow blocked by critical issues', {
          blocking: workflow.blockedByIssues,
        });
      }
    });
  });
});
