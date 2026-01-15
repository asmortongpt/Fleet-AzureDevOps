/**
 * Security Utilities Module
 * Provides security functions for asset mobile routes
 *
 * SECURITY: All functions implement defense-in-depth principles
 */

import { Request, Response, NextFunction } from 'express'
import sharp from 'sharp'

import logger from '../config/logger'
import { pool } from '../db'

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
 * Strip EXIF metadata from images using sharp library
 * SECURITY: Removes ALL potentially sensitive metadata including:
 * - GPS coordinates (latitude, longitude, altitude)
 * - Camera serial numbers and device information
 * - EXIF, IPTC, and XMP metadata
 * - Timestamps and software information
 *
 * SECURITY FIX: Previous implementation only removed 2 bytes using basic method,
 * allowing GPS data, camera serial numbers, and other sensitive info to leak.
 * This implementation uses sharp.rotate() which strips ALL metadata by default.
 *
 * Supported formats: JPEG, PNG, WEBP, TIFF, GIF, SVG
 *
 * @param buffer - Image buffer to strip EXIF from
 * @returns Promise<Buffer> - Clean image buffer without ANY metadata
 * @throws Error if stripping fails (SECURITY: fail closed, not open)
 */
export async function stripEXIFData(buffer: Buffer): Promise<Buffer> {
  try {
    // SECURITY: Use sharp.rotate() which strips ALL metadata by default
    // rotate() with no angle parameter performs a no-op rotation that removes:
    // - EXIF (GPS, camera info, timestamps)
    // - IPTC (copyright, keywords)
    // - XMP (Adobe metadata)
    // This is more secure than withMetadata(false) which can miss some fields
    const cleanBuffer = await sharp(buffer)
      .rotate() // Strips ALL metadata including EXIF, IPTC, XMP
      .toBuffer()

    logger.info('EXIF/IPTC/XMP metadata stripped from image using sharp', {
      originalSize: buffer.length,
      cleanSize: cleanBuffer.length,
      bytesRemoved: buffer.length - cleanBuffer.length
    })

    return cleanBuffer
  } catch (error) {
    // SECURITY: Fail closed - throw error rather than returning original buffer
    // This ensures sensitive metadata is NEVER accidentally leaked
    logger.error('SECURITY: Failed to strip EXIF data from image', {
      error: error instanceof Error ? error.message : String(error),
      bufferSize: buffer.length
    })
    throw new Error('Failed to strip EXIF data from image - operation aborted for security')
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
