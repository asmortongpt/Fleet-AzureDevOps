/**
 * Express type extensions
 */

import 'express'
import 'express-rate-limit'

declare global {
  namespace Express {
    interface Request {
      // Rate limiting
      rateLimit?: {
        limit: number
        current: number
        remaining: number
        resetTime?: Date
      }

      // Authentication
      user?: {
        id: string
        email: string
        role: string
        tenant_id: string
        name?: string
        tenantId?: string  // Deprecated: use tenant_id
        permissions?: string[]
      }

      // CSRF token
      csrfToken?: () => string

      // Tenant context
      tenant?: {
        id: string
        name: string
      }

      // Request ID for tracing
      id?: string
      requestId?: string

      // File upload
      file?: Express.Multer.File
      files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] }

      // Session data
      session?: any

      // Raw body for webhooks
      rawBody?: Buffer
    }

    interface Response {
      // Custom response methods (if any)
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    rateLimit?: {
      limit: number
      current: number
      remaining: number
      resetTime?: Date
    }
    user?: {
      id: string
      email: string
      role: string
      tenant_id: string
      name?: string
      tenantId?: string  // Deprecated: use tenant_id
      permissions?: string[]
    }
    csrfToken?: () => string
    tenant?: {
      id: string
      name: string
    }
    id?: string
    requestId?: string
    rawBody?: Buffer
  }
}
