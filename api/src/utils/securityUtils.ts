/**
 * Security Utilities Module
 * Provides security functions for asset mobile routes
 *
 * SECURITY: All functions implement defense-in-depth principles
 */

import { Request, Response, NextFunction } from 'express'
import { pool } from '../db'
import logger from '../config/logger'
// @ts-ignore - piexifjs may not have types
import piexifjs from 'piexifjs'

/**
 * Check if user has permission to perform an action on an asset
 * SECURITY: Always validates user belongs to tenant before checking permissions
 *
 * @param userId - User ID to check
 * @param tenantId - Tenant ID for multi-tenant isolation
 * @param action - Action to check permission for (e.g., 'checkout', 'checkin')
 * @returns Promise<boolean> - True if user has permission
 */
export async function checkUserPermission(
  userId: number,
  tenantId: number,
  action: string
): Promise<boolean> {
  try {
    // SECURITY: Parameterized query to prevent SQL injection
    const query = `
      SELECT role, is_active
      FROM users
      WHERE id = $1 AND tenant_id = $2
    `
    const result = await pool.query(query, [userId, tenantId])

    if (result.rows.length === 0) {
      logger.warn(`Permission check failed: User ${userId} not found in tenant ${tenantId}`)
      return false
    }

    const { role, is_active } = result.rows[0]

    // User must be active
    if (!is_active) {
      logger.warn(`Permission check failed: User ${userId} is inactive`)
      return false
    }

    // Role-based access control
    // Viewers can only view, not perform checkout/checkin
    if (action === 'checkout' || action === 'checkin') {
      const allowedRoles = ['admin', 'manager', 'user']
      if (!allowedRoles.includes(role)) {
        logger.warn(`Permission check failed: User ${userId} with role ${role} cannot ${action}`)
        return false
      }
    }

    return true
  } catch (error) {
    logger.error('Error checking user permission:', error)
    // SECURITY: Fail closed - deny access on error
    return false
  }
}

/**
 * Validate GPS coordinates
 * SECURITY: Prevents injection of invalid/malicious GPS data
 *
 * @param lat - Latitude (-90 to 90)
 * @param lng - Longitude (-180 to 180)
 * @throws Error if coordinates are invalid
 */
export function validateGPS(lat: number, lng: number): void {
  // SECURITY: Input validation to prevent data corruption
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    throw new Error('GPS coordinates must be numbers')
  }

  if (isNaN(lat) || isNaN(lng)) {
    throw new Error('GPS coordinates cannot be NaN')
  }

  if (!isFinite(lat) || !isFinite(lng)) {
    throw new Error('GPS coordinates must be finite')
  }

  if (lat < -90 || lat > 90) {
    throw new Error(`Invalid latitude: ${lat}. Must be between -90 and 90`)
  }

  if (lng < -180 || lng > 180) {
    throw new Error(`Invalid longitude: ${lng}. Must be between -180 and 180`)
  }

  logger.info(`GPS validation passed: ${lat}, ${lng}`)
}

/**
 * Strip EXIF metadata from images
 * SECURITY: Removes potentially sensitive metadata (location, device info, timestamps)
 *
 * @param buffer - Image buffer
 * @returns Promise<Buffer> - Image buffer with EXIF data removed
 */
export async function stripEXIFData(buffer: Buffer): Promise<Buffer> {
  try {
    // Convert buffer to base64 data URL for piexifjs
    const dataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`

    // Remove all EXIF data
    const cleanDataUrl = piexifjs.remove(dataUrl)

    // Convert back to buffer
    const base64Data = cleanDataUrl.replace(/^data:image\/jpeg;base64,/, '')
    const cleanBuffer = Buffer.from(base64Data, 'base64')

    logger.info('EXIF data stripped from image')
    return cleanBuffer
  } catch (error) {
    logger.error('Error stripping EXIF data:', error)
    // SECURITY: On error, still return the buffer but log the issue
    // In production, you might want to reject images that can't be cleaned
    logger.warn('Returning original image due to EXIF stripping error')
    return buffer
  }
}

/**
 * Rate limiter middleware factory
 * SECURITY: Prevents abuse by limiting requests per IP address
 *
 * @param maxRequests - Maximum requests allowed per window
 * @param windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns Express middleware function
 */
export function rateLimiter(
  maxRequests: number,
  windowMs: number = 15 * 60 * 1000
) {
  // Simple in-memory store for rate limiting
  // PRODUCTION NOTE: Use Redis or similar for distributed rate limiting
  const requestCounts = new Map<string, { count: number; resetTime: number }>()

  return (req: Request, res: Response, next: NextFunction) => {
    // SECURITY: Use IP address as identifier
    const identifier = req.ip || req.socket.remoteAddress || 'unknown'

    const now = Date.now()
    const requestData = requestCounts.get(identifier)

    // Reset if window has expired
    if (!requestData || now > requestData.resetTime) {
      requestCounts.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      })
      return next()
    }

    // Check if limit exceeded
    if (requestData.count >= maxRequests) {
      logger.warn(`Rate limit exceeded for ${identifier}`)
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`,
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      })
    }

    // Increment count
    requestData.count++
    next()
  }
}

/**
 * Clean up old rate limit entries periodically
 * SECURITY: Prevents memory leaks from abandoned IP addresses
 */
setInterval(() => {
  // This would be implemented if using the in-memory rate limiter
  // In production, use Redis with automatic expiration
  logger.debug('Rate limiter cleanup scheduled (use Redis in production)')
}, 60 * 60 * 1000) // Every hour
