import { Router, Request, Response } from 'express';
import { HealthRepository } from '../repositories/health.repository';
import { CacheRepository } from '../repositories/cache.repository';

const router = Router();

const healthRepository = new HealthRepository();
const cacheRepository = new CacheRepository();

router.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      cache: 'unknown',
      memory: 'unknown',
    },
  };

  try {
    await healthRepository.checkDatabaseConnection();
    health.checks.database = 'healthy';
  } catch (err) {
    health.checks.database = 'unhealthy';
    health.status = 'degraded';
  }

  try {
    await cacheRepository.checkCacheHealth();
    health.checks.cache = 'healthy';
  } catch (err) {
    health.checks.cache = 'unhealthy';
  }

  const used = process.memoryUsage();
  health.checks.memory = used.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning';

  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

router.get('/ready', async (req: Request, res: Response) => {
  try {
    await healthRepository.checkDatabaseConnection();
    res.status(200).json({ ready: true });
  } catch (err) {
    res.status(503).json({ ready: false });
  }
});

export default router;