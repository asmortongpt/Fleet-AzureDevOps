import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/v1/analytics/costs/cpm
router.get('/analytics/costs/cpm', async (req: Request, res: Response) => {
  try {
    const { assetId, start, end } = req.query;

    if (!assetId) {
      return res.status(400).json({ error: 'assetId is required' });
    }

    const costService = req.container.resolve('costAnalyticsService');
    const startDate = start ? new Date(start as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end as string) : new Date();

    const snapshot = await costService.computeSnapshot(assetId as string, startDate, endDate);

    res.json({
      data: {
        assetId: snapshot.assetId,
        cpm: Number(snapshot.cpm),
        totalCost: Number(snapshot.totalCost),
        milesDriven: Number(snapshot.milesDriven),
        breakdown: snapshot.breakdown,
        periodStart: snapshot.periodStart,
        periodEnd: snapshot.periodEnd
      }
    });
  } catch (error) {
    req.log.error('Error computing CPM:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/analytics/costs/tco
router.get('/analytics/costs/tco', async (req: Request, res: Response) => {
  try {
    const { assetId } = req.query;

    if (!assetId) {
      return res.status(400).json({ error: 'assetId is required' });
    }

    const costService = req.container.resolve('costAnalyticsService');
    const tco = await costService.computeTCO(assetId as string);

    res.json({ data: tco });
  } catch (error) {
    req.log.error('Error computing TCO:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
