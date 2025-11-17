/**
 * EV Management Routes
 *
 * API endpoints for electric vehicle fleet management including:
 * - Charging station management
 * - Charging sessions and reservations
 * - Smart charging schedules
 * - Carbon footprint tracking
 * - ESG reporting
 * - Battery health monitoring
 */

import express, { Request, Response } from 'express';
import { z } from 'zod';
import pool from '../config/database';
import OCPPService from '../services/ocpp.service';
import EVChargingService from '../services/ev-charging.service';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = express.Router();

// Initialize services
const ocppService = new OCPPService(pool);
const evChargingService = new EVChargingService(pool, ocppService);

// Validation schemas
const reservationSchema = z.object({
  stationId: z.number(),
  connectorId: z.number().optional(),
  vehicleId: z.number(),
  driverId: z.number(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime()
});

const smartChargingSchema = z.object({
  vehicleId: z.number(),
  targetSoC: z.number().min(20).max(100),
  completionTime: z.string().datetime(),
  preferOffPeak: z.boolean().optional(),
  preferRenewable: z.boolean().optional(),
  maxChargeRate: z.number().optional()
});

const remoteStartSchema = z.object({
  stationId: z.string(),
  connectorId: z.number(),
  vehicleId: z.number(),
  driverId: z.number().optional(),
  idTag: z.string()
});

/**
 * @openapi
 * /api/ev/chargers:
 *   get:
 *     summary: List all charging stations
 *     tags: [EV Management]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *         description: Search radius in miles
 *     responses:
 *       200:
 *         description: List of charging stations
 */
router.get('/chargers', authenticateJWT, requirePermission('charging_station:view:fleet'), async (req: Request, res: Response) => {
  try {
    const latitude = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined;
    const longitude = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined;
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : undefined;

    const stations = await evChargingService.getAvailableStations(latitude, longitude, radius);

    res.json({
      success: true,
      data: stations,
      count: stations.length
    });
  } catch (error: any) {
    console.error('Error fetching chargers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch charging stations',
      message: error.message
    });
  }
});

/**
 * @openapi
 * /api/ev/chargers/{id}/status:
 *   get:
 *     summary: Get charging station status
 *     tags: [EV Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Charging station status with connectors and active sessions
 */
router.get('/chargers/:id/status', authenticateJWT, requirePermission('charging_station:view:fleet'), async (req: Request, res: Response) => {
  try {
    const stationId = parseInt(req.params.id);
    const status = await evChargingService.getChargerStatus(stationId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Charging station not found'
      });
    }

    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    console.error('Error fetching charger status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch charger status',
      message: error.message
    });
  }
});

/**
 * @openapi
 * /api/ev/chargers/{id}/reserve:
 *   post:
 *     summary: Reserve a charging station
 *     tags: [EV Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicleId
 *               - driverId
 *               - startTime
 *               - endTime
 *             properties:
 *               vehicleId:
 *                 type: integer
 *               driverId:
 *                 type: integer
 *               connectorId:
 *                 type: integer
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Reservation created successfully
 */
router.post('/chargers/:id/reserve', authenticateJWT, requirePermission('charging_station:create:fleet'), async (req: Request, res: Response) => {
  try {
    const stationId = parseInt(req.params.id);
    const data = reservationSchema.parse({ ...req.body, stationId });

    const reservation = await evChargingService.createReservation({
      stationId: data.stationId,
      connectorId: data.connectorId,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime)
    });

    res.status(201).json({
      success: true,
      data: reservation,
      message: 'Charging station reserved successfully'
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Error creating reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create reservation',
      message: error.message
    });
  }
});

/**
 * @openapi
 * /api/ev/reservations/{id}/cancel:
 *   delete:
 *     summary: Cancel a charging reservation
 *     tags: [EV Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reservation cancelled successfully
 */
router.delete('/reservations/:id/cancel', authenticateJWT, requirePermission('charging_station:delete:fleet'), async (req: Request, res: Response) => {
  try {
    const reservationId = parseInt(req.params.id);
    await evChargingService.cancelReservation(reservationId);

    res.json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
  } catch (error: any) {
    console.error('Error cancelling reservation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel reservation',
      message: error.message
    });
  }
});

/**
 * @openapi
 * /api/ev/vehicles/{id}/charge-schedule:
 *   post:
 *     summary: Create smart charging schedule
 *     tags: [EV Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetSoC
 *               - completionTime
 *             properties:
 *               targetSoC:
 *                 type: integer
 *                 minimum: 20
 *                 maximum: 100
 *               completionTime:
 *                 type: string
 *                 format: date-time
 *               preferOffPeak:
 *                 type: boolean
 *               preferRenewable:
 *                 type: boolean
 *               maxChargeRate:
 *                 type: number
 *     responses:
 *       201:
 *         description: Charging schedule created
 */
router.post('/vehicles/:id/charge-schedule', authenticateJWT, requirePermission('charging_station:create:fleet'), async (req: Request, res: Response) => {
  try {
    const vehicleId = parseInt(req.params.id);
    const data = smartChargingSchema.parse({ ...req.body, vehicleId });

    const schedule = await evChargingService.createChargingSchedule({
      vehicleId: data.vehicleId,
      targetSoC: data.targetSoC,
      completionTime: new Date(data.completionTime),
      preferOffPeak: data.preferOffPeak,
      preferRenewable: data.preferRenewable,
      maxChargeRate: data.maxChargeRate
    });

    res.status(201).json({
      success: true,
      data: schedule,
      message: 'Smart charging schedule created'
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Error creating charging schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create charging schedule',
      message: error.message
    });
  }
});

/**
 * @openapi
 * /api/ev/chargers/{id}/remote-start:
 *   post:
 *     summary: Remotely start charging session
 *     tags: [EV Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Remote start command sent
 */
router.post('/chargers/:id/remote-start', authenticateJWT, requirePermission('charging_station:update:fleet'), async (req: Request, res: Response) => {
  try {
    const stationId = req.params.id;
    const data = remoteStartSchema.parse({ ...req.body, stationId });

    const result = await ocppService.remoteStartTransaction({
      stationId: data.stationId,
      connectorId: data.connectorId,
      idTag: data.idTag,
      vehicleId: data.vehicleId,
      driverId: data.driverId
    });

    res.json({
      success: true,
      data: result,
      message: 'Remote start command sent'
    });
  } catch (error: any) {
    console.error('Error remote starting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start charging',
      message: error.message
    });
  }
});

/**
 * @openapi
 * /api/ev/sessions/{transactionId}/stop:
 *   post:
 *     summary: Remotely stop charging session
 *     tags: [EV Management]
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Remote stop command sent
 */
router.post('/sessions/:transactionId/stop', authenticateJWT, requirePermission('charging_station:update:fleet'), async (req: Request, res: Response) => {
  try {
    const transactionId = req.params.transactionId;

    const result = await ocppService.remoteStopTransaction({
      transactionId,
      reason: 'Remote'
    });

    res.json({
      success: true,
      data: result,
      message: 'Remote stop command sent'
    });
  } catch (error: any) {
    console.error('Error remote stopping:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop charging',
      message: error.message
    });
  }
});

/**
 * @openapi
 * /api/ev/sessions/active:
 *   get:
 *     summary: Get all active charging sessions
 *     tags: [EV Management]
 *     responses:
 *       200:
 *         description: List of active charging sessions
 */
router.get('/sessions/active', authenticateJWT, requirePermission('charging_station:view:fleet'), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM active_charging_sessions ORDER BY start_time DESC`
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active sessions',
      message: error.message
    });
  }
});

/**
 * @openapi
 * /api/ev/carbon-footprint:
 *   get:
 *     summary: Get fleet carbon footprint data
 *     tags: [EV Management]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: vehicleId
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Carbon footprint data
 */
router.get('/carbon-footprint', authenticateJWT, requirePermission('report:view:global'), async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const vehicleId = req.query.vehicleId ? parseInt(req.query.vehicleId as string) : null;

    let query = `
      SELECT
        vehicle_id,
        v.name as vehicle_name,
        log_date,
        kwh_consumed,
        miles_driven,
        efficiency_kwh_per_mile,
        carbon_emitted_kg,
        carbon_saved_kg,
        carbon_saved_percent,
        renewable_percent
      FROM carbon_footprint_log cfl
      JOIN vehicles v ON cfl.vehicle_id = v.id
      WHERE log_date BETWEEN $1 AND $2
    `;

    const params: any[] = [startDate, endDate];

    if (vehicleId) {
      query += ` AND vehicle_id = $3`;
      params.push(vehicleId);
    }

    query += ` ORDER BY log_date DESC, vehicle_name`;

    const result = await pool.query(query, params);

    // Get summary
    const summary = await evChargingService.getFleetCarbonSummary(startDate, endDate);

    res.json({
      success: true,
      data: {
        logs: result.rows,
        summary
      }
    });
  } catch (error: any) {
    console.error('Error fetching carbon footprint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch carbon footprint data',
      message: error.message
    });
  }
});

/**
 * @openapi
 * /api/ev/esg-report:
 *   get:
 *     summary: Generate ESG report
 *     tags: [EV Management]
 *     parameters:
 *       - in: query
 *         name: period
 *         required: true
 *         schema:
 *           type: string
 *           enum: [monthly, quarterly, annual]
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: ESG report data
 */
router.get('/esg-report', authenticateJWT, requirePermission('report:view:global'), async (req: Request, res: Response) => {
  try {
    const period = req.query.period as 'monthly' | 'quarterly' | 'annual';
    const year = parseInt(req.query.year as string);
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;

    if (!['monthly', 'quarterly', 'annual'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period. Must be monthly, quarterly, or annual'
      });
    }

    const report = await evChargingService.generateESGReport(period, year, month);

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    console.error('Error generating ESG report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate ESG report',
      message: error.message
    });
  }
});

/**
 * @openapi
 * /api/ev/vehicles/{id}/battery-health:
 *   get:
 *     summary: Get battery health report for vehicle
 *     tags: [EV Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Battery health report
 */
router.get('/vehicles/:id/battery-health', authenticateJWT, requirePermission('vehicle:view:fleet'), async (req: Request, res: Response) => {
  try {
    const vehicleId = parseInt(req.params.id);
    const report = await evChargingService.monitorBatteryHealth(vehicleId);

    res.json({
      success: true,
      data: report
    });
  } catch (error: any) {
    console.error('Error fetching battery health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch battery health',
      message: error.message
    });
  }
});

/**
 * @openapi
 * /api/ev/station-utilization:
 *   get:
 *     summary: Get charging station utilization metrics
 *     tags: [EV Management]
 *     responses:
 *       200:
 *         description: Station utilization data
 */
router.get('/station-utilization', authenticateJWT, requirePermission('charging_station:view:fleet'), async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM station_utilization_today ORDER BY utilization_percent DESC`
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching station utilization:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch station utilization',
      message: error.message
    });
  }
});

/**
 * @openapi
 * /api/ev/vehicles/{id}/charging-history:
 *   get:
 *     summary: Get charging history for a vehicle
 *     tags: [EV Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Charging session history
 */
router.get('/vehicles/:id/charging-history', authenticateJWT, requirePermission('vehicle:view:fleet'), async (req: Request, res: Response) => {
  try {
    const vehicleId = parseInt(req.params.id);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const result = await pool.query(
      `SELECT
         cs.*,
         cst.name as station_name,
         cst.station_id,
         u.first_name || ' ' || u.last_name as driver_name
       FROM charging_sessions cs
       JOIN charging_stations cst ON cs.station_id = cst.id
       LEFT JOIN users u ON cs.driver_id = u.id
       WHERE cs.vehicle_id = $1
       ORDER BY cs.start_time DESC
       LIMIT $2`,
      [vehicleId, limit]
    );

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error: any) {
    console.error('Error fetching charging history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch charging history',
      message: error.message
    });
  }
});

// Initialize OCPP connections on startup
(async () => {
  try {
    const stationsResult = await pool.query(
      'SELECT station_id FROM charging_stations WHERE is_enabled = true AND ws_url IS NOT NULL'
    );

    console.log(`🔌 Connecting to ${stationsResult.rows.length} OCPP charging stations...`);

    for (const row of stationsResult.rows) {
      await ocppService.connectStation(row.station_id);
    }
  } catch (error) {
    console.error('Error initializing OCPP connections:', error);
  }
})();

export default router;
