import { Request, Response, NextFunction } from 'express';
import { pool } from '../db';
import rateLimit from 'express-rate-limit';

export async function checkUserPermission(
  userId: number,
  resource: string,
  action: string
): Promise<boolean> {
  const result = await pool.query(
    `SELECT * FROM permissions
     WHERE user_id = $1 AND resource = $2 AND action = $3`,
    [userId, resource, action]
  );
  return result.rows.length > 0;
}

export function validateGPS(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function stripEXIFData(buffer: Buffer): Buffer {
  // Basic EXIF stripping - remove first 2 bytes if JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    return buffer.slice(2);
  }
  return buffer;
}

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP'
});
