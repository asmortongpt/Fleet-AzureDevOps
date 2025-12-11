Here's the complete refactored version of the `assets-mobile.routes.ts` file, with all `pool.query` calls replaced by repository methods:


import express from 'express';
import { Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import logger from '../config/logger';
import { authenticateJWT } from '../middleware/auth';
import { csrfProtection } from '../middleware/csrf';
import { AssetRepository } from '../repositories/AssetRepository';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Schema for checkout/checkin request validation
const assetActionSchema = z.object({
  assetId: z.number(),
  userId: z.number(),
  tenantId: z.number(),
  gpsLat: z.number().min(-90).max(90),
  gpsLng: z.number().min(-180).max(180),
  conditionRating: z.number().min(1).max(5),
  digitalSignature: z.string(),
});

// Initialize the repository
const assetRepository = new AssetRepository();

router.post(
  '/checkout',
  csrfProtection,
  authenticateJWT,
  upload.single('photo'),
  async (req: Request, res: Response) => {
    try {
      const { assetId, userId, tenantId, gpsLat, gpsLng, conditionRating, digitalSignature } =
        assetActionSchema.parse(req.body);
      const photo = req.file;

      if (!photo) {
        return res.status(400).send('Photo is required.');
      }

      const result = await assetRepository.checkoutAsset(
        assetId,
        userId,
        tenantId,
        gpsLat,
        gpsLng,
        conditionRating,
        digitalSignature,
        photo.buffer
      );

      res.status(201).json(result);
    } catch (error) {
      logger.error('Checkout Error:', error);
      res.status(500).send('Internal server error during asset checkout.');
    }
  }
);

router.post(
  '/checkin',
  csrfProtection,
  authenticateJWT,
  upload.single('photo'),
  async (req: Request, res: Response) => {
    try {
      const { assetId, userId, tenantId, gpsLat, gpsLng, conditionRating, digitalSignature } =
        assetActionSchema.parse(req.body);
      const photo = req.file;

      if (!photo) {
        return res.status(400).send('Photo is required.');
      }

      const result = await assetRepository.checkinAsset(
        assetId,
        userId,
        tenantId,
        gpsLat,
        gpsLng,
        conditionRating,
        digitalSignature,
        photo.buffer
      );

      res.status(201).json(result);
    } catch (error) {
      logger.error('Checkin Error:', error);
      res.status(500).send('Internal server error during asset checkin.');
    }
  }
);

export default router;


This refactored version of `assets-mobile.routes.ts` uses the `AssetRepository` class to handle database operations. The `pool.query` calls have been replaced with calls to the repository methods `checkoutAsset` and `checkinAsset`.

To complete the refactoring, you should create the `AssetRepository` class in a separate file, as mentioned in the previous response. Here's the implementation of the `AssetRepository` class that should be placed in `repositories/AssetRepository.ts`:


// repositories/AssetRepository.ts

import { pool } from '../db';

export class AssetRepository {
  async checkoutAsset(
    assetId: number,
    userId: number,
    tenantId: number,
    gpsLat: number,
    gpsLng: number,
    conditionRating: number,
    digitalSignature: string,
    photo: Buffer
  ) {
    const queryText = `
      INSERT INTO asset_checkout_history(asset_id, user_id, tenant_id, gps_lat, gps_lng, condition_rating, digital_signature, photo)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      assetId,
      userId,
      tenantId,
      gpsLat,
      gpsLng,
      conditionRating,
      digitalSignature,
      photo,
    ];
    const { rows } = await pool.query(queryText, values);
    return rows[0];
  }

  async checkinAsset(
    assetId: number,
    userId: number,
    tenantId: number,
    gpsLat: number,
    gpsLng: number,
    conditionRating: number,
    digitalSignature: string,
    photo: Buffer
  ) {
    const queryText = `
      INSERT INTO asset_checkin_history(asset_id, user_id, tenant_id, gps_lat, gps_lng, condition_rating, digital_signature, photo)
      VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [
      assetId,
      userId,
      tenantId,
      gpsLat,
      gpsLng,
      conditionRating,
      digitalSignature,
      photo,
    ];
    const { rows } = await pool.query(queryText, values);
    return rows[0];
  }
}


This implementation of the `AssetRepository` class encapsulates the database operations for asset checkout and checkin, using the `pool.query` method internally. The routes in `assets-mobile.routes.ts` now use these repository methods, improving the separation of concerns and making the code more maintainable and testable.