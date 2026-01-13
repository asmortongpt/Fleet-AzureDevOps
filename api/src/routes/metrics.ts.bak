import { Router, Request, Response } from 'express'

import { pool } from '../db'


const router = Router()
let requestCount = 0
const errorCount = 0

router.use((req, res, next) => {
  requestCount++
  next()
})

router.get('/metrics', async (req: Request, res: Response) => {
  const dbStats = await pool.query('SELECT COUNT(*) as total FROM vehicles')

  const metrics = {
    requests: {
      total: requestCount,
      errors: errorCount,
    },
    database: {
      vehicles: parseInt(dbStats.rows[0].total),
      connections: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
      },
    },
    process: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
  }

  res.json(metrics)
})

export { requestCount, errorCount }
export default router
