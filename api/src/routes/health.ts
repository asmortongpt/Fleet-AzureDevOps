import { Router, Request, Response } from 'express'

import { cacheService } from '../config/cache'
import { pool } from '../db'


const router = Router()

router.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: 'unknown',
      cache: 'unknown',
      memory: 'unknown',
    },
  }

  // Database check (critical - must pass for healthy status)
  try {
    await pool.query('SELECT 1')
    health.checks.database = 'healthy'
  } catch (err) {
    health.checks.database = 'unhealthy'
    health.status = 'degraded'
  }

  // Cache check (non-critical - failure doesn't affect status)
  try {
    // Test cache by setting and getting a value
    await cacheService.set('health-check-test', 'ok', 10)
    const result = await cacheService.get('health-check-test')
    health.checks.cache = result ? 'healthy' : 'warning'
  } catch (err) {
    // Cache failure is non-critical - system can operate without it
    health.checks.cache = 'warning'
  }

  // Memory check
  const used = process.memoryUsage()
  health.checks.memory = used.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning'

  // Return 200 if database is healthy (cache/memory warnings don't degrade status)
  res.status(health.status === 'healthy' ? 200 : 503).json(health)
})

router.get('/ready', async (req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1')
    res.status(200).json({ ready: true })
  } catch (err) {
    res.status(503).json({ ready: false })
  }
})

export default router
