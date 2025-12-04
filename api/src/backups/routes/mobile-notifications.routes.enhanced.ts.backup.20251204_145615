import express, { Request, Response } from 'express';
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { z } from 'zod';
import { authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { pushNotificationService } from '../services/push-notification.service';
import { asyncHandler } from '../utils/asyncHandler';
import { validateRequest } from '../middleware/validateRequest';

const router = express.Router();

const registerDeviceSchema = z.object({
  deviceToken: z.string(),
  platform: z.enum(['ios', 'android']),
  deviceName: z.string().optional(),
  deviceModel: z.string().optional(),
  osVersion: z.string().optional(),
  appVersion: z.string().optional(),
});

const sendNotificationSchema = z.object({
  recipients: z.array(z.string()),
  notificationType: z.string(),
  category: z.string().optional(),
  priority: z.string().optional(),
  title: z.string(),
  message: z.string(),
  dataPayload: z.record(z.any()).optional(),
  actionButtons: z.array(z.any()).optional(),
  imageUrl: z.string().optional(),
});

router.post(
  '/register-device',
  authenticateJWT,
  validateRequest(registerDeviceSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      deviceToken,
      platform,
      deviceName,
      deviceModel,
      osVersion,
      appVersion,
    } = req.body;

    const device = await pushNotificationService.registerDevice({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      deviceToken,
      platform,
      deviceName,
      deviceModel,
      osVersion,
      appVersion,
    });

    res.json({
      success: true,
      data: device,
      message: 'Device registered successfully',
    });
  }))
);

router.delete(
  '/device/:deviceId',
  authenticateJWT,
  asyncHandler(async (req: Request, res: Response) => {
    const { deviceId } = req.params;

    const success = await pushNotificationService.unregisterDevice(deviceId);

    res.json({
      success,
      message: success ? 'Device unregistered successfully' : 'Failed to unregister device',
    });
  }))
);

router.post(
  '/send',
  authenticateJWT,
  requirePermission('communication:send:global'),
  validateRequest(sendNotificationSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const {
      recipients,
      notificationType,
      category,
      priority,
      title,
      message,
      dataPayload,
      actionButtons,
      imageUrl,
    } = req.body;

    const result = await pushNotificationService.sendNotification({
      recipients,
      notificationType,
      category,
      priority,
      title,
      message,
      dataPayload,
      actionButtons,
      imageUrl,
    });

    res.json({
      success: true,
      data: result,
      message: 'Notification sent successfully',
    });
  }))
);

export { router as mobileNotificationsRouter };