/**
 * Fleet Management - Message Sync Routes
 *
 * Endpoints:
 * - POST /api/sync/teams/:teamId/channels/:channelId - Manual sync Teams channel
 * - POST /api/sync/outlook/folders/:folderId - Manual sync Outlook folder
 * - GET /api/sync/status - Get sync status for all resources
 * - POST /api/sync/full - Force full re-sync (admin only)
 * - GET /api/sync/errors - Get recent sync errors
 * - GET /api/sync/jobs - Get recent sync jobs
 * - POST /api/sync/teams/all - Sync all Teams channels
 * - POST /api/sync/outlook/all - Sync all Outlook folders
 * - DELETE /api/sync/errors/:id - Resolve sync error
 * - GET /api/sync/health - Get sync service health status
 */

import { Router, Request, Response } from 'express'

import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import logger from '../config/logger' // Wave 26: Add Winston logger
import outlookSync from '../jobs/outlook-sync.job'
import teamsSync from '../jobs/teams-sync.job'
import { csrfProtection } from '../middleware/csrf'
import syncService from '../services/sync.service'
import { getErrorMessage } from '../utils/error-handler'
import { SyncRepository } from '../repositories/SyncRepository'
import { TYPES } from '../types'

const router = Router()

// Get repository from DI container
const syncRepository = container.get<SyncRepository>(TYPES.SyncRepository)

/**
 * @openapi
 * /api/sync/teams/{teamId}/channels/{channelId}:
 *   post:
 *     summary: Manually trigger Teams channel sync
 *     description: Sync messages from a specific Teams channel
 *     tags:
 *       - Sync
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teams team ID
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Teams channel ID
 *     responses:
 *       200:
 *         description: Sync completed successfully
 *       500:
 *         description: Sync failed
 */
router.post(`/teams/:teamId/channels/:channelId`, csrfProtection, async (req: Request, res: Response) => {
  try {
    const { teamId, channelId } = req.params
    const userId = (req as any).user?.id

    console.log(`Manual Teams sync requested: ${teamId}/${channelId} by user ${userId}`)

    const result = await syncService.syncTeamsMessages(teamId, channelId)

    res.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
      message: `Synced ${result.synced} messages with ${result.errors} errors`
    })
  } catch (error: any) {
    logger.error(`Error syncing Teams channel:`, error) // Wave 26: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to sync Teams channel',
      message: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/sync/outlook/folders/{folderId}:
 *   post:
 *     summary: Manually trigger Outlook folder sync
 *     description: Sync emails from a specific Outlook folder
 *     tags:
 *       - Sync
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Outlook folder ID
 *     responses:
 *       200:
 *         description: Sync completed successfully
 *       500:
 *         description: Sync failed
 */
router.post(`/outlook/folders/:folderId`, csrfProtection, async (req: Request, res: Response) => {
  try {
    const { folderId } = req.params
    const userId = (req as any).user?.id

    console.log(`Manual Outlook sync requested: ${folderId} by user ${userId}`)

    const result = await syncService.syncOutlookEmails(folderId)

    res.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
      message: `Synced ${result.synced} emails with ${result.errors} errors`
    })
  } catch (error: any) {
    logger.error(`Error syncing Outlook folder:`, error) // Wave 26: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to sync Outlook folder',
      message: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/sync/status:
 *   get:
 *     summary: Get sync status for all resources
 *     description: Returns sync state for all Teams channels and Outlook folders
 *     tags:
 *       - Sync
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync status retrieved successfully
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await syncService.getSyncStatus()

    res.json({
      success: true,
      status,
      totalResources: status.length
    })
  } catch (error: any) {
    logger.error('Error getting sync status:', error) // Wave 26: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to get sync status',
      message: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/sync/full:
 *   post:
 *     summary: Force full re-sync (admin only)
 *     description: Clears delta tokens and performs full sync of all resources
 *     tags:
 *       - Sync
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Full sync initiated
 *       403:
 *         description: Insufficient permissions
 */
router.post('/full',csrfProtection, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role

    // Only admins can trigger full re-sync
    if (userRole !== 'admin' && userRole !== 'fleet_manager') {
      return res.status(403).json({
        success: false,
        error: `Insufficient permissions. Only admins can trigger full re-sync.`
      })
    }

    console.log(`Full re-sync requested by ${(req as any).user?.email}`)

    // Clear all delta tokens
    await syncRepository.clearAllDeltaTokens()

    // Trigger both sync jobs
    const teamsResult = await syncService.syncAllTeamsChannels()
    const outlookResult = await syncService.syncAllOutlookFolders()

    res.json({
      success: true,
      teams: {
        synced: teamsResult.totalSynced,
        errors: teamsResult.totalErrors
      },
      outlook: {
        synced: outlookResult.totalSynced,
        errors: outlookResult.totalErrors
      },
      message: `Full re-sync completed`
    })
  } catch (error: any) {
    logger.error(`Error during full re-sync:`, error) // Wave 26: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to perform full re-sync',
      message: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/sync/errors:
 *   get:
 *     summary: Get recent sync errors
 *     description: Returns list of unresolved sync errors
 *     tags:
 *       - Sync
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of errors to return *     responses:
 *       200:
 *         description: Sync errors retrieved successfully
 */
router.get('/errors', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50

    const errors = await syncService.getRecentSyncErrors(limit)

    res.json({
      success: true,
      errors,
      totalErrors: errors.length
    })
  } catch (error: any) {
    logger.error('Error getting sync errors:', error) // Wave 26: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to get sync errors',
      message: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/sync/jobs:
 *   get:
 *     summary: Get recent sync jobs
 *     description: Returns history of sync job executions
 *     tags:
 *       - Sync
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of jobs to return
 *     responses:
 *       200:
 *         description: Sync jobs retrieved successfully
 */
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50

    const jobs = await syncRepository.getRecentJobs(limit)

    res.json({
      success: true,
      jobs: jobs,
      totalJobs: jobs.length
    })
  } catch (error: any) {
    logger.error('Error getting sync jobs:', error) // Wave 26: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to get sync jobs',
      message: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/sync/teams/all:
 *   post:
 *     summary: Sync all Teams channels
 *     description: Manually trigger sync for all subscribed Teams channels
 *     tags:
 *       - Sync
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync completed successfully
 */
router.post(`/teams/all`, csrfProtection, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id

    console.log(`Manual sync all Teams channels requested by user ${userId}`)

    const result = await syncService.syncAllTeamsChannels()

    res.json({
      success: true,
      synced: result.totalSynced,
      errors: result.totalErrors,
      message: `Synced ${result.totalSynced} messages with ${result.totalErrors} errors`
    })
  } catch (error: any) {
    logger.error(`Error syncing all Teams channels:`, error) // Wave 26: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to sync Teams channels',
      message: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/sync/outlook/all:
 *   post:
 *     summary: Sync all Outlook folders
 *     description: Manually trigger sync for all subscribed Outlook folders
 *     tags:
 *       - Sync
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync completed successfully
 */
router.post(`/outlook/all`, csrfProtection, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id

    console.log(`Manual sync all Outlook folders requested by user ${userId}`)

    const result = await syncService.syncAllOutlookFolders()

    res.json({
      success: true,
      synced: result.totalSynced,
      errors: result.totalErrors,
      message: `Synced ${result.totalSynced} emails with ${result.totalErrors} errors`
    })
  } catch (error: any) {
    logger.error(`Error syncing all Outlook folders:`, error) // Wave 26: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to sync Outlook folders',
      message: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/sync/errors/{id}:
 *   delete:
 *     summary: Resolve sync error
 *     description: Mark a sync error as resolved
 *     tags:
 *       - Sync
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Error ID
 *     responses:
 *       200:
 *         description: Error resolved successfully
 */
router.delete('/errors/:id',csrfProtection, async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await syncRepository.resolveError(id)

    res.json({
      success: true,
      message: `Error marked as resolved`
    })
  } catch (error: any) {
    logger.error('Error resolving sync error:', error) // Wave 26: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to resolve error',
      message: getErrorMessage(error)
    })
  }
})

/**
 * @openapi
 * /api/sync/health:
 *   get:
 *     summary: Get sync service health status
 *     description: Returns health metrics for sync jobs and webhooks
 *     tags:
 *       - Sync
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Health status retrieved successfully
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Check webhook health
    const webhooksHealthy = await syncService.areWebhooksHealthy()

    // Get recent job stats
    const jobStats = await syncRepository.getJobStats()

    // Get error stats
    const errorStats = await syncRepository.getErrorStats()

    // Get sync state stats
    const syncStateStats = await syncRepository.getSyncStateStats()

    const teamsStatus = teamsSync.getStatus()
    const outlookStatus = outlookSync.getStatus()

    res.json({
      success: true,
      health: {
        webhooks: {
          healthy: webhooksHealthy,
          status: webhooksHealthy ? 'active' : 'inactive'
        },
        jobs: {
          teams: teamsStatus,
          outlook: outlookStatus,
          stats: jobStats
        },
        errors: {
          total: parseInt(errorStats.total_errors?.toString() || '0') || 0,
          unresolved: parseInt(errorStats.unresolved_errors?.toString() || '0') || 0
        },
        syncState: syncStateStats
      }
    })
  } catch (error: any) {
    logger.error('Error getting sync health:', error) // Wave 26: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to get health status',
      message: getErrorMessage(error)
    })
  }
})

export default router
