/**
 * Enterprise-grade Authentication Service
 * JWT-based authentication with role-based access control (RBAC)
 * Includes rate limiting, password policies, session management
 */

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Request, Response, NextFunction } from 'express'

// Types
export interface User {
  id: string
  email: string
  username: string
  password: string
  roles: Role[]
  permissions: Permission[]
  isActive: boolean
  isEmailVerified: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
  profile: UserProfile
  preferences: UserPreferences
  securitySettings: SecuritySettings
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  isSystem: boolean
  createdAt: Date
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  description: string
  createdAt: Date
}

export interface UserProfile {
  firstName: string
  lastName: string
  avatar?: string
  company?: string
  title?: string
  timezone: string
  locale: string
}

export interface UserPreferences {
  webglQuality: 'auto' | 'low' | 'medium' | 'high'
  enableAnalytics: boolean
  emailNotifications: boolean
  darkMode: boolean
  language: string
}

export interface SecuritySettings {
  twoFactorEnabled: boolean
  allowedIPs?: string[]
  sessionTimeout: number
  passwordExpiresAt?: Date
  loginAttempts: number
  lockedUntil?: Date
}

export interface AuthToken {
  accessToken: string
  refreshToken: string
  expiresIn: number
  tokenType: 'Bearer'
  scope: string[]
}

export interface JWTPayload {
  userId: string
  email: string
  username: string
  roles: string[]
  permissions: string[]
  sessionId: string
  iat: number
  exp: number
  iss: string
  aud: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
  twoFactorCode?: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
  company?: string
  title?: string
  acceptTerms: boolean
}

// Constants
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key'
const ACCESS_TOKEN_EXPIRY = '15m'
const REFRESH_TOKEN_EXPIRY = '7d'
const PASSWORD_SALT_ROUNDS = 12
const MAX_LOGIN_ATTEMPTS = 5
const LOCKOUT_TIME = 30 * 60 * 1000 // 30 minutes

// Default roles and permissions
const DEFAULT_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  GUEST: 'guest'
}

const DEFAULT_PERMISSIONS = {
  // User management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Vehicle management
  VEHICLE_CREATE: 'vehicle:create',
  VEHICLE_READ: 'vehicle:read',
  VEHICLE_UPDATE: 'vehicle:update',
  VEHICLE_DELETE: 'vehicle:delete',

  // System management
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_MONITOR: 'system:monitor',
  SYSTEM_CONFIG: 'system:config',

  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',

  // Advanced features
  WEBGL_ADVANCED: 'webgl:advanced',
  API_UNLIMITED: 'api:unlimited'
}

export class AuthService {
  private static instance: AuthService
  private activeSessions: Map<string, { userId: string; expiresAt: Date }> = new Map()
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map()

  private constructor() {
    // Initialize rate limit cleanup
    setInterval(() => this.cleanupRateLimit(), 5 * 60 * 1000) // Every 5 minutes
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  // Password utilities
  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, PASSWORD_SALT_ROUNDS)
  }

  public async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  public validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (password.length > 128) {
      errors.push('Password must not exceed 128 characters')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      errors.push('Password must contain at least one special character')
    }

    // Check for common passwords
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein']
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // JWT token management
  public generateAccessToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      username: user.username,
      roles: user.roles.map(role => role.name),
      permissions: user.permissions.map(perm => perm.name),
      sessionId: crypto.randomUUID(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
      iss: 'fleet-showroom-api',
      aud: 'fleet-showroom-client'
    }

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      algorithm: 'HS256'
    })

    // Store session
    this.activeSessions.set(payload.sessionId, {
      userId: user.id,
      expiresAt: new Date(payload.exp * 1000)
    })

    return token
  }

  public generateRefreshToken(userId: string): string {
    const payload = {
      userId,
      type: 'refresh',
      sessionId: crypto.randomUUID(),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }

    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: 'HS256'
    })
  }

  public verifyAccessToken(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as JWTPayload

      // Check if session is still active
      const session = this.activeSessions.get(payload.sessionId)
      if (!session || session.expiresAt < new Date()) {
        this.activeSessions.delete(payload.sessionId)
        return null
      }

      return payload
    } catch (error) {
      return null
    }
  }

  public verifyRefreshToken(token: string): { userId: string; sessionId: string } | null {
    try {
      const payload = jwt.verify(token, JWT_REFRESH_SECRET) as any
      return {
        userId: payload.userId,
        sessionId: payload.sessionId
      }
    } catch (error) {
      return null
    }
  }

  // Rate limiting
  public checkRateLimit(identifier: string, maxRequests = 10, windowMs = 15 * 60 * 1000): boolean {
    const now = Date.now()
    const record = this.rateLimitMap.get(identifier)

    if (!record || record.resetTime <= now) {
      this.rateLimitMap.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      })
      return true
    }

    if (record.count >= maxRequests) {
      return false
    }

    record.count++
    return true
  }

  private cleanupRateLimit(): void {
    const now = Date.now()
    for (const [key, record] of this.rateLimitMap.entries()) {
      if (record.resetTime <= now) {
        this.rateLimitMap.delete(key)
      }
    }
  }

  // Session management
  public invalidateSession(sessionId: string): void {
    this.activeSessions.delete(sessionId)
  }

  public invalidateAllUserSessions(userId: string): void {
    for (const [sessionId, session] of this.activeSessions.entries()) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId)
      }
    }
  }

  public getActiveSessionCount(userId: string): number {
    let count = 0
    for (const session of this.activeSessions.values()) {
      if (session.userId === userId) {
        count++
      }
    }
    return count
  }

  // Permission checking
  public hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    return userPermissions.includes(requiredPermission) ||
           userPermissions.includes(DEFAULT_PERMISSIONS.SYSTEM_ADMIN)
  }

  public hasRole(userRoles: string[], requiredRole: string): boolean {
    return userRoles.includes(requiredRole) ||
           userRoles.includes(DEFAULT_ROLES.SUPER_ADMIN)
  }

  public hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(perm => this.hasPermission(userPermissions, perm))
  }

  public hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(perm => this.hasPermission(userPermissions, perm))
  }

  // Audit logging
  public logAuthEvent(
    userId: string | null,
    action: string,
    success: boolean,
    metadata: Record<string, any> = {},
    request?: Request
  ): void {
    const event = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      success,
      ip: request?.ip,
      userAgent: request?.get('User-Agent'),
      metadata
    }

    // In production, this would be sent to a logging service
    console.log('AUTH_EVENT:', JSON.stringify(event, null, 2))
  }
}

// Middleware functions
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    res.status(401).json({ error: 'Access token required' })
    return
  }

  const authService = AuthService.getInstance()
  const payload = authService.verifyAccessToken(token)

  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' })
    return
  }

  // Add user info to request
  req.user = {
    id: payload.userId,
    email: payload.email,
    username: payload.username,
    roles: payload.roles,
    permissions: payload.permissions,
    sessionId: payload.sessionId
  }

  next()
}

export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const authService = AuthService.getInstance()
    if (!authService.hasPermission(req.user.permissions, permission)) {
      authService.logAuthEvent(
        req.user.id,
        'PERMISSION_DENIED',
        false,
        { requiredPermission: permission, userPermissions: req.user.permissions },
        req
      )
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    next()
  }
}

export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const authService = AuthService.getInstance()
    if (!authService.hasRole(req.user.roles, role)) {
      authService.logAuthEvent(
        req.user.id,
        'ROLE_DENIED',
        false,
        { requiredRole: role, userRoles: req.user.roles },
        req
      )
      res.status(403).json({ error: 'Insufficient role level' })
      return
    }

    next()
  }
}

export const rateLimitAuth = (maxRequests = 5, windowMs = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const identifier = req.ip || 'unknown'
    const authService = AuthService.getInstance()

    if (!authService.checkRateLimit(`auth:${identifier}`, maxRequests, windowMs)) {
      res.status(429).json({
        error: 'Too many authentication attempts',
        retryAfter: Math.ceil(windowMs / 1000)
      })
      return
    }

    next()
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        username: string
        roles: string[]
        permissions: string[]
        sessionId: string
      }
    }
  }
}

export default AuthService.getInstance()
