/**
 * Customer Handoff Report Type Definitions
 *
 * Comprehensive type definitions for the handoff report system including:
 * - Report metadata and structure
 * - Executive summary
 * - Validation summaries by week
 * - Agent results
 * - Issue aggregation
 * - Quality metrics
 * - Approval workflow
 * - Export formats
 *
 * @module validation/models/HandoffModels
 * @author Claude Code - Task 14
 * @date 2026-02-25
 */

import { z } from 'zod'

// ============================================================================
// ENUMS
// ============================================================================

export enum HandoffStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  WARNING = 'WARNING',
  READY_WITH_CAVEATS = 'READY_WITH_CAVEATS'
}

export enum ApprovalRole {
  QA_MANAGER = 'QA_MANAGER',
  PRODUCT_MANAGER = 'PRODUCT_MANAGER',
  ENGINEERING_LEAD = 'ENGINEERING_LEAD',
  CUSTOMER_SUCCESS = 'CUSTOMER_SUCCESS'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CONDITIONAL = 'CONDITIONAL'
}

export enum ExportFormat {
  JSON = 'json',
  HTML = 'html',
  PDF = 'pdf',
  CSV = 'csv'
}

// ============================================================================
// METADATA INTERFACES
// ============================================================================

/**
 * Report metadata and generation information
 */
export interface ReportMetadata {
  /** Unique report identifier */
  reportId: string

  /** Report generation timestamp */
  generatedAt: Date

  /** Report version */
  version: string

  /** Deployment environment */
  environment: 'development' | 'staging' | 'production'

  /** Tenant ID */
  tenantId: string

  /** Generator user ID */
  generatedBy: string

  /** Report period start date */
  periodStart: Date

  /** Report period end date */
  periodEnd: Date
}

// ============================================================================
// EXECUTIVE SUMMARY
// ============================================================================

/**
 * Executive summary of handoff report
 */
export interface ExecutiveSummary {
  /** Overall validation status */
  status: HandoffStatus

  /** Quality score (0-100) */
  qualityScore: number

  /** Total issues found during validation */
  totalIssuesFound: number

  /** Total issues resolved */
  resolvedIssues: number

  /** Total issues dismissed */
  dismissedIssues: number

  /** Outstanding critical issues */
  outstandingCriticalIssues: number

  /** Outstanding high severity issues */
  outstandingHighIssues: number

  /** Manager approval status */
  managerApproval: {
    status: ApprovalStatus
    approver?: string
    approvedAt?: Date
  }

  /** Readiness recommendation */
  readinessRecommendation: string

  /** Key achievements */
  keyAchievements: string[]

  /** Areas for attention post-UAT */
  areasForAttention: string[]
}

// ============================================================================
// VALIDATION SUMMARY BY WEEK
// ============================================================================

/**
 * Activities performed in a validation week
 */
export interface WeeklyValidationSummary {
  /** Week number (1-4) */
  week: number

  /** Week title */
  title: string

  /** Week description */
  description: string

  /** Activities performed this week */
  activities: string[]

  /** Agents active this week */
  agentsActive: string[]

  /** Issues found this week */
  issuesFound: number

  /** Issues resolved this week */
  issuesResolved: number

  /** Key milestones */
  milestones: string[]

  /** Notes/observations */
  notes: string
}

/**
 * Complete validation summary across all weeks
 */
export interface ValidationSummary {
  /** Week 1: Agent Setup & Baseline */
  week1: WeeklyValidationSummary

  /** Week 2: Fix & Iterate */
  week2: WeeklyValidationSummary

  /** Week 3: Workflow Testing */
  week3: WeeklyValidationSummary

  /** Week 4: Customer Readiness */
  week4: WeeklyValidationSummary

  /** Overall progress metrics */
  overallMetrics: {
    totalIssuesFound: number
    totalIssuesResolved: number
    resolutionRate: number
    averageTimeToResolution: number
  }
}

// ============================================================================
// AGENT RESULTS
// ============================================================================

/**
 * Test results for a single agent
 */
export interface AgentTestResult {
  /** Agent name */
  agentName: string

  /** Pages/components tested */
  pagesTested: string[]

  /** Total issues found by this agent */
  issuesFound: number

  /** Issues by severity */
  issuesBySeverity: {
    critical: number
    high: number
    medium: number
    low: number
  }

  /** Resolution status */
  resolutionStatus: {
    resolved: number
    inProgress: number
    deferred: number
  }

  /** Key findings summary */
  keyFindings: string[]

  /** Tested workflows */
  workflowsCovered: string[]

  /** Test coverage percentage */
  coveragePercentage: number

  /** Recommendations */
  recommendations: string[]

  /** Test execution time in milliseconds */
  executionTimeMs: number

  /** Pass rate percentage */
  passRate: number
}

/**
 * All agent results aggregated
 */
export interface AgentResults {
  [agentName: string]: AgentTestResult
}

// ============================================================================
// ISSUE SUMMARY
// ============================================================================

/**
 * Single issue in the handoff report
 */
export interface HandoffIssue {
  /** Issue ID */
  id: string

  /** Issue title */
  title: string

  /** Detailed description */
  description: string

  /** Severity level */
  severity: 'critical' | 'high' | 'medium' | 'low'

  /** Issue category */
  category: string

  /** Current status */
  status: 'new' | 'in_progress' | 'resolved' | 'dismissed' | 'deferred'

  /** Affected component */
  affectedComponent: string

  /** Agent that found the issue */
  detectedBy: string

  /** Detection date */
  detectedAt: Date

  /** Resolution date (if resolved) */
  resolvedAt?: Date

  /** Resolution description */
  resolutionDescription?: string

  /** Before/after screenshots */
  evidence?: {
    before?: string
    after?: string
  }

  /** Dismissal reason (if dismissed) */
  dismissalReason?: string

  /** Deferral reason (if deferred) */
  deferrailReason?: string
}

/**
 * Issue summary aggregation
 */
export interface IssueSummary {
  /** Total issues */
  total: number

  /** Issues by severity */
  bySeverity: {
    critical: number
    high: number
    medium: number
    low: number
  }

  /** Issues by status */
  byStatus: {
    new: number
    in_progress: number
    resolved: number
    dismissed: number
    deferred: number
  }

  /** Issues by category */
  byCategory: Record<string, number>

  /** Critical issues requiring attention */
  criticalIssues: HandoffIssue[]

  /** High severity issues */
  highIssues: HandoffIssue[]

  /** Resolved issues */
  resolvedIssues: HandoffIssue[]

  /** Dismissed issues */
  dismissedIssues: HandoffIssue[]

  /** Deferred issues with notes */
  deferredIssues: Array<HandoffIssue & { deferrailReason: string }>
}

// ============================================================================
// QUALITY METRICS
// ============================================================================

/**
 * Lighthouse audit scores
 */
export interface LighthouseScores {
  /** Performance score (0-100) */
  performance: number

  /** Accessibility score (0-100) */
  accessibility: number

  /** Best practices score (0-100) */
  bestPractices: number

  /** SEO score (0-100) */
  seo: number

  /** PWA score (0-100) */
  pwa: number

  /** Average across all categories */
  average: number
}

/**
 * Core Web Vitals metrics
 */
export interface CoreWebVitals {
  /** Largest Contentful Paint (milliseconds) */
  lcp: number

  /** First Input Delay (milliseconds) */
  fid: number

  /** Cumulative Layout Shift (unitless) */
  cls: number

  /** Interaction to Next Paint (milliseconds) */
  inp: number

  /** Time to First Byte (milliseconds) */
  ttfb: number

  /** Pass/fail status for each metric */
  status: {
    lcp: 'good' | 'needs-improvement' | 'poor'
    fid: 'good' | 'needs-improvement' | 'poor'
    cls: 'good' | 'needs-improvement' | 'poor'
    inp: 'good' | 'needs-improvement' | 'poor'
    ttfb: 'good' | 'needs-improvement' | 'poor'
  }
}

/**
 * WCAG compliance summary
 */
export interface WcagCompliance {
  /** Level AA compliance percentage */
  levelAa: number

  /** Level AAA compliance percentage */
  levelAaa: number

  /** Overall percentage compliant */
  percentageCompliant: number

  /** Total violations found */
  totalViolations: number

  /** Violations by level */
  violationsByLevel: {
    critical: number
    serious: number
    moderate: number
    minor: number
  }

  /** Key recommendations */
  recommendations: string[]
}

/**
 * Complete quality metrics
 */
export interface QualityMetrics {
  /** Overall quality score (0-100) */
  overallScore: number

  /** Lighthouse audit results */
  lighthouse: LighthouseScores

  /** Core Web Vitals */
  coreWebVitals: CoreWebVitals

  /** WCAG compliance */
  wcagCompliance: WcagCompliance

  /** Performance metrics */
  performance: {
    pageLoadTimeMs: number
    timeToInteractiveMs: number
    firstPaintMs: number
    domContentLoadedMs: number
  }

  /** Test coverage metrics */
  testCoverage: {
    pagesTestedCount: number
    componentsTestedCount: number
    workflowsCoveredCount: number
    coveragePercentage: number
  }
}

// ============================================================================
// CHECKLIST STATUS
// ============================================================================

/**
 * Checklist completion status
 */
export interface ChecklistStatus {
  /** Total checklist items */
  totalItems: number

  /** Items that passed */
  passCount: number

  /** Items that failed */
  failCount: number

  /** Items with warnings */
  warningCount: number

  /** Skipped items */
  skippedCount: number

  /** Manual review items */
  manualCount: number

  /** Pass percentage */
  passPercentage: number

  /** Overall status */
  status: 'ready' | 'issues' | 'blocked'

  /** Critical blocking items (if any) */
  blockingItems: string[]

  /** Items requiring attention */
  itemsRequiringAttention: string[]

  /** Signed off date */
  signedOffAt?: Date

  /** Sign-off approver */
  signedOffBy?: string
}

// ============================================================================
// TEST DATA & ENVIRONMENT
// ============================================================================

/**
 * Test data configuration
 */
export interface TestDataEnvironment {
  /** Test tenant configuration */
  testTenant: {
    tenantId: string
    name: string
    type: string
  }

  /** Test vehicle data */
  testVehicles: {
    count: number
    makes: string[]
    models: string[]
    years: number[]
  }

  /** Test driver data */
  testDrivers: {
    count: number
    roles: string[]
  }

  /** Test user accounts */
  testUsers: {
    count: number
    roles: string[]
  }

  /** Data volume and distribution */
  dataVolume: {
    historicalDataDays: number
    totalTripsSimulated: number
    totalEventsLogged: number
  }

  /** Known test limitations */
  limitations: string[]

  /** Environment setup details */
  environment: string
}

// ============================================================================
// CUSTOMER INSTRUCTIONS
// ============================================================================

/**
 * Customer-friendly test scenario
 */
export interface TestScenario {
  /** Scenario title */
  title: string

  /** Detailed scenario description */
  description: string

  /** Expected outcome */
  expectedOutcome: string

  /** Step-by-step instructions */
  steps: string[]

  /** Estimated time to complete */
  estimatedMinutes: number

  /** Keywords for search */
  tags: string[]
}

/**
 * Customer instructions for UAT
 */
export interface CustomerInstructions {
  /** How to access the application */
  accessInstructions: string

  /** Initial login steps */
  loginInstructions: string

  /** Test scenarios to explore */
  testScenarios: TestScenario[]

  /** Support contact information */
  supportContact: {
    name: string
    email: string
    phone: string
    timezone: string
  }

  /** Next steps after testing */
  nextSteps: string[]

  /** Known workarounds for issues */
  workarounds: Array<{
    issue: string
    workaround: string
  }>

  /** FAQ for common questions */
  faq: Array<{
    question: string
    answer: string
  }>

  /** Links to documentation */
  documentationLinks: Array<{
    title: string
    url: string
  }>
}

// ============================================================================
// APPROVAL WORKFLOW
// ============================================================================

/**
 * Single approval from reviewer
 */
export interface ApprovalSignOff {
  /** Reviewer email */
  reviewer: string

  /** Reviewer role */
  role: ApprovalRole

  /** Approval status */
  status: ApprovalStatus

  /** Approval timestamp */
  approvedAt?: Date

  /** Approval notes */
  notes?: string

  /** Signature (digital or scanned) */
  signature?: string

  /** Items waived (if conditional approval) */
  waivedItems?: string[]

  /** Conditions for approval */
  conditions?: string[]
}

/**
 * Complete approval sign-off section
 */
export interface ApprovalSignOffSection {
  /** List of all approvals */
  approvals: ApprovalSignOff[]

  /** Overall readiness confirmation */
  readinessStatement: string

  /** Final approval timestamp */
  finalApprovedAt?: Date

  /** Is ready for customer testing */
  readyForCustomer: boolean

  /** Audit trail of approvals */
  auditTrail: Array<{
    timestamp: Date
    action: string
    by: string
    details: string
  }>
}

// ============================================================================
// KNOWN ISSUES
// ============================================================================

/**
 * Known issue to be tracked post-release
 */
export interface KnownIssue {
  /** Issue identifier */
  id: string

  /** Issue title */
  title: string

  /** Detailed description */
  description: string

  /** Severity level */
  severity: 'critical' | 'high' | 'medium' | 'low'

  /** Workaround if available */
  workaround?: string

  /** Expected fix version */
  expectedFixVersion?: string

  /** Target fix date */
  targetFixDate?: Date

  /** Impact on customer workflows */
  userImpact: string

  /** Tracking link (Jira, GitHub, etc.) */
  trackingLink?: string
}

// ============================================================================
// MAIN HANDOFF REPORT
// ============================================================================

/**
 * Complete customer handoff report
 */
export interface HandoffReport {
  /** Report metadata */
  metadata: ReportMetadata

  /** Executive summary (1 page) */
  executiveSummary: ExecutiveSummary

  /** Validation summary by week (2-3 pages) */
  validationSummary: ValidationSummary

  /** Agent results (5-6 pages) */
  agentResults: Record<string, AgentTestResult>

  /** Issue summary (variable pages) */
  issueSummary: IssueSummary

  /** Quality metrics (1-2 pages) */
  qualityMetrics: QualityMetrics

  /** Checklist status (1 page) */
  checklistStatus: ChecklistStatus

  /** Test data & environment (1 page) */
  testDataEnvironment: TestDataEnvironment

  /** Known issues (variable, likely empty) */
  knownIssues: KnownIssue[]

  /** Customer instructions (1-2 pages) */
  customerInstructions: CustomerInstructions

  /** Approval sign-off (1 page) */
  approvalSignOff: ApprovalSignOffSection
}

// ============================================================================
// API OPTIONS & REQUESTS
// ============================================================================

/**
 * Options for report generation
 */
export interface HandoffReportOptions {
  /** Include screenshots in report */
  includeScreenshots?: boolean

  /** Include detailed metrics */
  includeMetrics?: boolean

  /** Include sensitive test data */
  includeSensitiveData?: boolean

  /** Filter by severity (exclude lower) */
  minSeverity?: 'critical' | 'high' | 'medium' | 'low'

  /** Include resolved issues */
  includeResolvedIssues?: boolean

  /** Include dismissed issues */
  includeDismissedIssues?: boolean
}

/**
 * Options for report export
 */
export interface ExportOptions {
  /** Export format */
  format: ExportFormat

  /** Include table of contents */
  includeTableOfContents?: boolean

  /** Include appendices */
  includeAppendices?: boolean

  /** Page size for PDF (A4, Letter, etc.) */
  pageSize?: 'A4' | 'Letter' | 'A3'

  /** Include page numbers */
  includePageNumbers?: boolean

  /** Include timestamps */
  includeTimestamps?: boolean
}

/**
 * Readiness status check response
 */
export interface ReadinessStatus {
  /** Is customer ready */
  isReady: boolean

  /** All critical items resolved */
  allCriticalItemsResolved: boolean

  /** Checklist completion percentage */
  checklistCompletion: number

  /** Test data setup confirmed */
  testDataSetupConfirmed: boolean

  /** All required approvals obtained */
  allApprovalsObtained: boolean

  /** Blockers preventing handoff */
  blockers: string[]

  /** Summary status message */
  summary: string
}

/**
 * Report validation result
 */
export interface ReportValidationResult {
  /** Is report valid */
  valid: boolean

  /** List of validation errors */
  errors: string[]

  /** List of warnings */
  warnings: string[]

  /** Validation timestamp */
  validatedAt: Date
}

/**
 * Saved report metadata
 */
export interface SavedReportMetadata {
  /** Report ID */
  reportId: string

  /** Report title */
  title: string

  /** Generation timestamp */
  generatedAt: Date

  /** Quality score */
  qualityScore: number

  /** Overall status */
  status: HandoffStatus

  /** Generated by user */
  generatedBy: string

  /** Last modified timestamp */
  lastModified: Date

  /** Access level */
  accessLevel: 'private' | 'team' | 'company'

  /** File size in bytes */
  fileSizeBytes: number

  /** Available export formats */
  availableFormats: ExportFormat[]
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

export const ApprovalSignOffSchema = z.object({
  reviewer: z.string().email(),
  role: z.enum([
    'QA_MANAGER',
    'PRODUCT_MANAGER',
    'ENGINEERING_LEAD',
    'CUSTOMER_SUCCESS'
  ]),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CONDITIONAL']),
  approvedAt: z.date().optional(),
  notes: z.string().optional(),
  signature: z.string().optional(),
  waivedItems: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional()
})

export const HandoffReportOptionsSchema = z.object({
  includeScreenshots: z.boolean().optional(),
  includeMetrics: z.boolean().optional(),
  includeSensitiveData: z.boolean().optional(),
  minSeverity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  includeResolvedIssues: z.boolean().optional(),
  includeDismissedIssues: z.boolean().optional()
})

export const ExportOptionsSchema = z.object({
  format: z.enum(['json', 'html', 'pdf', 'csv']),
  includeTableOfContents: z.boolean().optional(),
  includeAppendices: z.boolean().optional(),
  pageSize: z.enum(['A4', 'Letter', 'A3']).optional(),
  includePageNumbers: z.boolean().optional(),
  includeTimestamps: z.boolean().optional()
})
