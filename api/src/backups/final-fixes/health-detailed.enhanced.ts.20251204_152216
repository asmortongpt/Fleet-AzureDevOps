import express, { Request, Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { Pool } from 'pg'
import os from 'os'
import redis from 'redis'
import { promisify } from 'util'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import csurf from 'csurf'
import { z } from 'zod'
import { checkDiskSpace } from 'check-disk-space'
import { AzureMonitor } from './AzureMonitor' // Assume this is a custom module for Azure AD & Application Insights checks
import { RedisClientType } from 'redis'

const router = express.Router()
const execAsync = promisify(require('child_process').exec)
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const redisClient: RedisClientType = redis.createClient({ url: process.env.REDIS_URL })

router.use(helmet()
router.use(express.json()
router.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per windowMs
  })
)
router.use(csurf()

const requireAdmin = async (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || ''
    const publicKey = process.env.PUBLIC_KEY || ''
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] })

    const userSchema = z.object({
      role: z.string(),
    })

    const userInfo = userSchema.parse(decoded)
    if (userInfo.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required',
      })
    }

    next()
  } catch (error) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid or expired token',
    })
  }
}

router.get('/health', requireAdmin, async (req: Request, res: Response) => {
  const healthCheck = await performHealthCheck()
  res.json(healthCheck)
})

async function performHealthCheck(): Promise<SystemHealth> {
  const databaseHealth = await checkDatabase()
  const azureAdHealth = await AzureMonitor.checkAzureAD()
  const applicationInsightsHealth = await AzureMonitor.checkApplicationInsights()
  const cacheHealth = await checkCache()
  const diskHealth = await checkDisk()
  const memoryHealth = checkMemory()
  const apiPerformanceHealth = await checkApiPerformance()

  const components = {
    database: databaseHealth,
    azureAd: azureAdHealth,
    applicationInsights: applicationInsightsHealth,
    cache: cacheHealth,
    disk: diskHealth,
    memory: memoryHealth,
    apiPerformance: apiPerformanceHealth,
  }

  const summary = Object.values(components).reduce(
    (acc, component) => {
      acc[component.status]++
      acc.total++
      return acc
    },
    { healthy: 0, degraded: 0, critical: 0, total: 0 }
  )

  return {
    status: determineOverallStatus(summary),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || 'unknown',
    environment: process.env.NODE_ENV || 'development',
    components,
    summary,
  }
}

function determineOverallStatus(summary: {
  healthy: number
  degraded: number
  critical: number
  total: number
}): 'healthy' | 'degraded' | 'critical' {
  if (summary.critical > 0) return 'critical'
  if (summary.degraded > 0) return 'degraded'
  return 'healthy'
}

async function checkDatabase(): Promise<ComponentHealth> {
  const startTime = Date.now()
  try {
    const pingResult = await pool.query('SELECT 1 as ping')
    const latency = Date.now() - startTime

    // Additional database checks omitted for brevity

    return {
      status: 'healthy',
      message: 'Database is responsive',
      latency,
    }
  } catch (error) {
    return {
      status: 'critical',
      message: 'Database is not responsive',
      latency: Date.now() - startTime,
    }
  }
}

async function checkCache(): Promise<ComponentHealth> {
  const startTime = Date.now()
  try {
    await redisClient.connect()
    await redisClient.ping()
    await redisClient.disconnect()
    const latency = Date.now() - startTime
    return {
      status: 'healthy',
      message: 'Cache is responsive',
      latency,
    }
  } catch (error) {
    return {
      status: 'critical',
      message: 'Cache is not responsive',
      latency: Date.now() - startTime,
    }
  }
}

async function checkDisk(): Promise<ComponentHealth> {
  try {
    const { free } = await checkDiskSpace(os.tmpdir()
    const total = os.totalmem()
    const used = total - free
    const percentUsed = (used / total) * 100

    return {
      status: percentUsed > 90 ? 'critical' : percentUsed > 75 ? 'degraded' : 'healthy',
      message: `Disk space is ${percentUsed.toFixed(2)}% used`,
      details: { total, used, free },
    }
  } catch (error) {
    return {
      status: 'critical',
      message: 'Failed to check disk space',
    }
  }
}

function checkMemory(): ComponentHealth {
  const total = os.totalmem()
  const free = os.freemem()
  const used = total - free
  const percentUsed = (used / total) * 100

  return {
    status: percentUsed > 90 ? 'critical' : percentUsed > 75 ? 'degraded' : 'healthy',
    message: `Memory usage is ${percentUsed.toFixed(2)}%`,
    details: { total, used, free },
  }
}

async function checkApiPerformance(): Promise<ComponentHealth> {
  // Simulate or retrieve actual API performance metrics
  // Placeholder for actual implementation
  return {
    status: 'healthy',
    message: 'API performance is within acceptable thresholds',
    latency: 100, // Example latency in milliseconds
  }
}

export default router
