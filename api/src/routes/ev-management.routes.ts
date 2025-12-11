Here's the complete refactored version of the `ev-management.routes.ts` file, replacing all `pool.query` or `db.query` calls with repository methods:


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

import express, { Request, Response } from 'express'
import { z } from 'zod'
import { authenticateJWT } from '../middleware/auth'
import { requirePermission } from '../middleware/permissions'
import { getErrorMessage } from '../utils/error-handler'
import { csrfProtection } from '../middleware/csrf'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import logger from '../config/logger'

// Import repositories
import { ChargingStationRepository } from '../repositories/charging-station.repository'
import { ChargingSessionRepository } from '../repositories/charging-session.repository'
import { VehicleRepository } from '../repositories/vehicle.repository'
import { DriverRepository } from '../repositories/driver.repository'

// Import services
import OCPPService from '../services/ocpp.service'
import EVChargingService from '../services/ev-charging.service'

const router = express.Router()

// Initialize repositories
const chargingStationRepository = new ChargingStationRepository()
const chargingSessionRepository = new ChargingSessionRepository()
const vehicleRepository = new VehicleRepository()
const driverRepository = new DriverRepository()

// Initialize services
const ocppService = new OCPPService(chargingStationRepository, chargingSessionRepository)
const evChargingService = new EVChargingService(chargingStationRepository, chargingSessionRepository, vehicleRepository, driverRepository, ocppService)

// Validation schemas
const reservationSchema = z.object({
  stationId: z.number(),
  connectorId: z.number().optional(),
  vehicleId: z.number(),
  driverId: z.number(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
})

const smartChargingSchema = z.object({
  vehicleId: z.number(),
  targetSoC: z.number().min(20).max(100),
  completionTime: z.string().datetime(),
  preferOffPeak: z.boolean().optional(),
  preferRenewable: z.boolean().optional(),
  maxChargeRate: z.number().optional(),
})

const remoteStartSchema = z.object({
  stationId: z.string(),
  connectorId: z.number(),
  vehicleId: z.number(),
  driverId: z.number().optional(),
  idTag: z.string(),
})

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
router.get(
  '/chargers',
  authenticateJWT,
  requirePermission('charging_station:view:fleet'),
  asyncHandler(async (req: Request, res: Response) => {
    const latitude = req.query.latitude ? parseFloat(req.query.latitude as string) : undefined
    const longitude = req.query.longitude ? parseFloat(req.query.longitude as string) : undefined
    const radius = req.query.radius ? parseFloat(req.query.radius as string) : undefined

    const stations = await evChargingService.getAvailableStations(latitude, longitude, radius)
    res.json(stations)
  })
)

/**
 * @openapi
 * /api/ev/chargers/{stationId}:
 *   get:
 *     summary: Get details of a specific charging station
 *     tags: [EV Management]
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Details of the charging station
 *       404:
 *         description: Charging station not found
 */
router.get(
  '/chargers/:stationId',
  authenticateJWT,
  requirePermission('charging_station:view:fleet'),
  asyncHandler(async (req: Request, res: Response) => {
    const stationId = req.params.stationId
    const station = await chargingStationRepository.getStationById(stationId)
    if (!station) {
      throw new NotFoundError('Charging station not found')
    }
    res.json(station)
  })
)

/**
 * @openapi
 * /api/ev/chargers/{stationId}/status:
 *   get:
 *     summary: Get the current status of a charging station
 *     tags: [EV Management]
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Current status of the charging station
 *       404:
 *         description: Charging station not found
 */
router.get(
  '/chargers/:stationId/status',
  authenticateJWT,
  requirePermission('charging_station:view:fleet'),
  asyncHandler(async (req: Request, res: Response) => {
    const stationId = req.params.stationId
    const status = await ocppService.getStationStatus(stationId)
    if (!status) {
      throw new NotFoundError('Charging station not found')
    }
    res.json(status)
  })
)

/**
 * @openapi
 * /api/ev/reservations:
 *   post:
 *     summary: Create a new charging reservation
 *     tags: [EV Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Reservation'
 *     responses:
 *       201:
 *         description: Reservation created successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  '/reservations',
  authenticateJWT,
  requirePermission('reservation:create'),
  csrfProtection,
  asyncHandler(async (req: Request, res: Response) => {
    const parsedData = reservationSchema.safeParse(req.body)
    if (!parsedData.success) {
      throw new ValidationError('Invalid reservation data', parsedData.error)
    }

    const reservation = await evChargingService.createReservation(parsedData.data)
    res.status(201).json(reservation)
  })
)

/**
 * @openapi
 * /api/ev/smart-charging:
 *   post:
 *     summary: Create a smart charging schedule
 *     tags: [EV Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SmartChargingRequest'
 *     responses:
 *       201:
 *         description: Smart charging schedule created successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  '/smart-charging',
  authenticateJWT,
  requirePermission('smart_charging:create'),
  csrfProtection,
  asyncHandler(async (req: Request, res: Response) => {
    const parsedData = smartChargingSchema.safeParse(req.body)
    if (!parsedData.success) {
      throw new ValidationError('Invalid smart charging data', parsedData.error)
    }

    const schedule = await evChargingService.createSmartChargingSchedule(parsedData.data)
    res.status(201).json(schedule)
  })
)

/**
 * @openapi
 * /api/ev/remote-start:
 *   post:
 *     summary: Initiate a remote charging session
 *     tags: [EV Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RemoteStartRequest'
 *     responses:
 *       200:
 *         description: Remote start initiated successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  '/remote-start',
  authenticateJWT,
  requirePermission('remote_start:execute'),
  csrfProtection,
  asyncHandler(async (req: Request, res: Response) => {
    const parsedData = remoteStartSchema.safeParse(req.body)
    if (!parsedData.success) {
      throw new ValidationError('Invalid remote start data', parsedData.error)
    }

    const result = await ocppService.remoteStart(parsedData.data)
    res.json(result)
  })
)

/**
 * @openapi
 * /api/ev/carbon-footprint:
 *   get:
 *     summary: Get carbon footprint data for the fleet
 *     tags: [EV Management]
 *     responses:
 *       200:
 *         description: Carbon footprint data for the fleet
 */
router.get(
  '/carbon-footprint',
  authenticateJWT,
  requirePermission('carbon_footprint:view'),
  asyncHandler(async (req: Request, res: Response) => {
    const carbonFootprint = await evChargingService.getFleetCarbonFootprint()
    res.json(carbonFootprint)
  })
)

/**
 * @openapi
 * /api/ev/esg-report:
 *   get:
 *     summary: Generate an ESG report for the EV fleet
 *     tags: [EV Management]
 *     responses:
 *       200:
 *         description: ESG report for the EV fleet
 */
router.get(
  '/esg-report',
  authenticateJWT,
  requirePermission('esg_report:view'),
  asyncHandler(async (req: Request, res: Response) => {
    const esgReport = await evChargingService.generateESGReport()
    res.json(esgReport)
  })
)

/**
 * @openapi
 * /api/ev/battery-health/{vehicleId}:
 *   get:
 *     summary: Get battery health data for a specific vehicle
 *     tags: [EV Management]
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Battery health data for the vehicle
 *       404:
 *         description: Vehicle not found
 */
router.get(
  '/battery-health/:vehicleId',
  authenticateJWT,
  requirePermission('battery_health:view'),
  asyncHandler(async (req: Request, res: Response) => {
    const vehicleId = parseInt(req.params.vehicleId)
    const batteryHealth = await vehicleRepository.getBatteryHealth(vehicleId)
    if (!batteryHealth) {
      throw new NotFoundError('Vehicle not found')
    }
    res.json(batteryHealth)
  })
)

export default router


In this refactored version, we've made the following changes:

1. Imported repository classes for ChargingStation, ChargingSession, Vehicle, and Driver.
2. Initialized instances of these repositories.
3. Updated the service initializations to use these repository instances.
4. Replaced all direct database queries with calls to repository methods.

The main changes in the route handlers are:

- In the `/chargers` GET route, we now call `evChargingService.getAvailableStations()` instead of querying the database directly.
- In the `/chargers/:stationId` GET route, we use `chargingStationRepository.getStationById()` to fetch the station details.
- In the `/chargers/:stationId/status` GET route, we call `ocppService.getStationStatus()` which internally uses the repository.
- The `/reservations` POST route now uses `evChargingService.createReservation()`.
- The `/smart-charging` POST route calls `evChargingService.createSmartChargingSchedule()`.
- The `/remote-start` POST route uses `ocppService.remoteStart()`.
- The `/carbon-footprint` GET route calls `evChargingService.getFleetCarbonFootprint()`.
- The `/esg-report` GET route uses `evChargingService.generateESGReport()`.
- The `/battery-health/:vehicleId` GET route now calls `vehicleRepository.getBatteryHealth()`.

These changes ensure that all database operations are encapsulated within the repository classes, improving the separation of concerns and making the code more maintainable and testable.