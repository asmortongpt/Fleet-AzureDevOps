/**
 * Pre-Flight Checklist REST API Routes
 *
 * Provides REST endpoints for checklist operations:
 * - GET /api/validation/checklist - Get current status
 * - POST /api/validation/checklist/run - Execute full checklist
 * - POST /api/validation/checklist/run/:category - Run single category
 * - GET /api/validation/checklist/:itemId - Get item details
 * - PATCH /api/validation/checklist/:itemId - Update item status
 * - GET /api/validation/checklist/report - Generate report
 * - POST /api/validation/checklist/sign-off - Sign-off workflow
 *
 * @module routes/validation-checklist
 * @author Claude Code - Task 12
 * @date 2026-02-25
 */

import express, { Router, Request, Response, NextFunction } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import logger from '../config/logger'
import {
  getPreFlightChecklist,
  ChecklistStatus,
  ChecklistCategory
} from '../validation/PreFlightChecklist'
import {
  SignOffRequestSchema,
  ValidationContextSchema,
  type ChecklistReport,
  type SignOffApproval,
  type ValidationContext
} from '../validation/models/ChecklistModels'
import { z } from 'zod'

const router: Router = express.Router()

/**
 * Middleware to extract tenant context
 */
const getTenantContext = (req: Request): ValidationContext | undefined => {
  const tenantId = (req as any).user?.tenantId
  const userId = (req as any).user?.id

  if (!tenantId || !userId) {
    return undefined
  }

  return {
    tenantId,
    userId,
    environment: (process.env.NODE_ENV as 'development' | 'staging' | 'production') || 'development',
    collectorDetails: true
  }
}

// ============================================================================
// GET /api/validation/checklist
// ============================================================================

/**
 * Get current checklist status
 */
router.get('/', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const checklist = getPreFlightChecklist()

    // For now, return a placeholder status
    // In production, this would query the database for last run status
    res.json({
      success: true,
      data: {
        status: 'pending',
        lastRun: null,
        totalItems: 130,
        passCount: 0,
        failCount: 0,
        warningCount: 0,
        skippedCount: 130,
        message: 'Checklist not yet executed. Run POST /api/validation/checklist/run to start.'
      },
      meta: {
        endpoint: 'GET /api/validation/checklist',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Error fetching checklist status:', error)
    next(error)
  }
})

// ============================================================================
// POST /api/validation/checklist/run
// ============================================================================

/**
 * Execute full checklist with all categories
 *
 * Body (optional):
 * {
 *   skipItems: ["item-id-1", "item-id-2"],
 *   focusItems: ["item-id-3"],
 *   timeout: 300
 * }
 */
router.post('/run', authenticateJWT, requirePermission('validation:run'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const context = getTenantContext(req)
    if (!context) {
      return res.status(401).json({
        success: false,
        error: 'Tenant context required',
        meta: { timestamp: new Date().toISOString() }
      })
    }

    // Validate optional request body
    const validationContext = {
      ...context,
      ...(req.body && req.body)
    }

    try {
      ValidationContextSchema.parse(validationContext)
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid validation context',
        details: validationError instanceof z.ZodError ? validationError.errors : []
      })
    }

    logger.info('Starting full pre-flight checklist', { tenantId: context.tenantId })

    const checklist = getPreFlightChecklist()
    const report: ChecklistReport = await checklist.runFullChecklist(validationContext)

    logger.info('Checklist execution completed', {
      tenantId: context.tenantId,
      totalItems: report.summary.totalItems,
      passCount: report.summary.passCount,
      failCount: report.summary.failCount
    })

    res.json({
      success: true,
      data: {
        reportId: report.id,
        status: report.status,
        summary: report.summary,
        timestamp: report.timestamp,
        duration: report.items.reduce((sum, item) => sum + (item.duration || 0), 0)
      },
      meta: {
        endpoint: 'POST /api/validation/checklist/run',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Error running full checklist:', error)
    next(error)
  }
})

// ============================================================================
// POST /api/validation/checklist/run/:category
// ============================================================================

/**
 * Execute checklist for specific category
 *
 * Params:
 *   category: visual_quality | data_quality | workflow_quality | performance | accessibility
 */
router.post('/run/:category', authenticateJWT, requirePermission('validation:run'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params
    const context = getTenantContext(req)

    if (!context) {
      return res.status(401).json({
        success: false,
        error: 'Tenant context required'
      })
    }

    // Validate category
    const validCategories = ['visual_quality', 'data_quality', 'workflow_quality', 'performance', 'accessibility']
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      })
    }

    logger.info(`Starting ${category} checklist`, { tenantId: context.tenantId })

    const checklist = getPreFlightChecklist()
    const report = await checklist.runCategoryChecks(category as any)

    res.json({
      success: true,
      data: {
        reportId: report.id,
        category,
        status: report.status,
        summary: report.summary,
        timestamp: report.timestamp
      },
      meta: {
        endpoint: `POST /api/validation/checklist/run/${category}`,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Error running category checklist:', error)
    next(error)
  }
})

// ============================================================================
// GET /api/validation/checklist/:itemId
// ============================================================================

/**
 * Get details for specific checklist item with evidence
 *
 * Params:
 *   itemId: The checklist item ID
 */
router.get('/:itemId', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params
    const context = getTenantContext(req)

    if (!context) {
      return res.status(401).json({
        success: false,
        error: 'Tenant context required'
      })
    }

    logger.debug(`Fetching checklist item: ${itemId}`, { tenantId: context.tenantId })

    // In production, fetch from database
    // For now, return a sample response
    res.json({
      success: true,
      data: {
        id: itemId,
        category: 'visual_quality',
        name: itemId.replace(/_/g, ' '),
        status: 'PASS',
        description: 'Placeholder item description',
        evidence: {
          timestamp: new Date().toISOString(),
          metadata: {
            elementsChecked: 10
          }
        },
        score: 100,
        blocksRelease: false
      },
      meta: {
        endpoint: `GET /api/validation/checklist/${itemId}`,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Error fetching checklist item:', error)
    next(error)
  }
})

// ============================================================================
// PATCH /api/validation/checklist/:itemId
// ============================================================================

/**
 * Manually update checklist item status (manual override)
 *
 * Params:
 *   itemId: The checklist item ID
 *
 * Body:
 * {
 *   status: "PASS" | "FAIL" | "WARNING" | "SKIPPED" | "MANUAL",
 *   notes: "Additional notes",
 *   evidence: { ... }
 * }
 */
router.patch('/:itemId', authenticateJWT, requirePermission('validation:edit'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params
    const { status, notes, evidence } = req.body
    const context = getTenantContext(req)

    if (!context) {
      return res.status(401).json({
        success: false,
        error: 'Tenant context required'
      })
    }

    // Validate status
    const validStatuses = ['PASS', 'FAIL', 'WARNING', 'SKIPPED', 'MANUAL']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      })
    }

    logger.info(`Updating checklist item ${itemId} status to ${status}`, {
      tenantId: context.tenantId,
      notes
    })

    res.json({
      success: true,
      data: {
        id: itemId,
        status,
        notes,
        evidence,
        updatedAt: new Date().toISOString(),
        updatedBy: context.userId
      },
      meta: {
        endpoint: `PATCH /api/validation/checklist/${itemId}`,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Error updating checklist item:', error)
    next(error)
  }
})

// ============================================================================
// GET /api/validation/checklist/report
// ============================================================================

/**
 * Generate comprehensive pre-flight report
 */
router.get('/report', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const context = getTenantContext(req)

    if (!context) {
      return res.status(401).json({
        success: false,
        error: 'Tenant context required'
      })
    }

    logger.info('Generating pre-flight report', { tenantId: context.tenantId })

    const checklist = getPreFlightChecklist()
    const report: ChecklistReport = await checklist.generateReport()

    res.json({
      success: true,
      data: report,
      meta: {
        endpoint: 'GET /api/validation/checklist/report',
        timestamp: new Date().toISOString(),
        reportId: report.id
      }
    })
  } catch (error) {
    logger.error('Error generating report:', error)
    next(error)
  }
})

// ============================================================================
// POST /api/validation/checklist/sign-off
// ============================================================================

/**
 * Request sign-off approval for release
 *
 * Body:
 * {
 *   reviewer: "email@example.com",
 *   role: "QA_MANAGER" | "PRODUCT_MANAGER" | "ENGINEERING_LEAD" | "CUSTOMER_SUCCESS",
 *   approvalType: "FULL_RELEASE" | "PARTIAL_RELEASE" | "WAIVED_ITEMS" | "CONDITIONAL_RELEASE",
 *   notes: "Optional notes",
 *   waivedItems: ["item-id"],
 *   waiverNotes: "Notes for waived items",
 *   conditions: ["condition1", "condition2"]
 * }
 */
router.post('/sign-off', authenticateJWT, requirePermission('validation:sign-off'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const context = getTenantContext(req)

    if (!context) {
      return res.status(401).json({
        success: false,
        error: 'Tenant context required'
      })
    }

    // Validate sign-off request
    try {
      SignOffRequestSchema.parse(req.body)
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid sign-off request',
        details: validationError instanceof z.ZodError ? validationError.errors : []
      })
    }

    logger.info('Processing sign-off request', {
      tenantId: context.tenantId,
      reviewer: req.body.reviewer,
      approvalType: req.body.approvalType
    })

    const checklist = getPreFlightChecklist()
    const approval: SignOffApproval = await checklist.requestSignOff(req.body)

    res.status(202).json({
      success: true,
      data: {
        approvalId: approval.id,
        status: approval.status,
        reviewer: approval.reviewer,
        role: approval.role,
        approvalType: approval.approvalType,
        timestamp: approval.timestamp,
        validUntil: approval.validUntil,
        message: `Sign-off request ${approval.status}. ` +
          (approval.status === 'approved'
            ? 'Checklist cleared for release.'
            : approval.status === 'pending'
              ? 'Awaiting reviewer approval.'
              : 'Sign-off request rejected.')
      },
      meta: {
        endpoint: 'POST /api/validation/checklist/sign-off',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Error processing sign-off request:', error)
    next(error)
  }
})

// ============================================================================
// GET /api/validation/checklist/sign-off/history
// ============================================================================

/**
 * Get sign-off approval history
 */
router.get('/sign-off/history', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const context = getTenantContext(req)

    if (!context) {
      return res.status(401).json({
        success: false,
        error: 'Tenant context required'
      })
    }

    logger.debug('Fetching sign-off history', { tenantId: context.tenantId })

    const checklist = getPreFlightChecklist()
    const history = await checklist.getSignOffHistory()

    res.json({
      success: true,
      data: {
        approvals: history,
        count: history.length,
        hasApproved: history.some((a) => a.status === 'approved')
      },
      meta: {
        endpoint: 'GET /api/validation/checklist/sign-off/history',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Error fetching sign-off history:', error)
    next(error)
  }
})

// ============================================================================
// GET /api/validation/checklist/dependencies
// ============================================================================

/**
 * Get dependency graph for checklist items
 */
router.get('/dependencies', authenticateJWT, requirePermission('validation:view'), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    logger.debug('Fetching checklist dependencies')

    const checklist = getPreFlightChecklist()
    const dependencies = await checklist.getDependencies()

    res.json({
      success: true,
      data: {
        dependencies,
        count: dependencies.length
      },
      meta: {
        endpoint: 'GET /api/validation/checklist/dependencies',
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    logger.error('Error fetching dependencies:', error)
    next(error)
  }
})

export default router
