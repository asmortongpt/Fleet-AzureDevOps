/**
 * Service Registry
 * Provides singleton instances of validation services shared across all routes
 * and request handlers to ensure consistent state
 *
 * @module validation/ServiceRegistry
 * @author Claude Code - Task 15
 * @date 2026-02-25
 */

import { IssueTracker } from './IssueTracker'
import { DashboardService } from './DashboardService'
import { PreFlightChecklist } from './PreFlightChecklist'
import { logger } from '../lib/logger'
import { type ApprovalSignOff, type HandoffReport } from './models/HandoffModels'

let issueTrackerInstance: IssueTracker | null = null
let dashboardServiceInstance: DashboardService | null = null
let checklistInstance: PreFlightChecklist | null = null
let persistentApprovals: ApprovalSignOff[] = []
let persistentReports: Map<string, HandoffReport> = new Map()

/**
 * Get shared IssueTracker instance
 * Creates on first call, returns same instance thereafter
 */
export function getIssueTracker(): IssueTracker {
  if (!issueTrackerInstance) {
    logger.debug('Initializing IssueTracker singleton')
    issueTrackerInstance = new IssueTracker()
  }
  return issueTrackerInstance
}

/**
 * Get shared DashboardService instance
 * Creates on first call, returns same instance thereafter
 * Uses the shared IssueTracker instance
 */
export function getDashboardService(): DashboardService {
  if (!dashboardServiceInstance) {
    logger.debug('Initializing DashboardService singleton')
    dashboardServiceInstance = new DashboardService(getIssueTracker())
  }
  return dashboardServiceInstance
}

/**
 * Get shared PreFlightChecklist instance
 * Creates on first call, returns same instance thereafter
 */
export function getPreFlightChecklist(): PreFlightChecklist {
  if (!checklistInstance) {
    logger.debug('Initializing PreFlightChecklist singleton')
    checklistInstance = new PreFlightChecklist()
  }
  return checklistInstance
}

/**
 * Get persistent approvals storage
 * Used by HandoffReportGenerator to persist approvals across requests
 */
export function getPersistentApprovals(): ApprovalSignOff[] {
  return persistentApprovals
}

/**
 * Add approval to persistent storage
 */
export function addPersistentApproval(approval: ApprovalSignOff): void {
  const existing = persistentApprovals.findIndex(a => a.role === approval.role)
  if (existing >= 0) {
    persistentApprovals[existing] = approval
  } else {
    persistentApprovals.push(approval)
  }
}

/**
 * Get persistent reports storage
 * Used by HandoffReportGenerator to persist saved reports across requests
 */
export function getPersistentReports(): Map<string, HandoffReport> {
  return persistentReports
}

/**
 * Save report to persistent storage
 */
export function savePersistentReport(reportId: string, report: HandoffReport): void {
  persistentReports.set(reportId, report)
}

/**
 * Reset all service instances (for testing only)
 */
export function resetServiceRegistry(): void {
  issueTrackerInstance = null
  dashboardServiceInstance = null
  checklistInstance = null
  persistentApprovals = []
  persistentReports = new Map()
  logger.debug('Service registry reset')
}

export default {
  getIssueTracker,
  getDashboardService,
  getPreFlightChecklist,
  resetServiceRegistry
}
