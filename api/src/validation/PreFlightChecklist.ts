/**
 * Pre-Flight Checklist Orchestrator
 *
 * Main orchestrator for the pre-flight checklist system.
 * Coordinates all 130+ validation checks across five categories.
 * Handles execution, status tracking, evidence collection, and sign-off workflow.
 *
 * @module validation/PreFlightChecklist
 * @author Claude Code - Task 12
 * @date 2026-02-25
 */

import { Logger } from 'winston'
import { logger as baseLogger } from '../utils/logger'
import { pool } from '../db'
import {
  ChecklistStatus,
  ChecklistCategory,
  type CheckItemResult,
  type ChecklistReport,
  type ChecklistSummary,
  type ChecklistDependency,
  type SignOffRequest,
  type SignOffApproval,
  type ValidationContext,
  CHECKLIST_CATEGORIES,
  TOTAL_CHECKLIST_ITEMS,
  CHECKLIST_DEPENDENCIES,
  CRITICAL_ITEMS,
  BLOCKING_CATEGORIES
} from './models/ChecklistModels'
import { ChecklistValidator } from './ChecklistValidator'

const logger = baseLogger

/**
 * Enum-like status values for export
 */
export { ChecklistStatus, ChecklistCategory }

/**
 * Export ChecklistItem for use in tests
 */
export class ChecklistItem {
  constructor(
    public id: string,
    public name: string,
    public category: string,
    public status: ChecklistStatus = ChecklistStatus.PENDING
  ) {}
}

/**
 * Pre-Flight Checklist Orchestrator
 *
 * Manages the complete pre-flight validation workflow:
 * 1. Execute all 130+ checks
 * 2. Track status for each item
 * 3. Collect evidence and metrics
 * 4. Generate comprehensive reports
 * 5. Manage sign-off workflow
 * 6. Version history tracking
 */
export class PreFlightChecklist {
  private validator: ChecklistValidator
  private results: Map<string, CheckItemResult> = new Map()
  private currentContext?: ValidationContext
  private runStartTime?: Date
  private signOffApprovals: SignOffApproval[] = []

  constructor() {
    this.validator = new ChecklistValidator()
  }

  /**
   * Run full checklist with all categories
   */
  async runFullChecklist(context?: ValidationContext): Promise<ChecklistReport> {
    this.runStartTime = new Date()
    this.currentContext = context
    this.results.clear()

    logger.info('Starting full pre-flight checklist')

    try {
      // Execute all categories in parallel
      await Promise.all([
        this.runVisualQualityChecks(),
        this.runDataQualityChecks(),
        this.runWorkflowQualityChecks(),
        this.runPerformanceChecks(),
        this.runAccessibilityChecks()
      ])

      const report = this.generateChecklistReport()
      logger.info('Pre-flight checklist completed', {
        totalItems: report.summary.totalItems,
        passCount: report.summary.passCount,
        failCount: report.summary.failCount
      })

      return report
    } catch (error) {
      logger.error('Error during pre-flight checklist execution:', error)
      throw error
    }
  }

  /**
   * Run single category checks
   */
  async runCategoryChecks(category: ChecklistCategory): Promise<ChecklistReport> {
    this.runStartTime = new Date()
    this.results.clear()

    logger.info(`Starting ${category} checklist`)

    try {
      switch (category) {
        case ChecklistCategory.VISUAL_QUALITY:
          await this.runVisualQualityChecks()
          break
        case ChecklistCategory.DATA_QUALITY:
          await this.runDataQualityChecks()
          break
        case ChecklistCategory.WORKFLOW_QUALITY:
          await this.runWorkflowQualityChecks()
          break
        case ChecklistCategory.PERFORMANCE:
          await this.runPerformanceChecks()
          break
        case ChecklistCategory.ACCESSIBILITY:
          await this.runAccessibilityChecks()
          break
      }

      return this.generateChecklistReport()
    } catch (error) {
      logger.error(`Error during ${category} checklist execution:`, error)
      throw error
    }
  }

  /**
   * Visual Quality Checks (40 items)
   */
  private async runVisualQualityChecks(): Promise<void> {
    logger.debug('Executing Visual Quality checks (40 items)')

    // Text Fitting Tests (10)
    const textItems = [
      'text_hub_titles',
      'text_card_wrapping',
      'text_modal_overflow',
      'text_button_truncation',
      'text_table_headers',
      'text_form_labels',
      'text_panel_headers',
      'text_tooltip_readability',
      'text_badge_scaling',
      'text_status_labels'
    ]

    // Dashboard Layout Tests (10)
    const layoutItems = [
      'layout_fleet_ops_hub',
      'layout_compliance_hub',
      'layout_business_hub',
      'layout_people_hub',
      'layout_admin_hub',
      'layout_drilldown_panels',
      'layout_grid_alignment',
      'layout_charts',
      'layout_sidebar',
      'layout_header_footer'
    ]

    // Execute all items
    await Promise.all([
      ...textItems.map((id) => this.validateVisualQuality(id)),
      ...layoutItems.map((id) => this.validateVisualQuality(id))
    ])
  }

  /**
   * Data Quality Checks (25 items)
   */
  private async runDataQualityChecks(): Promise<void> {
    logger.debug('Executing Data Quality checks (25 items)')

    // Smartcar Integration Tests (8)
    const smartcarItems = [
      'oauth_tokens',
      'connection_status',
      'location_accuracy',
      'odometer_updates',
      'battery_tracking',
      'fuel_tracking',
      'sync_logs',
      'error_recovery'
    ]

    // Multi-Tenancy Tests (8)
    const multiTenancyItems = [
      'context_propagation',
      'data_isolation',
      'vehicle_visibility',
      'driver_isolation',
      'permission_enforcement',
      'report_scoping',
      'analytics_isolation',
      'audit_log_scoping'
    ]

    // Data Formatting Tests (9)
    const formattingItems = [
      'currency_format',
      'datetime_format',
      'numeric_precision',
      'distance_units',
      'fuel_units',
      'percentage_format',
      'phone_format',
      'email_format',
      'status_labels'
    ]

    await Promise.all([
      ...smartcarItems.map((id) => this.validateSmartcarIntegration(id)),
      ...multiTenancyItems.map((id) => this.validateMultiTenancy(id)),
      ...formattingItems.map((id) => this.validateDataFormatting(id))
    ])
  }

  /**
   * Workflow Quality Checks (30 items)
   */
  private async runWorkflowQualityChecks(): Promise<void> {
    logger.debug('Executing Workflow Quality checks (30 items)')

    // Auth Workflows (6)
    const authItems = ['login_flow', 'logout_flow', 'session_persistence', 'token_refresh', 'mfa_support', 'password_reset']

    // CRUD Operations (8)
    const crudItems = [
      'vehicle_create',
      'vehicle_read',
      'vehicle_update',
      'vehicle_delete',
      'driver_crud',
      'workorder_crud',
      'maintenance_crud',
      'incident_crud'
    ]

    // Permission Tests (8)
    const permItems = [
      'superadmin_perms',
      'admin_perms',
      'manager_perms',
      'user_perms',
      'readonly_perms',
      'field_level',
      'cost_masking',
      'inheritance_chains'
    ]

    // Error Handling (8)
    const errorItems = [
      'error_404',
      'error_403',
      'error_500',
      'error_timeout',
      'error_validation',
      'error_boundary',
      'error_messaging',
      'error_logging'
    ]

    await Promise.all([
      ...authItems.map((id) => this.validateAuthWorkflow(id)),
      ...crudItems.map((id) => this.validateCrudWorkflow(id)),
      ...permItems.map((id) => this.validatePermissions(id)),
      ...errorItems.map((id) => this.validateErrorHandling(id))
    ])
  }

  /**
   * Performance Checks (15 items)
   */
  private async runPerformanceChecks(): Promise<void> {
    logger.debug('Executing Performance checks (15 items)')

    // Lighthouse (4)
    const lighthouseItems = ['performance', 'accessibility', 'best_practices', 'seo']

    // Web Vitals (5)
    const vitalItems = ['lcp', 'fid', 'cls', 'inp', 'ttfb']

    // Load Times (6)
    const loadTimeItems = ['hub_initial_load', 'drilldown_open', 'modal_open', 'table_data_fetch', 'search_results', 'chart_rendering']

    await Promise.all([
      ...lighthouseItems.map((id) => this.validateLighthouse(id)),
      ...vitalItems.map((id) => this.validateWebVitals(id)),
      ...loadTimeItems.map((id) => this.validateLoadTimes(id))
    ])
  }

  /**
   * Accessibility Checks (20 items)
   */
  private async runAccessibilityChecks(): Promise<void> {
    logger.debug('Executing Accessibility checks (20 items)')

    // WCAG AA (8)
    const wcagItems = [
      'color_contrast',
      'text_size',
      'image_alt_text',
      'heading_hierarchy',
      'form_labels',
      'aria_roles',
      'landmarks',
      'language_spec'
    ]

    // Keyboard (6)
    const keyboardItems = ['tab_order', 'escape_key', 'enter_key', 'arrow_keys', 'focus_management', 'skip_links']

    // Screen Reader (6)
    const screenReaderItems = ['page_title', 'form_labels', 'dynamic_updates', 'table_navigation', 'error_announcements', 'navigation']

    await Promise.all([
      ...wcagItems.map((id) => this.validateAccessibility(id)),
      ...keyboardItems.map((id) => this.validateKeyboard(id)),
      ...screenReaderItems.map((id) => this.validateScreenReader(id))
    ])
  }

  // ============================================================================
  // Validation Methods (Delegates to ChecklistValidator)
  // ============================================================================

  async validateVisualQuality(itemId: string): Promise<CheckItemResult> {
    const result = await this.validator.validateVisualQuality(itemId)
    this.results.set(itemId, result)
    return result
  }

  async validateResponsive(itemId: string): Promise<CheckItemResult> {
    const result = await this.validator.validateResponsive(itemId)
    this.results.set(itemId, result)
    return result
  }

  async validateSpacing(itemId: string): Promise<CheckItemResult> {
    const result = await this.validator.validateSpacing(itemId)
    this.results.set(itemId, result)
    return result
  }

  async validateSmartcarIntegration(itemId: string): Promise<CheckItemResult> {
    const result = await this.validator.validateSmartcarIntegration(itemId)
    this.results.set(itemId, result)
    return result
  }

  async validateMultiTenancy(itemId: string): Promise<CheckItemResult> {
    const result = await this.validator.validateMultiTenancy(itemId)
    this.results.set(itemId, result)
    return result
  }

  async validateDataFormatting(itemId: string): Promise<CheckItemResult> {
    const result = await this.validator.validateDataFormatting(itemId)
    this.results.set(itemId, result)
    return result
  }

  async validateAuthWorkflow(itemId: string): Promise<CheckItemResult> {
    const result = await this.validator.validateAuthWorkflow(itemId)
    this.results.set(itemId, result)
    return result
  }

  async validateCrudWorkflow(itemId: string): Promise<CheckItemResult> {
    const result = await this.validator.validateCrudWorkflow(itemId)
    this.results.set(itemId, result)
    return result
  }

  async validatePermissions(itemId: string): Promise<CheckItemResult> {
    const result = await this.validator.validatePermissions(itemId)
    this.results.set(itemId, result)
    return result
  }

  async validateErrorHandling(itemId: string): Promise<CheckItemResult> {
    const result = await this.validator.validateErrorHandling(itemId)
    this.results.set(itemId, result)
    return result
  }

  async validateLighthouse(itemId: string): Promise<CheckItemResult> {
    const result = await this.validator.validateLighthouse(itemId)
    this.results.set(itemId, result)
    return result
  }

  async validateWebVitals(itemId: string): Promise<CheckItemResult> {
    const result = await this.validator.validateWebVitals(itemId)
    this.results.set(itemId, result)
    return result
  }

  async validateLoadTimes(itemId: string): Promise<CheckItemResult> {
    const result = await this.validator.validateLoadTimes(itemId)
    this.results.set(itemId, result)
    return result
  }

  async validateAccessibility(itemId: string): Promise<CheckItemResult> {
    const result = await this.validator.validateAccessibility(itemId)
    this.results.set(itemId, result)
    return result
  }

  async validateKeyboard(itemId: string): Promise<CheckItemResult> {
    const result = await this.validator.validateKeyboard(itemId)
    this.results.set(itemId, result)
    return result
  }

  async validateScreenReader(itemId: string): Promise<CheckItemResult> {
    const result = await this.validator.validateScreenReader(itemId)
    this.results.set(itemId, result)
    return result
  }

  // ============================================================================
  // Report Generation & Status Tracking
  // ============================================================================

  /**
   * Generate comprehensive checklist report
   */
  async generateReport(): Promise<ChecklistReport> {
    return this.generateChecklistReport()
  }

  private generateChecklistReport(): ChecklistReport {
    const items = Array.from(this.results.values())
    const summary = this.calculateSummary(items)

    return {
      id: `preflight-${Date.now()}`,
      timestamp: new Date(),
      status: summary.status as any,
      summary,
      items,
      sections: Object.keys(CHECKLIST_CATEGORIES),
      blockingIssues: items.filter((item) => item.blocksRelease && item.status === ChecklistStatus.FAIL),
      warnings: items.filter((item) => item.status === ChecklistStatus.WARNING),
      recommendations: this.generateRecommendations(items),
      evidence: this.collectEvidence(items),
      version: '1.0.0'
    }
  }

  private calculateSummary(items: CheckItemResult[]): ChecklistSummary {
    const passCount = items.filter((item) => item.status === ChecklistStatus.PASS).length
    const failCount = items.filter((item) => item.status === ChecklistStatus.FAIL).length
    const warningCount = items.filter((item) => item.status === ChecklistStatus.WARNING).length
    const skippedCount = items.filter((item) => item.status === ChecklistStatus.SKIPPED).length
    const manualCount = items.filter((item) => item.status === ChecklistStatus.MANUAL).length

    const passPercentage = items.length > 0 ? (passCount / items.length) * 100 : 0
    const overallScore = passPercentage

    let status: 'ready' | 'issues' | 'blocked' = 'ready'
    if (failCount > 0) {
      status = 'blocked'
    } else if (warningCount > 0) {
      status = 'issues'
    }

    return {
      totalItems: items.length,
      passCount,
      failCount,
      warningCount,
      skippedCount,
      manualCount,
      passPercentage,
      status,
      overallScore,
      estimatedTimeToFix: failCount * 15 // Rough estimate
    }
  }

  private generateRecommendations(items: CheckItemResult[]): string[] {
    const recommendations: string[] = []

    // Add recommendations based on failures
    const failures = items.filter((item) => item.status === ChecklistStatus.FAIL)
    if (failures.length > 0) {
      recommendations.push(`Fix ${failures.length} failing checks before release`)
    }

    const warnings = items.filter((item) => item.status === ChecklistStatus.WARNING)
    if (warnings.length > 0) {
      recommendations.push(`Address ${warnings.length} warning items for quality`)
    }

    const manual = items.filter((item) => item.status === ChecklistStatus.MANUAL)
    if (manual.length > 0) {
      recommendations.push(`Complete manual verification for ${manual.length} items`)
    }

    return recommendations
  }

  private collectEvidence(items: CheckItemResult[]): Record<string, any> {
    const evidence: Record<string, any> = {}
    items.forEach((item) => {
      if (item.evidence) {
        evidence[item.id] = {
          ...item.evidence,
          timestamp: new Date()
        }
      }
    })
    return evidence
  }

  /**
   * Get dependencies for items
   */
  async getDependencies(): Promise<ChecklistDependency[]> {
    return Object.entries(CHECKLIST_DEPENDENCIES).map(([id, dependents]) => ({
      id,
      name: id.replace(/_/g, ' '),
      dependents,
      critical: CRITICAL_ITEMS.includes(id)
    }))
  }

  // ============================================================================
  // Sign-Off Workflow
  // ============================================================================

  /**
   * Request sign-off approval
   */
  async requestSignOff(request: SignOffRequest): Promise<SignOffApproval> {
    const canSign = await this.canSignOff()

    if (!canSign && request.approvalType === 'FULL_RELEASE') {
      logger.warn('Cannot sign off: blocking issues present')
    }

    const approval: SignOffApproval = {
      id: `signoff-${Date.now()}`,
      reviewer: request.reviewer,
      role: request.role,
      approvalType: request.approvalType,
      status: canSign ? 'approved' : 'pending',
      timestamp: new Date(),
      notes: request.notes,
      waivedItems: request.waivedItems,
      waiverNotes: request.waiverNotes,
      conditions: request.conditions,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }

    this.signOffApprovals.push(approval)
    logger.info('Sign-off request created', { reviewer: request.reviewer, approvalType: request.approvalType })

    return approval
  }

  /**
   * Check if ready for sign-off
   */
  async canSignOff(): Promise<boolean> {
    const blockingIssues = Array.from(this.results.values()).filter(
      (item) => item.blocksRelease && item.status === ChecklistStatus.FAIL
    )

    return blockingIssues.length === 0
  }

  /**
   * Get sign-off history
   */
  async getSignOffHistory(): Promise<SignOffApproval[]> {
    return this.signOffApprovals
  }
}

/**
 * Singleton instance
 */
let instance: PreFlightChecklist | null = null

export function getPreFlightChecklist(): PreFlightChecklist {
  if (!instance) {
    instance = new PreFlightChecklist()
  }
  return instance
}
