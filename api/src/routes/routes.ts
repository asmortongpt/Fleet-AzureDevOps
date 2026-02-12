import express, { Response } from 'express'

import logger from '../config/logger'
import { NotFoundError } from '../errors/app-error'
import { auditLog } from '../middleware/audit'
import { AuthRequest, authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { requirePermission } from '../middleware/permissions'
import { setTenantContext } from '../middleware/tenant-context'
import { buildInsertClause, buildUpdateClause } from '../utils/sql-safety'

const router = express.Router()
router.use(authenticateJWT)
router.use(setTenantContext)

// Response transformer to convert DB fields to API contract
const transformRouteResponse = (dbRow: any) => ({
  routeId: dbRow.id,
  vehicleId: dbRow.vehicle_id,
  driverId: dbRow.driver_id,
  status: dbRow.status,
  stops: parseStops(dbRow.waypoints || dbRow.optimized_waypoints),
  optimizationScore: calculateOptimizationScore(dbRow),
  estimatedDuration: dbRow.estimated_duration || 0,
  type: dbRow.route_type || 'delivery',
  date: dbRow.planned_start_time || new Date().toISOString(),
  startLocation: dbRow.start_location,
  endLocation: dbRow.end_location,
  notes: dbRow.notes,
  createdAt: dbRow.created_at,
  updatedAt: dbRow.updated_at
})

// Parse waypoints JSON to stops array
const parseStops = (waypoints: any): any[] => {
  if (!waypoints) return []

  try {
    const parsed = typeof waypoints === 'string' ? JSON.parse(waypoints) : waypoints
    if (Array.isArray(parsed)) {
      return parsed.map((wp: any, index: number) => ({
        stopNumber: index + 1,
        address: wp.address || wp.location || `Stop ${index + 1}`,
        estimatedArrival: wp.estimated_arrival || new Date(Date.now() + index * 30 * 60 * 1000).toISOString(),
        status: wp.status || (index === 0 ? 'in-progress' : 'pending'),
        priority: wp.priority || index + 1
      }))
    }
  } catch (e) {
    logger.warn('Failed to parse waypoints', { waypoints, error: e })
  }

  return []
}

// Calculate optimization score based on route efficiency
const calculateOptimizationScore = (route: any): number => {
  // Simple heuristic: base score on number of stops and estimated vs actual duration
  const baseScore = 75
  const stopCount = parseStops(route.waypoints || route.optimized_waypoints).length
  const stopBonus = Math.min(stopCount * 2, 20)

  // If we have actual duration, adjust based on efficiency
  if (route.actual_duration && route.estimated_duration) {
    const efficiency = route.estimated_duration / route.actual_duration
    return Math.min(Math.max(baseScore + stopBonus * efficiency, 0), 100)
  }

  return Math.min(baseScore + stopBonus, 100)
}

// GET /routes
router.get(
  '/',
  requirePermission('route:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        page = 1,
        pageSize = 50,
        type,
        status,
        driverId,
        vehicleId,
        date
      } = req.query

      const offset = (Number(page) - 1) * Number(pageSize)

      // Row-level filtering: check if user is a driver
      const userResult = await req.dbClient!.query(
        `SELECT id FROM drivers WHERE user_id = $1 AND tenant_id = $2`,
        [req.user!.id, req.user!.tenant_id]
      )

      let query = `SELECT
      id,
      tenant_id,
      name,
      assigned_vehicle_id as vehicle_id,
      assigned_driver_id as driver_id,
      status,
      type as route_type,
      start_facility_id as start_location,
      end_facility_id as end_location,
      scheduled_start_time as planned_start_time,
      scheduled_end_time as planned_end_time,
      actual_start_time,
      actual_end_time,
      actual_distance as total_distance,
      estimated_duration,
      actual_duration,
      waypoints,
      optimized_route as optimized_waypoints,
      metadata as route_geometry,
      description as notes,
      created_at,
      updated_at FROM routes WHERE tenant_id = $1`
      let countQuery = `SELECT COUNT(*) FROM routes WHERE tenant_id = $1`
      const params: any[] = [req.user!.tenant_id]
      let paramIndex = 2

      // Apply filters
      if (type) {
        query += ` AND type = $${paramIndex}`
        countQuery += ` AND type = $${paramIndex}`
        params.push(type)
        paramIndex++
      }

      if (status) {
        query += ` AND status = $${paramIndex}`
        countQuery += ` AND status = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      if (driverId) {
        query += ` AND assigned_driver_id = $${paramIndex}`
        countQuery += ` AND assigned_driver_id = $${paramIndex}`
        params.push(driverId)
        paramIndex++
      }

      if (vehicleId) {
        query += ` AND assigned_vehicle_id = $${paramIndex}`
        countQuery += ` AND assigned_vehicle_id = $${paramIndex}`
        params.push(vehicleId)
        paramIndex++
      }

      if (date) {
        query += ` AND DATE(scheduled_start_time) = DATE($${paramIndex})`
        countQuery += ` AND DATE(scheduled_start_time) = DATE($${paramIndex})`
        params.push(date)
        paramIndex++
      }

      // If user is a driver, filter to only their routes
      if (userResult.rows.length > 0) {
        const driverId = userResult.rows[0].id
        query += ` AND assigned_driver_id = $${paramIndex}`
        countQuery += ` AND assigned_driver_id = $${paramIndex}`
        params.push(driverId)
        paramIndex++
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
      params.push(pageSize, offset)

      const result = await req.dbClient!.query(query, params)
      const countResult = await req.dbClient!.query(countQuery, params.slice(0, -2))

      res.json({
        data: result.rows.map(transformRouteResponse),
        pagination: {
          page: Number(page),
          limit: Number(pageSize),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / Number(pageSize))
        }
      })
    } catch (error) {
      logger.error('Get routes error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /routes/active - Get all active routes (MUST be before /:id)
router.get(
  '/active',
  requirePermission('route:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Row-level filtering: check if user is a driver
      const userResult = await req.dbClient!.query(
        `SELECT id FROM drivers WHERE user_id = $1 AND tenant_id = $2`,
        [req.user!.id, req.user!.tenant_id]
      )

      let query = `
        SELECT
          r.id,
          r.tenant_id,
          r.name as route_name,
          r.assigned_vehicle_id as vehicle_id,
          r.assigned_driver_id as driver_id,
          r.status,
          r.type as route_type,
          r.start_facility_id as start_location,
          r.end_facility_id as end_location,
          r.scheduled_start_time as planned_start_time,
          r.scheduled_end_time as planned_end_time,
          r.actual_start_time,
          r.actual_distance as total_distance,
          r.estimated_duration,
          r.waypoints,
          r.optimized_route as optimized_waypoints,
          r.description as notes,
          r.created_at,
          r.updated_at,
          v.name as vehicle_name,
          v.license_plate,
          CONCAT(d.first_name, ' ', d.last_name) as driver_name
        FROM routes r
        LEFT JOIN vehicles v ON r.assigned_vehicle_id = v.id
        LEFT JOIN drivers d ON r.assigned_driver_id = d.id
        WHERE r.tenant_id = $1
          AND r.status IN ('in_progress', 'active', 'planned')
      `

      const params: any[] = [req.user!.tenant_id]

      // If user is a driver, filter to only their routes
      if (userResult.rows.length > 0) {
        const driverId = userResult.rows[0].id
        query += ` AND r.assigned_driver_id = $2`
        params.push(driverId)
      }

      query += ` ORDER BY r.scheduled_start_time ASC`

      const result = await req.dbClient!.query(query, params)

      res.json({
        data: result.rows.map(transformRouteResponse),
        total: result.rows.length
      })
    } catch (error) {
      logger.error('Get active routes error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /routes/optimize - Optimize route planning (MUST be before /:id)
router.post(
  '/optimize',
  authenticateJWT,
  csrfProtection,
  requirePermission('route:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { vehicleId, stops, startLocation, considerTraffic, departureTime } = req.body

      if (!stops || !Array.isArray(stops) || stops.length === 0) {
        return res.status(400).json({ error: 'Stops array is required' })
      }

      // Simple optimization: sort by distance from start location
      let optimizedStops = [...stops]

      if (startLocation && startLocation.latitude && startLocation.longitude) {
        optimizedStops = stops.sort((a: any, b: any) => {
          const distA = calculateDistance(startLocation, { lat: a.latitude || 0, lng: a.longitude || 0 })
          const distB = calculateDistance(startLocation, { lat: b.latitude || 0, lng: b.longitude || 0 })
          return distA - distB
        })
      }

      const estimatedDuration = optimizedStops.length * 30
      const trafficDelayMinutes = considerTraffic ? Math.min(20, Math.round(estimatedDuration * 0.1)) : 0

      res.json({
        data: {
          stops: optimizedStops,
          optimizationScore: calculateOptimizationScore({ waypoints: optimizedStops }),
          estimatedDuration: estimatedDuration + trafficDelayMinutes,
          trafficDelayMinutes: considerTraffic ? trafficDelayMinutes : undefined
        }
      })
    } catch (error) {
      logger.error('Optimize route error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /routes/analytics/completion (MUST be before /:id)
router.get(
  '/analytics/completion',
  requirePermission('route:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await req.dbClient!.query(
        `SELECT
          COUNT(*) as total_routes,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_routes,
          AVG(CASE WHEN status = 'completed' AND actual_duration IS NOT NULL THEN actual_duration END) as avg_completion_time
        FROM routes WHERE tenant_id = $1`,
        [req.user!.tenant_id]
      )

      const row = result.rows[0]
      const totalRoutes = parseInt(row.total_routes)
      const completedRoutes = parseInt(row.completed_routes)

      res.json({
        data: {
          totalRoutes,
          completedRoutes,
          completionRate: totalRoutes > 0 ? (completedRoutes / totalRoutes) * 100 : 0,
          averageCompletionTime: parseFloat(row.avg_completion_time) || 0
        }
      })
    } catch (error) {
      logger.error('Route completion analytics error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /routes/analytics/on-time (MUST be before /:id)
router.get(
  '/analytics/on-time',
  requirePermission('route:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await req.dbClient!.query(
        `SELECT
          COUNT(CASE WHEN status = 'completed' AND actual_end_time <= planned_end_time THEN 1 END) as on_time,
          COUNT(CASE WHEN status = 'completed' AND actual_end_time > planned_end_time THEN 1 END) as late,
          COUNT(CASE WHEN status = 'completed' AND actual_end_time < planned_end_time THEN 1 END) as early
        FROM routes WHERE tenant_id = $1 AND status = 'completed'`,
        [req.user!.tenant_id]
      )

      const row = result.rows[0]
      const onTime = parseInt(row.on_time) || 0
      const late = parseInt(row.late) || 0
      const early = parseInt(row.early) || 0
      const total = onTime + late + early

      res.json({
        data: {
          onTimeDeliveries: onTime,
          lateDeliveries: late,
          earlyDeliveries: early,
          onTimePercentage: total > 0 ? (onTime / total) * 100 : 0
        }
      })
    } catch (error) {
      logger.error('On-time analytics error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /routes/analytics/efficiency (MUST be before /:id)
router.get(
  '/analytics/efficiency',
  requirePermission('route:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const client = req.dbClient!
      const tenantId = req.user!.tenant_id

      const result = await client.query(
        `
        WITH scoped AS (
          SELECT
            COALESCE(jsonb_array_length(COALESCE(waypoints, '[]'::jsonb)), 0) AS stops,
            COALESCE(actual_distance, estimated_distance, 0) AS miles,
            actual_duration AS duration,
            status
          FROM routes
          WHERE tenant_id = $1
            AND created_at >= NOW() - INTERVAL '30 days'
        )
        SELECT
          AVG(stops)::numeric AS avg_stops,
          AVG(miles)::numeric AS avg_miles,
          AVG(duration::numeric / NULLIF(stops, 0)) AS avg_time_per_stop,
          (COUNT(*) FILTER (WHERE status = 'completed')::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100 AS utilization_rate
        FROM scoped
        `,
        [tenantId]
      )

      const row = result.rows[0] || {}

      res.json({
        data: {
          averageStopsPerRoute: Number(row.avg_stops) || 0,
          averageMilesPerRoute: Number(row.avg_miles) || 0,
          averageTimePerStop: Number(row.avg_time_per_stop) || 0,
          utilizationRate: Number(row.utilization_rate) || 0
        }
      })
    } catch (error) {
      logger.error('Efficiency analytics error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /routes/efficiency (legacy alias; MUST be before /:id)
router.get(
  '/efficiency',
  requirePermission('route:view:fleet'),
  auditLog({ action: 'READ', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const client = req.dbClient!
      const tenantId = req.user!.tenant_id

      const result = await client.query(
        `
        WITH scoped AS (
          SELECT
            COALESCE(jsonb_array_length(COALESCE(waypoints, '[]'::jsonb)), 0) AS stops,
            COALESCE(actual_distance, estimated_distance, 0) AS miles,
            actual_duration AS duration,
            status
          FROM routes
          WHERE tenant_id = $1
            AND created_at >= NOW() - INTERVAL '30 days'
        )
        SELECT
          AVG(stops)::numeric AS avg_stops,
          AVG(miles)::numeric AS avg_miles,
          AVG(duration::numeric / NULLIF(stops, 0)) AS avg_time_per_stop,
          (COUNT(*) FILTER (WHERE status = 'completed')::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100 AS utilization_rate
        FROM scoped
        `,
        [tenantId]
      )

      const row = result.rows[0] || {}

      res.json({
        data: {
          averageStopsPerRoute: Number(row.avg_stops) || 0,
          averageMilesPerRoute: Number(row.avg_miles) || 0,
          averageTimePerStop: Number(row.avg_time_per_stop) || 0,
          utilizationRate: Number(row.utilization_rate) || 0
        }
      })
    } catch (error) {
      logger.error('Efficiency analytics error (alias):', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /routes/:id
router.get(
  '/:id',
  requirePermission('route:view:own', {
    customCheck: async (req: AuthRequest) => {
      // IDOR check: verify the route belongs to the user if they're a driver
      const driverResult = await req.dbClient!.query(
        `SELECT id FROM drivers WHERE user_id = $1 AND tenant_id = $2`,
        [req.user!.id, req.user!.tenant_id]
      )

      // If user is not a driver, allow access (fleet managers/admins)
      if (driverResult.rows.length === 0) {
        return true
      }

      // If user is a driver, verify the route belongs to them
      const routeResult = await req.dbClient!.query(
        `SELECT id FROM routes WHERE id = $1 AND assigned_driver_id = $2 AND tenant_id = $3`,
        [req.params.id, driverResult.rows[0].id, req.user!.tenant_id]
      )

      return routeResult.rows.length > 0
    }
  }),
  auditLog({ action: 'READ', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const result = await req.dbClient!.query(
        `SELECT
      id,
      tenant_id,
      name,
      assigned_vehicle_id as vehicle_id,
      assigned_driver_id as driver_id,
      status,
      type as route_type,
      start_facility_id as start_location,
      end_facility_id as end_location,
      scheduled_start_time as planned_start_time,
      scheduled_end_time as planned_end_time,
      actual_start_time,
      actual_end_time,
      actual_distance as total_distance,
      estimated_duration,
      actual_duration,
      waypoints,
      optimized_route as optimized_waypoints,
      metadata as route_geometry,
      description as notes,
      created_at,
      updated_at FROM routes WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Route not found` })
      }

      res.json({ data: transformRouteResponse(result.rows[0]) })
    } catch (error) {
      logger.error('Get route error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /routes
router.post(
  '/',
  authenticateJWT,
  csrfProtection,
  requirePermission('route:create:fleet'),
  auditLog({ action: 'CREATE', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { vehicleId, driverId, stops, startTime, optimize, status } = req.body

      // Validate required fields
      if (!vehicleId || !driverId || !stops || !Array.isArray(stops) || stops.length === 0) {
        return res.status(400).json({ error: 'Missing required fields: vehicleId, driverId, stops' })
      }

      // Validate vehicle exists
      const vehicleCheck = await req.dbClient!.query(
        'SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2',
        [vehicleId, req.user!.tenant_id]
      )
      if (vehicleCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid vehicle ID' })
      }

      // Validate driver exists
      const driverCheck = await req.dbClient!.query(
        'SELECT id FROM drivers WHERE id = $1 AND tenant_id = $2',
        [driverId, req.user!.tenant_id]
      )
      if (driverCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid driver ID' })
      }

      // Optimize stops if requested
      let processedStops = stops
      if (optimize) {
        processedStops = stops.sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0))
      }

      // Convert stops to waypoints format
      const waypoints = processedStops.map((stop: any, index: number) => ({
        address: stop.address,
        priority: stop.priority || index + 1,
        stopNumber: stop.stopNumber || index + 1,
        estimated_arrival: new Date(Date.now() + index * 30 * 60 * 1000).toISOString(),
        status: stop.status || 'pending'
      }))

      const estimatedDuration = processedStops.length * 30 // 30 mins per stop

      const insertData = {
        tenant_id: req.user!.tenant_id,
        name: `Route ${new Date().toISOString()}`,
        assigned_vehicle_id: vehicleId,
        assigned_driver_id: driverId,
        status: status || 'planned',
        waypoints: JSON.stringify(waypoints),
        optimized_route: optimize ? JSON.stringify(waypoints) : null,
        estimated_duration: estimatedDuration,
        scheduled_start_time: startTime || new Date().toISOString()
      }

      const { columnNames, placeholders, values } = buildInsertClause(
        insertData,
        [],
        1
      )

      const result = await req.dbClient!.query(
        `INSERT INTO routes (${columnNames}) VALUES (${placeholders}) RETURNING *`,
        values
      )

      res.status(201).json({ data: transformRouteResponse(result.rows[0]) })
    } catch (error) {
      logger.error(`Create route error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// PUT /routes/:id
const ALLOWED_UPDATE_FIELDS = [
  "notes",
  "status",
  "start_location",
  "end_location",
  "waypoints",
  "distance"
]

router.put(
  '/:id',
  authenticateJWT,
  csrfProtection,
  requirePermission('route:update:fleet', {
    customCheck: async (req: AuthRequest) => {
      // Prevent modifying completed routes
      const routeResult = await req.dbClient!.query(
        `SELECT status FROM routes WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (routeResult.rows.length === 0) {
        return false
      }

      // Block updates to completed routes
      const status = routeResult.rows[0].status
      if (status === `completed`) {
        return false
      }

      return true
    }
  }),
  auditLog({ action: 'UPDATE', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body

      // SECURITY: IDOR Protection - Validate foreign keys belong to tenant
      const { assigned_vehicle_id, assigned_driver_id } = data

      if (assigned_vehicle_id) {
        const vehicleCheck = await req.dbClient!.query(
          'SELECT id FROM vehicles WHERE id = $1 AND tenant_id = $2',
          [assigned_vehicle_id, req.user!.tenant_id]
        )
        if (vehicleCheck.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: 'Vehicle Id not found or access denied'
          })
        }
      }

      if (assigned_driver_id) {
        const driverCheck = await req.dbClient!.query(
          'SELECT id FROM drivers WHERE id = $1 AND tenant_id = $2',
          [assigned_driver_id, req.user!.tenant_id]
        )
        if (driverCheck.rows.length === 0) {
          return res.status(403).json({
            success: false,
            error: 'Driver Id not found or access denied'
          })
        }
      }

      const { fields, values } = buildUpdateClause(data, 3)

      const result = await req.dbClient!.query(
        `UPDATE routes SET ${fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *`,
        [req.params.id, req.user!.tenant_id, ...values]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: `Route not found` })
      }

      res.json({ data: transformRouteResponse(result.rows[0]) })
    } catch (error) {
      logger.error(`Update route error:`, error)
      res.status(500).json({ error: `Internal server error` })
    }
  }
)

// PUT /routes/:id/stops - Add stops to route
router.put(
  '/:id/stops',
  authenticateJWT,
  csrfProtection,
  requirePermission('route:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { stops } = req.body

      if (!stops || !Array.isArray(stops)) {
        return res.status(400).json({ error: 'Invalid stops data' })
      }

      // Get current route
      const routeResult = await req.dbClient!.query(
        `SELECT waypoints FROM routes WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (routeResult.rows.length === 0) {
        return res.status(404).json({ error: 'Route not found' })
      }

      const currentWaypoints = parseStops(routeResult.rows[0].waypoints)
      const newStops = stops.map((stop: any, index: number) => ({
        address: stop.address,
        priority: stop.priority || currentWaypoints.length + index + 1,
        estimated_arrival: new Date(Date.now() + (currentWaypoints.length + index) * 30 * 60 * 1000).toISOString(),
        status: 'pending'
      }))

      const updatedWaypoints = [...currentWaypoints, ...newStops]

      const result = await req.dbClient!.query(
        `UPDATE routes SET waypoints = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
        [JSON.stringify(updatedWaypoints), req.params.id, req.user!.tenant_id]
      )

      res.json({ data: transformRouteResponse(result.rows[0]) })
    } catch (error) {
      logger.error('Update route stops error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /routes/:id/optimize - Reoptimize route
router.put(
  '/:id/optimize',
  authenticateJWT,
  csrfProtection,
  requirePermission('route:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Get current route
      const routeResult = await req.dbClient!.query(
        `SELECT waypoints FROM routes WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (routeResult.rows.length === 0) {
        return res.status(404).json({ error: 'Route not found' })
      }

      const stops = parseStops(routeResult.rows[0].waypoints)

      // Simple optimization: sort by priority
      const optimizedStops = stops.sort((a: any, b: any) => a.priority - b.priority)

      const result = await req.dbClient!.query(
        `UPDATE routes SET optimized_route = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
        [JSON.stringify(optimizedStops), req.params.id, req.user!.tenant_id]
      )

      res.json({ data: transformRouteResponse(result.rows[0]) })
    } catch (error) {
      logger.error('Optimize route error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /routes/:id/stops/:stopNumber - Update stop status
router.put(
  '/:id/stops/:stopNumber',
  authenticateJWT,
  csrfProtection,
  requirePermission('route:update:fleet'),
  auditLog({ action: 'UPDATE', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const stopNumber = parseInt(req.params.stopNumber)
      const { status, actualArrival, actualDeparture } = req.body

      // Get current route
      const routeResult = await req.dbClient!.query(
        `SELECT waypoints FROM routes WHERE id = $1 AND tenant_id = $2`,
        [req.params.id, req.user!.tenant_id]
      )

      if (routeResult.rows.length === 0) {
        return res.status(404).json({ error: 'Route not found' })
      }

      const stops = parseStops(routeResult.rows[0].waypoints)
      const stopIndex = stops.findIndex((s: any) => s.stopNumber === stopNumber)

      if (stopIndex === -1) {
        return res.status(404).json({ error: 'Stop not found' })
      }

      // Update stop
      stops[stopIndex] = {
        ...stops[stopIndex],
        status: status || stops[stopIndex].status,
        actualArrival: actualArrival || stops[stopIndex].actualArrival,
        actualDeparture: actualDeparture || stops[stopIndex].actualDeparture
      }

      // If this stop is completed and there's a next stop, mark it as in-progress
      if (status === 'completed' && stopIndex + 1 < stops.length) {
        stops[stopIndex + 1].status = 'in-progress'
      }

      const result = await req.dbClient!.query(
        `UPDATE routes SET waypoints = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3 RETURNING *`,
        [JSON.stringify(stops), req.params.id, req.user!.tenant_id]
      )

      res.json({ data: transformRouteResponse(result.rows[0]) })
    } catch (error) {
      logger.error('Update stop status error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /routes/:id
router.delete(
  '/:id',
  authenticateJWT,
  csrfProtection,
  requirePermission('route:delete:fleet'),
  auditLog({ action: 'DELETE', resourceType: 'routes' }),
  async (req: AuthRequest, res: Response) => {
    try {
      // Check if route is active
      const routeCheck = await req.dbClient!.query(
        'SELECT status FROM routes WHERE id = $1 AND tenant_id = $2',
        [req.params.id, req.user!.tenant_id]
      )

      if (routeCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Route not found' })
      }

      if (routeCheck.rows[0].status === 'in-progress' || routeCheck.rows[0].status === 'active') {
        return res.status(400).json({ error: 'Cannot delete active routes' })
      }

      const result = await req.dbClient!.query(
        'DELETE FROM routes WHERE id = $1 AND tenant_id = $2 RETURNING id',
        [req.params.id, req.user!.tenant_id]
      )

      if (result.rows.length === 0) {
        throw new NotFoundError("Route not found")
      }

      res.json({ message: 'Route deleted successfully' })
    } catch (error) {
      logger.error('Delete route error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// Helper function to calculate distance between two points
function calculateDistance(point1: any, point2: any): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(point2.lat - point1.latitude)
  const dLon = toRad(point2.lng - point1.longitude)
  const lat1 = toRad(point1.latitude)
  const lat2 = toRad(point2.lat)

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export default router
