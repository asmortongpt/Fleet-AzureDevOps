import express, { Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError } from '../errors/app-error'
import logger from '../config/logger'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { rateLimit } from '../middleware/rateLimit'
import { csrfProtection } from '../middleware/csrf'
import { VideoEventRepository } from '../repositories/VideoEventRepository'
import { TYPES } from '../types'

const router = express.Router()
router.use(authenticateJWT)
// Rate limit all video event endpoints to 10 requests per minute
router.use(rateLimit(10, 60000))

/**
 * GET /video-events
 *
 * List all video events for the authenticated tenant with pagination
 * Security: JWT auth, permission check, tenant isolation via repository
 */
router.get(
  '/',
  requirePermission('video_event:view:global'),
  auditLog({ action: 'READ', resourceType: 'video_events' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const repository = container.get<VideoEventRepository>(TYPES.VideoEventRepository)

    const { page = 1, limit = 50 } = req.query

    const context = {
      userId: req.user!.id,
      tenantId: req.user!.tenant_id
    }

    const result = await repository.findAllPaginated(context, {
      page: Number(page),
      limit: Number(limit),
      sortBy: 'event_time',
      sortOrder: 'DESC'
    })

    res.json(result)
  })
)

/**
 * GET /video-events/:id
 *
 * Get a single video event by ID
 * Security: JWT auth, permission check, tenant isolation via repository
 */
router.get(
  '/:id',
  requirePermission('video_event:view:global'),
  auditLog({ action: 'READ', resourceType: 'video_events' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const repository = container.get<VideoEventRepository>(TYPES.VideoEventRepository)

    const context = {
      userId: req.user!.id,
      tenantId: req.user!.tenant_id
    }

    const videoEvent = await repository.findById(req.params.id, context)

    if (!videoEvent) {
      throw new NotFoundError('VideoEvent')
    }

    res.json(videoEvent)
  })
)

/**
 * POST /video-events
 *
 * Create a new video event
 * Security: JWT auth, CSRF protection, permission check, tenant isolation via repository
 */
router.post(
  '/',
  csrfProtection,
  requirePermission('video_event:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'video_events' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const repository = container.get<VideoEventRepository>(TYPES.VideoEventRepository)

    const context = {
      userId: req.user!.id,
      tenantId: req.user!.tenant_id
    }

    // Remove id and tenant_id from request body to prevent tampering
    const { id, tenant_id, ...data } = req.body

    const videoEvent = await repository.create(data, context)

    res.status(201).json(videoEvent)
  })
)

/**
 * PUT /video-events/:id
 *
 * Update an existing video event
 * Security: JWT auth, CSRF protection, permission check, tenant isolation via repository
 */
router.put(
  '/:id',
  csrfProtection,
  requirePermission('video_event:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'video_events' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const repository = container.get<VideoEventRepository>(TYPES.VideoEventRepository)

    const context = {
      userId: req.user!.id,
      tenantId: req.user!.tenant_id
    }

    // Remove id and tenant_id from request body to prevent tampering
    const { id, tenant_id, ...data } = req.body

    const videoEvent = await repository.update(req.params.id, data, context)

    res.json(videoEvent)
  })
)

/**
 * DELETE /video-events/:id
 *
 * Delete a video event
 * Security: JWT auth, CSRF protection, permission check, tenant isolation via repository
 */
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('video_event:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'video_events' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const repository = container.get<VideoEventRepository>(TYPES.VideoEventRepository)

    const context = {
      userId: req.user!.id,
      tenantId: req.user!.tenant_id
    }

    await repository.delete(req.params.id, context)

    res.json({ message: 'VideoEvent deleted successfully' })
  })
)

/**
 * POST /video-events/:id/review
 *
 * Mark a video event as reviewed
 * Security: JWT auth, CSRF protection, permission check, tenant isolation via repository
 */
router.post(
  '/:id/review',
  csrfProtection,
  requirePermission('video_event:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'video_events' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const repository = container.get<VideoEventRepository>(TYPES.VideoEventRepository)

    const context = {
      userId: req.user!.id,
      tenantId: req.user!.tenant_id
    }

    const { notes } = req.body

    const videoEvent = await repository.markAsReviewed(req.params.id, context, notes)

    res.json(videoEvent)
  })
)

/**
 * GET /video-events/statistics
 *
 * Get video event statistics for the tenant
 * Security: JWT auth, permission check, tenant isolation via repository
 */
router.get(
  '/statistics',
  requirePermission('video_event:view:global'),
  auditLog({ action: 'READ', resourceType: 'video_events' }),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const repository = container.get<VideoEventRepository>(TYPES.VideoEventRepository)

    const context = {
      userId: req.user!.id,
      tenantId: req.user!.tenant_id
    }

    const statistics = await repository.getStatistics(context)

    res.json(statistics)
  })
)

export default router
