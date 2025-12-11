Thank you for providing the refactored code. I'll review it and make any necessary adjustments to ensure it meets the requirements and follows best practices. Here's the final version of the `video-events.enhanced.ts` file:


import express, { Response } from 'express';
import { container } from '../container';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../errors/app-error';
import { AuthRequest, authenticateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';
import { auditLog } from '../middleware/audit';
import { rateLimit } from '../middleware/rateLimit';
import { z } from 'zod';
import { VideoEventSchema, VideoEventUpdateSchema } from '../models/VideoEvent';
import { errorHandler } from '../middleware/errorHandler';
import { csrfProtection } from '../middleware/csrf';

// Import necessary repositories
import { VideoEventRepository } from '../repositories/VideoEventRepository';

const router = express.Router();
router.use(authenticateJWT);
router.use(rateLimit(100, 60000)); // Updated rate limit as per requirements

// Video Event Schema for validation
const videoEventSchema = z.object({
  tenant_id: z.number(),
  vehicle_id: z.number(),
  driver_id: z.number(),
  event_type: z.string(),
  event_date: z.date(),
  video_url: z.string().url(),
  thumbnail_url: z.string().url(),
  duration: z.number(),
  severity: z.number(),
  notes: z.string().optional(),
});

// GET /video-events
router.get(
  '/',
  requirePermission('video_event:view:global'),
  auditLog({ action: 'READ', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page = 1, limit = 50 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const [data, total] = await Promise.all([
        VideoEventRepository.getVideoEvents(req.user!.tenant_id, Number(limit), offset),
        VideoEventRepository.countVideoEvents(req.user!.tenant_id)
      ]);

      res.json({
        data,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      errorHandler(error, res);
    }
  }
);

// GET /video-events/:id
router.get(
  '/:id',
  requirePermission('video_event:view:global'),
  auditLog({ action: 'READ', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const videoEvent = await VideoEventRepository.getVideoEventById(req.params.id, req.user!.tenant_id);
      if (!videoEvent) {
        return res.status(404).json({ error: 'VideoEvent not found' });
      }
      res.json(videoEvent);
    } catch (error) {
      errorHandler(error, res);
    }
  }
);

// POST /video-events
router.post(
  '/',
  csrfProtection,
  requirePermission('video_event:create:global'),
  auditLog({ action: 'CREATE', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = videoEventSchema.parse(req.body);
      const newVideoEvent = await VideoEventRepository.createVideoEvent(data);
      res.status(201).json(newVideoEvent);
    } catch (error) {
      errorHandler(error, res);
    }
  }
);

// PUT /video-events/:id
router.put(
  '/:id',
  csrfProtection,
  requirePermission('video_event:update:global'),
  auditLog({ action: 'UPDATE', resourceType: 'video_events' }),
  async (req: AuthRequest, res: Response) => {
    try {
      const updateData = VideoEventUpdateSchema.parse(req.body);
      const updatedVideoEvent = await VideoEventRepository.updateVideoEvent(req.params.id, updateData, req.user!.tenant_id);
      if (!updatedVideoEvent) {
        throw new NotFoundError("VideoEvent not found or no update made");
      }
      res.json(updatedVideoEvent);
    } catch (error) {
      errorHandler(error, res);
    }
  }
);

export default router;


This final version of the code meets all the requirements:

1. All direct database queries have been eliminated and replaced with repository methods.
2. The `VideoEventRepository` is imported and used throughout the file.
3. The structure and functionality of the original code are maintained.
4. Error handling and middleware usage remain unchanged.
5. The inline repository methods have been removed as they should be implemented in the actual `VideoEventRepository` file.

Note that the implementation of the repository methods in `VideoEventRepository` is not included here, as it was not part of the original request. Those methods should be properly implemented in their respective file to handle the actual database operations.

This refactored version of `video-events.enhanced.ts` is now fully compliant with the requirement to eliminate all direct database queries and use repository methods instead.