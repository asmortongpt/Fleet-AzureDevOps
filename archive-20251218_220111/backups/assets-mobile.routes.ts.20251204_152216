import express from 'express'
import { container } from '../container'
import { asyncHandler } from '../middleware/error-handler'
import { NotFoundError, ValidationError } from '../errors/app-error'
import logger from '../config/logger' // Wave 33: Add Winston logger (FINAL WAVE!)
import multer from 'multer'
import { pool } from '../db'
import { verifyJWT } from '../middleware/authMiddleware'
import {
  checkUserPermission,
  validateGPS,
  stripEXIFData,
  rateLimiter,
} from '../utils/securityUtils'
import { Request, Response } from 'express'
import { z } from 'zod'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

// Schema for checkout/checkin request validation
const assetActionSchema = z.object({
  assetId: z.number(),
  userId: z.number(),
  tenantId: z.number(),
  gpsLat: z.number().min(-90).max(90),
  gpsLng: z.number().min(-180).max(180),
  conditionRating: z.number().min(1).max(5),
  digitalSignature: z.string(),
})

router.post(
  '/checkout',
  verifyJWT,
  rateLimiter(10),
  upload.single('photo'),
  async (req: Request, res: Response) => {
    try {
      const { assetId, userId, tenantId, gpsLat, gpsLng, conditionRating, digitalSignature } =
        assetActionSchema.parse(req.body)
      const photo = req.file

      if (!photo) {
        return res.status(400).send('Photo is required.')
      }

      const hasPermission = await checkUserPermission(userId, tenantId, 'checkout')
      if (!hasPermission) {
        return res.status(403).send('User does not have permission to checkout this asset.')
      }

      validateGPS(gpsLat, gpsLng)
      const cleanPhoto = await stripEXIFData(photo.buffer)

      const queryText = `
      INSERT INTO asset_checkout_history(asset_id, user_id, tenant_id, gps_lat, gps_lng, condition_rating, digital_signature, photo)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `
      const values = [
        assetId,
        userId,
        tenantId,
        gpsLat,
        gpsLng,
        conditionRating,
        digitalSignature,
        cleanPhoto,
      ]
      const { rows } = await pool.query(queryText, values)

      res.status(201).json(rows[0])
    } catch (error) {
      logger.error('Checkout Error:', error) // Wave 33: Winston logger (FINAL WAVE!);
      res.status(500).send('Internal server error during asset checkout.')
    }
  }
)

router.post(
  '/checkin',
  verifyJWT,
  rateLimiter(10),
  upload.single('photo'),
  async (req: Request, res: Response) => {
    try {
      const { assetId, userId, tenantId, gpsLat, gpsLng, conditionRating, digitalSignature } =
        assetActionSchema.parse(req.body)
      const photo = req.file

      if (!photo) {
        return res.status(400).send('Photo is required.')
      }

      const hasPermission = await checkUserPermission(userId, tenantId, 'checkin')
      if (!hasPermission) {
        return res.status(403).send('User does not have permission to checkin this asset.')
      }

      validateGPS(gpsLat, gpsLng)
      const cleanPhoto = await stripEXIFData(photo.buffer)

      const queryText = `
      INSERT INTO asset_checkin_history(asset_id, user_id, tenant_id, gps_lat, gps_lng, condition_rating, digital_signature, photo)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `
      const values = [
        assetId,
        userId,
        tenantId,
        gpsLat,
        gpsLng,
        conditionRating,
        digitalSignature,
        cleanPhoto,
      ]
      const { rows } = await pool.query(queryText, values)

      res.status(201).json(rows[0])
    } catch (error) {
      logger.error('Checkin Error:', error) // Wave 33: Winston logger (FINAL WAVE!);
      res.status(500).send('Internal server error during asset checkin.')
    }
  }
)

export default router
