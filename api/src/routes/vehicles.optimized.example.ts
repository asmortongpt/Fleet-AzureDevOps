/**
 * EXAMPLE: Optimized Vehicles Route with Caching
 *
 * This file demonstrates how to apply caching to the vehicles route.
 * To apply these changes to the actual routes/vehicles.ts file:
 *
 * 1. Add the import: import { cache, cacheMiddleware } from '../utils/cache'
 * 2. Add cacheMiddleware to GET routes
 * 3. Add cache invalidation to POST/PUT/DELETE routes
 */

import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { applyFieldMasking } from '../utils/fieldMasking'
import pool from '../config/database'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'
import { ApiResponse } from '../utils/apiResponse'
import { validate } from '../middleware/validation'
import { getPaginationParams, createPaginatedResponse } from '../utils/pagination'
import { cache, cacheMiddleware } from '../utils/cache' // ADD THIS LINE

const router = express.Router()
router.use(authenticateJWT)

// GET /vehicles - Cache for 5 minutes (300 seconds)
router.get(
  '/',
  requirePermission('vehicle:view:team'),
  applyFieldMasking('vehicle'),
  cacheMiddleware(300), // ADD THIS LINE - Cache list for 5 minutes
  auditLog({ action: 'READ', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    // Existing route handler code stays the same
    try {
      const paginationParams = getPaginationParams(req)
      // ... rest of the handler
    } catch (error) {
      console.error('Get vehicles error:', error)
      return ApiResponse.serverError(res, 'Failed to retrieve vehicles')
    }
  }
)

// GET /vehicles/:id - Cache for 10 minutes (600 seconds)
router.get(
  '/:id',
  requirePermission('vehicle:view:own'),
  applyFieldMasking('vehicle'),
  cacheMiddleware(600), // ADD THIS LINE - Cache individual vehicle for 10 minutes
  auditLog({ action: 'READ', resourceType: 'vehicles' }),
  validate([{ field: 'id', required: true, type: 'uuid' }], 'params'),
  async (req: AuthRequest, res: Response) => {
    // Existing route handler code stays the same
  }
)

// POST /vehicles
router.post(
  '/',
  requirePermission('vehicle:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      // ... validation and insert logic

      const result = await pool.query(
        `INSERT INTO vehicles (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        [req.user!.tenant_id, ...values]
      )

      // Invalidate cache on create - ADD THESE LINES
      await cache.delPattern(`route:/api/vehicles*`)

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Create vehicles error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /vehicles/:id
router.put(
  '/:id',
  requirePermission('vehicle:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body
      const { fields, values } = buildUpdateClause(data, 3)

      const result = await pool.query(
        `UPDATE vehicles SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Vehicles not found' })
      }

      // Invalidate cache on update - ADD THESE LINES
      await cache.delPattern(`route:/api/vehicles*`)
      await cache.del(cache.getCacheKey(req.user!.tenant_id, 'vehicle', req.params.id))

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update vehicles error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /vehicles/:id
router.delete(
  '/:id',
  requirePermission('vehicle:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // ... status check logic

      const result = await pool.query(
        'DELETE FROM vehicles WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      // Invalidate cache on delete - ADD THESE LINES
      await cache.delPattern(`route:/api/vehicles*`)
      await cache.del(cache.getCacheKey(req.user!.tenant_id, 'vehicle', req.params.id))

      res.json({ message: 'Vehicle deleted successfully' })
    } catch (error) {
      console.error('Delete vehicles error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
