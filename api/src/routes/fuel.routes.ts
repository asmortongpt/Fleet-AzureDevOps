/**
 * Fuel API Routes - Fuel Listing and Statistics Endpoints
 * Provides aggregated fuel data and statistics
 *
 * SECURITY:
 * - All routes require JWT authentication
 * - RBAC enforcement per endpoint
 * - Parameterized queries only (no SQL injection)
 * - Tenant isolation enforced
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../db/connection';
import { authenticateJWT } from '../middleware/auth';
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac';
import { asyncHandler } from '../middleware/errorHandler';
import logger from '../config/logger';

const router = Router();

// SECURITY: All routes require authentication
router.use(authenticateJWT);

/**
 * GET /api/fuel
 * Returns fuel transactions with filtering and pagination
 *
 * Query Params:
 * - page: number (default: 1)
 * - pageSize: number (default: 20)
 * - vehicleId: uuid (optional)
 * - driverId: uuid (optional)
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'propane' | 'cng' | 'hydrogen' (optional)
 *
 * Response:
 * {
 *   data: Array<FuelTransaction>,
 *   total: number,
 *   page: number,
 *   pageSize: number,
 *   totalPages: number
 * }
 */
const fuelQuerySchema = z.object({
  page: z.string().optional().default('1'),
  pageSize: z.string().optional().default('20'),
  vehicleId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  fuelType: z.enum(['gasoline', 'diesel', 'electric', 'hybrid', 'propane', 'cng', 'hydrogen']).optional()
});

router.get('/',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.VEHICLE_READ],
    enforceTenantIsolation: true
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId || 1;

    // Validate query params
    const validation = fuelQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: validation.error.issues
      });
    }

    const { page, pageSize, vehicleId, driverId, startDate, endDate, fuelType } = validation.data;

    logger.info(`Fetching fuel transactions for tenant ${tenantId}`);

    // Build WHERE clause conditions
    const conditions: string[] = ['ft.tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (vehicleId) {
      conditions.push(`ft.vehicle_id = $${paramIndex}`);
      params.push(vehicleId);
      paramIndex++;
    }

    if (driverId) {
      conditions.push(`ft.driver_id = $${paramIndex}`);
      params.push(driverId);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`ft.transaction_date >= $${paramIndex}`);
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`ft.transaction_date <= $${paramIndex}`);
      params.push(endDate);
      paramIndex++;
    }

    if (fuelType) {
      conditions.push(`ft.fuel_type = $${paramIndex}`);
      params.push(fuelType);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await pool.query(`
      SELECT COUNT(*)::integer as total
      FROM fuel_transactions ft
      WHERE ${whereClause}
    `, params);

    const total = countResult.rows[0]?.total || 0;
    const totalPages = Math.ceil(total / Number(pageSize));

    // Get paginated data
    const offset = (Number(page) - 1) * Number(pageSize);

    const dataResult = await pool.query(`
      SELECT
        ft.id,
        ft.vehicle_id,
        ft.driver_id,
        ft.transaction_date,
        ft.fuel_type,
        ft.gallons,
        ft.cost_per_gallon,
        ft.total_cost,
        ft.odometer,
        ft.location,
        ft.vendor_name,
        ft.receipt_number,
        ft.payment_method,
        ft.notes,
        v.name as vehicle_name,
        v.number as vehicle_number,
        v.make as vehicle_make,
        v.model as vehicle_model,
        d.first_name || ' ' || d.last_name as driver_name
      FROM fuel_transactions ft
      LEFT JOIN vehicles v ON v.id = ft.vehicle_id
      LEFT JOIN drivers d ON d.id = ft.driver_id
      WHERE ${whereClause}
      ORDER BY ft.transaction_date DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `, [...params, Number(pageSize), offset]);

    res.json({
      data: dataResult.rows,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages
    });
  })
);

/**
 * GET /api/fuel/statistics
 * Returns fuel consumption and cost statistics
 *
 * Query Params:
 * - period: 'daily' | 'weekly' | 'monthly' | 'yearly' (default: 'monthly')
 * - vehicleId: uuid (optional) - filter by specific vehicle
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 *
 * Response:
 * {
 *   summary: {
 *     total_transactions: number,
 *     total_gallons: number,
 *     total_cost: number,
 *     avg_cost_per_gallon: number,
 *     avg_gallons_per_transaction: number,
 *     avg_cost_per_transaction: number
 *   },
 *   by_fuel_type: Array<{
 *     fuel_type: string,
 *     total_gallons: number,
 *     total_cost: number,
 *     transaction_count: number,
 *     avg_cost_per_gallon: number
 *   }>,
 *   by_vehicle: Array<{
 *     vehicle_id: uuid,
 *     vehicle_name: string,
 *     total_gallons: number,
 *     total_cost: number,
 *     transaction_count: number,
 *     avg_mpg: number
 *   }>,
 *   trend: Array<{
 *     period: string,
 *     total_gallons: number,
 *     total_cost: number,
 *     transaction_count: number
 *   }>
 * }
 */
const statisticsQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).default('monthly'),
  vehicleId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

router.get('/statistics',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.VEHICLE_READ],
    enforceTenantIsolation: true
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId || 1;

    // Validate query params
    const validation = statisticsQuerySchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: validation.error.issues
      });
    }

    const { period, vehicleId, startDate, endDate } = validation.data;

    logger.info(`Fetching fuel statistics for tenant ${tenantId}, period: ${period}`);

    // Build WHERE clause
    const conditions: string[] = ['ft.tenant_id = $1'];
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (vehicleId) {
      conditions.push(`ft.vehicle_id = $${paramIndex}`);
      params.push(vehicleId);
      paramIndex++;
    }

    // Default date range if not specified
    const defaultStartDate = startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days ago
    const defaultEndDate = endDate || new Date().toISOString();

    conditions.push(`ft.transaction_date >= $${paramIndex}`);
    params.push(defaultStartDate);
    paramIndex++;

    conditions.push(`ft.transaction_date <= $${paramIndex}`);
    params.push(defaultEndDate);
    paramIndex++;

    const whereClause = conditions.join(' AND ');

    // Get summary statistics
    const summaryResult = await pool.query(`
      SELECT
        COUNT(*)::integer as total_transactions,
        COALESCE(SUM(gallons), 0)::numeric as total_gallons,
        COALESCE(SUM(total_cost), 0)::numeric as total_cost,
        COALESCE(AVG(cost_per_gallon), 0)::numeric as avg_cost_per_gallon,
        COALESCE(AVG(gallons), 0)::numeric as avg_gallons_per_transaction,
        COALESCE(AVG(total_cost), 0)::numeric as avg_cost_per_transaction
      FROM fuel_transactions ft
      WHERE ${whereClause}
    `, params);

    // Get statistics by fuel type
    const byFuelTypeResult = await pool.query(`
      SELECT
        fuel_type,
        COALESCE(SUM(gallons), 0)::numeric as total_gallons,
        COALESCE(SUM(total_cost), 0)::numeric as total_cost,
        COUNT(*)::integer as transaction_count,
        COALESCE(AVG(cost_per_gallon), 0)::numeric as avg_cost_per_gallon
      FROM fuel_transactions ft
      WHERE ${whereClause}
      GROUP BY fuel_type
      ORDER BY total_cost DESC
    `, params);

    // Get statistics by vehicle (top 10)
    const byVehicleResult = await pool.query(`
      SELECT
        ft.vehicle_id,
        v.name as vehicle_name,
        v.number as vehicle_number,
        v.make || ' ' || v.model as vehicle_info,
        COALESCE(SUM(ft.gallons), 0)::numeric as total_gallons,
        COALESCE(SUM(ft.total_cost), 0)::numeric as total_cost,
        COUNT(*)::integer as transaction_count,
        CASE
          WHEN SUM(ft.gallons) > 0 THEN
            (MAX(ft.odometer) - MIN(ft.odometer))::numeric / SUM(ft.gallons)
          ELSE 0
        END as avg_mpg
      FROM fuel_transactions ft
      LEFT JOIN vehicles v ON v.id = ft.vehicle_id
      WHERE ${whereClause}
      GROUP BY ft.vehicle_id, v.name, v.number, v.make, v.model
      ORDER BY total_cost DESC
      LIMIT 10
    `, params);

    // Get trend data based on period
    let dateFormat: string;
    let dateTrunc: string;

    switch (period) {
      case 'daily':
        dateFormat = 'YYYY-MM-DD';
        dateTrunc = 'day';
        break;
      case 'weekly':
        dateFormat = 'IYYY-IW'; // ISO year and week
        dateTrunc = 'week';
        break;
      case 'yearly':
        dateFormat = 'YYYY';
        dateTrunc = 'year';
        break;
      case 'monthly':
      default:
        dateFormat = 'YYYY-MM';
        dateTrunc = 'month';
        break;
    }

    const trendResult = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC($${paramIndex}, ft.transaction_date), $${paramIndex + 1}) as period,
        COALESCE(SUM(ft.gallons), 0)::numeric as total_gallons,
        COALESCE(SUM(ft.total_cost), 0)::numeric as total_cost,
        COUNT(*)::integer as transaction_count,
        COALESCE(AVG(ft.cost_per_gallon), 0)::numeric as avg_cost_per_gallon
      FROM fuel_transactions ft
      WHERE ${whereClause}
      GROUP BY DATE_TRUNC($${paramIndex}, ft.transaction_date)
      ORDER BY DATE_TRUNC($${paramIndex}, ft.transaction_date) ASC
    `, [...params, dateTrunc, dateFormat]);

    res.json({
      summary: {
        total_transactions: summaryResult.rows[0]?.total_transactions || 0,
        total_gallons: parseFloat(summaryResult.rows[0]?.total_gallons || '0'),
        total_cost: parseFloat(summaryResult.rows[0]?.total_cost || '0'),
        avg_cost_per_gallon: parseFloat(summaryResult.rows[0]?.avg_cost_per_gallon || '0'),
        avg_gallons_per_transaction: parseFloat(summaryResult.rows[0]?.avg_gallons_per_transaction || '0'),
        avg_cost_per_transaction: parseFloat(summaryResult.rows[0]?.avg_cost_per_transaction || '0')
      },
      by_fuel_type: byFuelTypeResult.rows.map(row => ({
        fuel_type: row.fuel_type,
        total_gallons: parseFloat(row.total_gallons),
        total_cost: parseFloat(row.total_cost),
        transaction_count: row.transaction_count,
        avg_cost_per_gallon: parseFloat(row.avg_cost_per_gallon)
      })),
      by_vehicle: byVehicleResult.rows.map(row => ({
        vehicle_id: row.vehicle_id,
        vehicle_name: row.vehicle_name,
        vehicle_number: row.vehicle_number,
        vehicle_info: row.vehicle_info,
        total_gallons: parseFloat(row.total_gallons),
        total_cost: parseFloat(row.total_cost),
        transaction_count: row.transaction_count,
        avg_mpg: parseFloat(row.avg_mpg || '0')
      })),
      trend: trendResult.rows.map(row => ({
        period: row.period,
        total_gallons: parseFloat(row.total_gallons),
        total_cost: parseFloat(row.total_cost),
        transaction_count: row.transaction_count,
        avg_cost_per_gallon: parseFloat(row.avg_cost_per_gallon)
      })),
      period,
      date_range: {
        start: defaultStartDate,
        end: defaultEndDate
      }
    });
  })
);

export default router;
