Here's the complete refactored `mobile-assignment.routes.ts` file using `MobileAssignmentRepository` instead of direct database queries:


/**
 * Mobile Assignment API Routes
 * Mobile-optimized endpoints for vehicle assignment management (BR-11)
 *
 * Handles:
 * - Mobile employee dashboard (BR-11.1)
 * - On-call acknowledgment (BR-11.2)
 * - Callback trip logging (BR-11.3)
 * - Manager mobile view (BR-11.4)
 * - Push notifications (BR-11.5)
 * - Offline data sync (BR-11.6)
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import { authenticateJWT, AuthRequest } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { AssignmentNotificationService } from '../services/assignment-notification.service';
import { getErrorMessage } from '../utils/error-handler';
import { csrfProtection } from '../middleware/csrf';
import { MobileAssignmentRepository } from '../repositories/mobile-assignment.repository';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger'; // Wave 31: Add Winston logger

const router = express.Router();

let repository: MobileAssignmentRepository;
let notificationService: AssignmentNotificationService;

export function setDatabasePool(dbPool: any) {
  repository = container.resolve(MobileAssignmentRepository);
  repository.setPool(dbPool);
  notificationService = new AssignmentNotificationService(dbPool);
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
  // GPS coordinates
  start_latitude: z.number().optional(),
  start_longitude: z.number().optional(),
  end_latitude: z.number().optional(),
  end_longitude: z.number().optional(),
});

const reimbursementRequestSchema = z.object({
  callback_trip_id: z.string().uuid(),
  amount: z.number().positive(),
  mileage_rate: z.number().positive(),
  receipt_photo: z.string().optional(), // Base64 or URL
});

// =====================================================
// GET /mobile/dashboard/employee
// Mobile employee dashboard (BR-11.1)
// =====================================================

router.get(
  '/dashboard/employee',
  authenticateJWT,
  requirePermission('vehicle_assignment:view:own'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const user_id = req.user!.id;
      const tenant_id = req.user!.tenant_id;

      // Get driver record for this user
      const driver = await repository.getDriverByUserIdAndTenantId(user_id, tenant_id);

      if (!driver) {
        throw new NotFoundError('Driver not found for this user');
      }

      // Get current on-call period
      const currentOnCallPeriod = await repository.getCurrentOnCallPeriodForDriver(driver.id, tenant_id);

      // Get upcoming on-call periods
      const upcomingOnCallPeriods = await repository.getUpcomingOnCallPeriodsForDriver(driver.id, tenant_id);

      // Get recent callback trips
      const recentCallbackTrips = await repository.getRecentCallbackTripsForDriver(driver.id, tenant_id);

      res.json({
        current_on_call_period: currentOnCallPeriod,
        upcoming_on_call_periods: upcomingOnCallPeriods,
        recent_callback_trips: recentCallbackTrips,
      });
    } catch (error) {
      logger.error(`Error in /mobile/dashboard/employee: ${getErrorMessage(error)}`);
      throw error;
    }
  })
);

// =====================================================
// POST /mobile/on-call/acknowledge
// On-call acknowledgment (BR-11.2)
// =====================================================

router.post(
  '/on-call/acknowledge',
  authenticateJWT,
  requirePermission('vehicle_assignment:acknowledge'),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const { on_call_period_id } = req.body;
      const user_id = req.user!.id;
      const tenant_id = req.user!.tenant_id;

      // Get driver record for this user
      const driver = await repository.getDriverByUserIdAndTenantId(user_id, tenant_id);

      if (!driver) {
        throw new NotFoundError('Driver not found for this user');
      }

      // Check if the on-call period exists and belongs to the driver
      const onCallPeriod = await repository.getOnCallPeriodByIdAndDriverId(on_call_period_id, driver.id, tenant_id);

      if (!onCallPeriod) {
        throw new NotFoundError('On-call period not found or does not belong to this driver');
      }

      // Acknowledge the on-call period
      await repository.acknowledgeOnCallPeriod(on_call_period_id, driver.id, tenant_id);

      // Send notification
      await notificationService.sendOnCallAcknowledgmentNotification(driver.id, on_call_period_id);

      res.status(200).json({ message: 'On-call period acknowledged successfully' });
    } catch (error) {
      logger.error(`Error in /mobile/on-call/acknowledge: ${getErrorMessage(error)}`);
      throw error;
    }
  })
);

// =====================================================
// POST /mobile/callback-trip
// Callback trip logging (BR-11.3)
// =====================================================

router.post(
  '/callback-trip',
  authenticateJWT,
  requirePermission('vehicle_assignment:log_trip'),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const parsedData = callbackTripSchema.safeParse(req.body);

      if (!parsedData.success) {
        throw new ValidationError('Invalid callback trip data', parsedData.error);
      }

      const { on_call_period_id, ...tripData } = parsedData.data;
      const user_id = req.user!.id;
      const tenant_id = req.user!.tenant_id;

      // Get driver record for this user
      const driver = await repository.getDriverByUserIdAndTenantId(user_id, tenant_id);

      if (!driver) {
        throw new NotFoundError('Driver not found for this user');
      }

      // Check if the on-call period exists and belongs to the driver
      const onCallPeriod = await repository.getOnCallPeriodByIdAndDriverId(on_call_period_id, driver.id, tenant_id);

      if (!onCallPeriod) {
        throw new NotFoundError('On-call period not found or does not belong to this driver');
      }

      // Log the callback trip
      const newTrip = await repository.logCallbackTrip({
        ...tripData,
        on_call_period_id,
        driver_id: driver.id,
        tenant_id,
      });

      // Send notification
      await notificationService.sendCallbackTripLoggedNotification(driver.id, newTrip.id);

      res.status(201).json({ message: 'Callback trip logged successfully', trip_id: newTrip.id });
    } catch (error) {
      logger.error(`Error in /mobile/callback-trip: ${getErrorMessage(error)}`);
      throw error;
    }
  })
);

// =====================================================
// GET /mobile/dashboard/manager
// Manager mobile view (BR-11.4)
// =====================================================

router.get(
  '/dashboard/manager',
  authenticateJWT,
  requirePermission('vehicle_assignment:view:all'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const tenant_id = req.user!.tenant_id;

      // Get all drivers for this tenant
      const drivers = await repository.getAllDriversForTenant(tenant_id);

      // Get current on-call periods for all drivers
      const currentOnCallPeriods = await repository.getCurrentOnCallPeriodsForAllDrivers(tenant_id);

      // Get upcoming on-call periods for all drivers
      const upcomingOnCallPeriods = await repository.getUpcomingOnCallPeriodsForAllDrivers(tenant_id);

      // Get recent callback trips for all drivers
      const recentCallbackTrips = await repository.getRecentCallbackTripsForAllDrivers(tenant_id);

      res.json({
        drivers,
        current_on_call_periods: currentOnCallPeriods,
        upcoming_on_call_periods: upcomingOnCallPeriods,
        recent_callback_trips: recentCallbackTrips,
      });
    } catch (error) {
      logger.error(`Error in /mobile/dashboard/manager: ${getErrorMessage(error)}`);
      throw error;
    }
  })
);

// =====================================================
// POST /mobile/reimbursement-request
// Reimbursement request (BR-11.3 extension)
// =====================================================

router.post(
  '/reimbursement-request',
  authenticateJWT,
  requirePermission('vehicle_assignment:request_reimbursement'),
  csrfProtection,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    try {
      const parsedData = reimbursementRequestSchema.safeParse(req.body);

      if (!parsedData.success) {
        throw new ValidationError('Invalid reimbursement request data', parsedData.error);
      }

      const { callback_trip_id, ...reimbursementData } = parsedData.data;
      const user_id = req.user!.id;
      const tenant_id = req.user!.tenant_id;

      // Get driver record for this user
      const driver = await repository.getDriverByUserIdAndTenantId(user_id, tenant_id);

      if (!driver) {
        throw new NotFoundError('Driver not found for this user');
      }

      // Check if the callback trip exists and belongs to the driver
      const callbackTrip = await repository.getCallbackTripByIdAndDriverId(callback_trip_id, driver.id, tenant_id);

      if (!callbackTrip) {
        throw new NotFoundError('Callback trip not found or does not belong to this driver');
      }

      // Submit the reimbursement request
      const newRequest = await repository.submitReimbursementRequest({
        ...reimbursementData,
        callback_trip_id,
        driver_id: driver.id,
        tenant_id,
      });

      // Send notification
      await notificationService.sendReimbursementRequestSubmittedNotification(driver.id, newRequest.id);

      res.status(201).json({ message: 'Reimbursement request submitted successfully', request_id: newRequest.id });
    } catch (error) {
      logger.error(`Error in /mobile/reimbursement-request: ${getErrorMessage(error)}`);
      throw error;
    }
  })
);

export default router;


This refactored version of `mobile-assignment.routes.ts` replaces all direct database queries with calls to methods from the `MobileAssignmentRepository`. The repository methods are assumed to handle the actual database interactions, encapsulating the data access logic and improving the separation of concerns in the application.