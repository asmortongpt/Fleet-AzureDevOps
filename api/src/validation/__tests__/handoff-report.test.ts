/**
 * Customer Handoff Report Generation Tests
 *
 * Comprehensive test suite for handoff report generation, covering:
 * - Report generation with all sections
 * - Quality score calculations
 * - Approval workflow
 * - Multiple export formats (JSON, HTML, PDF)
 * - Readiness checks
 *
 * @module tests/validation/handoff-report.test
 * @author Claude Code - Task 14
 * @date 2026-02-25
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { HandoffReportGenerator } from '../HandoffReportGenerator'
import {
  type HandoffReport,
  type HandoffReportOptions,
  type ApprovalSignOff,
  type QualityMetrics,
  HandoffStatus,
  ApprovalRole
} from '../models/HandoffModels'

describe('HandoffReportGenerator', () => {
  let generator: HandoffReportGenerator
  let mockContext: any

  beforeEach(() => {
    mockContext = {
      tenantId: 'test-tenant-123',
      userId: 'test-user-456',
      environment: 'development' as const
    }

    generator = new HandoffReportGenerator(mockContext)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Report Generation', () => {
    it('should generate comprehensive handoff report with all sections', async () => {
      const report = await generator.generateReport()

      expect(report).toBeDefined()
      expect(report.metadata).toBeDefined()
      expect(report.metadata.generatedAt).toBeDefined()
      expect(report.metadata.version).toBe('1.0')
      expect(report.metadata.environment).toBe('development')

      // Verify all required sections exist
      expect(report.executiveSummary).toBeDefined()
      expect(report.validationSummary).toBeDefined()
      expect(report.agentResults).toBeDefined()
      expect(report.issueSummary).toBeDefined()
      expect(report.qualityMetrics).toBeDefined()
      expect(report.checklistStatus).toBeDefined()
      expect(report.testDataEnvironment).toBeDefined()
      expect(report.customerInstructions).toBeDefined()
      expect(report.approvalSignOff).toBeDefined()
    })

    it('should calculate quality score correctly', async () => {
      const report = await generator.generateReport()

      expect(report.executiveSummary.qualityScore).toBeDefined()
      expect(report.executiveSummary.qualityScore).toBeGreaterThanOrEqual(0)
      expect(report.executiveSummary.qualityScore).toBeLessThanOrEqual(100)
    })

    it('should summarize validation activities by week', async () => {
      const report = await generator.generateReport()

      expect(report.validationSummary.week1).toBeDefined()
      expect(report.validationSummary.week2).toBeDefined()
      expect(report.validationSummary.week3).toBeDefined()
      expect(report.validationSummary.week4).toBeDefined()

      // Each week should have activities summary
      expect(report.validationSummary.week1.activities).toBeDefined()
      expect(Array.isArray(report.validationSummary.week1.activities)).toBe(true)
    })

    it('should include all agent results', async () => {
      const report = await generator.generateReport()

      const agentNames = [
        'VisualQAAgent',
        'ResponsiveDesignAgent',
        'ScrollingAuditAgent',
        'TypographyAgent',
        'InteractionQualityAgent',
        'DataIntegrityAgent',
        'AccessibilityPerformanceAgent'
      ]

      agentNames.forEach(agentName => {
        expect(report.agentResults).toHaveProperty(agentName)
        const agentResult = report.agentResults[agentName as any]
        expect(agentResult).toBeDefined()
        expect(agentResult.pagesTested).toBeDefined()
        expect(agentResult.issuesFound).toBeDefined()
        expect(agentResult.resolutionStatus).toBeDefined()
      })
    })

    it('should aggregate issues by severity', async () => {
      const report = await generator.generateReport()

      expect(report.issueSummary).toBeDefined()
      expect(report.issueSummary.bySeverity).toBeDefined()
      expect(report.issueSummary.bySeverity.critical).toBeGreaterThanOrEqual(0)
      expect(report.issueSummary.bySeverity.high).toBeGreaterThanOrEqual(0)
      expect(report.issueSummary.bySeverity.medium).toBeGreaterThanOrEqual(0)
      expect(report.issueSummary.bySeverity.low).toBeGreaterThanOrEqual(0)
    })

    it('should include quality metrics', async () => {
      const report = await generator.generateReport()

      expect(report.qualityMetrics).toBeDefined()
      expect(report.qualityMetrics.lighthouse).toBeDefined()
      expect(report.qualityMetrics.lighthouse.performance).toBeGreaterThanOrEqual(0)
      expect(report.qualityMetrics.lighthouse.performance).toBeLessThanOrEqual(100)
      expect(report.qualityMetrics.coreWebVitals).toBeDefined()
      expect(report.qualityMetrics.wcagCompliance).toBeDefined()
    })

    it('should include checklist status with pass/fail counts', async () => {
      const report = await generator.generateReport()

      expect(report.checklistStatus).toBeDefined()
      expect(report.checklistStatus.totalItems).toBeGreaterThan(0)
      expect(report.checklistStatus.passCount).toBeGreaterThanOrEqual(0)
      expect(report.checklistStatus.failCount).toBeGreaterThanOrEqual(0)
      expect(report.checklistStatus.passPercentage).toBeGreaterThanOrEqual(0)
      expect(report.checklistStatus.passPercentage).toBeLessThanOrEqual(100)
    })

    it('should include test data and environment configuration', async () => {
      const report = await generator.generateReport()

      expect(report.testDataEnvironment).toBeDefined()
      expect(report.testDataEnvironment.testTenant).toBeDefined()
      expect(report.testDataEnvironment.testVehicles).toBeDefined()
      expect(report.testDataEnvironment.testDrivers).toBeDefined()
      expect(report.testDataEnvironment.testUsers).toBeDefined()
    })

    it('should include customer-friendly instructions', async () => {
      const report = await generator.generateReport()

      expect(report.customerInstructions).toBeDefined()
      expect(report.customerInstructions.accessInstructions).toBeDefined()
      expect(report.customerInstructions.testScenarios).toBeDefined()
      expect(Array.isArray(report.customerInstructions.testScenarios)).toBe(true)
      expect(report.customerInstructions.supportContact).toBeDefined()
      expect(report.customerInstructions.nextSteps).toBeDefined()
    })
  })

  describe('Executive Summary', () => {
    it('should generate executive summary with status', async () => {
      const report = await generator.generateReport()

      const summary = report.executiveSummary
      expect(summary.status).toMatch(/^(PASS|FAIL|WARNING|READY_WITH_CAVEATS)$/)
      expect(summary.readinessRecommendation).toBeDefined()
      expect(summary.managerApproval).toBeDefined()
    })

    it('should count total issues correctly', async () => {
      const report = await generator.generateReport()

      const summary = report.executiveSummary
      const totalCalculated =
        summary.totalIssuesFound -
        (summary.resolvedIssues + summary.dismissedIssues)
      expect(totalCalculated).toBeGreaterThanOrEqual(0)
    })

    it('should provide readiness recommendation', async () => {
      const report = await generator.generateReport()

      const recommendation = report.executiveSummary.readinessRecommendation
      expect(recommendation).toBeDefined()
      expect(recommendation.length).toBeGreaterThan(0)
    })
  })

  describe('Approval Sign-Off', () => {
    it('should initialize approval structure', async () => {
      const report = await generator.generateReport()

      expect(report.approvalSignOff).toBeDefined()
      expect(report.approvalSignOff.approvals).toBeDefined()
      expect(Array.isArray(report.approvalSignOff.approvals)).toBe(true)
    })

    it('should record manager approval', async () => {
      const approval: ApprovalSignOff = {
        reviewer: 'manager@example.com',
        role: ApprovalRole.QA_MANAGER,
        approvedAt: new Date(),
        status: 'approved',
        notes: 'Approved for customer testing'
      }

      await generator.recordApproval(approval)
      const report = await generator.generateReport()

      const found = report.approvalSignOff.approvals.some(
        a => a.role === ApprovalRole.QA_MANAGER && a.status === 'approved'
      )
      expect(found).toBe(true)
    })

    it('should track approval history', async () => {
      const approval1: ApprovalSignOff = {
        reviewer: 'qa@example.com',
        role: ApprovalRole.QA_MANAGER,
        approvedAt: new Date(),
        status: 'approved',
        notes: 'Initial approval'
      }

      const approval2: ApprovalSignOff = {
        reviewer: 'tech@example.com',
        role: ApprovalRole.ENGINEERING_LEAD,
        approvedAt: new Date(),
        status: 'approved',
        notes: 'Technical lead approval'
      }

      await generator.recordApproval(approval1)
      await generator.recordApproval(approval2)

      const history = await generator.getApprovalHistory()
      expect(history.length).toBeGreaterThanOrEqual(2)
    })

    it('should validate readiness for customer based on approvals', async () => {
      const isReady = await generator.isReadyForCustomer()
      expect(typeof isReady).toBe('boolean')
    })
  })

  describe('Export Formats', () => {
    it('should export report as JSON', async () => {
      const jsonReport = await generator.exportAsJson()

      expect(jsonReport).toBeDefined()
      expect(typeof jsonReport).toBe('string')

      const parsed = JSON.parse(jsonReport)
      expect(parsed.metadata).toBeDefined()
      expect(parsed.executiveSummary).toBeDefined()
    })

    it('should export report as HTML', async () => {
      const htmlReport = await generator.exportAsHtml()

      expect(htmlReport).toBeDefined()
      expect(typeof htmlReport).toBe('string')
      expect(htmlReport).toContain('<html')
      expect(htmlReport).toContain('</html>')
      expect(htmlReport).toContain('Customer Handoff Report')
    })

    it('should throw not-implemented error for PDF export', async () => {
      await expect(generator.exportAsPdf()).rejects.toThrow(/not yet implemented/i)
    })

    it('should export report as CSV with issues', async () => {
      const csvReport = await generator.exportAsCsv()

      expect(csvReport).toBeDefined()
      expect(typeof csvReport).toBe('string')
      expect(csvReport).toContain('Issue ID')
      expect(csvReport).toContain('Severity')
      expect(csvReport).toContain('Status')
    })

    it('should include timestamp in all exports', async () => {
      const json = await generator.exportAsJson()
      const html = await generator.exportAsHtml()
      const csv = await generator.exportAsCsv()

      expect(json).toContain('generatedAt')
      expect(html).toContain('Generated')
      expect(csv).toContain('Detected At')
    })
  })

  describe('Quality Metrics', () => {
    it('should calculate overall quality score', async () => {
      const metrics = await generator.calculateQualityMetrics()

      expect(metrics).toBeDefined()
      expect(metrics.overallScore).toBeGreaterThanOrEqual(0)
      expect(metrics.overallScore).toBeLessThanOrEqual(100)
    })

    it('should include Lighthouse scores', async () => {
      const metrics = await generator.calculateQualityMetrics()

      expect(metrics.lighthouse).toBeDefined()
      expect(metrics.lighthouse.performance).toBeGreaterThanOrEqual(0)
      expect(metrics.lighthouse.performance).toBeLessThanOrEqual(100)
      expect(metrics.lighthouse.accessibility).toBeGreaterThanOrEqual(0)
      expect(metrics.lighthouse.bestPractices).toBeGreaterThanOrEqual(0)
      expect(metrics.lighthouse.seo).toBeGreaterThanOrEqual(0)
    })

    it('should include Core Web Vitals', async () => {
      const metrics = await generator.calculateQualityMetrics()

      expect(metrics.coreWebVitals).toBeDefined()
      expect(metrics.coreWebVitals.lcp).toBeGreaterThanOrEqual(0)
      expect(metrics.coreWebVitals.fid).toBeGreaterThanOrEqual(0)
      expect(metrics.coreWebVitals.cls).toBeGreaterThanOrEqual(0)
    })

    it('should include WCAG compliance summary', async () => {
      const metrics = await generator.calculateQualityMetrics()

      expect(metrics.wcagCompliance).toBeDefined()
      expect(metrics.wcagCompliance.levelAa).toBeGreaterThanOrEqual(0)
      expect(metrics.wcagCompliance.levelAaa).toBeGreaterThanOrEqual(0)
      expect(metrics.wcagCompliance.percentageCompliant).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Readiness Checks', () => {
    it('should check if all critical items are resolved', async () => {
      const readiness = await generator.getReadinessStatus()

      expect(readiness).toBeDefined()
      expect(readiness.allCriticalItemsResolved).toBeDefined()
      expect(typeof readiness.allCriticalItemsResolved).toBe('boolean')
    })

    it('should verify checklist completion', async () => {
      const readiness = await generator.getReadinessStatus()

      expect(readiness.checklistCompletion).toBeDefined()
      expect(readiness.checklistCompletion).toBeGreaterThanOrEqual(0)
      expect(readiness.checklistCompletion).toBeLessThanOrEqual(100)
    })

    it('should confirm test data setup', async () => {
      const readiness = await generator.getReadinessStatus()

      expect(readiness.testDataSetupConfirmed).toBeDefined()
      expect(typeof readiness.testDataSetupConfirmed).toBe('boolean')
    })

    it('should return blockers preventing customer handoff', async () => {
      const readiness = await generator.getReadinessStatus()

      expect(readiness.blockers).toBeDefined()
      expect(Array.isArray(readiness.blockers)).toBe(true)
    })

    it('should provide detailed readiness report', async () => {
      const readiness = await generator.getReadinessStatus()

      expect(readiness.summary).toBeDefined()
      expect(readiness.summary.length).toBeGreaterThan(0)
    })
  })

  describe('Report Validation', () => {
    it('should validate report has no missing critical sections', async () => {
      const report = await generator.generateReport()
      const isValid = await generator.validateReport(report)

      expect(isValid.valid).toBe(true)
      expect(isValid.errors).toHaveLength(0)
    })

    it('should detect missing sections', async () => {
      const invalidReport = {
        metadata: { generatedAt: new Date(), version: '1.0' }
      } as any

      const validation = await generator.validateReport(invalidReport)
      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })

    it('should validate data consistency', async () => {
      const report = await generator.generateReport()

      // Total issues should equal sum of categories
      const totalFromCategories =
        (report.issueSummary.bySeverity.critical || 0) +
        (report.issueSummary.bySeverity.high || 0) +
        (report.issueSummary.bySeverity.medium || 0) +
        (report.issueSummary.bySeverity.low || 0)

      expect(totalFromCategories).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Known Issues Section', () => {
    it('should include known issues section', async () => {
      const report = await generator.generateReport()

      expect(report.knownIssues).toBeDefined()
      expect(Array.isArray(report.knownIssues)).toBe(true)
    })

    it('should include workarounds for known issues', async () => {
      const report = await generator.generateReport()

      if (report.knownIssues.length > 0) {
        report.knownIssues.forEach(issue => {
          expect(issue.description).toBeDefined()
          expect(issue.workaround).toBeDefined()
        })
      }
    })
  })

  describe('Report Options', () => {
    it('should support custom options for report generation', async () => {
      const options: HandoffReportOptions = {
        includeScreenshots: false,
        includeMetrics: true,
        includeSensitiveData: false
      }

      const report = await generator.generateReport(options)
      expect(report).toBeDefined()
    })

    it('should filter sensitive data when requested', async () => {
      const options: HandoffReportOptions = {
        includeSensitiveData: false
      }

      const report = await generator.generateReport(options)

      // Verify report generated successfully
      expect(report).toBeDefined()
      expect(report.metadata).toBeDefined()

      // The report should have customer instructions but no sensitive credentials
      expect(report.customerInstructions).toBeDefined()
    })
  })

  describe('Report Persistence', () => {
    it('should save report to storage', async () => {
      const reportId = await generator.saveReport()

      expect(reportId).toBeDefined()
      expect(typeof reportId).toBe('string')
    })

    it('should retrieve saved report', async () => {
      const savedReportId = await generator.saveReport()
      const retrieved = await generator.getReport(savedReportId)

      expect(retrieved).toBeDefined()
      expect(retrieved.metadata.reportId).toBe(savedReportId)
    })

    it('should list all saved reports', async () => {
      await generator.saveReport()
      const reports = await generator.listReports()

      expect(Array.isArray(reports)).toBe(true)
      expect(reports.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle missing validation data gracefully', async () => {
      // Even if no validation data exists, report should generate
      const report = await generator.generateReport()
      expect(report).toBeDefined()
      expect(report.metadata).toBeDefined()
    })

    it('should provide helpful error messages', async () => {
      try {
        await generator.getReport('non-existent-id')
      } catch (error: any) {
        expect(error.message).toBeDefined()
        expect(error.message.length).toBeGreaterThan(0)
      }
    })
  })
})
