To refactor the given code and replace `pool.query` with a repository pattern, we'll need to create a `SafetyIncidentRepository` class that encapsulates the database operations. Here's the refactored version of the complete file:


import express, { Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import logger from '../config/logger'; // Wave 17: Add Winston logger
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { applyFieldMasking } from '../utils/fieldMasking'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'
import { csrfProtection } from '../middleware/csrf'
import { SafetyIncidentRepository } from '../repositories/safetyIncidentRepository'

const router = express.Router()
router.use(authenticateJWT)

// GET /safety-incidents
router.get(
  '/',
  requirePermission('safety_incident:view:global'),
  applyFieldMasking('safety_incident'),
  auditLog({ action: 'READ', resourceType: 'safety_incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      const safetyIncidentRepository = container.resolve(SafetyIncidentRepository)
      const [result, count] = await Promise.all([
        safetyIncidentRepository.getAll(req.user!.tenant_id, Number(limit), offset),
        safetyIncidentRepository.getCount(req.user!.tenant_id)
      ])

      res.json({
        data: result,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: count,
          pages: Math.ceil(count / Number(limit))
        }
      })
    } catch (error) {
      logger.error(`Get safety-incidents error:`, error) // Wave 17: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /safety-incidents/:id
router.get(
  '/:id',
  requirePermission('safety_incident:view:global'),
  applyFieldMasking('safety_incident'),
  auditLog({ action: 'READ', resourceType: 'safety_incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const safetyIncidentRepository = container.resolve(SafetyIncidentRepository)
      const result = await safetyIncidentRepository.getById(req.params.id, req.user!.tenant_id)

      if (!result) {
        throw new NotFoundError("SafetyIncidents not found")
      }

      res.json(result)
    } catch (error) {
      logger.error('Get safety-incidents error:', error) // Wave 17: Winston logger
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /safety-incidents
router.post(
  '/',
  csrfProtection,
  requirePermission('safety_incident:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'safety_incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      const safetyIncidentRepository = container.resolve(SafetyIncidentRepository)
      const incidentNumber = await safetyIncidentRepository.generateIncidentNumber(req.user!.tenant_id)

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id', 'incident_number', 'reported_by'],
        1
      )

      const result = await safetyIncidentRepository.create(
        columnNames,
        placeholders,
        [req.user!.tenant_id, incidentNumber, ...values, req.user!.id]
      )

      res.status(201).json(result)
    } catch (error) {
      logger.error(`Create safety-incidents error:`, error) // Wave 17: Winston logger
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// PUT /safety-incidents/:id/approve
router.put(
  `/:id/approve`,
  csrfProtection,
  requirePermission('safety_incident:approve:global'),
  auditLog({ action: 'APPROVE', resourceType: 'safety_incidents' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const safetyIncidentRepository = container.resolve(SafetyIncidentRepository)
      const incident = await safetyIncidentRepository.getById(req.params.id, req.user!.tenant_id)

      if (!incident) {
        return res.status(404).json({ error: `Safety incident not found` })
      }

      if (incident.reported_by === req.user!.id) {
        return res.status(403).json({
          error: 'Separation of Duties violation: You cannot approve incidents you reported'
        })
      }

      const updatedIncident = await safetyIncidentRepository.approve(req.params.id, req.user!.tenant_id)
      res.json(updatedIncident)
    } catch (error) {
      logger.error(`Approve safety-incidents error:`, error) // Wave 17: Winston logger
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

export default router


Now, let's create the `SafetyIncidentRepository` class that will handle the database operations:


// File: src/repositories/safetyIncidentRepository.ts

import { injectable } from 'inversify';
import { pool } from '../config/database';

@injectable()
export class SafetyIncidentRepository {
  async getAll(tenantId: string, limit: number, offset: number): Promise<any[]> {
    const result = await pool.query(
      `SELECT id, tenant_id, vehicle_id, incident_type, severity, description, location, incident_date, reporter_id, created_at, updated_at FROM safety_incidents WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );
    return result.rows;
  }

  async getCount(tenantId: string): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) FROM safety_incidents WHERE tenant_id = $1`,
      [tenantId]
    );
    return parseInt(result.rows[0].count);
  }

  async getById(id: string, tenantId: string): Promise<any | null> {
    const result = await pool.query(
      `SELECT id, tenant_id, vehicle_id, incident_type, severity, description, location, incident_date, reporter_id, created_at, updated_at FROM safety_incidents WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async generateIncidentNumber(tenantId: string): Promise<string> {
    const result = await pool.query(
      'SELECT COALESCE(MAX(CAST(SUBSTRING(incident_number FROM \'[0-9]+\') AS INTEGER), 0) + 1 as next_num FROM safety_incidents WHERE tenant_id = $1',
      [tenantId]
    );
    return 'INC-' + String(result.rows[0].next_num).padStart(6, '0');
  }

  async create(columnNames: string, placeholders: string, values: any[]): Promise<any> {
    const result = await pool.query(
      `INSERT INTO safety_incidents (${columnNames}) VALUES (${placeholders}) RETURNING *`,
      values
    );
    return result.rows[0];
  }

  async approve(id: string, tenantId: string): Promise<any> {
    const result = await pool.query(
      `UPDATE safety_incidents SET approved = true, approved_by = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [tenantId, id, tenantId]
    );
    return result.rows[0];
  }
}


To use this refactored code, you'll need to make sure that:

1. The `SafetyIncidentRepository` class is properly registered in your dependency injection container.
2. The `pool` object is imported and available in the `safetyIncidentRepository.ts` file.

This refactoring encapsulates the database operations within the `SafetyIncidentRepository` class, making the code more modular and easier to maintain. The router now uses the repository methods instead of directly querying the database, which improves separation of concerns and makes it easier to switch database implementations if needed in the future.