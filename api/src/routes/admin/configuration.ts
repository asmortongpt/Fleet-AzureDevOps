/**
 * CONFIGURATION API ROUTES
 *
 * CTA Owner configuration management endpoints
 * Requires CTA_OWNER role for all operations
 */

import { Router, Request, Response, NextFunction } from 'express'

import { configurationService } from '../../services/configuration/configuration-service'
import { logger } from '../../utils/logger'
import type { PolicyRule } from '../../services/configuration/types'
import { authenticateJWT } from '../middleware/auth'

const router = Router()

// Apply authentication to all routes
router.use(authenticateJWT)

// Middleware to check CTA Owner role
const requireCTAOwner = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as Request & { user?: { role?: string } }
  const userRole = (authReq.user?.role ?? '').toUpperCase()

  if (userRole !== 'CTA_OWNER' && userRole !== 'ADMIN' && userRole !== 'SUPERADMIN') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This endpoint requires CTA Owner role'
    })
  }

  next()
}

// ============================================================================
// CONFIGURATION CRUD
// ============================================================================

/**
 * GET /api/admin/config
 * Get all configuration items (optionally filtered)
 */
router.get('/config', requireCTAOwner, async (req, res) => {
  try {
    const { category, requiresCTAOwner, visibleToRole } = req.query

    const configs = configurationService.getAllConfig({
      category: category as string,
      requiresCTAOwner: requiresCTAOwner === 'true',
      visibleToRole: visibleToRole as string
    })

    return res.json({
      success: true,
      data: {
        configs,
        total: configs.length,
        categories: [...new Set(configs.map(c => c.category))]
      }
    })
  } catch (error: unknown) {
    logger.error('[Configuration API] Error fetching configs:', { error })
    return res.status(500).json({
      error: 'Failed to fetch configurations',
      message: error instanceof Error ? error.message : 'Internal server error'
    })
  }
})

/**
 * GET /api/admin/config/:key
 * Get specific configuration item
 */
router.get('/config/:key', requireCTAOwner, async (req, res) => {
  try {
    const { key } = req.params
    const config = configurationService.getConfig(key)

    if (!config) {
      return res.status(404).json({
        error: 'Configuration not found',
        message: `No configuration found with key: ${key}`
      })
    }

    return res.json({
      success: true,
      data: config
    })
  } catch (error: unknown) {
    logger.error('[Configuration API] Error fetching config:', { error })
    return res.status(500).json({
      error: 'Failed to fetch configuration',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    })
  }
})

/**
 * PUT /api/admin/config/:key
 * Update configuration value
 */
router.put('/config/:key', requireCTAOwner, async (req, res) => {
  try {
    const { key } = req.params
    const { value, reason } = req.body
    const authReq = req as Request & { user?: { id?: string } }
    const changedBy = authReq.user?.id ?? 'UNKNOWN'

    const change = await configurationService.updateConfig(
      key,
      value,
      changedBy,
      'manual',
      reason
    )

    return res.json({
      success: true,
      data: {
        change,
        updatedConfig: configurationService.getConfig(key)
      },
      message: `Configuration "${key}" updated successfully`
    })
  } catch (error: unknown) {
    logger.error('[Configuration API] Error updating config:', { error })
    return res.status(400).json({
      error: 'Failed to update configuration',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    })
  }
})

/**
 * POST /api/admin/config/:changeId/rollback
 * Rollback a configuration change
 */
router.post('/config/:changeId/rollback', requireCTAOwner, async (req, res) => {
  try {
    const { changeId } = req.params
    const authReq = req as Request & { user?: { id?: string } }
    const rolledBackBy = authReq.user?.id ?? 'UNKNOWN'

    await configurationService.rollbackConfig(changeId, rolledBackBy)

    return res.json({
      success: true,
      message: 'Configuration rolled back successfully'
    })
  } catch (error: unknown) {
    logger.error('[Configuration API] Error rolling back config:', { error })
    return res.status(400).json({
      error: 'Failed to rollback configuration',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    })
  }
})

// ============================================================================
// CONFIGURATION PROFILES
// ============================================================================

/**
 * POST /api/admin/config/profiles
 * Create configuration profile
 */
router.post('/config/profiles', requireCTAOwner, async (req, res) => {
  try {
    const { name, description, settings } = req.body
    const authReq = req as Request & { user?: { id?: string } }
    const createdBy = authReq.user?.id ?? 'UNKNOWN'

    const profile = await configurationService.createProfile(
      name,
      description,
      settings,
      createdBy
    )

    return res.json({
      success: true,
      data: profile,
      message: 'Configuration profile created successfully'
    })
  } catch (error: unknown) {
    logger.error('[Configuration API] Error creating profile:', { error })
    return res.status(400).json({
      error: 'Failed to create profile',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    })
  }
})

/**
 * POST /api/admin/config/profiles/:profileId/apply
 * Apply configuration profile
 */
router.post('/config/profiles/:profileId/apply', requireCTAOwner, async (req, res) => {
  try {
    const { profileId } = req.params
    const authReq = req as Request & { user?: { id?: string } }
    const appliedBy = authReq.user?.id ?? 'UNKNOWN'

    await configurationService.applyProfile(profileId, appliedBy)

    return res.json({
      success: true,
      message: 'Configuration profile applied successfully'
    })
  } catch (error: unknown) {
    logger.error('[Configuration API] Error applying profile:', { error })
    return res.status(400).json({
      error: 'Failed to apply profile',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    })
  }
})

// ============================================================================
// INITIAL SETUP WIZARD
// ============================================================================

/**
 * POST /api/admin/config/setup/start
 * Start initial setup wizard
 */
router.post('/config/setup/start', requireCTAOwner, async (req, res) => {
  try {
    const { organizationId } = req.body

    if (!organizationId) {
      return res.status(400).json({
        error: 'Organization ID required',
        message: 'Please provide organizationId'
      })
    }

    const setup = await configurationService.startInitialSetup(organizationId)

    return res.json({
      success: true,
      data: setup,
      message: 'Initial setup wizard started'
    })
  } catch (error: unknown) {
    logger.error('[Configuration API] Error starting setup:', { error })
    return res.status(400).json({
      error: 'Failed to start setup',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    })
  }
})

/**
 * POST /api/admin/config/setup/steps/:stepId/complete
 * Complete a setup step
 */
router.post('/config/setup/steps/:stepId/complete', requireCTAOwner, async (req, res) => {
  try {
    const { stepId } = req.params
    const { values } = req.body

    await configurationService.completeSetupStep(stepId, values)

    return res.json({
      success: true,
      message: 'Setup step completed successfully'
    })
  } catch (error: unknown) {
    logger.error('[Configuration API] Error completing setup step:', { error })
    return res.status(400).json({
      error: 'Failed to complete setup step',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    })
  }
})

// ============================================================================
// POLICY ENGINE INTEGRATION
// ============================================================================

/**
 * POST /api/admin/config/apply-policy
 * Apply policy rule to configuration
 * This is called by the Policy Hub when rules are created/updated
 */
router.post('/config/apply-policy', requireCTAOwner, async (req, res) => {
  try {
    const policyRule: PolicyRule = req.body

    if (!policyRule || !policyRule.id) {
      return res.status(400).json({
        error: 'Invalid policy rule',
        message: 'Please provide a valid policy rule object'
      })
    }

    await configurationService.applyPolicyRule(policyRule)

    return res.json({
      success: true,
      message: `Policy rule "${policyRule.name}" applied successfully`
    })
  } catch (error: unknown) {
    logger.error('[Configuration API] Error applying policy:', { error })
    return res.status(400).json({
      error: 'Failed to apply policy rule',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    })
  }
})

// ============================================================================
// AUDIT & HISTORY
// ============================================================================

/**
 * GET /api/admin/config/history
 * Get configuration change history
 */
router.get('/config/history', requireCTAOwner, async (req, res) => {
  try {
    const { configKey, changedBy, source, limit } = req.query

    const changes = configurationService.getChangeHistory({
      configKey: configKey as string,
      changedBy: changedBy as string,
      source: source as string,
      limit: limit ? parseInt(limit as string) : undefined
    })

    return res.json({
      success: true,
      data: {
        changes,
        total: changes.length
      }
    })
  } catch (error: unknown) {
    logger.error('[Configuration API] Error fetching history:', { error })
    return res.status(500).json({
      error: 'Failed to fetch change history',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    })
  }
})

// ============================================================================
// EXPORT & IMPORT
// ============================================================================

/**
 * GET /api/admin/config/export
 * Export full system configuration
 */
router.get('/config/export', requireCTAOwner, async (req, res) => {
  try {
    const configuration = configurationService.exportConfiguration()

    return res.json({
      success: true,
      data: configuration,
      exportedAt: new Date().toISOString()
    })
  } catch (error: unknown) {
    logger.error('[Configuration API] Error exporting config:', { error })
    return res.status(500).json({
      error: 'Failed to export configuration',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    })
  }
})

/**
 * GET /api/admin/config/stats
 * Get configuration statistics
 */
router.get('/config/stats', requireCTAOwner, async (req, res) => {
  try {
    const allConfigs = configurationService.getAllConfig()
    const changes = configurationService.getChangeHistory({ limit: 100 })

    const stats = {
      totalConfigs: allConfigs.length,
      byCategory: {} as Record<string, number>,
      ctaOwnerOnly: allConfigs.filter(c => c.requiresCTAOwner).length,
      recentChanges: changes.length,
      changesBySource: {} as Record<string, number>
    }

    // Count by category
    allConfigs.forEach(config => {
      stats.byCategory[config.category] = (stats.byCategory[config.category] || 0) + 1
    })

    // Count changes by source
    changes.forEach(change => {
      stats.changesBySource[change.source] = (stats.changesBySource[change.source] || 0) + 1
    })

    return res.json({
      success: true,
      data: stats
    })
  } catch (error: unknown) {
    logger.error('[Configuration API] Error fetching stats:', { error })
    return res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    })
  }
})

export default router
