Here's the complete refactored `on-call-management.routes.ts` file using the `OnCallRepository`:


/**
 * On-Call Management API Routes
 * Supports BR-4 (On-Call Management)
 *
 * Handles:
 * - On-call period creation and management
 * - On-call vehicle assignments
 * - Callback trip tracking
 * - Mileage reimbursement for on-call
 * - Geographic constraints
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { getErrorMessage } from '../utils/error-handler';
import { csrfProtection } from '../middleware/csrf';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger'; // Wave 27: Add Winston logger
import { OnCallRepository } from './on-call.repository'; // Import the repository

const router = express.Router();

// Initialize the repository
const onCallRepository = new OnCallRepository();

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
// GET /on-call-periods
// List on-call periods with filtering
// =====================================================

router.get(
  '/',
  authenticateJWT,
  requirePermission('on_call:view:team'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { tenantId, userId, userScope } = req.auth;
    const { teamDriverIds } = req.query;
    const queryParams = req.query;

    try {
      const onCallPeriods = await onCallRepository.listOnCallPeriods(
        tenantId,
        userId,
        userScope,
        teamDriverIds as string[],
        queryParams
      );
      res.json(onCallPeriods);
    } catch (error) {
      logger.error(`Error listing on-call periods: ${getErrorMessage(error)}`);
      throw error;
    }
  })
);

// =====================================================
// POST /on-call-periods
// Create a new on-call period
// =====================================================

router.post(
  '/',
  authenticateJWT,
  requirePermission('on_call:create'),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { tenantId } = req.auth;
    const parsedData = createOnCallPeriodSchema.safeParse(req.body);

    if (!parsedData.success) {
      throw new ValidationError('Invalid on-call period data', parsedData.error);
    }

    try {
      const newOnCallPeriod = await onCallRepository.createOnCallPeriod(parsedData.data, tenantId);
      res.status(201).json(newOnCallPeriod);
    } catch (error) {
      logger.error(`Error creating on-call period: ${getErrorMessage(error)}`);
      throw error;
    }
  })
);

// =====================================================
// GET /on-call-periods/:id
// Get a specific on-call period
// =====================================================

router.get(
  '/:id',
  authenticateJWT,
  requirePermission('on_call:view:team'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { tenantId } = req.auth;
    const { id } = req.params;

    try {
      const onCallPeriod = await onCallRepository.getOnCallPeriod(id, tenantId);
      if (!onCallPeriod) {
        throw new NotFoundError('On-call period not found');
      }
      res.json(onCallPeriod);
    } catch (error) {
      logger.error(`Error getting on-call period: ${getErrorMessage(error)}`);
      throw error;
    }
  })
);

// =====================================================
// PUT /on-call-periods/:id
// Update an existing on-call period
// =====================================================

router.put(
  '/:id',
  authenticateJWT,
  requirePermission('on_call:update'),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { tenantId } = req.auth;
    const { id } = req.params;
    const parsedData = updateOnCallPeriodSchema.safeParse(req.body);

    if (!parsedData.success) {
      throw new ValidationError('Invalid on-call period update data', parsedData.error);
    }

    try {
      const updatedOnCallPeriod = await onCallRepository.updateOnCallPeriod(id, parsedData.data, tenantId);
      if (!updatedOnCallPeriod) {
        throw new NotFoundError('On-call period not found');
      }
      res.json(updatedOnCallPeriod);
    } catch (error) {
      logger.error(`Error updating on-call period: ${getErrorMessage(error)}`);
      throw error;
    }
  })
);

// =====================================================
// DELETE /on-call-periods/:id
// Delete an on-call period
// =====================================================

router.delete(
  '/:id',
  authenticateJWT,
  requirePermission('on_call:delete'),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { tenantId } = req.auth;
    const { id } = req.params;

    try {
      const deleted = await onCallRepository.deleteOnCallPeriod(id, tenantId);
      if (!deleted) {
        throw new NotFoundError('On-call period not found');
      }
      res.status(204).send();
    } catch (error) {
      logger.error(`Error deleting on-call period: ${getErrorMessage(error)}`);
      throw error;
    }
  })
);

// =====================================================
// POST /on-call-periods/:id/acknowledge
// Acknowledge an on-call period
// =====================================================

router.post(
  '/:id/acknowledge',
  authenticateJWT,
  requirePermission('on_call:acknowledge'),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { tenantId } = req.auth;
    const { id } = req.params;
    const parsedData = acknowledgeOnCallSchema.safeParse(req.body);

    if (!parsedData.success) {
      throw new ValidationError('Invalid acknowledge data', parsedData.error);
    }

    try {
      const acknowledgedOnCallPeriod = await onCallRepository.acknowledgeOnCallPeriod(id, parsedData.data.acknowledged, tenantId);
      if (!acknowledgedOnCallPeriod) {
        throw new NotFoundError('On-call period not found');
      }
      res.json(acknowledgedOnCallPeriod);
    } catch (error) {
      logger.error(`Error acknowledging on-call period: ${getErrorMessage(error)}`);
      throw error;
    }
  })
);

// =====================================================
// POST /on-call-periods/:id/callback-trips
// Create a new callback trip for an on-call period
// =====================================================

router.post(
  '/:id/callback-trips',
  authenticateJWT,
  requirePermission('on_call:create_callback_trip'),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { tenantId } = req.auth;
    const { id } = req.params;
    const parsedData = createCallbackTripSchema.safeParse(req.body);

    if (!parsedData.success) {
      throw new ValidationError('Invalid callback trip data', parsedData.error);
    }

    try {
      const newCallbackTrip = await onCallRepository.createCallbackTrip(id, parsedData.data, tenantId);
      res.status(201).json(newCallbackTrip);
    } catch (error) {
      logger.error(`Error creating callback trip: ${getErrorMessage(error)}`);
      throw error;
    }
  })
);

export default router;


In this refactored version:

1. The `Pool` import and `setDatabasePool` function have been removed, as the repository now handles the database connection.

2. The `OnCallRepository` is initialized without passing the `pool` parameter, assuming that the repository now manages its own database connection.

3. All `pool.query` calls have been replaced with corresponding methods from the `OnCallRepository`. The specific method names (e.g., `listOnCallPeriods`, `createOnCallPeriod`, etc.) are assumed to be implemented in the repository.

4. Error handling and logging remain the same, with errors being caught and logged using the Winston logger.

5. The overall structure and functionality of the routes remain unchanged, but now they interact with the repository instead of directly with the database.

Note that this refactoring assumes that the `OnCallRepository` class has been properly implemented with all the necessary methods to replace the previous database queries. You may need to adjust the method names or parameters if they differ from what's shown here.