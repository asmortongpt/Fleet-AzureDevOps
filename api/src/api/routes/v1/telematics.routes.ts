import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

const positionHistoryQuerySchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(1000).default(100)
});

// GET /api/v1/assets/:assetId/location
router.get('/assets/:assetId/location', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    const repository = req.container.resolve('telematicsRepository');
    const location = await repository.getLatestLocation(assetId);

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    res.json({
      data: {
        assetId: location.assetId,
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        speed: location.speed ? Number(location.speed) : null,
        heading: location.heading ? Number(location.heading) : null,
        timestamp: location.timestamp
      }
    });
  } catch (error) {
    req.log.error('Error fetching location:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/assets/:assetId/position-history
router.get('/assets/:assetId/position-history', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.params;
    const query = positionHistoryQuerySchema.parse(req.query);
    const repository = req.container.resolve('telematicsRepository');

    const startDate = query.start ? new Date(query.start) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = query.end ? new Date(query.end) : new Date();

    const result = await repository.getPositionHistory(assetId, startDate, endDate, query.page, query.limit);

    res.json({
      data: result.events.map((e: any) => ({
        id: e.id,
        assetId: e.assetId,
        latitude: Number(e.latitude),
        longitude: Number(e.longitude),
        speed: e.speed ? Number(e.speed) : null,
        timestamp: e.timestamp
      })),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total
      }
    });
  } catch (error) {
    req.log.error('Error fetching position history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
