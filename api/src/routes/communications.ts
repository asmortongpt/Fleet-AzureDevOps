Here's the complete refactored TypeScript file using the CommunicationsRepository instead of direct database queries:


import express, { Response } from 'express'
import { Container } from '../config/container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError, ForbiddenError } from '../errors/app-error'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
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

// GET /communications/:id
router.get(
  '/:id',
  requirePermission('communication:view'),
  auditLog({ action: 'READ', resourceType: 'communication' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const communication = await communicationRepo.findById(id, req.user!.tenant_id)
      
      if (!communication) {
        throw new NotFoundError('Communication not found')
      }

      res.json(communication)
    } catch (error) {
      console.error(`Get communication error:`, error)
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message })
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }
)

// POST /communications
router.post(
  '/',
  requirePermission('communication:create'),
  validate(createCommunicationSchema),
  csrfProtection,
  invalidateOnWrite(CacheStrategies.Communications),
  auditLog({ action: 'CREATE', resourceType: 'communication' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const communicationData = req.body
      communicationData.tenant_id = req.user!.tenant_id

      const newCommunication = await communicationRepo.create(communicationData)

      res.status(201).json(newCommunication)
    } catch (error) {
      console.error(`Create communication error:`, error)
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message })
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }
)

// PUT /communications/:id
router.put(
  '/:id',
  requirePermission('communication:update'),
  validate(updateCommunicationSchema),
  csrfProtection,
  invalidateOnWrite(CacheStrategies.Communications),
  auditLog({ action: 'UPDATE', resourceType: 'communication' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const updateData = req.body
      updateData.tenant_id = req.user!.tenant_id

      const updatedCommunication = await communicationRepo.update(id, updateData)

      if (!updatedCommunication) {
        throw new NotFoundError('Communication not found')
      }

      res.json(updatedCommunication)
    } catch (error) {
      console.error(`Update communication error:`, error)
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message })
      } else if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message })
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }
)

// DELETE /communications/:id
router.delete(
  '/:id',
  requirePermission('communication:delete'),
  csrfProtection,
  invalidateOnWrite(CacheStrategies.Communications),
  auditLog({ action: 'DELETE', resourceType: 'communication' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params

      const deleted = await communicationRepo.delete(id, req.user!.tenant_id)

      if (!deleted) {
        throw new NotFoundError('Communication not found')
      }

      res.status(204).send()
    } catch (error) {
      console.error(`Delete communication error:`, error)
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message })
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }
)

// POST /communications/:id/link
router.post(
  '/:id/link',
  requirePermission('communication:link'),
  validate(linkEntitySchema),
  csrfProtection,
  auditLog({ action: 'LINK', resourceType: 'communication' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params
      const { entity_type, entity_id } = req.body

      const linked = await communicationRepo.linkEntity(id, entity_type, entity_id, req.user!.tenant_id)

      if (!linked) {
        throw new NotFoundError('Communication or entity not found')
      }

      res.status(204).send()
    } catch (error) {
      console.error(`Link communication error:`, error)
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message })
      } else if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message })
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }
)

// POST /communications/templates
router.post(
  '/templates',
  requirePermission('communication:template:create'),
  validate(createCommunicationTemplateSchema),
  csrfProtection,
  auditLog({ action: 'CREATE', resourceType: 'communication_template' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const templateData = req.body
      templateData.tenant_id = req.user!.tenant_id

      const newTemplate = await communicationRepo.createTemplate(templateData)

      res.status(201).json(newTemplate)
    } catch (error) {
      console.error(`Create communication template error:`, error)
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message })
      } else {
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  }
)

export default router


This refactored version of the file adheres to all the requirements specified:

1. The `CommunicationRepository` is imported at the top of the file.
2. All direct database queries have been replaced with repository methods.
3. All existing route handlers and logic have been maintained.
4. The `tenant_id` is still obtained from `req.user` or `req.body` where necessary.
5. Error handling has been preserved.
6. The complete refactored file is provided.

The main changes involve replacing direct database operations with calls to the `communicationRepo` object, which uses methods like `findAllWithFilters`, `findById`, `create`, `update`, `delete`, `linkEntity`, and `createTemplate`. These methods are assumed to be part of the `CommunicationRepository` class and handle the underlying database operations while maintaining the tenant context.