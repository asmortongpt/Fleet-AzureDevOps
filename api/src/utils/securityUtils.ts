/**
 * Security Utilities Module
 * Provides security functions for asset mobile routes
 *
 * SECURITY: All functions implement defense-in-depth principles
 */

import { Request, Response, NextFunction } from 'express'
import { pool } from '../db'
import logger from '../config/logger'

/**
 * Check if user has permission to perform an action on an asset
 * SECURITY: Always validates user belongs to tenant before checking permissions
 *
 * @param userId - The user ID to check
 * @param tenantId - The tenant ID the user belongs to
 * @param action - The action to check permission for (e.g., 'checkout', 'checkin')
 * @returns Promise<boolean> - true if user has permission, false otherwise
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
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @throws Error if coordinates are invalid
 */
export function validateGPS(lat: number, lng: number): void {
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
 * SECURITY: Removes potentially sensitive metadata (GPS, camera info, etc.)
 *
 * NOTE: This is a basic implementation. For production, consider using 'sharp' library
 * which provides more robust EXIF stripping.
 *
 * @param buffer - Image buffer to strip EXIF from
 * @returns Promise<Buffer> - Clean image buffer without EXIF data
 */
export async function stripEXIFData(buffer: Buffer): Promise<Buffer> {
  try {
    // Try to use piexifjs if available
    try {
      // Dynamic import to handle missing module gracefully
      const piexifjs = require('piexifjs')
      const dataUrl = `data:image/jpeg;base64,${buffer.toString('base64')}`
      const cleanDataUrl = piexifjs.remove(dataUrl)
      const base64Data = cleanDataUrl.replace(/^data:image\/jpeg;base64,/, '')
      const cleanBuffer = Buffer.from(base64Data, 'base64')
      logger.info('EXIF data stripped from image using piexifjs')
      return cleanBuffer
    } catch (piexifError) {
      // piexifjs not available or error - fall back to basic stripping
      logger.warn('piexifjs not available, using basic EXIF stripping')

      // Basic JPEG EXIF stripping - remove APP1 marker if present
      if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
        let offset = 2
        while (offset < buffer.length - 1) {
          // Check for APP1 marker (0xFFE1) which typically contains EXIF
          if (buffer[offset] === 0xFF && buffer[offset + 1] === 0xE1) {
            // Get segment length
            const segmentLength = buffer.readUInt16BE(offset + 2)
            // Remove this segment by creating new buffer without it
            const beforeSegment = buffer.slice(0, offset)
            const afterSegment = buffer.slice(offset + 2 + segmentLength)
            const cleanBuffer = Buffer.concat([beforeSegment, afterSegment])
            logger.info('EXIF APP1 marker removed from JPEG')
            return cleanBuffer
          }
          offset++
        }
      }

      // No EXIF found or not a JPEG, return original
      logger.info('No EXIF data found or not a JPEG, returning original buffer')
      return buffer
    }
  } catch (error) {
    logger.error('Error stripping EXIF data:', error)
    logger.warn('Returning original image due to EXIF stripping error')
    return buffer
  }
}

/**
 * Rate limiter middleware factory
 * SECURITY: Prevents abuse by limiting requests per IP address
 *
 * @param maxRequests - Maximum number of requests allowed in the time window
 * @param windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns Express middleware function
 */
export function rateLimiter(
  maxRequests: number,
  windowMs: number = 15 * 60 * 1000
) {
  const requestCounts = new Map<string, { count: number; resetTime: number }>()

  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || req.socket.remoteAddress || 'unknown'
    const now = Date.now()
    const requestData = requestCounts.get(identifier)

    if (!requestData || now > requestData.resetTime) {
      // First request or window expired, reset counter
      requestCounts.set(identifier, {
        count: 1,
        resetTime: now + windowMs
      })
      return next()
    }

    if (requestData.count >= maxRequests) {
      // Rate limit exceeded
      logger.warn(`Rate limit exceeded for ${identifier}`)
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${windowMs / 1000} seconds.`,
        retryAfter: Math.ceil((requestData.resetTime - now) / 1000)
      })
    }

    // Increment count and allow request
    requestData.count++
    next()
  }
}
