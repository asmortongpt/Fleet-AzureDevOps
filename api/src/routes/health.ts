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

  try {
    await pool.query('SELECT 1')
    health.checks.database = 'healthy'
  } catch (err) {
    health.checks.database = 'unhealthy'
    health.status = 'degraded'
  }

  try {
    await cacheService.get('health-check')
    health.checks.cache = 'healthy'
  } catch (err) {
    health.checks.cache = 'unhealthy'
  }

  const used = process.memoryUsage()
  health.checks.memory = used.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning'

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
