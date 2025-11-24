/**
 * Vehicle Idling Routes
 *
 * REST API endpoints for vehicle idling detection and analytics
 *
 * Features:
 * - Real-time active idling monitoring
 * - Historical idling events
 * - Vehicle and fleet-wide statistics
 * - Driver performance tracking
 * - Alert management
 * - Threshold configuration
 */

import { Router, Request, Response } from 'express';
import { VehicleIdlingService } from '../services/vehicle-idling.service';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { body, param, query } from 'express-validator';

const router = Router();
const idlingService = new VehicleIdlingService();

// ============================================================================
// Active Idling Events
// ============================================================================

/**
 * GET /api/idling/active
 * Get all currently idling vehicles
 *
 * Response: Array of active idling events with real-time duration
 */
router.get(
  '/active',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const activeEvents = await idlingService.getActiveIdlingEvents();

      res.json({
        success: true,
        count: activeEvents.length,
        events: activeEvents
      });
    } catch (error) {
      console.error('Error fetching active idling events:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active idling events'
      });
    }
  }
);

/**
 * GET /api/idling/active/:vehicleId
 * Get active idling event for specific vehicle
 */
router.get(
  '/active/:vehicleId',
  authenticate,
  param('vehicleId').isInt().toInt(),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const event = await idlingService.getActiveIdlingEvent(parseInt(vehicleId));

      if (!event) {
        return res.status(404).json({
          success: false,
          message: 'No active idling event for this vehicle'
        });
      }

      res.json({
        success: true,
        event
      });
    } catch (error) {
      console.error('Error fetching active idling event:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active idling event'
      });
    }
  }
);

// ============================================================================
// Vehicle Idling History & Statistics
// ============================================================================

/**
 * GET /api/idling/vehicle/:vehicleId
 * Get idling history for specific vehicle
 *
 * Query params:
 * - days: Number of days to look back (default 30)
 * - limit: Max events to return (default 100)
 * - offset: Pagination offset (default 0)
 */
router.get(
  '/vehicle/:vehicleId',
  authenticate,
  param('vehicleId').isInt().toInt(),
  query('days').optional().isInt({ min: 1, max: 365 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const days = parseInt(req.query.days as string) || 30;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const events = await idlingService.getVehicleIdlingHistory(
        parseInt(vehicleId),
        days,
        limit,
        offset
      );

      res.json({
        success: true,
        vehicleId: parseInt(vehicleId),
        days,
        count: events.length,
        events
      });
    } catch (error) {
      console.error('Error fetching vehicle idling history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle idling history'
      });
    }
  }
);

/**
 * GET /api/idling/vehicle/:vehicleId/stats
 * Get aggregated idling statistics for specific vehicle
 *
 * Query params:
 * - days: Number of days to look back (default 30)
 */
router.get(
  '/vehicle/:vehicleId/stats',
  authenticate,
  param('vehicleId').isInt().toInt(),
  query('days').optional().isInt({ min: 1, max: 365 }).toInt(),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      const stats = await idlingService.getVehicleIdlingStats(
        parseInt(vehicleId),
        days
      );

      res.json({
        success: true,
        vehicleId: parseInt(vehicleId),
        days,
        stats
      });
    } catch (error) {
      console.error('Error fetching vehicle idling stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle idling statistics'
      });
    }
  }
);

// ============================================================================
// Fleet-Wide Statistics
// ============================================================================

/**
 * GET /api/idling/fleet/stats
 * Get fleet-wide idling statistics
 *
 * Query params:
 * - days: Number of days to look back (default 30)
 */
router.get(
  '/fleet/stats',
  authenticate,
  query('days').optional().isInt({ min: 1, max: 365 }).toInt(),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;

      const stats = await idlingService.getFleetIdlingStats(days);

      res.json({
        success: true,
        days,
        stats
      });
    } catch (error) {
      console.error('Error fetching fleet idling stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fleet idling statistics'
      });
    }
  }
);

/**
 * GET /api/idling/top-offenders
 * Get vehicles with most idling time
 *
 * Query params:
 * - limit: Max vehicles to return (default 10)
 * - days: Number of days to look back (default 30)
 */
router.get(
  '/top-offenders',
  authenticate,
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('days').optional().isInt({ min: 1, max: 365 }).toInt(),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const days = parseInt(req.query.days as string) || 30;

      const vehicles = await idlingService.getTopIdlingVehicles(limit, days);

      res.json({
        success: true,
        limit,
        days,
        count: vehicles.length,
        vehicles
      });
    } catch (error) {
      console.error('Error fetching top idling offenders:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch top idling offenders'
      });
    }
  }
);

// ============================================================================
// Driver Performance
// ============================================================================

/**
 * GET /api/idling/driver/:driverId/performance
 * Get driver idling performance statistics
 *
 * Query params:
 * - days: Number of days to look back (default 30)
 */
router.get(
  '/driver/:driverId/performance',
  authenticate,
  param('driverId').isInt().toInt(),
  query('days').optional().isInt({ min: 1, max: 365 }).toInt(),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { driverId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      const performance = await idlingService.getDriverIdlingPerformance(
        parseInt(driverId),
        days
      );

      res.json({
        success: true,
        driverId: parseInt(driverId),
        days,
        performance
      });
    } catch (error) {
      console.error('Error fetching driver idling performance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch driver idling performance'
      });
    }
  }
);

/**
 * GET /api/idling/driver/:driverId/history
 * Get driver idling event history
 */
router.get(
  '/driver/:driverId/history',
  authenticate,
  param('driverId').isInt().toInt(),
  query('days').optional().isInt({ min: 1, max: 365 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { driverId } = req.params;
      const days = parseInt(req.query.days as string) || 30;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const events = await idlingService.getDriverIdlingHistory(
        parseInt(driverId),
        days,
        limit,
        offset
      );

      res.json({
        success: true,
        driverId: parseInt(driverId),
        days,
        count: events.length,
        events
      });
    } catch (error) {
      console.error('Error fetching driver idling history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch driver idling history'
      });
    }
  }
);

// ============================================================================
// Manual Event Reporting
// ============================================================================

/**
 * POST /api/idling/manual
 * Manually report an idling event (for offline data or corrections)
 *
 * Body:
 * - vehicleId: number (required)
 * - driverId: number (optional)
 * - startTime: ISO timestamp (required)
 * - endTime: ISO timestamp (optional - if ongoing)
 * - latitude: number (optional)
 * - longitude: number (optional)
 * - idleType: string (optional)
 * - driverNotes: string (optional)
 */
router.post(
  '/manual',
  authenticate,
  body('vehicleId').isInt().toInt(),
  body('driverId').optional().isInt().toInt(),
  body('startTime').isISO8601(),
  body('endTime').optional().isISO8601(),
  body('latitude').optional().isFloat({ min: -90, max: 90 }),
  body('longitude').optional().isFloat({ min: -180, max: 180 }),
  body('idleType').optional().isIn([
    'traffic', 'loading_unloading', 'warmup', 'cooldown', 'break', 'unauthorized', 'unknown'
  ]),
  body('driverNotes').optional().isString().trim(),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const {
        vehicleId,
        driverId,
        startTime,
        endTime,
        latitude,
        longitude,
        idleType,
        driverNotes
      } = req.body;

      const eventId = await idlingService.createManualIdlingEvent({
        vehicleId,
        driverId,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : undefined,
        latitude,
        longitude,
        idleType,
        driverNotes
      });

      res.status(201).json({
        success: true,
        message: 'Idling event created successfully',
        eventId
      });
    } catch (error) {
      console.error('Error creating manual idling event:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create manual idling event'
      });
    }
  }
);

// ============================================================================
// Threshold Configuration
// ============================================================================

/**
 * GET /api/idling/thresholds/:vehicleId
 * Get idling thresholds for specific vehicle
 */
router.get(
  '/thresholds/:vehicleId',
  authenticate,
  param('vehicleId').isInt().toInt(),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { vehicleId } = req.params;

      const thresholds = await idlingService.getVehicleThresholds(parseInt(vehicleId));

      res.json({
        success: true,
        vehicleId: parseInt(vehicleId),
        thresholds
      });
    } catch (error) {
      console.error('Error fetching vehicle thresholds:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch vehicle thresholds'
      });
    }
  }
);

/**
 * PUT /api/idling/thresholds/:vehicleId
 * Update idling thresholds for specific vehicle
 *
 * Body:
 * - warningThresholdSeconds: number (optional)
 * - alertThresholdSeconds: number (optional)
 * - criticalThresholdSeconds: number (optional)
 * - fuelConsumptionRateGph: number (optional)
 * - avgFuelPricePerGallon: number (optional)
 * - sendDriverAlert: boolean (optional)
 * - sendManagerAlert: boolean (optional)
 */
router.put(
  '/thresholds/:vehicleId',
  authenticate,
  param('vehicleId').isInt().toInt(),
  body('warningThresholdSeconds').optional().isInt({ min: 60 }),
  body('alertThresholdSeconds').optional().isInt({ min: 60 }),
  body('criticalThresholdSeconds').optional().isInt({ min: 60 }),
  body('fuelConsumptionRateGph').optional().isFloat({ min: 0, max: 2 }),
  body('avgFuelPricePerGallon').optional().isFloat({ min: 0, max: 20 }),
  body('sendDriverAlert').optional().isBoolean(),
  body('sendManagerAlert').optional().isBoolean(),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { vehicleId } = req.params;
      const updates = req.body;

      await idlingService.updateVehicleThresholds(parseInt(vehicleId), updates);

      res.json({
        success: true,
        message: 'Thresholds updated successfully',
        vehicleId: parseInt(vehicleId)
      });
    } catch (error) {
      console.error('Error updating vehicle thresholds:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update vehicle thresholds'
      });
    }
  }
);

// ============================================================================
// Alert Management
// ============================================================================

/**
 * GET /api/idling/alerts
 * Get recent idling alerts
 *
 * Query params:
 * - limit: Max alerts to return (default 50)
 * - unacknowledged: Only unacknowledged alerts (default false)
 */
router.get(
  '/alerts',
  authenticate,
  query('limit').optional().isInt({ min: 1, max: 500 }).toInt(),
  query('unacknowledged').optional().isBoolean(),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const unacknowledged = req.query.unacknowledged === 'true';

      const alerts = await idlingService.getRecentAlerts(limit, unacknowledged);

      res.json({
        success: true,
        count: alerts.length,
        alerts
      });
    } catch (error) {
      console.error('Error fetching idling alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch idling alerts'
      });
    }
  }
);

/**
 * POST /api/idling/alerts/:alertId/acknowledge
 * Acknowledge an idling alert
 */
router.post(
  '/alerts/:alertId/acknowledge',
  authenticate,
  param('alertId').isInt().toInt(),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const { alertId } = req.params;
      const userId = (req as any).user?.id; // From auth middleware

      await idlingService.acknowledgeAlert(parseInt(alertId), userId);

      res.json({
        success: true,
        message: 'Alert acknowledged successfully',
        alertId: parseInt(alertId)
      });
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to acknowledge alert'
      });
    }
  }
);

// ============================================================================
// Monthly Reports
// ============================================================================

/**
 * GET /api/idling/reports/monthly
 * Get monthly idling cost reports
 *
 * Query params:
 * - months: Number of months to include (default 12)
 */
router.get(
  '/reports/monthly',
  authenticate,
  query('months').optional().isInt({ min: 1, max: 24 }).toInt(),
  validateRequest,
  async (req: Request, res: Response) => {
    try {
      const months = parseInt(req.query.months as string) || 12;

      const report = await idlingService.getMonthlyIdlingReport(months);

      res.json({
        success: true,
        months,
        report
      });
    } catch (error) {
      console.error('Error fetching monthly idling report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch monthly idling report'
      });
    }
  }
);

// ============================================================================
// Export Routes
// ============================================================================

export default router;
