Here's the complete refactored file with the `TelemetryRepository` class implemented and used in place of `pool.query`:


import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission, rateLimit } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety';
import helmet from 'helmet';
import csurf from 'csurf';
import { csrfProtection } from '../middleware/csrf';

// Import the TelemetryRepository
import { TelemetryRepository } from '../repositories/telemetry-repository';

const router = express.Router();
router.use(authenticateJWT);
router.use(helmet());
router.use(csurf());

const telemetrySchema = z.object({
  id: z.string().optional(),
  tenant_id: z.string(),
  data: z.any(),
  created_at: z.date().optional(),
});

// Create an instance of TelemetryRepository
const telemetryRepository = new TelemetryRepository();

// Enhanced GET /telemetry with pagination and security improvements
router.get(
  '/',
  requirePermission('telemetry:view:fleet'),
  rateLimit(100, 60000), // Adjusted rate limit
  auditLog({ action: 'READ', resourceType: 'telemetry_data' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const [result, countResult] = await Promise.all([
        telemetryRepository.getTelemetryData(req.user!.tenant_id, Number(limit), offset),
        telemetryRepository.countTelemetryData(req.user!.tenant_id),
      ]);

      res.json({
        data: result.map(row => telemetrySchema.parse(row)),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: countResult,
          pages: Math.ceil(countResult / Number(limit)),
        },
      });
    } catch (error) {
      console.error(`Get telemetry error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Enhanced POST /telemetry with security and validation improvements
router.post(
  '/',
  csrfProtection,
  requirePermission('telemetry:create:fleet'),
  rateLimit(100, 60000), // Adjusted rate limit
  auditLog({ action: 'CREATE', resourceType: 'telemetry_data' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = telemetrySchema.parse(req.body);

      const result = await telemetryRepository.createTelemetryData(req.user!.tenant_id, data);

      res.status(201).json(telemetrySchema.parse(result));
    } catch (error) {
      console.error(`Create telemetry error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Enhanced PUT /telemetry/:id with security and validation improvements
router.put(
  '/:id',
  csrfProtection,
  requirePermission('telemetry:update:fleet'),
  rateLimit(100, 60000), // Adjusted rate limit
  auditLog({ action: 'UPDATE', resourceType: 'telemetry_data' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = telemetrySchema
        .omit({ id: true, tenant_id: true, created_at: true })
        .parse(req.body);

      const result = await telemetryRepository.updateTelemetryData(req.params.id, req.user!.tenant_id, data);

      if (!result) {
        throw new NotFoundError("Telemetry not found");
      }

      res.json(telemetrySchema.parse(result));
    } catch (error) {
      console.error(`Update telemetry error:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;


And here's the implementation of the `TelemetryRepository` class:


// File: src/repositories/telemetry-repository.ts

import { PoolClient } from 'pg';
import { container } from '../container';
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety';

export class TelemetryRepository {
  private pool: PoolClient;

  constructor() {
    this.pool = container.resolve('dbPool');
  }

  async getTelemetryData(tenantId: string, limit: number, offset: number): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM telemetry_data WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [tenantId, limit, offset]
    );
    return result.rows;
  }

  async countTelemetryData(tenantId: string): Promise<number> {
    const result = await this.pool.query(
      'SELECT COUNT(*) FROM telemetry_data WHERE tenant_id = $1',
      [tenantId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async createTelemetryData(tenantId: string, data: any): Promise<any> {
    const { columnNames, placeholders, values } = buildInsertClause(data);
    const query = `
      INSERT INTO telemetry_data (tenant_id, ${columnNames})
      VALUES ($1, ${placeholders})
      RETURNING *
    `;
    const result = await this.pool.query(query, [tenantId, ...values]);
    return result.rows[0];
  }

  async updateTelemetryData(id: string, tenantId: string, data: any): Promise<any | null> {
    const { setClause, values } = buildUpdateClause(data);
    const query = `
      UPDATE telemetry_data
      SET ${setClause}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `;
    const result = await this.pool.query(query, [id, tenantId, ...values]);
    return result.rows[0] || null;
  }
}


This refactored version replaces all `pool.query` calls with methods from the `TelemetryRepository` class. The repository encapsulates the database operations and provides a cleaner interface for the router to use. The `TelemetryRepository` class is responsible for executing the actual database queries using the `pool` object obtained from the dependency injection container.

Note that the `TelemetryRepository` class is stored in a separate file (`telemetry-repository.ts`) in the `repositories` directory, as per the import statement in the main file.