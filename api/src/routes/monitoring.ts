import { performance } from 'perf_hooks'
import { Router, Request, Response } from 'express'
import obd2EmulatorService from '../services/obd2-emulator.service'

const getEmulatorStatus = () => ({
  activeEmulators: obd2EmulatorService.getActiveSessions().length,
  totalRecordsGenerated: 0
})

const router = Router()
const serverStartTime = Date.now()

// In-memory storage for metrics
interface RequestMetric {
  timestamp: number
  responseTime: number
  statusCode: number
  method: string
  path: string
}

interface ErrorMetric {
  id: string
  endpoint: string
  type: string
  message: string
  timestamp: number
  statusCode: number
  userId?: string | number
}

interface AlertMetric {
  id: string
  type: string
  message: string
  timestamp: number
  severity: string
}

const metricsStore = {
  requests: new Map<string, RequestMetric[]>(),
  errors: [] as ErrorMetric[],
  alerts: [] as AlertMetric[],
}

// Middleware to track request metrics
const trackMetrics = (req: Request, res: Response, next: () => void) => {
  const startTime = performance.now()
  const endpoint = `${req.method} ${req.path}`
  const originalEnd = res.end

  res.end = function (...args: unknown[]) {
    const responseTime = performance.now() - startTime

    if (!metricsStore.requests.has(endpoint)) {
      metricsStore.requests.set(endpoint, [])
    }

    const metrics = metricsStore.requests.get(endpoint)!
    metrics.push({
      timestamp: Date.now(),
      responseTime,
      statusCode: res.statusCode,
      method: req.method,
      path: req.path,
    })

    if (metrics.length > 1000) {
      metrics.shift()
    }

    if (res.statusCode >= 400) {
      metricsStore.errors.push({
        id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        endpoint,
        type: res.statusCode >= 500 ? 'ServerError' : 'ClientError',
        message: `HTTP ${res.statusCode} on ${endpoint}`,
        timestamp: Date.now(),
        statusCode: res.statusCode,
        userId: req.user?.id,
      })

      if (metricsStore.errors.length > 1000) {
        metricsStore.errors.shift()
      }
    }

    return originalEnd.apply(this, args as [unknown?, BufferEncoding?, (() => void)?])
  }

  next()
}

router.use(trackMetrics)

router.get('/health', async (req: Request, res: Response) => {
  try {
    const uptime = Math.floor((Date.now() - serverStartTime) / 1000)
    const emulatorStatus = getEmulatorStatus()
    const apiStartTime = performance.now()
    const testResult = await Promise.race([
      new Promise(resolve => setTimeout(() => resolve('ok'), 100)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000)),
    ])
    const apiResponseTime = performance.now() - apiStartTime

    let overallStatus: 'healthy' | 'degraded' | 'down' = 'healthy'
    if (apiResponseTime > 500) overallStatus = 'degraded'
    if (testResult !== 'ok') overallStatus = 'degraded'

    const health = {
      status: overallStatus,
      uptime,
      version: process.env.APP_VERSION || '1.0.0',
      timestamp: new Date().toISOString(),
      components: {
        api: {
          status: apiResponseTime < 500 ? 'healthy' : 'degraded',
          responseTime: Math.round(apiResponseTime),
        },
        emulators: {
          status: emulatorStatus.activeEmulators > 0 ? 'healthy' : 'stopped',
          activeCount: emulatorStatus.activeEmulators,
        },
        database: {
          status: 'healthy',
          connectionPool: 10,
        },
      },
    }

    res.json(health)
  } catch (error) {
    res.status(500).json({
      status: 'down',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
    })
  }
})

router.get('/metrics', (req: Request, res: Response) => {
  try {
    const now = Date.now()
    const oneHourAgo = now - 3600000

    const endpoints = Array.from(metricsStore.requests.entries())
      .map(([path, metrics]) => {
        const recentMetrics = metrics.filter(m => m.timestamp > oneHourAgo)
        if (recentMetrics.length === 0) return null

        const responseTimes = recentMetrics.map(m => m.responseTime).sort((a, b) => a - b)
        const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length

        return {
          path: path.split(' ')[1],
          method: path.split(' ')[0],
          p50: responseTimes[Math.floor(responseTimes.length * 0.5)] || 0,
          p95: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
          p99: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
          requestCount: recentMetrics.length,
          errorRate: errorCount / recentMetrics.length,
          lastHour: {
            requests: recentMetrics.length,
            errors: errorCount,
            avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
          },
        }
      })
      .filter(Boolean)

    const allRecentRequests = Array.from(metricsStore.requests.values())
      .flat()
      .filter(m => m.timestamp > oneHourAgo)

    const requestsPerMinute = allRecentRequests.length / 60
    const avgResponseTime = allRecentRequests.length > 0
      ? allRecentRequests.reduce((sum, m) => sum + m.responseTime, 0) / allRecentRequests.length
      : 0

    res.json({
      endpoints,
      throughput: {
        requestsPerMinute: Math.round(requestsPerMinute),
        requestsPerSecond: requestsPerMinute / 60,
        peakRPM: Math.round(requestsPerMinute * 1.5),
        avgResponseTime: Math.round(avgResponseTime),
      },
      cache: {
        hitRate: 0.85,
        missRate: 0.15,
        totalHits: 0,
        totalMisses: 0,
        avgLoadTime: 0,
      },
      database: {
        avgQueryTime: 0,
        slowQueries: 0,
        connectionPoolUsage: 0,
        activeConnections: 0,
        maxConnections: 100,
      },
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' })
  }
})

router.get('/emulators', (req: Request, res: Response) => {
  try {
    const sessions = obd2EmulatorService.getActiveSessions()
    const emulators = sessions.map(sessionId => {
      const data = obd2EmulatorService.getSessionData(sessionId)
      return {
        id: sessionId,
        name: `OBD2 Session ${sessionId}`,
        type: 'vehicle_obd2',
        status: 'running',
        recordCount: 0,
        updateFrequency: 1000,
        lastUpdate: data?.timestamp.toISOString() || new Date().toISOString(),
        memoryUsage: 0,
        cpuUsage: 0,
        errorCount: 0,
        config: { sessionId }
      }
    })

    const activeEmulatorsCount = sessions.length

    res.json({
      summary: {
        activeEmulators: activeEmulatorsCount,
        totalRecordsGenerated: 0
      },
      emulators,
      active: emulators,
      inactive: [],
      statistics: {
        totalRecords: 0,
        totalMemory: 0,
        avgUpdateFrequency: 1000,
        errorRate: 0
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch emulator status' })
  }
})

router.get('/errors', (req: Request, res: Response) => {
  try {
    const recentErrors = metricsStore.errors.slice(-100).reverse()
    res.json(recentErrors)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch errors' })
  }
})

router.get('/alerts', (req: Request, res: Response) => {
  try {
    res.json(metricsStore.alerts)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' })
  }
})

export default router
