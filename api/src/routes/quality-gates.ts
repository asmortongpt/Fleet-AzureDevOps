To refactor the given code and replace `pool.query` with a repository pattern, we'll need to create a `QualityGateRepository` class that encapsulates the database operations. Here's the refactored version of the complete file:


import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { createAuditLog } from '../middleware/audit';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { getErrorMessage } from '../utils/error-handler';
import { csrfProtection } from '../middleware/csrf';
import { QualityGateRepository } from '../repositories/QualityGateRepository';

const router = express.Router();
router.use(authenticateJWT);

/**
 * Quality Gate Repository instance
 */
const qualityGateRepository = container.resolve(QualityGateRepository);

/**
 * GET /api/quality-gates
 * Get quality gate results with optional filtering
 */
router.get('/',
  requirePermission('role:manage:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { deployment_id, status, gate_type, limit = 50 } = req.query;

      const result = await qualityGateRepository.getQualityGates({
        deploymentId: deployment_id as string,
        status: status as string,
        gateType: gate_type as string,
        limit: parseInt(limit as string, 10)
      });

      res.json({
        quality_gates: result.qualityGates,
        total: result.total
      });
    } catch (error: any) {
      console.error(`Error fetching quality gates:`, error);
      res.status(500).json({ error: 'Failed to fetch quality gates', message: getErrorMessage(error) });
    }
  }
);

/**
 * POST /api/quality-gates
 * Create a new quality gate result
 */
router.post('/',
  csrfProtection,
  requirePermission('role:manage:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        deployment_id,
        gate_type,
        status,
        result_data = {},
        error_message,
        execution_time_seconds,
        executed_by_user_id,
        metadata = {}
      } = req.body;

      // Validate required fields
      if (!gate_type || !status) {
        throw new ValidationError("gate_type and status are required");
      }

      // Validate gate_type
      const validGateTypes = [
        'unit_tests',
        'integration_tests',
        'e2e_tests',
        'security_scan',
        'performance',
        'accessibility',
        'code_coverage',
        'linting',
        'type_check'
      ];
      if (!validGateTypes.includes(gate_type)) {
        return res.status(400).json({
          error: 'Invalid gate_type',
          valid_types: validGateTypes
        });
      }

      // Validate status
      const validStatuses = ['pending', 'running', 'passed', 'failed', 'skipped'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          valid_statuses: validStatuses
        });
      }

      const result = await qualityGateRepository.createQualityGate({
        deploymentId: deployment_id,
        gateType: gate_type,
        status: status,
        resultData: result_data,
        errorMessage: error_message,
        executionTimeSeconds: execution_time_seconds,
        executedByUserId: executed_by_user_id,
        metadata: metadata
      });

      // Create audit log
      if (req.user?.id) {
        await createAuditLog(
          req.user.tenant_id || null,
          req.user.id,
          `CREATE`,
          `quality_gate`,
          result.id,
          { gate_type, status },
          req.ip || null,
          req.get('user-agent') || null,
          'success'
        );
      }

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error creating quality gate:', error);
      res.status(500).json({ error: 'Failed to create quality gate', message: getErrorMessage(error) });
    }
  }
);

/**
 * GET /api/quality-gates/summary
 * Get aggregated quality gate summary statistics
 */
router.get('/summary',
  requirePermission('role:manage:global'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { days = 7 } = req.query;

      // Validate and sanitize days parameter
      const daysNum = Math.max(1, Math.min(365, parseInt(days as string) || 7));

      const result = await qualityGateRepository.getQualityGateSummary(daysNum);

      res.json(result);
    } catch (error: any) {
      console.error('Error fetching quality gate summary:', error);
      res.status(500).json({ error: 'Failed to fetch quality gate summary', message: getErrorMessage(error) });
    }
  }
);

export default router;


Now, let's create the `QualityGateRepository` class that will handle the database operations:


// src/repositories/QualityGateRepository.ts

import { injectable } from 'inversify';
import { pool } from '../db';

@injectable()
export class QualityGateRepository {
  async getQualityGates(filters: {
    deploymentId?: string;
    status?: string;
    gateType?: string;
    limit: number;
  }): Promise<{ qualityGates: any[]; total: number }> {
    let query = `
      SELECT
        qg.*,
        d.environment,
        d.version,
        d.deployed_by_user_id,
        u.first_name || ' ' || u.last_name as executed_by_name
      FROM quality_gates qg
      LEFT JOIN deployments d ON qg.deployment_id = d.id
      LEFT JOIN users u ON qg.executed_by_user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (filters.deploymentId) {
      query += ` AND qg.deployment_id = $${paramCount}`;
      params.push(filters.deploymentId);
      paramCount++;
    }

    if (filters.status) {
      query += ` AND qg.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    if (filters.gateType) {
      query += ` AND qg.gate_type = $${paramCount}`;
      params.push(filters.gateType);
      paramCount++;
    }

    query += ` ORDER BY qg.executed_at DESC LIMIT $${paramCount}`;
    params.push(filters.limit);

    const result = await pool.query(query, params);

    return {
      qualityGates: result.rows,
      total: result.rows.length
    };
  }

  async createQualityGate(data: {
    deploymentId?: string;
    gateType: string;
    status: string;
    resultData: any;
    errorMessage?: string;
    executionTimeSeconds?: number;
    executedByUserId?: string;
    metadata: any;
  }): Promise<any> {
    const result = await pool.query(
      `INSERT INTO quality_gates (
        deployment_id, gate_type, status, result_data, error_message,
        execution_time_seconds, executed_by_user_id, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.deploymentId,
        data.gateType,
        data.status,
        JSON.stringify(data.resultData),
        data.errorMessage,
        data.executionTimeSeconds,
        data.executedByUserId,
        JSON.stringify(data.metadata)
      ]
    );

    return result.rows[0];
  }

  async getQualityGateSummary(days: number): Promise<any> {
    const result = await pool.query(
      `SELECT
        gate_type,
        COUNT(*) as total_runs,
        COUNT(CASE WHEN status = 'passed' THEN 1 END) as passed,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COUNT(CASE WHEN status = 'skipped' THEN 1 END) as skipped
      FROM quality_gates
      WHERE executed_at >= NOW() - INTERVAL '${days} days'
      GROUP BY gate_type`
    );

    return result.rows;
  }
}


To use this refactored code, you'll need to make sure that:

1. The `QualityGateRepository` class is properly registered in your dependency injection container.
2. The `pool` object is imported and available in the `QualityGateRepository` file.
3. You update your `container` configuration to include the `QualityGateRepository`.

This refactoring moves the database operations into a separate repository class, making the code more modular and easier to maintain. The router now uses the repository methods instead of directly querying the database.