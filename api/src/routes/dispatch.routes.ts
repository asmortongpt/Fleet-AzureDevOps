To refactor the `dispatch.routes.ts` file to use the repository pattern, we'll need to replace all `pool.query` calls with repository methods. We'll import the necessary repositories at the top of the file and modify the route handlers to use these repositories. Here's the refactored version of the file:


/**
 * Fleet Management - Dispatch Radio Routes
 *
 * Endpoints:
 * - GET /api/dispatch/channels - List all available dispatch channels
 * - GET /api/dispatch/channels/:id - Get channel details
 * - POST /api/dispatch/channels - Create new channel (admin)
 * - GET /api/dispatch/channels/:id/history - Get transmission history
 * - GET /api/dispatch/channels/:id/listeners - Get active listeners
 * - POST /api/dispatch/emergency - Create emergency alert
 * - GET /api/dispatch/emergency - List emergency alerts
 * - PUT /api/dispatch/emergency/:id/acknowledge - Acknowledge alert
 * - PUT /api/dispatch/emergency/:id/resolve - Resolve alert
 * - GET /api/dispatch/metrics - Get dispatch performance metrics
 * - WebSocket: /api/dispatch/ws - Real-time audio streaming
 */

import { Router, Request, Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import logger from '../config/logger'; // Wave 24: Add Winston logger
import dispatchService from '../services/dispatch.service';
import webrtcService from '../services/webrtc.service';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { csrfProtection } from '../middleware/csrf';

// Import repositories
import { DispatchChannelRepository } from '../repositories/dispatch-channel.repository';
import { EmergencyAlertRepository } from '../repositories/emergency-alert.repository';
import { DispatchMetricsRepository } from '../repositories/dispatch-metrics.repository';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

/**
 * @openapi
 * /api/dispatch/channels:
 *   get:
 *     summary: Get all dispatch channels
 *     description: Returns list of active dispatch channels available to the user
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of dispatch channels
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 channels:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       channelType:
 *                         type: string
 *                       priorityLevel:
 *                         type: integer
 *                       colorCode:
 *                         type: string
 */
router.get('/channels', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id; // From auth middleware

    const channels = await dispatchService.getChannels(userId);

    res.json({
      success: true,
      channels
    });
  } catch (error) {
    logger.error('Error getting dispatch channels:', error); // Wave 24: Winston logger
    res.status(500).json({
      success: false,
      error: 'Failed to get dispatch channels'
    });
  }
});

/**
 * @openapi
 * /api/dispatch/channels/{id}:
 *   get:
 *     summary: Get channel details
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Channel details
 */
router.get('/channels/:id', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dispatchChannelRepository = container.resolve(DispatchChannelRepository);

    const channel = await dispatchChannelRepository.getChannelById(id, req.user!.tenant_id);

    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    res.json({
      success: true,
      channel
    });
  } catch (error) {
    logger.error('Error getting channel details:', error);
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to get channel details'
      });
    }
  }
});

/**
 * @openapi
 * /api/dispatch/channels:
 *   post:
 *     summary: Create a new dispatch channel
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               channelType:
 *                 type: string
 *               priorityLevel:
 *                 type: integer
 *               colorCode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Channel created successfully
 */
router.post('/channels', requirePermission('route:create:fleet'), async (req: Request, res: Response) => {
  try {
    const { name, description, channelType, priorityLevel, colorCode } = req.body;
    const dispatchChannelRepository = container.resolve(DispatchChannelRepository);

    const newChannel = await dispatchChannelRepository.createChannel({
      name,
      description,
      channelType,
      priorityLevel,
      colorCode,
      tenantId: req.user!.tenant_id,
      createdBy: req.user!.id
    });

    res.status(201).json({
      success: true,
      channel: newChannel
    });
  } catch (error) {
    logger.error('Error creating dispatch channel:', error);
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create dispatch channel'
      });
    }
  }
});

/**
 * @openapi
 * /api/dispatch/channels/{id}/history:
 *   get:
 *     summary: Get transmission history for a channel
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transmission history for the channel
 */
router.get('/channels/:id/history', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dispatchChannelRepository = container.resolve(DispatchChannelRepository);

    const history = await dispatchChannelRepository.getChannelHistory(id, req.user!.tenant_id);

    res.json({
      success: true,
      history
    });
  } catch (error) {
    logger.error('Error getting channel history:', error);
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to get channel history'
      });
    }
  }
});

/**
 * @openapi
 * /api/dispatch/channels/{id}/listeners:
 *   get:
 *     summary: Get active listeners for a channel
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of active listeners for the channel
 */
router.get('/channels/:id/listeners', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dispatchChannelRepository = container.resolve(DispatchChannelRepository);

    const listeners = await dispatchChannelRepository.getChannelListeners(id, req.user!.tenant_id);

    res.json({
      success: true,
      listeners
    });
  } catch (error) {
    logger.error('Error getting channel listeners:', error);
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to get channel listeners'
      });
    }
  }
});

/**
 * @openapi
 * /api/dispatch/emergency:
 *   post:
 *     summary: Create an emergency alert
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               channelId:
 *                 type: integer
 *               message:
 *                 type: string
 *               severity:
 *                 type: string
 *     responses:
 *       201:
 *         description: Emergency alert created successfully
 */
router.post('/emergency', requirePermission('route:create:fleet'), async (req: Request, res: Response) => {
  try {
    const { channelId, message, severity } = req.body;
    const emergencyAlertRepository = container.resolve(EmergencyAlertRepository);

    const newAlert = await emergencyAlertRepository.createAlert({
      channelId,
      message,
      severity,
      tenantId: req.user!.tenant_id,
      createdBy: req.user!.id
    });

    res.status(201).json({
      success: true,
      alert: newAlert
    });
  } catch (error) {
    logger.error('Error creating emergency alert:', error);
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create emergency alert'
      });
    }
  }
});

/**
 * @openapi
 * /api/dispatch/emergency:
 *   get:
 *     summary: Get all emergency alerts
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of emergency alerts
 */
router.get('/emergency', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const emergencyAlertRepository = container.resolve(EmergencyAlertRepository);

    const alerts = await emergencyAlertRepository.getAllAlerts(req.user!.tenant_id);

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    logger.error('Error getting emergency alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get emergency alerts'
    });
  }
});

/**
 * @openapi
 * /api/dispatch/emergency/{id}/acknowledge:
 *   put:
 *     summary: Acknowledge an emergency alert
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Emergency alert acknowledged successfully
 */
router.put('/emergency/:id/acknowledge', requirePermission('route:update:fleet'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const emergencyAlertRepository = container.resolve(EmergencyAlertRepository);

    const updatedAlert = await emergencyAlertRepository.acknowledgeAlert(id, req.user!.tenant_id, req.user!.id);

    if (!updatedAlert) {
      throw new NotFoundError('Alert not found');
    }

    res.json({
      success: true,
      alert: updatedAlert
    });
  } catch (error) {
    logger.error('Error acknowledging emergency alert:', error);
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to acknowledge emergency alert'
      });
    }
  }
});

/**
 * @openapi
 * /api/dispatch/emergency/{id}/resolve:
 *   put:
 *     summary: Resolve an emergency alert
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Emergency alert resolved successfully
 */
router.put('/emergency/:id/resolve', requirePermission('route:update:fleet'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const emergencyAlertRepository = container.resolve(EmergencyAlertRepository);

    const updatedAlert = await emergencyAlertRepository.resolveAlert(id, req.user!.tenant_id, req.user!.id);

    if (!updatedAlert) {
      throw new NotFoundError('Alert not found');
    }

    res.json({
      success: true,
      alert: updatedAlert
    });
  } catch (error) {
    logger.error('Error resolving emergency alert:', error);
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to resolve emergency alert'
      });
    }
  }
});

/**
 * @openapi
 * /api/dispatch/metrics:
 *   get:
 *     summary: Get dispatch performance metrics
 *     tags:
 *       - Dispatch
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dispatch performance metrics
 */
router.get('/metrics', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const dispatchMetricsRepository = container.resolve(DispatchMetricsRepository);

    const metrics = await dispatchMetricsRepository.getMetrics(req.user!.tenant_id);

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    logger.error('Error getting dispatch metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get dispatch metrics'
    });
  }
});

// WebSocket route for real-time audio streaming
router.ws('/ws', async (ws, req) => {
  try {
    const userId = (req as any).user?.id; // From auth middleware

    await webrtcService.handleWebSocketConnection(ws, userId);
  } catch (error) {
    logger.error('Error handling WebSocket connection:', error);
    ws.close();
  }
});

export default router;


In this refactored version:

1. We've imported the necessary repositories at the top of the file:
   - `DispatchChannelRepository`
   - `EmergencyAlertRepository`
   - `DispatchMetricsRepository`

2. We've replaced all `pool.query` calls with repository methods. For example:
   - In the `/channels/:id` route, we now use `dispatchChannelRepository.getChannelById()` instead of a direct database query.
   - In the `/channels` POST route, we use `dispatchChannelRepository.createChannel()` to create a new channel.
   - Similar changes have been made for other routes, using the appropriate repository methods.

3. We've kept all the route handlers as requested, maintaining the existing structure and functionality.

4. We've added error handling and logging using the Winston logger, as per the original code.

5. We've used the `container.resolve()` method to get instances of the repositories, assuming that they are registered in the dependency injection container.

6. We've added appropriate error handling for `NotFoundError` and `ValidationError` where applicable.

This refactored version now uses the repository pattern, which provides a cleaner separation of concerns and makes the code more maintainable and testable. The database operations are now encapsulated within the repository classes, which can be easily mocked or replaced in unit tests.