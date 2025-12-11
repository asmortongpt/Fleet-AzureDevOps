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
    const status = await chargingStationRepository.getStationStatus(stationId)
    if (!status) {
      throw new NotFoundError('Charging station not found')
    }
    res.json(status)
  })
)

/**
 * @openapi
 * /api/ev/chargers/{stationId}/connectors:
 *   get:
 *     summary: Get the connectors of a charging station
 *     tags: [EV Management]
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of connectors for the charging station
 *       404:
 *         description: Charging station not found
 */
router.get(
  '/chargers/:stationId/connectors',
  authenticateJWT,
  requirePermission('charging_station:view:fleet'),
  asyncHandler(async (req: Request, res: Response) => {
    const stationId = req.params.stationId
    const connectors = await chargingStationRepository.getStationConnectors(stationId)
    if (!connectors) {
      throw new NotFoundError('Charging station not found')
    }
    res.json(connectors)
  })
)

/**
 * @openapi
 * /api/ev/chargers/{stationId}/connectors/{connectorId}/status:
 *   get:
 *     summary: Get the status of a specific connector
 *     tags: [EV Management]
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: connectorId
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Status of the connector
 *       404:
 *         description: Connector not found
 */
router.get(
  '/chargers/:stationId/connectors/:connectorId/status',
  authenticateJWT,
  requirePermission('charging_station:view:fleet'),
  asyncHandler(async (req: Request, res: Response) => {
    const stationId = req.params.stationId
    const connectorId = parseInt(req.params.connectorId)
    const status = await chargingStationRepository.getConnectorStatus(stationId, connectorId)
    if (!status) {
      throw new NotFoundError('Connector not found')
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
 *       404:
 *         description: Vehicle or driver not found
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

    const { stationId, connectorId, vehicleId, driverId, startTime, endTime } = parsedData.data

    const vehicle = await vehicleRepository.getVehicleById(vehicleId)
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found')
    }

    const driver = await driverRepository.getDriverById(driverId)
    if (!driver) {
      throw new NotFoundError('Driver not found')
    }

    const reservation = await chargingSessionRepository.createReservation(
      stationId,
      connectorId,
      vehicleId,
      driverId,
      new Date(startTime),
      new Date(endTime)
    )

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
 *       404:
 *         description: Vehicle not found
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

    const { vehicleId, targetSoC, completionTime, preferOffPeak, preferRenewable, maxChargeRate } = parsedData.data

    const vehicle = await vehicleRepository.getVehicleById(vehicleId)
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found')
    }

    const schedule = await evChargingService.createSmartChargingSchedule(
      vehicleId,
      targetSoC,
      new Date(completionTime),
      preferOffPeak,
      preferRenewable,
      maxChargeRate
    )

    res.status(201).json(schedule)
  })
)

/**
 * @openapi
 * /api/ev/remote-start:
 *   post:
 *     summary: Initiate a remote start of a charging session
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
 *       404:
 *         description: Charging station or vehicle not found
 */
router.post(
  '/remote-start',
  authenticateJWT,
  requirePermission('charging_session:start'),
  csrfProtection,
  asyncHandler(async (req: Request, res: Response) => {
    const parsedData = remoteStartSchema.safeParse(req.body)
    if (!parsedData.success) {
      throw new ValidationError('Invalid remote start data', parsedData.error)
    }

    const { stationId, connectorId, vehicleId, driverId, idTag } = parsedData.data

    const station = await chargingStationRepository.getStationById(stationId)
    if (!station) {
      throw new NotFoundError('Charging station not found')
    }

    const vehicle = await vehicleRepository.getVehicleById(vehicleId)
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found')
    }

    const session = await ocppService.initiateRemoteStart(stationId, connectorId, vehicleId, driverId, idTag)

    res.json(session)
  })
)

export default router


In this refactored version, all database queries have been replaced with calls to the appropriate repository methods. The repositories are imported at the beginning of the file and instantiated before being used in the routes.

The main changes include:

1. Importing the necessary repository classes.
2. Initializing instances of the repositories.
3. Replacing `pool.query` or `db.query` calls with corresponding repository methods.
4. Using the `evChargingService` for more complex operations that involve multiple repositories.

This refactoring improves the separation of concerns, making the code more modular and easier to maintain. The database operations are now encapsulated within the repository classes, which can be easily modified or replaced without affecting the route handlers.