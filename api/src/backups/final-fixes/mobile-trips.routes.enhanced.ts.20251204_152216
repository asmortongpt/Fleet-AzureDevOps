import express, { Request, Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { auditLog } from '../middleware/audit'
import { z } from 'zod'
import helmet from 'helmet'
import csurf from 'csurf'
import rateLimit from 'express-rate-limit'
import bcrypt from 'bcrypt'
import { parseISO, isBefore, subMinutes } from 'date-fns'

const router = express.Router()

router.use(helmet()
router.use(express.json()
router.use(csurf({ cookie: true })
router.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
  })
)

// Apply authentication to all routes
router.use(authenticateJWT)

// =====================================================
// Validation Schemas
// =====================================================

const StartTripSchema = z.object({
  vehicle_id: z.number().int().positive().optional(),
  driver_id: z.number().int().positive().optional(),
  start_time: z.string().refine(val => !isBefore(parseISO(val), subMinutes(new Date(), 5), {
    message: 'Start time cannot be more than 5 minutes in the past',
  }),
  start_location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }),
  start_odometer_miles: z.number().optional(),
})

const EndTripSchema = z.object({
  end_time: z.string().refine(val => !isBefore(parseISO(val), subMinutes(new Date(), 5), {
    message: 'End time cannot be more than 5 minutes in the past',
  }),
  end_location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }),
  end_odometer_miles: z.number().optional(),
  duration_seconds: z.number().int().optional(),
  distance_miles: z.number().optional(),
  avg_speed_mph: z.number().optional(),
  max_speed_mph: z.number().optional(),
  idle_time_seconds: z.number().int().optional(),
  fuel_consumed_gallons: z.number().optional(),
  fuel_efficiency_mpg: z.number().optional(),
  driver_score: z.number().int().min(0).max(100).optional(),
  harsh_acceleration_count: z.number().int().optional(),
  harsh_braking_count: z.number().int().optional(),
  harsh_cornering_count: z.number().int().optional(),
  speeding_count: z.number().int().optional(),
  status: z.enum(['completed', 'cancelled']).optional(),
})

const TripMetricsSchema = z.object({
  metrics: z
    .array(
      z.object({
        timestamp: z.string().datetime(),
        engine_rpm: z.number().optional(),
        engine_load_percent: z.number().optional(),
        engine_coolant_temp_f: z.number().optional(),
        fuel_level_percent: z.number().optional(),
        fuel_flow_rate_gph: z.number().optional(),
        speed_mph: z.number().optional(),
        throttle_position_percent: z.number().optional(),
        battery_voltage: z.number().optional(),
        odometer_miles: z.number().optional(),
        mil_status: z.boolean().optional(),
        dtc_count: z.number().int().optional(),
      })
    )
    .optional(),
  breadcrumbs: z
    .array(
      z.object({
        timestamp: z.string().datetime(),
        latitude: z.number(),
        longitude: z.number(),
        speed_mph: z.number().optional(),
        heading_degrees: z.number().optional(),
        accuracy_meters: z.number().optional(),
        altitude_meters: z.number().optional(),
        engine_rpm: z.number().optional(),
        fuel_level_percent: z.number().optional(),
        coolant_temp_f: z.number().optional(),
        throttle_position_percent: z.number().optional(),
      })
    )
    .optional(),
  events: z
    .array(
      z.object({
        timestamp: z.string().datetime(),
        event_type: z.string(),
        event_details: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
    )
    .optional(),
})

// =====================================================
// Route Handlers
// =====================================================

// Example route handler
router.post('/start', requirePermission('trip:start'), async (req: Request, res: Response) => {
  try {
    const parsed = StartTripSchema.parse(req.body)
    const hashedOdometer = await bcrypt.hash(parsed.start_odometer_miles.toString(), 12)
    const result = await pool.query(
      'INSERT INTO trips (vehicle_id, driver_id, start_time, start_location, start_odometer_miles) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        parsed.vehicle_id,
        parsed.driver_id,
        parsed.start_time,
        JSON.stringify(parsed.start_location),
        hashedOdometer,
      ]
    )
    auditLog(req, 'Trip started')
    res.json(result.rows[0])
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Additional route handlers would go here

export default router
