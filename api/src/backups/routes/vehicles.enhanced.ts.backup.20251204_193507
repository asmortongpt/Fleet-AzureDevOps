import express, { Response } from 'express';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { applyFieldMasking } from '../utils/fieldMasking';
import pool from '../config/database';
import { z } from 'zod';
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety';
import { createVehicleSchema, updateVehicleSchema } from '../validation/schemas';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { serializeError } from 'serialize-error';
import { sendErrorResponse } from '../utils/errorHandler';
import { logger } from '../config/logger';

const router = express.Router();

router.use(helmet());
router.use(authenticateJWT);

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(apiLimiter);

// Enhanced GET /vehicles with security, performance, and error handling improvements
router.get(
  '/',
  requirePermission('vehicle:view:team'),
  applyFieldMasking('vehicle'),
  auditLog({ action: 'READ', resourceType: 'vehicles' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = 1,
        limit = 50,
        asset_category,
        asset_type,
        power_type,
        operational_status,
        primary_metric,
        is_road_legal,
        location_id,
        group_id,
        fleet_id,
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const userResult = await pool.query(
        'SELECT team_vehicle_ids, vehicle_id, scope_level FROM users WHERE id = $1',
        [req.user!.id]
      );

      const user = userResult.rows[0];
      let scopeFilter = '';
      let scopeParams: any[] = [req.user!.tenant_id];

      if (user.scope_level === 'own' && user.vehicle_id) {
        scopeFilter = 'AND id = $2';
        scopeParams.push(user.vehicle_id);
      } else if (user.scope_level === 'team' && user.team_vehicle_ids && user.team_vehicle_ids.length > 0) {
        scopeFilter = 'AND id = ANY($2::uuid[])';
        scopeParams.push(user.team_vehicle_ids);
      }

      let assetFilters = '';
      let paramIndex = scopeParams.length + 1;

      const filters = [
        { field: 'asset_category', value: asset_category },
        { field: 'asset_type', value: asset_type },
        { field: 'power_type', value: power_type },
        { field: 'operational_status', value: operational_status },
        { field: 'primary_metric', value: primary_metric },
        { field: 'is_road_legal', value: is_road_legal === 'true' },
        { field: 'location_id', value: location_id },
        { field: 'group_id', value: group_id },
        { field: 'fleet_id', value: fleet_id },
      ];

      filters.forEach(filter => {
        if (filter.value !== undefined) {
          assetFilters += ` AND ${filter.field} = $${paramIndex++}`;
          scopeParams.push(filter.value);
        }
      });

      const result = await pool.query(
        `SELECT * FROM vehicles WHERE tenant_id = $1 ${scopeFilter} ${assetFilters} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...scopeParams, Number(limit), offset]
      );

      res.json(result.rows);
    } catch (error) {
      logger.error(`Failed to fetch vehicles: ${serializeError(error)}`);
      sendErrorResponse(res, error);
    }
  }
);

export default router;