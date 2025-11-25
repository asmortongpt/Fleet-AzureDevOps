/**
 * Performance Monitoring Routes
 *
 * Endpoints for monitoring database performance, connection pools,
 * worker threads, and query performance.
 */

import { Router, Request, Response } from 'express'
import { connectionManager } from '../config/connection-manager'
import { queryPerformanceService } from '../services/query-performance.service'
import { workerPool } from '../config/worker-pool'
import { authenticateJWT } from '../middleware/auth'
import { getErrorMessage } from '../utils/error-handler'

const router = Router()

/**
 * @route GET /api/performance/health
 * @desc Get overall system health
 * @access Private (Admin)
 */
router.get('/health', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const dbHealth = await connectionManager.getHealthStatus()
    const poolStats = connectionManager.getAllPoolStats()
    const queryStats = queryPerformanceService.getPerformanceSummary()
    const workerStats = workerPool.getStats()
    const replicaLag = await connectionManager.getReplicaLag()

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        health: dbHealth,
        pools: poolStats,
        replicaLag: replicaLag ? '${replicaLag}ms' : 'N/A'
      },
      queries: {
        summary: queryStats.summary,
        performance: queryStats.performance
      },
      workers: workerStats,
      system: {
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
          external: Math.round(process.memoryUsage().external / 1024 / 1024) + 'MB'
        },
        cpu: process.cpuUsage()
      }
    }

    res.json(health)
  } catch (error: any) {
    console.error('Error getting health status:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve health status',
      error: getErrorMessage(error)
    })
  }
})

/**
 * @route GET /api/performance/database/pools
 * @desc Get detailed pool diagnostics
 * @access Private (Admin)
 */
router.get('/database/pools', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const diagnostics = await connectionManager.getPoolDiagnostics()
    res.json(diagnostics)
  } catch (error: any) {
    console.error('Error getting pool diagnostics:', error)
    res.status(500).json({
      message: 'Failed to retrieve pool diagnostics',
      error: getErrorMessage(error)
    })
  }
})

/**
 * @route GET /api/performance/database/replica-lag
 * @desc Get read replica lag
 * @access Private (Admin)
 */
router.get('/database/replica-lag', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const lag = await connectionManager.getReplicaLag()

    res.json({
      replicaLag: lag,
      unit: 'milliseconds',
      status: lag === null ? 'no_replica' : lag < 1000 ? 'healthy' : lag < 5000 ? 'warning' : 'critical',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error getting replica lag:', error)
    res.status(500).json({
      message: 'Failed to retrieve replica lag',
      error: getErrorMessage(error)
    })
  }
})

/**
 * @route GET /api/performance/database/connection-leaks
 * @desc Detect connection leaks
 * @access Private (Admin)
 */
router.get('/database/connection-leaks', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const leaks = await connectionManager.detectConnectionLeaks()

    res.json({
      leaks,
      timestamp: new Date().toISOString(),
      hasLeaks: Object.keys(leaks).length > 0
    })
  } catch (error: any) {
    console.error('Error detecting connection leaks:', error)
    res.status(500).json({
      message: 'Failed to detect connection leaks',
      error: getErrorMessage(error)
    })
  }
})

/**
 * @route GET /api/performance/queries/stats
 * @desc Get query statistics
 * @access Private (Admin)
 */
router.get('/queries/stats', authenticateJWT, (req: Request, res: Response) => {
  try {
    const stats = queryPerformanceService.getQueryStats()
    res.json(stats)
  } catch (error: any) {
    console.error('Error getting query stats:', error)
    res.status(500).json({
      message: 'Failed to retrieve query statistics',
      error: getErrorMessage(error)
    })
  }
})

/**
 * @route GET /api/performance/queries/slow
 * @desc Get slow queries
 * @access Private (Admin)
 */
router.get('/queries/slow', authenticateJWT, (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20
    const slowQueries = queryPerformanceService.getSlowQueries(limit)

    res.json({
      slowQueries,
      count: slowQueries.length,
      threshold: process.env.SLOW_QUERY_THRESHOLD_MS || 1000
    })
  } catch (error: any) {
    console.error('Error getting slow queries:', error)
    res.status(500).json({
      message: 'Failed to retrieve slow queries',
      error: getErrorMessage(error)
    })
  }
})

/**
 * @route GET /api/performance/queries/recent
 * @desc Get recent queries
 * @access Private (Admin)
 */
router.get('/queries/recent', authenticateJWT, (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const recentQueries = queryPerformanceService.getRecentQueries(limit)

    res.json({
      queries: recentQueries,
      count: recentQueries.length
    })
  } catch (error: any) {
    console.error('Error getting recent queries:', error)
    res.status(500).json({
      message: 'Failed to retrieve recent queries',
      error: getErrorMessage(error)
    })
  }
})

/**
 * @route GET /api/performance/queries/summary
 * @desc Get performance summary
 * @access Private (Admin)
 */
router.get('/queries/summary', authenticateJWT, (req: Request, res: Response) => {
  try {
    const summary = queryPerformanceService.getPerformanceSummary()
    res.json(summary)
  } catch (error: any) {
    console.error('Error getting performance summary:', error)
    res.status(500).json({
      message: 'Failed to retrieve performance summary',
      error: getErrorMessage(error)
    })
  }
})

/**
 * @route POST /api/performance/queries/analyze
 * @desc Analyze query plan
 * @access Private (Admin)
 */
router.post('/queries/analyze', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { query, params } = req.body

    if (!query) {
      return res.status(400).json({ message: 'Query is required' })
    }

    const pool = connectionManager.getReadPool()
    const analysis = await queryPerformanceService.analyzeQueryPlan(pool, query, params)

    res.json(analysis)
  } catch (error: any) {
    console.error('Error analyzing query:', error)
    res.status(500).json({
      message: 'Failed to analyze query',
      error: getErrorMessage(error)
    })
  }
})

/**
 * @route DELETE /api/performance/queries/metrics
 * @desc Clear query metrics
 * @access Private (Admin)
 */
router.delete('/queries/metrics', authenticateJWT, (req: Request, res: Response) => {
  try {
    queryPerformanceService.clearMetrics()

    res.json({
      message: 'Query metrics cleared',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error clearing metrics:', error)
    res.status(500).json({
      message: 'Failed to clear metrics',
      error: getErrorMessage(error)
    })
  }
})

/**
 * @route GET /api/performance/workers/stats
 * @desc Get worker pool statistics
 * @access Private (Admin)
 */
router.get('/workers/stats', authenticateJWT, (req: Request, res: Response) => {
  try {
    const stats = workerPool.getStats()
    res.json(stats)
  } catch (error: any) {
    console.error('Error getting worker stats:', error)
    res.status(500).json({
      message: 'Failed to retrieve worker statistics',
      error: getErrorMessage(error)
    })
  }
})

/**
 * @route GET /api/performance/workers/info
 * @desc Get detailed worker information
 * @access Private (Admin)
 */
router.get('/workers/info', authenticateJWT, (req: Request, res: Response) => {
  try {
    const info = workerPool.getWorkerInfo()
    res.json({
      workers: info,
      count: info.length
    })
  } catch (error: any) {
    console.error('Error getting worker info:', error)
    res.status(500).json({
      message: 'Failed to retrieve worker information',
      error: getErrorMessage(error)
    })
  }
})

/**
 * @route GET /api/performance/memory
 * @desc Get memory usage statistics
 * @access Private (Admin)
 */
router.get('/memory', authenticateJWT, (req: Request, res: Response) => {
  try {
    const usage = process.memoryUsage()

    const memory = {
      rss: {
        bytes: usage.rss,
        mb: Math.round(usage.rss / 1024 / 1024),
        description: 'Resident Set Size - total memory allocated'
      },
      heapTotal: {
        bytes: usage.heapTotal,
        mb: Math.round(usage.heapTotal / 1024 / 1024),
        description: 'Total heap allocated'
      },
      heapUsed: {
        bytes: usage.heapUsed,
        mb: Math.round(usage.heapUsed / 1024 / 1024),
        description: 'Heap actually used'
      },
      external: {
        bytes: usage.external,
        mb: Math.round(usage.external / 1024 / 1024),
        description: 'Memory used by C++ objects'
      },
      arrayBuffers: {
        bytes: usage.arrayBuffers,
        mb: Math.round(usage.arrayBuffers / 1024 / 1024),
        description: 'Memory allocated for ArrayBuffers'
      },
      utilization: {
        heapPercentage: ((usage.heapUsed / usage.heapTotal) * 100).toFixed(2) + '%'
      },
      timestamp: new Date().toISOString()
    }

    res.json(memory)
  } catch (error: any) {
    console.error('Error getting memory stats:', error)
    res.status(500).json({
      message: 'Failed to retrieve memory statistics',
      error: getErrorMessage(error)
    })
  }
})

/**
 * @route POST /api/performance/gc
 * @desc Trigger garbage collection (if --expose-gc flag is set)
 * @access Private (Admin)
 */
router.post('/gc', authenticateJWT, (req: Request, res: Response) => {
  try {
    if (global.gc) {
      const before = process.memoryUsage()
      global.gc()
      const after = process.memoryUsage()

      res.json({
        message: 'Garbage collection triggered',
        before: {
          heapUsed: Math.round(before.heapUsed / 1024 / 1024) + 'MB'
        },
        after: {
          heapUsed: Math.round(after.heapUsed / 1024 / 1024) + 'MB'
        },
        freed: Math.round((before.heapUsed - after.heapUsed) / 1024 / 1024) + 'MB',
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(400).json({
        message: 'Garbage collection not available. Start Node with --expose-gc flag'
      })
    }
  } catch (error: any) {
    console.error('Error triggering GC:', error)
    res.status(500).json({
      message: 'Failed to trigger garbage collection',
      error: getErrorMessage(error)
    })
  }
})

export default router
