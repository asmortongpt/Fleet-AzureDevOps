import express, { Request, Response } from 'express'

import { pool } from '../config/database';
import logger from '../config/logger';
import { NotFoundError, ValidationError } from '../errors/app-error'
import { authenticateJWT } from '../middleware/auth'
import { csrfProtection } from '../middleware/csrf'
import { handleCardAction } from '../services/actionable-messages.service'
import {
  createVehicleMaintenanceCard,
  createWorkOrderCard,
  createIncidentCard,
  createApprovalCard,
  createDriverPerformanceCard,
  createFuelReceiptCard,
  createInspectionChecklistCard,
  sendAdaptiveCard,
  sendAdaptiveCardToUser,
  validateAdaptiveCard
} from '../services/adaptive-cards.service'

const router = express.Router()

/**
 * POST /api/cards/vehicle-maintenance
 * Send a vehicle maintenance alert card
 */
router.post('/vehicle-maintenance', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { vehicleId, maintenanceId, teamId, channelId, userId } = req.body

    // Get vehicle and maintenance data
    const vehicleResult = await pool.query(`SELECT id, tenant_id, vin, license_plate, make, model, year, color, current_mileage, status, acquired_date, disposition_date, purchase_price, residual_value, created_at, updated_at, deleted_at FROM vehicles WHERE id = $1`, [vehicleId])
    const maintenanceResult = await pool.query(`SELECT * FROM maintenance WHERE tenant_id = $1 AND id = $2`, [req.user?.tenant_id, maintenanceId])

    if (vehicleResult.rows.length === 0 || maintenanceResult.rows.length === 0) {
      return res.status(404).json({ error: `Vehicle or maintenance record not found` })
    }

    const vehicle = vehicleResult.rows[0]
    const maintenance = maintenanceResult.rows[0]

    // Create the card
    const card = await createVehicleMaintenanceCard(vehicle, maintenance)

    // Validate the card
    const validation = validateAdaptiveCard(card)
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid card schema', errors: validation.errors })
    }

    // Send the card
    let response
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, 'Vehicle maintenance alert')
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'Vehicle maintenance alert')
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided")
    }

    res.json({
      success: true,
      message: 'Maintenance alert card sent',
      messageId: response.id,
      card
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error sending maintenance card:', errMsg)
    res.status(500).json({ error: 'An internal error occurred' })
  }
})

// Alias to match legacy endpoint expectations
router.post('/maintenance', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { vehicleId, maintenanceId, teamId, channelId, userId } = req.body

    const vehicleResult = await pool.query(`SELECT id, tenant_id, vin, license_plate, make, model, year, color, current_mileage, status, acquired_date, disposition_date, purchase_price, residual_value, created_at, updated_at, deleted_at FROM vehicles WHERE id = $1`, [vehicleId])
    const maintenanceResult = await pool.query(`SELECT * FROM maintenance WHERE tenant_id = $1 AND id = $2`, [req.user?.tenant_id, maintenanceId])

    if (vehicleResult.rows.length === 0 || maintenanceResult.rows.length === 0) {
      return res.status(404).json({ error: `Vehicle or maintenance record not found` })
    }

    const vehicle = vehicleResult.rows[0]
    const maintenance = maintenanceResult.rows[0]

    const card = await createVehicleMaintenanceCard(vehicle, maintenance)

    const validation = validateAdaptiveCard(card)
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid card schema', errors: validation.errors })
    }

    let response
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, 'Vehicle maintenance alert')
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'Vehicle maintenance alert')
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided")
    }

    res.json({
      success: true,
      message: 'Maintenance alert card sent',
      messageId: response.id,
      card
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error sending maintenance card:', errMsg)
    res.status(500).json({ error: 'An internal error occurred' })
  }
})

// Alias to match legacy endpoint expectations
router.post('/maintenance', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { vehicleId, maintenanceId, teamId, channelId, userId } = req.body

    const vehicleResult = await pool.query(`SELECT id, tenant_id, vin, license_plate, make, model, year, color, current_mileage, status, acquired_date, disposition_date, purchase_price, residual_value, created_at, updated_at, deleted_at FROM vehicles WHERE id = $1`, [vehicleId])
    const maintenanceResult = await pool.query(`SELECT * FROM maintenance WHERE tenant_id = $1 AND id = $2`, [req.user?.tenant_id, maintenanceId])

    if (vehicleResult.rows.length === 0 || maintenanceResult.rows.length === 0) {
      return res.status(404).json({ error: `Vehicle or maintenance record not found` })
    }

    const vehicle = vehicleResult.rows[0]
    const maintenance = maintenanceResult.rows[0]

    const card = await createVehicleMaintenanceCard(vehicle, maintenance)

    const validation = validateAdaptiveCard(card)
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid card schema', errors: validation.errors })
    }

    let response
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, 'Vehicle maintenance alert')
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'Vehicle maintenance alert')
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided")
    }

    res.json({
      success: true,
      message: 'Maintenance alert card sent',
      messageId: response.id,
      card
    })
  } catch (error: any) {
    logger.error('Error sending maintenance card:', error.message)
    res.status(500).json({ error: 'An internal error occurred' })
  }
})

/**
 * POST /api/cards/work-order
 * Send a work order assignment card
 */
router.post('/work-order', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { workOrderId, teamId, channelId, userId } = req.body

    // Get work order data with vehicle and assignment details
    const workOrderResult = await pool.query(
      `SELECT wo.*, v.vehicle_number, v.make as vehicle_make, v.model as vehicle_model,
              u.first_name || ' ' || u.last_name as assigned_to_name
       FROM work_orders wo
       LEFT JOIN vehicles v ON wo.vehicle_id = v.id
       LEFT JOIN users u ON wo.assigned_to = u.id
       WHERE wo.id = $1`,
      [workOrderId]
    )

    if (workOrderResult.rows.length === 0) {
      throw new NotFoundError("Work order not found")
    }

    const workOrder = workOrderResult.rows[0]

    // Create the card
    const card = await createWorkOrderCard(workOrder)

    // Validate the card
    const validation = validateAdaptiveCard(card)
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid card schema', errors: validation.errors })
    }

    // Send the card
    let response
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, 'New work order assignment')
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'New work order assignment')
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided")
    }

    res.json({
      success: true,
      message: 'Work order card sent',
      messageId: response.id,
      card
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error sending work order card:', errMsg)
    res.status(500).json({ error: 'An internal error occurred' })
  }
})

/**
 * POST /api/cards/incident
 * Send an incident report card
 */
router.post('/incident', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { incidentId, teamId, channelId, userId } = req.body

    // Get incident data
    const incidentResult = await pool.query(
      `SELECT i.*, v.vehicle_number, v.make as vehicle_make, v.model as vehicle_model,
              d.first_name || ' ' || d.last_name as driver_name,
              r.first_name || ' ' || r.last_name as reported_by_name
       FROM incidents i
       LEFT JOIN vehicles v ON i.vehicle_id = v.id
       LEFT JOIN users d ON i.driver_id = d.id
       LEFT JOIN users r ON i.reported_by = r.id
       WHERE i.id = $1`,
      [incidentId]
    )

    if (incidentResult.rows.length === 0) {
      throw new NotFoundError("Incident not found")
    }

    const incident = incidentResult.rows[0]

    // Create the card
    const card = await createIncidentCard(incident)

    // Validate the card
    const validation = validateAdaptiveCard(card)
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid card schema', errors: validation.errors })
    }

    // Send the card
    let response
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, 'New incident report')
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'New incident report')
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided")
    }

    res.json({
      success: true,
      message: 'Incident card sent',
      messageId: response.id,
      card
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error sending incident card:', errMsg)
    res.status(500).json({ error: 'An internal error occurred' })
  }
})

/**
 * POST /api/cards/approval
 * Send an approval request card
 */
router.post('/approval', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { approvalId, teamId, channelId, userId } = req.body

    // Get approval request data
    const approvalResult = await pool.query(
      `SELECT a.*, u.first_name || ' ' || u.last_name as requested_by_name
       FROM approvals a
       LEFT JOIN users u ON a.requested_by = u.id
       WHERE a.id = $1`,
      [approvalId]
    )

    if (approvalResult.rows.length === 0) {
      throw new NotFoundError("Approval request not found")
    }

    const approval = approvalResult.rows[0]

    // Create the card
    const card = await createApprovalCard(approval, null)

    // Validate the card
    const validation = validateAdaptiveCard(card)
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid card schema', errors: validation.errors })
    }

    // Send the card
    let response
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, 'Approval required')
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'Approval required')
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided")
    }

    res.json({
      success: true,
      message: 'Approval card sent',
      messageId: response.id,
      card
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error sending approval card:', errMsg)
    res.status(500).json({ error: 'An internal error occurred' })
  }
})

/**
 * POST /api/cards/driver-performance
 * Send a driver performance card
 */
router.post('/driver-performance', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { driverId, metrics, teamId, channelId, userId } = req.body

    // Get driver data
    const driverResult = await pool.query('SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, created_at, updated_at FROM users WHERE id = $1 AND role = $2', [driverId, 'driver'])

    if (driverResult.rows.length === 0) {
      throw new NotFoundError("Driver not found")
    }

    const driver = driverResult.rows[0]

    // Create the card
    const card = await createDriverPerformanceCard(driver, metrics)

    // Validate the card
    const validation = validateAdaptiveCard(card)
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid card schema', errors: validation.errors })
    }

    // Send the card
    let response
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, 'Driver performance report')
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'Driver performance report')
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided")
    }

    res.json({
      success: true,
      message: 'Performance card sent',
      messageId: response.id,
      card
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error sending performance card:', errMsg)
    res.status(500).json({ error: 'An internal error occurred' })
  }
})

/**
 * POST /api/cards/fuel-receipt
 * Send a fuel receipt card
 */
router.post('/fuel-receipt', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { receiptId, teamId, channelId, userId } = req.body

    // Get fuel receipt data
    const receiptResult = await pool.query(
      `SELECT fr.*, v.vehicle_number, v.make as vehicle_make, v.model as vehicle_model,
              u.first_name || ' ' || u.last_name as driver_name
       FROM fuel_receipts fr
       LEFT JOIN vehicles v ON fr.vehicle_id = v.id
       LEFT JOIN users u ON fr.driver_id = u.id
       WHERE fr.id = $1`,
      [receiptId]
    )

    if (receiptResult.rows.length === 0) {
      throw new NotFoundError("Fuel receipt not found")
    }

    const receipt = receiptResult.rows[0]

    // Create the card
    const card = await createFuelReceiptCard(receipt)

    // Validate the card
    const validation = validateAdaptiveCard(card)
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid card schema', errors: validation.errors })
    }

    // Send the card
    let response
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, 'Fuel receipt for review')
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'Fuel receipt for review')
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided")
    }

    res.json({
      success: true,
      message: 'Fuel receipt card sent',
      messageId: response.id,
      card
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error sending fuel receipt card:', errMsg)
    res.status(500).json({ error: 'An internal error occurred' })
  }
})

/**
 * POST /api/cards/inspection-checklist
 * Send an inspection checklist card
 */
router.post('/inspection-checklist', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { vehicleId, driverId, teamId, channelId, userId } = req.body

    // Get vehicle and driver data
    const vehicleResult = await pool.query(`SELECT id, tenant_id, vin, license_plate, make, model, year, color, current_mileage, status, acquired_date, disposition_date, purchase_price, residual_value, created_at, updated_at, deleted_at FROM vehicles WHERE tenant_id = $1 AND id = $2`, [req.user!.tenant_id, vehicleId])
    const driverResult = await pool.query(`SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, created_at, updated_at FROM users WHERE tenant_id = $1 AND id = $2`, [req.user!.tenant_id, driverId])

    if (vehicleResult.rows.length === 0 || driverResult.rows.length === 0) {
      return res.status(404).json({ error: `Vehicle or driver not found` })
    }

    const inspection = {
      vehicle_id: vehicleId,
      driver_id: driverId,
      vehicle_number: vehicleResult.rows[0].vehicle_number,
      vehicle_make: vehicleResult.rows[0].make,
      vehicle_model: vehicleResult.rows[0].model,
      driver_name: `${driverResult.rows[0].first_name} ${driverResult.rows[0].last_name}`
    }

    // Create the card
    const card = await createInspectionChecklistCard(inspection)

    // Validate the card
    const validation = validateAdaptiveCard(card)
    if (!validation.valid) {
      return res.status(400).json({ error: `Invalid card schema`, errors: validation.errors })
    }

    // Send the card
    let response
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, `Daily vehicle inspection`)
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'Daily vehicle inspection')
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided")
    }

    res.json({
      success: true,
      message: 'Inspection checklist card sent',
      messageId: response.id,
      card
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error sending inspection card:', errMsg)
    res.status(500).json({ error: 'An internal error occurred' })
  }
})

// Alias to match legacy endpoint expectations
router.post('/inspection', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { vehicleId, driverId, teamId, channelId, userId } = req.body

    const vehicleResult = await pool.query(`SELECT id, tenant_id, vin, license_plate, make, model, year, color, current_mileage, status, acquired_date, disposition_date, purchase_price, residual_value, created_at, updated_at, deleted_at FROM vehicles WHERE tenant_id = $1 AND id = $2`, [req.user!.tenant_id, vehicleId])
    const driverResult = await pool.query(`SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, created_at, updated_at FROM users WHERE tenant_id = $1 AND id = $2`, [req.user!.tenant_id, driverId])

    if (vehicleResult.rows.length === 0 || driverResult.rows.length === 0) {
      return res.status(404).json({ error: `Vehicle or driver not found` })
    }

    const inspection = {
      vehicle_id: vehicleId,
      driver_id: driverId,
      vehicle_number: vehicleResult.rows[0].vehicle_number,
      vehicle_make: vehicleResult.rows[0].make,
      vehicle_model: vehicleResult.rows[0].model,
      driver_name: `${driverResult.rows[0].first_name} ${driverResult.rows[0].last_name}`
    }

    const card = await createInspectionChecklistCard(inspection)

    const validation = validateAdaptiveCard(card)
    if (!validation.valid) {
      return res.status(400).json({ error: `Invalid card schema`, errors: validation.errors })
    }

    let response
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, `Daily vehicle inspection`)
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'Daily vehicle inspection')
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided")
    }

    res.json({
      success: true,
      message: 'Inspection checklist card sent',
      messageId: response.id,
      card
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error sending inspection card:', errMsg)
    res.status(500).json({ error: 'An internal error occurred' })
  }
})

// Alias to match legacy endpoint expectations
router.post('/inspection', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { vehicleId, driverId, teamId, channelId, userId } = req.body

    const vehicleResult = await pool.query(`SELECT id, tenant_id, vin, license_plate, make, model, year, color, current_mileage, status, acquired_date, disposition_date, purchase_price, residual_value, created_at, updated_at, deleted_at FROM vehicles WHERE tenant_id = $1 AND id = $2`, [req.user!.tenant_id, vehicleId])
    const driverResult = await pool.query(`SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, created_at, updated_at FROM users WHERE tenant_id = $1 AND id = $2`, [req.user!.tenant_id, driverId])

    if (vehicleResult.rows.length === 0 || driverResult.rows.length === 0) {
      return res.status(404).json({ error: `Vehicle or driver not found` })
    }

    const inspection = {
      vehicle_id: vehicleId,
      driver_id: driverId,
      vehicle_number: vehicleResult.rows[0].vehicle_number,
      vehicle_make: vehicleResult.rows[0].make,
      vehicle_model: vehicleResult.rows[0].model,
      driver_name: `${driverResult.rows[0].first_name} ${driverResult.rows[0].last_name}`
    }

    const card = await createInspectionChecklistCard(inspection)

    const validation = validateAdaptiveCard(card)
    if (!validation.valid) {
      return res.status(400).json({ error: `Invalid card schema`, errors: validation.errors })
    }

    let response
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, `Daily vehicle inspection`)
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'Daily vehicle inspection')
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided")
    }

    res.json({
      success: true,
      message: 'Inspection checklist card sent',
      messageId: response.id,
      card
    })
  } catch (error: any) {
    logger.error('Error sending inspection card:', error.message)
    res.status(500).json({ error: 'An internal error occurred' })
  }
})

/**
 * POST /api/cards/:cardType/action
 * Handle card button actions
 */
router.post('/:cardType/action', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { cardType } = req.params
    const { action, cardId, teamId, channelId, messageId } = req.body
    const userId = req.user?.id

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    // Handle the action
    const result = await handleCardAction(action, userId, cardId, teamId, channelId, messageId)

    if (result.success) {
      res.json(result)
    } else {
      res.status(400).json(result)
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error handling card action:', errMsg)
    res.status(500).json({ error: 'An internal error occurred' })
  }
})

/**
 * GET /api/cards/preview/:cardType
 * Preview a card type (for testing/development)
 */
router.get('/preview/:cardType', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { cardType } = req.params

    const tenantId = (req as any).tenantId
    const dbClient = (req as any).dbClient || pool

    let card
    switch (cardType) {
      case 'vehicle-maintenance': {
        const vRes = await dbClient.query(
          `SELECT id, vehicle_number, make, model, vin, current_mileage FROM vehicles WHERE tenant_id = $1 LIMIT 1`,
          [tenantId]
        )
        const mRes = await dbClient.query(
          `SELECT id, maintenance_type AS type, priority, due_date, estimated_cost, description FROM maintenance_schedules WHERE tenant_id = $1 ORDER BY due_date ASC LIMIT 1`,
          [tenantId]
        )
        if (!vRes.rows[0] || !mRes.rows[0]) throw new NotFoundError('No vehicle or maintenance data found for preview')
        card = await createVehicleMaintenanceCard(vRes.rows[0], mRes.rows[0])
        break
      }
      case 'work-order': {
        const woRes = await dbClient.query(
          `SELECT wo.id, wo.work_order_number, wo.status, wo.work_type, wo.priority, wo.due_date, wo.location, wo.estimated_duration, wo.description,
                  d.first_name || ' ' || d.last_name AS assigned_to_name,
                  v.vehicle_number, v.make AS vehicle_make, v.model AS vehicle_model
           FROM work_orders wo
           LEFT JOIN drivers d ON d.id = wo.assigned_to AND d.tenant_id = $1
           LEFT JOIN vehicles v ON v.id = wo.vehicle_id AND v.tenant_id = $1
           WHERE wo.tenant_id = $1
           ORDER BY wo.created_at DESC LIMIT 1`,
          [tenantId]
        )
        if (!woRes.rows[0]) throw new NotFoundError('No work order data found for preview')
        card = await createWorkOrderCard(woRes.rows[0])
        break
      }
      default:
        throw new NotFoundError("Card type not found")
    }

    res.json({ card })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error generating card preview:', errMsg)
    res.status(500).json({ error: 'An internal error occurred' })
  }
})

export default router
