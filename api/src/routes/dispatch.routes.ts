Here's the complete refactored `dispatch.routes.ts` file, replacing all `pool.query` calls with repository methods:


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
import logger from '../config/logger';
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
    const userId = (req as any).user?.id;
    const dispatchChannelRepository = container.resolve(DispatchChannelRepository);
    const channels = await dispatchChannelRepository.getChannelsForUser(userId);

    res.json({
      success: true,
      channels
    });
  } catch (error) {
    logger.error('Error getting dispatch channels:', error);
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 channel:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     channelType:
 *                       type: string
 *                     priorityLevel:
 *                       type: integer
 *                     colorCode:
 *                       type: string
 *       404:
 *         description: Channel not found
 */
router.get('/channels/:id', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.id);
    const dispatchChannelRepository = container.resolve(DispatchChannelRepository);
    const channel = await dispatchChannelRepository.getChannelById(channelId);

    if (!channel) {
      throw new NotFoundError('Channel not found');
    }

    res.json({
      success: true,
      channel
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      logger.error('Error getting channel details:', error);
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
 *     description: Creates a new dispatch channel (admin only)
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 channel:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     channelType:
 *                       type: string
 *                     priorityLevel:
 *                       type: integer
 *                     colorCode:
 *                       type: string
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Permission denied
 */
router.post('/channels', requirePermission('route:create:fleet'), csrfProtection, async (req: Request, res: Response) => {
  try {
    const { name, description, channelType, priorityLevel, colorCode } = req.body;
    const dispatchChannelRepository = container.resolve(DispatchChannelRepository);
    const newChannel = await dispatchChannelRepository.createChannel({
      name,
      description,
      channelType,
      priorityLevel,
      colorCode
    });

    res.status(201).json({
      success: true,
      channel: newChannel
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      logger.error('Error creating dispatch channel:', error);
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 history:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       channelId:
 *                         type: integer
 *                       userId:
 *                         type: integer
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       message:
 *                         type: string
 *       404:
 *         description: Channel not found
 */
router.get('/channels/:id/history', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.id);
    const dispatchChannelRepository = container.resolve(DispatchChannelRepository);
    const history = await dispatchChannelRepository.getChannelHistory(channelId);

    res.json({
      success: true,
      history
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      logger.error('Error getting channel history:', error);
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 listeners:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       lastActive:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Channel not found
 */
router.get('/channels/:id/listeners', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.id);
    const dispatchChannelRepository = container.resolve(DispatchChannelRepository);
    const listeners = await dispatchChannelRepository.getActiveListeners(channelId);

    res.json({
      success: true,
      listeners
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      logger.error('Error getting active listeners:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get active listeners'
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
 *     responses:
 *       201:
 *         description: Emergency alert created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 alert:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     channelId:
 *                       type: integer
 *                     userId:
 *                       type: integer
 *                     message:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input
 */
router.post('/emergency', requirePermission('route:create:emergency'), csrfProtection, async (req: Request, res: Response) => {
  try {
    const { channelId, message } = req.body;
    const userId = (req as any).user?.id;
    const emergencyAlertRepository = container.resolve(EmergencyAlertRepository);
    const newAlert = await emergencyAlertRepository.createAlert({
      channelId,
      userId,
      message
    });

    res.status(201).json({
      success: true,
      alert: newAlert
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    } else {
      logger.error('Error creating emergency alert:', error);
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 alerts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       channelId:
 *                         type: integer
 *                       userId:
 *                         type: integer
 *                       message:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *                       acknowledged:
 *                         type: boolean
 *                       resolved:
 *                         type: boolean
 */
router.get('/emergency', requirePermission('route:view:emergency'), async (req: Request, res: Response) => {
  try {
    const emergencyAlertRepository = container.resolve(EmergencyAlertRepository);
    const alerts = await emergencyAlertRepository.getAllAlerts();

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       404:
 *         description: Alert not found
 */
router.put('/emergency/:id/acknowledge', requirePermission('route:update:emergency'), csrfProtection, async (req: Request, res: Response) => {
  try {
    const alertId = parseInt(req.params.id);
    const userId = (req as any).user?.id;
    const emergencyAlertRepository = container.resolve(EmergencyAlertRepository);
    await emergencyAlertRepository.acknowledgeAlert(alertId, userId);

    res.json({
      success: true
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      logger.error('Error acknowledging emergency alert:', error);
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       404:
 *         description: Alert not found
 */
router.put('/emergency/:id/resolve', requirePermission('route:update:emergency'), csrfProtection, async (req: Request, res: Response) => {
  try {
    const alertId = parseInt(req.params.id);
    const userId = (req as any).user?.id;
    const emergencyAlertRepository = container.resolve(EmergencyAlertRepository);
    await emergencyAlertRepository.resolveAlert(alertId, userId);

    res.json({
      success: true
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      res.status(404).json({
        success: false,
        error: error.message
      });
    } else {
      logger.error('Error resolving emergency alert:', error);
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     totalChannels:
 *                       type: integer
 *                     activeChannels:
 *                       type: integer
 *                     totalAlerts:
 *                       type: integer
 *                     acknowledgedAlerts:
 *                       type: integer
 *                     resolvedAlerts:
 *                       type: integer
 *                     averageResponseTime:
 *                       type: number
 *                       format: float
 */
router.get('/metrics', requirePermission('route:view:metrics'), async (req: Request, res: Response) => {
  try {
    const dispatchMetricsRepository = container.resolve(DispatchMetricsRepository);
    const metrics = await dispatchMetricsRepository.getDispatchMetrics();

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
    const userId = (req as any).user?.id;
    await webrtcService.handleWebSocketConnection(ws, userId);
  } catch (error) {
    logger.error('Error handling WebSocket connection:', error);
    ws.close();
  }
});

export default router;


This refactored version of `dispatch.routes.ts` replaces all `pool.query` calls with repository methods. Here's a summary of the changes:

1. Imported the necessary repository classes at the top of the file.
2. Replaced `pool.query` calls with corresponding repository method calls.
3. Used the `container.resolve()` method to instantiate repository instances.
4. Updated error handling to use the appropriate repository methods.
5. Adjusted the method signatures to match the repository interfaces.

The repositories used in this refactored version are:

- `DispatchChannelRepository`
- `EmergencyAlertRepository`
- `DispatchMetricsRepository`

These repositories should be implemented to handle the database operations previously performed by `pool.query`. The specific methods used in this file are:

- `DispatchChannelRepository`:
  - `getChannelsForUser(userId: number): Promise<Channel[]>`
  - `getChannelById(channelId: number): Promise<Channel | null>`
  - `createChannel(channelData: CreateChannelData): Promise<Channel>`
  - `getChannelHistory(channelId: number): Promise<TransmissionHistory[]>`
  - `getActiveListeners(channelId: number): Promise<ActiveListener[]>`

- `EmergencyAlertRepository`:
  - `createAlert(alertData: CreateAlertData): Promise<EmergencyAlert>`
  - `getAllAlerts(): Promise<EmergencyAlert[]>`
  - `acknowledgeAlert(alertId: number, userId: number): Promise<void>`
  - `resolveAlert(alertId: number, userId: number): Promise<void>`

- `DispatchMetricsRepository`:
  - `getDispatchMetrics(): Promise<DispatchMetrics>`

Make sure to implement these methods in their respective repository classes, and ensure that the `container` is properly configured to resolve these repository instances.