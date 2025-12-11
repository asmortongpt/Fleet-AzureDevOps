Here's the complete refactored version of the `on-call-management.routes.enhanced.ts` file, replacing all `pool.query` and `db.query` with repository methods. I've assumed the existence of an `OnCallPeriodRepository` and a `CallbackTripRepository` to handle the database operations.


import express, { Request, Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { getErrorMessage } from '../utils/error-handler';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import { check, validationResult } from 'express-validator';
import { csrfProtection } from '../middleware/csrf';

const router = express.Router();
router.use(helmet());
router.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(apiLimiter);

// =====================================================
// Validation Schemas
// =====================================================

const createOnCallPeriodSchema = z.object({
  driver_id: z.string().uuid(),
  department_id: z.string().uuid().optional(),
  start_datetime: z.string().datetime(),
  end_datetime: z.string().datetime(),
  schedule_type: z.string().optional(),
  schedule_notes: z.string().optional(),
  on_call_vehicle_assignment_id: z.string().uuid().optional(),
  geographic_region: z.string().optional(),
  commuting_constraints: z.record(z.any()).optional(),
});

const updateOnCallPeriodSchema = createOnCallPeriodSchema.partial();

const acknowledgeOnCallSchema = z.object({
  acknowledged: z.boolean(),
});

const createCallbackTripSchema = z.object({
  on_call_period_id: z.string().uuid(),
  driver_id: z.string().uuid(),
  trip_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  trip_start_time: z.string().datetime().optional(),
  trip_end_time: z.string().datetime().optional(),
  miles_driven: z.number().positive(),
  includes_commute_trip: z.boolean().default(false),
  commute_miles: z.number().nonnegative().optional(),
  used_assigned_vehicle: z.boolean().default(false),
  used_private_vehicle: z.boolean().default(false),
  vehicle_id: z.string().uuid().optional(),
  purpose: z.string().optional(),
  notes: z.string().optional(),
  reimbursement_requested: z.boolean().default(false),
  reimbursement_amount: z.number().nonnegative().optional(),
});

// =====================================================
// Route Handlers
// =====================================================

// Example: GET /on-call-periods
router.get(
  '/',
  authenticateJWT,
  requirePermission('on_call:view:team'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      page = '1',
      limit = '50',
      driver_id,
      department_id,
      is_active,
      start_date,
      end_date,
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const tenant_id = req.user!.tenant_id;

    const onCallPeriodRepository = container.resolve('OnCallPeriodRepository');
    const onCallPeriods = await onCallPeriodRepository.findAll({
      tenant_id,
      driver_id,
      department_id,
      is_active,
      start_date,
      end_date,
      offset,
      limit,
    });

    res.json(onCallPeriods);
  })
);

// Example: GET /on-call-periods/:id
router.get(
  '/:id',
  authenticateJWT,
  requirePermission('on_call:view:team'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenant_id = req.user!.tenant_id;

    const onCallPeriodRepository = container.resolve('OnCallPeriodRepository');
    const onCallPeriod = await onCallPeriodRepository.findById(id, tenant_id);

    if (!onCallPeriod) {
      throw new NotFoundError('On-call period not found');
    }

    res.json(onCallPeriod);
  })
);

// Example: POST /on-call-periods
router.post(
  '/',
  authenticateJWT,
  requirePermission('on_call:create'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsedData = createOnCallPeriodSchema.safeParse(req.body);
    if (!parsedData.success) {
      throw new ValidationError('Invalid input', parsedData.error);
    }

    const onCallPeriodData = {
      ...parsedData.data,
      tenant_id: req.user!.tenant_id,
    };

    const onCallPeriodRepository = container.resolve('OnCallPeriodRepository');
    const newOnCallPeriod = await onCallPeriodRepository.create(onCallPeriodData);

    res.status(201).json(newOnCallPeriod);
  })
);

// Example: PUT /on-call-periods/:id
router.put(
  '/:id',
  authenticateJWT,
  requirePermission('on_call:update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const parsedData = updateOnCallPeriodSchema.safeParse(req.body);
    if (!parsedData.success) {
      throw new ValidationError('Invalid input', parsedData.error);
    }

    const onCallPeriodData = {
      ...parsedData.data,
      id,
      tenant_id: req.user!.tenant_id,
    };

    const onCallPeriodRepository = container.resolve('OnCallPeriodRepository');
    const updatedOnCallPeriod = await onCallPeriodRepository.update(onCallPeriodData);

    if (!updatedOnCallPeriod) {
      throw new NotFoundError('On-call period not found');
    }

    res.json(updatedOnCallPeriod);
  })
);

// Example: DELETE /on-call-periods/:id
router.delete(
  '/:id',
  authenticateJWT,
  requirePermission('on_call:delete'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenant_id = req.user!.tenant_id;

    const onCallPeriodRepository = container.resolve('OnCallPeriodRepository');
    const deleted = await onCallPeriodRepository.delete(id, tenant_id);

    if (!deleted) {
      throw new NotFoundError('On-call period not found');
    }

    res.status(204).send();
  })
);

// Example: PATCH /on-call-periods/:id/acknowledge
router.patch(
  '/:id/acknowledge',
  authenticateJWT,
  requirePermission('on_call:acknowledge'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const parsedData = acknowledgeOnCallSchema.safeParse(req.body);
    if (!parsedData.success) {
      throw new ValidationError('Invalid input', parsedData.error);
    }

    const { acknowledged } = parsedData.data;
    const tenant_id = req.user!.tenant_id;

    const onCallPeriodRepository = container.resolve('OnCallPeriodRepository');
    const updatedOnCallPeriod = await onCallPeriodRepository.acknowledge(id, acknowledged, tenant_id);

    if (!updatedOnCallPeriod) {
      throw new NotFoundError('On-call period not found');
    }

    res.json(updatedOnCallPeriod);
  })
);

// Example: GET /callback-trips
router.get(
  '/callback-trips',
  authenticateJWT,
  requirePermission('callback_trip:view:team'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      page = '1',
      limit = '50',
      driver_id,
      on_call_period_id,
      trip_date,
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const tenant_id = req.user!.tenant_id;

    const callbackTripRepository = container.resolve('CallbackTripRepository');
    const callbackTrips = await callbackTripRepository.findAll({
      tenant_id,
      driver_id,
      on_call_period_id,
      trip_date,
      offset,
      limit,
    });

    res.json(callbackTrips);
  })
);

// Example: GET /callback-trips/:id
router.get(
  '/callback-trips/:id',
  authenticateJWT,
  requirePermission('callback_trip:view:team'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenant_id = req.user!.tenant_id;

    const callbackTripRepository = container.resolve('CallbackTripRepository');
    const callbackTrip = await callbackTripRepository.findById(id, tenant_id);

    if (!callbackTrip) {
      throw new NotFoundError('Callback trip not found');
    }

    res.json(callbackTrip);
  })
);

// Example: POST /callback-trips
router.post(
  '/callback-trips',
  authenticateJWT,
  requirePermission('callback_trip:create'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const parsedData = createCallbackTripSchema.safeParse(req.body);
    if (!parsedData.success) {
      throw new ValidationError('Invalid input', parsedData.error);
    }

    const callbackTripData = {
      ...parsedData.data,
      tenant_id: req.user!.tenant_id,
    };

    const callbackTripRepository = container.resolve('CallbackTripRepository');
    const newCallbackTrip = await callbackTripRepository.create(callbackTripData);

    res.status(201).json(newCallbackTrip);
  })
);

// Example: PUT /callback-trips/:id
router.put(
  '/callback-trips/:id',
  authenticateJWT,
  requirePermission('callback_trip:update'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const parsedData = createCallbackTripSchema.safeParse(req.body);
    if (!parsedData.success) {
      throw new ValidationError('Invalid input', parsedData.error);
    }

    const callbackTripData = {
      ...parsedData.data,
      id,
      tenant_id: req.user!.tenant_id,
    };

    const callbackTripRepository = container.resolve('CallbackTripRepository');
    const updatedCallbackTrip = await callbackTripRepository.update(callbackTripData);

    if (!updatedCallbackTrip) {
      throw new NotFoundError('Callback trip not found');
    }

    res.json(updatedCallbackTrip);
  })
);

// Example: DELETE /callback-trips/:id
router.delete(
  '/callback-trips/:id',
  authenticateJWT,
  requirePermission('callback_trip:delete'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const tenant_id = req.user!.tenant_id;

    const callbackTripRepository = container.resolve('CallbackTripRepository');
    const deleted = await callbackTripRepository.delete(id, tenant_id);

    if (!deleted) {
      throw new NotFoundError('Callback trip not found');
    }

    res.status(204).send();
  })
);

export default router;


This refactored version replaces all database query operations with repository methods. Here are the key changes:

1. We've introduced `OnCallPeriodRepository` and `CallbackTripRepository` to handle database operations for on-call periods and callback trips, respectively.

2. All `pool.query` and `db.query` calls have been replaced with corresponding repository methods:
   - `findAll` for retrieving lists of items
   - `findById` for retrieving a single item by ID
   - `create` for inserting new items
   - `update` for updating existing items
   - `delete` for removing items
   - `acknowledge` for the specific acknowledge operation on on-call periods

3. The repository instances are resolved from the dependency injection container using `container.resolve()`.

4. The method signatures for the repository calls have been adjusted to match the expected parameters, including the `tenant_id` which is now passed explicitly.

5. Error handling remains the same, throwing `NotFoundError` when an item is not found.

This refactoring improves the separation of concerns by moving database operations into dedicated repository classes, making the code more maintainable and easier to test. The route handlers now focus solely on business logic and request/response handling.