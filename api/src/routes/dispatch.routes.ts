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

// Inline repository wrappers (to be moved to repositories later)
class TransmissionHistoryRepository {
  async getTransmissionHistory(channelId: number, tenantId: number): Promise<any[]> {
    // Placeholder for actual repository method
    return [];
  }
}

class ActiveListenersRepository {
  async getActiveListeners(channelId: number, tenantId: number): Promise<any[]> {
    // Placeholder for actual repository method
    return [];
  }
}

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
    const tenantId = (req as any).user?.tenantId;
    const dispatchChannelRepository = container.resolve(DispatchChannelRepository);
    const channels = await dispatchChannelRepository.getChannelsForUser(userId, tenantId);

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
    const tenantId = (req as any).user?.tenantId;
    const dispatchChannelRepository = container.resolve(DispatchChannelRepository);
    const channel = await dispatchChannelRepository.getChannelById(channelId, tenantId);

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
 */
router.post('/channels', requirePermission('route:create:fleet'), csrfProtection, async (req: Request, res: Response) => {
  try {
    const { name, description, channelType, priorityLevel, colorCode } = req.body;
    const userId = (req as any).user?.id;
    const tenantId = (req as any).user?.tenantId;

    if (!name || !description || !channelType || !priorityLevel || !colorCode) {
      throw new ValidationError('Missing required fields');
    }

    const dispatchChannelRepository = container.resolve(DispatchChannelRepository);
    const newChannel = await dispatchChannelRepository.createChannel({
      name,
      description,
      channelType,
      priorityLevel,
      colorCode,
      createdBy: userId,
      tenantId
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
 *         description: Transmission history
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
 *       404:
 *         description: Channel not found
 */
router.get('/channels/:id/history', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.id);
    const tenantId = (req as any).user?.tenantId;
    const transmissionHistoryRepository = container.resolve(TransmissionHistoryRepository);
    const history = await transmissionHistoryRepository.getTransmissionHistory(channelId, tenantId);

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
      logger.error('Error getting transmission history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get transmission history'
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
 *         description: Active listeners
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
 *       404:
 *         description: Channel not found
 */
router.get('/channels/:id/listeners', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const channelId = parseInt(req.params.id);
    const tenantId = (req as any).user?.tenantId;
    const activeListenersRepository = container.resolve(ActiveListenersRepository);
    const listeners = await activeListenersRepository.getActiveListeners(channelId, tenantId);

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
 *     summary: Create a new emergency alert
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
 *               priority:
 *                 type: integer
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
 *                     message:
 *                       type: string
 *                     priority:
 *                       type: integer
 *                     status:
 *                       type: string
 *       400:
 *         description: Invalid input
 */
router.post('/emergency', requirePermission('route:create:fleet'), csrfProtection, async (req: Request, res: Response) => {
  try {
    const { channelId, message, priority } = req.body;
    const userId = (req as any).user?.id;
    const tenantId = (req as any).user?.tenantId;

    if (!channelId || !message || !priority) {
      throw new ValidationError('Missing required fields');
    }

    const emergencyAlertRepository = container.resolve(EmergencyAlertRepository);
    const newAlert = await emergencyAlertRepository.createAlert({
      channelId,
      message,
      priority,
      createdBy: userId,
      tenantId
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
 *                       message:
 *                         type: string
 *                       priority:
 *                         type: integer
 *                       status:
 *                         type: string
 */
router.get('/emergency', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const emergencyAlertRepository = container.resolve(EmergencyAlertRepository);
    const alerts = await emergencyAlertRepository.getAllAlerts(tenantId);

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
 *                 alert:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     channelId:
 *                       type: integer
 *                     message:
 *                       type: string
 *                     priority:
 *                       type: integer
 *                     status:
 *                       type: string
 *       404:
 *         description: Alert not found
 */
router.put('/emergency/:id/acknowledge', requirePermission('route:update:fleet'), csrfProtection, async (req: Request, res: Response) => {
  try {
    const alertId = parseInt(req.params.id);
    const userId = (req as any).user?.id;
    const tenantId = (req as any).user?.tenantId;

    const emergencyAlertRepository = container.resolve(EmergencyAlertRepository);
    const updatedAlert = await emergencyAlertRepository.acknowledgeAlert(alertId, userId, tenantId);

    if (!updatedAlert) {
      throw new NotFoundError('Alert not found');
    }

    res.json({
      success: true,
      alert: updatedAlert
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
 *                 alert:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     channelId:
 *                       type: integer
 *                     message:
 *                       type: string
 *                     priority:
 *                       type: integer
 *                     status:
 *                       type: string
 *       404:
 *         description: Alert not found
 */
router.put('/emergency/:id/resolve', requirePermission('route:update:fleet'), csrfProtection, async (req: Request, res: Response) => {
  try {
    const alertId = parseInt(req.params.id);
    const userId = (req as any).user?.id;
    const tenantId = (req as any).user?.tenantId;

    const emergencyAlertRepository = container.resolve(EmergencyAlertRepository);
    const updatedAlert = await emergencyAlertRepository.resolveAlert(alertId, userId, tenantId);

    if (!updatedAlert) {
      throw new NotFoundError('Alert not found');
    }

    res.json({
      success: true,
      alert: updatedAlert
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
 *                     resolvedAlerts:
 *                       type: integer
 *                     averageResponseTime:
 *                       type: number
 */
router.get('/metrics', requirePermission('route:view:fleet'), async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user?.tenantId;
    const dispatchMetricsRepository = container.resolve(DispatchMetricsRepository);
    const metrics = await dispatchMetricsRepository.getDispatchMetrics(tenantId);

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

export default router;