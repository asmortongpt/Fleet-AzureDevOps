import express, { Request, Response } from 'express'
import pool from '../config/database'
import { authenticateJWT } from '../middleware/auth'
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
import { handleCardAction } from '../services/actionable-messages.service'

const router = express.Router()

/**
 * POST /api/cards/vehicle-maintenance
 * Send a vehicle maintenance alert card
 */
router.post('/vehicle-maintenance', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { vehicleId, maintenanceId, teamId, channelId, userId } = req.body

    // Get vehicle and maintenance data
    const vehicleResult = await pool.query('SELECT id, tenant_id, vin, license_plate, make, model, year, color, current_mileage, status, acquired_date, disposition_date, purchase_price, residual_value, created_at, updated_at, deleted_at FROM vehicles WHERE id = $1', [vehicleId])
    const maintenanceResult = await pool.query('SELECT * FROM maintenance WHERE id = $1', [maintenanceId])

    if (vehicleResult.rows.length === 0 || maintenanceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle or maintenance record not found' })
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
      return res.status(400).json({ error: 'Either userId or teamId/channelId must be provided' })
    }

    res.json({
      success: true,
      message: 'Maintenance alert card sent',
      messageId: response.id,
      card
    })
  } catch (error: any) {
    console.error('Error sending maintenance card:', error.message)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/cards/work-order
 * Send a work order assignment card
 */
router.post('/work-order', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { workOrderId, teamId, channelId, userId } = req.body

    // Get work order data with vehicle and assignment details
    const workOrderResult = await pool.query(
      `SELECT wo.*, v.vehicle_number, v.make as vehicle_make, v.model as vehicle_model,
              u.first_name || ' ' || u.last_name as assigned_to_name
       FROM work_orders wo
       LEFT JOIN vehicles v ON wo.vehicle_id = v.id
       LEFT JOIN users u ON wo.assigned_to = u.id
       WHERE wo.id = $1',
      [workOrderId]
    )

    if (workOrderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' })
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
      return res.status(400).json({ error: 'Either userId or teamId/channelId must be provided' })
    }

    res.json({
      success: true,
      message: 'Work order card sent',
      messageId: response.id,
      card
    })
  } catch (error: any) {
    console.error('Error sending work order card:', error.message)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/cards/incident
 * Send an incident report card
 */
router.post('/incident', authenticateJWT, async (req: Request, res: Response) => {
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
       WHERE i.id = $1',
      [incidentId]
    )

    if (incidentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' })
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
      return res.status(400).json({ error: 'Either userId or teamId/channelId must be provided' })
    }

    res.json({
      success: true,
      message: 'Incident card sent',
      messageId: response.id,
      card
    })
  } catch (error: any) {
    console.error('Error sending incident card:', error.message)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/cards/approval
 * Send an approval request card
 */
router.post('/approval', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { approvalId, teamId, channelId, userId } = req.body

    // Get approval request data
    const approvalResult = await pool.query(
      'SELECT a.*, u.first_name || ' ' || u.last_name as requested_by_name
       FROM approvals a
       LEFT JOIN users u ON a.requested_by = u.id
       WHERE a.id = $1',
      [approvalId]
    )

    if (approvalResult.rows.length === 0) {
      return res.status(404).json({ error: 'Approval request not found' })
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
      return res.status(400).json({ error: 'Either userId or teamId/channelId must be provided' })
    }

    res.json({
      success: true,
      message: 'Approval card sent',
      messageId: response.id,
      card
    })
  } catch (error: any) {
    console.error('Error sending approval card:', error.message)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/cards/driver-performance
 * Send a driver performance card
 */
router.post('/driver-performance', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { driverId, metrics, teamId, channelId, userId } = req.body

    // Get driver data
    const driverResult = await pool.query('SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, created_at, updated_at FROM users WHERE id = $1 AND role = $2', [driverId, 'driver'])

    if (driverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' })
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
      return res.status(400).json({ error: 'Either userId or teamId/channelId must be provided' })
    }

    res.json({
      success: true,
      message: 'Performance card sent',
      messageId: response.id,
      card
    })
  } catch (error: any) {
    console.error('Error sending performance card:', error.message)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/cards/fuel-receipt
 * Send a fuel receipt card
 */
router.post('/fuel-receipt', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { receiptId, teamId, channelId, userId } = req.body

    // Get fuel receipt data
    const receiptResult = await pool.query(
      `SELECT fr.*, v.vehicle_number, v.make as vehicle_make, v.model as vehicle_model,
              u.first_name || ' ' || u.last_name as driver_name
       FROM fuel_receipts fr
       LEFT JOIN vehicles v ON fr.vehicle_id = v.id
       LEFT JOIN users u ON fr.driver_id = u.id
       WHERE fr.id = $1',
      [receiptId]
    )

    if (receiptResult.rows.length === 0) {
      return res.status(404).json({ error: 'Fuel receipt not found' })
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
      return res.status(400).json({ error: 'Either userId or teamId/channelId must be provided' })
    }

    res.json({
      success: true,
      message: 'Fuel receipt card sent',
      messageId: response.id,
      card
    })
  } catch (error: any) {
    console.error('Error sending fuel receipt card:', error.message)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/cards/inspection-checklist
 * Send an inspection checklist card
 */
router.post('/inspection-checklist', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { vehicleId, driverId, teamId, channelId, userId } = req.body

    // Get vehicle and driver data
    const vehicleResult = await pool.query('SELECT id, tenant_id, vin, license_plate, make, model, year, color, current_mileage, status, acquired_date, disposition_date, purchase_price, residual_value, created_at, updated_at, deleted_at FROM vehicles WHERE id = $1', [vehicleId])
    const driverResult = await pool.query('SELECT id, tenant_id, email, first_name, last_name, role, is_active, phone, created_at, updated_at FROM users WHERE id = $1', [driverId])

    if (vehicleResult.rows.length === 0 || driverResult.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle or driver not found' })
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
      return res.status(400).json({ error: 'Invalid card schema', errors: validation.errors })
    }

    // Send the card
    let response
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, 'Daily vehicle inspection')
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'Daily vehicle inspection')
    } else {
      return res.status(400).json({ error: 'Either userId or teamId/channelId must be provided' })
    }

    res.json({
      success: true,
      message: 'Inspection checklist card sent',
      messageId: response.id,
      card
    })
  } catch (error: any) {
    console.error('Error sending inspection card:', error.message)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/cards/:cardType/action
 * Handle card button actions
 */
router.post('/:cardType/action', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { cardType } = req.params
    const { action, cardId, teamId, channelId, messageId } = req.body
    const userId = (req as any).user?.id

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
  } catch (error: any) {
    console.error('Error handling card action:', error.message)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/cards/preview/:cardType
 * Preview a card type (for testing/development)
 */
router.get('/preview/:cardType', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { cardType } = req.params

    // Sample data for preview
    const sampleData: Record<string, any> = {
      'vehicle-maintenance': {
        vehicle: {
          id: 'sample-vehicle-id',
          vehicle_number: 'V-001',
          make: 'Ford',
          model: 'F-150',
          vin: '1FTFW1ET5BFC12345',
          current_mileage: 85000
        },
        maintenance: {
          id: 'sample-maintenance-id',
          type: 'Oil Change',
          priority: 'high',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          estimated_cost: 150,
          description: 'Regular oil change and filter replacement',
          recommended_action: 'Schedule service within the next week'
        }
      },
      'work-order': {
        id: 'sample-wo-id',
        work_order_number: 'WO-12345',
        status: 'pending',
        assigned_to_name: 'John Mechanic',
        vehicle_number: 'V-001',
        vehicle_make: 'Ford',
        vehicle_model: 'F-150',
        work_type: 'Tire Replacement',
        priority: 'high',
        due_date: new Date(),
        location: 'Main Shop',
        estimated_duration: '2 hours',
        description: 'Replace all four tires - tread depth below safety threshold'
      }
    }

    let card
    switch (cardType) {
      case 'vehicle-maintenance':
        card = await createVehicleMaintenanceCard(sampleData[cardType].vehicle, sampleData[cardType].maintenance)
        break
      case 'work-order':
        card = await createWorkOrderCard(sampleData[cardType])
        break
      default:
        return res.status(404).json({ error: 'Card type not found' })
    }

    res.json({ card })
  } catch (error: any) {
    console.error('Error generating card preview:', error.message)
    res.status(500).json({ error: error.message })
  }
})

export default router
