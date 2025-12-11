Here's the complete refactored file with the `QualityGateRepository` class and the updated router file:


// src/repositories/QualityGateRepository.ts

import { PoolClient } from 'pg';
import { container } from '../container';

export class QualityGateRepository {
  private client: PoolClient;

  constructor(client: PoolClient) {
    this.client = client;
  }

  async getQualityGates(params: {
    deploymentId?: string;
    status?: string;
    gateType?: string;
    limit: number;
  }): Promise<{ qualityGates: any[]; total: number }> {
    const { deploymentId, status, gateType, limit } = params;
    const conditions = [];
    const values = [];

    if (deploymentId) {
      conditions.push('deployment_id = $' + (values.length + 1));
      values.push(deploymentId);
    }
    if (status) {
      conditions.push('status = $' + (values.length + 1));
      values.push(status);
    }
    if (gateType) {
      conditions.push('gate_type = $' + (values.length + 1));
      values.push(gateType);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
    const query = `
      SELECT * FROM quality_gates
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1}
    `;
    values.push(limit);

    const countQuery = `
      SELECT COUNT(*) FROM quality_gates
      ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      this.client.query(query, values),
      this.client.query(countQuery, values.slice(0, -1))
    ]);

    return {
      qualityGates: result.rows,
      total: parseInt(countResult.rows[0].count, 10)
    };
  }

  async createQualityGate(params: {
    deploymentId?: string;
    gateType: string;
    status: string;
    resultData: object;
    errorMessage?: string;
    executionTimeSeconds?: number;
    executedByUserId?: string;
    metadata: object;
  }): Promise<any> {
    const {
      deploymentId,
      gateType,
      status,
      resultData,
      errorMessage,
      executionTimeSeconds,
      executedByUserId,
      metadata
    } = params;

    const query = `
      INSERT INTO quality_gates (
        deployment_id,
        gate_type,
        status,
        result_data,
        error_message,
        execution_time_seconds,
        executed_by_user_id,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await this.client.query(query, [
      deploymentId,
      gateType,
      status,
      JSON.stringify(resultData),
      errorMessage,
      executionTimeSeconds,
      executedByUserId,
      JSON.stringify(metadata)
    ]);

    return result.rows[0];
  }

  async getQualityGateSummary(days: number): Promise<any> {
    const query = `
      SELECT 
        gate_type,
        status,
        COUNT(*) as count
      FROM quality_gates
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY gate_type, status
    `;

    const result = await this.client.query(query);
    return result.rows;
  }
}

// src/routes/qualityGates.ts

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


This refactored version replaces all `pool.query` calls with methods from the `QualityGateRepository` class. The repository pattern encapsulates the database operations, making the code more modular and easier to maintain. 

The `QualityGateRepository` class is instantiated using dependency injection through the `container.resolve()` method, which allows for better testability and flexibility in managing database connections.

Note that you'll need to ensure that the `PoolClient` is properly set up in your dependency injection container and that the `quality_gates` table exists in your database with the appropriate schema.