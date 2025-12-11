To refactor the given code and replace `pool.query` with a repository pattern, we'll need to create a `TelemetryRepository` class that encapsulates the database operations. Here's the refactored version of the complete file:


import express, { Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission, rateLimit } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import { validate } from '../middleware/validation'
import { csrfProtection } from '../middleware/csrf'

import {
  createTelemetrySchema,
  updateTelemetrySchema,
  getTelemetryQuerySchema,
  bulkTelemetrySchema
} from '../schemas/telemetry.schema'

// Import the TelemetryRepository
import { TelemetryRepository } from '../repositories/telemetry.repository'

const router = express.Router()
router.use(authenticateJWT)

// GET /telemetry
router.get(
  '/',
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  validate(getTelemetryQuerySchema, 'query'),
  auditLog({ action: 'READ', resourceType: 'telemetry_data' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const telemetryRepository = container.resolve(TelemetryRepository)
      const [data, total] = await telemetryRepository.getTelemetryData(req.user!.tenant_id, Number(limit), offset)

      res.json({
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      })
    } catch (error) {
      console.error(`Get telemetry error:`, error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /telemetry/:id
router.get(
  '/:id',
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  auditLog({ action: 'READ', resourceType: 'telemetry_data' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const telemetryRepository = container.resolve(TelemetryRepository)
      const telemetry = await telemetryRepository.getTelemetryById(req.params.id, req.user!.tenant_id)

      if (!telemetry) {
        throw new NotFoundError("Telemetry not found")
      }

      res.json(telemetry)
    } catch (error) {
      console.error('Get telemetry error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /telemetry
router.post(
  '/',
  csrfProtection,
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  validate(createTelemetrySchema, 'body'),
  auditLog({ action: 'CREATE', resourceType: 'telemetry_data' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const telemetryRepository = container.resolve(TelemetryRepository)
      const newTelemetry = await telemetryRepository.createTelemetry(data, req.user!.tenant_id)

      res.status(201).json(newTelemetry)
    } catch (error) {
      console.error(`Create telemetry error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// PUT /telemetry/:id
router.put(
  `/:id`,
  csrfProtection,
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  validate(updateTelemetrySchema, 'body'),
  auditLog({ action: 'UPDATE', resourceType: 'telemetry_data' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const telemetryRepository = container.resolve(TelemetryRepository)
      const updatedTelemetry = await telemetryRepository.updateTelemetry(req.params.id, data, req.user!.tenant_id)

      if (!updatedTelemetry) {
        return res.status(404).json({ error: `Telemetry not found` })
      }

      res.json(updatedTelemetry)
    } catch (error) {
      console.error(`Update telemetry error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// DELETE /telemetry/:id
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('telemetry:view:fleet'),
  rateLimit(10, 60000),
  auditLog({ action: 'DELETE', resourceType: 'telemetry_data' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const telemetryRepository = container.resolve(TelemetryRepository)
      const deleted = await telemetryRepository.deleteTelemetry(req.params.id, req.user!.tenant_id)

      if (!deleted) {
        throw new NotFoundError("Telemetry not found")
      }

      res.status(204).send()
    } catch (error) {
      console.error(`Delete telemetry error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

export default router


Now, we need to create the `TelemetryRepository` class. Here's an example implementation:


// File: src/repositories/telemetry.repository.ts

import { Pool } from 'pg'
import { container } from '../container'
import { getTableColumns } from '../utils/db-utils'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

export class TelemetryRepository {
  private pool: Pool

  constructor() {
    this.pool = container.resolve(Pool)
  }

  async getTelemetryData(tenantId: string, limit: number, offset: number): Promise<[any[], number]> {
    const columns = await getTableColumns(this.pool, 'telemetry_data')
    const result = await this.pool.query(
      `SELECT ${columns.join(', ')} FROM telemetry_data WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    )

    const countResult = await this.pool.query(
      `SELECT COUNT(*) FROM telemetry_data WHERE tenant_id = $1`,
      [tenantId]
    )

    return [result.rows, parseInt(countResult.rows[0].count)]
  }

  async getTelemetryById(id: string, tenantId: string): Promise<any | null> {
    const columns = await getTableColumns(this.pool, 'telemetry_data')
    const result = await this.pool.query(
      `SELECT ${columns.join(', ')} FROM telemetry_data WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    )

    return result.rows.length > 0 ? result.rows[0] : null
  }

  async createTelemetry(data: any, tenantId: string): Promise<any> {
    const { columnNames, placeholders, values } = buildInsertClause(
      data,
      ['tenant_id'],
      1
    )

    const result = await this.pool.query(
      `INSERT INTO telemetry_data (${columnNames}) VALUES (${placeholders}) RETURNING *`,
      [tenantId, ...values]
    )

    return result.rows[0]
  }

  async updateTelemetry(id: string, data: any, tenantId: string): Promise<any | null> {
    const { fields, values } = buildUpdateClause(data, 3)

    const result = await this.pool.query(
      `UPDATE telemetry_data SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId, ...values]
    )

    return result.rows.length > 0 ? result.rows[0] : null
  }

  async deleteTelemetry(id: string, tenantId: string): Promise<boolean> {
    const result = await this.pool.query(
      `DELETE FROM telemetry_data WHERE id = $1 AND tenant_id = $2 RETURNING id`,
      [id, tenantId]
    )

    return result.rows.length > 0
  }
}


This refactoring moves all database operations into the `TelemetryRepository` class, which can be easily tested and maintained separately from the route handlers. The route handlers now use the repository to perform database operations, making the code more modular and easier to manage.

Remember to register the `TelemetryRepository` in your dependency injection container (e.g., in `container.ts`):


// File: src/container.ts

import { Container } from 'inversify'
import { Pool } from 'pg'
import { TelemetryRepository } from './repositories/telemetry.repository'

export const container = new Container()

// ... other registrations ...

container.bind(TelemetryRepository).toSelf().inSingletonScope()


This refactoring improves the separation of concerns and makes the code more maintainable and testable.