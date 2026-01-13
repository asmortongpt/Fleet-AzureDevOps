/**
 * Request ID Middleware
 *
 * Generates and tracks unique request IDs for distributed tracing and log correlation.
 * Supports both new ID generation and propagation of existing IDs from upstream services.
 *
 * Complies with:
 * - FedRAMP AU-3: Content of Audit Records
 * - SOC 2 CC7.2: System monitoring
 *
 * @module middleware/request-id
 */

import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

import logger from '../config/logger'

// Extend Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string
      startTime?: number
    }
  }
}

/**
 * Request ID configuration
 */
interface RequestIdConfig {
  /**
   * Header name to read/write request ID
   * @default 'X-Request-ID'
   */
  headerName?: string

  /**
   * Whether to set request ID in response headers
   * @default true
   */
  setResponseHeader?: boolean

  /**
   * Whether to generate new ID if not provided
   * @default true
   */
  generateIfMissing?: boolean

  /**
   * Validation function for request IDs
   */
  validator?: (id: string) => boolean
}

/**
 * Default UUID validator
 */
const defaultValidator = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Create request ID middleware
 */
export function requestIdMiddleware(config: RequestIdConfig = {}): (req: Request, res: Response, next: NextFunction) => void {
  const {
    headerName = 'X-Request-ID',
    setResponseHeader = true,
    generateIfMissing = true,
    validator = defaultValidator
  } = config

  return (req: Request, res: Response, next: NextFunction): void => {
    // Record request start time for performance tracking
    req.startTime = Date.now()

    // Try to get request ID from header
    let requestId = req.get(headerName)

    // Validate existing request ID
    if (requestId) {
      if (!validator(requestId)) {
        logger.warn('Invalid request ID format received', {
          requestId,
          headerName,
          ip: req.ip,
          path: req.path
        })
        requestId = undefined
      } else {
        logger.debug('Using existing request ID from upstream', {
          requestId,
          headerName
        })
      }
    }

    // Generate new ID if missing or invalid
    if (!requestId && generateIfMissing) {
      requestId = uuidv4()
      logger.debug('Generated new request ID', {
        requestId,
        path: req.path,
        method: req.method
      })
    }

    // Attach to request object
    if (requestId) {
      req.requestId = requestId

      // Set in response header
      if (setResponseHeader) {
        res.setHeader(headerName, requestId)
      }

      // Log incoming request with correlation ID
      logger.http('Incoming request', {
        requestId,
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: (req as any).user?.id,
        tenantId: (req as any).user?.tenant_id
      })
    }

    // Add request completion logging
    res.on('finish', () => {
      const duration = req.startTime ? Date.now() - req.startTime : 0

      logger.http('Request completed', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userId: (req as any).user?.id,
        tenantId: (req as any).user?.tenant_id
      })

      // Warn on slow requests
      if (duration > 3000) {
        logger.warn('Slow request detected', {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          duration,
          statusCode: res.statusCode
        })
      }
    })

    next()
  }
}

/**
 * Get request ID from request object
 */
export function getRequestId(req: Request): string | undefined {
  return req.requestId
}

/**
 * Child logger with request context
 *
 * Creates a child logger that automatically includes request ID
 * in all log entries for easy correlation.
 */
export function getRequestLogger(req: Request): typeof logger {
  const requestId = getRequestId(req)
  const userId = (req as any).user?.id
  const tenantId = (req as any).user?.tenant_id

  // Create a wrapper that adds request context to all log calls
  const contextLogger = {
    error: (message: string, meta?: any) => {
      logger.error(message, { requestId, userId, tenantId, ...meta })
    },
    warn: (message: string, meta?: any) => {
      logger.warn(message, { requestId, userId, tenantId, ...meta })
    },
    info: (message: string, meta?: any) => {
      logger.info(message, { requestId, userId, tenantId, ...meta })
    },
    http: (message: string, meta?: any) => {
      logger.http(message, { requestId, userId, tenantId, ...meta })
    },
    debug: (message: string, meta?: any) => {
      logger.debug(message, { requestId, userId, tenantId, ...meta })
    },
    log: (level: string, message: string, meta?: any) => {
      logger.log(level, message, { requestId, userId, tenantId, ...meta })
    }
  }

  return contextLogger as typeof logger
}

/**
 * Default export - ready-to-use middleware with default config
 */
export default requestIdMiddleware()
