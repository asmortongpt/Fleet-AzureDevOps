/**
 * Express type extensions
 */

import 'express'
import 'express-rate-limit'
import { Logger } from 'pino'

declare global {
  namespace Express {
    interface Request {
      // API Versioning
      apiVersion?: string

      // Rate limiting
      rateLimit?: {
        limit: number
        current: number
        remaining: number
        resetTime: Date
      }

      // Authentication
      user?: {
        id: string
        email: string
        username?: string
        role?: string // Legacy/Single role
        roles?: string[] // RBAC
        tenant_id?: string // Tenant context
        tenantId?: string  // Deprecated: use tenant_id
        permissions?: string[]
        name?: string
        sessionId?: string
        [key: string]: any // Allow extensibility for now
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

      // Dependency injection container
      container?: any

      // Logger instance
      log?: Logger
    }

    interface Response {
      // Custom response methods (if any)
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    apiVersion?: string
    rateLimit?: {
      limit: number
      current: number
      remaining: number
      resetTime: Date
    }
    user?: {
      id: string
      email: string
      username?: string
      role?: string
      roles?: string[]
      tenant_id?: string
      tenantId?: string
      permissions?: string[]
      name?: string
      sessionId?: string
      [key: string]: any
    }
    csrfToken?: () => string
    tenant?: {
      id: string
      name: string
    }
    id?: string
    requestId?: string
    rawBody?: Buffer
    container?: any
    log?: import('pino').Logger
  }
}
