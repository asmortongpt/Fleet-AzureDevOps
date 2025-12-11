Here's the refactored version of the `mobile-trips.routes.enhanced.ts` file, where all `pool.query` or `db.query` calls have been replaced with repository methods. I've assumed the existence of a `TripRepository` class with appropriate methods. The complete file is provided below:


import express, { Request, Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import helmet from 'helmet';
import csurf from 'csurf';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import { parseISO, isBefore, subMinutes } from 'date-fns';
import { csrfProtection } from '../middleware/csrf';
import { TripRepository } from '../repositories/trip-repository';

const router = express.Router();
const tripRepository = container.resolve(TripRepository);

router.use(helmet());
router.use(express.json());
router.use(csurf({ cookie: true }));
router.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
  })
);

// Apply authentication to all routes
router.use(authenticateJWT);

// =====================================================
// Validation Schemas
// =====================================================

const StartTripSchema = z.object({
  vehicle_id: z.number().int().positive().optional(),
  driver_id: z.number().int().positive().optional(),
  start_time: z.string().refine((val) => !isBefore(parseISO(val), subMinutes(new Date(), 5)), {
    message: 'Start time cannot be more than 5 minutes in the past',
  }),
  start_location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
  }),
  start_odometer_miles: z.number().optional(),
});

const EndTripSchema = z.object({
  end_time: z.string().refine((val) => !isBefore(parseISO(val), subMinutes(new Date(), 5)), {
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
});

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
      })
    )
    .optional(),
});

// =====================================================
// Routes
// =====================================================

// Start a new trip
router.post(
  '/start',
  csrfProtection,
  requirePermission('start_trip'),
  auditLog('Start Trip'),
  asyncHandler(async (req: Request, res: Response) => {
    const parsedData = StartTripSchema.parse(req.body);

    const tripId = await tripRepository.startTrip(parsedData);

    res.status(201).json({ trip_id: tripId });
  })
);

// End an existing trip
router.post(
  '/end/:tripId',
  csrfProtection,
  requirePermission('end_trip'),
  auditLog('End Trip'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tripId } = req.params;
    const parsedData = EndTripSchema.parse(req.body);

    const updatedTrip = await tripRepository.endTrip(Number(tripId), parsedData);

    if (!updatedTrip) {
      throw new NotFoundError('Trip not found');
    }

    res.json(updatedTrip);
  })
);

// Update trip metrics
router.post(
  '/metrics/:tripId',
  csrfProtection,
  requirePermission('update_trip_metrics'),
  auditLog('Update Trip Metrics'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tripId } = req.params;
    const parsedData = TripMetricsSchema.parse(req.body);

    const updatedTrip = await tripRepository.updateTripMetrics(Number(tripId), parsedData);

    if (!updatedTrip) {
      throw new NotFoundError('Trip not found');
    }

    res.json(updatedTrip);
  })
);

// Get trip details
router.get(
  '/:tripId',
  csrfProtection,
  requirePermission('view_trip'),
  auditLog('View Trip'),
  asyncHandler(async (req: Request, res: Response) => {
    const { tripId } = req.params;

    const trip = await tripRepository.getTrip(Number(tripId));

    if (!trip) {
      throw new NotFoundError('Trip not found');
    }

    res.json(trip);
  })
);

// Get all trips for a user
router.get(
  '/user/:userId',
  csrfProtection,
  requirePermission('view_user_trips'),
  auditLog('View User Trips'),
  asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const trips = await tripRepository.getUserTrips(Number(userId));

    res.json(trips);
  })
);

export default router;


In this refactored version:

1. We've imported the `TripRepository` class and resolved it from the container.
2. All database operations have been replaced with calls to the `TripRepository` methods:
   - `startTrip`
   - `endTrip`
   - `updateTripMetrics`
   - `getTrip`
   - `getUserTrips`

3. The `TripRepository` methods are assumed to handle the database operations that were previously done with `pool.query` or `db.query`.

4. Error handling for not found trips has been maintained using the `NotFoundError`.

5. The rest of the file structure, including middleware usage, validation schemas, and route definitions, remains unchanged.

Note that you'll need to implement the `TripRepository` class with the appropriate methods to match this refactored code. The `TripRepository` should encapsulate the database operations that were previously done with `pool.query` or `db.query`.