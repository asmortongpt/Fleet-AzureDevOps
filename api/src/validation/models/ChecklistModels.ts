/**
 * Pre-Flight Checklist Type Definitions & Models
 *
 * Comprehensive type definitions for the pre-flight checklist system.
 * Includes enums, interfaces, and models for all checklist operations.
 *
 * @module validation/models/ChecklistModels
 * @author Claude Code - Task 12
 * @date 2026-02-25
 */

import { z } from 'zod'

// ============================================================================
// ENUMS
// ============================================================================

export enum ChecklistStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  WARNING = 'WARNING',
  SKIPPED = 'SKIPPED',
  PENDING = 'PENDING',
  MANUAL = 'MANUAL'
}

export enum ChecklistCategory {
  VISUAL_QUALITY = 'visual_quality',
  DATA_QUALITY = 'data_quality',
  WORKFLOW_QUALITY = 'workflow_quality',
  PERFORMANCE = 'performance',
  ACCESSIBILITY = 'accessibility'
}

export enum SignOffApprovalType {
  FULL_RELEASE = 'FULL_RELEASE',
  PARTIAL_RELEASE = 'PARTIAL_RELEASE',
  WAIVED_ITEMS = 'WAIVED_ITEMS',
  CONDITIONAL_RELEASE = 'CONDITIONAL_RELEASE'
}

export enum SignOffRole {
  QA_MANAGER = 'QA_MANAGER',
  PRODUCT_MANAGER = 'PRODUCT_MANAGER',
  ENGINEERING_LEAD = 'ENGINEERING_LEAD',
  CUSTOMER_SUCCESS = 'CUSTOMER_SUCCESS'
}

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Individual checklist item result
 */
export interface CheckItemResult {
  id: string
  category: ChecklistCategory
  name: string
  description: string
  status: ChecklistStatus
  score?: number
  evidence?: Record<string, unknown>
  failureReason?: string
  warnings?: string[]
  reviewNotes?: string
  blocksRelease?: boolean
  dependencies?: string[]
  executedAt?: Date
  duration?: number // milliseconds
}

/**
 * Evidence collected for a checklist item
 */
export interface ChecklistEvidence {
  screenshots?: string[]
  metrics?: Record<string, number | string>
  logs?: string[]
  errors?: string[]
  warnings?: string[]
  metadata?: Record<string, unknown>
  timestamp: Date
  environment?: string
}

/**
 * Complete checklist report
 */
export interface ChecklistReport {
  id: string
  timestamp: Date
  status: ChecklistStatus
  summary: ChecklistSummary
  items: CheckItemResult[]
  sections: string[]
  blockingIssues: CheckItemResult[]
  warnings: CheckItemResult[]
  recommendations: string[]
  evidence: Record<string, ChecklistEvidence>
  version: string
}

/**
 * Checklist summary statistics
 */
export interface ChecklistSummary {
  totalItems: number
  passCount: number
  failCount: number
  warningCount: number
  skippedCount: number
  manualCount: number
  passPercentage: number
  status: 'ready' | 'issues' | 'blocked'
  overallScore: number
  estimatedTimeToFix?: number // minutes
}

/**
 * Dependency relationship between checklist items
 */
export interface ChecklistDependency {
  id: string
  name: string
  dependents: string[]
  blockedBy?: string[]
  critical?: boolean
}

/**
 * Sign-off approval request
 */
export interface SignOffRequest {
  reviewer: string
  role: SignOffRole
  approvalType: SignOffApprovalType
  notes?: string
  waivedItems?: string[]
  waiverNotes?: string
  conditions?: string[]
}

/**
 * Sign-off approval response
 */
export interface SignOffApproval {
  id: string
  reviewer: string
  role: SignOffRole
  approvalType: SignOffApprovalType
  status: 'approved' | 'rejected' | 'pending'
  timestamp: Date
  notes?: string
  waivedItems?: string[]
  waiverNotes?: string
  conditions?: string[]
  validUntil?: Date
}

/**
 * Checklist run history entry
 */
export interface ChecklistRunHistory {
  id: string
  timestamp: Date
  duration: number // milliseconds
  status: ChecklistStatus
  totalItems: number
  results: {
    pass: number
    fail: number
    warning: number
    skipped: number
  }
  triggeredBy: string
  notes?: string
}

/**
 * Validation context for checklist execution
 */
export interface ValidationContext {
  tenantId: string
  userId: string
  environment: 'development' | 'staging' | 'production'
  skipItems?: string[]
  focusItems?: string[]
  collectorDetails?: boolean
  timeout?: number // seconds
}

/**
 * Checklist item configuration
 */
export interface ChecklistItemConfig {
  id: string
  category: ChecklistCategory
  name: string
  description: string
  enabled: boolean
  critical: boolean
  timeout?: number
  dependencies?: string[]
  metadata?: Record<string, unknown>
}

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

export const SignOffRequestSchema = z.object({
  reviewer: z.string().email('Invalid reviewer email'),
  role: z.nativeEnum(SignOffRole),
  approvalType: z.nativeEnum(SignOffApprovalType),
  notes: z.string().optional(),
  waivedItems: z.array(z.string()).optional(),
  waiverNotes: z.string().optional(),
  conditions: z.array(z.string()).optional()
})

export const ValidationContextSchema = z.object({
  tenantId: z.string().uuid('Invalid tenant ID'),
  userId: z.string().uuid('Invalid user ID'),
  environment: z.enum(['development', 'staging', 'production']),
  skipItems: z.array(z.string()).optional(),
  focusItems: z.array(z.string()).optional(),
  collectorDetails: z.boolean().optional(),
  timeout: z.number().positive().optional()
})

export const ChecklistItemConfigSchema = z.object({
  id: z.string(),
  category: z.nativeEnum(ChecklistCategory),
  name: z.string(),
  description: z.string(),
  enabled: z.boolean(),
  critical: z.boolean(),
  timeout: z.number().positive().optional(),
  dependencies: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
})

// ============================================================================
// CATEGORY-SPECIFIC TYPES
// ============================================================================

/**
 * Visual Quality check result
 */
export interface VisualQualityResult extends CheckItemResult {
  category: ChecklistCategory.VISUAL_QUALITY
  evidence?: {
    screenshots?: string[]
    inconsistencies?: Array<{
      element: string
      issue: string
      severity: 'error' | 'warning'
    }>
    viewport?: number
  }
}

/**
 * Data Quality check result
 */
export interface DataQualityResult extends CheckItemResult {
  category: ChecklistCategory.DATA_QUALITY
  evidence?: {
    recordsChecked?: number
    tenantsChecked?: number
    formatsChecked?: number
    issues?: Array<{
      record: string
      issue: string
      expected: string
      actual: string
    }>
  }
}

/**
 * Workflow Quality check result
 */
export interface WorkflowQualityResult extends CheckItemResult {
  category: ChecklistCategory.WORKFLOW_QUALITY
  evidence?: {
    operationsVerified?: number
    rolesChecked?: string[]
    stepsCompleted?: number
    totalSteps?: number
    failedSteps?: Array<{
      step: number
      error: string
    }>
  }
}

/**
 * Performance check result
 */
export interface PerformanceResult extends CheckItemResult {
  category: ChecklistCategory.PERFORMANCE
  evidence?: {
    score?: number
    metric?: number
    unit?: string
    threshold?: number
    actual?: number
    loadTimeMs?: number
  }
}

/**
 * Accessibility check result
 */
export interface AccessibilityResult extends CheckItemResult {
  category: ChecklistCategory.ACCESSIBILITY
  evidence?: {
    issuesFound?: Array<{
      element: string
      issue: string
      wcagLevel: 'A' | 'AA' | 'AAA'
      severity: 'error' | 'warning'
    }>
    elementsTested?: number
    screenReaderTests?: number
    compliancePercentage?: number
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * All checklist categories with item counts
 */
export const CHECKLIST_CATEGORIES = {
  [ChecklistCategory.VISUAL_QUALITY]: {
    name: 'Visual Quality',
    itemCount: 40,
    critical: false
  },
  [ChecklistCategory.DATA_QUALITY]: {
    name: 'Data Quality',
    itemCount: 25,
    critical: true
  },
  [ChecklistCategory.WORKFLOW_QUALITY]: {
    name: 'Workflow Quality',
    itemCount: 30,
    critical: true
  },
  [ChecklistCategory.PERFORMANCE]: {
    name: 'Performance',
    itemCount: 15,
    critical: false
  },
  [ChecklistCategory.ACCESSIBILITY]: {
    name: 'Accessibility',
    itemCount: 20,
    critical: false
  }
}

export const TOTAL_CHECKLIST_ITEMS = Object.values(CHECKLIST_CATEGORIES).reduce(
  (sum, cat) => sum + cat.itemCount,
  0
)

/**
 * Dependency graph for checklist items
 * Items that must pass before other items can be validated
 */
export const CHECKLIST_DEPENDENCIES: Record<string, string[]> = {
  login_flow: [],
  logout_flow: ['login_flow'],
  vehicle_create: ['login_flow', 'permission_enforcement'],
  vehicle_read: ['login_flow', 'vehicle_create'],
  vehicle_update: ['login_flow', 'vehicle_read'],
  vehicle_delete: ['login_flow', 'vehicle_read'],
  driver_crud: ['login_flow', 'permission_enforcement'],
  oauth_tokens: ['login_flow'],
  context_propagation: ['oauth_tokens'],
  data_isolation: ['context_propagation'],
  vehicle_visibility: ['data_isolation']
}

/**
 * Blocking status check - items that prevent sign-off
 */
export const BLOCKING_CATEGORIES = [
  ChecklistCategory.DATA_QUALITY,
  ChecklistCategory.WORKFLOW_QUALITY
]

/**
 * Critical checklist items that must pass for release
 */
export const CRITICAL_ITEMS = [
  'oauth_tokens',
  'context_propagation',
  'data_isolation',
  'vehicle_visibility',
  'permission_enforcement',
  'login_flow',
  'logout_flow'
]

/**
 * Time thresholds for performance checks
 */
export const PERFORMANCE_THRESHOLDS = {
  lighthousePerformance: 90,
  lighthouseAccessibility: 90,
  lighthouseBestPractices: 90,
  lighthouseSeo: 90,
  lcpMs: 2500,
  fidMs: 100,
  clsValue: 0.1,
  inpMs: 200,
  ttfbMs: 600,
  hubInitialLoadMs: 2000,
  drilldownOpenMs: 500,
  modalOpenMs: 300,
  tableDataFetchMs: 1000,
  searchResultsMs: 500,
  chartRenderingMs: 1000
}

/**
 * WCAG AA compliance thresholds
 */
export const ACCESSIBILITY_THRESHOLDS = {
  contrastRatioNormalText: 4.5,
  contrastRatioLargeText: 3,
  minTextSize: 12,
  minTouchTargetSize: 44,
  maxTabIndexValue: 32767
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Possible checklist item IDs (for type safety)
 */
export type ChecklistItemId =
  | 'text_hub_titles'
  | 'text_card_wrapping'
  | 'text_modal_overflow'
  | 'text_button_truncation'
  | 'text_table_headers'
  | 'text_form_labels'
  | 'text_panel_headers'
  | 'text_tooltip_readability'
  | 'text_badge_scaling'
  | 'text_status_labels'
  | 'layout_fleet_ops_hub'
  | 'layout_compliance_hub'
  | 'layout_business_hub'
  | 'layout_people_hub'
  | 'layout_admin_hub'
  | 'layout_drilldown_panels'
  | 'layout_grid_alignment'
  | 'layout_charts'
  | 'layout_sidebar'
  | 'layout_header_footer'
  | 'oauth_tokens'
  | 'context_propagation'
  | 'data_isolation'
  | 'vehicle_visibility'
  | 'permission_enforcement'
  | 'login_flow'
  | 'logout_flow'
  | 'session_persistence'
  | 'token_refresh'
  | 'mfa_support'
  | 'password_reset'
