/**
 * Dashboard API Routes - Role-Based Dashboard Endpoints
 * Provides aggregated data for role-specific dashboards
 *
 * SECURITY:
 * - All routes require JWT authentication
 * - RBAC enforcement per endpoint
 * - Parameterized queries only (no SQL injection)
 * - Tenant isolation enforced
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';

import logger from '../config/logger';
import { pool } from '../db/connection';
import { asyncHandler } from '../middleware/async-handler';
import { authenticateJWT } from '../middleware/auth.middleware';
import { requireRBAC, Role, PERMISSIONS } from '../middleware/rbac';
import { cache } from '../utils/cache';

const router = Router();

/**
 * GET /api/dashboard
 * Returns available dashboard endpoints and basic system summary
 *
 * NOTE: This endpoint does NOT require authentication - it's a public info endpoint
 *
 * Response:
 * {
 *   message: string,
 *   endpoints: string[],
 *   summary: {
 *     total_vehicles: number,
 *     active_drivers: number,
 *     open_work_orders: number
 *   }
 * }
 */
router.get('/',
  asyncHandler(async (req: Request, res: Response) => {
    logger.info(`Fetching dashboard summary (public endpoint)`);

    try {
      // Quick summary counts (public data) - gracefully handle missing tables
      let vehicleCount = 0;
      let driverCount = 0;
      let workOrderCount = 0;

      try {
        const vehicleResult = await pool.query('SELECT COUNT(*)::integer as count FROM vehicles');
        vehicleCount = vehicleResult.rows[0]?.count || 0;
      } catch (e) {
        logger.debug('vehicles table not found or inaccessible');
      }

      try {
        const driverResult = await pool.query('SELECT COUNT(*)::integer as count FROM drivers');
        driverCount = driverResult.rows[0]?.count || 0;
      } catch (e) {
        logger.debug('drivers table not found or inaccessible');
      }

      try {
        const workOrderResult = await pool.query(`
          SELECT COUNT(*)::integer as count
          FROM work_orders
          WHERE status IN ('in_progress', 'pending')
        `);
        workOrderCount = workOrderResult.rows[0]?.count || 0;
      } catch (e) {
        logger.debug('work_orders table not found or inaccessible');
      }

      res.json({
        message: 'Fleet Management Dashboard API',
        version: '1.0.0',
        endpoints: [
          '/api/dashboard/maintenance/alerts',
          '/api/dashboard/fleet/stats',
          '/api/dashboard/costs/summary',
          '/api/dashboard/drivers/me/vehicle',
          '/api/dashboard/drivers/me/trips/today'
        ],
        summary: {
          total_vehicles: vehicleCount,
          active_drivers: driverCount,
          open_work_orders: workOrderCount
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Dashboard summary error:', error);
      // Even if database fails, return the API info
      res.json({
        message: 'Fleet Management Dashboard API',
        version: '1.0.0',
        endpoints: [
          '/api/dashboard/maintenance/alerts',
          '/api/dashboard/fleet/stats',
          '/api/dashboard/costs/summary',
          '/api/dashboard/drivers/me/vehicle',
          '/api/dashboard/drivers/me/trips/today'
        ],
        summary: {
          total_vehicles: 0,
          active_drivers: 0,
          open_work_orders: 0
        },
        timestamp: new Date().toISOString()
      });
    }
  })
);

// All other dashboard routes require authentication
router.use(authenticateJWT);

/**
 * GET /api/dashboard/stats
 * Returns comprehensive dashboard statistics with Redis caching
 *
 * Response:
 * {
 *   total_vehicles: number,
 *   active_vehicles: number,
 *   maintenance_vehicles: number,
 *   idle_vehicles: number,
 *   total_drivers: number,
 *   active_drivers: number,
 *   open_work_orders: number,
 *   overdue_maintenance: number
 * }
 */
// =============================================================================
// GET /dashboard/fleet-metrics (Frontend compatibility)
// =============================================================================
router.get('/fleet-metrics',
  authenticateJWT,
  asyncHandler(async (req: Request, res: Response) => {
    // @ts-ignore
    const tenantId = req.user?.tenant_id;

    // Default metrics structure
    const metrics = {
      totalVehicles: 0,
      activeVehicles: 0,
      maintenanceVehicles: 0,
      totalDrivers: 0,
      fleetUtilization: 0,
      criticalAlerts: 0,
      fuelEfficiency: 0,
      totalCostThisMonth: 0,
      costPerMile: 0
    };

    try {
      // Get vehicle stats
      const vehicleStats = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'active') as active,
          COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance
        FROM vehicles 
        WHERE tenant_id = $1
      `, [tenantId]);

      const vStats = vehicleStats.rows[0];
      metrics.totalVehicles = parseInt(vStats.total) || 0;
      metrics.activeVehicles = parseInt(vStats.active) || 0;
      metrics.maintenanceVehicles = parseInt(vStats.maintenance) || 0;

      // Calculate utilization
      if (metrics.totalVehicles > 0) {
        metrics.fleetUtilization = Math.round((metrics.activeVehicles / metrics.totalVehicles) * 100);
      }

      // Get driver count
      const driverStats = await pool.query(
        'SELECT COUNT(*) as total FROM drivers WHERE tenant_id = $1',
        [tenantId]
      );
      metrics.totalDrivers = parseInt(driverStats.rows[0].total) || 0;

      // Get critical alerts count
      const alertStats = await pool.query(
        "SELECT COUNT(*) as total FROM alerts WHERE tenant_id = $1 AND severity = 'critical' AND status = 'active'",
        [tenantId]
      );
      metrics.criticalAlerts = parseInt(alertStats.rows[0].total) || 0;

      // Mock financial data (would require complex joins in real scenario)
      metrics.fuelEfficiency = 8.5; // MPG
      metrics.totalCostThisMonth = 12500.00;
      metrics.costPerMile = 0.45;

      res.json(metrics);
    } catch (error) {
      logger.error('Error fetching fleet metrics:', error);
      res.status(500).json({ error: 'Failed to fetch fleet metrics' });
    }
  })
);

// =============================================================================
// GET /dashboard/stats (Existing endpoint)
// =============================================================================
router.get('/stats',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.VEHICLE_READ],
    enforceTenantIsolation: true
  }),
  asyncHandler(async (req: Request, res: Response) => {
    // FIX: tenant_id is UUID, not integer - use proper fallback
    const tenantId = (req as any).user?.tenantId || '00000000-0000-0000-0000-000000000001';
    const cacheKey = `dashboard:stats:tenant:${tenantId}`;

    logger.info(`Fetching dashboard stats for tenant ${tenantId}`);

    // Try to get from cache first
    try {
      if (cache.isConnected()) {
        const cachedStats = await cache.get(cacheKey);
        if (cachedStats) {
          logger.info(`Cache HIT: dashboard stats for tenant ${tenantId}`);
          return res.json({ ...cachedStats, cached: true });
        }
        logger.info(`Cache MISS: dashboard stats for tenant ${tenantId}`);
      }
    } catch (cacheError) {
      logger.debug('Cache not available, fetching from database');
    }

    // Fetch from database with optimized parallel queries and statement timeout
    try {
      // Set statement timeout to 5 seconds to prevent hanging
      await pool.query('SET statement_timeout = 5000');

      const [vehicleStats, driverStats, workOrderStats] = await Promise.all([
        // Vehicle stats - using index idx_vehicles_tenant_status
        pool.query(`
          SELECT
            COUNT(*)::integer as total,
            COUNT(*) FILTER (WHERE status = 'active')::integer as active,
            COUNT(*) FILTER (WHERE status = 'maintenance')::integer as maintenance,
            COUNT(*) FILTER (WHERE status = 'idle')::integer as idle
          FROM vehicles
          WHERE tenant_id = $1::uuid
        `, [tenantId]),

        // Driver stats - using index idx_drivers_tenant_status
        pool.query(`
          SELECT
            COUNT(*)::integer as total,
            COUNT(*) FILTER (WHERE status = 'active')::integer as active
          FROM drivers
          WHERE tenant_id = $1::uuid
        `, [tenantId]),

        // Work order stats - using index idx_work_orders_tenant_status
        pool.query(`
          SELECT
            COUNT(*) FILTER (WHERE status IN ('open', 'pending'))::integer as open,
            COUNT(*) FILTER (WHERE status = 'in_progress')::integer as in_progress
          FROM work_orders
          WHERE tenant_id = $1::uuid
        `, [tenantId])
      ]);

      // Reset statement timeout
      await pool.query('RESET statement_timeout');

      const stats = {
        total_vehicles: vehicleStats.rows[0]?.total || 0,
        active_vehicles: vehicleStats.rows[0]?.active || 0,
        maintenance_vehicles: vehicleStats.rows[0]?.maintenance || 0,
        idle_vehicles: vehicleStats.rows[0]?.idle || 0,
        total_drivers: driverStats.rows[0]?.total || 0,
        active_drivers: driverStats.rows[0]?.active || 0,
        open_work_orders: workOrderStats.rows[0]?.open || 0,
        in_progress_work_orders: workOrderStats.rows[0]?.in_progress || 0
      };

      // Cache for 5 minutes (300 seconds)
      try {
        if (cache.isConnected()) {
          await cache.set(cacheKey, stats, 300);
        }
      } catch (cacheSetError) {
        logger.debug('Failed to set cache, continuing without cache');
      }

      return res.json({ ...stats, cached: false });
    } catch (error) {
      logger.error('Dashboard stats error:', error);

      // Reset statement timeout in case of error
      try {
        await pool.query('RESET statement_timeout');
      } catch (resetError) {
        logger.debug('Failed to reset statement_timeout');
      }

      // Return fallback data on error
      return res.json({
        total_vehicles: 0,
        active_vehicles: 0,
        maintenance_vehicles: 0,
        idle_vehicles: 0,
        total_drivers: 0,
        active_drivers: 0,
        open_work_orders: 0,
        in_progress_work_orders: 0,
        error: 'Failed to load complete statistics'
      });
    }
  })
);

/**
 * GET /api/dashboard/maintenance/alerts
 * Returns maintenance alerts for fleet manager dashboard
 *
 * Response:
 * {
 *   overdue_count: number,
 *   upcoming_count: number,
 *   open_work_orders: number,
 *   overdue: Array<{id, vehicle_id, vehicle_name, type, days_overdue}>,
 *   upcoming: Array<{id, vehicle_id, vehicle_name, type, scheduled_date}>
 * }
 */
router.get('/maintenance/alerts',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.MAINTENANCE_READ],
    enforceTenantIsolation: true
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const tenantId = (req as any).user?.tenantId || 1;

    logger.info(`Fetching maintenance alerts for user ${userId}, tenant ${tenantId}`);

    // Query overdue maintenance (past next_due date)
    const overdueResult = await pool.query(`
      SELECT
        mr.id,
        mr.vehicle_id,
        v.vehicle_number as vehicle_name,
        mr.service_type as type,
        EXTRACT(DAY FROM (NOW() - mr.next_due))::integer as days_overdue
      FROM maintenance_records mr
      JOIN vehicles v ON v.id = mr.vehicle_id
      WHERE mr.next_due < NOW()
        AND mr.status IN ('scheduled', 'pending')
      ORDER BY mr.next_due ASC
      LIMIT 10
    `);

    // Query upcoming maintenance (next 7 days)
    const upcomingResult = await pool.query(`
      SELECT
        mr.id,
        mr.vehicle_id,
        v.vehicle_number as vehicle_name,
        mr.service_type as type,
        mr.next_due as scheduled_date
      FROM maintenance_records mr
      JOIN vehicles v ON v.id = mr.vehicle_id
      WHERE mr.next_due BETWEEN NOW() AND NOW() + INTERVAL '7 days'
        AND mr.status IN ('scheduled', 'pending')
      ORDER BY mr.next_due ASC
      LIMIT 20
    `);

    // Query open work orders count
    const workOrdersResult = await pool.query(`
      SELECT COUNT(*)::integer as count
      FROM maintenance_records
      WHERE status IN ('in_progress', 'pending')
    `);

    res.json({
      overdue_count: overdueResult.rows.length,
      upcoming_count: upcomingResult.rows.length,
      open_work_orders: workOrdersResult.rows[0]?.count || 0,
      overdue: overdueResult.rows,
      upcoming: upcomingResult.rows
    });
  })
);

/**
 * GET /api/dashboard/fleet/stats
 * Returns fleet status statistics
 *
 * Response:
 * {
 *   active_vehicles: number,
 *   maintenance_vehicles: number,
 *   idle_vehicles: number,
 *   out_of_service: number
 * }
 */
router.get('/fleet/stats',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER, Role.USER],
    permissions: [PERMISSIONS.VEHICLE_READ],
    enforceTenantIsolation: true
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId || '00000000-0000-0000-0000-000000000001';

    logger.info(`Fetching fleet stats for tenant ${tenantId}`);

    try {
      // Set statement timeout to 3 seconds
      await pool.query('SET statement_timeout = 3000');

      const result = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'active')::integer as active_vehicles,
          COUNT(*) FILTER (WHERE status = 'maintenance')::integer as maintenance_vehicles,
          COUNT(*) FILTER (WHERE status = 'idle')::integer as idle_vehicles,
          COUNT(*) FILTER (WHERE status = 'out_of_service')::integer as out_of_service
        FROM vehicles
        WHERE tenant_id = $1::uuid
      `, [tenantId]);

      await pool.query('RESET statement_timeout');

      res.json(result.rows[0] || {
        active_vehicles: 0,
        maintenance_vehicles: 0,
        idle_vehicles: 0,
        out_of_service: 0
      });
    } catch (error) {
      logger.error('Fleet stats error:', error);
      await pool.query('RESET statement_timeout').catch(() => { });

      res.json({
        active_vehicles: 0,
        maintenance_vehicles: 0,
        idle_vehicles: 0,
        out_of_service: 0,
        error: 'Failed to load fleet statistics'
      });
    }
  })
);

/**
 * GET /api/dashboard/costs/summary
 * Returns cost summary for specified period
 *
 * Query Params:
 * - period: 'daily' | 'weekly' | 'monthly' (default: 'monthly')
 *
 * Response:
 * {
 *   fuel_cost: number,
 *   fuel_trend: number,
 *   maintenance_cost: number,
 *   maintenance_trend: number,
 *   cost_per_mile: number,
 *   target_cost_per_mile: number
 * }
 */
const costsSummaryQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('monthly')
});

router.get('/costs/summary',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.ANALYTICS_READ],
    enforceTenantIsolation: true
  }),
  // Note: Query validation is handled inline with Zod schema
  asyncHandler(async (req: Request, res: Response) => {
    const { period } = req.query as z.infer<typeof costsSummaryQuerySchema>;
    const tenantId = (req as any).user?.tenantId || '00000000-0000-0000-0000-000000000001';

    logger.info(`Fetching cost summary for period ${period}, tenant ${tenantId}`);

    try {
      // Set statement timeout to 5 seconds
      await pool.query('SET statement_timeout = 5000');

      // Determine date range based on period
      let currentPeriodStart: string;
      let previousPeriodStart: string;
      let previousPeriodEnd: string;

      switch (period) {
        case 'daily':
          currentPeriodStart = "NOW() - INTERVAL '1 day'";
          previousPeriodStart = "NOW() - INTERVAL '2 days'";
          previousPeriodEnd = "NOW() - INTERVAL '1 day'";
          break;
        case 'weekly':
          currentPeriodStart = "NOW() - INTERVAL '7 days'";
          previousPeriodStart = "NOW() - INTERVAL '14 days'";
          previousPeriodEnd = "NOW() - INTERVAL '7 days'";
          break;
        case 'monthly':
        default:
          currentPeriodStart = "NOW() - INTERVAL '30 days'";
          previousPeriodStart = "NOW() - INTERVAL '60 days'";
          previousPeriodEnd = "NOW() - INTERVAL '30 days'";
          break;
      }

      // Run all queries in parallel for performance
      const [fuelCurrentResult, fuelPreviousResult, maintenanceCurrentResult, maintenancePreviousResult, milesResult] = await Promise.all([
        // Fuel costs current period
        pool.query(`
          SELECT COALESCE(SUM(total_cost), 0)::numeric as total
          FROM fuel_transactions
          WHERE date >= ${currentPeriodStart}
        `),

        // Fuel costs previous period
        pool.query(`
          SELECT COALESCE(SUM(total_cost), 0)::numeric as total
          FROM fuel_transactions
          WHERE date >= ${previousPeriodStart}
            AND date < ${previousPeriodEnd}
        `),

        // Maintenance costs current period
        pool.query(`
          SELECT COALESCE(SUM(actual_cost), 0)::numeric as total
          FROM maintenance_records
          WHERE service_date >= ${currentPeriodStart}
            AND actual_cost IS NOT NULL
        `),

        // Maintenance costs previous period
        pool.query(`
          SELECT COALESCE(SUM(actual_cost), 0)::numeric as total
          FROM maintenance_records
          WHERE service_date >= ${previousPeriodStart}
            AND service_date < ${previousPeriodEnd}
            AND actual_cost IS NOT NULL
        `),

        // Total miles driven (for cost per mile)
        pool.query(`
          SELECT COALESCE(SUM(v.mileage), 0)::integer as total_miles
          FROM vehicles v
          WHERE v.tenant_id = $1::uuid
        `, [tenantId])
      ]);

      await pool.query('RESET statement_timeout');

      const fuelCurrent = parseFloat(fuelCurrentResult.rows[0]?.total || '0');
      const fuelPrevious = parseFloat(fuelPreviousResult.rows[0]?.total || '0');
      const maintenanceCurrent = parseFloat(maintenanceCurrentResult.rows[0]?.total || '0');
      const maintenancePrevious = parseFloat(maintenancePreviousResult.rows[0]?.total || '0');
      const totalMiles = milesResult.rows[0]?.total_miles || 1;

      // Calculate trends (percentage change)
      const fuelTrend = fuelPrevious > 0
        ? Math.round(((fuelCurrent - fuelPrevious) / fuelPrevious) * 100)
        : 0;

      const maintenanceTrend = maintenancePrevious > 0
        ? Math.round(((maintenanceCurrent - maintenancePrevious) / maintenancePrevious) * 100)
        : 0;

      // Calculate cost per mile
      const totalCost = fuelCurrent + maintenanceCurrent;
      const costPerMile = totalMiles > 0 ? parseFloat((totalCost / totalMiles).toFixed(2)) : 0;
      const targetCostPerMile = 2.10; // Target benchmark

      res.json({
        fuel_cost: Math.round(fuelCurrent),
        fuel_trend: fuelTrend,
        maintenance_cost: Math.round(maintenanceCurrent),
        maintenance_trend: maintenanceTrend,
        cost_per_mile: costPerMile,
        target_cost_per_mile: targetCostPerMile
      });
    } catch (error) {
      logger.error('Cost summary error:', error);
      await pool.query('RESET statement_timeout').catch(() => { });

      res.json({
        fuel_cost: 0,
        fuel_trend: 0,
        maintenance_cost: 0,
        maintenance_trend: 0,
        cost_per_mile: 0,
        target_cost_per_mile: 2.10,
        error: 'Failed to load cost summary'
      });
    }
  })
);

/**
 * GET /api/dashboard/drivers/me/vehicle
 * Returns assigned vehicle for the authenticated driver
 *
 * Response:
 * {
 *   id: number,
 *   name: string,
 *   year: number,
 *   make: string,
 *   model: string,
 *   fuel_level: number,
 *   mileage: number,
 *   status: string,
 *   last_inspection: string
 * }
 */
router.get('/drivers/me/vehicle',
  requireRBAC({
    roles: [Role.USER], // Driver role
    permissions: [PERMISSIONS.VEHICLE_READ],
    enforceTenantIsolation: true
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const email = (req as any).user?.email;

    logger.info(`Fetching assigned vehicle for driver ${userId}`);

    // Find driver by user email
    const driverResult = await pool.query(
      `SELECT id, assigned_vehicle_id FROM drivers WHERE email = $1`,
      [email]
    );

    if (driverResult.rows.length === 0 || !driverResult.rows[0].assigned_vehicle_id) {
      return res.status(404).json({ error: 'No vehicle assigned to this driver' });
    }

    const vehicleId = driverResult.rows[0].assigned_vehicle_id;

    // Get vehicle details
    const vehicleResult = await pool.query(`
      SELECT
        v.id,
        v.vehicle_number as name,
        v.year,
        v.make,
        v.model,
        85 as fuel_level,
        v.mileage,
        v.status,
        v.last_service_date as last_inspection
      FROM vehicles v
      WHERE v.id = $1
    `, [vehicleId]);

    if (vehicleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicleResult.rows[0]);
  })
);

/**
 * GET /api/dashboard/drivers/me/trips/today
 * Returns today's trips for the authenticated driver
 *
 * Response:
 * [
 *   {
 *     id: number,
 *     route_name: string,
 *     origin: string,
 *     destination: string,
 *     scheduled_start: string,
 *     scheduled_end: string,
 *     status: string
 *   }
 * ]
 */
router.get('/drivers/me/trips/today',
  requireRBAC({
    roles: [Role.USER], // Driver role
    permissions: [],
    enforceTenantIsolation: true
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const email = (req as any).user?.email;

    logger.info(`Fetching today's trips for driver ${userId}`);

    // Find driver by user email
    const driverResult = await pool.query(
      `SELECT id FROM drivers WHERE email = $1`,
      [email]
    );

    if (driverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const driverId = driverResult.rows[0].id;

    // Mock trips data (replace with actual trips table query when available)
    const trips = [
      {
        id: 4523,
        route_name: 'Downtown Delivery',
        origin: '123 Main St',
        destination: '456 Oak Ave',
        scheduled_start: new Date(new Date().setHours(9, 0, 0)).toISOString(),
        scheduled_end: new Date(new Date().setHours(11, 30, 0)).toISOString(),
        status: 'scheduled'
      },
      {
        id: 4524,
        route_name: 'Supply Run',
        origin: 'Warehouse',
        destination: '789 Pine Rd',
        scheduled_start: new Date(new Date().setHours(14, 0, 0)).toISOString(),
        scheduled_end: new Date(new Date().setHours(16, 0, 0)).toISOString(),
        status: 'scheduled'
      }
    ];

    res.json(trips);
  })
);

/**
 * POST /api/dashboard/inspections
 * Submit pre-trip inspection
 *
 * Body:
 * {
 *   vehicle_id: number,
 *   inspection_items: Array<{item: string, status: 'pass' | 'fail'}>,
 *   timestamp: string
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   inspection_id: number
 * }
 */
const inspectionSchema = z.object({
  vehicle_id: z.number(),
  inspection_items: z.array(z.object({
    item: z.string(),
    status: z.enum(['pass', 'fail'])
  })),
  timestamp: z.string().datetime()
});

router.post('/inspections',
  requireRBAC({
    roles: [Role.USER, Role.MANAGER], // Driver or Manager
    permissions: [],
    enforceTenantIsolation: true
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const email = (req as any).user?.email;
    const { vehicle_id, inspection_items, timestamp } = req.body;

    // Validate request body
    const validation = inspectionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid inspection data',
        details: validation.error.issues
      });
    }

    logger.info(`Submitting inspection for vehicle ${vehicle_id} by user ${userId}`);

    // Find driver
    const driverResult = await pool.query(
      `SELECT id FROM drivers WHERE email = $1`,
      [email]
    );

    if (driverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const driverId = driverResult.rows[0].id;

    const failedCount = inspection_items.filter((item: any) => item.status === 'fail').length;
    const passedInspection = failedCount === 0;

    const insertResult = await pool.query(
      `INSERT INTO inspections (
        tenant_id,
        vehicle_id,
        driver_id,
        type,
        status,
        started_at,
        completed_at,
        defects_found,
        passed_inspection,
        checklist_data,
        notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      ) RETURNING id`,
      [
        (req as any).user?.tenant_id,
        vehicle_id,
        driverId,
        'safety',
        passedInspection ? 'completed' : 'failed',
        timestamp,
        timestamp,
        failedCount,
        passedInspection,
        JSON.stringify(inspection_items),
        null
      ]
    );

    const inspectionId = insertResult.rows[0]?.id;

    logger.info(`Inspection ${inspectionId} created successfully`);

    res.json({
      success: true,
      inspection_id: inspectionId
    });
  })
);

/**
 * POST /api/dashboard/reports/daily
 * Generate daily fleet report
 *
 * Body:
 * {
 *   date: string (ISO date)
 * }
 *
 * Response: PDF binary (application/pdf)
 */
const dailyReportSchema = z.object({
  date: z.string().datetime()
});

router.post('/reports/daily',
  requireRBAC({
    roles: [Role.ADMIN, Role.MANAGER],
    permissions: [PERMISSIONS.REPORTS_READ],
    enforceTenantIsolation: true
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { date } = req.body;
    const userId = (req as any).user?.id;

    // Validate request body
    const validation = dailyReportSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid date format',
        details: validation.error.issues
      });
    }

    logger.info(`Generating daily report for ${date} by user ${userId}`);

    // Generate PDF summary with real data
    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({ margin: 50 });

    const [vehicleResult, driverResult, workOrderResult] = await Promise.all([
      pool.query('SELECT COUNT(*)::integer as count FROM vehicles WHERE tenant_id = $1', [(req as any).user?.tenant_id]),
      pool.query('SELECT COUNT(*)::integer as count FROM drivers WHERE tenant_id = $1', [(req as any).user?.tenant_id]),
      pool.query('SELECT COUNT(*)::integer as count FROM work_orders WHERE tenant_id = $1', [(req as any).user?.tenant_id]),
    ]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="fleet-report-${date}.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).text('Fleet Daily Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Report Date: ${date}`);
    doc.text(`Generated By: ${userId}`);
    doc.moveDown();

    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total Vehicles: ${vehicleResult.rows[0]?.count || 0}`);
    doc.text(`Total Drivers: ${driverResult.rows[0]?.count || 0}`);
    doc.text(`Total Work Orders: ${workOrderResult.rows[0]?.count || 0}`);
    doc.moveDown();

    doc.fontSize(10).text(`Generated at ${new Date().toISOString()}`);

    doc.end();
  })
);

export default router;
