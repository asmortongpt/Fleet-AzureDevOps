import express, { Response } from 'express';
import { Pool } from 'pg';
import { z } from 'zod';

import { NotFoundError } from '../errors/app-error';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { requirePermission } from '../middleware/permissions';
import { rateLimiter } from '../middleware/rate-limiter';
import { AssignmentNotificationService } from '../services/assignment-notification.service';

import { AssignmentRepository } from '../repositories/assignment.repository';
import { CallbackTripRepository } from '../repositories/callback-trip.repository';
import { ReimbursementRequestRepository } from '../repositories/reimbursement-request.repository';
import { OnCallPeriodRepository } from '../repositories/on-call-period.repository';

const router = express.Router();

let pool: Pool;
let notificationService: AssignmentNotificationService;
let assignmentRepository: AssignmentRepository;
let callbackTripRepository: CallbackTripRepository;
let reimbursementRequestRepository: ReimbursementRequestRepository;
let onCallPeriodRepository: OnCallPeriodRepository;

export function setDatabasePool(dbPool: Pool) {
  pool = dbPool;
  notificationService = new AssignmentNotificationService(dbPool);
  assignmentRepository = new AssignmentRepository(pool);
  callbackTripRepository = new CallbackTripRepository(pool);
  reimbursementRequestRepository = new ReimbursementRequestRepository(pool);
  onCallPeriodRepository = new OnCallPeriodRepository(pool);
}

// =====================================================
// Validation Schemas
// =====================================================

const callbackTripSchema = z.object({
  on_call_period_id: z.string().uuid(),
  trip_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  trip_start_time: z.string().optional(),
  trip_end_time: z.string().optional(),
  miles_driven: z.number().positive(),
  includes_commute_trip: z.boolean().default(false),
  commute_miles: z.number().nonnegative().optional(),
  used_private_vehicle: z.boolean().default(false),
  purpose: z.string(),
  notes: z.string().optional(),
  start_latitude: z.number().optional(),
  start_longitude: z.number().optional(),
  end_latitude: z.number().optional(),
  end_longitude: z.number().optional(),
});

const reimbursementRequestSchema = z.object({
  callback_trip_id: z.string().uuid(),
  amount: z.number().positive(),
  mileage_rate: z.number().positive(),
  receipt_photo: z.string().optional(),
});

// =====================================================
// GET /mobile/dashboard/employee
// =====================================================

router.get(
  '/dashboard/employee',
  authenticateJWT,
  requirePermission('vehicle_assignment:view:own'),
  rateLimiter(100),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user_id = req.user!.id;
    const tenant_id = req.user!.tenant_id;

    const driverId = await assignmentRepository.getDriverIdByUserIdAndTenantId(user_id, tenant_id);

    if (!driverId) {
      throw new NotFoundError("Driver profile not found");
    }

    const assignments = await assignmentRepository.getCurrentAssignmentsForDriver(driverId);

    res.json(assignments);
  })
);

// =====================================================
// POST /mobile/callback-trip
// =====================================================

router.post(
  '/callback-trip',
  authenticateJWT,
  requirePermission('callback_trip:create'),
  rateLimiter(100),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user_id = req.user!.id;
    const tenant_id = req.user!.tenant_id;

    const parsedData = callbackTripSchema.parse(req.body);

    const driverId = await assignmentRepository.getDriverIdByUserIdAndTenantId(user_id, tenant_id);

    if (!driverId) {
      throw new NotFoundError("Driver profile not found");
    }

    const onCallPeriod = await onCallPeriodRepository.getOnCallPeriodById(parsedData.on_call_period_id, tenant_id);

    if (!onCallPeriod) {
      throw new NotFoundError("On-call period not found");
    }

    const callbackTripId = await callbackTripRepository.createCallbackTrip({
      ...parsedData,
      driver_id: driverId,
      tenant_id: tenant_id,
    });

    res.status(201).json({ id: callbackTripId });
  })
);

// =====================================================
// POST /mobile/reimbursement-request
// =====================================================

router.post(
  '/reimbursement-request',
  authenticateJWT,
  requirePermission('reimbursement_request:create'),
  rateLimiter(100),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user_id = req.user!.id;
    const tenant_id = req.user!.tenant_id;

    const parsedData = reimbursementRequestSchema.parse(req.body);

    const callbackTrip = await callbackTripRepository.getCallbackTripById(parsedData.callback_trip_id, tenant_id);

    if (!callbackTrip) {
      throw new NotFoundError("Callback trip not found");
    }

    const reimbursementRequestId = await reimbursementRequestRepository.createReimbursementRequest({
      ...parsedData,
      user_id: user_id,
      tenant_id: tenant_id,
    });

    res.status(201).json({ id: reimbursementRequestId });
  })
);

// =====================================================
// GET /mobile/callback-trips
// =====================================================

router.get(
  '/callback-trips',
  authenticateJWT,
  requirePermission('callback_trip:view:own'),
  rateLimiter(100),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user_id = req.user!.id;
    const tenant_id = req.user!.tenant_id;

    const driverId = await assignmentRepository.getDriverIdByUserIdAndTenantId(user_id, tenant_id);

    if (!driverId) {
      throw new NotFoundError("Driver profile not found");
    }

    const callbackTrips = await callbackTripRepository.getCallbackTripsByDriverId(driverId, tenant_id);

    res.json(callbackTrips);
  })
);

export default router;