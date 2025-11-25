/**
 * Route Optimization API Endpoints
 */

import express, { Response } from 'express'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import pool from '../config/database'
import * as routeOptimizationService from '../services/route-optimization.service'
import { z } from 'zod'
import { getErrorMessage } from '../utils/error-handler'

const router = express.Router()
router.use(authenticateJWT)

// Validation schemas
const StopSchema = z.object({
  name: z.string(),
  address: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  serviceMinutes: z.number().min(0).default(15),
  earliestArrival: z.string().optional(),
  latestArrival: z.string().optional(),
  weight: z.number().optional(),
  volume: z.number().optional(),
  packages: z.number().optional(),
  priority: z.number().min(1).max(5).default(1),
  requiresRefrigeration: z.boolean().optional(),
  requiresLiftgate: z.boolean().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional()
})

const OptimizationRequestSchema = z.object({
  jobName: z.string(),
  stops: z.array(StopSchema).min(2),
  vehicleIds: z.array(z.number()).optional(),
  driverIds: z.array(z.number()).optional(),
  goal: z.enum(['minimize_time', 'minimize_distance', 'minimize_cost', 'balance']).default('balance'),
  considerTraffic: z.boolean().default(true),
  considerTimeWindows: z.boolean().default(true),
  considerCapacity: z.boolean().default(true),
  maxVehicles: z.number().optional(),
  maxStopsPerRoute: z.number().default(50),
  maxRouteDuration: z.number().default(480),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional()
})

/**
 * @openapi
 * /api/route-optimization/optimize:
 *   post:
 *     summary: Create optimized routes
 *     description: Optimize delivery/service routes using AI algorithms
 *     tags:
 *       - Route Optimization
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobName
 *               - stops
 *             properties:
 *               jobName:
 *                 type: string
 *                 example: "Daily Deliveries - Nov 10"
 *               stops:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     address:
 *                       type: string
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *                     serviceMinutes:
 *                       type: number
 *                     weight:
 *                       type: number
 *               vehicleIds:
 *                 type: array
 *                 items:
 *                   type: number
 *               goal:
 *                 type: string
 *                 enum: [minimize_time, minimize_distance, minimize_cost, balance]
 *     responses:
 *       200:
 *         description: Routes optimized successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Optimization failed
 */
router.post(
  '/optimize',
  requirePermission('route:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'route_optimization' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Validate request
      const validatedData = OptimizationRequestSchema.parse(req.body)

      // Get vehicles
      let vehicles = []
      if (validatedData.vehicleIds && validatedData.vehicleIds.length > 0) {
        const vehicleResult = await pool.query(
          `SELECT v.*, vp.*
           FROM vehicles v
           LEFT JOIN vehicle_optimization_profiles vp ON v.id = vp.vehicle_id
           WHERE v.id = ANY($1) AND v.tenant_id = $2',
          [validatedData.vehicleIds, req.user!.tenant_id]
        )
        vehicles = vehicleResult.rows
      } else {
        // Get all available vehicles
        const vehicleResult = await pool.query(
          `SELECT v.*, vp.*
           FROM vehicles v
           LEFT JOIN vehicle_optimization_profiles vp ON v.id = vp.vehicle_id
           WHERE v.tenant_id = $1 AND (vp.available_for_optimization IS NULL OR vp.available_for_optimization = true)
           LIMIT 20`,
          [req.user!.tenant_id]
        )
        vehicles = vehicleResult.rows
      }

      if (vehicles.length === 0) {
        return res.status(400).json({ error: 'No available vehicles found' })
      }

      // Get drivers
      let drivers = []
      if (validatedData.driverIds && validatedData.driverIds.length > 0) {
        const driverResult = await pool.query(
          `SELECT d.*, dp.*
           FROM drivers d
           LEFT JOIN driver_optimization_profiles dp ON d.id = dp.driver_id
           WHERE d.id = ANY($1) AND d.tenant_id = $2',
          [validatedData.driverIds, req.user!.tenant_id]
        )
        drivers = driverResult.rows
      } else {
        // Get all available drivers
        const driverResult = await pool.query(
          `SELECT d.*, dp.*
           FROM drivers d
           LEFT JOIN driver_optimization_profiles dp ON d.id = dp.driver_id
           WHERE d.tenant_id = $1 AND d.status = 'active'
           LIMIT 20`,
          [req.user!.tenant_id]
        )
        drivers = driverResult.rows
      }

      // Run optimization
      const result = await routeOptimizationService.optimizeRoutes(
        req.user!.tenant_id,
        req.user!.id,
        validatedData.stops,
        vehicles,
        drivers,
        {
          jobName: validatedData.jobName,
          goal: validatedData.goal,
          considerTraffic: validatedData.considerTraffic,
          considerTimeWindows: validatedData.considerTimeWindows,
          considerCapacity: validatedData.considerCapacity,
          maxVehicles: validatedData.maxVehicles,
          maxStopsPerRoute: validatedData.maxStopsPerRoute,
          maxRouteDuration: validatedData.maxRouteDuration,
          scheduledDate: validatedData.scheduledDate,
          scheduledTime: validatedData.scheduledTime
        }
      )

      res.json(result)
    } catch (error: any) {
      console.error('Route optimization error:', error)

      if (error.name === 'ZodError') {
        return res.status(400).json({
          error: 'Validation error',
          details: error.errors
        })
      }

      res.status(500).json({
        error: 'Route optimization failed',
        message: getErrorMessage(error)
      })
    }
  }
)

/**
 * @openapi
 * /api/route-optimization/jobs:
 *   get:
 *     summary: Get all optimization jobs
 *     tags:
 *       - Route Optimization
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/jobs',
  requirePermission('route:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'route_optimization' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50, status } = req.query
      const offset = (Number(page) - 1) * Number(limit)

      let query = `SELECT
        id, tenant_id, job_name, job_type, optimization_goal, max_vehicles,
        max_stops_per_route, max_route_duration_minutes, consider_traffic,
        consider_time_windows, consider_vehicle_capacity, consider_driver_hours,
        consider_ev_range, scheduled_date, scheduled_time, time_zone, status,
        progress_percent, total_routes, total_distance_miles, total_duration_minutes,
        estimated_fuel_cost, estimated_time_saved_minutes, estimated_cost_savings,
        solver_runtime_seconds, solver_status, optimization_score, created_by,
        created_at, started_at, completed_at, error_message
      FROM route_optimization_jobs WHERE tenant_id = $1'
      const params: any[] = [req.user!.tenant_id]

      if (status) {
        query += ` AND status = $${params.length + 1}`
        params.push(status)
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
      params.push(limit, offset)

      const result = await pool.query(query, params)

      const countResult = await pool.query(
        'SELECT COUNT(*) FROM route_optimization_jobs WHERE tenant_id = $1',
        [req.user!.tenant_id]
      )

      res.json({
        data: result.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / Number(limit))
        }
      })
    } catch (error) {
      console.error('Get jobs error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * @openapi
 * /api/route-optimization/jobs/{id}:
 *   get:
 *     summary: Get optimization job details
 *     tags:
 *       - Route Optimization
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/jobs/:id',
  requirePermission('route:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'route_optimization' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const job = await routeOptimizationService.getOptimizationJob(
        parseInt(req.params.id),
        req.user!.tenant_id
      )

      if (!job) {
        return res.status(404).json({ error: 'Job not found' })
      }

      // Get routes
      const routes = await routeOptimizationService.getRoutesForJob(
        parseInt(req.params.id),
        req.user!.tenant_id
      )

      // Get stops
      const stopsResult = await pool.query(
        `SELECT
          id, job_id, tenant_id, stop_name, stop_type, priority, address,
          latitude, longitude, earliest_arrival, latest_arrival, service_duration_minutes,
          weight_lbs, volume_cuft, package_count, requires_refrigeration,
          requires_liftgate, requires_signature, access_notes, customer_name,
          customer_phone, customer_email, assigned_route_id, assigned_sequence,
          estimated_arrival_time, actual_arrival_time, actual_departure_time,
          status, completion_notes, metadata, created_at, updated_at
        FROM route_stops
        WHERE job_id = $1
        ORDER BY assigned_route_id, assigned_sequence`,
        [req.params.id]
      )

      res.json({
        job,
        routes,
        stops: stopsResult.rows
      })
    } catch (error) {
      console.error('Get job error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * @openapi
 * /api/route-optimization/routes/active:
 *   get:
 *     summary: Get all active routes
 *     tags:
 *       - Route Optimization
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/routes/active',
  requirePermission('route:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'route_optimization' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT
          id, job_id, tenant_id, route_number, route_name, vehicle_id, driver_id,
          total_stops, total_distance_miles, total_duration_minutes,
          driving_duration_minutes, service_duration_minutes, total_weight_lbs,
          total_volume_cuft, total_packages, capacity_utilization_percent,
          fuel_cost, labor_cost, total_cost, planned_start_time, planned_end_time,
          actual_start_time, actual_end_time, route_geometry, route_polyline,
          waypoints, traffic_factor, alternative_routes_count, status, notes,
          created_at, updated_at
        FROM active_routes_summary
        WHERE id IN (
          SELECT id FROM optimized_routes WHERE tenant_id = $1
        )
        ORDER BY planned_start_time DESC`,
        [req.user!.tenant_id]
      )

      res.json({ data: result.rows })
    } catch (error) {
      console.error('Get active routes error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * @openapi
 * /api/route-optimization/routes/{id}:
 *   get:
 *     summary: Get route details
 *     tags:
 *       - Route Optimization
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/routes/:id',
  requirePermission('route:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'route_optimization' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const routeResult = await pool.query(
        'SELECT r.*, v.name as vehicle_name, d.first_name || ' ' || d.last_name as driver_name
         FROM optimized_routes r
         LEFT JOIN vehicles v ON r.vehicle_id = v.id
         LEFT JOIN drivers d ON r.driver_id = d.id
         WHERE r.id = $1 AND r.tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (routeResult.rows.length === 0) {
        return res.status(404).json({ error: 'Route not found' })
      }

      const route = routeResult.rows[0]

      // Get stops
      const stopsResult = await pool.query(
        `SELECT
          id, job_id, tenant_id, stop_name, stop_type, priority, address,
          latitude, longitude, earliest_arrival, latest_arrival, service_duration_minutes,
          weight_lbs, volume_cuft, package_count, requires_refrigeration,
          requires_liftgate, requires_signature, access_notes, customer_name,
          customer_phone, customer_email, assigned_route_id, assigned_sequence,
          estimated_arrival_time, actual_arrival_time, actual_departure_time,
          status, completion_notes, metadata, created_at, updated_at
        FROM route_stops
        WHERE assigned_route_id = $1
        ORDER BY assigned_sequence`,
        [req.params.id]
      )

      res.json({
        ...route,
        stops: stopsResult.rows
      })
    } catch (error) {
      console.error('Get route error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * @openapi
 * /api/route-optimization/routes/{id}/update:
 *   put:
 *     summary: Update route in real-time
 *     tags:
 *       - Route Optimization
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/routes/:id/update',
  requirePermission('route:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'route_optimization' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { status, actualStartTime, actualEndTime, notes } = req.body

      const result = await pool.query(
        `UPDATE optimized_routes
         SET status = COALESCE($1, status),
             actual_start_time = COALESCE($2, actual_start_time),
             actual_end_time = COALESCE($3, actual_end_time),
             notes = COALESCE($4, notes),
             updated_at = NOW()
         WHERE id = $5 AND tenant_id = $6
         RETURNING *`,
        [status, actualStartTime, actualEndTime, notes, req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Route not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Update route error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * @openapi
 * /api/route-optimization/routes/{id}/stops/{stopId}/complete:
 *   post:
 *     summary: Mark stop as completed
 *     tags:
 *       - Route Optimization
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/routes/:id/stops/:stopId/complete',
  requirePermission('route:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'route_optimization' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { arrivalTime, departureTime, notes } = req.body

      const result = await pool.query(
        `UPDATE route_stops
         SET status = 'completed',
             actual_arrival_time = COALESCE($1, NOW()),
             actual_departure_time = COALESCE($2, NOW()),
             completion_notes = $3,
             updated_at = NOW()
         WHERE id = $4 AND assigned_route_id = $5
         RETURNING *`,
        [arrivalTime, departureTime, notes, req.params.stopId, req.params.id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Stop not found' })
      }

      res.json(result.rows[0])
    } catch (error) {
      console.error('Complete stop error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

/**
 * @openapi
 * /api/route-optimization/stats:
 *   get:
 *     summary: Get optimization statistics
 *     tags:
 *       - Route Optimization
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/stats',
  requirePermission('route:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'route_optimization' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Get summary stats
      const statsResult = await pool.query(
        `SELECT
           COUNT(*) as total_jobs,
           COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
           SUM(total_distance_miles) as total_distance,
           SUM(estimated_cost_savings) as total_savings,
           AVG(optimization_score) as avg_optimization_score
         FROM route_optimization_jobs
         WHERE tenant_id = $1
           AND created_at >= NOW() - INTERVAL '30 days'`,
        [req.user!.tenant_id]
      )

      // Get recent jobs
      const recentResult = await pool.query(
        `SELECT
          id, tenant_id, job_name, job_type, optimization_goal, max_vehicles,
          max_stops_per_route, max_route_duration_minutes, consider_traffic,
          consider_time_windows, consider_vehicle_capacity, consider_driver_hours,
          consider_ev_range, scheduled_date, scheduled_time, time_zone, status,
          progress_percent, total_routes, total_distance_miles, total_duration_minutes,
          estimated_fuel_cost, estimated_time_saved_minutes, estimated_cost_savings,
          solver_runtime_seconds, solver_status, optimization_score, created_by,
          created_at, started_at, completed_at, error_message
        FROM optimization_job_stats
        WHERE id IN (
          SELECT id FROM route_optimization_jobs WHERE tenant_id = $1
        )
        ORDER BY id DESC
        LIMIT 10`,
        [req.user!.tenant_id]
      )

      res.json({
        summary: statsResult.rows[0],
        recentJobs: recentResult.rows
      })
    } catch (error) {
      console.error('Get stats error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
