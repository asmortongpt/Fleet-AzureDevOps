import { Router, Request, Response } from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/errorHandler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import { EmulatorOrchestrator } from '../emulators/EmulatorOrchestrator'
import os from 'os'
import { performance } from 'perf_hooks'
import { csrfProtection } from '../middleware/csrf'


const router = Router()

// Track server start time for uptime calculation
const serverStartTime = Date.now()

// In-memory storage for metrics (in production, use Redis or similar)
const metricsStore = {
  requests: new Map<string, any[]>(),
  errors: [] as any[],
  alerts: [] as any[],
}

// Middleware to track request metrics
const trackMetrics = (req: Request, res: Response, next: Function) => {
  const startTime = performance.now()
  const endpoint = `${req.method} ${req.path}`

  // Store original end function
  const originalEnd = res.end

  // Override end function to capture metrics
  res.end = function (...args: any[]) {
    const responseTime = performance.now() - startTime

    // Store metric
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

    // Keep only last 1000 metrics per endpoint
    if (metrics.length > 1000) {
      metrics.shift()
    }

    // Track errors
    if (res.statusCode >= 400) {
      metricsStore.errors.push({
        id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        endpoint,
        type: res.statusCode >= 500 ? 'ServerError' : 'ClientError',
        message: `HTTP ${res.statusCode} on ${endpoint}`,
        timestamp: Date.now(),
        statusCode: res.statusCode,
        userId: (req as any).user?.id,
      })

      // Keep only last 1000 errors
      if (metricsStore.errors.length > 1000) {
        metricsStore.errors.shift()
      }
    }

    // Call original end
    return originalEnd.apply(this, args as any)
  }

  next()
}

// Apply metrics tracking to all monitoring routes
router.use(trackMetrics)

/**
 * GET /api/monitoring/health
 * System health check endpoint
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const uptime = Math.floor((Date.now() - serverStartTime) / 1000)

    // Check emulator status
    const emulatorOrchestrator = EmulatorOrchestrator.getInstance()
    const emulatorStatus = emulatorOrchestrator.getStatus()

    // Check API health by measuring a simple operation
    const apiStartTime = performance.now()
    const testResult = await Promise.race([
      new Promise(resolve => setTimeout(() => resolve('ok'), 100)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000)),
    ])
    const apiResponseTime = performance.now() - apiStartTime

    // Determine overall health status
    let overallStatus: 'healthy' | 'degraded' | 'down' = 'healthy'

    if (apiResponseTime > 500) {
      overallStatus = 'degraded'
    }

    if (testResult !== 'ok' || emulatorStatus.activeEmulators === 0) {
      overallStatus = 'degraded'
    }

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
          status: 'healthy', // TODO: Implement actual DB health check
          connectionPool: 10, // TODO: Get actual connection pool size
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

/**
 * GET /api/monitoring/metrics
 * Performance metrics endpoint
 */
router.get('/metrics', (req: Request, res: Response) => {
  try {
    const now = Date.now()
    const oneHourAgo = now - 3600000

    // Calculate metrics for each endpoint
    const endpoints = Array.from(metricsStore.requests.entries())
      .map(([path, metrics]) => {
        const recentMetrics = metrics.filter(m => m.timestamp > oneHourAgo)

        if (recentMetrics.length === 0) {
          return null
        }

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

    // Calculate overall throughput
    const allRecentRequests = Array.from(metricsStore.requests.values())
      .flat()
      .filter(m => m.timestamp > oneHourAgo)

    const requestsPerMinute = allRecentRequests.length / 60
    const avgResponseTime =
      allRecentRequests.length > 0
        ? allRecentRequests.reduce((sum, m) => sum + m.responseTime, 0) / allRecentRequests.length
        : 0

    const metrics = {
      endpoints,
      throughput: {
        requestsPerMinute: Math.round(requestsPerMinute),
        requestsPerSecond: requestsPerMinute / 60,
        peakRPM: Math.round(requestsPerMinute * 1.5), // Simulated peak
        avgResponseTime: Math.round(avgResponseTime),
      },
      cache: {
        hitRate: 0.85, // Simulated cache hit rate
        missRate: 0.15,
        totalHits: Math.floor(Math.random() * 10000),
        totalMisses: Math.floor(Math.random() * 1500),
        avgLoadTime: Math.random() * 50,
      },
      database: {
        avgQueryTime: Math.random() * 100,
        slowQueries: Math.floor(Math.random() * 10),
        connectionPoolUsage: Math.random(),
        activeConnections: Math.floor(Math.random() * 20),
        maxConnections: 100,
      },
    }

    res.json(metrics)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch metrics',
    })
  }
})

/**
 * GET /api/monitoring/emulators
 * Emulator status endpoint
 */
router.get('/emulators', (req: Request, res: Response) => {
  try {
    const orchestrator = EmulatorOrchestrator.getInstance()
    const status = orchestrator.getStatus()

    // Mock emulator data for comprehensive monitoring
    const emulators = [
      {
        id: 'veh-emu-001',
        name: 'Vehicle Emulator',
        type: 'vehicle',
        status: status.activeEmulators > 0 ? 'running' : 'stopped',
        recordCount: status.totalRecordsGenerated,
        updateFrequency: 30,
        lastUpdate: new Date().toISOString(),
        memoryUsage: Math.random() * 100,
        cpuUsage: Math.random() * 100,
        errorCount: 0,
        config: {
          autoGenerate: true,
          batchSize: 10,
          interval: 30,
        },
      },
      {
        id: 'drv-emu-001',
        name: 'Driver Emulator',
        type: 'driver',
        status: status.activeEmulators > 0 ? 'running' : 'stopped',
        recordCount: Math.floor(status.totalRecordsGenerated * 0.8),
        updateFrequency: 60,
        lastUpdate: new Date(Date.now() - 30000).toISOString(),
        memoryUsage: Math.random() * 80,
        cpuUsage: Math.random() * 60,
        errorCount: 0,
        config: {
          autoGenerate: true,
          batchSize: 5,
          interval: 60,
        },
      },
      {
        id: 'fuel-emu-001',
        name: 'Fuel Transaction Emulator',
        type: 'fuel',
        status: status.activeEmulators > 0 ? 'running' : 'stopped',
        recordCount: Math.floor(status.totalRecordsGenerated * 0.3),
        updateFrequency: 120,
        lastUpdate: new Date(Date.now() - 60000).toISOString(),
        memoryUsage: Math.random() * 50,
        cpuUsage: Math.random() * 40,
        errorCount: 0,
        config: {
          autoGenerate: true,
          batchSize: 3,
          interval: 120,
        },
      },
      {
        id: 'maint-emu-001',
        name: 'Maintenance Emulator',
        type: 'maintenance',
        status: status.activeEmulators > 0 ? 'running' : 'stopped',
        recordCount: Math.floor(status.totalRecordsGenerated * 0.2),
        updateFrequency: 300,
        lastUpdate: new Date(Date.now() - 120000).toISOString(),
        memoryUsage: Math.random() * 40,
        cpuUsage: Math.random() * 30,
        errorCount: 0,
        config: {
          autoGenerate: true,
          batchSize: 2,
          interval: 300,
        },
      },
      {
        id: 'gps-emu-001',
        name: 'GPS Tracker Emulator',
        type: 'gps',
        status: 'paused',
        recordCount: Math.floor(status.totalRecordsGenerated * 0.5),
        updateFrequency: 10,
        lastUpdate: new Date(Date.now() - 300000).toISOString(),
        memoryUsage: Math.random() * 60,
        cpuUsage: 0,
        errorCount: 2,
        config: {
          autoGenerate: false,
          batchSize: 20,
          interval: 10,
        },
      },
      {
        id: 'route-emu-001',
        name: 'Route Optimizer Emulator',
        type: 'route',
        status: 'stopped',
        recordCount: Math.floor(status.totalRecordsGenerated * 0.1),
        updateFrequency: 180,
        lastUpdate: new Date(Date.now() - 600000).toISOString(),
        memoryUsage: 0,
        cpuUsage: 0,
        errorCount: 0,
        config: {
          autoGenerate: false,
          batchSize: 1,
          interval: 180,
        },
      },
      {
        id: 'cost-emu-001',
        name: 'Cost Calculator Emulator',
        type: 'cost',
        status: 'error',
        recordCount: 0,
        updateFrequency: 240,
        lastUpdate: new Date(Date.now() - 900000).toISOString(),
        memoryUsage: 0,
        cpuUsage: 0,
        errorCount: 5,
        config: {
          autoGenerate: false,
          batchSize: 5,
          interval: 240,
        },
      },
    ]

    const activeEmulators = emulators.filter(e => e.status === 'running')
    const totalMemory = emulators.reduce((sum, e) => sum + (e.memoryUsage || 0), 0)
    const totalRecords = emulators.reduce((sum, e) => sum + e.recordCount, 0)
    const avgUpdateFrequency =
      activeEmulators.length > 0
        ? activeEmulators.reduce((sum, e) => sum + e.updateFrequency, 0) / activeEmulators.length
        : 0
    const errorRate =
      emulators.length > 0
        ? (emulators.reduce((sum, e) => sum + e.errorCount, 0) / emulators.length) * 10
        : 0

    res.json({
      active: activeEmulators,
      inactive: emulators.filter(e => e.status !== 'running'),
      statistics: {
        totalRecords,
        totalMemory: Math.round(totalMemory),
        avgUpdateFrequency: Math.round(avgUpdateFrequency),
        errorRate,
      },
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch emulator status',
    })
  }
})

/**
 * GET /api/monitoring/errors
 * Recent errors endpoint
 */
router.get('/errors', (req: Request, res: Response) => {
  try {
    // Return last 100 errors
    const recentErrors = metricsStore.errors.slice(-100).reverse()
    res.json(recentErrors)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch errors',
    })
  }
})

/**
 * GET /api/monitoring/alerts
 * Active alerts endpoint
 */
router.get('/alerts', (req: Request, res: Response) => {
  try {
    // Generate sample alerts based on current system state
    const alerts = []
    const now = new Date()

    // Check for high error rate
    const recentErrors = metricsStore.errors.filter(e => e.timestamp > Date.now() - 300000)
    if (recentErrors.length > 10) {
      alerts.push({
        id: 'alert-error-rate',
        type: 'system',
        severity: 'warning',
        status: 'active',
        title: 'High Error Rate Detected',
        message: `${recentErrors.length} errors in the last 5 minutes`,
        timestamp: now.toISOString(),
        source: 'Monitoring System',
        actionRequired: true,
      })
    }

    // Sample maintenance alerts
    alerts.push({
      id: 'alert-maint-001',
      type: 'maintenance',
      severity: 'warning',
      status: 'active',
      title: 'Scheduled Maintenance Due',
      message: 'Vehicle FL-2024 is due for scheduled maintenance in 3 days',
      timestamp: new Date(now.getTime() - 3600000).toISOString(),
      source: 'Maintenance System',
      vehicleId: 'FL-2024',
      threshold: 30,
      actual: 3,
      metadata: {
        lastService: '2024-10-15',
        mileage: 45000,
        serviceType: 'Oil Change',
      },
    })

    // Sample budget alert
    alerts.push({
      id: 'alert-budget-001',
      type: 'budget',
      severity: 'info',
      status: 'active',
      title: 'Budget Threshold Approaching',
      message: 'Fuel expenses are at 85% of monthly budget',
      timestamp: new Date(now.getTime() - 7200000).toISOString(),
      source: 'Budget Monitor',
      threshold: 10000,
      actual: 8500,
      metadata: {
        category: 'Fuel',
        month: 'November',
        projection: 11000,
      },
    })

    // Sample geofencing alert
    alerts.push({
      id: 'alert-geo-001',
      type: 'geofencing',
      severity: 'error',
      status: 'active',
      title: 'Vehicle Outside Authorized Zone',
      message: 'Vehicle FL-1022 has exited the authorized operating zone',
      timestamp: new Date(now.getTime() - 600000).toISOString(),
      source: 'GPS Tracking',
      vehicleId: 'FL-1022',
      driverId: 'DRV-445',
      actionRequired: true,
      metadata: {
        location: { lat: 26.1224, lng: -80.1373 },
        zone: 'Downtown District',
        exitTime: new Date(now.getTime() - 600000).toISOString(),
      },
    })

    // Sample license expiration alert
    alerts.push({
      id: 'alert-lic-001',
      type: 'license',
      severity: 'critical',
      status: 'active',
      title: 'Driver License Expiring',
      message: "Driver John Smith's license expires in 7 days",
      timestamp: new Date(now.getTime() - 1800000).toISOString(),
      source: 'Compliance System',
      driverId: 'DRV-123',
      threshold: 30,
      actual: 7,
      actionRequired: true,
      metadata: {
        driverName: 'John Smith',
        licenseNumber: 'D123-4567-8901',
        expirationDate: new Date(now.getTime() + 604800000).toISOString(),
      },
    })

    // Add some resolved alerts for filtering demonstration
    alerts.push({
      id: 'alert-resolved-001',
      type: 'fuel',
      severity: 'warning',
      status: 'resolved',
      title: 'Low Fuel Alert',
      message: 'Vehicle FL-3001 fuel level below 20%',
      timestamp: new Date(now.getTime() - 10800000).toISOString(),
      source: 'Fuel Monitor',
      vehicleId: 'FL-3001',
    })

    res.json(alerts)
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch alerts',
    })
  }
})

export default router
