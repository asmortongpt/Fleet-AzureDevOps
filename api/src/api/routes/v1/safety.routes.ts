import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/v1/drivers/:driverId/safety-score
router.get('/drivers/:driverId/safety-score', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const scoreService = req.container.resolve('driverSafetyScoreService');
    const score = await scoreService.getLatestScore(driverId);

    if (!score) {
      return res.status(404).json({ error: 'No safety score found' });
    }

    res.json({
      data: {
        driverId: score.driverId,
        score: score.score,
        grade: score.getGrade(),
        riskLevel: score.getRiskLevel(),
        totalEvents: score.totalEvents,
        periodStart: score.periodStart,
        periodEnd: score.periodEnd
      }
    });
  } catch (error) {
    req.log.error('Error fetching safety score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/v1/drivers/:driverId/behavior-events
router.get('/drivers/:driverId/behavior-events', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.params;
    const { start, end } = req.query;
    const service = req.container.resolve('driverBehaviorEventService');

    const startDate = start ? new Date(start as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = end ? new Date(end as string) : new Date();

    const events = await service.getDriverEvents(driverId, startDate, endDate);

    res.json({
      data: events.map((e: any) => ({
        id: e.id,
        eventType: e.eventType,
        severity: e.severity,
        value: Number(e.value),
        timestamp: e.timestamp
      }))
    });
  } catch (error) {
    req.log.error('Error fetching behavior events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
