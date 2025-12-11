To refactor the given code and replace `pool.query` with a repository pattern, we'll need to create a `PolicyRepository` class that encapsulates the database operations. Here's the refactored version of the complete file:


import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger'; // Wave 16: Add Winston logger
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety';
import { csrfProtection } from '../middleware/csrf';
import { PolicyRepository } from '../repositories/policy.repository'; // New import

const router = express.Router();
router.use(authenticateJWT);

// Initialize the PolicyRepository
const policyRepository = new PolicyRepository();

// GET /policies
router.get(
  '/',
  requirePermission('policy:view:global'),
  auditLog({ action: 'READ', resourceType: 'policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const [policies, totalCount] = await policyRepository.getPolicies(
        req.user!.tenant_id,
        Number(limit),
        offset
      );

      res.json({
        data: policies,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / Number(limit)),
        },
      });
    } catch (error) {
      logger.error(`Get policies error:`, error); // Wave 16: Winston logger
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /policies/:id
router.get(
  '/:id',
  requirePermission('policy:view:global'),
  auditLog({ action: 'READ', resourceType: 'policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const policy = await policyRepository.getPolicyById(
        req.params.id,
        req.user!.tenant_id
      );

      if (!policy) {
        return res.status(404).json({ error: 'Policies not found' });
      }

      res.json(policy);
    } catch (error) {
      logger.error('Get policies error:', error); // Wave 16: Winston logger
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /policies (SafetyOfficer can create)
router.post(
  '/',
  csrfProtection,
  requirePermission('policy:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body;

      const { columnNames, placeholders, values } = buildInsertClause(
        data,
        ['tenant_id'],
        1
      );

      const newPolicy = await policyRepository.createPolicy(
        columnNames,
        placeholders,
        [req.user!.tenant_id, ...values]
      );

      res.status(201).json(newPolicy);
    } catch (error) {
      logger.error(`Create policies error:`, error); // Wave 16: Winston logger
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /policies/:id (FleetAdmin only for deployment)
router.put(
  '/:id',
  csrfProtection,
  requirePermission('policy:deploy:global'),
  auditLog({ action: 'UPDATE', resourceType: 'policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body;
      const { fields, values } = buildUpdateClause(data, 3);

      const updatedPolicy = await policyRepository.updatePolicy(
        req.params.id,
        req.user!.tenant_id,
        fields,
        values
      );

      if (!updatedPolicy) {
        return res.status(404).json({ error: 'Policies not found' });
      }

      res.json(updatedPolicy);
    } catch (error) {
      logger.error(`Update policies error:`, error); // Wave 16: Winston logger
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /policies/:id
router.delete(
  '/:id',
  csrfProtection,
  requirePermission('policy:delete:global'),
  auditLog({ action: 'DELETE', resourceType: 'policies' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const deletedPolicyId = await policyRepository.deletePolicy(
        req.params.id,
        req.user!.tenant_id
      );

      if (!deletedPolicyId) {
        throw new NotFoundError('Policies not found');
      }

      res.status(204).send();
    } catch (error) {
      logger.error(`Delete policies error:`, error); // Wave 16: Winston logger
      if (error instanceof NotFoundError) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

export default router;


Now, we need to create the `PolicyRepository` class. Here's an example implementation:


// File: src/repositories/policy.repository.ts

import { pool } from '../config/database';

export class PolicyRepository {
  async getPolicies(tenantId: string, limit: number, offset: number): Promise<[any[], number]> {
    const policiesQuery = await pool.query(
      `SELECT 
        id,
        tenant_id,
        name,
        description,
        category,
        content,
        version,
        is_active,
        effective_date,
        created_by,
        created_at,
        updated_at 
      FROM policies 
      WHERE tenant_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );

    const countQuery = await pool.query(
      `SELECT COUNT(*) FROM policies WHERE tenant_id = $1`,
      [tenantId]
    );

    return [policiesQuery.rows, parseInt(countQuery.rows[0].count)];
  }

  async getPolicyById(id: string, tenantId: string): Promise<any | null> {
    const result = await pool.query(
      `SELECT
        id,
        tenant_id,
        name,
        description,
        category,
        content,
        version,
        is_active,
        effective_date,
        created_by,
        created_at,
        updated_at 
      FROM policies 
      WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async createPolicy(columnNames: string, placeholders: string, values: any[]): Promise<any> {
    const result = await pool.query(
      `INSERT INTO policies (${columnNames}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    return result.rows[0];
  }

  async updatePolicy(id: string, tenantId: string, fields: string, values: any[]): Promise<any | null> {
    const result = await pool.query(
      `UPDATE policies SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId, ...values]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async deletePolicy(id: string, tenantId: string): Promise<string | null> {
    const result = await pool.query(
      'DELETE FROM policies WHERE id = $1 AND tenant_id = $2 RETURNING id',
      [id, tenantId]
    );

    return result.rows.length > 0 ? result.rows[0].id : null;
  }
}


This refactoring moves the database operations into a separate `PolicyRepository` class, which can be easily tested and maintained. The router now uses methods from this repository instead of directly querying the database.