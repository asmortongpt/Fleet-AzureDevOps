Here's the complete refactored `mobile-trips.routes.ts` file using `MobileTripsRepository` methods instead of direct database queries:


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
  await mobileTripsRepository.endTrip(tenant_id, tripId, parsedData);

  res.status(200).json({ message: 'Trip ended successfully' });
}));

// Update trip metrics
router.post('/metrics/:tripId', csrfProtection, requirePermission('can_update_trip_metrics'), auditLog, asyncHandler(async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const parsedData = TripMetricsSchema.parse(req.body);
  const tenant_id = req.user?.tenant_id || req.body.tenant_id;

  const mobileTripsRepository = container.resolve(MobileTripsRepository);
  await mobileTripsRepository.updateTripMetrics(tenant_id, tripId, parsedData);

  res.status(200).json({ message: 'Trip metrics updated successfully' });
}));

// Get trip details
router.get('/:tripId', requirePermission('can_view_trip_details'), auditLog, asyncHandler(async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const tenant_id = req.user?.tenant_id || req.body.tenant_id;

  const mobileTripsRepository = container.resolve(MobileTripsRepository);
  const tripDetails = await mobileTripsRepository.getTripDetails(tenant_id, tripId);

  if (!tripDetails) {
    throw new NotFoundError('Trip not found');
  }

  res.status(200).json(tripDetails);
}));

// Get all trips for a vehicle
router.get('/vehicle/:vehicleId', requirePermission('can_view_vehicle_trips'), auditLog, asyncHandler(async (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  const tenant_id = req.user?.tenant_id || req.body.tenant_id;

  const mobileTripsRepository = container.resolve(MobileTripsRepository);
  const trips = await mobileTripsRepository.getTripsForVehicle(tenant_id, vehicleId);

  res.status(200).json(trips);
}));

// Get all trips for a driver
router.get('/driver/:driverId', requirePermission('can_view_driver_trips'), auditLog, asyncHandler(async (req: Request, res: Response) => {
  const { driverId } = req.params;
  const tenant_id = req.user?.tenant_id || req.body.tenant_id;

  const mobileTripsRepository = container.resolve(MobileTripsRepository);
  const trips = await mobileTripsRepository.getTripsForDriver(tenant_id, driverId);

  res.status(200).json(trips);
}));

export default router;


This refactored version replaces all direct database queries with calls to methods from the `MobileTripsRepository`. The repository methods are resolved using the dependency injection container, which helps in maintaining a clean separation of concerns and makes the code more testable and maintainable.