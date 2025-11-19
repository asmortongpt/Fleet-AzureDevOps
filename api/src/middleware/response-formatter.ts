/**
 * API Response Formatter Middleware
 *
 * Standardizes all API responses with:
 * - Consistent response structure
 * - Pagination metadata
 * - HATEOAS links
 * - Response time tracking
 * - ETags for caching
 * - Compression support
 *
 * @module middleware/response-formatter
 */

import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'

/**
 * Standard API response structure
 */
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
  meta?: {
    timestamp: string
    requestId: string
    version: string
    duration?: number
  }
  pagination?: PaginationMeta
  links?: HATEOASLinks
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

/**
 * HATEOAS links
 */
export interface HATEOASLinks {
  self: string
  first?: string
  last?: string
  next?: string
  prev?: string
  related?: Record<string, string>
}

/**
 * Response formatter helper
 */
export class ResponseFormatter {
  /**
   * Format success response
   */
  static success<T>(
    data: T,
    meta?: Partial<APIResponse['meta']>,
    pagination?: PaginationMeta,
    links?: HATEOASLinks
  ): APIResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: meta?.requestId || 'unknown',
        version: meta?.version || '1.0',
        ...meta
      },
      ...(pagination && { pagination }),
      ...(links && { links })
    }
  }

  /**
   * Format error response
   */
  static error(
    message: string,
    code?: string,
    details?: any,
    meta?: Partial<APIResponse['meta']>
  ): APIResponse {
    return {
      success: false,
      error: {
        message,
        code,
        details
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: meta?.requestId || 'unknown',
        version: meta?.version || '1.0',
        ...meta
      }
    }
  }

  /**
   * Generate pagination metadata
   */
  static pagination(
    page: number,
    limit: number,
    total: number
  ): PaginationMeta {
    const totalPages = Math.ceil(total / limit)

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }

  /**
   * Generate HATEOAS links
   */
  static links(
    baseUrl: string,
    page: number,
    limit: number,
    total: number,
    queryParams: Record<string, any> = {}
  ): HATEOASLinks {
    const totalPages = Math.ceil(total / limit)
    const buildUrl = (p: number) => {
      const params = new URLSearchParams({
        ...queryParams,
        page: p.toString(),
        limit: limit.toString()
      })
      return `${baseUrl}?${params.toString()}`
    }

    const links: HATEOASLinks = {
      self: buildUrl(page),
      first: buildUrl(1),
      last: buildUrl(totalPages)
    }

    if (page < totalPages) {
      links.next = buildUrl(page + 1)
    }

    if (page > 1) {
      links.prev = buildUrl(page - 1)
    }

    return links
  }
}

/**
 * Middleware to enhance response object with helper methods
 *
 * Usage:
 * ```typescript
 * app.use(responseEnhancer())
 *
 * // In route handler:
 * router.get('/vehicles', (req, res) => {
 *   const vehicles = await getVehicles()
 *   res.success(vehicles, { page: 1, limit: 50, total: 100 })
 * })
 * ```
 */
export function responseEnhancer() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now()
    const requestId = (req.headers['x-request-id'] as string) ||
                     `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Add request ID to response headers
    res.setHeader('X-Request-ID', requestId)

    /**
     * Send success response with data
     */
    res.success = function<T>(
      data: T,
      paginationOrLinks?: {
        page?: number
        limit?: number
        total?: number
      } | HATEOASLinks
    ) {
      const duration = Date.now() - startTime

      let pagination: PaginationMeta | undefined
      let links: HATEOASLinks | undefined

      // Determine if pagination or links were provided
      if (paginationOrLinks) {
        if ('page' in paginationOrLinks && 'limit' in paginationOrLinks && 'total' in paginationOrLinks) {
          const { page, limit, total } = paginationOrLinks
          pagination = ResponseFormatter.pagination(page, limit, total)
          links = ResponseFormatter.links(
            `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`,
            page,
            limit,
            total,
            req.query
          )
        } else {
          links = paginationOrLinks as HATEOASLinks
        }
      }

      const response = ResponseFormatter.success(
        data,
        {
          requestId,
          version: '1.0',
          duration
        },
        pagination,
        links
      )

      // Generate ETag for caching
      const etag = generateETag(response)
      res.setHeader('ETag', etag)

      // Check if client has cached version
      if (req.headers['if-none-match'] === etag) {
        return res.status(304).end()
      }

      return res.json(response)
    }

    /**
     * Send created response (201)
     */
    res.created = function<T>(data: T, location?: string) {
      const duration = Date.now() - startTime

      if (location) {
        res.setHeader('Location', location)
      }

      const response = ResponseFormatter.success(data, {
        requestId,
        version: '1.0',
        duration
      })

      return res.status(201).json(response)
    }

    /**
     * Send no content response (204)
     */
    res.noContent = function() {
      return res.status(204).end()
    }

    /**
     * Send error response (kept for compatibility, but error handler is preferred)
     */
    res.error = function(message: string, statusCode: number = 500, code?: string, details?: any) {
      const duration = Date.now() - startTime

      const response = ResponseFormatter.error(message, code, details, {
        requestId,
        version: '1.0',
        duration
      })

      return res.status(statusCode).json(response)
    }

    next()
  }
}

/**
 * Generate ETag from response data
 */
function generateETag(data: any): string {
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(data))
    .digest('hex')
  return `"${hash}"`
}

/**
 * Extend Express Response interface
 */
declare global {
  namespace Express {
    interface Response {
      success<T>(data: T, pagination?: {
        page: number
        limit: number
        total: number
      } | HATEOASLinks): Response
      created<T>(data: T, location?: string): Response
      noContent(): Response
      error(message: string, statusCode?: number, code?: string, details?: any): Response
    }
  }
}

/**
 * Helper to build pagination info from query params
 */
export function getPaginationParams(query: any): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 50))
  const offset = (page - 1) * limit

  return { page, limit, offset }
}

/**
 * Helper to build sort parameters
 */
export function getSortParams(query: any, allowedFields: string[], defaultField: string = 'created_at'): {
  sortBy: string
  sortOrder: 'ASC' | 'DESC'
} {
  const sortBy = allowedFields.includes(query.sort) ? query.sort : defaultField
  const sortOrder = query.order?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

  return { sortBy, sortOrder }
}

/**
 * Middleware to add cache control headers
 */
export function cacheControl(maxAge: number = 3600, options: {
  private?: boolean
  mustRevalidate?: boolean
  noStore?: boolean
} = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next()
    }

    const directives: string[] = []

    if (options.noStore) {
      directives.push('no-store')
    } else {
      directives.push(options.private ? 'private' : 'public')
      directives.push(`max-age=${maxAge}`)

      if (options.mustRevalidate) {
        directives.push('must-revalidate')
      }
    }

    res.setHeader('Cache-Control', directives.join(', '))
    next()
  }
}

/**
 * No cache middleware (for sensitive endpoints)
 */
export function noCache() {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Expires', '0')
    next()
  }
}
