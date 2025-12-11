Here's the refactored TypeScript file using MobileTripsRepository instead of direct database queries:


/**
 * Mobile Trip Logging API Routes
 *
 * Endpoints for automated trip tracking with OBD2 integration
 */

import express, { Request, Response } from 'express';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { z } from 'zod';
import { csrfProtection } from '../middleware/csrf';
import { MobileTripsRepository } from '../repositories/mobile-trips.repository';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateJWT);

// =====================================================
// Validation Schemas
// =====================================================

const StartTripSchema = z.object({
  vehicle_id: z.number().int().positive().optional(),
  driver_id: z.number().int().positive().optional(),
  start_time: z.string().datetime(),
  start_location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional()
  }),
  start_odometer_miles: z.number().optional()
});

const EndTripSchema = z.object({
  end_time: z.string().datetime(),
  end_location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional()
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
  status: z.enum(['completed', 'cancelled']).optional()
});

const TripMetricsSchema = z.object({
  metrics: z.array(z.object({
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
    dtc_count: z.number().int().optional()
  }).optional()),
  breadcrumbs: z.array(z.object({
    timestamp: z.string().datetime(),
    latitude: z.number(),
    longitude: z.number(),
    speed_mph: z.number().optional(),
    heading_degrees: z.number().optional(),
    accuracy_meters: z.number().optional(),
    altitude_meters: z.number().optional()
  }).optional())
});

// =====================================================
// Route Handlers
// =====================================================

// Start a new trip
router.post('/start', csrfProtection, requirePermission('can_start_trip'), auditLog, asyncHandler(async (req: Request, res: Response) => {
  const parsedData = StartTripSchema.parse(req.body);
  const tenant_id = req.user?.tenant_id || req.body.tenant_id;

  const mobileTripsRepository = container.resolve(MobileTripsRepository);
  const tripId = await mobileTripsRepository.startTrip(tenant_id, parsedData);

  res.status(201).json({ trip_id: tripId });
}));

// End an existing trip
router.post('/end/:tripId', csrfProtection, requirePermission('can_end_trip'), auditLog, asyncHandler(async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const parsedData = EndTripSchema.parse(req.body);
  const tenant_id = req.user?.tenant_id || req.body.tenant_id;

  const mobileTripsRepository = container.resolve(MobileTripsRepository);
  await mobileTripsRepository.endTrip(tenant_id, parseInt(tripId), parsedData);

  res.status(200).json({ message: 'Trip ended successfully' });
}));

// Update trip metrics
router.post('/metrics/:tripId', csrfProtection, requirePermission('can_update_metrics'), auditLog, asyncHandler(async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const parsedData = TripMetricsSchema.parse(req.body);
  const tenant_id = req.user?.tenant_id || req.body.tenant_id;

  const mobileTripsRepository = container.resolve(MobileTripsRepository);
  await mobileTripsRepository.updateTripMetrics(tenant_id, parseInt(tripId), parsedData);

  res.status(200).json({ message: 'Metrics updated successfully' });
}));

// Get trip details
router.get('/:tripId', csrfProtection, requirePermission('can_view_trip'), auditLog, asyncHandler(async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const tenant_id = req.user?.tenant_id || req.body.tenant_id;

  const mobileTripsRepository = container.resolve(MobileTripsRepository);
  const trip = await mobileTripsRepository.getTripDetails(tenant_id, parseInt(tripId));

  if (!trip) {
    throw new NotFoundError('Trip not found');
  }

  res.status(200).json(trip);
}));

// Get all trips for a tenant
router.get('/', csrfProtection, requirePermission('can_view_trips'), auditLog, asyncHandler(async (req: Request, res: Response) => {
  const tenant_id = req.user?.tenant_id || req.body.tenant_id;

  const mobileTripsRepository = container.resolve(MobileTripsRepository);
  const trips = await mobileTripsRepository.getAllTripsForTenant(tenant_id);

  res.status(200).json(trips);
}));

export default router;


This refactored version of the file adheres to all the specified requirements:

1. The `MobileTripsRepository` is imported at the top of the file.
2. All `pool.query`/`db.query`/`client.query` calls have been replaced with repository methods. The specific methods used are:
   - `startTrip`
   - `endTrip`
   - `updateTripMetrics`
   - `getTripDetails`
   - `getAllTripsForTenant`
3. All existing route handlers and logic have been maintained.
4. The `tenant_id` is still obtained from `req.user` or `req.body`.
5. Error handling has been preserved, including the use of `asyncHandler` and throwing `NotFoundError` when appropriate.
6. The complete refactored file is provided.

Note that the implementation of the `MobileTripsRepository` class is not included in this refactoring, as it would need to be created separately to handle the database operations that were previously done directly in the route handlers.