/**
 * Express type extensions
 *
 * Canonical type augmentation for Express Request/Response.
 * All properties set by middleware (auth, request-id, CSRF, etc.) are declared here.
 *
 * DO NOT declare `global { namespace Express { ... } }` in other files.
 * Add new properties to this file instead.
 */

import 'express'
import 'express-rate-limit'
import { Logger } from 'pino'
import { PoolClient } from 'pg'

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

      // Authentication - union of all middleware payload shapes
      user?: {
        // Core identity (always present after auth)
        id: string | number
        email: string

        // Display name
        name?: string
        username?: string

        // Role / RBAC
        role?: string
        roles?: string[]
        permissions?: string[]

        // Tenant context
        tenant_id?: string
        tenantId?: string  // Alias for compatibility

        // Scope-based access control (from users table)
        scope_level?: string
        team_driver_ids?: string[]
        team_vehicle_ids?: string[]

        // Session management
        sessionId?: string | number
        sessionUuid?: string

        // Compatibility aliases (set by auth.ts middleware)
        userId?: string | number
        userUuid?: string
        org_id?: string

        // Azure AD token flag
        azureAD?: boolean

        // JWT standard claims (set by AuthenticationService / TokenPayload)
        iat?: number
        exp?: number
        iss?: string
        aud?: string
        jti?: string

        // Allow extensibility for additional claims
        [key: string]: any
      }

      // CSRF token
      csrfToken?: () => string

      // Tenant context (separate from user.tenant_id for middleware injection)
      tenant?: {
        id: string
        name: string
      }
      tenantId?: string

      // Request ID for tracing (set by request-id middleware)
      id?: string
      requestId?: string

      // Request timing (set by request-id middleware)
      startTime?: number

      // File upload (Multer)
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

      // Database client (attached by auth middleware for transactional requests)
      dbClient?: PoolClient

      // Device fingerprint (set by auth.middleware.ts)
      deviceFingerprint?: string
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
      id: string | number
      email: string
      name?: string
      username?: string
      role?: string
      roles?: string[]
      permissions?: string[]
      tenant_id?: string
      tenantId?: string
      scope_level?: string
      team_driver_ids?: string[]
      team_vehicle_ids?: string[]
      sessionId?: string | number
      sessionUuid?: string
      userId?: string | number
      userUuid?: string
      org_id?: string
      azureAD?: boolean
      iat?: number
      exp?: number
      iss?: string
      aud?: string
      jti?: string
      [key: string]: any
    }
    csrfToken?: () => string
    tenant?: {
      id: string
      name: string
    }
    tenantId?: string
    id?: string
    requestId?: string
    startTime?: number
    rawBody?: Buffer
    container?: any
    log?: import('pino').Logger
    dbClient?: import('pg').PoolClient
    deviceFingerprint?: string
  }
}
