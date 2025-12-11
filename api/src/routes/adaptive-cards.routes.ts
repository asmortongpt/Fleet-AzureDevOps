Here's the complete refactored version of the `adaptive-cards.routes.ts` file, replacing all `pool.query` calls with repository methods:


import express, { Request, Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger';
import { authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
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
} from '../services/adaptive-cards.service';
import { handleCardAction } from '../services/actionable-messages.service';

// Import repositories
import { VehicleRepository } from '../repositories/vehicle.repository';
import { MaintenanceRepository } from '../repositories/maintenance.repository';
import { WorkOrderRepository } from '../repositories/work-order.repository';
import { IncidentRepository } from '../repositories/incident.repository';
import { ApprovalRepository } from '../repositories/approval.repository';
import { DriverPerformanceRepository } from '../repositories/driver-performance.repository';
import { FuelReceiptRepository } from '../repositories/fuel-receipt.repository';
import { InspectionChecklistRepository } from '../repositories/inspection-checklist.repository';

const router = express.Router();

// Initialize repositories
const vehicleRepository = new VehicleRepository();
const maintenanceRepository = new MaintenanceRepository();
const workOrderRepository = new WorkOrderRepository();
const incidentRepository = new IncidentRepository();
const approvalRepository = new ApprovalRepository();
const driverPerformanceRepository = new DriverPerformanceRepository();
const fuelReceiptRepository = new FuelReceiptRepository();
const inspectionChecklistRepository = new InspectionChecklistRepository();

/**
 * POST /api/cards/vehicle-maintenance
 * Send a vehicle maintenance alert card
 */
router.post('/vehicle-maintenance', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { vehicleId, maintenanceId, teamId, channelId, userId } = req.body;

    // Get vehicle and maintenance data
    const vehicle = await vehicleRepository.getVehicleById(vehicleId);
    const maintenance = await maintenanceRepository.getMaintenanceById(maintenanceId);

    if (!vehicle || !maintenance) {
      return res.status(404).json({ error: `Vehicle or maintenance record not found` });
    }

    // Create the card
    const card = await createVehicleMaintenanceCard(vehicle, maintenance);

    // Validate the card
    const validation = validateAdaptiveCard(card);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid card schema', errors: validation.errors });
    }

    // Send the card
    let response;
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, 'Vehicle maintenance alert');
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'Vehicle maintenance alert');
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided");
    }

    res.json({
      success: true,
      message: 'Maintenance alert card sent',
      messageId: response.id,
      card
    });
  } catch (error: any) {
    logger.error('Error sending maintenance card:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/cards/work-order
 * Send a work order assignment card
 */
router.post('/work-order', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { workOrderId, teamId, channelId, userId } = req.body;

    // Get work order data with vehicle and assignment details
    const workOrder = await workOrderRepository.getWorkOrderWithDetails(workOrderId);

    if (!workOrder) {
      throw new NotFoundError("Work order not found");
    }

    // Create the card
    const card = await createWorkOrderCard(workOrder);

    // Validate the card
    const validation = validateAdaptiveCard(card);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid card schema', errors: validation.errors });
    }

    // Send the card
    let response;
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, 'Work order assignment');
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'Work order assignment');
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided");
    }

    res.json({
      success: true,
      message: 'Work order assignment card sent',
      messageId: response.id,
      card
    });
  } catch (error: any) {
    logger.error('Error sending work order card:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/cards/incident
 * Send an incident report card
 */
router.post('/incident', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { incidentId, teamId, channelId, userId } = req.body;

    // Get incident data
    const incident = await incidentRepository.getIncidentById(incidentId);

    if (!incident) {
      throw new NotFoundError("Incident not found");
    }

    // Create the card
    const card = await createIncidentCard(incident);

    // Validate the card
    const validation = validateAdaptiveCard(card);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid card schema', errors: validation.errors });
    }

    // Send the card
    let response;
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, 'Incident report');
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'Incident report');
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided");
    }

    res.json({
      success: true,
      message: 'Incident report card sent',
      messageId: response.id,
      card
    });
  } catch (error: any) {
    logger.error('Error sending incident card:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/cards/approval
 * Send an approval request card
 */
router.post('/approval', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { approvalId, teamId, channelId, userId } = req.body;

    // Get approval data
    const approval = await approvalRepository.getApprovalById(approvalId);

    if (!approval) {
      throw new NotFoundError("Approval request not found");
    }

    // Create the card
    const card = await createApprovalCard(approval);

    // Validate the card
    const validation = validateAdaptiveCard(card);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid card schema', errors: validation.errors });
    }

    // Send the card
    let response;
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, 'Approval request');
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'Approval request');
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided");
    }

    res.json({
      success: true,
      message: 'Approval request card sent',
      messageId: response.id,
      card
    });
  } catch (error: any) {
    logger.error('Error sending approval card:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/cards/driver-performance
 * Send a driver performance review card
 */
router.post('/driver-performance', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { driverPerformanceId, teamId, channelId, userId } = req.body;

    // Get driver performance data
    const driverPerformance = await driverPerformanceRepository.getDriverPerformanceById(driverPerformanceId);

    if (!driverPerformance) {
      throw new NotFoundError("Driver performance review not found");
    }

    // Create the card
    const card = await createDriverPerformanceCard(driverPerformance);

    // Validate the card
    const validation = validateAdaptiveCard(card);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid card schema', errors: validation.errors });
    }

    // Send the card
    let response;
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, 'Driver performance review');
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'Driver performance review');
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided");
    }

    res.json({
      success: true,
      message: 'Driver performance review card sent',
      messageId: response.id,
      card
    });
  } catch (error: any) {
    logger.error('Error sending driver performance card:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/cards/fuel-receipt
 * Send a fuel receipt card
 */
router.post('/fuel-receipt', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { fuelReceiptId, teamId, channelId, userId } = req.body;

    // Get fuel receipt data
    const fuelReceipt = await fuelReceiptRepository.getFuelReceiptById(fuelReceiptId);

    if (!fuelReceipt) {
      throw new NotFoundError("Fuel receipt not found");
    }

    // Create the card
    const card = await createFuelReceiptCard(fuelReceipt);

    // Validate the card
    const validation = validateAdaptiveCard(card);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid card schema', errors: validation.errors });
    }

    // Send the card
    let response;
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, 'Fuel receipt');
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'Fuel receipt');
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided");
    }

    res.json({
      success: true,
      message: 'Fuel receipt card sent',
      messageId: response.id,
      card
    });
  } catch (error: any) {
    logger.error('Error sending fuel receipt card:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/cards/inspection-checklist
 * Send an inspection checklist card
 */
router.post('/inspection-checklist', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { inspectionChecklistId, teamId, channelId, userId } = req.body;

    // Get inspection checklist data
    const inspectionChecklist = await inspectionChecklistRepository.getInspectionChecklistById(inspectionChecklistId);

    if (!inspectionChecklist) {
      throw new NotFoundError("Inspection checklist not found");
    }

    // Create the card
    const card = await createInspectionChecklistCard(inspectionChecklist);

    // Validate the card
    const validation = validateAdaptiveCard(card);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid card schema', errors: validation.errors });
    }

    // Send the card
    let response;
    if (userId) {
      response = await sendAdaptiveCardToUser(userId, card, 'Inspection checklist');
    } else if (teamId && channelId) {
      response = await sendAdaptiveCard(teamId, channelId, card, 'Inspection checklist');
    } else {
      throw new ValidationError("Either userId or teamId/channelId must be provided");
    }

    res.json({
      success: true,
      message: 'Inspection checklist card sent',
      messageId: response.id,
      card
    });
  } catch (error: any) {
    logger.error('Error sending inspection checklist card:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/cards/action
 * Handle card action
 */
router.post('/action', csrfProtection, authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { actionId, actionType, cardId, userId } = req.body;

    const result = await handleCardAction(actionId, actionType, cardId, userId);

    res.json({
      success: true,
      message: 'Card action handled',
      result
    });
  } catch (error: any) {
    logger.error('Error handling card action:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;


This refactored version of `adaptive-cards.routes.ts` replaces all database queries with repository methods. Here's a summary of the changes:

1. Imported all necessary repositories at the top of the file.
2. Initialized all required repositories at the beginning of the file.
3. Replaced all `pool.query` calls with corresponding repository methods:
   - `vehicleRepository.getVehicleById()`
   - `maintenanceRepository.getMaintenanceById()`
   - `workOrderRepository.getWorkOrderWithDetails()`
   - `incidentRepository.getIncidentById()`
   - `approvalRepository.getApprovalById()`
   - `driverPerformanceRepository.getDriverPerformanceById()`
   - `fuelReceiptRepository.getFuelReceiptById()`
   - `inspectionChecklistRepository.getInspectionChecklistById()`

4. The structure of the routes and error handling remains the same, but now they use repository methods instead of direct database queries.

Note that this refactoring assumes that the repository classes and their methods have been implemented correctly in their respective files. You may need to create these repository classes and implement the necessary methods if they don't already exist.