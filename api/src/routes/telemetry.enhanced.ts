To refactor the code and replace `pool.query` with a repository pattern, we'll need to create a `TelemetryRepository` class and update the existing code to use it. Here's the complete refactored file:


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


Now, we need to create the `TelemetryRepository` class. Here's an example implementation:


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
    const { columnNames, placeholders, values } = buildInsertClause(data, ['tenant_id'], 1);

    const result = await this.pool.query(
      `INSERT INTO telemetry_data (${columnNames}) VALUES (${placeholders}) RETURNING *`,
      [tenantId, ...values]
    );

    return result.rows[0];
  }

  async updateTelemetryData(id: string, tenantId: string, data: any): Promise<any | null> {
    const { fields, values } = buildUpdateClause(data, 3);

    const result = await this.pool.query(
      `UPDATE telemetry_data SET ${fields} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
      [id, tenantId, ...values]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }
}


This refactoring introduces a `TelemetryRepository` class that encapsulates the database operations. The router now uses this repository instead of directly querying the database. This approach improves code organization, makes it easier to test, and allows for better separation of concerns.

Note that you'll need to ensure that the `dbPool` is properly set up in your container and that the `buildInsertClause` and `buildUpdateClause` functions are correctly implemented in the `sql-safety` utility file.