import crypto from 'crypto'

import { Request, Response, NextFunction } from 'express'

import telemetryService from '../monitoring/applicationInsights'

/**
 * Extended request interface with telemetry tracking
 */
interface TelemetryRequest extends Request {
  telemetry?: {
    startTime: number
    correlationId: string
    userId?: string
  }
}

/**
 * Hash IP address for privacy
 */
function hashIpAddress(ip: string): string {
  return crypto.createHash('sha256').update(ip + 'fleet-salt').digest('hex').substring(0, 16)
}

/**
 * Get client IP address
 */
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.socket.remoteAddress || 'unknown'
}

/**
 * Telemetry middleware to track all requests
 */
export function telemetryMiddleware(req: TelemetryRequest, res: Response, next: NextFunction): void {
  // Skip telemetry for health checks and metrics endpoints
  if (req.path === '/health' || req.path === '/metrics' || req.path === '/favicon.ico') {
    return next()
  }

  // Initialize telemetry data
  req.telemetry = {
    startTime: Date.now(),
    correlationId: crypto.randomUUID(),
    userId: (req as any).user?.id
  }

  // Track request start
  const requestProperties = {
    method: req.method,
    path: req.path,
    correlationId: req.telemetry.correlationId,
    userAgent: req.headers['user-agent'] || 'unknown',
    hashedIp: hashIpAddress(getClientIp(req)),
    queryParams: Object.keys(req.query).length > 0 ? Object.keys(req.query).join(',') : 'none',
    contentType: req.headers['content-type'] || 'none',
    acceptLanguage: req.headers['accept-language'] || 'unknown',
    environment: process.env.NODE_ENV || 'development'
  }

  // Log request start (for debugging)
  // SECURITY FIX (P0): Sanitize request details to prevent log injection (CWE-117)
  // Fingerprint: d8e4f2a7c9b3d6e8
  if (process.env.NODE_ENV === 'development') {
    const { sanitizeForLog } = require('../utils/logSanitizer')
    console.log('📊 Request started', {
      correlationId: req.telemetry.correlationId,
      method: req.method,
      path: sanitizeForLog(req.path, 100)
    })
  }

  // Override res.end to capture response metrics
  const originalEnd = res.end
  res.end = function(...args: any[]): Response {
    // Calculate request duration
    const duration = Date.now() - req.telemetry!.startTime

    // Track API call metrics
    telemetryService.trackAPICall(req.path, duration, res.statusCode)

    // Track detailed request telemetry
    const responseProperties = {
      ...requestProperties,
      statusCode: res.statusCode,
      duration,
      success: res.statusCode >= 200 && res.statusCode < 400,
      contentLength: res.get('content-length') || 0,
      cacheStatus: res.get('x-cache-status') || 'none'
    }

    // Track custom event for request completion
    telemetryService.trackEvent('APIRequest', responseProperties)

    // Track errors specifically
    if (res.statusCode >= 400) {
      const errorContext = {
        ...responseProperties,
        errorCode: res.statusCode,
        errorMessage: res.statusMessage || 'Unknown error'
      }

      // For 5xx errors, track as exceptions
      if (res.statusCode >= 500) {
        telemetryService.trackError(
          new Error(`Server Error: ${res.statusCode} on ${req.method} ${req.path}`),
          errorContext
        )
      } else {
        // For 4xx errors, track as events
        telemetryService.trackEvent('ClientError', errorContext)
      }
    }

    // Track slow requests
    if (duration > 1000) {
      telemetryService.trackEvent('SlowAPIRequest', {
        ...responseProperties,
        threshold: 1000,
        exceeded: duration - 1000
      })
    }

    // Track specific endpoints
    trackEndpointSpecificMetrics(req, res, duration)

    // Log completion (for debugging)
    if (process.env.NODE_ENV === 'development') {
      const statusEmoji = res.statusCode >= 500 ? '❌' :
                         res.statusCode >= 400 ? '⚠️' :
                         res.statusCode >= 300 ? '↪️' :
                         '✅'
      console.log(`${statusEmoji} [${req.telemetry!.correlationId}] ${res.statusCode} in ${duration}ms`)
    }

    // Call original end
    return originalEnd.apply(res, args)
  }

  next()
}

/**
 * Track endpoint-specific metrics
 */
function trackEndpointSpecificMetrics(req: TelemetryRequest, res: Response, duration: number): void {
  const path = req.path.toLowerCase()

  // Track vehicle operations
  if (path.includes('/vehicles')) {
    telemetryService.trackEvent('VehicleOperation', {
      operation: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration
    })
  }

  // Track driver operations
  if (path.includes('/drivers')) {
    telemetryService.trackEvent('DriverOperation', {
      operation: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration
    })
  }

  // Track maintenance operations
  if (path.includes('/maintenance')) {
    telemetryService.trackEvent('MaintenanceOperation', {
      operation: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration
    })
  }

  // Track fuel transactions
  if (path.includes('/fuel')) {
    telemetryService.trackEvent('FuelTransaction', {
      operation: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration
    })
  }

  // Track authentication
  if (path.includes('/auth')) {
    telemetryService.trackEvent('AuthenticationAttempt', {
      operation: req.method,
      path: req.path,
      statusCode: res.statusCode,
      success: res.statusCode === 200
    })
  }

  // Track file uploads
  if (req.method === 'POST' && (req.headers['content-type']?.includes('multipart') || path.includes('/upload'))) {
    telemetryService.trackEvent('FileUpload', {
      path: req.path,
      statusCode: res.statusCode,
      duration,
      contentLength: req.headers['content-length'] || 0
    })
  }

  // Track search operations
  if (req.method === 'GET' && req.query.search) {
    telemetryService.trackEvent('SearchOperation', {
      path: req.path,
      searchTerm: typeof req.query.search === 'string' ? req.query.search.substring(0, 50) : 'complex',
      statusCode: res.statusCode,
      duration
    })
  }

  // Track pagination
  if (req.query.page || req.query.limit) {
    telemetryService.trackEvent('PaginatedRequest', {
      path: req.path,
      page: req.query.page || 1,
      limit: req.query.limit || 'default',
      statusCode: res.statusCode,
      duration
    })
  }
}

/**
 * Error telemetry middleware
 */
export function errorTelemetryMiddleware(err: Error, req: Request, res: Response, next: NextFunction): void {
  // Track the error
  telemetryService.trackError(err, {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode || 500,
    userId: (req as any).user?.id,
    correlationId: (req as TelemetryRequest).telemetry?.correlationId
  })

  // Pass to next error handler
  next(err)
}

/**
 * Performance monitoring middleware
 */
export function performanceMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Track memory usage periodically
  const memUsage = process.memoryUsage()
  telemetryService.trackEvent('MemoryUsage', {
    rss: Math.round(memUsage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
    external: Math.round(memUsage.external / 1024 / 1024), // MB
    arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024) // MB
  })

  next()
}