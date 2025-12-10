import express, { Response } from 'express'
import { Container } from '../config/container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError, ForbiddenError } from '../errors/app-error'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'
import { cacheMiddleware, invalidateOnWrite, CacheStrategies } from '../middleware/cache'
import { validate } from '../middleware/validation'
import {
  createCommunicationSchema,
  updateCommunicationSchema,
  linkEntitySchema,
  getCommunicationsQuerySchema,
  createCommunicationTemplateSchema
} from '../schemas/communications.schema'
import { CommunicationRepository } from '../repositories/CommunicationRepository'
import { tenantSafeQuery, validateTenantOwnership } from '../utils/dbHelpers'
import { csrfProtection } from '../middleware/csrf'

// REPOSITORY PATTERN: Get CommunicationRepository from DI container
const communicationRepo = Container.resolve<CommunicationRepository>('CommunicationRepository')

const router = express.Router()
router.use(authenticateJWT)

// ============================================================================
// Communications - Universal contextual communications system
// ============================================================================

// GET /communications (CACHED: 5 minutes, vary by tenant and query params)
router.get(
  '/',
  requirePermission('communication:view:global'),
  validate(getCommunicationsQuerySchema, 'query'),
  cacheMiddleware({ ttl: 300000, varyByTenant: true, varyByQuery: true }),
  auditLog({ action: 'READ', resourceType: 'communications' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = 1,
        limit = 50,
        communication_type,
        category,
        priority,
        status,
        search
      } = req.query

      // REPOSITORY PATTERN: Use findAllWithFilters method
      const filters = {
        communication_type: communication_type as string | undefined,
        category: category as string | undefined,
        priority: priority as string | undefined,
        status: status as string | undefined,
        search: search as string | undefined
      }

      const result = await communicationRepo.findAllWithFilters(
        filters,
        { page: Number(page), limit: Number(limit) },
        req.user!.tenant_id
      )

      res.json({
        data: result.data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          pages: Math.ceil(result.total / Number(limit))
        }
      })
    } catch (error) {
      console.error(`Get communications error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /communications/:id (CACHED: 5 minutes)
router.get(
  '/:id',
  requirePermission('communication:view:global'),
  CacheStrategies.mediumLived,
  auditLog({ action: 'READ', resourceType: 'communications' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // REPOSITORY PATTERN: Use findByIdWithDetails method
      const communication = await communicationRepo.findByIdWithDetails(
        parseInt(req.params.id),
        req.user!.tenant_id
      )

      if (!communication) {
        throw new NotFoundError("Communication not found")
      }

      res.json(communication)
    } catch (error) {
      console.error(`Get communication error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /communications (INVALIDATE CACHE on write)
router.post(
  '/',
 csrfProtection, requirePermission('communication:send:global'),
  validate(createCommunicationSchema, 'body'),
  invalidateOnWrite('communications'),
  auditLog({ action: 'CREATE', resourceType: 'communications' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { linked_entities, ...data } = req.body

      // REPOSITORY PATTERN: Use createWithLinks method
      const communication = await communicationRepo.createWithLinks(
        data,
        linked_entities,
        req.user!.tenant_id,
        req.user!.id
      )

      res.status(201).json(communication)
    } catch (error) {
      console.error(`Create communication error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// PUT /communications/:id (INVALIDATE CACHE on write)
router.put(
  '/:id',
 csrfProtection, requirePermission('communication:send:global'),
  validate(updateCommunicationSchema, 'body'),
  invalidateOnWrite('communications'),
  auditLog({ action: 'UPDATE', resourceType: 'communications' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      // REPOSITORY PATTERN: Use updateCommunication method
      const communication = await communicationRepo.updateCommunication(
        parseInt(req.params.id),
        data,
        req.user!.tenant_id,
        req.user!.id
      )

      if (!communication) {
        throw new NotFoundError(`Communication not found`)
      }

      res.json(communication)
    } catch (error) {
      console.error(`Update communication error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// ============================================================================
// Entity Links - Link communications to vehicles, drivers, maintenance, etc.
// ============================================================================

// POST /communications/:id/link
router.post(
  '/:id/link',
 csrfProtection, requirePermission('communication:send:global'),
  validate(linkEntitySchema, 'body'),
  auditLog({ action: 'CREATE', resourceType: 'communication_entity_links' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { entity_type, entity_id, link_type = 'Related' } = req.body

      // REPOSITORY PATTERN: Use linkEntity method
      const link = await communicationRepo.linkEntity(
        parseInt(req.params.id),
        entity_type,
        entity_id,
        link_type,
        req.user!.tenant_id
      )

      if (!link) {
        throw new ForbiddenError('Cannot link entities to communications from other tenants')
      }

      res.status(201).json(link)
    } catch (error) {
      console.error(`Link communication to entity error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// DELETE /communications/:id/link/:link_id
router.delete(
  '/:id/link/:link_id',
 csrfProtection, requirePermission('communication:send:global'),
  auditLog({ action: 'DELETE', resourceType: 'communication_entity_links' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // REPOSITORY PATTERN: Use unlinkEntity method
      const deleted = await communicationRepo.unlinkEntity(
        parseInt(req.params.link_id),
        parseInt(req.params.id),
        req.user!.tenant_id
      )

      if (!deleted) {
        throw new NotFoundError(`Link not found`)
      }

      res.json({ message: 'Link deleted successfully' })
    } catch (error) {
      console.error('Delete communication link error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Entity Communications - Get all communications for a specific entity
// ============================================================================

// GET /communications/entity/:entity_type/:entity_id
router.get(
  '/entity/:entity_type/:entity_id',
  requirePermission('communication:view:global'),
  auditLog({ action: 'READ', resourceType: 'communications' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { entity_type, entity_id } = req.params
      const { page = 1, limit = 50 } = req.query

      // REPOSITORY PATTERN: Use findByEntityType method
      const result = await communicationRepo.findByEntityType(
        entity_type,
        parseInt(entity_id),
        { page: Number(page), limit: Number(limit) },
        req.user!.tenant_id
      )

      res.json({
        data: result.data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.total,
          pages: Math.ceil(result.total / Number(limit))
        }
      })
    } catch (error) {
      console.error(`Get entity communications error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Follow-ups Dashboard
// ============================================================================

// GET /communications/follow-ups/pending (CACHED: 1 minute, critical data)
router.get(
  '/follow-ups/pending',
  requirePermission('communication:view:global'),
  CacheStrategies.shortLived,
  auditLog({ action: 'READ', resourceType: 'communications_followups' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // REPOSITORY PATTERN: Use findPendingFollowUps method
      const followUps = await communicationRepo.findPendingFollowUps(req.user!.tenant_id)

      res.json({ data: followUps })
    } catch (error) {
      console.error('Get pending follow-ups error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// ============================================================================
// Communication Templates
// ============================================================================

// GET /communications/templates
router.get(
  '/templates',
  requirePermission('communication:view:global'),
  auditLog({ action: 'READ', resourceType: 'communication_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { category } = req.query

      // REPOSITORY PATTERN: Use findTemplates method
      const templates = await communicationRepo.findTemplates(
        category as string | undefined,
        req.user!.tenant_id
      )

      res.json({ data: templates })
    } catch (error) {
      console.error(`Get communication templates error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /communications/templates
router.post(
  '/templates',
 csrfProtection, requirePermission('communication:broadcast:global'),
  validate(createCommunicationTemplateSchema, 'body'),
  auditLog({ action: 'CREATE', resourceType: 'communication_templates' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      // REPOSITORY PATTERN: Use createTemplate method
      const template = await communicationRepo.createTemplate(
        data,
        req.user!.tenant_id,
        req.user!.id
      )

      res.status(201).json(template)
    } catch (error) {
      console.error(`Create communication template error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// ============================================================================
// Dashboard & Analytics
// ============================================================================

// GET /communications/dashboard (CACHED: 2 minutes for performance)
router.get(
  `/dashboard`,
  requirePermission('communication:view:global'),
  cacheMiddleware({ ttl: 120000, varyByTenant: true }),
  auditLog({ action: 'READ', resourceType: 'communications_dashboard' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // REPOSITORY PATTERN: Use getDashboardStats method
      const stats = await communicationRepo.getDashboardStats(req.user!.tenant_id)

      res.json(stats)
    } catch (error) {
      console.error(`Get communications dashboard error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

export default router
